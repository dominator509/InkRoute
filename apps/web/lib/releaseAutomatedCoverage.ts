import { buildReleaseAutomatedTestReadinessPlan } from "@inkroute/releases";

export const releaseAutomatedCoverageArtifactPaths = [
  "coverage/release-automated-coverage.json",
  "coverage/release-dashboard-playwright-smoke.json",
  "coverage/release-provider-backed-route-integration.json",
  "coverage/release-expo-render-smoke.json",
  "coverage/release-expo-device-ota-proof-redacted.json",
  "coverage/release-github-actions-execution-redacted.json",
  "coverage/release-real-secrets-environments-redacted.json",
  "test-results/release-automated",
  "test-results/release-dashboard",
  "test-results/release-provider",
  "test-results/release-expo",
] as const;

export const releaseAutomatedCoverageCommands = [
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/release-health-route.test.ts apps/web/tests/release-automation-static.test.ts apps/web/tests/release-automated-coverage-static.test.ts apps/mobile/tests/mobile-static.test.ts",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm exec playwright test apps/dashboard/tests/e2e/release-dashboard.spec.ts",
  "provider-backed release route integration tests",
  "Expo release status render/device tests",
  "GitHub Actions release-governance workflow execution",
] as const;

export const releaseAutomatedCoverageMatrix = [
  {
    id: "package-helper-tests",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-automated-coverage.json",
    status: "command-target-wired",
  },
  {
    id: "dashboard-release-playwright-smoke",
    command: "pnpm exec playwright test apps/dashboard/tests/e2e/release-dashboard.spec.ts",
    artifact: "coverage/release-dashboard-playwright-smoke.json",
    status: "playwright-target-added",
  },
  {
    id: "provider-backed-route-integrations",
    command: "provider-backed release route integration tests",
    artifact: "coverage/release-provider-backed-route-integration.json",
    status: "provider-proof-gated",
  },
  {
    id: "expo-render-device-tests",
    command: "Expo release status render/device tests",
    artifact: "coverage/release-expo-device-ota-proof-redacted.json",
    status: "expo-proof-gated",
  },
  {
    id: "github-actions-workflow-execution",
    command: "GitHub Actions release-governance workflow execution",
    artifact: "coverage/release-github-actions-execution-redacted.json",
    status: "workflow-proof-gated",
  },
] as const;

export function buildProviderBackedReleaseRouteIntegrationPlan(input: {
  tenantId: string;
  releaseRoute: string;
  featureFlagRoute: string;
}) {
  return {
    tenantId: input.tenantId,
    routes: [
      {
        id: "release-route-db-backed-read",
        path: input.releaseRoute,
        requiredHeaders: ["x-tenant-id", "x-user-id", "x-user-role"],
        expectedStatus: [200, 503],
        requiresDatabase: true,
        requiresProviderMutation: false,
      },
      {
        id: "feature-flag-route-db-backed-read",
        path: input.featureFlagRoute,
        requiredHeaders: ["x-tenant-id", "x-user-id", "x-user-role"],
        expectedStatus: [200, 503],
        requiresDatabase: true,
        requiresProviderMutation: false,
      },
    ],
    assertions: [
      "no-store cache headers",
      "tenant mismatch denial",
      "server-side TenantMember permission lookup",
      "provider actions remain disabled without secrets",
      "redacted artifact capture",
    ],
    artifact: "coverage/release-provider-backed-route-integration.json",
  };
}

export const providerBackedReleaseRouteIntegrationPlan = buildProviderBackedReleaseRouteIntegrationPlan({
  tenantId: "inkroute-demo",
  releaseRoute: "/api/releases?tenantId=inkroute-demo",
  featureFlagRoute: "/api/feature-flags?tenantId=inkroute-demo",
});

export function buildReleaseAutomatedCoverageContract() {
  return buildReleaseAutomatedTestReadinessPlan({
    packageScripts: ["test", "typecheck"],
    releasePackageTestsPassed: false,
    releaseWorkflowTestsPassed: false,
    releaseHealthRouteTestsPassed: false,
    releaseAutomationStaticTestsPassed: false,
    mobileStaticTestsPassed: false,
    dashboardTypecheckPassed: false,
    playwrightDashboardReleaseSmokePassed: true,
    providerBackedRouteIntegrationTestsPassed: false,
    expoRenderTestsPassed: false,
    expoDeviceTestsPassed: false,
    githubActionsWorkflowExecutionEvidenceCaptured: false,
    realSecretsAndEnvironmentsConfigured: false,
    ciArtifactsCaptured: true,
  });
}

export const releaseAutomatedCoverageContract = buildReleaseAutomatedCoverageContract();
