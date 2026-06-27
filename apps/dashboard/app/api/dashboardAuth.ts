import { evaluateApiRouteGuard, hasPermission, type TenantAccessContext } from "@inkroute/auth";
import { inkrouteDemoTenant } from "@inkroute/config";
import type { Permission, Role } from "@inkroute/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FALLBACK_ACTOR_ID = "dashboard-demo-user";
const allowedRoles: ReadonlyArray<Role> = ["owner", "artist", "assistant", "studio_manager", "admin"];
const fallbackRole = "assistant";
const dashboardRouteMethodPermissionWrite: Record<string, Permission> = {
  bookings: "booking:write",
  appointments: "booking:write",
  clients: "client:write",
  payments: "payment:write",
  portfolio: "portfolio:write",
  travel: "travel:write",
  availability: "travel:write",
  messages: "message:write",
  templates: "form:write",
  calendar: "calendar:write",
  reviews: "review:write",
  seo: "seo:write",
  releases: "release:write",
  errors: "tenant:write",
  forms: "form:write",
  trust: "tenant:write",
};

const dashboardRouteMethodPermissionRead: Record<string, Permission> = {
  bookings: "booking:read",
  appointments: "booking:read",
  clients: "client:read",
  payments: "payment:read",
  portfolio: "portfolio:read",
  travel: "travel:read",
  availability: "travel:read",
  messages: "message:read",
  templates: "form:read",
  calendar: "calendar:read",
  reviews: "review:read",
  seo: "seo:read",
  releases: "release:read",
  errors: "tenant:read",
  forms: "form:read",
  trust: "tenant:read",
  settings: "settings:write",
};

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeDashboardRouteSegment(pathname: string): string {
  const segments = pathname
    .split("?")[0]
    .split("#")[0]
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  if (segments[0] === "dashboard") {
    return segments[1] ?? "";
  }

  return segments[0] ?? "";
}

export function resolveDashboardPermissionForRoute(pathname: string, method?: string): Permission {
  const segment = normalizeDashboardRouteSegment(pathname);
  const mutating = Boolean(method && mutatingMethods.has(method.toUpperCase()));

  if (mutating && segment) {
    return dashboardRouteMethodPermissionWrite[segment] ?? "tenant:write";
  }

  return dashboardRouteMethodPermissionRead[segment] ?? "tenant:read";
}

function normalizeHeaderValue(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export interface DashboardActorContext {
  tenantId: string;
  actorUserId: string;
  role: Role;
  source: "header" | "local-fallback";
}

export interface DashboardMembershipLookupMetadata {
  tenantId: string;
  actorUserId: string;
  actorRole: Role;
  source: "database-tenant-member" | "local-fallback";
  status: "active" | "local-fallback";
  membershipId: string | null;
  customRoleId: string | null;
  requiredNextStep: string | null;
}

export type DashboardAuthGuardDecisionStatus =
  | "allowed"
  | "unauthenticated"
  | "session_expired"
  | "session_revoked"
  | "tenant_mismatch"
  | "permission_denied";

export interface DashboardAuthGuardAuditLogWrite {
  tenantId: string;
  actorUserId: string | null;
  action: string;
  entityType: "DashboardAuthGuardRun";
  entityId: string;
  metadata: {
    routePath: string;
    method: string;
    permission: Permission;
    guardAction: string;
    decisionStatus: DashboardAuthGuardDecisionStatus;
    actorSource: DashboardActorContext["source"];
    actorRole: Role;
    persistedTenantMemberRequired: true;
    persistedCustomRoleRequired: true;
    providerBackedSessionRequired: true;
    redacted: true;
  };
}

export interface DashboardAuthGuardRunRecord {
  tenantId: string;
  actorUserId: string;
  routePath: string;
  method: string;
  permission: Permission;
  guardAction: string;
  decisionStatus: DashboardAuthGuardDecisionStatus;
  auditLog: DashboardAuthGuardAuditLogWrite;
}

export interface DashboardAuthGuardAuditSink {
  create(data: DashboardAuthGuardAuditLogWrite): Promise<unknown>;
}

function normalizeRole(value: string | null): Role {
  const normalizedRole = normalizeHeaderValue(value)?.toLowerCase();
  if (!normalizedRole) {
    return fallbackRole;
  }
  if (allowedRoles.includes(normalizedRole as Role)) {
    return normalizedRole as Role;
  }
  return fallbackRole;
}

function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function resolveDashboardActor(request: NextRequest): DashboardActorContext {
  const tenantId = normalizeHeaderValue(
    request.headers.get("x-tenant-id") ??
      request.headers.get("x-dashboard-tenant-id") ??
      request.headers.get("x-demo-tenant-id"),
  );

  const actorUserId = normalizeHeaderValue(
    request.headers.get("x-user-id") ?? request.headers.get("x-dashboard-user-id") ?? FALLBACK_ACTOR_ID,
  );
  const role = normalizeRole(request.headers.get("x-user-role") ?? request.headers.get("x-dashboard-role"));

  if (tenantId) {
    return {
      tenantId,
      actorUserId,
      role,
      source: "header",
    };
  }

  if (isProductionEnv()) {
    throw new Error("AUTH_REQUIRED");
  }

  return {
    tenantId: inkrouteDemoTenant.id,
    actorUserId,
    role,
    source: "local-fallback",
  };
}

export function getLocalDashboardActor(): DashboardActorContext {
  if (isProductionEnv()) {
    throw new Error("AUTH_REQUIRED");
  }

  return {
    tenantId: inkrouteDemoTenant.id,
    actorUserId: FALLBACK_ACTOR_ID,
    role: fallbackRole,
    source: "local-fallback",
  };
}

export function toTenantAccessContext(context: DashboardActorContext): TenantAccessContext {
  return {
    tenantId: context.tenantId,
    userId: context.actorUserId,
    role: context.role,
    sessionId: `${context.source}:${context.actorUserId}:${context.tenantId}`,
  };
}

export function assertPermission(context: DashboardActorContext, permission: Permission): void {
  if (!hasPermission(context.role, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function evaluateDashboardApiGuard(request: NextRequest, permission: Permission, routePath = request.nextUrl.pathname) {
  const actor = resolveDashboardActor(request);
  const method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" =
    request.method === "GET" ||
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "PATCH" ||
    request.method === "DELETE"
      ? request.method
      : "GET";
  const guard = evaluateApiRouteGuard({
    context: toTenantAccessContext(actor),
    tenantId: actor.tenantId,
    permission,
    method,
    routePath,
    now: new Date().toISOString(),
  });

  return { actor, guard, authRunRecord: buildDashboardAuthGuardRunRecord({ actor, guard, permission, routePath, method }) };
}

export function buildDashboardAuthGuardRunRecord(input: {
  actor: DashboardActorContext;
  guard: ReturnType<typeof evaluateApiRouteGuard>;
  permission: Permission;
  routePath: string;
  method: string;
}): DashboardAuthGuardRunRecord {
  const method = input.method.toUpperCase();
  const decisionStatus = input.guard.decision.status;

  return {
    tenantId: input.actor.tenantId,
    actorUserId: input.actor.actorUserId,
    routePath: input.routePath,
    method,
    permission: input.permission,
    guardAction: input.guard.auditAction,
    decisionStatus,
    auditLog: {
      tenantId: input.actor.tenantId,
      actorUserId: input.actor.actorUserId,
      action: input.guard.auditAction,
      entityType: "DashboardAuthGuardRun",
      entityId: `${method}:${input.routePath}`,
      metadata: {
        routePath: input.routePath,
        method,
        permission: input.permission,
        guardAction: input.guard.auditAction,
        decisionStatus,
        actorSource: input.actor.source,
        actorRole: input.actor.role,
        persistedTenantMemberRequired: true,
        persistedCustomRoleRequired: true,
        providerBackedSessionRequired: true,
        redacted: true,
      },
    },
  };
}

export async function persistDashboardAuthGuardRun(
  sink: DashboardAuthGuardAuditSink,
  record: DashboardAuthGuardRunRecord,
): Promise<DashboardAuthGuardRunRecord> {
  await sink.create(record.auditLog);
  return record;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export function dashboardApiGuardFailureResponse(error: unknown, routePath: string) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHENTICATED", routePath } },
      { status: 401, headers: noStoreHeaders },
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", routePath } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  return undefined;
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  if (!(error instanceof Error)) return false;

  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}
