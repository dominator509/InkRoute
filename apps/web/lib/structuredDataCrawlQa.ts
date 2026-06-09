import {
  buildStructuredDataCrawlQaReadinessPlan,
  type StructuredDataCrawlQaReadinessPlan,
} from "@inkroute/seo";
import { allPublicSeoRoutes } from "./seoEngine";
import { canonicalUrlForPath } from "./canonicalRuntime";

export type StructuredDataCrawlRouteKind = "jsonld" | "canonical" | "sitemap" | "robots" | "noindex";

export type StructuredDataCrawlRuntimeStatus = "wired" | "crawler-gated" | "validator-gated" | "review-gated" | "closeout-gated" | "ci-gated";

export interface StructuredDataCrawlRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: StructuredDataCrawlRuntimeStatus;
}

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
  "coverage/structured-data-web-build.txt",
  "coverage/structured-data-jsonld-extraction.json",
  "coverage/rich-results-compatible-report.json",
  "coverage/sitemap-canonical-noindex-crawl.json",
  "coverage/unsupported-schema-review.json",
  "coverage/structured-data-production-content-decision.json",
  "coverage/structured-data-ci-evidence.json",
  "coverage/structured-data-secret-safe-artifacts.json",
  "coverage/structured-data-closeout.md",
  "test-results/structured-data-crawl",
] as const;

export const structuredDataCrawlRuntimeMatrix: readonly StructuredDataCrawlRuntimeMatrixEntry[] = [
  { id: "web-build", command: "pnpm --filter @inkroute/web build", artifact: "coverage/structured-data-web-build.txt", status: "wired" },
  { id: "rendered-browser-crawl", command: "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts", artifact: "coverage/structured-data-crawl.json", status: "crawler-gated" },
  { id: "jsonld-extraction", command: "extract rendered JSON-LD from public route inventory", artifact: "coverage/structured-data-jsonld-extraction.json", status: "wired" },
  { id: "rich-results-compatible-validation", command: "node scripts/seo/validate-rich-results-compatible.mjs coverage/structured-data-crawl.json", artifact: "coverage/rich-results-compatible-report.json", status: "validator-gated" },
  { id: "unsupported-schema-review", command: "review unsupported schema warnings", artifact: "coverage/unsupported-schema-review.json", status: "review-gated" },
  { id: "production-content-decision", command: "document or replace demo schema content", artifact: "coverage/structured-data-production-content-decision.json", status: "review-gated" },
  { id: "sitemap-canonical-robots-noindex", command: "node scripts/seo/verify-sitemap-canonical-noindex.mjs coverage/structured-data-crawl.json", artifact: "coverage/sitemap-canonical-noindex-crawl.json", status: "crawler-gated" },
  { id: "closeout-evidence", command: "attach structured-data crawl closeout", artifact: "coverage/structured-data-closeout.md", status: "closeout-gated" },
  { id: "ci-structured-data-job", command: "GitHub Actions structured-data crawl job", artifact: "coverage/structured-data-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted structured-data artifact audit", artifact: "coverage/structured-data-secret-safe-artifacts.json", status: "ci-gated" },
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
