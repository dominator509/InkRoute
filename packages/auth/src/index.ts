import type { Permission, Role } from "@inkroute/types";

export const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    "tenant:read",
    "tenant:write",
    "booking:read",
    "booking:write",
    "client:read",
    "client:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "payment:read",
    "payment:write",
    "seo:read",
    "seo:write",
    "analytics:read",
    "error:read",
    "error:write",
    "release:read",
    "release:write",
    "settings:write",
  ],
  studio_manager: [
    "tenant:read",
    "booking:read",
    "booking:write",
    "client:read",
    "client:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "payment:read",
    "seo:read",
    "seo:write",
    "analytics:read",
    "error:read",
    "error:write",
    "release:read",
  ],
  artist: [
    "tenant:read",
    "booking:read",
    "booking:write",
    "client:read",
    "client:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "payment:read",
    "analytics:read",
  ],
  assistant: ["tenant:read", "booking:read", "booking:write", "client:read", "portfolio:read", "travel:read"],
  admin: [
    "tenant:read",
    "tenant:write",
    "booking:read",
    "client:read",
    "portfolio:read",
    "travel:read",
    "payment:read",
    "seo:read",
    "analytics:read",
    "error:read",
    "release:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} does not have permission ${permission}`);
  }
}

export interface TenantAccessContext {
  tenantId: string;
  userId: string;
  role: Role;
  sessionId?: string;
  expiresAt?: string;
  revokedAt?: string;
}

export function canAccessTenant(context: TenantAccessContext, tenantId: string): boolean {
  return context.tenantId === tenantId;
}

export type AuthorizationDecisionStatus =
  | "allowed"
  | "unauthenticated"
  | "session_expired"
  | "session_revoked"
  | "tenant_mismatch"
  | "permission_denied";

export interface AuthorizationDecision {
  allowed: boolean;
  status: AuthorizationDecisionStatus;
  userId?: string;
  tenantId?: string;
  role?: Role;
  permission?: Permission;
  auditAction: string;
  reason: string;
}

export function evaluateTenantAuthorization(input: {
  context?: TenantAccessContext | null;
  tenantId: string;
  permission: Permission;
  now: string;
  auditAction?: string;
}): AuthorizationDecision {
  const auditAction = input.auditAction ?? `authz:${input.permission}`;
  const context = input.context;

  if (!context) {
    return {
      allowed: false,
      status: "unauthenticated",
      permission: input.permission,
      auditAction,
      reason: "No authenticated session context is available.",
    };
  }

  const base = {
    userId: context.userId,
    tenantId: context.tenantId,
    role: context.role,
    permission: input.permission,
    auditAction,
  };

  if (context.revokedAt) {
    return {
      ...base,
      allowed: false,
      status: "session_revoked",
      reason: "Session has been revoked and must not authorize tenant access.",
    };
  }

  if (context.expiresAt && new Date(context.expiresAt).getTime() <= new Date(input.now).getTime()) {
    return {
      ...base,
      allowed: false,
      status: "session_expired",
      reason: "Session is expired and must be refreshed before tenant access.",
    };
  }

  if (!canAccessTenant(context, input.tenantId)) {
    return {
      ...base,
      allowed: false,
      status: "tenant_mismatch",
      reason: "Authenticated session is not scoped to the requested tenant.",
    };
  }

  if (!hasPermission(context.role, input.permission)) {
    return {
      ...base,
      allowed: false,
      status: "permission_denied",
      reason: `Role ${context.role} does not have permission ${input.permission}.`,
    };
  }

  return {
    ...base,
    allowed: true,
    status: "allowed",
    reason: "Session is active, tenant-scoped, and role includes the required permission.",
  };
}
