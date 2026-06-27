import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildDashboardTelemetryRuntimePlan,
  buildOpenTelemetryArtifactReview,
  buildOpenTelemetryEvidenceDecision,
  buildOpenTelemetryExecutionPlan,
  buildRedactedOpenTelemetryArtifact,
  buildTelemetryCorrelationMetadata,
  openTelemetryDecisionRequiredEvidence,
  buildWorkerTelemetryRuntimePlan,
  openTelemetryExecutionPolicy,
  openTelemetryRequiredExternalEvidence,
  telemetryRuntimeArtifactPaths,
  telemetryRuntimeCommands,
  telemetryRuntimeProofFiles,
} from "../lib/telemetryRuntime";

const root = join(__dirname, "..", "..");
const telemetrySource = readFileSync(join(root, "apps/web/lib/telemetryRuntime.ts"), "utf8");
const middlewareSource = readFileSync(join(root, "apps/web/middleware.ts"), "utf8");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");
const rootPackageJson = readFileSync(join(root, "package.json"), "utf8");
const evidenceWriterSource = readFileSync(join(root, "scripts/observability/write-opentelemetry-evidence.mjs"), "utf8");

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
      "local-evidence-writer",
    ]) {
      expect(telemetrySource).toContain(`id: "${id}"`);
    }
  });

  it("tracks high-risk export suppression, ErrorReport correlation, and artifact evidence", () => {
    expect(telemetrySource).toContain("highRiskExportSuppressionVerified: true");
    expect(telemetrySource).toContain("errorReportTraceCorrelationConfigured: true");
    expect(telemetrySource).toContain("persistErrorReportTelemetryCorrelation");
    expect(telemetrySource).toContain("repository.errorReport.update");
    expect(telemetrySource).toContain("providerBackedProofCaptured: false");
    expect(telemetrySource).toContain("coverage/opentelemetry-runtime-middleware.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-high-risk-export-suppression.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-live-backend-proof-redacted.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-sdk-exporter-install.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-no-pii-artifact-audit.json");
    expect(telemetrySource).toContain("coverage/opentelemetry-ci-evidence.json");
  });

  it("source-wires dashboard, worker, and ErrorReport correlation plans without live provider claims", () => {
    const dashboard = buildDashboardTelemetryRuntimePlan({
      route: "/dashboard/errors",
      requestId: "req_static",
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
      otlpEndpointConfigured: false,
    });
    const worker = buildWorkerTelemetryRuntimePlan({
      route: "queue:observability",
      requestId: "req_worker",
      otlpEndpointConfigured: false,
    });
    const metadata = buildTelemetryCorrelationMetadata({
      errorReportId: "err_static",
      serviceName: "dashboard",
      route: "/dashboard/errors",
      requestId: "req_static",
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
    });

    expect(dashboard.readiness.blockers).not.toContain("Dashboard middleware must propagate OpenTelemetry request and trace context.");
    expect(worker.readiness.blockers).not.toContain("Worker runtimes must attach OpenTelemetry request IDs and trace context.");
    expect(dashboard.privacySafeLogRecord.attributes.rawUrlStored).toBe(false);
    expect(worker.privacySafeLogRecord.attributes.queryStringStored).toBe(false);
    expect(metadata).toMatchObject({
      telemetry: {
        rawUrlStored: false,
        queryStringStored: false,
        providerBackedProofCaptured: false,
        liveOtlpBackendProofCaptured: false,
      },
    });
    expect(telemetrySource).toContain("buildDashboardTelemetryRuntimePlan");
    expect(telemetrySource).toContain("buildWorkerTelemetryRuntimePlan");
    expect(telemetrySource).toContain("buildTelemetryCorrelationMetadata");
  });

  it("builds a local execution plan without SDK/exporter install, live backend export, or provider-backed correlation", () => {
    const plan = buildOpenTelemetryExecutionPlan();

    expect(plan.id).toBe("gap-084-opentelemetry-runtime");
    expect(plan.sdkExporterInstallationAllowed).toBe(false);
    expect(plan.liveBackendExportAllowed).toBe(false);
    expect(plan.providerBackedCorrelationAllowed).toBe(false);
    expect(plan.policy).toBe(openTelemetryExecutionPolicy);
    expect(plan.policy).toEqual({
      installSdkExporter: false,
      executeDashboardWorkerTelemetrySmoke: false,
      executeProviderBackedCorrelation: false,
      executeLiveBackendExport: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(telemetryRuntimeCommands);
    expect(plan.requiredArtifacts).toBe(telemetryRuntimeArtifactPaths);
    expect(plan.localEvidenceArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/opentelemetry-runtime-middleware.json",
        "coverage/opentelemetry-structured-log-redacted.json",
        "coverage/opentelemetry-high-risk-export-suppression.json",
      ]),
    );
    expect(plan.instrumentationArtifacts).toEqual(
      expect.arrayContaining(["coverage/opentelemetry-dashboard-middleware.json", "coverage/opentelemetry-worker-runtime.json"]),
    );
    expect(plan.exporterArtifacts).toEqual(["coverage/opentelemetry-sdk-exporter-install.json"]);
    expect(plan.liveBackendArtifacts).toEqual(["coverage/opentelemetry-live-backend-proof-redacted.json"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/opentelemetry-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(openTelemetryRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "OpenTelemetry SDK/exporter package installation proof",
      "dashboard and worker telemetry middleware smoke execution",
      "provider-backed ErrorReport trace correlation smoke",
      "live OTLP trace/log backend ingestion proof",
      "CI evidence and produced secret-safe artifacts",
    ]);
  });

  it("redacts OpenTelemetry artifacts before persistence", () => {
    const rawArtifact = {
      otlp: {
        endpoint: "https://otlp.example.com/v1/traces?token=otlp-secret-token",
        authorization: "Bearer otlp-live-backend-token",
      },
      log: {
        rawUrl: "https://inkroute.example/book?email=client@example.com&phone=+15550108888",
        stack: "Error with private booking note",
        path: "/book",
      },
    };

    const redacted = buildRedactedOpenTelemetryArtifact(rawArtifact);
    const review = buildOpenTelemetryArtifactReview("opentelemetry-live-backend-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("otlp-secret-token");
    expect(serialized).not.toContain("otlp-live-backend-token");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+15550108888");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).toContain("/book");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/opentelemetry-secret-safe-artifacts.json");
  });

  it("pins current OpenTelemetry runtime proof files for GAP-084", () => {
    expect(telemetryRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/observability/package.json",
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "apps/web/lib/telemetryRuntime.ts",
        "scripts/observability/write-opentelemetry-evidence.mjs",
        "apps/web/middleware.ts",
        "apps/web/tests/opentelemetry-runtime-static.test.ts",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of telemetryRuntimeProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-084 OpenTelemetry evidence as blocked until every runtime artifact is captured", () => {
    const blocked = buildOpenTelemetryEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractPassed: true,
      webMiddlewareVerified: true,
      requestTracePropagationVerified: true,
      structuredLogRedactionVerified: true,
      errorReportCorrelationVerified: false,
      sdkExporterInstalled: false,
      dashboardMiddlewareVerified: false,
      workerRuntimeVerified: false,
      serviceMetadataSamplingVerified: false,
      highRiskExportSuppressionVerified: true,
      liveBackendProofCaptured: false,
      noPiiArtifactAuditPassed: true,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: ["coverage/opentelemetry-runtime-static-contract.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "ErrorReport trace correlation evidence is required.",
        "OpenTelemetry SDK/exporter installation evidence is required.",
        "Dashboard telemetry middleware evidence is required.",
        "Worker telemetry runtime evidence is required.",
        "Live OTLP trace/log backend ingestion proof is required.",
      ]),
    );
    expect(blocked.blockers).not.toContain("High-risk telemetry export suppression evidence is required.");
    expect(blocked.blockers).not.toContain("OpenTelemetry no-PII artifact audit evidence is required.");
    expect(blocked.blockers).not.toContain("Secret-safe artifact review evidence is required.");
    expect(blocked.missingArtifacts).toContain("coverage/opentelemetry-sdk-exporter-install.json");
    expect(blocked.requiredCommands).toBe(telemetryRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(openTelemetryDecisionRequiredEvidence);

    const complete = buildOpenTelemetryEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractPassed: true,
      webMiddlewareVerified: true,
      requestTracePropagationVerified: true,
      structuredLogRedactionVerified: true,
      errorReportCorrelationVerified: true,
      sdkExporterInstalled: true,
      dashboardMiddlewareVerified: true,
      workerRuntimeVerified: true,
      serviceMetadataSamplingVerified: true,
      highRiskExportSuppressionVerified: true,
      liveBackendProofCaptured: true,
      noPiiArtifactAuditPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: telemetryRuntimeArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("is wired into CI and the tracker without claiming live OTLP ingestion", () => {
    expect(workflowSource).toContain("Run Phase 11 OpenTelemetry runtime contracts");
    expect(workflowSource).toContain("apps/web/tests/opentelemetry-runtime-static.test.ts");
    expect(trackerSource).toContain("GAP-084");
    expect(trackerSource).toContain("apps/web/lib/telemetryRuntime.ts");
    expect(workflowSource).toContain("coverage/opentelemetry-ci-evidence.json");
    expect(unitManifest).toContain("telemetryRuntimeMatrix");
    expect(trackerSource).toContain("OpenTelemetry evidence classifier wired and runtime-matrix gated");
    expect(trackerSource).toContain("openTelemetryDecisionRequiredEvidence");
    expect(trackerSource).toContain("buildOpenTelemetryExecutionPlan");
    expect(trackerSource).toContain("openTelemetryExecutionPolicy");
    expect(trackerSource).toContain("openTelemetryRequiredExternalEvidence");
    expect(trackerSource).toContain("live OTLP backend proof");
    expect(rootPackageJson).toContain("observability:opentelemetry-evidence");
    expect(evidenceWriterSource).toContain("externalExportAllowed: false");
    expect(evidenceWriterSource).toContain("rawUrlStored: false");
    expect(evidenceWriterSource).toContain("opentelemetry-runtime-static-contract.json");
    expect(evidenceWriterSource).toContain("opentelemetry-errorreport-correlation.json");
    expect(evidenceWriterSource).toContain("opentelemetry-sdk-exporter-install.json");
    expect(evidenceWriterSource).toContain("opentelemetry-dashboard-middleware.json");
    expect(evidenceWriterSource).toContain("opentelemetry-worker-runtime.json");
    expect(evidenceWriterSource).toContain("opentelemetry-service-metadata-sampling.json");
    expect(evidenceWriterSource).toContain("opentelemetry-live-backend-proof-redacted.json");
    expect(evidenceWriterSource).toContain("opentelemetry-ci-evidence.json");
    expect(evidenceWriterSource).toContain("live OTLP trace/log backend ingestion proof");
  });
});
