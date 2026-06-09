import { buildExpoPushProviderRuntimeReadinessPlan } from "@inkroute/notifications";

export type MobilePushRuntimeStatus =
  | "wired"
  | "credential-gated"
  | "persistence-gated"
  | "worker-gated"
  | "device-gated"
  | "ci-gated";

export interface MobilePushRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobilePushRuntimeStatus;
}

export const mobilePushRuntimeCommands = [
  "pnpm --filter @inkroute/notifications typecheck",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/mobile typecheck",
  "Expo push send smoke test against a real device token",
  "Expo receipt polling smoke test",
  "iOS foreground/background/tap push QA",
  "Android foreground/background/tap push QA",
] as const;

export const mobilePushArtifactPaths = [
  "coverage/mobile-push-runtime.json",
  "coverage/mobile-push-notifications-typecheck.txt",
  "coverage/mobile-push-notifications-test.txt",
  "coverage/mobile-push-app-typecheck.txt",
  "coverage/mobile-push-expo-project-redacted.json",
  "coverage/mobile-push-native-credentials-redacted.json",
  "coverage/mobile-push-token-persistence.json",
  "coverage/mobile-push-opt-out-persistence.json",
  "coverage/mobile-push-delivery-worker.json",
  "coverage/mobile-push-delivery-log-persistence.json",
  "coverage/mobile-push-provider-event-persistence.json",
  "coverage/mobile-push-notification-interaction.json",
  "coverage/mobile-push-audit-log.json",
  "coverage/mobile-push-receipt-worker.json",
  "coverage/mobile-push-invalid-token-suppression.json",
  "coverage/mobile-push-tap-routing.json",
  "coverage/mobile-push-ios-device-qa-redacted.json",
  "coverage/mobile-push-android-device-qa-redacted.json",
  "coverage/mobile-push-secret-safe-artifacts.json",
  "test-results/mobile-push-runtime",
] as const;

export const mobilePushRuntimeMatrix = [
  {
    id: "notifications-typecheck",
    command: "pnpm --filter @inkroute/notifications typecheck",
    artifact: "coverage/mobile-push-notifications-typecheck.txt",
    status: "wired",
  },
  {
    id: "notifications-tests",
    command: "pnpm --filter @inkroute/notifications test",
    artifact: "coverage/mobile-push-notifications-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-push-app-typecheck.txt",
    status: "device-gated",
  },
  {
    id: "expo-project-credentials",
    command: "configure Expo project id, access token, APNs, and FCM credentials",
    artifact: "coverage/mobile-push-expo-project-redacted.json",
    status: "credential-gated",
  },
  {
    id: "token-optout-persistence",
    command: "persist tenant/user/device push tokens and opt-out state",
    artifact: "coverage/mobile-push-token-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "delivery-worker-log",
    command: "Expo push send smoke test against a real device token",
    artifact: "coverage/mobile-push-delivery-worker.json",
    status: "worker-gated",
  },
  {
    id: "provider-event-persistence",
    command: "persist Expo ProviderEvent receipt reconciliation records",
    artifact: "coverage/mobile-push-provider-event-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "notification-interaction-persistence",
    command: "persist NotificationInteraction tap/open records",
    artifact: "coverage/mobile-push-notification-interaction.json",
    status: "persistence-gated",
  },
  {
    id: "audit-log-persistence",
    command: "persist mobile push audit log records",
    artifact: "coverage/mobile-push-audit-log.json",
    status: "persistence-gated",
  },
  {
    id: "receipt-worker-invalid-token",
    command: "Expo receipt polling smoke test",
    artifact: "coverage/mobile-push-invalid-token-suppression.json",
    status: "worker-gated",
  },
  {
    id: "safe-tap-routing",
    command: "mobile push tap deep-link routing smoke",
    artifact: "coverage/mobile-push-tap-routing.json",
    status: "wired",
  },
  {
    id: "ios-device-qa",
    command: "iOS foreground/background/tap push QA",
    artifact: "coverage/mobile-push-ios-device-qa-redacted.json",
    status: "device-gated",
  },
  {
    id: "android-device-qa",
    command: "Android foreground/background/tap push QA",
    artifact: "coverage/mobile-push-android-device-qa-redacted.json",
    status: "device-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile push evidence job",
    artifact: "coverage/mobile-push-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobilePushRuntimeMatrixEntry[];

export const mobilePushRuntimeReadiness = buildExpoPushProviderRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  notificationTestsPassed: false,
  notificationTypecheckPassed: false,
  mobileTypecheckPassed: false,
  expoProjectIdConfigured: false,
  expoAccessTokenConfigured: false,
  nativePushCredentialsConfigured: false,
  permissionRuntimeImplemented: true,
  tokenRegistrationRuntimeImplemented: true,
  pushTokenPersistenceAvailable: false,
  optOutPersistenceAvailable: false,
  deliveryWorkerConfigured: false,
  deliveryLogPersistenceAvailable: false,
  auditLogPersistenceAvailable: false,
  expoSendSmokePassed: false,
  receiptWorkerConfigured: false,
  receiptReplayProtectionAvailable: true,
  invalidTokenSuppressionPersistenceAvailable: false,
  deepLinkHandlerImplemented: true,
  foregroundDeviceQaPassed: false,
  backgroundDeviceQaPassed: false,
  tapNavigationDeviceQaPassed: false,
});
