import { rolePermissions } from "@inkroute/auth";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardFeatureFlags, dashboardShellContext } from "../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!local || !domain) return "[redacted-dashboard-field]";
  return `${local.slice(0, 1)}***@${domain}`;
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "tenant:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read tenant settings." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query settings for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        tenant: dashboardShellContext.tenant,
        rolePermissions,
        featureFlags: dashboardFeatureFlags,
        gapIds: ["GAP-003", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Local fallback returns demo tenant settings only; database mode is required for live settings reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          publicSiteName: true,
          primaryLocale: true,
          defaultTimezone: true,
          updatedAt: true,
          domains: {
            orderBy: [{ isPrimary: "desc" }, { hostname: "asc" }],
            select: { id: true, hostname: true, status: true, isPrimary: true, verifiedAt: true },
          },
          members: {
            orderBy: [{ role: "asc" }, { updatedAt: "desc" }],
            select: {
              id: true,
              role: true,
              status: true,
              invitedEmail: true,
              invitedAt: true,
              joinedAt: true,
              user: { select: { id: true, email: true, name: true, status: true, lastLoginAt: true } },
              customRole: { select: { key: true, label: true } },
            },
          },
          customRoles: {
            orderBy: { key: "asc" },
            select: { id: true, key: true, label: true, permissions: true, description: true, updatedAt: true },
          },
          studios: {
            orderBy: { name: "asc" },
            select: { id: true, name: true, slug: true, city: true, region: true, country: true, timezone: true },
          },
          flags: {
            orderBy: { key: "asc" },
            select: { id: true, key: true, scope: true, enabled: true, description: true, updatedAt: true },
          },
        },
      });

      if (!tenant) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "settings:read",
          entityType: "Tenant",
          entityId: tenant.id,
          metadata: {
            source: "dashboard-api",
            memberCount: tenant.members.length,
            customRoleCount: tenant.customRoles.length,
            domainCount: tenant.domains.length,
            redactedFields: ["user.email", "invitedEmail", "verificationTokenHash", "studio.address"],
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, tenant, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Tenant settings were not found." } }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
          plan: result.tenant.plan,
          status: result.tenant.status,
          publicSiteName: result.tenant.publicSiteName,
          primaryLocale: result.tenant.primaryLocale,
          defaultTimezone: result.tenant.defaultTimezone,
          updatedAt: result.tenant.updatedAt.toISOString(),
        },
        domains: result.tenant.domains.map((domain) => ({
          id: domain.id,
          hostname: domain.hostname,
          status: domain.status,
          isPrimary: domain.isPrimary,
          verifiedAt: domain.verifiedAt?.toISOString() ?? null,
        })),
        members: result.tenant.members.map((member) => ({
          id: member.id,
          role: member.role,
          status: member.status,
          userId: member.user.id,
          name: member.user.name,
          email: redactEmail(member.user.email),
          invitedEmail: redactEmail(member.invitedEmail),
          userStatus: member.user.status,
          customRole: member.customRole,
          invitedAt: member.invitedAt?.toISOString() ?? null,
          joinedAt: member.joinedAt?.toISOString() ?? null,
          lastLoginAt: member.user.lastLoginAt?.toISOString() ?? null,
        })),
        customRoles: result.tenant.customRoles.map((role) => ({
          id: role.id,
          key: role.key,
          label: role.label,
          permissions: role.permissions,
          description: role.description,
          updatedAt: role.updatedAt.toISOString(),
        })),
        studios: result.tenant.studios.map((studio) => ({
          id: studio.id,
          name: studio.name,
          slug: studio.slug,
          city: studio.city,
          region: studio.region,
          country: studio.country,
          timezone: studio.timezone,
        })),
        featureFlags: result.tenant.flags.map((flag) => ({
          id: flag.id,
          key: flag.key,
          scope: flag.scope,
          enabled: flag.enabled,
          description: flag.description,
          updatedAt: flag.updatedAt.toISOString(),
        })),
        rolePermissions,
        auditId: result.audit.id,
        gapIds: ["GAP-003", "GAP-007", "GAP-037", "GAP-040"],
        boundary: "Dashboard settings reads are tenant-scoped, credential-safe, no-store, and audited; settings mutations and provider secret handling remain gated.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Settings reads require the dashboard database connection." },
          gapIds: ["GAP-003", "GAP-007", "GAP-037", "GAP-040"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SETTINGS_READ_FAILED", message: "Tenant settings could not be loaded." } }, { status: 500 });
  }
}
