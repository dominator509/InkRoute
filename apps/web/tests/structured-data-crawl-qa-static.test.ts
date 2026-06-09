import { describe, expect, it } from "vitest";

import {
  extractJsonLdScriptsFromHtml,
  structuredDataCrawlArtifactPaths,
  structuredDataCrawlInventory,
  structuredDataCrawlQaContract,
  structuredDataCrawlerCommands,
  structuredDataRouteCoverageSummary,
  supportedRichResultSchemaTypes,
  unsupportedSchemaReviewRequiredTypes,
} from "../lib/structuredDataCrawlQa";

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
});
