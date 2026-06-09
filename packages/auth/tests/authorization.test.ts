import { describe, expect, it } from "vitest";
import {
  assertPermission,
  buildAuthSessionTenantGuardRuntimeReadinessPlan,
  buildDashboardReadinessPlan,
  buildDomainAuthorizationRuntimeReadinessPlan,
  buildMobileAuthRuntimeReadinessPlan,
  buildSessionPersistencePlan,
  evaluateApiRouteGuard,
  evaluateDashboardRouteGuard,
  evaluateFieldAuthorization,
  evaluateMobileSessionGate,
  evaluateTenantAuthorization,
  hasPermission,
  resolveTenantPermissions,
} from "../src/index";

const ownerContext = {
  tenantId: "tenant_001",
  userId: "user_001",
  role: "owner" as const,
  sessionId: "session_001",
  expiresAt: "2026-06-08T02:00:00.000Z",
};

describe("auth authorization helpers", () => {
  it("keeps role permissions explicit", () => {
    expect(hasPermission("owner", "settings:write")).toBe(true);
    expect(hasPermission("assistant", "settings:write")).toBe(false);
    expect(() => assertPermission("assistant", "settings:write")).toThrow("Role assistant does not have permission settings:write");
  });

  it("allows active tenant-scoped sessions with the required permission", () => {
    expect(
      evaluateTenantAuthorization({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:write",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({
      allowed: true,
      status: "allowed",
      userId: "user_001",
      tenantId: "tenant_001",
      role: "owner",
      auditAction: "authz:booking:write",
    });
  });

  it("combines built-in role permissions with active tenant-scoped custom roles", () => {
    const resolution = resolveTenantPermissions({
      role: "assistant",
      tenantId: "tenant_001",
      customRole: {
        id: "custom_role_001",
        tenantId: "tenant_001",
        name: "Marketing coordinator",
        permissions: ["seo:read", "analytics:read", "not-a-real-permission"],
      },
    });

    expect(resolution.customRoleApplied).toBe(true);
    expect(resolution.permissions).toContain("booking:read");
    expect(resolution.permissions).toContain("seo:read");
    expect(resolution.permissions).toContain("analytics:read");
    expect(resolution.rejectedPermissions).toEqual(["not-a-real-permission"]);
  });

  it("uses custom role permissions during tenant authorization without accepting unknown permission strings", () => {
    const decision = evaluateTenantAuthorization({
      context: {
        ...ownerContext,
        role: "assistant",
        customRole: {
          id: "custom_role_002",
          tenantId: "tenant_001",
          permissions: ["payment:read", "settings:delete"],
        },
      },
      tenantId: "tenant_001",
      permission: "payment:read",
      now: "2026-06-08T01:00:00.000Z",
    });

    expect(decision).toMatchObject({
      allowed: true,
      status: "allowed",
      customRoleId: "custom_role_002",
      rejectedPermissions: ["settings:delete"],
    });
  });

  it("ignores inactive or cross-tenant custom roles", () => {
    expect(
      evaluateTenantAuthorization({
        context: {
          ...ownerContext,
          role: "assistant",
          customRole: {
            id: "custom_role_inactive",
            tenantId: "tenant_001",
            permissions: ["settings:write"],
            isActive: false,
          },
        },
        tenantId: "tenant_001",
        permission: "settings:write",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("permission_denied");

    const tenantMismatch = evaluateTenantAuthorization({
      context: {
        ...ownerContext,
        role: "assistant",
        customRole: {
          id: "custom_role_wrong_tenant",
          tenantId: "tenant_999",
          permissions: ["settings:write"],
        },
      },
      tenantId: "tenant_001",
      permission: "settings:write",
      now: "2026-06-08T01:00:00.000Z",
    });

    expect(tenantMismatch.status).toBe("permission_denied");
    expect(tenantMismatch.reason).toBe("Custom role belongs to a different tenant and was ignored.");
  });

  it("denies missing, revoked, expired, cross-tenant, and underprivileged sessions", () => {
    expect(
      evaluateTenantAuthorization({
        context: null,
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("unauthenticated");

    expect(
      evaluateTenantAuthorization({
        context: { ...ownerContext, revokedAt: "2026-06-08T00:30:00.000Z" },
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("session_revoked");

    expect(
      evaluateTenantAuthorization({
        context: { ...ownerContext, expiresAt: "2026-06-08T00:59:00.000Z" },
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("session_expired");

    expect(
      evaluateTenantAuthorization({
        context: ownerContext,
        tenantId: "tenant_002",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("tenant_mismatch");

    expect(
      evaluateTenantAuthorization({
        context: { ...ownerContext, role: "assistant" },
        tenantId: "tenant_001",
        permission: "settings:write",
        now: "2026-06-08T01:00:00.000Z",
      }).status,
    ).toBe("permission_denied");
  });

  it("maps dashboard route guard decisions to safe redirects or denials", () => {
    expect(
      evaluateDashboardRouteGuard({
        context: null,
        tenantId: "tenant_001",
        permission: "booking:read",
        routePath: "/bookings",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({
      action: "redirect_login",
      allowed: false,
      redirectTo: "/login?next=%2Fbookings",
      cachePolicy: "no-store",
    });

    expect(
      evaluateDashboardRouteGuard({
        context: ownerContext,
        tenantId: "tenant_002",
        permission: "booking:read",
        routePath: "/bookings",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({
      action: "redirect_tenant_switch",
      allowed: false,
      redirectTo: "/tenant-switcher",
    });

    expect(
      evaluateDashboardRouteGuard({
        context: { ...ownerContext, role: "assistant" },
        tenantId: "tenant_001",
        permission: "settings:write",
        routePath: "/settings",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({
      action: "deny",
      allowed: false,
      status: "permission_denied",
    });
  });

  it("allows dashboard routes for active tenant members with required permissions", () => {
    expect(
      evaluateDashboardRouteGuard({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:write",
        routePath: "/bookings/booking_001",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({
      action: "allow",
      allowed: true,
      cachePolicy: "no-store",
      auditAction: "dashboard:booking:write:/bookings/booking_001",
    });
  });

  it("allows secure mobile sessions only after tenant membership and biometric gates pass", () => {
    expect(
      evaluateMobileSessionGate({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: true,
        biometricUnlocked: true,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "allow",
      allowed: true,
      status: "allowed",
      requiresSecureStore: true,
      requiresTenantMembership: true,
      requiresBiometricUnlock: true,
      auditAction: "mobile:booking:read:tenant_001",
    });
  });

  it("blocks mobile sessions when secure storage, biometrics, or tenant scope are missing", () => {
    expect(
      evaluateMobileSessionGate({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: false,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "prompt_login",
      status: "secure_store_unavailable",
      allowed: false,
    });

    expect(
      evaluateMobileSessionGate({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: true,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "prompt_biometric",
      status: "biometric_locked",
      allowed: false,
    });

    expect(
      evaluateMobileSessionGate({
        context: ownerContext,
        tenantId: "tenant_002",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "deny",
      status: "tenant_mismatch",
      allowed: false,
    });
  });

  it("routes expired, revoked, and logout mobile sessions to refresh or local clearing", () => {
    expect(
      evaluateMobileSessionGate({
        context: { ...ownerContext, expiresAt: "2026-06-08T00:59:00.000Z" },
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "refresh_session",
      status: "session_expired",
      requiresRefreshToken: true,
    });

    expect(
      evaluateMobileSessionGate({
        context: { ...ownerContext, expiresAt: "2026-06-08T00:59:00.000Z" },
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: false,
      }),
    ).toMatchObject({
      action: "prompt_login",
      status: "refresh_token_missing",
      requiresRefreshToken: true,
    });

    expect(
      evaluateMobileSessionGate({
        context: { ...ownerContext, revokedAt: "2026-06-08T00:30:00.000Z" },
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
      }),
    ).toMatchObject({
      action: "logout",
      status: "session_revoked",
    });

    expect(
      evaluateMobileSessionGate({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "booking:read",
        now: "2026-06-08T01:00:00.000Z",
        biometricRequired: false,
        biometricUnlocked: false,
        secureStoreAvailable: true,
        refreshTokenAvailable: true,
        logoutRequested: true,
      }),
    ).toMatchObject({
      action: "logout",
      status: "logout_requested",
    });
  });

  it("blocks mobile auth runtime readiness until provider, secure store, biometrics, tenant lookup, and device evidence exist", () => {
    const plan = buildMobileAuthRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      authTestsPassed: true,
      authTypecheckPassed: false,
      mobileTypecheckPassed: false,
      mobileDeviceTestsPassed: false,
      authProviderConfigured: false,
      providerLoginLogoutTested: false,
      expoSecureStoreConfigured: false,
      biometricUnlockConfigured: true,
      biometricDeviceTested: false,
      refreshTokenRecoveryTested: false,
      logoutClearsLocalStateTested: false,
      revokedSessionClearsLocalStateTested: false,
      tenantMembershipLookupConfigured: false,
      roleResolutionConfigured: false,
      crossTenantDenialTested: false,
      secureTokenStorageVerified: false,
      auditLogPersistenceConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("Expo device biometric unlock test");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "provider-backed mobile login/logout test output",
      "Expo SecureStore token persistence/clearing evidence with no plaintext token storage",
      "tenant membership, role resolution, and cross-tenant denial test output",
    ]));
    expect(plan.blockers).toContain("Revoked sessions must clear local mobile auth state.");
    expect(plan.blockers).toContain("Mobile login, refresh, logout, denial, revocation, and tenant-switch decisions must persist audit logs.");
  });

  it("maps API route guards to no-store 401, 403, 409, 419, or allow decisions", () => {
    expect(
      evaluateApiRouteGuard({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "release:write",
        routePath: "/api/releases",
        method: "POST",
        now: "2026-06-08T01:00:00.000Z",
        csrfValid: false,
      }),
    ).toMatchObject({
      action: "reject_419",
      allowed: false,
      statusCode: 419,
      responseHeaders: { "cache-control": "no-store" },
    });

    expect(
      evaluateApiRouteGuard({
        context: null,
        tenantId: "tenant_001",
        permission: "booking:read",
        routePath: "/api/bookings",
        method: "GET",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({ action: "reject_401", status: "unauthenticated", statusCode: 401 });

    expect(
      evaluateApiRouteGuard({
        context: ownerContext,
        tenantId: "tenant_002",
        permission: "booking:read",
        routePath: "/api/bookings",
        method: "GET",
        now: "2026-06-08T01:00:00.000Z",
      }),
    ).toMatchObject({ action: "reject_409", status: "tenant_mismatch", statusCode: 409 });

    expect(
      evaluateApiRouteGuard({
        context: { ...ownerContext, role: "assistant" },
        tenantId: "tenant_001",
        permission: "settings:write",
        routePath: "/api/settings",
        method: "PATCH",
        now: "2026-06-08T01:00:00.000Z",
        csrfValid: true,
      }),
    ).toMatchObject({ action: "reject_403", status: "permission_denied", statusCode: 403 });

    expect(
      evaluateApiRouteGuard({
        context: ownerContext,
        tenantId: "tenant_001",
        permission: "release:write",
        routePath: "/api/releases",
        method: "POST",
        now: "2026-06-08T01:00:00.000Z",
        csrfValid: true,
      }),
    ).toMatchObject({
      action: "allow",
      allowed: true,
      statusCode: 200,
      auditAction: "api:POST:release:write:/api/releases",
    });
  });

  it("redacts field-level data when a role lacks the required permission", () => {
    const decision = evaluateFieldAuthorization({
      context: { ...ownerContext, role: "assistant" },
      tenantId: "tenant_001",
      resource: "client-profile",
      fields: ["preferredName", "email", "medicalNotes", "paymentProviderId"],
      policies: [
        { field: "email", permission: "client:read", sensitivity: "client_private" },
        { field: "medicalNotes", permission: "client:write", sensitivity: "medical" },
        { field: "paymentProviderId", permission: "payment:read", sensitivity: "payment" },
      ],
      now: "2026-06-08T01:00:00.000Z",
    });

    expect(decision.allowedFields).toEqual(["preferredName", "email"]);
    expect(decision.redactionPolicy).toBe("redact_denied_fields");
    expect(decision.deniedFields).toEqual([
      { field: "medicalNotes", permission: "client:write", sensitivity: "medical", status: "permission_denied" },
      { field: "paymentProviderId", permission: "payment:read", sensitivity: "payment", status: "permission_denied" },
    ]);
    expect(decision.auditActions).toContain("field:client-profile:medicalNotes:client:write");
  });

  it("documents provider-backed session persistence gates before production auth is ready", () => {
    const plan = buildSessionPersistencePlan({
      authProviderConfigured: false,
      databaseSessionStoreConfigured: false,
      secureCookieConfigured: false,
      mobileSecureStoreConfigured: false,
      revocationStoreConfigured: false,
      auditLogConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredTables).toEqual(["User", "TenantMember", "CustomRole", "AuditLog"]);
    expect(plan.requiredRuntimeControls).toEqual(
      expect.arrayContaining(["field-level authorization/redaction", "CSRF-bound mutating API routes", "session revocation check"]),
    );
    expect(plan.auditEvents).toContain("authz.denied");
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Auth provider must be selected and configured before provider-backed login/logout is ready.",
        "Session revocation persistence must be checked before every sensitive route decision.",
      ]),
    );
  });

  it("plans dashboard readiness across guarded surfaces, persistence, mutations, audits, and smoke evidence", () => {
    const plan = buildDashboardReadinessPlan({
      packageScripts: {
        typecheck: "tsc --noEmit",
        build: "next build",
        test: "playwright test --project=dashboard-chromium",
      },
      buildVerified: false,
      typecheckVerified: false,
      e2eVerified: false,
      providerActionsConfigured: false,
      seededDataAvailable: false,
      surfaces: [
        {
          id: "booking-inbox",
          path: "/bookings",
          kind: "page",
          mode: "static_demo",
          requiredPermission: "booking:read",
          hasAuthGuard: true,
          hasTenantScope: true,
          hasAuditLog: false,
          hasPersistence: false,
          hasTestCoverage: true,
        },
        {
          id: "release-feature-flags",
          path: "/api/feature-flags",
          kind: "api",
          mode: "mutation_api",
          requiredPermission: "release:write",
          hasAuthGuard: true,
          hasTenantScope: true,
          hasAuditLog: false,
          hasPersistence: false,
          hasTestCoverage: true,
        },
        {
          id: "stripe-refund-action",
          path: "/payments/refunds",
          kind: "server_action",
          mode: "provider_action",
          requiredPermission: "payment:write",
          hasAuthGuard: false,
          hasTenantScope: false,
          hasAuditLog: false,
          hasPersistence: false,
          hasTestCoverage: false,
        },
      ],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.surfaceCount).toBe(3);
    expect(plan.staticSurfaceCount).toBe(1);
    expect(plan.mutationSurfaceCount).toBe(2);
    expect(plan.unguardedSurfaces).toEqual(["stripe-refund-action"]);
    expect(plan.unscopedSurfaces).toEqual(["stripe-refund-action"]);
    expect(plan.unauditedMutations).toEqual(["release-feature-flags", "stripe-refund-action"]);
    expect(plan.unpersistedSurfaces).toEqual(["release-feature-flags", "stripe-refund-action"]);
    expect(plan.untestedSurfaces).toEqual(["stripe-refund-action"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/dashboard build");
    expect(plan.requiredControls).toContain("Execute state-changing actions inside tenant-scoped transactions with AuditLog writes.");
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Dashboard Next.js build has not been verified in the installed workspace.",
      "Dashboard has no verified seeded tenant data source for smoke and mutation tests.",
      "Dashboard provider actions are still static/demo gated and cannot execute production provider calls.",
      "Every dashboard mutation/provider action must write an AuditLog row.",
    ]));
  });

  it("summarizes domain authorization runtime readiness across middleware, roles, audits, CSRF, and route tests", () => {
    const plan = buildDomainAuthorizationRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      customRolesLoadedFromDatabase: false,
      middlewareUsesRouteGuard: false,
      dashboardRoutesGuarded: true,
      apiRoutesGuarded: false,
      serverActionsGuarded: false,
      fieldRedactionApplied: true,
      authorizationAuditPersisted: false,
      tenantMismatchTestsPassed: false,
      roleMatrixRouteTestsPassed: false,
      csrfSessionBindingVerified: false,
      sessionRevocationChecked: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("dashboard/API role matrix route tests");
    expect(plan.requiredControls).toContain("Combine built-in role permissions with active tenant-scoped custom grants only.");
    expect(plan.blockers).toContain("CustomRole rows must be loaded from the database before runtime authorization decisions.");
    expect(plan.blockers).toContain("Authorization allow/deny decisions must persist AuditLog rows with tenant, actor, route, and permission metadata.");
    expect(plan.blockers).toContain("Route tests must cover owner, artist, assistant, studio manager, admin, and custom roles.");
  });

  it("plans ready production auth/session/tenant guards with provider-backed sessions, middleware, CSRF, revocation, field redaction, and audits", () => {
    const plan = buildAuthSessionTenantGuardRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      authTestsPassed: true,
      authTypecheckPassed: true,
      authProviderSelected: true,
      providerLoginLogoutWired: true,
      secureDashboardCookiesConfigured: true,
      mobileTokenStorageConfigured: true,
      serverTenantMembershipPersistenceConfigured: true,
      routeMiddlewareAdaptersConfigured: true,
      dashboardRoutesIntegrated: true,
      mobileApiRoutesIntegrated: true,
      sensitiveServerRoutesIntegrated: true,
      fieldAuthorizationIntegratedInRoutes: true,
      sessionRevocationPersistenceConfigured: true,
      csrfTokenBindingConfigured: true,
      auditLogWritesConfigured: true,
      providerBackedRouteTestsPassed: true,
      crossTenantIntegrationTestsPassed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toContain("provider-backed login/logout integration tests");
    expect(plan.requiredControls).toContain("Bind CSRF tokens to cookie-authenticated mutating route sessions.");
  });

  it("blocks production auth/session/tenant guards until provider, storage, middleware, route integrations, revocation, CSRF, audits, and cross-tenant tests exist", () => {
    const plan = buildAuthSessionTenantGuardRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      authTestsPassed: true,
      authTypecheckPassed: false,
      authProviderSelected: false,
      providerLoginLogoutWired: false,
      secureDashboardCookiesConfigured: false,
      mobileTokenStorageConfigured: false,
      serverTenantMembershipPersistenceConfigured: false,
      routeMiddlewareAdaptersConfigured: false,
      dashboardRoutesIntegrated: false,
      mobileApiRoutesIntegrated: false,
      sensitiveServerRoutesIntegrated: false,
      fieldAuthorizationIntegratedInRoutes: false,
      sessionRevocationPersistenceConfigured: false,
      csrfTokenBindingConfigured: false,
      auditLogWritesConfigured: false,
      providerBackedRouteTestsPassed: false,
      crossTenantIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "auth provider selection, login/logout callback, and provider-backed route test evidence",
      "secure cookie, mobile token storage, revocation, and CSRF binding evidence",
      "server tenant membership persistence and route middleware integration evidence",
      "field authorization, audit-log write, and cross-tenant integration evidence",
    ]);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/auth package script is missing typecheck.",
        "@inkroute/auth typecheck must pass in the installed workspace.",
        "Production auth provider must be selected and configured.",
        "Dashboard sessions must use secure HttpOnly SameSite cookies with rotation.",
        "TenantMember/session lookups must be persisted and resolved server-side.",
        "Cookie-authenticated mutating routes must bind CSRF tokens to the active session.",
        "Cross-tenant route integration tests must prove tenant isolation.",
      ]),
    );
  });
});
