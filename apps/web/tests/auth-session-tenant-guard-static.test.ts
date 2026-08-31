import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  authGuardAuditLogPlan,
  authSessionTenantGuardArtifactPaths,
  authSessionTenantGuardCommands,
  authSessionTenantGuardCoverageContract,
  authSessionTenantGuardExternalArtifacts,
  authSessionTenantGuardExternalCommands,
  authSessionTenantGuardExecutionPolicy,
  authSessionTenantGuardLocalArtifacts,
  authSessionTenantGuardLocalCommands,
  authSessionTenantGuardProofFiles,
  authSessionTenantGuardRequiredExternalEvidence,
  authSessionTenantGuardRunPersistenceContract,
  authSessionTenantGuardSurfaceContract,
  authSessionTenantGuardSurfaceMatrix,
  buildAuthGuardAuditLogPlan,
  buildAuthSessionTenantGuardArtifactReview,
  buildAuthSessionTenantGuardEvidenceDecision,
  buildAuthSessionTenantGuardExecutionPlan,
  buildAuthSessionTenantGuardExternalEvidencePacket,
  buildAuthSessionTenantGuardRunData,
  persistAuthSessionTenantGuardRun,
  buildRedactedAuthSessionTenantGuardArtifact,
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
    expect(dashboardAuth).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(dashboardAuth).toContain("headers: noStoreHeaders");
    expect(dashboardAuth).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(trustRoute).toContain("resolveDashboardActor(request)");
    expect(trustRoute).toContain('assertPermission(actor, "tenant:read")');
    expect(trustRoute).toContain("TENANT_SCOPE_REQUIRED");
    expect(trustRoute).toContain("ROLE_NOT_AUTHORIZED");
    expect(trustRoute).toContain("DASHBOARD_TRUST_STATUS_PROVIDER_AUTH_NOT_CONFIGURED");
    expect(trustRoute).toContain("headerOnlyTrustPreviewDisabled");
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
    expect(authSessionTenantGuardCommands).toContain("configure selected provider env and callbacks with redacted evidence");
    expect(authSessionTenantGuardCommands).toContain("provider-backed session callback and TenantMember lookup test");
    expect(authSessionTenantGuardCommands).toContain("persist User, TenantMember, CustomRole, session, and revocation lookups");
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
    expect(authSessionTenantGuardSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "dashboard-middleware-session-cookie-csrf",
      "dashboard-api-tenant-reader-actor",
      "mobile-session-tenant-guard",
      "provider-login-logout-callbacks",
      "persisted-session-revocation",
      "csrf-bound-mutations",
      "auth-audit-log-redaction",
      "cross-tenant-route-denial",
    ]);
    expect(authSessionTenantGuardArtifactPaths).toContain("coverage/auth-provider-session-redacted.json");
    expect(authSessionTenantGuardArtifactPaths).toContain("coverage/auth-session-tenant-guard-external-evidence-packet.json");
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

  it("pins current auth session tenant guard proof files for GAP-095", () => {
    expect(authSessionTenantGuardProofFiles).toEqual(
      expect.arrayContaining([
      "packages/auth/package.json",
        "packages/auth/src/index.ts",
        "packages/auth/tests/authorization.test.ts",
        "apps/web/lib/authSessionTenantGuardRuntime.ts",
        "apps/web/tests/auth-session-tenant-guard-static.test.ts",
        "apps/dashboard/middleware.ts",
        "apps/dashboard/app/api/dashboardAuth.ts",
        "apps/dashboard/app/trust/page.tsx",
        "apps/dashboard/app/api/security/trust-status/route.ts",
        "apps/dashboard/app/api/security/privacy-requests/route.ts",
        "apps/dashboard/tests/security-trust-route-static.test.ts",
        "apps/dashboard/tests/security-privacy-route-static.test.ts",
        "apps/mobile/tests/mobile-security-static.test.ts",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of authSessionTenantGuardProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-095 evidence as blocked until provider-backed proof artifacts are captured", () => {
    const blockedDecision = buildAuthSessionTenantGuardEvidenceDecision({
      authPackageTestsPassed: true,
      dashboardMiddlewareProofCaptured: true,
      dashboardRouteGuardProofCaptured: true,
      mobileGuardProofCaptured: true,
      providerLoginLogoutProofCaptured: false,
      persistedSessionRevocationProofCaptured: false,
      auditLogRedactionProofCaptured: true,
      crossTenantDenialProofCaptured: false,
      externalEvidencePacketCaptured: false,
      requiredCommandsRun: authSessionTenantGuardCommands.filter(
        (command) => command !== "provider-backed login/logout integration tests" && command !== "cross-tenant route integration tests",
      ),
      capturedArtifacts: [
        "coverage/auth-session-tenant-guard-runtime.json",
        "coverage/auth-dashboard-middleware-guard.json",
        "coverage/auth-dashboard-route-guard-matrix.json",
        "coverage/auth-mobile-session-guard.json",
        "coverage/auth-csrf-revocation-redacted.json",
        "coverage/auth-cross-tenant-denial-redacted.json",
        "test-results/auth-session-tenant-guards",
        "test-results/dashboard-auth-guards",
        "test-results/mobile-auth-guards",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture provider-backed login/logout integration proof.",
        "Capture persisted TenantMember/session/revocation lookup proof.",
        "Capture cross-tenant dashboard/API/mobile denial proof.",
        "Capture auth/session external evidence packet.",
        "Required command not recorded: provider-backed login/logout integration tests",
        "Required command not recorded: cross-tenant route integration tests",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/auth-provider-session-redacted.json");
    expect(blockedDecision.requiredCommands).toBe(authSessionTenantGuardCommands);
    expect(blockedDecision.requiredEvidence).toBe(authSessionTenantGuardArtifactPaths);
    expect(blockedDecision.redactedSummary).toEqual({
      storesRawSessionTokens: false,
      storesRawProviderPayloads: false,
      providerSecretsRedacted: true,
    });

    const completeDecision = buildAuthSessionTenantGuardEvidenceDecision({
      authPackageTestsPassed: true,
      dashboardMiddlewareProofCaptured: true,
      dashboardRouteGuardProofCaptured: true,
      mobileGuardProofCaptured: true,
      providerLoginLogoutProofCaptured: true,
      persistedSessionRevocationProofCaptured: true,
      auditLogRedactionProofCaptured: true,
      crossTenantDenialProofCaptured: true,
      externalEvidencePacketCaptured: true,
      requiredCommandsRun: authSessionTenantGuardCommands,
      capturedArtifacts: authSessionTenantGuardArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(authSessionTenantGuardCommands);
    expect(completeDecision.requiredEvidence).toBe(authSessionTenantGuardArtifactPaths);
  });

  it("pins the GAP-095 auth-session tenant guard run persistence contract without claiming provider execution", () => {
    const runData = buildAuthSessionTenantGuardRunData({
      tenantId: "tenant_static",
      runId: "auth_session_guard_static",
      commitSha: "abc123",
      status: "blocked",
      providerLoginLogoutProofCaptured: false,
      persistedSessionRevocationProofCaptured: false,
      auditLogRedactionProofCaptured: true,
      crossTenantDenialProofCaptured: false,
      secretSafeReviewCaptured: true,
      capturedArtifacts: [
        "coverage/auth-session-tenant-guard-runtime.json",
        "coverage/auth-dashboard-middleware-guard.json",
      ],
      requiredCommandsRun: authSessionTenantGuardLocalCommands,
    });

    expect(authSessionTenantGuardRunPersistenceContract).toEqual({
      model: "AuthSessionTenantGuardRun",
      tenantRelation: "authSessionTenantGuardRuns",
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesProviderSessionEvidence: true,
      storesRevocationEvidence: true,
      storesAuditEvidence: true,
      storesCrossTenantEvidence: true,
      storesSecretSafeReview: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "auth_session_guard_static",
      commitSha: "abc123",
      status: "blocked",
      providerLoginLogoutProofCaptured: false,
      persistedSessionRevocationProofCaptured: false,
      auditLogRedactionProofCaptured: true,
      crossTenantDenialProofCaptured: false,
      secretSafeReviewCaptured: true,
      redactedSummary: {
        storesRawSessionTokens: false,
        storesRawProviderPayloads: false,
        providerSecretsRedacted: true,
      },
    });
    expect(runData.commandMatrix).toBe(authSessionTenantGuardCommands);
    expect(runData.completedCommands).toBe(authSessionTenantGuardLocalCommands);
    expect(String(persistAuthSessionTenantGuardRun)).toContain("repository.authSessionTenantGuardRun.upsert");
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
    expect(tracker).toContain("persistAuthSessionTenantGuardRun upsert seam");
    expect(tracker).toContain("Auth/session/tenant guard evidence classifier wired and provider-backed proof gated");
    expect(tracker).toContain("authSessionTenantGuardSurfaceContract");
    expect(tracker).toContain("buildAuthSessionTenantGuardExternalEvidencePacket");
  });

  it("keeps GAP-095 provider auth and cross-tenant execution disabled in the local plan", () => {
    const plan = buildAuthSessionTenantGuardExecutionPlan();

    expect(plan.providerAuthExecutionAllowed).toBe(false);
    expect(plan.persistedSessionExecutionAllowed).toBe(false);
    expect(plan.revocationLookupExecutionAllowed).toBe(false);
    expect(plan.routeIntegrationExecutionAllowed).toBe(false);
    expect(plan.crossTenantIntegrationExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(authSessionTenantGuardExecutionPolicy);
    expect(plan.policy).toEqual({
      providerAuthExecutionAllowed: false,
      persistedSessionExecutionAllowed: false,
      revocationLookupExecutionAllowed: false,
      routeIntegrationExecutionAllowed: false,
      crossTenantIntegrationExecutionAllowed: false,
      csrfMutationRouteExecutionAllowed: false,
      auditLogPersistenceExecutionAllowed: false,
    });
    expect(plan.localCommands).toBe(authSessionTenantGuardLocalCommands);
    expect(plan.externalCommands).toBe(authSessionTenantGuardExternalCommands);
    expect(plan.localArtifacts).toBe(authSessionTenantGuardLocalArtifacts);
    expect(plan.externalArtifacts).toBe(authSessionTenantGuardExternalArtifacts);
    expect(plan.surfaceContract).toBe(authSessionTenantGuardSurfaceContract);
    expect(plan.surfaceContract).toEqual(expect.arrayContaining([
      expect.objectContaining({
        surfaceId: "dashboard-middleware-session-cookie-csrf",
        requiredArtifact: "coverage/auth-dashboard-middleware-guard.json",
        guardBoundary: "dashboard-middleware",
        providerBackedEvidenceRequired: false,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "persisted-session-revocation",
        requiredCommand: "persist User, TenantMember, CustomRole, session, and revocation lookups",
        requiredArtifact: "coverage/auth-csrf-revocation-redacted.json",
        guardBoundary: "session-revocation",
        providerBackedEvidenceRequired: true,
        redactedArtifactRequired: true,
      }),
      expect.objectContaining({
        surfaceId: "cross-tenant-route-denial",
        requiredCommand: "cross-tenant route integration tests",
        requiredArtifact: "coverage/auth-cross-tenant-denial-redacted.json",
        guardBoundary: "cross-tenant",
        providerBackedEvidenceRequired: true,
        redactedArtifactRequired: true,
      }),
    ]));
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/auth-csrf-revocation-redacted.json",
      "coverage/auth-provider-session-redacted.json",
      "coverage/auth-cross-tenant-denial-redacted.json",
      "coverage/auth-session-tenant-guard-external-evidence-packet.json",
    ]));
    expect(plan.requiredExternalEvidence).toBe(authSessionTenantGuardRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "selected auth provider configuration and callback evidence",
      "provider-backed login/logout callback tests",
      "persisted TenantMember/session/revocation lookup proof",
      "provider-backed dashboard/mobile/API route guard proof",
      "CSRF-bound mutating route tests",
      "auth AuditLog persistence and cross-tenant route integration proof",
      "auth/session external evidence packet with redacted provider, session, revocation, audit, and denial proof",
    ]);
    expect(plan.disabledReasons.join(" ")).toContain("Provider auth execution requires selected provider credentials");
  });

  it("keeps the GAP-095 auth/session external evidence packet non-executing and provider-gated", () => {
    const packet = buildAuthSessionTenantGuardExternalEvidencePacket();

    expect(packet.packetId).toBe("gap-095-auth-session-tenant-guard-external-evidence");
    expect(packet.requiredArtifact).toBe("coverage/auth-session-tenant-guard-external-evidence-packet.json");
    expect(packet.providerAuthExecutionAllowed).toBe(false);
    expect(packet.persistedSessionExecutionAllowed).toBe(false);
    expect(packet.routeIntegrationExecutionAllowed).toBe(false);
    expect(packet.providerSessionEvidenceRequired).toBe(true);
    expect(packet.sessionRevocationEvidenceRequired).toBe(true);
    expect(packet.auditPersistenceEvidenceRequired).toBe(true);
    expect(packet.crossTenantDenialEvidenceRequired).toBe(true);
    expect(packet.redactionRequired).toBe(true);
    expect(packet.requiredExternalEvidence).toBe(authSessionTenantGuardRequiredExternalEvidence);
    expect(packet.surfaceContract).toBe(authSessionTenantGuardSurfaceContract);
  });

  it("redacts GAP-095 auth/session/provider artifacts before review", () => {
    const rawArtifact = {
      sessionToken: "session-secret-123",
      csrf_token: "csrf-secret-123",
      tenantId: "tenant_auth_private",
      actorUserId: "actor_auth_private",
      userId: "user_auth_private",
      tenantMemberId: "tenant_member_auth_private",
      membershipId: "membership_auth_private",
      customRoleId: "custom_role_auth_private",
      providerUserId: "provider_user_auth_private",
      providerAccountId: "provider_account_auth_private",
      revocationId: "revocation_auth_private",
      auditId: "audit_auth_private",
      idempotencyKey: "idempotency_auth_private",
      providerPayload: {
        accessToken: "provider-access-token",
        rawBody: "{\"email\":\"owner@example.com\",\"phone\":\"+1 555 888 9999\"}",
      },
      headers: ["Authorization: Bearer auth-secret-token", "Cookie: session=private-cookie"],
      stack: "Error: auth provider failed",
      safeNote: "provider_session_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/auth-session/private-proof.json",
      safeDatabaseTrace: "postgresql://tenant_demo:secret@db.example.com/inkroute",
      safeCallbackTrace: "https://auth.example.com/callback/session_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedAuthSessionTenantGuardArtifact(rawArtifact);
    const review = buildAuthSessionTenantGuardArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("session-secret-123");
    expect(serialized).not.toContain("csrf-secret-123");
    expect(serialized).not.toContain("tenant_auth_private");
    expect(serialized).not.toContain("actor_auth_private");
    expect(serialized).not.toContain("user_auth_private");
    expect(serialized).not.toContain("tenant_member_auth_private");
    expect(serialized).not.toContain("membership_auth_private");
    expect(serialized).not.toContain("custom_role_auth_private");
    expect(serialized).not.toContain("provider_user_auth_private");
    expect(serialized).not.toContain("provider_account_auth_private");
    expect(serialized).not.toContain("revocation_auth_private");
    expect(serialized).not.toContain("audit_auth_private");
    expect(serialized).not.toContain("idempotency_auth_private");
    expect(serialized).not.toContain("provider-access-token");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 888 9999");
    expect(serialized).not.toContain("auth-secret-token");
    expect(serialized).not.toContain("private-cookie");
    expect(serialized).not.toContain("provider_session_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("artifacts/auth-session/private-proof.json");
    expect(serialized).not.toContain("postgresql://tenant_demo:secret@db.example.com/inkroute");
    expect(serialized).not.toContain("auth.example.com/callback");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(authSessionTenantGuardArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Provider login/logout callback proof",
      "Persisted TenantMember/session/revocation proof",
      "Cross-tenant route integration proof",
    ]));
  });
});

