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

export const legalReviewRuntimeReadiness = buildLegalReviewRuntimeReadinessPlan({
  requiredReviewItemIds: [...legalReviewRequiredItemIds],
  approvedReviewItemIds: [],
  requiredArtifactPaths: [...legalReviewRequiredArtifactPaths],
  existingArtifactPaths: [...legalReviewRequiredArtifactPaths],
  legalReviewAuditPassed: false,
  redactedEvidenceLabelsPresent: false,
  privilegedAdviceExcluded: true,
  placeholderCopyReplacedAfterApproval: false,
  legalVerifyCommandPassed: false,
  ciQualityGateIncludesLegalReview: true,
  productionLaunchBlockedUntilApproval: true,
});
