import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  seoAutomatedArtifactPaths,
  seoAutomatedSuites,
  seoAutomatedTestContract,
} from "../lib/seoAutomatedTests";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");

describe("GAP-078 SEO automated test gate", () => {
  it("enumerates SEO package, preview route, adjacent runtime, crawl, provider, and image suites", () => {
    expect(seoAutomatedSuites.map((suite) => suite.id)).toEqual([
      "seo-package-tests",
      "seo-package-typecheck",
      "sitemap-route-tests",
      "seo-preview-route-tests",
      "sitemap-preview-route-tests",
      "canonical-domain-runtime-static",
      "structured-data-crawl-qa-static",
      "seo-analytics-attribution-static",
      "search-console-route-static",
      "image-seo-pipeline-static",
      "phase10-seo-runtime-build-static",
    ]);
  });

  it("links GAP-073 crawl evidence and GAP-076 runtime/build evidence into the SEO automated gate", () => {
    expect(seoAutomatedTestContract.blockers).not.toContain("Runtime/build evidence must be covered by GAP-076.");
    expect(seoAutomatedTestContract.blockers).not.toContain("Rendered crawl and external structured-data evidence must be covered by GAP-073.");
    expect(seoAutomatedTestContract.blockers).not.toContain("CI must run the SEO package and preview route test gate.");
    expect(seoAutomatedTestContract.requiredSuites).toContain("CI SEO package and preview route test gate");
  });

  it("retains SEO automated artifacts while package/route execution remains explicit", () => {
    expect(seoAutomatedArtifactPaths).toContain("coverage/seo-automated-test-gate.json");
    expect(seoAutomatedArtifactPaths).toContain("coverage/phase10-seo-*.json");
    expect(seoAutomatedArtifactPaths).toContain("test-results/seo-automated");
    expect(seoAutomatedTestContract.status).toBe("blocked");
    expect(seoAutomatedTestContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "route record, sitemap, metadata, and audit test output",
        "content brief, internal-link, JSON-LD, and structured-data snapshot test output",
        "image pipeline, canonical/redirect, and Search Console planner test output",
        "web sitemap, SEO preview, and sitemap preview route test output",
      ]),
    );
  });

  it("requires the SEO automated gate in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 10 SEO automated test gate");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/seo test");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/seo typecheck");
    expect(ciWorkflow).toContain("apps/web/tests/seo-automated-tests-static.test.ts");
    expect(ciWorkflow).toContain("apps/web/tests/sitemap-route.test.ts");
    expect(ciWorkflow).toContain("apps/dashboard/tests/image-seo-pipeline-static.test.ts");
    expect(ciWorkflow).toContain("seo-automated-test-artifacts");
  });
});
