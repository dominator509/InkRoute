import { buildPerformanceLoadRuntimeReadinessPlan } from "@inkroute/testing";

export type PerformanceLoadRuntimeStatus =
  | "wired"
  | "runtime-gated"
  | "database-gated"
  | "ci-gated";

export interface PerformanceLoadRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PerformanceLoadRuntimeStatus;
}

export const performanceLoadRuntimeArtifactPaths = [
  "coverage/performance-load-runtime.json",
  "coverage/performance-budget-verification.json",
  "coverage/performance-lighthouse-ci.json",
  "coverage/performance-core-web-vitals.json",
  "coverage/performance-public-route-budgets.json",
  "coverage/performance-dashboard-route-budgets.json",
  "coverage/performance-booking-load.json",
  "coverage/performance-webhook-burst.json",
  "coverage/performance-upload-intent-load.json",
  "coverage/performance-db-explain-analyze.json",
  "coverage/performance-image-optimization.json",
  "coverage/performance-regression-thresholds.json",
  "coverage/performance-ci-run-redacted.json",
  "coverage/performance-regression-triage.md",
  "test-results/performance-load-runtime"
] as const;

export const performanceLoadRuntimeCommands = [
  "pnpm test:performance:budgets",
  "Lighthouse CI for public and dashboard route budgets",
  "load test public booking, Stripe webhook, and secure upload intent endpoints",
  "database EXPLAIN/ANALYZE query-plan checks",
  "image optimization benchmark report",
  "GitHub Actions performance/load job"
] as const;

export const performanceLoadRuntimeMatrix: readonly PerformanceLoadRuntimeMatrixEntry[] = [
  {
    id: "budget-verifier",
    command: "pnpm test:performance:budgets",
    artifact: "coverage/performance-budget-verification.json",
    status: "wired"
  },
  {
    id: "lighthouse-core-web-vitals",
    command: "Lighthouse CI for public and dashboard route budgets",
    artifact: "coverage/performance-lighthouse-ci.json",
    status: "runtime-gated"
  },
  {
    id: "public-dashboard-route-budgets",
    command: "measure public home/booking/city SEO and dashboard overview/bookings budgets",
    artifact: "coverage/performance-public-route-budgets.json",
    status: "runtime-gated"
  },
  {
    id: "booking-webhook-upload-load",
    command: "load test public booking, Stripe webhook, and secure upload intent endpoints",
    artifact: "coverage/performance-booking-load.json",
    status: "runtime-gated"
  },
  {
    id: "db-explain-analyze",
    command: "database EXPLAIN/ANALYZE query-plan checks",
    artifact: "coverage/performance-db-explain-analyze.json",
    status: "database-gated"
  },
  {
    id: "image-optimization-benchmarks",
    command: "image optimization benchmark report",
    artifact: "coverage/performance-image-optimization.json",
    status: "runtime-gated"
  },
  {
    id: "regression-thresholds-artifacts-ci",
    command: "GitHub Actions performance/load job with regression thresholds and triage",
    artifact: "coverage/performance-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const performanceLoadRuntimeReadiness = buildPerformanceLoadRuntimeReadinessPlan({
  rootScripts: ["test:performance:budgets"],
  performanceBudgetVerifierPassed: true,
  lighthouseCiPassed: false,
  coreWebVitalsWithinBudget: false,
  publicRouteBudgetsPassed: false,
  dashboardRouteBudgetsPassed: false,
  bookingLoadTestPassed: false,
  webhookBurstTestPassed: false,
  uploadIntentLoadTestPassed: false,
  dbExplainPlansPassed: false,
  imageOptimizationBenchmarksPassed: false,
  regressionThresholdsConfigured: true,
  performanceArtifactsRetained: true,
  ciPerformanceJobPassed: false,
  regressionsTriagedAndFixed: false
});
