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

export const mobileDeploymentRuntimeCommands = [
  "pnpm deploy:verify-mobile",
  "eas build --profile development",
  "eas build --profile preview --platform all",
  "eas build --profile production --platform all",
  "eas update --channel preview",
  "mobile device QA checklist",
  "mobile push token smoke",
  "mobile synthetic crash capture",
  "OTA rollback rehearsal"
] as const;

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
    id: "preview-ios-android-build",
    command: "eas build --profile preview --platform all",
    artifact: "coverage/mobile-eas-preview-build-redacted.json",
    status: "eas-gated"
  },
  {
    id: "production-ios-android-build",
    command: "eas build --profile production --platform all",
    artifact: "coverage/mobile-eas-production-build-redacted.json",
    status: "store-gated"
  },
  {
    id: "device-push-crash-qa",
    command: "mobile device QA checklist, mobile push token smoke, and mobile synthetic crash capture",
    artifact: "coverage/mobile-device-qa-checklist-redacted.json",
    status: "device-gated"
  },
  {
    id: "ota-runtime-policy",
    command: "eas update --channel preview and OTA rollback rehearsal",
    artifact: "coverage/mobile-ota-rollback-redacted.json",
    status: "eas-gated"
  },
  {
    id: "native-credentials-store-readiness",
    command: "verify iOS/Android native credentials and App Store/Google Play readiness labels",
    artifact: "coverage/mobile-store-readiness-redacted.json",
    status: "credential-gated"
  },
  {
    id: "ci-mobile-deployment-artifacts",
    command: "GitHub Actions mobile deployment artifact capture",
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
