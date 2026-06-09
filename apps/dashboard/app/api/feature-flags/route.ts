import { NextRequest, NextResponse } from "next/server";
import { defaultFeatureFlags, evaluateFeatureFlags, type FeatureFlagDefinition } from "@inkroute/releases";
import { featureFlagPatchInputSchema } from "@inkroute/validators";
import { prisma } from "@inkroute/db";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";
import {
  buildOptimisticConcurrencyMetadata,
  buildTenantMembershipLookupMetadata,
  releasePersistenceRbacArtifactPaths,
} from "../../../lib/releaseControlPlane";

type FeatureFlagChannel = "development" | "preview" | "staging" | "production" | "mobile-preview" | "mobile-production";
type DbFeatureScope = "global" | "tenant" | "user";

const allowedChannels = new Set<FeatureFlagChannel>(["development", "preview", "staging", "production", "mobile-preview", "mobile-production"]);
const providerGatedFeature: Partial<Record<string, string>> = {
  "sms_notifications.enabled": "SMS provider credentials must be configured before enabling this flag.",
  "mobile.ota_updates.enabled": "EAS project/token context must be configured before enabling this flag.",
};

type FlagDecisionContext = {
  tenantId: string;
  role: string;
  environment: FeatureFlagChannel;
  stableIdentifier: string;
};

function normalizeEnvironment(value: string | null): FeatureFlagChannel {
  const normalized = value?.toLowerCase().trim();
  if (normalized === "mobile_preview") return "mobile-preview";
  if (normalized === "mobile_production") return "mobile-production";
  return allowedChannels.has(normalized as FeatureFlagChannel) ? (normalized as FeatureFlagChannel) : "preview";
}

function normalizeScope(scope: DbFeatureScope): FeatureFlagDefinition["scope"] {
  return scope === "user" ? "role" : scope;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function normalizeStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeEnvironments(value: unknown): readonly FeatureFlagChannel[] {
  const list = normalizeStringArray(value);
  if (!list) return ["development", "preview", "production", "mobile-preview", "mobile-production", "staging"];
  return list
    .map((entry) => normalizeEnvironment(entry))
    .filter((entry): entry is FeatureFlagChannel => allowedChannels.has(entry))
    .filter((entry, index, source) => source.indexOf(entry) === index);
}

function mergeDefinitionWithRecord(
  base: FeatureFlagDefinition,
  record: {
    key: string;
    scope: DbFeatureScope;
    enabled: boolean;
    description: string | null;
    rules: unknown;
  },
): FeatureFlagDefinition {
  const rules = asRecord(record.rules);
  const tenantAllowlist = normalizeStringArray(rules.tenantAllowlist);
  const roleAllowlist = normalizeStringArray(rules.roleAllowlist);
  const rolloutPercentage = normalizeNumber(rules.rolloutPercentage);
  return {
    key: record.key,
    description: typeof rules.description === "string" && rules.description.trim() ? rules.description : record.description ?? base.description,
    scope: normalizeScope(record.scope),
    defaultEnabled: typeof record.enabled === "boolean" ? record.enabled : base.defaultEnabled,
    environments: normalizeEnvironments(rules.environments),
    ...(base.owner ? { owner: base.owner } : {}),
    ...(tenantAllowlist ? { tenantAllowlist } : base.tenantAllowlist ? { tenantAllowlist: base.tenantAllowlist } : {}),
    ...(roleAllowlist ? { roleAllowlist } : base.roleAllowlist ? { roleAllowlist: base.roleAllowlist } : {}),
    ...(typeof rules.killSwitch === "boolean" ? { killSwitch: rules.killSwitch } : {}),
    ...(typeof rules.expiresAt === "string" ? { expiresAt: rules.expiresAt } : {}),
    ...(typeof rolloutPercentage === "number" ? { rolloutPercentage } : {}),
    ...(typeof rolloutPercentage !== "number" && typeof base.rolloutPercentage === "number" ? { rolloutPercentage: base.rolloutPercentage } : {}),
    auditNote: typeof rules.auditNote === "string" && rules.auditNote.trim() ? rules.auditNote : base.auditNote,
    owner: base.owner,
  };
}

type FeatureFlagRulesInput = Exclude<Parameters<(typeof prisma)["featureFlag"]["upsert"]>[0]["create"]["rules"], undefined>;

function buildDefinitionFallback(key: string): FeatureFlagDefinition {
  return {
    key,
    description: "Tenant-defined feature flag.",
    scope: "tenant",
    defaultEnabled: false,
    owner: "tenant",
    environments: ["development", "preview", "production", "mobile-preview", "mobile-production", "staging"],
    auditNote: "Tenant override persisted in DB without a default package definition.",
  };
}

function normalizeRulesInput(inputRules: unknown): Record<string, unknown> {
  const output = asRecord(inputRules);
  const normalized: Record<string, unknown> = {};
  const tenantAllowlist = normalizeStringArray(output.tenantAllowlist);
  const roleAllowlist = normalizeStringArray(output.roleAllowlist);
  const environments = normalizeStringArray(output.environments);

  if (typeof output.auditNote === "string" && output.auditNote.trim()) {
    normalized.auditNote = output.auditNote.trim();
  }
  if (tenantAllowlist) normalized.tenantAllowlist = tenantAllowlist;
  if (roleAllowlist) normalized.roleAllowlist = roleAllowlist;
  if (environments) normalized.environments = environments;
  if (typeof output.rolloutPercentage !== "undefined") normalized.rolloutPercentage = normalizeNumber(output.rolloutPercentage);
  if (typeof output.killSwitch === "boolean") normalized.killSwitch = output.killSwitch;
  if (typeof output.expiresAt === "string") normalized.expiresAt = output.expiresAt;
  return normalized;
}

function buildDefinitionsForTenant(tenantId: string, client: Pick<typeof prisma, "featureFlag"> = prisma) {
  const baseDefinitions = new Map<string, FeatureFlagDefinition>();
  defaultFeatureFlags.forEach((definition) => {
    baseDefinitions.set(definition.key, definition);
  });

  return async () => {
    const rows = await client.featureFlag.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      orderBy: { updatedAt: "desc" },
      select: { key: true, scope: true, enabled: true, description: true, rules: true },
    });

    const merged = new Map(baseDefinitions);
    for (const row of rows) {
      const base = merged.get(row.key) ?? buildDefinitionFallback(row.key);
      merged.set(row.key, mergeDefinitionWithRecord(base, row));
    }

    return Array.from(merged.values()).sort((a, b) => a.key.localeCompare(b.key));
  };
}

function buildSafeResponseDefinitions(definitions: FeatureFlagDefinition[]) {
  return definitions.map((definition) => ({
    key: definition.key,
    description: definition.description,
    scope: definition.scope,
    defaultEnabled: definition.defaultEnabled,
    owner: definition.owner,
    environments: definition.environments,
    tenantAllowlist: definition.tenantAllowlist ?? [],
    roleAllowlist: definition.roleAllowlist ?? [],
    rolloutPercentage: definition.rolloutPercentage,
    killSwitch: definition.killSwitch,
    expiresAt: definition.expiresAt,
    auditNote: definition.auditNote,
  }));
}

function isAllowedToEnableFlag(key: string): string | undefined {
  if (!(providerGatedFeature as Record<string, string>)[key]) return undefined;
  return providerGatedFeature[key];
}

function buildDecisionContext(actorRole: string, tenantId: string, environment: FeatureFlagChannel, role?: string | null): FlagDecisionContext {
  const safeRole = role || actorRole;
  return {
    tenantId,
    role: safeRole,
    environment,
    stableIdentifier: `${tenantId}:${safeRole}`,
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "release:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read feature flags." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query feature flags for another tenant." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const environment = normalizeEnvironment(params.get("environment"));
  const role = params.get("role");
  const context = buildDecisionContext(actor.role, tenantId, environment, role);

  if (actor.source === "local-fallback") {
    const decisions = evaluateFeatureFlags(defaultFeatureFlags, context);
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        actorRole: actor.role,
        persistence: "local-fallback",
        environment,
        definitions: buildSafeResponseDefinitions([...defaultFeatureFlags]),
        decisions,
        cache: {
          generatedAt: new Date().toISOString(),
          ttlSeconds: 15,
          cacheKey: `feature-flags:${tenantId}:${environment}:fallback`,
        },
        boundary: "Local fallback mode: flag overrides are not persisted and use package defaults.",
        gapIds: ["GAP-088", "GAP-090", "GAP-093"],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const definitions = await buildDefinitionsForTenant(tenantId, tx)();
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "feature_flag:read:list",
          entityType: "FeatureFlag",
          metadata: {
            source: "dashboard-api",
            environment,
            role: role ?? actor.role,
            definitionCount: definitions.length,
            redactedFields: ["rules.secret", "rules.token", "rules.providerKey", "rules.privateRolloutNotes"],
          },
        },
        select: { id: true },
      });
      return { definitions, audit };
    });
    const definitions = result.definitions;
    const decisions = evaluateFeatureFlags(definitions, context);
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        actorRole: actor.role,
        persistence: "database",
        environment,
        definitions: buildSafeResponseDefinitions(definitions),
        decisions,
        auditId: result.audit.id,
        cache: {
          generatedAt: new Date().toISOString(),
          ttlSeconds: 60,
          cacheKey: `feature-flags:${tenantId}:${environment}:v1`,
        },
        gapIds: ["GAP-088", "GAP-090", "GAP-093"],
        boundary: "Feature flag reads are tenant-scoped, no-store, audit-logged, and include DB overrides plus release-aware decision output.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      throw error;
    }
    const definitions = [...defaultFeatureFlags];
    const fallbackContext = buildDecisionContext(actor.role, tenantId, environment, role);
    const decisions = evaluateFeatureFlags(definitions, fallbackContext);
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        actorRole: actor.role,
        persistence: "local-fallback",
        environment,
        definitions: buildSafeResponseDefinitions(definitions),
        decisions,
        cache: {
          generatedAt: new Date().toISOString(),
          ttlSeconds: 15,
          cacheKey: `feature-flags:${tenantId}:${environment}:fallback`,
        },
        warning: "Database unavailable; default feature definitions returned as fallback.",
        gapIds: ["GAP-088", "GAP-090", "GAP-093"],
        boundary: "Database fallback used; DB overrides unavailable in this response.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "settings:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to modify feature flags." } }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Feature flag body must be valid JSON." } }, { status: 400 });
  }

  const parsed = featureFlagPatchInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Feature flag payload did not pass schema.", issues: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const expectedVersionHeader = request.headers.get("x-feature-flag-expected-version");
  const tenantId = input.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot update feature flags for a different tenant." } }, { status: 403 });
  }

  const providerBlocking = isAllowedToEnableFlag(input.key);
  if (input.enabled && providerBlocking && actor.source !== "local-fallback") {
    const hasCredentials = Boolean(process.env.SENDGRID_API_KEY || process.env.SMS_PROVIDER_ENABLED || process.env.EAS_TOKEN);
    if (!hasCredentials) {
      return NextResponse.json({ ok: false, error: { code: "PROVIDER_CREDENTIALS_REQUIRED", message: providerBlocking } }, { status: 409 });
    }
  }

  const rules = normalizeRulesInput(input.rules);
  const persistedRules = rules as FeatureFlagRulesInput;

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        featureFlag: {
          key: input.key,
          scope: input.scope,
          enabled: input.enabled,
          description: input.description,
          rules: persistedRules,
        },
        concurrency: buildOptimisticConcurrencyMetadata({ expectedVersion: expectedVersionHeader, currentVersion: input.key }),
        membershipLookup: buildTenantMembershipLookupMetadata({ actorSource: actor.source, actorRole: actor.role, tenantId }),
        artifactPaths: releasePersistenceRbacArtifactPaths,
        warning: "Local fallback mode: flag mutation is not persisted in database mode.",
        gapIds: ["GAP-088", "GAP-090", "GAP-093"],
      },
      { status: 201 },
    );
  }

  try {
    const persisted = await prisma.$transaction(async (tx) => {
      const existing = await tx.featureFlag.findUnique({
        where: { tenantId_key: { tenantId, key: input.key } },
        select: { id: true, scope: true, enabled: true, description: true },
      });
      const concurrency = buildOptimisticConcurrencyMetadata({ expectedVersion: expectedVersionHeader, currentVersion: existing?.id ?? null, recordId: existing?.id ?? null });
      if (concurrency.conflict) {
        throw Object.assign(new Error("FEATURE_FLAG_CONCURRENCY_CONFLICT"), { code: "FEATURE_FLAG_CONCURRENCY_CONFLICT", concurrency });
      }
      const membershipLookup = buildTenantMembershipLookupMetadata({ actorSource: actor.source, actorRole: actor.role, tenantId });
      const featureFlag = await tx.featureFlag.upsert({
        where: { tenantId_key: { tenantId, key: input.key } },
        update: {
          enabled: input.enabled,
          scope: input.scope,
          description: input.description ?? existing?.description ?? "Tenant-defined feature flag.",
          rules: persistedRules,
        },
        create: {
          tenantId,
          key: input.key,
          scope: input.scope,
          enabled: input.enabled,
          description: input.description ?? "Tenant-defined feature flag.",
          rules: persistedRules,
        },
      });
      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "feature_flag:update",
          entityType: "FeatureFlag",
          entityId: featureFlag.id,
          metadata: {
            key: input.key,
            enabled: input.enabled,
            scope: input.scope,
            source: "dashboard-api",
            previousEnabled: existing?.enabled ?? null,
            previousScope: existing?.scope ?? null,
            concurrency,
            membershipLookup,
            approvalState: "settings-write-approved",
            orchestrationHook: "feature-flag-runtime-invalidation-pending",
            artifactPaths: releasePersistenceRbacArtifactPaths,
          },
        },
      });
      return { featureFlag, audit, existing, concurrency, membershipLookup };
    });

    return NextResponse.json({
      ok: true,
      source: actor.source,
      tenantId,
      persistence: "database",
      featureFlag: {
        key: persisted.featureFlag.key,
        enabled: persisted.featureFlag.enabled,
        scope: persisted.featureFlag.scope,
        description: persisted.featureFlag.description,
        rules: persisted.featureFlag.rules ?? rules,
      },
      auditId: persisted.audit.id,
      concurrency: persisted.concurrency,
      membershipLookup: persisted.membershipLookup,
      approval: { state: "settings-write-approved" },
      orchestration: { hook: "feature-flag-runtime-invalidation-pending", dispatchEnabled: process.env.RELEASE_GOVERNANCE_DISPATCH_ENABLED === "true" },
      artifactPaths: releasePersistenceRbacArtifactPaths,
      previous: persisted.existing
        ? {
            key: input.key,
            enabled: persisted.existing.enabled,
            scope: persisted.existing.scope,
          }
        : null,
      gapIds: ["GAP-088", "GAP-090", "GAP-093"],
      boundary: "Feature-flag writes now persist with RBAC and audit metadata.",
    }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "FEATURE_FLAG_CONCURRENCY_CONFLICT") {
      return NextResponse.json(
        { ok: false, error: { code: "FEATURE_FLAG_CONCURRENCY_CONFLICT", message: "Feature flag changed before approval/orchestration." }, concurrency: (error as { concurrency?: unknown }).concurrency },
        { status: 409 },
      );
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        featureFlag: {
          key: input.key,
          scope: input.scope,
          enabled: input.enabled,
          description: input.description,
          rules,
        },
        warning: "Database unavailable; mutation not persisted.",
        gapIds: ["GAP-088", "GAP-090", "GAP-093"],
      }, { status: 201 });
    }

    return NextResponse.json({ ok: false, error: { code: "FEATURE_FLAG_MUTATION_FAILED", message: "Feature flag could not be persisted." } }, { status: 500 });
  }
}

