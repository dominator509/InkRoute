import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildRedactedSentrySdkImplementationArtifact,
  buildSentrySdkImplementationArtifactReview,
  buildSentrySdkImplementationEvidenceDecision,
  buildSentrySdkImplementationExecutionPlan,
  sanitizeSentryEvent,
  sentrySdkImplementationArtifactPaths,
  sentrySdkImplementationCommands,
  sentrySdkImplementationDecisionRequiredEvidence,
  sentrySdkImplementationExecutionPolicy,
  sentrySdkImplementationMatrix,
  sentrySdkImplementationProofFiles,
  sentrySdkImplementationRequiredExternalEvidence,
  webSentryImplementationPlan,
  webSentryRuntimeConfig,
} from "../lib/sentryRuntime";

const webInstrumentation = readFileSync(join(process.cwd(), "apps/web/instrumentation.ts"), "utf8");
const webServerConfig = readFileSync(join(process.cwd(), "apps/web/sentry.server.config.ts"), "utf8");
const webEdgeConfig = readFileSync(join(process.cwd(), "apps/web/sentry.edge.config.ts"), "utf8");
const dashboardInstrumentation = readFileSync(join(process.cwd(), "apps/dashboard/instrumentation.ts"), "utf8");
const dashboardServerConfig = readFileSync(join(process.cwd(), "apps/dashboard/sentry.server.config.ts"), "utf8");
const dashboardClientConfig = readFileSync(join(process.cwd(), "apps/dashboard/instrumentation-client.ts"), "utf8");
const mobileRuntime = readFileSync(join(process.cwd(), "apps/mobile/src/lib/sentryRuntime.ts"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-080 Sentry SDK runtime implementation", () => {
  it("wires web, dashboard, and mobile Sentry configuration files without leaking credentials", () => {
    expect(webInstrumentation).toContain("webSentryRuntimeConfig");
    expect(webServerConfig).toContain("beforeSendPipeline");
    expect(webEdgeConfig).toContain("tracesSampleRate");
    expect(dashboardInstrumentation).toContain("dashboardSentryRuntimeConfig");
    expect(dashboardServerConfig).toContain("beforeSendPipeline");
    expect(dashboardClientConfig).toContain("dashboard-browser-client-config-ready-for-sentry-init");
    expect(mobileRuntime).toContain("mobileSentryRuntimeConfig");
    expect(mobileRuntime).toContain("sanitizeMobileSentryEvent");
    expect(webInstrumentation).not.toContain("SENTRY_AUTH_TOKEN=");
  });

  it("keeps beforeSend redaction and tenant-safe tags in the runtime plan", () => {
    const event = sanitizeSentryEvent({
      message: "Client email avery@example.com and token sk_live_secret appeared",
      extra: { card: "4242", privateUrl: "https://storage.example/private?token=secret" },
      tags: { tenantId: "tenant_demo" },
    });
    expect(JSON.stringify(event)).not.toContain("avery@example.com");
    expect(JSON.stringify(event)).not.toContain("sk_live_secret");
    expect(event.tags?.surface).toBe("web-nextjs");
    expect(webSentryRuntimeConfig.beforeSendPipeline).toContain("redactSensitiveText");
    expect(webSentryRuntimeConfig.beforeSendPipeline).toContain("tenant-safe-tags");
  });

  it("tracks remaining package, credential, source-map, debug-symbol, and live proof blockers", () => {
    expect(webSentryImplementationPlan.status).toBe("blocked");
    expect(webSentryImplementationPlan.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Sentry package installation evidence for web, dashboard, and mobile",
        "Sentry credential and CI secret configuration evidence",
        "source-map, debug-symbol, and CI release artifact upload evidence",
        "live synthetic capture, provider issue, and no-PII payload evidence",
      ]),
    );
  });

  it("pins the Sentry SDK implementation command and artifact matrix", () => {
    expect(sentrySdkImplementationCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm vitest run apps/web/tests/sentry-sdk-runtime-static.test.ts apps/mobile/tests/mobile-crash-static.test.ts",
      "install @sentry/nextjs for web",
      "install @sentry/nextjs for dashboard",
      "install @sentry/react-native for mobile",
      "configure Sentry DSN/auth/org/project secrets",
      "upload web/dashboard source maps",
      "upload Expo source maps",
      "upload React Native debug symbols",
      "live synthetic web Sentry capture",
      "live synthetic dashboard Sentry capture",
      "live synthetic mobile Sentry capture",
      "no-PII provider payload proof",
      "GitHub Actions Sentry SDK implementation gate",
    ]);
    expect(sentrySdkImplementationMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "static-contracts",
      "web-nextjs-package",
      "dashboard-nextjs-package",
      "mobile-react-native-package",
      "secret-backed-config",
      "web-dashboard-source-maps",
      "expo-source-maps",
      "react-native-debug-symbols",
      "live-web-capture",
      "live-dashboard-capture",
      "live-mobile-capture",
      "provider-no-pii-proof",
      "ci-sentry-sdk-gate",
    ]);
    expect(sentrySdkImplementationArtifactPaths).toContain("coverage/sentry-expo-source-map-upload-redacted.json");
    expect(sentrySdkImplementationArtifactPaths).toContain("coverage/sentry-sdk-ci-evidence.json");
  });

  it("builds a credential-disabled local Sentry implementation execution plan", () => {
    const plan = buildSentrySdkImplementationExecutionPlan();

    expect(plan.id).toBe("gap-080-sentry-sdk-implementation");
    expect(plan.credentialAccessAllowed).toBe(false);
    expect(plan.providerExecutionAllowed).toBe(false);
    expect(plan.sourceMapUploadAllowed).toBe(false);
    expect(plan.policy).toBe(sentrySdkImplementationExecutionPolicy);
    expect(plan.policy).toEqual({
      accessSentryCredentials: false,
      executeProviderRequests: false,
      uploadWebDashboardSourceMaps: false,
      uploadExpoSourceMaps: false,
      uploadReactNativeDebugSymbols: false,
      executeLiveSyntheticCaptures: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(sentrySdkImplementationCommands);
    expect(plan.requiredArtifacts).toBe(sentrySdkImplementationArtifactPaths);
    expect(plan.localContractArtifacts).toEqual(
      expect.arrayContaining(["coverage/sentry-sdk-observability-test.txt", "coverage/sentry-sdk-static-contract.json"]),
    );
    expect(plan.packageArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/sentry-sdk-web-nextjs-package.json",
        "coverage/sentry-sdk-dashboard-nextjs-package.json",
        "coverage/sentry-sdk-mobile-react-native-package.json",
      ]),
    );
    expect(plan.secretArtifacts).toEqual(["coverage/sentry-sdk-env-secrets-redacted.json"]);
    expect(plan.uploadArtifacts).toEqual(
      expect.arrayContaining(["coverage/sentry-source-map-upload-redacted.json", "coverage/sentry-debug-symbol-upload-redacted.json"]),
    );
    expect(plan.liveCaptureArtifacts).toEqual(
      expect.arrayContaining(["coverage/sentry-live-web-capture-redacted.json", "coverage/sentry-live-mobile-capture-redacted.json"]),
    );
    expect(plan.noPiiArtifactPath).toBe("coverage/sentry-provider-no-pii-proof-redacted.json");
    expect(plan.externalEvidenceRequired).toBe(sentrySdkImplementationRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "@sentry package installation evidence",
      "redacted DSN/auth/org/project secret evidence",
      "web/dashboard source-map, Expo source-map, and React Native debug-symbol upload proof",
      "live synthetic web/dashboard/mobile Sentry captures",
      "provider no-PII payload proof and CI evidence",
    ]);
  });

  it("redacts Sentry provider artifacts before persistence", () => {
    const rawArtifact = {
      dsn: "https://public@sentry.example/123",
      authToken: "sentry-auth-token-secret",
      org: "inkroute",
      project: "production",
      event: {
        message: "Client email avery@example.com token sk_live_secret phone +1 555 010 5555",
        privateStack: "Error: private booking note",
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_sentry_sdk",
      reviewerHandle: "reviewer_sentry_owner",
      codeownerSelector: "CODEOWNER:observability-platform-team",
    };

    const redacted = buildRedactedSentrySdkImplementationArtifact(rawArtifact);
    const review = buildSentrySdkImplementationArtifactReview("sentry-live-web-capture", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("sentry-auth-token-secret");
    expect(serialized).not.toContain("avery@example.com");
    expect(serialized).not.toContain("sk_live_secret");
    expect(serialized).not.toContain("+1 555 010 5555");
    expect(serialized).not.toContain("private booking note");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_sentry_sdk");
    expect(serialized).not.toContain("reviewer_sentry_owner");
    expect(serialized).not.toContain("CODEOWNER:observability-platform-team");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/sentry-provider-no-pii-proof-redacted.json");
  });

  it("classifies GAP-080 Sentry SDK evidence as blocked until every provider artifact is captured", () => {
    const blocked = buildSentrySdkImplementationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractsPassed: true,
      webNextjsPackageInstalled: false,
      dashboardNextjsPackageInstalled: false,
      mobileReactNativePackageInstalled: false,
      sentrySecretsConfigured: false,
      webDashboardSourceMapsUploaded: false,
      expoSourceMapsUploaded: false,
      reactNativeDebugSymbolsUploaded: false,
      liveWebCaptureVerified: false,
      liveDashboardCaptureVerified: false,
      liveMobileCaptureVerified: false,
      providerNoPiiProofCaptured: false,
      ciEvidenceCaptured: false,
      capturedArtifacts: ["coverage/sentry-sdk-static-contract.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "@sentry/nextjs web package installation evidence is required.",
        "@sentry/react-native mobile package installation evidence is required.",
        "Redacted Sentry DSN/auth/org/project secret evidence is required.",
        "React Native debug-symbol upload evidence is required.",
        "No-PII provider payload proof evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/sentry-sdk-web-nextjs-package.json");
    expect(blocked.requiredCommands).toBe(sentrySdkImplementationCommands);
    expect(blocked.requiredEvidence).toBe(sentrySdkImplementationDecisionRequiredEvidence);

    const complete = buildSentrySdkImplementationEvidenceDecision({
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: true,
      staticContractsPassed: true,
      webNextjsPackageInstalled: true,
      dashboardNextjsPackageInstalled: true,
      mobileReactNativePackageInstalled: true,
      sentrySecretsConfigured: true,
      webDashboardSourceMapsUploaded: true,
      expoSourceMapsUploaded: true,
      reactNativeDebugSymbolsUploaded: true,
      liveWebCaptureVerified: true,
      liveDashboardCaptureVerified: true,
      liveMobileCaptureVerified: true,
      providerNoPiiProofCaptured: true,
      ciEvidenceCaptured: true,
      capturedArtifacts: sentrySdkImplementationArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe redacted provider artifacts captured");
  });

  it("requires Sentry SDK implementation contracts in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 11 Sentry SDK implementation contracts");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/observability test");
    expect(ciWorkflow).toContain("apps/web/tests/sentry-sdk-runtime-static.test.ts");
    expect(ciWorkflow).toContain("sentry-sdk-implementation-artifacts");
    expect(ciWorkflow).toContain("coverage/sentry-sdk-ci-evidence.json");
    expect(unitManifest).toContain("sentrySdkImplementationMatrix");
    expect(gapTracker).toContain("Sentry SDK implementation evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("sentrySdkImplementationDecisionRequiredEvidence");
  });

  it("pins current Sentry SDK implementation proof files for GAP-080", () => {
    expect(sentrySdkImplementationProofFiles).toEqual(expect.arrayContaining([
      "packages/observability/package.json",
      "packages/observability/src/index.ts",
      "packages/observability/tests/redaction-report.test.ts",
      "apps/web/lib/sentryRuntime.ts",
      "apps/web/instrumentation.ts",
      "apps/web/instrumentation-client.ts",
      "apps/web/sentry.server.config.ts",
      "apps/web/sentry.edge.config.ts",
      "apps/dashboard/lib/sentryRuntime.ts",
      "apps/dashboard/instrumentation.ts",
      "apps/dashboard/instrumentation-client.ts",
      "apps/dashboard/sentry.server.config.ts",
      "apps/mobile/src/lib/sentryRuntime.ts",
      "apps/mobile/src/lib/mobileCrash.ts",
      "apps/web/tests/sentry-sdk-runtime-static.test.ts",
      "apps/mobile/tests/mobile-crash-static.test.ts",
      "BUG_CRASH_REPORTING_PLAN.md",
      ".env.example",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of sentrySdkImplementationProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
