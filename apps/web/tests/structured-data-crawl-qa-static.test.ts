import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildStructuredDataCrawlArtifactReview,
  buildStructuredDataCrawlEvidenceDecision,
  buildStructuredDataCrawlExecutionPlan,
  buildStructuredDataLocalCrawlArtifacts,
  extractJsonLdScriptsFromHtml,
  structuredDataCrawlExecutionPolicy,
  structuredDataCrawlArtifactPaths,
  structuredDataCrawlInventory,
  structuredDataCrawlLocalCommands,
  structuredDataCrawlProofFiles,
  structuredDataCrawlDecisionRequiredEvidence,
  structuredDataCrawlQaContract,
  structuredDataCrawlRequiredExternalEvidence,
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

  it("builds local crawl artifacts for rendered JSON-LD, canonical, sitemap, and noindex checks", () => {
    const artifacts = buildStructuredDataLocalCrawlArtifacts([
      {
        path: "/faq",
        canonicalUrl: "https://inkroute.example/faq",
        inSitemap: true,
        html: '<html><head><script type="application/ld+json">{"@type":"FAQPage"}</script></head></html>',
      },
      {
        path: "/booking/deposit-preview",
        canonicalUrl: "https://inkroute.example/booking/deposit-preview",
        inSitemap: false,
        robotsHeader: "noindex, nofollow",
        html: "<html><head></head></html>",
      },
      {
        path: "/about",
        canonicalUrl: "https://inkroute.example/about",
        inSitemap: true,
        html: '<html><head><script type="application/ld+json">{"@type":"Person"}</script></head></html>',
      },
    ]);

    expect(artifacts[0]).toMatchObject({
      path: "/faq",
      jsonLdTypes: ["FAQPage"],
      supportedTypes: ["FAQPage"],
      unsupportedTypes: [],
      missingExpectedTypes: [],
      canonicalMatchesInventory: true,
      sitemapMatchesInventory: true,
      noindexMatchesInventory: true,
    });
    expect(artifacts[1]).toMatchObject({
      path: "/booking/deposit-preview",
      jsonLdTypes: [],
      sitemapMatchesInventory: true,
      noindexMatchesInventory: true,
    });
    expect(artifacts[2]?.unsupportedTypes).toEqual(["Person"]);
  });

  it("reviews retained crawl artifacts with recursive private draft, provider token, and PII redaction", () => {
    const review = buildStructuredDataCrawlArtifactReview({
      expectedArtifactPaths: ["coverage/structured-data-crawl.json"],
      artifacts: [
        {
          path: "coverage/structured-data-crawl.json",
          privateDraftContent: "private-client launch copy",
          providerPayload: { authorization: "Bearer provider-token", email: "ari@example.test" },
          nested: [{ phone: "+1 206 555 0142", secret: "crawl-secret" }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("private-client");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("crawl-secret");
    expect(review.blockers).toEqual([]);
  });

  it("pins the non-executing GAP-073 structured-data crawl execution policy", () => {
    const plan = buildStructuredDataCrawlExecutionPlan();

    expect(structuredDataCrawlExecutionPolicy).toEqual({
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
    });
    expect(plan.policy).toBe(structuredDataCrawlExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.webBuildExecutionAllowed).toBe(false);
    expect(plan.browserCrawlExecutionAllowed).toBe(false);
    expect(plan.richResultsExecutionAllowed).toBe(false);
    expect(plan.unsupportedSchemaReviewExecutionAllowed).toBe(false);
    expect(plan.sitemapCanonicalNoindexExecutionAllowed).toBe(false);
    expect(plan.closeoutExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(structuredDataCrawlLocalCommands);
    expect(plan.externalCommands).toBe(structuredDataCrawlerCommands);
    expect(plan.requiredExternalEvidence).toBe(structuredDataCrawlRequiredExternalEvidence);
    expect(structuredDataCrawlRequiredExternalEvidence).toEqual([
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
    ]);
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

  it("classifies GAP-073 structured-data crawl evidence as blocked until every proof artifact is captured", () => {
    const blocked = buildStructuredDataCrawlEvidenceDecision({
      webBuildPassed: true,
      renderedBrowserCrawlPassed: false,
      jsonLdExtractionCaptured: true,
      richResultsCompatibleValidationPassed: false,
      unsupportedSchemaWarningsReviewed: false,
      productionContentDecisionCaptured: false,
      sitemapCanonicalRobotsNoindexCrawlPassed: false,
      closeoutEvidenceAttached: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: ["coverage/structured-data-crawl.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Rendered browser crawl evidence is required.",
        "Google Rich Results-compatible validation evidence is required.",
        "Unsupported-schema warning review evidence is required.",
        "Structured-data crawl closeout evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/rich-results-compatible-report.json");
    expect(blocked.requiredCommands).toBe(structuredDataCrawlerCommands);
    expect(blocked.requiredEvidence).toBe(structuredDataCrawlDecisionRequiredEvidence);

    const complete = buildStructuredDataCrawlEvidenceDecision({
      webBuildPassed: true,
      renderedBrowserCrawlPassed: true,
      jsonLdExtractionCaptured: true,
      richResultsCompatibleValidationPassed: true,
      unsupportedSchemaWarningsReviewed: true,
      productionContentDecisionCaptured: true,
      sitemapCanonicalRobotsNoindexCrawlPassed: true,
      closeoutEvidenceAttached: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: structuredDataCrawlArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-073", () => {
    expect(ciWorkflow).toContain("Run Phase 10 structured-data crawl runtime contracts");
    expect(ciWorkflow).toContain("structured-data-crawl-qa-static.test.ts");
    expect(ciWorkflow).toContain("structured-data-crawl-artifacts");
    expect(unitManifest).toContain("unit-web-structured-data-crawl-qa-static");
    expect(unitManifest).toContain("structuredDataCrawlRuntimeMatrix");
    expect(gapTracker).toContain("local structured-data crawl artifact builder");
    expect(gapTracker).toContain("structuredDataCrawlDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildStructuredDataCrawlExecutionPlan");
    expect(gapTracker).toContain("buildRedactedStructuredDataCrawlArtifact");
    expect(gapTracker).toContain("buildStructuredDataCrawlArtifactReview");
    expect(gapTracker).toContain("non-executing structured-data crawl execution policy");
    expect(gapTracker).toContain("Structured-data crawl evidence classifier wired and runtime-matrix gated");
  });

  it("pins current structured-data crawl proof files for GAP-073", () => {
    expect(structuredDataCrawlProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of structuredDataCrawlProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});
