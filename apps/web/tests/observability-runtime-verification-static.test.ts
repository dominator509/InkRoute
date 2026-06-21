import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildObservabilityRuntimeArtifactReview,
  buildObservabilityRuntimeEvidenceDecision,
  buildObservabilityRuntimeExecutionPlan,
  buildRedactedObservabilityRuntimeArtifact,
  observabilityRuntimeArtifactPaths,
  observabilityRuntimeDecisionRequiredEvidence,
  observabilityRuntimeExecutionPolicy,
  observabilityRuntimeProofFiles,
  observabilityRuntimeRequiredExternalEvidence,
  observabilityRuntimeSurfaces,
  observabilityRuntimeVerificationCommands,
  observabilityRuntimeVerificationMatrix,
  observabilityRuntimeVerificationContract,
  safeSyntheticErrorPayload,
} from "../lib/observabilityRuntimeVerification";

const webGlobalError = readFileSync(join(process.cwd(), "apps/web/app/global-error.tsx"), "utf8");
const dashboardGlobalError = readFileSync(join(process.cwd(), "apps/dashboard/app/global-error.tsx"), "utf8");
const mobileStatusScreen = readFileSync(join(process.cwd(), "apps/mobile/src/screens/SystemStatusScreen.tsx"), "utf8");
const publicErrorRoute = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts"), "utf8");
const sentryWebhookRoute = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/sentry/route.ts"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-079 observability runtime verification contract", () => {
  it("enumerates forced-error surfaces across web, dashboard, API, webhook, mobile, persistence, provider proof, and closeout", () => {
    expect(observabilityRuntimeSurfaces.map((surface) => surface.id)).toEqual([
      "web-global-error",
      "dashboard-global-error",
      "public-error-report-api",
      "sentry-webhook-api",
      "dashboard-error-triage",
      "mobile-system-status",
      "sanitized-log-capture",
      "local-fallback-persistence",
      "sentry-provider-proof",
      "runtime-closeout-artifacts",
    ]);
    expect(observabilityRuntimeSurfaces.every((surface) => surface.syntheticOnly && surface.piiPolicy === "redacted-only")).toBe(true);
  });

  it("pins safe synthetic payloads and rejects raw sensitive proof assumptions", () => {
    expect(safeSyntheticErrorPayload.metadata.synthetic).toBe(true);
    expect(JSON.stringify(safeSyntheticErrorPayload)).not.toContain("sk_live");
    expect(JSON.stringify(safeSyntheticErrorPayload)).not.toContain("@example.com");
    expect(JSON.stringify(safeSyntheticErrorPayload)).toContain("[redacted:test-only]");
  });

  it("locks existing runtime boundaries for fallback UX and route/webhook ingestion", () => {
    expect(webGlobalError).toContain("/api/public/inkroute-demo/error-reports");
    expect(webGlobalError).toContain("apps/web/app/global-error.tsx");
    expect(dashboardGlobalError).toContain("/api/error-reports");
    expect(dashboardGlobalError).toContain("apps/dashboard/app/global-error.tsx");
    expect(mobileStatusScreen).toContain("Crash report draft");
    expect(mobileStatusScreen).toContain("forced crash proof pending");
    expect(publicErrorRoute).toContain("buildPublicErrorReportPreview");
    expect(sentryWebhookRoute).toContain("SENTRY_WEBHOOK_SECRET");
  });

  it("requires screenshots, sanitized logs, local persistence, dashboard triage, provider proof, and closeout artifacts", () => {
    expect(observabilityRuntimeVerificationContract.status).toBe("blocked");
    expect(observabilityRuntimeVerificationContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "browser forced-error fallback UX screenshot evidence",
        "mobile simulator/device forced-error UX evidence",
        "API/webhook forced-error envelope, sanitized log, and local persistence evidence",
        "dashboard triage and no-PII leakage evidence",
        "Sentry/provider runtime proof and attached closeout evidence",
      ]),
    );
    expect(observabilityRuntimeArtifactPaths).toContain("coverage/observability-runtime-closeout.md");
    expect(observabilityRuntimeArtifactPaths).toContain("test-results/observability/mobile");
  });

  it("pins the observability runtime verification command and artifact matrix", () => {
    expect(observabilityRuntimeVerificationCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/observability-runtime-verification-static.test.ts apps/web/tests/observability-routes.test.ts apps/dashboard/tests/error-report-route-static.test.ts",
      "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
      "pnpm playwright test apps/dashboard/tests/e2e/observability-dashboard-error.spec.ts",
      "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
      "pnpm --filter @inkroute/mobile test -- SystemStatusScreen",
      "Sentry/provider live runtime proof with redacted synthetic payloads",
      "no-PII observability artifact audit",
    ]);
    expect(observabilityRuntimeVerificationMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "static-contracts",
      "web-global-error",
      "dashboard-global-error",
      "public-error-report-api",
      "sentry-webhook-api",
      "dashboard-triage",
      "mobile-system-status",
      "sanitized-logs",
      "local-fallback-persistence",
      "sentry-provider-proof",
      "provider-webhook-proof",
      "no-pii-artifact-audit",
      "ci-observability-runtime-gate",
      "runtime-closeout",
    ]);
    expect(observabilityRuntimeSurfaces.map((surface) => surface.command)).toEqual(
      expect.arrayContaining([
        "pnpm playwright test apps/web/tests/e2e/observability-global-error.spec.ts",
        "pnpm playwright test apps/dashboard/tests/e2e/observability-dashboard-error.spec.ts",
        "pnpm playwright test apps/dashboard/tests/e2e/observability-triage.spec.ts",
      ]),
    );
    expect(observabilityRuntimeArtifactPaths).toContain("coverage/observability-no-pii-artifact-audit.json");
    expect(observabilityRuntimeArtifactPaths).toContain("coverage/observability-ci-evidence.json");
  });

  it("builds a synthetic-only provider-disabled observability execution plan", () => {
    const plan = buildObservabilityRuntimeExecutionPlan();

    expect(plan.id).toBe("gap-079-observability-runtime-verification");
    expect(plan.providerExecutionAllowed).toBe(false);
    expect(plan.syntheticOnly).toBe(true);
    expect(plan.piiPolicy).toBe("redacted-only");
    expect(plan.policy).toBe(observabilityRuntimeExecutionPolicy);
    expect(plan.policy).toEqual({
      executeBrowserForcedErrorChecks: false,
      executeApiWebhookForcedErrorSmoke: false,
      executeMobileForcedErrorCheck: false,
      executeSentryProviderProof: false,
      executeNoPiiArtifactAudit: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(observabilityRuntimeVerificationCommands);
    expect(plan.requiredArtifacts).toBe(observabilityRuntimeArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining(["coverage/observability-package-test.txt", "coverage/observability-runtime-static-contract.json"]),
    );
    expect(plan.runtimeProofArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/observability-web-error-screenshot.png",
        "coverage/observability-sentry-webhook-forced-error.json",
        "coverage/observability-local-fallback-persistence.json",
      ]),
    );
    expect(plan.providerArtifacts).toEqual([
      "coverage/observability-sentry-provider-proof-redacted.json",
      "coverage/observability-provider-webhook-proof-redacted.json",
    ]);
    expect(plan.privacyArtifacts).toEqual(["coverage/observability-no-pii-artifact-audit.json"]);
    expect(plan.closeoutArtifacts).toEqual(["coverage/observability-ci-evidence.json", "coverage/observability-runtime-closeout.md"]);
    expect(plan.externalEvidenceRequired).toBe(observabilityRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "web/dashboard forced-error screenshots",
      "API/webhook forced-error smoke artifacts",
      "mobile SystemStatusScreen forced-error screenshot",
      "sanitized log capture and local fallback persistence proof",
      "redacted Sentry/provider and provider webhook proof",
      "no-PII artifact audit, CI evidence, and closeout attachment",
    ]);
  });

  it("redacts observability runtime artifacts before persistence", () => {
    const rawArtifact = {
      eventId: "sentry-event-123",
      user: {
        email: "client@example.com",
        phone: "+1 555 010 4444",
        ipAddress: "192.168.1.44",
      },
      request: {
        authorization: "Bearer sentry-provider-token",
        route: "/booking/request",
      },
      stack: "Error: private booking note\n at handler",
      message: "Synthetic observability verification error [redacted:test-only]",
    };

    const redacted = buildRedactedObservabilityRuntimeArtifact(rawArtifact);
    const review = buildObservabilityRuntimeArtifactReview("observability-sentry-provider-proof", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 010 4444");
    expect(serialized).not.toContain("192.168.1.44");
    expect(serialized).not.toContain("sentry-provider-token");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).toContain("Synthetic observability verification error [redacted:test-only]");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/observability-no-pii-artifact-audit.json");
  });

  it("classifies GAP-079 observability runtime evidence as blocked until every redacted proof artifact is captured", () => {
    const blocked = buildObservabilityRuntimeEvidenceDecision({
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      staticContractsPassed: true,
      webGlobalErrorVerified: false,
      dashboardGlobalErrorVerified: false,
      publicErrorReportApiVerified: false,
      sentryWebhookApiVerified: false,
      dashboardTriageVerified: false,
      mobileSystemStatusVerified: false,
      sanitizedLogsCaptured: false,
      localFallbackPersistenceVerified: false,
      sentryProviderProofCaptured: false,
      providerWebhookProofCaptured: false,
      noPiiArtifactAuditPassed: false,
      ciEvidenceCaptured: false,
      runtimeCloseoutAttached: false,
      capturedArtifacts: ["coverage/observability-runtime-static-contract.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Web global-error forced-error screenshot evidence is required.",
        "Sentry webhook API forced-error evidence is required.",
        "Mobile SystemStatusScreen forced-error evidence is required.",
        "Redacted Sentry/provider runtime proof is required.",
        "No-PII observability artifact audit evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/observability-web-error-screenshot.png");
    expect(blocked.requiredCommands).toBe(observabilityRuntimeVerificationCommands);
    expect(blocked.requiredEvidence).toBe(observabilityRuntimeDecisionRequiredEvidence);

    const complete = buildObservabilityRuntimeEvidenceDecision({
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      staticContractsPassed: true,
      webGlobalErrorVerified: true,
      dashboardGlobalErrorVerified: true,
      publicErrorReportApiVerified: true,
      sentryWebhookApiVerified: true,
      dashboardTriageVerified: true,
      mobileSystemStatusVerified: true,
      sanitizedLogsCaptured: true,
      localFallbackPersistenceVerified: true,
      sentryProviderProofCaptured: true,
      providerWebhookProofCaptured: true,
      noPiiArtifactAuditPassed: true,
      ciEvidenceCaptured: true,
      runtimeCloseoutAttached: true,
      capturedArtifacts: observabilityRuntimeArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("wires the observability runtime verification gate into CI", () => {
    expect(ciWorkflow).toContain("Run Phase 11 observability runtime verification contracts");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/observability test");
    expect(ciWorkflow).toContain("apps/web/tests/observability-runtime-verification-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/observability-routes.test.ts");
    expect(ciWorkflow).toContain("observability-runtime-verification-artifacts");
    expect(ciWorkflow).toContain("coverage/observability-ci-evidence.json");
    expect(unitManifest).toContain("observabilityRuntimeVerificationMatrix");
    expect(gapTracker).toContain("observabilityRuntimeDecisionRequiredEvidence");
    expect(gapTracker).toContain("Observability runtime evidence classifier wired and runtime-matrix gated");
  });

  it("pins current observability runtime proof files for GAP-079", () => {
    expect(observabilityRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/observability/package.json",
      "packages/observability/src/index.ts",
      "packages/observability/tests/redaction-report.test.ts",
      "apps/web/lib/observabilityRuntimeVerification.ts",
      "apps/web/tests/observability-runtime-verification-static.test.ts",
      "apps/web/app/global-error.tsx",
      "apps/dashboard/app/global-error.tsx",
      "apps/dashboard/app/errors/page.tsx",
      "apps/mobile/src/screens/SystemStatusScreen.tsx",
      "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
      "apps/web/app/api/webhooks/sentry/route.ts",
      "apps/web/tests/observability-routes.test.ts",
      "apps/dashboard/tests/error-report-route-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of observabilityRuntimeProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
