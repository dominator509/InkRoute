import { buildNotificationLaunchEvidencePlan, buildNotificationPreferenceSuppressionPlan, buildNotificationProviderHandoffWorkerPlan } from "@inkroute/notifications";
import { buildNotificationRedactionPrivacyDecision } from "./notificationRedactionPrivacyContract";
import { buildNotificationTenantIsolationDecision } from "./notificationTenantIsolationContract";
import { buildNotificationWebhookReplayDecision } from "./notificationWebhookReplayContract";

export type NotificationLaunchRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "queue-gated"
  | "persistence-gated"
  | "privacy-gated"
  | "ci-gated";

export interface NotificationLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: NotificationLaunchRuntimeStatus;
}

export interface NotificationLaunchRunPersistenceContract {
  readonly model: "NotificationLaunchRun";
  readonly tenantRelation: "notificationLaunchRuns";
  readonly migration: "20260609033400_add_notification_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "providerSendManifest",
    "suppressionManifest",
    "webhookReplayManifest",
  ];
  readonly evidenceBooleans: readonly [
    "notificationsTypecheckPassed",
    "notificationsTestsPassed",
    "providerSdksConfigured",
    "resendSandboxSendPassed",
    "twilioSandboxSendPassed",
    "expoPushDeviceSendPassed",
    "queueWorkerImplemented",
    "deliveryPersistenceConfigured",
    "providerEventPersistenceConfigured",
    "messageThreadPersistenceConfigured",
    "messagePersistenceConfigured",
    "preferenceCenterImplemented",
    "unsubscribeStopSuppressionTested",
    "quietHoursRateLimitTested",
    "signedWebhookVerificationPassed",
    "retryDeadLetterFlowTested",
    "tenantIsolationTestsPassed",
    "redactionPrivacyReviewPassed",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ];
  readonly artifactFields: readonly [
    "notificationTypecheckArtifactPath",
    "notificationTestArtifactPath",
    "providerSandboxArtifactPath",
    "resendSandboxArtifactPath",
    "twilioSandboxArtifactPath",
    "expoPushDeviceArtifactPath",
    "queueWorkerArtifactPath",
    "persistenceArtifactPath",
    "preferenceSuppressionArtifactPath",
    "webhookSignatureReplayArtifactPath",
    "retryDeadLetterArtifactPath",
    "tenantIsolationArtifactPath",
    "redactionPrivacyArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const notificationLaunchRunPersistenceContract: NotificationLaunchRunPersistenceContract = {
  model: "NotificationLaunchRun",
  tenantRelation: "notificationLaunchRuns",
  migration: "20260609033400_add_notification_launch_runs",
  jsonFields: [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "providerSendManifest",
    "suppressionManifest",
    "webhookReplayManifest",
  ],
  evidenceBooleans: [
    "notificationsTypecheckPassed",
    "notificationsTestsPassed",
    "providerSdksConfigured",
    "resendSandboxSendPassed",
    "twilioSandboxSendPassed",
    "expoPushDeviceSendPassed",
    "queueWorkerImplemented",
    "deliveryPersistenceConfigured",
    "providerEventPersistenceConfigured",
    "messageThreadPersistenceConfigured",
    "messagePersistenceConfigured",
    "preferenceCenterImplemented",
    "unsubscribeStopSuppressionTested",
    "quietHoursRateLimitTested",
    "signedWebhookVerificationPassed",
    "retryDeadLetterFlowTested",
    "tenantIsolationTestsPassed",
    "redactionPrivacyReviewPassed",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ],
  artifactFields: [
    "notificationTypecheckArtifactPath",
    "notificationTestArtifactPath",
    "providerSandboxArtifactPath",
    "resendSandboxArtifactPath",
    "twilioSandboxArtifactPath",
    "expoPushDeviceArtifactPath",
    "queueWorkerArtifactPath",
    "persistenceArtifactPath",
    "preferenceSuppressionArtifactPath",
    "webhookSignatureReplayArtifactPath",
    "retryDeadLetterArtifactPath",
    "tenantIsolationArtifactPath",
    "redactionPrivacyArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const notificationLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "notification provider sandbox tests",
  "notification queue worker source contract tests",
  "provider webhook signature/replay tests",
  "preference suppression source contract tests",
  "Expo push device smoke",
  "GitHub Actions notification launch evidence job",
] as const;

export const notificationLaunchRuntimeControls = [
  "pre-send-consent-preference-suppression-quiet-hours-rate-limit-resolution",
  "tenant-scoped-delivery-provider-thread-message-audit-idempotency-persistence",
  "raw-body-provider-webhook-signature-and-replay-rejection",
  "unsubscribe-stop-help-bounce-complaint-invalid-push-retry-dead-letter-processing",
  "redacted-destinations-payloads-bodies-private-urls-secrets-in-artifacts",
] as const;

export const notificationLaunchArtifactPaths = [
  "coverage/notification-launch-runtime.json",
  "coverage/notification-typecheck.txt",
  "coverage/notification-test.txt",
  "coverage/notification-provider-sandbox.json",
  "coverage/notification-resend-sandbox.json",
  "coverage/notification-twilio-sandbox.json",
  "coverage/notification-expo-push-device.json",
  "coverage/notification-queue-worker.json",
  "coverage/notification-persistence.json",
  "coverage/notification-preference-suppression.json",
  "coverage/notification-webhook-signature-replay.json",
  "coverage/notification-retry-dead-letter.json",
  "coverage/notification-tenant-isolation.json",
  "coverage/notification-redaction-privacy.json",
  "coverage/notification-ci-evidence.json",
  "coverage/notification-secret-safe-artifacts.json",
  "test-results/notification-launch-runtime",
] as const;

export const notificationLaunchRuntimeProofFiles = [
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/dashboard/tests/message-read-route-static.test.ts",
  "apps/dashboard/tests/template-read-route-static.test.ts",
  "apps/web/app/api/webhooks/email/route.ts",
  "apps/web/app/api/webhooks/sms/route.ts",
  "apps/web/lib/notificationLaunchRuntime.ts",
  "apps/web/tests/notification-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033400_add_notification_launch_runs/migration.sql",
  "packages/db/prisma/migrations/20260613001100_add_provider_events/migration.sql",
  "packages/db/prisma/migrations/20260613001200_add_notification_preferences_suppressions/migration.sql",
  "apps/web/lib/notificationRedactionPrivacyContract.ts",
  "apps/web/lib/notificationTenantIsolationContract.ts",
  "apps/web/lib/notificationWebhookReplayContract.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const notificationLaunchQueueWorkerPlans = [
  buildNotificationProviderHandoffWorkerPlan({
    tenantId: "tenant_launch_demo",
    handoffId: "handoff_launch_claim",
    deliveryId: "delivery_launch_claim",
    provider: "in_app",
    action: "claim_due_handoff",
    currentState: "queued",
    attempts: 0,
    maxAttempts: 3,
    providerReady: true,
    sanitizedPayloadAvailable: true,
    destinationHashAvailable: true,
    idempotencyStoreAvailable: true,
    auditLogPersistenceAvailable: true,
    deliveryStatusTransitionPersistenceAvailable: true,
    now: "2026-06-08T10:00:00.000Z",
  }),
  buildNotificationProviderHandoffWorkerPlan({
    tenantId: "tenant_launch_demo",
    handoffId: "handoff_launch_dead_letter",
    deliveryId: "delivery_launch_dead_letter",
    provider: "in_app",
    action: "dead_letter",
    currentState: "failed",
    attempts: 3,
    maxAttempts: 3,
    providerReady: false,
    sanitizedPayloadAvailable: true,
    destinationHashAvailable: true,
    idempotencyStoreAvailable: true,
    auditLogPersistenceAvailable: true,
    deliveryStatusTransitionPersistenceAvailable: true,
    now: "2026-06-08T10:05:00.000Z",
  }),
] as const;

export const notificationLaunchPreferenceSuppressionPlans = [
  buildNotificationPreferenceSuppressionPlan({
    tenantId: "tenant_launch_demo",
    subjectType: "client",
    subjectId: "client_launch_demo",
    channel: "email",
    action: "record_unsubscribe",
    destinationHash: "dest_email_launch_demo",
    provider: "resend",
    providerEventId: "evt_launch_unsubscribe",
    quietHoursConfigured: true,
    rateLimitConfigured: true,
    preferencePersistenceAvailable: true,
    suppressionPersistenceAvailable: true,
    idempotencyStoreAvailable: true,
    auditLogPersistenceAvailable: true,
    payloadRedacted: true,
  }),
  buildNotificationPreferenceSuppressionPlan({
    tenantId: "tenant_launch_demo",
    subjectType: "client",
    subjectId: "client_launch_demo",
    channel: "sms",
    action: "evaluate_quiet_hours_rate_limit",
    destinationHash: "dest_sms_launch_demo",
    provider: "twilio",
    quietHoursConfigured: true,
    rateLimitConfigured: true,
    preferencePersistenceAvailable: true,
    suppressionPersistenceAvailable: true,
    idempotencyStoreAvailable: true,
    auditLogPersistenceAvailable: true,
    payloadRedacted: true,
  }),
] as const;

export const notificationLaunchWebhookReplayDecisions = [
  buildNotificationWebhookReplayDecision({
    tenantId: "tenant_launch_demo",
    provider: "resend",
    eventId: "evt_launch_delivered",
    rawBodyAvailable: true,
    signatureHeaderAvailable: true,
    webhookSecretConfigured: true,
    providerEventPersistenceAvailable: true,
    replayAlreadySeen: false,
    payloadRedacted: true,
  }),
  buildNotificationWebhookReplayDecision({
    tenantId: "tenant_launch_demo",
    provider: "twilio",
    eventId: "evt_launch_replay",
    rawBodyAvailable: true,
    signatureHeaderAvailable: true,
    webhookSecretConfigured: true,
    providerEventPersistenceAvailable: true,
    replayAlreadySeen: true,
    payloadRedacted: true,
  }),
] as const;

export const notificationLaunchRedactionPrivacyDecisions = [
  buildNotificationRedactionPrivacyDecision({
    artifactPath: "coverage/notification-redaction-privacy.json",
    payloadSummary: "redacted provider payload summary with destination hash and body preview labels",
    containsRawDestination: false,
    containsRawMessageBody: false,
    containsProviderSecret: false,
    containsPrivateUrl: false,
    redactedFieldLabels: ["destinationHash", "redactedBodyPreview", "providerPayloadSummary", "redactedFields"],
  }),
  buildNotificationRedactionPrivacyDecision({
    artifactPath: "coverage/notification-secret-safe-artifacts.json",
    payloadSummary: "blocked sample containing forbidden raw payload markers",
    containsRawDestination: true,
    containsRawMessageBody: true,
    containsProviderSecret: true,
    containsPrivateUrl: true,
    redactedFieldLabels: [],
  }),
] as const;

export const notificationLaunchTenantIsolationDecisions = [
  buildNotificationTenantIsolationDecision({
    surface: "provider-event-webhook",
    tenantId: "tenant_launch_demo",
    requestedTenantId: "tenant_launch_demo",
    model: "ProviderEvent",
    operation: "write",
    tenantFilterPresent: true,
    auditMetadataRedacted: true,
  }),
  buildNotificationTenantIsolationDecision({
    surface: "cross-tenant-provider-event-webhook",
    tenantId: "tenant_launch_demo",
    requestedTenantId: "tenant_other",
    model: "ProviderEvent",
    operation: "write",
    tenantFilterPresent: true,
    auditMetadataRedacted: true,
  }),
] as const;

export type NotificationLaunchRuntimeCommand = (typeof notificationLaunchRuntimeCommands)[number];
export type NotificationLaunchRuntimeControl = (typeof notificationLaunchRuntimeControls)[number];
export type NotificationLaunchArtifact = (typeof notificationLaunchArtifactPaths)[number];

export interface NotificationLaunchEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly providerSdksConfigured: boolean;
  readonly resendSandboxSendPassed: boolean;
  readonly twilioSandboxSendPassed: boolean;
  readonly expoPushDeviceSendPassed: boolean;
  readonly queueWorkerImplemented: boolean;
  readonly deliveryPersistenceConfigured: boolean;
  readonly providerEventPersistenceConfigured: boolean;
  readonly messageThreadPersistenceConfigured: boolean;
  readonly messagePersistenceConfigured: boolean;
  readonly preferenceCenterImplemented: boolean;
  readonly unsubscribeStopSuppressionTested: boolean;
  readonly quietHoursRateLimitTested: boolean;
  readonly signedWebhookVerificationPassed: boolean;
  readonly retryDeadLetterFlowTested: boolean;
  readonly tenantIsolationTestsPassed: boolean;
  readonly redactionPrivacyReviewPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly notificationLaunchRunPersisted: boolean;
  readonly coveredControls: readonly NotificationLaunchRuntimeControl[];
  readonly capturedArtifacts: readonly NotificationLaunchArtifact[];
  readonly completedCommands: readonly NotificationLaunchRuntimeCommand[];
}

export interface NotificationLaunchRunRecordInput extends NotificationLaunchEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly notificationTypecheckArtifactPath?: string | null;
  readonly notificationTestArtifactPath?: string | null;
  readonly providerSandboxArtifactPath?: string | null;
  readonly resendSandboxArtifactPath?: string | null;
  readonly twilioSandboxArtifactPath?: string | null;
  readonly expoPushDeviceArtifactPath?: string | null;
  readonly queueWorkerArtifactPath?: string | null;
  readonly persistenceArtifactPath?: string | null;
  readonly preferenceSuppressionArtifactPath?: string | null;
  readonly webhookSignatureReplayArtifactPath?: string | null;
  readonly retryDeadLetterArtifactPath?: string | null;
  readonly tenantIsolationArtifactPath?: string | null;
  readonly redactionPrivacyArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface NotificationLaunchRunData
  extends Omit<
    NotificationLaunchRunRecordInput,
    "coveredControls" | "capturedArtifacts" | "completedCommands" | "notificationLaunchRunPersisted"
  > {
  readonly commandMatrix: typeof notificationLaunchRuntimeMatrix;
  readonly controlManifest: readonly NotificationLaunchRuntimeControl[];
  readonly artifactManifest: readonly NotificationLaunchArtifact[];
  readonly providerSendManifest: {
    readonly providerSdksConfigured: boolean;
    readonly resendSandboxSendPassed: boolean;
    readonly twilioSandboxSendPassed: boolean;
    readonly expoPushDeviceSendPassed: boolean;
  };
  readonly suppressionManifest: {
    readonly preferenceCenterImplemented: boolean;
    readonly unsubscribeStopSuppressionTested: boolean;
    readonly quietHoursRateLimitTested: boolean;
    readonly redactionPrivacyReviewPassed: boolean;
  };
  readonly webhookReplayManifest: {
    readonly signedWebhookVerificationPassed: boolean;
    readonly retryDeadLetterFlowTested: boolean;
    readonly tenantIsolationTestsPassed: boolean;
  };
}

export interface NotificationLaunchRunRepository {
  readonly notificationLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: NotificationLaunchRunData;
      update: Omit<NotificationLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface NotificationLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingControls: readonly NotificationLaunchRuntimeControl[];
  readonly missingArtifacts: readonly NotificationLaunchArtifact[];
  readonly missingCommands: readonly NotificationLaunchRuntimeCommand[];
  readonly requiredControls: readonly NotificationLaunchRuntimeControl[];
  readonly requiredArtifacts: typeof notificationLaunchArtifactPaths;
  readonly requiredCommands: typeof notificationLaunchRuntimeCommands;
  readonly requiredEvidence: typeof notificationLaunchRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface NotificationLaunchExecutionPlan {
  readonly localCommands: typeof notificationLaunchLocalCommands;
  readonly externalCommands: typeof notificationLaunchExternalCommands;
  readonly localArtifacts: typeof notificationLaunchLocalArtifacts;
  readonly externalArtifacts: typeof notificationLaunchExternalArtifacts;
  readonly providerExecutionAllowed: false;
  readonly deviceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly executionPolicy: typeof notificationLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof notificationLaunchRequiredExternalEvidence;
}

export interface NotificationLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof notificationLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const sensitiveNotificationLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|destination|body|payload|provider|tenant|user|client|thread|message|delivery|event|account|database|url|uri|dsn|key|id)/iu;
const sensitiveNotificationLaunchValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

export const notificationLaunchExecutionPolicy = {
  codexMayClassifyStaticNotificationLaunchReadiness: true,
  providerEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const notificationLaunchRequiredExternalEvidence = [
  "Resend, Twilio, and Expo provider SDK configuration evidence.",
  "Provider sandbox and Expo device send evidence with redacted destinations and payloads.",
  "Live provider-backed queue execution with retry and dead-letter evidence.",
  "Tenant-scoped NotificationDelivery, ProviderEvent, MessageThread, Message, audit, and idempotency persistence evidence.",
  "Live provider-driven preference center, unsubscribe, STOP/HELP, quiet-hours, and rate-limit suppression evidence.",
  "Signed webhook verification and replay rejection evidence against provider payloads.",
  "Live cross-tenant database isolation proof for notification launch reads and writes.",
  "CI notification launch evidence job with secret-safe artifact bundle.",
  "Provider-backed NotificationLaunchRun persistence row captured through persistNotificationLaunchRun.",
] as const;

export const notificationLaunchLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "notification queue worker source contract tests",
  "preference suppression source contract tests",
] as const;

export const notificationLaunchExternalCommands = [
  "notification provider sandbox tests",
  "provider webhook signature/replay tests",
  "Expo push device smoke",
  "GitHub Actions notification launch evidence job",
] as const;

export const notificationLaunchLocalArtifacts = [
  "coverage/notification-launch-runtime.json",
  "coverage/notification-typecheck.txt",
  "coverage/notification-test.txt",
  "coverage/notification-queue-worker.json",
  "coverage/notification-preference-suppression.json",
  "coverage/notification-retry-dead-letter.json",
  "coverage/notification-tenant-isolation.json",
  "coverage/notification-redaction-privacy.json",
] as const;

export const notificationLaunchExternalArtifacts = [
  "coverage/notification-provider-sandbox.json",
  "coverage/notification-resend-sandbox.json",
  "coverage/notification-twilio-sandbox.json",
  "coverage/notification-expo-push-device.json",
  "coverage/notification-persistence.json",
  "coverage/notification-webhook-signature-replay.json",
  "coverage/notification-ci-evidence.json",
  "coverage/notification-secret-safe-artifacts.json",
  "test-results/notification-launch-runtime",
] as const;

const buildRedactedNotificationLaunchValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedNotificationLaunchValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveNotificationLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedNotificationLaunchValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveNotificationLaunchValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildNotificationLaunchExecutionPlan(): NotificationLaunchExecutionPlan {
  return {
    localCommands: notificationLaunchLocalCommands,
    externalCommands: notificationLaunchExternalCommands,
    localArtifacts: notificationLaunchLocalArtifacts,
    externalArtifacts: notificationLaunchExternalArtifacts,
    providerExecutionAllowed: false,
    deviceExecutionAllowed: false,
    ciExecutionAllowed: false,
    databaseExecutionAllowed: false,
    executionPolicy: notificationLaunchExecutionPolicy,
    requiredExternalEvidence: notificationLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedNotificationLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedNotificationLaunchValue(artifact, "", []);
}

export function buildNotificationLaunchArtifactReview(artifact: unknown): NotificationLaunchArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedNotificationLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: notificationLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildNotificationLaunchRunData(input: NotificationLaunchRunRecordInput): NotificationLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: notificationLaunchRuntimeMatrix,
    controlManifest: input.coveredControls,
    artifactManifest: input.capturedArtifacts,
    providerSendManifest: {
      providerSdksConfigured: input.providerSdksConfigured,
      resendSandboxSendPassed: input.resendSandboxSendPassed,
      twilioSandboxSendPassed: input.twilioSandboxSendPassed,
      expoPushDeviceSendPassed: input.expoPushDeviceSendPassed,
    },
    suppressionManifest: {
      preferenceCenterImplemented: input.preferenceCenterImplemented,
      unsubscribeStopSuppressionTested: input.unsubscribeStopSuppressionTested,
      quietHoursRateLimitTested: input.quietHoursRateLimitTested,
      redactionPrivacyReviewPassed: input.redactionPrivacyReviewPassed,
    },
    webhookReplayManifest: {
      signedWebhookVerificationPassed: input.signedWebhookVerificationPassed,
      retryDeadLetterFlowTested: input.retryDeadLetterFlowTested,
      tenantIsolationTestsPassed: input.tenantIsolationTestsPassed,
    },
    notificationsTypecheckPassed: input.notificationsTypecheckPassed,
    notificationsTestsPassed: input.notificationsTestsPassed,
    providerSdksConfigured: input.providerSdksConfigured,
    resendSandboxSendPassed: input.resendSandboxSendPassed,
    twilioSandboxSendPassed: input.twilioSandboxSendPassed,
    expoPushDeviceSendPassed: input.expoPushDeviceSendPassed,
    queueWorkerImplemented: input.queueWorkerImplemented,
    deliveryPersistenceConfigured: input.deliveryPersistenceConfigured,
    providerEventPersistenceConfigured: input.providerEventPersistenceConfigured,
    messageThreadPersistenceConfigured: input.messageThreadPersistenceConfigured,
    messagePersistenceConfigured: input.messagePersistenceConfigured,
    preferenceCenterImplemented: input.preferenceCenterImplemented,
    unsubscribeStopSuppressionTested: input.unsubscribeStopSuppressionTested,
    quietHoursRateLimitTested: input.quietHoursRateLimitTested,
    signedWebhookVerificationPassed: input.signedWebhookVerificationPassed,
    retryDeadLetterFlowTested: input.retryDeadLetterFlowTested,
    tenantIsolationTestsPassed: input.tenantIsolationTestsPassed,
    redactionPrivacyReviewPassed: input.redactionPrivacyReviewPassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    notificationTypecheckArtifactPath: input.notificationTypecheckArtifactPath ?? null,
    notificationTestArtifactPath: input.notificationTestArtifactPath ?? null,
    providerSandboxArtifactPath: input.providerSandboxArtifactPath ?? null,
    resendSandboxArtifactPath: input.resendSandboxArtifactPath ?? null,
    twilioSandboxArtifactPath: input.twilioSandboxArtifactPath ?? null,
    expoPushDeviceArtifactPath: input.expoPushDeviceArtifactPath ?? null,
    queueWorkerArtifactPath: input.queueWorkerArtifactPath ?? null,
    persistenceArtifactPath: input.persistenceArtifactPath ?? null,
    preferenceSuppressionArtifactPath: input.preferenceSuppressionArtifactPath ?? null,
    webhookSignatureReplayArtifactPath: input.webhookSignatureReplayArtifactPath ?? null,
    retryDeadLetterArtifactPath: input.retryDeadLetterArtifactPath ?? null,
    tenantIsolationArtifactPath: input.tenantIsolationArtifactPath ?? null,
    redactionPrivacyArtifactPath: input.redactionPrivacyArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistNotificationLaunchRun(
  repository: NotificationLaunchRunRepository,
  input: NotificationLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildNotificationLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.notificationLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const notificationLaunchRuntimeMatrix = [
  {
    id: "notifications-typecheck",
    command: "pnpm --filter @inkroute/notifications typecheck",
    artifact: "coverage/notification-typecheck.txt",
    status: "wired",
  },
  {
    id: "notifications-tests",
    command: "pnpm --filter @inkroute/notifications test",
    artifact: "coverage/notification-test.txt",
    status: "wired",
  },
  {
    id: "provider-sandbox-sends",
    command: "notification provider sandbox tests",
    artifact: "coverage/notification-provider-sandbox.json",
    status: "provider-gated",
  },
  {
    id: "expo-push-device-smoke",
    command: "Expo push device smoke",
    artifact: "coverage/notification-expo-push-device.json",
    status: "provider-gated",
  },
  {
    id: "queue-worker-retry-dead-letter",
    command: "notification queue worker source contract tests",
    artifact: "coverage/notification-queue-worker.json",
    status: "wired",
  },
  {
    id: "delivery-provider-thread-persistence",
    command: "tenant-scoped NotificationDelivery, ProviderEvent, MessageThread, Message persistence tests",
    artifact: "coverage/notification-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "preference-suppression-quiet-hours",
    command: "preference suppression source contract tests",
    artifact: "coverage/notification-preference-suppression.json",
    status: "wired",
  },
  {
    id: "webhook-signature-replay",
    command: "provider webhook signature/replay tests",
    artifact: "coverage/notification-webhook-signature-replay.json",
    status: "provider-gated",
  },
  {
    id: "tenant-isolation-redaction",
    command: "tenant isolation and redaction/privacy review tests",
    artifact: "coverage/notification-tenant-isolation.json",
    status: "privacy-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions notification launch evidence job",
    artifact: "coverage/notification-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly NotificationLaunchRuntimeMatrixEntry[];

export const notificationLaunchRuntimeReadiness = buildNotificationLaunchEvidencePlan({
  packageScripts: ["typecheck", "test"],
  notificationsTypecheckPassed: false,
  notificationsTestsPassed: false,
  providerSdksConfigured: false,
  resendSandboxSendPassed: false,
  twilioSandboxSendPassed: false,
  expoPushDeviceSendPassed: false,
  queueWorkerImplemented: true,
  deliveryPersistenceConfigured: true,
  providerEventPersistenceConfigured: true,
  messageThreadPersistenceConfigured: true,
  preferenceCenterImplemented: true,
  unsubscribeStopSuppressionTested: true,
  quietHoursRateLimitTested: true,
  signedWebhookVerificationPassed: false,
  retryDeadLetterFlowTested: true,
  tenantIsolationTestsPassed: true,
  redactionPrivacyReviewPassed: true,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export function buildNotificationLaunchDecisionRequiredEvidence(
  readinessEvidence: typeof notificationLaunchRuntimeReadiness.requiredEvidence,
): NotificationLaunchRequiredEvidence {
  return [
    ...readinessEvidence,
    "NotificationLaunchRun row with command, control, artifact, provider send, suppression, and webhook replay matrices.",
    "Artifact bundle proving notification package checks, provider sandbox/device sends, queue worker, delivery/provider/thread/message persistence, preference suppression, webhook signatures, retry/dead-letter, tenant isolation, privacy redaction, CI evidence, and secret-safe artifacts.",
  ];
}

export type NotificationLaunchRequiredEvidence = readonly [
  ...typeof notificationLaunchRuntimeReadiness.requiredEvidence,
  "NotificationLaunchRun row with command, control, artifact, provider send, suppression, and webhook replay matrices.",
  "Artifact bundle proving notification package checks, provider sandbox/device sends, queue worker, delivery/provider/thread/message persistence, preference suppression, webhook signatures, retry/dead-letter, tenant isolation, privacy redaction, CI evidence, and secret-safe artifacts.",
];

export const notificationLaunchRequiredEvidence = buildNotificationLaunchDecisionRequiredEvidence(
  notificationLaunchRuntimeReadiness.requiredEvidence,
);

export function buildNotificationLaunchEvidenceDecision(
  input: NotificationLaunchEvidenceInput,
): NotificationLaunchEvidenceDecision {
  const coveredControls = new Set(input.coveredControls);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingControls = notificationLaunchRuntimeControls.filter((control) => !coveredControls.has(control));
  const missingArtifacts = notificationLaunchArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = notificationLaunchRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildNotificationLaunchEvidencePlan({
    packageScripts: ["typecheck", "test"],
    notificationsTypecheckPassed: input.notificationsTypecheckPassed,
    notificationsTestsPassed: input.notificationsTestsPassed,
    providerSdksConfigured: input.providerSdksConfigured,
    resendSandboxSendPassed: input.resendSandboxSendPassed,
    twilioSandboxSendPassed: input.twilioSandboxSendPassed,
    expoPushDeviceSendPassed: input.expoPushDeviceSendPassed,
    queueWorkerImplemented: input.queueWorkerImplemented,
    deliveryPersistenceConfigured: input.deliveryPersistenceConfigured,
    providerEventPersistenceConfigured: input.providerEventPersistenceConfigured,
    messageThreadPersistenceConfigured: input.messageThreadPersistenceConfigured,
    preferenceCenterImplemented: input.preferenceCenterImplemented,
    unsubscribeStopSuppressionTested: input.unsubscribeStopSuppressionTested,
    quietHoursRateLimitTested: input.quietHoursRateLimitTested,
    signedWebhookVerificationPassed: input.signedWebhookVerificationPassed,
    retryDeadLetterFlowTested: input.retryDeadLetterFlowTested,
    tenantIsolationTestsPassed: input.tenantIsolationTestsPassed,
    redactionPrivacyReviewPassed: input.redactionPrivacyReviewPassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.messagePersistenceConfigured) {
    blockers.push("Message persistence must be configured with tenant scope.");
  }
  if (!input.notificationLaunchRunPersisted) {
    blockers.push("NotificationLaunchRun persistence row must be captured for durable auditability.");
  }
  if (missingControls.length > 0) {
    blockers.push("Every required notification launch control must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required notification launch artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required notification launch command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingControls.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingControls,
    missingArtifacts,
    missingCommands,
    requiredControls: notificationLaunchRuntimeControls,
    requiredArtifacts: notificationLaunchArtifactPaths,
    requiredCommands: notificationLaunchRuntimeCommands,
    requiredEvidence: notificationLaunchRequiredEvidence,
    blockers,
  };
}

