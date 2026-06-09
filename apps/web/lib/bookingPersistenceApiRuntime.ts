export type BookingPersistenceApiRuntimeStatus =
  | "implemented"
  | "runtime-gated"
  | "database-gated"
  | "provider-gated"
  | "ci-gated";

export interface BookingPersistenceApiRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingPersistenceApiRuntimeStatus;
}

export const bookingPersistenceApiRuntimeCommands = [
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm db:generate",
  "Next public booking API route runtime smoke",
  "dev-DB booking transaction smoke",
  "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
  "GitHub Actions booking persistence API evidence job",
] as const;

export const bookingPersistenceApiArtifactPaths = [
  "coverage/booking-persistence-api-runtime.json",
  "coverage/booking-persistence-contract-test.txt",
  "coverage/booking-persistence-web-typecheck.txt",
  "coverage/booking-persistence-web-build.txt",
  "coverage/booking-persistence-prisma-generate.txt",
  "coverage/booking-persistence-next-route-smoke.json",
  "coverage/booking-persistence-db-transaction.json",
  "coverage/booking-persistence-provider-workers.json",
  "coverage/booking-persistence-secret-safe-artifacts.json",
  "test-results/booking-persistence-api-runtime",
] as const;

export const bookingPersistenceApiRuntimeMatrix = [
  {
    id: "route-contract-tests",
    command: "pnpm --filter @inkroute/web test -- booking-requests-contract",
    artifact: "coverage/booking-persistence-contract-test.txt",
    status: "implemented",
  },
  {
    id: "web-typecheck-build",
    command: "pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/booking-persistence-web-build.txt",
    status: "runtime-gated",
  },
  {
    id: "prisma-client-and-db-transaction",
    command: "pnpm db:generate && dev-DB booking transaction smoke",
    artifact: "coverage/booking-persistence-db-transaction.json",
    status: "database-gated",
  },
  {
    id: "next-route-runtime-smoke",
    command: "Next public booking API route runtime smoke",
    artifact: "coverage/booking-persistence-next-route-smoke.json",
    status: "runtime-gated",
  },
  {
    id: "provider-worker-execution-boundaries",
    command: "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
    artifact: "coverage/booking-persistence-provider-workers.json",
    status: "provider-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions booking persistence API evidence job",
    artifact: "coverage/booking-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingPersistenceApiRuntimeMatrixEntry[];

export const bookingPersistenceApiImplementedControls = [
  "Resolve tenant scope before persistence and fall back only when the database is unavailable.",
  "Require DB-scope anti-bot proof before database writes.",
  "Gate medical-note persistence on encryption policy and key readiness.",
  "Write BookingRequest, BookingStateEvent, and AuditLog records through a transaction on the database path.",
  "Keep provider workers for reference upload, deposit, notification, and calendar handoffs separate from the route persistence contract.",
] as const;

export const bookingPersistenceApiRemainingRuntimeEvidence = [
  "fresh booking route contract test output",
  "generated Prisma Client and dev-DB transaction smoke output",
  "web typecheck/build output",
  "Next route runtime smoke transcript",
  "provider worker execution evidence tracked by GAP-033 and GAP-034",
  "CI artifact bundle with redaction/secret-safety proof",
] as const;
