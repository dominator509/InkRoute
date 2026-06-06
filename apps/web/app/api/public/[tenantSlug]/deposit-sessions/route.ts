import { buildStripeCheckoutSessionDraft, calculateDepositPolicy } from "@inkroute/payments";
import { NextResponse, type NextRequest } from "next/server";

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

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;

  let body: DepositSessionPreviewBody;
  try {
    body = (await request.json()) as DepositSessionPreviewBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 },
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
      { status: 400 },
    );
  }

  const policy = calculateDepositPolicy({
    estimatedSessionHours: asNumber(body.estimatedSessionHours, 2),
    city: asOptionalString(body.city),
    appointmentType: asOptionalString(body.appointmentType) === "flash" ? "flash" : asOptionalString(body.appointmentType) === "large_scale" ? "large_scale" : "custom",
    travelRiskTier: asOptionalString(body.travelRiskTier) === "high_demand_guest_spot" ? "high_demand_guest_spot" : "standard_travel",
    cityDemandScore: asNumber(body.cityDemandScore, 2),
    clientNoShowCount: asNumber(body.clientNoShowCount, 0),
    clientLateCancellationCount: asNumber(body.clientLateCancellationCount, 0),
  });

  const sessionInput = {
    tenantId: tenantSlug,
    bookingRequestId,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl,
    cancelUrl,
    artistDisplayName: "InkRoute Demo Artist",
    description: "Credential-gated tattoo booking deposit preview.",
    policyVersion: policy.policyVersion,
  };
  const clientEmail = asOptionalString(body.clientEmail);
  const clientName = asOptionalString(body.clientName);
  const sessionDraft = buildStripeCheckoutSessionDraft({
    ...sessionInput,
    ...(clientEmail ? { clientEmail } : {}),
    ...(clientName ? { clientName } : {}),
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "STRIPE_CHECKOUT_NOT_IMPLEMENTED",
        message:
          "Deposit policy calculation and a Stripe Checkout session draft are available, but live Checkout creation is credential-gated and must be protected by a signed booking token or dashboard auth before production.",
      },
      data: {
        policy,
        sessionDraft,
        productionBoundary: {
          gapIds: ["GAP-004", "GAP-049", "GAP-050"],
          requiredBeforeEnablement: [
            "Stripe SDK dependency installed and pinned",
            "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET configured",
            "Signed deposit token or authenticated dashboard action enforced",
            "Tenant, booking, amount, and currency persisted before redirect",
            "Webhook reconciliation and idempotency tested",
          ],
        },
      },
    },
    { status: 501 },
  );
}
