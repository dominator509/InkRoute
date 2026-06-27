import { hasPermission } from "@inkroute/auth";
import { prisma } from "@inkroute/db";
import type { Permission, Role } from "@inkroute/types";
import type { DashboardActorContext, DashboardMembershipLookupMetadata } from "./dashboardAuth";

type TenantMemberRecord = {
  id: string;
  role: Role;
  status: string;
  customRoleId: string | null;
};

type TenantMemberLookupClient = {
  tenantMember: {
    findUnique: (params: {
      where: { tenantId_userId: { tenantId: string; userId: string } };
      select: { id: true; role: true; status: true; customRoleId: true };
    }) => Promise<TenantMemberRecord | null>;
  };
};

export async function resolveDashboardTenantMembership(
  context: DashboardActorContext,
  client: TenantMemberLookupClient = prisma as unknown as TenantMemberLookupClient,
): Promise<DashboardMembershipLookupMetadata> {
  if (context.source === "local-fallback") {
    return {
      tenantId: context.tenantId,
      actorUserId: context.actorUserId,
      actorRole: context.role,
      source: "local-fallback",
      status: "local-fallback",
      membershipId: null,
      customRoleId: null,
      requiredNextStep: null,
    };
  }

  const membership = await client.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: context.tenantId, userId: context.actorUserId } },
    select: { id: true, role: true, status: true, customRoleId: true },
  });

  if (!membership || membership.status !== "active") {
    throw new Error("FORBIDDEN");
  }

  return {
    tenantId: context.tenantId,
    actorUserId: context.actorUserId,
    actorRole: membership.role,
    source: "database-tenant-member",
    status: "active",
    membershipId: membership.id,
    customRoleId: membership.customRoleId,
    requiredNextStep: null,
  };
}

export async function assertPermissionWithTenantMembership(
  context: DashboardActorContext,
  permission: Permission,
  client: TenantMemberLookupClient = prisma as unknown as TenantMemberLookupClient,
): Promise<DashboardMembershipLookupMetadata> {
  const membershipLookup = await resolveDashboardTenantMembership(context, client);
  if (!hasPermission(membershipLookup.actorRole, permission)) {
    throw new Error("FORBIDDEN");
  }
  return membershipLookup;
}
