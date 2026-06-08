import { describe, expect, it } from "vitest";
import { assertPermission, evaluateTenantAuthorization, hasPermission } from "../src/index";

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
});
