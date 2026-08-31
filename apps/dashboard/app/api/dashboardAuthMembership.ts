import { hasPermission } from "@inkroute/auth";
import { prisma } from "@inkroute/db";
import type { Permission, Role } from "@inkroute/types";
import { createHash } from "node:crypto";
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

function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

function hashDashboardMembershipSelector(value: string | null): string | null {
  return value ? createHash("sha256").update(value).digest("hex") : null;
}

export async function resolveDashboardTenantMembership(
  context: DashboardActorContext,
  client: TenantMemberLookupClient = prisma as unknown as TenantMemberLookupClient,
): Promise<DashboardMembershipLookupMetadata> {
  if (context.source === "local-fallback") {
    if (isProductionEnv()) {
      throw new Error("AUTH_REQUIRED");
    }

    return {
      tenantId: context.tenantId,
      tenantIdHash: hashDashboardMembershipSelector(context.tenantId) ?? "",
      rawTenantIdEchoed: false,
      actorUserId: context.actorUserId,
      actorUserIdHash: hashDashboardMembershipSelector(context.actorUserId) ?? "",
      rawActorUserIdEchoed: false,
      actorRole: context.role,
      source: "local-fallback",
      status: "local-fallback",
      membershipId: null,
      membershipIdHash: null,
      rawMembershipIdEchoed: false,
      customRoleId: null,
      customRoleIdHash: null,
      rawCustomRoleIdEchoed: false,
      requiredNextStep: "production requires provider-backed session plus persisted TenantMember lookup",
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
    tenantIdHash: hashDashboardMembershipSelector(context.tenantId) ?? "",
    rawTenantIdEchoed: false,
    actorUserId: context.actorUserId,
    actorUserIdHash: hashDashboardMembershipSelector(context.actorUserId) ?? "",
    rawActorUserIdEchoed: false,
    actorRole: membership.role,
    source: "database-tenant-member",
    status: "active",
    membershipId: membership.id,
    membershipIdHash: hashDashboardMembershipSelector(membership.id),
    rawMembershipIdEchoed: false,
    customRoleId: membership.customRoleId,
    customRoleIdHash: hashDashboardMembershipSelector(membership.customRoleId),
    rawCustomRoleIdEchoed: false,
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
