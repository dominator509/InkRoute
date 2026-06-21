import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSecurityAutomatedCoverageEvidenceDecision,
  buildSecurityAutomatedCoverageArtifactReview,
  buildSecurityAutomatedCoverageExecutionPlan,
  buildSecurityCoverageRunData,
  buildSecurityCoverageRunPersistenceContract,
  buildRedactedSecurityAutomatedCoverageArtifact,
  persistSecurityCoverageRun,
  securityAutomatedCoverageArtifactPaths,
  securityAutomatedCoverageCommands,
  securityAutomatedCoverageExternalArtifacts,
  securityAutomatedCoverageExternalCommands,
  securityAutomatedCoverageExecutionPolicy,
  securityAutomatedCoverageLocalArtifacts,
  securityAutomatedCoverageLocalCommands,
  securityAutomatedCoverageProofFiles,
  securityAutomatedCoverageReadiness,
  securityAutomatedCoverageRequiredExternalEvidence,
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
    const webMiddlewareStatic = readWorkspaceFile("apps/web/tests/security-runtime-middleware-static.test.ts");
    const dashboardMiddlewareStatic = readWorkspaceFile("apps/web/tests/dashboard-security-runtime-middleware-static.test.ts");
    const webE2e = readWorkspaceFile("apps/web/tests/e2e/security-runtime.spec.ts");
    const dashboardE2e = readWorkspaceFile("apps/dashboard/tests/e2e/security-runtime.spec.ts");

    expect(upload).toContain("secure-upload");
    expect(publicPrivacy).toContain("public privacy request route");
    expect(dashboardPrivacy).toContain("dashboard privacy request route");
    expect(trustStatus).toContain("GAP-103");
    expect(middleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(webMiddlewareStatic).toContain("headers: noStoreHeaders");
    expect(dashboardMiddlewareStatic).toContain("headers: noStoreHeaders");
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

  it("pins current security automated coverage proof files for GAP-103", () => {
    expect(securityAutomatedCoverageProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/app/api/security/trust-status/route.ts",
      "apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
      "apps/web/tests/security-runtime-middleware-static.test.ts",
      "packages/security/tests/upload-policy.test.ts",
      "packages/security/package.json",
        "packages/security/src/index.ts",
        "apps/web/lib/securityAutomatedCoverage.ts",
        "apps/web/tests/security-automated-coverage-static.test.ts",
        "apps/web/tests/secure-upload-intents-route.test.ts",
        "packages/db/prisma/migrations/20260609006000_add_security_coverage_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of securityAutomatedCoverageProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
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
    const runData = buildSecurityCoverageRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "security-run-demo",
      status: "provider_gated",
      failureFixturesPath: "coverage/security-failure-mode-fixtures.md",
    });
    expect(persistSecurityCoverageRun).toBeTypeOf("function");
    expect(String(persistSecurityCoverageRun)).toContain("repository.securityCoverageRun.upsert");
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
    expect(tracker).toContain("Security automated coverage evidence classifier wired and execution/provider proof gated");
    expect(tracker).toContain("GAP-103 is security-automated-coverage-matrix wired with evidence classifier");
    expect(tracker).toContain("persistSecurityCoverageRun upsert seam");
    expect(tracker).toContain("securityAutomatedCoverageLocalArtifacts");
    expect(tracker).toContain("securityAutomatedCoverageExternalArtifacts");
  });

  it("classifies GAP-103 evidence as blocked until execution and provider security proof is captured", () => {
    const blockedDecision = buildSecurityAutomatedCoverageEvidenceDecision({
      packageSuitePassed: true,
      routeVitestSuitePassed: true,
      middlewareRuntimeSuitePassed: true,
      middlewareStaticSuitePassed: true,
      webDashboardPlaywrightPassed: false,
      dbTenantIsolationPassed: false,
      storageProviderNegativePassed: false,
      privacyWorkflowIntegrationPassed: false,
      authenticatedRoleBoundaryPassed: false,
      fullUnitCiPassed: false,
      failureFixturesDocumented: false,
      requiredCommandsRun: securityAutomatedCoverageCommands.filter(
        (command) =>
          command !== "pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts" &&
          command !== "DB-backed tenant-isolation security integration tests" &&
          command !== "storage/provider negative security tests",
      ),
      capturedArtifacts: [
        "coverage/security-automated-coverage.json",
        "coverage/security-package-tests.json",
        "coverage/security-route-vitest.json",
        "coverage/security-middleware-runtime.json",
        "coverage/security-middleware-static.json",
        "test-results/security-automated",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run web/dashboard Playwright security smoke suite.",
        "Run DB-backed tenant-isolation security tests.",
        "Run storage/provider negative security tests.",
        "Run privacy workflow security integration tests.",
        "Run authenticated role-boundary security tests.",
        "Run full unit and CI security checks.",
        "Document security failure-mode fixtures.",
        "Required command not recorded: pnpm exec playwright test apps/web/tests/e2e/security-runtime.spec.ts apps/dashboard/tests/e2e/security-runtime.spec.ts",
        "Required command not recorded: DB-backed tenant-isolation security integration tests",
        "Required command not recorded: storage/provider negative security tests",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/security-web-playwright.json",
        "coverage/security-dashboard-playwright.json",
        "coverage/security-db-tenant-isolation.json",
        "coverage/security-storage-provider-negative.json",
        "coverage/security-failure-mode-fixtures.md",
      ]),
    );
    expect(blockedDecision.coveragePolicy).toEqual({
      providerGatedSuitesMustExecute: true,
      failureFixturesRequired: true,
      ciArtifactsRetained: true,
    });

    const completeDecision = buildSecurityAutomatedCoverageEvidenceDecision({
      packageSuitePassed: true,
      routeVitestSuitePassed: true,
      middlewareRuntimeSuitePassed: true,
      middlewareStaticSuitePassed: true,
      webDashboardPlaywrightPassed: true,
      dbTenantIsolationPassed: true,
      storageProviderNegativePassed: true,
      privacyWorkflowIntegrationPassed: true,
      authenticatedRoleBoundaryPassed: true,
      fullUnitCiPassed: true,
      failureFixturesDocumented: true,
      requiredCommandsRun: securityAutomatedCoverageCommands,
      capturedArtifacts: securityAutomatedCoverageArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(securityAutomatedCoverageCommands);
    expect(completeDecision.requiredEvidence).toBe(securityAutomatedCoverageArtifactPaths);
  });

  it("keeps GAP-103 provider-gated security suite execution disabled in the local plan", () => {
    const plan = buildSecurityAutomatedCoverageExecutionPlan();

    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.dbTenantIsolationExecutionAllowed).toBe(false);
    expect(plan.storageProviderExecutionAllowed).toBe(false);
    expect(plan.privacyWorkflowExecutionAllowed).toBe(false);
    expect(plan.roleBoundaryExecutionAllowed).toBe(false);
    expect(plan.ciPersistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(securityAutomatedCoverageExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(securityAutomatedCoverageRequiredExternalEvidence);
    expect(securityAutomatedCoverageExecutionPolicy.externalEvidenceRequired).toBe(securityAutomatedCoverageRequiredExternalEvidence);
    expect(securityAutomatedCoverageRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Web/dashboard Playwright security smoke proof",
      "DB-backed tenant-isolation security proof",
      "Storage/provider negative security proof",
      "Provider-backed SecurityCoverageRun persistence proof",
      "Security failure-mode fixture proof",
    ]));
    expect(plan.localCommands).toBe(securityAutomatedCoverageLocalCommands);
    expect(plan.externalCommands).toBe(securityAutomatedCoverageExternalCommands);
    expect(plan.localArtifacts).toBe(securityAutomatedCoverageLocalArtifacts);
    expect(plan.externalArtifacts).toBe(securityAutomatedCoverageExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/security-automated-coverage.json",
      "coverage/security-package-tests.json",
      "coverage/security-route-vitest.json",
      "coverage/security-middleware-runtime.json",
      "coverage/security-middleware-static.json",
      "test-results/security-automated",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/security-web-playwright.json",
      "coverage/security-dashboard-playwright.json",
      "coverage/security-db-tenant-isolation.json",
      "coverage/security-storage-provider-negative.json",
      "coverage/security-failure-mode-fixtures.md",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("DB-backed tenant-isolation proof requires provider-backed database fixtures.");
  });

  it("redacts GAP-103 coverage run and provider artifacts before review", () => {
    const rawArtifact = {
      runId: "security-run-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      artifactManifest: ["coverage/private-provider-artifact.json"],
      failureFixturesPath: "coverage/security-failure-mode-fixtures-private.md",
      providerPayload: { rawBody: "{\"email\":\"client@example.com\",\"phone\":\"+1 555 616 7171\"}" },
      headers: ["Authorization: Bearer coverage-secret-token"],
      stack: "Error: coverage persistence failed",
    };

    const redacted = buildRedactedSecurityAutomatedCoverageArtifact(rawArtifact);
    const review = buildSecurityAutomatedCoverageArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("security-run-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("coverage/private-provider-artifact.json");
    expect(serialized).not.toContain("security-failure-mode-fixtures-private.md");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 616 7171");
    expect(serialized).not.toContain("coverage-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(securityAutomatedCoverageArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "DB-backed tenant-isolation security proof",
      "Storage/provider negative security proof",
      "Security failure-mode fixture proof",
    ]));
  });
});

