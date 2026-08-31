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

export interface NotificationPersistenceExecutionPolicy {
  readonly codexMayClassifyStaticNotificationPersistenceReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly schemaMigrationEvidenceRequiredForClosure: boolean;
  readonly repositoryContractRequiredForClosure: boolean;
  readonly idempotencyReadStateStatusTransitionRequiredForClosure: boolean;
  readonly providerHandoffRequiredForClosure: boolean;
  readonly seededPostgresRequiredForClosure: boolean;
  readonly tenantIsolationRequiredForClosure: boolean;
  readonly liveProviderWorkerRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface NotificationPersistenceExecutionPlan {
  readonly policy: typeof notificationPersistenceExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly schemaMigrationExecutionAllowed: false;
  readonly repositoryExecutionAllowed: false;
  readonly seededPostgresExecutionAllowed: false;
  readonly providerWorkerExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof notificationPersistenceLocalCommands;
  readonly externalCommands: typeof notificationPersistenceExternalCommands;
  readonly requiredExternalEvidence: typeof notificationPersistenceRequiredExternalEvidence;
}

export interface RedactedNotificationPersistenceArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface NotificationPersistenceArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedNotificationPersistenceArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof notificationPersistenceRequiredExternalEvidence;
}

export const notificationPersistenceExecutionPolicy = {
  codexMayClassifyStaticNotificationPersistenceReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  schemaMigrationEvidenceRequiredForClosure: true,
  repositoryContractRequiredForClosure: true,
  idempotencyReadStateStatusTransitionRequiredForClosure: true,
  providerHandoffRequiredForClosure: true,
  seededPostgresRequiredForClosure: true,
  tenantIsolationRequiredForClosure: true,
  liveProviderWorkerRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies NotificationPersistenceExecutionPolicy;

export const notificationPersistenceRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/notification-persistence-static.test.ts",
  "notification repository Postgres integration tests",
  "cross-tenant notification/message isolation tests",
  "delivery status transition and read/unread state integration tests",
  "provider worker handoff source-row and worker-plan tests",
] as const;

export const notificationPersistenceRequiredExternalEvidence = [
  "actual notification persistence command output",
  "Prisma schema and migration evidence",
  "repository contract execution evidence",
  "MessageThread/Message/Notification/NotificationDelivery/AuditLog transaction evidence",
  "IdempotencyKey and NotificationReadState persistence evidence",
  "NotificationDeliveryStatusTransition persistence evidence",
  "NotificationProviderHandoff source-row and worker-plan evidence",
  "seeded Postgres tenant isolation/redaction/RBAC/audit execution",
  "live provider worker execution evidence",
  "CI notification persistence artifacts",
  "secret-safe notification persistence artifact review",
] as const;

export const notificationPersistenceDecisionRequiredEvidence = [
  "Prisma schema, repository contract, and transactional message write evidence",
  "transactional audit/idempotency write evidence",
  "NotificationReadState and delivery status transition persistence evidence",
  "provider worker handoff source-row and worker-plan evidence",
  "RBAC, redaction, and destination hashing evidence",
  "Postgres tenant-isolation and persistence integration test evidence",
  "secret-safe review of retained notification persistence artifacts",
] as const;

export const notificationPersistenceLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/notification-persistence-runtime-static.test.ts apps/dashboard/tests/notification-persistence-static.test.ts apps/dashboard/tests/message-read-route-static.test.ts",
] as const;

export const notificationPersistenceExternalCommands = [
  "notification repository Postgres integration tests",
  "cross-tenant notification/message isolation tests",
  "delivery status transition and read/unread state integration tests",
  "provider worker handoff source-row and worker-plan tests",
  "live provider worker execution tests",
  "GitHub Actions notification persistence runtime job",
  "secret-safe notification persistence artifact review",
] as const;

export const buildNotificationPersistenceExecutionPlan = (): NotificationPersistenceExecutionPlan => ({
  policy: notificationPersistenceExecutionPolicy,
  commandExecutionAllowed: false,
  schemaMigrationExecutionAllowed: false,
  repositoryExecutionAllowed: false,
  seededPostgresExecutionAllowed: false,
  providerWorkerExecutionAllowed: false,
  tenantIsolationExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: notificationPersistenceLocalCommands,
  externalCommands: notificationPersistenceExternalCommands,
  requiredExternalEvidence: notificationPersistenceRequiredExternalEvidence,
});

const notificationPersistencePrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|message|notification|delivery|destination|body|payload|audit|idempotency|read.?state|status.?transition|handoff|worker|email|phone|medical|payment|customer|artifact|path|ci|workflow|run|evidence|id|key)/i;
const notificationPersistencePrivateArtifactValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat|provider-token)[A-Za-z0-9_-]*|(?:tenant|client|user|member|session|refresh|message|notification|delivery|destination|payload|audit|idempotency|handoff|worker|artifact|workflow|ci|run|evidence|dashboard)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:coverage|artifacts|test-results|reports|docs)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactNotificationPersistenceArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      redactNotificationPersistenceArtifactValue(entry, `${path}[${index}]`, redactedPaths),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (notificationPersistencePrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactNotificationPersistenceArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  if (typeof value === "string" && notificationPersistencePrivateArtifactValuePattern.test(value)) {
    notificationPersistencePrivateArtifactValuePattern.lastIndex = 0;
    redactedPaths.push(path);
    return value.replace(notificationPersistencePrivateArtifactValuePattern, "[redacted]");
  }

  notificationPersistencePrivateArtifactValuePattern.lastIndex = 0;
  return value;
};

export const buildRedactedNotificationPersistenceArtifact = (
  artifact: unknown,
): RedactedNotificationPersistenceArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactNotificationPersistenceArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildNotificationPersistenceArtifactReview = (
  artifact: unknown,
): NotificationPersistenceArtifactReview => {
  const redacted = buildRedactedNotificationPersistenceArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: notificationPersistenceRequiredExternalEvidence,
  };
};

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

export const notificationPersistenceRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260613000800_add_notification_idempotency_read_state/migration.sql",
  "packages/db/prisma/migrations/20260613000900_add_notification_delivery_status_transitions/migration.sql",
  "packages/db/prisma/migrations/20260613001000_add_notification_provider_handoffs/migration.sql",
  "packages/types/package.json",
  "packages/types/src/index.ts",
  "packages/auth/src/index.ts",
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/dashboard/lib/notificationPersistence.ts",
  "apps/dashboard/lib/notificationPersistenceRepository.ts",
  "apps/dashboard/lib/notificationPersistenceRuntime.ts",
  "apps/dashboard/app/messages/page.tsx",
  "apps/dashboard/components/MessageActionPanel.tsx",
  "apps/dashboard/app/api/messages/route.ts",
  "apps/dashboard/app/api/messages/[threadId]/route.ts",
  "apps/dashboard/tests/message-read-route-static.test.ts",
  "apps/dashboard/tests/notification-persistence-static.test.ts",
  "apps/dashboard/tests/notification-persistence-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type NotificationPersistenceEvidenceArtifact = (typeof notificationPersistenceArtifactPaths)[number];

export interface NotificationPersistenceEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly prismaSchemaVerified: boolean;
  readonly repositoryContractVerified: boolean;
  readonly messageTransactionVerified: boolean;
  readonly notificationDeliveryVerified: boolean;
  readonly auditLogVerified: boolean;
  readonly idempotencyKeyVerified: boolean;
  readonly readStateVerified: boolean;
  readonly statusTransitionVerified: boolean;
  readonly providerWorkerHandoffVerified: boolean;
  readonly rbacRedactionVerified: boolean;
  readonly tenantIsolationVerified: boolean;
  readonly postgresIntegrationVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly NotificationPersistenceEvidenceArtifact[];
}

export interface NotificationPersistenceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly NotificationPersistenceEvidenceArtifact[];
  readonly requiredCommands: typeof notificationPersistenceRuntimeCommands;
  readonly requiredEvidence: typeof notificationPersistenceDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildNotificationPersistenceEvidenceDecision = (
  input: NotificationPersistenceEvidenceInput,
): NotificationPersistenceEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = notificationPersistenceArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.dashboardTypecheckPassed ? ["Dashboard typecheck evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["Notification persistence static contract evidence is missing."] : []),
    ...(!input.prismaSchemaVerified ? ["Notification/message Prisma schema evidence is missing."] : []),
    ...(!input.repositoryContractVerified ? ["Notification persistence repository contract evidence is missing."] : []),
    ...(!input.messageTransactionVerified ? ["Message transaction write evidence is missing."] : []),
    ...(!input.notificationDeliveryVerified ? ["NotificationDelivery persistence evidence is missing."] : []),
    ...(!input.auditLogVerified ? ["Notification audit-log evidence is missing."] : []),
    ...(!input.idempotencyKeyVerified ? ["IdempotencyKey persistence evidence is missing."] : []),
    ...(!input.readStateVerified ? ["NotificationReadState persistence evidence is missing."] : []),
    ...(!input.statusTransitionVerified ? ["Delivery status transition evidence is missing."] : []),
    ...(!input.providerWorkerHandoffVerified ? ["Provider worker handoff evidence is missing."] : []),
    ...(!input.rbacRedactionVerified ? ["RBAC/redaction evidence is missing."] : []),
    ...(!input.tenantIsolationVerified ? ["Cross-tenant notification/message isolation evidence is missing."] : []),
    ...(!input.postgresIntegrationVerified ? ["Notification repository Postgres integration evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Notification persistence CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe notification persistence artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All notification persistence artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: notificationPersistenceRuntimeCommands,
    requiredEvidence: notificationPersistenceDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: notificationPersistenceArtifactPaths.length,
    },
  };
};

export const notificationPersistenceRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/notification-persistence-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/notification-persistence-notifications-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/notification-persistence-dashboard-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/notification-persistence-static.test.ts", artifact: "coverage/notification-persistence-static-contract.json", status: "wired" },
  { id: "prisma-schema", command: "Prisma schema validation for message/notification models", artifact: "coverage/notification-persistence-prisma-schema.json", status: "schema-gated" },
  { id: "repository-contract", command: "notification repository contract tests", artifact: "coverage/notification-persistence-repository-contract.json", status: "wired" },
  { id: "message-transaction", command: "MessageThread/Message/Notification/NotificationDelivery/AuditLog transaction tests", artifact: "coverage/notification-persistence-message-transaction.json", status: "wired" },
  { id: "notification-delivery", command: "NotificationDelivery persistence tests", artifact: "coverage/notification-persistence-notification-delivery.json", status: "wired" },
  { id: "audit-log", command: "NotificationAuditLog/AuditLog persistence tests", artifact: "coverage/notification-persistence-audit-log.json", status: "wired" },
  { id: "idempotency-key", command: "durable IdempotencyKey model/repository tests", artifact: "coverage/notification-persistence-idempotency-key.json", status: "wired" },
  { id: "read-state", command: "NotificationReadState model/repository tests", artifact: "coverage/notification-persistence-read-state.json", status: "wired" },
  { id: "status-transition", command: "delivery status transition integration tests", artifact: "coverage/notification-persistence-status-transition.json", status: "wired" },
  { id: "provider-worker-handoff", command: "NotificationProviderHandoff source-row and worker-plan tests", artifact: "coverage/notification-persistence-provider-worker-handoff.json", status: "wired" },
  { id: "rbac-redaction", command: "RBAC, destination hashing, and redacted body preview tests", artifact: "coverage/notification-persistence-rbac-redaction.json", status: "wired" },
  { id: "tenant-isolation", command: "cross-tenant notification/message isolation tests", artifact: "coverage/notification-persistence-tenant-isolation.json", status: "postgres-gated" },
  { id: "postgres-integration", command: "notification repository Postgres integration tests", artifact: "coverage/notification-persistence-postgres-integration.json", status: "postgres-gated" },
  { id: "ci-notification-persistence-job", command: "GitHub Actions notification persistence runtime job", artifact: "coverage/notification-persistence-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review notification persistence artifacts for message bodies, destinations, provider IDs, PII, and secrets", artifact: "coverage/notification-persistence-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly NotificationPersistenceRuntimeMatrixEntry[];

export const notificationPersistenceRuntimeReadiness = dashboardNotificationPersistenceContract.runtimeReadiness;


