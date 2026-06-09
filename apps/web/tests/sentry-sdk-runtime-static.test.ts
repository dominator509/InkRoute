import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  sanitizeSentryEvent,
  sentrySdkImplementationArtifactPaths,
  sentrySdkImplementationCommands,
  sentrySdkImplementationMatrix,
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
      "install @sentry/nextjs and @sentry/react-native",
      "configure Sentry DSN/auth/org/project secrets",
      "upload web/dashboard source maps and Expo source maps",
      "upload React Native debug symbols",
      "live synthetic Sentry captures with no-PII provider payload proof",
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

  it("requires Sentry SDK implementation contracts in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 11 Sentry SDK implementation contracts");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/observability test");
    expect(ciWorkflow).toContain("apps/web/tests/sentry-sdk-runtime-static.test.ts");
    expect(ciWorkflow).toContain("sentry-sdk-implementation-artifacts");
    expect(ciWorkflow).toContain("coverage/sentry-sdk-ci-evidence.json");
    expect(unitManifest).toContain("sentrySdkImplementationMatrix");
    expect(gapTracker).toContain("GAP-080 is sentry-sdk-implementation-matrix wired");
  });
});
