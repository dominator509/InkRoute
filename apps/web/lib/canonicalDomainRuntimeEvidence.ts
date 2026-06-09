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

export const canonicalDomainRuntimeCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm --filter @inkroute/web build",
  "pnpm vitest run apps/web/tests/canonical-domain-runtime-static.test.ts apps/web/tests/sitemap-route.test.ts",
  "custom-domain canonical/redirect route tests",
  "runtime sitemap exclusion and noindex route tests",
  "duplicate canonical runtime tests",
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
  tenantDomainRepositoryImplemented: false,
  seoRedirectRepositoryImplemented: false,
  canonicalPolicyWiredToPublicRoutes: true,
  allowedHostValidationEnforced: true,
  httpsRedirectEnforced: true,
  canonicalHostRedirectEnforced: true,
  persistedRedirectsExecuted: false,
  redirectStatusCodesPreserved: true,
  draftArchiveNoindexSitemapExclusionRuntimeVerified: false,
  noindexHeadersOrMetaRuntimeVerified: true,
  canonicalTagsUseTenantPrimaryHost: true,
  customDomainRouteTestsPassed: false,
  duplicateCanonicalRuntimeTestsPassed: false,
  deploymentDomainProofAvailable: false,
});
