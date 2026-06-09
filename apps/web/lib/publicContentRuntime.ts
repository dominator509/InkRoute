import { buildPublicContentRuntimeEvidencePlan } from "@inkroute/config";

export type PublicContentRuntimeStatus =
  | "wired"
  | "repository-gated"
  | "seed-gated"
  | "redaction-gated"
  | "cache-gated"
  | "browser-ci-gated";

export interface PublicContentRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PublicContentRuntimeStatus;
}


export interface PublicContentRunPersistenceContract {
  readonly prismaModel: "PublicContentRun";
  readonly tenantRelation: "publicContentRuns";
  readonly migration: "20260609034800_add_public_content_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesTenantDomainResolverEvidence: true;
  readonly storesRepositoryReadEvidence: true;
  readonly storesRouteApiAdoptionEvidence: true;
  readonly storesSeededContentEvidence: true;
  readonly storesApiJsonRedactionEvidence: true;
  readonly storesRenderedHtmlRedactionEvidence: true;
  readonly storesPrivatePortfolioExclusionEvidence: true;
  readonly storesCacheRevalidationEvidence: true;
  readonly storesBrowserCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const publicContentRunPersistenceContract = {
  prismaModel: "PublicContentRun",
  tenantRelation: "publicContentRuns",
  migration: "20260609034800_add_public_content_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesTenantDomainResolverEvidence: true,
  storesRepositoryReadEvidence: true,
  storesRouteApiAdoptionEvidence: true,
  storesSeededContentEvidence: true,
  storesApiJsonRedactionEvidence: true,
  storesRenderedHtmlRedactionEvidence: true,
  storesPrivatePortfolioExclusionEvidence: true,
  storesCacheRevalidationEvidence: true,
  storesBrowserCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies PublicContentRunPersistenceContract;

export const publicContentRuntimeCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "public content seeded DB/API redaction tests",
  "public content browser HTML redaction smoke",
  "public content cache revalidation smoke",
] as const;

export const publicContentArtifactPaths = [
  "coverage/public-content-runtime.json",
  "coverage/public-content-config-typecheck.txt",
  "coverage/public-content-config-test.txt",
  "coverage/public-content-web-typecheck.txt",
  "coverage/public-content-web-build.txt",
  "coverage/public-content-resolver-wiring.json",
  "coverage/public-content-seeded-db-cms-redacted.json",
  "coverage/public-content-api-json-redaction.json",
  "coverage/public-content-rendered-html-redaction.json",
  "coverage/public-content-cache-revalidation.json",
  "coverage/public-content-browser-smoke.json",
  "coverage/public-content-ci-evidence.json",
  "test-results/public-content-runtime",
] as const;

export const publicContentRuntimeMatrix = [
  {
    id: "config-and-web-package-gates",
    command: "pnpm --filter @inkroute/config typecheck && pnpm --filter @inkroute/config test && pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/public-content-web-build.txt",
    status: "wired",
  },
  {
    id: "tenant-domain-repository-route-wiring",
    command: "persistent tenant/domain resolver plus public repository route wiring map",
    artifact: "coverage/public-content-resolver-wiring.json",
    status: "repository-gated",
  },
  {
    id: "seeded-db-or-cms-content-reads",
    command: "public content seeded DB/API redaction tests",
    artifact: "coverage/public-content-seeded-db-cms-redacted.json",
    status: "seed-gated",
  },
  {
    id: "api-json-and-rendered-html-redaction",
    command: "public content browser HTML redaction smoke",
    artifact: "coverage/public-content-rendered-html-redaction.json",
    status: "redaction-gated",
  },
  {
    id: "private-portfolio-exclusion",
    command: "public content seeded DB/API redaction tests",
    artifact: "coverage/public-content-api-json-redaction.json",
    status: "redaction-gated",
  },
  {
    id: "cache-revalidation-smoke",
    command: "public content cache revalidation smoke",
    artifact: "coverage/public-content-cache-revalidation.json",
    status: "cache-gated",
  },
  {
    id: "browser-and-ci-evidence",
    command: "public content browser HTML redaction smoke",
    artifact: "coverage/public-content-ci-evidence.json",
    status: "browser-ci-gated",
  },
] as const satisfies readonly PublicContentRuntimeMatrixEntry[];

export const publicContentRuntimeReadiness = buildPublicContentRuntimeEvidencePlan({
  packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  tenantDomainResolverBackedByPersistence: false,
  publicRepositoryReadsConfigured: false,
  publicRoutesUseRepositoryBundle: false,
  cmsOrDatabaseSeedVerified: false,
  apiJsonRedactionVerified: false,
  renderedHtmlRedactionVerified: false,
  privatePortfolioExcluded: false,
  cacheRevalidationConfigured: false,
  browserSmokePassed: false,
  ciEvidenceCaptured: false,
});
