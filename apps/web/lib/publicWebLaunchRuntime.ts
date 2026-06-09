import { buildPublicWebLaunchEvidencePlan } from "@inkroute/seo";

export type PublicWebLaunchRuntimeStatus =
  | "wired"
  | "build-gated"
  | "browser-gated"
  | "provider-gated"
  | "seo-gated"
  | "ci-gated";

export interface PublicWebLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PublicWebLaunchRuntimeStatus;
}

export interface PublicWebLaunchRunPersistenceContract {
  readonly model: "PublicWebLaunchRun";
  readonly tenantRelation: "publicWebLaunchRuns";
  readonly migration: "20260609033000_add_public_web_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "providerRouteManifest",
    "runtimeSeoManifest",
    "legalRouteReviewManifest",
  ];
  readonly evidenceBooleans: readonly [
    "webTypecheckPassed",
    "webBuildPassed",
    "webTestsPassed",
    "webRouteSmokePassed",
    "webPlaywrightDesktopPassed",
    "webPlaywrightMobilePassed",
    "accessibilityAuditPassed",
    "lighthousePerformancePassed",
    "apiRoutesUseTenantScopedPersistence",
    "providerBackedRoutesVerified",
    "localRuntimeFallbackDisabledForProduction",
    "realPortfolioDerivativesConfigured",
    "placeholderAssetsRemovedOrDocumented",
    "sitemapRuntimeVerified",
    "robotsRuntimeVerified",
    "jsonLdRuntimeVerified",
    "canonicalRuntimeVerified",
    "privacyAndLegalRoutesReviewed",
    "ciEvidenceCaptured",
    "launchArtifactsSecretSafe",
  ];
  readonly artifactFields: readonly [
    "webTypecheckArtifactPath",
    "webBuildArtifactPath",
    "webTestArtifactPath",
    "routeSmokeArtifactPath",
    "playwrightDesktopArtifactPath",
    "playwrightMobileArtifactPath",
    "axeAuditArtifactPath",
    "lighthouseArtifactPath",
    "providerRoutesArtifactPath",
    "mediaDerivativesArtifactPath",
    "runtimeSeoArtifactPath",
    "legalRoutesArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const publicWebLaunchRunPersistenceContract: PublicWebLaunchRunPersistenceContract = {
  model: "PublicWebLaunchRun",
  tenantRelation: "publicWebLaunchRuns",
  migration: "20260609033000_add_public_web_launch_runs",
  jsonFields: [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "providerRouteManifest",
    "runtimeSeoManifest",
    "legalRouteReviewManifest",
  ],
  evidenceBooleans: [
    "webTypecheckPassed",
    "webBuildPassed",
    "webTestsPassed",
    "webRouteSmokePassed",
    "webPlaywrightDesktopPassed",
    "webPlaywrightMobilePassed",
    "accessibilityAuditPassed",
    "lighthousePerformancePassed",
    "apiRoutesUseTenantScopedPersistence",
    "providerBackedRoutesVerified",
    "localRuntimeFallbackDisabledForProduction",
    "realPortfolioDerivativesConfigured",
    "placeholderAssetsRemovedOrDocumented",
    "sitemapRuntimeVerified",
    "robotsRuntimeVerified",
    "jsonLdRuntimeVerified",
    "canonicalRuntimeVerified",
    "privacyAndLegalRoutesReviewed",
    "ciEvidenceCaptured",
    "launchArtifactsSecretSafe",
  ],
  artifactFields: [
    "webTypecheckArtifactPath",
    "webBuildArtifactPath",
    "webTestArtifactPath",
    "routeSmokeArtifactPath",
    "playwrightDesktopArtifactPath",
    "playwrightMobileArtifactPath",
    "axeAuditArtifactPath",
    "lighthouseArtifactPath",
    "providerRoutesArtifactPath",
    "mediaDerivativesArtifactPath",
    "runtimeSeoArtifactPath",
    "legalRoutesArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const publicWebLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/web test",
  "pnpm test:e2e --project=web-chromium",
  "pnpm test:e2e --project=web-mobile",
  "axe accessibility audit for public routes",
  "Lighthouse performance audit for public launch routes",
  "runtime sitemap/robots/JSON-LD/canonical validation",
  "GitHub Actions public web launch evidence job",
] as const;

export const publicWebLaunchReadinessAreas = [
  "web-typecheck",
  "web-build",
  "public-route-smoke",
  "desktop-playwright",
  "mobile-playwright",
  "accessibility-audit",
  "lighthouse-performance",
  "tenant-scoped-persistence",
  "provider-backed-routes",
  "production-local-runtime-fallback",
  "real-portfolio-derivatives",
  "placeholder-asset-disposition",
  "runtime-sitemap",
  "runtime-robots",
  "rendered-json-ld",
  "runtime-canonical",
  "legal-route-review",
  "ci-evidence",
  "secret-safe-launch-artifacts",
] as const;

export const publicWebLaunchArtifactPaths = [
  "coverage/public-web-launch-runtime.json",
  "coverage/public-web-typecheck.txt",
  "coverage/public-web-build.txt",
  "coverage/public-web-test.txt",
  "coverage/public-web-route-smoke.json",
  "coverage/public-web-playwright-desktop.json",
  "coverage/public-web-playwright-mobile.json",
  "coverage/public-web-axe-audit.json",
  "coverage/public-web-lighthouse.json",
  "coverage/public-web-provider-routes.json",
  "coverage/public-web-media-derivatives.json",
  "coverage/public-web-runtime-seo.json",
  "coverage/public-web-legal-routes.json",
  "coverage/public-web-ci-evidence.json",
  "coverage/public-web-secret-safe-artifacts.json",
  "test-results/public-web-launch-runtime",
] as const;

export const publicWebLaunchRuntimeMatrix = [
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/public-web-typecheck.txt",
    status: "build-gated",
  },
  {
    id: "web-build",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/public-web-build.txt",
    status: "build-gated",
  },
  {
    id: "web-tests",
    command: "pnpm --filter @inkroute/web test",
    artifact: "coverage/public-web-test.txt",
    status: "wired",
  },
  {
    id: "route-smoke",
    command: "public route smoke tests for pages, APIs, metadata, and webhooks",
    artifact: "coverage/public-web-route-smoke.json",
    status: "browser-gated",
  },
  {
    id: "desktop-playwright",
    command: "pnpm test:e2e --project=web-chromium",
    artifact: "coverage/public-web-playwright-desktop.json",
    status: "browser-gated",
  },
  {
    id: "mobile-playwright",
    command: "pnpm test:e2e --project=web-mobile",
    artifact: "coverage/public-web-playwright-mobile.json",
    status: "browser-gated",
  },
  {
    id: "accessibility-performance",
    command: "axe accessibility audit and Lighthouse performance audit for public launch routes",
    artifact: "coverage/public-web-lighthouse.json",
    status: "browser-gated",
  },
  {
    id: "provider-db-routes",
    command: "verify tenant-scoped persistence, provider-backed routes, and production local-runtime fallback",
    artifact: "coverage/public-web-provider-routes.json",
    status: "provider-gated",
  },
  {
    id: "media-derivatives",
    command: "verify real scanned portfolio derivatives and placeholder asset disposition",
    artifact: "coverage/public-web-media-derivatives.json",
    status: "provider-gated",
  },
  {
    id: "runtime-seo-output",
    command: "runtime sitemap/robots/JSON-LD/canonical validation",
    artifact: "coverage/public-web-runtime-seo.json",
    status: "seo-gated",
  },
  {
    id: "legal-route-review",
    command: "review public privacy, terms, consent, and aftercare routes against legal boundary",
    artifact: "coverage/public-web-legal-routes.json",
    status: "provider-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions public web launch evidence job",
    artifact: "coverage/public-web-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly PublicWebLaunchRuntimeMatrixEntry[];

export const publicWebLaunchRuntimeReadiness = buildPublicWebLaunchEvidencePlan({
  packageScripts: {
    typecheck: "next typegen && tsc --noEmit",
    build: "next build",
    test: "vitest run",
  },
  webTypecheckPassed: false,
  webBuildPassed: false,
  webRouteSmokePassed: false,
  webPlaywrightDesktopPassed: false,
  webPlaywrightMobilePassed: false,
  accessibilityAuditPassed: false,
  lighthousePerformancePassed: false,
  apiRoutesUseTenantScopedPersistence: false,
  providerBackedRoutesVerified: false,
  localRuntimeFallbackDisabledForProduction: false,
  realPortfolioDerivativesConfigured: false,
  placeholderAssetsRemovedOrDocumented: false,
  sitemapRuntimeVerified: false,
  robotsRuntimeVerified: false,
  jsonLdRuntimeVerified: false,
  canonicalRuntimeVerified: false,
  privacyAndLegalRoutesReviewed: false,
  ciEvidenceCaptured: false,
  launchArtifactsSecretSafe: false,
});
