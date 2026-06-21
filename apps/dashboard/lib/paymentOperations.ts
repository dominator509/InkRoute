import {
  buildPaymentOperationsRuntimeReadinessPlan,
  buildPaymentOperationsWorkflowPlan,
  type CurrencyCode,
  type PaymentOperationsRuntimeReadinessPlan,
  type PaymentOperationsWorkflowAction,
  type PaymentOperationsWorkflowPlan,
  type PaymentOperationsWorkflowPlanInput,
  type PaymentOperationsWrite,
} from "@inkroute/payments";

export type PaymentOperationProvider = "stripe" | "manual";

export type PaymentOperationMutationInput = PaymentOperationsWorkflowPlanInput & {
  requestId: string;
};

export interface PaymentOperationAuthorization {
  tenantId: string;
  actorId: string;
  paymentId: string;
  allowedActions: readonly PaymentOperationsWorkflowAction[];
}

export interface PaymentOperationTenantAuthorizationDecision {
  status: "allowed" | "denied";
  canOperate: boolean;
  blockers: readonly string[];
  redactedSubject: string;
}

export function authorizePaymentOperationTenant(input: {
  readonly requestedTenantId: string;
  readonly paymentTenantId: string;
  readonly actorId?: string | null;
  readonly requestedAction: PaymentOperationsWorkflowAction;
  readonly allowedActions: readonly PaymentOperationsWorkflowAction[];
}): PaymentOperationTenantAuthorizationDecision {
  const blockers: string[] = [];
  if (!input.actorId?.trim()) blockers.push("Authenticated dashboard actor is required for payment operations.");
  if (input.requestedTenantId !== input.paymentTenantId) blockers.push("Payment operation tenant scope does not match payment tenant.");
  if (!input.allowedActions.includes(input.requestedAction)) blockers.push("Payment operation action is not authorized for this actor.");

  return {
    status: blockers.length === 0 ? "allowed" : "denied",
    canOperate: blockers.length === 0,
    blockers,
    redactedSubject: `${input.requestedTenantId}:${input.paymentTenantId}:${input.actorId ? "actor-present" : "actor-missing"}`,
  };
}

export interface PaymentOperationProviderResult {
  providerCall: string | null;
  providerReference: string | null;
  redactedPayload: Record<string, unknown>;
}

const paymentOperationProviderPrivateKeys = [
  "client_secret",
  "secret",
  "apiKey",
  "api_key",
  "email",
  "clientEmail",
  "customerEmail",
  "paymentMethod",
  "card",
] as const;

export function buildRedactedPaymentOperationProviderResult(input: {
  readonly providerCall: string | null;
  readonly providerReference: string | null;
  readonly payload: Record<string, unknown>;
}): PaymentOperationProviderResult {
  const redactedPayload = Object.fromEntries(
    Object.entries(input.payload).map(([key, value]) => [
      key,
      paymentOperationProviderPrivateKeys.includes(key as (typeof paymentOperationProviderPrivateKeys)[number])
        ? "[redacted]"
        : value,
    ]),
  );

  return {
    providerCall: input.providerCall,
    providerReference: input.providerReference,
    redactedPayload,
  };
}

export function sanitizePaymentOperationProviderResult(
  result: PaymentOperationProviderResult | null,
): PaymentOperationProviderResult | null {
  if (!result) return null;
  return buildRedactedPaymentOperationProviderResult({
    providerCall: result.providerCall,
    providerReference: result.providerReference,
    payload: result.redactedPayload,
  });
}

export interface RedactedReceiptDeliveryPayload {
  provider: "manual" | "receipt_provider";
  receiptNumber: string;
  paymentId: string;
  tenantId: string;
  deliveryTarget: "configured_provider";
  redactedRecipient: string;
  redactedSummary: string;
}

export function buildRedactedReceiptDeliveryPayload(input: {
  readonly tenantId: string;
  readonly paymentId: string;
  readonly receiptNumber: string;
  readonly recipientEmail?: string | null;
  readonly clientName?: string | null;
}): RedactedReceiptDeliveryPayload {
  return {
    provider: "receipt_provider",
    receiptNumber: input.receiptNumber,
    paymentId: input.paymentId,
    tenantId: input.tenantId,
    deliveryTarget: "configured_provider",
    redactedRecipient: input.recipientEmail?.trim() ? "email-present" : "email-missing",
    redactedSummary:
      "Receipt delivery payload excludes raw email, client name, payment method, provider secrets, and medical notes.",
  };
}

export interface RedactedAccountingExportPayload {
  tenantId: string;
  exportId: string;
  reviewerId: string;
  rows: readonly Record<string, unknown>[];
  redactedSummary: string;
}

const accountingExportPrivateKeys = [
  "clientName",
  "clientEmail",
  "email",
  "medicalNotes",
  "privateNotes",
  "providerSecret",
  "client_secret",
  "paymentMethod",
] as const;

export function buildRedactedAccountingExportPayload(input: {
  readonly tenantId: string;
  readonly exportId: string;
  readonly reviewerId: string;
  readonly rows: readonly Record<string, unknown>[];
}): RedactedAccountingExportPayload {
  return {
    tenantId: input.tenantId,
    exportId: input.exportId,
    reviewerId: input.reviewerId,
    rows: input.rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          accountingExportPrivateKeys.includes(key as (typeof accountingExportPrivateKeys)[number])
            ? "[redacted]"
            : value,
        ]),
      ),
    ),
    redactedSummary:
      "Accounting export payload excludes client PII, medical/private notes, payment methods, and provider secrets before delivery.",
  };
}

export interface PaymentOperationMutationResult {
  status: "ready" | "blocked" | "duplicate";
  plan: PaymentOperationsWorkflowPlan;
  providerResult: PaymentOperationProviderResult | null;
}

export interface PaymentOperationPreflightInput {
  action: PaymentOperationsWorkflowAction;
  stripeRefundsEnabled: boolean;
  receiptDeliveryConfigured: boolean;
  taxReviewApproved: boolean;
  exportRedactionVerified: boolean;
  disputeEvidenceFileCount: number;
  paymentAuditLogReady: boolean;
}

export interface PaymentOperationPreflightDecision {
  status: "ready" | "blocked";
  blockers: readonly string[];
  requiresProviderCall: boolean;
  requiresReceiptDelivery: boolean;
  requiresExportReview: boolean;
  redactedSummary: string;
}

export interface PaymentOperationsRepository {
  assertAuthorizedOperator(input: {
    tenantId: string;
    actorId: string;
    paymentId: string;
    action: PaymentOperationsWorkflowAction;
  }): Promise<PaymentOperationAuthorization>;
  claimIdempotencyKey(input: {
    tenantId: string;
    key: string;
    action: PaymentOperationsWorkflowAction;
    requestId: string;
  }): Promise<"claimed" | "duplicate">;
  runOperationTransaction(input: {
    tenantId: string;
    action: PaymentOperationsWorkflowAction;
    writes: readonly PaymentOperationsWrite[];
  }): Promise<void>;
  persistProviderOperationResult(input: {
    tenantId: string;
    paymentId: string;
    action: PaymentOperationsWorkflowAction;
    result: PaymentOperationProviderResult;
  }): Promise<void>;
}

export interface PaymentOperationsDashboardContract {
  supportedActions: readonly PaymentOperationsWorkflowAction[];
  samplePlans: readonly PaymentOperationsWorkflowPlan[];
  readiness: PaymentOperationsRuntimeReadinessPlan;
}

const supportedActions = [
  "execute_refund",
  "record_no_show_forfeiture",
  "prepare_dispute_evidence",
  "generate_receipt",
  "create_accounting_export",
] as const satisfies readonly PaymentOperationsWorkflowAction[];

const baseOperationInput = {
  tenantId: "tenant_demo",
  bookingRequestId: "booking_demo",
  paymentId: "payment_demo",
  amountCents: 12500,
  currency: "USD" as CurrencyCode,
  provider: "stripe" as PaymentOperationProvider,
  occurredAt: "2026-06-09T12:00:00.000Z",
  actorId: "operator_demo",
  idempotencyKey: "payment-operation-demo",
  providerPaymentIntentId: "pi_demo_redacted",
  providerChargeId: "ch_demo_redacted",
  refundAmountCents: 2500,
  noShowDecision: "forfeit_deposit" as const,
  evidenceFileIds: ["evidence_demo_redacted"],
  clientEmail: "client@example.com",
  receiptNumber: "R-DEMO-0001",
  stripeRefundsEnabled: true,
  receiptDeliveryConfigured: true,
  exportReviewerId: "reviewer_demo",
  taxReviewApproved: true,
} satisfies PaymentOperationsWorkflowPlanInput;

export function buildPaymentOperationPreflightDecision(input: PaymentOperationPreflightInput): PaymentOperationPreflightDecision {
  const blockers: string[] = [];
  const requiresProviderCall = input.action === "execute_refund" || input.action === "prepare_dispute_evidence";
  const requiresReceiptDelivery = input.action === "generate_receipt";
  const requiresExportReview = input.action === "create_accounting_export";

  if (!input.paymentAuditLogReady) {
    blockers.push("PaymentAuditLog persistence must be ready before executing payment operations.");
  }
  if (input.action === "execute_refund" && !input.stripeRefundsEnabled) {
    blockers.push("Stripe refund execution must be enabled before refund operations.");
  }
  if (input.action === "prepare_dispute_evidence" && input.disputeEvidenceFileCount <= 0) {
    blockers.push("Dispute evidence files are required before provider dispute sync.");
  }
  if (requiresReceiptDelivery && !input.receiptDeliveryConfigured) {
    blockers.push("Receipt delivery provider must be configured before receipt operations.");
  }
  if (requiresExportReview && !input.exportRedactionVerified) {
    blockers.push("Accounting export redaction must be verified before export delivery.");
  }
  if (requiresExportReview && !input.taxReviewApproved) {
    blockers.push("Tax/accounting review must approve export fields before export delivery.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    blockers,
    requiresProviderCall,
    requiresReceiptDelivery,
    requiresExportReview,
    redactedSummary:
      "Payment operation preflight uses approval and redaction flags only; provider payloads, client PII, medical data, payment details, and tax artifacts stay redacted.",
  };
}

function buildSamplePaymentOperationPlans(): PaymentOperationsWorkflowPlan[] {
  return supportedActions.map((action) =>
    buildPaymentOperationsWorkflowPlan({
      ...baseOperationInput,
      action,
      idempotencyKey: `payment-operation-demo-${action}`,
    }),
  );
}

export function buildDashboardPaymentOperationsReadiness(): PaymentOperationsRuntimeReadinessPlan {
  return buildPaymentOperationsRuntimeReadinessPlan({
    packageScripts: {
      test: "vitest run",
      typecheck: "tsc --noEmit",
    },
    paymentsTestsPassed: false,
    paymentsTypecheckPassed: false,
    dashboardPaymentActionsImplemented: true,
    refundActionAuthorized: true,
    stripeRefundsTestModeVerified: false,
    refundPersistenceConfigured: true,
    noShowForfeitureActionImplemented: true,
    noShowAuditPersistenceConfigured: true,
    disputeEvidenceWorkflowImplemented: true,
    disputeProviderSyncVerified: false,
    receiptGenerationImplemented: true,
    receiptDeliveryProviderConfigured: false,
    receiptDeliveryTested: false,
    accountingExportImplemented: true,
    exportRedactionVerified: true,
    taxAccountingReviewApproved: false,
    idempotencyConfiguredForOperations: true,
    paymentAuditLogPersistedForOperations: true,
    tenantAuthorizationTestsPassed: true,
    dashboardE2eEvidenceAttached: false,
  });
}

export function buildPaymentOperationsDashboardContract(): PaymentOperationsDashboardContract {
  return {
    supportedActions,
    samplePlans: buildSamplePaymentOperationPlans(),
    readiness: buildDashboardPaymentOperationsReadiness(),
  };
}

export async function executePaymentOperationMutation(
  input: PaymentOperationMutationInput,
  repository: PaymentOperationsRepository,
  executeProviderCall?: (plan: PaymentOperationsWorkflowPlan) => Promise<PaymentOperationProviderResult | null>,
): Promise<PaymentOperationMutationResult> {
  const plan = buildPaymentOperationsWorkflowPlan(input);
  const preflight = buildPaymentOperationPreflightDecision({
    action: input.action,
    stripeRefundsEnabled: Boolean(input.stripeRefundsEnabled),
    receiptDeliveryConfigured: Boolean(input.receiptDeliveryConfigured),
    taxReviewApproved: Boolean(input.taxReviewApproved),
    exportRedactionVerified: Boolean(input.exportReviewerId),
    disputeEvidenceFileCount: input.evidenceFileIds?.length ?? 0,
    paymentAuditLogReady: true,
  });

  if (plan.status === "blocked" || !plan.idempotencyKey) {
    return {
      status: "blocked",
      plan,
      providerResult: null,
    };
  }

  if (preflight.status === "blocked") {
    return {
      status: "blocked",
      plan: {
        ...plan,
        status: "blocked",
        blockers: [...plan.blockers, ...preflight.blockers],
      },
      providerResult: null,
    };
  }

  const authorization = await repository.assertAuthorizedOperator({
    tenantId: input.tenantId,
    actorId: input.actorId ?? "",
    paymentId: input.paymentId,
    action: input.action,
  });
  const tenantAuthorization = authorizePaymentOperationTenant({
    requestedTenantId: input.tenantId,
    paymentTenantId: authorization.tenantId,
    actorId: authorization.actorId,
    requestedAction: input.action,
    allowedActions: authorization.allowedActions,
  });

  if (!tenantAuthorization.canOperate) {
    return {
      status: "blocked",
      plan: {
        ...plan,
        status: "blocked",
        blockers: [...plan.blockers, ...tenantAuthorization.blockers],
      },
      providerResult: null,
    };
  }

  const idempotencyStatus = await repository.claimIdempotencyKey({
    tenantId: input.tenantId,
    key: plan.idempotencyKey,
    action: input.action,
    requestId: input.requestId,
  });

  if (idempotencyStatus === "duplicate") {
    return {
      status: "duplicate",
      plan,
      providerResult: null,
    };
  }

  const providerResult = sanitizePaymentOperationProviderResult(executeProviderCall ? await executeProviderCall(plan) : null);

  await repository.runOperationTransaction({
    tenantId: input.tenantId,
    action: input.action,
    writes: plan.writes,
  });

  if (providerResult) {
    await repository.persistProviderOperationResult({
      tenantId: input.tenantId,
      paymentId: input.paymentId,
      action: input.action,
      result: providerResult,
    });
  }

  return {
    status: "ready",
    plan,
    providerResult,
  };
}

export const dashboardPaymentOperationsContract = buildPaymentOperationsDashboardContract();
