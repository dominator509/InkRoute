import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedSeoA11yPerformanceAuditArtifact,
  buildSeoA11yPerformanceAuditEvidenceDecision,
  buildSeoA11yPerformanceAuditArtifactReview,
  buildSeoA11yPerformanceAuditExecutionPlan,
  buildSeoA11yPerformanceAuditRunData,
  persistSeoA11yPerformanceAuditRun,
  seoA11yPerformanceArtifactPaths,
  seoA11yPerformanceAuditCommands,
  seoA11yPerformanceAuditControls,
  seoA11yPerformanceAuditEvidenceFlags,
  seoA11yPerformanceAuditExternalCommands,
  seoA11yPerformanceAuditExecutionPolicy,
  seoA11yPerformanceAuditLocalCommands,
  seoA11yPerformanceAuditMatrix,
  seoA11yPerformanceAuditRuntimeProofFiles,
  seoA11yPerformanceAuditReadiness,
  seoA11yPerformanceAuditRequiredExternalEvidence,
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
      "heading/focus/contrast accessibility fix verification",
      "Lighthouse audit for launch-critical public routes",
      "Core Web Vitals capture",
      "structured-data rendered snapshot capture",
      "mobile visual QA sweep",
      "GitHub Actions SEO accessibility performance evidence job",
      "secret-safe SEO accessibility performance artifact review",
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
    expect(seoA11yPerformanceArtifactPaths).toContain("coverage/seo-a11y-secret-safe-artifacts.json");
    expect(seoA11yPerformanceArtifactPaths).toContain("test-results/seo-a11y-performance-runtime");
  });

  it("pins SEO/a11y/performance control helper identity", () => {
    const decision = buildSeoA11yPerformanceAuditEvidenceDecision({
      commands: seoA11yPerformanceAuditCommands,
      artifacts: seoA11yPerformanceArtifactPaths,
      controls: seoA11yPerformanceAuditControls,
      evidence: Object.fromEntries(seoA11yPerformanceAuditEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof seoA11yPerformanceAuditEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(seoA11yPerformanceAuditControls);
    expect(gapTracker).toContain("seoA11yPerformanceAuditControls");
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
    expect(seoA11yPerformanceAuditReadiness.requiredCommands).toBe(seoA11yPerformanceAuditCommands);
    expect(seoA11yPerformanceAuditReadiness.requiredControls).toBe(seoA11yPerformanceAuditControls);
    expect(seoA11yPerformanceAuditReadiness.requiredEvidence).toBe(seoA11yPerformanceAuditEvidenceFlags);
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.");
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("axe accessibility audit must pass for launch-critical public routes.");
    expect(seoA11yPerformanceAuditReadiness.blockers).toContain("SEO/accessibility/performance artifacts must be redacted and free of secrets, client-private data, raw medical notes, private file URLs, and provider tokens.");
  });

  it("pins the SeoA11yPerformanceAuditRun persistence model and migration", () => {
    const runData = buildSeoA11yPerformanceAuditRunData({
      tenantId: "tenant_static",
      runId: "seo_a11y_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["browser crawl for public Phase 10 routes"],
      artifacts: ["coverage/seo-a11y-browser-crawl.json"],
      renderedCrawlEvidenceCaptured: false,
      schemaValidatorEvidenceCaptured: false,
      sitemapCanonicalEvidenceCaptured: false,
      axeEvidenceCaptured: false,
      lighthouseCwvEvidenceCaptured: false,
      mobileVisualQaEvidenceCaptured: false,
      accessibilityFixEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      crawlReportPath: "coverage/seo-a11y-browser-crawl.json",
      lighthouseReportPath: "coverage/seo-a11y-lighthouse-cwv.json",
    });

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
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "seo_a11y_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["browser crawl for public Phase 10 routes"],
      artifactManifest: ["coverage/seo-a11y-browser-crawl.json"],
      renderedCrawlEvidenceCaptured: false,
      axeEvidenceCaptured: false,
      lighthouseCwvEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      crawlReportPath: "coverage/seo-a11y-browser-crawl.json",
      lighthouseReportPath: "coverage/seo-a11y-lighthouse-cwv.json",
    });
    expect(String(persistSeoA11yPerformanceAuditRun)).toContain(
      "repository.seoA11yPerformanceAuditRun.upsert",
    );
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

  it("blocks SEO/a11y/performance completion when rendered crawl, schema, axe, Lighthouse, mobile, or safe evidence is missing", () => {
    const decision = buildSeoA11yPerformanceAuditEvidenceDecision({
      commands: ["pnpm --filter @inkroute/seo typecheck"],
      artifacts: ["coverage/seo-a11y-seo-typecheck.txt"],
      controls: ["audit-rendered-routes-not-only-package-metadata-helpers"],
      evidence: {
        seoTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("axe accessibility audit for public routes");
    expect(decision.missingArtifacts).toContain("coverage/seo-a11y-lighthouse-cwv.json");
    expect(decision.missingControls).toContain("fix-heading-focus-landmark-label-contrast-form-accessibility-before-launch");
    expect(decision.missingEvidence).toContain("browserCrawlPassed");
    expect(decision.missingEvidence).toContain("axeAuditPassed");
    expect(decision.requiredRouteTargets).toBe(seoAuditRouteTargets);
    expect(decision.blockers).toContain(
      "Browser crawl must cover public home, portfolio, booking, travel, FAQ, city, style, privacy, and legal routes.",
    );
    expect(decision.blockers).toContain("axe accessibility audit must pass for launch-critical public routes.");
  });

  it("completes SEO/a11y/performance readiness only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(seoA11yPerformanceAuditEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildSeoA11yPerformanceAuditEvidenceDecision({
      commands: seoA11yPerformanceAuditCommands,
      artifacts: seoA11yPerformanceArtifactPaths,
      controls: seoA11yPerformanceAuditControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(seoA11yPerformanceAuditEvidenceFlags);
  });

  it("separates static SEO audit review from external execution and redacts private artifacts", () => {
    const executionPlan = buildSeoA11yPerformanceAuditExecutionPlan();
    const artifactReview = buildSeoA11yPerformanceAuditArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      renderedHtmlBody: "<html><body>private client content</body></html>",
      mobileVisualScreenshotUrl: "https://files.example.com/private-file/mobile.png",
      nested: {
        authorizationHeader: "authorization: bearer sk_private",
        publicSummary: "seo a11y performance evidence captured",
      },
    });
    const directRedaction = buildRedactedSeoA11yPerformanceAuditArtifact({
      publicSummary: "safe seo audit evidence",
      rawHtmlSnapshot: "<html>private</html>",
    });

    expect(executionPlan.localCommands).toBe(seoA11yPerformanceAuditLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "static SEO engine and sitemap helper review",
      "static route target inventory review",
    ]);
    expect(executionPlan.externalCommands).toBe(seoA11yPerformanceAuditExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "browser crawl for public Phase 10 routes",
      "schema validator for rendered JSON-LD",
      "sitemap and canonical browser checks",
      "axe accessibility audit for public routes",
      "heading/focus/contrast accessibility fix verification",
      "Lighthouse audit for launch-critical public routes",
      "Core Web Vitals capture",
      "mobile visual QA sweep",
      "provider-backed persistSeoA11yPerformanceAuditRun execution",
      "CI SEO accessibility performance artifact capture",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.lighthouseExecutionAllowed).toBe(false);
    expect(executionPlan.accessibilityToolExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(seoA11yPerformanceAuditExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticSeoAuditReadiness: true,
      renderedBrowserAuditRequiredForClosure: true,
      accessibilityFixVerificationRequiredForClosure: true,
      lighthouseAndCoreWebVitalsRequiredForClosure: true,
      mobileVisualQaRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(seoA11yPerformanceAuditRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("rendered browser crawl evidence for all Phase 10 public routes");
    expect(executionPlan.requiredExternalEvidence).toContain("Lighthouse and Core Web Vitals evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe SEO accessibility performance artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(seoA11yPerformanceAuditRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "renderedHtmlBody",
      "mobileVisualScreenshotUrl",
      "nested.authorizationHeader",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("<html");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("sk_private");
    expect(JSON.stringify(artifactReview.artifact)).toContain("seo a11y performance evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["rawHtmlSnapshot"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe seo audit evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming rendered audit execution", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO accessibility performance audit contracts");
    expect(ciWorkflow).toContain("seo-a11y-performance-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("seo-a11y-performance-audit-artifacts");
    expect(ciWorkflow).toContain("coverage/seo-a11y-performance-runtime.json");
    expect(unitManifest).toContain("unit-web-seo-a11y-performance-audit-runtime-static");
    expect(unitManifest).toContain("SeoA11yPerformanceAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/seoA11yPerformanceAuditRuntime.ts");
    expect(gapTracker).toContain("persistSeoA11yPerformanceAuditRun upsert seam");
    expect(gapTracker).toContain("buildSeoA11yPerformanceAuditExecutionPlan");
    expect(gapTracker).toContain("seoA11yPerformanceAuditLocalCommands/seoA11yPerformanceAuditExternalCommands");
    expect(gapTracker).toContain("buildRedactedSeoA11yPerformanceAuditArtifact");
    expect(gapTracker).toContain("buildSeoA11yPerformanceAuditArtifactReview");
    expect(gapTracker).toContain("seoA11yPerformanceAuditExecutionPolicy");
    expect(gapTracker).toContain("seoA11yPerformanceAuditRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-030 is seo-a11y-performance-audit-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live rendered browser crawl, provider-backed persistSeoA11yPerformanceAuditRun execution, schema validator, sitemap/canonical browser checks, axe, Lighthouse/Core Web Vitals, mobile visual QA, heading/focus/contrast fixes, CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current SEO accessibility performance audit proof files for GAP-030", () => {
    expect(seoA11yPerformanceAuditRuntimeProofFiles).toContain("packages/seo/package.json");
    expect(seoA11yPerformanceAuditRuntimeProofFiles).toContain("apps/web/package.json");
    expect(seoA11yPerformanceAuditRuntimeProofFiles).toContain("apps/web/lib/seoA11yPerformanceAuditRuntime.ts");
    expect(seoA11yPerformanceAuditRuntimeProofFiles).toContain("apps/web/tests/seo-a11y-performance-audit-runtime-static.test.ts");
    for (const proofFile of seoA11yPerformanceAuditRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


