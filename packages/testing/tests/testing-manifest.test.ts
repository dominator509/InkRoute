import { describe, expect, it } from "vitest";
import {
  buildCiQualityGatePlan,
  buildDashboardTestingRuntimeReadinessPlan,
  buildDashboardTestRequirements,
  buildManualQaChecklist,
  buildRouteSmokeManifest,
  buildTestingRuntimeReadinessPlan,
  phase14Suites,
  summarizeDashboardTestRequirements,
  summarizeSuites,
} from "../src/index";

describe("Phase 14 testing manifest", () => {
  it("summarizes scaffolded and gated tests", () => {
    const summary = summarizeSuites(phase14Suites);

    expect(summary.suiteCount).toBeGreaterThan(0);
    expect(summary.caseCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
  });

  it("declares CI quality gates and manual QA evidence", () => {
    expect(buildCiQualityGatePlan().some((gate) => gate.id === "ci-install" && gate.required)).toBe(true);
    expect(buildManualQaChecklist().some((item) => item.priority === "critical")).toBe(true);
    expect(buildRouteSmokeManifest().some((route) => route.path === "/booking")).toBe(true);
  });

  it("declares dashboard test coverage requirements for GAP-041", () => {
    const requirements = buildDashboardTestRequirements();
    const summary = summarizeDashboardTestRequirements(requirements);

    expect(summary.missingAreas).toEqual([]);
    expect(summary.productionReady).toBe(false);
    expect(summary.criticalRuntimeGatedIds).toEqual([
      "dashboard-route-rendering",
      "dashboard-rbac-tenant-isolation",
      "dashboard-mutation-lifecycle",
      "dashboard-e2e-critical-flow",
    ]);
    expect(requirements.every((requirement) => requirement.gapIds.includes("GAP-041"))).toBe(true);
    expect(requirements.find((requirement) => requirement.area === "accessibility")?.verifies).toContain("axe critical violations");
  });

  it("blocks dashboard testing runtime readiness until app tests, fixtures, artifacts, and required checks exist", () => {
    const plan = buildDashboardTestingRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      implementedRequirementIds: ["dashboard-route-rendering"],
      passingRequirementIds: [],
      seededAuthFixturesConfigured: false,
      seededTenantDataConfigured: false,
      rbacTenantIsolationFixturesConfigured: false,
      mutationTestHarnessConfigured: false,
      accessibilityRunnerConfigured: false,
      playwrightDashboardProjectConfigured: true,
      ciUploadsDashboardArtifacts: false,
      branchProtectionRequiresDashboardTests: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingImplementedRequirements).toEqual([
      "dashboard-component-state",
      "dashboard-rbac-tenant-isolation",
      "dashboard-mutation-lifecycle",
      "dashboard-accessibility",
      "dashboard-e2e-critical-flow",
    ]);
    expect(plan.missingPassingRequirements).toContain("dashboard-route-rendering");
    expect(plan.requiredCommands).toContain("pnpm test:e2e --project=dashboard-chromium");
    expect(plan.requiredEvidence).toContain("seeded auth, tenant, and RBAC fixture evidence");
    expect(plan.blockers).toContain("Dashboard mutation tests need a provider-safe server-action/API harness.");
  });

  it("summarizes testing runtime readiness across install, execution, coverage, artifacts, CI, and branch protection", () => {
    const plan = buildTestingRuntimeReadinessPlan({
      rootScripts: ["test:phase14:static", "test:manifest", "test:unit"],
      lockfileCommitted: true,
      dependenciesInstalled: false,
      vitestWorkspaceConfigured: true,
      playwrightConfigured: true,
      ciWorkflowConfigured: true,
      phase14StaticPassed: true,
      testManifestPassed: true,
      unitTestsPassed: false,
      e2eTestsPassed: false,
      appBuildsPassed: false,
      prismaIntegrationTestsPassed: false,
      providerSandboxTestsPassed: false,
      securityRegressionTestsPassed: false,
      mobileStaticTestsPassed: true,
      mobileDeviceTestsPassed: false,
      coverageThresholdsConfigured: true,
      coverageArtifactsUploaded: false,
      playwrightArtifactsUploaded: false,
      ciRunPassed: false,
      branchProtectionRequiresCi: false,
      flakyTestPolicyConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test:e2e", "typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm test:unit:coverage");
    expect(plan.requiredEvidence).toContain("Branch protection settings showing CI required before merge.");
    expect(plan.blockers).toContain("Workspace dependencies must install with pnpm before test execution.");
    expect(plan.blockers).toContain("Provider sandbox tests must pass for Stripe, storage, notification, calendar, and observability boundaries.");
    expect(plan.blockers).toContain("A GitHub Actions CI run must pass on the PR branch.");
  });
});
