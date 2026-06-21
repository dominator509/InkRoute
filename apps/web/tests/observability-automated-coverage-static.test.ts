import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildObservabilityAutomatedCoverageArtifactReview,
  buildObservabilityAutomatedCoverageEvidenceDecision,
  buildObservabilityAutomatedCoverageContract,
  buildObservabilityAutomatedCoverageExecutionPlan,
  buildRedactedObservabilityAutomatedCoverageArtifact,
  observabilityAutomatedCoverageArtifactPaths,
  observabilityAutomatedCoverageCommands,
  observabilityAutomatedCoverageDecisionRequiredEvidence,
  observabilityAutomatedCoverageExecutionPolicy,
  observabilityAutomatedCoverageMatrix,
  observabilityAutomatedCoverageProofFiles,
  observabilityAutomatedCoverageRequiredExternalEvidence,
} from "../lib/observabilityAutomatedCoverage";

const root = join(__dirname, "..", "..");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const webE2eSource = readFileSync(join(root, "apps/web/tests/e2e/observability-global-error.spec.ts"), "utf8");
const dashboardE2eSource = readFileSync(join(root, "apps/dashboard/tests/e2e/observability-triage.spec.ts"), "utf8");
const mobileProofSource = readFileSync(join(root, "apps/mobile/tests/mobile-crash-proof-static.test.ts"), "utf8");
const unitManifest = readFileSync(join(root, "testing/manifests/unit-test-manifest.json"), "utf8");

describe("observability automated coverage closeout matrix", () => {
  it("adds executable browser targets for rendered global-error and dashboard triage coverage", () => {
    expect(webE2eSource).toContain("observability global-error rendered coverage");
    expect(webE2eSource).toContain("x-request-id");
    expect(webE2eSource).toContain("traceparent");
    expect(dashboardE2eSource).toContain("dashboard observability triage smoke");
    expect(dashboardE2eSource).toContain("Alert routing preview");
    expect(dashboardE2eSource).toContain("cache-control");
  });

  it("adds mobile simulator/device proof targets without claiming live device proof", () => {
    expect(mobileProofSource).toContain("mobile crash proof coverage contract");
    expect(mobileProofSource).toContain("forced crash proof pending");
    expect(mobileProofSource).toContain("fallbackReporterConfigured: true");
    expect(observabilityAutomatedCoverageArtifactPaths).toContain("coverage/observability-mobile-device-crash-proof-redacted.json");
  });

  it("keeps the automated coverage matrix explicit and artifact-backed", () => {
    expect(observabilityAutomatedCoverageCommands).toContain("pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts apps/dashboard/tests/e2e/observability-triage.spec.ts");
    expect(observabilityAutomatedCoverageMatrix.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "package-observability-helpers",
        "web-observability-routes",
        "web-ui-static",
        "rendered-global-error-boundaries",
        "dashboard-triage-browser-smoke",
        "mobile-crash-simulator-ui",
        "mobile-crash-device-proof",
        "ci-observability-coverage",
        "secret-safe-artifacts",
        "closeout-evidence",
      ]),
    );
  });

  it("pins current observability automated coverage proof files for GAP-086", () => {
    expect(observabilityAutomatedCoverageProofFiles).toEqual(
      expect.arrayContaining([
      "apps/web/package.json",
      "packages/observability/package.json",
        "packages/observability/src/index.ts",
        "packages/observability/tests/redaction-report.test.ts",
        "apps/web/lib/observabilityAutomatedCoverage.ts",
        "apps/web/tests/observability-routes.test.ts",
        "apps/web/tests/observability-ui-static.test.ts",
        "apps/web/tests/observability-automated-coverage-static.test.ts",
        "apps/web/tests/e2e/observability-global-error.spec.ts",
        "apps/dashboard/tests/e2e/observability-triage.spec.ts",
        "apps/mobile/tests/mobile-crash-static.test.ts",
        "apps/mobile/tests/mobile-crash-proof-static.test.ts",
        "apps/web/app/global-error.tsx",
        "apps/dashboard/app/global-error.tsx",
        "apps/mobile/src/screens/SystemStatusScreen.tsx",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of observabilityAutomatedCoverageProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("marks new coverage targets as wired while preserving execution blockers", () => {
    const contract = buildObservabilityAutomatedCoverageContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/observability helper tests must pass.",
        "Web observability route tests must pass.",
        "Dashboard errors page smoke test must pass in a rendered browser/runtime context.",
        "Mobile physical-device crash-report UI proof must be captured.",
      ]),
    );
    expect(contract.requiredEvidence).toBe(observabilityAutomatedCoverageRequiredEvidence);
  });

  it("builds a local execution plan without browser, mobile-device, or CI execution", () => {
    const plan = buildObservabilityAutomatedCoverageExecutionPlan();

    expect(plan.id).toBe("gap-086-observability-automated-coverage");
    expect(plan.browserExecutionAllowed).toBe(false);
    expect(plan.mobileDeviceExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(observabilityAutomatedCoverageExecutionPolicy);
    expect(plan.policy).toEqual({
      executeBrowserCoverage: false,
      executeMobileSimulator: false,
      executeMobilePhysicalDevice: false,
      executeWebhookIngestCoverage: false,
      executeCi: false,
      executeCloseoutEvidenceCapture: false,
    });
    expect(plan.requiredCommands).toBe(observabilityAutomatedCoverageCommands);
    expect(plan.requiredArtifacts).toBe(observabilityAutomatedCoverageArtifactPaths);
    expect(plan.localStaticArtifacts).toEqual(
      expect.arrayContaining(["coverage/observability-automated-route-static.json", "coverage/observability-webhook-ingest-coverage.json"]),
    );
    expect(plan.browserArtifacts).toEqual(
      expect.arrayContaining(["coverage/observability-global-error-rendered.json", "coverage/observability-dashboard-triage-smoke.json"]),
    );
    expect(plan.mobileArtifacts).toEqual(
      expect.arrayContaining(["coverage/observability-mobile-simulator-crash-ui.json", "coverage/observability-mobile-device-crash-proof-redacted.json"]),
    );
    expect(plan.ciArtifacts).toEqual(["coverage/observability-ci-evidence.json"]);
    expect(plan.closeoutArtifacts).toEqual(["coverage/observability-automated-closeout.md"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/observability-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(observabilityAutomatedCoverageRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "rendered web global-error Playwright proof",
      "dashboard triage browser smoke",
      "mobile simulator crash-report UI smoke",
      "mobile physical-device crash-report proof",
      "CI evidence, closeout evidence, and produced secret-safe artifacts",
    ]);
  });

  it("redacts observability automated coverage artifacts before persistence", () => {
    const rawArtifact = {
      screenshot: {
        url: "https://inkroute.example/error?email=client@example.com",
        token: "sentry-mobile-proof-token",
      },
      logs: {
        stack: "Error with private booking note",
        message: "Crash report from +1 555 010 1111",
      },
      result: "mobile physical-device proof pending",
    };

    const redacted = buildRedactedObservabilityAutomatedCoverageArtifact(rawArtifact);
    const review = buildObservabilityAutomatedCoverageArtifactReview("observability-mobile-device-crash-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("client@example.com");
    expect(serialized).not.toContain("sentry-mobile-proof-token");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).not.toContain("+1 555 010 1111");
    expect(serialized).toContain("mobile physical-device proof pending");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/observability-secret-safe-artifacts.json");
  });

  it("classifies GAP-086 observability automated coverage evidence as blocked until every browser, mobile, and closeout artifact is captured", () => {
    const blocked = buildObservabilityAutomatedCoverageEvidenceDecision({
      observabilityPackageTestsPassed: true,
      webTypecheckPassed: true,
      routeStaticTestsPassed: true,
      uiStaticTestsPassed: true,
      renderedGlobalErrorBrowserPassed: false,
      dashboardTriageBrowserPassed: false,
      mobileSimulatorCrashUiPassed: true,
      mobileDeviceCrashProofCaptured: false,
      webhookIngestCoveragePassed: true,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      closeoutEvidenceAttached: false,
      capturedArtifacts: ["coverage/observability-automated-coverage.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Rendered web global-error browser evidence is required.",
        "Dashboard triage browser smoke evidence is required.",
        "Mobile physical-device crash-report proof is required.",
        "CI observability automated coverage evidence is required.",
        "Observability automated coverage closeout evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/observability-global-error-rendered.json");
    expect(blocked.requiredCommands).toBe(observabilityAutomatedCoverageCommands);
    expect(blocked.requiredEvidence).toBe(observabilityAutomatedCoverageDecisionRequiredEvidence);

    const complete = buildObservabilityAutomatedCoverageEvidenceDecision({
      observabilityPackageTestsPassed: true,
      webTypecheckPassed: true,
      routeStaticTestsPassed: true,
      uiStaticTestsPassed: true,
      renderedGlobalErrorBrowserPassed: true,
      dashboardTriageBrowserPassed: true,
      mobileSimulatorCrashUiPassed: true,
      mobileDeviceCrashProofCaptured: true,
      webhookIngestCoveragePassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      closeoutEvidenceAttached: true,
      capturedArtifacts: observabilityAutomatedCoverageArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("is wired into CI and tracker evidence for GAP-086", () => {
    expect(workflowSource).toContain("Run Phase 11 observability automated coverage contracts");
    expect(workflowSource).toContain("apps/web/tests/observability-automated-coverage-static.test.ts");
    expect(workflowSource).toContain("apps/mobile/tests/mobile-crash-proof-static.test.ts");
    expect(workflowSource).toContain("observability-playwright-triage-results");
    expect(workflowSource).toContain("coverage/observability-ci-evidence.json");
    expect(observabilityAutomatedCoverageArtifactPaths).toContain("coverage/observability-secret-safe-artifacts.json");
    expect(observabilityAutomatedCoverageArtifactPaths).toContain("coverage/observability-automated-closeout.md");
    expect(unitManifest).toContain("secret-safe artifact proof pending");
    expect(trackerSource).toContain("GAP-086");
    expect(trackerSource).toContain("apps/web/lib/observabilityAutomatedCoverage.ts");
    expect(trackerSource).toContain("observabilityAutomatedCoverageDecisionRequiredEvidence");
    expect(trackerSource).toContain("Observability automated coverage evidence classifier wired and runtime-matrix gated");
    expect(trackerSource).toContain("live browser/device execution");
  });
});

