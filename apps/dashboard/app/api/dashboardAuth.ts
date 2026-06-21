import { evaluateApiRouteGuard, hasPermission, type TenantAccessContext } from "@inkroute/auth";
import { inkrouteDemoTenant } from "@inkroute/config";
import type { Permission, Role } from "@inkroute/types";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FALLBACK_ACTOR_ID = "dashboard-demo-user";
const allowedRoles: ReadonlyArray<Role> = ["owner", "artist", "assistant", "studio_manager", "admin"];
const fallbackRole = "assistant";

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

  return { actor, guard };
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
