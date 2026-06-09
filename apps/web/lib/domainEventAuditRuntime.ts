import { buildDomainEventAuditTransactionEvidencePlan } from "@inkroute/booking";

export type DomainEventAuditRuntimeStatus =
  | "wired"
  | "transaction-gated"
  | "persistence-gated"
  | "idempotency-gated"
  | "denial-gated"
  | "ci-gated";

export interface DomainEventAuditRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DomainEventAuditRuntimeStatus;
}

export const domainEventAuditRuntimeCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "booking/payment lifecycle Prisma transaction integration tests",
  "booking/payment idempotency replay integration tests",
  "provider failure rollback integration tests",
  "cross-tenant lifecycle mutation denial tests",
  "GitHub Actions domain event/audit transaction evidence job",
] as const;

export const domainEventAuditArtifactPaths = [
  "coverage/domain-event-audit-runtime.json",
  "coverage/domain-event-booking-typecheck.txt",
  "coverage/domain-event-booking-test.txt",
  "coverage/domain-event-payments-typecheck.txt",
  "coverage/domain-event-payments-test.txt",
  "coverage/domain-event-prisma-transactions-redacted.json",
  "coverage/domain-event-tenant-repositories.json",
  "coverage/domain-event-booking-atomicity.json",
  "coverage/domain-event-payment-atomicity.json",
  "coverage/domain-event-booking-state-events.json",
  "coverage/domain-event-audit-logs-redacted.json",
  "coverage/domain-event-payment-audit-logs-redacted.json",
  "coverage/domain-event-idempotency-persistence.json",
  "coverage/domain-event-idempotency-replay.json",
  "coverage/domain-event-provider-rollback.json",
  "coverage/domain-event-invalid-transition-denial.json",
  "coverage/domain-event-cross-tenant-denial.json",
  "coverage/domain-event-database-evidence-redacted.json",
  "coverage/domain-event-ci-evidence.json",
  "coverage/domain-event-secret-safe-artifacts.json",
  "test-results/domain-event-audit-runtime",
] as const;

export const domainEventAuditRuntimeMatrix = [
  {
    id: "booking-payment-package-gates",
    command: "pnpm --filter @inkroute/booking typecheck && pnpm --filter @inkroute/booking test && pnpm --filter @inkroute/payments typecheck && pnpm --filter @inkroute/payments test",
    artifact: "coverage/domain-event-booking-test.txt",
    status: "wired",
  },
  {
    id: "prisma-transaction-services",
    command: "booking/payment lifecycle Prisma transaction integration tests",
    artifact: "coverage/domain-event-prisma-transactions-redacted.json",
    status: "transaction-gated",
  },
  {
    id: "tenant-scoped-repositories",
    command: "tenant-scoped booking/payment repository integration tests",
    artifact: "coverage/domain-event-tenant-repositories.json",
    status: "transaction-gated",
  },
  {
    id: "state-event-audit-persistence",
    command: "booking/payment state, event, AuditLog, and PaymentAuditLog persistence tests",
    artifact: "coverage/domain-event-booking-state-events.json",
    status: "persistence-gated",
  },
  {
    id: "idempotency-and-replay",
    command: "booking/payment idempotency replay integration tests",
    artifact: "coverage/domain-event-idempotency-replay.json",
    status: "idempotency-gated",
  },
  {
    id: "provider-rollback-invalid-cross-tenant-denial",
    command: "provider failure rollback integration tests && cross-tenant lifecycle mutation denial tests",
    artifact: "coverage/domain-event-provider-rollback.json",
    status: "denial-gated",
  },
  {
    id: "database-ci-secret-safe-artifacts",
    command: "GitHub Actions domain event/audit transaction evidence job",
    artifact: "coverage/domain-event-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly DomainEventAuditRuntimeMatrixEntry[];

export const domainEventAuditRuntimeReadiness = buildDomainEventAuditTransactionEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  bookingTestsPassed: false,
  bookingTypecheckPassed: false,
  paymentTestsPassed: false,
  paymentTypecheckPassed: false,
  prismaTransactionServicesImplemented: false,
  tenantScopedRepositoriesImplemented: false,
  bookingStateMutationAtomicityPassed: false,
  paymentStateMutationAtomicityPassed: false,
  bookingStateEventRowsPersisted: false,
  auditLogRowsPersisted: false,
  paymentAuditLogRowsPersisted: false,
  idempotencyPersistenceEnforced: false,
  replayedMutationReturnsOriginalResult: false,
  providerRollbackIntegrationPassed: false,
  invalidTransitionDenialPassed: false,
  crossTenantMutationDenialPassed: false,
  databaseIntegrationEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
