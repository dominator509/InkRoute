import { buildMobileDeviceQaRuntimeReadinessPlan } from "@inkroute/mobile-support";

export type MobileQaRuntimeStatus =
  | "wired"
  | "component-gated"
  | "simulator-gated"
  | "device-gated"
  | "accessibility-gated"
  | "provider-gated"
  | "artifact-gated"
  | "ci-gated";

export interface MobileQaRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileQaRuntimeStatus;
}

export const mobileQaRuntimeCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
] as const;

export const mobileQaArtifactPaths = [
  "coverage/mobile-qa-runtime.json",
  "coverage/mobile-qa-support-typecheck.txt",
  "coverage/mobile-qa-support-test.txt",
  "coverage/mobile-qa-app-typecheck.txt",
  "coverage/mobile-qa-app-test.txt",
  "coverage/mobile-qa-component-render.json",
  "coverage/mobile-qa-ios-simulator-redacted.json",
  "coverage/mobile-qa-android-emulator-redacted.json",
  "coverage/mobile-qa-physical-device-redacted.json",
  "coverage/mobile-qa-accessibility.json",
  "coverage/mobile-qa-offline-reconnect-redacted.json",
  "coverage/mobile-qa-push-redacted.json",
  "coverage/mobile-qa-crash-redacted.json",
  "coverage/mobile-qa-ota-rollback-redacted.json",
  "coverage/mobile-qa-manifest-sync.json",
  "coverage/mobile-qa-ci-hooks.json",
  "coverage/mobile-qa-artifact-retention.json",
  "coverage/mobile-qa-secret-safe-artifacts.json",
  "test-results/mobile-qa-runtime",
] as const;

export const mobileQaRuntimeMatrix = [
  {
    id: "mobile-support-typecheck",
    command: "pnpm --filter @inkroute/mobile-support typecheck",
    artifact: "coverage/mobile-qa-support-typecheck.txt",
    status: "wired",
  },
  {
    id: "mobile-support-tests",
    command: "pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-qa-support-test.txt",
    status: "wired",
  },
  {
    id: "mobile-app-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-qa-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "mobile-static-tests",
    command: "pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-qa-app-test.txt",
    status: "ci-gated",
  },
  {
    id: "expo-component-render",
    command: "add executable Expo component/render tests for every registered screen",
    artifact: "coverage/mobile-qa-component-render.json",
    status: "component-gated",
  },
  {
    id: "ios-screen-smoke",
    command: "pnpm --filter @inkroute/mobile ios",
    artifact: "coverage/mobile-qa-ios-simulator-redacted.json",
    status: "simulator-gated",
  },
  {
    id: "android-screen-smoke",
    command: "pnpm --filter @inkroute/mobile android",
    artifact: "coverage/mobile-qa-android-emulator-redacted.json",
    status: "simulator-gated",
  },
  {
    id: "physical-device-smoke",
    command: "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
    artifact: "coverage/mobile-qa-physical-device-redacted.json",
    status: "device-gated",
  },
  {
    id: "accessibility-pass",
    command: "manual VoiceOver/TalkBack, text scaling, contrast, and touch-target QA",
    artifact: "coverage/mobile-qa-accessibility.json",
    status: "accessibility-gated",
  },
  {
    id: "offline-reconnect-sync",
    command: "manual airplane-mode queue/reconnect QA",
    artifact: "coverage/mobile-qa-offline-reconnect-redacted.json",
    status: "provider-gated",
  },
  {
    id: "push-token-delivery",
    command: "Expo push token registration and test push",
    artifact: "coverage/mobile-qa-push-redacted.json",
    status: "provider-gated",
  },
  {
    id: "mobile-crash-capture",
    command: "forced safe mobile crash in preview build",
    artifact: "coverage/mobile-qa-crash-redacted.json",
    status: "provider-gated",
  },
  {
    id: "ota-preview-rollback",
    command: "eas update --channel preview and rollback republish",
    artifact: "coverage/mobile-qa-ota-rollback-redacted.json",
    status: "provider-gated",
  },
  {
    id: "manifest-sync",
    command: "sync testing/manifests/mobile-device-qa-checklist.json with generated checklist ids",
    artifact: "coverage/mobile-qa-manifest-sync.json",
    status: "wired",
  },
  {
    id: "ci-hooks",
    command: "GitHub Actions mobile QA evidence job",
    artifact: "coverage/mobile-qa-ci-hooks.json",
    status: "ci-gated",
  },
  {
    id: "artifact-retention",
    command: "retain one secret-safe QA artifact bundle per checklist id",
    artifact: "coverage/mobile-qa-artifact-retention.json",
    status: "artifact-gated",
  },
  {
    id: "secret-safe-artifacts",
    command: "review mobile QA evidence for secrets, PII, medical data, payment data, and raw tokens",
    artifact: "coverage/mobile-qa-secret-safe-artifacts.json",
    status: "artifact-gated",
  },
] as const satisfies readonly MobileQaRuntimeMatrixEntry[];

export const mobileQaRuntimeReadiness = buildMobileDeviceQaRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run apps/mobile/tests/**/*.test.ts",
    typecheck: "tsc --noEmit",
    ios: "expo start --ios",
    android: "expo start --android",
  },
  mobileSupportTestsPassed: false,
  mobileSupportTypecheckPassed: false,
  mobileAppTypecheckPassed: false,
  mobileStaticTestsPassed: false,
  expoComponentRenderTestsPassed: false,
  iosSimulatorSmokePassed: false,
  androidEmulatorSmokePassed: false,
  physicalDeviceSmokePassed: false,
  accessibilityChecksPassed: false,
  offlineQaPassed: false,
  pushQaPassed: false,
  crashQaPassed: false,
  otaRollbackQaPassed: false,
  qaManifestSynced: true,
  ciHooksConfigured: false,
  qaArtifactsAttached: false,
});
