import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/reviews/route.ts"), "utf8");
const homePageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/page.tsx"), "utf8");
const authSource = readFileSync(join(process.cwd(), "packages/auth/src/index.ts"), "utf8");
const typesSource = readFileSync(join(process.cwd(), "packages/types/src/index.ts"), "utf8");

describe("dashboard review read route contract", () => {
  it("adds explicit review permissions to the shared RBAC vocabulary", () => {
    expect(typesSource).toContain('"review:read"');
    expect(typesSource).toContain('"review:write"');
    expect(authSource).toContain('"review:read"');
    expect(authSource).toContain('"review:write"');
  });

  it("guards review reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "review:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("loads tenant-scoped reviews and writes read audit logs", () => {
    expect(routeSource).toContain("tx.review.findMany");
    expect(routeSource).toContain("where: {");
    expect(routeSource).toContain("tenantId");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "review:read:list"');
    expect(routeSource).toContain('entityType: "Review"');
    expect(routeSource).toContain("auditId: result.audit.id");
  });

  it("redacts review bodies and private client/booking references", () => {
    expect(routeSource).toContain("redactReviewBody");
    expect(routeSource).toContain('"body"');
    expect(routeSource).toContain('"clientId"');
    expect(routeSource).toContain('"bookingRequestId"');
    expect(routeSource).toContain("bodyPreview: redactReviewBody(review.body)");
    expect(routeSource).not.toContain("clientId: true");
    expect(routeSource).not.toContain("bookingRequestId: true");
  });

  it("disables local fallback review payloads in production", () => {
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
    expect(routeSource).toContain("localDashboardReadFallbackDisabled");
  });

  it("keeps dashboard copy wired to the reviews API seam", () => {
    expect(homePageSource).toContain("Phase 5 dashboard contract");
    expect(homePageSource).toContain("Guard contract wired");
    expect(homePageSource).toContain("Stripe contract wired; sandbox proof gated");
    expect(homePageSource).toContain("provider execution proof remains credential-gated");
    expect(homePageSource).toContain("Reviews now have a redacted tenant-scoped read API");
    expect(homePageSource).toContain("GET /api/reviews");
    expect(homePageSource).not.toContain("Phase 5 scaffolded dashboard");
    expect(homePageSource).not.toContain("Guard scaffold wired");
    expect(homePageSource).not.toContain("Stripe boundary only");
    expect(homePageSource).not.toContain("boundaries only");
  });
});
