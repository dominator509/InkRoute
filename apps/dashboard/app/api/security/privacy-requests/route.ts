import { NextResponse } from "next/server";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === "string" && requestTypes.includes(value as PrivacyRequestType);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  if (!isPrivacyRequestType(input.type)) {
    return NextResponse.json({ error: "VALIDATION_FAILED", message: "Expected privacy request type." }, { status: 400 });
  }

  return NextResponse.json({
    error: "PRIVACY_REQUEST_PERSISTENCE_NOT_IMPLEMENTED",
    message: "Dashboard privacy workflow was drafted but not persisted or executed.",
    draft: buildPrivacyRequestDraft(input.type),
    redactedSubmission: redactRecord(input),
    requiredNextWork: [
      "Require owner/studio manager role and tenant membership before dashboard privacy operations.",
      "Persist PrivacyRequest record and audit log.",
      "Implement verified export/delete/rectification workers with legal retention holds.",
      "Review privacy workflow and customer-facing language with counsel.",
    ],
  }, { status: 501 });
}
