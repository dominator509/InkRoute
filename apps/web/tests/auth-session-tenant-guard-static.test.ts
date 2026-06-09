import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  authGuardAuditLogPlan,
  authSessionTenantGuardArtifactPaths,
  authSessionTenantGuardCommands,
  authSessionTenantGuardCoverageContract,
  authSessionTenantGuardSurfaceMatrix,
  buildAuthGuardAuditLogPlan,
} from "../lib/authSessionTenantGuardRuntime";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-095 auth session tenant guard runtime contract", () => {
  it("pins dashboard middleware session-cookie, login redirect, API 401, and CSRF boundaries", () => {
    const middleware = readWorkspaceFile("apps/dashboard/middleware.ts");

    expect(middleware).toContain("sessionCookieNames");
    expect(middleware).toContain("buildUnauthenticatedDashboardResponse");
    expect(middleware).toContain("AUTH_REQUIRED");
    expect(middleware).toContain("csrfTokenIsValid");
    expect(middleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(middleware).toContain("cookieAuthenticatedMutation");
  });

  it("pins dashboard API actor resolution to tenant context before route data access", () => {
    const dashboardAuth = readWorkspaceFile("apps/dashboard/app/api/dashboardAuth.ts");
    const trustRoute = readWorkspaceFile("apps/dashboard/app/api/security/trust-status/route.ts");
    const privacyRoute = readWorkspaceFile("apps/dashboard/app/api/security/privacy-requests/route.ts");

    expect(dashboardAuth).toContain("resolveDashboardActor");
    expect(dashboardAuth).toContain("toTenantAccessContext");
    expect(dashboardAuth).toContain("AUTH_REQUIRED");
    expect(dashboardAuth).toContain("FORBIDDEN");
    expect(trustRoute).toContain("resolveDashboardReader");
    expect(trustRoute).toContain("TENANT_SCOPE_REQUIRED");
    expect(trustRoute).toContain("ROLE_NOT_AUTHORIZED");
    expect(privacyRoute).toContain("resolveDashboardActor");
    expect(privacyRoute).toContain("checkDashboardMutationRateLimit");
    expect(privacyRoute).toContain('"Cache-Control": "no-store"');
  });

  it("keeps mobile auth and tenant-isolation surfaces wired but provider-gated", () => {
    const mobileStatic = readWorkspaceFile("apps/mobile/tests/mobile-security-static.test.ts");
    const mobileDemo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");

    expect(mobileStatic).toContain("mobile Phase 13 security runtime surface");
    expect(mobileStatic).toContain("Tenant isolation tests");
    expect(mobileDemo).toContain("mobileTenantIsolationFixtures");
    expect(mobileDemo).toContain("productionReady: mobileSecuritySummary.blockers === 0");
  });

  it("tracks remaining provider-backed session, revocation, audit, and cross-tenant proof gates", () => {
    const auditPlan = buildAuthGuardAuditLogPlan({
      tenantId: "tenant_1",
      actorUserId: "user_1",
      routePath: "/api/security/privacy-requests",
      decision: "csrf_failed",
      source: "dashboard",
    });

    expect(authSessionTenantGuardCommands).toContain("provider-backed login/logout integration tests");
    expect(authSessionTenantGuardCommands).toContain("CSRF-bound mutating route tests");
    expect(authSessionTenantGuardCommands).toContain("auth audit-log persistence tests");
    expect(authSessionTenantGuardSurfaceMatrix.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        "dashboard-middleware-session-cookie-csrf",
        "dashboard-api-tenant-reader-actor",
        "dashboard-trust-privacy-routes",
        "mobile-session-tenant-guard",
        "provider-backed-cross-tenant-proof",
      ]),
    );
    expect(authSessionTenantGuardArtifactPaths).toContain("coverage/auth-provider-session-redacted.json");
    expect(auditPlan).toMatchObject({
      entityType: "AuthGuardDecision",
      action: "auth_guard:csrf_failed",
      metadata: {
        rawSessionStored: false,
        rawProviderPayloadStored: false,
        artifact: "coverage/auth-audit-log-redacted.json",
      },
    });
    expect(authGuardAuditLogPlan.metadata.redactedFields).toEqual(expect.arrayContaining(["sessionToken", "providerAccessToken"]));
    expect(authSessionTenantGuardCoverageContract.status).toBe("blocked");
    expect(authSessionTenantGuardCoverageContract.blockers).toEqual(
      expect.arrayContaining([
        "Production auth provider must be selected and configured.",
        "Provider-backed login/logout callbacks must be wired.",
        "TenantMember/session lookups must be persisted and resolved server-side.",
        "Session revocation persistence must be checked before every sensitive route decision.",
        "Cross-tenant route integration tests must prove tenant isolation.",
      ]),
    );
    expect(authSessionTenantGuardCoverageContract.blockers).not.toContain("Auth decisions, provider callbacks, denials, tenant switches, and revocations must persist AuditLog rows.");
  });

  it("pins CI, manifest, and tracker references for GAP-095", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 13 auth session tenant guard contracts");
    expect(ci).toContain("apps/web/tests/auth-session-tenant-guard-static.test.ts");
    expect(ci).toContain("auth-session-tenant-guard-artifacts");
    expect(manifest).toContain("unit-web-auth-session-tenant-guard-static");
    expect(tracker).toContain("apps/web/lib/authSessionTenantGuardRuntime.ts");
    expect(tracker).toContain("provider-backed auth/session proof remains open");
  });
});
