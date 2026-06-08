import { buildStripeCheckoutSessionDraft, calculateDepositPolicy } from "@inkroute/payments";
import { createDepositSession } from "@inkroute/payments";
import { checkRateLimit, getBookingRequest, getClientIp, persistDepositSession, resolveTenant } from "../../../../../lib/localRuntimeState";
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
  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Deposit sessions are available only for local demo tenant slug." } }, { status: 404 });
  }

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

  const sessionInput = {
    tenantId: resolvedTenant.tenantId,
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
  const createClient = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-booking-submit", tenantSlug, `${createClient}:${resolvedTenant.tenantId}`);
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
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
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
      { status: 400 },
    );
  }

  const session = await createDepositSession({
    tenantId: resolvedTenant.tenantId,
    bookingRequestId,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl,
    cancelUrl,
    clientEmail,
    clientName,
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
        sessionDraft,
        session,
        storedSession,
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
        localRuntime: {
          status: "local-demo",
          bookingFound: true,
          bookingId: existingBooking.request.id,
          readinessScore: existingBooking.readinessScore,
        },
      },
    },
    { status: 201 },
  );
}
