import { buildMessageThreadDraft } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("subject" in body) || !("body" in body)) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Message preview requires subject and body fields." } },
      { status: 400 },
    );
  }

  const candidate = body as { subject?: unknown; body?: unknown; bookingRequestId?: unknown };
  if (typeof candidate.subject !== "string" || typeof candidate.body !== "string") {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Message subject and body must be strings." } },
      { status: 400 },
    );
  }

  const draft = buildMessageThreadDraft({
    subject: candidate.subject,
    body: candidate.body,
    relatedBookingRequestId: typeof candidate.bookingRequestId === "string" ? candidate.bookingRequestId : undefined,
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "MESSAGE_PERSISTENCE_NOT_IMPLEMENTED",
        message: "The message shape can be previewed, but Phase 9 does not persist message threads, notify artists, or send email/SMS/push replies.",
      },
      data: {
        tenantSlug,
        draft,
        requiredNextWork: [
          "Resolve public tenant and client identity safely.",
          "Rate limit and spam-protect inbound public messages.",
          "Persist MessageThread and Message rows in a tenant-scoped transaction.",
          "Redact sensitive text from logs and error reports.",
          "Queue consent-aware notifications for the artist and client.",
        ],
      },
    },
    { status: 501 },
  );
}
