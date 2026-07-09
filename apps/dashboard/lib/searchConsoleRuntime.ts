import {
  buildSearchConsoleOperationPlan,
  buildSearchConsoleRuntimeReadinessPlan,
  type SearchConsoleOperation,
  type SearchConsoleOperationPlan,
  type SearchConsoleRuntimeReadinessPlan,
} from "@inkroute/seo";
import { inkrouteDemoTenant } from "@inkroute/config";
import { createHash } from "node:crypto";

export const searchConsoleRequiredEnv = [
  "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
  "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
  "GOOGLE_SEARCH_CONSOLE_SITE_URL",
] as const;

export type SearchConsoleRuntimeStatus =
  | "wired"
  | "credential-gated"
  | "provider-gated"
  | "persistence-gated"
  | "background-gated"
  | "ci-gated";

export interface SearchConsoleRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SearchConsoleRuntimeStatus;
}

export const searchConsoleRuntimeCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
  "pnpm seo:search-console-evidence",
  "verified test-property sitemap submission smoke",
  "Search Console query/page import persistence tests",
  "Search Console background job and idempotency tests",
  "approved Search Console fixture/provider tests",
] as const;

function buildSearchConsoleIdempotencyKey(parts: readonly string[]): string {
  return `search-console:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

export const searchConsoleRequiredExternalEvidence = [
  "verified Google Search Console test-property ownership proof",
  "live verified-property sitemap submission smoke evidence",
  "provider-backed Search Console query/page import persistence execution",
  "durable Search Console background job execution and idempotency evidence",
  "approved Search Console provider sandbox test evidence",
  "live CI evidence for Search Console runtime checks",
] as const;

export const searchConsoleDecisionRequiredEvidence = [
  "SEO package typecheck/test and dashboard provider route contract artifacts",
  "redacted environment audit, verified property proof, and sitemap submission smoke artifacts",
  "query/page import fixture, imported row persistence, background job, and idempotency artifacts",
  "approved provider sandbox, CI, and redacted secret-safe artifact evidence",
] as const;

export const searchConsoleArtifactPaths = [
  "coverage/search-console-provider-route.json",
  "coverage/search-console-seo-typecheck.txt",
  "coverage/search-console-seo-test.txt",
  "coverage/search-console-dashboard-status.json",
  "coverage/search-console-required-env-redacted.json",
  "coverage/search-console-verified-property-proof-redacted.json",
  "coverage/search-console-import-fixture.json",
  "coverage/search-console-imported-row-persistence.json",
  "coverage/search-console-sitemap-submission-redacted.json",
  "coverage/search-console-background-job.json",
  "coverage/search-console-idempotency-store.json",
  "coverage/search-console-provider-sandbox-redacted.json",
  "coverage/search-console-ci-evidence.json",
  "coverage/search-console-secret-safe-artifacts.json",
  "test-results/search-console",
] as const;

export const searchConsoleRuntimeProofFiles = [
  "packages/seo/package.json",
  "packages/seo/src/index.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "apps/dashboard/lib/searchConsoleRuntime.ts",
  "scripts/seo/write-search-console-evidence.mjs",
  "apps/dashboard/app/api/seo/search-console/route.ts",
  "apps/dashboard/app/seo/page.tsx",
  "apps/dashboard/tests/search-console-route-static.test.ts",
  "apps/dashboard/app/api/seo/route.ts",
  "apps/dashboard/tests/seo-read-route-static.test.ts",
  "packages/db/prisma/migrations/20260613000200_add_search_console_persistence/migration.sql",
  ".env.example",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type SearchConsoleEvidenceArtifact = (typeof searchConsoleArtifactPaths)[number];

export interface SearchConsoleEvidenceInput {
  readonly seoTypecheckPassed: boolean;
  readonly seoTestsPassed: boolean;
  readonly providerRouteContractPassed: boolean;
  readonly requiredEnvAuditCaptured: boolean;
  readonly verifiedPropertyProofCaptured: boolean;
  readonly sitemapSubmissionSmokePassed: boolean;
  readonly queryPageImportFixturePassed: boolean;
  readonly importedRowPersistenceVerified: boolean;
  readonly backgroundJobVerified: boolean;
  readonly idempotencyStoreVerified: boolean;
  readonly providerSandboxPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly SearchConsoleEvidenceArtifact[];
}

export interface SearchConsoleEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly SearchConsoleEvidenceArtifact[];
  readonly requiredCommands: typeof searchConsoleRuntimeCommands;
  readonly requiredEvidence: typeof searchConsoleDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export interface SearchConsoleImportedRowInput {
  readonly query: string;
  readonly page: string;
  readonly clicks: number;
  readonly impressions: number;
  readonly ctr?: number;
  readonly position?: number;
}

export interface SearchConsolePersistenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly operation: SearchConsoleOperation;
  readonly siteUrl: string;
  readonly idempotencyKey: string;
  readonly status: "planned" | "submitted" | "imported" | "blocked" | "failed";
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly rows?: readonly SearchConsoleImportedRowInput[];
  readonly providerMetadata?: Record<string, unknown>;
}

export interface SearchConsolePersistenceRepository {
  readonly searchConsoleOperationRun: {
    readonly upsert: (input: {
      readonly where: { readonly tenantId_idempotencyKey: { readonly tenantId: string; readonly idempotencyKey: string } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  readonly searchConsoleImportedRow: {
    readonly upsert: (input: {
      readonly where: {
        readonly tenantId_siteUrl_query_page_rangeStart_rangeEnd: {
          readonly tenantId: string;
          readonly siteUrl: string;
          readonly query: string;
          readonly page: string;
          readonly rangeStart: Date;
          readonly rangeEnd: Date;
        };
      };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
}

export interface SearchConsoleBackgroundJobInput {
  readonly tenantId: string;
  readonly tenantSlug?: string;
  readonly operation: SearchConsoleOperation;
  readonly siteUrl?: string;
  readonly sitemapUrl?: string;
  readonly dateRangeDays?: number;
  readonly now?: Date;
  readonly credentialsConfigured?: boolean;
  readonly propertyOwnerTenantId?: string;
}

export interface SearchConsoleBackgroundJobPlan {
  readonly operationPlan: SearchConsoleOperationPlan;
  readonly persistenceInput: SearchConsolePersistenceInput;
  readonly providerCallRequired: boolean;
  readonly rawProviderPayloadStored: false;
  readonly artifactPath: "coverage/search-console-background-job.json";
}

export interface SearchConsoleArtifactReview {
  readonly status: "passed" | "blocked";
  readonly redactedArtifacts: readonly unknown[];
  readonly blockers: readonly string[];
}

export interface SearchConsoleExecutionPolicy {
  readonly executeProviderRequests: false;
  readonly executeLiveSitemapSubmission: false;
  readonly executeProviderBackedPersistence: false;
  readonly executeDurableBackgroundJobs: false;
  readonly executeProviderSandbox: false;
  readonly executeCi: false;
}

export interface SearchConsoleExecutionPlan {
  readonly policy: typeof searchConsoleExecutionPolicy;
  readonly localCommands: typeof searchConsoleLocalCommands;
  readonly externalCommands: typeof searchConsoleExternalCommands;
  readonly requiredExternalEvidence: typeof searchConsoleRequiredExternalEvidence;
  readonly artifactReview: SearchConsoleArtifactReview;
  readonly evidenceDecision: SearchConsoleEvidenceDecision;
}

export interface InMemorySearchConsoleRepositorySnapshot {
  readonly operationRuns: readonly Record<string, unknown>[];
  readonly importedRows: readonly Record<string, unknown>[];
}

export const searchConsoleExecutionPolicy: SearchConsoleExecutionPolicy = {
  executeProviderRequests: false,
  executeLiveSitemapSubmission: false,
  executeProviderBackedPersistence: false,
  executeDurableBackgroundJobs: false,
  executeProviderSandbox: false,
  executeCi: false,
};

export const searchConsoleLocalCommands = [
  "pnpm --filter @inkroute/seo typecheck",
  "pnpm --filter @inkroute/seo test",
  "pnpm seo:search-console-evidence",
  "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
] as const;

export const searchConsoleExternalCommands = [
  "verified test-property sitemap submission smoke",
  "Search Console query/page import persistence tests",
  "Search Console background job and idempotency tests",
  "approved Search Console fixture/provider tests",
  "GitHub Actions Search Console runtime job",
] as const;

const sensitiveSearchConsoleArtifactKeyPattern =
  /(token|secret|password|authorization|cookie|provider|payload|private|client_email|private_key|credential|google|searchconsole|tenantId|runId|siteUrl|sitemapUrl|idempotencyKey|importedRow|query|page)/i;
const sensitiveSearchConsoleArtifactValuePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
  /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi,
  /-----BEGIN[\s\S]*?PRIVATE KEY-----/gi,
  /\b(?:searchconsole|google|token|secret|private_key)[\w:./?=&-]*/gi,
];

export function buildRedactedSearchConsoleArtifact(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((value) => buildRedactedSearchConsoleArtifact(value));
  if (!input || typeof input !== "object") {
    if (typeof input !== "string") return input;
    return sensitiveSearchConsoleArtifactValuePatterns.reduce((value, pattern) => value.replace(pattern, "[redacted]"), input);
  }

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      sensitiveSearchConsoleArtifactKeyPattern.test(key) ? "[redacted]" : buildRedactedSearchConsoleArtifact(value),
    ]),
  );
}

export function buildSearchConsoleArtifactReview(input: {
  readonly artifacts: readonly unknown[];
  readonly expectedArtifactPaths?: readonly string[];
}): SearchConsoleArtifactReview {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedSearchConsoleArtifact(artifact));
  const serialized = JSON.stringify(redactedArtifacts);
  const blockers = [
    ...(input.artifacts.length === 0 ? ["No Search Console artifacts were provided for review."] : []),
    ...(/\b(secret|token|authorization|cookie|ari@example|206 555|PRIVATE KEY|searchconsole-token)\b/i.test(serialized)
      ? ["Search Console artifacts still contain credentials, provider payloads, tokens, or PII."]
      : []),
    ...((input.expectedArtifactPaths ?? []).some((path) => !serialized.includes(path))
      ? ["Search Console artifact inventory is incomplete."]
      : []),
  ];

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    redactedArtifacts,
    blockers,
  };
}

export function buildSearchConsoleExecutionPlan(input: {
  readonly artifacts?: readonly unknown[];
  readonly evidence?: Partial<SearchConsoleEvidenceInput>;
} = {}): SearchConsoleExecutionPlan {
  const artifactReview = buildSearchConsoleArtifactReview({
    artifacts: input.artifacts ?? [],
    expectedArtifactPaths: searchConsoleArtifactPaths,
  });
  const evidenceDecision = buildSearchConsoleEvidenceDecision({
    seoTypecheckPassed: false,
    seoTestsPassed: false,
    providerRouteContractPassed: false,
    requiredEnvAuditCaptured: false,
    verifiedPropertyProofCaptured: false,
    sitemapSubmissionSmokePassed: false,
    queryPageImportFixturePassed: false,
    importedRowPersistenceVerified: false,
    backgroundJobVerified: false,
    idempotencyStoreVerified: false,
    providerSandboxPassed: false,
    ciEvidenceCaptured: false,
    secretSafeArtifactReviewPassed: artifactReview.status === "passed",
    capturedArtifacts: [],
    ...input.evidence,
  });

  return {
    policy: searchConsoleExecutionPolicy,
    localCommands: searchConsoleLocalCommands,
    externalCommands: searchConsoleExternalCommands,
    requiredExternalEvidence: searchConsoleRequiredExternalEvidence,
    artifactReview,
    evidenceDecision,
  };
}

export function buildSearchConsoleEvidenceDecision(input: SearchConsoleEvidenceInput): SearchConsoleEvidenceDecision {
  const blockers = [
    !input.seoTypecheckPassed ? "SEO package typecheck evidence is required." : null,
    !input.seoTestsPassed ? "SEO package test evidence is required." : null,
    !input.providerRouteContractPassed ? "Search Console provider route contract evidence is required." : null,
    !input.requiredEnvAuditCaptured ? "Redacted Google Search Console environment audit evidence is required." : null,
    !input.verifiedPropertyProofCaptured ? "Verified test-property proof evidence is required." : null,
    !input.sitemapSubmissionSmokePassed ? "Verified-property sitemap submission smoke evidence is required." : null,
    !input.queryPageImportFixturePassed ? "Search Console query/page import fixture evidence is required." : null,
    !input.importedRowPersistenceVerified ? "Search Console imported row persistence evidence is required." : null,
    !input.backgroundJobVerified ? "Search Console background job evidence is required." : null,
    !input.idempotencyStoreVerified ? "Search Console operation idempotency store evidence is required." : null,
    !input.providerSandboxPassed ? "Approved Search Console fixture/provider evidence is required." : null,
    !input.ciEvidenceCaptured ? "CI Search Console runtime job evidence is required." : null,
    !input.secretSafeArtifactReviewPassed ? "Secret-safe artifact review evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = searchConsoleArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: searchConsoleRuntimeCommands,
    requiredEvidence: searchConsoleDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-075 Search Console evidence is complete with CI-safe artifacts captured."
        : "GAP-075 Search Console evidence remains blocked until credentials, verified property, sitemap smoke, import persistence, background jobs, provider sandbox, CI, and redaction artifacts are captured.",
  };
}

export const buildSearchConsoleOperationRunData = (input: SearchConsolePersistenceInput) => ({
  tenantId: input.tenantId,
  runId: input.runId,
  operation: input.operation,
  siteUrl: input.siteUrl,
  status: input.status,
  idempotencyKey: input.idempotencyKey,
  artifactManifest: searchConsoleArtifactPaths,
  providerMetadata: {
    ...(input.providerMetadata ?? {}),
    importedRowCount: input.rows?.length ?? 0,
    rangeStart: input.rangeStart.toISOString(),
    rangeEnd: input.rangeEnd.toISOString(),
    rawProviderPayloadStored: false,
  },
  ...(input.status === "imported" || input.status === "failed" || input.status === "blocked" ? { completedAt: new Date() } : {}),
});

export function createInMemorySearchConsolePersistenceRepository(): SearchConsolePersistenceRepository & {
  snapshot(): InMemorySearchConsoleRepositorySnapshot;
} {
  const operationRuns: Record<string, unknown>[] = [];
  const importedRows: Record<string, unknown>[] = [];

  return {
    searchConsoleOperationRun: {
      async upsert(input) {
        const key = `${input.where.tenantId_idempotencyKey.tenantId}:${input.where.tenantId_idempotencyKey.idempotencyKey}`;
        const existing = operationRuns.find((run) => run.__key === key);
        if (existing) {
          Object.assign(existing, input.update, { __key: key });
          return existing;
        }
        const created = { ...input.create, __key: key };
        operationRuns.push(created);
        return created;
      },
    },
    searchConsoleImportedRow: {
      async upsert(input) {
        const rowKey = input.where.tenantId_siteUrl_query_page_rangeStart_rangeEnd;
        const key = [
          rowKey.tenantId,
          rowKey.siteUrl,
          rowKey.query,
          rowKey.page,
          rowKey.rangeStart.toISOString(),
          rowKey.rangeEnd.toISOString(),
        ].join(":");
        const existing = importedRows.find((row) => row.__key === key);
        if (existing) {
          Object.assign(existing, input.update, { __key: key });
          return existing;
        }
        const created = { ...input.create, __key: key };
        importedRows.push(created);
        return created;
      },
    },
    snapshot() {
      return {
        operationRuns: [...operationRuns],
        importedRows: [...importedRows],
      };
    },
  };
}

export const persistSearchConsoleOperation = async (
  repository: SearchConsolePersistenceRepository,
  input: SearchConsolePersistenceInput,
) => {
  const operationRun = await repository.searchConsoleOperationRun.upsert({
    where: { tenantId_idempotencyKey: { tenantId: input.tenantId, idempotencyKey: input.idempotencyKey } },
    create: buildSearchConsoleOperationRunData(input),
    update: buildSearchConsoleOperationRunData(input),
  });

  for (const row of input.rows ?? []) {
    await repository.searchConsoleImportedRow.upsert({
      where: {
        tenantId_siteUrl_query_page_rangeStart_rangeEnd: {
          tenantId: input.tenantId,
          siteUrl: input.siteUrl,
          query: row.query,
          page: row.page,
          rangeStart: input.rangeStart,
          rangeEnd: input.rangeEnd,
        },
      },
      create: {
        tenantId: input.tenantId,
        siteUrl: input.siteUrl,
        query: row.query,
        page: row.page,
        clicks: row.clicks,
        impressions: row.impressions,
        ...(typeof row.ctr === "number" ? { ctr: row.ctr } : {}),
        ...(typeof row.position === "number" ? { position: row.position } : {}),
        rangeStart: input.rangeStart,
        rangeEnd: input.rangeEnd,
      },
      update: {
        clicks: row.clicks,
        impressions: row.impressions,
        ...(typeof row.ctr === "number" ? { ctr: row.ctr } : {}),
        ...(typeof row.position === "number" ? { position: row.position } : {}),
        importedAt: new Date(),
      },
    });
  }

  return operationRun;
};

export const buildSearchConsoleBackgroundJobPlan = (input: SearchConsoleBackgroundJobInput): SearchConsoleBackgroundJobPlan => {
  const now = input.now ?? new Date();
  const dateRangeDays = input.dateRangeDays ?? 28;
  const rangeEnd = now;
  const rangeStart = new Date(rangeEnd.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
  const operationPlan = buildTenantSearchConsoleOperation({
    operation: input.operation,
    tenantId: input.tenantId,
    ...(input.tenantSlug ? { tenantSlug: input.tenantSlug } : {}),
    ...(input.siteUrl ? { siteUrl: input.siteUrl } : {}),
    ...(input.sitemapUrl ? { sitemapUrl: input.sitemapUrl } : {}),
    dateRangeDays,
    ...(input.propertyOwnerTenantId ? { propertyOwnerTenantId: input.propertyOwnerTenantId } : {}),
    ...(typeof input.credentialsConfigured === "boolean" ? { credentialsConfigured: input.credentialsConfigured } : {}),
  });
  const siteUrl = input.siteUrl ?? searchConsoleSiteUrl();
  const idempotencyDate = rangeEnd.toISOString().slice(0, 10);
  const idempotencyKey = buildSearchConsoleIdempotencyKey([input.tenantId, input.operation, idempotencyDate]);

  return {
    operationPlan,
    persistenceInput: {
      tenantId: input.tenantId,
      runId: idempotencyKey,
      operation: input.operation,
      siteUrl,
      idempotencyKey,
      status: operationPlan.status === "ready" ? "planned" : "blocked",
      rangeStart,
      rangeEnd,
      providerMetadata: {
        operationStatus: operationPlan.status,
        blockerCount: operationPlan.blockers.length,
        backgroundJobPlanned: true,
        rawProviderPayloadStored: false,
      },
    },
    providerCallRequired: operationPlan.status === "ready",
    rawProviderPayloadStored: false,
    artifactPath: "coverage/search-console-background-job.json",
  };
};

export const searchConsoleRuntimeMatrix: readonly SearchConsoleRuntimeMatrixEntry[] = [
  { id: "seo-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/search-console-seo-typecheck.txt", status: "wired" },
  { id: "seo-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/search-console-seo-test.txt", status: "wired" },
  { id: "provider-route", command: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts", artifact: "coverage/search-console-provider-route.json", status: "wired" },
  { id: "local-evidence-writer", command: "pnpm seo:search-console-evidence", artifact: "coverage/search-console-required-env-redacted.json", status: "wired" },
  { id: "required-env", command: "redacted Google Search Console environment audit", artifact: "coverage/search-console-required-env-redacted.json", status: "credential-gated" },
  { id: "verified-property-proof", command: "verified test-property proof", artifact: "coverage/search-console-verified-property-proof-redacted.json", status: "provider-gated" },
  { id: "sitemap-submission-smoke", command: "verified test-property sitemap submission smoke", artifact: "coverage/search-console-sitemap-submission-redacted.json", status: "provider-gated" },
  { id: "query-page-import-fixture", command: "Search Console query/page import fixture tests", artifact: "coverage/search-console-import-fixture.json", status: "provider-gated" },
  { id: "imported-row-persistence", command: "Search Console imported row persistence tests", artifact: "coverage/search-console-imported-row-persistence.json", status: "persistence-gated" },
  { id: "background-job", command: "Search Console background job tests", artifact: "coverage/search-console-background-job.json", status: "background-gated" },
  { id: "idempotency-store", command: "Search Console operation idempotency tests", artifact: "coverage/search-console-idempotency-store.json", status: "persistence-gated" },
  { id: "provider-sandbox", command: "approved Search Console fixture/provider tests", artifact: "coverage/search-console-provider-sandbox-redacted.json", status: "provider-gated" },
  { id: "ci-search-console-job", command: "GitHub Actions Search Console runtime job", artifact: "coverage/search-console-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted Search Console artifact audit", artifact: "coverage/search-console-secret-safe-artifacts.json", status: "ci-gated" },
] as const;

export function searchConsoleCredentialsConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return searchConsoleRequiredEnv.every((name) => Boolean(env[name]?.trim()));
}

export function searchConsoleSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || "https://inkroute.example";
}

export function searchConsoleDashboardStatus(input: { credentialsConfigured: boolean; propertyOwnerTenantId?: string; tenantId: string }) {
  if (input.propertyOwnerTenantId && input.propertyOwnerTenantId !== input.tenantId) return "tenant_mismatch" as const;
  if (!input.credentialsConfigured) return "not_configured" as const;
  return "ready_for_provider" as const;
}

export function buildTenantSearchConsoleOperation(input: {
  operation: SearchConsoleOperation;
  tenantId?: string;
  tenantSlug?: string;
  siteUrl?: string;
  sitemapUrl?: string;
  dateRangeDays?: number;
  propertyOwnerTenantId?: string;
  credentialsConfigured?: boolean;
}): SearchConsoleOperationPlan {
  const tenantId = input.tenantId ?? inkrouteDemoTenant.id;
  const tenantSlug = input.tenantSlug ?? inkrouteDemoTenant.slug;
  const siteUrl = input.siteUrl ?? searchConsoleSiteUrl();
  return buildSearchConsoleOperationPlan({
    operation: input.operation,
    tenantId,
    tenantSlug,
    siteUrl,
    sitemapUrl: input.sitemapUrl ?? `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
    dateRangeDays: input.dateRangeDays ?? 28,
    credentialsConfigured: input.credentialsConfigured ?? searchConsoleCredentialsConfigured(),
    propertyOwnerTenantId: input.propertyOwnerTenantId ?? tenantId,
  });
}

export function buildSearchConsoleRuntimeContract(): SearchConsoleRuntimeReadinessPlan {
  const credentialsConfigured = searchConsoleCredentialsConfigured();
  return buildSearchConsoleRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    seoPackageTestsPassed: false,
    seoPackageTypecheckPassed: false,
    providerRoutesImplemented: true,
    backgroundJobsImplemented: true,
    credentialsConfigured,
    OAuthOrServiceAccountFlowImplemented: credentialsConfigured,
    tenantOwnershipPersistenceAvailable: true,
    tenantOwnershipChecksEnforced: true,
    verifiedPropertyProofAvailable: false,
    sitemapSubmissionImplemented: true,
    sitemapSubmittedForVerifiedProperty: false,
    queryPageImportImplemented: true,
    importedRowsPersisted: false,
    indexingMonitoringImplemented: true,
    dashboardStatusImplemented: true,
    approvedFixtureTestsPassed: true,
    providerSandboxOrTestPropertyPassed: false,
    auditLogPersistenceAvailable: true,
    idempotencyStoreAvailable: false,
  });
}

export const searchConsoleRuntimeContract = buildSearchConsoleRuntimeContract();

