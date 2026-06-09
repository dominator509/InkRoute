import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSecurityCoverageRunPersistenceContract,
  securityAutomatedCoverageArtifactPaths,
  securityAutomatedCoverageCommands,
  securityAutomatedCoverageReadiness,
  securityAutomatedCoverageSuites,
  securityCoverageRunPersistencePreview,
} from "../lib/securityAutomatedCoverage";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-103 security automated coverage contract", () => {
  it("maps package, route, middleware, Playwright, DB, storage, privacy, and role-boundary security suites", () => {
    expect(securityAutomatedCoverageSuites.map((suite) => suite.id)).toEqual(
      expect.arrayContaining([
        "security-package",
        "security-route-vitest",
        "security-middleware-runtime",
        "security-middleware-static",
        "security-playwright",
        "security-db-tenant-isolation",
        "security-storage-provider-negative",
        "security-privacy-workflow-integration",
        "security-authenticated-role-boundary",
      ]),
    );
    expect(securityAutomatedCoverageCommands).toContain("pnpm --filter @inkroute/security test");
    expect(securityAutomatedCoverageCommands).toContain(
      "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
    );
    expect(securityAutomatedCoverageArtifactPaths).toContain("coverage/security-failure-mode-fixtures.md");
  });

  it("keeps existing Phase 13 route/runtime/static/E2E specs in the automated coverage set", () => {
    const upload = readWorkspaceFile("apps/web/tests/secure-upload-intents-route.test.ts");
    const publicPrivacy = readWorkspaceFile("apps/web/tests/privacy-requests-public-route.test.ts");
    const dashboardPrivacy = readWorkspaceFile("apps/web/tests/privacy-requests-dashboard-route.test.ts");
    const trustStatus = readWorkspaceFile("apps/web/tests/dashboard-trust-status-route.test.ts");
    const middleware = readWorkspaceFile("apps/web/tests/security-runtime-middleware.test.ts");
    const webE2e = readWorkspaceFile("apps/web/tests/e2e/security-runtime.spec.ts");
    const dashboardE2e = readWorkspaceFile("apps/dashboard/tests/e2e/security-runtime.spec.ts");

    expect(upload).toContain("secure-upload");
    expect(publicPrivacy).toContain("public privacy request route");
    expect(dashboardPrivacy).toContain("dashboard privacy request route");
    expect(trustStatus).toContain("GAP-103");
    expect(middleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(webE2e).toContain("x-inkroute-security-runtime");
    expect(dashboardE2e).toContain("x-inkroute-security-runtime");
  });

  it("keeps readiness blocked until execution, provider, DB, artifacts, and failure fixtures are real", () => {
    expect(securityAutomatedCoverageReadiness.status).toBe("blocked");
    expect(securityAutomatedCoverageReadiness.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/security package tests must execute and pass with upload, privacy, abuse, header, CSRF, and readiness coverage.",
        "Runtime middleware Vitest suite must pass for web/dashboard CSRF block/allow and shared headers.",
        "Web Playwright security smoke must pass for headers and cookie-authenticated CSRF rejection.",
        "DB-backed tenant isolation tests must pass for security/privacy/trust routes.",
        "Storage provider or emulator negative tests must pass for unsafe upload, private original public denial, signed URL revocation, and derivative exposure.",
        "Security failure-mode fixtures must document upload, privacy, trust, middleware, CSRF, and provider-backed negative cases.",
      ]),
    );
    expect(securityAutomatedCoverageReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "route, runtime middleware, static wiring, and manifest verification test output",
        "authenticated DB-backed tenant isolation, role-boundary, and privacy workflow integration output",
        "storage/provider negative tests, coverage artifacts, and documented security failure fixtures",
      ]),
    );
  });

  it("pins durable SecurityCoverageRun rows, provider-gated suites, artifact manifests, and failure fixtures", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildSecurityCoverageRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "security-run-demo",
      commitSha: "abc1234",
      status: "provider_gated",
      suiteMatrix: securityAutomatedCoverageSuites,
      providerGatedSuites: ["security-db-tenant-isolation", "security-storage-provider-negative"],
      artifactManifest: securityAutomatedCoverageArtifactPaths,
      failureFixturesPath: "coverage/security-failure-mode-fixtures.md",
      dbIsolationCovered: false,
      storageNegativeCovered: false,
      privacyWorkflowCovered: false,
      roleBoundaryCovered: false,
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted",
    });

    expect(schema).toContain("model SecurityCoverageRun");
    expect(schema).toContain("suiteMatrix");
    expect(schema).toContain("artifactManifest");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["SecurityCoverageRun", "AuditLog"]);
    expect(contract.requiredCoverageFlags).toContain("storageNegativeCovered");
    expect(contract.artifactFields).toContain("failureFixturesPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(securityCoverageRunPersistencePreview.modelName).toBe("SecurityCoverageRun");
  });

  it("pins CI, manifest, checklist, and tracker references for GAP-103", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const checklist = readWorkspaceFile("testing/manifests/security-checklist.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 13 security automated coverage contracts");
    expect(ci).toContain("apps/web/tests/security-automated-coverage-static.test.ts");
    expect(ci).toContain("security-automated-coverage-artifacts");
    expect(manifest).toContain("unit-web-security-automated-coverage-static");
    expect(manifest).toContain("SecurityCoverageRun Prisma model and app row contract are wired");
    expect(checklist).toContain("security");
    expect(tracker).toContain("apps/web/lib/securityAutomatedCoverage.ts");
    expect(tracker).toContain("live execution/provider security proof remains open");
  });
});
