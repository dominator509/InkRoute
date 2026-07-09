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

export const publicWebLaunchRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/web/lib/localRuntimeState.ts",
  "apps/web/lib/publicWebLaunchRuntime.ts",
  "apps/web/tests/public-web-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033000_add_public_web_launch_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type PublicWebLaunchRuntimeCommand = (typeof publicWebLaunchRuntimeCommands)[number];
export type PublicWebLaunchReadinessArea = (typeof publicWebLaunchReadinessAreas)[number];
export type PublicWebLaunchArtifact = (typeof publicWebLaunchArtifactPaths)[number];

export interface PublicWebLaunchEvidenceInput {
  readonly webTypecheckPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly webTestsPassed: boolean;
  readonly webRouteSmokePassed: boolean;
  readonly webPlaywrightDesktopPassed: boolean;
  readonly webPlaywrightMobilePassed: boolean;
  readonly accessibilityAuditPassed: boolean;
  readonly lighthousePerformancePassed: boolean;
  readonly apiRoutesUseTenantScopedPersistence: boolean;
  readonly providerBackedRoutesVerified: boolean;
  readonly localRuntimeFallbackDisabledForProduction: boolean;
  readonly realPortfolioDerivativesConfigured: boolean;
  readonly placeholderAssetsRemovedOrDocumented: boolean;
  readonly sitemapRuntimeVerified: boolean;
  readonly robotsRuntimeVerified: boolean;
  readonly jsonLdRuntimeVerified: boolean;
  readonly canonicalRuntimeVerified: boolean;
  readonly privacyAndLegalRoutesReviewed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly launchArtifactsSecretSafe: boolean;
  readonly publicWebLaunchRunPersisted: boolean;
  readonly coveredReadinessAreas: readonly PublicWebLaunchReadinessArea[];
  readonly capturedArtifacts: readonly PublicWebLaunchArtifact[];
  readonly completedCommands: readonly PublicWebLaunchRuntimeCommand[];
}

export interface PublicWebLaunchRunRecordInput extends PublicWebLaunchEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly webTypecheckArtifactPath?: string | null;
  readonly webBuildArtifactPath?: string | null;
  readonly webTestArtifactPath?: string | null;
  readonly routeSmokeArtifactPath?: string | null;
  readonly playwrightDesktopArtifactPath?: string | null;
  readonly playwrightMobileArtifactPath?: string | null;
  readonly axeAuditArtifactPath?: string | null;
  readonly lighthouseArtifactPath?: string | null;
  readonly providerRoutesArtifactPath?: string | null;
  readonly mediaDerivativesArtifactPath?: string | null;
  readonly runtimeSeoArtifactPath?: string | null;
  readonly legalRoutesArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface PublicWebLaunchRunData
  extends Omit<
    PublicWebLaunchRunRecordInput,
    "coveredReadinessAreas" | "capturedArtifacts" | "completedCommands" | "publicWebLaunchRunPersisted"
  > {
  readonly commandMatrix: typeof publicWebLaunchRuntimeMatrix;
  readonly readinessAreaManifest: readonly PublicWebLaunchReadinessArea[];
  readonly artifactManifest: readonly PublicWebLaunchArtifact[];
  readonly providerRouteManifest: {
    readonly tenantScopedPersistence: boolean;
    readonly providerBackedRoutesVerified: boolean;
    readonly productionLocalRuntimeFallbackDisabled: boolean;
  };
  readonly runtimeSeoManifest: {
    readonly sitemapRuntimeVerified: boolean;
    readonly robotsRuntimeVerified: boolean;
    readonly jsonLdRuntimeVerified: boolean;
    readonly canonicalRuntimeVerified: boolean;
  };
  readonly legalRouteReviewManifest: {
    readonly privacyAndLegalRoutesReviewed: boolean;
    readonly launchArtifactsSecretSafe: boolean;
  };
}

export interface PublicWebLaunchRunRepository {
  readonly publicWebLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: PublicWebLaunchRunData;
      update: Omit<PublicWebLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface PublicWebLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReadinessAreas: readonly PublicWebLaunchReadinessArea[];
  readonly missingArtifacts: readonly PublicWebLaunchArtifact[];
  readonly missingCommands: readonly PublicWebLaunchRuntimeCommand[];
  readonly requiredReadinessAreas: readonly PublicWebLaunchReadinessArea[];
  readonly requiredArtifacts: typeof publicWebLaunchArtifactPaths;
  readonly requiredCommands: typeof publicWebLaunchRuntimeCommands;
  readonly requiredEvidence: typeof publicWebLaunchRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface PublicWebLaunchExecutionPlan {
  readonly localCommands: typeof publicWebLaunchRuntimeLocalCommands;
  readonly externalCommands: typeof publicWebLaunchRuntimeExternalCommands;
  readonly localArtifacts: typeof publicWebLaunchRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof publicWebLaunchRuntimeExternalArtifacts;
  readonly webTypecheckExecutionAllowed: false;
  readonly webBuildExecutionAllowed: false;
  readonly webTestExecutionAllowed: false;
  readonly routeSmokeExecutionAllowed: false;
  readonly desktopPlaywrightExecutionAllowed: false;
  readonly mobilePlaywrightExecutionAllowed: false;
  readonly accessibilityAuditExecutionAllowed: false;
  readonly lighthouseAuditExecutionAllowed: false;
  readonly runtimeSeoValidationExecutionAllowed: false;
  readonly ciLaunchEvidenceExecutionAllowed: false;
  readonly providerBackedPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof publicWebLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof publicWebLaunchRequiredExternalEvidence;
}

export interface PublicWebLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof publicWebLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const publicWebLaunchRuntimeLocalCommands = [
  "pnpm --filter @inkroute/web typecheck",
] as const satisfies readonly PublicWebLaunchRuntimeCommand[];

export const publicWebLaunchRuntimeExternalCommands = [
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/web test",
  "pnpm test:e2e --project=web-chromium",
  "pnpm test:e2e --project=web-mobile",
  "axe accessibility audit for public routes",
  "Lighthouse performance audit for public launch routes",
  "runtime sitemap/robots/JSON-LD/canonical validation",
  "GitHub Actions public web launch evidence job",
] as const satisfies readonly PublicWebLaunchRuntimeCommand[];

export function buildPublicWebLaunchRunData(input: PublicWebLaunchRunRecordInput): PublicWebLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: publicWebLaunchRuntimeMatrix,
    readinessAreaManifest: input.coveredReadinessAreas,
    artifactManifest: input.capturedArtifacts,
    providerRouteManifest: {
      tenantScopedPersistence: input.apiRoutesUseTenantScopedPersistence,
      providerBackedRoutesVerified: input.providerBackedRoutesVerified,
      productionLocalRuntimeFallbackDisabled: input.localRuntimeFallbackDisabledForProduction,
    },
    runtimeSeoManifest: {
      sitemapRuntimeVerified: input.sitemapRuntimeVerified,
      robotsRuntimeVerified: input.robotsRuntimeVerified,
      jsonLdRuntimeVerified: input.jsonLdRuntimeVerified,
      canonicalRuntimeVerified: input.canonicalRuntimeVerified,
    },
    legalRouteReviewManifest: {
      privacyAndLegalRoutesReviewed: input.privacyAndLegalRoutesReviewed,
      launchArtifactsSecretSafe: input.launchArtifactsSecretSafe,
    },
    webTypecheckPassed: input.webTypecheckPassed,
    webBuildPassed: input.webBuildPassed,
    webTestsPassed: input.webTestsPassed,
    webRouteSmokePassed: input.webRouteSmokePassed,
    webPlaywrightDesktopPassed: input.webPlaywrightDesktopPassed,
    webPlaywrightMobilePassed: input.webPlaywrightMobilePassed,
    accessibilityAuditPassed: input.accessibilityAuditPassed,
    lighthousePerformancePassed: input.lighthousePerformancePassed,
    apiRoutesUseTenantScopedPersistence: input.apiRoutesUseTenantScopedPersistence,
    providerBackedRoutesVerified: input.providerBackedRoutesVerified,
    localRuntimeFallbackDisabledForProduction: input.localRuntimeFallbackDisabledForProduction,
    realPortfolioDerivativesConfigured: input.realPortfolioDerivativesConfigured,
    placeholderAssetsRemovedOrDocumented: input.placeholderAssetsRemovedOrDocumented,
    sitemapRuntimeVerified: input.sitemapRuntimeVerified,
    robotsRuntimeVerified: input.robotsRuntimeVerified,
    jsonLdRuntimeVerified: input.jsonLdRuntimeVerified,
    canonicalRuntimeVerified: input.canonicalRuntimeVerified,
    privacyAndLegalRoutesReviewed: input.privacyAndLegalRoutesReviewed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    launchArtifactsSecretSafe: input.launchArtifactsSecretSafe,
    webTypecheckArtifactPath: input.webTypecheckArtifactPath ?? null,
    webBuildArtifactPath: input.webBuildArtifactPath ?? null,
    webTestArtifactPath: input.webTestArtifactPath ?? null,
    routeSmokeArtifactPath: input.routeSmokeArtifactPath ?? null,
    playwrightDesktopArtifactPath: input.playwrightDesktopArtifactPath ?? null,
    playwrightMobileArtifactPath: input.playwrightMobileArtifactPath ?? null,
    axeAuditArtifactPath: input.axeAuditArtifactPath ?? null,
    lighthouseArtifactPath: input.lighthouseArtifactPath ?? null,
    providerRoutesArtifactPath: input.providerRoutesArtifactPath ?? null,
    mediaDerivativesArtifactPath: input.mediaDerivativesArtifactPath ?? null,
    runtimeSeoArtifactPath: input.runtimeSeoArtifactPath ?? null,
    legalRoutesArtifactPath: input.legalRoutesArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistPublicWebLaunchRun(
  repository: PublicWebLaunchRunRepository,
  input: PublicWebLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildPublicWebLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.publicWebLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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
  localRuntimeFallbackDisabledForProduction: true,
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

export function buildPublicWebLaunchDecisionRequiredEvidence(
  readinessEvidence: typeof publicWebLaunchRuntimeReadiness.requiredEvidence,
): PublicWebLaunchRequiredEvidence {
  return [
    ...readinessEvidence,
    "PublicWebLaunchRun row with command, readiness area, artifact, provider route, runtime SEO, and legal route review matrices.",
    "Artifact bundle proving web typecheck/build/tests, route smoke, desktop/mobile Playwright, axe, Lighthouse, provider/database routes, media derivatives, runtime SEO, legal route review, CI evidence, and secret-safe launch artifacts.",
  ];
}

export type PublicWebLaunchRequiredEvidence = readonly [
  ...typeof publicWebLaunchRuntimeReadiness.requiredEvidence,
  "PublicWebLaunchRun row with command, readiness area, artifact, provider route, runtime SEO, and legal route review matrices.",
  "Artifact bundle proving web typecheck/build/tests, route smoke, desktop/mobile Playwright, axe, Lighthouse, provider/database routes, media derivatives, runtime SEO, legal route review, CI evidence, and secret-safe launch artifacts.",
];

export const publicWebLaunchRequiredEvidence = buildPublicWebLaunchDecisionRequiredEvidence(
  publicWebLaunchRuntimeReadiness.requiredEvidence,
);

export function buildPublicWebLaunchEvidenceDecision(
  input: PublicWebLaunchEvidenceInput,
): PublicWebLaunchEvidenceDecision {
  const coveredReadinessAreas = new Set(input.coveredReadinessAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReadinessAreas = publicWebLaunchReadinessAreas.filter((area) => !coveredReadinessAreas.has(area));
  const missingArtifacts = publicWebLaunchArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = publicWebLaunchRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildPublicWebLaunchEvidencePlan({
    packageScripts: {
      typecheck: "next typegen && tsc --noEmit",
      build: "next build",
      test: "vitest run",
    },
    webTypecheckPassed: input.webTypecheckPassed,
    webBuildPassed: input.webBuildPassed,
    webRouteSmokePassed: input.webRouteSmokePassed,
    webPlaywrightDesktopPassed: input.webPlaywrightDesktopPassed,
    webPlaywrightMobilePassed: input.webPlaywrightMobilePassed,
    accessibilityAuditPassed: input.accessibilityAuditPassed,
    lighthousePerformancePassed: input.lighthousePerformancePassed,
    apiRoutesUseTenantScopedPersistence: input.apiRoutesUseTenantScopedPersistence,
    providerBackedRoutesVerified: input.providerBackedRoutesVerified,
    localRuntimeFallbackDisabledForProduction: input.localRuntimeFallbackDisabledForProduction,
    realPortfolioDerivativesConfigured: input.realPortfolioDerivativesConfigured,
    placeholderAssetsRemovedOrDocumented: input.placeholderAssetsRemovedOrDocumented,
    sitemapRuntimeVerified: input.sitemapRuntimeVerified,
    robotsRuntimeVerified: input.robotsRuntimeVerified,
    jsonLdRuntimeVerified: input.jsonLdRuntimeVerified,
    canonicalRuntimeVerified: input.canonicalRuntimeVerified,
    privacyAndLegalRoutesReviewed: input.privacyAndLegalRoutesReviewed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    launchArtifactsSecretSafe: input.launchArtifactsSecretSafe,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.webTestsPassed) {
    blockers.push("@inkroute/web tests must pass.");
  }
  if (!input.publicWebLaunchRunPersisted) {
    blockers.push("PublicWebLaunchRun persistence row must be captured for durable auditability.");
  }
  if (missingReadinessAreas.length > 0) {
    blockers.push("Every required public web launch readiness area must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required public web launch artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required public web launch command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingReadinessAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingReadinessAreas,
    missingArtifacts,
    missingCommands,
    requiredReadinessAreas: publicWebLaunchReadinessAreas,
    requiredArtifacts: publicWebLaunchArtifactPaths,
    requiredCommands: publicWebLaunchRuntimeCommands,
    requiredEvidence: publicWebLaunchRequiredEvidence,
    blockers,
  };
}

const sensitivePublicWebLaunchKeyPattern =
  /(account|artifact|authorization|branch|canonical|client|cookie|customer|database|derivative|domain|dsn|email|html|id|jsonld|key|legal|media|password|phone|placeholder|provider|repository|repo|pull|pr|reviewer|codeowner|route|screenshot|secret|tenant|token|uri|url|user|request|response|payload|body|raw|local|fallback|static|demo|portfolio|booking|contact|error|sitemap|robots|lighthouse|axe|playwright|trace|video|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit)$/iu;
const sensitivePublicWebLaunchValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:tenant|client|customer|booking|contact|portfolio|media|derivative|placeholder|route|sitemap|canonical|jsonld|lighthouse|playwright|axe|artifact|workflow|ci|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:private|public|static|demo|placeholder)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactPublicWebLaunchString = (value: string): string =>
  value.replace(sensitivePublicWebLaunchValuePattern, "[REDACTED]");

export const publicWebLaunchExecutionPolicy = {
  codexMayClassifyStaticPublicWebReadiness: true,
  browserRuntimeEvidenceRequiredForClosure: true,
  providerRouteEvidenceRequiredForClosure: true,
  runtimeSeoEvidenceRequiredForClosure: true,
  legalRouteReviewRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const publicWebLaunchRequiredExternalEvidence = [
  "Web build, test, route smoke, desktop/mobile Playwright, axe, and Lighthouse output captured from the target runtime.",
  "Provider-backed public route verification after production fallback guards.",
  "Real media derivative and placeholder-asset disposition evidence.",
  "Runtime sitemap, robots, rendered JSON-LD, and canonical validation artifacts.",
  "Public legal route review artifact.",
  "GitHub Actions public web launch evidence job URL and conclusion.",
  "Provider-backed PublicWebLaunchRun persistence row captured from the target database.",
  "Secret-safe launch artifacts with no provider secrets, client-private data, or raw tenant identifiers.",
] as const;

export const publicWebLaunchRuntimeLocalArtifacts = [
  "coverage/public-web-launch-runtime.json",
  "coverage/public-web-typecheck.txt",
] as const satisfies readonly PublicWebLaunchArtifact[];

export const publicWebLaunchRuntimeExternalArtifacts = [
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
] as const satisfies readonly PublicWebLaunchArtifact[];

const buildRedactedPublicWebLaunchValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedPublicWebLaunchValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePublicWebLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedPublicWebLaunchValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactPublicWebLaunchString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildPublicWebLaunchExecutionPlan(): PublicWebLaunchExecutionPlan {
  return {
    localCommands: publicWebLaunchRuntimeLocalCommands,
    externalCommands: publicWebLaunchRuntimeExternalCommands,
    localArtifacts: publicWebLaunchRuntimeLocalArtifacts,
    externalArtifacts: publicWebLaunchRuntimeExternalArtifacts,
    webTypecheckExecutionAllowed: false,
    webBuildExecutionAllowed: false,
    webTestExecutionAllowed: false,
    routeSmokeExecutionAllowed: false,
    desktopPlaywrightExecutionAllowed: false,
    mobilePlaywrightExecutionAllowed: false,
    accessibilityAuditExecutionAllowed: false,
    lighthouseAuditExecutionAllowed: false,
    runtimeSeoValidationExecutionAllowed: false,
    ciLaunchEvidenceExecutionAllowed: false,
    providerBackedPersistenceExecutionAllowed: false,
    executionPolicy: publicWebLaunchExecutionPolicy,
    requiredExternalEvidence: publicWebLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedPublicWebLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedPublicWebLaunchValue(artifact, "", []);
}

export function buildPublicWebLaunchArtifactReview(artifact: unknown): PublicWebLaunchArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedPublicWebLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: publicWebLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

