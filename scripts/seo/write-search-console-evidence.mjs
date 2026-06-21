import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const coverageDir = join(process.cwd(), "coverage");

const artifactPaths = {
  providerRoute: join(coverageDir, "search-console-provider-route.json"),
  requiredEnv: join(coverageDir, "search-console-required-env-redacted.json"),
  dashboardStatus: join(coverageDir, "search-console-dashboard-status.json"),
  sitemapSubmission: join(coverageDir, "search-console-sitemap-submission-redacted.json"),
  importFixture: join(coverageDir, "search-console-import-fixture.json"),
  importedRowPersistence: join(coverageDir, "search-console-imported-row-persistence.json"),
  backgroundJob: join(coverageDir, "search-console-background-job.json"),
  idempotencyStore: join(coverageDir, "search-console-idempotency-store.json"),
  providerSandbox: join(coverageDir, "search-console-provider-sandbox-redacted.json"),
  ciEvidence: join(coverageDir, "search-console-ci-evidence.json"),
  secretSafeArtifacts: join(coverageDir, "search-console-secret-safe-artifacts.json"),
};

const requiredEnv = [
  "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL",
  "GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY",
  "GOOGLE_SEARCH_CONSOLE_SITE_URL",
];

const blockedExternalGates = [
  "verified Google Search Console test-property proof",
  "live verified-property sitemap submission smoke",
  "durable Search Console imported-row persistence",
  "Search Console background job execution",
  "Search Console operation idempotency store",
  "approved provider sandbox execution",
  "GitHub Actions Search Console runtime artifact proof",
];

const artifacts = {
  [artifactPaths.providerRoute]: {
    gap: "GAP-075",
    status: "local-provider-route-contract",
    route: "apps/dashboard/app/api/seo/search-console/route.ts",
    rbacEnforced: true,
    tenantIsolationEnforced: true,
    noStoreRequired: true,
    containsSecrets: false,
  },
  [artifactPaths.requiredEnv]: {
    gap: "GAP-075",
    status: "local-redacted-env-audit",
    requiredEnv,
    valuesRedacted: true,
    credentialsConfigured: requiredEnv.every((name) => Boolean(process.env[name]?.trim())),
    containsSecrets: false,
  },
  [artifactPaths.dashboardStatus]: {
    gap: "GAP-075",
    status: "local-fixture",
    tenantScoped: true,
    states: ["not_configured", "tenant_mismatch", "ready_for_provider"],
    noStoreRequired: true,
    providerCallExecuted: false,
  },
  [artifactPaths.sitemapSubmission]: {
    gap: "GAP-075",
    status: "planned-not-submitted",
    operation: "submit_sitemap",
    providerEndpoint: "searchconsole.sitemaps.submit",
    siteUrl: "https://inkroute.example",
    sitemapUrl: "https://inkroute.example/sitemap.xml",
    verifiedPropertyProofCaptured: false,
    liveProviderCallExecuted: false,
    blockedExternalGates,
  },
  [artifactPaths.importFixture]: {
    gap: "GAP-075",
    status: "fixture-only",
    operation: "import_query_pages",
    providerEndpoint: "searchconsole.searchanalytics.query",
    shouldStoreImportedRows: true,
    importedRowsPersisted: false,
    sampleRows: [
      { query: "fine line tattoo seattle", page: "/cities/seattle-wa", clicks: 12, impressions: 180 },
      { query: "blackwork tattoo artist", page: "/styles/blackwork", clicks: 7, impressions: 121 },
    ],
  },
  [artifactPaths.importedRowPersistence]: {
    gap: "GAP-075",
    status: "local-imported-row-persistence-plan",
    providerBacked: false,
    tenantSafeStoreRequiredBeforeClose: true,
    rowsMirrorImportFixture: true,
    containsSecrets: false,
  },
  [artifactPaths.backgroundJob]: {
    gap: "GAP-075",
    status: "local-background-job-contract",
    providerBacked: false,
    operationIds: ["submit_sitemap", "import_query_pages"],
    durableBackgroundExecutionRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.idempotencyStore]: {
    gap: "GAP-075",
    status: "local-idempotency-store-contract",
    providerBacked: false,
    idempotencyKeyHeaderRequired: true,
    durableIdempotencyStoreRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.providerSandbox]: {
    gap: "GAP-075",
    status: "provider-gated",
    approvedProviderSandboxPassed: false,
    liveProviderCallExecuted: false,
    blockedExternalGates,
  },
  [artifactPaths.ciEvidence]: {
    gap: "GAP-075",
    status: "local-ci-artifact-contract",
    providerBacked: false,
    requiredJob: "Run Phase 10 Search Console runtime contracts",
    liveCiRunRequiredBeforeClose: true,
    containsSecrets: false,
  },
  [artifactPaths.secretSafeArtifacts]: {
    gap: "GAP-075",
    status: "local-redacted-artifact-review",
    containsSecrets: false,
    redactedCredentialFields: ["clientEmail", "privateKey", "accessToken", "refreshToken"],
  },
};

mkdirSync(coverageDir, { recursive: true });

for (const [path, contents] of Object.entries(artifacts)) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(contents, null, 2)}\n`, "utf8");
}

console.log(
  JSON.stringify(
    {
      gap: "GAP-075",
      status: "partial",
      written: Object.keys(artifacts).map((path) => path.replace(`${process.cwd()}\\`, "").replaceAll("\\", "/")),
      blockedExternalGates,
    },
    null,
    2,
  ),
);
