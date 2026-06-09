import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/route.ts"), "utf8");
const seoPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/seo/page.tsx"), "utf8");

describe("dashboard SEO read route contract", () => {
  it("guards SEO reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "seo:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("loads tenant-scoped city/style/redirect SEO records and writes audit logs", () => {
    expect(routeSource).toContain("tx.seoCityPage.findMany");
    expect(routeSource).toContain("tx.seoStylePage.findMany");
    expect(routeSource).toContain("tx.seoRedirect.findMany");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "seo:read:list"');
    expect(routeSource).toContain('entityType: "Seo"');
  });

  it("keeps public SEO output safe and avoids leaking private portfolio records", () => {
    expect(routeSource).toContain("featuredPortfolio.filter((item) => item.isPublic)");
    expect(routeSource).toContain('indexMode: page.status === "published" ? "index" : "noindex"');
    expect(routeSource).toContain("jsonObject(page.faq)");
    expect(routeSource).toContain("jsonObject(page.internalLinks)");
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardSeoRouteRecords");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents that SEO reads are wired while publishing/provider actions remain gated", () => {
    expect(seoPageSource).toContain("Tenant-scoped SEO read APIs now exist");
    expect(seoPageSource).toContain("SEO reads now have authenticated tenant-scoped dashboard APIs");
    expect(seoPageSource).toContain("Search Console credentials");
  });
});
