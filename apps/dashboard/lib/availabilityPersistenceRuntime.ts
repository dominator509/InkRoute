import { buildAvailabilityRuntimeReadinessPlan } from "@inkroute/calendar";

export type AvailabilityPersistenceRuntimeStatus =
  | "wired"
  | "db-gated"
  | "transaction-gated"
  | "conflict-gated"
  | "race-gated"
  | "audit-gated"
  | "isolation-gated"
  | "ci-gated";

export interface AvailabilityPersistenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AvailabilityPersistenceRuntimeStatus;
}

export const availabilityPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm --filter @inkroute/db prisma validate",
  "availability persistence seeded Postgres integration tests",
  "concurrent slot hold race-condition tests",
  "dashboard/API availability repository tests",
] as const;

export const availabilityPersistenceArtifactPaths = [
  "coverage/availability-persistence-runtime.json",
  "coverage/availability-persistence-calendar-typecheck.txt",
  "coverage/availability-persistence-calendar-test.txt",
  "coverage/availability-persistence-prisma-validate.txt",
  "coverage/availability-persistence-schema-models.json",
  "coverage/availability-persistence-repository-contract.json",
  "coverage/availability-persistence-tenant-scope.json",
  "coverage/availability-persistence-window-transaction.json",
  "coverage/availability-persistence-slot-hold-transaction.json",
  "coverage/availability-persistence-appointment-confirmation.json",
  "coverage/availability-persistence-hold-release.json",
  "coverage/availability-persistence-audit-log.json",
  "coverage/availability-persistence-idempotency.json",
  "coverage/availability-persistence-conflict-rows.json",
  "coverage/availability-persistence-concurrent-hold.json",
  "coverage/availability-persistence-overlap-rejection.json",
  "coverage/availability-persistence-cross-tenant-denial.json",
  "coverage/availability-persistence-seeded-postgres.json",
  "coverage/availability-persistence-dashboard-api-repository.json",
  "coverage/availability-persistence-secret-safe-artifacts.json",
  "test-results/availability-persistence-runtime",
] as const;

export const availabilityPersistenceRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/availability-persistence-calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/availability-persistence-calendar-test.txt",
    status: "wired",
  },
  {
    id: "prisma-validate",
    command: "pnpm --filter @inkroute/db prisma validate",
    artifact: "coverage/availability-persistence-prisma-validate.txt",
    status: "db-gated",
  },
  {
    id: "schema-models",
    command: "validate AvailabilityWindow, AvailabilityHold, Appointment, CalendarAuditLog, and IdempotencyKey models",
    artifact: "coverage/availability-persistence-schema-models.json",
    status: "wired",
  },
  {
    id: "repository-contract",
    command: "implement tenant-scoped AvailabilityRepository methods",
    artifact: "coverage/availability-persistence-repository-contract.json",
    status: "wired",
  },
  {
    id: "tenant-scope",
    command: "enforce tenant/artist scope on availability reads and writes",
    artifact: "coverage/availability-persistence-tenant-scope.json",
    status: "wired",
  },
  {
    id: "window-transaction",
    command: "run availability window creation in a tenant-scoped transaction",
    artifact: "coverage/availability-persistence-window-transaction.json",
    status: "transaction-gated",
  },
  {
    id: "slot-hold-transaction",
    command: "run slot hold creation in a tenant-scoped transaction",
    artifact: "coverage/availability-persistence-slot-hold-transaction.json",
    status: "transaction-gated",
  },
  {
    id: "appointment-confirmation",
    command: "persist Appointment, hold, booking, CalendarAuditLog, and IdempotencyKey writes",
    artifact: "coverage/availability-persistence-appointment-confirmation.json",
    status: "transaction-gated",
  },
  {
    id: "hold-release",
    command: "persist hold release state, CalendarAuditLog, and IdempotencyKey writes",
    artifact: "coverage/availability-persistence-hold-release.json",
    status: "transaction-gated",
  },
  {
    id: "calendar-audit-log",
    command: "persist CalendarAuditLog for every availability mutation",
    artifact: "coverage/availability-persistence-audit-log.json",
    status: "audit-gated",
  },
  {
    id: "idempotency-store",
    command: "claim IdempotencyKey records before availability mutations",
    artifact: "coverage/availability-persistence-idempotency.json",
    status: "audit-gated",
  },
  {
    id: "persisted-conflict-rows",
    command: "query persisted appointments, holds, windows, and travel blocks for conflicts",
    artifact: "coverage/availability-persistence-conflict-rows.json",
    status: "conflict-gated",
  },
  {
    id: "concurrent-hold-protection",
    command: "concurrent slot hold race-condition tests",
    artifact: "coverage/availability-persistence-concurrent-hold.json",
    status: "race-gated",
  },
  {
    id: "overlap-rejection",
    command: "test overlapping slot persistence rejection against DB rows",
    artifact: "coverage/availability-persistence-overlap-rejection.json",
    status: "conflict-gated",
  },
  {
    id: "cross-tenant-denial",
    command: "cross-tenant availability reads and mutations denied by tests",
    artifact: "coverage/availability-persistence-cross-tenant-denial.json",
    status: "isolation-gated",
  },
  {
    id: "seeded-postgres",
    command: "availability persistence seeded Postgres integration tests",
    artifact: "coverage/availability-persistence-seeded-postgres.json",
    status: "db-gated",
  },
  {
    id: "dashboard-api-repository",
    command: "dashboard/API availability repository tests",
    artifact: "coverage/availability-persistence-dashboard-api-repository.json",
    status: "ci-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions availability persistence evidence job",
    artifact: "coverage/availability-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly AvailabilityPersistenceRuntimeMatrixEntry[];

export const availabilityPersistenceRuntimeReadiness = buildAvailabilityRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  dbSchemaIncludesAvailabilityModels: true,
  repositoriesImplemented: true,
  tenantScopedQueriesEnforced: true,
  transactionalWindowCreationImplemented: true,
  transactionalSlotHoldImplemented: true,
  appointmentConfirmationImplemented: true,
  holdReleaseImplemented: true,
  auditLogPersistenceConfigured: true,
  idempotencyStoreConfigured: true,
  conflictDetectionAgainstPersistedRows: true,
  concurrentHoldProtectionConfigured: true,
  overlappingSlotDbRejectionTested: false,
  crossTenantIsolationTestsPassed: false,
  seededPostgresIntegrationTestsPassed: false,
  dashboardAndApiUseRepository: true,
});
