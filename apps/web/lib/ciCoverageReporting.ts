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

export type CiCoverageRunData = CiCoverageRunPersistenceInput & {
  commitSha: string | null;
  branchProtectionArtifactPath: string | null;
  ciRunUrl: string | null;
};

export interface CiCoverageRunRepository {
  readonly ciCoverageRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: CiCoverageRunData;
      update: CiCoverageRunData;
    }): unknown;
  };
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

export const ciCoverageReportingProofFiles = [
  "apps/web/lib/ciCoverageReporting.ts",
  "apps/web/tests/ci-coverage-reporting-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609014000_add_ci_coverage_runs/migration.sql",
  ".github/workflows/ci.yml",
  "package.json",
  "vitest.workspace.ts",
  "playwright.config.ts",
  "testing/scripts/phase14-static-check.mjs",
  "testing/manifests/unit-test-manifest.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
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

export const ciCoverageReportingRequiredExternalEvidence = [
  "Passing GitHub Actions CI quality run proof",
  "Uploaded Vitest coverage and Playwright report proof",
  "Trace, screenshot, video, and failed-test debug artifact proof",
  "Branch protection required-check proof",
  "Flaky quarantine/escalation policy proof",
  "Provider-backed CiCoverageRun persistence proof",
] as const;

export type CiCoverageReportingArtifact = (typeof ciCoverageReportingArtifactPaths)[number];

export type CiCoverageReportingCommand = (typeof ciCoverageReportingCommands)[number];

export type CiCoverageReportingExecutionPolicy = {
  localMatrixOnly: true;
  frozenInstallRequiresExternalEvidence: true;
  typecheckRequiresExternalEvidence: true;
  unitCoverageRequiresExternalEvidence: true;
  e2eRequiresExternalEvidence: true;
  githubRunRequiresExternalEvidence: true;
  branchProtectionRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof ciCoverageReportingRequiredExternalEvidence;
};

export type CiCoverageReportingEvidenceInput = {
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
  requiredCommandsRun: readonly CiCoverageReportingCommand[];
  capturedArtifacts: readonly CiCoverageReportingArtifact[];
};

export type CiCoverageReportingEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: CiCoverageReportingArtifact[];
  requiredCommands: typeof ciCoverageReportingCommands;
  requiredEvidence: typeof ciCoverageReportingArtifactPaths;
  ciPolicy: {
    branchProtectionRequired: true;
    failedDebugArtifactsRequired: true;
    flakyQuarantinePolicyRequired: true;
  };
};

export type CiCoverageReportingExecutionPlan = {
  status: "local-plan-ready";
  policy: CiCoverageReportingExecutionPolicy;
  externalEvidenceRequired: typeof ciCoverageReportingRequiredExternalEvidence;
  frozenInstallExecutionAllowed: false;
  typecheckExecutionAllowed: false;
  unitCoverageExecutionAllowed: false;
  e2eExecutionAllowed: false;
  githubRunExecutionAllowed: false;
  branchProtectionExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof ciCoverageReportingLocalCommands;
  externalCommands: typeof ciCoverageReportingCommands;
  localArtifacts: typeof ciCoverageReportingLocalArtifacts;
  externalArtifacts: typeof ciCoverageReportingExternalArtifacts;
  disabledReasons: readonly string[];
};

export const ciCoverageReportingExecutionPolicy: CiCoverageReportingExecutionPolicy = {
  localMatrixOnly: true,
  frozenInstallRequiresExternalEvidence: true,
  typecheckRequiresExternalEvidence: true,
  unitCoverageRequiresExternalEvidence: true,
  e2eRequiresExternalEvidence: true,
  githubRunRequiresExternalEvidence: true,
  branchProtectionRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: ciCoverageReportingRequiredExternalEvidence,
};

export type CiCoverageReportingArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof ciCoverageReportingArtifactPaths;
  retainedExternalGates: readonly string[];
};

const ciCoverageSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(branch[_-]?protection[_-]?artifact[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(artifact[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedCiCoverageArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return ciCoverageSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedCiCoverageArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|branchProtectionArtifactPath|artifactUrl|debugArtifact|trace|video|screenshot/i.test(key)
          ? "[REDACTED]"
          : buildRedactedCiCoverageArtifact(entry),
      ]),
    );
  }

  return value;
}

export const ciCoverageReportingLocalCommands = [] as const satisfies readonly CiCoverageReportingCommand[];

export const ciCoverageReportingLocalArtifacts = ["coverage/ci-coverage-reporting.json"] as const;

export const ciCoverageReportingExternalArtifacts = ciCoverageReportingArtifactPaths.filter(
  (artifact) => artifact !== "coverage/ci-coverage-reporting.json",
) as readonly CiCoverageReportingArtifact[];

export function buildCiCoverageReportingExecutionPlan(): CiCoverageReportingExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: ciCoverageReportingExecutionPolicy,
    externalEvidenceRequired: ciCoverageReportingRequiredExternalEvidence,
    frozenInstallExecutionAllowed: false,
    typecheckExecutionAllowed: false,
    unitCoverageExecutionAllowed: false,
    e2eExecutionAllowed: false,
    githubRunExecutionAllowed: false,
    branchProtectionExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: ciCoverageReportingLocalCommands,
    externalCommands: ciCoverageReportingCommands,
    localArtifacts: ciCoverageReportingLocalArtifacts,
    externalArtifacts: ciCoverageReportingExternalArtifacts,
    disabledReasons: [
      "Frozen install, typecheck, and unit coverage proof require CI or local runner execution.",
      "Playwright E2E proof requires browser runtime execution.",
      "GitHub run and artifact proof requires GitHub Actions access.",
      "Branch protection proof requires repository settings inspection.",
      "Failed-test debug media proof requires a real failed or retained CI artifact.",
      "CiCoverageRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildCiCoverageReportingArtifactReview(rawArtifact: unknown): CiCoverageReportingArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedCiCoverageArtifact(rawArtifact),
    requiredArtifacts: ciCoverageReportingArtifactPaths,
    retainedExternalGates: [
      "Passing GitHub Actions CI quality run proof",
      "Uploaded Vitest coverage and Playwright report proof",
      "Trace, screenshot, video, and failed-test debug artifact proof",
      "Branch protection required-check proof",
      "Flaky quarantine/escalation policy proof",
      "Provider-backed CiCoverageRun persistence proof",
    ],
  };
}

export function buildCiCoverageReportingEvidenceDecision(
  input: CiCoverageReportingEvidenceInput,
): CiCoverageReportingEvidenceDecision {
  const blockers = [
    !input.frozenInstallPassed && "Run CI frozen install.",
    !input.typecheckPassed && "Run CI typecheck.",
    !input.unitCoveragePassed && "Run CI unit coverage.",
    !input.unitCoverageThresholdsPassed && "Pass unit coverage thresholds.",
    !input.e2ePassed && "Run CI Playwright E2E.",
    !input.vitestReportsUploaded && "Upload Vitest coverage reports.",
    !input.playwrightReportsUploaded && "Upload Playwright HTML/JSON/JUnit reports.",
    !input.tracesScreenshotsVideosRetained && "Retain Playwright traces, screenshots, and videos.",
    !input.testSummaryPublished && "Publish CI test summary.",
    !input.artifactRetentionVerified && "Verify CI artifact retention paths.",
    !input.failedDebugArtifactsVerified && "Verify failed-test debug artifact paths.",
    !input.flakyPolicyDocumented && "Document flaky retry/quarantine policy.",
    !input.ciRunPassed && "Capture passing CI quality run proof.",
    !input.branchProtectionRequiresCi && "Capture branch protection required-check proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = ciCoverageReportingArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = ciCoverageReportingCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: ciCoverageReportingCommands,
    requiredEvidence: ciCoverageReportingArtifactPaths,
    ciPolicy: {
      branchProtectionRequired: true,
      failedDebugArtifactsRequired: true,
      flakyQuarantinePolicyRequired: true,
    },
  };
}

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

export function buildCiCoverageRunData(input: CiCoverageRunPersistenceInput): CiCoverageRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    branchProtectionArtifactPath: input.branchProtectionArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistCiCoverageRun(
  repository: CiCoverageRunRepository,
  input: CiCoverageRunPersistenceInput,
): unknown {
  const data = buildCiCoverageRunData(input);

  return repository.ciCoverageRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
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
