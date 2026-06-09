import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(join(process.cwd(), "apps/dashboard/middleware.ts"), "utf8");

describe("dashboard auth middleware contract", () => {
  it("requires a production session cookie before protected dashboard routes continue", () => {
    expect(middlewareSource).toContain('runtimeEnvironment() === "production"');
    expect(middlewareSource).toContain("!isDashboardAuthPublicPath(request.nextUrl.pathname)");
    expect(middlewareSource).toContain("!hasSessionCookie(request)");
    expect(middlewareSource).toContain("buildUnauthenticatedDashboardResponse(request)");
  });

  it("keeps login and tenant switch routes public while preserving next redirects", () => {
    expect(middlewareSource).toContain('const authPublicPathPrefixes = ["/login", "/tenant-switcher"]');
    expect(middlewareSource).toContain('loginUrl.pathname = "/login"');
    expect(middlewareSource).toContain('loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)');
  });

  it("rejects unauthenticated dashboard APIs with 401 before CSRF handling", () => {
    const authGateIndex = middlewareSource.indexOf("productionAuthRequired && !hasSessionCookie(request)");
    const csrfIndex = middlewareSource.indexOf("const csrf = csrfTokenIsValid(request)");

    expect(authGateIndex).toBeGreaterThan(-1);
    expect(csrfIndex).toBeGreaterThan(authGateIndex);
    expect(middlewareSource).toContain('code: "AUTH_REQUIRED"');
    expect(middlewareSource).toContain("{ status: 401 }");
  });
});
