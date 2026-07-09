import { describe, expect, it } from "vitest";
import {
  assertPermission,
  authSessionTenantGuardRuntimeRequiredCommands,
  authSessionTenantGuardRuntimeRequiredControls,
  authSessionTenantGuardRuntimeRequiredEvidence,
  buildAuthSessionTenantGuardRuntimeReadinessPlan,
  buildDashboardAuthGuardEvidencePlan,
  buildDashboardLaunchEvidencePlan,
  buildDashboardReadinessPlan,
  buildDomainAuthorizationRouteEvidencePlan,
  buildDomainAuthorizationRuntimeReadinessPlan,
  buildMobileAuthRuntimeReadinessPlan,
  buildProviderSessionStoreReadinessPlan,
  buildSessionPersistencePlan,
  dashboardAuthGuardRequiredCommands,
  dashboardAuthGuardRequiredControls,
  dashboardAuthGuardRequiredEvidence,
  dashboardLaunchEvidenceRequiredCommands,
  dashboardLaunchEvidenceRequiredControls,
  dashboardLaunchEvidenceRequiredEvidence,
  dashboardReadinessRequiredCommands,
  dashboardReadinessRequiredControls,
  domainAuthorizationRouteRequiredCommands,
  domainAuthorizationRouteRequiredControls,
  domainAuthorizationRouteRequiredEvidence,
  domainAuthorizationRuntimeRequiredCommands,
  domainAuthorizationRuntimeRequiredControls,
  evaluateApiRouteGuard,
  evaluateDashboardRouteGuard,
  evaluateFieldAuthorization,
  evaluateMobileSessionGate,
  evaluateTenantAuthorization,
  hasPermission,
  mobileAuthRuntimeReadinessRequiredCommands,
  mobileAuthRuntimeReadinessRequiredEvidence,
  providerSessionCallbackContract,
  providerSessionStoreRequiredCommands,
  providerSessionStoreRequiredControls,
  providerSessionStoreRequiredEvidence,
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
      auditAction: expect.stringMatching(/^dashboard:booking:write:[a-f0-9]{64}$/),
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
      auditAction: expect.stringMatching(/^mobile:booking:read:[a-f0-9]{64}$/),
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
    expect(plan.requiredCommands).toBe(mobileAuthRuntimeReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(mobileAuthRuntimeReadinessRequiredEvidence);
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
      responseHeaders: {
        "cache-control": "no-store",
        "x-authz-audit-action-hash": expect.stringMatching(/^[a-f0-9]{64}$/),
        "x-authz-audit-action-echoed": "false",
      },
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
      responseHeaders: {
        "x-authz-audit-action-hash": expect.stringMatching(/^[a-f0-9]{64}$/),
        "x-authz-audit-action-echoed": "false",
      },
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
    expect(plan.requiredCommands).toBe(dashboardReadinessRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardReadinessRequiredControls);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Dashboard Next.js build has not been verified in the installed workspace.",
      "Dashboard has no verified seeded tenant data source for smoke and mutation tests.",
      "Dashboard provider actions are still static/demo gated and cannot execute production provider calls.",
      "Every dashboard mutation/provider action must write an AuditLog row.",
    ]));
  });

  it("blocks dashboard launch evidence until build, provider auth, tenant APIs, mutations, audits, denial tests, states, CI, and artifacts are proven", () => {
    const plan = buildDashboardLaunchEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", build: "next build" },
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: false,
      dashboardUnitTestsPassed: false,
      dashboardPlaywrightSmokePassed: false,
      seededTenantDataAvailable: false,
      providerBackedAuthConfigured: false,
      tenantScopedApisImplemented: false,
      prismaRepositoriesImplemented: false,
      realMutationsEnabled: false,
      mutationAuditLogsPersisted: false,
      providerActionsImplemented: false,
      rbacDenialTestsPassed: false,
      crossTenantDenialTestsPassed: false,
      fieldRedactionVerified: false,
      loadingEmptyErrorStatesVerified: false,
      ciEvidenceCaptured: false,
      dashboardArtifactsSecretSafe: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["test"]);
    expect(plan.requiredCommands).toBe(dashboardLaunchEvidenceRequiredCommands);
    expect(plan.requiredEvidence).toBe(dashboardLaunchEvidenceRequiredEvidence);
    expect(plan.requiredControls).toBe(dashboardLaunchEvidenceRequiredControls);
    expect(plan.blockers).toContain("Dashboard Playwright smoke tests must pass with seeded tenant data.");
    expect(plan.blockers).toContain("Dashboard must use provider-backed auth/session state.");
    expect(plan.blockers).toContain("Dashboard test/build artifacts must be redacted and free of secrets or client-private data.");
  });

  it("marks dashboard launch evidence ready when build, provider auth, tenant APIs, mutations, audits, denial tests, states, CI, and artifacts align", () => {
    const plan = buildDashboardLaunchEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", build: "next build", test: "vitest run" },
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      dashboardUnitTestsPassed: true,
      dashboardPlaywrightSmokePassed: true,
      seededTenantDataAvailable: true,
      providerBackedAuthConfigured: true,
      tenantScopedApisImplemented: true,
      prismaRepositoriesImplemented: true,
      realMutationsEnabled: true,
      mutationAuditLogsPersisted: true,
      providerActionsImplemented: true,
      rbacDenialTestsPassed: true,
      crossTenantDenialTestsPassed: true,
      fieldRedactionVerified: true,
      loadingEmptyErrorStatesVerified: true,
      ciEvidenceCaptured: true,
      dashboardArtifactsSecretSafe: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(dashboardLaunchEvidenceRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardLaunchEvidenceRequiredControls);
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
    expect(plan.requiredCommands).toBe(domainAuthorizationRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(domainAuthorizationRuntimeRequiredControls);
    expect(plan.blockers).toContain("CustomRole rows must be loaded from the database before runtime authorization decisions.");
    expect(plan.blockers).toContain("Authorization allow/deny decisions must persist AuditLog rows with tenant, actor, route, and permission metadata.");
    expect(plan.blockers).toContain("Route tests must cover owner, artist, assistant, studio manager, admin, and custom roles.");
  });

  it("summarizes domain authorization route evidence across DB roles, middleware, role matrices, audits, CSRF, revocation, CI, and artifacts", () => {
    const plan = buildDomainAuthorizationRouteEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      authTestsPassed: true,
      authTypecheckPassed: true,
      customRolesLoadedFromDatabase: true,
      dashboardMiddlewareUsesRouteGuard: true,
      apiMiddlewareUsesRouteGuard: true,
      serverActionsUseRouteGuard: true,
      routeRoleMatrixTestsPassed: true,
      customRoleRouteTestsPassed: true,
      crossTenantDenialTestsPassed: true,
      fieldRedactionRouteTestsPassed: true,
      authorizationAuditRowsPersisted: true,
      csrfSessionBindingTestsPassed: true,
      sessionRevocationTestsPassed: true,
      providerBackedSessionTestsPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(domainAuthorizationRouteRequiredCommands);
    expect(plan.requiredControls).toBe(domainAuthorizationRouteRequiredControls);
  });

  it("blocks dashboard auth guard evidence until provider sessions, middleware, layouts, DB roles, browser smoke, CI, and safe artifacts exist", () => {
    const plan = buildDashboardAuthGuardEvidencePlan({
      packageScripts: { test: "vitest run" },
      authTestsPassed: true,
      authTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      authProviderSessionsConfigured: false,
      dashboardMiddlewareEnforcesGuard: false,
      routeMethodPermissionMappingCaptured: false,
      protectedLayoutEnforcesGuard: false,
      dashboardApiHelpersEnforceGuard: false,
      tenantMembershipDbLookupConfigured: false,
      customRoleDbLookupConfigured: false,
      unauthorizedStatesImplemented: false,
      authAuditLogsPersisted: false,
      authRunPersistenceContractCaptured: false,
      browserLoginLogoutPassed: false,
      browserTenantSwitchPassed: false,
      browserCrossTenantDenialPassed: false,
      noStoreCacheVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(dashboardAuthGuardRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardAuthGuardRequiredControls);
    expect(plan.requiredEvidence).toBe(dashboardAuthGuardRequiredEvidence);
    expect(plan.blockers).toContain("Dashboard middleware must enforce auth and tenant guard decisions before route rendering.");
    expect(plan.blockers).toContain("Dashboard route-method permission inference must prove safe/read, mutating/write, and unknown-method deny behavior.");
    expect(plan.blockers).toContain("Dashboard unauthorized, login redirect, tenant-switch, expired-session, and denied-permission state evidence must be captured before auth guard readiness.");
    expect(plan.blockers).toContain("Dashboard auth guard run records must expose a redacted AuditLog persistence contract.");
    expect(plan.blockers).not.toContain("Dashboard unauthorized, login redirect, tenant-switch, expired-session, and denied-permission states must be implemented.");
    expect(plan.blockers).toContain("Browser cross-tenant denial evidence must prove private tenant data is not exposed.");
    expect(plan.blockers).toContain("Dashboard auth guard artifacts must be redacted and free of secrets, session tokens, raw PII, medical, and payment data.");
  });

  it("marks dashboard auth guard evidence ready when provider sessions, guards, browser smoke, CI, and artifacts align", () => {
    const plan = buildDashboardAuthGuardEvidencePlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      authTestsPassed: true,
      authTypecheckPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      authProviderSessionsConfigured: true,
      dashboardMiddlewareEnforcesGuard: true,
      routeMethodPermissionMappingCaptured: true,
      protectedLayoutEnforcesGuard: true,
      dashboardApiHelpersEnforceGuard: true,
      tenantMembershipDbLookupConfigured: true,
      customRoleDbLookupConfigured: true,
      unauthorizedStatesImplemented: true,
      authAuditLogsPersisted: true,
      authRunPersistenceContractCaptured: true,
      browserLoginLogoutPassed: true,
      browserTenantSwitchPassed: true,
      browserCrossTenantDenialPassed: true,
      noStoreCacheVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(dashboardAuthGuardRequiredCommands);
    expect(plan.requiredControls).toBe(dashboardAuthGuardRequiredControls);
  });

  it("blocks domain authorization route evidence until DB roles, route guards, role matrices, audits, CSRF, revocation, CI, and safe artifacts exist", () => {
    const plan = buildDomainAuthorizationRouteEvidencePlan({
      packageScripts: { test: "vitest run" },
      authTestsPassed: true,
      authTypecheckPassed: false,
      customRolesLoadedFromDatabase: false,
      dashboardMiddlewareUsesRouteGuard: false,
      apiMiddlewareUsesRouteGuard: false,
      serverActionsUseRouteGuard: false,
      routeRoleMatrixTestsPassed: false,
      customRoleRouteTestsPassed: false,
      crossTenantDenialTestsPassed: false,
      fieldRedactionRouteTestsPassed: false,
      authorizationAuditRowsPersisted: false,
      csrfSessionBindingTestsPassed: false,
      sessionRevocationTestsPassed: false,
      providerBackedSessionTestsPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toBe(domainAuthorizationRouteRequiredEvidence);
    expect(plan.blockers).toContain("CustomRole rows must be loaded from tenant-scoped database storage in guarded route tests.");
    expect(plan.blockers).toContain("Cross-tenant dashboard/API/server-action denial tests must pass.");
    expect(plan.blockers).toContain("Authorization route artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
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
    expect(plan.requiredCommands).toBe(authSessionTenantGuardRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(authSessionTenantGuardRuntimeRequiredControls);
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
    expect(plan.requiredEvidence).toBe(authSessionTenantGuardRuntimeRequiredEvidence);
    expect(plan.requiredCommands).toBe(authSessionTenantGuardRuntimeRequiredCommands);
    expect(plan.requiredControls).toBe(authSessionTenantGuardRuntimeRequiredControls);
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

  it("blocks provider session-store readiness until callbacks, persisted membership, revocation, secure storage, audits, and smoke evidence exist", () => {
    expect(providerSessionCallbackContract.map((entry) => entry.kind)).toEqual(["login", "logout", "session"]);
    expect(providerSessionCallbackContract.map((entry) => entry.auditAction)).toEqual([
      "auth.provider.login",
      "auth.provider.logout",
      "auth.provider.session",
    ]);
    expect(providerSessionCallbackContract.every((entry) => entry.rawProviderTokenLoggingAllowed === false)).toBe(true);
    expect(providerSessionCallbackContract.every((entry) => entry.rawProviderSubjectLoggingAllowed === false)).toBe(true);
    expect(providerSessionCallbackContract.every((entry) => entry.rawProviderSessionLoggingAllowed === false)).toBe(true);
    expect(providerSessionCallbackContract.every((entry) => entry.rawUserSelectorLoggingAllowed === false)).toBe(true);
    expect(providerSessionCallbackContract.every((entry) => entry.rawTenantSelectorLoggingAllowed === false)).toBe(true);

    const plan = buildProviderSessionStoreReadinessPlan({
      packageScripts: { test: "vitest run" },
      providerSelected: false,
      providerEnvConfigured: false,
      loginCallbackWired: false,
      logoutCallbackWired: false,
      sessionCallbackWired: true,
      userProvisioningConfigured: false,
      tenantMembershipLookupPersisted: false,
      customRoleLookupPersisted: false,
      databaseSessionStoreConfigured: false,
      sessionRevocationPersisted: false,
      secureDashboardCookiesConfigured: false,
      mobileTokenStorageConfigured: false,
      auditLogWritesConfigured: false,
      providerBackedTestsPassed: false,
      crossTenantSmokeTestsPassed: false,
      commandEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(providerSessionStoreRequiredCommands);
    expect(plan.requiredEvidence).toBe(providerSessionStoreRequiredEvidence);
    expect(plan.requiredControls).toBe(providerSessionStoreRequiredControls);
    expect(providerSessionStoreRequiredControls).toContain(
      "Write redacted AuditLog rows for auth lifecycle and authorization decisions using hashed provider/user/session/tenant selectors only.",
    );
    expect(providerSessionStoreRequiredEvidence).toContain(
      "provider selection, redacted environment/callback configuration, and login/logout/session callback evidence with raw provider subject/session selectors suppressed",
    );
    expect(providerSessionStoreRequiredEvidence).toContain(
      "provider identity mapping plus persisted user, TenantMember, CustomRole, and session lookup evidence with hashed user/tenant/session selectors",
    );
    expect(plan.blockers).toContain("Auth provider must be selected before provider-backed sessions can be claimed.");
    expect(plan.blockers).toContain("TenantMember lookup must come from the database or provider-backed server store.");
    expect(plan.blockers).toContain("Tenant isolation smoke tests must deny cross-tenant provider sessions.");
  });

  it("marks provider session-store readiness ready when callbacks, persistence, revocation, secure storage, audits, and smoke evidence align", () => {
    const plan = buildProviderSessionStoreReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      providerSelected: true,
      providerEnvConfigured: true,
      loginCallbackWired: true,
      logoutCallbackWired: true,
      sessionCallbackWired: true,
      userProvisioningConfigured: true,
      tenantMembershipLookupPersisted: true,
      customRoleLookupPersisted: true,
      databaseSessionStoreConfigured: true,
      sessionRevocationPersisted: true,
      secureDashboardCookiesConfigured: true,
      mobileTokenStorageConfigured: true,
      auditLogWritesConfigured: true,
      providerBackedTestsPassed: true,
      crossTenantSmokeTestsPassed: true,
      commandEvidenceCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
    expect(plan.requiredCommands).toBe(providerSessionStoreRequiredCommands);
    expect(plan.requiredControls).toBe(providerSessionStoreRequiredControls);
  });
});
