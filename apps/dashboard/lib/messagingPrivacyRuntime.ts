import { messagingPrivacyContract } from "./messagingPrivacy";

export type MessagingPrivacyRuntimeStatus =
  | "wired"
  | "authorization-gated"
  | "attachment-gated"
  | "workflow-gated"
  | "retention-gated"
  | "moderation-gated"
  | "postgres-gated"
  | "ci-gated";

export interface MessagingPrivacyRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MessagingPrivacyRuntimeStatus;
}

export const messagingPrivacyRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/messaging-privacy-static.test.ts",
  "dashboard messaging role-visibility tests",
  "messaging privacy API authorization tests",
  "secure attachment authorization tests",
  "message export/delete/retention Postgres integration tests",
  "messaging spam moderation and rate-limit tests",
] as const;

export const messagingPrivacyArtifactPaths = [
  "coverage/messaging-privacy-runtime.json",
  "coverage/messaging-privacy-notifications-typecheck.txt",
  "coverage/messaging-privacy-notifications-test.txt",
  "coverage/messaging-privacy-dashboard-typecheck.txt",
  "coverage/messaging-privacy-static-contract.json",
  "coverage/messaging-privacy-redaction-service.json",
  "coverage/messaging-privacy-role-visibility.json",
  "coverage/messaging-privacy-api-authorization.json",
  "coverage/messaging-privacy-unauthorized-role-denial.json",
  "coverage/messaging-privacy-attachment-authorization.json",
  "coverage/messaging-privacy-export-workflow.json",
  "coverage/messaging-privacy-delete-workflow.json",
  "coverage/messaging-privacy-retention-workflow.json",
  "coverage/messaging-privacy-retention-job.json",
  "coverage/messaging-privacy-provider-payload-omission.json",
  "coverage/messaging-privacy-moderation-rate-limit.json",
  "coverage/messaging-privacy-audit-log.json",
  "coverage/messaging-privacy-idempotency-key.json",
  "coverage/messaging-privacy-postgres-retention.json",
  "coverage/messaging-privacy-ci-evidence.json",
  "coverage/messaging-privacy-secret-safe-artifacts.json",
  "test-results/messaging-privacy-runtime",
] as const;

export const messagingPrivacyRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/messaging-privacy-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/messaging-privacy-notifications-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/messaging-privacy-dashboard-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/messaging-privacy-static.test.ts", artifact: "coverage/messaging-privacy-static-contract.json", status: "wired" },
  { id: "redaction-service", command: "production redaction service and sensitive-content detection tests", artifact: "coverage/messaging-privacy-redaction-service.json", status: "wired" },
  { id: "role-visibility", command: "dashboard messaging role-visibility tests", artifact: "coverage/messaging-privacy-role-visibility.json", status: "authorization-gated" },
  { id: "api-authorization", command: "messaging privacy API authorization tests", artifact: "coverage/messaging-privacy-api-authorization.json", status: "authorization-gated" },
  { id: "unauthorized-role-denial", command: "unauthorized-role runtime denial tests", artifact: "coverage/messaging-privacy-unauthorized-role-denial.json", status: "authorization-gated" },
  { id: "attachment-authorization", command: "secure attachment authorization tests", artifact: "coverage/messaging-privacy-attachment-authorization.json", status: "attachment-gated" },
  { id: "export-workflow", command: "message export workflow repository tests", artifact: "coverage/messaging-privacy-export-workflow.json", status: "workflow-gated" },
  { id: "delete-workflow", command: "message delete workflow repository tests", artifact: "coverage/messaging-privacy-delete-workflow.json", status: "workflow-gated" },
  { id: "retention-workflow", command: "message retention workflow repository tests", artifact: "coverage/messaging-privacy-retention-workflow.json", status: "retention-gated" },
  { id: "retention-job", command: "message retention job execution tests", artifact: "coverage/messaging-privacy-retention-job.json", status: "retention-gated" },
  { id: "provider-payload-omission", command: "export omits raw provider payloads, private URLs, and signed URLs", artifact: "coverage/messaging-privacy-provider-payload-omission.json", status: "workflow-gated" },
  { id: "moderation-rate-limit", command: "messaging spam moderation and rate-limit tests", artifact: "coverage/messaging-privacy-moderation-rate-limit.json", status: "moderation-gated" },
  { id: "audit-log", command: "MessageAuditLog privacy event tests", artifact: "coverage/messaging-privacy-audit-log.json", status: "workflow-gated" },
  { id: "idempotency-key", command: "messaging privacy IdempotencyKey tests", artifact: "coverage/messaging-privacy-idempotency-key.json", status: "workflow-gated" },
  { id: "postgres-retention", command: "message export/delete/retention Postgres integration tests", artifact: "coverage/messaging-privacy-postgres-retention.json", status: "postgres-gated" },
  { id: "ci-messaging-privacy-job", command: "GitHub Actions messaging privacy runtime job", artifact: "coverage/messaging-privacy-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review messaging privacy artifacts for message bodies, provider payloads, private URLs, PII, and secrets", artifact: "coverage/messaging-privacy-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly MessagingPrivacyRuntimeMatrixEntry[];

export const messagingPrivacyRuntimeReadiness = messagingPrivacyContract.runtimeReadiness;
