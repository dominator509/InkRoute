import { evaluateDashboardRouteGuard } from "@inkroute/auth";
import { buildSecurityRuntimeEnforcementPlan } from "@inkroute/security";
import { NextResponse, type NextRequest } from "next/server";
import { resolveDashboardActor, toTenantAccessContext } from "./app/api/dashboardAuth";

type RuntimeEnvironment = "development" | "preview" | "production";

const guardedPathPattern = /^\/(bookings|clients|payments|portfolio|travel|messages|templates|settings|calendar|reviews|seo)(\/|$)/;
const noStoreHeaders = { "Cache-Control": "no-store" } as const;
const csrfCookieName = "inkroute_dashboard_csrf";
const csrfHeaderName = "x-csrf-token";
const sessionCookieNames = [
  "inkroute_dashboard_session",
  "__Secure-inkroute_dashboard_session",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const providerConnectSources = ["https://sentry.io", "https://api.stripe.com"];

function runtimeEnvironment(): RuntimeEnvironment {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function requestUsesHttps(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

function hasSessionCookie(request: NextRequest): boolean {
  return sessionCookieNames.some((name) => request.cookies.has(name));
}

function csrfTokenIsValid(request: NextRequest): { present: boolean; valid: boolean } {
  const headerToken = request.headers.get(csrfHeaderName);
  const cookieToken = request.cookies.get(csrfCookieName)?.value;
  const present = Boolean(headerToken);
  return {
    present,
    valid: present && Boolean(cookieToken) && headerToken === cookieToken,
  };
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const csrf = csrfTokenIsValid(request);
  const plan = buildSecurityRuntimeEnforcementPlan({
    environment: runtimeEnvironment(),
    httpsEnabled: requestUsesHttps(request),
    appSurface: "dashboard",
    extraConnectSources: providerConnectSources,
    cookieAuthenticatedMutation: mutatingMethods.has(request.method) && hasSessionCookie(request),
    method: mutatingMethods.has(request.method) ? (request.method as "POST" | "PUT" | "PATCH" | "DELETE") : "GET",
    csrfTokenPresent: csrf.present,
    csrfTokenValid: csrf.valid,
    sameSiteCookie: hasSessionCookie(request) ? "lax" : "missing",
  });

  for (const header of plan.headers) {
    response.headers.set(header.name, header.value);
  }
  response.headers.set("X-InkRoute-Security-Runtime", plan.status);

  return response;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const csrf = csrfTokenIsValid(request);
  const cookieAuthenticatedMutation = mutatingMethods.has(request.method) && hasSessionCookie(request);

  if (cookieAuthenticatedMutation && !csrf.valid) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: "CSRF_TOKEN_REQUIRED",
            message: "Cookie-authenticated dashboard mutations require a valid CSRF token.",
          },
        },
        { status: 403, headers: noStoreHeaders },
      ),
      request,
    );
  }

  if (!guardedPathPattern.test(path)) {
    return applySecurityHeaders(NextResponse.next(), request);
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
      return applySecurityHeaders(response, request);
    }

    if (guard.action === "redirect_login" || guard.action === "redirect_tenant_switch") {
      const redirectUrl = new URL(guard.redirectTo ?? "/login", request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-inkroute-dashboard-auth-guard", guard.auditAction);
      return applySecurityHeaders(response, request);
    }

    return applySecurityHeaders(
      NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", reason: guard.reason, auditAction: guard.auditAction } },
        { status: 403, headers: noStoreHeaders },
      ),
      request,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      const response = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(path)}`, request.url));
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("x-inkroute-dashboard-auth-guard", "dashboard:auth-required");
      return applySecurityHeaders(response, request);
    }

    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
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
