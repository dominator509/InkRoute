import {
  buildLegalDocumentProductionReadinessPlan,
  buildLegalReviewPacketPlan,
  buildPaymentPolicyLegalReviewRuntimeReadinessPlan,
  requiredLegalReviewTopics,
  type LegalReviewApprovalRecord,
} from "@inkroute/security";

export type LegalReviewEvidenceAction =
  | "collect-attorney-approval-metadata"
  | "record-jurisdiction-policy-version"
  | "record-consent-document-version"
  | "commit-reviewed-public-page-copy"
  | "keep-noindex-until-approval"
  | "remove-placeholder-copy-after-approval"
  | "persist-versioned-acceptance-audit"
  | "wire-dashboard-acceptance-ui"
  | "run-legal-page-route-smoke"
  | "run-consent-acceptance-route-tests"
  | "document-legal-copy-rollback"
  | "capture-payment-policy-approval";

export interface LegalDocumentVersionPersistenceInput {
  tenantId: string;
  documentType: "privacy_policy" | "terms_of_service" | "tattoo_consent" | "sms_policy" | "payment_policy";
  jurisdiction: string;
  version: string;
  reviewedCopyHash: string;
  reviewerName?: string;
  reviewerFirm?: string;
  approvedAt?: string;
  effectiveAt?: string;
  noindexUntilApproved: boolean;
  rollbackFromVersion?: string;
  evidenceObjectKey?: string;
}

export interface LegalAcceptanceAuditPersistenceInput {
  tenantId: string;
  legalDocumentVersionId: string;
  acceptedByUserId?: string;
  subjectEmailHash?: string;
  acceptanceContext: "booking_request" | "consent_signature" | "dashboard_policy_ack" | "payment_checkout";
  acceptedVersion: string;
  ipHash?: string;
  userAgentHash?: string;
}

export interface LegalVersionAcceptancePersistenceContract {
  documentModelName: "LegalDocumentVersion";
  acceptanceModelName: "LegalAcceptanceAudit";
  documentRow: LegalDocumentVersionPersistenceInput;
  acceptanceRow: LegalAcceptanceAuditPersistenceInput;
  transactionWrites: readonly ["LegalDocumentVersion", "LegalAcceptanceAudit", "AuditLog"];
  approvalGate: "noindex_until_approved_at_and_reviewed_copy_hash";
  redactedFields: readonly ["reviewedCopyHash", "subjectEmailHash", "ipHash", "userAgentHash", "evidenceObjectKey"];
  tenantIsolationKey: "tenantId";
}

export const legalReviewArtifactPaths = [
  "coverage/legal-review-packet.json",
  "coverage/legal-attorney-approvals-redacted.json",
  "coverage/legal-jurisdiction-policy-versions.json",
  "coverage/legal-consent-version-persistence.json",
  "coverage/legal-public-page-smoke.json",
  "coverage/legal-noindex-removal-after-approval.json",
  "coverage/legal-acceptance-audit-persistence.json",
  "coverage/legal-dashboard-acceptance-ui.json",
  "coverage/legal-payment-policy-review-redacted.json",
  "coverage/legal-copy-rollback-plan.md",
  "test-results/legal-review",
] as const;

export const legalReviewProofFiles = [
  "packages/security/package.json",
  "apps/web/lib/legalReviewEvidence.ts",
  "apps/web/tests/legal-review-evidence-static.test.ts",
  "apps/web/app/privacy/page.tsx",
  "apps/web/app/terms/page.tsx",
  "apps/web/app/consent-disclaimer/page.tsx",
  "apps/web/app/trust/page.tsx",
  "apps/dashboard/app/trust/page.tsx",
  "docs/legal/LEGAL_REVIEW_PACKET.md",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609003000_add_legal_document_acceptance/migration.sql",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "SECURITY.md",
  "PRODUCT_REQUIREMENTS.md",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const legalReviewCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/legal-review-evidence-static.test.ts",
  "pnpm vitest run apps/web/tests/legal-pages-route.test.ts apps/web/tests/consent-acceptance-route.test.ts",
  "legal page route smoke tests",
  "consent acceptance audit persistence tests",
  "payment policy reviewed-copy E2E smoke",
  "legal copy rollback drill",
] as const;

export const legalReviewLocalCommands = legalReviewCommands.slice(0, 3);
export const legalReviewExternalCommands = legalReviewCommands.slice(3);

export const legalReviewRequiredExternalEvidence = [
  "Qualified attorney approval metadata evidence",
  "Jurisdiction-specific studio policy version evidence",
  "Reviewed public legal page smoke evidence",
  "Noindex removal after approval evidence",
  "Consent acceptance audit persistence evidence",
  "Payment policy legal and tax review evidence",
  "Legal copy rollback drill evidence",
] as const;

export type LegalReviewArtifact = (typeof legalReviewArtifactPaths)[number];

export type LegalReviewCommand = (typeof legalReviewCommands)[number];

export const legalReviewLocalArtifacts = [
  "coverage/legal-review-packet.json",
  "coverage/legal-consent-version-persistence.json",
  "coverage/legal-acceptance-audit-persistence.json",
  "coverage/legal-dashboard-acceptance-ui.json",
  "coverage/legal-copy-rollback-plan.md",
  "test-results/legal-review",
] as const satisfies readonly LegalReviewArtifact[];

export const legalReviewExternalArtifacts = [
  "coverage/legal-attorney-approvals-redacted.json",
  "coverage/legal-jurisdiction-policy-versions.json",
  "coverage/legal-public-page-smoke.json",
  "coverage/legal-noindex-removal-after-approval.json",
  "coverage/legal-payment-policy-review-redacted.json",
] as const satisfies readonly LegalReviewArtifact[];

export type LegalReviewExecutionPolicy = {
  localPacketOnly: true;
  attorneyApprovalRequiresExternalEvidence: true;
  reviewedCopyPublicationRequiresExternalEvidence: true;
  noindexRemovalRequiresExternalEvidence: true;
  acceptancePersistenceRequiresExternalEvidence: true;
  paymentPolicyReviewRequiresExternalEvidence: true;
  rollbackDrillRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof legalReviewRequiredExternalEvidence;
};

export type LegalReviewEvidenceInput = {
  packetScaffoldCaptured: boolean;
  attorneyApprovalsCaptured: boolean;
  jurisdictionPolicyVersionsCaptured: boolean;
  consentVersionPersistenceCaptured: boolean;
  reviewedPublicPageSmokeCaptured: boolean;
  noindexRemovedAfterApprovalCaptured: boolean;
  acceptanceAuditPersistenceCaptured: boolean;
  dashboardAcceptanceUiCaptured: boolean;
  paymentPolicyReviewCaptured: boolean;
  rollbackPlanCaptured: boolean;
  requiredCommandsRun: readonly LegalReviewCommand[];
  capturedArtifacts: readonly LegalReviewArtifact[];
};

export type LegalReviewEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: LegalReviewArtifact[];
  requiredCommands: typeof legalReviewCommands;
  requiredEvidence: typeof legalReviewArtifactPaths;
  publicationPolicy: {
    noindexRemovedOnlyAfterApproval: true;
    placeholderCopyRemovedOnlyAfterReview: true;
    acceptanceAuditsUseRedactedHashes: true;
  };
};

export type LegalReviewExecutionPlan = {
  status: "local-plan-ready";
  policy: LegalReviewExecutionPolicy;
  externalEvidenceRequired: typeof legalReviewRequiredExternalEvidence;
  attorneyApprovalExecutionAllowed: false;
  reviewedCopyPublicationAllowed: false;
  noindexRemovalAllowed: false;
  acceptancePersistenceExecutionAllowed: false;
  paymentPolicyReviewExecutionAllowed: false;
  rollbackDrillExecutionAllowed: false;
  localCommands: typeof legalReviewLocalCommands;
  externalCommands: typeof legalReviewExternalCommands;
  localArtifacts: typeof legalReviewLocalArtifacts;
  externalArtifacts: typeof legalReviewExternalArtifacts;
  disabledReasons: readonly string[];
};

export const legalReviewExecutionPolicy: LegalReviewExecutionPolicy = {
  localPacketOnly: true,
  attorneyApprovalRequiresExternalEvidence: true,
  reviewedCopyPublicationRequiresExternalEvidence: true,
  noindexRemovalRequiresExternalEvidence: true,
  acceptancePersistenceRequiresExternalEvidence: true,
  paymentPolicyReviewRequiresExternalEvidence: true,
  rollbackDrillRequiresExternalEvidence: true,
  externalEvidenceRequired: legalReviewRequiredExternalEvidence,
};

export type LegalReviewArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof legalReviewArtifactPaths;
  retainedExternalGates: readonly string[];
};

const legalReviewSensitivePatterns = [
  /(reviewer[_-]?name['":=\s]+)[^"',\s}]+/gi,
  /(reviewer[_-]?firm['":=\s]+)[^"',\s}]+/gi,
  /(reviewed[_-]?copy[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(subject[_-]?email[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(ip[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(user[_-]?agent[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(evidence[_-]?object[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedLegalReviewArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return legalReviewSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedLegalReviewArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|name|firm|hash|token|secret|authorization|credential|password|rawBody|stack|evidenceObjectKey|reviewer|attorney/i.test(key)
          ? "[REDACTED]"
          : buildRedactedLegalReviewArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildLegalReviewExecutionPlan(): LegalReviewExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: legalReviewExecutionPolicy,
    externalEvidenceRequired: legalReviewRequiredExternalEvidence,
    attorneyApprovalExecutionAllowed: false,
    reviewedCopyPublicationAllowed: false,
    noindexRemovalAllowed: false,
    acceptancePersistenceExecutionAllowed: false,
    paymentPolicyReviewExecutionAllowed: false,
    rollbackDrillExecutionAllowed: false,
    localCommands: legalReviewLocalCommands,
    externalCommands: legalReviewExternalCommands,
    localArtifacts: legalReviewLocalArtifacts,
    externalArtifacts: legalReviewExternalArtifacts,
    disabledReasons: [
      "Qualified attorney approval cannot be generated by local code.",
      "Reviewed public copy publication requires approved legal copy.",
      "Noindex removal must wait for attorney approval and reviewed copy hashes.",
      "Acceptance persistence execution requires route/database proof.",
      "Payment policy legal/tax approval requires external review.",
      "Legal copy rollback drill requires approved reviewed-copy version evidence.",
    ],
  };
}

export function buildLegalReviewArtifactReview(rawArtifact: unknown): LegalReviewArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedLegalReviewArtifact(rawArtifact),
    requiredArtifacts: legalReviewArtifactPaths,
    retainedExternalGates: [
      "Qualified attorney approval metadata evidence",
      "Jurisdiction-specific studio policy version evidence",
      "Reviewed public legal page smoke evidence",
      "Noindex removal after approval evidence",
      "Consent acceptance audit persistence evidence",
      "Payment policy legal and tax review evidence",
      "Legal copy rollback drill evidence",
    ],
  };
}

export function buildLegalReviewEvidenceDecision(input: LegalReviewEvidenceInput): LegalReviewEvidenceDecision {
  const blockers = [
    !input.packetScaffoldCaptured && "Capture legal review packet scaffold evidence.",
    !input.attorneyApprovalsCaptured && "Capture qualified attorney approval metadata evidence.",
    !input.jurisdictionPolicyVersionsCaptured && "Capture jurisdiction-specific studio policy version evidence.",
    !input.consentVersionPersistenceCaptured && "Capture consent document version persistence evidence.",
    !input.reviewedPublicPageSmokeCaptured && "Capture reviewed public legal page smoke evidence.",
    !input.noindexRemovedAfterApprovalCaptured && "Capture noindex removal after approval evidence.",
    !input.acceptanceAuditPersistenceCaptured && "Capture versioned acceptance audit persistence evidence.",
    !input.dashboardAcceptanceUiCaptured && "Capture dashboard acceptance UI evidence.",
    !input.paymentPolicyReviewCaptured && "Capture payment policy legal and tax review evidence.",
    !input.rollbackPlanCaptured && "Capture legal copy rollback plan evidence.",
  ].filter(Boolean) as string[];

  const missingArtifacts = legalReviewArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = legalReviewCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: legalReviewCommands,
    requiredEvidence: legalReviewArtifactPaths,
    publicationPolicy: {
      noindexRemovedOnlyAfterApproval: true,
      placeholderCopyRemovedOnlyAfterReview: true,
      acceptanceAuditsUseRedactedHashes: true,
    },
  };
}

export function buildLegalVersionAcceptancePersistenceContract(input: {
  document: LegalDocumentVersionPersistenceInput;
  acceptance: LegalAcceptanceAuditPersistenceInput;
}): LegalVersionAcceptancePersistenceContract {
  return {
    documentModelName: "LegalDocumentVersion",
    acceptanceModelName: "LegalAcceptanceAudit",
    documentRow: input.document,
    acceptanceRow: input.acceptance,
    transactionWrites: ["LegalDocumentVersion", "LegalAcceptanceAudit", "AuditLog"],
    approvalGate: "noindex_until_approved_at_and_reviewed_copy_hash",
    redactedFields: ["reviewedCopyHash", "subjectEmailHash", "ipHash", "userAgentHash", "evidenceObjectKey"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildLegalReviewEvidenceContract(input: {
  approvals: readonly LegalReviewApprovalRecord[];
  jurisdiction: string;
  studioPolicyVersion?: string;
  consentVersion?: string;
  acceptanceAuditConfigured: boolean;
  noindexProtectionEnabled: boolean;
}) {
  const packet = buildLegalReviewPacketPlan(input);
  const actions: LegalReviewEvidenceAction[] = [
    "collect-attorney-approval-metadata",
    "record-jurisdiction-policy-version",
    "record-consent-document-version",
    "commit-reviewed-public-page-copy",
    "keep-noindex-until-approval",
    "remove-placeholder-copy-after-approval",
    "persist-versioned-acceptance-audit",
    "wire-dashboard-acceptance-ui",
    "run-legal-page-route-smoke",
    "run-consent-acceptance-route-tests",
    "document-legal-copy-rollback",
    "capture-payment-policy-approval",
  ];

  return {
    gapIds: ["GAP-100"] as const,
    packet,
    actions,
    requiredTopics: requiredLegalReviewTopics,
    artifactPaths: legalReviewArtifactPaths,
  };
}

export const legalDocumentRuntimeContract = buildLegalDocumentProductionReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  attorneyApprovalsRecorded: false,
  allRequiredTopicsApproved: false,
  jurisdictionPoliciesApproved: false,
  reviewedPublicPageCopyCommitted: false,
  placeholderCopyRemoved: false,
  noindexRemovedAfterApproval: false,
  consentVersionPersistenceConfigured: true,
  studioPolicyVersionPersistenceConfigured: true,
  acceptanceAuditPersistenceConfigured: true,
  dashboardAcceptanceUiWired: false,
  publicPageRouteSmokePassed: false,
  consentAcceptanceRouteTestsPassed: false,
  rollbackPlanDocumented: false,
});

export const paymentPolicyLegalRuntimeContract = buildPaymentPolicyLegalReviewRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  webTypecheckPassed: false,
  dashboardTypecheckPassed: false,
  attorneyApprovalRecorded: false,
  taxAccountingApprovalRecorded: false,
  reviewedPaymentCopyCommitted: false,
  reviewedCancellationCopyCommitted: false,
  reviewedNoShowCopyCommitted: false,
  reviewedRefundCopyCommitted: false,
  reviewedSmsConsentCopyCommitted: false,
  reviewedReceiptCopyCommitted: false,
  reviewedTaxDisclosureCopyCommitted: false,
  termsPrivacyConsentUpdated: false,
  placeholdersRemovedFromPaymentFlows: false,
  acceptanceAuditConfigured: true,
  policyVersioningConfigured: true,
  e2eApprovedLanguageVerified: false,
  rollbackCopyPlanDocumented: false,
});

export const legalReviewEvidencePreview = buildLegalReviewEvidenceContract({
  approvals: [],
  jurisdiction: "US-STATE-BY-STATE",
  acceptanceAuditConfigured: false,
  noindexProtectionEnabled: true,
});

export const legalVersionAcceptancePersistencePreview = buildLegalVersionAcceptancePersistenceContract({
  document: {
    tenantId: "tenant_demo",
    documentType: "tattoo_consent",
    jurisdiction: "US-STATE-BY-STATE",
    version: "legal-draft-2026-06",
    reviewedCopyHash: "sha256:pending-attorney-review",
    noindexUntilApproved: true,
    evidenceObjectKey: "legal/tenant_demo/tattoo-consent/redacted-review.json",
  },
  acceptance: {
    tenantId: "tenant_demo",
    legalDocumentVersionId: "legal_document_version_demo",
    acceptedByUserId: "user_demo",
    subjectEmailHash: "sha256:redacted",
    acceptanceContext: "consent_signature",
    acceptedVersion: "legal-draft-2026-06",
    ipHash: "sha256:redacted",
    userAgentHash: "sha256:redacted",
  },
});
