import {
  buildWorkspaceRequiredChecksReadinessPlan,
  workspaceRequiredChecksRequiredEvidence as workspaceRequiredChecksPackageRequiredEvidence,
} from "@inkroute/workspace";

export type WorkspaceRequiredChecksRuntimeStatus =
  | "wired"
  | "ci-gated"
  | "branch-protection-gated"
  | "merge-block-gated"
  | "redaction-gated";

export interface WorkspaceRequiredChecksRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: WorkspaceRequiredChecksRuntimeStatus;
}

export interface WorkspaceRequiredChecksRunPersistenceContract {
  readonly model: "WorkspaceRequiredChecksRun";
  readonly tenantRelation: "workspaceRequiredChecksRuns";
  readonly migration: "20260609032400_add_workspace_required_checks_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "branchProtectionCheckMatrix",
    "artifactManifest",
    "mergeBlockProofManifest",
    "redactedLogManifest",
  ];
  readonly evidenceBooleans: readonly [
    "requiredChecksAuditPassed",
    "workspaceRequiredChecksPassed",
    "workspaceAllPassed",
    "qualityRequiredChecksPassed",
    "ciQualityJobPassed",
    "branchProtectionEvidenceCaptured",
    "branchProtectionChecksConfigured",
    "failingWorkspaceAuditBlocksMerge",
    "prGapDiffCheckBlocksMerge",
    "evidenceCaptured",
    "logsRedacted",
  ];
  readonly artifactFields: readonly [
    "workspaceRequiredChecksArtifactPath",
    "workspaceAllArtifactPath",
    "qualityRequiredChecksArtifactPath",
    "ciQualityArtifactPath",
    "branchProtectionArtifactPath",
    "failingWorkspacePrArtifactPath",
    "failingPrGapDiffArtifactPath",
    "redactedLogsArtifactPath",
    "ciRunUrl",
  ];
}

export const workspaceRequiredChecksRunPersistenceContract: WorkspaceRequiredChecksRunPersistenceContract = {
  model: "WorkspaceRequiredChecksRun",
  tenantRelation: "workspaceRequiredChecksRuns",
  migration: "20260609032400_add_workspace_required_checks_runs",
  jsonFields: [
    "commandMatrix",
    "branchProtectionCheckMatrix",
    "artifactManifest",
    "mergeBlockProofManifest",
    "redactedLogManifest",
  ],
  evidenceBooleans: [
    "requiredChecksAuditPassed",
    "workspaceRequiredChecksPassed",
    "workspaceAllPassed",
    "qualityRequiredChecksPassed",
    "ciQualityJobPassed",
    "branchProtectionEvidenceCaptured",
    "branchProtectionChecksConfigured",
    "failingWorkspaceAuditBlocksMerge",
    "prGapDiffCheckBlocksMerge",
    "evidenceCaptured",
    "logsRedacted",
  ],
  artifactFields: [
    "workspaceRequiredChecksArtifactPath",
    "workspaceAllArtifactPath",
    "qualityRequiredChecksArtifactPath",
    "ciQualityArtifactPath",
    "branchProtectionArtifactPath",
    "failingWorkspacePrArtifactPath",
    "failingPrGapDiffArtifactPath",
    "redactedLogsArtifactPath",
    "ciRunUrl",
  ],
};

export const workspaceRequiredChecksCommands = [
  "pnpm workspace:required-checks",
  "pnpm workspace:all",
  "pnpm quality:required-checks",
  "GitHub Actions CI / quality",
  "GitHub branch protection required-check review",
  "Failing workspace-audit PR merge-block proof",
  "PR GAP tracker diff evidence merge-block proof",
  "required-check evidence logs redacted and secret-free",
] as const;

export const workspaceRequiredBranchProtectionChecks = [
  "CI / quality",
  "CI / workspace required checks",
  "CI / workspace runtime readiness",
  "CI / PR GAP tracker diff evidence",
  "CI / required quality checks",
] as const;

export const workspaceRequiredChecksArtifactPaths = [
  "coverage/workspace-required-checks-runtime.json",
  "coverage/workspace-required-checks-output.txt",
  "coverage/workspace-required-checks-all-output.txt",
  "coverage/workspace-required-checks-quality-output.txt",
  "coverage/workspace-required-checks-ci-quality.json",
  "coverage/workspace-required-checks-branch-protection-redacted.json",
  "coverage/workspace-required-checks-failing-workspace-pr-redacted.json",
  "coverage/workspace-required-checks-failing-gap-diff-pr-redacted.json",
  "coverage/workspace-required-checks-redacted-logs.json",
  "coverage/workspace-required-checks-redacted-evidence-bundle.json",
  "test-results/workspace-required-checks-runtime",
] as const;

export const workspaceRequiredChecksProofFiles = [
  ".github/workflows/ci.yml",
  "package.json",
  "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
  "docs/workspace/manifests/workspace-required-checks-contract.json",
  "docs/workspace/manifests/workspace-required-checks-audit.json",
  "scripts/workspace/verify-workspace-required-checks.mjs",
  "packages/workspace/src/index.ts",
  "packages/workspace/tests/workspace-audit.test.ts",
  "docs/quality/manifests/required-checks-contract.json",
  "scripts/quality/print-quality-gates.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "apps/web/lib/workspaceRequiredChecksRuntime.ts",
  "apps/web/tests/workspace-required-checks-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032400_add_workspace_required_checks_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type WorkspaceRequiredChecksCommand = (typeof workspaceRequiredChecksCommands)[number];
export type WorkspaceRequiredChecksArtifact = (typeof workspaceRequiredChecksArtifactPaths)[number];

export interface WorkspaceRequiredChecksEvidenceInput {
  readonly requiredChecksAuditPassed: boolean;
  readonly workspaceRequiredChecksPassed: boolean;
  readonly workspaceAllPassed: boolean;
  readonly qualityRequiredChecksPassed: boolean;
  readonly ciQualityJobPassed: boolean;
  readonly branchProtectionEvidenceCaptured: boolean;
  readonly failingWorkspaceAuditBlocksMerge: boolean;
  readonly prGapDiffCheckBlocksMerge: boolean;
  readonly evidenceCaptured: boolean;
  readonly logsRedacted: boolean;
  readonly workspaceRequiredChecksRunPersisted: boolean;
  readonly redactedEvidenceBundleCaptured: boolean;
  readonly protectedBranchRequiredChecks: readonly string[];
  readonly capturedArtifacts: readonly WorkspaceRequiredChecksArtifact[];
  readonly completedCommands: readonly WorkspaceRequiredChecksCommand[];
}

export interface WorkspaceRequiredChecksEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingBranchProtectionChecks: readonly string[];
  readonly missingArtifacts: readonly WorkspaceRequiredChecksArtifact[];
  readonly missingCommands: readonly WorkspaceRequiredChecksCommand[];
  readonly requiredBranchProtectionChecks: readonly string[];
  readonly requiredArtifacts: typeof workspaceRequiredChecksArtifactPaths;
  readonly requiredCommands: typeof workspaceRequiredChecksCommands;
  readonly requiredEvidence: typeof workspaceRequiredChecksRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface WorkspaceRequiredChecksExecutionPlan {
  readonly localCommands: typeof workspaceRequiredChecksLocalCommands;
  readonly externalCommands: typeof workspaceRequiredChecksExternalCommands;
  readonly localArtifacts: typeof workspaceRequiredChecksLocalArtifacts;
  readonly externalArtifacts: typeof workspaceRequiredChecksExternalArtifacts;
  readonly workspaceRequiredChecksExecutionAllowed: false;
  readonly workspaceAllExecutionAllowed: false;
  readonly qualityRequiredChecksExecutionAllowed: false;
  readonly ciQualityJobExecutionAllowed: false;
  readonly branchProtectionReviewExecutionAllowed: false;
  readonly failingWorkspacePrMergeBlockExecutionAllowed: false;
  readonly prGapDiffMergeBlockExecutionAllowed: false;
  readonly redactedLogReviewExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof workspaceRequiredChecksExecutionPolicy;
  readonly requiredExternalEvidence: typeof workspaceRequiredChecksRequiredExternalEvidence;
}

export interface WorkspaceRequiredChecksArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof workspaceRequiredChecksRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export interface WorkspaceRequiredChecksRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/workspace-required-checks-redacted-evidence-bundle.json";
  readonly review: WorkspaceRequiredChecksArtifactReview;
  readonly requiredArtifacts: typeof workspaceRequiredChecksArtifactPaths;
  readonly requiredExternalEvidence: typeof workspaceRequiredChecksRequiredExternalEvidence;
  readonly providerExecutionAllowed: false;
}

export const workspaceRequiredChecksLocalCommands = [
  "pnpm workspace:required-checks",
  "pnpm workspace:all",
  "pnpm quality:required-checks",
] as const satisfies readonly WorkspaceRequiredChecksCommand[];

export const workspaceRequiredChecksExternalCommands = [
  "GitHub Actions CI / quality",
  "GitHub branch protection required-check review",
  "Failing workspace-audit PR merge-block proof",
  "PR GAP tracker diff evidence merge-block proof",
  "required-check evidence logs redacted and secret-free",
] as const satisfies readonly WorkspaceRequiredChecksCommand[];

export const workspaceRequiredChecksRequiredExternalEvidence = [
  "workspace:required-checks, workspace:all, and quality:required-checks output captured as artifacts.",
  "GitHub Actions CI / quality job URL and conclusion.",
  "Redacted GitHub branch-protection settings proving every workspace and PR gap-diff check is required before merge.",
  "Failing workspace-audit PR and PR GAP tracker diff evidence merge-block proof captured from GitHub.",
  "Required-check evidence logs reviewed as redacted and secret-free.",
  "Durable WorkspaceRequiredChecksRun persistence row captured from the target database.",
  "Redacted workspace required-checks evidence bundle captured without raw GitHub settings, merge-block logs, tokens, URLs, or actor identifiers.",
] as const;

export const workspaceRequiredChecksLocalArtifacts = [
  "coverage/workspace-required-checks-runtime.json",
  "coverage/workspace-required-checks-output.txt",
  "coverage/workspace-required-checks-all-output.txt",
  "coverage/workspace-required-checks-quality-output.txt",
] as const satisfies readonly WorkspaceRequiredChecksArtifact[];

export const workspaceRequiredChecksExternalArtifacts = [
  "coverage/workspace-required-checks-ci-quality.json",
  "coverage/workspace-required-checks-branch-protection-redacted.json",
  "coverage/workspace-required-checks-failing-workspace-pr-redacted.json",
  "coverage/workspace-required-checks-failing-gap-diff-pr-redacted.json",
  "coverage/workspace-required-checks-redacted-logs.json",
  "coverage/workspace-required-checks-redacted-evidence-bundle.json",
  "test-results/workspace-required-checks-runtime",
] as const satisfies readonly WorkspaceRequiredChecksArtifact[];

export const workspaceRequiredChecksReadinessRequiredEvidence = workspaceRequiredChecksPackageRequiredEvidence;

export function buildWorkspaceRequiredChecksDecisionRequiredEvidence(
  readinessEvidence: typeof workspaceRequiredChecksReadinessRequiredEvidence,
): WorkspaceRequiredChecksRequiredEvidence {
  return [
    ...readinessEvidence,
    "WorkspaceRequiredChecksRun row with command, branch protection, artifact, merge-block proof, and redacted log matrices.",
    "Artifact bundle proving workspace required checks, workspace:all, quality required checks, CI quality job, branch protection, failing workspace PR block, PR gap-diff block, and redacted logs.",
  ];
}

export type WorkspaceRequiredChecksRequiredEvidence = readonly [
  ...typeof workspaceRequiredChecksReadinessRequiredEvidence,
  "WorkspaceRequiredChecksRun row with command, branch protection, artifact, merge-block proof, and redacted log matrices.",
  "Artifact bundle proving workspace required checks, workspace:all, quality required checks, CI quality job, branch protection, failing workspace PR block, PR gap-diff block, and redacted logs.",
];

export const workspaceRequiredChecksRequiredEvidence = buildWorkspaceRequiredChecksDecisionRequiredEvidence(
  workspaceRequiredChecksReadinessRequiredEvidence,
);

export type WorkspaceRequiredChecksExecutionPolicy = {
  readonly codexMayClassifyStaticWorkspaceRequiredChecks: true;
  readonly commandEvidenceRequiredForClosure: true;
  readonly ciQualityEvidenceRequiredForClosure: true;
  readonly branchProtectionEvidenceRequiredForClosure: true;
  readonly mergeBlockEvidenceRequiredForClosure: true;
  readonly redactedLogsRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const workspaceRequiredChecksExecutionPolicy: WorkspaceRequiredChecksExecutionPolicy = {
  codexMayClassifyStaticWorkspaceRequiredChecks: true,
  commandEvidenceRequiredForClosure: true,
  ciQualityEvidenceRequiredForClosure: true,
  branchProtectionEvidenceRequiredForClosure: true,
  mergeBlockEvidenceRequiredForClosure: true,
  redactedLogsRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

export const workspaceRequiredChecksRuntimeMatrix = [
  {
    id: "workspace-required-checks-audit",
    command: "pnpm workspace:required-checks",
    artifact: "coverage/workspace-required-checks-output.txt",
    status: "wired",
  },
  {
    id: "workspace-all-required-checks-chain",
    command: "pnpm workspace:all",
    artifact: "coverage/workspace-required-checks-all-output.txt",
    status: "wired",
  },
  {
    id: "quality-required-checks",
    command: "pnpm quality:required-checks",
    artifact: "coverage/workspace-required-checks-quality-output.txt",
    status: "wired",
  },
  {
    id: "ci-quality-job",
    command: "GitHub Actions CI / quality",
    artifact: "coverage/workspace-required-checks-ci-quality.json",
    status: "ci-gated",
  },
  {
    id: "branch-protection-required-checks",
    command: "GitHub branch protection required-check review",
    artifact: "coverage/workspace-required-checks-branch-protection-redacted.json",
    status: "branch-protection-gated",
  },
  {
    id: "failing-workspace-audit-pr",
    command: "Failing workspace-audit PR merge-block proof",
    artifact: "coverage/workspace-required-checks-failing-workspace-pr-redacted.json",
    status: "merge-block-gated",
  },
  {
    id: "failing-pr-gap-diff-pr",
    command: "PR GAP tracker diff evidence merge-block proof",
    artifact: "coverage/workspace-required-checks-failing-gap-diff-pr-redacted.json",
    status: "merge-block-gated",
  },
  {
    id: "redacted-evidence-logs",
    command: "required-check evidence logs redacted and secret-free",
    artifact: "coverage/workspace-required-checks-redacted-logs.json",
    status: "redaction-gated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted workspace required-checks evidence bundle",
    artifact: "coverage/workspace-required-checks-redacted-evidence-bundle.json",
    status: "redaction-gated",
  },
] as const satisfies readonly WorkspaceRequiredChecksRuntimeMatrixEntry[];

export const workspaceRequiredChecksReadiness = buildWorkspaceRequiredChecksReadinessPlan({
  requiredChecksAuditStatus: "fail",
  workspaceRequiredChecksPassed: false,
  workspaceAllPassed: false,
  qualityRequiredChecksPassed: false,
  ciQualityJobPassed: false,
  requiredBranchProtectionChecks: workspaceRequiredBranchProtectionChecks,
  protectedBranchRequiredChecks: [],
  failingWorkspaceAuditBlocksMerge: false,
  prGapDiffCheckBlocksMerge: false,
  evidenceCaptured: false,
  logsRedacted: false,
});

export function buildWorkspaceRequiredChecksEvidenceDecision(
  input: WorkspaceRequiredChecksEvidenceInput,
): WorkspaceRequiredChecksEvidenceDecision {
  const readinessPlan = buildWorkspaceRequiredChecksReadinessPlan({
    requiredChecksAuditStatus: input.requiredChecksAuditPassed ? "pass" : "fail",
    workspaceRequiredChecksPassed: input.workspaceRequiredChecksPassed,
    workspaceAllPassed: input.workspaceAllPassed,
    qualityRequiredChecksPassed: input.qualityRequiredChecksPassed,
    ciQualityJobPassed: input.ciQualityJobPassed,
    requiredBranchProtectionChecks: workspaceRequiredBranchProtectionChecks,
    protectedBranchRequiredChecks: input.protectedBranchRequiredChecks,
    failingWorkspaceAuditBlocksMerge: input.failingWorkspaceAuditBlocksMerge,
    prGapDiffCheckBlocksMerge: input.prGapDiffCheckBlocksMerge,
    evidenceCaptured: input.evidenceCaptured,
    logsRedacted: input.logsRedacted,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = workspaceRequiredChecksArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = workspaceRequiredChecksCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.branchProtectionEvidenceCaptured) {
    blockers.push("Branch protection evidence must be captured.");
  }
  if (!input.workspaceRequiredChecksRunPersisted) {
    blockers.push("WorkspaceRequiredChecksRun persistence row must be captured for durable auditability.");
  }
  if (!input.redactedEvidenceBundleCaptured) {
    blockers.push("Redacted workspace required-checks evidence bundle must be captured.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required workspace checks artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required workspace checks command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingBranchProtectionChecks: readinessPlan.missingBranchProtectionChecks,
    missingArtifacts,
    missingCommands,
    requiredBranchProtectionChecks: workspaceRequiredBranchProtectionChecks,
    requiredArtifacts: workspaceRequiredChecksArtifactPaths,
    requiredCommands: workspaceRequiredChecksCommands,
    requiredEvidence: workspaceRequiredChecksRequiredEvidence,
    blockers,
  };
}

const sensitiveWorkspaceRequiredChecksKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|repository|branch|settings|owner)$/iu;
const sensitiveWorkspaceRequiredChecksValuePattern =
  /(https?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactWorkspaceRequiredChecksString = (value: string): string =>
  value.replace(sensitiveWorkspaceRequiredChecksValuePattern, "[REDACTED]");

const buildRedactedWorkspaceRequiredChecksValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedWorkspaceRequiredChecksValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveWorkspaceRequiredChecksKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedWorkspaceRequiredChecksValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactWorkspaceRequiredChecksString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildWorkspaceRequiredChecksExecutionPlan(): WorkspaceRequiredChecksExecutionPlan {
  return {
    localCommands: workspaceRequiredChecksLocalCommands,
    externalCommands: workspaceRequiredChecksExternalCommands,
    localArtifacts: workspaceRequiredChecksLocalArtifacts,
    externalArtifacts: workspaceRequiredChecksExternalArtifacts,
    workspaceRequiredChecksExecutionAllowed: false,
    workspaceAllExecutionAllowed: false,
    qualityRequiredChecksExecutionAllowed: false,
    ciQualityJobExecutionAllowed: false,
    branchProtectionReviewExecutionAllowed: false,
    failingWorkspacePrMergeBlockExecutionAllowed: false,
    prGapDiffMergeBlockExecutionAllowed: false,
    redactedLogReviewExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: workspaceRequiredChecksExecutionPolicy,
    requiredExternalEvidence: workspaceRequiredChecksRequiredExternalEvidence,
  };
}

export function buildRedactedWorkspaceRequiredChecksArtifact(artifact: unknown): unknown {
  return buildRedactedWorkspaceRequiredChecksValue(artifact, "", []);
}

export function buildWorkspaceRequiredChecksArtifactReview(
  artifact: unknown,
): WorkspaceRequiredChecksArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedWorkspaceRequiredChecksValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: workspaceRequiredChecksRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildWorkspaceRequiredChecksRedactedEvidenceBundle(
  artifact: unknown,
): WorkspaceRequiredChecksRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/workspace-required-checks-redacted-evidence-bundle.json",
    review: buildWorkspaceRequiredChecksArtifactReview(artifact),
    requiredArtifacts: workspaceRequiredChecksArtifactPaths,
    requiredExternalEvidence: workspaceRequiredChecksRequiredExternalEvidence,
    providerExecutionAllowed: false,
  };
}

