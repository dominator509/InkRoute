import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  phase10SeoRuntimeArtifactPaths,
  phase10SeoRuntimeBuildContract,
  phase10SeoRuntimeSurfaces,
} from "../lib/phase10SeoRuntimeBuild";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");

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
  });

  it("distinguishes static contract evidence from runtime/build evidence still required", () => {
    expect(phase10SeoRuntimeSurfaces.filter((surface) => surface.evidenceType === "static-contract").map((surface) => surface.id)).toEqual(
      expect.arrayContaining(["sitemap-route", "database-backed-seo-routes", "search-console-provider-status"]),
    );
    expect(phase10SeoRuntimeSurfaces.filter((surface) => surface.evidenceType === "runtime-required").map((surface) => surface.id)).toEqual(
      expect.arrayContaining(["dashboard-seo-browser-smoke", "rendered-public-seo-crawl", "canonical-runtime-artifacts"]),
    );
  });

  it("retains Phase 10 SEO runtime artifact paths without claiming unrun browser proof", () => {
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-sitemap-runtime.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-api-preview-runtime.json");
    expect(phase10SeoRuntimeArtifactPaths).toContain("coverage/phase10-canonical-runtime.json");
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

  it("requires the Phase 10 SEO app runtime/build gate in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO app runtime and build gate");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/testing test");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/web build");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/dashboard build");
    expect(ciWorkflow).toContain("apps/web/tests/phase10-seo-runtime-build-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/canonical-domain-runtime-static.test.ts");
    expect(ciWorkflow).toContain("apps/dashboard/tests/search-console-route-static.test.ts");
    expect(ciWorkflow).toContain("phase10-seo-runtime-build-artifacts");
  });
});
