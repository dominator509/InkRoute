import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  abuseControlArtifactPaths,
  abuseControlCommands,
  abuseControlKnownRateLimitRules,
  abuseControlRuntimePreview,
  abuseControlRuntimeReadiness,
  buildAbuseControlRuntimeContract,
} from "../lib/abuseControlRuntime";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-101 abuse control runtime contract", () => {
  it("maps route-family rate-limit policy to tenant-safe keys, bot challenges, abuse events, alerts, and fail-closed behavior", () => {
    const source = readWorkspaceFile("apps/web/lib/abuseControlRuntime.ts");

    expect(source).toContain("buildAbuseControlPlan");
    expect(source).toContain("buildAbuseControlRuntimeReadinessPlan");
    expect(source).toContain("load-route-family-policy");
    expect(source).toContain("derive-tenant-safe-abuse-key");
    expect(source).toContain("check-distributed-rate-limit");
    expect(source).toContain("apply-bot-challenge");
    expect(source).toContain("bypass-valid-provider-webhook");
    expect(source).toContain("reject-invalid-provider-webhook");
    expect(source).toContain("persist-redacted-abuse-event");
    expect(source).toContain("fail-closed-on-limiter-error");
    expect(abuseControlRuntimePreview.plan.status).toBe("blocked");
    expect(abuseControlRuntimePreview.actions).toContain("apply-bot-challenge");
    expect(abuseControlRuntimePreview.plan.blockers).toContain("Distributed Redis/edge rate limiter must be configured before production abuse controls are ready.");
  });

  it("keeps public route families and provider webhook bypass/rejection cases explicit", () => {
    expect(abuseControlKnownRateLimitRules.map((rule) => rule.id)).toEqual(
      expect.arrayContaining([
        "public-booking-submit",
        "public-upload-intent",
        "public-privacy-request",
        "public-message",
        "fallback-error-report",
        "provider-webhook",
        "dashboard-mutation",
      ]),
    );

    const validWebhook = buildAbuseControlRuntimeContract({
      ruleId: "provider-webhook",
      tenantId: "tenant_demo",
      ipHash: "ip_hash_provider",
      observedRequests: 1,
      windowSeconds: 60,
      routePath: "/api/webhooks/stripe",
      providerSignatureValid: true,
      redisConfigured: true,
      botChallengeConfigured: true,
      alertingConfigured: true,
    });
    const invalidWebhook = buildAbuseControlRuntimeContract({
      ruleId: "provider-webhook",
      tenantId: "tenant_demo",
      ipHash: "ip_hash_provider",
      observedRequests: 1,
      windowSeconds: 60,
      routePath: "/api/webhooks/stripe",
      providerSignatureValid: false,
      redisConfigured: true,
      botChallengeConfigured: true,
      alertingConfigured: true,
    });

    expect(validWebhook.actions).toContain("bypass-valid-provider-webhook");
    expect(invalidWebhook.actions).toContain("reject-invalid-provider-webhook");
    expect(invalidWebhook.signals).toContain("provider_signature_missing");
  });

  it("pins existing route-local abuse controls until distributed middleware/provider proof exists", () => {
    const bookingRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
    const privacyRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts");
    const uploadRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
    const errorRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/error-reports/route.ts");
    const dashboardPrivacyRoute = readWorkspaceFile("apps/dashboard/app/api/security/privacy-requests/route.ts");

    expect(bookingRoute).toContain("checkRateLimit");
    expect(bookingRoute).toContain("x-inkroute-bot-proof");
    expect(privacyRoute).toContain("public-privacy-request");
    expect(uploadRoute).toContain("public-upload-intent");
    expect(errorRoute).toContain("enforceErrorReportBotProtection");
    expect(errorRoute).toContain("buildAbuseMonitoringDecision");
    expect(dashboardPrivacyRoute).toContain("checkDashboardMutationRateLimit");
  });

  it("blocks runtime readiness until distributed limiter, middleware, challenge, logs, alerts, and integration proof exist", () => {
    expect(abuseControlRuntimeReadiness.status).toBe("blocked");
    expect(abuseControlRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Distributed Redis/Upstash or edge rate limiter must be configured for production routes.",
        "Web/dashboard edge middleware or route middleware must enforce abuse controls before handlers run.",
        "Bot challenge provider or challenge strategy must be configured for suspicious public traffic.",
        "Signed provider webhooks must bypass public bot challenges while retaining signature and replay validation.",
        "Privacy-safe AbuseEvent persistence must record hashed actor keys, tenant, route family, action, and reason.",
        "Abuse logs must prove raw IPs, tokens, payloads, signatures, and message bodies are redacted.",
      ]),
    );
  });

  it("pins CI, manifest, tracker, commands, and artifacts for GAP-101", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(abuseControlCommands).toContain("node scripts/security/verify-abuse-rate-limits.mjs");
    expect(abuseControlCommands).toContain("provider webhook signature bypass/rejection test");
    expect(abuseControlArtifactPaths).toContain("coverage/abuse-event-redaction.json");
    expect(ci).toContain("Run Phase 13 abuse control runtime contracts");
    expect(ci).toContain("apps/web/tests/abuse-control-runtime-static.test.ts");
    expect(ci).toContain("abuse-control-runtime-artifacts");
    expect(manifest).toContain("unit-web-abuse-control-runtime-static");
    expect(tracker).toContain("apps/web/lib/abuseControlRuntime.ts");
    expect(tracker).toContain("live distributed abuse-control proof remains open");
  });
});
