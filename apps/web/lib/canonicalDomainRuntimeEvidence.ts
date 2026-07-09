import { buildCanonicalDomainRuntimeReadinessPlan } from "@inkroute/seo";

export type CanonicalDomainRuntimeStatus =
  | "wired"
  | "repository-gated"
  | "crawl-gated"
  | "deployment-gated"
  | "ci-gated";

export interface CanonicalDomainRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: CanonicalDomainRuntimeStatus;
}

export interface CanonicalDomainArtifactReview {
  readonly status: "passed" | "blocked";
  readonly redactedArtifacts: readonly unknown[];
  readonly blockers: readonly string[];
}

export interface CanonicalDomainExecutionPolicy {
  readonly codexMayClassifyStaticCanonicalDomainReadiness: boolean;
  readonly localCommandEvidenceRequiredForClosure: boolean;
  readonly tenantDomainRepositoryRequiredForClosure: boolean;
  readonly seoRedirectRepositoryRequiredForClosure: boolean;
  readonly customDomainRouteRequiredForClosure: boolean;
  readonly sitemapNoindexCrawlRequiredForClosure: boolean;
  readonly duplicateCanonicalRuntimeRequiredForClosure: boolean;
  readonly deploymentDomainProofRequiredForClosure: boolean;
  readonly ciEvidenceRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface CanonicalDomainExecutionPlan {
  readonly policy: CanonicalDomainExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly repositoryExecutionAllowed: false;
  readonly customDomainExecutionAllowed: false;
  readonly crawlExecutionAllowed: false;
  readonly duplicateCanonicalExecutionAllowed: false;
  readonly deploymentProofExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof canonicalDomainLocalCommands;
  readonly externalCommands: typeof canonicalDomainExternalCommands;
  readonly requiredExternalEvidence: typeof canonicalDomainRequiredExternalEvidence;
}

export const canonicalDomainExecutionPolicy = {
  codexMayClassifyStaticCanonicalDomainReadiness: true,
  localCommandEvidenceRequiredForClosure: true,
  tenantDomainRepositoryRequiredForClosure: true,
  seoRedirectRepositoryRequiredForClosure: true,
  customDomainRouteRequiredForClosure: true,
  sitemapNoindexCrawlRequiredForClosure: true,
  duplicateCanonicalRuntimeRequiredForClosure: true,
  deploymentDomainProofRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies CanonicalDomainExecutionPolicy;

export const canonicalDomainRuntimeCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web build",
  "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/sitemap-route.test.ts",
  "custom-domain canonical/redirect route tests",
  "runtime sitemap exclusion and noindex route tests",
  "duplicate canonical runtime tests",
] as const;

export const canonicalDomainLocalCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web build",
  "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/sitemap-route.test.ts",
] as const;

export const canonicalDomainExternalCommands = [
  "custom-domain canonical/redirect route tests",
  "runtime sitemap exclusion and noindex route tests",
  "duplicate canonical runtime tests",
  "database-backed TenantDomain repository route tests",
  "database-backed SeoRedirect repository route tests",
  "deployment primary/allowed domain proof",
  "GitHub Actions canonical/domain runtime job",
  "secret-safe canonical/domain artifact review",
] as const;

export const canonicalDomainArtifactPaths = [
  "coverage/canonical-domain-runtime.json",
  "coverage/canonical-domain-seo-typecheck.txt",
  "coverage/canonical-domain-seo-test.txt",
  "coverage/canonical-domain-web-build.txt",
  "coverage/canonical-domain-static-contract.json",
  "coverage/canonical-domain-tenant-domain-repository.json",
  "coverage/canonical-domain-seo-redirect-repository.json",
  "coverage/canonical-domain-custom-domain-route.json",
  "coverage/canonical-domain-duplicate-canonical-runtime.json",
  "coverage/canonical-domain-sitemap-noindex-crawl.json",
  "coverage/canonical-domain-deployment-domain-proof.json",
  "coverage/canonical-domain-ci-evidence.json",
  "coverage/canonical-domain-secret-safe-artifacts.json",
  "test-results/canonical-domain-runtime",
] as const;

export const canonicalDomainRuntimeProofFiles = [
  "packages/seo/package.json",
  "apps/web/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/web/lib/seoEngine.ts",
  "apps/web/lib/canonicalRuntime.ts",
  "apps/web/lib/canonicalDomainRuntimeEvidence.ts",
  "apps/web/middleware.ts",
  "apps/web/app/sitemap.ts",
  "apps/web/app/cities/[citySlug]/page.tsx",
  "apps/web/app/styles/[styleSlug]/page.tsx",
  "apps/web/tests/sitemap-route.test.ts",
  "apps/web/tests/canonical-domain-runtime-static.test.ts",
  "packages/db/src/prisma.ts",
  "packages/db/prisma/schema.prisma",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const canonicalDomainRequiredExternalEvidence = [
  "actual canonical/domain command output",
  "database-backed TenantDomain repository route tests",
  "database-backed SeoRedirect repository route tests",
  "custom-domain canonical/redirect route tests",
  "runtime sitemap exclusion and noindex route tests",
  "duplicate canonical runtime tests",
  "deployment primary/allowed domain proof",
  "CI canonical/domain runtime artifacts",
  "secret-safe canonical/domain artifact review",
] as const;

export const buildCanonicalDomainExecutionPlan = (): CanonicalDomainExecutionPlan => ({
  policy: canonicalDomainExecutionPolicy,
  commandExecutionAllowed: false,
  repositoryExecutionAllowed: false,
  customDomainExecutionAllowed: false,
  crawlExecutionAllowed: false,
  duplicateCanonicalExecutionAllowed: false,
  deploymentProofExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: canonicalDomainLocalCommands,
  externalCommands: canonicalDomainExternalCommands,
  requiredExternalEvidence: canonicalDomainRequiredExternalEvidence,
});

const sensitiveCanonicalArtifactKeyPattern =
  /(authorization|canonical|cookie|crawl|deployment|dns|domain|domainverification|email|host|html|noindex|path|phone|provider|payload|redirect|rendered|robots|route|secret|sitemap|tenant|token|url)/i;
const sensitiveCanonicalArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:dns|domainverification|provider|token|secret)[\w:./?=&-]*/gi,
];

export function buildRedactedCanonicalDomainArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedCanonicalDomainArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveCanonicalArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveCanonicalArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedCanonicalDomainArtifact(value),
    ]),
  );
}

export function buildCanonicalDomainArtifactReview(input: {
  readonly artifacts: readonly unknown[];
  readonly expectedArtifactPaths?: readonly string[];
}): CanonicalDomainArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedCanonicalDomainArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No canonical/domain artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|domainverification)\b/i.test(serialized)
      ? ["Canonical/domain artifacts still contain secrets, provider payloads, DNS verification values, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["Canonical/domain artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export type CanonicalDomainEvidenceArtifact = (typeof canonicalDomainArtifactPaths)[number];

export interface CanonicalDomainEvidenceInput {
  readonly seoTypecheckPassed: boolean;
  readonly seoTestsPassed: boolean;
  readonly webBuildPassed: boolean;
  readonly staticContractPassed: boolean;
  readonly tenantDomainRepositoryVerified: boolean;
  readonly seoRedirectRepositoryVerified: boolean;
  readonly customDomainRouteTestsPassed: boolean;
  readonly duplicateCanonicalRuntimePassed: boolean;
  readonly sitemapNoindexCrawlPassed: boolean;
  readonly deploymentDomainProofCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly CanonicalDomainEvidenceArtifact[];
}

export interface CanonicalDomainEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly CanonicalDomainEvidenceArtifact[];
  readonly requiredCommands: typeof canonicalDomainRuntimeCommands;
  readonly requiredEvidence: typeof canonicalDomainDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export const canonicalDomainDecisionRequiredEvidence = [
  "SEO package typecheck/test, web build, and canonical-domain static contract artifacts",
  "TenantDomain and SeoRedirect repository runtime artifacts",
  "custom-domain, sitemap/noindex, duplicate-canonical, and deployment-domain proof artifacts",
  "CI evidence and redacted secret-safe artifact audit",
] as const;

export function buildCanonicalDomainEvidenceDecision(input: CanonicalDomainEvidenceInput): CanonicalDomainEvidenceDecision {
  const blockers = [
    !input.seoTypecheckPassed ? "SEO package typecheck evidence is required." : null,
    !input.seoTestsPassed ? "SEO package test evidence is required." : null,
    !input.webBuildPassed ? "Web build evidence is required." : null,
    !input.staticContractPassed ? "Canonical/domain static contract and sitemap route evidence are required." : null,
    !input.tenantDomainRepositoryVerified ? "TenantDomain repository runtime evidence is required." : null,
    !input.seoRedirectRepositoryVerified ? "SeoRedirect repository runtime evidence is required." : null,
    !input.customDomainRouteTestsPassed ? "Custom-domain canonical/redirect route evidence is required." : null,
    !input.duplicateCanonicalRuntimePassed ? "Duplicate canonical runtime evidence is required." : null,
    !input.sitemapNoindexCrawlPassed ? "Sitemap exclusion and noindex crawl evidence is required." : null,
    !input.deploymentDomainProofCaptured ? "Deployment-domain proof for primary and allowed hosts is required." : null,
    !input.ciEvidenceCaptured ? "CI canonical/domain runtime job evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = canonicalDomainArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: canonicalDomainRuntimeCommands,
    requiredEvidence: canonicalDomainDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-072 canonical/domain evidence is complete with CI-safe artifacts captured."
        : "GAP-072 canonical/domain evidence remains blocked until repository, crawl, deployment, CI, and redaction artifacts are captured.",
  };
}

export const canonicalDomainRuntimeMatrix: readonly CanonicalDomainRuntimeMatrixEntry[] = [
  { id: "seo-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/canonical-domain-seo-typecheck.txt", status: "wired" },
  { id: "seo-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/canonical-domain-seo-test.txt", status: "wired" },
  { id: "web-build", command: "pnpm --filter @inkroute/web build", artifact: "coverage/canonical-domain-web-build.txt", status: "wired" },
  { id: "static-contract", command: "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/sitemap-route.test.ts", artifact: "coverage/canonical-domain-static-contract.json", status: "wired" },
  { id: "tenant-domain-repository", command: "database-backed TenantDomain repository route tests", artifact: "coverage/canonical-domain-tenant-domain-repository.json", status: "repository-gated" },
  { id: "seo-redirect-repository", command: "database-backed SeoRedirect repository route tests", artifact: "coverage/canonical-domain-seo-redirect-repository.json", status: "repository-gated" },
  { id: "custom-domain-route", command: "custom-domain canonical/redirect route tests", artifact: "coverage/canonical-domain-custom-domain-route.json", status: "deployment-gated" },
  { id: "duplicate-canonical-runtime", command: "duplicate canonical runtime tests", artifact: "coverage/canonical-domain-duplicate-canonical-runtime.json", status: "crawl-gated" },
  { id: "sitemap-noindex-crawl", command: "runtime sitemap exclusion and noindex route tests", artifact: "coverage/canonical-domain-sitemap-noindex-crawl.json", status: "crawl-gated" },
  { id: "deployment-domain-proof", command: "deployment primary/allowed domain proof", artifact: "coverage/canonical-domain-deployment-domain-proof.json", status: "deployment-gated" },
  { id: "ci-canonical-domain-job", command: "GitHub Actions canonical/domain runtime job", artifact: "coverage/canonical-domain-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted canonical/domain artifact audit", artifact: "coverage/canonical-domain-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export const canonicalDomainRuntimeReadiness = buildCanonicalDomainRuntimeReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  seoPackageTestsPassed: false,
  seoPackageTypecheckPassed: false,
  webBuildPassed: false,
  middlewareImplemented: true,
  tenantDomainRepositoryImplemented: true,
  seoRedirectRepositoryImplemented: true,
  canonicalPolicyWiredToPublicRoutes: true,
  allowedHostValidationEnforced: true,
  httpsRedirectEnforced: true,
  canonicalHostRedirectEnforced: true,
  persistedRedirectsExecuted: true,
  redirectStatusCodesPreserved: true,
  draftArchiveNoindexSitemapExclusionRuntimeVerified: false,
  noindexHeadersOrMetaRuntimeVerified: true,
  canonicalTagsUseTenantPrimaryHost: true,
  customDomainRouteTestsPassed: false,
  duplicateCanonicalRuntimeTestsPassed: false,
  deploymentDomainProofAvailable: false,
});

