import { buildMobileTestingExecutionReadinessPlan } from "./index";

export type MobileTestingExecutionStatus =
  | "wired"
  | "runtime-gated"
  | "device-gated"
  | "provider-gated"
  | "ci-gated";

export interface MobileTestingExecutionMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileTestingExecutionStatus;
}

export const mobileTestingExecutionArtifactPaths = [
  "coverage/mobile-testing-execution.json",
  "coverage/mobile-expo-install.log",
  "coverage/mobile-expo-runtime.log",
  "coverage/mobile-support-typecheck.log",
  "coverage/mobile-support-test-results.json",
  "coverage/mobile-app-typecheck.log",
  "coverage/mobile-static-test-results.json",
  "coverage/mobile-ios-simulator-smoke.json",
  "coverage/mobile-android-emulator-smoke.json",
  "coverage/mobile-physical-device-checklist.json",
  "coverage/mobile-biometric-qa-redacted.json",
  "coverage/mobile-tenant-api-sync-redacted.json",
  "coverage/mobile-offline-reconnect-redacted.json",
  "coverage/mobile-push-delivery-redacted.json",
  "coverage/mobile-crash-capture-redacted.json",
  "coverage/mobile-eas-preview-build-redacted.json",
  "coverage/mobile-eas-update-rollback-redacted.json",
  "coverage/mobile-accessibility-qa.json",
  "coverage/mobile-ci-run-redacted.json",
  "test-results/mobile-testing-execution"
] as const;

export const mobileTestingExecutionCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
  "GitHub Actions mobile testing execution job"
] as const;

export const mobileTestingExecutionChecklistIds = [
  "mobile-static-screen-registry",
  "ios-screen-smoke",
  "android-screen-smoke",
  "biometric-lock-unlock",
  "tenant-api-sync",
  "offline-reconnect-sync",
  "push-token-delivery",
  "mobile-crash-capture",
  "ota-preview-rollback",
  "mobile-accessibility-pass"
] as const;

export const mobileTestingExecutionMatrix: readonly MobileTestingExecutionMatrixEntry[] = [
  {
    id: "support-package-static",
    command: "pnpm --filter @inkroute/mobile-support typecheck && pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-support-test-results.json",
    status: "wired"
  },
  {
    id: "mobile-app-static",
    command: "pnpm --filter @inkroute/mobile typecheck && pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-static-test-results.json",
    status: "wired"
  },
  {
    id: "expo-runtime",
    command: "install Expo dependencies and start Expo runtime",
    artifact: "coverage/mobile-expo-runtime.log",
    status: "runtime-gated"
  },
  {
    id: "ios-simulator-smoke",
    command: "pnpm --filter @inkroute/mobile ios",
    artifact: "coverage/mobile-ios-simulator-smoke.json",
    status: "device-gated"
  },
  {
    id: "android-emulator-smoke",
    command: "pnpm --filter @inkroute/mobile android",
    artifact: "coverage/mobile-android-emulator-smoke.json",
    status: "device-gated"
  },
  {
    id: "physical-device-checklist",
    command: "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
    artifact: "coverage/mobile-physical-device-checklist.json",
    status: "device-gated"
  },
  {
    id: "provider-device-qa",
    command: "run biometric, tenant API, offline reconnect, push, crash, and accessibility QA",
    artifact: "coverage/mobile-tenant-api-sync-redacted.json",
    status: "provider-gated"
  },
  {
    id: "eas-preview-update-rollback",
    command: "eas build --profile preview --platform all && eas update --channel preview",
    artifact: "coverage/mobile-eas-update-rollback-redacted.json",
    status: "provider-gated"
  },
  {
    id: "ci-mobile-artifacts",
    command: "GitHub Actions mobile testing execution job",
    artifact: "coverage/mobile-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const mobileTestingExecutionReadiness = buildMobileTestingExecutionReadinessPlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run apps/mobile/tests/**/*.test.ts",
    ios: "expo start --ios",
    android: "expo start --android"
  },
  mobileSupportTestsPassed: false,
  mobileSupportTypecheckPassed: false,
  mobileAppTypecheckPassed: false,
  mobileStaticTestsPassed: false,
  expoDependenciesInstalled: false,
  expoRuntimeStarted: false,
  iosSimulatorSmokePassed: false,
  androidEmulatorSmokePassed: false,
  physicalDeviceChecklistCompleted: false,
  biometricLockQaPassed: false,
  tenantApiSyncQaPassed: false,
  offlineReconnectQaPassed: false,
  pushTokenDeliveryQaPassed: false,
  crashCaptureQaPassed: false,
  easPreviewBuildPassed: false,
  easUpdateRollbackPassed: false,
  accessibilityQaPassed: false,
  qaChecklistManifestSynced: true,
  artifactsCaptured: false,
  ciMobileChecksPassed: false
});
