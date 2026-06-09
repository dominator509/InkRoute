import { buildRequiredChecksRuntimeReadinessPlan } from "@inkroute/quality";

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
  requiredPackageScripts: [...requiredChecksPackageScripts],
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
  requiredWorkflowTerms: [...requiredChecksWorkflowTerms],
  ciWorkflowText: "quality:required-checks quality:all handoff:all workspace:all typecheck lint unit playwright",
  requiredBranchProtectionChecks: [...requiredChecksBranchProtectionChecks],
  configuredBranchProtectionChecks: [],
  requiredRepositorySettings: [...requiredChecksRepositorySettings],
  configuredRepositorySettings: [],
  requiredChecksAuditPassed: false,
  qualityAllChainsRequiredChecks: true,
  branchProtectionEvidenceCaptured: false,
  failingQualityPrBlocked: false,
  codeownersReviewActive: false,
});
