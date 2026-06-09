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

export const legalReviewCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/legal-review-evidence-static.test.ts",
  "pnpm vitest run apps/web/tests/legal-pages-route.test.ts apps/web/tests/consent-acceptance-route.test.ts",
  "legal page route smoke tests",
  "consent acceptance audit persistence tests",
  "payment policy reviewed-copy E2E smoke",
  "legal copy rollback drill",
] as const;

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
  consentVersionPersistenceConfigured: false,
  studioPolicyVersionPersistenceConfigured: false,
  acceptanceAuditPersistenceConfigured: false,
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
  acceptanceAuditConfigured: false,
  policyVersioningConfigured: false,
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
