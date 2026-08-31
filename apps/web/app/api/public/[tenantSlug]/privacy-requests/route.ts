import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@inkroute/db";
import { buildPrivacyRequestDraft, redactRecord, type PrivacyRequestType } from "@inkroute/security";
import { createHash } from "crypto";
import { checkRateLimit, getClientIpFromHeaders, persistPrivacyRequest, resolveTenant } from "../../../../../lib/localRuntimeState";

export const runtime = "nodejs";

const requestTypes: PrivacyRequestType[] = ["access", "export", "rectification", "deletion", "restriction"];
const noStoreHeaders = { "Cache-Control": "no-store" } as const;
const privacyGapIds = ["GAP-025", "GAP-098", "GAP-099", "GAP-100", "GAP-101"] as const;

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === "string" && requestTypes.includes(value as PrivacyRequestType);
}

function normalizeSlug(value: string): string {
  return decodeURIComponent(value).toLowerCase().trim();
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function privacyRequesterHash(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function buildPrivacyRequestResponseProjection() {
  return {
    requesterEmailRedacted: true,
    requesterEmailSelectedFromDatabase: false,
    rawPayloadStored: false,
    rawPayloadEchoed: false,
    redactedSubmissionEchoed: false,
    requesterHashEchoed: false,
    rawIdempotencyKeyEchoed: false,
    idempotencyResultInternalIdsStored: false,
    privacyRequestIdEchoed: false,
    auditIdEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafePrivacyRequestReceipt(input: { requestType: string; status: string; dueAt?: Date | string; receivedAt?: Date | string }) {
  return {
    requestType: input.requestType,
    status: input.status,
    ...(input.dueAt ? { dueAt: input.dueAt instanceof Date ? input.dueAt.toISOString() : input.dueAt } : {}),
    ...(input.receivedAt ? { receivedAt: input.receivedAt instanceof Date ? input.receivedAt.toISOString() : input.receivedAt } : {}),
    identityProofRequired: true,
    tenantRelationshipProofRequired: true,
  };
}

function buildSafePrivacyRequestDraft(draft: ReturnType<typeof buildPrivacyRequestDraft>) {
  return {
    type: draft.type,
    status: draft.status,
    identityVerificationRequired: draft.identityVerificationRequired,
    deadlinePolicy: draft.deadlinePolicy,
  };
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;
  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolvePrivacyTenant(tenantSlug: string): Promise<{ tenantId: string; tenantSlug: string; source: "database" | "local-fallback" } | null> {
  const normalizedSlug = normalizeSlug(tenantSlug);

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true, slug: true },
    });

    if (tenant) return { tenantId: tenant.id, tenantSlug: tenant.slug, source: "database" };
    if (process.env.NODE_ENV === "production") return null;
  } catch (error) {
    if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) throw error;
  }

  const localTenant = resolveTenant(normalizedSlug);
  return localTenant ? { tenantId: localTenant.tenantId, tenantSlug: normalizedSlug, source: "local-fallback" } : null;
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

  const requesterEmail = input.email.trim().toLowerCase();
  const requesterName = typeof input.requesterName === "string" && input.requesterName.trim() ? input.requesterName.trim() : null;
  const details = typeof input.details === "object" && input.details !== null ? (input.details as Record<string, unknown>) : {};
  const draft = buildPrivacyRequestDraft(input.type);
  let resolvedTenant;
  try {
    resolvedTenant = await resolvePrivacyTenant(tenantSlug);
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED",
            message: "Privacy request tenant resolution requires the database in production.",
            gapIds: privacyGapIds,
          },
          productionBoundary: {
            localPrivacyRequestPersistenceDisabled: true,
            requiresTenantDatabaseResolution: true,
          },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "PRIVACY_TENANT_RESOLUTION_FAILED", message: "Privacy request tenant scope could not be resolved.", gapIds: privacyGapIds } },
      { status: 500, headers: noStoreHeaders },
    );
  }

  if (!resolvedTenant) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Privacy requests are available for local demo tenant slug only." } }, { status: 404, headers: noStoreHeaders });
  }

  const rateLimit = checkRateLimit("public-privacy-request", tenantSlug, `${getClientIpFromHeaders(request.headers)}:${resolvedTenant.tenantId}`);
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

  const redactedSubmission = redactRecord({ type: input.type, email: requesterEmail, requesterName, details });

  if (resolvedTenant.source === "database") {
    try {
      const now = new Date();
      const requesterHash = privacyRequesterHash(requesterEmail);
      const idempotencyKey =
        request.headers.get("idempotency-key") ??
        `public-privacy-request:${resolvedTenant.tenantId}:${input.type}:${requesterHash}`;
      const result = await prisma.$transaction(async (tx) => {
        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId: resolvedTenant.tenantId, scope: "public-privacy-request", key: idempotencyKey } },
          create: {
            tenantId: resolvedTenant.tenantId,
            scope: "public-privacy-request",
            key: idempotencyKey,
            status: "claimed",
            metadata: toJsonValue({
              route: "/api/public/[tenantSlug]/privacy-requests",
              requestType: input.type,
              requesterHash,
              rawPayloadStored: false,
            }),
          },
          update: {
            metadata: toJsonValue({
              route: "/api/public/[tenantSlug]/privacy-requests",
              requestType: input.type,
              requesterHash,
              replayObserved: true,
              rawPayloadStored: false,
            }),
          },
          select: { id: true, key: true },
        });

        const privacyRequest = await tx.privacyRequest.create({
          data: {
            tenantId: resolvedTenant.tenantId,
            requestType: input.type,
            status: "intake_received",
            requesterEmail,
            ...(requesterName ? { requesterName } : {}),
            dueAt: addDays(now, 30),
            redactedSubmission,
            statusHistory: [
              {
                status: "intake_received",
                at: now.toISOString(),
                source: "public-api",
                note: "Public privacy request intake persisted; identity and tenant relationship proofing remain gated by GAP-098.",
              },
            ],
            fulfillmentMetadata: {
              source: "public-api",
              routeTenantSlugReceived: true,
              tenantSlugStored: false,
              idempotencyPersisted: true,
              internalPersistenceIdsStored: false,
              requesterHash,
              identityProofRequired: true,
              tenantRelationshipProofRequired: true,
              exportWorkflowIntegrationPassed: false,
              deleteAnonymizeWorkflowIntegrationPassed: false,
              notificationWorkerQueued: false,
              gapIds: [...privacyGapIds],
            },
          },
          select: { id: true, requestType: true, status: true, dueAt: true, createdAt: true },
        });

        const audit = await tx.auditLog.create({
          data: {
            tenantId: resolvedTenant.tenantId,
            action: "privacy.request.public_intake",
            entityType: "PrivacyRequest",
            entityId: privacyRequest.id,
            metadata: {
              source: "public-api",
              routeTenantSlugReceived: true,
              tenantSlugStored: false,
              requestType: privacyRequest.requestType,
              status: privacyRequest.status,
              redaction: "redactRecord",
              idempotencyPersisted: true,
              internalPersistenceIdsStored: false,
              requesterHash,
              identityProofRequired: true,
              tenantRelationshipProofRequired: true,
              workerDispatchQueued: false,
              gapIds: [...privacyGapIds],
            },
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId: resolvedTenant.tenantId, scope: "public-privacy-request", key: idempotencyKey } },
          data: {
            status: "completed",
            result: toJsonValue({
              privacyRequestPersisted: true,
              auditLogged: true,
              privacyRequestIdEchoed: false,
              auditIdEchoed: false,
              idempotencyResultInternalIdsStored: false,
              internalPersistenceIdsStored: false,
              internalPersistenceIdsEchoed: false,
              requestType: privacyRequest.requestType,
              status: privacyRequest.status,
              dueAt: privacyRequest.dueAt.toISOString(),
              requesterHashStored: true,
              requesterHashEchoed: false,
              rawPayloadStored: false,
            }),
          },
          select: { id: true },
        });

        return { privacyRequest, audit, idempotency };
      });

      return NextResponse.json(
        {
          ok: true,
          data: {
            tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
            persistence: "database",
            draft: buildSafePrivacyRequestDraft(draft),
            receipt: buildSafePrivacyRequestReceipt({
              requestType: result.privacyRequest.requestType,
              status: result.privacyRequest.status,
              dueAt: result.privacyRequest.dueAt,
              receivedAt: result.privacyRequest.createdAt,
            }),
            responseProjection: buildPrivacyRequestResponseProjection(),
            requiredNextWork: [
              "Verify requester identity before export/delete/rectification execution.",
              "Prove requester relationship to tenant records before worker access.",
              "Execute export/delete/anonymize/rectify workers with legal holds and redacted artifacts.",
            ],
            gapIds: privacyGapIds,
          },
        },
        { status: 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (!(process.env.NODE_ENV === "production") && isDatabaseUnavailable(error)) {
        // Fall through to local runtime persistence below.
      } else if (isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PROVIDER_PRIVACY_REQUEST_PERSISTENCE_NOT_CONFIGURED",
              message: "Production privacy requests require durable PrivacyRequest and AuditLog persistence; local runtime persistence is disabled.",
              gapIds: privacyGapIds,
            },
            productionBoundary: {
              localPrivacyRequestPersistenceDisabled: true,
              requiresDurablePrivacyRequestStore: true,
              requiresAuditLogPersistence: true,
            },
          },
          { status: 503, headers: noStoreHeaders },
        );
      } else {
        return NextResponse.json(
          { ok: false, error: { code: "PRIVACY_REQUEST_CREATE_FAILED", message: "Privacy request intake could not be persisted.", gapIds: privacyGapIds } },
          { status: 500, headers: noStoreHeaders },
        );
      }
    }
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

  const persisted = persistPrivacyRequest(tenantSlug, { type: input.type, email: requesterEmail, details });
  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        persistence: "local-fallback",
        draft: buildSafePrivacyRequestDraft(draft),
        receipt: buildSafePrivacyRequestReceipt({
          requestType: persisted.requestType,
          status: "intake_received",
          receivedAt: persisted.receivedAt,
        }),
        responseProjection: buildPrivacyRequestResponseProjection(),
        gapIds: ["GAP-013", "GAP-098", "GAP-099", "GAP-100"],
      },
    },
    { status: 201, headers: noStoreHeaders },
  );
}
