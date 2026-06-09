import {
  buildOpenTelemetryRuntimeReadinessPlan,
  buildTelemetryPipelinePlan,
  redactMetadata,
  type RuntimeEnvironment,
} from "@inkroute/observability";
import type { NextRequest, NextResponse } from "next/server";

export const telemetryRuntimeArtifactPaths = [
  "coverage/opentelemetry-runtime-middleware.json",
  "coverage/opentelemetry-request-trace-propagation.json",
  "coverage/opentelemetry-structured-log-redacted.json",
  "coverage/opentelemetry-errorreport-correlation.json",
  "coverage/opentelemetry-high-risk-export-suppression.json",
  "coverage/opentelemetry-live-backend-proof-redacted.json",
  "test-results/opentelemetry-runtime",
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

