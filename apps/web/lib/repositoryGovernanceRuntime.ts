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
  "GitHub secret scanning settings review",
  "GitHub Dependabot/security alerts settings review",
  "GitHub merge rules settings review",
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

export const repositoryGovernanceRuntimeProofFiles = [
  ".github/CODEOWNERS",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/gap_closure.md",
  ".github/workflows/ci.yml",
  ".github/workflows/release-governance.yml",
  "scripts/quality/verify-repository-governance.mjs",
  "packages/quality/src/index.ts",
  "packages/quality/tests/quality-gates.test.ts",
  "docs/quality/manifests/repository-governance-contract.json",
  "docs/quality/manifests/repository-governance-audit.json",
  "docs/quality/QUALITY_GATE_PROTOCOL.md",
  "docs/quality/README.md",
  "apps/web/lib/repositoryGovernanceRuntime.ts",
  "apps/web/tests/repository-governance-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609028000_add_repository_governance_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  "package.json",
] as const;

export type RepositoryGovernanceRuntimeCommand = (typeof repositoryGovernanceRuntimeCommands)[number];
export type RepositoryGovernanceRuntimeArtifact = (typeof repositoryGovernanceRuntimeArtifactPaths)[number];

export interface RepositoryGovernanceEvidenceInput {
  readonly governanceAuditPassed: boolean;
  readonly qualityAllGovernancePassed: boolean;
  readonly requiredFilesPresent: boolean;
  readonly codeownersCoveragePassed: boolean;
  readonly prTemplateEvidenceTermsPresent: boolean;
  readonly issueTemplateEvidenceTermsPresent: boolean;
  readonly ciGovernanceTermsPresent: boolean;
  readonly branchProtectionActive: boolean;
  readonly requiredStatusChecksEnforced: boolean;
  readonly codeownersReviewRequired: boolean;
  readonly secretScanningEnabled: boolean;
  readonly dependabotOrSecurityAlertsEnabled: boolean;
  readonly mergeRulesConfigured: boolean;
  readonly enforcementTestPrCaptured: boolean;
  readonly redactedSettingsEvidenceCaptured: boolean;
  readonly repositoryGovernanceRunPersisted: boolean;
  readonly capturedArtifacts: readonly RepositoryGovernanceRuntimeArtifact[];
  readonly completedCommands: readonly RepositoryGovernanceRuntimeCommand[];
}

export interface RepositoryGovernanceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingArtifacts: readonly RepositoryGovernanceRuntimeArtifact[];
  readonly missingCommands: readonly RepositoryGovernanceRuntimeCommand[];
  readonly requiredArtifacts: typeof repositoryGovernanceRuntimeArtifactPaths;
  readonly requiredCommands: typeof repositoryGovernanceRuntimeCommands;
  readonly requiredEvidence: typeof repositoryGovernanceRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface RepositoryGovernanceRuntimeExecutionPlan {
  readonly localCommands: typeof repositoryGovernanceRuntimeLocalCommands;
  readonly externalCommands: typeof repositoryGovernanceRuntimeExternalCommands;
  readonly localArtifacts: typeof repositoryGovernanceRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof repositoryGovernanceRuntimeExternalArtifacts;
  readonly governanceAuditExecutionAllowed: false;
  readonly qualityAllExecutionAllowed: false;
  readonly branchProtectionAuditExecutionAllowed: false;
  readonly requiredChecksReviewExecutionAllowed: false;
  readonly codeownersReviewTestExecutionAllowed: false;
  readonly secretScanningReviewExecutionAllowed: false;
  readonly securityAlertsReviewExecutionAllowed: false;
  readonly mergeRulesReviewExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof repositoryGovernanceRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof repositoryGovernanceRuntimeRequiredExternalEvidence;
}

export interface RepositoryGovernanceRuntimeArtifactReview {
  readonly artifactPath: RepositoryGovernanceRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof repositoryGovernanceRuntimeRequiredExternalEvidence;
}

export const repositoryGovernanceRuntimeLocalCommands = [
  "pnpm quality:governance",
  "pnpm quality:all",
] as const satisfies readonly RepositoryGovernanceRuntimeCommand[];

export const repositoryGovernanceRuntimeExternalCommands = [
  "gh branch protection or repository rules audit",
  "GitHub required status checks review",
  "GitHub CODEOWNERS review enforcement test PR",
  "GitHub secret scanning settings review",
  "GitHub Dependabot/security alerts settings review",
  "GitHub merge rules settings review",
] as const satisfies readonly RepositoryGovernanceRuntimeCommand[];

export const repositoryGovernanceRuntimeRequiredExternalEvidence = [
  "GitHub branch protection, required checks, CODEOWNERS review, security settings, and merge-rule evidence must be captured from repository settings with tokens and actors redacted.",
  "Enforcement-test PR evidence must prove settings block unsafe merges without exposing PR URLs, check-run URLs, or private reviewer details.",
  "Secret scanning and security alert proof must redact provider identifiers and repository settings payloads.",
  "RepositoryGovernanceRun persistence must execute only against an approved provider-backed database.",
] as const;

export const repositoryGovernanceRuntimeLocalArtifacts = [
  "coverage/repository-governance-runtime.json",
  "coverage/repository-governance-audit-output.txt",
  "coverage/repository-governance-quality-all-output.txt",
  "test-results/repository-governance-runtime",
] as const satisfies readonly RepositoryGovernanceRuntimeArtifact[];

export const repositoryGovernanceRuntimeExternalArtifacts = repositoryGovernanceRuntimeArtifactPaths.filter(
  (artifact) =>
    artifact !== "coverage/repository-governance-runtime.json" &&
    artifact !== "coverage/repository-governance-audit-output.txt" &&
    artifact !== "coverage/repository-governance-quality-all-output.txt" &&
    artifact !== "test-results/repository-governance-runtime",
);

export type RepositoryGovernanceRuntimeExecutionPolicy = {
  readonly codexMayClassifySourceGovernance: true;
  readonly githubSettingsRequiredForClosure: true;
  readonly branchProtectionEvidenceRequired: true;
  readonly securitySettingsEvidenceRequired: true;
  readonly enforcementTestPrRequired: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const repositoryGovernanceRuntimeExecutionPolicy: RepositoryGovernanceRuntimeExecutionPolicy = {
  codexMayClassifySourceGovernance: true,
  githubSettingsRequiredForClosure: true,
  branchProtectionEvidenceRequired: true,
  securitySettingsEvidenceRequired: true,
  enforcementTestPrRequired: true,
  providerDatabaseRequiredForPersistence: true,
};

const sensitiveRepositoryGovernanceKeyPattern =
  /(token|secret|password|authorization|cookie|github|branchProtection|requiredChecks|codeowners|security|dependabot|mergeRules|enforcementPr|artifactUrl|ciRunUrl|actor|tenantId|userId|runId|email|phone|payload)/i;

const sensitiveRepositoryGovernanceStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:ghp|gho|ghu|ghs|sk|pk|rk|whsec)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|project|provider|artifact|run|branch|check|pr)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildRepositoryGovernanceRuntimeExecutionPlan(): RepositoryGovernanceRuntimeExecutionPlan {
  return {
    localCommands: repositoryGovernanceRuntimeLocalCommands,
    externalCommands: repositoryGovernanceRuntimeExternalCommands,
    localArtifacts: repositoryGovernanceRuntimeLocalArtifacts,
    externalArtifacts: repositoryGovernanceRuntimeExternalArtifacts,
    governanceAuditExecutionAllowed: false,
    qualityAllExecutionAllowed: false,
    branchProtectionAuditExecutionAllowed: false,
    requiredChecksReviewExecutionAllowed: false,
    codeownersReviewTestExecutionAllowed: false,
    secretScanningReviewExecutionAllowed: false,
    securityAlertsReviewExecutionAllowed: false,
    mergeRulesReviewExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: repositoryGovernanceRuntimeExecutionPolicy,
    externalEvidenceRequired: repositoryGovernanceRuntimeRequiredExternalEvidence,
  };
}

function redactRepositoryGovernanceString(value: string, redactions: Set<string>): string {
  return sensitiveRepositoryGovernanceStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactRepositoryGovernanceValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveRepositoryGovernanceKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactRepositoryGovernanceString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactRepositoryGovernanceValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactRepositoryGovernanceValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedRepositoryGovernanceArtifact(artifact: unknown): unknown {
  return redactRepositoryGovernanceValue(artifact, new Set<string>());
}

export function buildRepositoryGovernanceRuntimeArtifactReview(
  artifactPath: RepositoryGovernanceRuntimeArtifact | string,
  artifact: unknown,
): RepositoryGovernanceRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactRepositoryGovernanceValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: repositoryGovernanceRuntimeRequiredExternalEvidence,
  };
}

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
    command: "GitHub Dependabot/security alerts settings review",
    artifact: "coverage/repository-security-settings-redacted.json",
    status: "security-settings-gated",
  },
  {
    id: "secret-scanning-settings",
    command: "GitHub secret scanning settings review",
    artifact: "coverage/repository-security-settings-redacted.json",
    status: "security-settings-gated",
  },
  {
    id: "merge-rules-settings",
    command: "GitHub merge rules settings review",
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

export function buildRepositoryGovernanceDecisionRequiredEvidence(
  readinessEvidence: typeof repositoryGovernanceRuntimeReadiness.requiredEvidence,
): RepositoryGovernanceRuntimeRequiredEvidence {
  return [
    ...readinessEvidence,
    "RepositoryGovernanceRun row with source prerequisite, external settings, enforcement test, and artifact matrices.",
    "CI artifact bundle proving governance audit, quality:all, branch protection, required checks, CODEOWNERS review, security settings, merge rules, and enforcement test PR evidence.",
  ];
}

export type RepositoryGovernanceRuntimeRequiredEvidence = readonly [
  ...typeof repositoryGovernanceRuntimeReadiness.requiredEvidence,
  "RepositoryGovernanceRun row with source prerequisite, external settings, enforcement test, and artifact matrices.",
  "CI artifact bundle proving governance audit, quality:all, branch protection, required checks, CODEOWNERS review, security settings, merge rules, and enforcement test PR evidence.",
];

export const repositoryGovernanceRuntimeRequiredEvidence = buildRepositoryGovernanceDecisionRequiredEvidence(
  repositoryGovernanceRuntimeReadiness.requiredEvidence,
);

export function buildRepositoryGovernanceEvidenceDecision(
  input: RepositoryGovernanceEvidenceInput,
): RepositoryGovernanceEvidenceDecision {
  const readinessPlan = buildRepositoryGovernanceRuntimeReadinessPlan({
    governanceAuditPassed: input.governanceAuditPassed,
    requiredFilesPresent: input.requiredFilesPresent,
    codeownersCoveragePassed: input.codeownersCoveragePassed,
    prTemplateEvidenceTermsPresent: input.prTemplateEvidenceTermsPresent,
    issueTemplateEvidenceTermsPresent: input.issueTemplateEvidenceTermsPresent,
    ciGovernanceTermsPresent: input.ciGovernanceTermsPresent,
    branchProtectionActive: input.branchProtectionActive,
    requiredStatusChecksEnforced: input.requiredStatusChecksEnforced,
    codeownersReviewRequired: input.codeownersReviewRequired,
    secretScanningEnabled: input.secretScanningEnabled,
    dependabotOrSecurityAlertsEnabled: input.dependabotOrSecurityAlertsEnabled,
    mergeRulesConfigured: input.mergeRulesConfigured,
    enforcementTestPrCaptured: input.enforcementTestPrCaptured,
    redactedSettingsEvidenceCaptured: input.redactedSettingsEvidenceCaptured,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = repositoryGovernanceRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = repositoryGovernanceRuntimeCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.qualityAllGovernancePassed) {
    blockers.push("pnpm quality:all must pass with repository governance included.");
  }
  if (!input.repositoryGovernanceRunPersisted) {
    blockers.push("RepositoryGovernanceRun persistence row must be captured for durable auditability.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required repository governance artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required repository governance command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingArtifacts,
    missingCommands,
    requiredArtifacts: repositoryGovernanceRuntimeArtifactPaths,
    requiredCommands: repositoryGovernanceRuntimeCommands,
    requiredEvidence: repositoryGovernanceRuntimeRequiredEvidence,
    blockers,
  };
}

