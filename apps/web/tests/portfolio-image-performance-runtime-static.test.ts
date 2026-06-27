import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPortfolioImagePerformanceEvidenceDecision,
  buildPortfolioImagePerformanceExecutionPlan,
  buildPortfolioImagePerformanceArtifactReview,
  buildPortfolioImagePerformanceRunData,
  buildRedactedPortfolioImagePerformanceArtifact,
  persistPortfolioImagePerformanceRun,
  portfolioImagePerformanceArtifactPaths,
  portfolioImagePerformanceCommands,
  portfolioImagePerformanceControls,
  portfolioImagePerformanceEvidenceFlags,
  portfolioImagePerformanceExternalCommands,
  portfolioImagePerformanceExecutionPolicy,
  portfolioImagePerformanceLocalCommands,
  portfolioImagePerformanceMatrix,
  portfolioImagePerformanceReadiness,
  portfolioImagePerformanceRequiredExternalEvidence,
  portfolioImagePerformanceRunPersistenceContract,
} from "../lib/portfolioImagePerformanceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const repoFileExists = (path: string) => existsSync(join(process.cwd(), path));

describe("portfolio image performance runtime contract", () => {
  const portfolioCard = readRepoFile("apps/web/components/PortfolioCard.tsx");
  const portfolioPage = readRepoFile("apps/web/app/portfolio/page.tsx");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const configTests = readRepoFile("packages/config/tests/public-content.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const portfolioImagePerformanceRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035000_add_portfolio_image_performance_runs/migration.sql");

  it("pins portfolio image performance commands, matrix rows, and artifact paths", () => {
    expect(portfolioImagePerformanceCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "portfolio image browser rendering smoke",
      "private original/reference access-denial tests",
      "Lighthouse image/performance audit",
    ]);
    expect(portfolioImagePerformanceMatrix.map((entry) => entry.id)).toEqual([
      "config-and-web-package-gates",
      "checked-in-public-derivative-fixtures",
      "next-image-dimensions-sizes-blur",
      "exif-private-original-denial",
      "browser-rendering-and-lighthouse",
      "ci-secret-safe-artifacts",
    ]);
    expect(portfolioImagePerformanceArtifactPaths).toContain("coverage/portfolio-image-performance-runtime.json");
    expect(portfolioImagePerformanceArtifactPaths).toContain("coverage/portfolio-image-lighthouse.json");
    expect(portfolioImagePerformanceArtifactPaths).toContain("test-results/portfolio-image-performance-runtime");
  });

  it("pins portfolio image performance control helper identity", () => {
    const decision = buildPortfolioImagePerformanceEvidenceDecision({
      commands: portfolioImagePerformanceCommands,
      artifacts: portfolioImagePerformanceArtifactPaths,
      controls: portfolioImagePerformanceControls,
      evidence: Object.fromEntries(portfolioImagePerformanceEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof portfolioImagePerformanceEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(portfolioImagePerformanceControls);
    expect(gapTracker).toContain("portfolioImagePerformanceControls");
  });

  it("keeps next/image wiring, derivative metadata, and checked-in public fixtures visible", () => {
    expect(portfolioCard).toContain('from "next/image"');
    expect(portfolioCard).toContain('placeholder="blur"');
    expect(portfolioCard).toContain("data-storage-visibility={image.storageVisibility}");
    expect(portfolioCard).toContain("data-private-original-available={String(image.privateOriginalAvailable)}");
    expect(portfolioPage).toContain("Next/Image cards");
    expect(portfolioPage).toContain("public derivative fixtures");
    expect(portfolioPage).not.toContain("CSS image placeholders");
    expect(configSource).toContain("buildPortfolioImagePerformanceEvidencePlan");
    expect(configSource).toContain('storageVisibility: "public_derivative"');
    expect(configSource).toContain("privateOriginalAvailable: false");
    for (const fixture of ["orbital-serpent", "ritual-floral", "black-sun", "silent-gate", "moon-thread", "bone-orchid"]) {
      expect(repoFileExists(`apps/web/public/demo/portfolio/${fixture}.svg`)).toBe(true);
    }
    expect(configTests).toContain("derives public portfolio image metadata without exposing private originals");
    expect(configTests).toContain("blocks portfolio image performance evidence until optimized derivatives, private-denial, browser, and Lighthouse proof exist");
  });

  it("keeps launch evidence blocked until storage-backed fixtures, private denial, browser, Lighthouse, CI, and web proof execute", () => {
    expect(portfolioImagePerformanceReadiness.status).toBe("blocked");
    expect(portfolioImagePerformanceReadiness.missingScripts).toEqual([]);
    expect(portfolioImagePerformanceReadiness.requiredCommands).toBe(portfolioImagePerformanceCommands);
    expect(portfolioImagePerformanceReadiness.requiredControls).toBe(portfolioImagePerformanceControls);
    expect(portfolioImagePerformanceReadiness.requiredEvidence).toBe(portfolioImagePerformanceEvidenceFlags);
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Storage-backed derivative fixtures must prove public derivatives resolve independently from private originals.");
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Private original/reference access-denial tests must pass.");
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Lighthouse image/performance audit must pass or document accepted image-specific exceptions.");
  });

  it("pins the PortfolioImagePerformanceRun persistence model and migration", () => {
    const runData = buildPortfolioImagePerformanceRunData({
      tenantId: "tenant_static",
      runId: "portfolio_image_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["portfolio image browser rendering smoke"],
      artifacts: ["coverage/portfolio-image-browser-rendering.json"],
      derivativeFixtureEvidenceCaptured: true,
      nextImageEvidenceCaptured: true,
      exifStrippingEvidenceCaptured: false,
      privateOriginalDenialEvidenceCaptured: false,
      browserRenderingEvidenceCaptured: false,
      lighthouseEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      derivativeFixtureReportPath: "coverage/portfolio-image-derivative-fixtures.json",
      lighthouseReportPath: "coverage/portfolio-image-lighthouse.json",
    });

    expect(portfolioImagePerformanceRunPersistenceContract).toEqual({
      prismaModel: "PortfolioImagePerformanceRun",
      tenantRelation: "portfolioImagePerformanceRuns",
      migration: "20260609035000_add_portfolio_image_performance_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDerivativeFixtureEvidence: true,
      storesNextImageEvidence: true,
      storesExifStrippingEvidence: true,
      storesPrivateOriginalDenialEvidence: true,
      storesBrowserRenderingEvidence: true,
      storesLighthouseEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "portfolio_image_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["portfolio image browser rendering smoke"],
      artifactManifest: ["coverage/portfolio-image-browser-rendering.json"],
      derivativeFixtureEvidenceCaptured: true,
      nextImageEvidenceCaptured: true,
      exifStrippingEvidenceCaptured: false,
      privateOriginalDenialEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      derivativeFixtureReportPath: "coverage/portfolio-image-derivative-fixtures.json",
      lighthouseReportPath: "coverage/portfolio-image-lighthouse.json",
    });
    expect(String(persistPortfolioImagePerformanceRun)).toContain("repository.portfolioImagePerformanceRun.upsert");
    expect(prismaSchema).toContain("model PortfolioImagePerformanceRun");
    expect(prismaSchema).toContain("portfolioImagePerformanceRuns PortfolioImagePerformanceRun[]");
    expect(prismaSchema).toContain("derivativeFixtureEvidenceCaptured");
    expect(prismaSchema).toContain("lighthouseEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(portfolioImagePerformanceRunMigration).toContain('CREATE TABLE "PortfolioImagePerformanceRun"');
    expect(portfolioImagePerformanceRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(portfolioImagePerformanceRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(portfolioImagePerformanceRunMigration).toContain('"PortfolioImagePerformanceRun_tenantId_runId_key"');
  });

  it("blocks portfolio image performance completion when storage, privacy, browser, Lighthouse, or safe evidence is missing", () => {
    const decision = buildPortfolioImagePerformanceEvidenceDecision({
      commands: ["pnpm --filter @inkroute/config typecheck"],
      artifacts: ["coverage/portfolio-image-config-typecheck.txt"],
      controls: ["serve-only-public-derivative-objects-from-public-portfolio-cards"],
      evidence: {
        configTypecheckPassed: true,
        realPublicDerivativeAssetsAvailable: true,
        nextImageMigrationCompleted: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Lighthouse image/performance audit");
    expect(decision.missingArtifacts).toContain("coverage/portfolio-image-lighthouse.json");
    expect(decision.missingControls).toContain("strip-exif-private-metadata-before-derivative-publication");
    expect(decision.missingEvidence).toContain("storageBackedDerivativeFixturesAvailable");
    expect(decision.missingEvidence).toContain("privateOriginalAccessDenied");
    expect(decision.blockers).toContain(
      "Storage-backed derivative fixtures must prove public derivatives resolve independently from private originals.",
    );
    expect(decision.blockers).toContain("Private original/reference access-denial tests must pass.");
  });

  it("completes portfolio image performance only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(portfolioImagePerformanceEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildPortfolioImagePerformanceEvidenceDecision({
      commands: portfolioImagePerformanceCommands,
      artifacts: portfolioImagePerformanceArtifactPaths,
      controls: portfolioImagePerformanceControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(portfolioImagePerformanceEvidenceFlags);
  });

  it("separates portfolio image static review from external execution and redacts private artifacts", () => {
    const executionPlan = buildPortfolioImagePerformanceExecutionPlan();
    const artifactReview = buildPortfolioImagePerformanceArtifactReview({
      tenantDomain: "tenant.example.com",
      privateOriginalUrl: "s3://private-originals/client-before.jpg",
      bookingReferenceFileUrl: "https://files.example.com/private/booking-reference.png",
      exifGpsCoordinates: "gps:47.6062,-122.3321",
      nested: {
        clientEmail: "client@example.com",
        publicDerivativeSummary: "portfolio image evidence captured",
      },
    });
    const directRedaction = buildRedactedPortfolioImagePerformanceArtifact({
      publicDerivativeSummary: "safe portfolio image evidence",
      privateObjectKey: "private-original/client-before.jpg",
    });

    expect(executionPlan.localCommands).toBe(portfolioImagePerformanceLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/config typecheck",
      "pnpm --filter @inkroute/config test",
      "static PortfolioCard next/image contract review",
      "static public derivative fixture review",
    ]);
    expect(executionPlan.externalCommands).toBe(portfolioImagePerformanceExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "portfolio image browser rendering smoke",
      "private original/reference access-denial tests",
      "Lighthouse image/performance audit",
      "provider-backed persistPortfolioImagePerformanceRun execution",
      "CI portfolio image performance artifact capture",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.storageExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.lighthouseExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(portfolioImagePerformanceExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticImageComponentReadiness: true,
      storageBackedDerivativesRequiredForClosure: true,
      exifAndPrivateOriginalDenialRequiredForClosure: true,
      browserAndLighthouseRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(portfolioImagePerformanceRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("storage-backed public derivative fixture manifest");
    expect(executionPlan.requiredExternalEvidence).toContain("Lighthouse image/performance audit");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe portfolio image artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(portfolioImagePerformanceRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "privateOriginalUrl",
      "bookingReferenceFileUrl",
      "exifGpsCoordinates",
      "nested.clientEmail",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("s3://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("booking-reference");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("gps:");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).toContain("portfolio image evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["privateObjectKey"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe portfolio image evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming image performance readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 portfolio image performance runtime contracts");
    expect(ciWorkflow).toContain("portfolio-image-performance-runtime-static.test.ts");
    expect(ciWorkflow).toContain("portfolio-image-performance-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/portfolio-image-performance-runtime.json");
    expect(unitManifest).toContain("unit-web-portfolio-image-performance-runtime-static");
    expect(unitManifest).toContain("PortfolioImagePerformanceRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/portfolioImagePerformanceRuntime.ts");
    expect(gapTracker).toContain("persistPortfolioImagePerformanceRun upsert seam");
    expect(gapTracker).toContain("buildPortfolioImagePerformanceExecutionPlan");
    expect(gapTracker).toContain("portfolioImagePerformanceLocalCommands/portfolioImagePerformanceExternalCommands");
    expect(gapTracker).toContain("buildRedactedPortfolioImagePerformanceArtifact");
    expect(gapTracker).toContain("buildPortfolioImagePerformanceArtifactReview");
    expect(gapTracker).toContain("portfolioImagePerformanceExecutionPolicy");
    expect(gapTracker).toContain("portfolioImagePerformanceRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-028 is portfolio-image-performance-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("storage-backed derivative fixtures, provider-backed persistPortfolioImagePerformanceRun execution, EXIF-stripping proof, private-original/reference denial tests, browser rendering proof, Lighthouse image audit, web typecheck/build, CI evidence, and secret-safe artifact review remain open");
  });
});


