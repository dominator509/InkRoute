import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSecurityMiddlewareEvidencePersistenceContract,
  securityMiddlewareArtifactPaths,
  securityMiddlewareCommands,
  securityMiddlewareEvidencePersistencePreview,
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
    expect(dashboardMiddleware).toContain("buildSecurityRuntimeEnforcementPlan");
    expect(dashboardMiddleware).toContain("inkroute_dashboard_csrf");
    expect(dashboardMiddleware).toContain("CSRF_TOKEN_REQUIRED");
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
    expect(tracker).toContain("browser/deployment security proof remains open");
  });
});
