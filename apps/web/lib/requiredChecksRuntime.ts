import {
  buildRequiredChecksRuntimeReadinessPlan,
  requiredChecksRuntimeRequiredEvidence as requiredChecksPackageRequiredEvidence,
} from "@inkroute/quality";

export type RequiredChecksRuntimeStatus =
  | "wired"
  | "branch-protection-gated"
  | "repository-settings-gated"
  | "merge-block-gated";

export interface RequiredChecksRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: RequiredChecksRuntimeStatus;
}

export interface RequiredChecksRunPersistenceContract {
  readonly model: "RequiredChecksRun";
  readonly tenantRelation: "requiredChecksRuns";
  readonly migration: "20260609032000_add_required_checks_runs";
  readonly jsonFields: readonly [
    "packageScriptMatrix",
    "ciWorkflowTermMatrix",
    "branchProtectionCheckMatrix",
    "repositorySettingsMatrix",
    "artifactManifest",
  ];
  readonly evidenceBooleans: readonly [
    "requiredChecksAuditPassed",
    "qualityAllChainsRequiredChecks",
    "branchProtectionEvidenceCaptured",
    "failingQualityPrBlocked",
    "codeownersReviewActive",
    "requiredPackageScriptsPresent",
    "ciWorkflowTermsPresent",
    "branchProtectionChecksConfigured",
    "repositorySettingsConfigured",
    "ciQualityJobPassed",
    "redactedSettingsEvidenceCaptured",
  ];
  readonly artifactFields: readonly [
    "requiredChecksAuditArtifactPath",
    "qualityAllArtifactPath",
    "branchProtectionArtifactPath",
    "failingQualityPrArtifactPath",
    "codeownersReviewArtifactPath",
    "repositorySettingsArtifactPath",
    "ciRunUrl",
  ];
}

export const requiredChecksRunPersistenceContract: RequiredChecksRunPersistenceContract = {
  model: "RequiredChecksRun",
  tenantRelation: "requiredChecksRuns",
  migration: "20260609032000_add_required_checks_runs",
  jsonFields: [
    "packageScriptMatrix",
    "ciWorkflowTermMatrix",
    "branchProtectionCheckMatrix",
    "repositorySettingsMatrix",
    "artifactManifest",
  ],
  evidenceBooleans: [
    "requiredChecksAuditPassed",
    "qualityAllChainsRequiredChecks",
    "branchProtectionEvidenceCaptured",
    "failingQualityPrBlocked",
    "codeownersReviewActive",
    "requiredPackageScriptsPresent",
    "ciWorkflowTermsPresent",
    "branchProtectionChecksConfigured",
    "repositorySettingsConfigured",
    "ciQualityJobPassed",
    "redactedSettingsEvidenceCaptured",
  ],
  artifactFields: [
    "requiredChecksAuditArtifactPath",
    "qualityAllArtifactPath",
    "branchProtectionArtifactPath",
    "failingQualityPrArtifactPath",
    "codeownersReviewArtifactPath",
    "repositorySettingsArtifactPath",
    "ciRunUrl",
  ],
};

export const requiredChecksPackageScripts = [
  "quality:required-checks",
  "quality:all",
  "handoff:all",
  "workspace:all",
  "typecheck",
  "lint",
  "test:unit",
  "test:e2e",
] as const;

export const requiredChecksWorkflowTerms = [
  "quality:required-checks",
  "quality:all",
  "handoff:all",
  "workspace:all",
  "typecheck",
  "lint",
  "unit",
  "playwright",
] as const;

export const requiredChecksBranchProtectionChecks = [
  "CI / quality",
  "CI / typecheck",
  "CI / lint",
  "CI / unit",
  "CI / playwright",
  "CI / handoff",
  "CI / workspace",
  "CI / pr-gap-evidence",
] as const;

export const requiredChecksRepositorySettings = [
  "branch-protection",
  "require-pull-request",
  "require-up-to-date-branch",
  "require-codeowners-review",
  "require-conversation-resolution",
  "restrict-force-pushes",
  "restrict-deletions",
  "secret-scanning",
] as const;

export const requiredChecksRuntimeCommands = [
  "pnpm quality:required-checks",
  "pnpm quality:all",
  "GitHub branch protection required-check audit",
  "GitHub repository settings audit",
  "failing quality-gate PR merge-block proof",
  "CODEOWNERS review enforcement proof",
] as const;

export const requiredChecksRuntimeArtifactPaths = [
  "coverage/required-checks-runtime.json",
  "coverage/required-checks-audit-output.txt",
  "coverage/required-checks-quality-all-output.txt",
  "coverage/required-checks-branch-protection-redacted.json",
  "coverage/required-checks-repository-settings-redacted.json",
  "coverage/required-checks-failing-pr-redacted.json",
  "coverage/required-checks-codeowners-review-redacted.json",
  "test-results/required-checks-runtime",
] as const;

export const requiredChecksRuntimeProofFiles = [
  "apps/web/package.json",
  ".github/workflows/ci.yml",
  "package.json",
  "scripts/quality/verify-required-checks.mjs",
  "docs/quality/manifests/required-checks-contract.json",
  "docs/quality/manifests/required-checks-audit.json",
  "scripts/quality/print-quality-gates.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "docs/quality/QUALITY_GATE_PROTOCOL.md",
  "docs/quality/README.md",
  "apps/web/lib/requiredChecksRuntime.ts",
  "apps/web/tests/required-checks-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032000_add_required_checks_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type RequiredChecksRuntimeCommand = (typeof requiredChecksRuntimeCommands)[number];
export type RequiredChecksRuntimeArtifact = (typeof requiredChecksRuntimeArtifactPaths)[number];

export interface RequiredChecksEvidenceInput {
  readonly requiredChecksAuditPassed: boolean;
  readonly qualityAllChainsRequiredChecks: boolean;
  readonly branchProtectionEvidenceCaptured: boolean;
  readonly failingQualityPrBlocked: boolean;
  readonly codeownersReviewActive: boolean;
  readonly ciQualityJobPassed: boolean;
  readonly redactedSettingsEvidenceCaptured: boolean;
  readonly requiredChecksRunPersisted: boolean;
  readonly configuredBranchProtectionChecks: readonly string[];
  readonly configuredRepositorySettings: readonly string[];
  readonly capturedArtifacts: readonly RequiredChecksRuntimeArtifact[];
  readonly completedCommands: readonly RequiredChecksRuntimeCommand[];
}

export interface RequiredChecksEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingBranchProtectionChecks: readonly string[];
  readonly missingRepositorySettings: readonly string[];
  readonly missingArtifacts: readonly RequiredChecksRuntimeArtifact[];
  readonly missingCommands: readonly RequiredChecksRuntimeCommand[];
  readonly requiredArtifacts: typeof requiredChecksRuntimeArtifactPaths;
  readonly requiredCommands: typeof requiredChecksRuntimeCommands;
  readonly requiredEvidence: typeof requiredChecksRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface RequiredChecksRuntimeExecutionPlan {
  readonly localCommands: typeof requiredChecksRuntimeLocalCommands;
  readonly externalCommands: typeof requiredChecksRuntimeExternalCommands;
  readonly localArtifacts: typeof requiredChecksRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof requiredChecksRuntimeExternalArtifacts;
  readonly requiredChecksAuditExecutionAllowed: false;
  readonly qualityAllExecutionAllowed: false;
  readonly branchProtectionAuditExecutionAllowed: false;
  readonly repositorySettingsAuditExecutionAllowed: false;
  readonly failingPrMergeBlockExecutionAllowed: false;
  readonly codeownersReviewProofExecutionAllowed: false;
  readonly ciQualityJobExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof requiredChecksRuntimeExecutionPolicy;
  readonly requiredExternalEvidence: typeof requiredChecksRuntimeRequiredExternalEvidence;
}

export interface RequiredChecksRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof requiredChecksRuntimeRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const requiredChecksRuntimeLocalCommands = [
  "pnpm quality:required-checks",
  "pnpm quality:all",
] as const satisfies readonly RequiredChecksRuntimeCommand[];

export const requiredChecksRuntimeExternalCommands = [
  "GitHub branch protection required-check audit",
  "GitHub repository settings audit",
  "failing quality-gate PR merge-block proof",
  "CODEOWNERS review enforcement proof",
] as const satisfies readonly RequiredChecksRuntimeCommand[];

export const requiredChecksRuntimeRequiredExternalEvidence = [
  "Redacted GitHub branch-protection settings showing every required check is enforced.",
  "Redacted GitHub repository settings showing pull request, up-to-date branch, CODEOWNERS, conversation, force-push, deletion, and secret-scanning controls.",
  "Failing quality-gate PR merge-block evidence captured from GitHub.",
  "CODEOWNERS review enforcement evidence captured from GitHub.",
  "Durable RequiredChecksRun persistence row captured from the target database.",
] as const;

export const requiredChecksRuntimeLocalArtifacts = [
  "coverage/required-checks-runtime.json",
  "coverage/required-checks-audit-output.txt",
  "coverage/required-checks-quality-all-output.txt",
] as const satisfies readonly RequiredChecksRuntimeArtifact[];

export const requiredChecksRuntimeExternalArtifacts = [
  "coverage/required-checks-branch-protection-redacted.json",
  "coverage/required-checks-repository-settings-redacted.json",
  "coverage/required-checks-failing-pr-redacted.json",
  "coverage/required-checks-codeowners-review-redacted.json",
  "test-results/required-checks-runtime",
] as const satisfies readonly RequiredChecksRuntimeArtifact[];

export const requiredChecksRuntimeReadinessRequiredEvidence = requiredChecksPackageRequiredEvidence;

export type RequiredChecksRuntimeRequiredEvidence = readonly [
  ...typeof requiredChecksRuntimeReadinessRequiredEvidence,
  "RequiredChecksRun row with package script, CI workflow term, branch protection check, repository settings, and artifact matrices.",
  "Redacted CI/repository artifact bundle proving required checks, repository settings, failing PR merge block, CODEOWNERS review, CI quality job, and branch protection evidence.",
];

export function buildRequiredChecksDecisionRequiredEvidence(
  readinessEvidence: typeof requiredChecksRuntimeReadinessRequiredEvidence,
): RequiredChecksRuntimeRequiredEvidence {
  return [
    ...readinessEvidence,
    "RequiredChecksRun row with package script, CI workflow term, branch protection check, repository settings, and artifact matrices.",
    "Redacted CI/repository artifact bundle proving required checks, repository settings, failing PR merge block, CODEOWNERS review, CI quality job, and branch protection evidence.",
  ];
}

export const requiredChecksRuntimeRequiredEvidence = buildRequiredChecksDecisionRequiredEvidence(
  requiredChecksRuntimeReadinessRequiredEvidence,
);

export type RequiredChecksRuntimeExecutionPolicy = {
  readonly codexMayClassifyStaticRequiredChecks: true;
  readonly githubBranchProtectionEvidenceRequiredForClosure: true;
  readonly repositorySettingsEvidenceRequiredForClosure: true;
  readonly failingPrMergeBlockEvidenceRequiredForClosure: true;
  readonly codeownersReviewEvidenceRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const requiredChecksRuntimeExecutionPolicy: RequiredChecksRuntimeExecutionPolicy = {
  codexMayClassifyStaticRequiredChecks: true,
  githubBranchProtectionEvidenceRequiredForClosure: true,
  repositorySettingsEvidenceRequiredForClosure: true,
  failingPrMergeBlockEvidenceRequiredForClosure: true,
  codeownersReviewEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

export const requiredChecksRuntimeMatrix = [
  {
    id: "required-checks-audit",
    command: "pnpm quality:required-checks",
    artifact: "coverage/required-checks-audit-output.txt",
    status: "wired",
  },
  {
    id: "quality-all-chain",
    command: "pnpm quality:all",
    artifact: "coverage/required-checks-quality-all-output.txt",
    status: "wired",
  },
  {
    id: "branch-protection-required-checks",
    command: "GitHub branch protection required-check audit",
    artifact: "coverage/required-checks-branch-protection-redacted.json",
    status: "branch-protection-gated",
  },
  {
    id: "repository-settings-audit",
    command: "GitHub repository settings audit",
    artifact: "coverage/required-checks-repository-settings-redacted.json",
    status: "repository-settings-gated",
  },
  {
    id: "failing-quality-pr-block",
    command: "failing quality-gate PR merge-block proof",
    artifact: "coverage/required-checks-failing-pr-redacted.json",
    status: "merge-block-gated",
  },
  {
    id: "codeowners-review-active",
    command: "CODEOWNERS review enforcement proof",
    artifact: "coverage/required-checks-codeowners-review-redacted.json",
    status: "branch-protection-gated",
  },
] as const satisfies readonly RequiredChecksRuntimeMatrixEntry[];

export const requiredChecksRuntimeReadiness = buildRequiredChecksRuntimeReadinessPlan({
  requiredPackageScripts: requiredChecksPackageScripts,
  packageScripts: {
    "quality:required-checks": "node scripts/quality/verify-required-checks.mjs",
    "quality:all": "pnpm quality:docs && pnpm quality:gaps && pnpm quality:pr-gap-fixtures && pnpm quality:governance && pnpm quality:required-checks && pnpm quality:gates",
    "handoff:all": "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:verify-task-sync",
    "workspace:all": "pnpm workspace:verify && pnpm workspace:doctor",
    typecheck: "pnpm -r typecheck",
    lint: "pnpm -r lint",
    "test:unit": "pnpm -r test",
    "test:e2e": "pnpm --filter @inkroute/web test:e2e",
  },
  requiredWorkflowTerms: requiredChecksWorkflowTerms,
  ciWorkflowText: "quality:required-checks quality:all handoff:all workspace:all typecheck lint unit playwright",
  requiredBranchProtectionChecks: requiredChecksBranchProtectionChecks,
  configuredBranchProtectionChecks: [],
  requiredRepositorySettings: requiredChecksRepositorySettings,
  configuredRepositorySettings: [],
  requiredChecksAuditPassed: false,
  qualityAllChainsRequiredChecks: true,
  branchProtectionEvidenceCaptured: false,
  failingQualityPrBlocked: false,
  codeownersReviewActive: false,
});

export function buildRequiredChecksEvidenceDecision(input: RequiredChecksEvidenceInput): RequiredChecksEvidenceDecision {
  const readinessPlan = buildRequiredChecksRuntimeReadinessPlan({
    requiredPackageScripts: requiredChecksPackageScripts,
    packageScripts: {
      "quality:required-checks": "node scripts/quality/verify-required-checks.mjs",
      "quality:all": "pnpm quality:docs && pnpm quality:gaps && pnpm quality:pr-gap-fixtures && pnpm quality:governance && pnpm quality:required-checks && pnpm quality:gates",
      "handoff:all": "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:verify-task-sync",
      "workspace:all": "pnpm workspace:verify && pnpm workspace:doctor",
      typecheck: "pnpm -r typecheck",
      lint: "pnpm -r lint",
      "test:unit": "pnpm -r test",
      "test:e2e": "pnpm --filter @inkroute/web test:e2e",
    },
    requiredWorkflowTerms: requiredChecksWorkflowTerms,
    ciWorkflowText: "quality:required-checks quality:all handoff:all workspace:all typecheck lint unit playwright",
    requiredBranchProtectionChecks: requiredChecksBranchProtectionChecks,
    configuredBranchProtectionChecks: input.configuredBranchProtectionChecks,
    requiredRepositorySettings: requiredChecksRepositorySettings,
    configuredRepositorySettings: input.configuredRepositorySettings,
    requiredChecksAuditPassed: input.requiredChecksAuditPassed,
    qualityAllChainsRequiredChecks: input.qualityAllChainsRequiredChecks,
    branchProtectionEvidenceCaptured: input.branchProtectionEvidenceCaptured,
    failingQualityPrBlocked: input.failingQualityPrBlocked,
    codeownersReviewActive: input.codeownersReviewActive,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = requiredChecksRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = requiredChecksRuntimeCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.ciQualityJobPassed) {
    blockers.push("GitHub Actions CI quality job must pass.");
  }
  if (!input.redactedSettingsEvidenceCaptured) {
    blockers.push("Redacted repository settings evidence must be captured.");
  }
  if (!input.requiredChecksRunPersisted) {
    blockers.push("RequiredChecksRun persistence row must be captured for durable auditability.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required checks artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required checks command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingBranchProtectionChecks: readinessPlan.missingBranchProtectionChecks,
    missingRepositorySettings: readinessPlan.missingRepositorySettings,
    missingArtifacts,
    missingCommands,
    requiredArtifacts: requiredChecksRuntimeArtifactPaths,
    requiredCommands: requiredChecksRuntimeCommands,
    requiredEvidence: requiredChecksRuntimeRequiredEvidence,
    blockers,
  };
}

const sensitiveRequiredChecksKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|repository|owner|branch|settings)$/iu;
const sensitiveRequiredChecksValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactRequiredChecksString = (value: string): string =>
  value.replace(sensitiveRequiredChecksValuePattern, "[REDACTED]");

const buildRedactedRequiredChecksValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedRequiredChecksValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveRequiredChecksKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedRequiredChecksValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactRequiredChecksString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildRequiredChecksRuntimeExecutionPlan(): RequiredChecksRuntimeExecutionPlan {
  return {
    localCommands: requiredChecksRuntimeLocalCommands,
    externalCommands: requiredChecksRuntimeExternalCommands,
    localArtifacts: requiredChecksRuntimeLocalArtifacts,
    externalArtifacts: requiredChecksRuntimeExternalArtifacts,
    requiredChecksAuditExecutionAllowed: false,
    qualityAllExecutionAllowed: false,
    branchProtectionAuditExecutionAllowed: false,
    repositorySettingsAuditExecutionAllowed: false,
    failingPrMergeBlockExecutionAllowed: false,
    codeownersReviewProofExecutionAllowed: false,
    ciQualityJobExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: requiredChecksRuntimeExecutionPolicy,
    requiredExternalEvidence: requiredChecksRuntimeRequiredExternalEvidence,
  };
}

export function buildRedactedRequiredChecksArtifact(artifact: unknown): unknown {
  return buildRedactedRequiredChecksValue(artifact, "", []);
}

export function buildRequiredChecksRuntimeArtifactReview(artifact: unknown): RequiredChecksRuntimeArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedRequiredChecksValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: requiredChecksRuntimeRequiredExternalEvidence,
    safeForTracker: true,
  };
}

