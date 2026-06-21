import type { Permission, Role } from "@inkroute/types";

export const allPermissions: Permission[] = [
  "tenant:read",
  "tenant:write",
  "booking:read",
  "booking:write",
  "client:read",
  "client:write",
  "form:read",
  "form:write",
  "message:read",
  "message:write",
  "notification:read",
  "notification:write",
  "portfolio:read",
  "portfolio:write",
  "travel:read",
  "travel:write",
  "calendar:read",
  "calendar:write",
  "payment:read",
  "payment:write",
  "review:read",
  "review:write",
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
    "form:read",
    "form:write",
    "message:read",
    "message:write",
    "notification:read",
    "notification:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "calendar:read",
    "calendar:write",
    "payment:read",
    "payment:write",
    "review:read",
    "review:write",
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
    "form:read",
    "form:write",
    "message:read",
    "message:write",
    "notification:read",
    "notification:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "calendar:read",
    "calendar:write",
    "payment:read",
    "review:read",
    "review:write",
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
    "form:read",
    "form:write",
    "message:read",
    "message:write",
    "notification:read",
    "notification:write",
    "portfolio:read",
    "portfolio:write",
    "travel:read",
    "travel:write",
    "calendar:read",
    "calendar:write",
    "payment:read",
    "review:read",
    "review:write",
    "analytics:read",
  ],
  assistant: ["tenant:read", "booking:read", "booking:write", "client:read", "form:read", "message:read", "notification:read", "portfolio:read", "review:read", "travel:read", "calendar:read"],
  admin: [
    "tenant:read",
    "tenant:write",
    "booking:read",
    "client:read",
    "form:read",
    "message:read",
    "notification:read",
    "portfolio:read",
    "travel:read",
    "calendar:read",
    "payment:read",
    "review:read",
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
      ...(customRole.name ? { customRoleName: customRole.name } : {}),
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
      ...(customRole.name ? { customRoleName: customRole.name } : {}),
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
    ...(customRole.name ? { customRoleName: customRole.name } : {}),
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
    ...(context.customRole?.id ? { customRoleId: context.customRole.id } : {}),
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
    customRole: context.customRole ?? null,
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
    ...(input.context !== undefined ? { context: input.context } : {}),
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

export interface MobileAuthRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  authTestsPassed: boolean;
  authTypecheckPassed: boolean;
  mobileTypecheckPassed: boolean;
  mobileDeviceTestsPassed: boolean;
  authProviderConfigured: boolean;
  providerLoginLogoutTested: boolean;
  expoSecureStoreConfigured: boolean;
  biometricUnlockConfigured: boolean;
  biometricDeviceTested: boolean;
  refreshTokenRecoveryTested: boolean;
  logoutClearsLocalStateTested: boolean;
  revokedSessionClearsLocalStateTested: boolean;
  tenantMembershipLookupConfigured: boolean;
  roleResolutionConfigured: boolean;
  crossTenantDenialTested: boolean;
  secureTokenStorageVerified: boolean;
  auditLogPersistenceConfigured: boolean;
}

export interface MobileAuthRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof mobileAuthRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly MobileAuthRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export const mobileAuthRuntimeReadinessRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo iOS/Android auth smoke tests",
  "Expo device biometric unlock test",
] as const;

export const mobileAuthRuntimeReadinessRequiredEvidence = [
  "provider-backed mobile login/logout test output",
  "Expo SecureStore token persistence/clearing evidence with no plaintext token storage",
  "biometric unlock simulator/device evidence",
  "refresh, logout, and revoked-session clearing test output",
  "tenant membership, role resolution, and cross-tenant denial test output",
] as const;

export type MobileAuthRuntimeReadinessRequiredEvidence = (typeof mobileAuthRuntimeReadinessRequiredEvidence)[number];

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
    ...(input.context !== undefined ? { context: input.context } : {}),
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

export function buildMobileAuthRuntimeReadinessPlan(input: MobileAuthRuntimeReadinessInput): MobileAuthRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: MobileAuthRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.authTestsPassed) blockers.push("@inkroute/auth mobile session gate tests must pass.");
  if (!input.authTypecheckPassed) blockers.push("@inkroute/auth typecheck must pass in an installed workspace.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with auth/session wiring.");
  if (!input.mobileDeviceTestsPassed) blockers.push("Expo mobile device/simulator auth tests must pass.");
  if (!input.authProviderConfigured) blockers.push("Mobile auth provider must be selected and configured before login/logout is production-ready.");
  if (!input.providerLoginLogoutTested) blockers.push("Provider-backed mobile login and logout flows must be tested.");
  if (!input.expoSecureStoreConfigured) blockers.push("Expo SecureStore must persist refresh/session material.");
  if (!input.biometricUnlockConfigured) blockers.push("Biometric unlock gate must be configured for cached mobile sessions.");
  if (!input.biometricDeviceTested) blockers.push("Biometric unlock must be verified on simulator/device.");
  if (!input.refreshTokenRecoveryTested) blockers.push("Expired mobile sessions must refresh from secure storage or fail closed.");
  if (!input.logoutClearsLocalStateTested) blockers.push("Logout must clear secure storage, biometric gate state, and cached tenant context.");
  if (!input.revokedSessionClearsLocalStateTested) blockers.push("Revoked sessions must clear local mobile auth state.");
  if (!input.tenantMembershipLookupConfigured) blockers.push("Mobile session resolution must load tenant membership from the server/provider-backed store.");
  if (!input.roleResolutionConfigured) blockers.push("Mobile role/permission resolution must use provider-backed tenant membership.");
  if (!input.crossTenantDenialTested) blockers.push("Mobile auth tests must reject cross-tenant access.");
  if (!input.secureTokenStorageVerified) blockers.push("Secure token storage must be verified to avoid plaintext token persistence.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Mobile login, refresh, logout, denial, revocation, and tenant-switch decisions must persist audit logs.");

  if (!input.authProviderConfigured || !input.providerLoginLogoutTested) requiredEvidence.push(mobileAuthRuntimeReadinessRequiredEvidence[0]);
  if (!input.expoSecureStoreConfigured || !input.secureTokenStorageVerified) {
    requiredEvidence.push(mobileAuthRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.biometricUnlockConfigured || !input.biometricDeviceTested) requiredEvidence.push(mobileAuthRuntimeReadinessRequiredEvidence[2]);
  if (!input.refreshTokenRecoveryTested || !input.logoutClearsLocalStateTested || !input.revokedSessionClearsLocalStateTested) {
    requiredEvidence.push(mobileAuthRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.tenantMembershipLookupConfigured || !input.roleResolutionConfigured || !input.crossTenantDenialTested) {
    requiredEvidence.push(mobileAuthRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobileAuthRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === mobileAuthRuntimeReadinessRequiredEvidence.length
        ? mobileAuthRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export type ApiRouteGuardAction = "allow" | "reject_401" | "reject_403" | "reject_409" | "reject_419";
export type ApiRouteGuardStatus = AuthorizationDecisionStatus | "csrf_failed";

export interface ApiRouteGuardInput {
  context?: TenantAccessContext | null;
  tenantId: string;
  permission: Permission;
  routePath: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  now: string;
  csrfRequired?: boolean;
  csrfValid?: boolean;
}

export interface ApiRouteGuardDecision {
  action: ApiRouteGuardAction;
  allowed: boolean;
  status: ApiRouteGuardStatus;
  statusCode: 200 | 401 | 403 | 409 | 419;
  tenantId: string;
  permission: Permission;
  routePath: string;
  method: ApiRouteGuardInput["method"];
  auditAction: string;
  reason: string;
  responseHeaders: Record<string, string>;
  decision?: AuthorizationDecision;
}

function mutatesState(method: ApiRouteGuardInput["method"]): boolean {
  return method !== "GET";
}

export function evaluateApiRouteGuard(input: ApiRouteGuardInput): ApiRouteGuardDecision {
  const auditAction = `api:${input.method}:${input.permission}:${input.routePath}`;
  const responseHeaders = {
    "cache-control": "no-store",
    "x-authz-audit-action": auditAction,
  };

  if ((input.csrfRequired ?? mutatesState(input.method)) && mutatesState(input.method) && !input.csrfValid) {
    return {
      action: "reject_419",
      allowed: false,
      status: "csrf_failed",
      statusCode: 419,
      tenantId: input.tenantId,
      permission: input.permission,
      routePath: input.routePath,
      method: input.method,
      auditAction,
      reason: "Mutating API route requires a valid CSRF/session binding token.",
      responseHeaders,
    };
  }

  const decision = evaluateTenantAuthorization({
    ...(input.context !== undefined ? { context: input.context } : {}),
    tenantId: input.tenantId,
    permission: input.permission,
    now: input.now,
    auditAction,
  });

  if (decision.allowed) {
    return {
      action: "allow",
      allowed: true,
      status: "allowed",
      statusCode: 200,
      tenantId: input.tenantId,
      permission: input.permission,
      routePath: input.routePath,
      method: input.method,
      auditAction,
      reason: decision.reason,
      responseHeaders,
      decision,
    };
  }

  if (decision.status === "tenant_mismatch") {
    return {
      action: "reject_409",
      allowed: false,
      status: "tenant_mismatch",
      statusCode: 409,
      tenantId: input.tenantId,
      permission: input.permission,
      routePath: input.routePath,
      method: input.method,
      auditAction,
      reason: decision.reason,
      responseHeaders,
      decision,
    };
  }

  if (decision.status === "unauthenticated" || decision.status === "session_expired") {
    return {
      action: "reject_401",
      allowed: false,
      status: decision.status,
      statusCode: 401,
      tenantId: input.tenantId,
      permission: input.permission,
      routePath: input.routePath,
      method: input.method,
      auditAction,
      reason: decision.reason,
      responseHeaders,
      decision,
    };
  }

  return {
    action: "reject_403",
    allowed: false,
    status: decision.status,
    statusCode: 403,
    tenantId: input.tenantId,
    permission: input.permission,
    routePath: input.routePath,
    method: input.method,
    auditAction,
    reason: decision.reason,
    responseHeaders,
    decision,
  };
}

export interface FieldAuthorizationPolicy {
  field: string;
  permission: Permission;
  sensitivity: "public" | "tenant" | "client_private" | "medical" | "payment" | "system";
}

export interface FieldAuthorizationInput {
  context?: TenantAccessContext | null;
  tenantId: string;
  resource: string;
  fields: readonly string[];
  policies: readonly FieldAuthorizationPolicy[];
  now: string;
}

export interface FieldAuthorizationDecision {
  resource: string;
  allowedFields: readonly string[];
  deniedFields: readonly { field: string; permission: Permission; sensitivity: FieldAuthorizationPolicy["sensitivity"]; status: AuthorizationDecisionStatus }[];
  redactionPolicy: "allow_all" | "redact_denied_fields";
  auditActions: readonly string[];
}

export function evaluateFieldAuthorization(input: FieldAuthorizationInput): FieldAuthorizationDecision {
  const policies = new Map(input.policies.map((policy) => [policy.field, policy]));
  const allowedFields: string[] = [];
  const deniedFields: Array<{ field: string; permission: Permission; sensitivity: FieldAuthorizationPolicy["sensitivity"]; status: AuthorizationDecisionStatus }> = [];
  const auditActions: string[] = [];

  for (const field of input.fields) {
    const policy = policies.get(field);
    if (!policy) {
      allowedFields.push(field);
      continue;
    }

    const auditAction = `field:${input.resource}:${field}:${policy.permission}`;
    auditActions.push(auditAction);
    const decision = evaluateTenantAuthorization({
      ...(input.context !== undefined ? { context: input.context } : {}),
      tenantId: input.tenantId,
      permission: policy.permission,
      now: input.now,
      auditAction,
    });

    if (decision.allowed) {
      allowedFields.push(field);
    } else {
      deniedFields.push({
        field,
        permission: policy.permission,
        sensitivity: policy.sensitivity,
        status: decision.status,
      });
    }
  }

  return {
    resource: input.resource,
    allowedFields,
    deniedFields,
    redactionPolicy: deniedFields.length === 0 ? "allow_all" : "redact_denied_fields",
    auditActions,
  };
}

export interface SessionPersistencePlanInput {
  authProviderConfigured: boolean;
  databaseSessionStoreConfigured: boolean;
  secureCookieConfigured: boolean;
  mobileSecureStoreConfigured: boolean;
  revocationStoreConfigured: boolean;
  auditLogConfigured: boolean;
}

export interface SessionPersistencePlan {
  status: "ready" | "blocked";
  blockers: readonly string[];
  requiredTables: readonly string[];
  requiredRuntimeControls: readonly string[];
  auditEvents: readonly string[];
}

export interface DomainAuthorizationRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  customRolesLoadedFromDatabase: boolean;
  middlewareUsesRouteGuard: boolean;
  dashboardRoutesGuarded: boolean;
  apiRoutesGuarded: boolean;
  serverActionsGuarded: boolean;
  fieldRedactionApplied: boolean;
  authorizationAuditPersisted: boolean;
  tenantMismatchTestsPassed: boolean;
  roleMatrixRouteTestsPassed: boolean;
  csrfSessionBindingVerified: boolean;
  sessionRevocationChecked: boolean;
}

export interface DomainAuthorizationRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof domainAuthorizationRuntimeRequiredCommands;
  requiredControls: typeof domainAuthorizationRuntimeRequiredControls;
  blockers: readonly string[];
}

export interface AuthSessionTenantGuardRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  authTestsPassed: boolean;
  authTypecheckPassed: boolean;
  authProviderSelected: boolean;
  providerLoginLogoutWired: boolean;
  secureDashboardCookiesConfigured: boolean;
  mobileTokenStorageConfigured: boolean;
  serverTenantMembershipPersistenceConfigured: boolean;
  routeMiddlewareAdaptersConfigured: boolean;
  dashboardRoutesIntegrated: boolean;
  mobileApiRoutesIntegrated: boolean;
  sensitiveServerRoutesIntegrated: boolean;
  fieldAuthorizationIntegratedInRoutes: boolean;
  sessionRevocationPersistenceConfigured: boolean;
  csrfTokenBindingConfigured: boolean;
  auditLogWritesConfigured: boolean;
  providerBackedRouteTestsPassed: boolean;
  crossTenantIntegrationTestsPassed: boolean;
}

export interface AuthSessionTenantGuardRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof authSessionTenantGuardRuntimeRequiredCommands;
  requiredEvidence: readonly AuthSessionTenantGuardRuntimeRequiredEvidence[];
  requiredControls: typeof authSessionTenantGuardRuntimeRequiredControls;
  blockers: readonly string[];
}

export interface ProviderSessionStoreReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  providerSelected: boolean;
  providerEnvConfigured: boolean;
  loginCallbackWired: boolean;
  logoutCallbackWired: boolean;
  sessionCallbackWired: boolean;
  userProvisioningConfigured: boolean;
  tenantMembershipLookupPersisted: boolean;
  customRoleLookupPersisted: boolean;
  databaseSessionStoreConfigured: boolean;
  sessionRevocationPersisted: boolean;
  secureDashboardCookiesConfigured: boolean;
  mobileTokenStorageConfigured: boolean;
  auditLogWritesConfigured: boolean;
  providerBackedTestsPassed: boolean;
  crossTenantSmokeTestsPassed: boolean;
  commandEvidenceCaptured: boolean;
}

export interface ProviderSessionStoreReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof providerSessionStoreRequiredCommands;
  requiredEvidence: readonly ProviderSessionStoreRequiredEvidence[];
  requiredControls: typeof providerSessionStoreRequiredControls;
  blockers: readonly string[];
}

export type DashboardSurfaceKind = "page" | "api" | "server_action";
export type DashboardSurfaceMode = "static_demo" | "read_only_api" | "mutation_api" | "provider_action";

export interface DashboardSurfaceRequirement {
  id: string;
  path: string;
  kind: DashboardSurfaceKind;
  mode: DashboardSurfaceMode;
  requiredPermission: Permission;
  hasAuthGuard: boolean;
  hasTenantScope: boolean;
  hasAuditLog: boolean;
  hasPersistence: boolean;
  hasTestCoverage: boolean;
}

export interface DashboardReadinessInput {
  surfaces: readonly DashboardSurfaceRequirement[];
  packageScripts: Readonly<Record<string, string>>;
  buildVerified: boolean;
  typecheckVerified: boolean;
  e2eVerified: boolean;
  providerActionsConfigured: boolean;
  seededDataAvailable: boolean;
}

export interface DashboardReadinessPlan {
  status: "ready" | "blocked";
  surfaceCount: number;
  staticSurfaceCount: number;
  mutationSurfaceCount: number;
  unguardedSurfaces: readonly string[];
  unscopedSurfaces: readonly string[];
  unauditedMutations: readonly string[];
  unpersistedSurfaces: readonly string[];
  untestedSurfaces: readonly string[];
  requiredCommands: typeof dashboardReadinessRequiredCommands;
  requiredControls: typeof dashboardReadinessRequiredControls;
  blockers: readonly string[];
}

export interface DashboardLaunchEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  dashboardUnitTestsPassed: boolean;
  dashboardPlaywrightSmokePassed: boolean;
  seededTenantDataAvailable: boolean;
  providerBackedAuthConfigured: boolean;
  tenantScopedApisImplemented: boolean;
  prismaRepositoriesImplemented: boolean;
  realMutationsEnabled: boolean;
  mutationAuditLogsPersisted: boolean;
  providerActionsImplemented: boolean;
  rbacDenialTestsPassed: boolean;
  crossTenantDenialTestsPassed: boolean;
  fieldRedactionVerified: boolean;
  loadingEmptyErrorStatesVerified: boolean;
  ciEvidenceCaptured: boolean;
  dashboardArtifactsSecretSafe: boolean;
}

export interface DashboardLaunchEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof dashboardLaunchEvidenceRequiredCommands;
  requiredEvidence: readonly DashboardLaunchEvidenceRequiredEvidence[];
  requiredControls: typeof dashboardLaunchEvidenceRequiredControls;
  blockers: readonly string[];
}

export function buildSessionPersistencePlan(input: SessionPersistencePlanInput): SessionPersistencePlan {
  const blockers: string[] = [];
  if (!input.authProviderConfigured) blockers.push("Auth provider must be selected and configured before provider-backed login/logout is ready.");
  if (!input.databaseSessionStoreConfigured) blockers.push("Database session/member lookup must resolve tenant membership server-side.");
  if (!input.secureCookieConfigured) blockers.push("Dashboard session cookies must be HttpOnly, Secure, SameSite, rotating, and CSRF-bound.");
  if (!input.mobileSecureStoreConfigured) blockers.push("Mobile refresh tokens must be stored in secure device storage behind biometric gates when required.");
  if (!input.revocationStoreConfigured) blockers.push("Session revocation persistence must be checked before every sensitive route decision.");
  if (!input.auditLogConfigured) blockers.push("Auth decisions, denials, revocations, tenant switches, and provider callbacks must write audit logs.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    blockers,
    requiredTables: ["User", "TenantMember", "CustomRole", "AuditLog"],
    requiredRuntimeControls: [
      "server-side tenant membership resolution",
      "route-level permission guard",
      "field-level authorization/redaction",
      "CSRF-bound mutating API routes",
      "secure mobile refresh token storage",
      "session revocation check",
    ],
    auditEvents: ["auth.login", "auth.logout", "auth.refresh", "auth.revoked", "authz.allowed", "authz.denied", "tenant.switch"],
  };
}

export const domainAuthorizationRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "dashboard middleware route-guard contract tests",
  "dashboard/API role matrix route tests",
  "cross-tenant denial route tests",
  "authorization audit persistence integration tests",
] as const;

export const domainAuthorizationRuntimeRequiredControls = [
  "Resolve provider-backed session, TenantMember, and CustomRole rows server-side before authorization.",
  "Combine built-in role permissions with active tenant-scoped custom grants only.",
  "Reject invalid permission strings, inactive custom roles, cross-tenant custom roles, expired sessions, revoked sessions, and tenant mismatches.",
  "Authorize dashboard pages, API routes, and server/provider actions before data loading or mutation.",
  "Bind CSRF validation to cookie-authenticated mutating routes.",
  "Persist redacted authorization audit rows for allow and deny decisions.",
  "Apply field-level redaction for private client, medical, payment, consent, and system fields.",
] as const;

export function buildDomainAuthorizationRuntimeReadinessPlan(input: DomainAuthorizationRuntimeReadinessInput): DomainAuthorizationRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.packageTestsPassed) blockers.push("Auth package permission and route-guard tests must pass.");
  if (!input.packageTypecheckPassed) blockers.push("Auth package typecheck must pass in the installed workspace.");
  if (!input.customRolesLoadedFromDatabase) blockers.push("CustomRole rows must be loaded from the database before runtime authorization decisions.");
  if (!input.middlewareUsesRouteGuard) blockers.push("Dashboard/API middleware must call evaluateApiRouteGuard or evaluateDashboardRouteGuard.");
  if (!input.dashboardRoutesGuarded) blockers.push("Dashboard pages must enforce route-level permission guards.");
  if (!input.apiRoutesGuarded) blockers.push("Dashboard and public API routes with tenant data must enforce route-level permission guards.");
  if (!input.serverActionsGuarded) blockers.push("Server actions and provider actions must enforce route-level permission guards.");
  if (!input.fieldRedactionApplied) blockers.push("Sensitive dashboard/API fields must use evaluateFieldAuthorization before serialization.");
  if (!input.authorizationAuditPersisted) blockers.push("Authorization allow/deny decisions must persist AuditLog rows with tenant, actor, route, and permission metadata.");
  if (!input.tenantMismatchTestsPassed) blockers.push("Route tests must prove cross-tenant sessions are denied.");
  if (!input.roleMatrixRouteTestsPassed) blockers.push("Route tests must cover owner, artist, assistant, studio manager, admin, and custom roles.");
  if (!input.csrfSessionBindingVerified) blockers.push("Cookie-authenticated mutating routes must verify CSRF tokens bound to the active session.");
  if (!input.sessionRevocationChecked) blockers.push("Route authorization must check session revocation before allowing sensitive actions.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: domainAuthorizationRuntimeRequiredCommands,
    requiredControls: domainAuthorizationRuntimeRequiredControls,
    blockers,
  };
}

export const authSessionTenantGuardRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "provider-backed login/logout integration tests",
  "dashboard/mobile/API route guard integration tests",
  "cross-tenant denial integration tests",
  "CSRF-bound mutating route tests",
  "auth audit-log persistence tests",
] as const;

export const authSessionTenantGuardRuntimeRequiredControls = [
  "Resolve provider-backed user, session, TenantMember, and CustomRole rows server-side before authorization.",
  "Use secure dashboard cookies and secure mobile token storage with logout/revocation clearing.",
  "Authorize dashboard pages, mobile APIs, public APIs, server actions, and provider actions before data loading or mutation.",
  "Bind CSRF tokens to cookie-authenticated mutating route sessions.",
  "Apply field-level authorization/redaction before serializing private client, medical, payment, consent, and system fields.",
  "Persist redacted AuditLog rows for login, logout, refresh, revocation, tenant switches, provider callbacks, and allow/deny decisions.",
] as const;

export const authSessionTenantGuardRuntimeRequiredEvidence = [
  "auth provider selection, login/logout callback, and provider-backed route test evidence",
  "secure cookie, mobile token storage, revocation, and CSRF binding evidence",
  "server tenant membership persistence and route middleware integration evidence",
  "field authorization, audit-log write, and cross-tenant integration evidence",
] as const;

export type AuthSessionTenantGuardRuntimeRequiredEvidence = (typeof authSessionTenantGuardRuntimeRequiredEvidence)[number];

export function buildAuthSessionTenantGuardRuntimeReadinessPlan(input: AuthSessionTenantGuardRuntimeReadinessInput): AuthSessionTenantGuardRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: AuthSessionTenantGuardRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.authTestsPassed) blockers.push("@inkroute/auth authorization, guard, and session readiness tests must pass.");
  if (!input.authTypecheckPassed) blockers.push("@inkroute/auth typecheck must pass in the installed workspace.");
  if (!input.authProviderSelected) blockers.push("Production auth provider must be selected and configured.");
  if (!input.providerLoginLogoutWired) blockers.push("Provider-backed login/logout callbacks must be wired.");
  if (!input.secureDashboardCookiesConfigured) blockers.push("Dashboard sessions must use secure HttpOnly SameSite cookies with rotation.");
  if (!input.mobileTokenStorageConfigured) blockers.push("Mobile refresh/access token storage must use secure device storage and logout clearing.");
  if (!input.serverTenantMembershipPersistenceConfigured) blockers.push("TenantMember/session lookups must be persisted and resolved server-side.");
  if (!input.routeMiddlewareAdaptersConfigured) blockers.push("Dashboard, mobile API, public API, and server-action middleware adapters must call auth guard helpers.");
  if (!input.dashboardRoutesIntegrated) blockers.push("Dashboard pages and API routes must integrate tenant/session guards before data loading or mutation.");
  if (!input.mobileApiRoutesIntegrated) blockers.push("Mobile API routes must integrate tenant/session guards before returning tenant data.");
  if (!input.sensitiveServerRoutesIntegrated) blockers.push("Sensitive server routes and provider actions must integrate tenant/session guards.");
  if (!input.fieldAuthorizationIntegratedInRoutes) blockers.push("Real routes must apply field-level authorization/redaction before serialization.");
  if (!input.sessionRevocationPersistenceConfigured) blockers.push("Session revocation persistence must be checked before every sensitive route decision.");
  if (!input.csrfTokenBindingConfigured) blockers.push("Cookie-authenticated mutating routes must bind CSRF tokens to the active session.");
  if (!input.auditLogWritesConfigured) blockers.push("Auth decisions, provider callbacks, denials, tenant switches, and revocations must persist AuditLog rows.");
  if (!input.providerBackedRouteTestsPassed) blockers.push("Provider-backed login/logout and guarded route integration tests must pass.");
  if (!input.crossTenantIntegrationTestsPassed) blockers.push("Cross-tenant route integration tests must prove tenant isolation.");

  if (!input.authProviderSelected || !input.providerLoginLogoutWired || !input.providerBackedRouteTestsPassed) {
    requiredEvidence.push(authSessionTenantGuardRuntimeRequiredEvidence[0]);
  }
  if (!input.secureDashboardCookiesConfigured || !input.mobileTokenStorageConfigured || !input.sessionRevocationPersistenceConfigured || !input.csrfTokenBindingConfigured) {
    requiredEvidence.push(authSessionTenantGuardRuntimeRequiredEvidence[1]);
  }
  if (!input.serverTenantMembershipPersistenceConfigured || !input.routeMiddlewareAdaptersConfigured || !input.dashboardRoutesIntegrated || !input.mobileApiRoutesIntegrated || !input.sensitiveServerRoutesIntegrated) {
    requiredEvidence.push(authSessionTenantGuardRuntimeRequiredEvidence[2]);
  }
  if (!input.fieldAuthorizationIntegratedInRoutes || !input.auditLogWritesConfigured || !input.crossTenantIntegrationTestsPassed) {
    requiredEvidence.push(authSessionTenantGuardRuntimeRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: authSessionTenantGuardRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === authSessionTenantGuardRuntimeRequiredEvidence.length
        ? authSessionTenantGuardRuntimeRequiredEvidence
        : requiredEvidence,
    requiredControls: authSessionTenantGuardRuntimeRequiredControls,
    blockers,
  };
}

export interface DomainAuthorizationRouteEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  authTestsPassed: boolean;
  authTypecheckPassed: boolean;
  customRolesLoadedFromDatabase: boolean;
  dashboardMiddlewareUsesRouteGuard: boolean;
  apiMiddlewareUsesRouteGuard: boolean;
  serverActionsUseRouteGuard: boolean;
  routeRoleMatrixTestsPassed: boolean;
  customRoleRouteTestsPassed: boolean;
  crossTenantDenialTestsPassed: boolean;
  fieldRedactionRouteTestsPassed: boolean;
  authorizationAuditRowsPersisted: boolean;
  csrfSessionBindingTestsPassed: boolean;
  sessionRevocationTestsPassed: boolean;
  providerBackedSessionTestsPassed: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface DomainAuthorizationRouteEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof domainAuthorizationRouteRequiredCommands;
  requiredEvidence: readonly DomainAuthorizationRouteRequiredEvidence[];
  requiredControls: typeof domainAuthorizationRouteRequiredControls;
  blockers: readonly string[];
}

export const domainAuthorizationRouteRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "dashboard middleware route-guard contract tests",
  "dashboard/API/server-action role matrix tests",
  "CustomRole database loading route tests",
  "cross-tenant route denial tests",
  "field redaction route serialization tests",
  "authorization AuditLog persistence tests",
  "CSRF-bound mutating route tests",
  "session revocation route tests",
  "GitHub Actions domain authorization evidence job",
] as const;

export const domainAuthorizationRouteRequiredControls = [
  "Resolve provider-backed session, TenantMember, and CustomRole rows server-side before route authorization.",
  "Apply route guards before dashboard/API/server-action data loading or mutation side effects.",
  "Reject invalid permissions, inactive roles, cross-tenant roles, tenant mismatches, revoked sessions, and CSRF mismatches.",
  "Persist redacted AuditLog rows for allow and deny decisions.",
  "Apply field authorization before serializing private client, medical, payment, consent, and system data.",
] as const;

export const domainAuthorizationRouteRequiredEvidence = [
  "auth package test/typecheck and provider-backed session evidence",
  "database CustomRole loading and dashboard/API/server-action route-guard adoption evidence",
  "built-in role matrix, custom-role, and cross-tenant route denial evidence",
  "field redaction and authorization AuditLog persistence evidence",
  "CSRF session binding and session revocation route evidence",
  "CI domain authorization route evidence and secret-safe artifact proof",
] as const;

export type DomainAuthorizationRouteRequiredEvidence = (typeof domainAuthorizationRouteRequiredEvidence)[number];

export function buildDomainAuthorizationRouteEvidencePlan(
  input: DomainAuthorizationRouteEvidenceInput,
): DomainAuthorizationRouteEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DomainAuthorizationRouteRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.authTestsPassed) blockers.push("@inkroute/auth tests must pass before domain authorization route evidence is ready.");
  if (!input.authTypecheckPassed) blockers.push("@inkroute/auth typecheck must pass before domain authorization route evidence is ready.");
  if (!input.customRolesLoadedFromDatabase) blockers.push("CustomRole rows must be loaded from tenant-scoped database storage in guarded route tests.");
  if (!input.dashboardMiddlewareUsesRouteGuard) blockers.push("Dashboard middleware must use domain route-guard primitives.");
  if (!input.apiMiddlewareUsesRouteGuard) blockers.push("API middleware/routes must use domain route-guard primitives.");
  if (!input.serverActionsUseRouteGuard) blockers.push("Server/provider actions must use domain route-guard primitives.");
  if (!input.routeRoleMatrixTestsPassed) blockers.push("Route role-matrix tests must pass for owner, artist, assistant, studio manager, admin, and base denials.");
  if (!input.customRoleRouteTestsPassed) blockers.push("Custom-role route tests must pass for tenant grants, invalid permissions, inactive roles, and cross-tenant ignores.");
  if (!input.crossTenantDenialTestsPassed) blockers.push("Cross-tenant dashboard/API/server-action denial tests must pass.");
  if (!input.fieldRedactionRouteTestsPassed) blockers.push("Field authorization/redaction route tests must pass before serialization.");
  if (!input.authorizationAuditRowsPersisted) blockers.push("Authorization allow/deny route decisions must persist redacted AuditLog rows.");
  if (!input.csrfSessionBindingTestsPassed) blockers.push("Cookie-authenticated mutating route tests must prove CSRF tokens bind to the active session.");
  if (!input.sessionRevocationTestsPassed) blockers.push("Guarded route tests must prove revoked sessions are denied.");
  if (!input.providerBackedSessionTestsPassed) blockers.push("Provider-backed session tests must pass for guarded route context.");
  if (!input.ciEvidenceCaptured) blockers.push("Domain authorization route CI evidence must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Authorization route artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.authTestsPassed || !input.authTypecheckPassed || !input.providerBackedSessionTestsPassed) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[0]);
  }
  if (!input.customRolesLoadedFromDatabase || !input.dashboardMiddlewareUsesRouteGuard || !input.apiMiddlewareUsesRouteGuard || !input.serverActionsUseRouteGuard) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[1]);
  }
  if (!input.routeRoleMatrixTestsPassed || !input.customRoleRouteTestsPassed || !input.crossTenantDenialTestsPassed) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[2]);
  }
  if (!input.fieldRedactionRouteTestsPassed || !input.authorizationAuditRowsPersisted) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[3]);
  }
  if (!input.csrfSessionBindingTestsPassed || !input.sessionRevocationTestsPassed) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[4]);
  }
  if (!input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(domainAuthorizationRouteRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: domainAuthorizationRouteRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === domainAuthorizationRouteRequiredEvidence.length
        ? domainAuthorizationRouteRequiredEvidence
        : requiredEvidence,
    requiredControls: domainAuthorizationRouteRequiredControls,
    blockers,
  };
}

export interface DashboardAuthGuardEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  authTestsPassed: boolean;
  authTypecheckPassed: boolean;
  dashboardTypecheckPassed: boolean;
  dashboardBuildPassed: boolean;
  authProviderSessionsConfigured: boolean;
  dashboardMiddlewareEnforcesGuard: boolean;
  protectedLayoutEnforcesGuard: boolean;
  dashboardApiHelpersEnforceGuard: boolean;
  tenantMembershipDbLookupConfigured: boolean;
  customRoleDbLookupConfigured: boolean;
  unauthorizedStatesImplemented: boolean;
  authAuditLogsPersisted: boolean;
  browserLoginLogoutPassed: boolean;
  browserTenantSwitchPassed: boolean;
  browserCrossTenantDenialPassed: boolean;
  noStoreCacheVerified: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface DashboardAuthGuardEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof dashboardAuthGuardRequiredCommands;
  requiredControls: typeof dashboardAuthGuardRequiredControls;
  requiredEvidence: readonly DashboardAuthGuardRequiredEvidence[];
  blockers: readonly string[];
}

export const dashboardAuthGuardRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard middleware auth guard tests",
  "dashboard protected layout auth guard tests",
  "dashboard API auth guard tests",
  "browser dashboard login/logout smoke",
  "browser dashboard tenant-switch smoke",
  "browser dashboard cross-tenant denial smoke",
  "auth AuditLog persistence tests",
  "GitHub Actions dashboard auth guard evidence job",
] as const;

export const dashboardAuthGuardRequiredControls = [
  "Resolve provider-backed session, TenantMember, and CustomRole rows server-side before rendering protected dashboard data.",
  "Apply middleware, protected layout, and API helper guards before private reads or mutations.",
  "Redirect unauthenticated users to login and tenant mismatches to tenant switch without leaking private data.",
  "Deny expired, revoked, cross-tenant, and insufficient-permission sessions with redacted audit rows.",
  "Set no-store cache policy on protected dashboard responses.",
  "Redact secrets, session tokens, client PII, medical notes, and payment data from evidence artifacts.",
] as const;

export const dashboardAuthGuardRequiredEvidence = [
  "provider-backed session plus TenantMember/CustomRole database lookup evidence",
  "dashboard middleware, protected layout, and API helper guard adoption evidence",
  "unauthorized state, redacted AuditLog, and no-store cache evidence",
  "browser login/logout, tenant-switch, and cross-tenant denial evidence",
  "dashboard typecheck/build, CI, and secret-safe artifact evidence",
] as const;

export type DashboardAuthGuardRequiredEvidence = (typeof dashboardAuthGuardRequiredEvidence)[number];

export function buildDashboardAuthGuardEvidencePlan(
  input: DashboardAuthGuardEvidenceInput,
): DashboardAuthGuardEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DashboardAuthGuardRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.authTestsPassed) blockers.push("@inkroute/auth tests must pass before dashboard auth guard evidence can close.");
  if (!input.authTypecheckPassed) blockers.push("@inkroute/auth typecheck must pass before dashboard auth guard evidence can close.");
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass with dashboard auth guard wiring.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass with protected layout and middleware wiring.");
  if (!input.authProviderSessionsConfigured) blockers.push("Real auth provider sessions must be configured for dashboard guard tests.");
  if (!input.dashboardMiddlewareEnforcesGuard) blockers.push("Dashboard middleware must enforce auth and tenant guard decisions before route rendering.");
  if (!input.protectedLayoutEnforcesGuard) blockers.push("Protected dashboard layout must enforce guard decisions before private data loading.");
  if (!input.dashboardApiHelpersEnforceGuard) blockers.push("Dashboard API helpers must enforce guard decisions before private data reads or mutations.");
  if (!input.tenantMembershipDbLookupConfigured) blockers.push("Tenant membership lookup must come from persisted database/provider-backed server state.");
  if (!input.customRoleDbLookupConfigured) blockers.push("Custom role lookup must come from tenant-scoped database state.");
  if (!input.unauthorizedStatesImplemented) blockers.push("Dashboard unauthorized, login redirect, tenant-switch, expired-session, and denied-permission state evidence must be captured before auth guard readiness.");
  if (!input.authAuditLogsPersisted) blockers.push("Dashboard auth allow/deny/login/logout/tenant-switch decisions must persist redacted AuditLog rows.");
  if (!input.browserLoginLogoutPassed) blockers.push("Browser login/logout evidence must pass for protected dashboard routes.");
  if (!input.browserTenantSwitchPassed) blockers.push("Browser tenant-switch evidence must pass for authorized tenant changes.");
  if (!input.browserCrossTenantDenialPassed) blockers.push("Browser cross-tenant denial evidence must prove private tenant data is not exposed.");
  if (!input.noStoreCacheVerified) blockers.push("Protected dashboard responses must preserve no-store cache policy.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for dashboard auth guard runtime must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Dashboard auth guard artifacts must be redacted and free of secrets, session tokens, raw PII, medical, and payment data.");

  if (!input.authProviderSessionsConfigured || !input.tenantMembershipDbLookupConfigured || !input.customRoleDbLookupConfigured) {
    requiredEvidence.push(dashboardAuthGuardRequiredEvidence[0]);
  }
  if (!input.dashboardMiddlewareEnforcesGuard || !input.protectedLayoutEnforcesGuard || !input.dashboardApiHelpersEnforceGuard) {
    requiredEvidence.push(dashboardAuthGuardRequiredEvidence[1]);
  }
  if (!input.unauthorizedStatesImplemented || !input.authAuditLogsPersisted || !input.noStoreCacheVerified) {
    requiredEvidence.push(dashboardAuthGuardRequiredEvidence[2]);
  }
  if (!input.browserLoginLogoutPassed || !input.browserTenantSwitchPassed || !input.browserCrossTenantDenialPassed) {
    requiredEvidence.push(dashboardAuthGuardRequiredEvidence[3]);
  }
  if (!input.dashboardTypecheckPassed || !input.dashboardBuildPassed || !input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push(dashboardAuthGuardRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: dashboardAuthGuardRequiredCommands,
    requiredControls: dashboardAuthGuardRequiredControls,
    requiredEvidence:
      requiredEvidence.length === dashboardAuthGuardRequiredEvidence.length
        ? dashboardAuthGuardRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export const providerSessionStoreRequiredCommands = [
  "pnpm --filter @inkroute/auth typecheck",
  "pnpm --filter @inkroute/auth test",
  "configure selected provider env and callbacks with redacted evidence",
  "provider-backed login callback test",
  "provider-backed logout callback test",
  "provider-backed session callback and TenantMember lookup test",
  "persist User, TenantMember, CustomRole, session, and revocation lookups",
  "verify secure dashboard cookies and mobile token storage/revocation",
  "write redacted AuditLog rows for auth lifecycle and denials",
  "dashboard/API tenant isolation smoke tests",
  "mobile session storage/revocation smoke tests",
] as const;

export const providerSessionStoreRequiredControls = [
  "Map provider identity to application User records without trusting client headers.",
  "Resolve TenantMember and CustomRole rows server-side for every guarded request.",
  "Persist active sessions and revocations before route authorization.",
  "Use secure dashboard cookies and secure mobile token storage with logout/revocation clearing.",
  "Write redacted AuditLog rows for auth lifecycle and authorization decisions.",
  "Deny cross-tenant provider sessions in dashboard, API, and mobile surfaces.",
] as const;

export const providerSessionStoreRequiredEvidence = [
  "provider selection, redacted environment/callback configuration, and login/logout/session callback evidence",
  "provider identity mapping plus persisted user, TenantMember, CustomRole, and session lookup evidence",
  "revocation, secure dashboard cookie, and mobile secure-token storage evidence",
  "audit-log, provider-backed auth test, cross-tenant smoke, and command-output evidence",
] as const;

export type ProviderSessionStoreRequiredEvidence = (typeof providerSessionStoreRequiredEvidence)[number];

export const dashboardReadinessRequiredCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/dashboard test",
  "pnpm test:e2e --project=dashboard-chromium",
] as const;

export const dashboardReadinessRequiredControls = [
  "Resolve provider-backed session and tenant membership before rendering dashboard data.",
  "Authorize every dashboard page, API route, and server action with the required permission.",
  "Execute state-changing actions inside tenant-scoped transactions with AuditLog writes.",
  "Redact or deny sensitive fields by role before serializing dashboard payloads.",
  "Run seeded-data Playwright smoke tests and cross-tenant denial tests before launch.",
] as const;

export const dashboardLaunchEvidenceRequiredCommands = [
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/dashboard test",
  "pnpm test:e2e --project=dashboard-chromium",
  "dashboard provider-backed auth smoke tests",
  "dashboard RBAC and cross-tenant denial tests",
  "dashboard mutation AuditLog persistence tests",
  "GitHub Actions dashboard launch evidence job",
] as const;

export const dashboardLaunchEvidenceRequiredControls = [
  "Resolve provider-backed session and tenant membership before every dashboard data load.",
  "Load dashboard data through tenant-scoped repositories or authenticated APIs.",
  "Execute mutations in tenant-scoped transactions with AuditLog rows.",
  "Enforce RBAC and cross-tenant denial for pages, APIs, server actions, and provider actions.",
  "Redact private client, medical, payment, consent, and system fields before serialization.",
  "Capture secret-safe build, smoke, and CI artifacts for launch closeout.",
] as const;

export const dashboardLaunchEvidenceRequiredEvidence = [
  "dashboard typecheck, build, unit/contract, and Playwright smoke output",
  "seeded tenant data, provider-backed auth, and tenant-scoped API evidence",
  "Prisma repository, real mutation, and AuditLog persistence evidence",
  "provider action, RBAC denial, cross-tenant denial, and field-redaction evidence",
  "loading/empty/error state, CI, and secret-safe artifact evidence",
] as const;

export type DashboardLaunchEvidenceRequiredEvidence = (typeof dashboardLaunchEvidenceRequiredEvidence)[number];

export function buildProviderSessionStoreReadinessPlan(
  input: ProviderSessionStoreReadinessInput,
): ProviderSessionStoreReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: ProviderSessionStoreRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/auth package script is missing ${script}.`);
  if (!input.providerSelected) blockers.push("Auth provider must be selected before provider-backed sessions can be claimed.");
  if (!input.providerEnvConfigured) blockers.push("Auth provider environment variables and callback URLs must be configured without committing secrets.");
  if (!input.loginCallbackWired) blockers.push("Provider login callback must create or resolve the application user.");
  if (!input.logoutCallbackWired) blockers.push("Provider logout callback must clear server and client session state.");
  if (!input.sessionCallbackWired) blockers.push("Provider session callback must attach tenant-scoped membership and role context server-side.");
  if (!input.userProvisioningConfigured) blockers.push("Provider user provisioning must map provider identities to application users.");
  if (!input.tenantMembershipLookupPersisted) blockers.push("TenantMember lookup must come from the database or provider-backed server store.");
  if (!input.customRoleLookupPersisted) blockers.push("CustomRole grants must be loaded from persistent tenant-scoped storage.");
  if (!input.databaseSessionStoreConfigured) blockers.push("Database-backed session store must persist active session metadata.");
  if (!input.sessionRevocationPersisted) blockers.push("Session revocation must persist and be checked before guarded route access.");
  if (!input.secureDashboardCookiesConfigured) blockers.push("Dashboard session cookies must be HttpOnly, Secure, SameSite, rotating, and CSRF-bound.");
  if (!input.mobileTokenStorageConfigured) blockers.push("Mobile auth tokens must be stored in secure device storage and cleared on logout/revocation.");
  if (!input.auditLogWritesConfigured) blockers.push("Login, logout, callback, denial, tenant switch, and revocation events must write AuditLog rows.");
  if (!input.providerBackedTestsPassed) blockers.push("Provider-backed login/logout/session callback tests must pass.");
  if (!input.crossTenantSmokeTestsPassed) blockers.push("Tenant isolation smoke tests must deny cross-tenant provider sessions.");
  if (!input.commandEvidenceCaptured) blockers.push("Command and smoke-test evidence must be captured before GAP-003 can close.");

  if (!input.providerSelected || !input.providerEnvConfigured || !input.loginCallbackWired || !input.logoutCallbackWired || !input.sessionCallbackWired) {
    requiredEvidence.push(providerSessionStoreRequiredEvidence[0]);
  }
  if (!input.userProvisioningConfigured || !input.tenantMembershipLookupPersisted || !input.customRoleLookupPersisted || !input.databaseSessionStoreConfigured) {
    requiredEvidence.push(providerSessionStoreRequiredEvidence[1]);
  }
  if (!input.sessionRevocationPersisted || !input.secureDashboardCookiesConfigured || !input.mobileTokenStorageConfigured) {
    requiredEvidence.push(providerSessionStoreRequiredEvidence[2]);
  }
  if (!input.auditLogWritesConfigured || !input.providerBackedTestsPassed || !input.crossTenantSmokeTestsPassed || !input.commandEvidenceCaptured) {
    requiredEvidence.push(providerSessionStoreRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: providerSessionStoreRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === providerSessionStoreRequiredEvidence.length
        ? providerSessionStoreRequiredEvidence
        : requiredEvidence,
    requiredControls: providerSessionStoreRequiredControls,
    blockers,
  };
}

export function buildDashboardReadinessPlan(input: DashboardReadinessInput): DashboardReadinessPlan {
  const blockers: string[] = [];
  const mutationSurfaces = input.surfaces.filter((surface) => surface.mode === "mutation_api" || surface.mode === "provider_action");
  const unguardedSurfaces = input.surfaces.filter((surface) => !surface.hasAuthGuard).map((surface) => surface.id).sort();
  const unscopedSurfaces = input.surfaces.filter((surface) => !surface.hasTenantScope).map((surface) => surface.id).sort();
  const unauditedMutations = mutationSurfaces.filter((surface) => !surface.hasAuditLog).map((surface) => surface.id).sort();
  const unpersistedSurfaces = input.surfaces.filter((surface) => surface.mode !== "static_demo" && !surface.hasPersistence).map((surface) => surface.id).sort();
  const untestedSurfaces = input.surfaces.filter((surface) => !surface.hasTestCoverage).map((surface) => surface.id).sort();

  for (const script of ["typecheck", "build", "test"]) {
    if (!input.packageScripts[script]) {
      blockers.push(`@inkroute/dashboard package script is missing ${script}.`);
    }
  }
  if (!input.typecheckVerified) blockers.push("Dashboard typecheck command has not been verified in the installed workspace.");
  if (!input.buildVerified) blockers.push("Dashboard Next.js build has not been verified in the installed workspace.");
  if (!input.e2eVerified) blockers.push("Dashboard Playwright smoke tests have not been verified with seeded tenant data.");
  if (!input.seededDataAvailable) blockers.push("Dashboard has no verified seeded tenant data source for smoke and mutation tests.");
  if (!input.providerActionsConfigured && mutationSurfaces.some((surface) => surface.mode === "provider_action")) {
    blockers.push("Dashboard provider actions are still static/demo gated and cannot execute production provider calls.");
  }
  if (unguardedSurfaces.length > 0) blockers.push("Every dashboard page/API/server action must enforce an auth guard.");
  if (unscopedSurfaces.length > 0) blockers.push("Every dashboard surface must resolve tenant scope server-side.");
  if (unauditedMutations.length > 0) blockers.push("Every dashboard mutation/provider action must write an AuditLog row.");
  if (unpersistedSurfaces.length > 0) blockers.push("Read and mutation dashboard surfaces need tenant-scoped persistence instead of demo state.");
  if (untestedSurfaces.length > 0) blockers.push("Every dashboard surface needs smoke, route, or contract test coverage.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    surfaceCount: input.surfaces.length,
    staticSurfaceCount: input.surfaces.filter((surface) => surface.mode === "static_demo").length,
    mutationSurfaceCount: mutationSurfaces.length,
    unguardedSurfaces,
    unscopedSurfaces,
    unauditedMutations,
    unpersistedSurfaces,
    untestedSurfaces,
    requiredCommands: dashboardReadinessRequiredCommands,
    requiredControls: dashboardReadinessRequiredControls,
    blockers,
  };
}

export function buildDashboardLaunchEvidencePlan(input: DashboardLaunchEvidenceInput): DashboardLaunchEvidencePlan {
  const requiredScripts = ["typecheck", "build", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DashboardLaunchEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/dashboard package script is missing ${script}.`);
  if (!input.dashboardTypecheckPassed) blockers.push("@inkroute/dashboard typecheck must pass.");
  if (!input.dashboardBuildPassed) blockers.push("@inkroute/dashboard build must pass.");
  if (!input.dashboardUnitTestsPassed) blockers.push("Dashboard unit/contract tests must pass.");
  if (!input.dashboardPlaywrightSmokePassed) blockers.push("Dashboard Playwright smoke tests must pass with seeded tenant data.");
  if (!input.seededTenantDataAvailable) blockers.push("Seeded tenant data must be available for dashboard smoke and mutation tests.");
  if (!input.providerBackedAuthConfigured) blockers.push("Dashboard must use provider-backed auth/session state.");
  if (!input.tenantScopedApisImplemented) blockers.push("Dashboard pages and APIs must load data through tenant-scoped authenticated APIs.");
  if (!input.prismaRepositoriesImplemented) blockers.push("Dashboard data surfaces must use Prisma repositories or server services instead of demo state.");
  if (!input.realMutationsEnabled) blockers.push("Dashboard state-changing actions must be implemented beyond static/demo gates.");
  if (!input.mutationAuditLogsPersisted) blockers.push("Every dashboard mutation/provider action must persist AuditLog rows.");
  if (!input.providerActionsImplemented) blockers.push("Dashboard provider actions must be implemented or explicitly blocked with audit evidence.");
  if (!input.rbacDenialTestsPassed) blockers.push("RBAC denial tests must pass for dashboard pages, APIs, and actions.");
  if (!input.crossTenantDenialTestsPassed) blockers.push("Cross-tenant dashboard access and mutation denial tests must pass.");
  if (!input.fieldRedactionVerified) blockers.push("Dashboard field-level redaction must be verified for private client, medical, payment, consent, and system fields.");
  if (!input.loadingEmptyErrorStatesVerified) blockers.push("Dashboard loading, empty, and error states must be verified for launch-critical surfaces.");
  if (!input.ciEvidenceCaptured) blockers.push("CI evidence for dashboard launch gates must be captured.");
  if (!input.dashboardArtifactsSecretSafe) blockers.push("Dashboard test/build artifacts must be redacted and free of secrets or client-private data.");

  if (!input.dashboardTypecheckPassed || !input.dashboardBuildPassed || !input.dashboardUnitTestsPassed || !input.dashboardPlaywrightSmokePassed) {
    requiredEvidence.push(dashboardLaunchEvidenceRequiredEvidence[0]);
  }
  if (!input.seededTenantDataAvailable || !input.providerBackedAuthConfigured || !input.tenantScopedApisImplemented) {
    requiredEvidence.push(dashboardLaunchEvidenceRequiredEvidence[1]);
  }
  if (!input.prismaRepositoriesImplemented || !input.realMutationsEnabled || !input.mutationAuditLogsPersisted) {
    requiredEvidence.push(dashboardLaunchEvidenceRequiredEvidence[2]);
  }
  if (!input.providerActionsImplemented || !input.rbacDenialTestsPassed || !input.crossTenantDenialTestsPassed || !input.fieldRedactionVerified) {
    requiredEvidence.push(dashboardLaunchEvidenceRequiredEvidence[3]);
  }
  if (!input.loadingEmptyErrorStatesVerified || !input.ciEvidenceCaptured || !input.dashboardArtifactsSecretSafe) {
    requiredEvidence.push(dashboardLaunchEvidenceRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: dashboardLaunchEvidenceRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === dashboardLaunchEvidenceRequiredEvidence.length
        ? dashboardLaunchEvidenceRequiredEvidence
        : requiredEvidence,
    requiredControls: dashboardLaunchEvidenceRequiredControls,
    blockers,
  };
}
