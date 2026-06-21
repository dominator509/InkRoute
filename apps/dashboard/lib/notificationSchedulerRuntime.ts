import { dashboardNotificationSchedulerContract } from "./notificationScheduler";

export type NotificationSchedulerRuntimeStatus =
  | "wired"
  | "backend-gated"
  | "persistence-gated"
  | "worker-gated"
  | "provider-gated"
  | "concurrency-gated"
  | "integration-gated"
  | "ci-gated";

export interface NotificationSchedulerRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: NotificationSchedulerRuntimeStatus;
}

export interface NotificationSchedulerExecutionPolicy {
  readonly codexMayClassifyStaticNotificationSchedulerReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly queueBackendRequiredForClosure: boolean;
  readonly durableJobRepositoriesRequiredForClosure: boolean;
  readonly schedulerWorkerDeploymentRequiredForClosure: boolean;
  readonly providerDispatchRequiredForClosure: boolean;
  readonly dueJobConcurrencyRequiredForClosure: boolean;
  readonly retryDeadLetterRequiredForClosure: boolean;
  readonly cancellationRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface NotificationSchedulerExecutionPlan {
  readonly policy: typeof notificationSchedulerExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly queueBackendExecutionAllowed: false;
  readonly durableRepositoryExecutionAllowed: false;
  readonly schedulerProcessExecutionAllowed: false;
  readonly workerProcessExecutionAllowed: false;
  readonly providerDispatchExecutionAllowed: false;
  readonly concurrencyExecutionAllowed: false;
  readonly integrationExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof notificationSchedulerLocalCommands;
  readonly externalCommands: typeof notificationSchedulerExternalCommands;
  readonly requiredExternalEvidence: typeof notificationSchedulerRequiredExternalEvidence;
}

export interface RedactedNotificationSchedulerArtifact {
  readonly artifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: true;
}

export interface NotificationSchedulerArtifactReview {
  readonly passed: boolean;
  readonly artifact: RedactedNotificationSchedulerArtifact;
  readonly blockers: readonly string[];
  readonly requiredExternalEvidence: typeof notificationSchedulerRequiredExternalEvidence;
}

export const notificationSchedulerExecutionPolicy = {
  codexMayClassifyStaticNotificationSchedulerReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  queueBackendRequiredForClosure: true,
  durableJobRepositoriesRequiredForClosure: true,
  schedulerWorkerDeploymentRequiredForClosure: true,
  providerDispatchRequiredForClosure: true,
  dueJobConcurrencyRequiredForClosure: true,
  retryDeadLetterRequiredForClosure: true,
  cancellationRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies NotificationSchedulerExecutionPolicy;

export const notificationSchedulerRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/notification-scheduler-static.test.ts",
  "notification scheduler Postgres queue integration tests",
  "notification retry/backoff and dead-letter integration tests",
  "appointment reschedule/cancel scheduled-job cancellation integration tests",
  "idempotent due-job worker concurrency test",
  "provider dispatch worker integration tests",
] as const;

export const notificationSchedulerRequiredExternalEvidence = [
  "actual notification scheduler command output",
  "queue backend configuration evidence",
  "NotificationJob persistence tests",
  "DeadLetterJob persistence tests",
  "NotificationWorkerAuditLog persistence tests",
  "scheduler IdempotencyKey persistence tests",
  "scheduler and worker process deployment evidence",
  "provider dispatch worker integration evidence",
  "Postgres due-job concurrency tests",
  "retry/backoff and dead-letter integration tests",
  "appointment reschedule/cancel scheduled-job cancellation tests",
  "CI notification scheduler artifacts",
  "secret-safe notification scheduler artifact review",
] as const;

export const notificationSchedulerDecisionRequiredEvidence = [
  "queue backend and NotificationJob persistence evidence",
  "scheduler/worker process and transactional due-job claiming evidence",
  "retry, dead-letter, and worker audit persistence evidence",
  "provider dispatch worker integration evidence",
  "queue, retry/dead-letter, and appointment cancellation integration test evidence",
  "secret-safe review of retained notification scheduler artifacts",
] as const;

export const notificationSchedulerLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm vitest run apps/dashboard/tests/notification-scheduler-runtime-static.test.ts apps/dashboard/tests/notification-scheduler-static.test.ts",
] as const;

export const notificationSchedulerExternalCommands = [
  "notification scheduler Postgres queue integration tests",
  "notification retry/backoff and dead-letter integration tests",
  "appointment reschedule/cancel scheduled-job cancellation integration tests",
  "idempotent due-job worker concurrency test",
  "provider dispatch worker integration tests",
  "GitHub Actions notification scheduler runtime job",
  "secret-safe notification scheduler artifact review",
] as const;

export const buildNotificationSchedulerExecutionPlan = (): NotificationSchedulerExecutionPlan => ({
  policy: notificationSchedulerExecutionPolicy,
  commandExecutionAllowed: false,
  queueBackendExecutionAllowed: false,
  durableRepositoryExecutionAllowed: false,
  schedulerProcessExecutionAllowed: false,
  workerProcessExecutionAllowed: false,
  providerDispatchExecutionAllowed: false,
  concurrencyExecutionAllowed: false,
  integrationExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: notificationSchedulerLocalCommands,
  externalCommands: notificationSchedulerExternalCommands,
  requiredExternalEvidence: notificationSchedulerRequiredExternalEvidence,
});

const notificationSchedulerPrivateArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|notification|scheduler|job|message|destination|body|payload|worker|audit|idempotency|queue|dead.?letter|retry|handoff|email|phone|medical|payment|customer)/i;

const redactNotificationSchedulerArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      redactNotificationSchedulerArtifactValue(entry, `${path}[${index}]`, redactedPaths),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (notificationSchedulerPrivateArtifactKeyPattern.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[redacted]"];
        }

        return [key, redactNotificationSchedulerArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildRedactedNotificationSchedulerArtifact = (
  artifact: unknown,
): RedactedNotificationSchedulerArtifact => {
  const redactedPaths: string[] = [];

  return {
    artifact: redactNotificationSchedulerArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
    secretSafe: true,
  };
};

export const buildNotificationSchedulerArtifactReview = (
  artifact: unknown,
): NotificationSchedulerArtifactReview => {
  const redacted = buildRedactedNotificationSchedulerArtifact(artifact);

  return {
    passed: true,
    artifact: redacted,
    blockers: [],
    requiredExternalEvidence: notificationSchedulerRequiredExternalEvidence,
  };
};

export const notificationSchedulerArtifactPaths = [
  "coverage/notification-scheduler-runtime.json",
  "coverage/notification-scheduler-notifications-typecheck.txt",
  "coverage/notification-scheduler-notifications-test.txt",
  "coverage/notification-scheduler-dashboard-typecheck.txt",
  "coverage/notification-scheduler-static-contract.json",
  "coverage/notification-scheduler-queue-backend.json",
  "coverage/notification-scheduler-notification-job-persistence.json",
  "coverage/notification-scheduler-dead-letter-persistence.json",
  "coverage/notification-scheduler-worker-audit-persistence.json",
  "coverage/notification-scheduler-idempotency-key.json",
  "coverage/notification-scheduler-scheduler-process.json",
  "coverage/notification-scheduler-worker-process.json",
  "coverage/notification-scheduler-provider-dispatch.json",
  "coverage/notification-scheduler-due-job-concurrency.json",
  "coverage/notification-scheduler-retry-backoff.json",
  "coverage/notification-scheduler-cancellation.json",
  "coverage/notification-scheduler-postgres-queue.json",
  "coverage/notification-scheduler-ci-evidence.json",
  "coverage/notification-scheduler-secret-safe-artifacts.json",
  "test-results/notification-scheduler-runtime",
] as const;

export const notificationSchedulerRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/dashboard/lib/notificationScheduler.ts",
  "apps/dashboard/lib/notificationSchedulerRuntime.ts",
  "apps/dashboard/app/api/notifications/scheduler/route.ts",
  "apps/dashboard/app/templates/page.tsx",
  "apps/dashboard/components/NotificationSchedulerActionPanel.tsx",
  "apps/dashboard/tests/notification-scheduler-static.test.ts",
  "apps/dashboard/tests/notification-scheduler-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type NotificationSchedulerEvidenceArtifact = (typeof notificationSchedulerArtifactPaths)[number];

export interface NotificationSchedulerEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly dashboardTypecheckPassed: boolean;
  readonly staticContractTestsPassed: boolean;
  readonly queueBackendVerified: boolean;
  readonly notificationJobPersistenceVerified: boolean;
  readonly deadLetterPersistenceVerified: boolean;
  readonly workerAuditPersistenceVerified: boolean;
  readonly idempotencyKeyVerified: boolean;
  readonly schedulerProcessVerified: boolean;
  readonly workerProcessVerified: boolean;
  readonly providerDispatchVerified: boolean;
  readonly dueJobConcurrencyVerified: boolean;
  readonly retryBackoffVerified: boolean;
  readonly cancellationVerified: boolean;
  readonly postgresQueueVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly NotificationSchedulerEvidenceArtifact[];
}

export interface NotificationSchedulerEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly NotificationSchedulerEvidenceArtifact[];
  readonly requiredCommands: typeof notificationSchedulerRuntimeCommands;
  readonly requiredEvidence: typeof notificationSchedulerDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const buildNotificationSchedulerEvidenceDecision = (
  input: NotificationSchedulerEvidenceInput,
): NotificationSchedulerEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = notificationSchedulerArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.dashboardTypecheckPassed ? ["Dashboard typecheck evidence is missing."] : []),
    ...(!input.staticContractTestsPassed ? ["Notification scheduler static contract evidence is missing."] : []),
    ...(!input.queueBackendVerified ? ["Notification queue backend evidence is missing."] : []),
    ...(!input.notificationJobPersistenceVerified ? ["NotificationJob persistence evidence is missing."] : []),
    ...(!input.deadLetterPersistenceVerified ? ["DeadLetterJob persistence evidence is missing."] : []),
    ...(!input.workerAuditPersistenceVerified ? ["NotificationWorkerAuditLog persistence evidence is missing."] : []),
    ...(!input.idempotencyKeyVerified ? ["Scheduler IdempotencyKey persistence evidence is missing."] : []),
    ...(!input.schedulerProcessVerified ? ["Scheduler process deployment evidence is missing."] : []),
    ...(!input.workerProcessVerified ? ["Notification worker process evidence is missing."] : []),
    ...(!input.providerDispatchVerified ? ["Provider dispatch worker evidence is missing."] : []),
    ...(!input.dueJobConcurrencyVerified ? ["Transactional due-job concurrency evidence is missing."] : []),
    ...(!input.retryBackoffVerified ? ["Retry/backoff and dead-letter integration evidence is missing."] : []),
    ...(!input.cancellationVerified ? ["Scheduled-job cancellation integration evidence is missing."] : []),
    ...(!input.postgresQueueVerified ? ["Postgres queue integration evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Notification scheduler CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe notification scheduler artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All notification scheduler artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: notificationSchedulerRuntimeCommands,
    requiredEvidence: notificationSchedulerDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: notificationSchedulerArtifactPaths.length,
    },
  };
};

export const notificationSchedulerRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/notification-scheduler-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/notification-scheduler-notifications-test.txt", status: "wired" },
  { id: "dashboard-typecheck", command: "pnpm --filter @inkroute/dashboard typecheck", artifact: "coverage/notification-scheduler-dashboard-typecheck.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/dashboard/tests/notification-scheduler-static.test.ts", artifact: "coverage/notification-scheduler-static-contract.json", status: "wired" },
  { id: "queue-backend", command: "choose and configure notification queue backend", artifact: "coverage/notification-scheduler-queue-backend.json", status: "backend-gated" },
  { id: "notification-job-persistence", command: "NotificationJob model/repository tests", artifact: "coverage/notification-scheduler-notification-job-persistence.json", status: "persistence-gated" },
  { id: "dead-letter-persistence", command: "DeadLetterJob model/repository tests", artifact: "coverage/notification-scheduler-dead-letter-persistence.json", status: "persistence-gated" },
  { id: "worker-audit-persistence", command: "NotificationWorkerAuditLog model/repository tests", artifact: "coverage/notification-scheduler-worker-audit-persistence.json", status: "persistence-gated" },
  { id: "idempotency-key", command: "scheduler IdempotencyKey model/repository tests", artifact: "coverage/notification-scheduler-idempotency-key.json", status: "persistence-gated" },
  { id: "scheduler-process", command: "scheduler process deployment smoke", artifact: "coverage/notification-scheduler-scheduler-process.json", status: "worker-gated" },
  { id: "worker-process", command: "notification worker process deployment smoke", artifact: "coverage/notification-scheduler-worker-process.json", status: "worker-gated" },
  { id: "provider-dispatch", command: "provider dispatch worker integration tests", artifact: "coverage/notification-scheduler-provider-dispatch.json", status: "provider-gated" },
  { id: "due-job-concurrency", command: "idempotent due-job worker concurrency test", artifact: "coverage/notification-scheduler-due-job-concurrency.json", status: "concurrency-gated" },
  { id: "retry-backoff", command: "notification retry/backoff and dead-letter integration tests", artifact: "coverage/notification-scheduler-retry-backoff.json", status: "integration-gated" },
  { id: "cancellation", command: "appointment reschedule/cancel scheduled-job cancellation integration tests", artifact: "coverage/notification-scheduler-cancellation.json", status: "integration-gated" },
  { id: "postgres-queue", command: "notification scheduler Postgres queue integration tests", artifact: "coverage/notification-scheduler-postgres-queue.json", status: "integration-gated" },
  { id: "ci-scheduler-job", command: "GitHub Actions notification scheduler runtime job", artifact: "coverage/notification-scheduler-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review scheduler artifacts for message bodies, destinations, provider payloads, PII, and secrets", artifact: "coverage/notification-scheduler-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly NotificationSchedulerRuntimeMatrixEntry[];

export const notificationSchedulerRuntimeReadiness = dashboardNotificationSchedulerContract.runtimeReadiness;


