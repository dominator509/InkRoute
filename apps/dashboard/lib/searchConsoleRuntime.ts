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

export const searchConsoleArtifactPaths = [
  "coverage/search-console-provider-route.json",
  "coverage/search-console-dashboard-status.json",
  "coverage/search-console-import-fixture.json",
  "coverage/search-console-sitemap-submission-redacted.json",
  "test-results/search-console",
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
