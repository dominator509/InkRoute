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

export const mobileOtaProductionCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/mobile/tests/mobile-static.test.ts apps/mobile/tests/mobile-updates-static.test.ts apps/mobile/tests/mobile-ota-production-static.test.ts",
  "pnpm --filter @inkroute/mobile typecheck",
  "eas build --profile preview --platform all",
  "eas build --profile production --platform all",
  "eas update --channel preview",
  "eas update:list --channel preview",
  "rollback republish drill on preview channel",
] as const;

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

export function buildMobileOtaProductionEvidenceEnvelope() {
  const readiness = mobileUpdateRuntimePreview.readiness;
  const runtimeEvidence = mobileUpdateRuntimePreview.evidence;
  const releaseHealthLink = buildMobileOtaReleaseHealthLink({
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
      adoptionMonitoring: "pending",
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
    adoptionMonitoringConfigured: false,
    rollbackRepublishDrillPassed: false,
    releaseHealthLinked: true,
  });
}

export const mobileOtaProductionEvidence = buildMobileOtaProductionEvidenceEnvelope();
export const mobileOtaProductionContract = buildMobileOtaProductionContract();
