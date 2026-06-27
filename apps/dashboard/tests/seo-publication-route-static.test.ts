import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/seo/page.tsx"), "utf8");
const actionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/SeoPublicationActionPanel.tsx"), "utf8");

describe("dashboard SEO publication route contract", () => {
  it("guards mutations with SEO write permission, tenant scope, and no-store responses", () => {
    expect(routeSource).toContain('assertPermission(actor, "seo:write")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
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

  it("persists idempotency, associations, and revalidation as dedicated database rows", () => {
    expect(routeSource).toContain("relatedFaqIds");
    expect(routeSource).toContain("relatedReviewIds");
    expect(routeSource).toContain("relatedImageIds");
    expect(routeSource).toContain("revalidation: plan.revalidation");
    expect(routeSource).toContain("tx.idempotencyKey.create");
    expect(routeSource).toContain("seoPublicationRevalidationJob.create");
    expect(routeSource).toContain("seoPublicationAssociation.createMany");
    expect(routeSource).toContain('associationPersistence: "database"');
    expect(routeSource).toContain('persistence: "dry-run"');
    expect(routeSource).toContain("SEO publication mutation contract with idempotency, revalidation, and audit metadata");
    expect(routeSource).not.toContain("SEO publication mutation plan only");
  });

  it("replaces the disabled SEO publishing placeholder with a gated route-backed action", () => {
    expect(pageSource).toContain("SeoPublicationActionPanel");
    expect(pageSource).toContain("Static heuristic checks plus routed publication evidence gates");
    expect(pageSource).not.toContain("Publishing actions remain disabled");
    expect(pageSource).not.toContain("Static heuristic checks only");
    expect(actionPanelSource).toContain('fetch("/api/seo"');
    expect(actionPanelSource).toContain('"idempotency-key"');
    expect(actionPanelSource).toContain('"SeoCityPage"');
    expect(actionPanelSource).toContain("Create city SEO draft");
  });
});
