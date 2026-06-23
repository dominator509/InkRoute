import { prisma } from "@inkroute/db";
import { demoReleaseCandidate, createReleaseCandidate, createRollbackPlan, defaultFeatureFlags, evaluateFeatureFlags, buildReleaseHealthChecks, type FeatureFlagDefinition } from "@inkroute/releases";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse } from "next/server";
import { buildFeatureFlagContextFromRequest, resolveCachedFeatureFlagSnapshot } from "../../../../../lib/featureFlagRuntime";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

function normalizeDbReleaseChannel(channel: string): "development" | "preview" | "production" | "mobile-preview" | "mobile-production" {
  if (channel === "mobile_preview") return "mobile-preview";
  if (channel === "mobile_production") return "mobile-production";
  return channel === "development" || channel === "preview" || channel === "production" ? channel : "preview";
}

function mapDbReleaseToCandidate(release: {
  id: string;
  version: string;
  channel: string;
  commitSha: string | null;
  notes: string;
  createdAt: Date;
}) {
  const releaseNotes = release.notes ? release.notes.split("\n").slice(0, 8) : ["Persisted release record found in database."];
  return createReleaseCandidate({
    version: release.version,
    channel: normalizeDbReleaseChannel(release.channel),
    surfaces: ["web", "dashboard", "mobile", "database"],
    commitSha: release.commitSha ?? `release-${release.id}`,
    releaseNotes,
    gates: [
      {
        id: "database-persistence",
        label: "Release persistence",
        status: "pass",
        blocksProduction: false,
        evidence: "ReleaseRecord exists in tenant-scoped database table with audit metadata.",
        nextAction: "Add deploy/rollback provider execution once deployment jobs are provisioned.",
      },
    ],
    createdBy: "dashboard-operator",
    createdAt: release.createdAt.toISOString(),
  });
}

function isTenantScopeValue(value: string): value is "global" | "tenant" | "role" {
  return value === "global" || value === "tenant" || value === "role";
}

function extractReleaseBoundaryNotes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return items.length > 0 ? items : undefined;
}

async function resolveTenantScope(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
  }

  if (normalizedSlug === inkrouteDemoTenant.slug) {
    return { tenantId: inkrouteDemoTenant.id, source: "local-fallback" };
  }
  return null;
}

export async function GET(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const tenantResolution = await resolveTenantScope(tenantSlug);
  if (!tenantResolution) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Release health is unavailable for unknown tenant slug." } },
      { status: 404, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && tenantResolution.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_RELEASE_HEALTH_NOT_CONFIGURED",
          message: "Production release health requires tenant-scoped ReleaseRecord and FeatureFlag persistence; local fallback release health is disabled.",
          gapIds: ["GAP-015", "GAP-087", "GAP-090", "GAP-094"],
        },
        productionBoundary: {
          localReleaseHealthDisabled: true,
          requiredBeforeEnablement: [
            "tenant-scoped ReleaseRecord persistence",
            "tenant-scoped FeatureFlag persistence",
            "provider-backed release route smoke evidence",
            "release-governance CI artifact evidence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  try {
    const prismaRuntime = prisma as unknown as {
      releaseRecord: { findMany: (options: Record<string, unknown>) => Promise<readonly unknown[]> };
      featureFlag: { findMany: (options: Record<string, unknown>) => Promise<readonly unknown[]> };
    };
    const [releaseRecordsRaw, featureFlagsRaw] = await Promise.all([
      prismaRuntime.releaseRecord.findMany({
        where: { tenantId: tenantResolution.tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          version: true,
          channel: true,
          commitSha: true,
          notes: true,
          createdAt: true,
        },
      }),
      prismaRuntime.featureFlag.findMany({
        where: { OR: [{ tenantId: tenantResolution.tenantId }, { tenantId: null }] },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const releaseRecords = releaseRecordsRaw as Array<{ id: string; version: string; channel: string; commitSha: string | null; notes: string; createdAt: Date }>;
    const featureFlags = featureFlagsRaw as Array<{
      key: string;
      description: string;
      scope: "global" | "tenant" | "user";
      enabled: boolean;
      rules: Record<string, unknown> | null;
    }>;

    const mergedDefinitions: FeatureFlagDefinition[] = defaultFeatureFlags.map((definition) => ({ ...definition }));
    const byKey = new Map<string, FeatureFlagDefinition>(mergedDefinitions.map((definition) => [definition.key, definition]));

    for (const entry of featureFlags) {
      const base = byKey.get(entry.key) ?? {
        key: entry.key,
        description: entry.description,
        scope: entry.scope === "user" ? "role" : "tenant",
        defaultEnabled: false,
        owner: "releases",
        environments: ["development", "preview", "staging", "production", "mobile-preview", "mobile-production"],
        auditNote: "Tenant override from persisted flag store.",
      };
      const rules = (entry.rules ?? {}) as Record<string, unknown>;
      const tenantAllowlist = extractReleaseBoundaryNotes(rules.tenantAllowlist);
      const roleAllowlist = extractReleaseBoundaryNotes(rules.roleAllowlist);
      const scope = entry.scope === "global" || entry.scope === "tenant" || entry.scope === "user" ? entry.scope : "tenant";
      const merged: FeatureFlagDefinition = {
        ...base,
        description: entry.description,
        scope: isTenantScopeValue(scope === "user" ? "role" : scope) ? (scope === "user" ? "role" : scope) : "tenant",
        defaultEnabled: entry.enabled,
        ...(tenantAllowlist ? { tenantAllowlist } : {}),
        ...(roleAllowlist ? { roleAllowlist } : {}),
      };
      byKey.set(entry.key, merged);
    }

    const definitions = Array.from(byKey.values());
    const previewDecisionContext = buildFeatureFlagContextFromRequest({
      tenantId: tenantResolution.tenantId,
      headers: request.headers,
      environment: "preview",
      defaultRole: "public",
    });
    const productionDecisionContext = buildFeatureFlagContextFromRequest({
      tenantId: tenantResolution.tenantId,
      headers: request.headers,
      environment: "production",
      defaultRole: "public",
    });
    const runtimeFeatureFlags = resolveCachedFeatureFlagSnapshot(definitions, productionDecisionContext);
    const release = releaseRecords[0] ? mapDbReleaseToCandidate(releaseRecords[0]) : demoReleaseCandidate;
    const rollback = createRollbackPlan(release, "0.11.0-phase11");
    const healthChecks = buildReleaseHealthChecks(release);

    return NextResponse.json(
      {
        tenantSlug,
        tenantId: tenantResolution.tenantId,
        source: tenantResolution.source,
        status: "authenticated-readiness-boundary",
        release,
        rollback,
        healthChecks,
        publicFeatureSnapshot: evaluateFeatureFlags(definitions, previewDecisionContext).filter((flag) =>
          ["nomad_mode.enabled", "booking.deposit_required", "ai_assistants.enabled"].includes(flag.key),
        ),
        decisions: runtimeFeatureFlags.decisions.slice(0, 25),
        runtimeFeatureFlags: {
          providerRuntimeGates: runtimeFeatureFlags.providerRuntimeGates,
          providerWorkerKillSwitches: runtimeFeatureFlags.providerWorkerKillSwitches,
          cache: runtimeFeatureFlags.cache,
          rollout: runtimeFeatureFlags.rollout,
          context: {
            tenantId: productionDecisionContext.tenantId,
            role: productionDecisionContext.role,
            environment: productionDecisionContext.environment,
            stableIdentifier: productionDecisionContext.stableIdentifier,
            authDerived: productionDecisionContext.role !== "public",
          },
          tenantSafePublicPayload: runtimeFeatureFlags.tenantSafePublicPayload,
          artifactPaths: runtimeFeatureFlags.artifactPaths,
        },
        releaseRecords: releaseRecords.map((entry) => ({
          id: entry.id,
          version: entry.version,
          channel: normalizeDbReleaseChannel(entry.channel),
          commitSha: entry.commitSha ?? null,
          createdAt: entry.createdAt.toISOString(),
        })),
        boundary: "Public release health now reads tenant-scoped ReleaseRecord and FeatureFlag rows when available and redacts sensitive deploy metadata.",
        tenantScope: tenantResolution.source,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROVIDER_RELEASE_HEALTH_NOT_CONFIGURED",
            message: "Production release health requires database-backed ReleaseRecord and FeatureFlag reads; local release-health fallback is disabled until database-backed release evidence is captured.",
            gapIds: ["GAP-015", "GAP-087", "GAP-090", "GAP-094"],
          },
          productionBoundary: {
            localReleaseHealthFallbackDisabled: true,
            requiredBeforeEnablement: [
              "ReleaseRecord and FeatureFlag database reads",
              "tenant-safe public feature snapshots",
              "provider route integration evidence",
              "release-health envelope CI artifact",
            ],
          },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        tenantSlug,
        tenantId: tenantResolution.tenantId,
        source: tenantResolution.source,
        status: "local-preview",
        release: demoReleaseCandidate,
        healthChecks: buildReleaseHealthChecks(demoReleaseCandidate),
        publicFeatureSnapshot: defaultFeatureFlags
          .filter((flag) => ["nomad_mode.enabled", "booking.deposit_required"].includes(flag.key))
          .map((flag) => ({
            key: flag.key,
            enabled: flag.defaultEnabled,
            reason: "local-fallback",
            scope: flag.scope,
            auditNote: flag.auditNote,
          })),
        boundary: "Public release health demo uses scoped fallback only until database availability is restored.",
      },
      { headers: noStoreHeaders },
    );
  }
}

