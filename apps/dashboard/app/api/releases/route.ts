import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createReleaseCandidate, createRollbackPlan, demoReleaseCandidate, buildReleaseHealthChecks } from "@inkroute/releases";
import { releaseCreateInputSchema, releaseRollbackInputSchema, releaseTenantQuerySchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";
import { assertPermissionWithTenantMembership } from "../dashboardAuthMembership";
import {
  buildOptimisticConcurrencyMetadata,
  buildReleaseWorkflowOrchestrationMetadata,
  buildTenantMembershipLookupMetadata,
  releasePersistenceRbacArtifactPaths,
  resolveReleaseApprovalState,
} from "../../../lib/releaseControlPlane";

export const runtime = "nodejs";

type PersistedReleaseSummary = {
  version: string;
  channel: "development" | "preview" | "production" | "mobile-preview" | "mobile-production";
  createdAt: string;
  responseProjection: {
    releaseRecordIdEchoed: false;
    commitShaEchoed: false;
  };
};

type ReleaseInputChannel = "development" | "preview" | "staging" | "production" | "mobile-preview" | "mobile-production";
type PersistedReleaseChannel = "development" | "preview" | "production" | "mobile_preview" | "mobile_production";
const STAGING_PERSISTENCE_CHANNEL: PersistedReleaseChannel = "preview";
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

type ReleaseRecordSummary = {
  id: string;
  version: string;
  channel: string;
  commitSha: string | null;
  notes: string;
  createdAt: Date;
};

function normalizeDbChannel(
  channel: ReleaseInputChannel,
): PersistedReleaseChannel {
  if (channel === "mobile-preview") return "mobile_preview";
  if (channel === "mobile-production") return "mobile_production";
  if (channel === "staging") return STAGING_PERSISTENCE_CHANNEL;
  return channel;
}

function normalizeDisplayChannel(channel: string): "development" | "preview" | "production" | "mobile-preview" | "mobile-production" {
  if (channel === "mobile_preview") return "mobile-preview";
  if (channel === "mobile_production") return "mobile-production";
  if (channel === "staging") return "preview";
  if (channel === "development" || channel === "preview" || channel === "production") return channel;
  return "preview";
}

function mapRecordToCandidate(record: ReleaseRecordSummary) {
  return createReleaseCandidate({
    version: record.version,
    channel: normalizeDisplayChannel(record.channel),
    surfaces: ["web", "dashboard", "mobile", "database"],
    commitSha: record.commitSha ?? `release-${record.id}`,
    releaseNotes: record.notes ? [record.notes] : ["Persisted release record."],
    createdBy: "dashboard-operator",
    createdAt: record.createdAt.toISOString(),
  });
}

function buildSafeReleaseCandidate(release: typeof demoReleaseCandidate) {
  const { id: _id, commitSha: _commitSha, ...safeRelease } = release as typeof demoReleaseCandidate & { id?: string; commitSha?: string };
  return {
    ...safeRelease,
    responseProjection: {
      releaseCandidateIdEchoed: false,
      commitShaEchoed: false,
    },
  };
}

function toReleaseSummary(record: { id: string; version: string; channel: string; commitSha: string | null; createdAt: Date }): PersistedReleaseSummary {
  return {
    version: record.version,
    channel: normalizeDisplayChannel(record.channel),
    createdAt: record.createdAt.toISOString(),
    responseProjection: {
      releaseRecordIdEchoed: false,
      commitShaEchoed: false,
    },
  };
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function selectorHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildReleaseIdempotencyKey(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function buildReleaseFallback(actor: ReturnType<typeof resolveDashboardActor>) {
  return {
    ok: true,
    source: actor.source,
    tenantIdEchoed: false,
    status: "demo-fallback",
    persistence: "local-fallback",
    release: buildSafeReleaseCandidate(createReleaseCandidate({
      version: demoReleaseCandidate.version,
      channel: demoReleaseCandidate.channel,
      surfaces: ["web", "dashboard", "mobile", "database"],
      commitSha: demoReleaseCandidate.commitSha,
      releaseNotes: ["Demo fallback route path is active without database persistence."],
      createdBy: "dashboard-demo",
      createdAt: demoReleaseCandidate.createdAt,
      gates: demoReleaseCandidate.gates,
      migrations: demoReleaseCandidate.migrations,
    })),
    releases: [toReleaseSummary({ id: "demo", version: demoReleaseCandidate.version, channel: "preview", commitSha: demoReleaseCandidate.commitSha, createdAt: new Date() })],
    rollback: createRollbackPlan(demoReleaseCandidate, "0.11.0-phase11"),
    healthChecks: buildReleaseHealthChecks(demoReleaseCandidate),
    responseProjection: {
      tenantIdEchoed: false,
      releaseCandidateIdEchoed: false,
      releaseRecordIdEchoed: false,
      commitShaEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
    boundary: "Local fallback path: tenant/auth checks still in progress and persistence is disabled in local mode.",
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  let membershipLookup;
  try {
    membershipLookup = await assertPermissionWithTenantMembership(actor, "release:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read release records." } }, { status: 403, headers: noStoreHeaders });
  }

  const query = releaseTenantQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Release query failed validation.", issues: query.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query release records for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: {
            tenantIdEchoed: false,
            releaseCandidateIdEchoed: false,
            releaseRecordIdEchoed: false,
            commitShaEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          error: {
            code: "PROVIDER_RELEASE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production release reads require DB-backed actor resolution and persisted tenant-scoped release records; local fallback release payloads are disabled.",
            gapIds: ["GAP-015", "GAP-088", "GAP-122", "GAP-125"],
          },
          productionBoundary: { localReleaseFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(buildReleaseFallback(actor), { headers: noStoreHeaders });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const releases = await tx.releaseRecord.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, version: true, channel: true, commitSha: true, notes: true, createdAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "release:read:list",
          entityType: "ReleaseRecord",
          metadata: {
            source: "dashboard-api",
            count: releases.length,
            redactedFields: ["deploymentSecrets", "providerTokens", "environmentSecrets"],
          },
        },
        select: { id: true },
      });

      return { releases, audit };
    });

    const release = result.releases[0]
      ? mapRecordToCandidate(result.releases[0])
      : createReleaseCandidate({
          version: demoReleaseCandidate.version,
          channel: "preview",
          surfaces: ["web", "dashboard", "mobile", "database"],
          commitSha: "no-release",
          releaseNotes: ["No stored release yet for this tenant."],
          createdBy: "dashboard-operator",
          createdAt: new Date().toISOString(),
        });

    return NextResponse.json({
      ok: true,
      source: actor.source,
      actorRole: membershipLookup.actorRole,
      membershipLookup,
      status: "authenticated",
      release: buildSafeReleaseCandidate(release),
      releases: result.releases.map(toReleaseSummary),
      rollback: createRollbackPlan(release, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(release),
      auditLogged: true,
      auditIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      responseProjection: {
        tenantIdEchoed: false,
        releaseCandidateIdEchoed: false,
        releaseRecordIdEchoed: false,
        commitShaEchoed: false,
        internalPersistenceIdsEchoed: false,
      },
      boundary: "Release records are now tenant-scoped and persisted when database is reachable; deployment automation remains external in this pass.",
      gapIds: ["GAP-015", "GAP-122", "GAP-125"],
    }, { headers: noStoreHeaders });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: {
            tenantIdEchoed: false,
            releaseCandidateIdEchoed: false,
            releaseRecordIdEchoed: false,
            commitShaEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          error: {
            code: "PROVIDER_RELEASE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production release reads require the dashboard database connection; demo fallback release payloads are disabled.",
            gapIds: ["GAP-015", "GAP-088", "GAP-122", "GAP-125"],
          },
          productionBoundary: { localReleaseFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(buildReleaseFallback(actor), { headers: noStoreHeaders });
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  let membershipLookup;
  try {
    membershipLookup = await assertPermissionWithTenantMembership(actor, "release:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to create release records." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Release request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = releaseCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Release payload failed validation.", issues: parsed.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const rawInput = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const expectedVersionHeader = request.headers.get("x-release-expected-version");
  const requestedApprovalState = typeof rawInput.approvalState === "string" ? rawInput.approvalState : request.headers.get("x-release-approval-state");
  const tenantId = input.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot write release records for a different tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const releaseCandidate = createReleaseCandidate({
    version: input.version,
    channel: input.channel,
    surfaces: input.surfaces?.length ? input.surfaces : ["web", "dashboard"],
    commitSha: input.commitSha ?? "release-draft",
    releaseNotes: [input.notes],
    migrations:
      input.migrationVersion && input.channel === "mobile-production"
        ? [
            {
              id: "migration-version",
              description: `Migration version marker ${input.migrationVersion}`,
              risk: "destructive",
              backwardCompatible: false,
              requiresBackup: true,
              requiresManualApproval: true,
            },
          ]
        : [],
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  });

  const approvalState = resolveReleaseApprovalState({
    channel: input.channel,
    requestedState: requestedApprovalState,
    productionBlocked: releaseCandidate.productionBlocked,
    actorRole: membershipLookup.actorRole,
  });
  const membershipMetadata = buildTenantMembershipLookupMetadata({ ...membershipLookup, actorSource: membershipLookup.source });

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: {
            tenantIdEchoed: false,
            releaseCandidateIdEchoed: false,
            releaseRecordIdEchoed: false,
            commitShaEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          error: {
            code: "PROVIDER_RELEASE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production release writes require DB-backed actor resolution and persisted tenant-scoped release/audit records; local fallback release drafts are disabled.",
            gapIds: ["GAP-015", "GAP-088", "GAP-122", "GAP-125"],
          },
          productionBoundary: { localReleaseFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantIdEchoed: false,
        persistence: "local-fallback",
        release: buildSafeReleaseCandidate(releaseCandidate),
        responseProjection: {
          tenantIdEchoed: false,
          releaseCandidateIdEchoed: false,
          releaseRecordIdEchoed: false,
          commitShaEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        approval: { state: approvalState, membershipLookup: membershipMetadata },
        concurrency: buildOptimisticConcurrencyMetadata({ expectedVersion: expectedVersionHeader, currentVersion: input.version }),
        orchestration: buildReleaseWorkflowOrchestrationMetadata({ approvalState, channel: input.channel }),
        artifactPaths: releasePersistenceRbacArtifactPaths,
        boundary: "Local fallback mode.",
      },
      { status: 201, headers: noStoreHeaders },
    );
  }

  try {
    const persistedChannel = normalizeDbChannel(input.channel);
    const idempotencyKey =
      request.headers.get("idempotency-key") ??
      (typeof rawInput.idempotencyKey === "string" && rawInput.idempotencyKey.trim() ? rawInput.idempotencyKey.trim() : null) ??
      buildReleaseIdempotencyKey("release-create", [tenantId, input.version, persistedChannel]);
    const persisted = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-release-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-release-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/releases",
            action: "release:create",
            version: input.version,
            channel: input.channel,
            persistedChannel,
            commitShaHash: input.commitSha ? selectorHash(input.commitSha) : null,
            rawCommitShaStored: false,
            approvalState,
            membershipLookup: membershipMetadata,
            rawProviderPayloadStored: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/releases",
            action: "release:create",
            version: input.version,
            channel: input.channel,
            persistedChannel,
            commitShaHash: input.commitSha ? selectorHash(input.commitSha) : null,
            rawCommitShaStored: false,
            approvalState,
            membershipLookup: membershipMetadata,
            replayObserved: true,
            rawProviderPayloadStored: false,
          }),
        },
        select: { id: true, key: true },
      });

      const existingVersion = await tx.releaseRecord.findFirst({
        where: { tenantId, version: input.version },
        select: { id: true, version: true },
      });
      const concurrency = buildOptimisticConcurrencyMetadata({ expectedVersion: expectedVersionHeader, currentVersion: existingVersion?.version ?? null, recordId: existingVersion?.id ?? null });
      if (concurrency.conflict) {
        throw Object.assign(new Error("RELEASE_CONCURRENCY_CONFLICT"), { code: "RELEASE_CONCURRENCY_CONFLICT", concurrency });
      }
      const created = await tx.releaseRecord.create({
    data: {
      tenantId,
      releasedByUserId: actor.actorUserId,
      version: input.version,
      channel: persistedChannel,
      commitSha: input.commitSha ?? null,
      notes: input.notes,
      migrationVersion: input.migrationVersion ?? null,
      mobileRuntimeVersion: input.mobileRuntimeVersion ?? null,
    },
      });
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "release:create",
          entityType: "ReleaseRecord",
          entityId: created.id,
          metadata: {
            version: input.version,
            channel: input.channel,
            source: "dashboard-api",
            approvalState,
            membershipLookup: membershipMetadata,
            concurrency,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            releaseRecordPersisted: true,
            internalPersistenceIdsStored: false,
            orchestration: buildReleaseWorkflowOrchestrationMetadata({ approvalState, channel: input.channel }),
            artifactPaths: releasePersistenceRbacArtifactPaths,
          },
        },
      });
      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-release-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            releasePersisted: true,
            auditLogged: true,
            releaseRecordIdEchoed: false,
            auditIdEchoed: false,
            internalPersistenceIdsEchoed: false,
            internalPersistenceIdsStored: false,
            version: input.version,
            channel: input.channel,
            persistedChannel,
            approvalState,
            concurrencyConflict: false,
            rawProviderPayloadStored: false,
          }),
        },
        select: { id: true },
      });
      return { created, audit, concurrency, idempotency };
    });

    const warning = input.channel === "staging" ? `Staging channel writes are persisted as ${STAGING_PERSISTENCE_CHANNEL} in ReleaseRecord until a native staging enum exists.` : undefined;

    return NextResponse.json({
      ok: true,
      source: actor.source,
      persistence: "database",
      release: {
        ...buildSafeReleaseCandidate(releaseCandidate),
        releasePersisted: true,
        recordIdEchoed: false,
        releaseRecordIdEchoed: false,
        commitShaEchoed: false,
        persistedAt: persisted.created.createdAt.toISOString(),
      },
      auditLogged: true,
      idempotencyRecorded: true,
      auditIdEchoed: false,
      idempotencyKeyIdEchoed: false,
      internalPersistenceIdsEchoed: false,
      responseProjection: {
        tenantIdEchoed: false,
        releaseCandidateIdEchoed: false,
        releaseRecordIdEchoed: false,
        commitShaEchoed: false,
        internalPersistenceIdsEchoed: false,
      },
      approval: { state: approvalState, membershipLookup: membershipMetadata },
      membershipLookup: membershipMetadata,
      concurrency: persisted.concurrency,
      orchestration: buildReleaseWorkflowOrchestrationMetadata({ approvalState, channel: input.channel }),
      artifactPaths: releasePersistenceRbacArtifactPaths,
      rollback: createRollbackPlan(releaseCandidate, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(releaseCandidate),
      ...(warning ? { warning } : {}),
      boundary: "Release create path persists idempotency-backed candidate and audit metadata under tenant and actor context; deployment automation remains external.",
    }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            responseProjection: {
              tenantIdEchoed: false,
              releaseCandidateIdEchoed: false,
              releaseRecordIdEchoed: false,
              commitShaEchoed: false,
              internalPersistenceIdsEchoed: false,
            },
            error: {
              code: "PROVIDER_RELEASE_PERSISTENCE_NOT_CONFIGURED",
              message: "Production release writes require the dashboard database connection; API-boundary-only release drafts are disabled.",
              gapIds: ["GAP-015", "GAP-088", "GAP-122", "GAP-125"],
            },
            productionBoundary: { localReleaseFallbackDisabled: true },
          },
          { status: 503, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          source: actor.source,
          tenantIdEchoed: false,
          persistence: "local-fallback",
          release: buildSafeReleaseCandidate(releaseCandidate),
          responseProjection: {
            tenantIdEchoed: false,
            releaseCandidateIdEchoed: false,
            releaseRecordIdEchoed: false,
            commitShaEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          warning: "Database unavailable; draft persisted only in API boundary.",
        },
        { status: 201, headers: noStoreHeaders },
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "RELEASE_CONCURRENCY_CONFLICT") {
      return NextResponse.json(
        { ok: false, error: { code: "RELEASE_CONCURRENCY_CONFLICT", message: "Release candidate changed before approval/orchestration." }, concurrency: (error as { concurrency?: unknown }).concurrency },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { ok: false, error: { code: "RELEASE_UNIQUENESS_CONFLICT", message: "A release with that version already exists for this tenant." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  let membershipLookup;
  try {
    membershipLookup = await assertPermissionWithTenantMembership(actor, "release:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to request release rollback." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Release rollback request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const parsed = releaseRollbackInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Release rollback payload failed validation.", issues: parsed.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const tenantId = input.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot request release rollback for a different tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const rollbackSource = createReleaseCandidate({
    version: input.fromVersion,
    channel: input.channel,
    surfaces: ["web", "dashboard", "mobile", "database"],
    commitSha: `rollback-source-${input.fromVersion}`,
    releaseNotes: [input.reason],
    createdBy: "dashboard-operator",
    createdAt: new Date().toISOString(),
  });
  const rollbackPlan = createRollbackPlan(rollbackSource, input.targetVersion);
  const membershipMetadata = buildTenantMembershipLookupMetadata({ ...membershipLookup, actorSource: membershipLookup.source });
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    input.idempotencyKey ??
    buildReleaseIdempotencyKey("release-rollback", [tenantId, input.channel, input.fromVersion, input.targetVersion]);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: {
            tenantIdEchoed: false,
            sourceReleaseRecordIdEchoed: false,
            auditIdEchoed: false,
            idempotencyKeyIdEchoed: false,
            providerRollbackPayloadEchoed: false,
            rawIdempotencyResultEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          error: {
            code: "PROVIDER_RELEASE_ROLLBACK_NOT_CONFIGURED",
            message: "Production rollback requests require DB-backed dashboard auth, idempotency, audit persistence, and protected-environment provider evidence; local fallback rollback intents are disabled.",
            gapIds: ["GAP-038", "GAP-088", "GAP-093", "GAP-094"],
          },
          productionBoundary: { localReleaseRollbackFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        persistence: "local-fallback",
        dashboardMutationAction: "rollback_release",
        rollback: rollbackPlan,
        providerRollbackExecuted: false,
        deploymentJobTriggered: false,
        protectedEnvironmentTouched: false,
        responseProjection: {
          tenantIdEchoed: false,
          sourceReleaseRecordIdEchoed: false,
          auditIdEchoed: false,
          idempotencyKeyIdEchoed: false,
          providerRollbackPayloadEchoed: false,
          rawIdempotencyResultEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        boundary: "Local fallback returns a rollback intent contract only; provider rollback execution remains externally gated.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const persisted = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-release-rollback", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-release-rollback",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/releases",
            action: "release:rollback:intent",
            fromVersion: input.fromVersion,
            targetVersion: input.targetVersion,
            channel: input.channel,
            providerRollbackExecuted: false,
            protectedEnvironmentTouched: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/releases",
            action: "release:rollback:intent",
            fromVersion: input.fromVersion,
            targetVersion: input.targetVersion,
            channel: input.channel,
            replayObserved: true,
            providerRollbackExecuted: false,
            protectedEnvironmentTouched: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });

      if (idempotency.status === "completed" && idempotency.result) {
        return { status: "replayed" as const, idempotency };
      }

      const sourceRecord = await tx.releaseRecord.findFirst({
        where: { tenantId, version: input.fromVersion, channel: normalizeDbChannel(input.channel) },
        select: { id: true, version: true, channel: true, commitSha: true, createdAt: true },
      });
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "release:rollback:intent",
          entityType: "ReleaseRecord",
          entityId: sourceRecord?.id ?? null,
          metadata: {
            source: "dashboard-api",
            dashboardMutationAction: "rollback_release",
            fromVersion: input.fromVersion,
            targetVersion: input.targetVersion,
            channel: input.channel,
            reason: input.reason,
            membershipLookup: membershipMetadata,
            rollbackPlan,
            sourceRecordFound: Boolean(sourceRecord),
            providerRollbackExecuted: false,
            deploymentJobTriggered: false,
            protectedEnvironmentTouched: false,
            providerEvidenceRequired: ["protected environment approval", "deployment rollback job", "post-rollback release health"],
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-release-rollback", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            auditLogged: true,
            sourceRecordFound: Boolean(sourceRecord),
            auditIdEchoed: false,
            sourceReleaseRecordIdEchoed: false,
            internalPersistenceIdsEchoed: false,
            internalPersistenceIdsStored: false,
            fromVersion: input.fromVersion,
            targetVersion: input.targetVersion,
            providerRollbackExecuted: false,
            deploymentJobTriggered: false,
            protectedEnvironmentTouched: false,
          }),
        },
        select: { id: true },
      });

      return { status: "created" as const, idempotency, audit, sourceRecord };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        persistence: "database",
        dashboardMutationAction: "rollback_release",
        idempotencyRecorded: true,
        idempotencyKeyIdEchoed: false,
        idempotencyReplay: persisted.status === "replayed",
        auditLogged: true,
        auditIdEchoed: false,
        internalPersistenceIdsEchoed: false,
        responseProjection: {
          tenantIdEchoed: false,
          sourceReleaseRecordIdEchoed: false,
          auditIdEchoed: false,
          idempotencyKeyIdEchoed: false,
          providerRollbackPayloadEchoed: false,
          rawIdempotencyResultEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
        rollback: rollbackPlan,
        providerRollbackExecuted: false,
        deploymentJobTriggered: false,
        protectedEnvironmentTouched: false,
        boundary: "Rollback intent is tenant-scoped, idempotency-backed, and audited locally; provider rollback execution remains externally gated.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          responseProjection: {
            tenantIdEchoed: false,
            sourceReleaseRecordIdEchoed: false,
            auditIdEchoed: false,
            idempotencyKeyIdEchoed: false,
            providerRollbackPayloadEchoed: false,
            rawIdempotencyResultEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
          error: { code: "DATABASE_UNAVAILABLE", message: "Release rollback intent requires the dashboard database connection." },
          gapIds: ["GAP-038", "GAP-088", "GAP-093", "GAP-094"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    throw error;
  }
}

