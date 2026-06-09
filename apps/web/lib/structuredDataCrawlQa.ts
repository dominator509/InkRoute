import {
  buildStructuredDataCrawlQaReadinessPlan,
  type StructuredDataCrawlQaReadinessPlan,
} from "@inkroute/seo";
import { allPublicSeoRoutes } from "./seoEngine";
import { canonicalUrlForPath } from "./canonicalRuntime";

export type StructuredDataCrawlRouteKind = "jsonld" | "canonical" | "sitemap" | "robots" | "noindex";

export type StructuredDataCrawlRoute = {
  path: string;
  kind: StructuredDataCrawlRouteKind;
  expectedJsonLdTypes: string[];
  expectedCanonicalUrl?: string;
  shouldIndex: boolean;
};

export const structuredDataCrawlInventory: StructuredDataCrawlRoute[] = [
  {
    path: "/",
    kind: "jsonld",
    expectedJsonLdTypes: ["Person", "ImageObject", "Event", "FAQPage"],
    expectedCanonicalUrl: canonicalUrlForPath("/"),
    shouldIndex: true,
  },
  {
    path: "/about",
    kind: "jsonld",
    expectedJsonLdTypes: ["Person"],
    expectedCanonicalUrl: canonicalUrlForPath("/about"),
    shouldIndex: true,
  },
  {
    path: "/portfolio",
    kind: "jsonld",
    expectedJsonLdTypes: ["ImageObject"],
    expectedCanonicalUrl: canonicalUrlForPath("/portfolio"),
    shouldIndex: true,
  },
  {
    path: "/travel",
    kind: "jsonld",
    expectedJsonLdTypes: ["Event"],
    expectedCanonicalUrl: canonicalUrlForPath("/travel"),
    shouldIndex: true,
  },
  {
    path: "/faq",
    kind: "jsonld",
    expectedJsonLdTypes: ["FAQPage"],
    expectedCanonicalUrl: canonicalUrlForPath("/faq"),
    shouldIndex: true,
  },
  {
    path: "/cities/seattle-wa",
    kind: "canonical",
    expectedJsonLdTypes: ["Event", "ImageObject", "FAQPage"],
    expectedCanonicalUrl: canonicalUrlForPath("/cities/seattle-wa"),
    shouldIndex: true,
  },
  {
    path: "/styles/blackwork",
    kind: "canonical",
    expectedJsonLdTypes: ["ImageObject", "FAQPage"],
    expectedCanonicalUrl: canonicalUrlForPath("/styles/blackwork"),
    shouldIndex: true,
  },
  {
    path: "/booking/deposit-preview",
    kind: "noindex",
    expectedJsonLdTypes: [],
    expectedCanonicalUrl: canonicalUrlForPath("/booking/deposit-preview"),
    shouldIndex: false,
  },
  {
    path: "/sitemap.xml",
    kind: "sitemap",
    expectedJsonLdTypes: [],
    shouldIndex: true,
  },
  {
    path: "/robots.txt",
    kind: "robots",
    expectedJsonLdTypes: [],
    shouldIndex: true,
  },
];

export const structuredDataCrawlerCommands = [
  "pnpm --filter @inkroute/web build",
  "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts",
  "node scripts/seo/validate-rich-results-compatible.mjs coverage/structured-data-crawl.json",
  "node scripts/seo/verify-sitemap-canonical-noindex.mjs coverage/structured-data-crawl.json",
] as const;

export const structuredDataCrawlArtifactPaths = [
  "coverage/structured-data-crawl.json",
  "coverage/rich-results-compatible-report.json",
  "coverage/sitemap-canonical-noindex-crawl.json",
  "coverage/unsupported-schema-review.json",
  "coverage/structured-data-closeout.md",
  "test-results/structured-data-crawl",
] as const;

export const supportedRichResultSchemaTypes = ["FAQPage", "ImageObject", "Event"] as const;
export const unsupportedSchemaReviewRequiredTypes = ["Person"] as const;

export function extractJsonLdScriptsFromHtml(html: string): Array<Record<string, unknown>> {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  return scripts.flatMap((script) => {
    const json = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(json) as Record<string, unknown> | Array<Record<string, unknown>>;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{ "@type": "INVALID_JSON_LD", rawLength: json.length }];
    }
  });
}

export function buildStructuredDataCrawlQaContract(): StructuredDataCrawlQaReadinessPlan {
  return buildStructuredDataCrawlQaReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    seoPackageTestsPassed: false,
    seoPackageTypecheckPassed: false,
    webBuildPassed: false,
    renderedPageCrawlerConfigured: true,
    renderedJsonLdExtractionImplemented: true,
    publicPageInventoryConfigured: structuredDataCrawlInventory.length >= 10,
    googleRichResultsCompatibleChecksPassed: false,
    structuredDataCriticalErrorsAbsent: false,
    unsupportedSchemaWarningsReviewed: false,
    demoContentReplacedOrDocumented: false,
    sitemapCanonicalCrawlPassed: false,
    canonicalUrlConsistencyVerified: false,
    robotsNoindexCrawlVerified: false,
    crawlArtifactsCaptured: false,
    closeoutEvidenceAttached: false,
  });
}

export const structuredDataCrawlQaContract = buildStructuredDataCrawlQaContract();

export function structuredDataRouteCoverageSummary() {
  const indexedCanonicalPaths = new Set(allPublicSeoRoutes.filter((route) => route.indexMode === "index").map((route) => route.canonicalPath));
  const inventoryPaths = new Set(structuredDataCrawlInventory.map((route) => route.path));
  return {
    crawlRouteCount: structuredDataCrawlInventory.length,
    indexedRouteCount: indexedCanonicalPaths.size,
    missingIndexedRoutes: [...indexedCanonicalPaths].filter((path) => !inventoryPaths.has(path)).sort(),
    noindexRoutes: structuredDataCrawlInventory.filter((route) => !route.shouldIndex).map((route) => route.path),
    artifactPaths: [...structuredDataCrawlArtifactPaths],
  };
}
