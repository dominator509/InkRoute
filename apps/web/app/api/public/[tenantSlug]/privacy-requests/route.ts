import { NextResponse, type NextRequest } from "next/server";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";

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
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "PRIVACY_REQUEST_WORKFLOW_NOT_IMPLEMENTED",
        message: "Privacy request was redacted and drafted, but identity verification, persistence, exports/deletions, and legal workflow are not implemented.",
      },
      data: {
        tenantSlug,
        draft,
        redactedSubmission: redactRecord(input),
        gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
      },
    },
    { status: 501 },
  );
}
