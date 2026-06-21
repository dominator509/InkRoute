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

export interface StructuredDataRenderedRouteSnapshot {
  readonly path: string;
  readonly html: string;
  readonly canonicalUrl?: string;
  readonly robotsHeader?: string;
  readonly inSitemap?: boolean;
}

export interface StructuredDataLocalCrawlArtifact {
  readonly path: string;
  readonly jsonLdTypes: readonly string[];
  readonly supportedTypes: readonly string[];
  readonly unsupportedTypes: readonly string[];
  readonly missingExpectedTypes: readonly string[];
  readonly canonicalUrl?: string;
  readonly canonicalMatchesInventory: boolean;
  readonly sitemapMatchesInventory: boolean;
  readonly noindexMatchesInventory: boolean;
}

export interface StructuredDataArtifactReview {
  readonly status: "passed" | "blocked";
  readonly redactedArtifacts: readonly unknown[];
  readonly blockers: readonly string[];
}

export interface StructuredDataCrawlExecutionPolicy {
  readonly codexMayClassifyStaticStructuredDataCrawlReadiness: boolean;
  readonly localInventoryEvidenceRequiredForClosure: boolean;
  readonly webBuildRequiredForClosure: boolean;
  readonly renderedBrowserCrawlRequiredForClosure: boolean;
  readonly richResultsValidationRequiredForClosure: boolean;
  readonly unsupportedSchemaReviewRequiredForClosure: boolean;
  readonly sitemapCanonicalNoindexCrawlRequiredForClosure: boolean;
  readonly closeoutEvidenceRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface StructuredDataCrawlExecutionPlan {
  readonly policy: StructuredDataCrawlExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly webBuildExecutionAllowed: false;
  readonly browserCrawlExecutionAllowed: false;
  readonly richResultsExecutionAllowed: false;
  readonly unsupportedSchemaReviewExecutionAllowed: false;
  readonly sitemapCanonicalNoindexExecutionAllowed: false;
  readonly closeoutExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof structuredDataCrawlLocalCommands;
  readonly externalCommands: typeof structuredDataCrawlerCommands;
  readonly requiredExternalEvidence: typeof structuredDataCrawlRequiredExternalEvidence;
}

export const structuredDataCrawlExecutionPolicy = {
  codexMayClassifyStaticStructuredDataCrawlReadiness: true,
  localInventoryEvidenceRequiredForClosure: true,
  webBuildRequiredForClosure: true,
  renderedBrowserCrawlRequiredForClosure: true,
  richResultsValidationRequiredForClosure: true,
  unsupportedSchemaReviewRequiredForClosure: true,
  sitemapCanonicalNoindexCrawlRequiredForClosure: true,
  closeoutEvidenceRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies StructuredDataCrawlExecutionPolicy;

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

export const structuredDataCrawlLocalCommands = [
  "pnpm vitest run apps/web/tests/structured-data-crawl-qa-static.test.ts apps/web/tests/sitemap-route.test.ts",
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

export const structuredDataCrawlProofFiles = [
  "scripts/seo/validate-rich-results-compatible.mjs",
  "scripts/seo/verify-sitemap-canonical-noindex.mjs",
  "apps/web/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/web/lib/seoEngine.ts",
  "apps/web/lib/canonicalRuntime.ts",
  "apps/web/lib/structuredDataCrawlQa.ts",
  "apps/web/components/JsonLdScript.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/about/page.tsx",
  "apps/web/app/portfolio/page.tsx",
  "apps/web/app/travel/page.tsx",
  "apps/web/app/faq/page.tsx",
  "apps/web/app/cities/[citySlug]/page.tsx",
  "apps/web/app/styles/[styleSlug]/page.tsx",
  "apps/web/tests/structured-data-crawl-qa-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const structuredDataCrawlRequiredExternalEvidence = [
  "actual structured-data crawl command output",
  "web build artifact",
  "rendered browser crawl artifact",
  "rendered JSON-LD extraction artifact",
  "Google Rich Results-compatible validation artifact",
  "unsupported-schema warning review artifact",
  "production/demo structured-data content decision",
  "sitemap/canonical/robots/noindex crawl artifact",
  "structured-data crawl closeout evidence",
  "CI structured-data crawl artifacts",
  "secret-safe structured-data crawl artifact review",
] as const;

export const buildStructuredDataCrawlExecutionPlan = (): StructuredDataCrawlExecutionPlan => ({
  policy: structuredDataCrawlExecutionPolicy,
  commandExecutionAllowed: false,
  webBuildExecutionAllowed: false,
  browserCrawlExecutionAllowed: false,
  richResultsExecutionAllowed: false,
  unsupportedSchemaReviewExecutionAllowed: false,
  sitemapCanonicalNoindexExecutionAllowed: false,
  closeoutExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: structuredDataCrawlLocalCommands,
  externalCommands: structuredDataCrawlerCommands,
  requiredExternalEvidence: structuredDataCrawlRequiredExternalEvidence,
});

const sensitiveStructuredDataArtifactKeyPattern = /(token|secret|password|authorization|cookie|provider|payload|email|phone|client|draft|private)/i;
const sensitiveStructuredDataArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:provider|token|secret|private)[\w:./?=&-]*/gi,
];

export function buildRedactedStructuredDataCrawlArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedStructuredDataCrawlArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveStructuredDataArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveStructuredDataArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedStructuredDataCrawlArtifact(value),
    ]),
  );
}

export function buildStructuredDataLocalCrawlArtifacts(
  snapshots: readonly StructuredDataRenderedRouteSnapshot[],
  inventory: readonly StructuredDataCrawlRoute[] = structuredDataCrawlInventory,
): readonly StructuredDataLocalCrawlArtifact[] {
  return snapshots.map((snapshot) => {
    const route = inventory.find((candidate) => candidate.path === snapshot.path);
    const jsonLdTypes = extractJsonLdScriptsFromHtml(snapshot.html)
      .map((script) => script["@type"])
      .flat()
      .filter((type): type is string => typeof type === "string");
    const supportedTypes = jsonLdTypes.filter((type) => supportedRichResultSchemaTypes.includes(type as (typeof supportedRichResultSchemaTypes)[number]));
    const unsupportedTypes = jsonLdTypes.filter((type) => unsupportedSchemaReviewRequiredTypes.includes(type as (typeof unsupportedSchemaReviewRequiredTypes)[number]));
    const expectedTypes = route?.expectedJsonLdTypes ?? [];
    const missingExpectedTypes = expectedTypes.filter((type) => !jsonLdTypes.includes(type));
    const noindexPresent = /noindex/i.test(snapshot.robotsHeader ?? snapshot.html);

    return {
      path: snapshot.path,
      jsonLdTypes,
      supportedTypes,
      unsupportedTypes,
      missingExpectedTypes,
      canonicalUrl: snapshot.canonicalUrl ?? "",
      canonicalMatchesInventory: !route?.expectedCanonicalUrl || snapshot.canonicalUrl === route.expectedCanonicalUrl,
      sitemapMatchesInventory: snapshot.inSitemap === undefined || snapshot.inSitemap === route?.shouldIndex,
      noindexMatchesInventory: route ? noindexPresent === !route.shouldIndex : false,
    };
  });
}

export function buildStructuredDataCrawlArtifactReview(input: {
  readonly artifacts: readonly unknown[];
  readonly expectedArtifactPaths?: readonly string[];
}): StructuredDataArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedStructuredDataCrawlArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No structured-data crawl artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|private-client)\b/i.test(serialized)
      ? ["Structured-data crawl artifacts still contain secrets, provider payloads, private draft content, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["Structured-data crawl artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export type StructuredDataCrawlEvidenceArtifact = (typeof structuredDataCrawlArtifactPaths)[number];

export interface StructuredDataCrawlEvidenceInput {
  readonly webBuildPassed: boolean;
  readonly renderedBrowserCrawlPassed: boolean;
  readonly jsonLdExtractionCaptured: boolean;
  readonly richResultsCompatibleValidationPassed: boolean;
  readonly unsupportedSchemaWarningsReviewed: boolean;
  readonly productionContentDecisionCaptured: boolean;
  readonly sitemapCanonicalRobotsNoindexCrawlPassed: boolean;
  readonly closeoutEvidenceAttached: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly StructuredDataCrawlEvidenceArtifact[];
}

export const structuredDataCrawlDecisionRequiredEvidence = [
  "web build and rendered browser crawl artifacts",
  "rendered JSON-LD extraction and Rich Results-compatible validation artifacts",
  "unsupported-schema review and production/demo content decision artifacts",
  "sitemap/canonical/robots/noindex crawl, closeout, CI, and redacted artifact review evidence",
] as const;

export interface StructuredDataCrawlEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly StructuredDataCrawlEvidenceArtifact[];
  readonly requiredCommands: typeof structuredDataCrawlerCommands;
  readonly requiredEvidence: typeof structuredDataCrawlDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildStructuredDataCrawlEvidenceDecision(input: StructuredDataCrawlEvidenceInput): StructuredDataCrawlEvidenceDecision {
  const blockers = [
    !input.webBuildPassed ? "Web build evidence is required." : null,
    !input.renderedBrowserCrawlPassed ? "Rendered browser crawl evidence is required." : null,
    !input.jsonLdExtractionCaptured ? "Rendered JSON-LD extraction artifact is required." : null,
    !input.richResultsCompatibleValidationPassed ? "Google Rich Results-compatible validation evidence is required." : null,
    !input.unsupportedSchemaWarningsReviewed ? "Unsupported-schema warning review evidence is required." : null,
    !input.productionContentDecisionCaptured ? "Production/demo structured-data content decision evidence is required." : null,
    !input.sitemapCanonicalRobotsNoindexCrawlPassed ? "Sitemap, canonical, robots, and noindex crawl evidence is required." : null,
    !input.closeoutEvidenceAttached ? "Structured-data crawl closeout evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI structured-data crawl job evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = structuredDataCrawlArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: structuredDataCrawlerCommands,
    requiredEvidence: structuredDataCrawlDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-073 structured-data crawl evidence is complete with CI-safe artifacts captured."
        : "GAP-073 structured-data crawl evidence remains blocked until rendered crawl, validation, review, closeout, CI, and redaction artifacts are captured.",
  };
}

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


