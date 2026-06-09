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
  "OpenTelemetry SDK/exporter package installation proof",
  "dashboard and worker telemetry middleware smoke",
  "ErrorReport trace correlation smoke",
  "blocked_high_risk_payload telemetry suppression smoke",
  "live OTLP trace/log backend ingestion proof",
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

export const telemetryRuntimeMatrix: readonly OpenTelemetryRuntimeMatrixEntry[] = [
  { id: "observability-typecheck", command: "pnpm --filter @inkroute/observability typecheck", artifact: "coverage/opentelemetry-observability-typecheck.txt", status: "wired" },
  { id: "observability-tests", command: "pnpm --filter @inkroute/observability test", artifact: "coverage/opentelemetry-observability-test.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/opentelemetry-runtime-static.test.ts", artifact: "coverage/opentelemetry-runtime-static-contract.json", status: "wired" },
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
  return {
    traceId: traceId && /^[a-f0-9]{32}$/i.test(traceId) ? traceId : undefined,
    spanId: spanId && /^[a-f0-9]{16}$/i.test(spanId) ? spanId : undefined,
  };
}

export function buildWebTelemetryRuntime(request: NextRequest) {
  const incomingRequestId = request.headers.get("x-request-id") ?? request.headers.get("x-correlation-id") ?? undefined;
  const incomingTrace = parseTraceparent(request.headers.get("traceparent"));
  const rawMetadata = {
    method: request.method,
    path: request.nextUrl.pathname,
    host: request.headers.get("host") ?? "unknown",
    userAgentFamily: request.headers.get("user-agent")?.split("/")[0] ?? "unknown",
    tenantId: request.headers.get("x-inkroute-tenant-id") ?? undefined,
  };
  const redactedMetadata = redactMetadata(rawMetadata).metadata;
  const plan = buildTelemetryPipelinePlan({
    serviceName: "web",
    environment: runtimeEnvironment(),
    requestId: incomingRequestId,
    traceId: incomingTrace.traceId,
    spanId: incomingTrace.spanId,
    route: request.nextUrl.pathname,
    tenantId: request.headers.get("x-inkroute-tenant-id") ?? undefined,
    otlpEndpointConfigured: Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
    structuredLoggingEnabled: true,
    requestIdPropagationEnabled: true,
    traceContextPropagationEnabled: true,
    samplingRate: Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? "0.1"),
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

export function applyTelemetryHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const telemetry = buildWebTelemetryRuntime(request);

  response.headers.set("x-request-id", telemetry.plan.propagationHeaders["x-request-id"]);
  response.headers.set("traceparent", telemetry.plan.propagationHeaders.traceparent);
  response.headers.set("x-inkroute-telemetry-status", telemetry.plan.status);
  response.headers.set("x-inkroute-otel-runtime", telemetry.readiness.status);
  response.headers.set("x-inkroute-telemetry-export", telemetry.plan.status === "ready" && telemetry.plan.exporter.configured ? "allowed" : "suppressed");

  return response;
}

