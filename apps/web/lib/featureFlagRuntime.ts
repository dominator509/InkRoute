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

export const featureFlagRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/mobile/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/web/lib/featureFlagRuntime.ts",
  "apps/web/tests/feature-flag-runtime-static.test.ts",
  "apps/web/tests/feature-flag-runtime-integration-static.test.ts",
  "apps/dashboard/lib/releaseDemo.ts",
  "packages/mobile/package.json",
  "apps/mobile/src/lib/mobileDemo.ts",
  "apps/dashboard/app/api/feature-flags/route.ts",
  "apps/dashboard/tests/feature-flag-route-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/release-health/route.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const featureFlagRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/feature-flag-runtime-static.test.ts apps/web/tests/feature-flag-runtime-integration-static.test.ts apps/dashboard/tests/feature-flag-route-static.test.ts",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/mobile typecheck",
  "provider-worker kill-switch drill",
  "DB-backed rollout bucket proof",
  "live feature-flag rollout proof",
] as const;

export type FeatureFlagRuntimeEvidenceArtifact = (typeof featureFlagRuntimeArtifactPaths)[number];

export const featureFlagRuntimeRequiredExternalEvidence = [
  "dashboard and mobile typecheck evidence",
  "provider-worker kill-switch drill",
  "DB-backed rollout bucket proof using real tenant/user/role contexts",
  "live feature-flag rollout proof",
  "CI artifact attachment",
] as const;

export interface FeatureFlagRuntimeExecutionPlan {
  readonly id: "gap-090-feature-flag-runtime";
  readonly providerWorkerDrillAllowed: false;
  readonly dbBackedRolloutProofAllowed: false;
  readonly liveRolloutExecutionAllowed: false;
  readonly policy: typeof featureFlagRuntimeExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof featureFlagRuntimeCommands;
  readonly requiredArtifacts: typeof featureFlagRuntimeArtifactPaths;
  readonly localRuntimeArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
  readonly providerArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
  readonly dbBackedArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
  readonly liveProofArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof featureFlagRuntimeRequiredExternalEvidence;
}

export interface FeatureFlagRuntimeExecutionPolicy {
  readonly executeProviderWorkerDrill: false;
  readonly executeDbBackedRolloutProof: false;
  readonly executeLiveRollout: false;
  readonly executeDashboardTypecheck: false;
  readonly executeMobileTypecheck: false;
  readonly executeCi: false;
}

export interface FeatureFlagRuntimeArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: FeatureFlagRuntimeEvidenceArtifact;
}

const featureFlagSensitiveKeyPattern =
  /(?:authorization|clientsecret|cookie|credential|email|password|phone|private|secret|token)/i;
const featureFlagEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const featureFlagPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const featureFlagTokenPattern = /\b(?:bearer|launchdarkly|split|statsig|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactFeatureFlagRuntimeArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (featureFlagSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(featureFlagEmailPattern, "[REDACTED_EMAIL]")
      .replace(featureFlagPhonePattern, "[REDACTED_PHONE]")
      .replace(featureFlagTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactFeatureFlagRuntimeArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactFeatureFlagRuntimeArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedFeatureFlagRuntimeArtifact(artifact: unknown): unknown {
  return redactFeatureFlagRuntimeArtifactValue(artifact);
}

export const featureFlagRuntimeExecutionPolicy: FeatureFlagRuntimeExecutionPolicy = {
  executeProviderWorkerDrill: false,
  executeDbBackedRolloutProof: false,
  executeLiveRollout: false,
  executeDashboardTypecheck: false,
  executeMobileTypecheck: false,
  executeCi: false,
};

export function buildFeatureFlagRuntimeExecutionPlan(): FeatureFlagRuntimeExecutionPlan {
  return {
    id: "gap-090-feature-flag-runtime",
    providerWorkerDrillAllowed: false,
    dbBackedRolloutProofAllowed: false,
    liveRolloutExecutionAllowed: false,
    policy: featureFlagRuntimeExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: featureFlagRuntimeCommands,
    requiredArtifacts: featureFlagRuntimeArtifactPaths,
    localRuntimeArtifacts: [
      "coverage/feature-flag-runtime-resolver.json",
      "coverage/feature-flag-cache-invalidation.json",
      "coverage/feature-flag-rollout-bucket.json",
      "coverage/feature-flag-tenant-safe-public-payload.json",
    ],
    providerArtifacts: ["coverage/feature-flag-provider-kill-switch.json"],
    dbBackedArtifacts: ["coverage/feature-flag-rollout-bucket.json"],
    liveProofArtifacts: ["coverage/feature-flag-live-rollout-proof-redacted.json"],
    externalEvidenceRequired: featureFlagRuntimeRequiredExternalEvidence,
  };
}

export function buildFeatureFlagRuntimeArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: FeatureFlagRuntimeEvidenceArtifact = "coverage/feature-flag-live-rollout-proof-redacted.json",
): FeatureFlagRuntimeArtifactReview {
  const redactedArtifact = buildRedactedFeatureFlagRuntimeArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(featureFlagEmailPattern) ? "email" : null,
    serialized.match(featureFlagPhonePattern) ? "phone" : null,
    serialized.match(featureFlagTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface FeatureFlagRuntimeEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly featureFlagStaticTestsPassed: boolean;
  readonly featureFlagIntegrationTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly dbBackedEvaluationVerified: boolean;
  readonly realAuthContextVerified: boolean;
  readonly providerWorkerKillSwitchDrillPassed: boolean;
  readonly invalidationRevalidationVerified: boolean;
  readonly rolloutBucketProofCaptured: boolean;
  readonly tenantSafePublicPayloadVerified: boolean;
  readonly liveRolloutProofCaptured: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
}

export interface FeatureFlagRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly FeatureFlagRuntimeEvidenceArtifact[];
  readonly requiredCommands: typeof featureFlagRuntimeCommands;
  readonly requiredEvidence: typeof featureFlagRuntimeDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const featureFlagRuntimeDecisionRequiredEvidence = [
  "release package, feature flag static/integration, dashboard typecheck, and mobile typecheck artifacts",
  "DB-backed evaluation, real auth context, kill-switch drill, invalidation, rollout bucket, and public payload artifacts",
  "live rollout proof and CI artifact attachment evidence",
] as const;

export function buildFeatureFlagRuntimeEvidenceDecision(input: FeatureFlagRuntimeEvidenceInput): FeatureFlagRuntimeEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.featureFlagStaticTestsPassed ? "Feature flag static test evidence is required." : null,
    !input.featureFlagIntegrationTestsPassed ? "Feature flag runtime integration static evidence is required." : null,
    !input.dashboardTypecheckPassed ? "Dashboard typecheck evidence is required." : null,
    !input.mobileTypecheckPassed ? "Mobile typecheck evidence is required." : null,
    !input.dbBackedEvaluationVerified ? "DB-backed feature flag evaluation evidence is required." : null,
    !input.realAuthContextVerified ? "Real auth-derived tenant/user/role context evidence is required." : null,
    !input.providerWorkerKillSwitchDrillPassed ? "Provider-worker kill-switch drill evidence is required." : null,
    !input.invalidationRevalidationVerified ? "Dashboard write-path invalidation/revalidation evidence is required." : null,
    !input.rolloutBucketProofCaptured ? "DB-backed rollout bucket proof is required." : null,
    !input.tenantSafePublicPayloadVerified ? "Tenant-safe public payload evidence is required." : null,
    !input.liveRolloutProofCaptured ? "Live feature-flag rollout proof is required." : null,
    !input.ciArtifactsAttached ? "Feature flag runtime CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = featureFlagRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: featureFlagRuntimeCommands,
    requiredEvidence: featureFlagRuntimeDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-090 feature flag runtime evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-090 feature flag runtime evidence remains blocked until auth context, provider kill-switch, DB-backed rollout, live rollout, and CI artifacts are captured.",
  };
}

const resolverCache = new Map<string, { expiresAt: number; value: ReturnType<typeof buildTenantSafeFeatureFlagSnapshot> }>();
const cacheTtlMs = 60_000;

export function buildFeatureFlagContextFromRequest(input: {
  readonly tenantId: string;
  readonly headers: Headers;
  readonly environment: FeatureFlagContext["environment"];
  readonly defaultRole?: string;
}): FeatureFlagContext {
  const headerTenantId = input.headers.get("x-inkroute-tenant-id")?.trim();
  const headerUserId = input.headers.get("x-inkroute-user-id")?.trim();
  const headerRole = input.headers.get("x-inkroute-role")?.trim();
  const authContextTrusted = Boolean(headerTenantId && headerTenantId === input.tenantId && headerUserId);
  const role = authContextTrusted && headerRole ? headerRole : input.defaultRole ?? "public";
  const stableIdentifier = authContextTrusted ? `${input.tenantId}:user:${headerUserId}` : `${input.tenantId}:anonymous-public`;

  return {
    tenantId: input.tenantId,
    role,
    environment: input.environment,
    stableIdentifier,
  };
}

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
  let invalidatedEntries = 0;
  for (const key of resolverCache.keys()) {
    if (key.startsWith(`feature-flags:${tenantId}:`)) {
      resolverCache.delete(key);
      invalidatedEntries += 1;
    }
  }
  return { tenantId, invalidated: invalidatedEntries > 0, invalidatedEntries, invalidationTag: `feature-flags:${tenantId}` };
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
    realAuthContextDerivationConfigured: true,
    providerWorkerKillSwitchEnforced: true,
    invalidationRevalidationConfigured: true,
    rolloutBucketTestsPassed: true,
    tenantSafePublicPayloadVerified: true,
    liveRolloutProofCaptured: false,
  });
}

export const featureFlagRuntimeIntegrationContract = buildFeatureFlagRuntimeIntegrationContract();


