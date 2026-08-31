import {
  buildMobileOtaRollbackContract,
  buildEasOtaReadinessPlan,
  buildExpoEasRuntimeEvidencePlan,
  buildMobileUpdatePlan,
  buildReleaseAuditDraft,
  type EasOtaReadinessPlan,
  type ExpoEasRuntimeEvidencePlan,
  type MobileUpdatePlan,
  type ReleaseAuditDraft,
} from "@inkroute/releases";
import { createHash } from "node:crypto";

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
  updateIdHash: string;
  rawUpdateIdEchoed: false;
  channel: "preview" | "production";
  runtimeVersion: string;
  deviceIdHash: string;
  rawDeviceIdEchoed: false;
  adoptedAt: string;
  status: "received" | "failed" | "rolled_back";
  redactedDetail: string;
}

export interface MobileUpdateRuntimeContract {
  updatePlan: MobileUpdatePlan;
  readiness: EasOtaReadinessPlan;
  evidence: ExpoEasRuntimeEvidencePlan;
  rollbackContract: ReturnType<typeof buildMobileOtaRollbackContract>;
  adoptionEvent: MobileUpdateAdoptionEvent;
  rolloutDecision: MobileUpdateRolloutDecision;
  rollbackAudit: ReleaseAuditDraft;
  boundary: string;
}

export interface MobileUpdateRolloutDecision {
  status: "promotable" | "hold" | "rollback_required" | "rollback_blocked";
  receivedCount: number;
  failedCount: number;
  rolledBackCount: number;
  failureRate: number;
  rollbackUpdateIdHash: string | null;
  rawRollbackUpdateIdEchoed: false;
  blockers: readonly string[];
  redactedSummary: string;
}

function buildMobileUpdateSelectorHash(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}

export function evaluateMobileUpdateRollout(input: {
  events: readonly MobileUpdateAdoptionEvent[];
  previousUpdateId?: string;
  minimumReceipts: number;
  maxFailureRate: number;
}): MobileUpdateRolloutDecision {
  const receivedCount = input.events.filter((event) => event.status === "received").length;
  const failedCount = input.events.filter((event) => event.status === "failed").length;
  const rolledBackCount = input.events.filter((event) => event.status === "rolled_back").length;
  const observedCount = input.events.length;
  const failureRate = observedCount === 0 ? 1 : failedCount / observedCount;
  const rollbackUpdateId = input.previousUpdateId?.trim() || null;
  const blockers: string[] = [];

  if (receivedCount < input.minimumReceipts) {
    blockers.push("Preview OTA must have enough redacted device receipts before production promotion.");
  }
  if (failureRate > input.maxFailureRate) {
    blockers.push("Preview OTA failure rate exceeds the release safety threshold.");
  }
  if (failedCount > 0 && !rollbackUpdateId) {
    blockers.push("Rollback is required but no previous compatible update id is available.");
  }

  const status: MobileUpdateRolloutDecision["status"] =
    failedCount > 0 && !rollbackUpdateId
      ? "rollback_blocked"
      : failureRate > input.maxFailureRate
        ? "rollback_required"
        : blockers.length > 0
          ? "hold"
          : "promotable";

  return {
    status,
    receivedCount,
    failedCount,
    rolledBackCount,
    failureRate,
    rollbackUpdateIdHash: rollbackUpdateId ? buildMobileUpdateSelectorHash("mobile-ota-rollback-update", rollbackUpdateId) : null,
    rawRollbackUpdateIdEchoed: false,
    blockers,
    redactedSummary:
      "Mobile OTA rollout decision uses redacted adoption counts only; no device identifiers, tokens, or provider credentials are stored.",
  };
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
    updateIdHash: buildMobileUpdateSelectorHash("mobile-ota-update", config.currentUpdateId ?? "update-pending"),
    rawUpdateIdEchoed: false,
    channel: config.channel,
    runtimeVersion: config.runtimeVersion,
    deviceIdHash: buildMobileUpdateSelectorHash("mobile-ota-device", "device-redacted"),
    rawDeviceIdEchoed: false,
    adoptedAt: "2026-06-09T00:00:00.000Z",
    status: config.currentUpdateId ? "received" : "failed",
    redactedDetail: config.currentUpdateId ? "Preview update id recorded without device PII." : "No OTA update id is available yet.",
  };

  const rolloutDecision = evaluateMobileUpdateRollout({
    events: [adoptionEvent],
    previousUpdateId: config.previousUpdateId,
    minimumReceipts: 1,
    maxFailureRate: 0,
  });
  const rollbackContract = buildMobileOtaRollbackContract({
    runtimeVersion: config.runtimeVersion,
    channel: config.channel,
    currentUpdateId: config.currentUpdateId,
    previousCompatibleUpdateId: config.previousUpdateId,
    redactedDeviceReceipts: config.currentUpdateId ? 1 : 0,
    failedReceipts: adoptionEvent.status === "failed" ? 1 : 0,
    rollbackRepublishCommandRecorded: false,
    easProjectConfigured: Boolean(config.expoProjectId?.trim() && config.updateUrl?.trim()),
  });

  const rollbackAudit = buildReleaseAuditDraft({
    actorId: "mobile-release-governance",
    releaseId: adoptionEvent.releaseId,
    action: "publish_mobile_update",
    redactedPayload: {
      channel: config.channel,
      runtimeVersion: config.runtimeVersion,
      currentUpdateIdHash: buildMobileUpdateSelectorHash("mobile-ota-current-update", config.currentUpdateId ?? "pending"),
      previousUpdateIdHash: buildMobileUpdateSelectorHash("mobile-ota-previous-update", config.previousUpdateId ?? "pending"),
      rawCurrentUpdateIdStored: false,
      rawPreviousUpdateIdStored: false,
      rollbackRequired: !config.previousUpdateId,
    },
    createdAt: adoptionEvent.adoptedAt,
  });

  return {
    updatePlan,
    readiness,
    evidence,
    rollbackContract,
    adoptionEvent,
    rolloutDecision,
    rollbackAudit,
    boundary:
      "Mobile OTA now has a package-backed rollback command/adoption contract plus app-side compatibility, redacted adoption, rollout-decision, rollback-audit, and runtime-evidence contracts; real EAS project credentials, native builds, device receipt, and rollback republish proof remain gated.",
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
