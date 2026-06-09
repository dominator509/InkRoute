import {
  buildPaymentLifecyclePersistencePlan,
  buildPaymentPersistenceRuntimeReadinessPlan,
  type CurrencyCode,
  type PaymentLifecycleAction,
  type PaymentLifecyclePersistencePlan,
  type PaymentPersistenceRuntimeReadinessPlan,
} from "@inkroute/payments";

export interface PaymentLifecycleMutationInput {
  tenantId: string;
  bookingRequestId: string;
  action: PaymentLifecycleAction;
  amountCents: number;
  currency: CurrencyCode;
  provider: "stripe" | "manual";
  occurredAt: string;
  paymentId?: string;
  depositId?: string;
  providerSessionId?: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  actorId?: string;
  idempotencyKey: string;
}

export interface TenantPaymentRepository {
  assertTenantScope(input: PaymentLifecycleMutationInput): Promise<void>;
  claimIdempotencyKey(key: string, tenantId: string, action: PaymentLifecycleAction): Promise<"claimed" | "replayed">;
  runLifecycleTransaction(plan: PaymentLifecyclePersistencePlan): Promise<void>;
  findDashboardPayments(tenantId: string, limit: number): Promise<readonly unknown[]>;
}

export interface PaymentPersistenceContract {
  lifecyclePlans: readonly PaymentLifecyclePersistencePlan[];
  readiness: PaymentPersistenceRuntimeReadinessPlan;
  repositoryControls: readonly string[];
  dashboardReadBoundary: string;
  boundary: string;
}

export function buildPaymentPersistenceContract(): PaymentPersistenceContract {
  const common = {
    tenantId: "tenant_inkroute_demo",
    bookingRequestId: "booking_req_payment_demo",
    amountCents: 25000,
    currency: "usd" as CurrencyCode,
    provider: "stripe" as const,
    occurredAt: "2026-06-09T00:00:00.000Z",
    paymentId: "payment_demo",
    depositId: "deposit_demo",
    providerSessionId: "cs_test_demo",
    providerPaymentIntentId: "pi_test_demo",
    providerChargeId: "ch_test_demo",
  };

  const lifecyclePlans = [
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "create_deposit",
      idempotencyKey: "payment:create_deposit:demo",
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "record_checkout_session",
      idempotencyKey: "payment:record_checkout_session:demo",
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_paid",
      idempotencyKey: "payment:mark_paid:demo",
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_failed",
      idempotencyKey: "payment:mark_failed:demo",
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_refunded",
      idempotencyKey: "payment:mark_refunded:demo",
    }),
    buildPaymentLifecyclePersistencePlan({
      ...common,
      action: "mark_disputed",
      idempotencyKey: "payment:mark_disputed:demo",
    }),
  ];

  return {
    lifecyclePlans,
    readiness: buildPaymentPersistenceRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      paymentsTestsPassed: false,
      paymentsTypecheckPassed: false,
      dbSchemaIncludesPaymentModels: true,
      repositoriesImplemented: true,
      tenantScopedQueriesEnforced: true,
      transactionalMutationsImplemented: false,
      idempotencyStoreImplemented: false,
      depositCreationPersisted: false,
      providerSessionPersisted: false,
      paidTransitionPersisted: false,
      failedTransitionPersisted: false,
      refundTransitionPersisted: false,
      disputeTransitionPersisted: false,
      paymentAuditLogPersistedForEveryMutation: false,
      bookingStateEventPersistedForLifecycleChanges: false,
      crossTenantIsolationTestsPassed: false,
      replayIdempotencyTestsPassed: false,
      seededPostgresIntegrationTestsPassed: false,
      dashboardPaymentReadsUseRepository: true,
    }),
    repositoryControls: [
      "Assert tenant scope before every Deposit, Payment, Refund, PaymentAuditLog, BookingStateEvent, or IdempotencyKey read/write.",
      "Claim idempotency keys before lifecycle mutations and return replay state without duplicate writes.",
      "Execute lifecycle writes in one transaction using the plan writes from @inkroute/payments.",
      "Persist PaymentAuditLog for every mutation, including failed, refunded, disputed, and replayed events.",
      "Expose dashboard payment reads only through tenant-scoped repository methods with redacted provider fields.",
    ],
    dashboardReadBoundary:
      "Dashboard payment list/detail routes already enforce RBAC, tenant scope, no-store, projection redaction, AuditLog rows, and PaymentAuditLog read rows.",
    boundary:
      "Payment lifecycle now has a tenant-scoped repository/service contract and mutation write plans; real Prisma transaction execution and seeded Postgres proof remain gated.",
  };
}

export async function executePaymentLifecycleMutation(input: {
  repository: TenantPaymentRepository;
  mutation: PaymentLifecycleMutationInput;
}): Promise<PaymentLifecyclePersistencePlan> {
  const plan = buildPaymentLifecyclePersistencePlan(input.mutation);
  if (plan.status !== "ready" || !plan.idempotencyKey) {
    throw new Error(plan.blockers.join(" "));
  }

  await input.repository.assertTenantScope(input.mutation);
  const idempotency = await input.repository.claimIdempotencyKey(plan.idempotencyKey, input.mutation.tenantId, input.mutation.action);
  if (idempotency === "replayed") return plan;
  await input.repository.runLifecycleTransaction(plan);
  return plan;
}

export const dashboardPaymentPersistenceContract = buildPaymentPersistenceContract();
