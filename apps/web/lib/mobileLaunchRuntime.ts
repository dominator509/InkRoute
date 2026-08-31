import { buildMobileLaunchEvidencePlan } from "@inkroute/mobile-support";

import { mobileLaunchEvidenceRequiredCommands as canonicalMobileLaunchRuntimeCommands } from "@inkroute/mobile-support";

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

export const mobileLaunchRuntimeCommands = canonicalMobileLaunchRuntimeCommands;

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

export const mobileLaunchRuntimeProofFiles = [
  "apps/mobile/package.json",
  "apps/mobile/app.json",
  "apps/mobile/eas.json",
  "packages/mobile/src/index.ts",
  "packages/mobile/tests/mobile-support.test.ts",
  "testing/manifests/mobile-device-qa-checklist.json",
  "apps/web/lib/mobileLaunchRuntime.ts",
  "apps/web/tests/mobile-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033200_add_mobile_launch_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type MobileLaunchRuntimeCommand = (typeof mobileLaunchRuntimeCommands)[number];
export type MobileLaunchReadinessArea = (typeof mobileLaunchReadinessAreas)[number];
export type MobileLaunchArtifact = (typeof mobileLaunchArtifactPaths)[number];

export const mobileLaunchRuntimeLocalArtifacts = [
  "coverage/mobile-launch-runtime.json",
  "coverage/mobile-support-typecheck.txt",
  "coverage/mobile-support-test.txt",
] as const satisfies readonly MobileLaunchArtifact[];

export const mobileLaunchRuntimeExternalArtifacts = [
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
] as const satisfies readonly MobileLaunchArtifact[];

export interface MobileLaunchEvidenceInput {
  readonly mobileSupportTypecheckPassed: boolean;
  readonly mobileSupportTestsPassed: boolean;
  readonly mobileAppTypecheckPassed: boolean;
  readonly mobileAppTestsPassed: boolean;
  readonly expoRuntimeStarted: boolean;
  readonly iosSimulatorSmokePassed: boolean;
  readonly androidEmulatorSmokePassed: boolean;
  readonly easPreviewBuildPassed: boolean;
  readonly easPreviewUpdatePassed: boolean;
  readonly authSessionBiometricQaPassed: boolean;
  readonly tenantApiClientQaPassed: boolean;
  readonly pushNotificationQaPassed: boolean;
  readonly encryptedOfflineStoreQaPassed: boolean;
  readonly uploadFlowQaPassed: boolean;
  readonly crashReportingQaPassed: boolean;
  readonly otaUpdateRollbackQaPassed: boolean;
  readonly physicalDeviceQaCompleted: boolean;
  readonly accessibilityQaPassed: boolean;
  readonly appJsonProjectConfigured: boolean;
  readonly easChannelsConfigured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly launchArtifactsSecretSafe: boolean;
  readonly mobileLaunchRunPersisted: boolean;
  readonly coveredReadinessAreas: readonly MobileLaunchReadinessArea[];
  readonly capturedArtifacts: readonly MobileLaunchArtifact[];
  readonly completedCommands: readonly MobileLaunchRuntimeCommand[];
}

export interface MobileLaunchRunRecordInput extends MobileLaunchEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly mobileSupportTypecheckArtifactPath?: string | null;
  readonly mobileSupportTestArtifactPath?: string | null;
  readonly mobileAppTypecheckArtifactPath?: string | null;
  readonly mobileAppTestArtifactPath?: string | null;
  readonly expoRuntimeArtifactPath?: string | null;
  readonly iosSimulatorSmokeArtifactPath?: string | null;
  readonly androidEmulatorSmokeArtifactPath?: string | null;
  readonly easPreviewBuildArtifactPath?: string | null;
  readonly easPreviewUpdateArtifactPath?: string | null;
  readonly authApiPushOfflineQaArtifactPath?: string | null;
  readonly uploadCrashOtaQaArtifactPath?: string | null;
  readonly physicalDeviceQaArtifactPath?: string | null;
  readonly accessibilityQaArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface MobileLaunchRunData
  extends Omit<
    MobileLaunchRunRecordInput,
    "coveredReadinessAreas" | "capturedArtifacts" | "completedCommands" | "mobileLaunchRunPersisted"
  > {
  readonly commandMatrix: typeof mobileLaunchRuntimeMatrix;
  readonly readinessAreaManifest: readonly MobileLaunchReadinessArea[];
  readonly artifactManifest: readonly MobileLaunchArtifact[];
  readonly deviceQaManifest: {
    readonly iosSimulatorSmokePassed: boolean;
    readonly androidEmulatorSmokePassed: boolean;
    readonly physicalDeviceQaCompleted: boolean;
    readonly accessibilityQaPassed: boolean;
  };
  readonly providerQaManifest: {
    readonly authSessionBiometricQaPassed: boolean;
    readonly tenantApiClientQaPassed: boolean;
    readonly pushNotificationQaPassed: boolean;
    readonly encryptedOfflineStoreQaPassed: boolean;
    readonly uploadFlowQaPassed: boolean;
    readonly crashReportingQaPassed: boolean;
    readonly otaUpdateRollbackQaPassed: boolean;
  };
  readonly easRuntimeManifest: {
    readonly expoRuntimeStarted: boolean;
    readonly easPreviewBuildPassed: boolean;
    readonly easPreviewUpdatePassed: boolean;
    readonly appJsonProjectConfigured: boolean;
    readonly easChannelsConfigured: boolean;
  };
}

export interface MobileLaunchRunRepository {
  readonly mobileLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: MobileLaunchRunData;
      update: Omit<MobileLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface MobileLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReadinessAreas: readonly MobileLaunchReadinessArea[];
  readonly missingArtifacts: readonly MobileLaunchArtifact[];
  readonly missingCommands: readonly MobileLaunchRuntimeCommand[];
  readonly requiredReadinessAreas: readonly MobileLaunchReadinessArea[];
  readonly requiredArtifacts: typeof mobileLaunchArtifactPaths;
  readonly requiredCommands: typeof mobileLaunchRuntimeCommands;
  readonly requiredEvidence: typeof mobileLaunchRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface MobileLaunchExecutionPlan {
  readonly localCommands: typeof mobileLaunchRuntimeLocalCommands;
  readonly externalCommands: typeof mobileLaunchRuntimeExternalCommands;
  readonly localArtifacts: typeof mobileLaunchRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof mobileLaunchRuntimeExternalArtifacts;
  readonly mobileSupportTypecheckExecutionAllowed: false;
  readonly mobileSupportTestExecutionAllowed: false;
  readonly mobileAppTypecheckExecutionAllowed: false;
  readonly mobileAppTestExecutionAllowed: false;
  readonly expoRuntimeExecutionAllowed: false;
  readonly iosSmokeExecutionAllowed: false;
  readonly androidSmokeExecutionAllowed: false;
  readonly easPreviewBuildExecutionAllowed: false;
  readonly easPreviewUpdateExecutionAllowed: false;
  readonly manualDeviceQaExecutionAllowed: false;
  readonly ciMobileEvidenceExecutionAllowed: false;
  readonly providerBackedPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof mobileLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof mobileLaunchRequiredExternalEvidence;
}

export interface MobileLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof mobileLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const mobileLaunchRuntimeLocalCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
] as const satisfies readonly MobileLaunchRuntimeCommand[];

export const mobileLaunchRuntimeExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
  "GitHub Actions mobile launch evidence job",
] as const satisfies readonly MobileLaunchRuntimeCommand[];

export function buildMobileLaunchRunData(input: MobileLaunchRunRecordInput): MobileLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: mobileLaunchRuntimeMatrix,
    readinessAreaManifest: input.coveredReadinessAreas,
    artifactManifest: input.capturedArtifacts,
    deviceQaManifest: {
      iosSimulatorSmokePassed: input.iosSimulatorSmokePassed,
      androidEmulatorSmokePassed: input.androidEmulatorSmokePassed,
      physicalDeviceQaCompleted: input.physicalDeviceQaCompleted,
      accessibilityQaPassed: input.accessibilityQaPassed,
    },
    providerQaManifest: {
      authSessionBiometricQaPassed: input.authSessionBiometricQaPassed,
      tenantApiClientQaPassed: input.tenantApiClientQaPassed,
      pushNotificationQaPassed: input.pushNotificationQaPassed,
      encryptedOfflineStoreQaPassed: input.encryptedOfflineStoreQaPassed,
      uploadFlowQaPassed: input.uploadFlowQaPassed,
      crashReportingQaPassed: input.crashReportingQaPassed,
      otaUpdateRollbackQaPassed: input.otaUpdateRollbackQaPassed,
    },
    easRuntimeManifest: {
      expoRuntimeStarted: input.expoRuntimeStarted,
      easPreviewBuildPassed: input.easPreviewBuildPassed,
      easPreviewUpdatePassed: input.easPreviewUpdatePassed,
      appJsonProjectConfigured: input.appJsonProjectConfigured,
      easChannelsConfigured: input.easChannelsConfigured,
    },
    mobileSupportTypecheckPassed: input.mobileSupportTypecheckPassed,
    mobileSupportTestsPassed: input.mobileSupportTestsPassed,
    mobileAppTypecheckPassed: input.mobileAppTypecheckPassed,
    mobileAppTestsPassed: input.mobileAppTestsPassed,
    expoRuntimeStarted: input.expoRuntimeStarted,
    iosSimulatorSmokePassed: input.iosSimulatorSmokePassed,
    androidEmulatorSmokePassed: input.androidEmulatorSmokePassed,
    easPreviewBuildPassed: input.easPreviewBuildPassed,
    easPreviewUpdatePassed: input.easPreviewUpdatePassed,
    authSessionBiometricQaPassed: input.authSessionBiometricQaPassed,
    tenantApiClientQaPassed: input.tenantApiClientQaPassed,
    pushNotificationQaPassed: input.pushNotificationQaPassed,
    encryptedOfflineStoreQaPassed: input.encryptedOfflineStoreQaPassed,
    uploadFlowQaPassed: input.uploadFlowQaPassed,
    crashReportingQaPassed: input.crashReportingQaPassed,
    otaUpdateRollbackQaPassed: input.otaUpdateRollbackQaPassed,
    physicalDeviceQaCompleted: input.physicalDeviceQaCompleted,
    accessibilityQaPassed: input.accessibilityQaPassed,
    appJsonProjectConfigured: input.appJsonProjectConfigured,
    easChannelsConfigured: input.easChannelsConfigured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    launchArtifactsSecretSafe: input.launchArtifactsSecretSafe,
    mobileSupportTypecheckArtifactPath: input.mobileSupportTypecheckArtifactPath ?? null,
    mobileSupportTestArtifactPath: input.mobileSupportTestArtifactPath ?? null,
    mobileAppTypecheckArtifactPath: input.mobileAppTypecheckArtifactPath ?? null,
    mobileAppTestArtifactPath: input.mobileAppTestArtifactPath ?? null,
    expoRuntimeArtifactPath: input.expoRuntimeArtifactPath ?? null,
    iosSimulatorSmokeArtifactPath: input.iosSimulatorSmokeArtifactPath ?? null,
    androidEmulatorSmokeArtifactPath: input.androidEmulatorSmokeArtifactPath ?? null,
    easPreviewBuildArtifactPath: input.easPreviewBuildArtifactPath ?? null,
    easPreviewUpdateArtifactPath: input.easPreviewUpdateArtifactPath ?? null,
    authApiPushOfflineQaArtifactPath: input.authApiPushOfflineQaArtifactPath ?? null,
    uploadCrashOtaQaArtifactPath: input.uploadCrashOtaQaArtifactPath ?? null,
    physicalDeviceQaArtifactPath: input.physicalDeviceQaArtifactPath ?? null,
    accessibilityQaArtifactPath: input.accessibilityQaArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistMobileLaunchRun(
  repository: MobileLaunchRunRepository,
  input: MobileLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildMobileLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.mobileLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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

const mobileLaunchRuntimeReadinessPlan = buildMobileLaunchEvidencePlan({
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

export function buildMobileLaunchDecisionRequiredEvidence(
  readinessEvidence: typeof mobileLaunchRuntimeReadinessPlan.requiredEvidence,
): MobileLaunchRequiredEvidence {
  return [
    ...readinessEvidence,
    "MobileLaunchRun row with command, readiness area, artifact, device QA, provider QA, and EAS runtime matrices.",
    "Artifact bundle proving mobile-support/app checks, Expo runtime, iOS/Android smoke, EAS preview build/update, auth/API/push/offline/upload/crash/OTA/accessibility QA, physical-device QA, CI evidence, and secret-safe artifacts.",
  ];
}

export type MobileLaunchRequiredEvidence = readonly [
  ...typeof mobileLaunchRuntimeReadinessPlan.requiredEvidence,
  "MobileLaunchRun row with command, readiness area, artifact, device QA, provider QA, and EAS runtime matrices.",
  "Artifact bundle proving mobile-support/app checks, Expo runtime, iOS/Android smoke, EAS preview build/update, auth/API/push/offline/upload/crash/OTA/accessibility QA, physical-device QA, CI evidence, and secret-safe artifacts.",
];

export const mobileLaunchRequiredEvidence = buildMobileLaunchDecisionRequiredEvidence(
  mobileLaunchRuntimeReadinessPlan.requiredEvidence,
);

export const mobileLaunchRuntimeReadiness = {
  ...mobileLaunchRuntimeReadinessPlan,
  requiredCommands: mobileLaunchRuntimeCommands,
  requiredEvidence: mobileLaunchRequiredEvidence,
};

export function buildMobileLaunchEvidenceDecision(input: MobileLaunchEvidenceInput): MobileLaunchEvidenceDecision {
  const coveredReadinessAreas = new Set(input.coveredReadinessAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReadinessAreas = mobileLaunchReadinessAreas.filter((area) => !coveredReadinessAreas.has(area));
  const missingArtifacts = mobileLaunchArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = mobileLaunchRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildMobileLaunchEvidencePlan({
    packageScripts: {
      typecheck: "expo customize tsconfig && tsc --noEmit",
      test: "vitest run",
      ios: "expo run:ios",
      android: "expo run:android",
    },
    mobileSupportTypecheckPassed: input.mobileSupportTypecheckPassed,
    mobileSupportTestsPassed: input.mobileSupportTestsPassed,
    mobileAppTypecheckPassed: input.mobileAppTypecheckPassed,
    mobileAppTestsPassed: input.mobileAppTestsPassed,
    expoRuntimeStarted: input.expoRuntimeStarted,
    iosSimulatorSmokePassed: input.iosSimulatorSmokePassed,
    androidEmulatorSmokePassed: input.androidEmulatorSmokePassed,
    easPreviewBuildPassed: input.easPreviewBuildPassed,
    authSessionBiometricQaPassed: input.authSessionBiometricQaPassed,
    tenantApiClientQaPassed: input.tenantApiClientQaPassed,
    pushNotificationQaPassed: input.pushNotificationQaPassed,
    encryptedOfflineStoreQaPassed: input.encryptedOfflineStoreQaPassed,
    uploadFlowQaPassed: input.uploadFlowQaPassed,
    crashReportingQaPassed: input.crashReportingQaPassed,
    otaUpdateRollbackQaPassed: input.otaUpdateRollbackQaPassed,
    physicalDeviceQaCompleted: input.physicalDeviceQaCompleted,
    accessibilityQaPassed: input.accessibilityQaPassed,
    appJsonProjectConfigured: input.appJsonProjectConfigured,
    easChannelsConfigured: input.easChannelsConfigured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    launchArtifactsSecretSafe: input.launchArtifactsSecretSafe,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.easPreviewUpdatePassed) {
    blockers.push("EAS preview update must pass on the configured preview channel.");
  }
  if (!input.mobileLaunchRunPersisted) {
    blockers.push("MobileLaunchRun persistence row must be captured for durable auditability.");
  }
  if (missingReadinessAreas.length > 0) {
    blockers.push("Every required mobile launch readiness area must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required mobile launch artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required mobile launch command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingReadinessAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingReadinessAreas,
    missingArtifacts,
    missingCommands,
    requiredReadinessAreas: mobileLaunchReadinessAreas,
    requiredArtifacts: mobileLaunchArtifactPaths,
    requiredCommands: mobileLaunchRuntimeCommands,
    requiredEvidence: mobileLaunchRequiredEvidence,
    blockers,
  };
}

const sensitiveMobileLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|device|expo|eas|push|session|biometric|client|customer|provider|raw|payload|body|stack|error|log|output|env|simulator|emulator|ota|update|rollback|crash|api|offline|auth|route|deep.?link|screenshot|video|trace|artifact|accessibility|secure.?store|native|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitiveMobileLaunchValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:ExpoPushToken\[[^\]]+\]|ExponentPushToken\[[^\]]+\])|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:tenant|client|customer|user|device|session|expo|eas|ota|update|rollback|push|offline|crash|route|api|artifact|workflow|ci|run|commit)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:artifacts|screenshots|videos|traces|private)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactMobileLaunchString = (value: string): string =>
  value.replace(sensitiveMobileLaunchValuePattern, "[REDACTED]");

export const mobileLaunchExecutionPolicy = {
  codexMayClassifyStaticMobileReadiness: true,
  expoRuntimeEvidenceRequiredForClosure: true,
  deviceQaEvidenceRequiredForClosure: true,
  easEvidenceRequiredForClosure: true,
  providerQaEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const mobileLaunchRequiredExternalEvidence = [
  "Mobile app typecheck/test, Expo runtime, iOS simulator, and Android emulator evidence.",
  "EAS preview build, EAS preview update, runtimeVersion/channel policy, and OTA rollback evidence.",
  "Auth/session/biometric, tenant API client, push, encrypted offline store, upload, crash reporting, OTA, physical-device, and accessibility QA artifacts.",
  "GitHub Actions mobile launch evidence job URL and conclusion.",
  "Provider-backed MobileLaunchRun persistence row captured from the target database.",
  "Secret-safe mobile launch artifacts with no credentials, push tokens, device identifiers, client-private data, or raw tenant identifiers.",
] as const;

const buildRedactedMobileLaunchValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedMobileLaunchValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveMobileLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedMobileLaunchValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactMobileLaunchString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildMobileLaunchExecutionPlan(): MobileLaunchExecutionPlan {
  return {
    localCommands: mobileLaunchRuntimeLocalCommands,
    externalCommands: mobileLaunchRuntimeExternalCommands,
    localArtifacts: mobileLaunchRuntimeLocalArtifacts,
    externalArtifacts: mobileLaunchRuntimeExternalArtifacts,
    mobileSupportTypecheckExecutionAllowed: false,
    mobileSupportTestExecutionAllowed: false,
    mobileAppTypecheckExecutionAllowed: false,
    mobileAppTestExecutionAllowed: false,
    expoRuntimeExecutionAllowed: false,
    iosSmokeExecutionAllowed: false,
    androidSmokeExecutionAllowed: false,
    easPreviewBuildExecutionAllowed: false,
    easPreviewUpdateExecutionAllowed: false,
    manualDeviceQaExecutionAllowed: false,
    ciMobileEvidenceExecutionAllowed: false,
    providerBackedPersistenceExecutionAllowed: false,
    executionPolicy: mobileLaunchExecutionPolicy,
    requiredExternalEvidence: mobileLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedMobileLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedMobileLaunchValue(artifact, "", []);
}

export function buildMobileLaunchArtifactReview(artifact: unknown): MobileLaunchArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedMobileLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: mobileLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

