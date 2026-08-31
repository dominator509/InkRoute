import { inkrouteDemoTenant } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { interpretStripeWebhook, verifyStripeWebhookSignature } from "@inkroute/payments";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";
import { buildStripeWebhookRouteContract } from "../../../../lib/stripeWebhook";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

type StripeTenantResolution = { tenantId: string; tenantSlug: string; source: "database" | "local-demo" };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function providerSelectorFingerprint(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

function buildSafeStripeWebhookInterpretationResponse(interpretation: ReturnType<typeof interpretStripeWebhook>) {
  return {
    eventType: interpretation.eventType,
    action: interpretation.action,
    targetStatus: interpretation.targetStatus,
    shouldTriggerBookingTransition: interpretation.shouldTriggerBookingTransition,
    recommendedBookingStatus: interpretation.recommendedBookingStatus,
    note: interpretation.note,
    responseProjection: {
      rawInterpretationEchoed: false,
      rawProviderEventIdEchoed: false,
      rawProviderPayloadEchoed: false,
    },
  };
}

function buildSafeStripeWebhookContractResponse(webhookContract: ReturnType<typeof buildStripeWebhookRouteContract>) {
  return {
    reconciliation: {
      eventReceived: Boolean(webhookContract.reconciliation.eventId),
      eventIdEchoed: false,
      action: webhookContract.reconciliation.action,
      targetStatus: webhookContract.reconciliation.targetStatus,
      rawIdempotencyKeyEchoed: false,
      shouldPersistAuditLog: webhookContract.reconciliation.shouldPersistAuditLog,
      shouldReconcile: webhookContract.reconciliation.shouldReconcile,
      blockers: webhookContract.reconciliation.blockers,
      responseProjection: {
        rawProviderEventIdEchoed: false,
        rawIdempotencyKeyEchoed: false,
      },
    },
    runtimeReadiness: {
      status: webhookContract.runtimeReadiness.status,
      missingSupportedEvents: webhookContract.runtimeReadiness.missingSupportedEvents,
      requiredCommands: webhookContract.runtimeReadiness.requiredCommands,
      requiredEvidence: webhookContract.runtimeReadiness.requiredEvidence,
      blockerCount: webhookContract.runtimeReadiness.blockers.length,
    },
    shouldPersistReplay: webhookContract.shouldPersistReplay,
    shouldRunTransaction: webhookContract.shouldRunTransaction,
    boundary: webhookContract.boundary,
    responseProjection: {
      rawWebhookContractEchoed: false,
      rawProviderEventIdEchoed: false,
      rawProviderPayloadEchoed: false,
    },
  };
}

function buildSafeLocalStripeWebhookReceipt(storedWebhook: ReturnType<typeof persistWebhookEvent>) {
  return {
    source: storedWebhook.source,
    eventType: storedWebhook.eventType,
    receivedSignatureHeader: storedWebhook.receivedSignatureHeader,
    payloadLength: storedWebhook.payloadLength,
    createdAt: storedWebhook.createdAt,
    responseProjection: {
      webhookIdEchoed: false,
      tenantIdEchoed: false,
      rawProviderEventIdEchoed: false,
      rawProviderPayloadEchoed: false,
      rawSignatureEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

function stripeObject(payload: Record<string, unknown>): Record<string, unknown> {
  return asRecord(asRecord(payload.data)?.object) ?? {};
}

function stripeMetadata(payload: Record<string, unknown>): Record<string, unknown> {
  const object = stripeObject(payload);
  const candidateValues = [object.metadata, payload.metadata, asRecord(payload.data)?.metadata];
  const merged: Record<string, unknown> = {};
  for (const candidate of candidateValues) {
    const metadataRecord = asRecord(candidate);
    if (metadataRecord) Object.assign(merged, metadataRecord);
  }
  return merged;
}

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const metadata = stripeMetadata(payload);
  const tenantSlug = typeof metadata.tenantSlug === "string" ? metadata.tenantSlug : undefined;
  const tenantId = typeof metadata.tenantId === "string" ? metadata.tenantId : undefined;
  if (tenantSlug && tenantSlug === inkrouteDemoTenant.slug) return tenantSlug;
  if (tenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  return inkrouteDemoTenant.slug;
}

async function resolveStripeTenant(payload: Record<string, unknown>): Promise<StripeTenantResolution> {
  const metadata = stripeMetadata(payload);
  const tenantId = typeof metadata.tenantId === "string" ? metadata.tenantId : undefined;
  const tenantSlug = typeof metadata.tenantSlug === "string" ? metadata.tenantSlug.toLowerCase().trim() : undefined;

  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findFirst: (options: { where: { OR: Array<{ id?: string; slug?: string }> }; select: { id: true; slug: true } }) => Promise<{ id: string; slug: string } | null>;
      };
    };
    const or = [...(tenantId ? [{ id: tenantId }] : []), ...(tenantSlug ? [{ slug: tenantSlug }] : [])];
    if (or.length > 0) {
      const tenant = await prismaRuntime.tenant.findFirst({ where: { OR: or }, select: { id: true, slug: true } });
      if (tenant) return { tenantId: tenant.id, tenantSlug: tenant.slug, source: "database" };
    }
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
  }

  return { tenantId: inkrouteDemoTenant.id, tenantSlug: inkrouteDemoTenant.slug, source: "local-demo" };
}

function numericAmount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function paymentStatusFromInterpretation(targetStatus: string): "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "disputed" {
  if (targetStatus === "paid") return "paid";
  if (targetStatus === "failed" || targetStatus === "expired" || targetStatus === "cancelled") return "failed";
  if (targetStatus === "refunded") return "refunded";
  if (targetStatus === "partially_refunded") return "partially_refunded";
  if (targetStatus === "disputed") return "disputed";
  return "pending";
}

async function persistStripeWebhookEvent(input: {
  payload: Record<string, unknown>;
  eventId: string;
  eventType: string;
  rawBodyBytes: number;
  signatureVerified: boolean;
  tenantId: string;
  webhookContract: ReturnType<typeof buildStripeWebhookRouteContract>;
  interpretation: ReturnType<typeof interpretStripeWebhook>;
}) {
  const metadata = stripeMetadata(input.payload);
  const object = stripeObject(input.payload);
  const sessionId = typeof object.id === "string" ? object.id : null;
  const paymentIntentId = typeof object.payment_intent === "string" ? object.payment_intent : null;
  const paymentId = typeof metadata.paymentId === "string" ? metadata.paymentId : null;
  const depositId = typeof metadata.depositId === "string" ? metadata.depositId : null;
  const bookingRequestId = typeof metadata.bookingRequestId === "string" ? metadata.bookingRequestId : null;
  const amountCents = numericAmount(object.amount_total) ?? numericAmount(object.amount_paid) ?? numericAmount(object.amount_received) ?? numericAmount(object.amount);
  const currency = typeof object.currency === "string" ? object.currency.toLowerCase() : null;
  const targetStatus = paymentStatusFromInterpretation(input.interpretation.targetStatus);

  return prisma.$transaction(async (tx) => {
    const txRuntime = tx as unknown as {
      providerWebhookDelivery: {
        findFirst: (options: { where: { provider: string; OR: Array<{ providerDeliveryId?: string; idempotencyKey?: string }> }; select: { id: true } }) => Promise<{ id: string } | null>;
        create: (options: { data: Record<string, unknown>; select: { id: true; processedAt: true } }) => Promise<{ id: string; processedAt: Date }>;
        update: (options: { where: { id: string }; data: Record<string, unknown>; select: { id: true; replayedAt: true } }) => Promise<{ id: string; replayedAt: Date | null }>;
      };
      payment: {
        findFirst: (options: { where: { tenantId: string; OR: Array<Record<string, unknown>> }; select: { id: true; depositId: true; amountCents: true; currency: true; status: true } }) => Promise<{ id: string; depositId: string | null; amountCents: number; currency: string; status: string } | null>;
        update: (options: { where: { id: string }; data: Record<string, unknown>; select: { id: true; status: true } }) => Promise<{ id: string; status: string }>;
      };
      deposit: {
        findFirst: (options: { where: { tenantId: string; OR: Array<Record<string, unknown>> }; select: { id: true; amountCents: true; currency: true; status: true } }) => Promise<{ id: string; amountCents: number; currency: string; status: string } | null>;
        update: (options: { where: { id: string }; data: Record<string, unknown>; select: { id: true; status: true } }) => Promise<{ id: string; status: string }>;
      };
      paymentAuditLog: {
        create: (options: { data: Record<string, unknown>; select: { id: true } }) => Promise<{ id: string }>;
      };
    };

    const existing = await txRuntime.providerWebhookDelivery.findFirst({
      where: { provider: "stripe", OR: [{ providerDeliveryId: input.eventId }, { idempotencyKey: input.webhookContract.reconciliation.idempotencyKey }] },
      select: { id: true },
    });
    if (existing) {
      const replay = await txRuntime.providerWebhookDelivery.update({ where: { id: existing.id }, data: { replayedAt: new Date() }, select: { id: true, replayedAt: true } });
      return { status: "replay" as const, replay };
    }

    const paymentWhere = [...(paymentId ? [{ id: paymentId }] : []), ...(paymentIntentId ? [{ providerPaymentId: paymentIntentId }] : []), ...(sessionId ? [{ providerSessionId: sessionId }] : [])];
    const payment = paymentWhere.length > 0
      ? await txRuntime.payment.findFirst({ where: { tenantId: input.tenantId, OR: paymentWhere }, select: { id: true, depositId: true, amountCents: true, currency: true, status: true } })
      : null;
    const depositWhere = [...(depositId ? [{ id: depositId }] : []), ...(bookingRequestId ? [{ bookingRequestId }] : []), ...(payment?.depositId ? [{ id: payment.depositId }] : [])];
    const deposit = depositWhere.length > 0
      ? await txRuntime.deposit.findFirst({ where: { tenantId: input.tenantId, OR: depositWhere }, select: { id: true, amountCents: true, currency: true, status: true } })
      : null;

    const expectedAmount = payment?.amountCents ?? deposit?.amountCents ?? null;
    const expectedCurrency = payment?.currency ?? deposit?.currency ?? null;
    const moneyMatches = amountCents === null || expectedAmount === null || (amountCents === expectedAmount && (!currency || !expectedCurrency || currency === expectedCurrency.toLowerCase()));
    const shouldMutate = input.webhookContract.reconciliation.shouldReconcile && moneyMatches && Boolean(payment || deposit);

    const delivery = await txRuntime.providerWebhookDelivery.create({
      data: {
        tenantId: input.tenantId,
        provider: "stripe",
        providerDeliveryId: input.eventId,
        idempotencyKey: input.webhookContract.reconciliation.idempotencyKey,
        providerFingerprint: providerSelectorFingerprint(paymentIntentId ?? sessionId ?? input.eventId),
        action: input.webhookContract.reconciliation.action,
        statusMutationApplied: shouldMutate,
        rawPayloadStored: false,
        sanitizedPayload: toJsonValue({
          eventType: input.eventType,
          eventIdReceived: Boolean(input.eventId),
          rawProviderEventIdStored: false,
          signatureVerified: input.signatureVerified,
          rawBodyBytes: input.rawBodyBytes,
          tenantResolved: true,
          bookingMetadataPresent: Boolean(bookingRequestId),
          paymentLookupMetadataPresent: Boolean(paymentId),
          depositLookupMetadataPresent: Boolean(depositId),
          paymentMatched: Boolean(payment),
          depositMatched: Boolean(deposit),
          internalPersistenceIdsStored: false,
          providerSessionPresent: Boolean(sessionId),
          providerPaymentPresent: Boolean(paymentIntentId),
          amountCentsPresent: amountCents !== null,
          currency,
          shouldMutate,
          moneyMatches,
          rawPayloadStored: false,
        }),
      },
      select: { id: true, processedAt: true },
    });

    const paymentMutation = shouldMutate && payment
      ? await txRuntime.payment.update({
        where: { id: payment.id },
        data: {
          status: targetStatus,
          ...(targetStatus === "paid" ? { paidAt: new Date() } : {}),
          ...(targetStatus === "failed" ? { failedAt: new Date() } : {}),
          ...(paymentIntentId ? { providerPaymentId: paymentIntentId } : {}),
          ...(sessionId ? { providerSessionId: sessionId } : {}),
          metadata: toJsonValue({
            stripeWebhookDeliveryRecorded: true,
            lastStripeEventType: input.eventType,
            rawPayloadStored: false,
            internalPersistenceIdsStored: false,
          }),
        },
        select: { id: true, status: true },
      })
      : null;
    const depositMutation = shouldMutate && deposit
      ? await txRuntime.deposit.update({ where: { id: deposit.id }, data: { status: targetStatus, ...(targetStatus === "paid" ? { paidAt: new Date() } : {}) }, select: { id: true, status: true } })
      : null;

    const audit = await txRuntime.paymentAuditLog.create({
      data: {
        tenantId: input.tenantId,
        paymentId: paymentMutation?.id ?? payment?.id ?? null,
        depositId: depositMutation?.id ?? deposit?.id ?? null,
        action: "stripe.webhook.received",
        provider: "stripe",
        metadata: toJsonValue({
          providerWebhookDeliveryRecorded: true,
          eventIdReceived: Boolean(input.eventId),
          rawProviderEventIdStored: false,
          eventType: input.eventType,
          action: input.webhookContract.reconciliation.action,
          targetStatus,
          statusMutationApplied: shouldMutate,
          moneyMatches,
          signatureVerified: input.signatureVerified,
          rawPayloadStored: false,
          internalPersistenceIdsStored: false,
          gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
        }),
      },
      select: { id: true },
    });

    return { status: "persisted" as const, delivery, audit, paymentMutation, depositMutation, moneyMatches, statusMutationApplied: shouldMutate };
  });
}

function buildSafeStripeWebhookPersistenceResponse(persisted: Awaited<ReturnType<typeof persistStripeWebhookEvent>>) {
  if (persisted.status === "replay") {
    return {
      status: persisted.status,
      providerWebhookDeliveryRecorded: true,
      providerWebhookDeliveryIdEchoed: false,
      auditIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      replayedAt: persisted.replay.replayedAt?.toISOString() ?? null,
      rawPayloadEchoed: false,
      rawProviderObjectEchoed: false,
      rawIdempotencyKeyEchoed: false,
    };
  }

  return {
    status: persisted.status,
    providerWebhookDeliveryRecorded: true,
    providerWebhookDeliveryIdEchoed: false,
    processedAt: persisted.delivery.processedAt.toISOString(),
    auditLogged: true,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
    paymentMutationApplied: Boolean(persisted.paymentMutation),
    paymentStatus: persisted.paymentMutation?.status ?? null,
    paymentIdEchoed: false,
    depositMutationApplied: Boolean(persisted.depositMutation),
    depositStatus: persisted.depositMutation?.status ?? null,
    depositIdEchoed: false,
    moneyMatches: persisted.moneyMatches,
    statusMutationApplied: persisted.statusMutationApplied,
    rawPayloadEchoed: false,
    rawProviderObjectEchoed: false,
    rawIdempotencyKeyEchoed: false,
  };
}

function productionStripeWebhookNotConfigured(input: { eventId: string; tenantSlug: string; interpretation: ReturnType<typeof interpretStripeWebhook>; message?: string }) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "PROVIDER_STRIPE_WEBHOOK_RECONCILIATION_NOT_CONFIGURED",
        message: input.message ?? "Production Stripe webhooks require durable replay protection plus tenant-scoped Deposit, Payment, BookingStateEvent, and PaymentAuditLog reconciliation; local runtime webhook persistence is disabled.",
        gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
      },
      data: {
        eventReceived: input.eventId !== "unknown",
        eventIdEchoed: false,
        tenantScope: {
          tenantResolved: input.tenantSlug !== "unknown",
          tenantSlugEchoed: false,
        },
        interpretation: buildSafeStripeWebhookInterpretationResponse(input.interpretation),
        responseProjection: {
          rawProviderEventIdEchoed: false,
          rawProviderPayloadEchoed: false,
          rawInterpretationEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        productionBoundary: {
          localStripeWebhookPersistenceDisabled: true,
          requiresDurableReplayProtection: true,
          gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
        },
      },
    },
    { status: 503, headers: noStoreHeaders },
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_STRIPE_SIGNATURE", message: "Stripe webhook requests must include the Stripe-Signature header." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (process.env.NODE_ENV === "production" && !endpointSecret) {
    return productionStripeWebhookNotConfigured({
      eventId: "unknown",
      tenantSlug: inkrouteDemoTenant.slug,
      interpretation: interpretStripeWebhook("unknown"),
      message: "Production Stripe webhooks require STRIPE_WEBHOOK_SECRET before signature verification or persistence can run.",
    });
  }

  if (endpointSecret) {
    const verification = verifyStripeWebhookSignature({ rawBody, signatureHeader: signature, endpointSecret, nowEpochSeconds: Math.floor(Date.now() / 1000) });
    if (!verification.verified) {
      return NextResponse.json(
        { ok: false, error: { code: "STRIPE_SIGNATURE_INVALID", message: verification.reason }, data: { verification: { status: verification.status, toleranceSeconds: verification.toleranceSeconds } } },
        { status: 400, headers: noStoreHeaders },
      );
    }
  }

  let payload: Record<string, unknown>;
  let parsedEventType = "unknown";
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
    parsedEventType = typeof payload.type === "string" ? payload.type : "unknown";
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Webhook body must be valid JSON before Stripe signature verification is wired." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const interpretation = interpretStripeWebhook(parsedEventType);
  const eventId = typeof payload.id === "string" && payload.id.trim().length > 0 ? payload.id : `local-${parsedEventType}-${rawBody.length}`;
  const webhookContract = buildStripeWebhookRouteContract({ payload, eventType: parsedEventType, eventId });
  const tenantResolution = await resolveStripeTenant(payload);
  const tenantSlug = tenantResolution.tenantSlug || getTenantSlugFromPayload(payload);

  if (tenantResolution.source === "database") {
    try {
      const persisted = await persistStripeWebhookEvent({
        payload,
        eventId,
        eventType: parsedEventType,
        rawBodyBytes: rawBody.length,
        signatureVerified: Boolean(endpointSecret),
        tenantId: tenantResolution.tenantId,
        webhookContract,
        interpretation,
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantSlug,
            tenantScope: { tenantResolved: true, tenantIdEchoed: false },
            persistence: "database",
            persisted: buildSafeStripeWebhookPersistenceResponse(persisted),
            interpretation: buildSafeStripeWebhookInterpretationResponse(interpretation),
            webhookContract: buildSafeStripeWebhookContractResponse(webhookContract),
            receivedSignatureHeader: "present",
            rawBodyBytes: rawBody.length,
            responseProjection: {
              stripePersistenceResponseAllowlisted: true,
              rawPayloadEchoed: false,
              rawProviderObjectEchoed: false,
              rawProviderEventIdEchoed: false,
              rawInterpretationEchoed: false,
              rawWebhookContractEchoed: false,
              rawIdempotencyKeyEchoed: false,
            },
            productionBoundary: {
              providerVerified: Boolean(endpointSecret),
              rawPayloadStored: false,
              gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
              remainingEvidence: [
                "Stripe CLI replay/idempotency proof",
                "provider object fetch/amount verification in sandbox",
                "booking-to-paid E2E and cross-tenant fixtures",
                "CI payment artifact capture",
              ],
            },
          },
        },
        { status: persisted.status === "replay" ? 200 : 202, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return productionStripeWebhookNotConfigured({
          eventId,
          tenantSlug,
          interpretation,
          message: "Stripe webhook reconciliation requires durable database replay protection and tenant-scoped payment audit persistence.",
        });
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return productionStripeWebhookNotConfigured({ eventId, tenantSlug, interpretation });
  }

  const storedWebhook = persistWebhookEvent(tenantSlug, {
    source: "stripe",
    eventType: parsedEventType,
    signatureHeader: "present",
    payloadLength: rawBody.length,
    interpretation: interpretation.eventType,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        storedWebhook: buildSafeLocalStripeWebhookReceipt(storedWebhook),
        interpretation: buildSafeStripeWebhookInterpretationResponse(interpretation),
        webhookContract: buildSafeStripeWebhookContractResponse(webhookContract),
        receivedSignatureHeader: "present",
        rawBodyBytes: rawBody.length,
        localRuntime: {
          status: "received-in-local-runtime",
          source: "stripe",
          gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
        },
        productionBoundary: {
          gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-051"],
          requiredBeforeEnablement: [
            "Use Stripe constructEvent with the raw request body and endpoint secret",
            "Reject events that fail signature verification",
            "Fetch/verify provider object when needed",
            "Reconcile tenant, booking, deposit, payment, amount, and currency idempotently",
            "Persist PaymentAuditLog records with redacted metadata",
          ],
        },
      },
    },
    { status: 200, headers: noStoreHeaders },
  );
}
