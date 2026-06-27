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

export interface PublicContentRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PublicContentEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly tenantDomainResolverEvidenceCaptured: boolean;
  readonly repositoryReadEvidenceCaptured: boolean;
  readonly routeApiAdoptionEvidenceCaptured: boolean;
  readonly seededContentEvidenceCaptured: boolean;
  readonly apiJsonRedactionEvidenceCaptured: boolean;
  readonly renderedHtmlRedactionEvidenceCaptured: boolean;
  readonly privatePortfolioExclusionEvidenceCaptured: boolean;
  readonly cacheRevalidationEvidenceCaptured: boolean;
  readonly browserCiEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly resolverReportPath?: string | null;
  readonly redactionReportPath?: string | null;
}

export interface PublicContentRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: PublicContentEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly tenantDomainResolverEvidenceCaptured: boolean;
  readonly repositoryReadEvidenceCaptured: boolean;
  readonly routeApiAdoptionEvidenceCaptured: boolean;
  readonly seededContentEvidenceCaptured: boolean;
  readonly apiJsonRedactionEvidenceCaptured: boolean;
  readonly renderedHtmlRedactionEvidenceCaptured: boolean;
  readonly privatePortfolioExclusionEvidenceCaptured: boolean;
  readonly cacheRevalidationEvidenceCaptured: boolean;
  readonly browserCiEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly resolverReportPath: string | null;
  readonly redactionReportPath: string | null;
}

export interface PublicContentRunRepository {
  readonly publicContentRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: PublicContentRunData;
      readonly update: Omit<PublicContentRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildPublicContentRunData(input: PublicContentRunRecordInput): PublicContentRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? publicContentRuntimeCommands,
    artifactManifest: input.artifacts ?? publicContentArtifactPaths,
    tenantDomainResolverEvidenceCaptured: input.tenantDomainResolverEvidenceCaptured,
    repositoryReadEvidenceCaptured: input.repositoryReadEvidenceCaptured,
    routeApiAdoptionEvidenceCaptured: input.routeApiAdoptionEvidenceCaptured,
    seededContentEvidenceCaptured: input.seededContentEvidenceCaptured,
    apiJsonRedactionEvidenceCaptured: input.apiJsonRedactionEvidenceCaptured,
    renderedHtmlRedactionEvidenceCaptured: input.renderedHtmlRedactionEvidenceCaptured,
    privatePortfolioExclusionEvidenceCaptured: input.privatePortfolioExclusionEvidenceCaptured,
    cacheRevalidationEvidenceCaptured: input.cacheRevalidationEvidenceCaptured,
    browserCiEvidenceCaptured: input.browserCiEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    resolverReportPath: input.resolverReportPath ?? null,
    redactionReportPath: input.redactionReportPath ?? null,
  };
}

export async function persistPublicContentRun(
  repository: PublicContentRunRepository,
  input: PublicContentRunRecordInput,
): Promise<unknown> {
  const data = buildPublicContentRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.publicContentRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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

export const publicContentRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/config/package.json",
  "packages/config/src/index.ts",
  "packages/config/tests/public-content.test.ts",
  "apps/dashboard/app/api/reviews/route.ts",
  "apps/dashboard/tests/review-read-route-static.test.ts",
  "apps/web/lib/publicContentRuntime.ts",
  "apps/web/tests/public-content-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034800_add_public_content_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const publicContentEvidenceFlags = [
  "configTestsPassed",
  "configTypecheckPassed",
  "webTypecheckPassed",
  "webBuildPassed",
  "tenantDomainResolverBackedByPersistence",
  "publicRepositoryReadsConfigured",
  "publicRoutesUseRepositoryBundle",
  "cmsOrDatabaseSeedVerified",
  "apiJsonRedactionVerified",
  "renderedHtmlRedactionVerified",
  "privatePortfolioExcluded",
  "cacheRevalidationConfigured",
  "browserSmokePassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PublicContentEvidenceFlag = (typeof publicContentEvidenceFlags)[number];

export interface PublicContentEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<PublicContentEvidenceFlag, boolean>>;
}

export interface PublicContentEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly PublicContentEvidenceFlag[];
  readonly requiredCommands: typeof publicContentRuntimeCommands;
  readonly requiredArtifacts: typeof publicContentArtifactPaths;
  readonly requiredEvidence: typeof publicContentEvidenceFlags;
  readonly blockers: readonly string[];
}

const publicContentEvidenceBlockers: Record<PublicContentEvidenceFlag, string> = {
  configTestsPassed: "Config package public content tests must pass.",
  configTypecheckPassed: "Config package typecheck must pass.",
  webTypecheckPassed: "Web app typecheck must pass.",
  webBuildPassed: "Web app build must pass.",
  tenantDomainResolverBackedByPersistence:
    "Tenant/domain resolver must graduate from the local demo resolver contract to persisted tenant records.",
  publicRepositoryReadsConfigured: "Public content reads must use repository-backed public projections.",
  publicRoutesUseRepositoryBundle: "Public routes and APIs must adopt the repository-backed public content bundle.",
  cmsOrDatabaseSeedVerified: "Seeded DB or CMS public content proof must be captured.",
  apiJsonRedactionVerified:
    "Public API JSON must be proven free of tenant IDs, artist IDs, attribution keys, private object keys, plan/status fields, and non-public portfolio records.",
  renderedHtmlRedactionVerified: "Rendered public HTML must be proven free of private client and file data.",
  privatePortfolioExcluded: "Private portfolio records must be excluded from public content responses.",
  cacheRevalidationConfigured: "Public content cache revalidation must be configured and smoke-tested.",
  browserSmokePassed: "Browser smoke evidence must cover portfolio, travel, FAQ, testimonials, city, and style pages.",
  ciEvidenceCaptured: "CI public content evidence must be captured.",
  secretSafeArtifactsCaptured: "Public content artifacts must be redacted and free of secrets, private client data, and private file identifiers.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildPublicContentEvidenceDecision = (
  input: PublicContentEvidenceInput,
): PublicContentEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, publicContentRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, publicContentArtifactPaths);
  const missingEvidence = publicContentEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => publicContentEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: publicContentRuntimeCommands,
    requiredArtifacts: publicContentArtifactPaths,
    requiredEvidence: publicContentEvidenceFlags,
    blockers,
  };
};

export interface PublicContentExecutionPolicy {
  readonly codexMayClassifyStaticPublicContentReadiness: true;
  readonly repositoryBackedReadsRequiredForClosure: true;
  readonly renderedRedactionProofRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface PublicContentExecutionPlan {
  readonly localCommands: typeof publicContentLocalCommands;
  readonly externalCommands: typeof publicContentExternalCommands;
  readonly requiredExternalEvidence: typeof publicContentRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof publicContentExecutionPolicy;
}

export interface PublicContentArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof publicContentRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const publicContentLocalCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "pnpm --filter @inkroute/web typecheck",
] as const;

export const publicContentExternalCommands = [
  "pnpm --filter @inkroute/web build",
  "public content seeded DB/API redaction tests",
  "public content browser HTML redaction smoke",
  "public content cache revalidation smoke",
  "provider-backed persistPublicContentRun execution",
  "CI public content runtime artifact capture",
] as const;

export const publicContentRequiredExternalEvidence = [
  "live persisted tenant/domain resolver evidence",
  "provider-backed PublicContentRun persistence execution",
  "repository-backed public content read transcript",
  "seeded DB or CMS public content proof",
  "route/API public content bundle adoption proof",
  "API JSON redaction proof",
  "rendered HTML redaction proof",
  "private portfolio, file, and client exclusion proof",
  "cache revalidation smoke output",
  "web build evidence",
  "browser smoke evidence",
  "CI artifact evidence",
  "secret-safe public content artifact review",
] as const;

export const publicContentExecutionPolicy: PublicContentExecutionPolicy = {
  codexMayClassifyStaticPublicContentReadiness: true,
  repositoryBackedReadsRequiredForClosure: true,
  renderedRedactionProofRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildPublicContentExecutionPlan = (): PublicContentExecutionPlan => ({
  localCommands: publicContentLocalCommands,
  externalCommands: publicContentExternalCommands,
  requiredExternalEvidence: publicContentRequiredExternalEvidence,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  browserExecutionAllowed: false,
  ciExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  executionPolicy: publicContentExecutionPolicy,
});

const publicContentSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|portfolio|artist|booking|email|phone|objectKey|attribution|plan|status)/i;

export const buildRedactedPublicContentArtifact = (artifact: unknown): Pick<PublicContentArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (publicContentSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_PUBLIC_CONTENT_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildPublicContentArtifactReview = (artifact: unknown): PublicContentArtifactReview => {
  const redacted = buildRedactedPublicContentArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "mysql://",
    "mongodb://",
    "client@example.com",
    "tenant.example.com",
    "private-file",
    "private/client",
    "file_",
    "sk_",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: publicContentRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};

export const publicContentRuntimeReadiness = buildPublicContentRuntimeEvidencePlan({
  packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  tenantDomainResolverBackedByPersistence: false,
  publicRepositoryReadsConfigured: true,
  publicRoutesUseRepositoryBundle: true,
  cmsOrDatabaseSeedVerified: false,
  apiJsonRedactionVerified: false,
  renderedHtmlRedactionVerified: false,
  privatePortfolioExcluded: false,
  cacheRevalidationConfigured: false,
  browserSmokePassed: false,
  ciEvidenceCaptured: false,
});



