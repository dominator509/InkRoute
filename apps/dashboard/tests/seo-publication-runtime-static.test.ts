import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  seoPublicationArtifactPaths,
  seoPublicationRuntimeCommands,
  seoPublicationRuntimeMatrix,
  seoPublicationRuntimeReadiness,
} from "../lib/seoPublicationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SEO publication runtime contract", () => {
  const seoSource = readRepoFile("packages/seo/src/index.ts");
  const routeSource = readRepoFile("apps/dashboard/app/api/seo/route.ts");
  const staticTest = readRepoFile("apps/dashboard/tests/seo-publication-route-static.test.ts");
  const readStaticTest = readRepoFile("apps/dashboard/tests/seo-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-071 commands, matrix rows, and artifacts", () => {
    expect(seoPublicationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm vitest run apps/dashboard/tests/seo-publication-route-static.test.ts",
      "SEO Prisma integration tests",
      "SEO tenant isolation tests",
      "dashboard SEO publish/edit/archive Playwright or route tests",
    ]);
    expect(seoPublicationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "dashboard-build",
      "static-contract",
      "city-prisma",
      "style-prisma",
      "redirect-prisma",
      "tenant-isolation",
      "rbac-denial",
      "idempotency-store",
      "revalidation-job",
      "associations",
      "audit-log",
      "dashboard-publish-flow",
      "dashboard-edit-flow",
      "dashboard-archive-flow",
      "ci-seo-publication-job",
      "secret-safe-artifacts",
    ]);
    expect(seoPublicationArtifactPaths).toContain("coverage/seo-publication-runtime.json");
    expect(seoPublicationArtifactPaths).toContain("test-results/seo-publication-runtime");
  });

  it("keeps package planner, dashboard route transaction, read/static guards, and publication boundary wired", () => {
    expect(seoSource).toContain("buildSeoPublicationMutationPlan");
    expect(seoSource).toContain("buildSeoPublicationRuntimeReadinessPlan");
    expect(routeSource).toContain('assertPermission(actor, "seo:write")');
    expect(routeSource).toContain("buildSeoPublicationMutationPlan");
    expect(routeSource).toContain("await prisma.$transaction(async (tx) =>");
    expect(routeSource).toContain("tx.seoCityPage.upsert");
    expect(routeSource).toContain("tx.seoStylePage.upsert");
    expect(routeSource).toContain("tx.seoRedirect.upsert");
    expect(staticTest).toContain("persists city, style, redirect, and audit writes inside a Prisma transaction");
    expect(readStaticTest).toContain("seo:read");
  });

  it("keeps association, idempotency, revalidation, integration, tenant, dashboard, CI, and artifact blockers explicit", () => {
    expect(seoPublicationRuntimeReadiness.status).toBe("blocked");
    expect(seoPublicationRuntimeReadiness.missingScripts).toEqual([]);
    expect(seoPublicationRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "SEO association, publish-state, and revalidation job persistence evidence",
      "SEO Prisma integration, tenant isolation, and dashboard publish-flow test evidence",
      "tenant-scoped transaction, audit, and idempotency evidence",
    ]));
    expect(seoPublicationRuntimeReadiness.blockers).toContain("FAQ, review, and image SEO associations must persist tenant-safely.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("SEO revalidation jobs must persist after publication commits.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("SEO publication idempotency store must be available.");
    expect(seoPublicationRuntimeReadiness.blockers).toContain("Dashboard SEO publish/edit/archive flow tests must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming seeded DB/browser proof", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO publication runtime contracts");
    expect(ciWorkflow).toContain("seo-publication-runtime-static.test.ts");
    expect(ciWorkflow).toContain("seo-publication-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-seo-publication-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/seoPublicationRuntime.ts");
    expect(gapTracker).toContain("GAP-071 is seo-publication-runtime-matrix wired");
    expect(seoPublicationArtifactPaths).toContain("coverage/seo-publication-secret-safe-artifacts.json");
  });
});
