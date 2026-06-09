import {
  buildSearchConsoleOperationPlan,
  buildSearchConsoleRuntimeReadinessPlan,
  type SearchConsoleOperation,
  type SearchConsoleOperationPlan,
  type SearchConsoleRuntimeReadinessPlan,
} from "@inkroute/seo";
import { inkrouteDemoTenant } from "@inkroute/config";

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
  "verified test-property sitemap submission smoke",
  "Search Console query/page import persistence tests",
  "Search Console background job and idempotency tests",
  "approved Search Console fixture/provider tests",
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

export const searchConsoleRuntimeMatrix: readonly SearchConsoleRuntimeMatrixEntry[] = [
  { id: "seo-typecheck", command: "pnpm --filter @inkroute/seo typecheck", artifact: "coverage/search-console-seo-typecheck.txt", status: "wired" },
  { id: "seo-tests", command: "pnpm --filter @inkroute/seo test", artifact: "coverage/search-console-seo-test.txt", status: "wired" },
  { id: "provider-route", command: "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts", artifact: "coverage/search-console-provider-route.json", status: "wired" },
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
    backgroundJobsImplemented: false,
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
    approvedFixtureTestsPassed: false,
    providerSandboxOrTestPropertyPassed: false,
    auditLogPersistenceAvailable: true,
    idempotencyStoreAvailable: false,
  });
}

export const searchConsoleRuntimeContract = buildSearchConsoleRuntimeContract();
