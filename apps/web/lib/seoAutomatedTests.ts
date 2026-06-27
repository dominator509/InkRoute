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

export const seoAutomatedRequiredExternalEvidence = [
  "SEO package test and typecheck command output",
  "route/static contract command output",
  "linked GAP-073 crawl evidence",
  "linked GAP-076 runtime/build evidence",
  "GitHub Actions SEO automated gate evidence",
  "produced secret-safe artifact bundle",
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

export const seoAutomatedProofFiles = [
  "packages/seo/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/web/lib/seoAutomatedTests.ts",
  "apps/web/tests/seo-automated-tests-static.test.ts",
  "apps/web/app/sitemap.ts",
  "apps/web/tests/sitemap-route.test.ts",
  "apps/web/app/api/public/[tenantSlug]/seo-preview/route.ts",
  "apps/web/app/api/public/[tenantSlug]/sitemap-preview/route.ts",
  "apps/web/tests/canonical-domain-runtime-static.test.ts",
  "apps/web/tests/structured-data-crawl-qa-static.test.ts",
  "apps/web/tests/phase10-seo-runtime-build-static.test.ts",
  "apps/dashboard/tests/search-console-route-static.test.ts",
  "apps/dashboard/tests/image-seo-pipeline-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type SeoAutomatedEvidenceArtifact = (typeof seoAutomatedArtifactPaths)[number];

export interface SeoAutomatedExecutionPlan {
  readonly id: "gap-078-seo-automated-test-gate";
  readonly ciExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly policy: SeoAutomatedExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof seoAutomatedGateCommands;
  readonly requiredArtifacts: typeof seoAutomatedArtifactPaths;
  readonly localSuiteIds: readonly SeoAutomatedSuiteId[];
  readonly linkedGapArtifacts: readonly SeoAutomatedEvidenceArtifact[];
  readonly ciArtifacts: readonly SeoAutomatedEvidenceArtifact[];
  readonly secretSafeArtifactPath: SeoAutomatedEvidenceArtifact;
  readonly externalEvidenceRequired: typeof seoAutomatedRequiredExternalEvidence;
}

export interface SeoAutomatedExecutionPolicy {
  readonly executeSeoPackageTests: false;
  readonly executeRouteStaticTests: false;
  readonly executeLinkedGap073Crawl: false;
  readonly executeLinkedGap076RuntimeBuild: false;
  readonly executeCi: false;
  readonly executeProviderAdjacentChecks: false;
}

export interface SeoAutomatedArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: SeoAutomatedEvidenceArtifact;
}

const seoAutomatedSensitiveKeyPattern =
  /(?:authorization|clientsecret|credential|cookie|email|password|phone|private|secret|token|trace|workflowtoken)/i;
const seoAutomatedEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const seoAutomatedPhonePattern = /\+?\d[\d ().-]{7,}\d/g;
const seoAutomatedTokenPattern = /\b(?:bearer|ghp|github_pat|sk|ya29)[A-Za-z0-9._:-]{8,}\b/gi;

function redactSeoAutomatedValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (seoAutomatedSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(seoAutomatedEmailPattern, "[REDACTED_EMAIL]")
      .replace(seoAutomatedPhonePattern, "[REDACTED_PHONE]")
      .replace(seoAutomatedTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSeoAutomatedValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactSeoAutomatedValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedSeoAutomatedArtifact(artifact: unknown): unknown {
  return redactSeoAutomatedValue(artifact);
}

export const seoAutomatedExecutionPolicy: SeoAutomatedExecutionPolicy = {
  executeSeoPackageTests: false,
  executeRouteStaticTests: false,
  executeLinkedGap073Crawl: false,
  executeLinkedGap076RuntimeBuild: false,
  executeCi: false,
  executeProviderAdjacentChecks: false,
};

export function buildSeoAutomatedExecutionPlan(): SeoAutomatedExecutionPlan {
  return {
    id: "gap-078-seo-automated-test-gate",
    ciExecutionAllowed: false,
    providerExecutionAllowed: false,
    policy: seoAutomatedExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: seoAutomatedGateCommands,
    requiredArtifacts: seoAutomatedArtifactPaths,
    localSuiteIds: seoAutomatedSuites.map((suite) => suite.id),
    linkedGapArtifacts: ["coverage/seo-automated-linked-gap073-crawl.json", "coverage/seo-automated-linked-gap076-runtime-build.json"],
    ciArtifacts: ["coverage/seo-automated-ci-evidence.json"],
    secretSafeArtifactPath: "coverage/seo-automated-secret-safe-artifacts.json",
    externalEvidenceRequired: seoAutomatedRequiredExternalEvidence,
  };
}

export function buildSeoAutomatedArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: SeoAutomatedEvidenceArtifact = "coverage/seo-automated-secret-safe-artifacts.json",
): SeoAutomatedArtifactReview {
  const redactedArtifact = buildRedactedSeoAutomatedArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    seoAutomatedEmailPattern.test(serialized) ? "email" : null,
    seoAutomatedPhonePattern.test(serialized) ? "phone" : null,
    seoAutomatedTokenPattern.test(serialized) ? "provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface SeoAutomatedEvidenceInput {
  readonly seoPackageTestsPassed: boolean;
  readonly seoPackageTypecheckPassed: boolean;
  readonly routeContractsPassed: boolean;
  readonly linkedGap073CrawlEvidenceCaptured: boolean;
  readonly linkedGap076RuntimeBuildEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SeoAutomatedEvidenceArtifact[];
}

export const seoAutomatedDecisionRequiredEvidence = [
  "SEO package test and typecheck artifacts",
  "SEO automated route/static contract artifact",
  "linked GAP-073 crawl and GAP-076 runtime/build artifacts",
  "CI evidence and redacted secret-safe artifact review",
] as const;

export interface SeoAutomatedEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SeoAutomatedEvidenceArtifact[];
  readonly requiredCommands: typeof seoAutomatedGateCommands;
  readonly requiredEvidence: typeof seoAutomatedDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildSeoAutomatedEvidenceDecision(input: SeoAutomatedEvidenceInput): SeoAutomatedEvidenceDecision {
  const blockers = [
    !input.seoPackageTestsPassed ? "SEO package test evidence is required." : null,
    !input.seoPackageTypecheckPassed ? "SEO package typecheck evidence is required." : null,
    !input.routeContractsPassed ? "SEO automated route/static contract evidence is required." : null,
    !input.linkedGap073CrawlEvidenceCaptured ? "Linked GAP-073 structured-data crawl evidence is required." : null,
    !input.linkedGap076RuntimeBuildEvidenceCaptured ? "Linked GAP-076 runtime/build evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI SEO automated test gate evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = seoAutomatedArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: seoAutomatedGateCommands,
    requiredEvidence: seoAutomatedDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-078 SEO automated test evidence is complete with CI-safe artifacts captured."
        : "GAP-078 SEO automated test evidence remains blocked until package, route, linked runtime, CI, and redaction artifacts are captured.",
  };
}

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


