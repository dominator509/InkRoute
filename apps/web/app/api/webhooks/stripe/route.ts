import { inkrouteDemoTenant } from "@inkroute/config";
import { interpretStripeWebhook, verifyStripeWebhookSignature } from "@inkroute/payments";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";
import { buildStripeWebhookRouteContract } from "../../../../lib/stripeWebhook";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const metadata = asRecord(payload.data) && asRecord((asRecord(payload.data) as Record<string, unknown>).object) as Record<string, unknown> | undefined;
  const topLevelMetadata = asRecord(payload.metadata);
  const candidateValues = [
    asRecord(asRecord(payload.data)?.object)?.metadata,
    metadata,
    topLevelMetadata,
    asRecord(payload.data)?.["metadata"],
  ];

  for (const candidate of candidateValues) {
    const metadataRecord = asRecord(candidate);
    const tenantSlug = typeof metadataRecord?.tenantSlug === "string" ? metadataRecord.tenantSlug : undefined;
    const tenantId = typeof metadataRecord?.tenantId === "string" ? metadataRecord.tenantId : undefined;
    if (tenantSlug && tenantSlug === inkrouteDemoTenant.slug) return tenantSlug;
    if (tenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  }

  return inkrouteDemoTenant.slug;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "MISSING_STRIPE_SIGNATURE",
          message: "Stripe webhook requests must include the Stripe-Signature header.",
        },
      },
      { status: 400 },
    );
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (endpointSecret) {
    const verification = verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature,
      endpointSecret,
      nowEpochSeconds: Math.floor(Date.now() / 1000),
    });

    if (!verification.verified) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "STRIPE_SIGNATURE_INVALID",
            message: verification.reason,
          },
          data: {
            verification: {
              status: verification.status,
              toleranceSeconds: verification.toleranceSeconds,
            },
          },
        },
        { status: 400 },
      );
    }
  }

  let parsedEventType = "unknown";
  try {
    const event = JSON.parse(rawBody) as { type?: unknown };
    parsedEventType = typeof event.type === "string" ? event.type : "unknown";
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Webhook body must be valid JSON before Stripe signature verification is wired." } },
      { status: 400 },
    );
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const interpretation = interpretStripeWebhook(parsedEventType);
  const eventId = typeof payload.id === "string" && payload.id.trim().length > 0 ? payload.id : `local-${parsedEventType}-${rawBody.length}`;
  const webhookContract = buildStripeWebhookRouteContract({
    payload,
    eventType: parsedEventType,
    eventId,
  });
  const tenantSlug = getTenantSlugFromPayload(payload);
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
        storedWebhook,
        interpretation,
        webhookContract: {
          reconciliation: {
            eventId: webhookContract.reconciliation.eventId,
            action: webhookContract.reconciliation.action,
            targetStatus: webhookContract.reconciliation.targetStatus,
            idempotencyKey: webhookContract.reconciliation.idempotencyKey,
            shouldPersistAuditLog: webhookContract.reconciliation.shouldPersistAuditLog,
            shouldReconcile: webhookContract.reconciliation.shouldReconcile,
            blockers: webhookContract.reconciliation.blockers,
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
        },
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
    { status: 200 },
  );
}
