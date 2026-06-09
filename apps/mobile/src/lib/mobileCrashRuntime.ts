import { buildMobileCrashRuntimeReadinessPlan } from "@inkroute/observability";

export type MobileCrashRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "symbolication-gated"
  | "device-gated"
  | "persistence-gated"
  | "privacy-gated"
  | "ci-gated";

export interface MobileCrashRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: MobileCrashRuntimeStatus;
}

export const mobileCrashRuntimeCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm --filter @inkroute/mobile typecheck",
  "Expo simulator forced crash smoke test",
  "Expo physical-device forced crash smoke test",
  "Sentry source-map/debug-symbol resolution check",
] as const;

export const mobileCrashArtifactPaths = [
  "coverage/mobile-crash-runtime.json",
  "coverage/mobile-crash-observability-typecheck.txt",
  "coverage/mobile-crash-observability-test.txt",
  "coverage/mobile-crash-app-typecheck.txt",
  "coverage/mobile-crash-sentry-expo-config-redacted.json",
  "coverage/mobile-crash-fallback-reporter.json",
  "coverage/mobile-crash-release-eas-tags.json",
  "coverage/mobile-crash-before-send-redaction.json",
  "coverage/mobile-crash-pii-redaction-tests.json",
  "coverage/mobile-crash-source-map-upload-redacted.json",
  "coverage/mobile-crash-debug-symbol-upload-redacted.json",
  "coverage/mobile-crash-simulator-forced-redacted.json",
  "coverage/mobile-crash-device-forced-redacted.json",
  "coverage/mobile-crash-error-report-persistence.json",
  "coverage/mobile-crash-dashboard-triage.json",
  "coverage/mobile-crash-offline-buffering.json",
  "coverage/mobile-crash-no-pii-provider-payload.json",
  "coverage/mobile-crash-secret-safe-artifacts.json",
  "test-results/mobile-crash-runtime",
] as const;

export const mobileCrashRuntimeMatrix = [
  {
    id: "observability-typecheck",
    command: "pnpm --filter @inkroute/observability typecheck",
    artifact: "coverage/mobile-crash-observability-typecheck.txt",
    status: "wired",
  },
  {
    id: "observability-tests",
    command: "pnpm --filter @inkroute/observability test",
    artifact: "coverage/mobile-crash-observability-test.txt",
    status: "wired",
  },
  {
    id: "mobile-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-crash-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "sentry-expo-credentials",
    command: "configure Sentry Expo/React Native DSN, org, project, and auth token",
    artifact: "coverage/mobile-crash-sentry-expo-config-redacted.json",
    status: "provider-gated",
  },
  {
    id: "fallback-reporter",
    command: "wire privacy-safe fallback reporter to persisted ErrorReport ingest",
    artifact: "coverage/mobile-crash-fallback-reporter.json",
    status: "wired",
  },
  {
    id: "release-eas-tags",
    command: "attach release, environment, EAS channel, and runtime version tags",
    artifact: "coverage/mobile-crash-release-eas-tags.json",
    status: "wired",
  },
  {
    id: "before-send-redaction",
    command: "prove beforeSend/fallback redaction before external capture",
    artifact: "coverage/mobile-crash-before-send-redaction.json",
    status: "privacy-gated",
  },
  {
    id: "source-map-upload",
    command: "upload Expo JavaScript source maps for mobile releases",
    artifact: "coverage/mobile-crash-source-map-upload-redacted.json",
    status: "symbolication-gated",
  },
  {
    id: "debug-symbol-upload",
    command: "upload React Native debug symbols and resolve stack frames",
    artifact: "coverage/mobile-crash-debug-symbol-upload-redacted.json",
    status: "symbolication-gated",
  },
  {
    id: "simulator-forced-crash",
    command: "Expo simulator forced crash smoke test",
    artifact: "coverage/mobile-crash-simulator-forced-redacted.json",
    status: "device-gated",
  },
  {
    id: "device-forced-crash",
    command: "Expo physical-device forced crash smoke test",
    artifact: "coverage/mobile-crash-device-forced-redacted.json",
    status: "device-gated",
  },
  {
    id: "error-report-persistence",
    command: "persist sanitized mobile crash summaries to ErrorReport",
    artifact: "coverage/mobile-crash-error-report-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "dashboard-triage-sync",
    command: "prove dashboard triage reads sanitized mobile ErrorReport records",
    artifact: "coverage/mobile-crash-dashboard-triage.json",
    status: "persistence-gated",
  },
  {
    id: "offline-buffering",
    command: "verify offline crash buffering without raw PII/provider payloads",
    artifact: "coverage/mobile-crash-offline-buffering.json",
    status: "privacy-gated",
  },
  {
    id: "no-pii-provider-payload",
    command: "prove provider payloads and dashboard summaries exclude raw sensitive values",
    artifact: "coverage/mobile-crash-no-pii-provider-payload.json",
    status: "privacy-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile crash evidence job",
    artifact: "coverage/mobile-crash-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly MobileCrashRuntimeMatrixEntry[];

export const mobileCrashRuntimeReadiness = buildMobileCrashRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  observabilityTestsPassed: false,
  observabilityTypecheckPassed: false,
  mobileTypecheckPassed: false,
  sentryExpoSdkConfigured: false,
  fallbackReporterConfigured: true,
  sentryDsnConfigured: false,
  releaseTagsConfigured: true,
  beforeSendRedactionConfigured: true,
  piiRedactionTestsPassed: false,
  sourceMapsUploaded: false,
  debugSymbolsUploaded: false,
  forcedCrashSimulatorVerified: false,
  forcedCrashDeviceVerified: false,
  errorReportPersistenceConfigured: false,
  sanitizedDashboardSyncVerified: false,
  offlineCrashBufferingVerified: false,
  noPiiProviderPayloadVerified: false,
});
