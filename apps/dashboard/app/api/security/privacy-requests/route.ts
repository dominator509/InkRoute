import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@inkroute/db";
import { createHash } from "node:crypto";
import {
  buildDashboardPrivacyWorkflowEvidencePlan,
  buildPrivacyRequestDraft,
  rateLimitRules,
  redactRecord,
  type PrivacyRequestType,
} from "@inkroute/security";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

type PrivacyRequestInput = {
  type: PrivacyRequestType;
  email: string;
  requesterName?: string;
  clientId?: string;
  legalHold?: boolean;
  legalHoldReason?: string;
  details?: Record<string, unknown>;
};

type DemoPrivacyRequest = {
  idHash: string;
  rawIdStored: false;
  tenantIdHash: string;
  rawTenantIdStored: false;
  requestType: PrivacyRequestType;
  requesterEmailHash: string;
  rawRequesterEmailStored: false;
  rawDetailsStored: false;
  redactedSubmission: Record<string, unknown>;
  receivedAt: string;
};

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];
const demoTenantId = "demo-studio-alpha";
const inMemoryPrivacyRequests: DemoPrivacyRequest[] = [];
const rateLimitBuckets = new Map<string, { windowStart: number; count: number }>();
const noStoreHeaders = { "Cache-Control": "no-store" } as const;
const privacyRequestGapIds = ["GAP-040", "GAP-098", "GAP-099", "GAP-100", "GAP-101"] as const;

function normalizeHeaderValue(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}
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

function getClientIpFromAllowlistedHeaders(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("forwarded") ??
    "unknown-ip"
  );
}

function hashPrivacyRequestSelector(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function checkDashboardMutationRateLimit(request: NextRequest, actor: { tenantId: string; actorUserId: string }) {
  const rule = rateLimitRules.find((candidate) => candidate.id === "dashboard-mutation");
  if (!rule) {
    return { allowed: true, remaining: 0, retryAfterSeconds: 0, maxRequests: 0 };
  }

  const key = `${rule.id}:${hashPrivacyRequestSelector(
    JSON.stringify([actor.tenantId, actor.actorUserId, getClientIpFromAllowlistedHeaders(request)]),
  )}`;
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

function buildPrivacyWorkflowEvidencePlan(options: { persistedPrivacyRequestStoreConfigured: boolean; auditLogPersistencePassed: boolean }) {
  return buildDashboardPrivacyWorkflowEvidencePlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    securityTestsPassed: false,
    securityTypecheckPassed: false,
    dashboardTypecheckPassed: false,
    dashboardBuildPassed: false,
    routeProjectionSurfaces: ["client_profile", "booking_request", "consent_form", "payment", "message", "file_asset"],
    routeTestSurfaces: ["client_profile", "booking_request", "consent_form", "payment", "message", "file_asset"],
    persistedPrivacyRequestStoreConfigured: options.persistedPrivacyRequestStoreConfigured,
    exportWorkflowIntegrationPassed: false,
    deleteAnonymizeWorkflowIntegrationPassed: false,
    privateStorageDeletionIntegrationPassed: false,
    auditLogPersistencePassed: options.auditLogPersistencePassed,
    legalApprovalCaptured: false,
    consentMedicalDepositSmsCopyApproved: false,
    sanitizedLogEvidenceCaptured: false,
    sanitizedErrorEvidenceCaptured: false,
    ciEvidenceCaptured: false,
    secretSafeArtifactsCaptured: false,
  });
}

function buildPrivacyRequestResponseProjection(input: {
  actor: { tenantId: string; actorUserId: string };
  privacyRequestId?: string | null;
  auditId?: string | null;
  clientId?: string | null;
}) {
  return {
    tenantIdHash: hashPrivacyRequestSelector(input.actor.tenantId),
    tenantIdEchoed: false,
    clientIdHash: input.clientId ? hashPrivacyRequestSelector(input.clientId) : null,
    clientIdEchoed: false,
    privacyRequestIdHash: input.privacyRequestId ? hashPrivacyRequestSelector(input.privacyRequestId) : null,
    privacyRequestIdEchoed: false,
    auditIdHash: input.auditId ? hashPrivacyRequestSelector(input.auditId) : null,
    auditIdEchoed: false,
    actorUserIdHash: hashPrivacyRequestSelector(input.actor.actorUserId),
    actorUserIdEchoed: false,
    requesterEmailEchoed: false,
    rawPayloadEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
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

  const requesterName = typeof input.requesterName === "string" ? normalizeHeaderValue(input.requesterName) : null;
  const clientId = typeof input.clientId === "string" ? normalizeHeaderValue(input.clientId) : null;
  const legalHoldReason = typeof input.legalHoldReason === "string" ? normalizeHeaderValue(input.legalHoldReason) : null;
  const details = typeof input.details === "object" && input.details !== null ? (input.details as Record<string, unknown>) : undefined;
  const requestInput: PrivacyRequestInput = {
    type: input.type,
    email: input.email.trim().toLowerCase(),
    ...(requesterName ? { requesterName } : {}),
    ...(clientId ? { clientId } : {}),
    ...(input.legalHold === true ? { legalHold: true } : {}),
    ...(legalHoldReason ? { legalHoldReason } : {}),
    ...(details !== undefined ? { details } : {}),
  };

  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "tenant:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Dashboard privacy mutations require authenticated owner or studio manager access.", gapIds: ["GAP-040", "GAP-095", "GAP-098"] } },
      { status, headers: noStoreHeaders },
    );
  }

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

  if (actor.source !== "local-fallback") {
    try {
      const now = new Date();
      const result = await prisma.$transaction(async (tx) => {
        if (requestInput.clientId) {
          const client = await tx.client.findFirst({
            where: { id: requestInput.clientId, tenantId: actor.tenantId },
            select: { id: true },
          });

          if (!client) {
            throw new Error("CLIENT_NOT_FOUND");
          }
        }

        const privacyRequest = await tx.privacyRequest.create({
          data: {
            tenantId: actor.tenantId,
            requesterUserId: actor.actorUserId,
            ...(requestInput.clientId ? { clientId: requestInput.clientId } : {}),
            requestType: requestInput.type,
            status: "intake_received",
            requesterEmail: requestInput.email,
            ...(requestInput.requesterName ? { requesterName: requestInput.requesterName } : {}),
            dueAt: addDays(now, 30),
            legalHold: requestInput.legalHold === true,
            ...(requestInput.legalHoldReason ? { legalHoldReason: requestInput.legalHoldReason } : {}),
            redactedSubmission,
            statusHistory: [
              {
                status: "intake_received",
                at: now.toISOString(),
                actorUserIdHash: hashPrivacyRequestSelector(actor.actorUserId),
                rawActorUserIdStored: false,
                source: "dashboard-api",
                note: "Dashboard privacy intake persisted; fulfillment workers remain gated by GAP-040.",
              },
            ],
            fulfillmentMetadata: {
              source: "dashboard-api",
              workerDispatchQueued: false,
              exportWorkflowIntegrationPassed: false,
              deleteAnonymizeWorkflowIntegrationPassed: false,
              privateStorageDeletionIntegrationPassed: false,
              legalApprovalCaptured: false,
              gapIds: [...privacyRequestGapIds],
            },
          },
          select: {
            id: true,
            requestType: true,
            status: true,
            dueAt: true,
            legalHold: true,
            createdAt: true,
          },
        });

        const audit = await tx.auditLog.create({
          data: {
            tenantId: actor.tenantId,
            actorUserId: actor.actorUserId,
            action: "privacy.request.create",
            entityType: "PrivacyRequest",
            entityId: privacyRequest.id,
            metadata: {
              source: "dashboard-api",
              requestType: privacyRequest.requestType,
              status: privacyRequest.status,
              clientLinked: Boolean(requestInput.clientId),
              clientIdHash: requestInput.clientId ? hashPrivacyRequestSelector(requestInput.clientId) : null,
              rawClientIdStored: false,
              legalHold: privacyRequest.legalHold,
              redaction: "redactRecord",
              workerDispatchQueued: false,
              externalEvidenceGates: [
                "exportWorkflowIntegrationPassed",
                "deleteAnonymizeWorkflowIntegrationPassed",
                "privateStorageDeletionIntegrationPassed",
                "legalApprovalCaptured",
                "sanitizedLogEvidenceCaptured",
                "sanitizedErrorEvidenceCaptured",
                "ciEvidenceCaptured",
              ],
              gapIds: [...privacyRequestGapIds],
            },
          },
          select: { id: true },
        });

        return { privacyRequest, audit };
      });

      const dashboardPrivacyWorkflowEvidencePlan = buildPrivacyWorkflowEvidencePlan({
        persistedPrivacyRequestStoreConfigured: true,
        auditLogPersistencePassed: true,
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantScope: { actorTenantMatched: true },
            actor: {
              role: actor.role,
              actorUserIdEchoed: false,
            },
            persistence: "database",
            draft: buildPrivacyRequestDraft(requestInput.type),
            dashboardPrivacyWorkflowEvidencePlan,
            responseProjection: buildPrivacyRequestResponseProjection({
              actor,
              privacyRequestId: result.privacyRequest.id,
              auditId: result.audit.id,
              clientId: requestInput.clientId ?? null,
            }),
            persisted: {
              privacyRequestIdEchoed: false,
              requestType: result.privacyRequest.requestType,
              status: result.privacyRequest.status,
              email: "[redacted]",
              requesterEmailSelectedFromDatabase: false,
              dueAt: result.privacyRequest.dueAt.toISOString(),
              legalHold: result.privacyRequest.legalHold,
              receivedAt: result.privacyRequest.createdAt.toISOString(),
            },
            auditLogged: true,
            auditIdEchoed: false,
            actorUserIdEchoed: false,
            internalPersistenceIdsEchoed: false,
            nextStep: "Privacy request intake is persisted and audited; export/delete/anonymize workers remain deferred until provider/legal evidence is captured.",
            requiredNextWork: [
              "Implement verified export/delete/rectification workers with legal retention holds.",
              "Wire private file deletion and retention tombstone execution to the privacy request lifecycle.",
              "Capture sanitized log/error evidence, attorney approval, dashboard build/typecheck, route tests, and CI evidence.",
            ],
            gapIds: privacyRequestGapIds,
          },
        },
        { status: 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
        return NextResponse.json(
          { ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Privacy request clientId must belong to the actor tenant.", gapIds: ["GAP-040", "GAP-098"] } },
          { status: 404, headers: noStoreHeaders },
        );
      }

      if (isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Dashboard privacy request intake requires DB-backed PrivacyRequest and AuditLog persistence for authenticated tenants.",
              gapIds: privacyRequestGapIds,
            },
            productionBoundary: {
              inMemoryPrivacyRequestPersistenceDisabled: true,
              requiresDurablePrivacyRequestStore: true,
              requiresAuditLogPersistence: true,
              requiresExportDeleteWorkers: true,
            },
          },
          { status: 503, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        { ok: false, error: { code: "PRIVACY_REQUEST_CREATE_FAILED", message: "Privacy request intake could not be persisted.", gapIds: privacyRequestGapIds } },
        { status: 500, headers: noStoreHeaders },
      );
    }
  }

  const dashboardPrivacyWorkflowEvidencePlan = buildPrivacyWorkflowEvidencePlan({
    persistedPrivacyRequestStoreConfigured: false,
    auditLogPersistencePassed: false,
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
          tenantScope: { actorTenantMatched: true },
          actor: {
            role: actor.role,
            actorUserIdEchoed: false,
          },
          draft: buildPrivacyRequestDraft(requestInput.type),
          dashboardPrivacyWorkflowEvidencePlan,
          responseProjection: buildPrivacyRequestResponseProjection({ actor, clientId: requestInput.clientId ?? null }),
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

  const localPrivacyRequestId = nextRequestId();
  const persisted: DemoPrivacyRequest = {
    idHash: hashPrivacyRequestSelector(localPrivacyRequestId),
    rawIdStored: false,
    tenantIdHash: hashPrivacyRequestSelector(actor.tenantId),
    rawTenantIdStored: false,
    requestType: requestInput.type,
    requesterEmailHash: hashPrivacyRequestSelector(requestInput.email),
    rawRequesterEmailStored: false,
    rawDetailsStored: false,
    redactedSubmission,
    receivedAt: nowIso(),
  };

  inMemoryPrivacyRequests.push(persisted);

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantScope: { actorTenantMatched: true, localDemoTenantScoped: true },
        actor: {
          role: actor.role,
          actorUserIdEchoed: false,
        },
        draft: buildPrivacyRequestDraft(requestInput.type),
        dashboardPrivacyWorkflowEvidencePlan,
        responseProjection: buildPrivacyRequestResponseProjection({
          actor,
          privacyRequestId: localPrivacyRequestId,
          clientId: requestInput.clientId ?? null,
        }),
        persisted: {
          privacyRequestIdEchoed: false,
          requestType: persisted.requestType,
          email: persisted.redactedSubmission.email,
          redactedSubmission: persisted.redactedSubmission,
          receivedAt: persisted.receivedAt,
        },
        nextStep: "Dashboard persistence and worker dispatch are demo-scoped and do not yet execute export/deletion/notification workflows.",
        requiredNextWork: [
          "Require owner/studio manager role and tenant membership before dashboard privacy operations.",
          "Use DB-backed PrivacyRequest + AuditLog persistence for authenticated tenant actors; local fallback remains demo-only.",
          "Implement verified export/delete/rectification workers with legal retention holds.",
          "Review workflow, consent text, and customer-facing language with counsel.",
        ],
        gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
