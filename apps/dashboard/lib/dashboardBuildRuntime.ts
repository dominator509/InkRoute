import { buildDashboardLaunchEvidencePlan } from "@inkroute/auth";

export type DashboardBuildRuntimeStatus =
  | "wired"
  | "install-gated"
  | "type-gated"
  | "build-gated"
  | "browser-gated"
  | "ci-gated";

export interface DashboardBuildRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DashboardBuildRuntimeStatus;
}

export const dashboardBuildRuntimeCommands = [
  "pnpm install",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/dashboard test",
  "dashboard browser smoke: /",
  "dashboard browser smoke: /bookings",
  "dashboard browser smoke: /clients",
  "dashboard browser smoke: /payments",
  "dashboard browser smoke: /portfolio",
  "dashboard browser smoke: /travel",
  "dashboard browser smoke: /messages",
  "dashboard browser smoke: /settings",
  "GitHub Actions dashboard build/runtime evidence job",
] as const;

export const dashboardBuildArtifactPaths = [
  "coverage/dashboard-build-runtime.json",
  "coverage/dashboard-install-output.txt",
  "coverage/dashboard-next-react-types.txt",
  "coverage/dashboard-typecheck.txt",
  "coverage/dashboard-build.txt",
  "coverage/dashboard-test.txt",
  "coverage/dashboard-browser-home.json",
  "coverage/dashboard-browser-bookings.json",
  "coverage/dashboard-browser-clients.json",
  "coverage/dashboard-browser-payments.json",
  "coverage/dashboard-browser-portfolio.json",
  "coverage/dashboard-browser-travel.json",
  "coverage/dashboard-browser-messages.json",
  "coverage/dashboard-browser-settings.json",
  "coverage/dashboard-next15-runtime-smoke.json",
  "coverage/dashboard-build-ci-evidence.json",
  "coverage/dashboard-build-secret-safe-artifacts.json",
  "test-results/dashboard-build-runtime",
] as const;

export const dashboardBuildRuntimeMatrix = [
  {
    id: "dependency-install",
    command: "pnpm install",
    artifact: "coverage/dashboard-install-output.txt",
    status: "install-gated",
  },
  {
    id: "next-react-types",
    command: "verify Next 15, React 19, JSX, and route handler types are installed",
    artifact: "coverage/dashboard-next-react-types.txt",
    status: "type-gated",
  },
  {
    id: "dashboard-typecheck",
    command: "pnpm --filter @inkroute/dashboard typecheck",
    artifact: "coverage/dashboard-typecheck.txt",
    status: "type-gated",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifact: "coverage/dashboard-build.txt",
    status: "build-gated",
  },
  {
    id: "dashboard-tests",
    command: "pnpm --filter @inkroute/dashboard test",
    artifact: "coverage/dashboard-test.txt",
    status: "browser-gated",
  },
  {
    id: "browser-home",
    command: "dashboard browser smoke: /",
    artifact: "coverage/dashboard-browser-home.json",
    status: "browser-gated",
  },
  {
    id: "browser-bookings-clients",
    command: "dashboard browser smoke: /bookings && dashboard browser smoke: /clients",
    artifact: "coverage/dashboard-browser-bookings.json",
    status: "browser-gated",
  },
  {
    id: "browser-commerce-content",
    command: "dashboard browser smoke: /payments && dashboard browser smoke: /portfolio && dashboard browser smoke: /travel",
    artifact: "coverage/dashboard-browser-payments.json",
    status: "browser-gated",
  },
  {
    id: "browser-messages-settings",
    command: "dashboard browser smoke: /messages && dashboard browser smoke: /settings",
    artifact: "coverage/dashboard-browser-messages.json",
    status: "browser-gated",
  },
  {
    id: "next15-runtime",
    command: "verify Next 15 app-router runtime, metadata, middleware, route handlers, and server components",
    artifact: "coverage/dashboard-next15-runtime-smoke.json",
    status: "build-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions dashboard build/runtime evidence job",
    artifact: "coverage/dashboard-build-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DashboardBuildRuntimeMatrixEntry[];

export const dashboardBuildRuntimeReadiness = buildDashboardLaunchEvidencePlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    build: "next build",
    test: "playwright test --project=dashboard-chromium",
  },
  dashboardTypecheckPassed: false,
  dashboardBuildPassed: false,
  dashboardUnitTestsPassed: false,
  dashboardPlaywrightSmokePassed: false,
  seededTenantDataAvailable: false,
  providerBackedAuthConfigured: false,
  tenantScopedApisImplemented: true,
  prismaRepositoriesImplemented: true,
  realMutationsEnabled: false,
  mutationAuditLogsPersisted: false,
  providerActionsImplemented: false,
  rbacDenialTestsPassed: false,
  crossTenantDenialTestsPassed: false,
  fieldRedactionVerified: false,
  loadingEmptyErrorStatesVerified: false,
  ciEvidenceCaptured: false,
  dashboardArtifactsSecretSafe: false,
});
