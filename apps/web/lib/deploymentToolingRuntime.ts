import { buildDeploymentToolingRuntimeVerificationPlan } from "@inkroute/deployment";

export type DeploymentToolingRuntimeStatus =
  | "wired"
  | "execution-gated"
  | "dashboard-gated"
  | "ci-gated";

export interface DeploymentToolingRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DeploymentToolingRuntimeStatus;
}

export const deploymentToolingRuntimeArtifactPaths = [
  "coverage/deployment-tooling-runtime.json",
  "coverage/deployment-install.log",
  "coverage/deployment-package-typecheck.log",
  "coverage/deployment-package-tests.json",
  "coverage/deployment-route-contracts.json",
  "coverage/deploy-check-env.json",
  "coverage/deploy-checklist.json",
  "coverage/deploy-gaps.json",
  "coverage/deployment-dashboard-build.log",
  "coverage/deployment-dashboard-page-smoke.json",
  "coverage/deployment-readiness-api-smoke.json",
  "coverage/deployment-rollback-preflight.json",
  "coverage/deployment-production-approval-boundary.json",
  "coverage/deployment-ci-reports-redacted.json",
  "coverage/deployment-blocker-owner-list.json",
  "test-results/deployment-tooling-runtime"
] as const;

export const deploymentToolingRuntimeCommands = [
  "pnpm install --frozen-lockfile",
  "pnpm --filter @inkroute/deployment typecheck",
  "pnpm --filter @inkroute/deployment test",
  "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
  "pnpm deploy:check-env",
  "pnpm deploy:checklist",
  "pnpm deploy:gaps",
  "pnpm --filter @inkroute/dashboard build",
  "dashboard deployment page/API route smoke"
] as const;

export const deploymentToolingRuntimeMatrix: readonly DeploymentToolingRuntimeMatrixEntry[] = [
  {
    id: "install-package-quality",
    command: "pnpm install --frozen-lockfile && pnpm --filter @inkroute/deployment typecheck && pnpm --filter @inkroute/deployment test",
    artifact: "coverage/deployment-package-tests.json",
    status: "execution-gated"
  },
  {
    id: "route-contract-tests",
    command: "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
    artifact: "coverage/deployment-route-contracts.json",
    status: "execution-gated"
  },
  {
    id: "deployment-scripts",
    command: "pnpm deploy:check-env && pnpm deploy:checklist && pnpm deploy:gaps",
    artifact: "coverage/deploy-gaps.json",
    status: "wired"
  },
  {
    id: "dashboard-build-smoke",
    command: "pnpm --filter @inkroute/dashboard build && dashboard deployment page/API route smoke",
    artifact: "coverage/deployment-dashboard-page-smoke.json",
    status: "dashboard-gated"
  },
  {
    id: "rollback-approval-boundary",
    command: "verify rollback preflight and production approval boundaries remain non-mutating",
    artifact: "coverage/deployment-production-approval-boundary.json",
    status: "dashboard-gated"
  },
  {
    id: "ci-reports-blockers",
    command: "GitHub Actions deployment reports and blocker owner list",
    artifact: "coverage/deployment-ci-reports-redacted.json",
    status: "ci-gated"
  }
];

export const deploymentToolingRuntimeReadiness = buildDeploymentToolingRuntimeVerificationPlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests"
  },
  rootScripts: ["deploy:check-env", "deploy:checklist", "deploy:gaps", "test:unit"],
  dependenciesInstalled: false,
  deploymentPackageTestsPassed: false,
  deploymentPackageTypecheckPassed: false,
  deploymentScriptsExecuted: false,
  deployCheckEnvPassed: false,
  deployChecklistPassed: false,
  deployGapsPassed: false,
  routeContractTestsPassed: false,
  dashboardBuildPassed: false,
  dashboardDeploymentPageSmokePassed: false,
  dashboardReadinessApiSmokePassed: false,
  rollbackPreflightVerified: false,
  productionApprovalBoundaryVerified: true,
  ciDeploymentReportsCaptured: false,
  blockersDocumented: true
});
