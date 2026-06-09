import { buildWorkspaceRequiredChecksReadinessPlan } from "@inkroute/workspace";

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

export const workspaceRequiredChecksCommands = [
  "pnpm workspace:required-checks",
  "pnpm workspace:all",
  "pnpm quality:required-checks",
  "GitHub Actions CI / quality",
  "GitHub branch protection required-check review",
  "Failing workspace-audit PR merge-block proof",
  "PR GAP tracker diff evidence merge-block proof",
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
  "test-results/workspace-required-checks-runtime",
] as const;

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
] as const satisfies readonly WorkspaceRequiredChecksRuntimeMatrixEntry[];

export const workspaceRequiredChecksReadiness = buildWorkspaceRequiredChecksReadinessPlan({
  requiredChecksAuditStatus: "fail",
  workspaceRequiredChecksPassed: false,
  workspaceAllPassed: false,
  qualityRequiredChecksPassed: false,
  ciQualityJobPassed: false,
  requiredBranchProtectionChecks: [...workspaceRequiredBranchProtectionChecks],
  protectedBranchRequiredChecks: [],
  failingWorkspaceAuditBlocksMerge: false,
  prGapDiffCheckBlocksMerge: false,
  evidenceCaptured: false,
  logsRedacted: false,
});
