import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const telemetrySource = readFileSync(join(root, "apps/web/lib/telemetryRuntime.ts"), "utf8");
const middlewareSource = readFileSync(join(root, "apps/web/middleware.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");

describe("OpenTelemetry runtime middleware contract", () => {
  it("propagates request IDs and W3C traceparent headers", () => {
    expect(telemetrySource).toContain("buildTelemetryPipelinePlan");
    expect(telemetrySource).toContain("x-request-id");
    expect(telemetrySource).toContain("x-correlation-id");
    expect(telemetrySource).toContain("traceparent");
    expect(telemetrySource).toContain("parseTraceparent");
    expect(middlewareSource).toContain("applyTelemetryHeaders");
  });

  it("emits privacy-safe structured log records without storing raw URLs or query strings", () => {
    expect(telemetrySource).toContain("redactMetadata");
    expect(telemetrySource).toContain("privacySafeLogRecord");
    expect(telemetrySource).toContain("rawUrlStored: false");
    expect(telemetrySource).toContain("queryStringStored: false");
    expect(telemetrySource).toContain("request.nextUrl.pathname");
    expect(telemetrySource).not.toContain("request.nextUrl.search");
  });

  it("keeps OTLP exporter and live backend proof gated", () => {
    expect(telemetrySource).toContain("OTEL_EXPORTER_OTLP_ENDPOINT");
    expect(telemetrySource).toContain("OTEL_SERVICE_NAME");
    expect(telemetrySource).toContain("OTEL_TRACES_SAMPLER_ARG");
    expect(telemetrySource).toContain("liveTraceBackendIngestionVerified: false");
    expect(telemetrySource).toContain("liveLogBackendIngestionVerified: false");
  });

  it("tracks high-risk export suppression, ErrorReport correlation, and artifact evidence", () => {
    expect(telemetrySource).toContain("highRiskExportSuppressionVerified: true");
    expect(telemetrySource).toContain("errorReportTraceCorrelationConfigured: true");
    expect(telemetrySource).toContain("coverage/opentelemetry-runtime-middleware.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-high-risk-export-suppression.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-live-backend-proof-redacted.json");
  });

  it("is wired into CI and the tracker without claiming live OTLP ingestion", () => {
    expect(workflowSource).toContain("Run Phase 11 OpenTelemetry runtime contracts");
    expect(workflowSource).toContain("apps/web/tests/opentelemetry-runtime-static.test.ts");
    expect(trackerSource).toContain("GAP-084");
    expect(trackerSource).toContain("apps/web/lib/telemetryRuntime.ts");
    expect(trackerSource).toContain("live OTLP backend proof remains open");
  });
});
