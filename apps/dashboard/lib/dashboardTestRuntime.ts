import { buildDashboardTestExecutionEvidencePlan } from "@inkroute/testing";

export type DashboardTestRuntimeStatus =
  | "wired"
  | "fixture-gated"
  | "browser-gated"
  | "accessibility-gated"
  | "ci-gated";

export interface DashboardTestRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardTestRuntimeStatus;
}

export const dashboardTestRuntimeCommands = [
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
] as const;

export const dashboardTestArtifactPaths = [
  "coverage/dashboard-test-runtime.json",
  "coverage/dashboard-test-testing-typecheck.txt",
  "coverage/dashboard-test-testing-test.txt",
  "coverage/dashboard-test-dashboard-typecheck.txt",
  "coverage/dashboard-test-dashboard-build.txt",
  "coverage/dashboard-test-dashboard-unit.txt",
  "coverage/dashboard-test-route-rendering.json",
  "coverage/dashboard-test-auth-rbac-tenant.json",
  "coverage/dashboard-test-booking-mutation-lifecycle.json",
  "coverage/dashboard-test-provider-safe-states.json",
  "coverage/dashboard-test-axe-accessibility.json",
  "coverage/dashboard-test-keyboard-navigation.json",
  "coverage/dashboard-test-playwright-critical-flow.json",
  "coverage/dashboard-test-ci-artifacts.json",
  "coverage/dashboard-test-branch-protection.json",
  "coverage/dashboard-test-flaky-policy.json",
  "coverage/dashboard-test-secret-safe-artifacts.json",
  "test-results/dashboard-test-runtime",
] as const;

export const dashboardTestRuntimeMatrix = [
  {
    id: "testing-typecheck",
    command: "pnpm --filter @inkroute/testing typecheck",
    artifact: "coverage/dashboard-test-testing-typecheck.txt",
    status: "wired",
  },
  {
    id: "testing-tests",
    command: "pnpm --filter @inkroute/testing test",
    artifact: "coverage/dashboard-test-testing-test.txt",
    status: "wired",
  },
  {
    id: "dashboard-typecheck-build",
    command: "pnpm --filter @inkroute/dashboard typecheck && pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-test-dashboard-build.txt",
    status: "browser-gated",
  },
  {
    id: "dashboard-unit-component",
    command: "pnpm --filter @inkroute/dashboard test",
    artifact: "coverage/dashboard-test-dashboard-unit.txt",
    status: "browser-gated",
  },
  {
    id: "route-rendering",
    command: "dashboard route rendering tests",
    artifact: "coverage/dashboard-test-route-rendering.json",
    status: "fixture-gated",
  },
  {
    id: "auth-rbac-tenant-isolation",
    command: "dashboard auth/RBAC/tenant-isolation tests",
    artifact: "coverage/dashboard-test-auth-rbac-tenant.json",
    status: "fixture-gated",
  },
  {
    id: "booking-mutation-lifecycle",
    command: "dashboard booking mutation lifecycle tests",
    artifact: "coverage/dashboard-test-booking-mutation-lifecycle.json",
    status: "fixture-gated",
  },
  {
    id: "provider-safe-states",
    command: "dashboard provider-safe state tests",
    artifact: "coverage/dashboard-test-provider-safe-states.json",
    status: "fixture-gated",
  },
  {
    id: "axe-keyboard-accessibility",
    command: "dashboard axe accessibility checks && dashboard keyboard navigation checks",
    artifact: "coverage/dashboard-test-axe-accessibility.json",
    status: "accessibility-gated",
  },
  {
    id: "playwright-critical-flow",
    command: "Playwright dashboard critical-flow suite",
    artifact: "coverage/dashboard-test-playwright-critical-flow.json",
    status: "browser-gated",
  },
  {
    id: "ci-branch-flaky-secret-safe",
    command: "GitHub Actions dashboard test artifact upload && branch protection dashboard required-check proof",
    artifact: "coverage/dashboard-test-ci-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardTestRuntimeMatrixEntry[];

export const dashboardTestRuntimeReadiness = buildDashboardTestExecutionEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  testingPackageTestsPassed: false,
  testingPackageTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  dashboardUnitTestsPassed: false,
  dashboardRouteRenderingTestsPassed: false,
  dashboardAuthGuardTestsPassed: false,
  dashboardRbacTenantIsolationTestsPassed: false,
  dashboardMutationLifecycleTestsPassed: false,
  dashboardProviderSafeStateTestsPassed: false,
  dashboardAccessibilityAxePassed: false,
  dashboardKeyboardChecksPassed: false,
  playwrightDashboardSuitePassed: false,
  ciArtifactsUploaded: false,
  branchProtectionRequiresDashboardGate: false,
  flakyDashboardPolicyDocumented: false,
  secretSafeArtifactsCaptured: false,
});
