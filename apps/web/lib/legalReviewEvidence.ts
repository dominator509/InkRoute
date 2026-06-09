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
