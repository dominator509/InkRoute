import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(join(process.cwd(), "apps/dashboard/middleware.ts"), "utf8");

describe("dashboard auth middleware contract", () => {
  it("applies the shared dashboard route guard before protected routes continue", () => {
    expect(middlewareSource).toContain("const guardedPathPattern");
    expect(middlewareSource).toContain("guardedPathPattern.test(path)");
    expect(middlewareSource).toContain("resolveDashboardActor(request)");
    expect(middlewareSource).toContain("evaluateDashboardRouteGuard");
    expect(middlewareSource).toContain("toTenantAccessContext(actor)");
    expect(middlewareSource).toContain('permission: "booking:read"');
  });

  it("preserves login and tenant-switch redirects with no-store auth guard headers", () => {
    expect(middlewareSource).toContain('guard.action === "redirect_login" || guard.action === "redirect_tenant_switch"');
    expect(middlewareSource).toContain('guard.redirectTo ?? "/login"');
    expect(middlewareSource).toContain('new URL(`/login?next=${encodeURIComponent(path)}`, request.url)');
    expect(middlewareSource).toContain('response.headers.set("Cache-Control", "no-store")');
    expect(middlewareSource).toContain('response.headers.set("x-inkroute-dashboard-auth-guard"');
  });

  it("rejects cookie-authenticated dashboard mutations with CSRF before protected route auth handling", () => {
    const csrfIndex = middlewareSource.indexOf("const csrf = csrfTokenIsValid(request)");
    const guardIndex = middlewareSource.indexOf("resolveDashboardActor(request)");

    expect(csrfIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(csrfIndex);
    expect(middlewareSource).toContain("cookieAuthenticatedMutation && !csrf.valid");
    expect(middlewareSource).toContain('code: "CSRF_TOKEN_REQUIRED"');
    expect(middlewareSource).toContain("headers: noStoreHeaders");
  });
});
