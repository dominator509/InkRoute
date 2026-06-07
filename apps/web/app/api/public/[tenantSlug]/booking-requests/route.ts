import { NextResponse, type NextRequest } from "next/server";
import { bookingRequestInputSchema } from "@inkroute/validators";
import { checkRateLimit, getClientIp, persistBookingRequest, resolveTenant } from "../../../../lib/localRuntimeState";

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 },
    );
  }

  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Booking API is not available for this tenant slug in local runtime." } }, { status: 404 });
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-booking-submit", tenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Booking submission is temporarily limited by local API guardrails.",
          details: {
            gapIds: ["GAP-031", "GAP-095"],
            maxRequests: rateLimit.maxRequests,
            windowSeconds: rateLimit.windowSeconds,
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const parsed = bookingRequestInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Booking request input did not pass the shared Phase 2 validator.",
          issues: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const persisted = persistBookingRequest(tenantSlug, parsed.data);

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        tenantId: resolvedTenant.tenantId,
        booking: persisted.request,
        readinessScore: persisted.readinessScore,
        events: persisted.events,
        requiredNextWork: [
          "Replace in-memory demo persistence with tenant-scoped DB writes in a transaction.",
          "Add signature-based anti-bot challenge before write.",
          "Persist reference uploads in private object storage before artist review.",
          "Queue notification draft to client and studio when artist policy rules are enabled.",
        ],
        gapIds: ["GAP-001", "GAP-002", "GAP-003", "GAP-004", "GAP-005", "GAP-008", "GAP-017"],
      },
    },
    { status: 201 },
  );
}
