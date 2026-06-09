import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  releaseLaunchControlArtifactPaths,
  releaseLaunchControlRuntimeCommands,
  releaseLaunchControlRuntimeMatrix,
  releaseLaunchControlRuntimeReadiness,
} from "../lib/releaseLaunchControlRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("release launch control runtime contract", () => {
  const releasePackageJson = readRepoFile("packages/releases/package.json");
  const releaseSource = readRepoFile("packages/releases/src/index.ts");
  const releaseTests = readRepoFile("packages/releases/tests/feature-flags.test.ts");
  const releaseRoute = readRepoFile("apps/dashboard/app/api/releases/route.ts");
  const featureFlagRoute = readRepoFile("apps/dashboard/app/api/feature-flags/route.ts");
  const releaseRouteTest = readRepoFile("apps/dashboard/tests/release-route-static.test.ts");
  const featureFlagRouteTest = readRepoFile("apps/dashboard/tests/feature-flag-route-static.test.ts");
  const releaseHealthRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/release-health/route.ts");
  const releaseGovernanceWorkflow = readRepoFile(".github/workflows/release-governance.yml");
  const releasePlan = readRepoFile("RELEASE_AND_AUTO_UPDATE_PLAN.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins release launch commands, matrix rows, and redacted artifact paths", () => {
    expect(releaseLaunchControlRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/releases typecheck",
      "pnpm --filter @inkroute/releases test",
      "provider-backed release/feature-flag route integration tests",
      "release-governance GitHub Actions workflow execution",
      "protected environment approval dry run",
      "signed deployment provenance check",
      "migration gate dry run",
      "incident-linked rollback drill",
      "EAS update governance drill",
      "feature-flag kill-switch drill",
      "release-health envelope smoke",
    ]);
    expect(releaseLaunchControlRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "release-package-gates",
      "persistence-rbac-concurrency-audit",
      "protected-environments-signed-jobs-ci",
      "preview-production-approval-dry-run",
      "migration-gate-dry-run",
      "incident-linked-rollback",
      "eas-update-governance",
      "rollout-kill-switch-health",
      "ci-secret-safe-artifacts",
    ]);
    expect(releaseLaunchControlArtifactPaths).toContain("coverage/release-launch-control-runtime.json");
    expect(releaseLaunchControlArtifactPaths).toContain("coverage/release-secret-safe-artifacts.json");
    expect(releaseLaunchControlArtifactPaths).toContain("test-results/release-launch-control-runtime");
  });

  it("keeps release helpers, hardened routes, workflow, and plan wired", () => {
    expect(releasePackageJson).toContain('"typecheck"');
    expect(releasePackageJson).toContain('"test"');
    expect(releaseSource).toContain("buildReleaseLaunchControlEvidencePlan");
    expect(releaseTests).toContain("buildReleaseLaunchControlEvidencePlan");
    expect(releaseRoute).toContain("release:read:list");
    expect(releaseRoute).toContain("no-store");
    expect(featureFlagRoute).toContain("feature_flag:read:list");
    expect(featureFlagRoute).toContain("no-store");
    expect(releaseRouteTest).toContain("tenant-scoped release envelope");
    expect(featureFlagRouteTest).toContain("FeatureFlag/default definition loader");
    expect(releaseHealthRoute).toContain("release");
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
    expect(releasePlan).toContain("Release");
  });

  it("keeps launch control blocked until persisted controls, protected environments, rollback, EAS, provider, CI, and safe artifacts exist", () => {
    expect(releaseLaunchControlRuntimeReadiness.status).toBe("blocked");
    expect(releaseLaunchControlRuntimeReadiness.missingScripts).toEqual([]);
    expect(releaseLaunchControlRuntimeReadiness.requiredCommands).toEqual([...releaseLaunchControlRuntimeCommands]);
    expect(releaseLaunchControlRuntimeReadiness.requiredEvidence).toEqual([
      "ReleaseRecord/FeatureFlag persistence, RBAC, tenant-scope, concurrency, and audit evidence",
      "protected environment, signed job, CI required-check, preview deploy, and production approval dry-run evidence",
      "migration gate and incident-linked rollback drill evidence",
      "EAS update governance, channel, runtime, adoption, and rollback evidence",
      "tenant rollout, kill-switch drill, and release-health envelope evidence",
      "provider-backed route, CI artifact, and secret-safe launch evidence",
    ]);
    expect(releaseLaunchControlRuntimeReadiness.blockers).toContain(
      "GitHub preview, staging, and production protected environments must be configured.",
    );
    expect(releaseLaunchControlRuntimeReadiness.blockers).toContain(
      "Incident-linked rollback drill must pass for web, dashboard, mobile OTA, database, and flags.",
    );
    expect(releaseLaunchControlRuntimeReadiness.blockers).toContain(
      "Release launch artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming release launch control readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 12 release launch control runtime contracts");
    expect(ciWorkflow).toContain("release-launch-control-runtime-static.test.ts");
    expect(ciWorkflow).toContain("release-launch-control-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/release-launch-control-runtime.json");
    expect(unitManifest).toContain("unit-web-release-launch-control-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/releaseLaunchControlRuntime.ts");
    expect(gapTracker).toContain("live ReleaseRecord/FeatureFlag provider-backed persistence, protected environments, signed jobs, CI required checks, preview/prod approval dry runs, migration gates, incident-linked rollback, EAS governance, rollout controls, kill-switch drills, provider route tests, CI artifacts, and secret-safe evidence remain open");
  });
});
