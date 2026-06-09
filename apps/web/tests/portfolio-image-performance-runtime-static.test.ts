import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  portfolioImagePerformanceArtifactPaths,
  portfolioImagePerformanceCommands,
  portfolioImagePerformanceMatrix,
  portfolioImagePerformanceReadiness,
  portfolioImagePerformanceRunPersistenceContract,
} from "../lib/portfolioImagePerformanceRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const repoFileExists = (path: string) => existsSync(join(process.cwd(), path));

describe("portfolio image performance runtime contract", () => {
  const portfolioCard = readRepoFile("apps/web/components/PortfolioCard.tsx");
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

  it("keeps next/image wiring, derivative metadata, and checked-in public fixtures visible", () => {
    expect(portfolioCard).toContain("from "next/image"");
    expect(portfolioCard).toContain("placeholder="blur"");
    expect(portfolioCard).toContain("data-storage-visibility={image.storageVisibility}");
    expect(portfolioCard).toContain("data-private-original-available={String(image.privateOriginalAvailable)}");
    expect(configSource).toContain("buildPortfolioImagePerformanceEvidencePlan");
    expect(configSource).toContain("storageVisibility: "public_derivative"");
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
    expect(portfolioImagePerformanceReadiness.requiredCommands).toEqual([...portfolioImagePerformanceCommands]);
    expect(portfolioImagePerformanceReadiness.requiredControls).toEqual([
      "Serve only public derivative objects from public portfolio cards.",
      "Keep private originals and booking reference files unavailable to anonymous public routes.",
      "Preserve width, height, aspect ratio, alt text, responsive sizes, and cache policy for every rendered portfolio image.",
      "Strip EXIF/private metadata before derivative publication.",
      "Capture browser and Lighthouse evidence before marking image performance launch-ready.",
    ]);
    expect(portfolioImagePerformanceReadiness.requiredEvidence).toEqual([
      "real public derivative assets or storage-backed fixture manifest",
      "optimized image component, derivative metadata, blur placeholder, and EXIF-stripping proof",
      "private original/reference separation and public-access denial transcript",
      "web typecheck/build, browser rendering, Lighthouse, and CI artifact evidence",
    ]);
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Storage-backed derivative fixtures must prove public derivatives resolve independently from private originals.");
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Private original/reference access-denial tests must pass.");
    expect(portfolioImagePerformanceReadiness.blockers).toContain("Lighthouse image/performance audit must pass or document accepted image-specific exceptions.");
  });

  it("pins the PortfolioImagePerformanceRun persistence model and migration", () => {
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

  it("wires CI, manifest, tracker, and artifacts without claiming image performance readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 3 portfolio image performance runtime contracts");
    expect(ciWorkflow).toContain("portfolio-image-performance-runtime-static.test.ts");
    expect(ciWorkflow).toContain("portfolio-image-performance-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/portfolio-image-performance-runtime.json");
    expect(unitManifest).toContain("unit-web-portfolio-image-performance-runtime-static");
    expect(unitManifest).toContain("PortfolioImagePerformanceRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/portfolioImagePerformanceRuntime.ts");
    expect(gapTracker).toContain("PortfolioImagePerformanceRun Prisma model and app row contract");
    expect(gapTracker).toContain("storage-backed derivative fixtures, EXIF-stripping proof, private-original/reference denial tests, browser rendering proof, Lighthouse image audit, web typecheck/build, CI evidence, and secret-safe artifact review remain open");
  });
});
