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
  commitSha?: string | null;
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
  triageArtifactPath?: string | null;
  scaffoldDiffArtifactPath?: string | null;
  flakyPolicyArtifactPath?: string | null;
  ciRunUrl?: string | null;
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

export type Phase14RunnerRunData = Phase14RunnerRunPersistenceInput & {
  commitSha: string | null;
  triageArtifactPath: string | null;
  scaffoldDiffArtifactPath: string | null;
  flakyPolicyArtifactPath: string | null;
  ciRunUrl: string | null;
};

export interface Phase14RunnerRunRepository {
  readonly phase14RunnerRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: Phase14RunnerRunData;
      update: Phase14RunnerRunData;
    }): unknown;
  };
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

export const phase14RunnerProofFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "vitest.workspace.ts",
  "playwright.config.ts",
  "testing/scripts/verify-test-manifest.mjs",
  "testing/scripts/phase14-static-check.mjs",
  "apps/web/lib/phase14RunnerExecution.ts",
  "apps/web/tests/phase14-runner-execution-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609008000_add_phase14_runner_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  "testing/manifests/e2e-test-manifest.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  ".github/workflows/ci.yml",
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

export const phase14RunnerLocalCommands = ["pnpm test:phase14:static", "pnpm test:manifest"] as const;
const phase14RunnerLocalCommandSet = new Set<string>(phase14RunnerLocalCommands);
export const phase14RunnerExternalCommands = phase14RunnerCommands.filter(
  (command) => !phase14RunnerLocalCommandSet.has(command),
);

export const phase14RunnerRequiredExternalEvidence = [
  "Frozen dependency install proof",
  "Workspace typecheck and unit runner proof",
  "Playwright browser install proof",
  "Web/dashboard E2E proof",
  "GitHub Actions CI quality workflow proof",
  "Runner failure triage and committed fixes proof",
  "Provider-backed Phase14RunnerRun persistence proof",
] as const;

export type Phase14RunnerArtifact = (typeof phase14RunnerArtifactPaths)[number];

export type Phase14RunnerCommand = (typeof phase14RunnerCommands)[number];

export const phase14RunnerLocalArtifacts = [
  "coverage/phase14-runner-execution.json",
  "coverage/phase14-static-check.json",
  "coverage/phase14-manifest-check.json",
  "coverage/phase14-scaffold-coverage-diff.json",
  "test-results/phase14-runner",
] as const satisfies readonly Phase14RunnerArtifact[];

export const phase14RunnerExternalArtifacts = [
  "coverage/phase14-frozen-install.log",
  "coverage/phase14-typecheck.log",
  "coverage/phase14-unit-results.json",
  "coverage/phase14-playwright-install.log",
  "coverage/phase14-e2e-results.json",
  "coverage/phase14-ci-run-redacted.json",
  "coverage/phase14-runner-failure-triage.md",
  "coverage/phase14-flaky-policy.md",
] as const satisfies readonly Phase14RunnerArtifact[];

export type Phase14RunnerExecutionPolicy = {
  localStaticManifestOnly: true;
  frozenInstallRequiresExternalEvidence: true;
  typecheckUnitRequiresExternalEvidence: true;
  playwrightInstallRequiresExternalEvidence: true;
  e2eRequiresExternalEvidence: true;
  ciWorkflowRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof phase14RunnerRequiredExternalEvidence;
};

export type Phase14RunnerEvidenceInput = {
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
  requiredCommandsRun: readonly Phase14RunnerCommand[];
  capturedArtifacts: readonly Phase14RunnerArtifact[];
};

export type Phase14RunnerEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: Phase14RunnerArtifact[];
  requiredCommands: typeof phase14RunnerCommands;
  requiredEvidence: typeof phase14RunnerArtifactPaths;
  runnerPolicy: {
    frozenInstallRequired: true;
    scaffoldCoverageMustBePreserved: true;
    flakyQuarantinePolicyRequired: true;
  };
};

export type Phase14RunnerExecutionPlan = {
  status: "local-plan-ready";
  policy: Phase14RunnerExecutionPolicy;
  externalEvidenceRequired: typeof phase14RunnerRequiredExternalEvidence;
  frozenInstallExecutionAllowed: false;
  typecheckUnitExecutionAllowed: false;
  playwrightInstallExecutionAllowed: false;
  e2eExecutionAllowed: false;
  ciWorkflowExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof phase14RunnerLocalCommands;
  externalCommands: typeof phase14RunnerExternalCommands;
  localArtifacts: typeof phase14RunnerLocalArtifacts;
  externalArtifacts: typeof phase14RunnerExternalArtifacts;
  disabledReasons: readonly string[];
};

export const phase14RunnerExecutionPolicy: Phase14RunnerExecutionPolicy = {
  localStaticManifestOnly: true,
  frozenInstallRequiresExternalEvidence: true,
  typecheckUnitRequiresExternalEvidence: true,
  playwrightInstallRequiresExternalEvidence: true,
  e2eRequiresExternalEvidence: true,
  ciWorkflowRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: phase14RunnerRequiredExternalEvidence,
};

export type Phase14RunnerArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof phase14RunnerArtifactPaths;
  retainedExternalGates: readonly string[];
};

const phase14RunnerSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(triage[_-]?artifact[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(scaffold[_-]?diff[_-]?artifact[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(flaky[_-]?policy[_-]?artifact[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedPhase14RunnerArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return phase14RunnerSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedPhase14RunnerArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|artifactManifest|triageArtifactPath|scaffoldDiffArtifactPath|flakyPolicyArtifactPath|installLog|testOutput/i.test(key)
          ? "[REDACTED]"
          : buildRedactedPhase14RunnerArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildPhase14RunnerExecutionPlan(): Phase14RunnerExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: phase14RunnerExecutionPolicy,
    externalEvidenceRequired: phase14RunnerRequiredExternalEvidence,
    frozenInstallExecutionAllowed: false,
    typecheckUnitExecutionAllowed: false,
    playwrightInstallExecutionAllowed: false,
    e2eExecutionAllowed: false,
    ciWorkflowExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: phase14RunnerLocalCommands,
    externalCommands: phase14RunnerExternalCommands,
    localArtifacts: phase14RunnerLocalArtifacts,
    externalArtifacts: phase14RunnerExternalArtifacts,
    disabledReasons: [
      "Frozen dependency install proof requires executing package manager install.",
      "Workspace typecheck and unit proof requires full runner execution.",
      "Playwright browser install proof requires browser dependency installation.",
      "Web/dashboard E2E proof requires browser runtime execution.",
      "CI quality proof requires GitHub Actions execution.",
      "Phase14RunnerRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildPhase14RunnerArtifactReview(rawArtifact: unknown): Phase14RunnerArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedPhase14RunnerArtifact(rawArtifact),
    requiredArtifacts: phase14RunnerArtifactPaths,
    retainedExternalGates: [
      "Frozen dependency install proof",
      "Workspace typecheck and unit runner proof",
      "Playwright browser install proof",
      "Web/dashboard E2E proof",
      "GitHub Actions CI quality workflow proof",
      "Runner failure triage and committed fixes proof",
      "Provider-backed Phase14RunnerRun persistence proof",
    ],
  };
}

export function buildPhase14RunnerEvidenceDecision(input: Phase14RunnerEvidenceInput): Phase14RunnerEvidenceDecision {
  const blockers = [
    !input.frozenInstallPassed && "Run frozen dependency install.",
    !input.lockfileReproducible && "Capture lockfile reproducibility proof.",
    !input.staticChecksPassed && "Run Phase 14 static checks.",
    !input.manifestChecksPassed && "Run test manifest verification.",
    !input.typecheckPassed && "Run workspace typecheck.",
    !input.unitPassed && "Run workspace unit tests.",
    !input.playwrightBrowsersInstalled && "Install Playwright browsers with dependencies.",
    !input.e2ePassed && "Run web/dashboard E2E tests.",
    !input.ciPassed && "Capture passing CI quality workflow proof.",
    !input.runnerFailuresTriaged && "Triage real runner failures.",
    !input.runnerFixesCommitted && "Commit fixes for real runner failures.",
    !input.scaffoldCoveragePreserved && "Prove scaffold coverage was preserved.",
    !input.flakyPolicyDocumented && "Document flaky retry/quarantine policy.",
  ].filter(Boolean) as string[];

  const missingArtifacts = phase14RunnerArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = phase14RunnerCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: phase14RunnerCommands,
    requiredEvidence: phase14RunnerArtifactPaths,
    runnerPolicy: {
      frozenInstallRequired: true,
      scaffoldCoverageMustBePreserved: true,
      flakyQuarantinePolicyRequired: true,
    },
  };
}

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

export function buildPhase14RunnerRunData(input: Phase14RunnerRunPersistenceInput): Phase14RunnerRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    triageArtifactPath: input.triageArtifactPath ?? null,
    scaffoldDiffArtifactPath: input.scaffoldDiffArtifactPath ?? null,
    flakyPolicyArtifactPath: input.flakyPolicyArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistPhase14RunnerRun(
  repository: Phase14RunnerRunRepository,
  input: Phase14RunnerRunPersistenceInput,
): unknown {
  const data = buildPhase14RunnerRunData(input);

  return repository.phase14RunnerRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
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

