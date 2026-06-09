import { buildPaymentPersistenceRuntimeReadinessPlan } from "@inkroute/payments";

export type PaymentPersistenceRuntimeStatus =
  | "wired"
  | "db-gated"
  | "transaction-gated"
  | "idempotency-gated"
  | "audit-gated"
  | "isolation-gated"
  | "integration-gated"
  | "ci-gated";

export interface PaymentPersistenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PaymentPersistenceRuntimeStatus;
}

export const paymentPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/db prisma validate",
  "payment persistence seeded Postgres integration tests",
  "dashboard payment repository route/action tests",
] as const;

export const paymentPersistenceArtifactPaths = [
  "coverage/payment-persistence-runtime.json",
  "coverage/payment-persistence-payments-typecheck.txt",
  "coverage/payment-persistence-payments-test.txt",
  "coverage/payment-persistence-prisma-validate.txt",
  "coverage/payment-persistence-repository-contract.json",
  "coverage/payment-persistence-tenant-scope.json",
  "coverage/payment-persistence-transactions.json",
  "coverage/payment-persistence-idempotency.json",
  "coverage/payment-persistence-deposit-create.json",
  "coverage/payment-persistence-provider-session.json",
  "coverage/payment-persistence-paid-failed-transitions.json",
  "coverage/payment-persistence-refund-dispute-transitions.json",
  "coverage/payment-persistence-audit-log.json",
  "coverage/payment-persistence-booking-state-event.json",
  "coverage/payment-persistence-cross-tenant-denial.json",
  "coverage/payment-persistence-replay-idempotency.json",
  "coverage/payment-persistence-seeded-postgres.json",
  "coverage/payment-persistence-dashboard-repository-reads.json",
  "coverage/payment-persistence-secret-safe-artifacts.json",
  "test-results/payment-persistence-runtime",
] as const;

export const paymentPersistenceRuntimeMatrix = [
  {
    id: "payments-typecheck",
    command: "pnpm --filter @inkroute/payments typecheck",
    artifact: "coverage/payment-persistence-payments-typecheck.txt",
    status: "wired",
  },
  {
    id: "payments-tests",
    command: "pnpm --filter @inkroute/payments test",
    artifact: "coverage/payment-persistence-payments-test.txt",
    status: "wired",
  },
  {
    id: "prisma-validate",
    command: "pnpm --filter @inkroute/db prisma validate",
    artifact: "coverage/payment-persistence-prisma-validate.txt",
    status: "db-gated",
  },
  {
    id: "repository-contract",
    command: "implement TenantPaymentRepository with Prisma-backed methods",
    artifact: "coverage/payment-persistence-repository-contract.json",
    status: "wired",
  },
  {
    id: "tenant-scope",
    command: "assert tenant scope before every payment read/write",
    artifact: "coverage/payment-persistence-tenant-scope.json",
    status: "wired",
  },
  {
    id: "lifecycle-transactions",
    command: "run Deposit, Payment, Refund, PaymentAuditLog, BookingStateEvent, and IdempotencyKey writes in database transactions",
    artifact: "coverage/payment-persistence-transactions.json",
    status: "transaction-gated",
  },
  {
    id: "idempotency-store",
    command: "persist idempotency keys for provider sessions, webhooks, refunds, and retries",
    artifact: "coverage/payment-persistence-idempotency.json",
    status: "idempotency-gated",
  },
  {
    id: "deposit-create",
    command: "persist Deposit and initial PaymentAuditLog records",
    artifact: "coverage/payment-persistence-deposit-create.json",
    status: "db-gated",
  },
  {
    id: "provider-session",
    command: "persist provider Checkout session ids and redirect URLs after Stripe creation",
    artifact: "coverage/payment-persistence-provider-session.json",
    status: "db-gated",
  },
  {
    id: "paid-failed-transitions",
    command: "persist paid and failed payment transitions",
    artifact: "coverage/payment-persistence-paid-failed-transitions.json",
    status: "db-gated",
  },
  {
    id: "refund-dispute-transitions",
    command: "persist refund and dispute lifecycle transitions",
    artifact: "coverage/payment-persistence-refund-dispute-transitions.json",
    status: "db-gated",
  },
  {
    id: "payment-audit-log",
    command: "persist PaymentAuditLog for every lifecycle mutation",
    artifact: "coverage/payment-persistence-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "booking-state-event",
    command: "persist BookingStateEvent rows for booking-affecting payment lifecycle changes",
    artifact: "coverage/payment-persistence-booking-state-event.json",
    status: "audit-gated",
  },
  {
    id: "cross-tenant-denial",
    command: "seeded Postgres cross-tenant payment repository denial tests",
    artifact: "coverage/payment-persistence-cross-tenant-denial.json",
    status: "isolation-gated",
  },
  {
    id: "replay-idempotency",
    command: "seeded Postgres idempotent replay tests",
    artifact: "coverage/payment-persistence-replay-idempotency.json",
    status: "idempotency-gated",
  },
  {
    id: "seeded-postgres",
    command: "payment persistence seeded Postgres integration tests",
    artifact: "coverage/payment-persistence-seeded-postgres.json",
    status: "integration-gated",
  },
  {
    id: "dashboard-repository-reads",
    command: "dashboard payment repository route/action tests",
    artifact: "coverage/payment-persistence-dashboard-repository-reads.json",
    status: "ci-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions payment persistence evidence job",
    artifact: "coverage/payment-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly PaymentPersistenceRuntimeMatrixEntry[];

export const paymentPersistenceRuntimeReadiness = buildPaymentPersistenceRuntimeReadinessPlan({
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
});
