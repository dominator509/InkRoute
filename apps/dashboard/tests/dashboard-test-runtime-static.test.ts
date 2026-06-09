import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dashboardTestArtifactPaths,
  dashboardTestRuntimeCommands,
  dashboardTestRuntimeMatrix,
  dashboardTestRuntimeReadiness,
} from "../lib/dashboardTestRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard test execution runtime contract", () => {
  const testingPackageJson = readRepoFile("packages/testing/package.json");
  const testingSource = readRepoFile("packages/testing/src/index.ts");
  const testingManifestTests = readRepoFile("packages/testing/tests/testing-manifest.test.ts");
  const dashboardPackageJson = readRepoFile("apps/dashboard/package.json");
  const dashboardAuthRuntimeTest = readRepoFile("apps/dashboard/tests/dashboard-auth-guard-runtime-static.test.ts");
  const dashboardDataRuntimeTest = readRepoFile("apps/dashboard/tests/dashboard-data-layer-runtime-static.test.ts");
  const dashboardMutationRuntimeTest = readRepoFile("apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts");
  const dashboardBuildRuntimeTest = readRepoFile("apps/dashboard/tests/dashboard-build-runtime-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-041 commands, matrix rows, and artifact paths", () => {
    expect(dashboardTestRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "dashboard route rendering tests",
      "dashboard auth/RBAC/tenant-isolation tests",
      "dashboard booking mutation lifecycle tests",
      "dashboard provider-safe state tests",
      "dashboard axe accessibility checks",
      "dashboard keyboard navigation checks",
      "Playwright dashboard critical-flow suite",
      "GitHub Actions dashboard test artifact upload",
      "branch protection dashboard required-check proof",
    ]);
    expect(dashboardTestRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "testing-typecheck",
      "testing-tests",
      "dashboard-typecheck-build",
      "dashboard-unit-component",
      "route-rendering",
      "auth-rbac-tenant-isolation",
      "booking-mutation-lifecycle",
      "provider-safe-states",
      "axe-keyboard-accessibility",
      "playwright-critical-flow",
      "ci-branch-flaky-secret-safe",
    ]);
    expect(dashboardTestArtifactPaths).toContain("coverage/dashboard-test-runtime.json");
    expect(dashboardTestArtifactPaths).toContain("coverage/dashboard-test-playwright-critical-flow.json");
    expect(dashboardTestArtifactPaths).toContain("test-results/dashboard-test-runtime");
  });

  it("keeps package dashboard matrix helpers and current dashboard runtime tests wired", () => {
    expect(testingPackageJson).toContain('"typecheck"');
    expect(testingPackageJson).toContain('"test"');
    expect(testingSource).toContain("buildDashboardTestExecutionEvidencePlan");
    expect(testingSource).toContain("buildDashboardTestRequirements");
    expect(testingSource).toContain("summarizeDashboardTestRequirements");
    expect(testingManifestTests).toContain("buildDashboardTestExecutionEvidencePlan");
    expect(dashboardPackageJson).toContain('"test"');
    expect(dashboardAuthRuntimeTest).toContain("dashboard auth guard runtime contract");
    expect(dashboardDataRuntimeTest).toContain("dashboard data layer runtime contract");
    expect(dashboardMutationRuntimeTest).toContain("dashboard mutation runtime contract");
    expect(dashboardBuildRuntimeTest).toContain("dashboard build/runtime verification contract");
  });

  it("keeps execution blockers explicit until real app tests, axe, Playwright, CI, branch protection, and safe artifacts exist", () => {
    expect(dashboardTestRuntimeReadiness.status).toBe("blocked");
    expect(dashboardTestRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardTestRuntimeReadiness.requiredCommands).toEqual([...dashboardTestRuntimeCommands]);
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "dashboard typecheck and build command evidence",
      "dashboard unit/component, route rendering, and auth guard test output",
      "dashboard RBAC/tenant, mutation lifecycle, and provider-safe state test output",
      "axe, keyboard, and Playwright dashboard critical-flow evidence",
      "CI artifact, branch protection, flaky policy, and secret-safe artifact evidence",
    ]));
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Runnable dashboard unit/component tests must pass.");
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Dashboard axe accessibility checks must pass.");
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Branch protection must require the dashboard test gate before merge.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runnable dashboard test completion", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard test execution runtime contracts");
    expect(ciWorkflow).toContain("dashboard-test-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-test-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-test-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardTestRuntime.ts");
    expect(gapTracker).toContain("GAP-041 is dashboard-test-matrix wired");
    expect(dashboardTestArtifactPaths).toContain("coverage/dashboard-test-secret-safe-artifacts.json");
  });
});
