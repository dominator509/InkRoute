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

export interface MobileTestingRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string;
  status: "blocked" | "running" | "passed" | "failed" | "device_gated" | "provider_gated";
  executionMatrix: readonly MobileTestingExecutionMatrixEntry[];
  checklistIds: readonly string[];
  artifactManifest: readonly string[];
  mobileSupportTypecheckPassed: boolean;
  mobileSupportTestsPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileStaticTestsPassed: boolean;
  expoDependenciesInstalled: boolean;
  expoRuntimeStarted: boolean;
  iosSimulatorSmokePassed: boolean;
  androidEmulatorSmokePassed: boolean;
  physicalDeviceChecklistCompleted: boolean;
  biometricQaPassed: boolean;
  tenantApiSyncQaPassed: boolean;
  offlineReconnectQaPassed: boolean;
  pushDeliveryQaPassed: boolean;
  crashCaptureQaPassed: boolean;
  easPreviewBuildPassed: boolean;
  easUpdateRollbackPassed: boolean;
  accessibilityQaPassed: boolean;
  ciMobileChecksPassed: boolean;
  ciRunUrl?: string;
}

export interface MobileTestingRunPersistenceContract {
  modelName: "MobileTestingRun";
  row: MobileTestingRunPersistenceInput;
  transactionWrites: readonly ["MobileTestingRun", "AuditLog"];
  requiredMobileFlags: readonly [
    "mobileSupportTypecheckPassed",
    "mobileSupportTestsPassed",
    "mobileAppTypecheckPassed",
    "mobileStaticTestsPassed",
    "expoDependenciesInstalled",
    "expoRuntimeStarted",
    "iosSimulatorSmokePassed",
    "androidEmulatorSmokePassed",
    "physicalDeviceChecklistCompleted",
    "biometricQaPassed",
    "tenantApiSyncQaPassed",
    "offlineReconnectQaPassed",
    "pushDeliveryQaPassed",
    "crashCaptureQaPassed",
    "easPreviewBuildPassed",
    "easUpdateRollbackPassed",
    "accessibilityQaPassed",
    "ciMobileChecksPassed",
  ];
  artifactFields: readonly ["executionMatrix", "checklistIds", "artifactManifest"];
  tenantIsolationKey: "tenantId";
}

export type MobileTestingRunData = MobileTestingRunPersistenceInput & {
  commitSha: string | null;
  ciRunUrl: string | null;
};

export interface MobileTestingRunRepository {
  readonly mobileTestingRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: MobileTestingRunData;
      update: MobileTestingRunData;
    }): unknown;
  };
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

export const mobileTestingExecutionLocalArtifacts = [
  "coverage/mobile-testing-execution.json",
  "coverage/mobile-support-typecheck.log",
  "coverage/mobile-support-test-results.json",
  "coverage/mobile-app-typecheck.log",
  "coverage/mobile-static-test-results.json",
  "test-results/mobile-testing-execution",
] as const satisfies readonly MobileTestingExecutionArtifact[];

export const mobileTestingExecutionExternalArtifacts = [
  "coverage/mobile-expo-install.log",
  "coverage/mobile-expo-runtime.log",
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
] as const satisfies readonly MobileTestingExecutionArtifact[];

export const mobileTestingExecutionProofFiles = [
  "packages/mobile/src/mobile-testing-execution.ts",
  "packages/mobile/src/index.ts",
  "packages/mobile/tests/mobile-testing-execution-static.test.ts",
  "packages/mobile/tests/mobile-support.test.ts",
  "apps/mobile/package.json",
  "apps/mobile/tests/mobile-static.test.ts",
  "apps/mobile/tests/mobile-security-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609011000_add_mobile_testing_runs/migration.sql",
  "testing/manifests/mobile-device-qa-checklist.json",
  "testing/manifests/unit-test-manifest.json",
  "testing/scripts/verify-test-manifest.mjs",
  ".github/workflows/ci.yml",
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
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
  "GitHub Actions mobile testing execution job"
] as const;

export const mobileTestingExecutionRequiredExternalEvidence = [
  "Expo dependency install and runtime startup proof",
  "iOS simulator and Android emulator smoke proof",
  "Physical-device QA checklist proof",
  "Biometric/API/offline/push/crash/accessibility QA proof",
  "EAS preview build and rollback proof",
  "CI mobile checks proof",
  "Provider-backed MobileTestingRun persistence proof",
] as const;

export type MobileTestingExecutionArtifact = (typeof mobileTestingExecutionArtifactPaths)[number];

export type MobileTestingExecutionCommand = (typeof mobileTestingExecutionCommands)[number];

export const mobileTestingExecutionLocalCommands = mobileTestingExecutionCommands.slice(0, 4);

export const mobileTestingExecutionExternalCommands = mobileTestingExecutionCommands.slice(4);

export type MobileTestingExecutionPolicy = {
  localStaticAndSupportOnly: true;
  expoRuntimeRequiresExternalEvidence: true;
  simulatorRequiresExternalEvidence: true;
  physicalDeviceRequiresExternalEvidence: true;
  providerQaRequiresExternalEvidence: true;
  easRequiresExternalEvidence: true;
  ciMobileRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof mobileTestingExecutionRequiredExternalEvidence;
};

export type MobileTestingExecutionEvidenceInput = {
  mobileSupportTypecheckPassed: boolean;
  mobileSupportTestsPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileStaticTestsPassed: boolean;
  expoDependenciesInstalled: boolean;
  expoRuntimeStarted: boolean;
  iosSimulatorSmokePassed: boolean;
  androidEmulatorSmokePassed: boolean;
  physicalDeviceChecklistCompleted: boolean;
  biometricQaPassed: boolean;
  tenantApiSyncQaPassed: boolean;
  offlineReconnectQaPassed: boolean;
  pushDeliveryQaPassed: boolean;
  crashCaptureQaPassed: boolean;
  easPreviewBuildPassed: boolean;
  easUpdateRollbackPassed: boolean;
  accessibilityQaPassed: boolean;
  ciMobileChecksPassed: boolean;
  requiredCommandsRun: readonly MobileTestingExecutionCommand[];
  capturedArtifacts: readonly MobileTestingExecutionArtifact[];
};

export type MobileTestingExecutionEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: MobileTestingExecutionArtifact[];
  requiredCommands: typeof mobileTestingExecutionCommands;
  requiredEvidence: typeof mobileTestingExecutionArtifactPaths;
  mobilePolicy: {
    physicalDeviceQaRequired: true;
    providerTranscriptsRedacted: true;
    easRollbackProofRequired: true;
  };
};

export type MobileTestingExecutionPlan = {
  status: "local-plan-ready";
  policy: MobileTestingExecutionPolicy;
  externalEvidenceRequired: typeof mobileTestingExecutionRequiredExternalEvidence;
  expoRuntimeExecutionAllowed: false;
  simulatorExecutionAllowed: false;
  physicalDeviceExecutionAllowed: false;
  providerQaExecutionAllowed: false;
  easExecutionAllowed: false;
  ciMobileExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof mobileTestingExecutionLocalCommands;
  externalCommands: typeof mobileTestingExecutionExternalCommands;
  localArtifacts: typeof mobileTestingExecutionLocalArtifacts;
  externalArtifacts: typeof mobileTestingExecutionExternalArtifacts;
  disabledReasons: readonly string[];
};

export const mobileTestingExecutionPolicy: MobileTestingExecutionPolicy = {
  localStaticAndSupportOnly: true,
  expoRuntimeRequiresExternalEvidence: true,
  simulatorRequiresExternalEvidence: true,
  physicalDeviceRequiresExternalEvidence: true,
  providerQaRequiresExternalEvidence: true,
  easRequiresExternalEvidence: true,
  ciMobileRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: mobileTestingExecutionRequiredExternalEvidence,
};

export type MobileTestingArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof mobileTestingExecutionArtifactPaths;
  retainedExternalGates: readonly string[];
};

const mobileTestingSensitivePatterns = [
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(device[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(push[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(expo[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(eas[_-]?token['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedMobileTestingArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return mobileTestingSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedMobileTestingArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /email|phone|token|secret|authorization|credential|password|rawBody|stack|ciRunUrl|commitSha|runId|deviceId|pushToken|expo|eas|crashPayload|apiTranscript/i.test(key)
          ? "[REDACTED]"
          : buildRedactedMobileTestingArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildMobileTestingExecutionPlan(): MobileTestingExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: mobileTestingExecutionPolicy,
    externalEvidenceRequired: mobileTestingExecutionRequiredExternalEvidence,
    expoRuntimeExecutionAllowed: false,
    simulatorExecutionAllowed: false,
    physicalDeviceExecutionAllowed: false,
    providerQaExecutionAllowed: false,
    easExecutionAllowed: false,
    ciMobileExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: mobileTestingExecutionLocalCommands,
    externalCommands: mobileTestingExecutionExternalCommands,
    localArtifacts: mobileTestingExecutionLocalArtifacts,
    externalArtifacts: mobileTestingExecutionExternalArtifacts,
    disabledReasons: [
      "Expo dependency install and runtime proof require local Expo execution.",
      "iOS simulator and Android emulator proof require device runtime execution.",
      "Physical-device QA requires real device interaction and checklist completion.",
      "Provider QA for API sync, push, crash, and OTA requires provider/device evidence.",
      "EAS preview build and rollback proof require Expo/EAS provider execution.",
      "MobileTestingRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildMobileTestingArtifactReview(rawArtifact: unknown): MobileTestingArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedMobileTestingArtifact(rawArtifact),
    requiredArtifacts: mobileTestingExecutionArtifactPaths,
    retainedExternalGates: [
      "Expo dependency install and runtime startup proof",
      "iOS simulator and Android emulator smoke proof",
      "Physical-device QA checklist proof",
      "Biometric/API/offline/push/crash/accessibility QA proof",
      "EAS preview build and rollback proof",
      "CI mobile checks proof",
      "Provider-backed MobileTestingRun persistence proof",
    ],
  };
}

export function buildMobileTestingExecutionEvidenceDecision(
  input: MobileTestingExecutionEvidenceInput,
): MobileTestingExecutionEvidenceDecision {
  const blockers = [
    !input.mobileSupportTypecheckPassed && "Run mobile-support typecheck.",
    !input.mobileSupportTestsPassed && "Run mobile-support tests.",
    !input.mobileAppTypecheckPassed && "Run mobile app typecheck.",
    !input.mobileStaticTestsPassed && "Run mobile app static/security tests.",
    !input.expoDependenciesInstalled && "Install Expo mobile dependencies.",
    !input.expoRuntimeStarted && "Start Expo runtime.",
    !input.iosSimulatorSmokePassed && "Run iOS simulator smoke.",
    !input.androidEmulatorSmokePassed && "Run Android emulator smoke.",
    !input.physicalDeviceChecklistCompleted && "Complete physical-device QA checklist.",
    !input.biometricQaPassed && "Capture biometric lock/unlock QA proof.",
    !input.tenantApiSyncQaPassed && "Capture tenant API sync QA proof.",
    !input.offlineReconnectQaPassed && "Capture offline reconnect QA proof.",
    !input.pushDeliveryQaPassed && "Capture push delivery QA proof.",
    !input.crashCaptureQaPassed && "Capture crash capture QA proof.",
    !input.easPreviewBuildPassed && "Run EAS preview build.",
    !input.easUpdateRollbackPassed && "Capture EAS update rollback proof.",
    !input.accessibilityQaPassed && "Capture mobile accessibility QA proof.",
    !input.ciMobileChecksPassed && "Capture CI mobile checks proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = mobileTestingExecutionArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = mobileTestingExecutionCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: mobileTestingExecutionCommands,
    requiredEvidence: mobileTestingExecutionArtifactPaths,
    mobilePolicy: {
      physicalDeviceQaRequired: true,
      providerTranscriptsRedacted: true,
      easRollbackProofRequired: true,
    },
  };
}

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
    command: "eas build --profile preview --platform all && eas update --channel preview && eas update --channel preview --message rollback-republish-drill --non-interactive",
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

export function buildMobileTestingRunPersistenceContract(
  input: MobileTestingRunPersistenceInput,
): MobileTestingRunPersistenceContract {
  return {
    modelName: "MobileTestingRun",
    row: input,
    transactionWrites: ["MobileTestingRun", "AuditLog"],
    requiredMobileFlags: [
      "mobileSupportTypecheckPassed",
      "mobileSupportTestsPassed",
      "mobileAppTypecheckPassed",
      "mobileStaticTestsPassed",
      "expoDependenciesInstalled",
      "expoRuntimeStarted",
      "iosSimulatorSmokePassed",
      "androidEmulatorSmokePassed",
      "physicalDeviceChecklistCompleted",
      "biometricQaPassed",
      "tenantApiSyncQaPassed",
      "offlineReconnectQaPassed",
      "pushDeliveryQaPassed",
      "crashCaptureQaPassed",
      "easPreviewBuildPassed",
      "easUpdateRollbackPassed",
      "accessibilityQaPassed",
      "ciMobileChecksPassed",
    ],
    artifactFields: ["executionMatrix", "checklistIds", "artifactManifest"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildMobileTestingRunData(input: MobileTestingRunPersistenceInput): MobileTestingRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistMobileTestingRun(
  repository: MobileTestingRunRepository,
  input: MobileTestingRunPersistenceInput,
): unknown {
  const data = buildMobileTestingRunData(input);

  return repository.mobileTestingRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

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

export const mobileTestingRunPersistencePreview = buildMobileTestingRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "mobile-testing-demo",
  status: "device_gated",
  executionMatrix: mobileTestingExecutionMatrix,
  checklistIds: mobileTestingExecutionChecklistIds,
  artifactManifest: mobileTestingExecutionArtifactPaths,
  mobileSupportTypecheckPassed: false,
  mobileSupportTestsPassed: false,
  mobileAppTypecheckPassed: false,
  mobileStaticTestsPassed: false,
  expoDependenciesInstalled: false,
  expoRuntimeStarted: false,
  iosSimulatorSmokePassed: false,
  androidEmulatorSmokePassed: false,
  physicalDeviceChecklistCompleted: false,
  biometricQaPassed: false,
  tenantApiSyncQaPassed: false,
  offlineReconnectQaPassed: false,
  pushDeliveryQaPassed: false,
  crashCaptureQaPassed: false,
  easPreviewBuildPassed: false,
  easUpdateRollbackPassed: false,
  accessibilityQaPassed: false,
  ciMobileChecksPassed: false,
});
