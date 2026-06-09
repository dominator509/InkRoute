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

export interface PaymentOperationProviderResult {
  providerCall: string | null;
  providerReference: string | null;
  redactedPayload: Record<string, unknown>;
}

export interface PaymentOperationMutationResult {
  status: "ready" | "blocked" | "duplicate";
  plan: PaymentOperationsWorkflowPlan;
  providerResult: PaymentOperationProviderResult | null;
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
    tenantAuthorizationTestsPassed: false,
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
  if (plan.status === "blocked" || !plan.idempotencyKey) {
    return {
      status: "blocked",
      plan,
      providerResult: null,
    };
  }

  const authorization = await repository.assertAuthorizedOperator({
    tenantId: input.tenantId,
    actorId: input.actorId ?? "",
    paymentId: input.paymentId,
    action: input.action,
  });

  if (!authorization.allowedActions.includes(input.action)) {
    return {
      status: "blocked",
      plan: {
        ...plan,
        status: "blocked",
        blockers: [
          ...plan.blockers,
          "Authorized operator is not allowed to execute this payment operation.",
        ],
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

  const providerResult = executeProviderCall ? await executeProviderCall(plan) : null;

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
