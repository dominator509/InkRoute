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
}

export function canAccessTenant(context: TenantAccessContext, tenantId: string): boolean {
  return context.tenantId === tenantId;
}
