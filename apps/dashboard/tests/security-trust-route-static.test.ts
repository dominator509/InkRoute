import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/security/trust-status/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/trust/page.tsx"), "utf8");

describe("dashboard trust status route static contract", () => {
  it("keeps trust posture reads tenant- and role-scoped with no-store responses", () => {
    expect(routeSource).toContain("resolveDashboardReader");
    expect(routeSource).toContain('request.headers.get("x-tenant-id")');
    expect(routeSource).toContain("allowedReadRoles");
    expect(routeSource).toContain("TENANT_SCOPE_REQUIRED");
    expect(routeSource).toContain("ROLE_NOT_AUTHORIZED");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("returns security posture helper outputs without enabling production controls", () => {
    expect(routeSource).toContain("buildTrustCenterChecklist");
    expect(routeSource).toContain("summarizeSecurityPosture");
    expect(routeSource).toContain("buildTenantIsolationFixtures");
    expect(routeSource).toContain("buildSecurityHeaderPlan");
    expect(routeSource).toContain("csrfControlPlans");
    expect(routeSource).toContain("rateLimitRules");
    expect(routeSource).toContain("Production requires auth");
  });

  it("documents the no-store trust API boundary on the dashboard page", () => {
    expect(pageSource).toContain("no-store trust/privacy API boundaries");
    expect(pageSource).toContain("GET /api/security/trust-status");
    expect(pageSource).toContain("tenant and role gates");
  });
});
