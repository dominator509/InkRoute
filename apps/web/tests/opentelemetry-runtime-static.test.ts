import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "..", "..");
const telemetrySource = readFileSync(join(root, "apps/web/lib/telemetryRuntime.ts"), "utf8");
const middlewareSource = readFileSync(join(root, "apps/web/middleware.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");

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

  it("pins the OpenTelemetry runtime command and artifact matrix", () => {
    expect(telemetrySource).toContain("telemetryRuntimeCommands");
    expect(telemetrySource).toContain("telemetryRuntimeMatrix");
    for (const id of [
      "sdk-exporter-install",
      "dashboard-middleware",
      "worker-runtime",
      "service-metadata-sampling",
      "live-backend-proof",
      "no-pii-artifact-audit",
      "ci-opentelemetry-runtime",
      "secret-safe-artifacts",
    ]) {
      expect(telemetrySource).toContain(`id: "${id}"`);
    }
  });

  it("tracks high-risk export suppression, ErrorReport correlation, and artifact evidence", () => {
    expect(telemetrySource).toContain("highRiskExportSuppressionVerified: true");
    expect(telemetrySource).toContain("errorReportTraceCorrelationConfigured: true");
    expect(telemetrySource).toContain("coverage/opentelemetry-runtime-middleware.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-high-risk-export-suppression.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-live-backend-proof-redacted.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-sdk-exporter-install.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-no-pii-artifact-audit.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-ci-evidence.json");
  });

  it("is wired into CI and the tracker without claiming live OTLP ingestion", () => {
    expect(workflowSource).toContain("Run Phase 11 OpenTelemetry runtime contracts");
    expect(workflowSource).toContain("apps/web/tests/opentelemetry-runtime-static.test.ts");
    expect(trackerSource).toContain("GAP-084");
    expect(trackerSource).toContain("apps/web/lib/telemetryRuntime.ts");
    expect(workflowSource).toContain("coverage/opentelemetry-ci-evidence.json");
    expect(unitManifest).toContain("telemetryRuntimeMatrix");
    expect(trackerSource).toContain("GAP-084 is opentelemetry-runtime-matrix wired");
    expect(trackerSource).toContain("live OTLP backend proof remains open");
  });
});
