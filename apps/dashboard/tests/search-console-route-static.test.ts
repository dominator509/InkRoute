import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildTenantSearchConsoleOperation,
  searchConsoleArtifactPaths,
  searchConsoleDashboardStatus,
  searchConsoleRequiredEnv,
  searchConsoleRuntimeContract,
  searchConsoleRuntimeCommands,
  searchConsoleRuntimeMatrix,
} from "../lib/searchConsoleRuntime";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/search-console/route.ts"), "utf8");
const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");

describe("GAP-075 Search Console provider boundary", () => {
  it("requires Google Search Console env vars and keeps operations credential gated", () => {
    expect(searchConsoleRequiredEnv).toEqual([
      "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
      "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
      "GOOGLE_SEARCH_CONSOLE_SITE_URL",
    ]);
    expect(envExample).toContain("GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=");
    expect(envExample).toContain("GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=");
    expect(envExample).toContain("GOOGLE_SEARCH_CONSOLE_SITE_URL=");
  });

  it("plans verified sitemap submission and query/page imports through provider endpoints", () => {
    const sitemap = buildTenantSearchConsoleOperation({
      operation: "submit_sitemap",
      credentialsConfigured: true,
      siteUrl: "https://inkroute.example",
      sitemapUrl: "https://inkroute.example/sitemap.xml",
    });
    const imports = buildTenantSearchConsoleOperation({ operation: "import_query_pages", credentialsConfigured: true, dateRangeDays: 28 });
    expect(sitemap.steps[0]?.providerEndpoint).toBe("searchconsole.sitemaps.submit");
    expect(imports.steps[0]?.providerEndpoint).toBe("searchconsole.searchanalytics.query");
    expect(imports.shouldStoreImportedRows).toBe(true);
  });

  it("exposes tenant-scoped dashboard status and ownership mismatch states", () => {
    expect(searchConsoleDashboardStatus({ credentialsConfigured: false, tenantId: "tenant_1" })).toBe("not_configured");
    expect(searchConsoleDashboardStatus({ credentialsConfigured: true, tenantId: "tenant_1", propertyOwnerTenantId: "tenant_2" })).toBe("tenant_mismatch");
    expect(searchConsoleDashboardStatus({ credentialsConfigured: true, tenantId: "tenant_1", propertyOwnerTenantId: "tenant_1" })).toBe("ready_for_provider");
  });

  it("guards dashboard routes with RBAC, tenant isolation, no-store, audit logs, and idempotency metadata", () => {
    expect(routeSource).toContain('assertPermission(actor, "seo:read")');
    expect(routeSource).toContain('assertPermission(actor, "seo:write")');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(routeSource).toContain("idempotency-key");
    expect(routeSource).toContain("prisma.auditLog.create");
    expect(routeSource).toContain('entityType: "SearchConsoleOperation"');
  });

  it("tracks remaining runtime proof and artifact outputs explicitly", () => {
    expect(searchConsoleRuntimeContract.status).toBe("blocked");
    expect(searchConsoleRuntimeContract.blockers).toContain("Verified test property proof must be available.");
    expect(searchConsoleRuntimeContract.blockers).toContain("Search Console operation idempotency store must be available.");
    expect(searchConsoleArtifactPaths).toContain("coverage/search-console-sitemap-submission-redacted.json");
    expect(searchConsoleArtifactPaths).toContain("test-results/search-console");
  });

  it("pins the Search Console runtime matrix and live-provider proof boundaries", () => {
    expect(searchConsoleRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
      "verified test-property sitemap submission smoke",
      "Search Console query/page import persistence tests",
      "Search Console background job and idempotency tests",
      "approved Search Console fixture/provider tests",
    ]);
    expect(searchConsoleRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "provider-route",
      "required-env",
      "verified-property-proof",
      "sitemap-submission-smoke",
      "query-page-import-fixture",
      "imported-row-persistence",
      "background-job",
      "idempotency-store",
      "provider-sandbox",
      "ci-search-console-job",
      "secret-safe-artifacts",
    ]);
    expect(searchConsoleRuntimeContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "credential-managed provider route/job execution evidence",
        "tenant ownership persistence, ownership checks, and verified property proof evidence",
        "verified-property sitemap submission evidence",
        "query/page import, persisted rows, indexing monitoring, and dashboard status evidence",
        "fixture/provider execution, audit, and idempotency evidence",
      ]),
    );
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-075", () => {
    expect(ciWorkflow).toContain("Run Phase 10 Search Console runtime contracts");
    expect(ciWorkflow).toContain("search-console-route-static.test.ts");
    expect(ciWorkflow).toContain("search-console-artifacts");
    expect(unitManifest).toContain("unit-dashboard-search-console-route-static");
    expect(unitManifest).toContain("searchConsoleRuntimeMatrix");
    expect(gapTracker).toContain("GAP-075 is search-console-runtime-matrix wired");
  });
});
