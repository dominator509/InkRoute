import { buildObservabilityLaunchEvidencePlan, observabilityLaunchRequiredEvidence } from "@inkroute/observability";

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
  "Sentry web/dashboard/mobile SDK configuration smoke",
  "OpenTelemetry exporter and structured logging smoke",
  "source-map and debug-symbol resolution check",
  "forced web/dashboard/API/webhook/mobile capture smoke",
  "tenant-isolated ErrorReport dashboard triage test",
  "Sentry/provider webhook replay, alert routing, and release linkage tests",
  "redaction/no-PII observability artifact review",
  "GitHub Actions observability launch evidence job",
  "secret-safe observability artifact review",
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

export const observabilityLaunchRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "apps/mobile/package.json",
  "apps/web/package.json",
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/dashboard/app/api/error-reports/route.ts",
  "apps/dashboard/tests/error-report-route-static.test.ts",
  "apps/web/app/global-error.tsx",
  "apps/dashboard/app/global-error.tsx",
  "apps/mobile/src/screens/SystemStatusScreen.tsx",
  "apps/web/lib/observabilityLaunchRuntime.ts",
  "apps/web/tests/observability-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033500_add_observability_launch_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export type ObservabilityLaunchEvidenceFlag =
  (typeof observabilityLaunchRunPersistenceContract.evidenceBooleans)[number];

export interface ObservabilityLaunchRunEvidenceFields {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly mobileTypecheckPassed: boolean;
  readonly sentryWebSdkConfigured: boolean;
  readonly sentryDashboardSdkConfigured: boolean;
  readonly sentryMobileSdkConfigured: boolean;
  readonly openTelemetryExporterConfigured: boolean;
  readonly structuredLoggingConfigured: boolean;
  readonly sourceMapsUploaded: boolean;
  readonly mobileDebugSymbolsUploaded: boolean;
  readonly forcedWebCaptureVerified: boolean;
  readonly forcedDashboardCaptureVerified: boolean;
  readonly forcedApiCaptureVerified: boolean;
  readonly forcedWebhookCaptureVerified: boolean;
  readonly forcedMobileCrashVerified: boolean;
  readonly errorReportPersistenceConfigured: boolean;
  readonly dashboardTenantTriageReadsVerified: boolean;
  readonly sentryWebhookSignatureReplayVerified: boolean;
  readonly alertRoutingVerified: boolean;
  readonly releaseIncidentLinkageVerified: boolean;
  readonly redactionNoPiiVerified: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
}

export interface ObservabilityLaunchRunRecordInput extends ObservabilityLaunchRunEvidenceFields {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly controls: readonly string[];
  readonly artifacts: readonly string[];
  readonly observabilityTypecheckArtifactPath?: string | null;
  readonly observabilityTestArtifactPath?: string | null;
  readonly webBuildArtifactPath?: string | null;
  readonly dashboardBuildArtifactPath?: string | null;
  readonly mobileTypecheckArtifactPath?: string | null;
  readonly sentrySdkArtifactPath?: string | null;
  readonly otelPipelineArtifactPath?: string | null;
  readonly structuredLoggingArtifactPath?: string | null;
  readonly sourceMapsDebugSymbolsArtifactPath?: string | null;
  readonly forcedCapturesArtifactPath?: string | null;
  readonly errorReportPersistenceArtifactPath?: string | null;
  readonly dashboardTriageArtifactPath?: string | null;
  readonly providerWebhookArtifactPath?: string | null;
  readonly alertRoutingArtifactPath?: string | null;
  readonly releaseLinkageArtifactPath?: string | null;
  readonly redactionReviewArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface ObservabilityLaunchRunData
  extends Omit<ObservabilityLaunchRunRecordInput, "controls" | "artifacts"> {
  readonly commandMatrix: typeof observabilityLaunchRuntimeMatrix;
  readonly controlManifest: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly sdkConfigurationManifest: {
    readonly sentryWebSdkConfigured: boolean;
    readonly sentryDashboardSdkConfigured: boolean;
    readonly sentryMobileSdkConfigured: boolean;
    readonly openTelemetryExporterConfigured: boolean;
    readonly structuredLoggingConfigured: boolean;
  };
  readonly captureEvidenceManifest: {
    readonly forcedWebCaptureVerified: boolean;
    readonly forcedDashboardCaptureVerified: boolean;
    readonly forcedApiCaptureVerified: boolean;
    readonly forcedWebhookCaptureVerified: boolean;
    readonly forcedMobileCrashVerified: boolean;
    readonly errorReportPersistenceConfigured: boolean;
    readonly dashboardTenantTriageReadsVerified: boolean;
  };
  readonly alertReleaseManifest: {
    readonly sentryWebhookSignatureReplayVerified: boolean;
    readonly alertRoutingVerified: boolean;
    readonly releaseIncidentLinkageVerified: boolean;
    readonly redactionNoPiiVerified: boolean;
  };
}

export interface ObservabilityLaunchRunRepository {
  readonly observabilityLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: ObservabilityLaunchRunData;
      update: Omit<ObservabilityLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface ObservabilityLaunchEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<ObservabilityLaunchEvidenceFlag, boolean>>;
}

export interface ObservabilityLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly ObservabilityLaunchEvidenceFlag[];
  readonly requiredCommands: typeof observabilityLaunchRuntimeCommands;
  readonly requiredArtifacts: typeof observabilityLaunchArtifactPaths;
  readonly requiredControls: typeof observabilityLaunchRuntimeControls;
  readonly requiredEvidence: readonly ObservabilityLaunchEvidenceFlag[];
  readonly blockers: readonly string[];
}

export interface ObservabilityLaunchExecutionPlan {
  readonly localCommands: typeof observabilityLaunchLocalCommands;
  readonly externalCommands: typeof observabilityLaunchExternalCommands;
  readonly localArtifacts: typeof observabilityLaunchLocalArtifacts;
  readonly externalArtifacts: typeof observabilityLaunchExternalArtifacts;
  readonly providerExecutionAllowed: false;
  readonly telemetryExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly executionPolicy: typeof observabilityLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof observabilityLaunchRequiredExternalEvidence;
}

export interface ObservabilityLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof observabilityLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const sensitiveObservabilityLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|ip|sentry|dsn|otel|trace|span|stack|payload|provider|tenant|user|client|error|event|issue|release|database|url|uri|repository|repo|branch|pull|pr|reviewer|codeowner|key|id)/iu;
const sensitiveObservabilityLaunchValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\d{1,3}\.){3}\d{1,3}\b|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:repository|repo|branch|pull|pr|reviewer|codeowner)[-_:/]?[A-Za-z0-9_.-]{6,}|[A-Za-z0-9_-]{24,})/giu;

export const observabilityLaunchExecutionPolicy = {
  codexMayClassifyStaticObservabilityLaunchReadiness: true,
  providerEvidenceRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const observabilityLaunchLocalCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "tenant-isolated ErrorReport dashboard triage test",
  "redaction/no-PII observability artifact review",
] as const;

export const observabilityLaunchExternalCommands = [
  "Sentry web/dashboard/mobile SDK configuration smoke",
  "OpenTelemetry exporter and structured logging smoke",
  "source-map and debug-symbol resolution check",
  "forced web/dashboard/API/webhook/mobile capture smoke",
  "Sentry/provider webhook replay, alert routing, and release linkage tests",
  "GitHub Actions observability launch evidence job",
  "secret-safe observability artifact review",
] as const;

export const observabilityLaunchLocalArtifacts = [
  "coverage/observability-launch-runtime.json",
  "coverage/observability-typecheck.txt",
  "coverage/observability-test.txt",
  "coverage/observability-web-build.txt",
  "coverage/observability-dashboard-build.txt",
  "coverage/observability-mobile-typecheck.txt",
  "coverage/observability-error-report-persistence.json",
  "coverage/observability-dashboard-triage.json",
  "coverage/observability-redaction-review.json",
] as const;

export const observabilityLaunchExternalArtifacts = [
  "coverage/observability-sentry-sdk.json",
  "coverage/observability-otel-pipeline.json",
  "coverage/observability-structured-logging.json",
  "coverage/observability-source-maps-debug-symbols.json",
  "coverage/observability-forced-captures.json",
  "coverage/observability-provider-webhook.json",
  "coverage/observability-alert-routing.json",
  "coverage/observability-release-linkage.json",
  "coverage/observability-ci-evidence.json",
  "coverage/observability-secret-safe-artifacts.json",
  "test-results/observability-launch-runtime",
] as const;

export const observabilityLaunchRequiredExternalEvidence = [
  "Sentry web, dashboard, and mobile SDK configuration evidence.",
  "OpenTelemetry exporter and structured logging runtime evidence.",
  "Source-map and mobile debug-symbol upload evidence from CI.",
  "Forced web, dashboard, API, webhook, and mobile crash capture evidence.",
  "Provider webhook signature and replay verification evidence.",
  "Alert routing and release incident linkage evidence.",
  "CI observability launch evidence job with secret-safe artifact bundle.",
  "Provider-backed ObservabilityLaunchRun persistence row captured through persistObservabilityLaunchRun.",
] as const;

const buildRedactedObservabilityLaunchValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedObservabilityLaunchValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveObservabilityLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedObservabilityLaunchValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveObservabilityLaunchValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildObservabilityLaunchExecutionPlan(): ObservabilityLaunchExecutionPlan {
  return {
    localCommands: observabilityLaunchLocalCommands,
    externalCommands: observabilityLaunchExternalCommands,
    localArtifacts: observabilityLaunchLocalArtifacts,
    externalArtifacts: observabilityLaunchExternalArtifacts,
    providerExecutionAllowed: false,
    telemetryExecutionAllowed: false,
    ciExecutionAllowed: false,
    databaseExecutionAllowed: false,
    executionPolicy: observabilityLaunchExecutionPolicy,
    requiredExternalEvidence: observabilityLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedObservabilityLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedObservabilityLaunchValue(artifact, "", []);
}

export function buildObservabilityLaunchArtifactReview(artifact: unknown): ObservabilityLaunchArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedObservabilityLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: observabilityLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export function buildObservabilityLaunchRunData(
  input: ObservabilityLaunchRunRecordInput,
): ObservabilityLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: observabilityLaunchRuntimeMatrix,
    controlManifest: input.controls,
    artifactManifest: input.artifacts,
    sdkConfigurationManifest: {
      sentryWebSdkConfigured: input.sentryWebSdkConfigured,
      sentryDashboardSdkConfigured: input.sentryDashboardSdkConfigured,
      sentryMobileSdkConfigured: input.sentryMobileSdkConfigured,
      openTelemetryExporterConfigured: input.openTelemetryExporterConfigured,
      structuredLoggingConfigured: input.structuredLoggingConfigured,
    },
    captureEvidenceManifest: {
      forcedWebCaptureVerified: input.forcedWebCaptureVerified,
      forcedDashboardCaptureVerified: input.forcedDashboardCaptureVerified,
      forcedApiCaptureVerified: input.forcedApiCaptureVerified,
      forcedWebhookCaptureVerified: input.forcedWebhookCaptureVerified,
      forcedMobileCrashVerified: input.forcedMobileCrashVerified,
      errorReportPersistenceConfigured: input.errorReportPersistenceConfigured,
      dashboardTenantTriageReadsVerified: input.dashboardTenantTriageReadsVerified,
    },
    alertReleaseManifest: {
      sentryWebhookSignatureReplayVerified: input.sentryWebhookSignatureReplayVerified,
      alertRoutingVerified: input.alertRoutingVerified,
      releaseIncidentLinkageVerified: input.releaseIncidentLinkageVerified,
      redactionNoPiiVerified: input.redactionNoPiiVerified,
    },
    observabilityTypecheckPassed: input.observabilityTypecheckPassed,
    observabilityTestsPassed: input.observabilityTestsPassed,
    webBuildPassed: input.webBuildPassed,
    dashboardBuildPassed: input.dashboardBuildPassed,
    mobileTypecheckPassed: input.mobileTypecheckPassed,
    sentryWebSdkConfigured: input.sentryWebSdkConfigured,
    sentryDashboardSdkConfigured: input.sentryDashboardSdkConfigured,
    sentryMobileSdkConfigured: input.sentryMobileSdkConfigured,
    openTelemetryExporterConfigured: input.openTelemetryExporterConfigured,
    structuredLoggingConfigured: input.structuredLoggingConfigured,
    sourceMapsUploaded: input.sourceMapsUploaded,
    mobileDebugSymbolsUploaded: input.mobileDebugSymbolsUploaded,
    forcedWebCaptureVerified: input.forcedWebCaptureVerified,
    forcedDashboardCaptureVerified: input.forcedDashboardCaptureVerified,
    forcedApiCaptureVerified: input.forcedApiCaptureVerified,
    forcedWebhookCaptureVerified: input.forcedWebhookCaptureVerified,
    forcedMobileCrashVerified: input.forcedMobileCrashVerified,
    errorReportPersistenceConfigured: input.errorReportPersistenceConfigured,
    dashboardTenantTriageReadsVerified: input.dashboardTenantTriageReadsVerified,
    sentryWebhookSignatureReplayVerified: input.sentryWebhookSignatureReplayVerified,
    alertRoutingVerified: input.alertRoutingVerified,
    releaseIncidentLinkageVerified: input.releaseIncidentLinkageVerified,
    redactionNoPiiVerified: input.redactionNoPiiVerified,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    observabilityTypecheckArtifactPath: input.observabilityTypecheckArtifactPath ?? null,
    observabilityTestArtifactPath: input.observabilityTestArtifactPath ?? null,
    webBuildArtifactPath: input.webBuildArtifactPath ?? null,
    dashboardBuildArtifactPath: input.dashboardBuildArtifactPath ?? null,
    mobileTypecheckArtifactPath: input.mobileTypecheckArtifactPath ?? null,
    sentrySdkArtifactPath: input.sentrySdkArtifactPath ?? null,
    otelPipelineArtifactPath: input.otelPipelineArtifactPath ?? null,
    structuredLoggingArtifactPath: input.structuredLoggingArtifactPath ?? null,
    sourceMapsDebugSymbolsArtifactPath: input.sourceMapsDebugSymbolsArtifactPath ?? null,
    forcedCapturesArtifactPath: input.forcedCapturesArtifactPath ?? null,
    errorReportPersistenceArtifactPath: input.errorReportPersistenceArtifactPath ?? null,
    dashboardTriageArtifactPath: input.dashboardTriageArtifactPath ?? null,
    providerWebhookArtifactPath: input.providerWebhookArtifactPath ?? null,
    alertRoutingArtifactPath: input.alertRoutingArtifactPath ?? null,
    releaseLinkageArtifactPath: input.releaseLinkageArtifactPath ?? null,
    redactionReviewArtifactPath: input.redactionReviewArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistObservabilityLaunchRun(
  repository: ObservabilityLaunchRunRepository,
  input: ObservabilityLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildObservabilityLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.observabilityLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

const observabilityLaunchEvidenceBlockers: Record<ObservabilityLaunchEvidenceFlag, string> = {
  observabilityTypecheckPassed: "Observability package typecheck evidence is required.",
  observabilityTestsPassed: "Observability package test evidence is required.",
  webBuildPassed: "Public web build evidence is required.",
  dashboardBuildPassed: "Dashboard build evidence is required.",
  mobileTypecheckPassed: "Mobile typecheck evidence is required.",
  sentryWebSdkConfigured: "Sentry web SDK must be configured for public web runtime.",
  sentryDashboardSdkConfigured: "Sentry dashboard SDK must be configured for admin triage runtime.",
  sentryMobileSdkConfigured: "Sentry mobile SDK must be configured for mobile crash capture.",
  openTelemetryExporterConfigured: "OpenTelemetry exporter configuration evidence is required.",
  structuredLoggingConfigured: "Structured logging configuration evidence is required.",
  sourceMapsUploaded: "Web and dashboard source-map upload evidence is required.",
  mobileDebugSymbolsUploaded: "Mobile debug-symbol upload evidence is required.",
  forcedWebCaptureVerified: "Forced web error capture smoke evidence is required.",
  forcedDashboardCaptureVerified: "Forced dashboard error capture smoke evidence is required.",
  forcedApiCaptureVerified: "Forced API error capture smoke evidence is required.",
  forcedWebhookCaptureVerified: "Forced webhook error capture must be verified without trusting unsigned provider payloads.",
  forcedMobileCrashVerified: "Forced mobile crash capture smoke evidence is required.",
  errorReportPersistenceConfigured: "Sanitized ErrorReport persistence evidence is required.",
  dashboardTenantTriageReadsVerified: "Tenant-isolated dashboard triage read evidence is required.",
  sentryWebhookSignatureReplayVerified: "Sentry/provider webhook signature and replay verification evidence is required.",
  alertRoutingVerified: "Alert routing proof is required.",
  releaseIncidentLinkageVerified: "Release incident linkage proof is required.",
  redactionNoPiiVerified: "Redaction and no-PII proof is required.",
  ciEvidenceCaptured: "CI evidence capture artifact is required.",
  secretSafeArtifactsCaptured: "Secret-safe artifact review evidence is required.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildObservabilityLaunchEvidenceDecision = (
  input: ObservabilityLaunchEvidenceInput,
): ObservabilityLaunchEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, observabilityLaunchRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, observabilityLaunchArtifactPaths);
  const missingControls = missingFrom(input.controls, observabilityLaunchRuntimeControls);
  const missingEvidence = observabilityLaunchRunPersistenceContract.evidenceBooleans.filter(
    (flag) => input.evidence?.[flag] !== true,
  );
  const blockers = missingEvidence.map((flag) => observabilityLaunchEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: observabilityLaunchRuntimeCommands,
    requiredArtifacts: observabilityLaunchArtifactPaths,
    requiredControls: observabilityLaunchRuntimeControls,
    requiredEvidence: observabilityLaunchRequiredEvidence,
    blockers,
  };
};

const observabilityLaunchPackageReadiness = buildObservabilityLaunchEvidencePlan({
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

export const observabilityLaunchRuntimeReadiness = {
  ...observabilityLaunchPackageReadiness,
  requiredCommands: observabilityLaunchRuntimeCommands,
  requiredControls: observabilityLaunchRuntimeControls,
  requiredEvidence: observabilityLaunchRequiredEvidence,
};


