import { interpretSmsWebhook } from "@inkroute/notifications";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse, type NextRequest } from "next/server";
import { persistWebhookEvent } from "../../../../../lib/localRuntimeState";

function getTenantSlugFromPayload(payload: Record<string, unknown>): string {
  const candidateSlug = typeof payload.tenantSlug === "string" ? payload.tenantSlug : undefined;
  const candidateTenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
  if (candidateSlug === inkrouteDemoTenant.slug) return candidateSlug;
  if (candidateTenantId === inkrouteDemoTenant.id) return inkrouteDemoTenant.slug;
  return inkrouteDemoTenant.slug;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: { code: "MISSING_SMS_PROVIDER_SIGNATURE", message: "SMS webhooks must include the provider signature header before production processing." } },
      { status: 400 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let eventType = "sms.callback";
  let inboundBody: string | undefined;
  let eventPayload: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    try {
      const event = JSON.parse(rawBody) as { MessageStatus?: unknown; SmsStatus?: unknown; Body?: unknown };
      eventType = typeof event.MessageStatus === "string" ? event.MessageStatus : typeof event.SmsStatus === "string" ? event.SmsStatus : "sms.callback";
      inboundBody = typeof event.Body === "string" ? event.Body : undefined;
      eventPayload = event as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "SMS JSON webhook body must be valid JSON." } }, { status: 400 });
    }
  } else {
    const params = new URLSearchParams(rawBody);
    eventPayload = Object.fromEntries(params.entries());
    eventType = params.get("MessageStatus") ?? params.get("SmsStatus") ?? "sms.callback";
    inboundBody = params.get("Body") ?? undefined;
  }

  const tenantSlug = getTenantSlugFromPayload(eventPayload);
  const interpretation = interpretSmsWebhook(eventType, inboundBody);
  const storedWebhook = persistWebhookEvent(tenantSlug, {
    source: "sms",
    eventType,
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
        inboundBodyProvided: typeof inboundBody === "string",
        rawBodyBytes: rawBody.length,
        localRuntime: {
          status: "received-in-local-runtime",
          source: "sms",
          gapIds: ["GAP-062", "GAP-064", "GAP-066"],
        },
        productionBoundary: {
          gapIds: ["GAP-062", "GAP-064", "GAP-066"],
          requiredBeforeEnablement: [
            "Verify signature hash from Twilio before trusting payload content.",
            "Persist outbound/inbound message IDs and apply replay/idempotency checks.",
            "Handle inbound STOP by muting the sender destination immediately.",
            "Queue inbound messages to tenant-scoped threads only after validation.",
          ],
        },
      },
    },
    { status: 200 },
  );
}
