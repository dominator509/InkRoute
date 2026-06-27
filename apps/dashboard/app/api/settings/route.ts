import { createHash } from "node:crypto";
import { rolePermissions } from "@inkroute/auth";
import { prisma } from "@inkroute/db";
import { dashboardTenantQuerySchema, tenantSettingsMutationSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { dashboardFeatureFlags, dashboardShellContext } from "../../../lib/demo";
import {
  evaluateDashboardApiGuard,
  isDatabaseUnavailable,
} from "../dashboardAuth";

export const runtime = "nodejs";

function redactEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!local || !domain) return "[redacted-dashboard-field]";
  return `${local.slice(0, 1)}***@${domain}`;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function hashSettingsSubject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function resultRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function resultString(value: unknown, key: string): string | null {
  const result = resultRecord(value);
  return typeof result?.[key] === "string" ? result[key] : null;
}

function settingsGuardFailureResponse(guard: ReturnType<typeof evaluateDashboardApiGuard>) {
  const safeReason = `${guard.status}:${guard.action}`;
  if (guard.action === "reject_401" || guard.action === "reject_419") {
    return NextResponse.json(
      { ok: false, error: { code: guard.status === "csrf_failed" ? "CSRF_TOKEN_REQUIRED" : "UNAUTHENTICATED", reason: safeReason } },
      { status: guard.statusCode, headers: noStoreHeaders },
    );
  }

  if (guard.action === "reject_409") {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", reason: safeReason } }, { status: 409, headers: noStoreHeaders });
  }

  return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", reason: safeReason } }, { status: 403, headers: noStoreHeaders });
}

export async function GET(request: NextRequest) {
  const { actor, guard } = evaluateDashboardApiGuard(request, "tenant:read", "/dashboard/settings");
  if (!guard.allowed) {
    return settingsGuardFailureResponse(guard);
  }
  try {
    const query = dashboardTenantQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_FAILED", message: "Settings query failed validation.", issues: query.error.flatten() } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const tenantId = query.data.tenantId ?? actor.tenantId;
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
  const routePath = new URL(request.url).pathname;
  const { actor, guard } = evaluateDashboardApiGuard(request, "settings:write", routePath);
  if (!guard.allowed) {
    return settingsGuardFailureResponse(guard);
  }

  try {
    const parsed = tenantSettingsMutationSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_FAILED", message: "Settings payload failed validation.", issues: parsed.error.flatten() } },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const body = parsed.data;
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
    const idempotencyKey =
      request.headers.get("idempotency-key") ??
      body.idempotencyKey ??
      `settings-update:${tenantId}:${hashSettingsSubject({ update })}`;
    const requestHash = hashSettingsSubject({ tenantId, update });

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
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-settings-update", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-settings-update",
          key: idempotencyKey,
          requestHash,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/settings",
            action: "update_settings",
            updatedFields: Object.keys(update),
            rawSecretsStored: false,
            rejectedFields: ["providerSecrets", "credentials", "legalPolicyCopy", "memberInvites", "customRoles"],
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/settings",
            action: "update_settings",
            updatedFields: Object.keys(update),
            replayObserved: true,
            rawSecretsStored: false,
            rejectedFields: ["providerSecrets", "credentials", "legalPolicyCopy", "memberInvites", "customRoles"],
          }),
        },
        select: { id: true, key: true, requestHash: true, status: true, result: true },
      });

      if (idempotency.requestHash !== requestHash) {
        return { status: "idempotency_conflict" as const, idempotency };
      }

      if (idempotency.status === "completed") {
        return {
          status: "replayed" as const,
          idempotency,
          tenant: {
            id: resultString(idempotency.result, "tenantId") ?? tenantId,
            publicSiteName: resultString(idempotency.result, "publicSiteName"),
            primaryLocale: resultString(idempotency.result, "primaryLocale"),
            defaultTimezone: resultString(idempotency.result, "defaultTimezone"),
            updatedAt: resultString(idempotency.result, "updatedAt") ?? new Date(0).toISOString(),
          },
          audit: { id: resultString(idempotency.result, "auditId") },
        };
      }

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
            idempotencyKey,
            idempotencyKeyId: idempotency.id,
            updatedFields: Object.keys(update),
            rejectedFields: ["providerSecrets", "credentials", "legalPolicyCopy", "memberInvites", "customRoles"],
            rawSecretsStored: false,
          },
        },
        select: { id: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-settings-update", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            tenantId: tenant.id,
            auditId: audit.id,
            updatedFields: Object.keys(update),
            publicSiteName: tenant.publicSiteName,
            primaryLocale: tenant.primaryLocale,
            defaultTimezone: tenant.defaultTimezone,
            updatedAt: tenant.updatedAt.toISOString(),
            rawSecretsStored: false,
            rejectedFields: ["providerSecrets", "credentials", "legalPolicyCopy", "memberInvites", "customRoles"],
          }),
        },
        select: { id: true },
      });

      return { status: "persisted" as const, tenant, audit, idempotency };
    });

    if (result.status === "idempotency_conflict") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different settings payload." },
          idempotencyKeyId: result.idempotency.id,
          gapIds: ["GAP-007", "GAP-038", "GAP-040"],
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

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
          updatedAt: typeof result.tenant.updatedAt === "string" ? result.tenant.updatedAt : result.tenant.updatedAt.toISOString(),
        },
        auditId: result.audit.id,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        boundary: "Settings writes are limited to idempotency-backed safe tenant profile metadata; provider secrets, member invites, custom roles, and legal policy copy remain gated.",
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
