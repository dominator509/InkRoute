import { NextResponse, type NextRequest } from "next/server";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";
import { persistPrivacyRequest, resolveTenant } from "../../../../../lib/localRuntimeState";

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === "string" && requestTypes.includes(value as PrivacyRequestType);
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Privacy request body must be valid JSON." } }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  if (!isPrivacyRequestType(input.type) || typeof input.email !== "string") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Expected type and email." } }, { status: 400 });
  }

  const draft = buildPrivacyRequestDraft(input.type);
  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Privacy requests are available for local demo tenant slug only." } }, { status: 404 });
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
    { status: 201 },
  );
}
