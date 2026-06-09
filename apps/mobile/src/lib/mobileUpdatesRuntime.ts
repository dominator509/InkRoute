import { buildExpoEasRuntimeEvidencePlan } from "@inkroute/releases";

export type MobileUpdatesRuntimeStatus =
  | "wired"
  | "project-gated"
  | "credential-gated"
  | "build-gated"
  | "ota-gated"
  | "rollback-gated"
  | "monitoring-gated"
  | "ci-gated";

export interface MobileUpdatesRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileUpdatesRuntimeStatus;
}

export const mobileUpdatesRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm --filter @inkroute/mobile typecheck",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "eas update:list --channel preview",
  "rollback republish drill on preview channel",
] as const;

export const mobileUpdatesArtifactPaths = [
  "coverage/mobile-updates-runtime.json",
  "coverage/mobile-updates-releases-typecheck.txt",
  "coverage/mobile-updates-releases-test.txt",
  "coverage/mobile-updates-app-typecheck.txt",
  "coverage/mobile-updates-app-config-project.json",
  "coverage/mobile-updates-eas-json-channels.json",
  "coverage/mobile-updates-credentials-redacted.json",
  "coverage/mobile-updates-preview-native-build-redacted.json",
  "coverage/mobile-updates-production-native-build-redacted.json",
  "coverage/mobile-updates-preview-ota-publish-redacted.json",
  "coverage/mobile-updates-device-receipt-redacted.json",
  "coverage/mobile-updates-rollback-republish-redacted.json",
  "coverage/mobile-updates-compatibility-check.json",
  "coverage/mobile-updates-adoption-monitoring.json",
  "coverage/mobile-updates-release-health-monitoring.json",
  "coverage/mobile-updates-secret-safe-artifacts.json",
  "test-results/mobile-updates-runtime",
] as const;

export const mobileUpdatesRuntimeMatrix = [
  {
    id: "releases-typecheck",
    command: "pnpm --filter @inkroute/releases typecheck",
    artifact: "coverage/mobile-updates-releases-typecheck.txt",
    status: "wired",
  },
  {
    id: "releases-tests",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/mobile-updates-releases-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-updates-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "app-config-project",
    command: "commit real non-secret EAS project id, update URL, runtimeVersion, and channel mapping",
    artifact: "coverage/mobile-updates-app-config-project.json",
    status: "project-gated",
  },
  {
    id: "eas-json-channels",
    command: "reconcile eas.json preview and production profiles with release policy",
    artifact: "coverage/mobile-updates-eas-json-channels.json",
    status: "project-gated",
  },
  {
    id: "eas-credentials",
    command: "configure EAS credentials outside source control",
    artifact: "coverage/mobile-updates-credentials-redacted.json",
    status: "credential-gated",
  },
  {
    id: "preview-native-build",
    command: "eas build --profile preview --platform all",
    artifact: "coverage/mobile-updates-preview-native-build-redacted.json",
    status: "build-gated",
  },
  {
    id: "production-native-build",
    command: "eas build --profile production --platform all",
    artifact: "coverage/mobile-updates-production-native-build-redacted.json",
    status: "build-gated",
  },
  {
    id: "preview-ota-publish",
    command: "eas update --channel preview",
    artifact: "coverage/mobile-updates-preview-ota-publish-redacted.json",
    status: "ota-gated",
  },
  {
    id: "device-receipt",
    command: "eas update:list --channel preview and preview-device receipt check",
    artifact: "coverage/mobile-updates-device-receipt-redacted.json",
    status: "ota-gated",
  },
  {
    id: "rollback-republish",
    command: "rollback republish drill on preview channel",
    artifact: "coverage/mobile-updates-rollback-republish-redacted.json",
    status: "rollback-gated",
  },
  {
    id: "compatibility-check",
    command: "prove OTA update does not require a new native build",
    artifact: "coverage/mobile-updates-compatibility-check.json",
    status: "wired",
  },
  {
    id: "adoption-monitoring",
    command: "verify update adoption and error dashboards before production OTA",
    artifact: "coverage/mobile-updates-adoption-monitoring.json",
    status: "monitoring-gated",
  },
  {
    id: "release-health-monitoring",
    command: "wire EAS update status to release health monitoring and incident triage",
    artifact: "coverage/mobile-updates-release-health-monitoring.json",
    status: "monitoring-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile OTA evidence job",
    artifact: "coverage/mobile-updates-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileUpdatesRuntimeMatrixEntry[];

export const mobileUpdatesRuntimeEvidence = buildExpoEasRuntimeEvidencePlan({
  packageScripts: ["test", "typecheck"],
  releasesTestsPassed: false,
  releasesTypecheckPassed: false,
  mobileTypecheckPassed: false,
  appJsonProjectIdMatches: false,
  easJsonChannelsMatch: false,
  credentialsConfigured: false,
  easProjectIdConfigured: false,
  updateUrlConfigured: false,
  runtimeVersionPolicyConfigured: true,
  previewChannelConfigured: true,
  productionChannelConfigured: true,
  previewNativeBuildPassed: false,
  productionNativeBuildPassed: false,
  previewOtaPublishVerified: false,
  deviceReceivedPreviewUpdate: false,
  rollbackRepublishVerified: false,
  compatibilityCheckPassed: true,
  adoptionMonitoringVerified: false,
  releaseHealthMonitoringConfigured: false,
});
