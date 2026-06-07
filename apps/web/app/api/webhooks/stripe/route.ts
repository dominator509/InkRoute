import { inkrouteDemoTenant } from "@inkroute/config";
import { interpretStripeWebhook } from "@inkroute/payments";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../lib/localRuntimeState";

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
