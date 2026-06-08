import type { Permission, Role } from "@inkroute/types";

export const allPermissions: Permission[] = [
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
];

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

const permissionSet = new Set<string>(allPermissions);

export interface CustomRoleGrant {
  id: string;
  tenantId: string;
  name?: string;
  permissions: readonly string[];
  isActive?: boolean;
}

export interface PermissionResolution {
  role: Role;
  permissions: Permission[];
  customRoleId?: string;
  customRoleName?: string;
  customRoleApplied: boolean;
  rejectedPermissions: string[];
  ignoredReason?: "tenant_mismatch" | "inactive";
}

export function isPermission(value: string): value is Permission {
  return permissionSet.has(value);
}

export function resolveTenantPermissions(input: { role: Role; tenantId: string; customRole?: CustomRoleGrant | null }): PermissionResolution {
  const permissions = new Set<Permission>(rolePermissions[input.role]);
  const customRole = input.customRole;

  if (!customRole) {
    return {
      role: input.role,
      permissions: Array.from(permissions),
      customRoleApplied: false,
      rejectedPermissions: [],
    };
  }

  if (customRole.tenantId !== input.tenantId) {
    return {
      role: input.role,
      permissions: Array.from(permissions),
      customRoleId: customRole.id,
      customRoleName: customRole.name,
      customRoleApplied: false,
      rejectedPermissions: [],
      ignoredReason: "tenant_mismatch",
    };
  }

  if (customRole.isActive === false) {
    return {
      role: input.role,
      permissions: Array.from(permissions),
      customRoleId: customRole.id,
      customRoleName: customRole.name,
      customRoleApplied: false,
      rejectedPermissions: [],
      ignoredReason: "inactive",
    };
  }

  const rejectedPermissions: string[] = [];
  for (const permission of customRole.permissions) {
    if (isPermission(permission)) {
      permissions.add(permission);
    } else {
      rejectedPermissions.push(permission);
    }
  }

  return {
    role: input.role,
    permissions: Array.from(permissions),
    customRoleId: customRole.id,
    customRoleName: customRole.name,
    customRoleApplied: true,
    rejectedPermissions,
  };
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function hasResolvedPermission(resolution: PermissionResolution, permission: Permission): boolean {
  return resolution.permissions.includes(permission);
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
  customRole?: CustomRoleGrant | null;
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
  customRoleId?: string;
  rejectedPermissions?: string[];
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
    customRoleId: context.customRole?.id,
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

  const resolution = resolveTenantPermissions({
    role: context.role,
    tenantId: context.tenantId,
    customRole: context.customRole,
  });

  if (!hasResolvedPermission(resolution, input.permission)) {
    return {
      ...base,
      allowed: false,
      status: "permission_denied",
      rejectedPermissions: resolution.rejectedPermissions,
      reason:
        resolution.ignoredReason === "tenant_mismatch"
          ? "Custom role belongs to a different tenant and was ignored."
          : `Role ${context.role} does not have permission ${input.permission}.`,
    };
  }

  return {
    ...base,
    allowed: true,
    status: "allowed",
    rejectedPermissions: resolution.rejectedPermissions,
    reason: "Session is active, tenant-scoped, and role includes the required permission.",
  };
}

export type DashboardGuardAction = "allow" | "redirect_login" | "redirect_tenant_switch" | "deny";

export interface DashboardRouteGuardInput {
  context?: TenantAccessContext | null;
  tenantId: string;
  permission: Permission;
  routePath: string;
  now: string;
  loginPath?: string;
  tenantSwitchPath?: string;
}

export interface DashboardRouteGuardDecision {
  action: DashboardGuardAction;
  allowed: boolean;
  status: AuthorizationDecisionStatus;
  routePath: string;
  redirectTo?: string;
  auditAction: string;
  reason: string;
  cachePolicy: "no-store";
  decision: AuthorizationDecision;
}

export function evaluateDashboardRouteGuard(input: DashboardRouteGuardInput): DashboardRouteGuardDecision {
  const auditAction = `dashboard:${input.permission}:${input.routePath}`;
  const decision = evaluateTenantAuthorization({
    context: input.context,
    tenantId: input.tenantId,
    permission: input.permission,
    now: input.now,
    auditAction,
  });

  const base = {
    allowed: decision.allowed,
    status: decision.status,
    routePath: input.routePath,
    auditAction,
    reason: decision.reason,
    cachePolicy: "no-store" as const,
    decision,
  };

  if (decision.allowed) {
    return {
      ...base,
      action: "allow",
    };
  }

  if (decision.status === "unauthenticated" || decision.status === "session_expired" || decision.status === "session_revoked") {
    return {
      ...base,
      action: "redirect_login",
      redirectTo: `${input.loginPath ?? "/login"}?next=${encodeURIComponent(input.routePath)}`,
    };
  }

  if (decision.status === "tenant_mismatch") {
    return {
      ...base,
      action: "redirect_tenant_switch",
      redirectTo: input.tenantSwitchPath ?? "/tenant-switcher",
    };
  }

  return {
    ...base,
    action: "deny",
  };
}

export type MobileSessionGateAction = "allow" | "prompt_login" | "refresh_session" | "prompt_biometric" | "deny" | "logout";

export type MobileSessionGateStatus =
  | AuthorizationDecisionStatus
  | "biometric_locked"
  | "secure_store_unavailable"
  | "refresh_token_missing"
  | "logout_requested";

export interface MobileSessionGateInput {
  context?: TenantAccessContext | null;
  tenantId: string;
  permission: Permission;
  now: string;
  biometricRequired: boolean;
  biometricUnlocked: boolean;
  secureStoreAvailable: boolean;
  refreshTokenAvailable: boolean;
  logoutRequested?: boolean;
}

export interface MobileSessionGateDecision {
  action: MobileSessionGateAction;
  allowed: boolean;
  status: MobileSessionGateStatus;
  tenantId: string;
  permission: Permission;
  auditAction: string;
  requiresSecureStore: true;
  requiresTenantMembership: true;
  requiresRefreshToken: boolean;
  requiresBiometricUnlock: boolean;
  reason: string;
  decision?: AuthorizationDecision;
}

export function evaluateMobileSessionGate(input: MobileSessionGateInput): MobileSessionGateDecision {
  const auditAction = `mobile:${input.permission}:${input.tenantId}`;
  const base = {
    tenantId: input.tenantId,
    permission: input.permission,
    auditAction,
    requiresSecureStore: true as const,
    requiresTenantMembership: true as const,
    requiresRefreshToken: false,
    requiresBiometricUnlock: input.biometricRequired,
  };

  if (input.logoutRequested) {
    return {
      ...base,
      action: "logout",
      allowed: false,
      status: "logout_requested",
      reason: "Mobile logout requested; local session, biometric gate, and refresh token must be cleared.",
    };
  }

  if (!input.secureStoreAvailable) {
    return {
      ...base,
      action: "prompt_login",
      allowed: false,
      status: "secure_store_unavailable",
      reason: "Secure device storage is required before mobile session tokens can be trusted.",
    };
  }

  if (!input.context) {
    return {
      ...base,
      action: "prompt_login",
      allowed: false,
      status: "unauthenticated",
      reason: "No mobile session context is available.",
    };
  }

  if (input.biometricRequired && !input.biometricUnlocked) {
    return {
      ...base,
      action: "prompt_biometric",
      allowed: false,
      status: "biometric_locked",
      reason: "Biometric unlock is required before using the cached mobile session.",
    };
  }

  const decision = evaluateTenantAuthorization({
    context: input.context,
    tenantId: input.tenantId,
    permission: input.permission,
    now: input.now,
    auditAction,
  });

  if (decision.status === "session_expired") {
    if (!input.refreshTokenAvailable) {
      return {
        ...base,
        action: "prompt_login",
        allowed: false,
        status: "refresh_token_missing",
        requiresRefreshToken: true,
        decision,
        reason: "Mobile session expired and no refresh token is available in secure storage.",
      };
    }

    return {
      ...base,
      action: "refresh_session",
      allowed: false,
      status: "session_expired",
      requiresRefreshToken: true,
      decision,
      reason: "Mobile session expired and should be refreshed before tenant access continues.",
    };
  }

  if (decision.status === "session_revoked") {
    return {
      ...base,
      action: "logout",
      allowed: false,
      status: "session_revoked",
      decision,
      reason: "Revoked mobile session must be cleared locally.",
    };
  }

  if (!decision.allowed) {
    return {
      ...base,
      action: decision.status === "unauthenticated" ? "prompt_login" : "deny",
      allowed: false,
      status: decision.status,
      decision,
      reason: decision.reason,
    };
  }

  return {
    ...base,
    action: "allow",
    allowed: true,
    status: "allowed",
    decision,
    reason: "Mobile session is secure-store backed, biometric-unlocked when required, tenant-scoped, and authorized.",
  };
}
