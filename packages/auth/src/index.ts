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
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
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
  const requiredEvidence: string[] = [];

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

  if (!input.authProviderConfigured || !input.providerLoginLogoutTested) requiredEvidence.push("provider-backed mobile login/logout test output");
  if (!input.expoSecureStoreConfigured || !input.secureTokenStorageVerified) {
    requiredEvidence.push("Expo SecureStore token persistence/clearing evidence with no plaintext token storage");
  }
  if (!input.biometricUnlockConfigured || !input.biometricDeviceTested) requiredEvidence.push("biometric unlock simulator/device evidence");
  if (!input.refreshTokenRecoveryTested || !input.logoutClearsLocalStateTested || !input.revokedSessionClearsLocalStateTested) {
    requiredEvidence.push("refresh, logout, and revoked-session clearing test output");
  }
  if (!input.tenantMembershipLookupConfigured || !input.roleResolutionConfigured || !input.crossTenantDenialTested) {
    requiredEvidence.push("tenant membership, role resolution, and cross-tenant denial test output");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "Expo iOS/Android auth smoke tests",
      "Expo device biometric unlock test",
    ],
    requiredEvidence,
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
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
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
  requiredCommands: readonly string[];
  requiredControls: readonly string[];
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
    requiredCommands: [
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "dashboard middleware route-guard contract tests",
      "dashboard/API role matrix route tests",
      "cross-tenant denial route tests",
      "authorization audit persistence integration tests",
    ],
    requiredControls: [
      "Resolve provider-backed session, TenantMember, and CustomRole rows server-side before authorization.",
      "Combine built-in role permissions with active tenant-scoped custom grants only.",
      "Reject invalid permission strings, inactive custom roles, cross-tenant custom roles, expired sessions, revoked sessions, and tenant mismatches.",
      "Authorize dashboard pages, API routes, and server/provider actions before data loading or mutation.",
      "Bind CSRF validation to cookie-authenticated mutating routes.",
      "Persist redacted authorization audit rows for allow and deny decisions.",
      "Apply field-level redaction for private client, medical, payment, consent, and system fields.",
    ],
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
    requiredCommands: [
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/dashboard test",
      "pnpm test:e2e --project=dashboard-chromium",
    ],
    requiredControls: [
      "Resolve provider-backed session and tenant membership before rendering dashboard data.",
      "Authorize every dashboard page, API route, and server action with the required permission.",
      "Execute state-changing actions inside tenant-scoped transactions with AuditLog writes.",
      "Redact or deny sensitive fields by role before serializing dashboard payloads.",
      "Run seeded-data Playwright smoke tests and cross-tenant denial tests before launch.",
    ],
    blockers,
  };
}
