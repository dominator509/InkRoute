import { buildMobileDeploymentRuntimeReadinessPlan } from "@inkroute/deployment";

export type MobileDeploymentRuntimeStatus =
  | "wired"
  | "eas-gated"
  | "credential-gated"
  | "device-gated"
  | "store-gated"
  | "ci-gated";

export interface MobileDeploymentRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileDeploymentRuntimeStatus;
}

export interface MobileDeploymentRunPersistenceContract {
  readonly prismaModel: "MobileDeploymentRun";
  readonly tenantRelation: "mobileDeploymentRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["buildProfileMatrix", "qaEvidenceMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "easDevelopmentBuildPassed",
    "easPreviewIosBuildPassed",
    "easPreviewAndroidBuildPassed",
    "easProductionIosBuildPassed",
    "easProductionAndroidBuildPassed",
    "easChannelsConfigured",
    "nativeCredentialsConfigured",
    "pushCredentialsConfigured",
    "deviceQaPassed",
    "pushTokenSmokePassed",
    "sentryCrashCapturePassed",
    "otaPreviewPublishPassed",
    "otaRollbackRehearsed",
    "runtimePolicyParityVerified",
    "storeReadinessReviewed",
    "redactedBuildArtifactsRecorded",
    "ciMobileDeploymentArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "redactedBuildArtifactPath",
    "deviceQaArtifactPath",
    "otaRollbackArtifactPath",
    "storeReadinessArtifactPath"
  ];
}

export const mobileDeploymentRuntimeArtifactPaths = [
  "coverage/mobile-deployment-runtime.json",
  "coverage/mobile-deployment-verifier.json",
  "coverage/mobile-eas-development-build-redacted.json",
  "coverage/mobile-eas-preview-build-redacted.json",
  "coverage/mobile-eas-production-build-redacted.json",
  "coverage/mobile-ios-build-redacted.json",
  "coverage/mobile-android-build-redacted.json",
  "coverage/mobile-device-qa-checklist-redacted.json",
  "coverage/mobile-push-token-smoke-redacted.json",
  "coverage/mobile-sentry-crash-capture-redacted.json",
  "coverage/mobile-ota-rollback-redacted.json",
  "coverage/mobile-runtime-policy.json",
  "coverage/mobile-native-credentials-redacted.json",
  "coverage/mobile-store-readiness-redacted.json",
  "coverage/mobile-deployment-ci-run-redacted.json",
  "test-results/mobile-deployment-runtime"
] as const;

export const mobileDeploymentRuntimeProofFiles = [
  "apps/web/lib/mobileDeploymentRuntime.ts",
  "apps/web/tests/mobile-deployment-runtime-static.test.ts",
  "apps/mobile/eas.json",
  "apps/mobile/app.json",
  "deployment/MOBILE_BUILD_GUIDE.md",
  "deployment/manifests/mobile-deployment-evidence.json",
  "deployment/scripts/verify-mobile-deployment.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  "packages/releases/src/index.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609019000_add_mobile_deployment_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const mobileDeploymentRuntimeCommands = [
  "pnpm deploy:verify-mobile",
  "eas build --profile development",
  "eas build --profile preview --platform ios",
  "eas build --profile preview --platform android",
  "eas build --profile production --platform ios",
  "eas build --profile production --platform android",
  "eas update --channel preview",
  "mobile device QA checklist",
  "mobile push token smoke",
  "mobile synthetic crash capture",
  "OTA rollback rehearsal",
  "verify native signing credentials outside source control",
  "review App Store Connect and Google Play readiness labels",
  "record redacted mobile build artifact labels",
  "capture CI mobile deployment artifacts"
] as const;

export const mobileDeploymentRuntimeRequiredExternalEvidence = [
  "EAS build, OTA update, and rollback artifacts must be captured outside Codex with build URLs, tokens, and project IDs redacted.",
  "Native signing credentials, push credentials, device identifiers, and store-console proof must never be committed.",
  "Device QA, push token, and crash-capture artifacts must redact device IDs, user data, Sentry project labels, and contact data.",
  "MobileDeploymentRun persistence must execute only against an approved provider-backed database.",
] as const;

export type MobileDeploymentRuntimeExecutionPolicy = {
  readonly codexMayClassifyRuntimePolicyAndLabels: true;
  readonly easProjectRequiredForBuilds: true;
  readonly physicalOrEmulatedDeviceRequiredForQa: true;
  readonly nativeCredentialsMustStayOutsideSourceControl: true;
  readonly storeConsolesRequiredForReadiness: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const mobileDeploymentRuntimeExecutionPolicy: MobileDeploymentRuntimeExecutionPolicy = {
  codexMayClassifyRuntimePolicyAndLabels: true,
  easProjectRequiredForBuilds: true,
  physicalOrEmulatedDeviceRequiredForQa: true,
  nativeCredentialsMustStayOutsideSourceControl: true,
  storeConsolesRequiredForReadiness: true,
  providerDatabaseRequiredForPersistence: true,
};

export type MobileDeploymentRuntimeArtifact = (typeof mobileDeploymentRuntimeArtifactPaths)[number];

export type MobileDeploymentRuntimeCommand = (typeof mobileDeploymentRuntimeCommands)[number];

export const mobileDeploymentRuntimeLocalArtifacts = [
  "coverage/mobile-deployment-runtime.json",
  "coverage/mobile-deployment-verifier.json",
  "coverage/mobile-runtime-policy.json",
  "test-results/mobile-deployment-runtime",
] as const satisfies readonly MobileDeploymentRuntimeArtifact[];

export const mobileDeploymentRuntimeExternalArtifacts = [
  "coverage/mobile-eas-development-build-redacted.json",
  "coverage/mobile-eas-preview-build-redacted.json",
  "coverage/mobile-eas-production-build-redacted.json",
  "coverage/mobile-ios-build-redacted.json",
  "coverage/mobile-android-build-redacted.json",
  "coverage/mobile-device-qa-checklist-redacted.json",
  "coverage/mobile-push-token-smoke-redacted.json",
  "coverage/mobile-sentry-crash-capture-redacted.json",
  "coverage/mobile-ota-rollback-redacted.json",
  "coverage/mobile-native-credentials-redacted.json",
  "coverage/mobile-store-readiness-redacted.json",
  "coverage/mobile-deployment-ci-run-redacted.json",
] as const satisfies readonly MobileDeploymentRuntimeArtifact[];

export const mobileDeploymentRuntimeLocalCommands = [
  "pnpm deploy:verify-mobile",
  "record redacted mobile build artifact labels",
] as const satisfies readonly MobileDeploymentRuntimeCommand[];

export const mobileDeploymentRuntimeExternalCommands = [
  "eas build --profile development",
  "eas build --profile preview --platform ios",
  "eas build --profile preview --platform android",
  "eas build --profile production --platform ios",
  "eas build --profile production --platform android",
  "eas update --channel preview",
  "mobile device QA checklist",
  "mobile push token smoke",
  "mobile synthetic crash capture",
  "OTA rollback rehearsal",
  "verify native signing credentials outside source control",
  "review App Store Connect and Google Play readiness labels",
  "capture CI mobile deployment artifacts",
] as const satisfies readonly MobileDeploymentRuntimeCommand[];

export type MobileDeploymentRuntimeEvidenceInput = {
  verifierPassed: boolean;
  easDevelopmentBuildPassed: boolean;
  easPreviewIosBuildPassed: boolean;
  easPreviewAndroidBuildPassed: boolean;
  easProductionIosBuildPassed: boolean;
  easProductionAndroidBuildPassed: boolean;
  easChannelsConfigured: boolean;
  nativeCredentialsConfigured: boolean;
  pushCredentialsConfigured: boolean;
  deviceQaPassed: boolean;
  pushTokenSmokePassed: boolean;
  sentryCrashCapturePassed: boolean;
  otaPreviewPublishPassed: boolean;
  otaRollbackRehearsed: boolean;
  runtimePolicyParityVerified: boolean;
  storeReadinessReviewed: boolean;
  redactedBuildArtifactsRecorded: boolean;
  ciMobileDeploymentArtifactsCaptured: boolean;
  requiredCommandsRun: readonly MobileDeploymentRuntimeCommand[];
  capturedArtifacts: readonly MobileDeploymentRuntimeArtifact[];
};

export type MobileDeploymentRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: MobileDeploymentRuntimeArtifact[];
  requiredCommands: typeof mobileDeploymentRuntimeCommands;
  requiredEvidence: typeof mobileDeploymentRuntimeArtifactPaths;
  mobileDeploymentPolicy: {
    nativeCredentialsRequired: true;
    otaRollbackProofRequired: true;
    redactedBuildArtifactsOnly: true;
  };
};

export interface MobileDeploymentRuntimeExecutionPlan {
  readonly localCommands: typeof mobileDeploymentRuntimeLocalCommands;
  readonly externalCommands: typeof mobileDeploymentRuntimeExternalCommands;
  readonly localArtifacts: typeof mobileDeploymentRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof mobileDeploymentRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly easBuildExecutionAllowed: false;
  readonly easUpdateExecutionAllowed: false;
  readonly deviceQaExecutionAllowed: false;
  readonly pushTokenExecutionAllowed: false;
  readonly crashCaptureExecutionAllowed: false;
  readonly otaRollbackExecutionAllowed: false;
  readonly nativeCredentialExecutionAllowed: false;
  readonly storeReadinessExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof mobileDeploymentRuntimeExecutionPolicy;
}

export interface MobileDeploymentRuntimeArtifactReview {
  readonly artifactPath: MobileDeploymentRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof mobileDeploymentRuntimeRequiredExternalEvidence;
}

const sensitiveMobileDeploymentKeyPattern =
  /(token|secret|password|authorization|cookie|credential|provisioning|certificate|keystore|store|appStore|playStore|eas|expo|sentry|push|device|installUrl|buildUrl|otaUrl|ciRunUrl|projectId|tenantId|userId|runId|email|phone|udid|bundleId|packageName|raw|payload|body|stack|error|log|output|env|database|dsn|artifact|screenshot|video|trace|ota|update|rollback|runtime|channel|profile|buildId|submission|native|accessibility|qa|crash|repository|repo|branch|pull|pr|reviewer|codeowner)/i;

const sensitiveMobileDeploymentStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DSN]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|whsec)_(?:live|test)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|project|build|device|eas|expo|sentry|ota|run|update|submission|appstore|playstore|provisioning|certificate|keystore|bundle|package|profile|channel|workflow|ci|commit|repository|repo|branch|pull|pr|reviewer|codeowner)_[A-Za-z0-9_.-]+\b/gi, "[REDACTED_ID]"],
  [/\b(?:com\.[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+\.mobile)\b/g, "[REDACTED_PACKAGE]"],
  [/\b(?:artifacts|screenshots|videos|traces|private)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED_ARTIFACT_PATH]"],
];

export type MobileDeploymentRunRecordInput = MobileDeploymentRuntimeEvidenceInput & {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: MobileDeploymentRuntimeEvidenceDecision["status"];
  buildProfileMatrix: unknown;
  qaEvidenceMatrix: unknown;
  artifactManifest: unknown;
  redactedBuildArtifactPath?: string | null;
  deviceQaArtifactPath?: string | null;
  otaRollbackArtifactPath?: string | null;
  storeReadinessArtifactPath?: string | null;
  ciRunUrl?: string | null;
};

export type MobileDeploymentRunData = Omit<MobileDeploymentRunRecordInput, "requiredCommandsRun" | "capturedArtifacts">;

export interface MobileDeploymentRunRepository {
  readonly mobileDeploymentRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: MobileDeploymentRunData;
      update: MobileDeploymentRunData;
    }): unknown;
  };
}

export function buildMobileDeploymentRunData(input: MobileDeploymentRunRecordInput): MobileDeploymentRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    buildProfileMatrix: input.buildProfileMatrix,
    qaEvidenceMatrix: input.qaEvidenceMatrix,
    artifactManifest: input.artifactManifest,
    verifierPassed: input.verifierPassed,
    easDevelopmentBuildPassed: input.easDevelopmentBuildPassed,
    easPreviewIosBuildPassed: input.easPreviewIosBuildPassed,
    easPreviewAndroidBuildPassed: input.easPreviewAndroidBuildPassed,
    easProductionIosBuildPassed: input.easProductionIosBuildPassed,
    easProductionAndroidBuildPassed: input.easProductionAndroidBuildPassed,
    easChannelsConfigured: input.easChannelsConfigured,
    nativeCredentialsConfigured: input.nativeCredentialsConfigured,
    pushCredentialsConfigured: input.pushCredentialsConfigured,
    deviceQaPassed: input.deviceQaPassed,
    pushTokenSmokePassed: input.pushTokenSmokePassed,
    sentryCrashCapturePassed: input.sentryCrashCapturePassed,
    otaPreviewPublishPassed: input.otaPreviewPublishPassed,
    otaRollbackRehearsed: input.otaRollbackRehearsed,
    runtimePolicyParityVerified: input.runtimePolicyParityVerified,
    storeReadinessReviewed: input.storeReadinessReviewed,
    redactedBuildArtifactsRecorded: input.redactedBuildArtifactsRecorded,
    ciMobileDeploymentArtifactsCaptured: input.ciMobileDeploymentArtifactsCaptured,
    redactedBuildArtifactPath: input.redactedBuildArtifactPath ?? null,
    deviceQaArtifactPath: input.deviceQaArtifactPath ?? null,
    otaRollbackArtifactPath: input.otaRollbackArtifactPath ?? null,
    storeReadinessArtifactPath: input.storeReadinessArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistMobileDeploymentRun(
  repository: MobileDeploymentRunRepository,
  input: MobileDeploymentRunRecordInput,
): unknown {
  const data = buildMobileDeploymentRunData(input);

  return repository.mobileDeploymentRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

export function buildMobileDeploymentRuntimeEvidenceDecision(
  input: MobileDeploymentRuntimeEvidenceInput,
): MobileDeploymentRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run mobile deployment verifier.",
    !input.easDevelopmentBuildPassed && "Capture EAS development build proof.",
    !input.easPreviewIosBuildPassed && "Capture EAS preview iOS build proof.",
    !input.easPreviewAndroidBuildPassed && "Capture EAS preview Android build proof.",
    !input.easProductionIosBuildPassed && "Capture EAS production iOS build proof.",
    !input.easProductionAndroidBuildPassed && "Capture EAS production Android build proof.",
    !input.easChannelsConfigured && "Configure EAS development, preview, and production channels.",
    !input.nativeCredentialsConfigured && "Capture native signing credential proof.",
    !input.pushCredentialsConfigured && "Capture push credential proof.",
    !input.deviceQaPassed && "Complete mobile device QA.",
    !input.pushTokenSmokePassed && "Capture mobile push token smoke proof.",
    !input.sentryCrashCapturePassed && "Capture Sentry mobile crash proof.",
    !input.otaPreviewPublishPassed && "Capture OTA preview publish proof.",
    !input.otaRollbackRehearsed && "Capture OTA rollback rehearsal proof.",
    !input.runtimePolicyParityVerified && "Verify runtime policy parity.",
    !input.storeReadinessReviewed && "Capture mobile store readiness review proof.",
    !input.redactedBuildArtifactsRecorded && "Record redacted build artifacts.",
    !input.ciMobileDeploymentArtifactsCaptured && "Capture CI mobile deployment artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = mobileDeploymentRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = mobileDeploymentRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: mobileDeploymentRuntimeCommands,
    requiredEvidence: mobileDeploymentRuntimeArtifactPaths,
    mobileDeploymentPolicy: {
      nativeCredentialsRequired: true,
      otaRollbackProofRequired: true,
      redactedBuildArtifactsOnly: true,
    },
  };
}

export function buildMobileDeploymentRuntimeExecutionPlan(): MobileDeploymentRuntimeExecutionPlan {
  return {
    localCommands: mobileDeploymentRuntimeLocalCommands,
    externalCommands: mobileDeploymentRuntimeExternalCommands,
    localArtifacts: mobileDeploymentRuntimeLocalArtifacts,
    externalArtifacts: mobileDeploymentRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    easBuildExecutionAllowed: false,
    easUpdateExecutionAllowed: false,
    deviceQaExecutionAllowed: false,
    pushTokenExecutionAllowed: false,
    crashCaptureExecutionAllowed: false,
    otaRollbackExecutionAllowed: false,
    nativeCredentialExecutionAllowed: false,
    storeReadinessExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: mobileDeploymentRuntimeExecutionPolicy,
  };
}

function redactMobileDeploymentString(value: string, redactions: Set<string>): string {
  return sensitiveMobileDeploymentStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactMobileDeploymentValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveMobileDeploymentKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactMobileDeploymentString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactMobileDeploymentValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactMobileDeploymentValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedMobileDeploymentArtifact(artifact: unknown): unknown {
  return redactMobileDeploymentValue(artifact, new Set<string>());
}

export function buildMobileDeploymentRuntimeArtifactReview(
  artifactPath: MobileDeploymentRuntimeArtifact | string,
  artifact: unknown,
): MobileDeploymentRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactMobileDeploymentValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: mobileDeploymentRuntimeRequiredExternalEvidence,
  };
}

export const mobileDeploymentRuntimeMatrix: readonly MobileDeploymentRuntimeMatrixEntry[] = [
  {
    id: "deployment-evidence-verifier",
    command: "pnpm deploy:verify-mobile",
    artifact: "coverage/mobile-deployment-verifier.json",
    status: "wired"
  },
  {
    id: "development-build",
    command: "eas build --profile development",
    artifact: "coverage/mobile-eas-development-build-redacted.json",
    status: "eas-gated"
  },
  {
    id: "preview-ios-build",
    command: "eas build --profile preview --platform ios",
    artifact: "coverage/mobile-ios-build-redacted.json",
    status: "eas-gated"
  },
  {
    id: "preview-android-build",
    command: "eas build --profile preview --platform android",
    artifact: "coverage/mobile-android-build-redacted.json",
    status: "eas-gated"
  },
  {
    id: "production-ios-build",
    command: "eas build --profile production --platform ios",
    artifact: "coverage/mobile-ios-build-redacted.json",
    status: "store-gated"
  },
  {
    id: "production-android-build",
    command: "eas build --profile production --platform android",
    artifact: "coverage/mobile-android-build-redacted.json",
    status: "store-gated"
  },
  {
    id: "device-qa",
    command: "mobile device QA checklist",
    artifact: "coverage/mobile-device-qa-checklist-redacted.json",
    status: "device-gated"
  },
  {
    id: "push-token-smoke",
    command: "mobile push token smoke",
    artifact: "coverage/mobile-push-token-smoke-redacted.json",
    status: "device-gated"
  },
  {
    id: "sentry-crash-capture",
    command: "mobile synthetic crash capture",
    artifact: "coverage/mobile-sentry-crash-capture-redacted.json",
    status: "device-gated"
  },
  {
    id: "ota-preview-publish",
    command: "eas update --channel preview",
    artifact: "coverage/mobile-ota-rollback-redacted.json",
    status: "eas-gated"
  },
  {
    id: "ota-rollback-rehearsal",
    command: "OTA rollback rehearsal",
    artifact: "coverage/mobile-ota-rollback-redacted.json",
    status: "eas-gated"
  },
  {
    id: "runtime-policy-parity",
    command: "verify mobile runtime policy parity",
    artifact: "coverage/mobile-runtime-policy.json",
    status: "wired"
  },
  {
    id: "native-credentials",
    command: "verify native signing credentials outside source control",
    artifact: "coverage/mobile-native-credentials-redacted.json",
    status: "credential-gated"
  },
  {
    id: "store-readiness",
    command: "review App Store Connect and Google Play readiness labels",
    artifact: "coverage/mobile-store-readiness-redacted.json",
    status: "store-gated"
  },
  {
    id: "redacted-build-artifacts",
    command: "record redacted mobile build artifact labels",
    artifact: "coverage/mobile-eas-preview-build-redacted.json",
    status: "eas-gated"
  },
  {
    id: "ci-mobile-deployment-artifacts",
    command: "capture CI mobile deployment artifacts",
    artifact: "coverage/mobile-deployment-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const mobileDeploymentRunPersistenceContract: MobileDeploymentRunPersistenceContract = {
  prismaModel: "MobileDeploymentRun",
  tenantRelation: "mobileDeploymentRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["buildProfileMatrix", "qaEvidenceMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "easDevelopmentBuildPassed",
    "easPreviewIosBuildPassed",
    "easPreviewAndroidBuildPassed",
    "easProductionIosBuildPassed",
    "easProductionAndroidBuildPassed",
    "easChannelsConfigured",
    "nativeCredentialsConfigured",
    "pushCredentialsConfigured",
    "deviceQaPassed",
    "pushTokenSmokePassed",
    "sentryCrashCapturePassed",
    "otaPreviewPublishPassed",
    "otaRollbackRehearsed",
    "runtimePolicyParityVerified",
    "storeReadinessReviewed",
    "redactedBuildArtifactsRecorded",
    "ciMobileDeploymentArtifactsCaptured"
  ],
  redactedArtifactFields: [
    "redactedBuildArtifactPath",
    "deviceQaArtifactPath",
    "otaRollbackArtifactPath",
    "storeReadinessArtifactPath"
  ]
};

export const mobileDeploymentRuntimeReadiness = buildMobileDeploymentRuntimeReadinessPlan({
  buildProfiles: [
    {
      profile: "development",
      distribution: "internal",
      channel: "development",
      required: true,
      status: "not_built",
      evidenceRequired: ["development client build artifact label", "simulator/device smoke label"]
    },
    {
      profile: "preview",
      distribution: "internal",
      channel: "preview",
      required: true,
      status: "not_built",
      platforms: []
    },
    {
      profile: "production",
      distribution: "store",
      channel: "production",
      required: true,
      status: "not_built",
      platforms: []
    }
  ],
  qaEvidence: [],
  runtimePolicy: {
    expoRuntimeVersionPolicy: "appVersion",
    requiresStoreBuildWhen: [
      "native dependencies change",
      "permissions change",
      "runtime version changes",
      "app config changes affect native capabilities"
    ],
    otaAllowedWhen: [
      "preview binary is installed",
      "runtime versions match",
      "no native capability or permission changed",
      "rollback update has been rehearsed on preview channel"
    ]
  },
  appRuntimeVersionPolicy: "appVersion",
  easChannelsConfigured: false,
  nativeCredentialsConfigured: false,
  pushCredentialsConfigured: false,
  sentryMobileConfigured: false,
  verifierPassed: false,
  redactedBuildArtifactsRecorded: false,
  storeReadinessReviewed: false
});
