import {
  buildNotificationAutomationArtifactReview,
  buildNotificationAutomatedTestExecutionPlan,
  buildRedactedNotificationAutomationArtifact,
  notificationAutomatedTestContract,
  notificationAutomatedTestRequiredArtifacts,
  notificationAutomatedTestSuites,
} from "./notificationAutomatedTests";

export {
  buildNotificationAutomationArtifactReview,
  buildNotificationAutomatedTestExecutionPlan,
  buildRedactedNotificationAutomationArtifact,
  notificationAutomatedTestRequiredArtifacts,
};

export type NotificationAutomationRuntimeStatus =
  | "wired"
  | "queue-gated"
  | "playwright-gated"
  | "mobile-gated"
  | "provider-gated"
  | "persistence-gated"
  | "e2e-gated"
  | "ci-gated";

export interface NotificationAutomationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: NotificationAutomationRuntimeStatus;
}

export interface NotificationAutomationExecutionPolicy {
  readonly codexMayClassifyStaticNotificationAutomationReadiness: boolean;
  readonly localPackageAndRouteEvidenceRequiredForClosure: boolean;
  readonly queueIntegrationRequiredForClosure: boolean;
  readonly dashboardPlaywrightRequiredForClosure: boolean;
  readonly mobileDeviceQaRequiredForClosure: boolean;
  readonly providerSandboxRequiredForClosure: boolean;
  readonly preferenceStopRetentionRequiredForClosure: boolean;
  readonly bookingDepositAftercareTravelE2eRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface NotificationAutomationExecutionPlan {
  readonly policy: typeof notificationAutomationExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly queueExecutionAllowed: false;
  readonly playwrightExecutionAllowed: false;
  readonly mobileDeviceExecutionAllowed: false;
  readonly providerSandboxExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly e2eExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof notificationAutomationLocalCommands;
  readonly externalCommands: typeof notificationAutomationExternalCommands;
  readonly requiredExternalEvidence: typeof notificationAutomationRequiredExternalEvidence;
  readonly suitePlan: ReturnType<typeof buildNotificationAutomatedTestExecutionPlan>;
}

export const notificationAutomationExecutionPolicy = {
  codexMayClassifyStaticNotificationAutomationReadiness: true,
  localPackageAndRouteEvidenceRequiredForClosure: true,
  queueIntegrationRequiredForClosure: true,
  dashboardPlaywrightRequiredForClosure: true,
  mobileDeviceQaRequiredForClosure: true,
  providerSandboxRequiredForClosure: true,
  preferenceStopRetentionRequiredForClosure: true,
  bookingDepositAftercareTravelE2eRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies NotificationAutomationExecutionPolicy;

export const notificationAutomationRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
  "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
  "notification queue integration test command",
  "Playwright dashboard templates/messages smoke tests",
  "Expo iOS/Android push device QA",
  "provider sandbox email/SMS/push receipt tests",
  "booking-to-deposit/aftercare/travel notification E2E tests",
] as const;

export const notificationAutomationLocalCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm vitest run apps/web/tests/notification-automation-runtime-static.test.ts apps/web/tests/notification-automation-static.test.ts apps/web/tests/notification-messaging-routes.test.ts apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
] as const;

export const notificationAutomationExternalCommands = [
  "notification queue integration test command",
  "Playwright dashboard templates/messages smoke tests",
  "Expo iOS/Android push device QA",
  "provider sandbox email/SMS/push receipt tests",
  "preference opt-out persistence tests",
  "SMS STOP persistence tests",
  "retention/export/delete integration tests",
  "booking-to-deposit/aftercare/travel notification E2E tests",
  "GitHub Actions notification/messaging lifecycle job",
  "secret-safe notification automation artifact review",
] as const;

export const notificationAutomationRequiredExternalEvidence = [
  "actual notification automation command output",
  "notification queue integration test evidence",
  "dashboard Playwright templates/messages smoke evidence",
  "mobile notification smoke evidence",
  "Expo iOS/Android push device QA evidence",
  "provider sandbox email/SMS/push receipt evidence",
  "preference opt-out and SMS STOP persistence evidence",
  "retention/export/delete integration evidence",
  "booking/deposit/aftercare/travel notification E2E evidence",
  "CI Phase 9 notification automation artifacts",
  "secret-safe notification automation artifact review",
] as const;

export const buildNotificationAutomationExecutionPlan = (): NotificationAutomationExecutionPlan => ({
  policy: notificationAutomationExecutionPolicy,
  commandExecutionAllowed: false,
  queueExecutionAllowed: false,
  playwrightExecutionAllowed: false,
  mobileDeviceExecutionAllowed: false,
  providerSandboxExecutionAllowed: false,
  persistenceExecutionAllowed: false,
  e2eExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: notificationAutomationLocalCommands,
  externalCommands: notificationAutomationExternalCommands,
  requiredExternalEvidence: notificationAutomationRequiredExternalEvidence,
  suitePlan: buildNotificationAutomatedTestExecutionPlan(),
});

export const notificationAutomationArtifactPaths = [
  "coverage/notification-automation-runtime.json",
  "coverage/notification-automation-notifications-typecheck.txt",
  "coverage/notification-automation-notifications-test.txt",
  "coverage/notification-automation-public-routes.json",
  "coverage/notification-automation-provider-webhook-routes.json",
  "coverage/notification-automation-queue-integration.json",
  "coverage/notification-automation-dashboard-template-smoke-redacted.json",
  "coverage/notification-automation-dashboard-message-smoke-redacted.json",
  "coverage/notification-automation-mobile-smoke.json",
  "coverage/notification-automation-expo-device-qa-redacted.json",
  "coverage/notification-automation-provider-email-redacted.json",
  "coverage/notification-automation-provider-sms-redacted.json",
  "coverage/notification-automation-provider-push-receipt-redacted.json",
  "coverage/notification-automation-preference-opt-out.json",
  "coverage/notification-automation-sms-stop.json",
  "coverage/notification-automation-retention-export-delete.json",
  "coverage/notification-automation-booking-deposit-e2e-redacted.json",
  "coverage/notification-automation-aftercare-e2e-redacted.json",
  "coverage/notification-automation-travel-waitlist-e2e-redacted.json",
  "coverage/notification-automation-ci-evidence.json",
  "coverage/notification-automation-secret-safe-artifacts.json",
  "test-results/notification-automation-runtime",
] as const;

export const notificationAutomationRuntimeProofFiles = [
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "apps/web/lib/notificationAutomatedTests.ts",
  "apps/web/lib/notificationAutomatedTestsRuntime.ts",
  "apps/web/tests/notification-automation-static.test.ts",
  "apps/web/tests/notification-automation-runtime-static.test.ts",
  "apps/web/tests/notification-messaging-routes.test.ts",
  "apps/web/tests/provider-webhook-routes.test.ts",
  "apps/web/tests/provider-webhook-contracts.test.ts",
  "apps/web/tests/preference-center-static.test.ts",
  "apps/dashboard/tests/notification-scheduler-static.test.ts",
  "apps/dashboard/tests/notification-persistence-static.test.ts",
  "apps/dashboard/tests/messaging-privacy-static.test.ts",
  "apps/mobile/tests/mobile-push-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type NotificationAutomationEvidenceArtifact = (typeof notificationAutomationArtifactPaths)[number];

export interface NotificationAutomationEvidenceInput {
  readonly notificationsTypecheckPassed: boolean;
  readonly notificationsTestsPassed: boolean;
  readonly publicRoutesPassed: boolean;
  readonly providerWebhookRoutesPassed: boolean;
  readonly queueIntegrationPassed: boolean;
  readonly dashboardTemplateSmokePassed: boolean;
  readonly dashboardMessageSmokePassed: boolean;
  readonly mobileNotificationSmokePassed: boolean;
  readonly expoDeviceQaPassed: boolean;
  readonly providerEmailSandboxPassed: boolean;
  readonly providerSmsSandboxPassed: boolean;
  readonly providerPushReceiptSandboxPassed: boolean;
  readonly preferenceOptOutPersistencePassed: boolean;
  readonly smsStopPersistencePassed: boolean;
  readonly retentionExportDeletePassed: boolean;
  readonly bookingDepositE2ePassed: boolean;
  readonly aftercareE2ePassed: boolean;
  readonly travelWaitlistE2ePassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly NotificationAutomationEvidenceArtifact[];
}

export interface NotificationAutomationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly NotificationAutomationEvidenceArtifact[];
  readonly requiredCommands: typeof notificationAutomationRuntimeCommands;
  readonly requiredEvidence: typeof notificationAutomationDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const notificationAutomationDecisionRequiredEvidence = [
  "queue, opt-out, STOP, and retention/export/delete integration test evidence",
  "dashboard/mobile smoke and Expo device QA evidence",
  "email, SMS, and push provider sandbox evidence",
  "booking, deposit, aftercare, and travel notification E2E evidence",
  "CI Phase 9 notification job and published artifact evidence",
  "secret-safe review of retained notification automation artifacts",
] as const;

export const buildNotificationAutomationEvidenceDecision = (
  input: NotificationAutomationEvidenceInput,
): NotificationAutomationEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = notificationAutomationArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.notificationsTypecheckPassed ? ["Notifications package typecheck evidence is missing."] : []),
    ...(!input.notificationsTestsPassed ? ["Notifications package test evidence is missing."] : []),
    ...(!input.publicRoutesPassed ? ["Public notification route evidence is missing."] : []),
    ...(!input.providerWebhookRoutesPassed ? ["Provider webhook route evidence is missing."] : []),
    ...(!input.queueIntegrationPassed ? ["Notification queue integration evidence is missing."] : []),
    ...(!input.dashboardTemplateSmokePassed ? ["Dashboard template Playwright smoke evidence is missing."] : []),
    ...(!input.dashboardMessageSmokePassed ? ["Dashboard message Playwright smoke evidence is missing."] : []),
    ...(!input.mobileNotificationSmokePassed ? ["Mobile notification smoke evidence is missing."] : []),
    ...(!input.expoDeviceQaPassed ? ["Expo iOS/Android push device QA evidence is missing."] : []),
    ...(!input.providerEmailSandboxPassed ? ["Email provider sandbox evidence is missing."] : []),
    ...(!input.providerSmsSandboxPassed ? ["SMS provider sandbox evidence is missing."] : []),
    ...(!input.providerPushReceiptSandboxPassed ? ["Push receipt provider sandbox evidence is missing."] : []),
    ...(!input.preferenceOptOutPersistencePassed ? ["Preference opt-out persistence evidence is missing."] : []),
    ...(!input.smsStopPersistencePassed ? ["SMS STOP persistence evidence is missing."] : []),
    ...(!input.retentionExportDeletePassed ? ["Retention/export/delete integration evidence is missing."] : []),
    ...(!input.bookingDepositE2ePassed ? ["Booking-to-deposit notification E2E evidence is missing."] : []),
    ...(!input.aftercareE2ePassed ? ["Aftercare notification E2E evidence is missing."] : []),
    ...(!input.travelWaitlistE2ePassed ? ["Travel waitlist notification E2E evidence is missing."] : []),
    ...(!input.ciEvidenceCaptured ? ["Phase 9 notification automation CI evidence is missing."] : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe notification automation artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All notification automation artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: notificationAutomationRuntimeCommands,
    requiredEvidence: notificationAutomationDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: notificationAutomationArtifactPaths.length,
    },
  };
};

export const notificationAutomationRuntimeMatrix = [
  { id: "notifications-typecheck", command: "pnpm --filter @inkroute/notifications typecheck", artifact: "coverage/notification-automation-notifications-typecheck.txt", status: "wired" },
  { id: "notifications-tests", command: "pnpm --filter @inkroute/notifications test", artifact: "coverage/notification-automation-notifications-test.txt", status: "wired" },
  { id: "public-routes", command: "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts", artifact: "coverage/notification-automation-public-routes.json", status: "wired" },
  { id: "provider-webhook-routes", command: "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts", artifact: "coverage/notification-automation-provider-webhook-routes.json", status: "wired" },
  { id: "queue-integration", command: "notification queue integration test command", artifact: "coverage/notification-automation-queue-integration.json", status: "queue-gated" },
  { id: "dashboard-template-smoke", command: "Playwright dashboard templates smoke test", artifact: "coverage/notification-automation-dashboard-template-smoke-redacted.json", status: "playwright-gated" },
  { id: "dashboard-message-smoke", command: "Playwright dashboard messages smoke test", artifact: "coverage/notification-automation-dashboard-message-smoke-redacted.json", status: "playwright-gated" },
  { id: "mobile-notification-smoke", command: "mobile notification smoke tests", artifact: "coverage/notification-automation-mobile-smoke.json", status: "mobile-gated" },
  { id: "expo-device-qa", command: "Expo iOS/Android push device QA", artifact: "coverage/notification-automation-expo-device-qa-redacted.json", status: "mobile-gated" },
  { id: "provider-email", command: "provider sandbox email tests", artifact: "coverage/notification-automation-provider-email-redacted.json", status: "provider-gated" },
  { id: "provider-sms", command: "provider sandbox SMS tests", artifact: "coverage/notification-automation-provider-sms-redacted.json", status: "provider-gated" },
  { id: "provider-push-receipt", command: "provider sandbox push receipt tests", artifact: "coverage/notification-automation-provider-push-receipt-redacted.json", status: "provider-gated" },
  { id: "preference-opt-out", command: "preference opt-out persistence tests", artifact: "coverage/notification-automation-preference-opt-out.json", status: "persistence-gated" },
  { id: "sms-stop", command: "SMS STOP persistence tests", artifact: "coverage/notification-automation-sms-stop.json", status: "persistence-gated" },
  { id: "retention-export-delete", command: "message retention/export/delete integration tests", artifact: "coverage/notification-automation-retention-export-delete.json", status: "persistence-gated" },
  { id: "booking-deposit-e2e", command: "booking-to-deposit notification E2E tests", artifact: "coverage/notification-automation-booking-deposit-e2e-redacted.json", status: "e2e-gated" },
  { id: "aftercare-e2e", command: "booking-to-aftercare notification E2E tests", artifact: "coverage/notification-automation-aftercare-e2e-redacted.json", status: "e2e-gated" },
  { id: "travel-waitlist-e2e", command: "travel waitlist notification E2E tests", artifact: "coverage/notification-automation-travel-waitlist-e2e-redacted.json", status: "e2e-gated" },
  { id: "ci-phase9-notification-job", command: "GitHub Actions notification/messaging lifecycle job", artifact: "coverage/notification-automation-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "review notification automation artifacts for provider tokens, destinations, message bodies, PII, and secrets", artifact: "coverage/notification-automation-secret-safe-artifacts.json", status: "ci-gated" },
] as const satisfies readonly NotificationAutomationRuntimeMatrixEntry[];

export const notificationAutomationRuntimeReadiness = notificationAutomatedTestContract;
export const notificationAutomationRuntimeSuiteIds = notificationAutomatedTestSuites.map((suite) => suite.id);


