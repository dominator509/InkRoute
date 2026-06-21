import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardTestArtifactReview,
  buildDashboardTestEvidenceDecision,
  buildDashboardTestExecutionPlan,
  buildRedactedDashboardTestArtifact,
  dashboardTestArtifactPaths,
  dashboardTestEvidenceFlags,
  dashboardTestExternalCommands,
  dashboardTestLocalCommands,
  dashboardRunnableTestCoverageFiles,
  dashboardTestRuntimeCommands,
  dashboardTestRuntimeExecutionPolicy,
  dashboardTestRuntimeMatrix,
  dashboardTestRuntimeProofFiles,
  dashboardTestRuntimeReadiness,
  dashboardTestRuntimeRequiredExternalEvidence,
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

  it("pins current runnable dashboard static coverage files for GAP-041", () => {
    expect(dashboardRunnableTestCoverageFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/tests/dashboard-auth-guard-runtime-static.test.ts",
      "apps/dashboard/tests/dashboard-data-layer-runtime-static.test.ts",
      "apps/dashboard/tests/dashboard-mutation-runtime-static.test.ts",
      "apps/dashboard/tests/dashboard-build-runtime-static.test.ts",
      "apps/dashboard/tests/booking-state-route-static.test.ts",
      "packages/testing/tests/testing-manifest.test.ts",
    ]));
    for (const file of dashboardRunnableTestCoverageFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins current GAP-041 proof files", () => {
    expect(dashboardTestRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/testing/package.json",
      "apps/dashboard/package.json",
      "apps/dashboard/lib/dashboardTestRuntime.ts",
      "apps/dashboard/tests/dashboard-test-runtime-static.test.ts",
      "GAP_TRACKER.md",
    ]));
    for (const file of dashboardTestRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps execution blockers explicit until real app tests, axe, Playwright, CI, branch protection, and safe artifacts exist", () => {
    expect(dashboardTestRuntimeReadiness.status).toBe("blocked");
    expect(dashboardTestRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardTestRuntimeReadiness.requiredCommands).toEqual(dashboardTestRuntimeCommands);
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toContain("dashboard typecheck and build command evidence");
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toContain("dashboard unit/component, route rendering, and auth guard test output");
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toContain(
      "dashboard RBAC/tenant, mutation lifecycle, and provider-safe state test output",
    );
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toContain(
      "axe, keyboard, and Playwright dashboard critical-flow evidence",
    );
    expect(dashboardTestRuntimeReadiness.requiredEvidence).toContain(
      "CI artifact, branch protection, flaky policy, and secret-safe artifact evidence",
    );
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Runnable dashboard unit/component tests must pass.");
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Dashboard axe accessibility checks must pass.");
    expect(dashboardTestRuntimeReadiness.blockers).toContain("Branch protection must require the dashboard test gate before merge.");
  });

  it("classifies GAP-041 as blocked until dashboard test execution evidence is complete", () => {
    const decision = buildDashboardTestEvidenceDecision({
      commands: ["pnpm --filter @inkroute/testing typecheck"],
      artifacts: ["coverage/dashboard-test-runtime.json"],
      evidence: { testingPackageTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Playwright dashboard critical-flow suite");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-test-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned dashboard test commands must be run and captured.");
  });

  it("classifies GAP-041 as complete when all dashboard test commands, artifacts, and evidence are present", () => {
    const decision = buildDashboardTestEvidenceDecision({
      commands: dashboardTestRuntimeCommands,
      artifacts: dashboardTestArtifactPaths,
      evidence: Object.fromEntries(dashboardTestEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("separates static dashboard test review from runnable test execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardTestExecutionPlan();
    const artifactReview = buildDashboardTestArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      playwrightTraceUrl: "https://artifacts.example.com/trace.zip",
      authSessionToken: "session_private",
      nested: {
        privateScreenshotUrl: "https://artifacts.example.com/playwright-video/private.mp4",
        publicSummary: "dashboard test evidence captured",
      },
    });
    const directRedaction = buildRedactedDashboardTestArtifact({
      publicSummary: "safe dashboard test evidence",
      branchProtectionLog: "private branch settings",
    });

    expect(executionPlan.localCommands).toBe(dashboardTestLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "static dashboard runtime test coverage inventory review",
      "static dashboard test manifest review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardTestExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
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
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.dashboardTestExecutionAllowed).toBe(false);
    expect(executionPlan.accessibilityExecutionAllowed).toBe(false);
    expect(executionPlan.playwrightExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.branchProtectionExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardTestRuntimeExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticDashboardTestReadiness: true,
      runnableDashboardTestsRequiredForClosure: true,
      accessibilityAndKeyboardChecksRequiredForClosure: true,
      playwrightCriticalFlowsRequiredForClosure: true,
      branchProtectionRequiredForClosure: true,
      flakyPolicyRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardTestRuntimeRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("Playwright dashboard critical-flow suite evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("branch protection dashboard required-check proof");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard test artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardTestRuntimeRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "playwrightTraceUrl",
      "authSessionToken",
      "nested.privateScreenshotUrl",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("trace.zip");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("session_private");
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard test evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["branchProtectionLog"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard test evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runnable dashboard test completion", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard test execution runtime contracts");
    expect(ciWorkflow).toContain("dashboard-test-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-test-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-test-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardTestRuntime.ts");
    expect(gapTracker).toContain("buildDashboardTestExecutionPlan");
    expect(gapTracker).toContain("dashboardTestLocalCommands/dashboardTestExternalCommands");
    expect(gapTracker).toContain("buildRedactedDashboardTestArtifact");
    expect(gapTracker).toContain("buildDashboardTestArtifactReview");
    expect(gapTracker).toContain("dashboardTestRuntimeExecutionPolicy");
    expect(gapTracker).toContain("dashboardTestRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-041 is dashboard-test-matrix wired with evidence classifier");
    expect(dashboardTestArtifactPaths).toContain("coverage/dashboard-test-secret-safe-artifacts.json");
  });
});

