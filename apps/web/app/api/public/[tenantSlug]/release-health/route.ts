import { prisma } from "@inkroute/db";
import { demoReleaseCandidate, createReleaseCandidate, createRollbackPlan, defaultFeatureFlags, evaluateFeatureFlags, buildReleaseHealthChecks, type FeatureFlagDefinition } from "@inkroute/releases";
import { inkrouteDemoTenant } from "@inkroute/config";
import { NextResponse } from "next/server";

type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

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
    const tenant = await prisma.tenant.findUnique({
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

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const tenantResolution = await resolveTenantScope(tenantSlug);
  if (!tenantResolution) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Release health is unavailable for unknown tenant slug." } },
      { status: 404 },
    );
  }

  try {
    const [releaseRecords, featureFlags] = await Promise.all([
      prisma.releaseRecord.findMany({
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
      prisma.featureFlag.findMany({
        where: { OR: [{ tenantId: tenantResolution.tenantId }, { tenantId: null }] },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

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
    const previewDecisionContext = {
      tenantId: tenantResolution.tenantId,
      role: "owner",
      environment: "preview" as const,
      stableIdentifier: `${tenantResolution.tenantId}:public`,
    };
    const productionDecisionContext = {
      tenantId: tenantResolution.tenantId,
      role: "owner",
      environment: "production" as const,
      stableIdentifier: `${tenantResolution.tenantId}:public`,
    };
    const release = releaseRecords[0] ? mapDbReleaseToCandidate(releaseRecords[0]) : demoReleaseCandidate;
    const rollback = createRollbackPlan(release, "0.11.0-phase11");
    const healthChecks = buildReleaseHealthChecks(release);

    return NextResponse.json({
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
      decisions: evaluateFeatureFlags(definitions, productionDecisionContext).slice(0, 25),
      releaseRecords: releaseRecords.map((entry) => ({
        id: entry.id,
        version: entry.version,
        channel: normalizeDbReleaseChannel(entry.channel),
        commitSha: entry.commitSha ?? null,
        createdAt: entry.createdAt.toISOString(),
      })),
      boundary: "Public release health now reads tenant-scoped ReleaseRecord and FeatureFlag rows when available and redacts sensitive deploy metadata.",
      tenantScope: tenantResolution.source,
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }

    return NextResponse.json({
      tenantSlug,
      tenantId: tenantResolution.tenantId,
      source: tenantResolution.source,
      status: "scaffolded",
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
    });
  }
}
