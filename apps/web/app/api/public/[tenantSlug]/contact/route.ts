import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, persistContactSubmission, resolveTenant } from "../../../../../lib/localRuntimeState";

function normalizeTenantSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
  const tenant = resolveTenant(normalizedTenantSlug);

  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Contact submissions require a known tenant scope." } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  let input: Record<string, unknown> = {};
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    } else {
      const form = await request.formData();
      input = Object.fromEntries(form.entries());
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_CONTACT_BODY", message: "Contact body must be valid JSON or form data." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const name = readString(input, "name");
  const email = readString(input, "email");
  const subject = readString(input, "subject");
  const message = readString(input, "message");

  if (name.length < 2 || !email.includes("@") || message.length < 10) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Expected name, email, and a message of at least 10 characters.",
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const clientIp = getClientIp(Object.fromEntries(request.headers.entries()));
  const rateLimit = checkRateLimit("public-booking-submit", normalizedTenantSlug, `contact:${clientIp}:${email.toLowerCase()}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Contact submission is temporarily rate-limited.",
          details: { remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }

  const persisted = persistContactSubmission(normalizedTenantSlug, {
    name,
    email,
    ...(subject ? { subject } : {}),
    message,
    source: "public_contact_form",
    clientIp,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantId: tenant.tenantId,
        persistence: "local-runtime",
        contactSubmission: {
          id: persisted.id,
          tenantId: persisted.tenantId,
          subject: persisted.subject,
          redactedSubmission: persisted.redactedSubmission,
          auditMetadata: persisted.auditMetadata,
          createdAt: persisted.createdAt,
        },
        workflows: {
          notification: {
            status: "provider_gated",
            boundary: "notification",
            reason: "Contact notification delivery waits for provider sandbox evidence and redacted delivery logs.",
          },
        },
        gapIds: ["GAP-010", "GAP-029", "GAP-031", "GAP-064"],
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
