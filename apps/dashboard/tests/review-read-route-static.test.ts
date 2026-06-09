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
    expect(routeSource).toContain('"Cache-Control": "no-store"');
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

  it("keeps dashboard copy wired to the reviews API seam", () => {
    expect(homePageSource).toContain("Reviews now have a redacted tenant-scoped read API");
    expect(homePageSource).toContain("GET /api/reviews");
  });
});
