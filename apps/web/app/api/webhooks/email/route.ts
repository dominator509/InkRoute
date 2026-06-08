import { interpretEmailWebhook } from "@inkroute/notifications";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../../lib/localRuntimeState";

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
  try {
    const event = JSON.parse(rawBody) as { type?: unknown; event?: unknown };
    eventType = typeof event.type === "string" ? event.type : typeof event.event === "string" ? event.event : "unknown";
    eventPayload = typeof event === "object" && event !== null ? (event as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Email webhook body must be valid JSON." } }, { status: 400 });
  }

  const tenantSlug = getTenantSlugFromPayload(eventPayload);
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
        },
      },
    },
    { status: 200 },
  );
}
