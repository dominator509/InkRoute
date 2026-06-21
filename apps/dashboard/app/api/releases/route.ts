import { NextRequest, NextResponse } from "next/server";
import { createReleaseCandidate, createRollbackPlan, demoReleaseCandidate, buildReleaseHealthChecks } from "@inkroute/releases";
import { releaseCreateInputSchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { assertPermission, assertPermissionWithTenantMembership, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";
import {
  buildOptimisticConcurrencyMetadata,
  buildReleaseWorkflowOrchestrationMetadata,
  buildTenantMembershipLookupMetadata,
  releasePersistenceRbacArtifactPaths,
  resolveReleaseApprovalState,
} from "../../../lib/releaseControlPlane";

type PersistedReleaseSummary = {
  id: string;
  version: string;
  channel: "development" | "preview" | "production" | "mobile-preview" | "mobile-production";
  commitSha: string | null;
  createdAt: string;
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

function toReleaseSummary(record: { id: string; version: string; channel: string; commitSha: string | null; createdAt: Date }): PersistedReleaseSummary {
  return {
    id: record.id,
    version: record.version,
    channel: normalizeDisplayChannel(record.channel),
    commitSha: record.commitSha,
    createdAt: record.createdAt.toISOString(),
  };
}

function buildReleaseFallback(actor: ReturnType<typeof resolveDashboardActor>) {
  return {
    ok: true,
    source: actor.source,
    tenantId: actor.tenantId,
    status: "demo-fallback",
    persistence: "local-fallback",
    release: createReleaseCandidate({
      version: demoReleaseCandidate.version,
      channel: demoReleaseCandidate.channel,
      surfaces: ["web", "dashboard", "mobile", "database"],
      commitSha: demoReleaseCandidate.commitSha,
      releaseNotes: ["Demo fallback route path is active without database persistence."],
      createdBy: "dashboard-demo",
      createdAt: demoReleaseCandidate.createdAt,
      gates: demoReleaseCandidate.gates,
      migrations: demoReleaseCandidate.migrations,
    }),
    releases: [toReleaseSummary({ id: "demo", version: demoReleaseCandidate.version, channel: "preview", commitSha: demoReleaseCandidate.commitSha, createdAt: new Date() })],
    rollback: createRollbackPlan(demoReleaseCandidate, "0.11.0-phase11"),
    healthChecks: buildReleaseHealthChecks(demoReleaseCandidate),
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

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query release records for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
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
      ? mapRecordToCandidate({ ...result.releases[0], createdAt: new Date(result.releases[0].createdAt) })
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
      tenantId,
      actorRole: membershipLookup.actorRole,
      membershipLookup,
      status: "authenticated",
      release,
      releases: result.releases.map(toReleaseSummary),
      rollback: createRollbackPlan(release, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(release),
      auditId: result.audit.id,
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
          tenantId,
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
          tenantId,
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
        tenantId: actor.tenantId,
        persistence: "local-fallback",
        release: releaseCandidate,
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
    const persisted = await prisma.$transaction(async (tx) => {
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
            orchestration: buildReleaseWorkflowOrchestrationMetadata({ approvalState, channel: input.channel, recordId: created.id }),
            artifactPaths: releasePersistenceRbacArtifactPaths,
          },
        },
      });
      return { created, audit, concurrency };
    });

    const warning = input.channel === "staging" ? `Staging channel writes are persisted as ${STAGING_PERSISTENCE_CHANNEL} in ReleaseRecord until a native staging enum exists.` : undefined;

    return NextResponse.json({
      ok: true,
      source: actor.source,
      tenantId,
      persistence: "database",
      release: {
        ...releaseCandidate,
        recordId: persisted.created.id,
        persistedAt: persisted.created.createdAt.toISOString(),
      },
      auditId: persisted.audit.id,
      approval: { state: approvalState, membershipLookup: membershipMetadata },
      membershipLookup: membershipMetadata,
      concurrency: persisted.concurrency,
      orchestration: buildReleaseWorkflowOrchestrationMetadata({ approvalState, channel: input.channel, recordId: persisted.created.id }),
      artifactPaths: releasePersistenceRbacArtifactPaths,
      rollback: createRollbackPlan(releaseCandidate, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(releaseCandidate),
      ...(warning ? { warning } : {}),
      boundary: "Release create path persists candidate and audit metadata under tenant and actor context.",
    }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            source: actor.source,
            tenantId,
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
        { ok: true, source: actor.source, tenantId, persistence: "local-fallback", release: releaseCandidate, warning: "Database unavailable; draft persisted only in API boundary." },
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

