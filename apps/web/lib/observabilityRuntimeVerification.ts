import {
  buildObservabilityRuntimeVerificationPlan,
  type ObservabilityRuntimeVerificationPlan,
} from "@inkroute/observability";

export type ObservabilityRuntimeSurfaceId =
  | "web-global-error"
  | "dashboard-global-error"
  | "public-error-report-api"
  | "sentry-webhook-api"
  | "dashboard-error-triage"
  | "mobile-system-status"
  | "sanitized-log-capture"
  | "local-fallback-persistence"
  | "sentry-provider-proof"
  | "runtime-closeout-artifacts";

export type ObservabilityRuntimeSurface = {
  id: ObservabilityRuntimeSurfaceId;
  command: string;
  artifacts: string[];
  syntheticOnly: true;
  piiPolicy: "redacted-only";
};

export type ObservabilityRuntimeVerificationStatus =
  | "wired"
  | "browser-gated"
  | "api-gated"
  | "mobile-gated"
  | "provider-gated"
  | "privacy-gated"
  | "ci-gated";

export interface ObservabilityRuntimeVerificationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ObservabilityRuntimeVerificationStatus;
}

export const observabilityRuntimeSurfaces: ObservabilityRuntimeSurface[] = [
  {
    id: "web-global-error",
    command: "pnpm playwright test apps/web/tests/e2e/observability-web-error.spec.ts",
    artifacts: ["coverage/observability-web-error-screenshot.png", "test-results/observability/web"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "dashboard-global-error",
    command: "pnpm playwright test apps/dashboard/tests/observability-dashboard-error.spec.ts",
    artifacts: ["coverage/observability-dashboard-error-screenshot.png", "test-results/observability/dashboard"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "public-error-report-api",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifacts: ["coverage/observability-public-api-forced-error.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sentry-webhook-api",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts",
    artifacts: ["coverage/observability-sentry-webhook-forced-error.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "dashboard-error-triage",
    command: "pnpm playwright test apps/dashboard/tests/observability-triage.spec.ts",
    artifacts: ["coverage/observability-dashboard-triage.png", "test-results/observability/dashboard"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "mobile-system-status",
    command: "pnpm --filter @inkroute/mobile test -- SystemStatusScreen",
    artifacts: ["coverage/observability-mobile-system-status.png", "test-results/observability/mobile"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sanitized-log-capture",
    command: "capture sanitized forced-error logs from web, dashboard, API, webhook, and mobile surfaces",
    artifacts: ["coverage/observability-sanitized-logs.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "local-fallback-persistence",
    command: "pnpm vitest run apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
    artifacts: ["coverage/observability-local-fallback-persistence.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "sentry-provider-proof",
    command: "Sentry/provider live runtime proof after SDK and credentials are configured",
    artifacts: ["coverage/observability-sentry-provider-proof-redacted.json"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
  {
    id: "runtime-closeout-artifacts",
    command: "attach runtime screenshots, sanitized logs, provider proof, and no-PII checklist to closeout",
    artifacts: ["coverage/observability-runtime-closeout.md"],
    syntheticOnly: true,
    piiPolicy: "redacted-only",
  },
];

export const observabilityRuntimeVerificationCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/observability-runtime-verification-static.test.ts apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
  "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
  "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
  "pnpm --filter @inkroute/mobile test -- SystemStatusScreen",
  "Sentry/provider live runtime proof with redacted synthetic payloads",
  "no-PII observability artifact audit",
] as const;

export const observabilityRuntimeArtifactPaths = [
  "coverage/observability-package-typecheck.txt",
  "coverage/observability-package-test.txt",
  "coverage/observability-runtime-static-contract.json",
  "coverage/observability-web-error-screenshot.png",
  "coverage/observability-dashboard-error-screenshot.png",
  "coverage/observability-public-api-forced-error.json",
  "coverage/observability-sentry-webhook-forced-error.json",
  "coverage/observability-dashboard-triage.png",
  "coverage/observability-mobile-system-status.png",
  "coverage/observability-sanitized-logs.json",
  "coverage/observability-local-fallback-persistence.json",
  "coverage/observability-sentry-provider-proof-redacted.json",
  "coverage/observability-provider-webhook-proof-redacted.json",
  "coverage/observability-no-pii-artifact-audit.json",
  "coverage/observability-ci-evidence.json",
  "coverage/observability-runtime-closeout.md",
  "test-results/observability/web",
  "test-results/observability/dashboard",
  "test-results/observability/mobile",
] as const;

export const observabilityRuntimeVerificationMatrix: readonly ObservabilityRuntimeVerificationMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/observability-package-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/observability-package-test.txt", status: "wired" },
  { id: "static-contracts", command: "observability runtime static contract suite", artifact: "coverage/observability-runtime-static-contract.json", status: "wired" },
  { id: "web-global-error", command: "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts", artifact: "coverage/observability-web-error-screenshot.png", status: "browser-gated" },
  { id: "dashboard-global-error", command: "pnpm playwright test apps/dashboard/tests/observability-dashboard-error.spec.ts", artifact: "coverage/observability-dashboard-error-screenshot.png", status: "browser-gated" },
  { id: "public-error-report-api", command: "pnpm vitest run apps/web/tests/observability-routes.test.ts", artifact: "coverage/observability-public-api-forced-error.json", status: "api-gated" },
  { id: "sentry-webhook-api", command: "pnpm vitest run apps/web/tests/observability-routes.test.ts", artifact: "coverage/observability-sentry-webhook-forced-error.json", status: "api-gated" },
  { id: "dashboard-triage", command: "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts", artifact: "coverage/observability-dashboard-triage.png", status: "browser-gated" },
  { id: "mobile-system-status", command: "pnpm --filter @inkroute/mobile test -- SystemStatusScreen", artifact: "coverage/observability-mobile-system-status.png", status: "mobile-gated" },
  { id: "sanitized-logs", command: "capture sanitized forced-error logs", artifact: "coverage/observability-sanitized-logs.json", status: "privacy-gated" },
  { id: "local-fallback-persistence", command: "local fallback persistence smoke", artifact: "coverage/observability-local-fallback-persistence.json", status: "api-gated" },
  { id: "sentry-provider-proof", command: "Sentry/provider live runtime proof", artifact: "coverage/observability-sentry-provider-proof-redacted.json", status: "provider-gated" },
  { id: "provider-webhook-proof", command: "provider webhook reconciliation proof", artifact: "coverage/observability-provider-webhook-proof-redacted.json", status: "provider-gated" },
  { id: "no-pii-artifact-audit", command: "no-PII observability artifact audit", artifact: "coverage/observability-no-pii-artifact-audit.json", status: "privacy-gated" },
  { id: "ci-observability-runtime-gate", command: "GitHub Actions observability runtime verification gate", artifact: "coverage/observability-ci-evidence.json", status: "ci-gated" },
  { id: "runtime-closeout", command: "attach runtime closeout evidence", artifact: "coverage/observability-runtime-closeout.md", status: "ci-gated" },
] as const;

export const safeSyntheticErrorPayload = {
  message: "Synthetic observability verification error [redacted:test-only]",
  route: "/__observability/synthetic-error",
  release: "phase11-runtime-verification",
  metadata: {
    synthetic: true,
    pii: "none",
    medicalNotes: "[redacted:test-only]",
    payment: "[redacted:test-only]",
    token: "[redacted:test-only]",
  },
} as const;

export function buildObservabilityRuntimeVerificationContract(): ObservabilityRuntimeVerificationPlan {
  return buildObservabilityRuntimeVerificationPlan({
    packageScripts: ["test", "typecheck"],
    packageTestsPassed: false,
    packageTypecheckPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    mobileTypecheckPassed: false,
    routeSmokeTestsPassed: false,
    forcedWebErrorUxVerified: false,
    forcedDashboardErrorUxVerified: false,
    forcedApiErrorVerified: false,
    forcedWebhookErrorVerified: false,
    forcedMobileErrorUxVerified: false,
    browserScreenshotsCaptured: false,
    simulatorOrDeviceScreenshotsCaptured: false,
    sanitizedLogOutputCaptured: false,
    localFallbackPersistenceVerified: false,
    dashboardTriageDisplayVerified: false,
    sentrySdkConfigured: false,
    liveSentryProviderProofCaptured: false,
    providerWebhookProofCaptured: false,
    noPiiLeakageVerified: false,
    runtimeEvidenceAttached: false,
  });
}

export const observabilityRuntimeVerificationContract = buildObservabilityRuntimeVerificationContract();
