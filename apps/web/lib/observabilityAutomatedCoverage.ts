import { buildObservabilityAutomatedCoverageReadinessPlan } from "@inkroute/observability";

export const observabilityAutomatedCoverageArtifactPaths = [
  "coverage/observability-automated-coverage.json",
  "coverage/observability-global-error-rendered.json",
  "coverage/observability-dashboard-triage-smoke.json",
  "coverage/observability-playwright-triage-results.json",
  "coverage/observability-mobile-simulator-crash-ui.json",
  "coverage/observability-mobile-device-crash-proof-redacted.json",
  "coverage/observability-webhook-ingest-coverage.json",
  "test-results/observability-automated",
  "test-results/observability-browser",
  "test-results/observability-mobile",
] as const;

export const observabilityAutomatedCoverageCommands = [
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/observability-routes.test.ts apps/web/tests/observability-ui-static.test.ts apps/mobile/tests/mobile-crash-static.test.ts apps/mobile/tests/mobile-crash-proof-static.test.ts",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts apps/dashboard/tests/e2e/observability-triage.spec.ts",
  "mobile simulator crash-report UI smoke",
  "mobile physical-device crash-report proof",
] as const;

export const observabilityAutomatedCoverageMatrix = [
  {
    id: "package-observability-helpers",
    command: "pnpm --filter @inkroute/observability test",
    artifact: "coverage/observability-automated-coverage.json",
    status: "implemented-command-target",
  },
  {
    id: "web-observability-routes",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifact: "coverage/observability-webhook-ingest-coverage.json",
    status: "implemented-command-target",
  },
  {
    id: "rendered-global-error-boundaries",
    command: "pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
    artifact: "coverage/observability-global-error-rendered.json",
    status: "playwright-target-added",
  },
  {
    id: "dashboard-triage-browser-smoke",
    command: "pnpm exec playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
    artifact: "coverage/observability-dashboard-triage-smoke.json",
    status: "playwright-target-added",
  },
  {
    id: "mobile-crash-simulator-ui",
    command: "mobile simulator crash-report UI smoke",
    artifact: "coverage/observability-mobile-simulator-crash-ui.json",
    status: "static-proof-target-added",
  },
  {
    id: "mobile-crash-device-proof",
    command: "mobile physical-device crash-report proof",
    artifact: "coverage/observability-mobile-device-crash-proof-redacted.json",
    status: "device-proof-gated",
  },
] as const;

export function buildObservabilityAutomatedCoverageContract() {
  return buildObservabilityAutomatedCoverageReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityPackageTestsPassed: false,
    webRouteTestsPassed: false,
    webUiStaticTestsPassed: false,
    webTypecheckPassed: false,
    globalErrorRenderedComponentTestsAdded: true,
    dashboardErrorsPageSmokePassed: false,
    playwrightDashboardTriageCovered: true,
    mobileSimulatorCrashReportUiTested: true,
    mobileDeviceCrashReportUiTested: false,
    sentryWebhookSignatureTestsCovered: true,
    publicIngestPersistenceTestsCovered: true,
    ciArtifactsCaptured: true,
  });
}

export const observabilityAutomatedCoverageContract = buildObservabilityAutomatedCoverageContract();
