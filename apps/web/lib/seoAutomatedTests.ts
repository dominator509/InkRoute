import {
  buildSeoAutomatedTestReadinessPlan,
  type SeoAutomatedTestReadinessPlan,
} from "@inkroute/seo";

export type SeoAutomatedSuiteId =
  | "seo-package-tests"
  | "seo-package-typecheck"
  | "sitemap-route-tests"
  | "seo-preview-route-tests"
  | "sitemap-preview-route-tests"
  | "canonical-domain-runtime-static"
  | "structured-data-crawl-qa-static"
  | "seo-analytics-attribution-static"
  | "search-console-route-static"
  | "image-seo-pipeline-static"
  | "phase10-seo-runtime-build-static";

export type SeoAutomatedSuite = {
  id: SeoAutomatedSuiteId;
  command: string;
  covers: string[];
};

export type SeoAutomatedGateStatus = "wired" | "execution-gated" | "linked-runtime-gated" | "ci-gated";

export interface SeoAutomatedGateMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeoAutomatedGateStatus;
}

export const seoAutomatedSuites: SeoAutomatedSuite[] = [
  {
    id: "seo-package-tests",
    command: "pnpm --filter @inkroute/seo test",
    covers: ["route records", "sitemaps", "metadata", "audits", "briefs", "JSON-LD", "image pipeline", "canonical redirects", "Search Console planner"],
  },
  {
    id: "seo-package-typecheck",
    command: "pnpm --filter @inkroute/seo typecheck",
    covers: ["SEO package API compatibility"],
  },
  {
    id: "sitemap-route-tests",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    covers: ["web sitemap route", "SEO preview route", "sitemap preview route"],
  },
  {
    id: "seo-preview-route-tests",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    covers: ["public SEO preview API"],
  },
  {
    id: "sitemap-preview-route-tests",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    covers: ["public sitemap preview API"],
  },
  {
    id: "canonical-domain-runtime-static",
    command: "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts",
    covers: ["canonical/domain/redirect runtime contract", "GAP-072"],
  },
  {
    id: "structured-data-crawl-qa-static",
    command: "pnpm vitest run apps/web/tests/structured-data-crawl-qa-static.test.ts",
    covers: ["structured-data crawl QA contract", "GAP-073"],
  },
  {
    id: "seo-analytics-attribution-static",
    command: "pnpm vitest run apps/web/tests/seo-analytics-attribution-static.test.ts",
    covers: ["SEO analytics attribution contract", "GAP-074"],
  },
  {
    id: "search-console-route-static",
    command: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
    covers: ["Search Console provider boundary", "GAP-075"],
  },
  {
    id: "image-seo-pipeline-static",
    command: "pnpm vitest run apps/dashboard/tests/image-seo-pipeline-static.test.ts",
    covers: ["image SEO pipeline contract", "GAP-077"],
  },
  {
    id: "phase10-seo-runtime-build-static",
    command: "pnpm vitest run apps/web/tests/phase10-seo-runtime-build-static.test.ts",
    covers: ["Phase 10 SEO runtime/build gate", "GAP-076"],
  },
];

export const seoAutomatedGateCommands = [
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm vitest run apps/web/tests/seo-automated-tests-static.test.ts apps/web/tests/sitemap-route.test.ts apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/structured-data-crawl-qa-static.test.ts apps/web/tests/phase10-seo-runtime-build-static.test.ts apps/dashboard/tests/search-console-route-static.test.ts apps/dashboard/tests/image-seo-pipeline-static.test.ts",
] as const;

export const seoAutomatedArtifactPaths = [
  "coverage/seo-automated-test-gate.json",
  "coverage/seo-automated-seo-package-test.txt",
  "coverage/seo-automated-seo-package-typecheck.txt",
  "coverage/seo-automated-route-contracts.json",
  "coverage/seo-automated-linked-gap073-crawl.json",
  "coverage/seo-automated-linked-gap076-runtime-build.json",
  "coverage/seo-automated-ci-evidence.json",
  "coverage/seo-automated-secret-safe-artifacts.json",
  "coverage/phase10-seo-*.json",
  "coverage/structured-data-crawl.json",
  "coverage/image-seo-pipeline-plan.json",
  "coverage/search-console-provider-route.json",
  "test-results/seo-automated",
] as const;

export const seoAutomatedGateMatrix: readonly SeoAutomatedGateMatrixEntry[] = [
  { id: "seo-package-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/seo-automated-seo-package-test.txt", status: "execution-gated" },
  { id: "seo-package-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/seo-automated-seo-package-typecheck.txt", status: "execution-gated" },
  { id: "route-contracts", command: "Phase 10 SEO route/static contract suite", artifact: "coverage/seo-automated-route-contracts.json", status: "execution-gated" },
  { id: "linked-gap073-crawl", command: "GAP-073 structured-data crawl evidence", artifact: "coverage/seo-automated-linked-gap073-crawl.json", status: "linked-runtime-gated" },
  { id: "linked-gap076-runtime-build", command: "GAP-076 Phase 10 runtime/build evidence", artifact: "coverage/seo-automated-linked-gap076-runtime-build.json", status: "linked-runtime-gated" },
  { id: "ci-seo-automated-gate", command: "GitHub Actions SEO automated test gate", artifact: "coverage/seo-automated-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted SEO automated artifact audit", artifact: "coverage/seo-automated-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export function buildSeoAutomatedTestContract(): SeoAutomatedTestReadinessPlan {
  return buildSeoAutomatedTestReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    seoPackageTestsPassed: false,
    seoPackageTypecheckPassed: false,
    routeRecordTestsPassed: false,
    sitemapGenerationTestsPassed: false,
    metadataDraftTestsPassed: false,
    auditTestsPassed: false,
    contentBriefTestsPassed: false,
    internalLinkTestsPassed: false,
    jsonLdGraphTestsPassed: false,
    imagePipelineTestsPassed: false,
    canonicalRedirectTestsPassed: false,
    searchConsolePlanTestsPassed: false,
    webSitemapRouteTestsPassed: false,
    seoPreviewRouteTestsPassed: false,
    sitemapPreviewRouteTestsPassed: false,
    structuredDataSnapshotTestsPassed: false,
    runtimeBuildEvidenceCoveredByGap076: true,
    crawlEvidenceCoveredByGap073: true,
    ciRunsSeoTestGate: true,
  });
}

export const seoAutomatedTestContract = buildSeoAutomatedTestContract();
