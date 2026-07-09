import { prisma } from "@inkroute/db";
import { buildStripeCheckoutSessionDraft, calculateDepositPolicy } from "@inkroute/payments";
import { createDepositSession } from "@inkroute/payments";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getBookingRequest, getClientIpFromHeaders, persistDepositSession, resolveTenant } from "../../../../../lib/localRuntimeState";
import { buildStripeCheckoutRouteContract } from "../../../../../lib/stripeCheckout";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function selectorHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

interface DepositSessionPreviewBody {
  bookingRequestId?: unknown;
  estimatedSessionHours?: unknown;
  city?: unknown;
  clientEmail?: unknown;
  clientName?: unknown;
  successUrl?: unknown;
  cancelUrl?: unknown;
  appointmentType?: unknown;
  travelRiskTier?: unknown;
  cityDemandScore?: unknown;
  clientNoShowCount?: unknown;
  clientLateCancellationCount?: unknown;
}

type DatabaseTenantResolution =
  | { status: "found"; tenantId: string; tenantName: string | null }
  | { status: "not_found" }
  | { status: "unavailable"; error: unknown };

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildSafeSessionDraftResponse(draft: ReturnType<typeof buildStripeCheckoutSessionDraft>) {
  return {
    mode: draft.mode,
    clientReferenceIdEchoed: false,
    lineItem: draft.lineItem,
    successUrl: draft.successUrl,
    cancelUrl: draft.cancelUrl,
    metadata: {
      tenantAttached: Boolean(draft.metadata.tenantId),
      bookingRequestAttached: Boolean(draft.metadata.bookingRequestId),
      policyVersion: draft.metadata.policyVersion,
    },
    tenantIdEchoed: false,
    bookingRequestIdEchoed: false,
    customerEmailEchoed: false,
    rawIdempotencyKeyEchoed: false,
  };
}

function buildSafeLocalSessionResponse(session: Awaited<ReturnType<typeof createDepositSession>>) {
  return {
    provider: session.provider,
    checkoutUrlEchoed: false,
    providerSessionIdEchoed: false,
    mockCheckoutUrlEchoed: false,
    rawProviderSessionIdEchoed: false,
  };
}

function buildSafeLocalStoredSessionResponse(storedSession: ReturnType<typeof persistDepositSession>) {
  return {
    status: storedSession.status,
    amountCents: storedSession.amountCents,
    currency: storedSession.currency,
    createdAt: storedSession.createdAt,
    tenantIdEchoed: false,
    bookingRequestIdEchoed: false,
    localDepositSessionIdEchoed: false,
    mockCheckoutUrlEchoed: false,
    rawProviderSessionIdEchoed: false,
  };
}

function buildSafeDepositDraftDatabaseResponse(result: {
  status: "created" | "replayed";
  deposit: { amountCents: number; currency: string; status: string; createdAt?: Date | null };
  payment: { status: string };
}) {
  return {
    idempotency: { keyEchoed: false, replayed: result.status === "replayed" },
    responseProjection: {
      rawIdempotencyResultEchoed: false,
      rawIdempotencyKeyEchoed: false,
      customerEmailEchoed: false,
      depositResponseAllowlisted: true,
      tenantIdEchoed: false,
      bookingRequestIdEchoed: false,
      depositIdEchoed: false,
      paymentIdEchoed: false,
      auditIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
    deposit: {
      persisted: true,
      amountCents: result.deposit.amountCents,
      currency: result.deposit.currency,
      status: result.deposit.status,
      createdAt: result.deposit.createdAt instanceof Date ? result.deposit.createdAt.toISOString() : null,
    },
    payment: {
      persisted: true,
      status: result.payment.status,
    },
  };
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("database") ||
    message.includes("connect") ||
    message.includes("prisma") ||
    message.includes("p1001") ||
    message.includes("p2024") ||
    message.includes("environment variable not found")
  );
}

async function resolveDatabaseTenant(tenantSlug: string): Promise<DatabaseTenantResolution> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true },
    });
    if (!tenant) {
      return { status: "not_found" };
    }
    return { status: "found", tenantId: tenant.id, tenantName: tenant.name };
  } catch (error) {
    return { status: "unavailable", error };
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const databaseTenant = await resolveDatabaseTenant(tenantSlug);
  const localTenant = databaseTenant.status === "found" ? undefined : resolveTenant(tenantSlug);
  if (databaseTenant.status === "not_found" && !localTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Deposit sessions are available only for configured tenant slugs." } }, { status: 404, headers: noStoreHeaders });
  }
  if (databaseTenant.status === "unavailable" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Production deposit session drafts require tenant-scoped database persistence; local fallback is disabled.",
        },
        data: {
          productionBoundary: {
            gapIds: ["GAP-004", "GAP-049", "GAP-050"],
            localFallbackDisabled: true,
            providerCheckoutCreated: false,
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  let body: DepositSessionPreviewBody;
  try {
    body = (await request.json()) as DepositSessionPreviewBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const bookingRequestId = asOptionalString(body.bookingRequestId);
  const successUrl = asOptionalString(body.successUrl);
  const cancelUrl = asOptionalString(body.cancelUrl);

  if (!bookingRequestId || !successUrl || !cancelUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_REQUIRED_FIELDS",
          message: "bookingRequestId, successUrl, and cancelUrl are required for a deposit session preview.",
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const city = asOptionalString(body.city);
  const policy = calculateDepositPolicy({
    estimatedSessionHours: asNumber(body.estimatedSessionHours, 2),
    ...(city ? { city } : {}),
    appointmentType: asOptionalString(body.appointmentType) === "flash" ? "flash" : asOptionalString(body.appointmentType) === "large_scale" ? "large_scale" : "custom",
    travelRiskTier: asOptionalString(body.travelRiskTier) === "high_demand_guest_spot" ? "high_demand_guest_spot" : "standard_travel",
    cityDemandScore: asNumber(body.cityDemandScore, 2),
    clientNoShowCount: asNumber(body.clientNoShowCount, 0),
    clientLateCancellationCount: asNumber(body.clientLateCancellationCount, 0),
  });

  const clientEmail = asOptionalString(body.clientEmail);
  const clientName = asOptionalString(body.clientName);
  const tenantId = databaseTenant.status === "found" ? databaseTenant.tenantId : localTenant?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Deposit sessions require a configured tenant." } }, { status: 404, headers: noStoreHeaders });
  }

  const sessionInput = {
    tenantId,
    bookingRequestId,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl,
    cancelUrl,
    artistDisplayName: databaseTenant.status === "found" ? databaseTenant.tenantName ?? "InkRoute Artist" : "InkRoute Demo Artist",
    description: "Credential-gated tattoo booking deposit preview.",
    policyVersion: policy.policyVersion,
  };
  const sessionDraft = buildStripeCheckoutSessionDraft({
    ...sessionInput,
    ...(clientEmail ? { clientEmail } : {}),
    ...(clientName ? { clientName } : {}),
  });
  const createClient = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit("public-deposit-session", tenantSlug, `${createClient}:${tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Deposit session creation is temporarily limited by local API guardrails.",
          details: {
            gapIds: ["GAP-004", "GAP-031"],
            maxRequests: rateLimit.maxRequests,
            windowSeconds: rateLimit.windowSeconds,
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      {
        status: 429,
        headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (databaseTenant.status === "found") {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.bookingRequest.findFirst({
          where: { id: bookingRequestId, tenantId },
          select: {
            id: true,
            status: true,
            clientEmailSnapshot: true,
            clientNameSnapshot: true,
            style: true,
            appointment: { select: { id: true } },
          },
        });
        if (!booking) {
          return { status: "booking_not_found" as const };
        }

        if (clientEmail && booking.clientEmailSnapshot.toLowerCase() !== clientEmail.toLowerCase()) {
          return { status: "client_mismatch" as const };
        }

        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId, scope: "public-deposit-session", key: sessionDraft.idempotencyKey } },
          create: {
            tenantId,
            scope: "public-deposit-session",
            key: sessionDraft.idempotencyKey,
            status: "claimed",
            metadata: {
              bookingRequestIdHash: selectorHash(bookingRequestId),
              rawBookingRequestIdStored: false,
              amountCents: policy.depositAmountCents,
              currency: policy.currency,
              providerCheckoutCreated: false,
            },
          },
          update: {
            metadata: {
              bookingRequestIdHash: selectorHash(bookingRequestId),
              rawBookingRequestIdStored: false,
              amountCents: policy.depositAmountCents,
              currency: policy.currency,
              providerCheckoutCreated: false,
              replayed: true,
            },
          },
          select: { id: true, result: true },
        });

        if (isRecord(idempotency.result)) {
          const replayDeposit = await tx.deposit.findFirst({
            where: {
              tenantId,
              bookingRequestId: booking.id,
              amountCents: policy.depositAmountCents,
              currency: policy.currency,
              status: "pending",
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, amountCents: true, currency: true, status: true, createdAt: true },
          });
          const replayPayment = replayDeposit
            ? await tx.payment.findFirst({
                where: {
                  tenantId,
                  bookingRequestId: booking.id,
                  depositId: replayDeposit.id,
                  provider: "stripe",
                  status: "pending",
                  amountCents: policy.depositAmountCents,
                  currency: policy.currency,
                },
                orderBy: { createdAt: "desc" },
                select: { id: true, status: true },
              })
            : null;

          if (replayDeposit && replayPayment) {
            return {
              status: "replayed" as const,
              booking,
              deposit: replayDeposit,
              payment: replayPayment,
              audit: { id: null },
            };
          }
        }

        const deposit = await tx.deposit.create({
          data: {
            tenantId,
            bookingRequestId: booking.id,
            ...(booking.appointment?.id ? { appointmentId: booking.appointment.id } : {}),
            amountCents: policy.depositAmountCents,
            currency: policy.currency,
            status: "pending",
            policySnapshot: {
              ...policy,
              source: "public-deposit-session",
              idempotencyPersisted: true,
              providerCheckoutCreated: false,
              internalPersistenceIdsStored: false,
            },
          },
          select: { id: true, bookingRequestId: true, appointmentId: true, amountCents: true, currency: true, status: true, createdAt: true },
        });

        const payment = await tx.payment.create({
          data: {
            tenantId,
            bookingRequestId: booking.id,
            depositId: deposit.id,
            ...(booking.appointment?.id ? { appointmentId: booking.appointment.id } : {}),
            provider: "stripe",
            status: "pending",
            amountCents: policy.depositAmountCents,
            currency: policy.currency,
            description: `Deposit draft for ${booking.style} tattoo request`,
            metadata: {
              source: "public-deposit-session",
              idempotencyPersisted: true,
              stripeCheckoutCreated: false,
              checkoutUrlsPersisted: false,
              internalPersistenceIdsStored: false,
            },
          },
          select: { id: true, status: true },
        });

        const audit = await tx.paymentAuditLog.create({
          data: {
            tenantId,
            paymentId: payment.id,
            depositId: deposit.id,
            action: "public.deposit_session.draft",
            provider: "stripe",
            metadata: {
              source: "public-api",
              bookingRequestMatched: true,
              idempotencyPersisted: true,
              stripeCheckoutCreated: false,
              internalPersistenceIdsStored: false,
              boundary: "DB deposit/payment draft persisted; Stripe checkout session creation remains provider-gated.",
            },
          },
          select: { id: true },
        });

        await tx.bookingStateEvent.create({
          data: {
            tenantId,
            bookingRequestId: booking.id,
            type: "deposit_requested",
            fromStatus: booking.status,
            toStatus: booking.status,
            metadata: {
              source: "public-deposit-session",
              depositPersisted: true,
              paymentPersisted: true,
              providerCheckoutCreated: false,
              internalPersistenceIdsStored: false,
            },
          },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId, scope: "public-deposit-session", key: sessionDraft.idempotencyKey } },
          data: {
            status: "completed",
            result: {
              depositPersisted: true,
              paymentPersisted: true,
              paymentAuditPersisted: true,
              bookingStateEventPersisted: true,
              providerCheckoutCreated: false,
              stripeCheckoutCreated: false,
              internalPersistenceIdsStored: false,
            },
          },
        });

        return { status: "created" as const, booking, deposit, payment, audit };
      });

      if (result.status === "booking_not_found") {
        return NextResponse.json(
          { ok: false, error: { code: "BOOKING_NOT_FOUND", message: "No matching booking request exists for this tenant. Persist or accept the booking request before requesting a deposit draft." } },
          { status: 400, headers: noStoreHeaders },
        );
      }
      if (result.status === "client_mismatch") {
        return NextResponse.json(
          { ok: false, error: { code: "CLIENT_MISMATCH", message: "Deposit session email must match the persisted booking request for this tenant." } },
          { status: 403, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          data: {
            policy,
            sessionDraft: buildSafeSessionDraftResponse(sessionDraft),
            persistence: "database",
            ...buildSafeDepositDraftDatabaseResponse(result),
            checkout: {
              provider: "stripe",
              created: false,
              checkoutUrlEchoed: false,
              providerSessionIdEchoed: false,
              requiredNextStep: "Stripe checkout session creation with provider credentials",
            },
            productionBoundary: {
              gapIds: ["GAP-004", "GAP-049", "GAP-050"],
              dbDraftPersisted: true,
              providerCheckoutCreated: false,
              requiredBeforeEnablement: [
                "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET configured",
                "Stripe Checkout Session or PaymentIntent creation executed with provider idempotency",
                "Provider session ID persisted before redirect",
                "Stripe webhook reconciliation and replay protection verified",
              ],
            },
          },
        },
        { status: result.status === "replayed" ? 200 : 202, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          { ok: false, error: { code: "DEPOSIT_DRAFT_FAILED", message: "Deposit draft could not be persisted." } },
          { status: 500, headers: noStoreHeaders },
        );
      }
    }
  }

  const resolvedTenant = localTenant;
  if (!resolvedTenant) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Deposit session drafts require a configured tenant database or the non-production local demo tenant.",
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const existingBooking = getBookingRequest(tenantSlug, bookingRequestId);
  if (!existingBooking) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOOKING_NOT_FOUND",
          message: "No matching booking request exists in local runtime for this tenant. Persist the booking request first.",
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_CHECKOUT_NOT_CONFIGURED",
          message: "Production deposit sessions require DB-backed draft persistence plus the Stripe provider checkout path; local mock checkout previews are disabled.",
        },
        data: {
          productionBoundary: {
            gapIds: ["GAP-004", "GAP-049", "GAP-050"],
            mockCheckoutDisabled: true,
            requiredBeforeEnablement: [
              "Stripe SDK/API-version source contract kept pinned",
              "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET configured",
              "Provider checkout session creation executed with DB-backed idempotency",
              "Payment, Deposit, and PaymentAuditLog rows persisted through tenant-scoped transaction adapters",
              "Stripe webhook reconciliation and replay protection verified",
            ],
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const session = await createDepositSession({
    tenantId: resolvedTenant.tenantId,
    bookingRequestId,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl,
    cancelUrl,
    ...(clientEmail ? { clientEmail } : {}),
    ...(clientName ? { clientName } : {}),
    artistDisplayName: existingBooking.request.clientName,
    description: `Deposit preview for ${existingBooking.request.style} tattoo request`,
    policyVersion: policy.policyVersion,
  });
  const checkoutContract = buildStripeCheckoutRouteContract({
    tenantId: resolvedTenant.tenantId,
    bookingRequestId,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl,
    cancelUrl,
    ...(clientEmail ? { clientEmail } : {}),
    ...(clientName ? { clientName } : {}),
    artistDisplayName: existingBooking.request.clientName,
    description: `Deposit preview for ${existingBooking.request.style} tattoo request`,
    policyVersion: policy.policyVersion,
  });

  const storedSession = persistDepositSession(tenantSlug, bookingRequestId, policy.depositAmountCents, policy.currency);

  return NextResponse.json(
    {
      ok: true,
      data: {
        policy,
        sessionDraft: buildSafeSessionDraftResponse(sessionDraft),
        session: buildSafeLocalSessionResponse(session),
        checkoutContract: {
          status: checkoutContract.readiness.status,
          canCallStripe: checkoutContract.readiness.canCallStripe,
          safeBrowserResponse: checkoutContract.safeBrowserResponse,
          runtimeReadiness: {
            status: checkoutContract.runtimeReadiness.status,
            requiredCommands: checkoutContract.runtimeReadiness.requiredCommands,
            requiredEvidence: checkoutContract.runtimeReadiness.requiredEvidence,
            blockerCount: checkoutContract.runtimeReadiness.blockers.length,
          },
          boundary: checkoutContract.boundary,
        },
        storedSession: buildSafeLocalStoredSessionResponse(storedSession),
        responseProjection: {
      rawIdempotencyKeyEchoed: false,
      checkoutUrlEchoed: false,
      providerSessionIdEchoed: false,
      rawProviderSessionIdEchoed: false,
      mockCheckoutUrlEchoed: false,
      customerEmailEchoed: false,
          tenantIdEchoed: false,
          bookingRequestIdEchoed: false,
          localDepositSessionIdEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        productionBoundary: {
          gapIds: ["GAP-004", "GAP-049", "GAP-050"],
          requiredBeforeEnablement: [
            "Stripe SDK/API-version source contract kept pinned",
            "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET configured",
            "Signed deposit token or authenticated dashboard action enforced",
            "Tenant, booking, amount, and currency persisted through tenant-scoped transaction adapters before redirect",
            "Webhook reconciliation and idempotency tested",
          ],
        },
        localRuntime: {
          status: "local-demo",
          bookingFound: true,
          bookingIdEchoed: false,
          readinessScore: existingBooking.readinessScore,
        },
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
