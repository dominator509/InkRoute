import { interpretSmsWebhook } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";

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

  if (contentType.includes("application/json")) {
    try {
      const event = JSON.parse(rawBody) as { MessageStatus?: unknown; SmsStatus?: unknown; Body?: unknown };
      eventType = typeof event.MessageStatus === "string" ? event.MessageStatus : typeof event.SmsStatus === "string" ? event.SmsStatus : "sms.callback";
      inboundBody = typeof event.Body === "string" ? event.Body : undefined;
    } catch {
      return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "SMS JSON webhook body must be valid JSON." } }, { status: 400 });
    }
  } else {
    const params = new URLSearchParams(rawBody);
    eventType = params.get("MessageStatus") ?? params.get("SmsStatus") ?? "sms.callback";
    inboundBody = params.get("Body") ?? undefined;
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "SMS_WEBHOOK_NOT_IMPLEMENTED",
        message: "SMS webhook shape was inspected, but signature verification, delivery-log persistence, STOP suppression, inbound thread routing, and replay protection are not implemented.",
      },
      data: {
        interpretation: interpretSmsWebhook(eventType, inboundBody),
        rawBodyBytes: rawBody.length,
        productionBoundary: { gapIds: ["GAP-062", "GAP-064", "GAP-066"] },
      },
    },
    { status: 501 },
  );
}
