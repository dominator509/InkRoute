import { buildLegalReviewRuntimeReadinessPlan } from "@inkroute/quality";

export type LegalReviewRuntimeStatus =
  | "wired"
  | "attorney-gated"
  | "ci-gated"
  | "launch-blocking";

export interface LegalReviewRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: LegalReviewRuntimeStatus;
}

export interface LegalReviewRunPersistenceContract {
  readonly model: "LegalReviewRun";
  readonly tenantRelation: "legalReviewRuns";
  readonly migration: "20260609033700_add_legal_review_runs";
  readonly jsonFields: readonly [
    "requiredReviewItemManifest",
    "approvedReviewItemManifest",
    "artifactManifest",
    "redactedEvidenceLabelManifest",
    "launchBlockerManifest",
  ];
  readonly evidenceBooleans: readonly [
    "legalReviewAuditPassed",
    "redactedEvidenceLabelsPresent",
    "privilegedAdviceExcluded",
    "placeholderCopyReplacedAfterApproval",
    "legalVerifyCommandPassed",
    "ciQualityGateIncludesLegalReview",
    "ciLegalEvidenceCaptured",
    "productionLaunchBlockedUntilApproval",
    "qualifiedCounselApprovalCaptured",
  ];
  readonly artifactFields: readonly [
    "legalReviewAuditArtifactPath",
    "qualityGatesArtifactPath",
    "qualityAllArtifactPath",
    "ciQualityJobArtifactPath",
    "counselApprovalRedactedArtifactPath",
    "placeholderReplacementArtifactPath",
    "privilegedAdviceExclusionArtifactPath",
    "ciRunUrl",
  ];
}

export const legalReviewRunPersistenceContract: LegalReviewRunPersistenceContract = {
  model: "LegalReviewRun",
  tenantRelation: "legalReviewRuns",
  migration: "20260609033700_add_legal_review_runs",
  jsonFields: [
    "requiredReviewItemManifest",
    "approvedReviewItemManifest",
    "artifactManifest",
    "redactedEvidenceLabelManifest",
    "launchBlockerManifest",
  ],
  evidenceBooleans: [
    "legalReviewAuditPassed",
    "redactedEvidenceLabelsPresent",
    "privilegedAdviceExcluded",
    "placeholderCopyReplacedAfterApproval",
    "legalVerifyCommandPassed",
    "ciQualityGateIncludesLegalReview",
    "ciLegalEvidenceCaptured",
    "productionLaunchBlockedUntilApproval",
    "qualifiedCounselApprovalCaptured",
  ],
  artifactFields: [
    "legalReviewAuditArtifactPath",
    "qualityGatesArtifactPath",
    "qualityAllArtifactPath",
    "ciQualityJobArtifactPath",
    "counselApprovalRedactedArtifactPath",
    "placeholderReplacementArtifactPath",
    "privilegedAdviceExclusionArtifactPath",
    "ciRunUrl",
  ],
};

export const legalReviewRequiredItemIds = [
  "privacy",
  "terms",
  "consent",
  "medical-acknowledgments",
  "payments-refunds",
  "sms-notifications",
  "aftercare",
] as const;

export const legalReviewRequiredArtifactPaths = [
  "docs/legal/LEGAL_REVIEW_PACKET.md",
  "docs/legal/manifests/legal-review-contract.json",
  "docs/legal/manifests/legal-review-evidence.json",
  "docs/legal/manifests/legal-review-audit.json",
  "scripts/legal/verify-legal-review.mjs",
] as const;

export const legalReviewRuntimeCommands = [
  "pnpm legal:verify-review",
  "pnpm quality:gates",
  "pnpm quality:all",
  "GitHub Actions CI quality job",
  "qualified counsel review outside the repository",
] as const;

export const legalReviewRuntimeArtifactPaths = [
  "coverage/legal-review-runtime.json",
  "coverage/legal-review-audit-output.txt",
  "coverage/legal-review-quality-gates-output.txt",
  "coverage/legal-review-quality-all-output.txt",
  "coverage/legal-review-ci-quality-job.json",
  "coverage/legal-review-counsel-approval-redacted.json",
  "coverage/legal-review-placeholder-replacement.json",
  "coverage/legal-review-privileged-advice-exclusion.json",
  "test-results/legal-review-runtime",
] as const;

export const legalReviewRuntimeProofFiles = [
  "package.json",
  "docs/legal/LEGAL_REVIEW_PACKET.md",
  "docs/legal/manifests/legal-review-contract.json",
  "docs/legal/manifests/legal-review-evidence.json",
  "scripts/legal/verify-legal-review.mjs",
  "packages/quality/tests/quality-gates.test.ts",
  "apps/web/lib/legalReviewRuntime.ts",
  "apps/web/tests/legal-review-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033700_add_legal_review_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const legalReviewRuntimeMatrix = [
  {
    id: "legal-review-audit",
    command: "pnpm legal:verify-review",
    artifact: "coverage/legal-review-audit-output.txt",
    status: "attorney-gated",
  },
  {
    id: "quality-gates-legal-review",
    command: "pnpm quality:gates",
    artifact: "coverage/legal-review-quality-gates-output.txt",
    status: "wired",
  },
  {
    id: "quality-all-legal-chain",
    command: "pnpm quality:all",
    artifact: "coverage/legal-review-quality-all-output.txt",
    status: "wired",
  },
  {
    id: "ci-quality-legal-review",
    command: "GitHub Actions CI quality job",
    artifact: "coverage/legal-review-ci-quality-job.json",
    status: "ci-gated",
  },
  {
    id: "qualified-counsel-review",
    command: "qualified counsel review outside the repository",
    artifact: "coverage/legal-review-counsel-approval-redacted.json",
    status: "attorney-gated",
  },
  {
    id: "placeholder-replacement-after-approval",
    command: "replace placeholder legal copy only after approval is recorded",
    artifact: "coverage/legal-review-placeholder-replacement.json",
    status: "attorney-gated",
  },
  {
    id: "privileged-advice-exclusion",
    command: "confirm privileged advice, secrets, and client data are excluded from repo evidence",
    artifact: "coverage/legal-review-privileged-advice-exclusion.json",
    status: "wired",
  },
  {
    id: "production-launch-block",
    command: "block production launch until legal approval evidence is complete",
    artifact: "coverage/legal-review-runtime.json",
    status: "launch-blocking",
  },
] as const satisfies readonly LegalReviewRuntimeMatrixEntry[];

export type LegalReviewRequiredItemId = (typeof legalReviewRequiredItemIds)[number];
export type LegalReviewEvidenceFlag = (typeof legalReviewRunPersistenceContract.evidenceBooleans)[number];

export interface LegalReviewRunEvidenceFields {
  readonly legalReviewAuditPassed: boolean;
  readonly redactedEvidenceLabelsPresent: boolean;
  readonly privilegedAdviceExcluded: boolean;
  readonly placeholderCopyReplacedAfterApproval: boolean;
  readonly legalVerifyCommandPassed: boolean;
  readonly ciQualityGateIncludesLegalReview: boolean;
  readonly ciLegalEvidenceCaptured: boolean;
  readonly productionLaunchBlockedUntilApproval: boolean;
  readonly qualifiedCounselApprovalCaptured: boolean;
}

export interface LegalReviewRunRecordInput extends LegalReviewRunEvidenceFields {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly approvedReviewItemIds: readonly string[];
  readonly runtimeArtifactPaths: readonly string[];
  readonly redactedEvidenceLabels: readonly string[];
  readonly launchBlockers: readonly string[];
  readonly legalReviewAuditArtifactPath?: string | null;
  readonly qualityGatesArtifactPath?: string | null;
  readonly qualityAllArtifactPath?: string | null;
  readonly ciQualityJobArtifactPath?: string | null;
  readonly counselApprovalRedactedArtifactPath?: string | null;
  readonly placeholderReplacementArtifactPath?: string | null;
  readonly privilegedAdviceExclusionArtifactPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface LegalReviewRunData extends Omit<
  LegalReviewRunRecordInput,
  "approvedReviewItemIds" | "runtimeArtifactPaths" | "redactedEvidenceLabels" | "launchBlockers"
> {
  readonly requiredReviewItemManifest: readonly LegalReviewRequiredItemId[];
  readonly approvedReviewItemManifest: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly redactedEvidenceLabelManifest: readonly string[];
  readonly launchBlockerManifest: readonly string[];
}

export interface LegalReviewRunRepository {
  readonly legalReviewRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: LegalReviewRunData;
      update: Omit<LegalReviewRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface LegalReviewEvidenceInput {
  readonly approvedReviewItemIds?: readonly string[];
  readonly requiredArtifactPaths?: readonly string[];
  readonly runtimeArtifactPaths?: readonly string[];
  readonly commands?: readonly string[];
  readonly evidence?: Partial<Record<LegalReviewEvidenceFlag, boolean>>;
}

export interface LegalReviewEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingApprovedItems: readonly LegalReviewRequiredItemId[];
  readonly missingRequiredArtifacts: readonly string[];
  readonly missingRuntimeArtifacts: readonly string[];
  readonly missingCommands: readonly string[];
  readonly missingEvidence: readonly LegalReviewEvidenceFlag[];
  readonly requiredApprovedItems: readonly LegalReviewRequiredItemId[];
  readonly requiredArtifactPaths: readonly string[];
  readonly requiredRuntimeArtifactPaths: readonly string[];
  readonly requiredCommands: typeof legalReviewRuntimeCommands;
  readonly requiredEvidence: readonly LegalReviewEvidenceFlag[];
  readonly blockers: readonly string[];
}

export interface LegalReviewExecutionPlan {
  readonly localCommands: typeof legalReviewLocalCommands;
  readonly externalCommands: typeof legalReviewExternalCommands;
  readonly localArtifacts: typeof legalReviewLocalArtifacts;
  readonly externalArtifacts: typeof legalReviewExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly attorneyReviewExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly legalAdviceGenerationAllowed: false;
  readonly executionPolicy: typeof legalReviewExecutionPolicy;
  readonly requiredExternalEvidence: typeof legalReviewRequiredExternalEvidence;
}

export interface LegalReviewArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof legalReviewRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const sensitiveLegalReviewKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|client|patient|medical|payment|card|attorney|counsel|privileged|advice|signature|approval|reviewer|jurisdiction|bar|legal|terms|privacy|consent|copy|body|text|sms|notification|aftercare|refund|policy|placeholder|audit|quality|ci|command|output|log|stack|error|artifact|path|route|html|dom|document|acceptance|version|noindex|rollback|workflow|run|commit|branch|repository|repo|pull|pr|codeowner|raw|request|response|report|transcript|screenshot|trace|video|provider|tenant|user|database|url|uri|dsn|key|id|payload|evidence)/iu;
const sensitiveLegalReviewValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:legal|review|approval|attorney|counsel|privileged|consent|privacy|terms|aftercare|refund|policy|document|version|route|report|audit|quality|artifact|workflow|ci|run|commit|tenant|client|user|provider|database|persistence)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:docs|coverage|test-results|reports|artifacts)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

export const legalReviewExecutionPolicy = {
  codexMayClassifyStaticLegalReadiness: true,
  qualifiedCounselApprovalRequiredForClosure: true,
  privilegedAdviceMustStayOutOfRepo: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const legalReviewRequiredExternalEvidence = [
  "Qualified counsel approval covering privacy, terms, consent, medical acknowledgments, payments/refunds, SMS/notifications, and aftercare.",
  "Redacted approval evidence labels only, with privileged attorney communications excluded from the repository.",
  "Placeholder legal/compliance copy replacement evidence captured only after approval is recorded.",
  "CI legal evidence proving legal review verification is included in quality gates.",
  "Provider-backed LegalReviewRun persistence row captured through persistLegalReviewRun.",
  "Production launch blocker evidence showing launch remains blocked until legal approval evidence is complete.",
] as const;

export const legalReviewLocalCommands = ["pnpm legal:verify-review", "pnpm quality:gates", "pnpm quality:all"] as const;

export const legalReviewExternalCommands = [
  "GitHub Actions CI quality job",
  "qualified counsel review outside the repository",
] as const;

export const legalReviewLocalArtifacts = [
  "coverage/legal-review-runtime.json",
  "coverage/legal-review-audit-output.txt",
  "coverage/legal-review-quality-gates-output.txt",
  "coverage/legal-review-quality-all-output.txt",
  "coverage/legal-review-privileged-advice-exclusion.json",
] as const;

export const legalReviewExternalArtifacts = [
  "coverage/legal-review-ci-quality-job.json",
  "coverage/legal-review-counsel-approval-redacted.json",
  "coverage/legal-review-placeholder-replacement.json",
  "test-results/legal-review-runtime",
] as const;

const buildRedactedLegalReviewValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedLegalReviewValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveLegalReviewKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedLegalReviewValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveLegalReviewValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildLegalReviewExecutionPlan(): LegalReviewExecutionPlan {
  return {
    localCommands: legalReviewLocalCommands,
    externalCommands: legalReviewExternalCommands,
    localArtifacts: legalReviewLocalArtifacts,
    externalArtifacts: legalReviewExternalArtifacts,
    commandExecutionAllowed: false,
    attorneyReviewExecutionAllowed: false,
    ciExecutionAllowed: false,
    databaseExecutionAllowed: false,
    legalAdviceGenerationAllowed: false,
    executionPolicy: legalReviewExecutionPolicy,
    requiredExternalEvidence: legalReviewRequiredExternalEvidence,
  };
}

export function buildRedactedLegalReviewArtifact(artifact: unknown): unknown {
  return buildRedactedLegalReviewValue(artifact, "", []);
}

export function buildLegalReviewArtifactReview(artifact: unknown): LegalReviewArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedLegalReviewValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: legalReviewRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildLegalReviewRunData(input: LegalReviewRunRecordInput): LegalReviewRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    requiredReviewItemManifest: legalReviewRequiredItemIds,
    approvedReviewItemManifest: input.approvedReviewItemIds,
    artifactManifest: input.runtimeArtifactPaths,
    redactedEvidenceLabelManifest: input.redactedEvidenceLabels,
    launchBlockerManifest: input.launchBlockers,
    legalReviewAuditPassed: input.legalReviewAuditPassed,
    redactedEvidenceLabelsPresent: input.redactedEvidenceLabelsPresent,
    privilegedAdviceExcluded: input.privilegedAdviceExcluded,
    placeholderCopyReplacedAfterApproval: input.placeholderCopyReplacedAfterApproval,
    legalVerifyCommandPassed: input.legalVerifyCommandPassed,
    ciQualityGateIncludesLegalReview: input.ciQualityGateIncludesLegalReview,
    ciLegalEvidenceCaptured: input.ciLegalEvidenceCaptured,
    productionLaunchBlockedUntilApproval: input.productionLaunchBlockedUntilApproval,
    qualifiedCounselApprovalCaptured: input.qualifiedCounselApprovalCaptured,
    legalReviewAuditArtifactPath: input.legalReviewAuditArtifactPath ?? null,
    qualityGatesArtifactPath: input.qualityGatesArtifactPath ?? null,
    qualityAllArtifactPath: input.qualityAllArtifactPath ?? null,
    ciQualityJobArtifactPath: input.ciQualityJobArtifactPath ?? null,
    counselApprovalRedactedArtifactPath: input.counselApprovalRedactedArtifactPath ?? null,
    placeholderReplacementArtifactPath: input.placeholderReplacementArtifactPath ?? null,
    privilegedAdviceExclusionArtifactPath: input.privilegedAdviceExclusionArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistLegalReviewRun(
  repository: LegalReviewRunRepository,
  input: LegalReviewRunRecordInput,
): Promise<unknown> {
  const data = buildLegalReviewRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.legalReviewRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

const legalReviewEvidenceBlockers: Record<LegalReviewEvidenceFlag, string> = {
  legalReviewAuditPassed: "Legal review audit must pass.",
  redactedEvidenceLabelsPresent: "Redacted legal approval evidence labels must be present.",
  privilegedAdviceExcluded: "Privileged attorney advice, secrets, and client data must be excluded from repo evidence.",
  placeholderCopyReplacedAfterApproval: "Placeholder legal/compliance copy may only be replaced after approval is recorded.",
  legalVerifyCommandPassed: "pnpm legal:verify-review must pass.",
  ciQualityGateIncludesLegalReview: "CI quality gates must include legal review verification.",
  ciLegalEvidenceCaptured: "CI legal evidence must be captured.",
  productionLaunchBlockedUntilApproval: "Production launch must stay blocked until legal approval evidence is complete.",
  qualifiedCounselApprovalCaptured: "Qualified counsel approval must be captured as redacted evidence labels.",
};

const missingFrom = <T extends string>(actual: readonly string[] | undefined, required: readonly T[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildLegalReviewEvidenceDecision = (input: LegalReviewEvidenceInput): LegalReviewEvidenceDecision => {
  const missingApprovedItems = missingFrom(input.approvedReviewItemIds, legalReviewRequiredItemIds);
  const missingRequiredArtifacts = missingFrom(input.requiredArtifactPaths, legalReviewRequiredArtifactPaths);
  const missingRuntimeArtifacts = missingFrom(input.runtimeArtifactPaths, legalReviewRuntimeArtifactPaths);
  const missingCommands = missingFrom(input.commands, legalReviewRuntimeCommands);
  const missingEvidence = legalReviewRunPersistenceContract.evidenceBooleans.filter(
    (flag) => input.evidence?.[flag] !== true,
  );
  const blockers = [
    ...missingApprovedItems.map((item) => `Legal review item '${item}' must be attorney-approved before production launch.`),
    ...missingEvidence.map((flag) => legalReviewEvidenceBlockers[flag]),
  ];

  return {
    status:
      missingApprovedItems.length === 0 &&
      missingRequiredArtifacts.length === 0 &&
      missingRuntimeArtifacts.length === 0 &&
      missingCommands.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingApprovedItems,
    missingRequiredArtifacts,
    missingRuntimeArtifacts,
    missingCommands,
    missingEvidence,
    requiredApprovedItems: legalReviewRequiredItemIds,
    requiredArtifactPaths: legalReviewRequiredArtifactPaths,
    requiredRuntimeArtifactPaths: legalReviewRuntimeArtifactPaths,
    requiredCommands: legalReviewRuntimeCommands,
    requiredEvidence: legalReviewRunPersistenceContract.evidenceBooleans,
    blockers,
  };
};

export const legalReviewRuntimeReadiness = buildLegalReviewRuntimeReadinessPlan({
  requiredReviewItemIds: legalReviewRequiredItemIds,
  approvedReviewItemIds: [],
  requiredArtifactPaths: legalReviewRequiredArtifactPaths,
  existingArtifactPaths: legalReviewRequiredArtifactPaths,
  legalReviewAuditPassed: false,
  redactedEvidenceLabelsPresent: false,
  privilegedAdviceExcluded: true,
  placeholderCopyReplacedAfterApproval: false,
  legalVerifyCommandPassed: false,
  ciQualityGateIncludesLegalReview: true,
  productionLaunchBlockedUntilApproval: true,
});

