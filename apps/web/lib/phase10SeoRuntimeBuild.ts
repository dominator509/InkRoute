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

export interface Phase10SeoRuntimeExecutionPlan {
  readonly id: "gap-076-phase10-seo-runtime-build";
  readonly providerExecutionAllowed: false;
  readonly policy: Phase10SeoRuntimeExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof phase10SeoRuntimeBuildCommands;
  readonly requiredArtifacts: typeof phase10SeoRuntimeArtifactPaths;
  readonly buildSurfaces: readonly Phase10SeoRuntimeSurfaceId[];
  readonly staticContractSurfaces: readonly Phase10SeoRuntimeSurfaceId[];
  readonly runtimeSurfaces: readonly Phase10SeoRuntimeSurfaceId[];
  readonly providerSurfaces: readonly Phase10SeoRuntimeSurfaceId[];
  readonly surfaceContract: typeof phase10SeoRuntimeSurfaceContract;
  readonly secretSafeArtifactPath: Phase10SeoRuntimeEvidenceArtifact;
  readonly externalEvidenceRequired: typeof phase10SeoRuntimeRequiredExternalEvidence;
}

export interface Phase10SeoRuntimeExecutionPolicy {
  readonly executeTestingPackageChecks: false;
  readonly executeWebBuild: false;
  readonly executeDashboardBuild: false;
  readonly executeBrowserSmokes: false;
  readonly executeRenderedCrawls: false;
  readonly executeSearchConsoleProvider: false;
  readonly executeCi: false;
}

export interface Phase10SeoRuntimeArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: Phase10SeoRuntimeEvidenceArtifact;
}

export interface Phase10SeoRuntimeBuildEvidencePacket {
  readonly packetId: "gap-076-phase10-seo-runtime-build-evidence";
  readonly requiredArtifact: "coverage/phase10-seo-runtime-build-packet.json";
  readonly providerExecutionAllowed: false;
  readonly requiredCommands: typeof phase10SeoRuntimeBuildCommands;
  readonly requiredArtifacts: typeof phase10SeoRuntimeArtifactPaths;
  readonly requiredExternalEvidence: typeof phase10SeoRuntimeRequiredExternalEvidence;
  readonly surfaceContract: typeof phase10SeoRuntimeSurfaceContract;
  readonly searchConsoleProviderEvidenceRequired: true;
  readonly renderedCrawlEvidenceRequired: true;
  readonly ciEvidenceRequired: true;
  readonly redactionRequired: true;
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

export const phase10SeoRuntimeRequiredExternalEvidence = [
  "testing package test/typecheck output",
  "web and dashboard build logs",
  "dashboard SEO browser and publish/edit/archive Playwright proof",
  "rendered public SEO and sitemap/canonical crawl artifacts",
  "sitemap/API preview/canonical runtime artifact capture",
  "Search Console provider execution proof captured as redacted artifacts",
  "GitHub Actions Phase 10 SEO runtime/build gate evidence",
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
  "coverage/phase10-seo-runtime-build-packet.json",
  "coverage/phase10-seo-runtime-secret-safe-artifacts.json",
  "test-results/phase10-seo-web",
  "test-results/phase10-seo-dashboard",
  "test-results/structured-data-crawl",
] as const;

export const phase10SeoRuntimeProofFiles = [
  "apps/dashboard/package.json",
  "packages/testing/package.json",
  "apps/web/package.json",
  "packages/testing/src/index.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "apps/web/lib/seoEngine.ts",
  "apps/web/lib/canonicalRuntime.ts",
  "apps/web/lib/structuredDataCrawlQa.ts",
  "apps/web/lib/phase10SeoRuntimeBuild.ts",
  "apps/web/app/sitemap.ts",
  "apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts",
  "apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts",
  "apps/web/tests/sitemap-route.test.ts",
  "apps/web/tests/canonical-domain-runtime-static.test.ts",
  "apps/web/tests/structured-data-crawl-qa-static.test.ts",
  "apps/web/tests/phase10-seo-runtime-build-static.test.ts",
  "apps/dashboard/app/seo/page.tsx",
  "apps/dashboard/app/api/seo/route.ts",
  "apps/dashboard/app/api/seo/search-console/route.ts",
  "apps/dashboard/tests/seo-read-route-static.test.ts",
  "apps/dashboard/tests/seo-publication-route-static.test.ts",
  "apps/dashboard/tests/search-console-route-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type Phase10SeoRuntimeEvidenceArtifact = (typeof phase10SeoRuntimeArtifactPaths)[number];

export interface Phase10SeoRuntimeSurfaceContractEntry {
  readonly surfaceId: Phase10SeoRuntimeSurfaceId | "ci-phase10-seo-runtime-gate" | "secret-safe-artifacts";
  readonly requiredCommand: string;
  readonly requiredArtifact: Phase10SeoRuntimeEvidenceArtifact;
  readonly runtimeBoundary:
    | "build"
    | "static-contract"
    | "browser-runtime"
    | "rendered-crawl"
    | "database-runtime"
    | "api-runtime"
    | "search-console-provider"
    | "ci-proof"
    | "artifact-review";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const phase10SeoRuntimeSurfaceContract: readonly Phase10SeoRuntimeSurfaceContractEntry[] = [
  {
    surfaceId: "web-build",
    requiredCommand: "pnpm --filter @inkroute/web build",
    requiredArtifact: "coverage/phase10-seo-web-build.json",
    runtimeBoundary: "build",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-build",
    requiredCommand: "pnpm --filter @inkroute/dashboard build",
    requiredArtifact: "coverage/phase10-seo-dashboard-build.json",
    runtimeBoundary: "build",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-seo-browser-smoke",
    requiredCommand: "pnpm playwright test apps/dashboard/tests/seo-browser-smoke.spec.ts",
    requiredArtifact: "coverage/phase10-dashboard-seo-browser-smoke.json",
    runtimeBoundary: "browser-runtime",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "rendered-public-seo-crawl",
    requiredCommand: "pnpm playwright test apps/web/tests/e2e/structured-data-crawl.spec.ts",
    requiredArtifact: "coverage/phase10-rendered-public-seo-crawl.json",
    runtimeBoundary: "rendered-crawl",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "rendered-sitemap-canonical-crawl",
    requiredCommand: "pnpm playwright test apps/web/tests/e2e/sitemap-canonical-crawl.spec.ts",
    requiredArtifact: "coverage/phase10-rendered-sitemap-canonical-crawl.json",
    runtimeBoundary: "rendered-crawl",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "database-backed-seo-routes",
    requiredCommand: "pnpm vitest run apps/dashboard/tests/seo-read-route-static.test.ts apps/dashboard/tests/seo-publication-route-static.test.ts",
    requiredArtifact: "coverage/phase10-database-backed-seo-routes.json",
    runtimeBoundary: "database-runtime",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "api-preview-runtime-artifacts",
    requiredCommand: "pnpm vitest run apps/web/tests/sitemap-route.test.ts",
    requiredArtifact: "coverage/phase10-api-preview-runtime.json",
    runtimeBoundary: "api-runtime",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "search-console-provider-status",
    requiredCommand: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
    requiredArtifact: "coverage/phase10-search-console-provider-execution-redacted.json",
    runtimeBoundary: "search-console-provider",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-phase10-seo-runtime-gate",
    requiredCommand: "GitHub Actions Phase 10 SEO app runtime and build gate",
    requiredArtifact: "coverage/phase10-seo-runtime-ci-evidence.json",
    runtimeBoundary: "ci-proof",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "secret-safe-artifacts",
    requiredCommand: "secret-safe Phase 10 SEO runtime/build artifact review",
    requiredArtifact: "coverage/phase10-seo-runtime-secret-safe-artifacts.json",
    runtimeBoundary: "artifact-review",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

const phase10SensitiveKeyPattern =
  /(?:artifacturl|authorization|bearer|buildlog|canonical|ciurl|clientsecret|commandoutput|credential|crawl|cookie|email|pagecontent|password|phone|private|providerpayload|query|rawhtml|refreshtoken|rendered|rows|searchconsole|secret|siteurl|sitemap|tenant|token|url)/i;
const phase10EmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phase10PhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const phase10TokenPattern = /\b(?:ya29|sk|rk|ghp|gcp|google|bearer)[A-Za-z0-9._:-]{8,}\b/gi;

function redactPhase10SeoRuntimeValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (phase10SensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(phase10EmailPattern, "[REDACTED_EMAIL]")
      .replace(phase10PhonePattern, "[REDACTED_PHONE]")
      .replace(phase10TokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactPhase10SeoRuntimeValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactPhase10SeoRuntimeValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedPhase10SeoRuntimeArtifact(artifact: unknown): unknown {
  return redactPhase10SeoRuntimeValue(artifact);
}

export const phase10SeoRuntimeExecutionPolicy: Phase10SeoRuntimeExecutionPolicy = {
  executeTestingPackageChecks: false,
  executeWebBuild: false,
  executeDashboardBuild: false,
  executeBrowserSmokes: false,
  executeRenderedCrawls: false,
  executeSearchConsoleProvider: false,
  executeCi: false,
};

export function buildPhase10SeoRuntimeExecutionPlan(): Phase10SeoRuntimeExecutionPlan {
  return {
    id: "gap-076-phase10-seo-runtime-build",
    providerExecutionAllowed: false,
    policy: phase10SeoRuntimeExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: phase10SeoRuntimeBuildCommands,
    requiredArtifacts: phase10SeoRuntimeArtifactPaths,
    buildSurfaces: phase10SeoRuntimeSurfaces
      .filter((surface) => surface.evidenceType === "build-required")
      .map((surface) => surface.id),
    staticContractSurfaces: phase10SeoRuntimeSurfaces
      .filter((surface) => surface.evidenceType === "static-contract")
      .map((surface) => surface.id),
    runtimeSurfaces: phase10SeoRuntimeSurfaces
      .filter((surface) => surface.evidenceType === "runtime-required")
      .map((surface) => surface.id),
    providerSurfaces: ["search-console-provider-status"],
    surfaceContract: phase10SeoRuntimeSurfaceContract,
    secretSafeArtifactPath: "coverage/phase10-seo-runtime-secret-safe-artifacts.json",
    externalEvidenceRequired: phase10SeoRuntimeRequiredExternalEvidence,
  };
}

export function buildPhase10SeoRuntimeArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: Phase10SeoRuntimeEvidenceArtifact = "coverage/phase10-seo-runtime-secret-safe-artifacts.json",
): Phase10SeoRuntimeArtifactReview {
  const redactedArtifact = buildRedactedPhase10SeoRuntimeArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    phase10EmailPattern.test(serialized) ? "email" : null,
    phase10PhonePattern.test(serialized) ? "phone" : null,
    phase10TokenPattern.test(serialized) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export function buildPhase10SeoRuntimeBuildEvidencePacket(): Phase10SeoRuntimeBuildEvidencePacket {
  return {
    packetId: "gap-076-phase10-seo-runtime-build-evidence",
    requiredArtifact: "coverage/phase10-seo-runtime-build-packet.json",
    providerExecutionAllowed: false,
    requiredCommands: phase10SeoRuntimeBuildCommands,
    requiredArtifacts: phase10SeoRuntimeArtifactPaths,
    requiredExternalEvidence: phase10SeoRuntimeRequiredExternalEvidence,
    surfaceContract: phase10SeoRuntimeSurfaceContract,
    searchConsoleProviderEvidenceRequired: true,
    renderedCrawlEvidenceRequired: true,
    ciEvidenceRequired: true,
    redactionRequired: true,
  };
}

export interface Phase10SeoRuntimeEvidenceInput {
  readonly testingPackageTestsPassed: boolean;
  readonly testingPackageTypecheckPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly dashboardBuildPassed: boolean;
  readonly staticContractsPassed: boolean;
  readonly dashboardSeoBrowserSmokePassed: boolean;
  readonly dashboardSeoPublishSmokePassed: boolean;
  readonly renderedPublicSeoCrawlPassed: boolean;
  readonly renderedSitemapCanonicalCrawlPassed: boolean;
  readonly databaseBackedSeoRoutesVerified: boolean;
  readonly sitemapRuntimeCaptured: boolean;
  readonly apiPreviewRuntimeCaptured: boolean;
  readonly canonicalRuntimeCaptured: boolean;
  readonly searchConsoleStatusVerified: boolean;
  readonly searchConsoleProviderExecutionCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly runtimeBuildEvidencePacketCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly Phase10SeoRuntimeEvidenceArtifact[];
}

export const phase10SeoRuntimeDecisionRequiredEvidence = [
  "testing package, web build, dashboard build, and static contract artifacts",
  "dashboard browser/publish smokes and rendered public SEO/sitemap canonical crawl artifacts",
  "database-backed SEO route, sitemap runtime, API preview runtime, and canonical runtime artifacts",
  "Phase 10 SEO runtime/build evidence packet with command, crawl, provider, CI, and redaction proof",
  "Search Console provider execution, CI gate, and redacted secret-safe artifact evidence",
] as const;

export interface Phase10SeoRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly Phase10SeoRuntimeEvidenceArtifact[];
  readonly requiredCommands: typeof phase10SeoRuntimeBuildCommands;
  readonly requiredEvidence: typeof phase10SeoRuntimeDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildPhase10SeoRuntimeEvidenceDecision(input: Phase10SeoRuntimeEvidenceInput): Phase10SeoRuntimeEvidenceDecision {
  const blockers = [
    !input.testingPackageTestsPassed ? "Testing package test evidence is required." : null,
    !input.testingPackageTypecheckPassed ? "Testing package typecheck evidence is required." : null,
    !input.webBuildPassed ? "Web build evidence is required." : null,
    !input.dashboardBuildPassed ? "Dashboard build evidence is required." : null,
    !input.staticContractsPassed ? "Phase 10 SEO static contract evidence is required." : null,
    !input.dashboardSeoBrowserSmokePassed ? "Dashboard SEO browser smoke evidence is required." : null,
    !input.dashboardSeoPublishSmokePassed ? "Dashboard SEO publish/edit/archive smoke evidence is required." : null,
    !input.renderedPublicSeoCrawlPassed ? "Rendered public SEO crawl evidence is required." : null,
    !input.renderedSitemapCanonicalCrawlPassed ? "Rendered sitemap/canonical crawl evidence is required." : null,
    !input.databaseBackedSeoRoutesVerified ? "Database-backed SEO route evidence is required." : null,
    !input.sitemapRuntimeCaptured ? "Sitemap runtime artifact evidence is required." : null,
    !input.apiPreviewRuntimeCaptured ? "SEO preview and sitemap preview API runtime evidence is required." : null,
    !input.canonicalRuntimeCaptured ? "Canonical/noindex middleware runtime evidence is required." : null,
    !input.searchConsoleStatusVerified ? "Search Console provider status evidence is required." : null,
    !input.searchConsoleProviderExecutionCaptured ? "Redacted Search Console provider execution evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI Phase 10 SEO runtime/build gate evidence is required." : null,
    !input.runtimeBuildEvidencePacketCaptured ? "Phase 10 SEO runtime/build evidence packet is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = phase10SeoRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: phase10SeoRuntimeBuildCommands,
    requiredEvidence: phase10SeoRuntimeDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-076 Phase 10 SEO runtime/build evidence is complete with CI-safe artifacts captured."
        : "GAP-076 Phase 10 SEO runtime/build evidence remains blocked until build, browser, crawl, runtime, provider, CI, and redaction artifacts are captured.",
  };
}

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
  { id: "runtime-build-evidence-packet", command: "capture Phase 10 SEO runtime/build evidence packet", artifact: "coverage/phase10-seo-runtime-build-packet.json", status: "ci-gated" },
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


