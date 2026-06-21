import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedSecurityMiddlewareArtifact,
  buildSecurityMiddlewareArtifactReview,
  buildSecurityMiddlewareEvidenceDecision,
  buildSecurityMiddlewareEvidencePersistenceContract,
  buildSecurityMiddlewareExecutionPlan,
  securityMiddlewareArtifactPaths,
  securityMiddlewareCommands,
  securityMiddlewareExternalArtifacts,
  securityMiddlewareExternalCommands,
  securityMiddlewareEvidencePersistencePreview,
  securityMiddlewareExecutionPolicy,
  securityMiddlewareLocalArtifacts,
  securityMiddlewareLocalCommands,
  securityMiddlewareRequiredExternalEvidence,
  securityMiddlewareRuntimeProofFiles,
  securityMiddlewareRuntimeContract,
} from "../lib/securityMiddlewareRuntime";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-102 security middleware runtime contract", () => {
  it("pins web/dashboard middleware to shared headers and cookie-authenticated CSRF enforcement", () => {
    const webMiddleware = readWorkspaceFile("apps/web/middleware.ts");
    const dashboardMiddleware = readWorkspaceFile("apps/dashboard/middleware.ts");

    expect(webMiddleware).toContain("buildSecurityRuntimeEnforcementPlan");
    expect(webMiddleware).toContain("inkroute_csrf");
    expect(webMiddleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(webMiddleware).toContain("headers: noStoreHeaders");
    expect(webMiddleware).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(dashboardMiddleware).toContain("buildSecurityRuntimeEnforcementPlan");
    expect(dashboardMiddleware).toContain('appSurface: "dashboard"');
    expect(dashboardMiddleware).toContain("inkroute_dashboard_csrf");
    expect(dashboardMiddleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(dashboardMiddleware).toContain("headers: noStoreHeaders");
    expect(dashboardMiddleware).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(securityMiddlewareRuntimeContract.csrfAttack.csrf).toMatchObject({ required: true, allowed: false });
    expect(securityMiddlewareRuntimeContract.csrfAllowed.csrf).toMatchObject({ required: true, allowed: true });
  });

  it("tracks HSTS, CSP provider sources, CSP invariants, SameSite/session binding, and webhook bypass evidence", () => {
    expect(securityMiddlewareRuntimeContract.actions).toEqual(
      expect.arrayContaining([
        "verify-production-hsts-only",
        "verify-preview-local-hsts-suppression",
        "verify-provider-csp-connect-src",
        "verify-frame-base-form-csp-invariants",
        "verify-samesite-cookie-behavior",
        "review-signed-webhook-csrf-bypass",
        "capture-browser-header-smoke",
      ]),
    );
    expect(securityMiddlewareRuntimeContract.csrfControlPlans.map((plan) => plan.id)).toEqual(
      expect.arrayContaining(["csrf-dashboard-actions", "csrf-public-forms", "csrf-provider-webhooks"]),
    );
    expect(securityMiddlewareRuntimeContract.readiness.status).toBe("blocked");
    expect(securityMiddlewareRuntimeContract.readiness.blockers).toEqual(
      expect.arrayContaining([
        "Browser smoke tests must verify web security headers on rendered routes.",
        "Browser smoke tests must verify dashboard security headers on rendered routes.",
        "Production deployment must prove HSTS is emitted only over HTTPS.",
        "Provider webhook CSRF bypass rules must be reviewed so signed callbacks bypass CSRF without weakening public mutations.",
        "Runtime route integration tests must cover web/dashboard middleware headers and CSRF decisions.",
      ]),
    );
  });

  it("pins durable security middleware evidence rows, proof fields, tenant isolation, and redacted artifacts", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildSecurityMiddlewareEvidencePersistenceContract({
      tenantId: "tenant_demo",
      surface: "dashboard",
      environment: "production",
      routePattern: "/api/security/privacy-requests",
      headerSmokePassed: true,
      productionHstsVerified: true,
      previewLocalHstsSuppressed: true,
      cspProviderConnectSrcVerified: true,
      cspFrameBaseFormInvariantPassed: true,
      csrfAttackRejected: true,
      csrfValidSessionAllowed: true,
      sameSiteSessionBoundVerified: true,
      signedWebhookBypassReviewed: true,
      artifactObjectKey: "security/tenant_demo/middleware/redacted-dashboard-smoke.json",
    });

    expect(schema).toContain("model SecurityMiddlewareEvidence");
    expect(schema).toContain("productionHstsVerified");
    expect(schema).toContain("sameSiteSessionBoundVerified");
    expect(schema).toContain("@@index([tenantId, surface, environment])");
    expect(contract.transactionWrites).toEqual(["SecurityMiddlewareEvidence", "AuditLog"]);
    expect(contract.proofFields).toContain("csrfAttackRejected");
    expect(contract.redactedFields).toContain("csrfToken");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(securityMiddlewareEvidencePersistencePreview.modelName).toBe("SecurityMiddlewareEvidence");
  });

  it("keeps existing middleware runtime, static, and E2E security tests in the evidence set", () => {
    const runtime = readWorkspaceFile("apps/web/tests/security-runtime-middleware.test.ts");
    const webStatic = readWorkspaceFile("apps/web/tests/security-runtime-middleware-static.test.ts");
    const dashboardStatic = readWorkspaceFile("apps/web/tests/dashboard-security-runtime-middleware-static.test.ts");
    const webE2e = readWorkspaceFile("apps/web/tests/e2e/security-runtime.spec.ts");
    const dashboardE2e = readWorkspaceFile("apps/dashboard/tests/e2e/security-runtime.spec.ts");

    expect(runtime).toContain("blocks cookie-authenticated web mutations without a valid CSRF token");
    expect(runtime).toContain("allows dashboard mutations with matching CSRF header and cookie");
    expect(webStatic).toContain("applies shared security header and CSRF enforcement plans");
    expect(dashboardStatic).toContain("dashboard middleware boundary");
    expect(webE2e).toContain("cookie-authenticated public mutations require CSRF proof");
    expect(dashboardE2e).toContain("cookie-authenticated dashboard mutations require CSRF proof");
  });

  it("pins current security middleware runtime proof files for GAP-102", () => {
    expect(securityMiddlewareRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/security/tests/upload-policy.test.ts",
      "packages/security/package.json",
        "packages/security/src/index.ts",
        "apps/web/lib/securityMiddlewareRuntime.ts",
        "apps/web/tests/security-middleware-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609005000_add_security_middleware_evidence/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of securityMiddlewareRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins CI, manifest, tracker, commands, and artifacts for GAP-102", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(securityMiddlewareCommands).toContain("signed webhook CSRF bypass review");
    expect(securityMiddlewareArtifactPaths).toContain("coverage/security-webhook-csrf-bypass-review.json");
    expect(manifest).toContain("SecurityMiddlewareEvidence Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 security middleware runtime contracts");
    expect(ci).toContain("apps/web/tests/security-middleware-runtime-static.test.ts");
    expect(ci).toContain("security-middleware-runtime-artifacts");
    expect(manifest).toContain("unit-web-security-middleware-runtime-static");
    expect(tracker).toContain("apps/web/lib/securityMiddlewareRuntime.ts");
    expect(tracker).toContain("Security middleware evidence classifier wired and browser deployment proof gated");
    expect(tracker).toContain("GAP-102 is security-middleware-runtime-matrix wired with evidence classifier");
    expect(tracker).toContain("securityMiddlewareLocalArtifacts");
    expect(tracker).toContain("securityMiddlewareExternalArtifacts");
  });

  it("classifies GAP-102 evidence as blocked until browser and deployment security proof is captured", () => {
    const blockedDecision = buildSecurityMiddlewareEvidenceDecision({
      packageSecurityHelpersPassed: true,
      webHeaderBrowserSmokeCaptured: true,
      dashboardHeaderBrowserSmokeCaptured: false,
      productionHstsCaptured: false,
      previewLocalHstsSuppressionCaptured: true,
      providerCspConnectSrcCaptured: false,
      cspFrameBaseFormInvariantCaptured: true,
      csrfAttackRejectionCaptured: true,
      csrfValidSessionBindingCaptured: true,
      signedWebhookBypassReviewCaptured: false,
      requiredCommandsRun: securityMiddlewareCommands.filter(
        (command) =>
          command !== "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts" &&
          command !== "deployment HSTS proof" &&
          command !== "signed webhook CSRF bypass review",
      ),
      capturedArtifacts: [
        "coverage/security-middleware-runtime.json",
        "coverage/security-web-header-browser-smoke.json",
        "coverage/security-preview-local-hsts-suppression.json",
        "coverage/security-csp-frame-base-form-invariants.json",
        "coverage/security-csrf-attack-rejection.json",
        "coverage/security-csrf-valid-session-binding.json",
        "test-results/security-middleware-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture dashboard browser security header smoke proof.",
        "Capture production HTTPS HSTS proof.",
        "Capture provider CSP connect-src proof.",
        "Capture signed webhook CSRF bypass review proof.",
        "Required command not recorded: pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
        "Required command not recorded: deployment HSTS proof",
        "Required command not recorded: signed webhook CSRF bypass review",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/security-dashboard-header-browser-smoke.json",
        "coverage/security-production-hsts.json",
        "coverage/security-provider-csp-connect-src.json",
        "coverage/security-webhook-csrf-bypass-review.json",
      ]),
    );
    expect(blockedDecision.headerPolicy).toEqual({
      hstsProductionOnly: true,
      cspFrameBaseFormLocked: true,
      csrfTokensRedacted: true,
    });

    const completeDecision = buildSecurityMiddlewareEvidenceDecision({
      packageSecurityHelpersPassed: true,
      webHeaderBrowserSmokeCaptured: true,
      dashboardHeaderBrowserSmokeCaptured: true,
      productionHstsCaptured: true,
      previewLocalHstsSuppressionCaptured: true,
      providerCspConnectSrcCaptured: true,
      cspFrameBaseFormInvariantCaptured: true,
      csrfAttackRejectionCaptured: true,
      csrfValidSessionBindingCaptured: true,
      signedWebhookBypassReviewCaptured: true,
      requiredCommandsRun: securityMiddlewareCommands,
      capturedArtifacts: securityMiddlewareArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(securityMiddlewareCommands);
    expect(completeDecision.requiredEvidence).toBe(securityMiddlewareArtifactPaths);
  });

  it("keeps GAP-102 browser, deployment, provider, and persistence execution disabled in the local plan", () => {
    const plan = buildSecurityMiddlewareExecutionPlan();

    expect(plan.browserSmokeExecutionAllowed).toBe(false);
    expect(plan.deploymentHstsExecutionAllowed).toBe(false);
    expect(plan.providerCspExecutionAllowed).toBe(false);
    expect(plan.signedWebhookReviewExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.routeIntegrationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(securityMiddlewareExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(securityMiddlewareRequiredExternalEvidence);
    expect(securityMiddlewareExecutionPolicy.externalEvidenceRequired).toBe(securityMiddlewareRequiredExternalEvidence);
    expect(securityMiddlewareRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Web and dashboard browser security header smoke proof",
      "Production HTTPS HSTS proof",
      "Provider CSP connect-src proof",
      "Signed webhook CSRF bypass review proof",
      "Runtime route integration proof",
    ]));
    expect(plan.localCommands).toBe(securityMiddlewareLocalCommands);
    expect(plan.externalCommands).toBe(securityMiddlewareExternalCommands);
    expect(plan.localArtifacts).toBe(securityMiddlewareLocalArtifacts);
    expect(plan.externalArtifacts).toBe(securityMiddlewareExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/security-middleware-runtime.json",
      "coverage/security-preview-local-hsts-suppression.json",
      "coverage/security-csp-frame-base-form-invariants.json",
      "coverage/security-csrf-attack-rejection.json",
      "coverage/security-csrf-valid-session-binding.json",
      "test-results/security-middleware-runtime",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/security-web-header-browser-smoke.json",
      "coverage/security-dashboard-header-browser-smoke.json",
      "coverage/security-production-hsts.json",
      "coverage/security-provider-csp-connect-src.json",
      "coverage/security-webhook-csrf-bypass-review.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Production HTTPS HSTS proof requires deployment-platform evidence.");
  });

  it("redacts GAP-102 CSRF, cookie, session, webhook, and artifact evidence before review", () => {
    const rawArtifact = {
      csrfToken: "csrf-secret-token",
      sessionId: "session-secret-id",
      cookie: "inkroute_session=private-cookie",
      providerSignature: "stripe-signature-secret",
      artifactObjectKey: "security/tenant_demo/middleware/private-smoke.json",
      rawBody: "{\"email\":\"client@example.com\",\"phone\":\"+1 555 313 4141\"}",
      headers: ["Authorization: Bearer security-secret-token"],
      stack: "Error: middleware evidence failed",
    };

    const redacted = buildRedactedSecurityMiddlewareArtifact(rawArtifact);
    const review = buildSecurityMiddlewareArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("csrf-secret-token");
    expect(serialized).not.toContain("session-secret-id");
    expect(serialized).not.toContain("private-cookie");
    expect(serialized).not.toContain("stripe-signature-secret");
    expect(serialized).not.toContain("security/tenant_demo/middleware/private-smoke.json");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 313 4141");
    expect(serialized).not.toContain("security-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(securityMiddlewareArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Production HTTPS HSTS proof",
      "Provider CSP connect-src proof",
      "Signed webhook CSRF bypass review proof",
    ]));
  });
});

