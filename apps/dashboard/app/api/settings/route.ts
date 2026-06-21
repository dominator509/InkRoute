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

function optionalSettingString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function settingsMutationBody(value: unknown) {
  const body = typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    tenantId: optionalSettingString(body.tenantId, 160),
    publicSiteName: optionalSettingString(body.publicSiteName, 160),
    primaryLocale: optionalSettingString(body.primaryLocale, 32),
    defaultTimezone: optionalSettingString(body.defaultTimezone, 120),
    idempotencyKey: optionalSettingString(body.idempotencyKey, 180),
  };
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "tenant:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read tenant settings." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query settings for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard settings reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-003", "GAP-007", "GAP-037", "GAP-040"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

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
      { headers: noStoreHeaders },
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
      return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Tenant settings were not found." } }, { status: 404, headers: noStoreHeaders });
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
      { headers: noStoreHeaders },
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
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SETTINGS_READ_FAILED", message: "Tenant settings could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "tenant:write");
    assertPermission(actor, "settings:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to update tenant settings." } }, { status: 403, headers: noStoreHeaders });
  }

  const body = settingsMutationBody(await request.json().catch(() => ({})));
  const tenantId = body.tenantId ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot update settings for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const update = {
    ...(body.publicSiteName ? { publicSiteName: body.publicSiteName } : {}),
    ...(body.primaryLocale ? { primaryLocale: body.primaryLocale } : {}),
    ...(body.defaultTimezone ? { defaultTimezone: body.defaultTimezone } : {}),
  };

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "At least one safe tenant setting is required." } }, { status: 400, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_SETTINGS_PERSISTENCE_NOT_CONFIGURED",
            message: "Production settings writes require DB-backed actor resolution, tenant-scoped persistence, idempotency, and audit logs; local fallback setting plans are disabled.",
            gapIds: ["GAP-007", "GAP-038", "GAP-040"],
          },
          productionBoundary: { localSettingsWriteFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "dry-run",
        action: "update_settings",
        update,
        boundary: "Local fallback returns a settings mutation contract with validated safe profile metadata; database mode is required to commit settings writes.",
        gapIds: ["GAP-007", "GAP-038", "GAP-040"],
      },
      { status: 202, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: update,
        select: { id: true, publicSiteName: true, primaryLocale: true, defaultTimezone: true, updatedAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "settings:update",
          entityType: "Tenant",
          entityId: tenant.id,
          metadata: {
            source: "dashboard-api",
            dashboardMutationAction: "update_settings",
            idempotencyKey: request.headers.get("idempotency-key") ?? body.idempotencyKey ?? null,
            updatedFields: Object.keys(update),
            rejectedFields: ["providerSecrets", "credentials", "legalPolicyCopy", "memberInvites", "customRoles"],
            rawSecretsStored: false,
          },
        },
        select: { id: true },
      });

      return { tenant, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        action: "update_settings",
        tenant: {
          id: result.tenant.id,
          publicSiteName: result.tenant.publicSiteName,
          primaryLocale: result.tenant.primaryLocale,
          defaultTimezone: result.tenant.defaultTimezone,
          updatedAt: result.tenant.updatedAt.toISOString(),
        },
        auditId: result.audit.id,
        boundary: "Settings writes are limited to safe tenant profile metadata; provider secrets, member invites, custom roles, and legal policy copy remain gated.",
        gapIds: ["GAP-007", "GAP-038", "GAP-040"],
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Settings writes require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "SETTINGS_WRITE_FAILED", message: "Tenant settings could not be updated." } }, { status: 500, headers: noStoreHeaders });
  }
}
