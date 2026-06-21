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

export const paymentPolicyLegalRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/web/package.json",
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/paymentPolicyLegalRuntime.ts",
  "apps/web/tests/payment-policy-legal-runtime-static.test.ts",
  "apps/web/app/booking/deposit-preview/page.tsx",
  "apps/dashboard/app/payments/page.tsx",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export const paymentPolicyLegalEvidenceFlags = [
  "securityTypecheckPassed",
  "securityTestsPassed",
  "webTypecheckPassed",
  "dashboardTypecheckPassed",
  "attorneyApprovalRecorded",
  "taxAccountingApprovalRecorded",
  "approvedCopyCommitted",
  "acceptanceAuditConfigured",
  "policyVersioningConfigured",
  "e2eApprovedLanguageVerified",
  "rollbackCopyPlanDocumented",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PaymentPolicyLegalEvidenceFlag = (typeof paymentPolicyLegalEvidenceFlags)[number];

export interface PaymentPolicyLegalExecutionPolicy {
  readonly codexMayClassifyStaticPaymentPolicyLegalReadiness: true;
  readonly attorneyApprovalRequiredForClosure: true;
  readonly taxAccountingApprovalRequiredForClosure: true;
  readonly reviewedProductionCopyRequiredForClosure: true;
  readonly acceptanceVersioningRequiredForClosure: true;
  readonly approvedLanguageE2eRequiredForClosure: true;
  readonly rollbackPlanRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PaymentPolicyLegalExecutionPlan {
  readonly policy: typeof paymentPolicyLegalExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly legalApprovalExecutionAllowed: false;
  readonly taxAccountingExecutionAllowed: false;
  readonly productionCopyExecutionAllowed: false;
  readonly acceptanceVersioningExecutionAllowed: false;
  readonly e2eExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof paymentPolicyLegalLocalCommands;
  readonly externalCommands: typeof paymentPolicyLegalExternalCommands;
  readonly requiredExternalEvidence: typeof paymentPolicyLegalRequiredExternalEvidence;
}

export interface PaymentPolicyLegalArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof paymentPolicyLegalRequiredExternalEvidence;
}

export interface PaymentPolicyLegalEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly reviewedAreas?: readonly PaymentPolicyLegalReviewedArea[];
  readonly evidence?: Partial<Record<PaymentPolicyLegalEvidenceFlag, boolean>>;
}

export interface PaymentPolicyLegalEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof paymentPolicyLegalRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof paymentPolicyLegalArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredReviewedAreas: readonly PaymentPolicyLegalReviewedArea[];
  readonly missingReviewedAreas: readonly PaymentPolicyLegalReviewedArea[];
  readonly requiredEvidence: typeof paymentPolicyLegalEvidenceFlags;
  readonly missingEvidence: readonly PaymentPolicyLegalEvidenceFlag[];
  readonly blockers: readonly string[];
}

export type PaymentPolicyLegalReviewedArea = (typeof paymentPolicyLegalCopyAreas)[number];

export type PaymentPolicyLegalApprovalPacketStatus = "approved" | "blocked";

export interface PaymentPolicyLegalApprovalPacketInput {
  readonly attorneyApprovalRecorded: boolean;
  readonly taxAccountingApprovalRecorded: boolean;
  readonly productionCopyReviewed: boolean;
  readonly acceptanceAuditConfigured: boolean;
  readonly policyVersioningConfigured: boolean;
  readonly e2eApprovedLanguageVerified: boolean;
  readonly rollbackCopyPlanDocumented: boolean;
  readonly policyVersion: string;
  readonly reviewedAreas: readonly PaymentPolicyLegalReviewedArea[];
}

export interface PaymentPolicyLegalApprovalPacketDecision {
  readonly status: PaymentPolicyLegalApprovalPacketStatus;
  readonly blockers: readonly string[];
  readonly missingReviewedAreas: readonly PaymentPolicyLegalReviewedArea[];
  readonly requiredEvidence: typeof paymentPolicyLegalApprovalPacketRequiredEvidence;
  readonly redactedSummary: {
    readonly policyVersion: string;
    readonly reviewedAreaCount: number;
    readonly requiredAreaCount: number;
  };
}

export const paymentPolicyLegalExecutionPolicy = {
  codexMayClassifyStaticPaymentPolicyLegalReadiness: true,
  attorneyApprovalRequiredForClosure: true,
  taxAccountingApprovalRequiredForClosure: true,
  reviewedProductionCopyRequiredForClosure: true,
  acceptanceVersioningRequiredForClosure: true,
  approvedLanguageE2eRequiredForClosure: true,
  rollbackPlanRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies PaymentPolicyLegalExecutionPolicy;

export const paymentPolicyLegalRequiredExternalEvidence = [
  "legal approval packet review",
  "tax/accounting approval packet review",
  "reviewed production copy proof",
  "Terms/Privacy/Consent/studio policy update proof",
  "acceptance audit proof",
  "policy versioning proof",
  "approved-language E2E proof",
  "rollback/correction plan proof",
  "CI payment policy legal evidence",
  "secret-safe payment policy legal artifact review",
] as const;

export const paymentPolicyLegalLocalCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "static payment policy copy-area catalogue review",
  "static approval-packet decision seam review",
] as const;

export const paymentPolicyLegalExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/dashboard typecheck",
  "payment policy approved-copy E2E sweep",
  "legal/tax approval packet review",
  "GitHub Actions payment policy legal evidence job",
] as const;

export const paymentPolicyLegalApprovalPacketRequiredEvidence = [
  "redacted attorney approval packet",
  "redacted tax/accounting approval packet",
  "reviewed production payment policy copy diff",
  "acceptance audit configuration evidence",
  "policy versioning evidence",
  "approved-language E2E evidence",
  "rollback and correction plan",
] as const;

export const buildPaymentPolicyLegalApprovalPacketDecision = (
  input: PaymentPolicyLegalApprovalPacketInput,
): PaymentPolicyLegalApprovalPacketDecision => {
  const reviewedAreaSet = new Set(input.reviewedAreas);
  const missingReviewedAreas = paymentPolicyLegalCopyAreas.filter((area) => !reviewedAreaSet.has(area));
  const blockers = [
    ...(!input.attorneyApprovalRecorded
      ? ["Attorney approval must be recorded before payment policy copy is treated as approved."]
      : []),
    ...(!input.taxAccountingApprovalRecorded
      ? ["Tax/accounting approval must be recorded before receipt or tax disclosure copy is treated as approved."]
      : []),
    ...(!input.productionCopyReviewed
      ? ["Production payment policy copy must be reviewed before release."]
      : []),
    ...(!input.acceptanceAuditConfigured
      ? ["Acceptance audit must be configured for approved payment policy versions."]
      : []),
    ...(!input.policyVersioningConfigured
      ? ["Policy versioning must be configured for approved payment policy releases."]
      : []),
    ...(!input.e2eApprovedLanguageVerified
      ? ["Approved-language E2E evidence must pass before release."]
      : []),
    ...(!input.rollbackCopyPlanDocumented
      ? ["Rollback and correction plan must be documented before release."]
      : []),
    ...(input.policyVersion.trim().length === 0
      ? ["Approved payment policy version must be non-empty."]
      : []),
    ...(missingReviewedAreas.length > 0 ? ["All payment policy copy areas must be reviewed."] : []),
  ];

  return {
    status: blockers.length === 0 ? "approved" : "blocked",
    blockers,
    missingReviewedAreas,
    requiredEvidence: paymentPolicyLegalApprovalPacketRequiredEvidence,
    redactedSummary: {
      policyVersion: input.policyVersion.trim(),
      reviewedAreaCount: reviewedAreaSet.size,
      requiredAreaCount: paymentPolicyLegalCopyAreas.length,
    },
  };
};

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

const missingFrom = <T extends string>(actual: readonly T[] | undefined, required: readonly T[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitivePaymentPolicyLegalArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|attorney|legal|tax|accounting|approval|signature|policy|consent|receipt|sms|refund|deposit|medical|payment|email|phone|customer)/i;

const redactPaymentPolicyLegalArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactPaymentPolicyLegalArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePaymentPolicyLegalArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactPaymentPolicyLegalArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildPaymentPolicyLegalExecutionPlan = (): PaymentPolicyLegalExecutionPlan => ({
  policy: paymentPolicyLegalExecutionPolicy,
  commandExecutionAllowed: false,
  legalApprovalExecutionAllowed: false,
  taxAccountingExecutionAllowed: false,
  productionCopyExecutionAllowed: false,
  acceptanceVersioningExecutionAllowed: false,
  e2eExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: paymentPolicyLegalLocalCommands,
  externalCommands: paymentPolicyLegalExternalCommands,
  requiredExternalEvidence: paymentPolicyLegalRequiredExternalEvidence,
});

export const buildRedactedPaymentPolicyLegalArtifact = (artifact: unknown): Pick<PaymentPolicyLegalArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactPaymentPolicyLegalArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildPaymentPolicyLegalArtifactReview = (artifact: unknown): PaymentPolicyLegalArtifactReview => {
  const redacted = buildRedactedPaymentPolicyLegalArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: paymentPolicyLegalRequiredExternalEvidence,
  };
};

export const buildPaymentPolicyLegalEvidenceDecision = (
  input: PaymentPolicyLegalEvidenceInput = {},
): PaymentPolicyLegalEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, paymentPolicyLegalRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, paymentPolicyLegalArtifactPaths);
  const missingReviewedAreas = missingFrom(input.reviewedAreas, paymentPolicyLegalCopyAreas);
  const missingEvidence = paymentPolicyLegalEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned payment policy legal commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Payment policy legal artifacts must be retained with approval, copy, acceptance, E2E, rollback, CI, and secret-safe evidence."
      : "",
    missingReviewedAreas.length > 0 ? "Every payment policy copy area must be reviewed." : "",
    missingEvidence.length > 0
      ? "Legal/tax approval, reviewed copy, acceptance audit, policy versioning, approved-language E2E, rollback, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: paymentPolicyLegalRuntimeCommands,
    missingCommands,
    requiredArtifacts: paymentPolicyLegalArtifactPaths,
    missingArtifacts,
    requiredReviewedAreas: paymentPolicyLegalCopyAreas,
    missingReviewedAreas,
    requiredEvidence: paymentPolicyLegalEvidenceFlags,
    missingEvidence,
    blockers,
  };
};




