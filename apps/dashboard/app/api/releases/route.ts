import { NextRequest, NextResponse } from "next/server";
import { createReleaseCandidate, createRollbackPlan, demoReleaseCandidate, buildReleaseHealthChecks } from "@inkroute/releases";
import { releaseCreateInputSchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

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
  try {
    assertPermission(actor, "release:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read release records." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    return NextResponse.json(buildReleaseFallback(actor));
  }

  try {
    const releases = await prisma.releaseRecord.findMany({
      where: { tenantId: actor.tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, version: true, channel: true, commitSha: true, notes: true, createdAt: true },
    });

    const release = releases[0]
      ? mapRecordToCandidate({ ...releases[0], createdAt: new Date(releases[0].createdAt) })
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
      tenantId: actor.tenantId,
      actorRole: actor.role,
      status: "authenticated",
      release,
      releases: releases.map(toReleaseSummary),
      rollback: createRollbackPlan(release, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(release),
      boundary: "Release records are now tenant-scoped and persisted when database is reachable; deployment automation remains external in this pass.",
      gapIds: ["GAP-015", "GAP-122", "GAP-125"],
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    return NextResponse.json(buildReleaseFallback(actor));
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "release:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to create release records." } }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Release request body must be valid JSON." } }, { status: 400 });
  }

  const parsed = releaseCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Release payload failed validation.", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const tenantId = input.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot write release records for a different tenant." } }, { status: 403 });
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

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      { ok: true, source: actor.source, tenantId: actor.tenantId, persistence: "local-fallback", release: releaseCandidate, boundary: "Local fallback mode." },
      { status: 201 },
    );
  }

  try {
    const persistedChannel = normalizeDbChannel(input.channel);
    const persisted = await prisma.$transaction(async (tx) => {
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
          },
        },
      });
      return { created, audit };
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
      rollback: createRollbackPlan(releaseCandidate, "0.11.0-phase11"),
      healthChecks: buildReleaseHealthChecks(releaseCandidate),
      ...(warning ? { warning } : {}),
      boundary: "Release create path persists candidate and audit metadata under tenant and actor context.",
    }, { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { ok: true, source: actor.source, tenantId, persistence: "local-fallback", release: releaseCandidate, warning: "Database unavailable; draft persisted only in API boundary." },
        { status: 201 },
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { ok: false, error: { code: "RELEASE_UNIQUENESS_CONFLICT", message: "A release with that version already exists for this tenant." } },
        { status: 409 },
      );
    }

    throw error;
  }
}
