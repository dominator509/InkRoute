import { buildMobileLaunchEvidencePlan } from "@inkroute/mobile-support";

export type MobileLaunchRuntimeStatus =
  | "wired"
  | "expo-gated"
  | "device-gated"
  | "provider-gated"
  | "ci-gated";

export interface MobileLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileLaunchRuntimeStatus;
}

export interface MobileLaunchRunPersistenceContract {
  readonly model: "MobileLaunchRun";
  readonly tenantRelation: "mobileLaunchRuns";
  readonly migration: "20260609033200_add_mobile_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "deviceQaManifest",
    "providerQaManifest",
    "easRuntimeManifest",
  ];
  readonly evidenceBooleans: readonly [
    "mobileSupportTypecheckPassed",
    "mobileSupportTestsPassed",
    "mobileAppTypecheckPassed",
    "mobileAppTestsPassed",
    "expoRuntimeStarted",
    "iosSimulatorSmokePassed",
    "androidEmulatorSmokePassed",
    "easPreviewBuildPassed",
    "easPreviewUpdatePassed",
    "authSessionBiometricQaPassed",
    "tenantApiClientQaPassed",
    "pushNotificationQaPassed",
    "encryptedOfflineStoreQaPassed",
    "uploadFlowQaPassed",
    "crashReportingQaPassed",
    "otaUpdateRollbackQaPassed",
    "physicalDeviceQaCompleted",
    "accessibilityQaPassed",
    "appJsonProjectConfigured",
    "easChannelsConfigured",
    "ciEvidenceCaptured",
    "launchArtifactsSecretSafe",
  ];
  readonly artifactFields: readonly [
    "mobileSupportTypecheckArtifactPath",
    "mobileSupportTestArtifactPath",
    "mobileAppTypecheckArtifactPath",
    "mobileAppTestArtifactPath",
    "expoRuntimeArtifactPath",
    "iosSimulatorSmokeArtifactPath",
    "androidEmulatorSmokeArtifactPath",
    "easPreviewBuildArtifactPath",
    "easPreviewUpdateArtifactPath",
    "authApiPushOfflineQaArtifactPath",
    "uploadCrashOtaQaArtifactPath",
    "physicalDeviceQaArtifactPath",
    "accessibilityQaArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const mobileLaunchRunPersistenceContract: MobileLaunchRunPersistenceContract = {
  model: "MobileLaunchRun",
  tenantRelation: "mobileLaunchRuns",
  migration: "20260609033200_add_mobile_launch_runs",
  jsonFields: [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "deviceQaManifest",
    "providerQaManifest",
    "easRuntimeManifest",
  ],
  evidenceBooleans: [
    "mobileSupportTypecheckPassed",
    "mobileSupportTestsPassed",
    "mobileAppTypecheckPassed",
    "mobileAppTestsPassed",
    "expoRuntimeStarted",
    "iosSimulatorSmokePassed",
    "androidEmulatorSmokePassed",
    "easPreviewBuildPassed",
    "easPreviewUpdatePassed",
    "authSessionBiometricQaPassed",
    "tenantApiClientQaPassed",
    "pushNotificationQaPassed",
    "encryptedOfflineStoreQaPassed",
    "uploadFlowQaPassed",
    "crashReportingQaPassed",
    "otaUpdateRollbackQaPassed",
    "physicalDeviceQaCompleted",
    "accessibilityQaPassed",
    "appJsonProjectConfigured",
    "easChannelsConfigured",
    "ciEvidenceCaptured",
    "launchArtifactsSecretSafe",
  ],
  artifactFields: [
    "mobileSupportTypecheckArtifactPath",
    "mobileSupportTestArtifactPath",
    "mobileAppTypecheckArtifactPath",
    "mobileAppTestArtifactPath",
    "expoRuntimeArtifactPath",
    "iosSimulatorSmokeArtifactPath",
    "androidEmulatorSmokeArtifactPath",
    "easPreviewBuildArtifactPath",
    "easPreviewUpdateArtifactPath",
    "authApiPushOfflineQaArtifactPath",
    "uploadCrashOtaQaArtifactPath",
    "physicalDeviceQaArtifactPath",
    "accessibilityQaArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const mobileLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
  "GitHub Actions mobile launch evidence job",
] as const;

export const mobileLaunchReadinessAreas = [
  "mobile-support-typecheck-test",
  "mobile-app-typecheck-test",
  "expo-runtime-start",
  "ios-simulator-smoke",
  "android-emulator-smoke",
  "eas-preview-build",
  "auth-session-biometric-qa",
  "tenant-api-client-qa",
  "push-notification-qa",
  "encrypted-offline-store-qa",
  "upload-flow-qa",
  "crash-reporting-qa",
  "ota-update-rollback-qa",
  "physical-device-qa",
  "accessibility-qa",
  "app-json-project-config",
  "eas-channels-runtime-policy",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const mobileLaunchArtifactPaths = [
  "coverage/mobile-launch-runtime.json",
  "coverage/mobile-support-typecheck.txt",
  "coverage/mobile-support-test.txt",
  "coverage/mobile-app-typecheck.txt",
  "coverage/mobile-app-test.txt",
  "coverage/mobile-expo-runtime.json",
  "coverage/mobile-ios-simulator-smoke.json",
  "coverage/mobile-android-emulator-smoke.json",
  "coverage/mobile-eas-preview-build.json",
  "coverage/mobile-eas-preview-update.json",
  "coverage/mobile-auth-api-push-offline-qa.json",
  "coverage/mobile-upload-crash-ota-qa.json",
  "coverage/mobile-physical-device-qa.json",
  "coverage/mobile-accessibility-qa.json",
  "coverage/mobile-ci-evidence.json",
  "coverage/mobile-secret-safe-artifacts.json",
  "test-results/mobile-launch-runtime",
] as const;

export const mobileLaunchRuntimeMatrix = [
  {
    id: "mobile-support-typecheck",
    command: "pnpm --filter @inkroute/mobile-support typecheck",
    artifact: "coverage/mobile-support-typecheck.txt",
    status: "wired",
  },
  {
    id: "mobile-support-tests",
    command: "pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-support-test.txt",
    status: "wired",
  },
  {
    id: "mobile-app-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-app-typecheck.txt",
    status: "expo-gated",
  },
  {
    id: "mobile-app-tests",
    command: "pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-app-test.txt",
    status: "expo-gated",
  },
  {
    id: "expo-runtime",
    command: "start Expo runtime locally or from preview build",
    artifact: "coverage/mobile-expo-runtime.json",
    status: "expo-gated",
  },
  {
    id: "ios-android-smoke",
    command: "pnpm --filter @inkroute/mobile ios && pnpm --filter @inkroute/mobile android",
    artifact: "coverage/mobile-ios-simulator-smoke.json",
    status: "device-gated",
  },
  {
    id: "eas-preview-build-update",
    command: "eas build --profile preview --platform all && eas update --channel preview",
    artifact: "coverage/mobile-eas-preview-build.json",
    status: "expo-gated",
  },
  {
    id: "auth-api-push-offline-qa",
    command: "auth/session/biometric, tenant API, push, and encrypted offline QA",
    artifact: "coverage/mobile-auth-api-push-offline-qa.json",
    status: "provider-gated",
  },
  {
    id: "upload-crash-ota-qa",
    command: "upload, crash reporting, and OTA rollback QA",
    artifact: "coverage/mobile-upload-crash-ota-qa.json",
    status: "provider-gated",
  },
  {
    id: "physical-device-accessibility-qa",
    command: "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
    artifact: "coverage/mobile-physical-device-qa.json",
    status: "device-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions mobile launch evidence job",
    artifact: "coverage/mobile-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileLaunchRuntimeMatrixEntry[];

export const mobileLaunchRuntimeReadiness = buildMobileLaunchEvidencePlan({
  packageScripts: {
    typecheck: "expo customize tsconfig && tsc --noEmit",
    test: "vitest run",
    ios: "expo run:ios",
    android: "expo run:android",
  },
  mobileSupportTypecheckPassed: false,
  mobileSupportTestsPassed: false,
  mobileAppTypecheckPassed: false,
  mobileAppTestsPassed: false,
  expoRuntimeStarted: false,
  iosSimulatorSmokePassed: false,
  androidEmulatorSmokePassed: false,
  easPreviewBuildPassed: false,
  authSessionBiometricQaPassed: false,
  tenantApiClientQaPassed: false,
  pushNotificationQaPassed: false,
  encryptedOfflineStoreQaPassed: false,
  uploadFlowQaPassed: false,
  crashReportingQaPassed: false,
  otaUpdateRollbackQaPassed: false,
  physicalDeviceQaCompleted: false,
  accessibilityQaPassed: false,
  appJsonProjectConfigured: false,
  easChannelsConfigured: false,
  ciEvidenceCaptured: false,
  launchArtifactsSecretSafe: false,
});
