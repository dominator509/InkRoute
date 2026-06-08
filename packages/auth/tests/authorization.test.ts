import { describe, expect, it } from "vitest";
import {
  assertPermission,
  evaluateDashboardRouteGuard,
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
});
