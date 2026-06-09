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

export const phase10SeoRuntimeArtifactPaths = [
  "coverage/phase10-seo-*.json",
  "coverage/phase10-dashboard-seo-*.json",
  "coverage/phase10-rendered-*.json",
  "coverage/phase10-sitemap-runtime.json",
  "coverage/phase10-api-preview-runtime.json",
  "coverage/phase10-canonical-runtime.json",
  "test-results/phase10-seo-web",
  "test-results/phase10-seo-dashboard",
  "test-results/structured-data-crawl",
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
