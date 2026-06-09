import { buildPortfolioImagePerformanceEvidencePlan } from "@inkroute/config";

export type PortfolioImagePerformanceStatus =
  | "wired"
  | "asset-gated"
  | "optimization-gated"
  | "privacy-gated"
  | "browser-gated"
  | "ci-gated";

export interface PortfolioImagePerformanceMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PortfolioImagePerformanceStatus;
}

export const portfolioImagePerformanceCommands = [
  "pnpm --filter @inkroute/config typecheck",
  "pnpm --filter @inkroute/config test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "portfolio image browser rendering smoke",
  "private original/reference access-denial tests",
  "Lighthouse image/performance audit",
] as const;

export const portfolioImagePerformanceArtifactPaths = [
  "coverage/portfolio-image-performance-runtime.json",
  "coverage/portfolio-image-config-typecheck.txt",
  "coverage/portfolio-image-config-test.txt",
  "coverage/portfolio-image-web-typecheck.txt",
  "coverage/portfolio-image-web-build.txt",
  "coverage/portfolio-image-derivative-fixtures.json",
  "coverage/portfolio-image-next-image-wiring.json",
  "coverage/portfolio-image-private-original-denial.json",
  "coverage/portfolio-image-browser-rendering.json",
  "coverage/portfolio-image-lighthouse.json",
  "coverage/portfolio-image-ci-evidence.json",
  "test-results/portfolio-image-performance-runtime",
] as const;

export const portfolioImagePerformanceMatrix = [
  {
    id: "config-and-web-package-gates",
    command: "pnpm --filter @inkroute/config typecheck && pnpm --filter @inkroute/config test && pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/portfolio-image-web-build.txt",
    status: "wired",
  },
  {
    id: "checked-in-public-derivative-fixtures",
    command: "real public derivative assets or storage-backed fixture manifest",
    artifact: "coverage/portfolio-image-derivative-fixtures.json",
    status: "asset-gated",
  },
  {
    id: "next-image-dimensions-sizes-blur",
    command: "portfolio card next/image static contract",
    artifact: "coverage/portfolio-image-next-image-wiring.json",
    status: "optimization-gated",
  },
  {
    id: "exif-private-original-denial",
    command: "private original/reference access-denial tests",
    artifact: "coverage/portfolio-image-private-original-denial.json",
    status: "privacy-gated",
  },
  {
    id: "browser-rendering-and-lighthouse",
    command: "portfolio image browser rendering smoke && Lighthouse image/performance audit",
    artifact: "coverage/portfolio-image-lighthouse.json",
    status: "browser-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions portfolio image performance evidence job",
    artifact: "coverage/portfolio-image-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly PortfolioImagePerformanceMatrixEntry[];

export const portfolioImagePerformanceReadiness = buildPortfolioImagePerformanceEvidencePlan({
  packageScripts: { test: "vitest run --passWithNoTests", typecheck: "tsc --noEmit" },
  configTestsPassed: false,
  configTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  realPublicDerivativeAssetsAvailable: true,
  storageBackedDerivativeFixturesAvailable: false,
  nextImageMigrationCompleted: true,
  derivativeDimensionsVerified: true,
  blurPlaceholdersGenerated: true,
  exifStrippingVerified: false,
  privateOriginalsSeparated: true,
  privateOriginalAccessDenied: false,
  browserRenderingVerified: false,
  lighthouseImageAuditPassed: false,
  ciArtifactsCaptured: false,
});
