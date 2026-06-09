import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  observabilityRuntimeArtifactPaths,
  observabilityRuntimeSurfaces,
  observabilityRuntimeVerificationContract,
  safeSyntheticErrorPayload,
} from "../lib/observabilityRuntimeVerification";

const webGlobalError = readFileSync(join(process.cwd(), "apps/web/app/global-error.tsx"), "utf8");
const dashboardGlobalError = readFileSync(join(process.cwd(), "apps/dashboard/app/global-error.tsx"), "utf8");
const mobileStatusScreen = readFileSync(join(process.cwd(), "apps/mobile/src/screens/SystemStatusScreen.tsx"), "utf8");
const publicErrorRoute = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts"), "utf8");
const sentryWebhookRoute = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/sentry/route.ts"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");

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

  it("wires the observability runtime verification gate into CI", () => {
    expect(ciWorkflow).toContain("Run Phase 11 observability runtime verification contracts");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/observability test");
    expect(ciWorkflow).toContain("apps/web/tests/observability-runtime-verification-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/observability-routes.test.ts");
    expect(ciWorkflow).toContain("observability-runtime-verification-artifacts");
  });
});
