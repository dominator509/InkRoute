import { evaluateDashboardRouteGuard } from "@inkroute/auth";
import { NextResponse, type NextRequest } from "next/server";
import { resolveDashboardActor, toTenantAccessContext } from "./app/api/dashboardAuth";

const guardedPathPattern = /^\/(bookings|clients|payments|portfolio|travel|messages|templates|settings|calendar|reviews|seo)(\/|$)/;

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!guardedPathPattern.test(path)) {
    return NextResponse.next();
  }

  try {
    const actor = resolveDashboardActor(request);
    const guard = evaluateDashboardRouteGuard({
      context: toTenantAccessContext(actor),
      tenantId: actor.tenantId,
      permission: "booking:read",
      routePath: path,
      now: new Date().toISOString(),
      loginPath: "/login",
      tenantSwitchPath: "/tenant-switcher",
    });

    if (guard.action === "allow") {
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-inkroute-dashboard-auth-guard", guard.auditAction);
      return response;
    }

    if (guard.action === "redirect_login" || guard.action === "redirect_tenant_switch") {
      const redirectUrl = new URL(guard.redirectTo ?? "/login", request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-inkroute-dashboard-auth-guard", guard.auditAction);
      return response;
    }

    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", reason: guard.reason, auditAction: guard.auditAction } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      const response = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-inkroute-dashboard-auth-guard", "dashboard:auth-required");
      return response;
    }

    throw error;
  }
}

export const config = {
  matcher: [
    "/bookings/:path*",
    "/clients/:path*",
    "/payments/:path*",
    "/portfolio/:path*",
    "/travel/:path*",
    "/messages/:path*",
    "/templates/:path*",
    "/settings/:path*",
    "/calendar/:path*",
    "/reviews/:path*",
    "/seo/:path*",
  ],
};
