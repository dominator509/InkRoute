import { NextResponse, type NextRequest } from "next/server";
import { bookingRequestInputSchema } from "@inkroute/validators";

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

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "BOOKING_PERSISTENCE_NOT_IMPLEMENTED",
        message: "The booking request shape is valid, but Phase 4 does not persist requests, upload reference files, collect deposits, or send notifications yet.",
      },
      data: {
        tenantSlug,
        acceptedShapePreview: {
          preferredCity: parsed.data.preferredCity,
          style: parsed.data.style,
          placement: parsed.data.placement,
          policyAccepted: parsed.data.policyAccepted,
        },
        requiredNextWork: [
          "Resolve public tenant by domain or slug.",
          "Rate limit and bot-protect public booking submissions.",
          "Persist BookingRequest and BookingStateEvent in a transaction.",
          "Create signed upload flow for private reference files.",
          "Queue client and artist notifications.",
          "Create Stripe deposit handoff only after policy rules are configured.",
        ],
      },
    },
    { status: 501 },
  );
}
