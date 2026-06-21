import { buildMobileOtaProductionEnablementPlan } from "@inkroute/releases";

import { mobileUpdateRuntimePreview } from "./mobileUpdates";

export const mobileOtaProductionArtifactPaths = [
  "coverage/mobile-ota-production-enablement.json",
  "coverage/mobile-ota-expo-project-redacted.json",
  "coverage/mobile-ota-preview-native-build.json",
  "coverage/mobile-ota-production-native-build.json",
  "coverage/mobile-ota-preview-update-id-redacted.json",
  "coverage/mobile-ota-device-adoption-redacted.json",
  "coverage/mobile-ota-adoption-monitoring.json",
  "coverage/mobile-ota-rollback-republish-redacted.json",
  "coverage/mobile-ota-release-health-link.json",
  "test-results/mobile-ota-production",
] as const;

export const mobileOtaProductionProofFiles = [
  "apps/mobile/package.json",
  "packages/releases/package.json",
  "packages/releases/src/index.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "apps/mobile/app.json",
  "apps/mobile/eas.json",
  "apps/mobile/src/lib/mobileDemo.ts",
  "apps/mobile/src/lib/mobileUpdates.ts",
  "apps/mobile/src/lib/mobileOtaProduction.ts",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/mobile/tests/mobile-static.test.ts",
  "apps/mobile/tests/mobile-updates-static.test.ts",
  "apps/mobile/tests/mobile-ota-production-static.test.ts",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  ".env.example",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const mobileOtaProductionCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/mobile/tests/mobile-static.test.ts apps/mobile/tests/mobile-updates-static.test.ts apps/mobile/tests/mobile-ota-production-static.test.ts",
  "pnpm --filter @inkroute/mobile typecheck",
  "eas build --profile preview --platform all",
  "eas build --profile production --platform all",
  "eas update --channel preview",
  "eas update:list --channel preview",
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
] as const;

export type MobileOtaProductionEvidenceArtifact = (typeof mobileOtaProductionArtifactPaths)[number];

export const mobileOtaProductionRequiredExternalEvidence = [
  "real Expo project ID and update URL",
  "preview and production native EAS builds",
  "preview update publish/list with recorded update ID",
  "preview device adoption proof",
  "rollback republish drill proof",
  "mobile typecheck evidence and CI artifact attachment",
] as const;

export const mobileOtaProductionDecisionRequiredEvidence = [
  "release package, mobile static, and mobile typecheck artifacts",
  "redacted Expo project/update metadata, preview/production native build, preview update ID, and device adoption artifacts",
  "adoption/error monitoring, rollback republish, release-health linkage, and CI artifact evidence",
] as const;

export interface MobileOtaProductionExecutionPlan {
  readonly id: "gap-091-mobile-ota-production";
  readonly easBuildExecutionAllowed: false;
  readonly easUpdateExecutionAllowed: false;
  readonly deviceAdoptionProofAllowed: false;
  readonly rollbackDrillExecutionAllowed: false;
  readonly policy: MobileOtaProductionExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof mobileOtaProductionCommands;
  readonly requiredArtifacts: typeof mobileOtaProductionArtifactPaths;
  readonly localStaticArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly easBuildArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly updateArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly deviceArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly rollbackArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly releaseHealthArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof mobileOtaProductionRequiredExternalEvidence;
}

export interface MobileOtaProductionExecutionPolicy {
  readonly executeEasBuilds: false;
  readonly executeEasUpdates: false;
  readonly executeDeviceAdoptionProof: false;
  readonly executeRollbackDrill: false;
  readonly executeMobileTypecheck: false;
  readonly executeCi: false;
}

export interface MobileOtaProductionArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: MobileOtaProductionEvidenceArtifact;
}

const mobileOtaSensitiveKeyPattern =
  /(?:authorization|clientsecret|credential|deviceid|email|expotoken|password|phone|private|secret|token|userid)/i;
const mobileOtaEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const mobileOtaPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const mobileOtaTokenPattern = /\b(?:bearer|eas|expo|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactMobileOtaArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (mobileOtaSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(mobileOtaEmailPattern, "[REDACTED_EMAIL]")
      .replace(mobileOtaPhonePattern, "[REDACTED_PHONE]")
      .replace(mobileOtaTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactMobileOtaArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactMobileOtaArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedMobileOtaProductionArtifact(artifact: unknown): unknown {
  return redactMobileOtaArtifactValue(artifact);
}

export const mobileOtaProductionExecutionPolicy: MobileOtaProductionExecutionPolicy = {
  executeEasBuilds: false,
  executeEasUpdates: false,
  executeDeviceAdoptionProof: false,
  executeRollbackDrill: false,
  executeMobileTypecheck: false,
  executeCi: false,
};

export function buildMobileOtaProductionExecutionPlan(): MobileOtaProductionExecutionPlan {
  return {
    id: "gap-091-mobile-ota-production",
    easBuildExecutionAllowed: false,
    easUpdateExecutionAllowed: false,
    deviceAdoptionProofAllowed: false,
    rollbackDrillExecutionAllowed: false,
    policy: mobileOtaProductionExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: mobileOtaProductionCommands,
    requiredArtifacts: mobileOtaProductionArtifactPaths,
    localStaticArtifacts: [
      "coverage/mobile-ota-production-enablement.json",
      "coverage/mobile-ota-expo-project-redacted.json",
      "coverage/mobile-ota-adoption-monitoring.json",
      "coverage/mobile-ota-release-health-link.json",
    ],
    easBuildArtifacts: ["coverage/mobile-ota-preview-native-build.json", "coverage/mobile-ota-production-native-build.json"],
    updateArtifacts: ["coverage/mobile-ota-preview-update-id-redacted.json"],
    deviceArtifacts: ["coverage/mobile-ota-device-adoption-redacted.json"],
    rollbackArtifacts: ["coverage/mobile-ota-rollback-republish-redacted.json"],
    releaseHealthArtifacts: ["coverage/mobile-ota-release-health-link.json"],
    externalEvidenceRequired: mobileOtaProductionRequiredExternalEvidence,
  };
}

export function buildMobileOtaProductionArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: MobileOtaProductionEvidenceArtifact = "coverage/mobile-ota-device-adoption-redacted.json",
): MobileOtaProductionArtifactReview {
  const redactedArtifact = buildRedactedMobileOtaProductionArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(mobileOtaEmailPattern) ? "email" : null,
    serialized.match(mobileOtaPhonePattern) ? "phone" : null,
    serialized.match(mobileOtaTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface MobileOtaProductionEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly mobileStaticTestsPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly realExpoProjectIdConfigured: boolean;
  readonly realUpdateUrlConfigured: boolean;
  readonly previewNativeBuildPassed: boolean;
  readonly productionNativeBuildPassed: boolean;
  readonly previewUpdatePublished: boolean;
  readonly previewUpdateIdRecorded: boolean;
  readonly deviceAdoptionVerified: boolean;
  readonly adoptionMonitoringVerified: boolean;
  readonly rollbackRepublishDrillPassed: boolean;
  readonly releaseHealthLinked: boolean;
  readonly ciArtifactsAttached: boolean;
  readonly capturedArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
}

export interface MobileOtaProductionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly MobileOtaProductionEvidenceArtifact[];
  readonly requiredCommands: typeof mobileOtaProductionCommands;
  readonly requiredEvidence: typeof mobileOtaProductionDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildMobileOtaProductionEvidenceDecision(input: MobileOtaProductionEvidenceInput): MobileOtaProductionEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.mobileStaticTestsPassed ? "Mobile OTA static test evidence is required." : null,
    !input.mobileTypecheckPassed ? "Mobile typecheck evidence is required." : null,
    !input.realExpoProjectIdConfigured ? "Real non-secret Expo project ID evidence is required." : null,
    !input.realUpdateUrlConfigured ? "Real Expo update URL evidence is required." : null,
    !input.previewNativeBuildPassed ? "Preview native EAS build evidence is required." : null,
    !input.productionNativeBuildPassed ? "Production native EAS build evidence is required." : null,
    !input.previewUpdatePublished ? "Preview EAS update publish evidence is required." : null,
    !input.previewUpdateIdRecorded ? "Preview update ID evidence is required." : null,
    !input.deviceAdoptionVerified ? "Preview device OTA adoption evidence is required." : null,
    !input.adoptionMonitoringVerified ? "OTA adoption/error monitoring evidence is required." : null,
    !input.rollbackRepublishDrillPassed ? "Rollback republish drill evidence is required." : null,
    !input.releaseHealthLinked ? "Mobile OTA release-health linkage evidence is required." : null,
    !input.ciArtifactsAttached ? "Mobile OTA CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = mobileOtaProductionArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: mobileOtaProductionCommands,
    requiredEvidence: mobileOtaProductionDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-091 mobile OTA production evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-091 mobile OTA production evidence remains blocked until Expo metadata, EAS builds/updates, device adoption, rollback, release-health, and CI artifacts are captured.",
  };
}

export function buildMobileOtaReleaseHealthLink(input: { releaseId: string; updateId?: string; channel: "preview" | "production" }) {
  return {
    releaseId: input.releaseId,
    updateId: input.updateId ?? "update-pending",
    channel: input.channel,
    linkedToReleaseHealth: true,
    publicPayloadSafe: true,
    rawDeviceIdentifiersStored: false,
    artifactPaths: mobileOtaProductionArtifactPaths,
  };
}

export function buildMobileOtaAdoptionMonitoringPlan(input: { releaseId: string; channel: "preview" | "production"; updateId?: string }) {
  return {
    releaseId: input.releaseId,
    channel: input.channel,
    updateId: input.updateId ?? "update-pending",
    metrics: [
      "preview-update-adoption-count",
      "preview-update-error-count",
      "rollback-candidate-detected",
      "release-health-mobile-ota-status",
    ],
    alertPolicy: {
      errorRateThresholdPercent: 5,
      minimumAdoptionSample: 3,
      rollbackRecommendedOnCrashSpike: true,
    },
    redaction: {
      rawDeviceIdentifiersStored: false,
      expoAccessTokenStored: false,
      artifact: "coverage/mobile-ota-adoption-monitoring.json",
    },
    releaseHealthLinked: true,
  };
}

export function buildMobileOtaProductionEvidenceEnvelope() {
  const readiness = mobileUpdateRuntimePreview.readiness;
  const runtimeEvidence = mobileUpdateRuntimePreview.evidence;
  const releaseHealthLink = buildMobileOtaReleaseHealthLink({
    releaseId: mobileUpdateRuntimePreview.adoptionEvent.releaseId,
    updateId: mobileUpdateRuntimePreview.adoptionEvent.updateId,
    channel: mobileUpdateRuntimePreview.adoptionEvent.channel,
  });
  const adoptionMonitoring = buildMobileOtaAdoptionMonitoringPlan({
    releaseId: mobileUpdateRuntimePreview.adoptionEvent.releaseId,
    updateId: mobileUpdateRuntimePreview.adoptionEvent.updateId,
    channel: mobileUpdateRuntimePreview.adoptionEvent.channel,
  });

  return {
    readiness,
    runtimeEvidence,
    releaseHealthLink,
    adoptionEvent: mobileUpdateRuntimePreview.adoptionEvent,
    rollbackAudit: mobileUpdateRuntimePreview.rollbackAudit,
    productionProof: {
      expoProjectMetadata: "deployment-gated-redacted",
      previewNativeBuild: "pending",
      productionNativeBuild: "pending",
      previewUpdateId: mobileUpdateRuntimePreview.adoptionEvent.updateId,
      deviceAdoption: "pending-redacted-device-proof",
      rollbackRepublish: "pending",
      adoptionMonitoring,
    },
    artifactPaths: mobileOtaProductionArtifactPaths,
  };
}

export function buildMobileOtaProductionContract() {
  return buildMobileOtaProductionEnablementPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    mobileStaticTestsPassed: false,
    mobileTypecheckPassed: false,
    realExpoProjectIdConfigured: false,
    realUpdateUrlConfigured: false,
    expoUpdatesConfigured: true,
    runtimeVersionPolicyAppVersion: true,
    previewChannelConfigured: true,
    productionChannelConfigured: true,
    previewNativeBuildPassed: false,
    productionNativeBuildPassed: false,
    previewUpdatePublished: false,
    previewUpdateIdRecorded: false,
    deviceAdoptionVerified: false,
    adoptionMonitoringConfigured: true,
    rollbackRepublishDrillPassed: false,
    releaseHealthLinked: true,
  });
}

export const mobileOtaProductionEvidence = buildMobileOtaProductionEvidenceEnvelope();
export const mobileOtaProductionContract = buildMobileOtaProductionContract();


