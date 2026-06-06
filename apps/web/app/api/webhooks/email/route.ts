import { interpretEmailWebhook } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";

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
  try {
    const event = JSON.parse(rawBody) as { type?: unknown; event?: unknown };
    eventType = typeof event.type === "string" ? event.type : typeof event.event === "string" ? event.event : "unknown";
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_WEBHOOK_JSON", message: "Email webhook body must be valid JSON." } }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "EMAIL_WEBHOOK_NOT_IMPLEMENTED",
        message: "Email webhook shape was inspected, but provider signature verification, delivery-log persistence, suppression handling, and replay protection are not implemented.",
      },
      data: {
        interpretation: interpretEmailWebhook(eventType),
        rawBodyBytes: rawBody.length,
        productionBoundary: { gapIds: ["GAP-061", "GAP-064", "GAP-066"] },
      },
    },
    { status: 501 },
  );
}
