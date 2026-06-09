import { NextResponse, type NextRequest } from "next/server";
import { buildSecurityRuntimeEnforcementPlan } from "@inkroute/security";
import { evaluatePublicCanonicalRequest } from "./lib/canonicalRuntime";

type RuntimeEnvironment = "development" | "preview" | "production";

const csrfCookieName = "inkroute_csrf";
const csrfHeaderName = "x-csrf-token";
const sessionCookieNames = [
  "inkroute_session",
  "__Secure-inkroute_session",
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

function applyCanonicalHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const canonical = evaluatePublicCanonicalRequest({
    host: request.headers.get("host") ?? request.nextUrl.host,
    path: request.nextUrl.pathname,
    protocol: requestUsesHttps(request) ? "https" : "http",
    method: request.method,
  });
  response.headers.set("X-InkRoute-Canonical-Host", canonical.policy.canonicalHost);
  response.headers.set("X-InkRoute-Canonical-Url", canonical.policy.canonicalUrl);
  if (canonical.shouldNoindex) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const csrf = csrfTokenIsValid(request);
  const plan = buildSecurityRuntimeEnforcementPlan({
    environment: runtimeEnvironment(),
    httpsEnabled: requestUsesHttps(request),
    appSurface: "web",
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

  return applyCanonicalHeaders(response, request);
}

export function middleware(request: NextRequest) {
  const canonical = evaluatePublicCanonicalRequest({
    host: request.headers.get("host") ?? request.nextUrl.host,
    path: request.nextUrl.pathname,
    protocol: requestUsesHttps(request) ? "https" : "http",
    method: request.method,
  });

  if (canonical.shouldRedirect) {
    const destination = new URL(canonical.destinationPath, `https://${canonical.policy.canonicalHost}`);
    return applySecurityHeaders(NextResponse.redirect(destination, canonical.statusCode), request);
  }
  const csrf = csrfTokenIsValid(request);
  const cookieAuthenticatedMutation = mutatingMethods.has(request.method) && hasSessionCookie(request);

  if (cookieAuthenticatedMutation && !csrf.valid) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: "CSRF_TOKEN_REQUIRED",
            message: "Cookie-authenticated mutations require a valid CSRF token.",
          },
        },
        { status: 403 },
      ),
      request,
    );
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};


