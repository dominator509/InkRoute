import { buildMessageThreadDraft } from "@inkroute/notifications";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, persistMessage, resolveTenant } from "../../../../lib/localRuntimeState";

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

  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Messages endpoint is available for local demo tenant slug only." } },
      { status: 404 },
    );
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-message", tenantSlug, `${clientIp}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            gapIds: ["GAP-064", "GAP-068", "GAP-031"],
            remaining: rateLimit.remaining,
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
        },
      },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const draft = buildMessageThreadDraft({
    subject: candidate.subject,
    body: candidate.body,
    relatedBookingRequestId: typeof candidate.bookingRequestId === "string" ? candidate.bookingRequestId : undefined,
  });
  const persisted = persistMessage(tenantSlug, { subject: draft.subject, body: candidate.body, channel: draft.channel, relatedBookingRequestId: draft.relatedBookingRequestId });

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        id: persisted.id,
        status: persisted.status,
        draft,
        requiredNextWork: [
          "Resolve public tenant and client identity safely.",
          "Rate limit and spam-protect inbound public messages.",
          "Persist MessageThread and Message rows in a tenant-scoped transaction.",
          "Redact sensitive text from logs and error reports.",
          "Queue consent-aware notifications for the artist and client.",
        ],
      },
      runtimeBoundary: {
        tenantId: resolvedTenant.tenantId,
        messageCount: 1,
        savedInLocalRuntime: true,
        gapIds: ["GAP-009", "GAP-061", "GAP-064", "GAP-066"],
      },
    },
    { status: 201 },
  );
}
