import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  extractJsonLdScriptsFromHtml,
  structuredDataCrawlArtifactPaths,
  structuredDataCrawlInventory,
  structuredDataCrawlQaContract,
  structuredDataCrawlRuntimeMatrix,
  structuredDataCrawlerCommands,
  structuredDataRouteCoverageSummary,
  supportedRichResultSchemaTypes,
  unsupportedSchemaReviewRequiredTypes,
} from "../lib/structuredDataCrawlQa";

const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-073 structured-data crawl QA contract", () => {
  it("defines rendered public route inventory across JSON-LD, canonical, sitemap, robots, and noindex surfaces", () => {
    expect(structuredDataCrawlInventory.map((route) => route.path)).toEqual(
      expect.arrayContaining(["/", "/about", "/portfolio", "/travel", "/faq", "/cities/seattle-wa", "/styles/blackwork", "/booking/deposit-preview", "/sitemap.xml", "/robots.txt"]),
    );
    expect(structuredDataCrawlInventory.some((route) => route.kind === "noindex" && route.shouldIndex === false)).toBe(true);
    expect(structuredDataCrawlInventory.filter((route) => route.expectedJsonLdTypes.length > 0).length).toBeGreaterThan(5);
  });

  it("extracts rendered JSON-LD scripts for browser crawl artifacts", () => {
    const scripts = extractJsonLdScriptsFromHtml(
      '<html><head><script type="application/ld+json">[{"@type":"FAQPage"},{"@type":"ImageObject"}]</script></head></html>',
    );
    expect(scripts.map((script) => script["@type"])).toEqual(["FAQPage", "ImageObject"]);
  });

  it("separates supported Rich Results checks from unsupported-schema review", () => {
    expect(supportedRichResultSchemaTypes).toEqual(["FAQPage", "ImageObject", "Event"]);
    expect(unsupportedSchemaReviewRequiredTypes).toEqual(["Person"]);
    expect(structuredDataCrawlQaContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Google Rich Results-compatible validation and unsupported-schema review evidence",
        "production/demo content, sitemap, canonical, robots, and noindex crawl evidence",
        "crawl artifact capture and closeout attachment evidence",
      ]),
    );
  });

  it("publishes concrete crawler commands and retained artifacts without claiming unrun external proof", () => {
    expect(structuredDataCrawlerCommands).toContain("pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts");
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/rich-results-compatible-report.json");
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/sitemap-canonical-noindex-crawl.json");
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/structured-data-closeout.md");
    expect(structuredDataCrawlQaContract.status).toBe("blocked");
    expect(structuredDataCrawlQaContract.blockers).toContain("Google Rich Results-compatible structured-data checks must pass.");
  });

  it("summarizes route coverage and noindex crawl targets", () => {
    const summary = structuredDataRouteCoverageSummary();
    expect(summary.crawlRouteCount).toBeGreaterThanOrEqual(10);
    expect(summary.noindexRoutes).toContain("/booking/deposit-preview");
    expect(summary.artifactPaths).toContain("test-results/structured-data-crawl");
  });

  it("pins the rendered crawl runtime matrix and closeout proof boundaries", () => {
    expect(structuredDataCrawlRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "web-build",
      "rendered-browser-crawl",
      "jsonld-extraction",
      "rich-results-compatible-validation",
      "unsupported-schema-review",
      "production-content-decision",
      "sitemap-canonical-robots-noindex",
      "closeout-evidence",
      "ci-structured-data-job",
      "secret-safe-artifacts",
    ]);
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/structured-data-jsonld-extraction.json");
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/structured-data-production-content-decision.json");
    expect(structuredDataCrawlArtifactPaths).toContain("coverage/structured-data-secret-safe-artifacts.json");
    expect(structuredDataCrawlQaContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Google Rich Results-compatible validation and unsupported-schema review evidence",
        "production/demo content, sitemap, canonical, robots, and noindex crawl evidence",
        "crawl artifact capture and closeout attachment evidence",
      ]),
    );
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-073", () => {
    expect(ciWorkflow).toContain("Run Phase 10 structured-data crawl runtime contracts");
    expect(ciWorkflow).toContain("structured-data-crawl-qa-static.test.ts");
    expect(ciWorkflow).toContain("structured-data-crawl-artifacts");
    expect(unitManifest).toContain("unit-web-structured-data-crawl-qa-static");
    expect(unitManifest).toContain("structuredDataCrawlRuntimeMatrix");
    expect(gapTracker).toContain("GAP-073 is structured-data-crawl-runtime-matrix wired");
  });
});
