import { NextResponse, type NextRequest } from "next/server";
import {
  buildDashboardPrivacyWorkflowEvidencePlan,
  buildPrivacyRequestDraft,
  rateLimitRules,
  redactRecord,
  type PrivacyRequestType,
} from "@inkroute/security";

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

type DashboardActor = {
  tenantId: string;
  userId: string;
  role: string;
};

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];
const demoTenantId = "demo-studio-alpha";
const allowedDashboardRoles = new Set(["owner", "studio_manager", "admin"]);
const inMemoryPrivacyRequests: DemoPrivacyRequest[] = [];
const rateLimitBuckets = new Map<string, { windowStart: number; count: number }>();
const noStoreHeaders = { "Cache-Control": "no-store" } as const;
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

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-client-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";
}

function resolveDashboardActor(request: NextRequest): { actor?: DashboardActor; error?: { status: number; code: string; message: string } } {
  const tenantId = request.headers.get("x-tenant-id");
  const role = request.headers.get("x-user-role") ?? "viewer";
  const userId = request.headers.get("x-user-id") ?? "demo-dashboard-user";

  if (tenantId !== demoTenantId) {
    return {
      error: {
        status: 403,
        code: "TENANT_SCOPE_REQUIRED",
        message: "Dashboard privacy mutations require an authenticated tenant scope.",
      },
    };
  }

  if (!allowedDashboardRoles.has(role)) {
    return {
      error: {
        status: 403,
        code: "ROLE_NOT_AUTHORIZED",
        message: "Dashboard privacy mutations require owner, studio_manager, or admin role.",
      },
    };
  }

  return { actor: { tenantId, userId, role } };
}

function checkDashboardMutationRateLimit(request: NextRequest, actor: DashboardActor) {
  const rule = rateLimitRules.find((candidate) => candidate.id === "dashboard-mutation");
  if (!rule) {
    return { allowed: true, remaining: 0, retryAfterSeconds: 0, maxRequests: 0 };
  }

  const key = `${rule.id}:${actor.tenantId}:${actor.userId}:${getClientIp(request)}`;
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const bucket = rateLimitBuckets.get(key);
  const nextBucket = !bucket || now - bucket.windowStart >= windowMs
    ? { windowStart: now, count: 1 }
    : { windowStart: bucket.windowStart, count: bucket.count + 1 };

  rateLimitBuckets.set(key, nextBucket);

  const allowed = nextBucket.count <= rule.maxRequests;
  const remaining = Math.max(rule.maxRequests - nextBucket.count, 0);
  const retryAfterSeconds = allowed ? 0 : Math.max(Math.ceil((windowMs - (now - nextBucket.windowStart)) / 1000), 1);
  return { allowed, remaining, retryAfterSeconds, maxRequests: rule.maxRequests };
}

function rateLimitHeaders(retryAfterSeconds: number) {
  return { ...noStoreHeaders, "Retry-After": String(retryAfterSeconds) };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON", message: "Privacy request body must be valid JSON." }, { status: 400, headers: noStoreHeaders });
  }

  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  if (!isPrivacyRequestType(input.type) || typeof input.email !== "string" || !input.email.includes("@")) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", message: "Expected valid type and email for a privacy request." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const details = typeof input.details === "object" && input.details !== null ? (input.details as Record<string, unknown>) : undefined;
  const requestInput: PrivacyRequestInput = {
    type: input.type,
    email: input.email,
    ...(details !== undefined ? { details } : {}),
  };

  const actorResolution = resolveDashboardActor(request);
  if (actorResolution.error) {
    return NextResponse.json(
      { ok: false, error: { code: actorResolution.error.code, message: actorResolution.error.message, gapIds: ["GAP-095", "GAP-098"] } },
      { status: actorResolution.error.status, headers: noStoreHeaders },
    );
  }

  const actor = actorResolution.actor!;
  const rateLimit = checkDashboardMutationRateLimit(request, actor);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many dashboard privacy mutations were submitted for this tenant and actor.",
          details: { gapIds: ["GAP-095", "GAP-098", "GAP-101"], remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: rateLimitHeaders(rateLimit.retryAfterSeconds) },
    );
  }

  const redactedSubmission = redactRecord({ email: requestInput.email, details: requestInput.details ?? {} });
  const dashboardPrivacyWorkflowEvidencePlan = buildDashboardPrivacyWorkflowEvidencePlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    securityTestsPassed: false,
    securityTypecheckPassed: false,
    dashboardTypecheckPassed: false,
    dashboardBuildPassed: false,
    routeProjectionSurfaces: ["client_profile", "booking_request", "consent_form", "payment", "message", "file_asset"],
    routeTestSurfaces: ["client_profile", "booking_request", "consent_form", "payment", "message", "file_asset"],
    persistedPrivacyRequestStoreConfigured: false,
    exportWorkflowIntegrationPassed: false,
    deleteAnonymizeWorkflowIntegrationPassed: false,
    privateStorageDeletionIntegrationPassed: false,
    auditLogPersistencePassed: false,
    legalApprovalCaptured: false,
    consentMedicalDepositSmsCopyApproved: false,
    sanitizedLogEvidenceCaptured: false,
    sanitizedErrorEvidenceCaptured: false,
    ciEvidenceCaptured: false,
    secretSafeArtifactsCaptured: false,
  });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DASHBOARD_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED",
          message:
            "Production dashboard privacy requests require durable PrivacyRequest, audit log, export/delete worker, legal-hold, and sanitized artifact persistence; in-memory demo persistence is disabled.",
          gapIds: ["GAP-013", "GAP-095", "GAP-098", "GAP-099", "GAP-100", "GAP-101"],
        },
        data: {
          tenantId: actor.tenantId,
          actor: {
            userId: actor.userId,
            role: actor.role,
          },
          draft: buildPrivacyRequestDraft(requestInput.type),
          dashboardPrivacyWorkflowEvidencePlan,
          redactedSubmission,
          productionBoundary: {
            inMemoryPrivacyRequestPersistenceDisabled: true,
            requiresDurablePrivacyRequestStore: true,
            requiresAuditLogPersistence: true,
            requiresExportDeleteWorkers: true,
            gapIds: ["GAP-013", "GAP-095", "GAP-098", "GAP-099", "GAP-100", "GAP-101"],
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const persisted: DemoPrivacyRequest = {
    id: nextRequestId(),
    tenantId: actor.tenantId,
    requestType: requestInput.type,
    email: requestInput.email,
    redactedSubmission,
    receivedAt: nowIso(),
    ...(requestInput.details !== undefined ? { details: requestInput.details } : {}),
  };

  inMemoryPrivacyRequests.push(persisted);

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantId: demoTenantId,
        actor: {
          userId: actor.userId,
          role: actor.role,
        },
        draft: buildPrivacyRequestDraft(requestInput.type),
        dashboardPrivacyWorkflowEvidencePlan,
        persisted: {
          id: persisted.id,
          requestType: persisted.requestType,
          email: persisted.redactedSubmission.email,
          redactedSubmission: persisted.redactedSubmission,
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
    { status: 201, headers: noStoreHeaders },
  );
}
