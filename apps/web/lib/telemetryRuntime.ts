import {
  buildOpenTelemetryRuntimeReadinessPlan,
  buildTelemetryPipelinePlan,
  redactMetadata,
  type RuntimeEnvironment,
} from "@inkroute/observability";
import type { NextRequest, NextResponse } from "next/server";

export type OpenTelemetryRuntimeStatus =
  | "wired"
  | "package-gated"
  | "instrumentation-gated"
  | "exporter-gated"
  | "privacy-gated"
  | "backend-gated"
  | "ci-gated";

export interface OpenTelemetryRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: OpenTelemetryRuntimeStatus;
}

export const telemetryRuntimeCommands = [
  "pnpm --filter @inkroute/observability typecheck",
  "pnpm --filter @inkroute/observability test",
  "pnpm vitest run apps/web/tests/opentelemetry-runtime-static.test.ts",
  "pnpm observability:opentelemetry-evidence",
  "OpenTelemetry SDK/exporter package installation proof",
  "dashboard and worker telemetry middleware smoke",
  "ErrorReport trace correlation smoke",
  "blocked_high_risk_payload telemetry suppression smoke",
  "live OTLP trace/log backend ingestion proof",
] as const;

export const openTelemetryRequiredExternalEvidence = [
  "OpenTelemetry SDK/exporter package installation proof",
  "dashboard and worker telemetry middleware smoke execution",
  "provider-backed ErrorReport trace correlation smoke",
  "live OTLP trace/log backend ingestion proof",
  "CI evidence and produced secret-safe artifacts",
] as const;

export const telemetryRuntimeArtifactPaths = [
  "coverage/opentelemetry-observability-typecheck.txt",
  "coverage/opentelemetry-observability-test.txt",
  "coverage/opentelemetry-runtime-static-contract.json",
  "coverage/opentelemetry-runtime-middleware.json",
  "coverage/opentelemetry-request-trace-propagation.json",
  "coverage/opentelemetry-structured-log-redacted.json",
  "coverage/opentelemetry-errorreport-correlation.json",
  "coverage/opentelemetry-sdk-exporter-install.json",
  "coverage/opentelemetry-dashboard-middleware.json",
  "coverage/opentelemetry-worker-runtime.json",
  "coverage/opentelemetry-service-metadata-sampling.json",
  "coverage/opentelemetry-high-risk-export-suppression.json",
  "coverage/opentelemetry-live-backend-proof-redacted.json",
  "coverage/opentelemetry-no-pii-artifact-audit.json",
  "coverage/opentelemetry-ci-evidence.json",
  "coverage/opentelemetry-secret-safe-artifacts.json",
  "test-results/opentelemetry-runtime",
] as const;

export const telemetryRuntimeProofFiles = [
  "packages/observability/package.json",
  "packages/observability/src/index.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "apps/web/lib/telemetryRuntime.ts",
  "scripts/observability/write-opentelemetry-evidence.mjs",
  "apps/web/middleware.ts",
  "apps/web/tests/opentelemetry-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type OpenTelemetryEvidenceArtifact = (typeof telemetryRuntimeArtifactPaths)[number];

export interface OpenTelemetryExecutionPlan {
  readonly id: "gap-084-opentelemetry-runtime";
  readonly sdkExporterInstallationAllowed: false;
  readonly liveBackendExportAllowed: false;
  readonly providerBackedCorrelationAllowed: false;
  readonly policy: typeof openTelemetryExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof telemetryRuntimeCommands;
  readonly requiredArtifacts: typeof telemetryRuntimeArtifactPaths;
  readonly localEvidenceArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly instrumentationArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly exporterArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly liveBackendArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly privacyArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly secretSafeArtifactPath: OpenTelemetryEvidenceArtifact;
  readonly externalEvidenceRequired: typeof openTelemetryRequiredExternalEvidence;
}

export interface OpenTelemetryExecutionPolicy {
  readonly installSdkExporter: false;
  readonly executeDashboardWorkerTelemetrySmoke: false;
  readonly executeProviderBackedCorrelation: false;
  readonly executeLiveBackendExport: false;
  readonly executeCi: false;
}

export interface OpenTelemetryArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: OpenTelemetryEvidenceArtifact;
}

const telemetrySensitiveKeyPattern =
  /(?:authorization|body|clientsecret|cookie|credential|email|endpoint|password|phone|private|raw|secret|stack|token|url)/i;
const telemetryEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const telemetryPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const telemetryTokenPattern = /\b(?:bearer|otel|otlp|sk|xox|ya29)[A-Za-z0-9._:/-]{8,}\b/gi;

function redactTelemetryArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (telemetrySensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(telemetryEmailPattern, "[REDACTED_EMAIL]")
      .replace(telemetryPhonePattern, "[REDACTED_PHONE]")
      .replace(telemetryTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactTelemetryArtifactValue(entry));
  }

  if (typeof value === "object") {
    return redactMetadata(
      Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactTelemetryArtifactValue(entryValue, entryKey)])),
    ).metadata;
  }

  return value;
}

export function buildRedactedOpenTelemetryArtifact(artifact: unknown): unknown {
  return redactTelemetryArtifactValue(artifact);
}

export const openTelemetryExecutionPolicy: OpenTelemetryExecutionPolicy = {
  installSdkExporter: false,
  executeDashboardWorkerTelemetrySmoke: false,
  executeProviderBackedCorrelation: false,
  executeLiveBackendExport: false,
  executeCi: false,
};

export function buildOpenTelemetryExecutionPlan(): OpenTelemetryExecutionPlan {
  return {
    id: "gap-084-opentelemetry-runtime",
    sdkExporterInstallationAllowed: false,
    liveBackendExportAllowed: false,
    providerBackedCorrelationAllowed: false,
    policy: openTelemetryExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: telemetryRuntimeCommands,
    requiredArtifacts: telemetryRuntimeArtifactPaths,
    localEvidenceArtifacts: [
      "coverage/opentelemetry-runtime-static-contract.json",
      "coverage/opentelemetry-runtime-middleware.json",
      "coverage/opentelemetry-request-trace-propagation.json",
      "coverage/opentelemetry-structured-log-redacted.json",
      "coverage/opentelemetry-high-risk-export-suppression.json",
      "coverage/opentelemetry-no-pii-artifact-audit.json",
    ],
    instrumentationArtifacts: [
      "coverage/opentelemetry-errorreport-correlation.json",
      "coverage/opentelemetry-dashboard-middleware.json",
      "coverage/opentelemetry-worker-runtime.json",
      "coverage/opentelemetry-service-metadata-sampling.json",
    ],
    exporterArtifacts: ["coverage/opentelemetry-sdk-exporter-install.json"],
    liveBackendArtifacts: ["coverage/opentelemetry-live-backend-proof-redacted.json"],
    privacyArtifacts: ["coverage/opentelemetry-no-pii-artifact-audit.json"],
    secretSafeArtifactPath: "coverage/opentelemetry-secret-safe-artifacts.json",
    externalEvidenceRequired: openTelemetryRequiredExternalEvidence,
  };
}

export function buildOpenTelemetryArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: OpenTelemetryEvidenceArtifact = "coverage/opentelemetry-secret-safe-artifacts.json",
): OpenTelemetryArtifactReview {
  const redactedArtifact = buildRedactedOpenTelemetryArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(telemetryEmailPattern) ? "email" : null,
    serialized.match(telemetryPhonePattern) ? "phone" : null,
    serialized.match(telemetryTokenPattern) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface OpenTelemetryEvidenceInput {
  readonly observabilityTypecheckPassed: boolean;
  readonly observabilityTestsPassed: boolean;
  readonly staticContractPassed: boolean;
  readonly webMiddlewareVerified: boolean;
  readonly requestTracePropagationVerified: boolean;
  readonly structuredLogRedactionVerified: boolean;
  readonly errorReportCorrelationVerified: boolean;
  readonly sdkExporterInstalled: boolean;
  readonly dashboardMiddlewareVerified: boolean;
  readonly workerRuntimeVerified: boolean;
  readonly serviceMetadataSamplingVerified: boolean;
  readonly highRiskExportSuppressionVerified: boolean;
  readonly liveBackendProofCaptured: boolean;
  readonly noPiiArtifactAuditPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly OpenTelemetryEvidenceArtifact[];
}

export const openTelemetryDecisionRequiredEvidence = [
  "observability package typecheck/test and OpenTelemetry static contract artifacts",
  "web middleware, request/trace propagation, structured log redaction, and ErrorReport correlation artifacts",
  "SDK/exporter install, dashboard middleware, worker runtime, service metadata, sampling, suppression, and live backend artifacts",
  "no-PII artifact audit, CI evidence, and redacted secret-safe artifact review",
] as const;

export interface OpenTelemetryEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly OpenTelemetryEvidenceArtifact[];
  readonly requiredCommands: typeof telemetryRuntimeCommands;
  readonly requiredEvidence: typeof openTelemetryDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildOpenTelemetryEvidenceDecision(input: OpenTelemetryEvidenceInput): OpenTelemetryEvidenceDecision {
  const blockers = [
    !input.observabilityTypecheckPassed ? "Observability package typecheck evidence is required." : null,
    !input.observabilityTestsPassed ? "Observability package test evidence is required." : null,
    !input.staticContractPassed ? "OpenTelemetry runtime static contract evidence is required." : null,
    !input.webMiddlewareVerified ? "Web telemetry middleware evidence is required." : null,
    !input.requestTracePropagationVerified ? "Request ID and traceparent propagation evidence is required." : null,
    !input.structuredLogRedactionVerified ? "Privacy-safe structured log redaction evidence is required." : null,
    !input.errorReportCorrelationVerified ? "ErrorReport trace correlation evidence is required." : null,
    !input.sdkExporterInstalled ? "OpenTelemetry SDK/exporter installation evidence is required." : null,
    !input.dashboardMiddlewareVerified ? "Dashboard telemetry middleware evidence is required." : null,
    !input.workerRuntimeVerified ? "Worker telemetry runtime evidence is required." : null,
    !input.serviceMetadataSamplingVerified ? "Service metadata and sampling policy evidence is required." : null,
    !input.highRiskExportSuppressionVerified ? "High-risk telemetry export suppression evidence is required." : null,
    !input.liveBackendProofCaptured ? "Live OTLP trace/log backend ingestion proof is required." : null,
    !input.noPiiArtifactAuditPassed ? "OpenTelemetry no-PII artifact audit evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI OpenTelemetry runtime gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = telemetryRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: telemetryRuntimeCommands,
    requiredEvidence: openTelemetryDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-084 OpenTelemetry evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-084 OpenTelemetry evidence remains blocked until SDK/exporter, dashboard/worker, correlation, suppression, OTLP backend, no-PII, CI, and redaction artifacts are captured.",
  };
}

export const telemetryRuntimeMatrix: readonly OpenTelemetryRuntimeMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/opentelemetry-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/opentelemetry-observability-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/opentelemetry-runtime-static.test.ts", artifact: "coverage/opentelemetry-runtime-static-contract.json", status: "wired" },
  { id: "local-evidence-writer", command: "pnpm observability:opentelemetry-evidence", artifact: "coverage/opentelemetry-structured-log-redacted.json", status: "wired" },
  { id: "web-middleware", command: "web middleware propagation smoke", artifact: "coverage/opentelemetry-runtime-middleware.json", status: "wired" },
  { id: "request-trace-propagation", command: "request ID and traceparent propagation smoke", artifact: "coverage/opentelemetry-request-trace-propagation.json", status: "wired" },
  { id: "structured-log-redaction", command: "privacy-safe structured log audit", artifact: "coverage/opentelemetry-structured-log-redacted.json", status: "wired" },
  { id: "errorreport-correlation", command: "ErrorReport trace correlation smoke", artifact: "coverage/opentelemetry-errorreport-correlation.json", status: "instrumentation-gated" },
  { id: "sdk-exporter-install", command: "OpenTelemetry SDK/exporter package installation proof", artifact: "coverage/opentelemetry-sdk-exporter-install.json", status: "package-gated" },
  { id: "dashboard-middleware", command: "dashboard telemetry middleware smoke", artifact: "coverage/opentelemetry-dashboard-middleware.json", status: "instrumentation-gated" },
  { id: "worker-runtime", command: "worker telemetry runtime smoke", artifact: "coverage/opentelemetry-worker-runtime.json", status: "instrumentation-gated" },
  { id: "service-metadata-sampling", command: "service metadata and sampling policy proof", artifact: "coverage/opentelemetry-service-metadata-sampling.json", status: "exporter-gated" },
  { id: "high-risk-suppression", command: "blocked_high_risk_payload telemetry suppression smoke", artifact: "coverage/opentelemetry-high-risk-export-suppression.json", status: "privacy-gated" },
  { id: "live-backend-proof", command: "live OTLP trace/log backend ingestion proof", artifact: "coverage/opentelemetry-live-backend-proof-redacted.json", status: "backend-gated" },
  { id: "no-pii-artifact-audit", command: "OpenTelemetry no-PII artifact audit", artifact: "coverage/opentelemetry-no-pii-artifact-audit.json", status: "privacy-gated" },
  { id: "ci-opentelemetry-runtime", command: "GitHub Actions OpenTelemetry runtime gate", artifact: "coverage/opentelemetry-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted OpenTelemetry artifact audit", artifact: "coverage/opentelemetry-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

function runtimeEnvironment(): RuntimeEnvironment {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  if (process.env.NODE_ENV === "test") return "test";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function readBooleanEnv(name: string): boolean {
  const value = process.env[name];
  return value === "1" || value === "true" || value === "enabled";
}

function parseTraceparent(traceparent: string | null): { traceId?: string; spanId?: string } {
  if (!traceparent) {
    return {};
  }

  const [, traceId, spanId] = traceparent.split("-");
  const parsedTraceId = traceId && /^[a-f0-9]{32}$/i.test(traceId) ? traceId : undefined;
  const parsedSpanId = spanId && /^[a-f0-9]{16}$/i.test(spanId) ? spanId : undefined;

  return {
    ...(parsedTraceId ? { traceId: parsedTraceId } : {}),
    ...(parsedSpanId ? { spanId: parsedSpanId } : {}),
  };
}

export function buildWebTelemetryRuntime(request: NextRequest) {
  const incomingRequestId = request.headers.get("x-request-id") ?? request.headers.get("x-correlation-id") ?? "request-id-missing";
  const incomingTrace = parseTraceparent(request.headers.get("traceparent"));
  const rawMetadata = {
    method: request.method,
    path: request.nextUrl.pathname,
    host: request.headers.get("host") ?? "unknown",
    userAgentFamily: request.headers.get("user-agent")?.split("/")[0] ?? "unknown",
    tenantId: request.headers.get("x-inkroute-tenant-id") ?? "tenant-id-missing",
  };
  const redactedMetadata = redactMetadata(rawMetadata).metadata;
  const plan = buildTelemetryPipelinePlan({
    serviceName: "web",
    environment: runtimeEnvironment(),
    requestId: incomingRequestId,
    traceId: incomingTrace.traceId ?? "trace-id-missing",
    spanId: incomingTrace.spanId ?? "span-id-missing",
    route: request.nextUrl.pathname,
    tenantId: request.headers.get("x-inkroute-tenant-id") ?? "tenant-id-missing",
    otlpEndpointConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    structuredLoggingEnabled: true,
    requestIdPropagationEnabled: true,
    traceContextPropagationEnabled: true,
    sampleRate: Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? "0.1"),
    attributes: redactedMetadata,
  });
  const readiness = buildOpenTelemetryRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityTestsPassed: false,
    observabilityTypecheckPassed: false,
    otelSdkInstalled: readBooleanEnv("OTEL_SDK_INSTALLED"),
    otlpExporterInstalled: readBooleanEnv("OTEL_OTLP_EXPORTER_INSTALLED"),
    webMiddlewareInstrumented: true,
    dashboardMiddlewareInstrumented: false,
    apiRoutesInstrumented: true,
    workerRuntimeInstrumented: false,
    requestIdPropagationConfigured: true,
    traceContextPropagationConfigured: true,
    errorReportTraceCorrelationConfigured: true,
    structuredRuntimeLoggingConfigured: true,
    otlpEndpointConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    serviceMetadataConfigured: Boolean(process.env.OTEL_SERVICE_NAME),
    samplingPolicyConfigured: Boolean(process.env.OTEL_TRACES_SAMPLER_ARG),
    highRiskExportSuppressionVerified: true,
    liveTraceBackendIngestionVerified: false,
    liveLogBackendIngestionVerified: false,
    noPiiTelemetryVerified: true,
  });

  return {
    plan,
    readiness,
    privacySafeLogRecord: {
      ...plan.logRecord,
      attributes: {
        ...plan.logRecord.attributes,
        rawUrlStored: false,
        queryStringStored: false,
        artifactPaths: telemetryRuntimeArtifactPaths,
      },
    },
    artifactPaths: telemetryRuntimeArtifactPaths,
  };
}

export interface TelemetryRuntimePlanInput {
  readonly requestId?: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly route?: string;
  readonly tenantId?: string;
  readonly environment?: RuntimeEnvironment;
  readonly otlpEndpointConfigured?: boolean;
  readonly sampleRate?: number;
}

export interface TelemetryErrorReportCorrelationInput extends TelemetryRuntimePlanInput {
  readonly errorReportId: string;
  readonly serviceName: "web" | "dashboard" | "worker";
  readonly existingMetadata?: Record<string, unknown>;
  readonly artifactPaths?: readonly OpenTelemetryEvidenceArtifact[];
}

export interface TelemetryErrorReportCorrelationRepository {
  readonly errorReport: {
    update(input: {
      readonly where: { readonly id: string };
      readonly data: { readonly metadata: Record<string, unknown> };
    }): Promise<unknown>;
  };
}

function buildServiceTelemetryRuntimePlan(
  serviceName: "dashboard" | "worker",
  input: TelemetryRuntimePlanInput = {},
) {
  const route = input.route ?? (serviceName === "dashboard" ? "/dashboard" : "worker-runtime");
  const redactedMetadata = redactMetadata({
    serviceName,
    route,
    tenantId: input.tenantId ?? "tenant-id-missing",
  }).metadata;
  const plan = buildTelemetryPipelinePlan({
    serviceName,
    environment: input.environment ?? runtimeEnvironment(),
    requestId: input.requestId ?? "request-id-missing",
    traceId: input.traceId ?? "trace-id-missing",
    spanId: input.spanId ?? "span-id-missing",
    route,
    tenantId: input.tenantId ?? "tenant-id-missing",
    otlpEndpointConfigured: input.otlpEndpointConfigured ?? Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    structuredLoggingEnabled: true,
    requestIdPropagationEnabled: true,
    traceContextPropagationEnabled: true,
    sampleRate: input.sampleRate ?? Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? "0.1"),
    attributes: redactedMetadata,
  });
  const readiness = buildOpenTelemetryRuntimeReadinessPlan({
    packageScripts: ["test", "typecheck"],
    observabilityTestsPassed: false,
    observabilityTypecheckPassed: false,
    otelSdkInstalled: readBooleanEnv("OTEL_SDK_INSTALLED"),
    otlpExporterInstalled: readBooleanEnv("OTEL_OTLP_EXPORTER_INSTALLED"),
    webMiddlewareInstrumented: true,
    dashboardMiddlewareInstrumented: serviceName === "dashboard",
    apiRoutesInstrumented: serviceName === "dashboard",
    workerRuntimeInstrumented: serviceName === "worker",
    requestIdPropagationConfigured: true,
    traceContextPropagationConfigured: true,
    errorReportTraceCorrelationConfigured: true,
    structuredRuntimeLoggingConfigured: true,
    otlpEndpointConfigured: input.otlpEndpointConfigured ?? Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    serviceMetadataConfigured: Boolean(process.env.OTEL_SERVICE_NAME),
    samplingPolicyConfigured: Boolean(process.env.OTEL_TRACES_SAMPLER_ARG),
    highRiskExportSuppressionVerified: true,
    liveTraceBackendIngestionVerified: false,
    liveLogBackendIngestionVerified: false,
    noPiiTelemetryVerified: true,
  });

  return {
    plan,
    readiness,
    privacySafeLogRecord: {
      ...plan.logRecord,
      attributes: {
        ...plan.logRecord.attributes,
        rawUrlStored: false,
        queryStringStored: false,
        artifactPaths: telemetryRuntimeArtifactPaths,
      },
    },
    artifactPaths: telemetryRuntimeArtifactPaths,
  };
}

export function buildDashboardTelemetryRuntimePlan(input: TelemetryRuntimePlanInput = {}) {
  return buildServiceTelemetryRuntimePlan("dashboard", input);
}

export function buildWorkerTelemetryRuntimePlan(input: TelemetryRuntimePlanInput = {}) {
  return buildServiceTelemetryRuntimePlan("worker", input);
}

export function buildTelemetryCorrelationMetadata(input: TelemetryErrorReportCorrelationInput): Record<string, unknown> {
  const redactedTelemetry = redactMetadata({
    serviceName: input.serviceName,
    requestId: input.requestId,
    traceId: input.traceId,
    spanId: input.spanId,
    route: input.route,
    tenantId: input.tenantId,
  }).metadata;

  return {
    ...(input.existingMetadata ?? {}),
    telemetry: {
      ...redactedTelemetry,
      rawUrlStored: false,
      queryStringStored: false,
      artifactPaths: input.artifactPaths ?? telemetryRuntimeArtifactPaths,
      providerBackedProofCaptured: false,
      liveOtlpBackendProofCaptured: false,
    },
  };
}

export async function persistErrorReportTelemetryCorrelation(
  repository: TelemetryErrorReportCorrelationRepository,
  input: TelemetryErrorReportCorrelationInput,
): Promise<unknown> {
  return repository.errorReport.update({
    where: { id: input.errorReportId },
    data: {
      metadata: buildTelemetryCorrelationMetadata(input),
    },
  });
}

export function applyTelemetryHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const telemetry = buildWebTelemetryRuntime(request);

  response.headers.set("x-request-id", telemetry.plan.propagationHeaders["x-request-id"] ?? "request-id-missing");
  response.headers.set("traceparent", telemetry.plan.propagationHeaders.traceparent ?? "00-00000000000000000000000000000000-0000000000000000-00");
  response.headers.set("x-inkroute-telemetry-status", telemetry.plan.status);
  response.headers.set("x-inkroute-otel-runtime", telemetry.readiness.status);
  response.headers.set("x-inkroute-telemetry-export", telemetry.plan.status === "ready" && telemetry.plan.exporter.configured ? "allowed" : "suppressed");

  return response;
}



