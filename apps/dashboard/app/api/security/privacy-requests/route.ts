import { NextResponse, type NextRequest } from "next/server";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";

type PrivacyRequestInput = {
  type: PrivacyRequestType;
  email: string;
  details?: Record<string, unknown>;
};

type DemoPrivacyRequest = {
  id: string;
  tenantId: string;
  requestType: PrivacyRequestType;
  email: string;
  details?: Record<string, unknown>;
  redactedSubmission: Record<string, unknown>;
  receivedAt: string;
};

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];
const demoTenantId = "demo-studio-alpha";
const inMemoryPrivacyRequests: DemoPrivacyRequest[] = [];
let requestCounter = 1;

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === "string" && requestTypes.includes(value as PrivacyRequestType);
}

function nextRequestId() {
  return `pr_${String(requestCounter++).padStart(6, "0")}`;
}

function nowIso() {
  return new Date().toISOString();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Privacy request body must be valid JSON." }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (!isPrivacyRequestType(input.type) || typeof input.email !== "string" || !input.email.includes("@")) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", message: "Expected valid type and email for a privacy request." },
      { status: 400 },
    );
  }

  const details = typeof input.details === "object" && input.details !== null ? (input.details as Record<string, unknown>) : undefined;
  const requestInput: PrivacyRequestInput = {
    type: input.type,
    email: input.email,
    ...(details ? { details } : {}),
  };

  const redactedSubmission = redactRecord({ email: requestInput.email, ...requestInput.details });
  const persisted: DemoPrivacyRequest = {
    id: nextRequestId(),
    tenantId: demoTenantId,
    requestType: requestInput.type,
    email: requestInput.email,
    redactedSubmission,
    receivedAt: nowIso(),
    ...(requestInput.details ? { details: requestInput.details } : {}),
  };

  inMemoryPrivacyRequests.push(persisted);

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantId: demoTenantId,
        draft: buildPrivacyRequestDraft(requestInput.type),
        persisted: {
          id: persisted.id,
          requestType: persisted.requestType,
          email: persisted.redactedSubmission.email,
          receivedAt: persisted.receivedAt,
        },
        nextStep: "Dashboard persistence and worker dispatch are demo-scoped and do not yet execute export/deletion/notification workflows.",
        requiredNextWork: [
          "Require owner/studio manager role and tenant membership before dashboard privacy operations.",
          "Persist PrivacyRequest row + case notes in tenant-scoped store and audit log.",
          "Implement verified export/delete/rectification workers with legal retention holds.",
          "Review workflow, consent text, and customer-facing language with counsel.",
        ],
        gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
      },
    },
    { status: 201 },
  );
}
