import { buildPaymentPolicyLegalReviewRuntimeReadinessPlan } from "@inkroute/security";

export type PaymentPolicyLegalRuntimeStatus =
  | "wired"
  | "legal-gated"
  | "tax-gated"
  | "copy-gated"
  | "e2e-gated";

export interface PaymentPolicyLegalRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PaymentPolicyLegalRuntimeStatus;
}

export const paymentPolicyLegalRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/dashboard typecheck",
  "payment policy approved-copy E2E sweep",
  "legal/tax approval packet review",
] as const;

export const paymentPolicyLegalCopyAreas = [
  "deposit-payment",
  "cancellation",
  "no-show",
  "refund",
  "sms-consent-stop-help-quiet-hours",
  "receipt",
  "tax-accounting-disclosure",
  "terms-privacy-consent-studio-policy",
  "acceptance-audit",
  "policy-versioning",
  "rollback-correction-plan",
] as const;

export const paymentPolicyLegalArtifactPaths = [
  "coverage/payment-policy-legal-runtime.json",
  "coverage/payment-policy-security-typecheck.txt",
  "coverage/payment-policy-security-test.txt",
  "coverage/payment-policy-web-typecheck.txt",
  "coverage/payment-policy-dashboard-typecheck.txt",
  "coverage/payment-policy-attorney-approval-redacted.json",
  "coverage/payment-policy-tax-approval-redacted.json",
  "coverage/payment-policy-approved-copy-diff.json",
  "coverage/payment-policy-acceptance-audit.json",
  "coverage/payment-policy-versioning.json",
  "coverage/payment-policy-e2e-approved-language.json",
  "coverage/payment-policy-rollback-plan.json",
  "test-results/payment-policy-legal-runtime",
] as const;

export const paymentPolicyLegalRuntimeMatrix = [
  {
    id: "security-typecheck",
    command: "pnpm --filter @inkroute/security typecheck",
    artifact: "coverage/payment-policy-security-typecheck.txt",
    status: "wired",
  },
  {
    id: "security-legal-tests",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/payment-policy-security-test.txt",
    status: "wired",
  },
  {
    id: "web-approved-copy-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/payment-policy-web-typecheck.txt",
    status: "copy-gated",
  },
  {
    id: "dashboard-approved-copy-typecheck",
    command: "pnpm --filter @inkroute/dashboard typecheck",
    artifact: "coverage/payment-policy-dashboard-typecheck.txt",
    status: "copy-gated",
  },
  {
    id: "attorney-approval",
    command: "legal approval packet review",
    artifact: "coverage/payment-policy-attorney-approval-redacted.json",
    status: "legal-gated",
  },
  {
    id: "tax-accounting-approval",
    command: "tax/accounting approval packet review",
    artifact: "coverage/payment-policy-tax-approval-redacted.json",
    status: "tax-gated",
  },
  {
    id: "approved-copy-committed",
    command: "commit reviewed payment/cancellation/no-show/refund/SMS/receipt/tax copy",
    artifact: "coverage/payment-policy-approved-copy-diff.json",
    status: "copy-gated",
  },
  {
    id: "acceptance-audit-versioning",
    command: "record accepted legal document versions and payment policy versions",
    artifact: "coverage/payment-policy-acceptance-audit.json",
    status: "copy-gated",
  },
  {
    id: "approved-language-e2e",
    command: "payment policy approved-copy E2E sweep",
    artifact: "coverage/payment-policy-e2e-approved-language.json",
    status: "e2e-gated",
  },
  {
    id: "rollback-plan",
    command: "document payment policy correction and rollback plan",
    artifact: "coverage/payment-policy-rollback-plan.json",
    status: "copy-gated",
  },
] as const satisfies readonly PaymentPolicyLegalRuntimeMatrixEntry[];

export const paymentPolicyLegalRuntimeReadiness = buildPaymentPolicyLegalReviewRuntimeReadinessPlan({
  packageScripts: ["typecheck", "test"],
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
