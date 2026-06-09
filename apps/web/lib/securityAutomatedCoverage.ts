import { buildSecurityAutomatedCoverageReadinessPlan } from "@inkroute/security";

export type SecurityCoverageSuiteKind =
  | "package"
  | "route-vitest"
  | "middleware-runtime"
  | "middleware-static"
  | "playwright"
  | "db-integration"
  | "storage-provider"
  | "privacy-workflow"
  | "role-boundary";

export interface SecurityCoverageSuiteTarget {
  id: string;
  kind: SecurityCoverageSuiteKind;
  command: string;
  artifact: string;
  status: "wired" | "provider-gated" | "execution-gated";
}

export const securityAutomatedCoverageArtifactPaths = [
  "coverage/security-automated-coverage.json",
  "coverage/security-package-tests.json",
  "coverage/security-route-vitest.json",
  "coverage/security-middleware-runtime.json",
  "coverage/security-middleware-static.json",
  "coverage/security-web-playwright.json",
  "coverage/security-dashboard-playwright.json",
  "coverage/security-db-tenant-isolation.json",
  "coverage/security-storage-provider-negative.json",
  "coverage/security-privacy-workflow-integration.json",
  "coverage/security-role-boundary-authenticated.json",
  "coverage/security-failure-mode-fixtures.md",
  "test-results/security-automated",
] as const;

export const securityAutomatedCoverageSuites: readonly SecurityCoverageSuiteTarget[] = [
  {
    id: "security-package",
    kind: "package",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/security-package-tests.json",
    status: "wired",
  },
  {
    id: "security-route-vitest",
    kind: "route-vitest",
    command:
      "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/privacy-requests-public-route.test.ts apps/web/tests/privacy-requests-dashboard-route.test.ts apps/web/tests/dashboard-trust-status-route.test.ts",
    artifact: "coverage/security-route-vitest.json",
    status: "wired",
  },
  {
    id: "security-middleware-runtime",
    kind: "middleware-runtime",
    command: "pnpm vitest run apps/web/tests/security-runtime-middleware.test.ts",
    artifact: "coverage/security-middleware-runtime.json",
    status: "wired",
  },
  {
    id: "security-middleware-static",
    kind: "middleware-static",
    command: "pnpm vitest run apps/web/tests/security-runtime-middleware-static.test.ts apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
    artifact: "coverage/security-middleware-static.json",
    status: "wired",
  },
  {
    id: "security-playwright",
    kind: "playwright",
    command: "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
    artifact: "coverage/security-web-playwright.json",
    status: "execution-gated",
  },
  {
    id: "security-db-tenant-isolation",
    kind: "db-integration",
    command: "DB-backed tenant-isolation security integration tests",
    artifact: "coverage/security-db-tenant-isolation.json",
    status: "provider-gated",
  },
  {
    id: "security-storage-provider-negative",
    kind: "storage-provider",
    command: "storage/provider negative security tests",
    artifact: "coverage/security-storage-provider-negative.json",
    status: "provider-gated",
  },
  {
    id: "security-privacy-workflow-integration",
    kind: "privacy-workflow",
    command: "privacy workflow integration tests with auth/Postgres/storage",
    artifact: "coverage/security-privacy-workflow-integration.json",
    status: "provider-gated",
  },
  {
    id: "security-authenticated-role-boundary",
    kind: "role-boundary",
    command: "authenticated role-boundary security tests",
    artifact: "coverage/security-role-boundary-authenticated.json",
    status: "provider-gated",
  },
] as const;

export const securityAutomatedCoverageCommands = securityAutomatedCoverageSuites.map((suite) => suite.command);

export const securityAutomatedCoverageReadiness = buildSecurityAutomatedCoverageReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityPackageTestsPassed: false,
  securityPackageTypecheckPassed: false,
  routeVitestSuitePassed: false,
  middlewareRuntimeSuitePassed: false,
  middlewareStaticSuitePassed: false,
  webE2eSecuritySuitePassed: false,
  dashboardE2eSecuritySuitePassed: false,
  fullUnitSuitePassed: false,
  ciSecurityChecksPassed: false,
  testManifestIncludesSecuritySuites: true,
  dbBackedTenantIsolationTestsPassed: false,
  storageProviderNegativeTestsPassed: false,
  privacyWorkflowIntegrationTestsPassed: false,
  authenticatedRoleBoundaryTestsPassed: false,
  coverageArtifactsCollected: true,
  failureModeFixturesDocumented: false,
});
