import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildSearchConsoleArtifactReview,
  buildSearchConsoleEvidenceDecision,
  buildSearchConsoleExecutionPlan,
  buildSearchConsoleBackgroundJobPlan,
  buildSearchConsoleOperationRunData,
  buildTenantSearchConsoleOperation,
  createInMemorySearchConsolePersistenceRepository,
  persistSearchConsoleOperation,
  searchConsoleArtifactPaths,
  searchConsoleDashboardStatus,
  searchConsoleDecisionRequiredEvidence,
  searchConsoleExecutionPolicy,
  searchConsoleExternalCommands,
  searchConsoleLocalCommands,
  searchConsoleRequiredExternalEvidence,
  searchConsoleRequiredEnv,
  searchConsoleRuntimeContract,
  searchConsoleRuntimeCommands,
  searchConsoleRuntimeMatrix,
  searchConsoleRuntimeProofFiles,
} from "../lib/searchConsoleRuntime";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/seo/search-console/route.ts"), "utf8");
const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");
const ciWorkflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const unitManifest = readFileSync(join(process.cwd(), "testing/manifests/unit-test-manifest.json"), "utf8");
const gapTracker = readFileSync(join(process.cwd(), "GAP_TRACKER.md"), "utf8");
const rootPackageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const evidenceWriterSource = readFileSync(join(process.cwd(), "scripts/seo/write-search-console-evidence.mjs"), "utf8");

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
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(routeSource).toContain("idempotency-key");
    expect(routeSource).toContain("prisma.auditLog.create");
    expect(routeSource).toContain('entityType: "SearchConsoleOperation"');
    expect(routeSource).toContain("PROVIDER_SEARCH_CONSOLE_AUDIT_NOT_CONFIGURED");
    expect(routeSource).toContain("localSearchConsolePlanFallbackDisabled");
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
      "pnpm seo:search-console-evidence",
      "verified test-property sitemap submission smoke",
      "Search Console query/page import persistence tests",
      "Search Console background job and idempotency tests",
      "approved Search Console fixture/provider tests",
    ]);
    expect(searchConsoleRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "seo-typecheck",
      "seo-tests",
      "provider-route",
      "local-evidence-writer",
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

  it("builds a non-executing Search Console execution plan with local commands and external evidence gates", () => {
    const plan = buildSearchConsoleExecutionPlan({
      artifacts: searchConsoleArtifactPaths.map((path) => ({ path })),
      evidence: {
        seoTypecheckPassed: true,
        seoTestsPassed: true,
        providerRouteContractPassed: true,
        requiredEnvAuditCaptured: true,
        capturedArtifacts: searchConsoleArtifactPaths,
      },
    });

    expect(searchConsoleExecutionPolicy).toEqual({
      executeProviderRequests: false,
      executeLiveSitemapSubmission: false,
      executeProviderBackedPersistence: false,
      executeDurableBackgroundJobs: false,
      executeProviderSandbox: false,
      executeCi: false,
    });
    expect(plan.policy).toBe(searchConsoleExecutionPolicy);
    expect(plan.localCommands).toBe(searchConsoleLocalCommands);
    expect(plan.localCommands).toEqual([
      "pnpm --filter @inkroute/seo typecheck",
      "pnpm --filter @inkroute/seo test",
      "pnpm seo:search-console-evidence",
      "pnpm vitest run apps/dashboard/tests/search-console-route-static.test.ts",
    ]);
    expect(plan.externalCommands).toBe(searchConsoleExternalCommands);
    expect(plan.externalCommands).toEqual([
      "verified test-property sitemap submission smoke",
      "Search Console query/page import persistence tests",
      "Search Console background job and idempotency tests",
      "approved Search Console fixture/provider tests",
      "GitHub Actions Search Console runtime job",
    ]);
    expect(plan.requiredExternalEvidence).toBe(searchConsoleRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "verified Google Search Console test-property ownership proof",
      "live verified-property sitemap submission smoke evidence",
      "provider-backed Search Console query/page import persistence execution",
      "durable Search Console background job execution and idempotency evidence",
      "approved Search Console provider sandbox test evidence",
      "live CI evidence for Search Console runtime checks",
    ]);
    expect(plan.artifactReview.status).toBe("blocked");
    expect(plan.evidenceDecision.status).toBe("blocked");
    expect(plan.evidenceDecision.blockers).toEqual(expect.arrayContaining([
      "Verified test-property proof evidence is required.",
      "Verified-property sitemap submission smoke evidence is required.",
      "Search Console imported row persistence evidence is required.",
      "Search Console background job evidence is required.",
      "Approved Search Console fixture/provider evidence is required.",
      "CI Search Console runtime job evidence is required.",
    ]));
  });

  it("classifies GAP-075 Search Console evidence as blocked until every provider proof artifact is captured", () => {
    const blocked = buildSearchConsoleEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      providerRouteContractPassed: true,
      requiredEnvAuditCaptured: true,
      verifiedPropertyProofCaptured: false,
      sitemapSubmissionSmokePassed: false,
      queryPageImportFixturePassed: true,
      importedRowPersistenceVerified: false,
      backgroundJobVerified: false,
      idempotencyStoreVerified: false,
      providerSandboxPassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: ["coverage/search-console-provider-route.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Verified test-property proof evidence is required.",
        "Verified-property sitemap submission smoke evidence is required.",
        "Search Console imported row persistence evidence is required.",
        "Search Console operation idempotency store evidence is required.",
        "Approved Search Console fixture/provider evidence is required.",
      ]),
    );
    expect(blocked.blockers).not.toContain("Search Console query/page import fixture evidence is required.");
    expect(blocked.blockers).not.toContain("Secret-safe artifact review evidence is required.");
    expect(blocked.missingArtifacts).toContain("coverage/search-console-verified-property-proof-redacted.json");
    expect(blocked.requiredCommands).toBe(searchConsoleRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(searchConsoleDecisionRequiredEvidence);

    const complete = buildSearchConsoleEvidenceDecision({
      seoTypecheckPassed: true,
      seoTestsPassed: true,
      providerRouteContractPassed: true,
      requiredEnvAuditCaptured: true,
      verifiedPropertyProofCaptured: true,
      sitemapSubmissionSmokePassed: true,
      queryPageImportFixturePassed: true,
      importedRowPersistenceVerified: true,
      backgroundJobVerified: true,
      idempotencyStoreVerified: true,
      providerSandboxPassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: searchConsoleArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(searchConsoleDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe artifacts captured");
  });

  it("keeps CI, manifest, and tracker evidence tied to GAP-075", () => {
    expect(ciWorkflow).toContain("Run Phase 10 Search Console runtime contracts");
    expect(ciWorkflow).toContain("search-console-route-static.test.ts");
    expect(ciWorkflow).toContain("search-console-artifacts");
    expect(unitManifest).toContain("unit-dashboard-search-console-route-static");
    expect(unitManifest).toContain("searchConsoleRuntimeMatrix");
    expect(gapTracker).toContain("local in-memory Search Console persistence repository contract");
    expect(gapTracker).toContain("Search Console evidence classifier wired and runtime-matrix gated");
    expect(gapTracker).toContain("buildSearchConsoleExecutionPlan");
    expect(gapTracker).toContain("searchConsoleLocalCommands/searchConsoleExternalCommands");
    expect(gapTracker).toContain("searchConsoleExecutionPolicy");
    expect(gapTracker).toContain("searchConsoleRequiredExternalEvidence");
    expect(gapTracker).toContain("searchConsoleDecisionRequiredEvidence");
    expect(rootPackageJson).toContain("seo:search-console-evidence");
    expect(evidenceWriterSource).toContain("liveProviderCallExecuted: false");
    expect(evidenceWriterSource).toContain("verified Google Search Console test-property proof");
    expect(evidenceWriterSource).toContain("search-console-provider-route.json");
    expect(evidenceWriterSource).toContain("search-console-imported-row-persistence.json");
    expect(evidenceWriterSource).toContain("search-console-background-job.json");
    expect(evidenceWriterSource).toContain("search-console-idempotency-store.json");
    expect(evidenceWriterSource).toContain("search-console-ci-evidence.json");
    expect(evidenceWriterSource).toContain("search-console-sitemap-submission-redacted.json");
  });

  it("pins durable Search Console imported-row, operation, and idempotency persistence seams", () => {
    const schema = readFileSync(join(process.cwd(), "packages/db/prisma/schema.prisma"), "utf8");
    const migration = readFileSync(join(process.cwd(), "packages/db/prisma/migrations/20260613000200_add_search_console_persistence/migration.sql"), "utf8");
    const runtimeSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/searchConsoleRuntime.ts"), "utf8");
    const rangeStart = new Date("2026-06-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-06-08T00:00:00.000Z");
    const data = buildSearchConsoleOperationRunData({
      tenantId: "tenant_001",
      runId: "run_001",
      operation: "import_query_pages",
      siteUrl: "https://inkroute.example",
      idempotencyKey: "search-console:tenant_001:import_query_pages:2026-06-01",
      status: "imported",
      rangeStart,
      rangeEnd,
      rows: [{ query: "fine line tattoo", page: "/cities/seattle-wa", clicks: 3, impressions: 44 }],
    });

    expect(schema).toContain("model SearchConsoleImportedRow");
    expect(schema).toContain("model SearchConsoleOperationRun");
    expect(schema).toContain("searchConsoleImportedRows SearchConsoleImportedRow[]");
    expect(schema).toContain("searchConsoleOperationRuns SearchConsoleOperationRun[]");
    expect(migration).toContain('CREATE TABLE "SearchConsoleImportedRow"');
    expect(migration).toContain('CREATE TABLE "SearchConsoleOperationRun"');
    expect(data).toMatchObject({
      tenantId: "tenant_001",
      operation: "import_query_pages",
      siteUrl: "https://inkroute.example",
      status: "imported",
      idempotencyKey: "search-console:tenant_001:import_query_pages:2026-06-01",
    });
    expect(persistSearchConsoleOperation).toBeTypeOf("function");
    expect(runtimeSource).toContain("repository.searchConsoleOperationRun.upsert");
    expect(runtimeSource).toContain("repository.searchConsoleImportedRow.upsert");
  });

  it("executes local Search Console operation persistence, imported rows, and idempotency updates", async () => {
    const repository = createInMemorySearchConsolePersistenceRepository();
    const rangeStart = new Date("2026-06-01T00:00:00.000Z");
    const rangeEnd = new Date("2026-06-08T00:00:00.000Z");
    const input = {
      tenantId: "tenant_001",
      runId: "run_001",
      operation: "import_query_pages" as const,
      siteUrl: "https://inkroute.example",
      idempotencyKey: "search-console:tenant_001:import_query_pages:2026-06-01",
      status: "imported" as const,
      rangeStart,
      rangeEnd,
      rows: [
        {
          query: "seattle tattoo artist",
          page: "https://inkroute.example/cities/seattle-wa",
          clicks: 12,
          impressions: 120,
          ctr: 0.1,
          position: 4.2,
        },
      ],
      providerMetadata: { fixtureOnly: true, rawProviderPayloadStored: false },
    };

    await persistSearchConsoleOperation(repository, input);
    await persistSearchConsoleOperation(repository, { ...input, status: "blocked" });

    const snapshot = repository.snapshot();
    expect(snapshot.operationRuns).toHaveLength(1);
    expect(snapshot.operationRuns[0]).toMatchObject({
      tenantId: "tenant_001",
      operation: "import_query_pages",
      idempotencyKey: "search-console:tenant_001:import_query_pages:2026-06-01",
      status: "blocked",
    });
    expect(snapshot.importedRows).toHaveLength(1);
    expect(snapshot.importedRows[0]).toMatchObject({
      tenantId: "tenant_001",
      query: "seattle tattoo artist",
      page: "https://inkroute.example/cities/seattle-wa",
      clicks: 12,
      impressions: 120,
    });
  });

  it("reviews retained Search Console artifacts with recursive credential, provider token, and PII redaction", () => {
    const review = buildSearchConsoleArtifactReview({
      expectedArtifactPaths: ["coverage/search-console-provider-sandbox-redacted.json"],
      artifacts: [
        {
          path: "coverage/search-console-provider-sandbox-redacted.json",
          googlePrivateKey: "-----BEGIN PRIVATE KEY-----searchconsole-token-----END PRIVATE KEY-----",
          providerPayload: { authorization: "Bearer provider-token", client_email: "ari@example.test" },
          nested: [{ phone: "+1 206 555 0142", secret: "provider-secret" }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("PRIVATE KEY");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-secret");
    expect(review.blockers).toEqual([]);
  });

  it("source-wires durable background job plans into idempotent persistence input without provider execution", () => {
    const plan = buildSearchConsoleBackgroundJobPlan({
      tenantId: "tenant_001",
      tenantSlug: "inkroute-demo",
      operation: "import_query_pages",
      siteUrl: "https://inkroute.example",
      dateRangeDays: 7,
      now: new Date("2026-06-08T00:00:00.000Z"),
      credentialsConfigured: false,
    });
    const runtimeSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/searchConsoleRuntime.ts"), "utf8");

    expect(plan).toMatchObject({
      providerCallRequired: false,
      rawProviderPayloadStored: false,
      artifactPath: "coverage/search-console-background-job.json",
      persistenceInput: {
        tenantId: "tenant_001",
        runId: "search-console:tenant_001:import_query_pages:2026-06-08",
        idempotencyKey: "search-console:tenant_001:import_query_pages:2026-06-08",
        status: "blocked",
        providerMetadata: {
          backgroundJobPlanned: true,
          rawProviderPayloadStored: false,
        },
      },
    });
    expect(plan.persistenceInput.rangeStart.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(plan.persistenceInput.rangeEnd.toISOString()).toBe("2026-06-08T00:00:00.000Z");
    expect(runtimeSource).toContain("buildSearchConsoleBackgroundJobPlan");
    expect(runtimeSource).toContain("providerCallRequired");
    expect(runtimeSource).toContain("backgroundJobPlanned: true");
  });

  it("pins current Search Console proof files for GAP-075", () => {
    expect(searchConsoleRuntimeProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of searchConsoleRuntimeProofFiles) {
      expect(readFileSync(join(process.cwd(), file), "utf8").length).toBeGreaterThan(0);
    }
  });
});

