import { buildAppE2eRuntimeReadinessPlan } from "@inkroute/testing";

export type AppE2eRuntimeStatus =
  | "wired"
  | "execution-gated"
  | "ci-gated"
  | "human-gated";

export interface AppE2eRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AppE2eRuntimeStatus;
}

export const appE2eRuntimeArtifactPaths = [
  "coverage/app-e2e-runtime.json",
  "coverage/app-e2e-web-build.log",
  "coverage/app-e2e-dashboard-build.log",
  "coverage/app-e2e-web-runtime.log",
  "coverage/app-e2e-dashboard-runtime.log",
  "coverage/app-e2e-playwright-install.log",
  "coverage/app-e2e-public-booking-results.json",
  "coverage/app-e2e-public-security-results.json",
  "coverage/app-e2e-public-seo-results.json",
  "coverage/app-e2e-dashboard-smoke-results.json",
  "coverage/app-e2e-dashboard-security-results.json",
  "coverage/app-e2e-dashboard-operator-results.json",
  "coverage/app-e2e-manifest-check.json",
  "coverage/playwright-report",
  "coverage/playwright-results.json",
  "coverage/playwright-junit.xml",
  "test-results/app-e2e-runtime"
] as const;

export const appE2eRuntimeCommands = [
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm exec playwright install --with-deps chromium",
  "pnpm test:e2e --project=web-chromium",
  "pnpm test:e2e --project=dashboard-chromium",
  "pnpm test:manifest",
  "GitHub Actions CI E2E job"
] as const;

export const appE2eRuntimeSpecFiles = [
  "apps/web/tests/e2e/public-booking.spec.ts",
  "apps/web/tests/e2e/security-runtime.spec.ts",
  "apps/web/tests/e2e/public-seo.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-smoke.spec.ts",
  "apps/dashboard/tests/e2e/security-runtime.spec.ts",
  "apps/dashboard/tests/e2e/operator-surfaces.spec.ts"
] as const;

export const appE2eRuntimeMatrix: readonly AppE2eRuntimeMatrixEntry[] = [
  {
    id: "web-build-runtime",
    command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/web dev",
    artifact: "coverage/app-e2e-web-runtime.log",
    status: "execution-gated"
  },
  {
    id: "dashboard-build-runtime",
    command: "pnpm --filter @inkroute/dashboard build && pnpm --filter @inkroute/dashboard dev",
    artifact: "coverage/app-e2e-dashboard-runtime.log",
    status: "execution-gated"
  },
  {
    id: "playwright-chromium-install",
    command: "pnpm exec playwright install --with-deps chromium",
    artifact: "coverage/app-e2e-playwright-install.log",
    status: "execution-gated"
  },
  {
    id: "public-booking-security-seo",
    command: "pnpm test:e2e --project=web-chromium",
    artifact: "coverage/app-e2e-public-booking-results.json",
    status: "execution-gated"
  },
  {
    id: "dashboard-smoke-security-operator",
    command: "pnpm test:e2e --project=dashboard-chromium",
    artifact: "coverage/app-e2e-dashboard-smoke-results.json",
    status: "execution-gated"
  },
  {
    id: "e2e-manifest-verification",
    command: "pnpm test:manifest",
    artifact: "coverage/app-e2e-manifest-check.json",
    status: "wired"
  },
  {
    id: "trace-media-retention",
    command: "retain Playwright report, traces, screenshots, videos, JSON, and JUnit output",
    artifact: "coverage/playwright-report",
    status: "wired"
  },
  {
    id: "ci-e2e-artifacts",
    command: "GitHub Actions CI E2E job",
    artifact: "test-results/app-e2e-runtime",
    status: "ci-gated"
  },
  {
    id: "failure-hardening",
    command: "commit fixes from real Playwright rendering, selector, route, and timing failures",
    artifact: "coverage/app-e2e-runtime.json",
    status: "human-gated"
  }
];

export const appE2eRuntimeReadiness = buildAppE2eRuntimeReadinessPlan({
  rootScripts: ["test:e2e"],
  webBuildPassed: false,
  dashboardBuildPassed: false,
  webRuntimeStarted: false,
  dashboardRuntimeStarted: false,
  playwrightBrowsersInstalled: false,
  publicBookingSpecPassed: false,
  publicSecurityRuntimeSpecPassed: false,
  publicSeoSpecPassed: false,
  dashboardSmokeSpecPassed: false,
  dashboardSecurityRuntimeSpecPassed: false,
  dashboardOperatorSurfacesSpecPassed: false,
  e2eManifestVerificationPassed: false,
  traceCaptureConfigured: true,
  artifactsRetained: true,
  failureScreenshotsVideosRetained: true,
  flakyRetriesConfigured: true,
  hardenedFailuresCommitted: false,
  ciE2eJobPassed: false
});
