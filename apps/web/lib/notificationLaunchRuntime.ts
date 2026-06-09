import { buildNotificationLaunchEvidencePlan } from "@inkroute/notifications";

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
  "notification queue worker integration tests",
  "provider webhook signature/replay tests",
  "message thread/preference suppression integration tests",
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
    command: "notification queue worker integration tests",
    artifact: "coverage/notification-queue-worker.json",
    status: "queue-gated",
  },
  {
    id: "delivery-provider-thread-persistence",
    command: "tenant-scoped NotificationDelivery, ProviderEvent, MessageThread, Message persistence tests",
    artifact: "coverage/notification-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "preference-suppression-quiet-hours",
    command: "message thread/preference suppression integration tests",
    artifact: "coverage/notification-preference-suppression.json",
    status: "privacy-gated",
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
  queueWorkerImplemented: false,
  deliveryPersistenceConfigured: false,
  providerEventPersistenceConfigured: false,
  messageThreadPersistenceConfigured: false,
  preferenceCenterImplemented: false,
  unsubscribeStopSuppressionTested: false,
  quietHoursRateLimitTested: false,
  signedWebhookVerificationPassed: false,
  retryDeadLetterFlowTested: false,
  tenantIsolationTestsPassed: false,
  redactionPrivacyReviewPassed: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
