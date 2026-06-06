import { interpretStripeWebhook } from "@inkroute/payments";
import { NextResponse, type NextRequest } from "next/server";

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

  const interpretation = interpretStripeWebhook(parsedEventType);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "STRIPE_WEBHOOK_NOT_IMPLEMENTED",
        message:
          "Webhook shape was inspected, but signature verification and reconciliation are not implemented because the Stripe SDK, webhook secret, database, and idempotency store are not wired in this environment.",
      },
      data: {
        interpretation,
        receivedSignatureHeader: "present",
        rawBodyBytes: rawBody.length,
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
    { status: 501 },
  );
}
