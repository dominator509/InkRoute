import { buildRepositoryGovernanceRuntimeReadinessPlan } from "@inkroute/quality";

export type RepositoryGovernanceRuntimeStatus =
  | "wired"
  | "github-settings-gated"
  | "security-settings-gated"
  | "enforcement-gated";

export interface RepositoryGovernanceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: RepositoryGovernanceRuntimeStatus;
}

export interface RepositoryGovernanceRunPersistenceContract {
  readonly prismaModel: "RepositoryGovernanceRun";
  readonly tenantRelation: "repositoryGovernanceRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["sourcePrerequisiteMatrix", "externalSettingsMatrix", "enforcementTestMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "governanceAuditPassed",
    "qualityAllGovernancePassed",
    "requiredFilesPresent",
    "codeownersCoveragePassed",
    "prTemplateEvidenceTermsPresent",
    "issueTemplateEvidenceTermsPresent",
    "ciGovernanceTermsPresent",
    "branchProtectionActive",
    "requiredStatusChecksEnforced",
    "codeownersReviewRequired",
    "secretScanningEnabled",
    "dependabotOrSecurityAlertsEnabled",
    "mergeRulesConfigured",
    "enforcementTestPrCaptured",
    "redactedSettingsEvidenceCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "governanceAuditArtifactPath",
    "qualityAllArtifactPath",
    "branchProtectionArtifactPath",
    "requiredChecksArtifactPath",
    "codeownersReviewArtifactPath",
    "securitySettingsArtifactPath",
    "mergeRulesArtifactPath",
    "enforcementTestPrArtifactPath"
  ];
}

export const repositoryGovernanceRuntimeCommands = [
  "pnpm quality:governance",
  "pnpm quality:all",
  "gh branch protection or repository rules audit",
  "GitHub required status checks review",
  "GitHub CODEOWNERS review enforcement test PR",
  "GitHub secret scanning/security alerts settings review",
] as const;

export const repositoryGovernanceSourcePrerequisites = [
  "governance-audit",
  "required-files",
  "codeowners-coverage",
  "pull-request-template",
  "gap-closure-issue-template",
  "ci-governance-terms",
] as const;

export const repositoryGovernanceExternalSettings = [
  "branch-protection",
  "required-status-checks",
  "codeowners-review",
  "secret-scanning",
  "dependabot-or-security-alerts",
  "merge-rules",
  "enforcement-test-pr",
  "redacted-settings-evidence",
] as const;

export const repositoryGovernanceRuntimeArtifactPaths = [
  "coverage/repository-governance-runtime.json",
  "coverage/repository-governance-audit-output.txt",
  "coverage/repository-governance-quality-all-output.txt",
  "coverage/repository-branch-protection-redacted.json",
  "coverage/repository-required-checks-redacted.json",
  "coverage/repository-codeowners-review-redacted.json",
  "coverage/repository-security-settings-redacted.json",
  "coverage/repository-merge-rules-redacted.json",
  "coverage/repository-enforcement-test-pr-redacted.json",
  "test-results/repository-governance-runtime",
] as const;

export const repositoryGovernanceRuntimeMatrix = [
  {
    id: "source-governance-audit",
    command: "pnpm quality:governance",
    artifact: "coverage/repository-governance-audit-output.txt",
    status: "wired",
  },
  {
    id: "quality-all-governance-chain",
    command: "pnpm quality:all",
    artifact: "coverage/repository-governance-quality-all-output.txt",
    status: "wired",
  },
  {
    id: "branch-protection-settings",
    command: "gh branch protection or repository rules audit",
    artifact: "coverage/repository-branch-protection-redacted.json",
    status: "github-settings-gated",
  },
  {
    id: "required-status-checks",
    command: "GitHub required status checks review",
    artifact: "coverage/repository-required-checks-redacted.json",
    status: "github-settings-gated",
  },
  {
    id: "codeowners-review-enforcement",
    command: "GitHub CODEOWNERS review enforcement test PR",
    artifact: "coverage/repository-codeowners-review-redacted.json",
    status: "enforcement-gated",
  },
  {
    id: "security-alert-settings",
    command: "GitHub secret scanning/security alerts settings review",
    artifact: "coverage/repository-security-settings-redacted.json",
    status: "security-settings-gated",
  },
  {
    id: "merge-rules-settings",
    command: "GitHub merge queue, linear history, or equivalent merge rules review",
    artifact: "coverage/repository-merge-rules-redacted.json",
    status: "github-settings-gated",
  },
  {
    id: "enforcement-test-pr",
    command: "test PR proves branch protection, required checks, and CODEOWNERS review enforcement",
    artifact: "coverage/repository-enforcement-test-pr-redacted.json",
    status: "enforcement-gated",
  },
] as const satisfies readonly RepositoryGovernanceRuntimeMatrixEntry[];

export const repositoryGovernanceRunPersistenceContract: RepositoryGovernanceRunPersistenceContract = {
  prismaModel: "RepositoryGovernanceRun",
  tenantRelation: "repositoryGovernanceRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["sourcePrerequisiteMatrix", "externalSettingsMatrix", "enforcementTestMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "governanceAuditPassed",
    "qualityAllGovernancePassed",
    "requiredFilesPresent",
    "codeownersCoveragePassed",
    "prTemplateEvidenceTermsPresent",
    "issueTemplateEvidenceTermsPresent",
    "ciGovernanceTermsPresent",
    "branchProtectionActive",
    "requiredStatusChecksEnforced",
    "codeownersReviewRequired",
    "secretScanningEnabled",
    "dependabotOrSecurityAlertsEnabled",
    "mergeRulesConfigured",
    "enforcementTestPrCaptured",
    "redactedSettingsEvidenceCaptured",
  ],
  redactedArtifactFields: [
    "governanceAuditArtifactPath",
    "qualityAllArtifactPath",
    "branchProtectionArtifactPath",
    "requiredChecksArtifactPath",
    "codeownersReviewArtifactPath",
    "securitySettingsArtifactPath",
    "mergeRulesArtifactPath",
    "enforcementTestPrArtifactPath",
  ],
};

export const repositoryGovernanceRuntimeReadiness = buildRepositoryGovernanceRuntimeReadinessPlan({
  governanceAuditPassed: true,
  requiredFilesPresent: true,
  codeownersCoveragePassed: true,
  prTemplateEvidenceTermsPresent: true,
  issueTemplateEvidenceTermsPresent: true,
  ciGovernanceTermsPresent: true,
  branchProtectionActive: false,
  requiredStatusChecksEnforced: false,
  codeownersReviewRequired: false,
  secretScanningEnabled: false,
  dependabotOrSecurityAlertsEnabled: false,
  mergeRulesConfigured: false,
  enforcementTestPrCaptured: false,
  redactedSettingsEvidenceCaptured: false,
});
