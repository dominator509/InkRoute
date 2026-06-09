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

export interface AppE2eRuntimeRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "ci_gated";
  runtimeMatrix: readonly AppE2eRuntimeMatrixEntry[];
  specFiles: readonly string[];
  artifactManifest: readonly string[];
  webBuildPassed: boolean;
  dashboardBuildPassed: boolean;
  webRuntimeStarted: boolean;
  dashboardRuntimeStarted: boolean;
  chromiumInstalled: boolean;
  publicSpecsPassed: boolean;
  dashboardSpecsPassed: boolean;
  e2eManifestVerified: boolean;
  tracesRetained: boolean;
  screenshotsRetained: boolean;
  videosRetained: boolean;
  ciE2ePassed: boolean;
  flakyRetriesConfigured: boolean;
  hardenedFailuresCommitted: boolean;
  failureHardeningArtifactPath?: string;
  ciRunUrl?: string;
}

export interface AppE2eRuntimeRunPersistenceContract {
  modelName: "AppE2eRuntimeRun";
  row: AppE2eRuntimeRunPersistenceInput;
  transactionWrites: readonly ["AppE2eRuntimeRun", "AuditLog"];
  requiredRuntimeFlags: readonly [
    "webBuildPassed",
    "dashboardBuildPassed",
    "webRuntimeStarted",
    "dashboardRuntimeStarted",
    "chromiumInstalled",
    "publicSpecsPassed",
    "dashboardSpecsPassed",
    "e2eManifestVerified",
    "tracesRetained",
    "screenshotsRetained",
    "videosRetained",
    "ciE2ePassed",
    "flakyRetriesConfigured",
    "hardenedFailuresCommitted",
  ];
  artifactFields: readonly ["runtimeMatrix", "specFiles", "artifactManifest", "failureHardeningArtifactPath"];
  tenantIsolationKey: "tenantId";
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

export function buildAppE2eRuntimeRunPersistenceContract(
  input: AppE2eRuntimeRunPersistenceInput,
): AppE2eRuntimeRunPersistenceContract {
  return {
    modelName: "AppE2eRuntimeRun",
    row: input,
    transactionWrites: ["AppE2eRuntimeRun", "AuditLog"],
    requiredRuntimeFlags: [
      "webBuildPassed",
      "dashboardBuildPassed",
      "webRuntimeStarted",
      "dashboardRuntimeStarted",
      "chromiumInstalled",
      "publicSpecsPassed",
      "dashboardSpecsPassed",
      "e2eManifestVerified",
      "tracesRetained",
      "screenshotsRetained",
      "videosRetained",
      "ciE2ePassed",
      "flakyRetriesConfigured",
      "hardenedFailuresCommitted",
    ],
    artifactFields: ["runtimeMatrix", "specFiles", "artifactManifest", "failureHardeningArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

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

export const appE2eRuntimeRunPersistencePreview = buildAppE2eRuntimeRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "app-e2e-runtime-demo",
  status: "ci_gated",
  runtimeMatrix: appE2eRuntimeMatrix,
  specFiles: appE2eRuntimeSpecFiles,
  artifactManifest: appE2eRuntimeArtifactPaths,
  webBuildPassed: false,
  dashboardBuildPassed: false,
  webRuntimeStarted: false,
  dashboardRuntimeStarted: false,
  chromiumInstalled: false,
  publicSpecsPassed: false,
  dashboardSpecsPassed: false,
  e2eManifestVerified: false,
  tracesRetained: true,
  screenshotsRetained: true,
  videosRetained: true,
  ciE2ePassed: false,
  flakyRetriesConfigured: true,
  hardenedFailuresCommitted: false,
  failureHardeningArtifactPath: "coverage/app-e2e-runtime.json",
});
