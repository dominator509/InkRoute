import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  abuseEventPersistencePreview,
  abuseControlArtifactPaths,
  abuseControlCommands,
  abuseControlExternalCommands,
  abuseControlExternalArtifacts,
  abuseControlExecutionPolicy,
  abuseControlKnownRateLimitRules,
  abuseControlLocalArtifacts,
  abuseControlLocalCommands,
  abuseControlProofFiles,
  abuseControlRequiredExternalEvidence,
  abuseControlRuntimePreview,
  abuseControlRuntimeReadiness,
  buildAbuseControlArtifactReview,
  buildAbuseControlEvidenceDecision,
  buildAbuseControlExecutionPlan,
  buildAbuseEventPersistenceContract,
  buildAbuseControlRuntimeContract,
  buildRedactedAbuseControlArtifact,
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
    expect(source).toContain("enforce-route-local-abuse-before-handler");
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

  it("pins durable privacy-safe AbuseEvent rows, hashed actor keys, redaction, and fail-closed persistence", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildAbuseEventPersistenceContract({
      tenantId: "tenant_demo",
      actorUserId: "user_demo",
      routeFamily: "dashboard-mutation",
      routePattern: "/api/security/privacy-requests",
      abuseKeyHash: "sha256:tenant-route-user-redacted",
      ipHash: "sha256:redacted",
      userAgentHash: "sha256:redacted",
      action: "fail_closed",
      reason: "Limiter provider failed closed before handler execution.",
      limiterProvider: "upstash",
      limiterDecision: "failed_closed",
      observedRequests: 1,
      windowSeconds: 60,
      botChallengeRequired: false,
      alertDispatchedAt: "2026-06-09T00:40:00.000Z",
      failClosed: true,
    });

    expect(schema).toContain("model AbuseEvent");
    expect(schema).toContain("abuseKeyHash");
    expect(schema).toContain("redactedMetadata");
    expect(schema).toContain("@@index([tenantId, routeFamily, createdAt])");
    expect(contract.transactionWrites).toEqual(["AbuseEvent", "AuditLog"]);
    expect(contract.hashedFields).toContain("ipHash");
    expect(contract.redactedFields).toContain("providerSignature");
    expect(contract.failClosedGate).toBe("persist_before_reject_on_limiter_error");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(abuseEventPersistencePreview.modelName).toBe("AbuseEvent");
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
    expect(abuseControlRuntimeReadiness.blockers).not.toContain(
      "Web/dashboard edge middleware or route middleware must enforce abuse controls before handlers run.",
    );
  });

  it("keeps local verifier scripts aligned to the GAP-101 artifact manifest", () => {
    const rateLimitVerifier = readWorkspaceFile("scripts/security/verify-abuse-rate-limits.mjs");
    const alertVerifier = readWorkspaceFile("scripts/security/verify-abuse-alerts.mjs");

    expect(rateLimitVerifier).toContain("coverage/abuse-rate-limit-distributed.json");
    expect(alertVerifier).toContain("coverage/abuse-alert-delivery-redacted.json");
    expect(abuseControlArtifactPaths).toContain("coverage/abuse-rate-limit-distributed.json");
    expect(abuseControlArtifactPaths).toContain("coverage/abuse-alert-delivery-redacted.json");
  });

  it("blocks runtime readiness until distributed limiter, challenge, redaction, alerts, and integration proof exist", () => {
    expect(abuseControlRuntimeReadiness.status).toBe("blocked");
    expect(abuseControlRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Distributed Redis/Upstash or edge rate limiter must be configured for production routes.",
        "Bot challenge provider or challenge strategy must be configured for suspicious public traffic.",
        "Signed provider webhooks must bypass public bot challenges while retaining signature and replay validation.",
        "Abuse logs must prove raw IPs, tokens, payloads, signatures, and message bodies are redacted.",
      ]),
    );
    expect(abuseControlRuntimeReadiness.blockers).not.toContain(
      "Privacy-safe AbuseEvent persistence must record hashed actor keys, tenant, route family, action, and reason.",
    );
  });

  it("pins CI, manifest, tracker, commands, and artifacts for GAP-101", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(abuseControlCommands).toContain("node scripts/security/verify-abuse-rate-limits.mjs");
    expect(abuseControlCommands).toContain("provider webhook signature bypass/rejection test");
    expect(abuseControlArtifactPaths).toContain("coverage/abuse-event-redaction.json");
    expect(manifest).toContain("AbuseEvent Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 abuse control runtime contracts");
    expect(ci).toContain("apps/web/tests/abuse-control-runtime-static.test.ts");
    expect(ci).toContain("abuse-control-runtime-artifacts");
    expect(manifest).toContain("unit-web-abuse-control-runtime-static");
    expect(tracker).toContain("apps/web/lib/abuseControlRuntime.ts");
    expect(tracker).toContain("Abuse control evidence classifier wired and distributed proof gated");
    expect(tracker).toContain("GAP-101 is abuse-control-runtime-matrix wired with evidence classifier");
  });

  it("pins current abuse control proof files for GAP-101", () => {
    expect(abuseControlProofFiles).toEqual(
      expect.arrayContaining([
      "scripts/security/verify-abuse-alerts.mjs",
      "packages/security/package.json",
        "packages/security/src/index.ts",
        "packages/security/tests/upload-policy.test.ts",
        "apps/web/lib/abuseControlRuntime.ts",
        "apps/web/tests/abuse-control-runtime-static.test.ts",
        "apps/web/tests/booking-requests-contract.test.ts",
        "apps/web/tests/privacy-requests-public-route.test.ts",
        "apps/web/tests/error-report-ingest-hardening-static.test.ts",
        "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
        "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
        "apps/web/app/api/public/[tenantSlug]/privacy-requests/route.ts",
        "apps/web/app/api/public/[tenantSlug]/messages/route.ts",
        "apps/web/app/api/public/[tenantSlug]/error-reports/route.ts",
        "apps/dashboard/app/api/security/privacy-requests/route.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260609004000_add_abuse_events/migration.sql",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of abuseControlProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-101 evidence as blocked until distributed abuse-control proof is captured", () => {
    const blockedDecision = buildAbuseControlEvidenceDecision({
      packageAbuseHelpersPassed: true,
      runtimeMatrixCaptured: true,
      distributedRateLimitCaptured: false,
      botChallengeCaptured: false,
      validWebhookBypassCaptured: true,
      invalidWebhookChallengeCaptured: false,
      abuseEventRedactionCaptured: true,
      abuseAlertDeliveryCaptured: false,
      failClosedCaptured: false,
      requiredCommandsRun: abuseControlCommands.filter(
        (command) =>
          command !== "node scripts/security/verify-abuse-rate-limits.mjs" &&
          command !== "distributed rate-limit provider integration test" &&
          command !== "bot challenge route integration test",
      ),
      capturedArtifacts: [
        "coverage/abuse-control-runtime.json",
        "coverage/abuse-provider-webhook-bypass.json",
        "coverage/abuse-event-redaction.json",
        "test-results/abuse-control-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture distributed rate-limit provider proof.",
        "Capture bot challenge route proof.",
        "Capture invalid provider webhook challenge/rejection proof.",
        "Capture throttling alert delivery proof.",
        "Capture fail-closed limiter behavior proof.",
        "Required command not recorded: node scripts/security/verify-abuse-rate-limits.mjs",
        "Required command not recorded: distributed rate-limit provider integration test",
        "Required command not recorded: bot challenge route integration test",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/abuse-rate-limit-distributed.json",
        "coverage/abuse-bot-challenge.json",
        "coverage/abuse-invalid-webhook-challenge.json",
        "coverage/abuse-alert-delivery-redacted.json",
        "coverage/abuse-fail-closed.json",
      ]),
    );
    expect(blockedDecision.privacyPolicy).toEqual({
      tenantSafeHashedKeysRequired: true,
      rawIpAndPayloadsRedacted: true,
      failClosedBeforeHandlerExecution: true,
    });

    const completeDecision = buildAbuseControlEvidenceDecision({
      packageAbuseHelpersPassed: true,
      runtimeMatrixCaptured: true,
      distributedRateLimitCaptured: true,
      botChallengeCaptured: true,
      validWebhookBypassCaptured: true,
      invalidWebhookChallengeCaptured: true,
      abuseEventRedactionCaptured: true,
      abuseAlertDeliveryCaptured: true,
      failClosedCaptured: true,
      requiredCommandsRun: abuseControlCommands,
      capturedArtifacts: abuseControlArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(abuseControlCommands);
    expect(completeDecision.requiredEvidence).toBe(abuseControlArtifactPaths);
  });

  it("keeps GAP-101 distributed abuse execution disabled in the local plan", () => {
    const plan = buildAbuseControlExecutionPlan();

    expect(plan.distributedLimiterExecutionAllowed).toBe(false);
    expect(plan.botChallengeExecutionAllowed).toBe(false);
    expect(plan.webhookBypassExecutionAllowed).toBe(false);
    expect(plan.alertDeliveryExecutionAllowed).toBe(false);
    expect(plan.failClosedExecutionAllowed).toBe(false);
    expect(plan.publicRouteIntegrationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(abuseControlExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(abuseControlRequiredExternalEvidence);
    expect(abuseControlExecutionPolicy.externalEvidenceRequired).toBe(abuseControlRequiredExternalEvidence);
    expect(abuseControlRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Distributed rate-limit provider proof",
      "Bot challenge route proof",
      "Provider webhook signature bypass/rejection proof",
      "Fail-closed limiter behavior proof",
      "Public-route integration proof",
    ]));
    expect(plan.localCommands).toBe(abuseControlLocalCommands);
    expect(plan.externalCommands).toBe(abuseControlExternalCommands);
    expect(plan.localArtifacts).toBe(abuseControlLocalArtifacts);
    expect(plan.externalArtifacts).toBe(abuseControlExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/abuse-rate-limit-distributed.json",
      "coverage/abuse-bot-challenge.json",
      "coverage/abuse-invalid-webhook-challenge.json",
      "coverage/abuse-alert-delivery-redacted.json",
      "coverage/abuse-fail-closed.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Distributed limiter proof requires Redis/Upstash or edge provider execution.");
  });

  it("redacts GAP-101 abuse-control artifacts before review", () => {
    const rawArtifact = {
      ipHash: "sha256:raw-ip-hash",
      userAgentHash: "sha256:user-agent",
      providerSignature: "stripe-signature-secret",
      messageBody: "Contact client@example.com at +1 555 101 2020",
      payload: "{\"token\":\"private-token\",\"email\":\"client@example.com\"}",
      headers: ["Authorization: Bearer abuse-secret-token"],
      stack: "Error: limiter failed",
    };

    const redacted = buildRedactedAbuseControlArtifact(rawArtifact);
    const review = buildAbuseControlArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("sha256:raw-ip-hash");
    expect(serialized).not.toContain("sha256:user-agent");
    expect(serialized).not.toContain("stripe-signature-secret");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 101 2020");
    expect(serialized).not.toContain("private-token");
    expect(serialized).not.toContain("abuse-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(abuseControlArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Distributed rate-limit provider proof",
      "Bot challenge route proof",
      "Fail-closed limiter behavior proof",
    ]));
  });
});

