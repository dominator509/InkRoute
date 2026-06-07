import { hasPermission } from "@inkroute/auth";
import { inkrouteDemoTenant } from "@inkroute/config";
import type { Permission, Role } from "@inkroute/types";
import type { NextRequest } from "next/server";

const FALLBACK_ACTOR_ID = "dashboard-demo-user";
const allowedRoles: ReadonlyArray<Role> = ["owner", "artist", "assistant", "studio_manager", "admin"];

export interface DashboardActorContext {
  tenantId: string;
  actorUserId: string;
  role: Role;
  source: "header" | "local-fallback";
}

function normalizeRole(value: string | null): Role {
  if (allowedRoles.includes(value as Role)) {
    return value as Role;
  }
  return "owner";
}

function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function resolveDashboardActor(request: NextRequest): DashboardActorContext {
  const tenantId =
    request.headers.get("x-tenant-id") ??
    request.headers.get("x-dashboard-tenant-id") ??
    request.headers.get("x-demo-tenant-id");

  const actorUserId = request.headers.get("x-user-id") ?? request.headers.get("x-dashboard-user-id") ?? FALLBACK_ACTOR_ID;
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

export function assertPermission(context: DashboardActorContext, permission: Permission): void {
  if (!hasPermission(context.role, permission)) {
    throw new Error("FORBIDDEN");
  }
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