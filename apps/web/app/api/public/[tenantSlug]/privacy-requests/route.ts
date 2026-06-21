import { NextResponse, type NextRequest } from "next/server";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";
import { checkRateLimit, getClientIp, persistPrivacyRequest, resolveTenant } from "../../../../../lib/localRuntimeState";

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === "string" && requestTypes.includes(value as PrivacyRequestType);
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Privacy request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  if (!isPrivacyRequestType(input.type) || typeof input.email !== "string") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Expected type and email." } }, { status: 400, headers: noStoreHeaders });
  }

  const draft = buildPrivacyRequestDraft(input.type);
  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Privacy requests are available for local demo tenant slug only." } }, { status: 404, headers: noStoreHeaders });
  }

  const rateLimit = checkRateLimit("public-privacy-request", tenantSlug, `${getClientIp(Object.fromEntries(request.headers.entries()))}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many privacy requests were submitted for this tenant and client.",
          details: { gapIds: ["GAP-098", "GAP-101"], remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED",
          message: "Production privacy requests require identity proofing, tenant relationship checks, durable case persistence, and audited worker execution; local runtime persistence is disabled.",
          gapIds: ["GAP-025", "GAP-098", "GAP-099", "GAP-100"],
        },
        productionBoundary: {
          localPrivacyRequestPersistenceDisabled: true,
          requiredBeforeEnablement: [
            "identity proofing and tenant relationship verification",
            "PrivacyRequest case/status database persistence",
            "export/delete/anonymize/rectify worker execution",
            "legal hold, notification, and AuditLog persistence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const persisted = persistPrivacyRequest(tenantSlug, { type: input.type, email: input.email, details: typeof input.details === "object" && input.details !== null ? (input.details as Record<string, unknown>) : {} });
  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        draft,
        redactedSubmission: redactRecord(input),
        persisted,
        gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
