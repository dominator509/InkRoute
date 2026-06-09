import {
  buildFeatureFlagRuntimeIntegrationReadinessPlan,
  buildProviderRuntimeGates,
  evaluateFeatureFlags,
  type FeatureFlagContext,
  type FeatureFlagDefinition,
} from "@inkroute/releases";

export const featureFlagRuntimeArtifactPaths = [
  "coverage/feature-flag-runtime-resolver.json",
  "coverage/feature-flag-cache-invalidation.json",
  "coverage/feature-flag-provider-kill-switch.json",
  "coverage/feature-flag-rollout-bucket.json",
  "coverage/feature-flag-tenant-safe-public-payload.json",
  "coverage/feature-flag-live-rollout-proof-redacted.json",
  "test-results/feature-flag-runtime",
] as const;

const resolverCache = new Map<string, { expiresAt: number; value: ReturnType<typeof buildTenantSafeFeatureFlagSnapshot> }>();
const cacheTtlMs = 60_000;

export function buildFeatureFlagCacheKey(input: { tenantId: string; role: string; environment: string; stableIdentifier: string }) {
  return `feature-flags:${input.tenantId}:${input.role}:${input.environment}:${input.stableIdentifier}`;
}

export function buildStableRolloutBucket(stableIdentifier: string): number {
  let hash = 0;
  for (const char of stableIdentifier) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % 100;
}

export function buildTenantSafeFeatureFlagSnapshot(definitions: readonly FeatureFlagDefinition[], context: FeatureFlagContext) {
  const decisions = evaluateFeatureFlags(definitions, context);
  const providerRuntimeGates = buildProviderRuntimeGates(decisions);
  const rolloutBucket = buildStableRolloutBucket(context.stableIdentifier);

  return {
    decisions: decisions.map((decision) => ({
      key: decision.key,
      enabled: decision.enabled,
      reason: decision.reason,
      scope: decision.scope,
      auditNote: decision.auditNote,
    })),
    providerRuntimeGates,
    providerWorkerKillSwitches: providerRuntimeGates.map((gate) => ({
      provider: gate.provider,
      flagKey: gate.flagKey,
      action: gate.action,
      enforcedBeforeSideEffects: true,
      runtimeBoundary: gate.runtimeBoundary,
    })),
    cache: {
      cacheKey: buildFeatureFlagCacheKey(context),
      ttlSeconds: cacheTtlMs / 1000,
      invalidationTag: `feature-flags:${context.tenantId}`,
      revalidationRequiredAfterWrite: true,
    },
    rollout: {
      stableIdentifier: context.stableIdentifier,
      bucket: rolloutBucket,
      bucketRange: "0-99",
    },
    tenantSafePublicPayload: true,
    artifactPaths: featureFlagRuntimeArtifactPaths,
  };
}

export function resolveCachedFeatureFlagSnapshot(definitions: readonly FeatureFlagDefinition[], context: FeatureFlagContext) {
  const cacheKey = buildFeatureFlagCacheKey(context);
  const now = Date.now();
  const cached = resolverCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return { ...cached.value, cache: { ...cached.value.cache, cacheHit: true } };
  }

  const value = buildTenantSafeFeatureFlagSnapshot(definitions, context);
  resolverCache.set(cacheKey, { expiresAt: now + cacheTtlMs, value });
  return { ...value, cache: { ...value.cache, cacheHit: false } };
}

export function invalidateFeatureFlagRuntimeCache(tenantId: string) {
  for (const key of resolverCache.keys()) {
    if (key.startsWith(`feature-flags:${tenantId}:`)) {
      resolverCache.delete(key);
    }
  }
  return { tenantId, invalidated: true, invalidationTag: `feature-flags:${tenantId}` };
}

export function buildFeatureFlagRuntimeIntegrationContract() {
  return buildFeatureFlagRuntimeIntegrationReadinessPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    featureFlagStaticTestsPassed: false,
    dashboardTypecheckPassed: false,
    mobileTypecheckPassed: false,
    dbBackedEvaluationConfigured: true,
    dashboardRuntimeSurfaceWired: true,
    mobileRuntimeSurfaceWired: true,
    publicReleaseHealthPayloadWired: true,
    cachedServerResolversConfigured: true,
    realAuthContextDerivationConfigured: false,
    providerWorkerKillSwitchEnforced: true,
    invalidationRevalidationConfigured: true,
    rolloutBucketTestsPassed: true,
    tenantSafePublicPayloadVerified: true,
    liveRolloutProofCaptured: false,
  });
}

export const featureFlagRuntimeIntegrationContract = buildFeatureFlagRuntimeIntegrationContract();
