import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildFeatureFlagCacheKey,
  buildFeatureFlagRuntimeIntegrationContract,
  buildStableRolloutBucket,
  buildTenantSafeFeatureFlagSnapshot,
  featureFlagRuntimeArtifactPaths,
  invalidateFeatureFlagRuntimeCache,
  resolveCachedFeatureFlagSnapshot,
} from "../lib/featureFlagRuntime";
import { defaultFeatureFlags } from "@inkroute/releases";

const root = join(__dirname, "..", "..");
const releaseHealthRoute = readFileSync(join(root, "apps/web/app/api/public/[tenantSlug]/release-health/route.ts"), "utf8");
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
    expect(invalidation).toEqual({ tenantId: context.tenantId, invalidated: true, invalidationTag: `feature-flags:${context.tenantId}` });
  });

  it("threads runtime flags into public release-health payloads", () => {
    expect(releaseHealthRoute).toContain("resolveCachedFeatureFlagSnapshot");
    expect(releaseHealthRoute).toContain("runtimeFeatureFlags");
    expect(releaseHealthRoute).toContain("providerWorkerKillSwitches");
    expect(releaseHealthRoute).toContain("tenantSafePublicPayload");
  });

  it("keeps live rollout proof gated through readiness planner and CI artifacts", () => {
    const contract = buildFeatureFlagRuntimeIntegrationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Tenant/user/role flag context must derive from real auth, not trusted demo inputs.",
        "Live rollout and kill-switch proof is required before closing GAP-090.",
      ]),
    );
    expect(featureFlagRuntimeArtifactPaths).toContain("coverage/feature-flag-live-rollout-proof-redacted.json");
    expect(workflow).toContain("Run Phase 12 feature flag runtime integration contracts");
    expect(tracker).toContain("GAP-090");
    expect(tracker).toContain("apps/web/lib/featureFlagRuntime.ts");
  });
});
