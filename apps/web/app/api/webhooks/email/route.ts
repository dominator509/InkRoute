import { interpretEmailWebhook } from "@inkroute/notifications";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";
import { buildEmailProviderReconciliation, buildEmailWebhookReadinessFromPayload, emailProviderContract } from "../../../../lib/emailProvider";
import { buildProviderWebhookRouteBoundary, providerWebhookContract } from "../../../../lib/providerWebhookReconciliation";

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const candidateSlug = typeof payload.tenantSlug === "string" ? payload.tenantSlug : undefined;
  const candidateTenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
  if (candidateSlug === inkrouteDemoTenant.slug) return candidateSlug;
  if (candidateTenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  return inkrouteDemoTenant.slug;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("resend-signature") ?? request.headers.get("svix-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_EMAIL_PROVIDER_SIGNATURE", message: "Email webhooks must include a provider signature header before production processing." } },
      { status: 400 },
    );
  }

  let eventType = "unknown";
  let eventPayload: Record<string, unknown> = {};
  let eventId = "missing-email-event-id";
  let providerMessageId: string | undefined;
  try {
    const event = JSON.parse(rawBody) as { type?: unknown; event?: unknown };
    eventType = typeof event.type === "string" ? event.type : typeof event.event === "string" ? event.event : "unknown";
    eventPayload = typeof event === "object" && event !== null ? (event as Record<string, unknown>) : {};
    eventId = typeof eventPayload.id === "string" ? eventPayload.id : typeof eventPayload.event_id === "string" ? eventPayload.event_id : eventId;
    providerMessageId = typeof eventPayload.email_id === "string" ? eventPayload.email_id : typeof eventPayload.message_id === "string" ? eventPayload.message_id : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Email webhook body must be valid JSON." } }, { status: 400 });
  }

  const tenantSlug = getTenantSlugFromPayload(eventPayload);
  const readiness = buildEmailWebhookReadinessFromPayload({
    tenantId: tenantSlug,
    eventId,
    eventType,
    providerMessageId,
    rawBodyCaptured: true,
    signatureHeaderPresent: true,
  });
  const reconciliation = buildEmailProviderReconciliation({
    eventId,
    eventType,
    providerMessageId,
  });
  const providerWebhookBoundary = buildProviderWebhookRouteBoundary({
    source: "email",
    tenantId: tenantSlug,
    eventId,
    eventType,
    rawBodyBytes: rawBody.length,
    signatureHeaderPresent: true,
    reconciliation,
  });
  const storedWebhook = persistWebhookEvent(tenantSlug, {
    source: "email",
    eventType,
    signatureHeader: "present",
    payloadLength: rawBody.length,
    interpretation: interpretEmailWebhook(eventType).eventType,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        storedWebhook,
        interpretation: interpretEmailWebhook(eventType),
        readiness,
        reconciliation,
        providerWebhookBoundary,
        crossProviderReadiness: providerWebhookContract.runtimeReadiness,
        rawBodyBytes: rawBody.length,
        localRuntime: {
          status: "received-in-local-runtime",
          source: "email",
          gapIds: ["GAP-061", "GAP-064", "GAP-066"],
        },
        productionBoundary: {
          gapIds: ["GAP-061", "GAP-064", "GAP-066"],
          requiredBeforeEnablement: [
            "Verify provider signature before applying any delivery updates.",
            "Persist delivery-log rows with redacted destination metadata.",
            "Track idempotency from provider event IDs.",
            "Apply suppression state transitions for bounce/complaint/unsubscribe events.",
          ],
          sendPlan: emailProviderContract.sendPlan,
          requiredWrites: readiness.requiredWrites,
          requiredControls: readiness.requiredControls,
          crossProviderRequiredMethods: providerWebhookContract.requiredRepositoryMethods,
        },
      },
    },
    { status: 200 },
  );
}
