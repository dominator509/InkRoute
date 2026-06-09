import { buildReleaseRuntimeVerificationPlan } from "@inkroute/releases";

export const releaseRuntimeVerificationArtifactPaths = [
  "coverage/release-runtime-verification.json",
  "coverage/release-health-route-smoke.json",
  "coverage/release-dashboard-route-smoke.json",
  "coverage/release-feature-flag-route-smoke.json",
  "coverage/release-web-build.log",
  "coverage/release-dashboard-build.log",
  "coverage/release-mobile-typecheck.log",
  "coverage/release-governance-workflow-dry-run-redacted.json",
  "test-results/release-runtime",
  "test-results/release-governance",
] as const;

export const releaseRuntimeVerificationCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm vitest run apps/web/tests/release-health-route.test.ts apps/web/tests/release-runtime-verification-static.test.ts apps/dashboard/tests/release-route-static.test.ts apps/dashboard/tests/feature-flag-route-static.test.ts",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/dashboard build",
  "pnpm --filter @inkroute/mobile typecheck",
  "release-governance workflow dry run",
] as const;

export const releaseRuntimeVerificationMatrix = [
  {
    id: "release-package-contracts",
    command: "pnpm --filter @inkroute/releases test",
    artifact: "coverage/release-runtime-verification.json",
    status: "command-target-wired",
  },
  {
    id: "public-release-health-route",
    command: "pnpm vitest run apps/web/tests/release-health-route.test.ts",
    artifact: "coverage/release-health-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "dashboard-release-route-smoke",
    command: "pnpm vitest run apps/dashboard/tests/release-route-static.test.ts",
    artifact: "coverage/release-dashboard-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "dashboard-feature-flag-route-smoke",
    command: "pnpm vitest run apps/dashboard/tests/feature-flag-route-static.test.ts",
    artifact: "coverage/release-feature-flag-route-smoke.json",
    status: "route-smoke-target-wired",
  },
  {
    id: "web-dashboard-mobile-builds",
    command: "pnpm --filter @inkroute/web build && pnpm --filter @inkroute/dashboard build && pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/release-web-build.log",
    status: "build-gate-target-wired",
  },
  {
    id: "release-governance-workflow",
    command: "release-governance workflow dry run",
    artifact: "coverage/release-governance-workflow-dry-run-redacted.json",
    status: "github-actions-proof-gated",
  },
] as const;

export function buildReleaseRuntimeVerificationContract() {
  return buildReleaseRuntimeVerificationPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    webTypecheckPassed: false,
    releaseHealthRouteTestsPassed: false,
    webBuildPassed: false,
    dashboardBuildPassed: false,
    mobileBuildOrTypecheckPassed: false,
    dashboardReleaseRouteSmokePassed: false,
    dashboardFeatureFlagRouteSmokePassed: false,
    releaseGovernanceWorkflowDryRunPassed: false,
    githubActionsWorkflowEvidenceCaptured: false,
    ciArtifactsAttached: true,
  });
}

export const releaseRuntimeVerificationContract = buildReleaseRuntimeVerificationContract();
