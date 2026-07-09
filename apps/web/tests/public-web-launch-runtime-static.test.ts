import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPublicWebLaunchArtifactReview,
  buildPublicWebLaunchDecisionRequiredEvidence,
  buildPublicWebLaunchExecutionPlan,
  buildPublicWebLaunchRunData,
  buildRedactedPublicWebLaunchArtifact,
  publicWebLaunchArtifactPaths,
  publicWebLaunchExecutionPolicy,
  publicWebLaunchReadinessAreas,
  publicWebLaunchRunPersistenceContract,
  publicWebLaunchRequiredEvidence,
  publicWebLaunchRequiredExternalEvidence,
  publicWebLaunchRuntimeExternalArtifacts,
  publicWebLaunchRuntimeExternalCommands,
  publicWebLaunchRuntimeLocalArtifacts,
  publicWebLaunchRuntimeLocalCommands,
  publicWebLaunchRuntimeCommands,
  publicWebLaunchRuntimeMatrix,
  publicWebLaunchRuntimeReadiness,
  publicWebLaunchRuntimeProofFiles,
  buildPublicWebLaunchEvidenceDecision,
  persistPublicWebLaunchRun,
} from "../lib/publicWebLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public web launch runtime contract", () => {
  const webPackageJson = readRepoFile("apps/web/package.json");
  const seoSource = readRepoFile("packages/seo/src/index.ts");
  const seoTests = readRepoFile("packages/seo/tests/seo-engine.test.ts");
  const localRuntimeState = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const publicWebLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033000_add_public_web_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins public web launch commands, readiness areas, matrix rows, and artifacts", () => {
    expect(publicWebLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test",
      "pnpm test:e2e --project=web-chromium",
      "pnpm test:e2e --project=web-mobile",
      "axe accessibility audit for public routes",
      "Lighthouse performance audit for public launch routes",
      "runtime sitemap/robots/JSON-LD/canonical validation",
      "GitHub Actions public web launch evidence job",
    ]);
    expect(publicWebLaunchReadinessAreas).toContain("tenant-scoped-persistence");
    expect(publicWebLaunchReadinessAreas).toContain("secret-safe-launch-artifacts");
    expect(publicWebLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "web-typecheck",
      "web-build",
      "web-tests",
      "route-smoke",
      "desktop-playwright",
      "mobile-playwright",
      "accessibility-performance",
      "provider-db-routes",
      "media-derivatives",
      "runtime-seo-output",
      "legal-route-review",
      "ci-secret-safe-artifacts",
    ]);
    expect(publicWebLaunchArtifactPaths).toContain("coverage/public-web-launch-runtime.json");
    expect(publicWebLaunchArtifactPaths).toContain("test-results/public-web-launch-runtime");
  });

  it("pins the PublicWebLaunchRun persistence model and migration", () => {
    const runData = buildPublicWebLaunchRunData({
      tenantId: "tenant_static",
      runId: "public_web_static",
      commitSha: "abc123",
      status: "blocked",
      webTypecheckPassed: true,
      webBuildPassed: false,
      webTestsPassed: false,
      webRouteSmokePassed: false,
      webPlaywrightDesktopPassed: false,
      webPlaywrightMobilePassed: false,
      accessibilityAuditPassed: false,
      lighthousePerformancePassed: false,
      apiRoutesUseTenantScopedPersistence: false,
      providerBackedRoutesVerified: false,
      localRuntimeFallbackDisabledForProduction: false,
      realPortfolioDerivativesConfigured: false,
      placeholderAssetsRemovedOrDocumented: false,
      sitemapRuntimeVerified: false,
      robotsRuntimeVerified: false,
      jsonLdRuntimeVerified: false,
      canonicalRuntimeVerified: false,
      privacyAndLegalRoutesReviewed: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
      publicWebLaunchRunPersisted: false,
      coveredReadinessAreas: ["web-typecheck"],
      capturedArtifacts: [
        "coverage/public-web-launch-runtime.json",
        "coverage/public-web-typecheck.txt",
      ],
      completedCommands: ["pnpm --filter @inkroute/web typecheck"],
      webTypecheckArtifactPath: "coverage/public-web-typecheck.txt",
    });

    expect(publicWebLaunchRunPersistenceContract.model).toBe("PublicWebLaunchRun");
    expect(publicWebLaunchRunPersistenceContract.tenantRelation).toBe("publicWebLaunchRuns");
    expect(publicWebLaunchRunPersistenceContract.migration).toBe("20260609033000_add_public_web_launch_runs");
    expect(publicWebLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "providerRouteManifest",
      "runtimeSeoManifest",
      "legalRouteReviewManifest",
    ]);
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("webBuildPassed");
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("jsonLdRuntimeVerified");
    expect(publicWebLaunchRunPersistenceContract.evidenceBooleans).toContain("launchArtifactsSecretSafe");
    expect(publicWebLaunchRunPersistenceContract.artifactFields).toContain("runtimeSeoArtifactPath");
    expect(publicWebLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("publicWebLaunchRuns PublicWebLaunchRun[]");
    expect(prismaSchema).toContain("model PublicWebLaunchRun");
    expect(prismaSchema).toContain("runtimeSeoManifest");
    expect(prismaSchema).toContain("localRuntimeFallbackDisabledForProduction");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(publicWebLaunchMigration).toContain('CREATE TABLE "PublicWebLaunchRun"');
    expect(publicWebLaunchMigration).toContain('"runtimeSeoManifest" JSONB NOT NULL');
    expect(publicWebLaunchMigration).toContain('"launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(publicWebLaunchMigration).toContain('CREATE UNIQUE INDEX "PublicWebLaunchRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "public_web_static",
      commitSha: "abc123",
      status: "blocked",
      webTypecheckPassed: true,
      webBuildPassed: false,
      apiRoutesUseTenantScopedPersistence: false,
      webTypecheckArtifactPath: "coverage/public-web-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(publicWebLaunchRuntimeMatrix);
    expect(runData.readinessAreaManifest).toEqual(["web-typecheck"]);
    expect(runData.providerRouteManifest.productionLocalRuntimeFallbackDisabled).toBe(false);
    expect(String(persistPublicWebLaunchRun)).toContain("repository.publicWebLaunchRun.upsert");
  });

  it("keeps web package scripts, SEO helper tests, and local-runtime boundary wired", () => {
    expect(webPackageJson).toContain('"typecheck"');
    expect(webPackageJson).toContain('"build"');
    expect(webPackageJson).toContain('"test"');
    expect(seoSource).toContain("buildPublicWebLaunchEvidencePlan");
    expect(seoTests).toContain("buildPublicWebLaunchEvidencePlan");
    expect(localRuntimeState).toContain("local");
  });

  it("keeps public launch blockers explicit until runtime/provider/browser evidence exists", () => {
    expect(publicWebLaunchRuntimeReadiness.status).toBe("blocked");
    expect(publicWebLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(publicWebLaunchRuntimeReadiness.requiredCommands).toBe(publicWebLaunchRuntimeCommands);
    expect(publicWebLaunchRuntimeReadiness.requiredEvidence).toBe(publicWebLaunchRequiredEvidence);
    expect(publicWebLaunchRuntimeReadiness.blockers).toContain("@inkroute/web build must pass.");
    expect(publicWebLaunchRuntimeReadiness.blockers).toContain(
      "Public API routes must use tenant-scoped persistence instead of local runtime state in production.",
    );
    expect(publicWebLaunchRuntimeReadiness.blockers).not.toContain(
      "Local runtime fallback must be disabled or fail-closed for production.",
    );
  });

  it("blocks public web launch closure until browser, provider, SEO, legal, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildPublicWebLaunchEvidenceDecision({
      webTypecheckPassed: true,
      webBuildPassed: false,
      webTestsPassed: false,
      webRouteSmokePassed: false,
      webPlaywrightDesktopPassed: false,
      webPlaywrightMobilePassed: false,
      accessibilityAuditPassed: false,
      lighthousePerformancePassed: false,
      apiRoutesUseTenantScopedPersistence: false,
      providerBackedRoutesVerified: false,
      localRuntimeFallbackDisabledForProduction: false,
      realPortfolioDerivativesConfigured: false,
      placeholderAssetsRemovedOrDocumented: false,
      sitemapRuntimeVerified: false,
      robotsRuntimeVerified: false,
      jsonLdRuntimeVerified: false,
      canonicalRuntimeVerified: false,
      privacyAndLegalRoutesReviewed: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
      publicWebLaunchRunPersisted: false,
      coveredReadinessAreas: ["web-typecheck"],
      capturedArtifacts: [
        "coverage/public-web-launch-runtime.json",
        "coverage/public-web-typecheck.txt",
      ],
      completedCommands: ["pnpm --filter @inkroute/web typecheck"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReadinessAreas).toEqual([
      "web-build",
      "public-route-smoke",
      "desktop-playwright",
      "mobile-playwright",
      "accessibility-audit",
      "lighthouse-performance",
      "tenant-scoped-persistence",
      "provider-backed-routes",
      "production-local-runtime-fallback",
      "real-portfolio-derivatives",
      "placeholder-asset-disposition",
      "runtime-sitemap",
      "runtime-robots",
      "rendered-json-ld",
      "runtime-canonical",
      "legal-route-review",
      "ci-evidence",
      "secret-safe-launch-artifacts",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/public-web-build.txt",
      "coverage/public-web-test.txt",
      "coverage/public-web-route-smoke.json",
      "coverage/public-web-playwright-desktop.json",
      "coverage/public-web-playwright-mobile.json",
      "coverage/public-web-axe-audit.json",
      "coverage/public-web-lighthouse.json",
      "coverage/public-web-provider-routes.json",
      "coverage/public-web-media-derivatives.json",
      "coverage/public-web-runtime-seo.json",
      "coverage/public-web-legal-routes.json",
      "coverage/public-web-ci-evidence.json",
      "coverage/public-web-secret-safe-artifacts.json",
      "test-results/public-web-launch-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test",
      "pnpm test:e2e --project=web-chromium",
      "pnpm test:e2e --project=web-mobile",
      "axe accessibility audit for public routes",
      "Lighthouse performance audit for public launch routes",
      "runtime sitemap/robots/JSON-LD/canonical validation",
      "GitHub Actions public web launch evidence job",
    ]);
    expect(decision.requiredReadinessAreas).toBe(publicWebLaunchReadinessAreas);
    expect(decision.requiredArtifacts).toBe(publicWebLaunchArtifactPaths);
    expect(decision.requiredCommands).toBe(publicWebLaunchRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildPublicWebLaunchDecisionRequiredEvidence(publicWebLaunchRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(publicWebLaunchRequiredEvidence);
    expect(decision.blockers).toContain("@inkroute/web build must pass.");
    expect(decision.blockers).toContain("PublicWebLaunchRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required public web launch readiness area must be covered.");
  });

  it("completes public web launch closure when browser, provider, SEO, legal, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildPublicWebLaunchEvidenceDecision({
      webTypecheckPassed: true,
      webBuildPassed: true,
      webTestsPassed: true,
      webRouteSmokePassed: true,
      webPlaywrightDesktopPassed: true,
      webPlaywrightMobilePassed: true,
      accessibilityAuditPassed: true,
      lighthousePerformancePassed: true,
      apiRoutesUseTenantScopedPersistence: true,
      providerBackedRoutesVerified: true,
      localRuntimeFallbackDisabledForProduction: true,
      realPortfolioDerivativesConfigured: true,
      placeholderAssetsRemovedOrDocumented: true,
      sitemapRuntimeVerified: true,
      robotsRuntimeVerified: true,
      jsonLdRuntimeVerified: true,
      canonicalRuntimeVerified: true,
      privacyAndLegalRoutesReviewed: true,
      ciEvidenceCaptured: true,
      launchArtifactsSecretSafe: true,
      publicWebLaunchRunPersisted: true,
      coveredReadinessAreas: publicWebLaunchReadinessAreas,
      capturedArtifacts: publicWebLaunchArtifactPaths,
      completedCommands: publicWebLaunchRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 public web launch runtime contracts");
    expect(ciWorkflow).toContain("public-web-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("public-web-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-public-web-launch-runtime-static");
    expect(unitManifest).toContain("PublicWebLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("PublicWebLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/publicWebLaunchRuntime.ts");
    expect(gapTracker).toContain("persistPublicWebLaunchRun upsert seam");
    expect(gapTracker).toContain("buildPublicWebLaunchDecisionRequiredEvidence");
    expect(gapTracker).toContain("publicWebLaunchRequiredEvidence");
    expect(gapTracker).toContain("live web typecheck/build/test, route smoke, Playwright, axe/Lighthouse, provider/database route verification, real media derivatives, runtime SEO validation, legal-route review, CI evidence, provider-backed persistPublicWebLaunchRun execution, and secret-safe launch artifacts remain open");
    expect(gapTracker).toContain("GAP-006 is public-web-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current public web launch proof files for GAP-006", () => {
    expect(publicWebLaunchRuntimeProofFiles).toContain("apps/web/package.json");
    expect(publicWebLaunchRuntimeProofFiles).toContain("apps/web/lib/publicWebLaunchRuntime.ts");
    expect(publicWebLaunchRuntimeProofFiles).toContain("apps/web/tests/public-web-launch-runtime-static.test.ts");
    for (const proofFile of publicWebLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-006 execution policy non-executing while separating public web launch proof", () => {
    const plan = buildPublicWebLaunchExecutionPlan();

    expect(plan.localCommands).toBe(publicWebLaunchRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(publicWebLaunchRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(publicWebLaunchRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(publicWebLaunchRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(["coverage/public-web-launch-runtime.json", "coverage/public-web-typecheck.txt"]);
    expect(plan.externalArtifacts).toContain("coverage/public-web-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/public-web-launch-runtime");
    expect(plan.executionPolicy).toBe(publicWebLaunchExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(publicWebLaunchRequiredExternalEvidence);
    expect(plan).toMatchObject({
      webTypecheckExecutionAllowed: false,
      webBuildExecutionAllowed: false,
      webTestExecutionAllowed: false,
      routeSmokeExecutionAllowed: false,
      desktopPlaywrightExecutionAllowed: false,
      mobilePlaywrightExecutionAllowed: false,
      accessibilityAuditExecutionAllowed: false,
      lighthouseAuditExecutionAllowed: false,
      runtimeSeoValidationExecutionAllowed: false,
      ciLaunchEvidenceExecutionAllowed: false,
      providerBackedPersistenceExecutionAllowed: false,
      executionPolicy: {
        codexMayClassifyStaticPublicWebReadiness: true,
        browserRuntimeEvidenceRequiredForClosure: true,
        providerRouteEvidenceRequiredForClosure: true,
        runtimeSeoEvidenceRequiredForClosure: true,
        legalRouteReviewRequiredForClosure: true,
        providerDatabaseRequiredForPersistence: true,
        secretSafeArtifactsRequiredForClosure: true,
      },
    });
    expect(plan.requiredExternalEvidence).toContain("Public legal route review artifact.");
    expect(plan.requiredExternalEvidence).toContain(
      "Secret-safe launch artifacts with no provider secrets, client-private data, or raw tenant identifiers.",
    );
  });

  it("redacts public web launch artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "public_web_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      routeSmokeLog: "tenant tenant_01HZYXZYXZYXZYXZYXZYXZYXZ rendered for client@example.com",
      providerRouteEvidence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      renderedHtml: "<main>client@example.com private booking copy</main>",
      jsonLdSnapshot: "{\"url\":\"https://tenant.example.com/private\",\"name\":\"Private Studio\"}",
      legalReviewNotes: "private legal route note for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      mediaDerivativeUrl: "https://cdn.example.com/private/derivative.webp",
      placeholderAssetDisposition: "placeholder file public/placeholder-client-before.jpg",
      browserTrace: "playwright trace captured route_public_01HZYXZYXZYXZYXZYXZYXZYXZ for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      lighthouseOutput: "lighthouse_01HZYXZYXZYXZYXZYXZYXZYXZ flagged https://tenant.example.com/private",
      fallbackProof: "local fallback used static/demo/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ for booking_01HZYXZYXZYXZYXZYXZYXZYXZ",
      commandOutput: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ passed web:build",
      contactPhone: "+1 (555) 867-5309",
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_public_web_launch",
      reviewerHandle: "reviewer_public_web_owner",
      codeownerSelector: "CODEOWNER:web-platform-team",
    };

    expect(buildRedactedPublicWebLaunchArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      routeSmokeLog: "tenant [REDACTED] rendered for [REDACTED]",
      providerRouteEvidence: "[REDACTED]",
      renderedHtml: "[REDACTED]",
      jsonLdSnapshot: "[REDACTED]",
      legalReviewNotes: "[REDACTED]",
      mediaDerivativeUrl: "[REDACTED]",
      placeholderAssetDisposition: "[REDACTED]",
      browserTrace: "[REDACTED]",
      lighthouseOutput: "[REDACTED] flagged [REDACTED]",
      fallbackProof: "local fallback used [REDACTED] for [REDACTED]",
      commandOutput: "workflow [REDACTED] passed web:build",
      contactPhone: "[REDACTED]",
      repositorySelector: "[REDACTED]",
      pullRequestSelector: "[REDACTED]",
      reviewerHandle: "[REDACTED]",
      codeownerSelector: "[REDACTED]",
    });

    const review = buildPublicWebLaunchArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(publicWebLaunchRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "ciRunUrl",
        "routeSmokeLog",
        "providerRouteEvidence",
        "renderedHtml",
        "jsonLdSnapshot",
        "legalReviewNotes",
        "mediaDerivativeUrl",
        "placeholderAssetDisposition",
        "browserTrace",
        "lighthouseOutput",
        "fallbackProof",
        "commandOutput",
        "contactPhone",
        "repositorySelector",
        "pullRequestSelector",
        "reviewerHandle",
        "codeownerSelector",
      ]),
    );
    expect(JSON.stringify(review.artifact)).not.toContain("route_public_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("lighthouse_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("static/demo/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("repo:dominator509/InkRoute");
    expect(JSON.stringify(review.artifact)).not.toContain("pr_public_web_launch");
    expect(JSON.stringify(review.artifact)).not.toContain("reviewer_public_web_owner");
    expect(JSON.stringify(review.artifact)).not.toContain("CODEOWNER:web-platform-team");
    expect(review.requiredExternalEvidence).toContain(
      "Provider-backed PublicWebLaunchRun persistence row captured from the target database.",
    );
  });
});



