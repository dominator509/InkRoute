import { buildPhase14RunnerExecutionReadinessPlan } from "@inkroute/testing";

export type Phase14RunnerExecutionStatus =
  | "wired"
  | "execution-gated"
  | "ci-gated"
  | "human-gated";

export interface Phase14RunnerExecutionMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: Phase14RunnerExecutionStatus;
}

export interface Phase14RunnerRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "ci_gated";
  commandMatrix: readonly Phase14RunnerExecutionMatrixEntry[];
  artifactManifest: readonly string[];
  frozenInstallPassed: boolean;
  lockfileReproducible: boolean;
  staticChecksPassed: boolean;
  manifestChecksPassed: boolean;
  typecheckPassed: boolean;
  unitPassed: boolean;
  playwrightBrowsersInstalled: boolean;
  e2ePassed: boolean;
  ciPassed: boolean;
  runnerFailuresTriaged: boolean;
  runnerFixesCommitted: boolean;
  scaffoldCoveragePreserved: boolean;
  flakyPolicyDocumented: boolean;
  triageArtifactPath?: string;
  scaffoldDiffArtifactPath?: string;
  flakyPolicyArtifactPath?: string;
  ciRunUrl?: string;
}

export interface Phase14RunnerRunPersistenceContract {
  modelName: "Phase14RunnerRun";
  row: Phase14RunnerRunPersistenceInput;
  transactionWrites: readonly ["Phase14RunnerRun", "AuditLog"];
  requiredRunnerFlags: readonly [
    "frozenInstallPassed",
    "lockfileReproducible",
    "staticChecksPassed",
    "manifestChecksPassed",
    "typecheckPassed",
    "unitPassed",
    "playwrightBrowsersInstalled",
    "e2ePassed",
    "ciPassed",
    "runnerFailuresTriaged",
    "runnerFixesCommitted",
    "scaffoldCoveragePreserved",
    "flakyPolicyDocumented",
  ];
  artifactFields: readonly ["commandMatrix", "artifactManifest", "triageArtifactPath", "scaffoldDiffArtifactPath", "flakyPolicyArtifactPath"];
  tenantIsolationKey: "tenantId";
}

export const phase14RunnerArtifactPaths = [
  "coverage/phase14-runner-execution.json",
  "coverage/phase14-frozen-install.log",
  "coverage/phase14-static-check.json",
  "coverage/phase14-manifest-check.json",
  "coverage/phase14-typecheck.log",
  "coverage/phase14-unit-results.json",
  "coverage/phase14-playwright-install.log",
  "coverage/phase14-e2e-results.json",
  "coverage/phase14-ci-run-redacted.json",
  "coverage/phase14-runner-failure-triage.md",
  "coverage/phase14-scaffold-coverage-diff.json",
  "coverage/phase14-flaky-policy.md",
  "test-results/phase14-runner"
] as const;

export const phase14RunnerCommands = [
  "pnpm install --frozen-lockfile",
  "pnpm test:phase14:static",
  "pnpm test:manifest",
  "pnpm typecheck",
  "pnpm test:unit",
  "pnpm exec playwright install --with-deps",
  "pnpm test:e2e",
  "GitHub Actions CI quality workflow"
] as const;

export const phase14RunnerExecutionMatrix: readonly Phase14RunnerExecutionMatrixEntry[] = [
  {
    id: "frozen-install",
    command: "pnpm install --frozen-lockfile",
    artifact: "coverage/phase14-frozen-install.log",
    status: "execution-gated"
  },
  {
    id: "static-manifest-checks",
    command: "pnpm test:phase14:static && pnpm test:manifest",
    artifact: "coverage/phase14-manifest-check.json",
    status: "wired"
  },
  {
    id: "workspace-typecheck-unit",
    command: "pnpm typecheck && pnpm test:unit",
    artifact: "coverage/phase14-unit-results.json",
    status: "execution-gated"
  },
  {
    id: "playwright-browser-install",
    command: "pnpm exec playwright install --with-deps",
    artifact: "coverage/phase14-playwright-install.log",
    status: "execution-gated"
  },
  {
    id: "web-dashboard-e2e",
    command: "pnpm test:e2e",
    artifact: "coverage/phase14-e2e-results.json",
    status: "execution-gated"
  },
  {
    id: "ci-artifacts",
    command: "GitHub Actions CI quality workflow",
    artifact: "coverage/phase14-ci-run-redacted.json",
    status: "ci-gated"
  },
  {
    id: "runner-failure-triage",
    command: "triage real runner failures and commit fixes",
    artifact: "coverage/phase14-runner-failure-triage.md",
    status: "human-gated"
  },
  {
    id: "scaffold-flaky-policy",
    command: "preserve scaffold coverage and document flaky retry/quarantine policy",
    artifact: "coverage/phase14-flaky-policy.md",
    status: "human-gated"
  }
];

export function buildPhase14RunnerRunPersistenceContract(
  input: Phase14RunnerRunPersistenceInput,
): Phase14RunnerRunPersistenceContract {
  return {
    modelName: "Phase14RunnerRun",
    row: input,
    transactionWrites: ["Phase14RunnerRun", "AuditLog"],
    requiredRunnerFlags: [
      "frozenInstallPassed",
      "lockfileReproducible",
      "staticChecksPassed",
      "manifestChecksPassed",
      "typecheckPassed",
      "unitPassed",
      "playwrightBrowsersInstalled",
      "e2ePassed",
      "ciPassed",
      "runnerFailuresTriaged",
      "runnerFixesCommitted",
      "scaffoldCoveragePreserved",
      "flakyPolicyDocumented",
    ],
    artifactFields: ["commandMatrix", "artifactManifest", "triageArtifactPath", "scaffoldDiffArtifactPath", "flakyPolicyArtifactPath"],
    tenantIsolationKey: "tenantId",
  };
}

export const phase14RunnerExecutionReadiness = buildPhase14RunnerExecutionReadinessPlan({
  rootScripts: [
    "test:phase14:static",
    "test:manifest",
    "test:unit",
    "test:e2e",
    "typecheck"
  ],
  lockfileCommitted: true,
  frozenInstallPassed: false,
  vitestWorkspaceResolved: true,
  playwrightBrowsersInstalled: false,
  phase14StaticPassed: false,
  manifestVerificationPassed: false,
  unitCommandPassed: false,
  e2eCommandPassed: false,
  typecheckCommandPassed: false,
  ciWorkflowPassed: false,
  ciArtifactsUploaded: true,
  runnerFailuresTriaged: false,
  runnerFixesCommitted: false,
  scaffoldCoveragePreserved: true,
  flakyRetryPolicyDocumented: false
});

export const phase14RunnerRunPersistencePreview = buildPhase14RunnerRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "phase14-runner-demo",
  status: "ci_gated",
  commandMatrix: phase14RunnerExecutionMatrix,
  artifactManifest: phase14RunnerArtifactPaths,
  frozenInstallPassed: false,
  lockfileReproducible: true,
  staticChecksPassed: false,
  manifestChecksPassed: false,
  typecheckPassed: false,
  unitPassed: false,
  playwrightBrowsersInstalled: false,
  e2ePassed: false,
  ciPassed: false,
  runnerFailuresTriaged: false,
  runnerFixesCommitted: false,
  scaffoldCoveragePreserved: true,
  flakyPolicyDocumented: false,
  triageArtifactPath: "coverage/phase14-runner-failure-triage.md",
  scaffoldDiffArtifactPath: "coverage/phase14-scaffold-coverage-diff.json",
  flakyPolicyArtifactPath: "coverage/phase14-flaky-policy.md",
});
