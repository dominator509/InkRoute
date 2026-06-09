import { dashboardNotificationPersistenceContract } from "./notificationPersistence";

export type NotificationPersistenceRuntimeStatus =
  | "wired"
  | "schema-gated"
  | "repository-gated"
  | "idempotency-gated"
  | "read-state-gated"
  | "worker-gated"
  | "postgres-gated"
  | "ci-gated";

export interface NotificationPersistenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: NotificationPersistenceRuntimeStatus;
}

export const notificationPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/notification-persistence-static.test.ts",
  "notification repository Postgres integration tests",
  "cross-tenant notification/message isolation tests",
  "delivery status transition and read/unread state integration tests",
  "provider worker handoff integration tests",
] as const;

export const notificationPersistenceArtifactPaths = [
  "coverage/notification-persistence-runtime.json",
  "coverage/notification-persistence-notifications-typecheck.txt",
  "coverage/notification-persistence-notifications-test.txt",
  "coverage/notification-persistence-dashboard-typecheck.txt",
  "coverage/notification-persistence-static-contract.json",
  "coverage/notification-persistence-prisma-schema.json",
  "coverage/notification-persistence-repository-contract.json",
  "coverage/notification-persistence-message-transaction.json",
  "coverage/notification-persistence-notification-delivery.json",
  "coverage/notification-persistence-audit-log.json",
  "coverage/notification-persistence-idempotency-key.json",
  "coverage/notification-persistence-read-state.json",
  "coverage/notification-persistence-status-transition.json",
  "coverage/notification-persistence-provider-worker-handoff.json",
  "coverage/notification-persistence-rbac-redaction.json",
  "coverage/notification-persistence-tenant-isolation.json",
  "coverage/notification-persistence-postgres-integration.json",
  "coverage/notification-persistence-ci-evidence.json",
  "coverage/notification-persistence-secret-safe-artifacts.json",
  "test-results/notification-persistence-runtime",
] as const;

export const notificationPersistenceRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/notification-persistence-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/notification-persistence-notifications-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/notification-persistence-dashboard-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/notification-persistence-static.test.ts", artifact: "coverage/notification-persistence-static-contract.json", status: "wired" },
  { id: "prisma-schema", command: "Prisma schema validation for message/notification models", artifact: "coverage/notification-persistence-prisma-schema.json", status: "schema-gated" },
  { id: "repository-contract", command: "notification repository implementation tests", artifact: "coverage/notification-persistence-repository-contract.json", status: "repository-gated" },
  { id: "message-transaction", command: "MessageThread/Message/Notification/NotificationDelivery/AuditLog transaction tests", artifact: "coverage/notification-persistence-message-transaction.json", status: "wired" },
  { id: "notification-delivery", command: "NotificationDelivery persistence tests", artifact: "coverage/notification-persistence-notification-delivery.json", status: "wired" },
  { id: "audit-log", command: "NotificationAuditLog/AuditLog persistence tests", artifact: "coverage/notification-persistence-audit-log.json", status: "wired" },
  { id: "idempotency-key", command: "durable IdempotencyKey model/repository tests", artifact: "coverage/notification-persistence-idempotency-key.json", status: "idempotency-gated" },
  { id: "read-state", command: "NotificationReadState model/repository tests", artifact: "coverage/notification-persistence-read-state.json", status: "read-state-gated" },
  { id: "status-transition", command: "delivery status transition integration tests", artifact: "coverage/notification-persistence-status-transition.json", status: "repository-gated" },
  { id: "provider-worker-handoff", command: "provider worker handoff integration tests", artifact: "coverage/notification-persistence-provider-worker-handoff.json", status: "worker-gated" },
  { id: "rbac-redaction", command: "RBAC, destination hashing, and redacted body preview tests", artifact: "coverage/notification-persistence-rbac-redaction.json", status: "wired" },
  { id: "tenant-isolation", command: "cross-tenant notification/message isolation tests", artifact: "coverage/notification-persistence-tenant-isolation.json", status: "postgres-gated" },
  { id: "postgres-integration", command: "notification repository Postgres integration tests", artifact: "coverage/notification-persistence-postgres-integration.json", status: "postgres-gated" },
  { id: "ci-notification-persistence-job", command: "GitHub Actions notification persistence runtime job", artifact: "coverage/notification-persistence-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review notification persistence artifacts for message bodies, destinations, provider IDs, PII, and secrets", artifact: "coverage/notification-persistence-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly NotificationPersistenceRuntimeMatrixEntry[];

export const notificationPersistenceRuntimeReadiness = dashboardNotificationPersistenceContract.runtimeReadiness;
