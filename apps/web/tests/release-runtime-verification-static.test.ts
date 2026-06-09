import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildReleaseRuntimeVerificationContract,
  releaseRuntimeVerificationArtifactPaths,
  releaseRuntimeVerificationCommands,
  releaseRuntimeVerificationMatrix,
} from "../lib/releaseRuntimeVerification";

const root = join(__dirname, "..", "..");
const releaseHealthRoute = readFileSync(join(root, "apps/web/app/api/public/[tenantSlug]/release-health/route.ts"), "utf8");
const dashboardReleaseRoute = readFileSync(join(root, "apps/dashboard/app/api/releases/route.ts"), "utf8");
const dashboardFlagRoute = readFileSync(join(root, "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const releaseGovernanceWorkflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

describe("release runtime verification contract", () => {
  it("tracks package, release-health, dashboard route, build, and workflow targets", () => {
    expect(releaseRuntimeVerificationCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/releases typecheck",
        "pnpm --filter @inkroute/releases test",
        "pnpm --filter @inkroute/web build",
        "pnpm --filter @inkroute/dashboard build",
        "pnpm --filter @inkroute/mobile typecheck",
        "release-governance workflow dry run",
      ]),
    );
    expect(releaseRuntimeVerificationMatrix.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "release-package-contracts",
        "public-release-health-route",
        "dashboard-release-route-smoke",
        "dashboard-feature-flag-route-smoke",
        "web-dashboard-mobile-builds",
        "release-governance-workflow",
      ]),
    );
  });

  it("pins release-health and dashboard route smoke surfaces", () => {
    expect(releaseHealthRoute).toContain("ReleaseRecord");
    expect(releaseHealthRoute).toContain("featureFlags");
    expect(dashboardReleaseRoute).toContain("Cache-Control");
    expect(dashboardReleaseRoute).toContain("release:read");
    expect(dashboardFlagRoute).toContain("feature_flag:read:list");
    expect(dashboardFlagRoute).toContain("Cache-Control");
  });

  it("keeps GitHub Actions workflow proof gated and artifact-backed", () => {
    expect(releaseGovernanceWorkflow).toContain("workflow_dispatch");
    expect(releaseGovernanceWorkflow).toContain("migration");
    expect(releaseRuntimeVerificationArtifactPaths).toContain("coverage/release-governance-workflow-dry-run-redacted.json");
    expect(releaseRuntimeVerificationArtifactPaths).toContain("test-results/release-governance");
  });

  it("uses the release package readiness planner without claiming unrun builds", () => {
    const contract = buildReleaseRuntimeVerificationContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/releases tests must pass before release runtime verification.",
        "Web app build must pass under release runtime dependencies.",
        "Dashboard app build must pass under release runtime dependencies.",
        "Release-governance GitHub Actions workflow dry-run or dispatch proof is required.",
      ]),
    );
    expect(contract.requiredEvidence).toEqual(expect.arrayContaining(["web, dashboard, and mobile build/typecheck evidence"]));
  });

  it("is wired into CI and GAP-087 tracker evidence", () => {
    expect(workflowSource).toContain("Run Phase 12 release runtime verification contracts");
    expect(workflowSource).toContain("apps/web/tests/release-runtime-verification-static.test.ts");
    expect(workflowSource).toContain("release-runtime-verification-artifacts");
    expect(trackerSource).toContain("GAP-087");
    expect(trackerSource).toContain("apps/web/lib/releaseRuntimeVerification.ts");
    expect(trackerSource).toContain("GitHub Actions workflow proof remains open");
  });
});
