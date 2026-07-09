import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildFeatureFlagCacheKey,
  buildFeatureFlagContextFromRequest,
  buildFeatureFlagRuntimeArtifactReview,
  buildFeatureFlagRuntimeEvidenceDecision,
  buildFeatureFlagRuntimeExecutionPlan,
  buildFeatureFlagRuntimeIntegrationContract,
  buildRedactedFeatureFlagRuntimeArtifact,
  buildStableRolloutBucket,
  buildTenantSafeFeatureFlagSnapshot,
  featureFlagRuntimeArtifactPaths,
  featureFlagRuntimeCommands,
  featureFlagRuntimeDecisionRequiredEvidence,
  featureFlagRuntimeExecutionPolicy,
  featureFlagRuntimeProofFiles,
  featureFlagRuntimeRequiredExternalEvidence,
  invalidateFeatureFlagRuntimeCache,
  resolveCachedFeatureFlagSnapshot,
} from "../lib/featureFlagRuntime";
import { defaultFeatureFlags } from "@inkroute/releases";

const root = join(__dirname, "..", "..");
const releaseHealthRoute = readFileSync(join(root, "apps/web/app/api/public/[tenantSlug]/release-health/route.ts"), "utf8");
const dashboardFeatureFlagRoute = readFileSync(join(root, "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

const context = {
  tenantId: "tenant_runtime",
  role: "owner",
  environment: "production" as const,
  stableIdentifier: "tenant_runtime:owner",
};

describe("feature flag runtime integration contract", () => {
  it("builds stable cache keys and rollout buckets", () => {
    expect(buildFeatureFlagCacheKey(context)).toBe("feature-flags:tenant_runtime:owner:production:tenant_runtime:owner");
    expect(buildStableRolloutBucket(context.stableIdentifier)).toBe(buildStableRolloutBucket(context.stableIdentifier));
    expect(buildStableRolloutBucket(context.stableIdentifier)).toBeGreaterThanOrEqual(0);
    expect(buildStableRolloutBucket(context.stableIdentifier)).toBeLessThan(100);
  });

  it("returns tenant-safe decisions and provider worker kill-switch gates", () => {
    const snapshot = buildTenantSafeFeatureFlagSnapshot(defaultFeatureFlags, context);

    expect(snapshot.tenantSafePublicPayload).toBe(true);
    expect(snapshot.providerWorkerKillSwitches.length).toBeGreaterThan(0);
    expect(snapshot.providerWorkerKillSwitches[0]).toMatchObject({ enforcedBeforeSideEffects: true });
    expect(JSON.stringify(snapshot)).not.toContain("DATABASE_URL");
    expect(JSON.stringify(snapshot)).not.toContain("SECRET");
  });

  it("caches resolver output and exposes invalidation metadata", () => {
    const first = resolveCachedFeatureFlagSnapshot(defaultFeatureFlags, context);
    const second = resolveCachedFeatureFlagSnapshot(defaultFeatureFlags, context);
    const invalidation = invalidateFeatureFlagRuntimeCache(context.tenantId);

    expect(first.cache.cacheHit).toBe(false);
    expect(second.cache.cacheHit).toBe(true);
    expect(invalidation).toEqual({ tenantId: context.tenantId, invalidated: true, invalidatedEntries: 1, invalidationTag: `feature-flags:${context.tenantId}` });
    expect(invalidateFeatureFlagRuntimeCache("tenant_without_cache_entries")).toEqual({
      tenantId: "tenant_without_cache_entries",
      invalidated: false,
      invalidatedEntries: 0,
      invalidationTag: "feature-flags:tenant_without_cache_entries",
    });
    expect(dashboardFeatureFlagRoute).toContain("buildFeatureFlagRuntimeInvalidationMetadata");
    expect(dashboardFeatureFlagRoute).toContain("feature-flag-runtime-invalidation-applied");
    expect(dashboardFeatureFlagRoute).toContain("coverage/feature-flag-cache-invalidation.json");
    expect(dashboardFeatureFlagRoute).toContain("feature-flag invalidation/revalidation smoke");
  });

  it("threads runtime flags into public release-health payloads", () => {
    expect(releaseHealthRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(releaseHealthRoute).toContain("{ status: 404, headers: noStoreHeaders }");
    expect(releaseHealthRoute).toContain("{ headers: noStoreHeaders }");
    expect(releaseHealthRoute).toContain("buildFeatureFlagContextFromRequest");
    expect(releaseHealthRoute).toContain("featureFlagContextHeaderAllowlist");
    expect(releaseHealthRoute).toContain("buildTenantSafeFeatureFlagHeaders(request.headers)");
    expect(releaseHealthRoute).not.toContain("headers: request.headers");
    expect(releaseHealthRoute).toContain("authDerived");
    expect(releaseHealthRoute).toContain("resolveCachedFeatureFlagSnapshot");
    expect(releaseHealthRoute).toContain("runtimeFeatureFlags");
    expect(releaseHealthRoute).toContain("providerWorkerKillSwitches");
    expect(releaseHealthRoute).toContain("tenantSafePublicPayload");
  });

  it("keeps live rollout proof gated through readiness planner and CI artifacts", () => {
    const contract = buildFeatureFlagRuntimeIntegrationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toContain("Live rollout and kill-switch proof is required before closing GAP-090.");
    expect(contract.blockers).not.toContain("Tenant/user/role flag context must derive from real auth, not trusted demo inputs.");
    expect(featureFlagRuntimeArtifactPaths).toContain("coverage/feature-flag-live-rollout-proof-redacted.json");
    expect(workflow).toContain("Run Phase 12 feature flag runtime integration contracts");
    expect(tracker).toContain("GAP-090");
    expect(tracker).toContain("apps/web/lib/featureFlagRuntime.ts");
  });

  it("builds a local execution plan without provider-worker drills, DB-backed rollout proof, or live rollout execution", () => {
    const plan = buildFeatureFlagRuntimeExecutionPlan();

    expect(plan.id).toBe("gap-090-feature-flag-runtime");
    expect(plan.providerWorkerDrillAllowed).toBe(false);
    expect(plan.dbBackedRolloutProofAllowed).toBe(false);
    expect(plan.liveRolloutExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(featureFlagRuntimeExecutionPolicy);
    expect(plan.policy).toEqual({
      executeProviderWorkerDrill: false,
      executeDbBackedRolloutProof: false,
      executeLiveRollout: false,
      executeDashboardTypecheck: false,
      executeMobileTypecheck: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(featureFlagRuntimeCommands);
    expect(plan.requiredArtifacts).toBe(featureFlagRuntimeArtifactPaths);
    expect(plan.localRuntimeArtifacts).toEqual(
      expect.arrayContaining(["coverage/feature-flag-runtime-resolver.json", "coverage/feature-flag-cache-invalidation.json"]),
    );
    expect(plan.providerArtifacts).toEqual(["coverage/feature-flag-provider-kill-switch.json"]);
    expect(plan.dbBackedArtifacts).toEqual(["coverage/feature-flag-rollout-bucket.json"]);
    expect(plan.liveProofArtifacts).toEqual(["coverage/feature-flag-live-rollout-proof-redacted.json"]);
    expect(plan.externalEvidenceRequired).toBe(featureFlagRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "dashboard and mobile typecheck evidence",
      "provider-worker kill-switch drill",
      "DB-backed rollout bucket proof using real tenant/user/role contexts",
      "live feature-flag rollout proof",
      "CI artifact attachment",
    ]);
  });

  it("redacts feature-flag rollout artifacts before persistence", () => {
    const rawArtifact = {
      provider: {
        authorization: "Bearer launchdarkly-live-rollout-token",
      },
      context: {
        email: "artist@example.com",
        phone: "+1 555 010 4444",
        tenantId: "tenant_runtime",
      },
      rollout: {
        stableIdentifier: "tenant_runtime:user:user_1",
        enabled: true,
      },
      cacheMetadata: {
        cacheKey: "flag_tenant_runtime_user_1",
        invalidationTarget: "tenant_runtime:feature-flags",
      },
      releaseHealthPayload: {
        routeUrl: "https://preview.example.com/api/public/inkroute-demo/release-health",
        rawHeader: "x-inkroute-user-id: user_1",
      },
      liveProofLog: "provider worker kill-switch drill completed for tenant_runtime user_1",
      ciArtifactPath: "coverage/feature-flag-runtime/raw-live-proof.json",
    };

    const redacted = buildRedactedFeatureFlagRuntimeArtifact(rawArtifact);
    const review = buildFeatureFlagRuntimeArtifactReview("feature-flag-live-rollout-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("launchdarkly-live-rollout-token");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 010 4444");
    expect(serialized).not.toContain("tenant_runtime");
    expect(serialized).not.toContain("user_1");
    expect(serialized).not.toContain("feature-flags");
    expect(serialized).not.toContain("preview.example.com");
    expect(serialized).not.toContain("kill-switch drill");
    expect(serialized).not.toContain("raw-live-proof.json");
    expect(serialized).toContain("enabled");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/feature-flag-live-rollout-proof-redacted.json");
  });

  it("derives feature flag context from matched auth headers and falls back to public context safely", () => {
    const authenticated = buildFeatureFlagContextFromRequest({
      tenantId: "tenant_runtime",
      headers: new Headers({
        "x-inkroute-tenant-id": "tenant_runtime",
        "x-inkroute-user-id": "user_runtime",
        "x-inkroute-role": "artist",
      }),
      environment: "production",
    });
    const publicFallback = buildFeatureFlagContextFromRequest({
      tenantId: "tenant_runtime",
      headers: new Headers({
        "x-inkroute-tenant-id": "other_tenant",
        "x-inkroute-user-id": "user_runtime",
        "x-inkroute-role": "owner",
      }),
      environment: "production",
      defaultRole: "public",
    });

    expect(authenticated).toEqual({
      tenantId: "tenant_runtime",
      role: "artist",
      environment: "production",
      stableIdentifier: "tenant_runtime:user:user_runtime",
    });
    expect(publicFallback).toEqual({
      tenantId: "tenant_runtime",
      role: "public",
      environment: "production",
      stableIdentifier: "tenant_runtime:anonymous-public",
    });
  });

  it("pins current feature flag runtime proof files for GAP-090", () => {
    expect(featureFlagRuntimeProofFiles).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    for (const file of featureFlagRuntimeProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-090 feature flag runtime evidence as blocked until auth, kill-switch, DB-backed rollout, and live proof are captured", () => {
    const blocked = buildFeatureFlagRuntimeEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      featureFlagStaticTestsPassed: true,
      featureFlagIntegrationTestsPassed: true,
      dashboardTypecheckPassed: false,
      mobileTypecheckPassed: false,
      dbBackedEvaluationVerified: false,
      realAuthContextVerified: false,
      providerWorkerKillSwitchDrillPassed: false,
      invalidationRevalidationVerified: true,
      rolloutBucketProofCaptured: false,
      tenantSafePublicPayloadVerified: true,
      liveRolloutProofCaptured: false,
      ciArtifactsAttached: false,
      capturedArtifacts: ["coverage/feature-flag-runtime-resolver.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Real auth-derived tenant/user/role context evidence is required.",
        "Provider-worker kill-switch drill evidence is required.",
        "DB-backed rollout bucket proof is required.",
        "Live feature-flag rollout proof is required.",
        "Feature flag runtime CI artifact evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/feature-flag-provider-kill-switch.json");
    expect(blocked.requiredCommands).toBe(featureFlagRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(featureFlagRuntimeDecisionRequiredEvidence);
    expect(tracker).toContain("featureFlagRuntimeDecisionRequiredEvidence");

    const complete = buildFeatureFlagRuntimeEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      featureFlagStaticTestsPassed: true,
      featureFlagIntegrationTestsPassed: true,
      dashboardTypecheckPassed: true,
      mobileTypecheckPassed: true,
      dbBackedEvaluationVerified: true,
      realAuthContextVerified: true,
      providerWorkerKillSwitchDrillPassed: true,
      invalidationRevalidationVerified: true,
      rolloutBucketProofCaptured: true,
      tenantSafePublicPayloadVerified: true,
      liveRolloutProofCaptured: true,
      ciArtifactsAttached: true,
      capturedArtifacts: featureFlagRuntimeArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });
});
