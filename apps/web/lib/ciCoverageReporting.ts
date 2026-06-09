import { buildCiCoverageReportingReadinessPlan } from "@inkroute/testing";

export type CiCoverageReportingStatus =
  | "wired"
  | "ci-gated"
  | "repository-gated";

export interface CiCoverageReportingMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: CiCoverageReportingStatus;
}

export interface CiCoverageRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "repository_gated";
  reportingMatrix: readonly CiCoverageReportingMatrixEntry[];
  artifactManifest: readonly string[];
  frozenInstallPassed: boolean;
  typecheckPassed: boolean;
  unitCoveragePassed: boolean;
  unitCoverageThresholdsPassed: boolean;
  e2ePassed: boolean;
  vitestReportsUploaded: boolean;
  playwrightReportsUploaded: boolean;
  tracesScreenshotsVideosRetained: boolean;
  testSummaryPublished: boolean;
  artifactRetentionVerified: boolean;
  failedDebugArtifactsVerified: boolean;
  flakyPolicyDocumented: boolean;
  ciRunPassed: boolean;
  branchProtectionRequiresCi: boolean;
  branchProtectionArtifactPath?: string;
  ciRunUrl?: string;
}

export interface CiCoverageRunPersistenceContract {
  modelName: "CiCoverageRun";
  row: CiCoverageRunPersistenceInput;
  transactionWrites: readonly ["CiCoverageRun", "AuditLog"];
  requiredCiFlags: readonly [
    "frozenInstallPassed",
    "typecheckPassed",
    "unitCoveragePassed",
    "unitCoverageThresholdsPassed",
    "e2ePassed",
    "vitestReportsUploaded",
    "playwrightReportsUploaded",
    "tracesScreenshotsVideosRetained",
    "testSummaryPublished",
    "artifactRetentionVerified",
    "failedDebugArtifactsVerified",
    "flakyPolicyDocumented",
    "ciRunPassed",
    "branchProtectionRequiresCi",
  ];
  artifactFields: readonly ["reportingMatrix", "artifactManifest", "branchProtectionArtifactPath"];
  tenantIsolationKey: "tenantId";
}

export const ciCoverageReportingArtifactPaths = [
  "coverage/ci-coverage-reporting.json",
  "coverage/unit",
  "coverage/unit/coverage-final.json",
  "coverage/unit/lcov.info",
  "coverage/playwright-report",
  "coverage/playwright-results.json",
  "coverage/playwright-junit.xml",
  "coverage/playwright-traces",
  "coverage/playwright-screenshots",
  "coverage/playwright-videos",
  "coverage/ci-test-summary.md",
  "coverage/ci-artifact-retention.json",
  "coverage/ci-branch-protection-redacted.json",
  "coverage/ci-flaky-policy.md",
  "coverage/ci-failed-test-debug-artifacts.json",
  "test-results/ci-coverage-reporting"
] as const;

export const ciCoverageReportingCommands = [
  "pnpm install --frozen-lockfile",
  "pnpm typecheck",
  "pnpm test:unit:coverage",
  "pnpm test:e2e",
  "gh run view <ci-run-id> --json conclusion,status,url",
  "gh api repos/:owner/:repo/actions/runs/<ci-run-id>/artifacts",
  "verify branch protection requires CI quality check"
] as const;

export const ciCoverageReportingMatrix: readonly CiCoverageReportingMatrixEntry[] = [
  {
    id: "frozen-install-typecheck",
    command: "pnpm install --frozen-lockfile && pnpm typecheck",
    artifact: "coverage/ci-coverage-reporting.json",
    status: "wired"
  },
  {
    id: "unit-coverage-thresholds",
    command: "pnpm test:unit:coverage",
    artifact: "coverage/unit/coverage-final.json",
    status: "wired"
  },
  {
    id: "playwright-reporters",
    command: "pnpm test:e2e",
    artifact: "coverage/playwright-report",
    status: "wired"
  },
  {
    id: "machine-readable-reports",
    command: "publish Vitest JSON/LCOV and Playwright JSON/JUnit reports",
    artifact: "coverage/playwright-junit.xml",
    status: "wired"
  },
  {
    id: "failure-debug-media",
    command: "retain Playwright traces, screenshots, videos, and failed-test debug artifacts",
    artifact: "coverage/ci-failed-test-debug-artifacts.json",
    status: "ci-gated"
  },
  {
    id: "test-summary-retention-flaky-policy",
    command: "publish CI test summary and retain flaky retry/quarantine policy evidence",
    artifact: "coverage/ci-test-summary.md",
    status: "ci-gated"
  },
  {
    id: "ci-run-branch-protection",
    command: "gh run view <ci-run-id> and verify branch protection requires CI quality check",
    artifact: "coverage/ci-branch-protection-redacted.json",
    status: "repository-gated"
  }
];

export function buildCiCoverageRunPersistenceContract(
  input: CiCoverageRunPersistenceInput,
): CiCoverageRunPersistenceContract {
  return {
    modelName: "CiCoverageRun",
    row: input,
    transactionWrites: ["CiCoverageRun", "AuditLog"],
    requiredCiFlags: [
      "frozenInstallPassed",
      "typecheckPassed",
      "unitCoveragePassed",
      "unitCoverageThresholdsPassed",
      "e2ePassed",
      "vitestReportsUploaded",
      "playwrightReportsUploaded",
      "tracesScreenshotsVideosRetained",
      "testSummaryPublished",
      "artifactRetentionVerified",
      "failedDebugArtifactsVerified",
      "flakyPolicyDocumented",
      "ciRunPassed",
      "branchProtectionRequiresCi",
    ],
    artifactFields: ["reportingMatrix", "artifactManifest", "branchProtectionArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

export const ciCoverageReportingReadiness = buildCiCoverageReportingReadinessPlan({
  rootScripts: ["test:unit:coverage", "test:e2e", "typecheck"],
  ciWorkflowRunsInstall: true,
  ciWorkflowRunsTypecheck: true,
  ciWorkflowRunsUnitCoverage: true,
  ciWorkflowRunsE2e: true,
  coverageThresholdsConfigured: true,
  vitestCoverageArtifactUploaded: true,
  playwrightReportArtifactUploaded: true,
  playwrightTracesScreenshotsVideosUploaded: true,
  junitJsonReportsPublished: true,
  ciRunPassed: false,
  branchProtectionRequiresCi: false,
  flakyRetryPolicyConfigured: true,
  flakyQuarantineDocumented: false,
  testReportSummaryPublished: true,
  artifactRetentionConfigured: true,
  failureDebugArtifactsVerified: false
});

export const ciCoverageRunPersistencePreview = buildCiCoverageRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "ci-coverage-demo",
  status: "repository_gated",
  reportingMatrix: ciCoverageReportingMatrix,
  artifactManifest: ciCoverageReportingArtifactPaths,
  frozenInstallPassed: false,
  typecheckPassed: false,
  unitCoveragePassed: false,
  unitCoverageThresholdsPassed: true,
  e2ePassed: false,
  vitestReportsUploaded: true,
  playwrightReportsUploaded: true,
  tracesScreenshotsVideosRetained: true,
  testSummaryPublished: true,
  artifactRetentionVerified: true,
  failedDebugArtifactsVerified: false,
  flakyPolicyDocumented: false,
  ciRunPassed: false,
  branchProtectionRequiresCi: false,
  branchProtectionArtifactPath: "coverage/ci-branch-protection-redacted.json",
});
