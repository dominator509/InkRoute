import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  seoA11yPerformanceArtifactPaths,
  seoA11yPerformanceAuditCommands,
  seoA11yPerformanceAuditMatrix,
  seoA11yPerformanceAuditReadiness,
  seoAuditRouteTargets,
  seoA11yPerformanceAuditRunPersistenceContract,
} from "../lib/seoA11yPerformanceAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SEO accessibility performance audit runtime contract", () => {
  const seoPackageJson = readRepoFile("packages/seo/package.json");
  const seoSource = readRepoFile("packages/seo/src/index.ts");
  const seoTests = readRepoFile("packages/seo/tests/seo-engine.test.ts");
  const seoEngine = readRepoFile("apps/web/lib/seoEngine.ts");
  const sitemapRoute = readRepoFile("apps/web/app/sitemap.ts");
  const dashboardSeo = readRepoFile("apps/dashboard/app/seo/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const auditRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035200_add_seo_a11y_performance_audit_runs/migration.sql");

  it("pins SEO/a11y/performance commands, route targets, matrix rows, and artifact paths", () => {
    expect(seoA11yPerformanceAuditCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "browser crawl for public Phase 10 routes",
      "schema validator for rendered JSON-LD",
      "sitemap and canonical browser checks",
      "axe accessibility audit for public routes",
      "Lighthouse/Core Web Vitals audit",
      "mobile visual QA sweep",
      "GitHub Actions SEO accessibility performance evidence job",
    ]);
    expect(seoAuditRouteTargets.map((route) => route.category)).toEqual(expect.arrayContaining([
      "home",
      "portfolio",
      "booking",
      "travel",
      "faq",
      "city",
      "style",
      "privacy",
      "legal",
    ]));
    expect(seoA11yPerformanceAuditMatrix.map((entry) => entry.id)).toEqual([
      "seo-and-web-package-gates",
      "public-route-browser-crawl",
      "schema-sitemap-canonical-rendered-checks",
      "axe-heading-focus-contrast-label-landmark",
      "lighthouse-core-web-vitals",
      "mobile-visual-qa",
      "ci-redacted-audit-artifacts",
    ]);
    expect(seoA11yPerformanceArtifactPaths).toContain("coverage/seo-a11y-performance-runtime.json");
    expect(seoA11yPerformanceArtifactPaths).toContain("coverage/seo-a11y-lighthouse-cwv.json");
    expect(seoA11yPerformanceArtifactPaths).toContain("test-results/seo-a11y-performance-runtime");
  });

  it("keeps package helpers, app SEO surfaces, sitemap, and dashboard SEO review visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(seoPackageJson).toContain(`"${scriptName}"`);
    }
    expect(seoSource).toContain("buildSeoA11yPerformanceAuditEvidencePlan");
    expect(seoSource).toContain("Audit rendered routes, not only package-level metadata helpers.");
    expect(seoTests).toContain("blocks SEO accessibility and performance audit evidence until browser, schema, axe, Lighthouse, mobile, CI, and safe artifacts exist");
    expect(seoEngine).toContain("allPublicSeoRoutes");
    expect(seoEngine).toContain("buildSitemapPlan");
    expect(sitemapRoute).toContain("buildSitemapPlan");
    expect(dashboardSeo).toContain("SEO engine");
    expect(dashboardSeo).toContain("Search Console integration");
  });

  it("keeps audit readiness blocked until rendered crawl, schema, axe, Lighthouse, CWV, mobile, CI, and safe artifacts exist", () => {
    expect(seoA11yPerformanceAuditReadiness.status).toBe("blocked");
    expect(seoA11yPerformanceAuditReadiness.missingScripts).toEqual([]);
    expect(seoA11yPerformanceAuditReadiness.requiredCommands).toEqual([...seoA11yPerformanceAuditCommands]);
    expect(seoA11yPerformanceAuditReadiness.requiredControls).toEqual([
      "Audit rendered routes, not only package-level metadata helpers.",
      "Validate JSON-LD, sitemap, canonical URLs, and internal links against browser-visible output.",
      "Fix heading order, focus state, landmark, label, contrast, and form accessibility issues before launch.",
      "Capture Lighthouse and Core Web Vitals evidence for launch-critical desktop and mobile routes.",
      "Keep audit artifacts redacted and free of client-private, medical, payment, provider, and private file data.",
    ]);
    expect(seoA11yPerformanceAuditReadiness.requiredEvidence).toEqual([
      "web typecheck and production build evidence",
      "browser crawl, sitemap/canonical, schema validator, and structured-data snapshot evidence",
      "axe accessibility audit output plus heading/focus/contrast fix evidence",
      "Lighthouse and Core Web Vitals evidence for launch-critical routes",
      "mobile visual QA screenshots or transcript evidence",
      "CI artifact bundle with redaction/secret-safety proof",
    ]);
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.");
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("axe accessibility audit must pass for launch-critical public routes.");
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("SEO/accessibility/performance artifacts must be redacted and free of secrets, client-private data, raw medical notes, private file URLs, and provider tokens.");
  });

  it("pins the SeoA11yPerformanceAuditRun persistence model and migration", () => {
    expect(seoA11yPerformanceAuditRunPersistenceContract).toEqual({
      prismaModel: "SeoA11yPerformanceAuditRun",
      tenantRelation: "seoA11yPerformanceAuditRuns",
      migration: "20260609035200_add_seo_a11y_performance_audit_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesRenderedCrawlEvidence: true,
      storesSchemaValidatorEvidence: true,
      storesSitemapCanonicalEvidence: true,
      storesAxeEvidence: true,
      storesLighthouseCwvEvidence: true,
      storesMobileVisualQaEvidence: true,
      storesAccessibilityFixEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model SeoA11yPerformanceAuditRun");
    expect(prismaSchema).toContain("seoA11yPerformanceAuditRuns SeoA11yPerformanceAuditRun[]");
    expect(prismaSchema).toContain("renderedCrawlEvidenceCaptured");
    expect(prismaSchema).toContain("lighthouseCwvEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(auditRunMigration).toContain('CREATE TABLE "SeoA11yPerformanceAuditRun"');
    expect(auditRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(auditRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(auditRunMigration).toContain('"SeoA11yPerformanceAuditRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming rendered audit execution", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO accessibility performance audit contracts");
    expect(ciWorkflow).toContain("seo-a11y-performance-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("seo-a11y-performance-audit-artifacts");
    expect(ciWorkflow).toContain("coverage/seo-a11y-performance-runtime.json");
    expect(unitManifest).toContain("unit-web-seo-a11y-performance-audit-runtime-static");
    expect(unitManifest).toContain("SeoA11yPerformanceAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/seoA11yPerformanceAuditRuntime.ts");
    expect(gapTracker).toContain("SeoA11yPerformanceAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("live rendered browser crawl, schema validator, sitemap/canonical browser checks, axe, Lighthouse/Core Web Vitals, mobile visual QA, heading/focus/contrast fixes, CI evidence, and secret-safe artifact review remain open");
  });
});
