import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/route.ts"), "utf8");

describe("dashboard SEO publication route contract", () => {
  it("guards mutations with SEO write permission, tenant scope, and no-store responses", () => {
    expect(routeSource).toContain('assertPermission(actor, "seo:write")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("uses the package publication planner before every commit", () => {
    expect(routeSource).toContain("buildSeoPublicationMutationPlan");
    expect(routeSource).toContain("if (!plan.canCommit)");
    expect(routeSource).toContain("plan.auditAction");
    expect(routeSource).toContain("plan.revalidation");
    expect(routeSource).toContain("plan.idempotencyKey");
  });

  it("persists city, style, redirect, and audit writes inside a Prisma transaction", () => {
    expect(routeSource).toContain("await prisma.$transaction(async (tx) =>");
    expect(routeSource).toContain("tx.seoCityPage.upsert");
    expect(routeSource).toContain("tx.seoStylePage.upsert");
    expect(routeSource).toContain("tx.seoRedirect.upsert");
    expect(routeSource).toContain("tx.auditLog.create");
  });

  it("keeps associations and revalidation explicit until dedicated stores exist", () => {
    expect(routeSource).toContain("relatedFaqIds");
    expect(routeSource).toContain("relatedReviewIds");
    expect(routeSource).toContain("relatedImageIds");
    expect(routeSource).toContain("revalidation: plan.revalidation");
    expect(routeSource).toContain('persistence: "dry-run"');
  });
});
