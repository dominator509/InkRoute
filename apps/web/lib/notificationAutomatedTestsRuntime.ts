import { notificationAutomatedTestContract, notificationAutomatedTestSuites } from "./notificationAutomatedTests";

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
