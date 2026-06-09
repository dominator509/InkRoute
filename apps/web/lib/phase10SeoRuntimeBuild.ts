import {
  buildPhase10SeoAppRuntimeBuildReadinessPlan,
  type Phase10SeoAppRuntimeBuildReadinessPlan,
} from "@inkroute/testing";

export type Phase10SeoRuntimeSurfaceId =
  | "testing-package"
  | "web-build"
  | "dashboard-build"
  | "sitemap-route"
  | "seo-preview-route"
  | "sitemap-preview-route"
  | "dashboard-seo-browser-smoke"
  | "dashboard-seo-publish-interaction-smoke"
  | "rendered-public-seo-crawl"
  | "rendered-sitemap-canonical-crawl"
  | "database-backed-seo-routes"
  | "sitemap-runtime-artifacts"
  | "api-preview-runtime-artifacts"
  | "canonical-runtime-artifacts"
  | "search-console-provider-status";

export type Phase10SeoRuntimeSurface = {
  id: Phase10SeoRuntimeSurfaceId;
  command: string;
  artifacts: string[];
  evidenceType: "static-contract" | "runtime-required" | "build-required";
};

export type Phase10SeoRuntimeBuildStatus =
  | "wired"
  | "build-gated"
  | "browser-gated"
  | "crawl-gated"
  | "provider-gated"
  | "ci-gated";

export interface Phase10SeoRuntimeBuildMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: Phase10SeoRuntimeBuildStatus;
}

export const phase10SeoRuntimeSurfaces: Phase10SeoRuntimeSurface[] = [
  {
    id: "testing-package",
    command: "pnpm --filter @inkroute/testing test && pnpm --filter @inkroute/testing typecheck",
    artifacts: ["coverage/phase10-seo-testing-package.json"],
    evidenceType: "build-required",
  },
  {
    id: "web-build",
    command: "pnpm --filter @inkroute/web build",
    artifacts: ["coverage/phase10-seo-web-build.json"],
    evidenceType: "build-required",
  },
  {
    id: "dashboard-build",
    command: "pnpm --filter @inkroute/dashboard build",
    artifacts: ["coverage/phase10-seo-dashboard-build.json"],
    evidenceType: "build-required",
  },
  {
    id: "sitemap-route",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    artifacts: ["coverage/phase10-seo-sitemap-route.json"],
    evidenceType: "static-contract",
  },
  {
    id: "seo-preview-route",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    artifacts: ["coverage/phase10-seo-preview-route.json"],
    evidenceType: "static-contract",
  },
  {
    id: "sitemap-preview-route",
    command: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    artifacts: ["coverage/phase10-seo-sitemap-preview-route.json"],
    evidenceType: "static-contract",
  },
  {
    id: "dashboard-seo-browser-smoke",
    command: "pnpm playwright test apps/dashboard/tests/seo-browser-smoke.spec.ts",
    artifacts: ["coverage/phase10-dashboard-seo-browser-smoke.json", "test-results/phase10-seo-dashboard"],
    evidenceType: "runtime-required",
  },
  {
    id: "dashboard-seo-publish-interaction-smoke",
    command: "pnpm playwright test apps/dashboard/tests/seo-publish-flow.spec.ts",
    artifacts: ["coverage/phase10-dashboard-seo-publish-smoke.json", "test-results/phase10-seo-dashboard"],
    evidenceType: "runtime-required",
  },
  {
    id: "rendered-public-seo-crawl",
    command: "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts",
    artifacts: ["coverage/phase10-rendered-public-seo-crawl.json", "test-results/structured-data-crawl"],
    evidenceType: "runtime-required",
  },
  {
    id: "rendered-sitemap-canonical-crawl",
    command: "pnpm playwright test apps/web/tests/e2e/sitemap-canonical-crawl.spec.ts",
    artifacts: ["coverage/phase10-rendered-sitemap-canonical-crawl.json", "test-results/phase10-seo-web"],
    evidenceType: "runtime-required",
  },
  {
    id: "database-backed-seo-routes",
    command: "pnpm vitest run apps/dashboard/tests/seo-read-route-static.test.ts apps/dashboard/tests/seo-publication-route-static.test.ts",
    artifacts: ["coverage/phase10-database-backed-seo-routes.json"],
    evidenceType: "static-contract",
  },
  {
    id: "sitemap-runtime-artifacts",
    command: "capture sitemap runtime artifact from built web app",
    artifacts: ["coverage/phase10-sitemap-runtime.json"],
    evidenceType: "runtime-required",
  },
  {
    id: "api-preview-runtime-artifacts",
    command: "capture SEO preview and sitemap preview API runtime artifacts",
    artifacts: ["coverage/phase10-api-preview-runtime.json"],
    evidenceType: "runtime-required",
  },
  {
    id: "canonical-runtime-artifacts",
    command: "capture canonical/noindex middleware runtime artifacts",
    artifacts: ["coverage/phase10-canonical-runtime.json"],
    evidenceType: "runtime-required",
  },
  {
    id: "search-console-provider-status",
    command: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
    artifacts: ["coverage/phase10-search-console-status.json"],
    evidenceType: "static-contract",
  },
];

export const phase10SeoRuntimeBuildCommands = [
  "pnpm --filter @inkroute/testing test",
  "pnpm --filter @inkroute/testing typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm vitest run apps/web/tests/phase10-seo-runtime-build-static.test.ts apps/web/tests/sitemap-route.test.ts apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/structured-data-crawl-qa-static.test.ts apps/dashboard/tests/seo-read-route-static.test.ts apps/dashboard/tests/seo-publication-route-static.test.ts apps/dashboard/tests/search-console-route-static.test.ts",
  "pnpm playwright test apps/dashboard/tests/seo-browser-smoke.spec.ts",
  "pnpm playwright test apps/dashboard/tests/seo-publish-flow.spec.ts",
  "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts",
  "pnpm playwright test apps/web/tests/e2e/sitemap-canonical-crawl.spec.ts",
] as const;

export const phase10SeoRuntimeArtifactPaths = [
  "coverage/phase10-seo-testing-package.json",
  "coverage/phase10-seo-testing-typecheck.txt",
  "coverage/phase10-seo-web-build.json",
  "coverage/phase10-seo-dashboard-build.json",
  "coverage/phase10-seo-static-contracts.json",
  "coverage/phase10-dashboard-seo-browser-smoke.json",
  "coverage/phase10-dashboard-seo-publish-smoke.json",
  "coverage/phase10-rendered-public-seo-crawl.json",
  "coverage/phase10-rendered-sitemap-canonical-crawl.json",
  "coverage/phase10-database-backed-seo-routes.json",
  "coverage/phase10-sitemap-runtime.json",
  "coverage/phase10-api-preview-runtime.json",
  "coverage/phase10-canonical-runtime.json",
  "coverage/phase10-search-console-status.json",
  "coverage/phase10-search-console-provider-execution-redacted.json",
  "coverage/phase10-seo-runtime-ci-evidence.json",
  "coverage/phase10-seo-runtime-secret-safe-artifacts.json",
  "test-results/phase10-seo-web",
  "test-results/phase10-seo-dashboard",
  "test-results/structured-data-crawl",
] as const;

export const phase10SeoRuntimeBuildMatrix: readonly Phase10SeoRuntimeBuildMatrixEntry[] = [
  { id: "testing-package-test", command: "pnpm --filter @inkroute/testing test", artifact: "coverage/phase10-seo-testing-package.json", status: "wired" },
  { id: "testing-package-typecheck", command: "pnpm --filter @inkroute/testing typecheck", artifact: "coverage/phase10-seo-testing-typecheck.txt", status: "wired" },
  { id: "web-build", command: "pnpm --filter @inkroute/web build", artifact: "coverage/phase10-seo-web-build.json", status: "build-gated" },
  { id: "dashboard-build", command: "pnpm --filter @inkroute/dashboard build", artifact: "coverage/phase10-seo-dashboard-build.json", status: "build-gated" },
  { id: "static-contracts", command: "Phase 10 SEO static contract suite", artifact: "coverage/phase10-seo-static-contracts.json", status: "wired" },
  { id: "dashboard-browser-smoke", command: "pnpm playwright test apps/dashboard/tests/seo-browser-smoke.spec.ts", artifact: "coverage/phase10-dashboard-seo-browser-smoke.json", status: "browser-gated" },
  { id: "dashboard-publish-smoke", command: "pnpm playwright test apps/dashboard/tests/seo-publish-flow.spec.ts", artifact: "coverage/phase10-dashboard-seo-publish-smoke.json", status: "browser-gated" },
  { id: "rendered-public-seo-crawl", command: "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts", artifact: "coverage/phase10-rendered-public-seo-crawl.json", status: "crawl-gated" },
  { id: "rendered-sitemap-canonical-crawl", command: "pnpm playwright test apps/web/tests/e2e/sitemap-canonical-crawl.spec.ts", artifact: "coverage/phase10-rendered-sitemap-canonical-crawl.json", status: "crawl-gated" },
  { id: "database-backed-seo-routes", command: "dashboard SEO route static contracts", artifact: "coverage/phase10-database-backed-seo-routes.json", status: "wired" },
  { id: "sitemap-runtime", command: "capture sitemap runtime artifact from built web app", artifact: "coverage/phase10-sitemap-runtime.json", status: "crawl-gated" },
  { id: "api-preview-runtime", command: "capture SEO preview and sitemap preview API runtime artifacts", artifact: "coverage/phase10-api-preview-runtime.json", status: "crawl-gated" },
  { id: "canonical-runtime", command: "capture canonical/noindex middleware runtime artifacts", artifact: "coverage/phase10-canonical-runtime.json", status: "crawl-gated" },
  { id: "search-console-status", command: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts", artifact: "coverage/phase10-search-console-status.json", status: "wired" },
  { id: "search-console-provider-execution", command: "redacted Search Console provider execution proof", artifact: "coverage/phase10-search-console-provider-execution-redacted.json", status: "provider-gated" },
  { id: "ci-phase10-seo-runtime-gate", command: "GitHub Actions Phase 10 SEO runtime/build gate", artifact: "coverage/phase10-seo-runtime-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted Phase 10 SEO runtime artifact audit", artifact: "coverage/phase10-seo-runtime-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export function buildPhase10SeoRuntimeBuildContract(): Phase10SeoAppRuntimeBuildReadinessPlan {
  return buildPhase10SeoAppRuntimeBuildReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    testingPackageTestsPassed: false,
    testingPackageTypecheckPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    sitemapRouteTestsPassed: false,
    seoPreviewRouteTestsPassed: false,
    sitemapPreviewRouteTestsPassed: false,
    dashboardSeoBrowserSmokePassed: false,
    dashboardSeoPublishInteractionSmokePassed: false,
    renderedPublicSeoCrawlPassed: false,
    renderedSitemapCrawlPassed: false,
    databaseBackedSeoRoutesWired: true,
    sitemapRuntimeEvidenceCaptured: false,
    apiPreviewRuntimeEvidenceCaptured: false,
    canonicalRuntimeEvidenceCaptured: false,
    ciRequiresPhase10SeoRuntimeGate: true,
  });
}

export const phase10SeoRuntimeBuildContract = buildPhase10SeoRuntimeBuildContract();
