import { buildObservabilityLaunchEvidencePlan } from "@inkroute/observability";

export type ObservabilityLaunchRuntimeStatus =
  | "wired"
  | "sdk-gated"
  | "telemetry-gated"
  | "capture-gated"
  | "persistence-gated"
  | "alerting-gated"
  | "ci-gated";

export interface ObservabilityLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ObservabilityLaunchRuntimeStatus;
}

export interface ObservabilityLaunchRunPersistenceContract {
  readonly model: "ObservabilityLaunchRun";
  readonly tenantRelation: "observabilityLaunchRuns";
  readonly migration: "20260609033500_add_observability_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "sdkConfigurationManifest",
    "captureEvidenceManifest",
    "alertReleaseManifest",
  ];
  readonly evidenceBooleans: readonly [
    "observabilityTypecheckPassed",
    "observabilityTestsPassed",
    "webBuildPassed",
    "dashboardBuildPassed",
    "mobileTypecheckPassed",
    "sentryWebSdkConfigured",
    "sentryDashboardSdkConfigured",
    "sentryMobileSdkConfigured",
    "openTelemetryExporterConfigured",
    "structuredLoggingConfigured",
    "sourceMapsUploaded",
    "mobileDebugSymbolsUploaded",
    "forcedWebCaptureVerified",
    "forcedDashboardCaptureVerified",
    "forcedApiCaptureVerified",
    "forcedWebhookCaptureVerified",
    "forcedMobileCrashVerified",
    "errorReportPersistenceConfigured",
    "dashboardTenantTriageReadsVerified",
    "sentryWebhookSignatureReplayVerified",
    "alertRoutingVerified",
    "releaseIncidentLinkageVerified",
    "redactionNoPiiVerified",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ];
  readonly artifactFields: readonly [
    "observabilityTypecheckArtifactPath",
    "observabilityTestArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "mobileTypecheckArtifactPath",
    "sentrySdkArtifactPath",
    "otelPipelineArtifactPath",
    "structuredLoggingArtifactPath",
    "sourceMapsDebugSymbolsArtifactPath",
    "forcedCapturesArtifactPath",
    "errorReportPersistenceArtifactPath",
    "dashboardTriageArtifactPath",
    "providerWebhookArtifactPath",
    "alertRoutingArtifactPath",
    "releaseLinkageArtifactPath",
    "redactionReviewArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const observabilityLaunchRunPersistenceContract: ObservabilityLaunchRunPersistenceContract = {
  model: "ObservabilityLaunchRun",
  tenantRelation: "observabilityLaunchRuns",
  migration: "20260609033500_add_observability_launch_runs",
  jsonFields: [
    "commandMatrix",
    "controlManifest",
    "artifactManifest",
    "sdkConfigurationManifest",
    "captureEvidenceManifest",
    "alertReleaseManifest",
  ],
  evidenceBooleans: [
    "observabilityTypecheckPassed",
    "observabilityTestsPassed",
    "webBuildPassed",
    "dashboardBuildPassed",
    "mobileTypecheckPassed",
    "sentryWebSdkConfigured",
    "sentryDashboardSdkConfigured",
    "sentryMobileSdkConfigured",
    "openTelemetryExporterConfigured",
    "structuredLoggingConfigured",
    "sourceMapsUploaded",
    "mobileDebugSymbolsUploaded",
    "forcedWebCaptureVerified",
    "forcedDashboardCaptureVerified",
    "forcedApiCaptureVerified",
    "forcedWebhookCaptureVerified",
    "forcedMobileCrashVerified",
    "errorReportPersistenceConfigured",
    "dashboardTenantTriageReadsVerified",
    "sentryWebhookSignatureReplayVerified",
    "alertRoutingVerified",
    "releaseIncidentLinkageVerified",
    "redactionNoPiiVerified",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ],
  artifactFields: [
    "observabilityTypecheckArtifactPath",
    "observabilityTestArtifactPath",
    "webBuildArtifactPath",
    "dashboardBuildArtifactPath",
    "mobileTypecheckArtifactPath",
    "sentrySdkArtifactPath",
    "otelPipelineArtifactPath",
    "structuredLoggingArtifactPath",
    "sourceMapsDebugSymbolsArtifactPath",
    "forcedCapturesArtifactPath",
    "errorReportPersistenceArtifactPath",
    "dashboardTriageArtifactPath",
    "providerWebhookArtifactPath",
    "alertRoutingArtifactPath",
    "releaseLinkageArtifactPath",
    "redactionReviewArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const observabilityLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "forced web/dashboard/API/webhook Sentry capture smoke",
  "forced Expo mobile crash capture smoke",
  "source-map and debug-symbol resolution check",
  "tenant-isolated ErrorReport dashboard triage test",
  "Sentry/provider webhook signature replay test",
  "GitHub Actions observability launch evidence job",
] as const;

export const observabilityLaunchRuntimeControls = [
  "redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard",
  "tenant-safe-release-environment-route-request-trace-surface-tags",
  "ci-source-map-debug-symbol-upload-with-secret-backed-redacted-artifacts",
  "sanitized-error-report-persistence-and-tenant-isolated-dashboard-triage",
  "provider-webhook-signature-and-replay-verification-before-sentry-reconciliation",
  "high-risk-payload-dashboard-only-review-without-external-alerting",
] as const;

export const observabilityLaunchArtifactPaths = [
  "coverage/observability-launch-runtime.json",
  "coverage/observability-typecheck.txt",
  "coverage/observability-test.txt",
  "coverage/observability-web-build.txt",
  "coverage/observability-dashboard-build.txt",
  "coverage/observability-mobile-typecheck.txt",
  "coverage/observability-sentry-sdk.json",
  "coverage/observability-otel-pipeline.json",
  "coverage/observability-structured-logging.json",
  "coverage/observability-source-maps-debug-symbols.json",
  "coverage/observability-forced-captures.json",
  "coverage/observability-error-report-persistence.json",
  "coverage/observability-dashboard-triage.json",
  "coverage/observability-provider-webhook.json",
  "coverage/observability-alert-routing.json",
  "coverage/observability-release-linkage.json",
  "coverage/observability-redaction-review.json",
  "coverage/observability-ci-evidence.json",
  "coverage/observability-secret-safe-artifacts.json",
  "test-results/observability-launch-runtime",
] as const;

export const observabilityLaunchRuntimeMatrix = [
  {
    id: "observability-typecheck",
    command: "pnpm --filter @inkroute/observability typecheck",
    artifact: "coverage/observability-typecheck.txt",
    status: "wired",
  },
  {
    id: "observability-tests",
    command: "pnpm --filter @inkroute/observability test",
    artifact: "coverage/observability-test.txt",
    status: "wired",
  },
  {
    id: "web-dashboard-mobile-build-gates",
    command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/dashboard build && pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/observability-web-build.txt",
    status: "wired",
  },
  {
    id: "sentry-sdk-runtime-configuration",
    command: "Sentry web/dashboard/mobile SDK configuration smoke",
    artifact: "coverage/observability-sentry-sdk.json",
    status: "sdk-gated",
  },
  {
    id: "otel-structured-logging",
    command: "OpenTelemetry exporter and structured logging smoke",
    artifact: "coverage/observability-otel-pipeline.json",
    status: "telemetry-gated",
  },
  {
    id: "source-map-debug-symbol-resolution",
    command: "source-map and debug-symbol resolution check",
    artifact: "coverage/observability-source-maps-debug-symbols.json",
    status: "sdk-gated",
  },
  {
    id: "forced-capture-smokes",
    command: "forced web/dashboard/API/webhook/mobile capture smoke",
    artifact: "coverage/observability-forced-captures.json",
    status: "capture-gated",
  },
  {
    id: "error-report-persistence-triage",
    command: "tenant-isolated ErrorReport dashboard triage test",
    artifact: "coverage/observability-dashboard-triage.json",
    status: "persistence-gated",
  },
  {
    id: "provider-webhook-replay-alerts-release-linkage",
    command: "Sentry/provider webhook replay, alert routing, and release linkage tests",
    artifact: "coverage/observability-provider-webhook.json",
    status: "alerting-gated",
  },
  {
    id: "redaction-ci-secret-safe-artifacts",
    command: "GitHub Actions observability launch evidence job",
    artifact: "coverage/observability-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly ObservabilityLaunchRuntimeMatrixEntry[];

export const observabilityLaunchRuntimeReadiness = buildObservabilityLaunchEvidencePlan({
  packageScripts: ["typecheck", "test"],
  observabilityTypecheckPassed: false,
  observabilityTestsPassed: false,
  webBuildPassed: false,
  dashboardBuildPassed: false,
  mobileTypecheckPassed: false,
  sentryWebSdkConfigured: false,
  sentryDashboardSdkConfigured: false,
  sentryMobileSdkConfigured: false,
  openTelemetryExporterConfigured: false,
  structuredLoggingConfigured: false,
  sourceMapsUploaded: false,
  mobileDebugSymbolsUploaded: false,
  forcedWebCaptureVerified: false,
  forcedDashboardCaptureVerified: false,
  forcedApiCaptureVerified: false,
  forcedWebhookCaptureVerified: false,
  forcedMobileCrashVerified: false,
  errorReportPersistenceConfigured: false,
  dashboardTenantTriageReadsVerified: false,
  sentryWebhookSignatureReplayVerified: false,
  alertRoutingVerified: false,
  releaseIncidentLinkageVerified: false,
  redactionNoPiiVerified: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
