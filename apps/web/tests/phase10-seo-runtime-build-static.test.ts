import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildPhase10SeoRuntimeArtifactReview,
  buildPhase10SeoRuntimeEvidenceDecision,
  buildPhase10SeoRuntimeBuildEvidencePacket,
  buildPhase10SeoRuntimeExecutionPlan,
  buildRedactedPhase10SeoRuntimeArtifact,
  phase10SeoRuntimeArtifactPaths,
  phase10SeoRuntimeBuildCommands,
  phase10SeoRuntimeBuildContract,
  phase10SeoRuntimeBuildMatrix,
  phase10SeoRuntimeDecisionRequiredEvidence,
  phase10SeoRuntimeExecutionPolicy,
  phase10SeoRuntimeProofFiles,
  phase10SeoRuntimeRequiredExternalEvidence,
  phase10SeoRuntimeSurfaceContract,
  phase10SeoRuntimeSurfaces,
} from "../lib/phase10SeoRuntimeBuild";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
const gapTracker = readFileSync("GAP_TRACKER.md", "utf8");
const seoPreviewRoute = readFileSync("apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts", "utf8");
const sitemapPreviewRoute = readFileSync("apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts", "utf8");
const sitemapRouteTest = readFileSync("apps/web/tests/sitemap-route.test.ts", "utf8");

describe("GAP-076 Phase 10 SEO app runtime/build gate", () => {
  it("enumerates build, route, dashboard, crawl, database, preview, canonical, and provider-status surfaces", () => {
    expect(phase10SeoRuntimeSurfaces.map((surface) => surface.id)).toEqual([
      "testing-package",
      "web-build",
      "dashboard-build",
      "sitemap-route",
      "seo-preview-route",
      "sitemap-preview-route",
      "dashboard-seo-browser-smoke",
      "dashboard-seo-publish-interaction-smoke",
      "rendered-public-seo-crawl",
      "rendered-sitemap-canonical-crawl",
      "database-backed-seo-routes",
      "sitemap-runtime-artifacts",
      "api-preview-runtime-artifacts",
      "canonical-runtime-artifacts",
      "search-console-provider-status",
    ]);
    expect(phase10SeoRuntimeSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "web-build",
      "dashboard-build",
      "dashboard-seo-browser-smoke",
      "rendered-public-seo-crawl",
      "rendered-sitemap-canonical-crawl",
      "database-backed-seo-routes",
      "api-preview-runtime-artifacts",
      "search-console-provider-status",
      "ci-phase10-seo-runtime-gate",
      "secret-safe-artifacts",
    ]);
  });

  it("distinguishes static contract evidence from runtime/build evidence still required", () => {
    expect(phase10SeoRuntimeSurfaces.filter((surface) => surface.evidenceType === "static-contract").map((surface) => surface.id)).toEqual(
      expect.arrayContaining(["sitemap-route", "database-backed-seo-routes", "search-console-provider-status"]),
    );
    expect(phase10SeoRuntimeSurfaces.filter((surface) => surface.evidenceType === "runtime-required").map((surface) => surface.id)).toEqual(
      expect.arrayContaining(["dashboard-seo-browser-smoke", "rendered-public-seo-crawl", "canonical-runtime-artifacts"]),
    );
  });

  it("keeps SEO preview and sitemap preview API payloads no-store", () => {
    expect(seoPreviewRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(sitemapPreviewRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(seoPreviewRoute).toContain("{ headers: noStoreHeaders }");
    expect(sitemapPreviewRoute).toContain("{ headers: noStoreHeaders }");
    expect(sitemapRouteTest).toContain('response.headers.get("Cache-Control")).toBe("no-store")');
  });

  it("retains Phase 10 SEO runtime artifact paths without claiming unrun browser proof", () => {
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-sitemap-runtime.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-api-preview-runtime.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-canonical-runtime.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-search-console-provider-execution-redacted.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-seo-runtime-build-packet.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-seo-runtime-secret-safe-artifacts.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("test-results/phase10-seo-dashboard");
    expect(phase10SeoRuntimeBuildContract.status).toBe("blocked");
    expect(phase10SeoRuntimeBuildContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web/dashboard build and sitemap/SEO preview route test output",
        "dashboard SEO browser and publish/edit/archive interaction smoke evidence",
        "rendered public SEO route, sitemap, and canonical crawl evidence",
        "database-backed SEO route, runtime artifact, API preview, and CI required-gate evidence",
      ]),
    );
  });

  it("pins the Phase 10 SEO runtime/build command and artifact matrix", () => {
    expect(phase10SeoRuntimeBuildCommands).toEqual([
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm vitest run apps/web/tests/phase10-seo-runtime-build-static.test.ts apps/web/tests/sitemap-route.test.ts apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/structured-data-crawl-qa-static.test.ts apps/dashboard/tests/seo-read-route-static.test.ts apps/dashboard/tests/seo-publication-route-static.test.ts apps/dashboard/tests/search-console-route-static.test.ts",
      "pnpm playwright test apps/dashboard/tests/seo-browser-smoke.spec.ts",
      "pnpm playwright test apps/dashboard/tests/seo-publish-flow.spec.ts",
      "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts",
      "pnpm playwright test apps/web/tests/e2e/sitemap-canonical-crawl.spec.ts",
    ]);
    expect(phase10SeoRuntimeBuildMatrix.map((entry) => entry.id)).toEqual([
      "testing-package-test",
      "testing-package-typecheck",
      "web-build",
      "dashboard-build",
      "static-contracts",
      "dashboard-browser-smoke",
      "dashboard-publish-smoke",
      "rendered-public-seo-crawl",
      "rendered-sitemap-canonical-crawl",
      "database-backed-seo-routes",
      "sitemap-runtime",
      "api-preview-runtime",
      "canonical-runtime",
      "search-console-status",
      "search-console-provider-execution",
      "ci-phase10-seo-runtime-gate",
      "runtime-build-evidence-packet",
      "secret-safe-artifacts",
    ]);
  });

  it("builds a local execution plan without provider execution", () => {
    const plan = buildPhase10SeoRuntimeExecutionPlan();

    expect(plan.id).toBe("gap-076-phase10-seo-runtime-build");
    expect(plan.providerExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(phase10SeoRuntimeExecutionPolicy);
    expect(plan.surfaceContract).toBe(phase10SeoRuntimeSurfaceContract);
    expect(plan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "web-build",
          requiredCommand: "pnpm --filter @inkroute/web build",
          requiredArtifact: "coverage/phase10-seo-web-build.json",
          runtimeBoundary: "build",
          providerBackedEvidenceRequired: false,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "search-console-provider-status",
          requiredCommand: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
          requiredArtifact: "coverage/phase10-search-console-provider-execution-redacted.json",
          runtimeBoundary: "search-console-provider",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "ci-phase10-seo-runtime-gate",
          requiredCommand: "GitHub Actions Phase 10 SEO app runtime and build gate",
          requiredArtifact: "coverage/phase10-seo-runtime-ci-evidence.json",
          runtimeBoundary: "ci-proof",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(plan.policy).toEqual({
      executeTestingPackageChecks: false,
      executeWebBuild: false,
      executeDashboardBuild: false,
      executeBrowserSmokes: false,
      executeRenderedCrawls: false,
      executeSearchConsoleProvider: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(phase10SeoRuntimeBuildCommands);
    expect(plan.requiredArtifacts).toBe(phase10SeoRuntimeArtifactPaths);
    expect(plan.buildSurfaces).toEqual(expect.arrayContaining(["testing-package", "web-build", "dashboard-build"]));
    expect(plan.runtimeSurfaces).toEqual(
      expect.arrayContaining(["dashboard-seo-browser-smoke", "rendered-public-seo-crawl", "canonical-runtime-artifacts"]),
    );
    expect(plan.providerSurfaces).toEqual(["search-console-provider-status"]);
    expect(plan.secretSafeArtifactPath).toBe("coverage/phase10-seo-runtime-secret-safe-artifacts.json");
    expect(plan.externalEvidenceRequired).toBe(phase10SeoRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "testing package test/typecheck output",
      "web and dashboard build logs",
      "dashboard SEO browser and publish/edit/archive Playwright proof",
      "rendered public SEO and sitemap/canonical crawl artifacts",
      "sitemap/API preview/canonical runtime artifact capture",
      "Search Console provider execution proof captured as redacted artifacts",
      "GitHub Actions Phase 10 SEO runtime/build gate evidence",
    ]);
  });

  it("redacts Phase 10 SEO runtime/build artifacts before persistence", () => {
    const rawArtifact = {
      searchConsole: {
        authorization: "Bearer ya29.search-console-provider-token",
        email: "artist@example.com",
        siteUrl: "https://tenant.example.com",
        rows: [{ query: "fine line tattoo", clicks: 12 }],
      },
      preview: {
        phone: "+1 (555) 867-5309",
        privateDraftHtml: "<h1>Private campaign draft</h1>",
      },
    };

    const redacted = buildRedactedPhase10SeoRuntimeArtifact(rawArtifact);
    const review = buildPhase10SeoRuntimeArtifactReview("phase10-search-console-provider-execution", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("artist@example.com");
    expect(serialized).not.toContain("ya29.search-console-provider-token");
    expect(serialized).not.toContain("+1 (555) 867-5309");
    expect(serialized).not.toContain("Private campaign draft");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/phase10-seo-runtime-secret-safe-artifacts.json");
  });

  it("classifies GAP-076 Phase 10 SEO runtime/build evidence as blocked until every runtime artifact is captured", () => {
    const blocked = buildPhase10SeoRuntimeEvidenceDecision({
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: true,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      staticContractsPassed: true,
      dashboardSeoBrowserSmokePassed: false,
      dashboardSeoPublishSmokePassed: false,
      renderedPublicSeoCrawlPassed: false,
      renderedSitemapCanonicalCrawlPassed: false,
      databaseBackedSeoRoutesVerified: true,
      sitemapRuntimeCaptured: false,
      apiPreviewRuntimeCaptured: false,
      canonicalRuntimeCaptured: false,
      searchConsoleStatusVerified: true,
      searchConsoleProviderExecutionCaptured: false,
      ciEvidenceCaptured: false,
      runtimeBuildEvidencePacketCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/phase10-seo-testing-package.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Web build evidence is required.",
        "Dashboard build evidence is required.",
        "Dashboard SEO browser smoke evidence is required.",
        "Rendered sitemap/canonical crawl evidence is required.",
        "Redacted Search Console provider execution evidence is required.",
        "Phase 10 SEO runtime/build evidence packet is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/phase10-seo-web-build.json");
    expect(blocked.requiredCommands).toBe(phase10SeoRuntimeBuildCommands);
    expect(blocked.requiredEvidence).toBe(phase10SeoRuntimeDecisionRequiredEvidence);

    const complete = buildPhase10SeoRuntimeEvidenceDecision({
      testingPackageTestsPassed: true,
      testingPackageTypecheckPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      staticContractsPassed: true,
      dashboardSeoBrowserSmokePassed: true,
      dashboardSeoPublishSmokePassed: true,
      renderedPublicSeoCrawlPassed: true,
      renderedSitemapCanonicalCrawlPassed: true,
      databaseBackedSeoRoutesVerified: true,
      sitemapRuntimeCaptured: true,
      apiPreviewRuntimeCaptured: true,
      canonicalRuntimeCaptured: true,
      searchConsoleStatusVerified: true,
      searchConsoleProviderExecutionCaptured: true,
      ciEvidenceCaptured: true,
      runtimeBuildEvidencePacketCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: phase10SeoRuntimeArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps the Phase 10 SEO runtime/build evidence packet non-executing and provider-proof gated", () => {
    const packet = buildPhase10SeoRuntimeBuildEvidencePacket();

    expect(packet.packetId).toBe("gap-076-phase10-seo-runtime-build-evidence");
    expect(packet.requiredArtifact).toBe("coverage/phase10-seo-runtime-build-packet.json");
    expect(packet.providerExecutionAllowed).toBe(false);
    expect(packet.requiredCommands).toBe(phase10SeoRuntimeBuildCommands);
    expect(packet.requiredArtifacts).toBe(phase10SeoRuntimeArtifactPaths);
    expect(packet.requiredExternalEvidence).toBe(phase10SeoRuntimeRequiredExternalEvidence);
    expect(packet.surfaceContract).toBe(phase10SeoRuntimeSurfaceContract);
    expect(packet.searchConsoleProviderEvidenceRequired).toBe(true);
    expect(packet.renderedCrawlEvidenceRequired).toBe(true);
    expect(packet.ciEvidenceRequired).toBe(true);
    expect(packet.redactionRequired).toBe(true);
  });

  it("requires the Phase 10 SEO app runtime/build gate in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO app runtime and build gate");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/testing test");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/web build");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/dashboard build");
    expect(ciWorkflow).toContain("apps/web/tests/phase10-seo-runtime-build-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/canonical-domain-runtime-static.test.ts");
    expect(ciWorkflow).toContain("apps/dashboard/tests/search-console-route-static.test.ts");
    expect(ciWorkflow).toContain("phase10-seo-runtime-build-artifacts");
    expect(ciWorkflow).toContain("coverage/phase10-seo-runtime-ci-evidence.json");
    expect(ciWorkflow).toContain("coverage/phase10-seo-runtime-secret-safe-artifacts.json");
    expect(gapTracker).toContain("Phase 10 SEO runtime/build evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("phase10SeoRuntimeDecisionRequiredEvidence");
    expect(gapTracker).toContain("phase10SeoRuntimeSurfaceContract");
    expect(gapTracker).toContain("buildPhase10SeoRuntimeBuildEvidencePacket");
  });

  it("pins current Phase 10 SEO runtime/build proof files for GAP-076", () => {
    expect(phase10SeoRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "apps/web/package.json",
      "packages/testing/package.json",
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
      "apps/web/lib/seoEngine.ts",
      "apps/web/lib/canonicalRuntime.ts",
      "apps/web/lib/structuredDataCrawlQa.ts",
      "apps/web/lib/phase10SeoRuntimeBuild.ts",
      "apps/web/app/sitemap.ts",
      "apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts",
      "apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts",
      "apps/web/tests/sitemap-route.test.ts",
      "apps/web/tests/canonical-domain-runtime-static.test.ts",
      "apps/web/tests/structured-data-crawl-qa-static.test.ts",
      "apps/web/tests/phase10-seo-runtime-build-static.test.ts",
      "apps/dashboard/app/seo/page.tsx",
      "apps/dashboard/app/api/seo/route.ts",
      "apps/dashboard/app/api/seo/search-console/route.ts",
      "apps/dashboard/tests/seo-read-route-static.test.ts",
      "apps/dashboard/tests/seo-publication-route-static.test.ts",
      "apps/dashboard/tests/search-console-route-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of phase10SeoRuntimeProofFiles) {
      expect(readFileSync(file, "utf8").length).toBeGreaterThan(0);
    }
  });
});
