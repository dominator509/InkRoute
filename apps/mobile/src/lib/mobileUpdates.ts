import {
  buildEasOtaReadinessPlan,
  buildExpoEasRuntimeEvidencePlan,
  buildMobileUpdatePlan,
  buildReleaseAuditDraft,
  type EasOtaReadinessPlan,
  type ExpoEasRuntimeEvidencePlan,
  type MobileUpdatePlan,
  type ReleaseAuditDraft,
} from "@inkroute/releases";

export interface MobileUpdateRuntimeConfig {
  channel: "preview" | "production";
  runtimeVersion: string;
  nativeRuntimeVersion: string;
  expoProjectId?: string;
  updateUrl?: string;
  previewChannel?: string;
  productionChannel?: string;
  currentUpdateId?: string;
  previousUpdateId?: string;
}

export interface MobileUpdateAdoptionEvent {
  releaseId: string;
  updateId: string;
  channel: "preview" | "production";
  runtimeVersion: string;
  deviceId: string;
  adoptedAt: string;
  status: "received" | "failed" | "rolled_back";
  redactedDetail: string;
}

export interface MobileUpdateRuntimeContract {
  updatePlan: MobileUpdatePlan;
  readiness: EasOtaReadinessPlan;
  evidence: ExpoEasRuntimeEvidencePlan;
  adoptionEvent: MobileUpdateAdoptionEvent;
  rollbackAudit: ReleaseAuditDraft;
  boundary: string;
}

export function buildMobileUpdateRuntimeContract(config: MobileUpdateRuntimeConfig): MobileUpdateRuntimeContract {
  const updatePlan = buildMobileUpdatePlan({
    channel: config.channel,
    runtimeVersion: config.runtimeVersion,
    nativeRuntimeVersion: config.nativeRuntimeVersion,
    changes: ["Mobile app update governance contract", "Runtime adoption and rollback audit wiring"],
    nativeCapabilitiesChanged: false,
    permissionsChanged: false,
    expoProjectConfigured: Boolean(config.expoProjectId?.trim() && config.updateUrl?.trim()),
  });

  const readiness = buildEasOtaReadinessPlan({
    expoProjectId: config.expoProjectId,
    updateUrl: config.updateUrl,
    previewChannel: config.previewChannel,
    productionChannel: config.productionChannel,
    runtimeVersionPolicy: "appVersion",
    previewUpdateId: config.currentUpdateId,
    rollbackDrillId: config.previousUpdateId ? `rollback-${config.previousUpdateId}` : undefined,
    adoptionMonitoringConfigured: Boolean(config.currentUpdateId),
  });

  const evidence = buildExpoEasRuntimeEvidencePlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    mobileTypecheckPassed: false,
    appJsonProjectIdMatches: Boolean(config.expoProjectId),
    easJsonChannelsMatch: Boolean(config.previewChannel && config.productionChannel),
    credentialsConfigured: false,
    easProjectIdConfigured: Boolean(config.expoProjectId),
    updateUrlConfigured: Boolean(config.updateUrl),
    runtimeVersionPolicyConfigured: true,
    previewChannelConfigured: Boolean(config.previewChannel),
    productionChannelConfigured: Boolean(config.productionChannel),
    previewNativeBuildPassed: false,
    productionNativeBuildPassed: false,
    previewOtaPublishVerified: Boolean(config.currentUpdateId),
    deviceReceivedPreviewUpdate: false,
    rollbackRepublishVerified: Boolean(config.previousUpdateId),
    compatibilityCheckPassed: updatePlan.compatibility === "safe",
    adoptionMonitoringVerified: false,
    releaseHealthMonitoringConfigured: false,
  });

  const adoptionEvent: MobileUpdateAdoptionEvent = {
    releaseId: `mobile-${config.runtimeVersion}-${config.channel}`,
    updateId: config.currentUpdateId ?? "update-pending",
    channel: config.channel,
    runtimeVersion: config.runtimeVersion,
    deviceId: "device-redacted",
    adoptedAt: "2026-06-09T00:00:00.000Z",
    status: config.currentUpdateId ? "received" : "failed",
    redactedDetail: config.currentUpdateId ? "Preview update id recorded without device PII." : "No OTA update id is available yet.",
  };

  const rollbackAudit = buildReleaseAuditDraft({
    actorId: "mobile-release-governance",
    releaseId: adoptionEvent.releaseId,
    action: "publish_mobile_update",
    redactedPayload: {
      channel: config.channel,
      runtimeVersion: config.runtimeVersion,
      currentUpdateId: config.currentUpdateId ?? "pending",
      previousUpdateId: config.previousUpdateId ?? "pending",
      rollbackRequired: !config.previousUpdateId,
    },
    createdAt: adoptionEvent.adoptedAt,
  });

  return {
    updatePlan,
    readiness,
    evidence,
    adoptionEvent,
    rollbackAudit,
    boundary:
      "Mobile OTA now has app-side compatibility, adoption, rollback-audit, and runtime-evidence contracts; real EAS project credentials, native builds, device receipt, and rollback republish proof remain gated.",
  };
}

export const mobileUpdateRuntimePreview = buildMobileUpdateRuntimeContract({
  channel: "preview",
  runtimeVersion: "1.0.0",
  nativeRuntimeVersion: "1.0.0",
  expoProjectId: undefined,
  updateUrl: undefined,
  previewChannel: "preview",
  productionChannel: "production",
});
