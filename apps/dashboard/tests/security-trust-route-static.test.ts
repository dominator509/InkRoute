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
    expect(routeSource).toContain("function normalizeHeaderValue(value: string | null): string | null");
    expect(routeSource).toContain("const fallbackRole = \"viewer\";");
    expect(routeSource).toContain("TENANT_SCOPE_REQUIRED");
    expect(routeSource).toContain("ROLE_NOT_AUTHORIZED");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(routeSource).toContain("const normalizedRole = role.toLowerCase()");
  });

  it("returns security posture helper outputs without enabling production controls", () => {
    expect(routeSource).toContain("buildTrustCenterChecklist");
    expect(routeSource).toContain("summarizeSecurityPosture");
    expect(routeSource).toContain("buildTenantIsolationFixtures");
    expect(routeSource).toContain("buildSecurityHeaderPlan");
    expect(routeSource).toContain("csrfControlPlans");
    expect(routeSource).toContain("rateLimitRules");
    expect(routeSource).toContain("DASHBOARD_TRUST_STATUS_PROVIDER_AUTH_NOT_CONFIGURED");
    expect(routeSource).toContain("scaffoldedTrustPreviewDisabled");
    expect(routeSource).toContain("requiresProviderBackedSession");
    expect(routeSource).toContain("Production requires auth");
  });

  it("documents the no-store trust API boundary on the dashboard page", () => {
    expect(pageSource).toContain("Security hardening control plane");
    expect(pageSource).toContain('label="Local contracts"');
    expect(pageSource).toContain("redaction contract");
    expect(pageSource).toContain("fixture contract");
    expect(pageSource).toContain("no-store trust/privacy API boundaries");
    expect(pageSource).toContain("GET /api/security/trust-status");
    expect(pageSource).toContain("tenant and role gates");
    expect(pageSource).not.toContain("Security hardening scaffold");
    expect(pageSource).not.toContain("redaction scaffold");
    expect(pageSource).not.toContain("test scaffold");
  });
});
