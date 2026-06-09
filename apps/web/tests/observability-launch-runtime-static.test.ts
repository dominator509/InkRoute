import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  observabilityLaunchArtifactPaths,
  observabilityLaunchRuntimeCommands,
  observabilityLaunchRuntimeControls,
  observabilityLaunchRuntimeMatrix,
  observabilityLaunchRuntimeReadiness,
} from "../lib/observabilityLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("observability launch runtime contract", () => {
  const observabilityPackageJson = readRepoFile("packages/observability/package.json");
  const observabilitySource = readRepoFile("packages/observability/src/index.ts");
  const observabilityTests = readRepoFile("packages/observability/tests/redaction-report.test.ts");
  const dashboardErrorReportRoute = readRepoFile("apps/dashboard/app/api/error-reports/route.ts");
  const dashboardErrorReportTest = readRepoFile("apps/dashboard/tests/error-report-route-static.test.ts");
  const webGlobalError = readRepoFile("apps/web/app/global-error.tsx");
  const dashboardGlobalError = readRepoFile("apps/dashboard/app/global-error.tsx");
  const mobileStatusScreen = readRepoFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins observability launch commands, controls, matrix rows, and artifacts", () => {
    expect(observabilityLaunchRuntimeCommands).toEqual([
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
    ]);
    expect(observabilityLaunchRuntimeControls).toContain("redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard");
    expect(observabilityLaunchRuntimeControls).toContain("provider-webhook-signature-and-replay-verification-before-sentry-reconciliation");
    expect(observabilityLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "web-dashboard-mobile-build-gates",
      "sentry-sdk-runtime-configuration",
      "otel-structured-logging",
      "source-map-debug-symbol-resolution",
      "forced-capture-smokes",
      "error-report-persistence-triage",
      "provider-webhook-replay-alerts-release-linkage",
      "redaction-ci-secret-safe-artifacts",
    ]);
    expect(observabilityLaunchArtifactPaths).toContain("coverage/observability-launch-runtime.json");
    expect(observabilityLaunchArtifactPaths).toContain("test-results/observability-launch-runtime");
  });

  it("keeps helper, package scripts, dashboard triage, and crash surfaces wired", () => {
    expect(observabilityPackageJson).toContain('"typecheck"');
    expect(observabilityPackageJson).toContain('"test"');
    expect(observabilitySource).toContain("buildObservabilityLaunchEvidencePlan");
    expect(observabilityTests).toContain("buildObservabilityLaunchEvidencePlan");
    expect(dashboardErrorReportRoute).toContain("error:read");
    expect(dashboardErrorReportRoute).toContain("AuditLog");
    expect(dashboardErrorReportTest).toContain("metadata redaction");
    expect(webGlobalError).toContain("ErrorBoundary");
    expect(dashboardGlobalError).toContain("ErrorBoundary");
    expect(mobileStatusScreen).toContain("Crash reporting");
  });

  it("keeps observability runtime blockers explicit until provider evidence exists", () => {
    expect(observabilityLaunchRuntimeReadiness.status).toBe("blocked");
    expect(observabilityLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(observabilityLaunchRuntimeReadiness.requiredCommands).toEqual([...observabilityLaunchRuntimeCommands]);
    expect(observabilityLaunchRuntimeReadiness.requiredControls).toEqual([
      "Run redaction before external capture, persistence, alert routing, issue handoff, telemetry export, or dashboard display.",
      "Tag events with tenant-safe release, environment, route, request ID, trace ID, and surface metadata only.",
      "Upload source maps and debug symbols from CI with secret-backed credentials and redacted artifacts.",
      "Persist only sanitized ErrorReport summaries and enforce tenant isolation for dashboard triage reads.",
      "Verify provider webhook signatures and replay protection before reconciling Sentry issue actions.",
      "Route high-risk payloads to dashboard-only review instead of external alerts or issue handoff.",
    ]);
    expect(observabilityLaunchRuntimeReadiness.requiredEvidence).toContain(
      "Sentry web/dashboard/mobile SDK and OpenTelemetry exporter configuration evidence",
    );
    expect(observabilityLaunchRuntimeReadiness.blockers).toContain(
      "Sentry web SDK must be configured for public web runtime.",
    );
    expect(observabilityLaunchRuntimeReadiness.blockers).toContain(
      "Forced webhook error capture must be verified without trusting unsigned provider payloads.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming observability launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 11 observability launch runtime contracts");
    expect(ciWorkflow).toContain("observability-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("observability-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-observability-launch-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/observabilityLaunchRuntime.ts");
    expect(gapTracker).toContain("live Sentry/OTel/mobile crash SDK wiring, source-map/debug-symbol upload, forced capture evidence, provider webhook replay verification, alert routing, release linkage, CI evidence, and secret-safe artifacts remain open");
  });
});
