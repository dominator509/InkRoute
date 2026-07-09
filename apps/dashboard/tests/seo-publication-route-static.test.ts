import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/route.ts"), "utf8");
const searchConsoleRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/search-console/route.ts"), "utf8");
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
    expect(routeSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("entityIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("idempotencyKeyIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).not.toContain("entityId: result.entityId");
    expect(routeSource).not.toContain("auditId: result.auditId");
    expect(routeSource).not.toContain("idempotencyId: result.idempotencyId");
    expect(routeSource).not.toContain("tenantId,\n          error:");
    expect(routeSource).not.toContain("tenantId,\n          plan:");
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
    expect(routeSource).toContain("revalidation: buildSafeSeoRevalidationResponse(plan)");
    expect(routeSource).toContain("plan: buildSafeSeoPublicationPlanResponse(plan)");
    expect(routeSource).toContain("rawActorIdEchoed: false");
    expect(routeSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(routeSource).toContain("rawWriteSummariesEchoed: false");
    expect(routeSource).toContain("rawRevalidationPathsEchoed: false");
    expect(routeSource).toContain("rawRoutePayloadEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).not.toContain("tenantId: plan.tenantId");
    expect(routeSource).toContain("rawIdempotencyKeyStored: false");
    expect(routeSource).toContain("rawWriteSummariesStored: false");
    expect(routeSource).toContain("rawRevalidationTagsStored: false");
    expect(routeSource).toContain("writePlanPersisted: true");
    expect(routeSource).toContain("writeCount: plan.writes.length");
    expect(routeSource).toContain("relatedFaqCount: stringArray(body.relatedFaqIds).length");
    expect(routeSource).toContain("relatedReviewCount: stringArray(body.relatedReviewIds).length");
    expect(routeSource).toContain("relatedImageCount: stringArray(body.relatedImageIds).length");
    expect(routeSource).toContain("revalidationTagCount: plan.revalidation.length");
    expect(routeSource).not.toMatch(/^\s+plan,\s*$/m);
    expect(routeSource).toContain("tx.idempotencyKey.create");
    expect(routeSource).toContain("seoPublicationRevalidationJob.create");
    expect(routeSource).toContain("seoPublicationAssociation.createMany");
    expect(routeSource).toContain("entityPersisted: true");
    expect(routeSource).toContain("entityPersisted: result.entityPersisted");
    expect(routeSource).toContain("result: { entityPersisted: true, auditLogged: true }");
    expect(routeSource).not.toContain("result: { entityId, auditId: audit.id }");
    expect(routeSource).not.toContain("return { duplicate: false as const, entityId, auditId: audit.id, idempotencyId: idempotency.id }");
    expect(routeSource).not.toContain("idempotencyId: existingIdempotency.id");
    expect(routeSource).not.toContain("idempotencyId: idempotency.id");
    expect(routeSource).not.toContain("idempotencyKey: plan.idempotencyKey");
    expect(routeSource).not.toContain("writes: plan.writes");
    expect(routeSource).not.toContain("revalidation: plan.revalidation");
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

  it("keeps Search Console operation responses tenant-scoped without raw IDs", () => {
    expect(searchConsoleRouteSource).toContain("buildSafeSearchConsolePlanResponse");
    expect(searchConsoleRouteSource).toContain("buildSearchConsoleResponseProjection");
    expect(searchConsoleRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(searchConsoleRouteSource).toContain("tenantIdEchoed: false");
    expect(searchConsoleRouteSource).toContain("auditIdEchoed: false");
    expect(searchConsoleRouteSource).toContain("auditLogged: Boolean(auditId)");
    expect(searchConsoleRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(searchConsoleRouteSource).toContain("rawProviderPayloadEchoed: false");
    expect(searchConsoleRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(searchConsoleRouteSource).not.toContain("tenantId: plan.tenantId");
    expect(searchConsoleRouteSource).not.toContain("auditId,");
    expect(searchConsoleRouteSource).not.toContain("tenantId,\n        error:");
    expect(searchConsoleRouteSource).not.toContain("tenantId,\n            error:");
  });
});
