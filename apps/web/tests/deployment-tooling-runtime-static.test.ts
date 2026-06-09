import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDeploymentToolingRunPersistenceContract,
  deploymentToolingRunPersistencePreview,
  deploymentToolingRuntimeArtifactPaths,
  deploymentToolingRuntimeCommands,
  deploymentToolingRuntimeMatrix,
  deploymentToolingRuntimeReadiness
} from "../lib/deploymentToolingRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const rootPackage = read("package.json");
const deploymentPackage = read("packages/deployment/package.json");
const deploymentTest = read("packages/deployment/tests/deployment-readiness.test.ts");
const dashboardRouteTest = read("apps/web/tests/dashboard-deployment-readiness-route.test.ts");
const dashboardStaticTest = read("apps/dashboard/tests/deployment-readiness-route-static.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-113 deployment tooling runtime wiring", () => {
  it("pins deployment tooling commands, matrix entries, and artifact paths", () => {
    expect(deploymentToolingRuntimeCommands).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm --filter @inkroute/deployment typecheck",
      "pnpm --filter @inkroute/deployment test",
      "pnpm test:unit -- apps/web/tests/dashboard-deployment-readiness-route.test.ts",
      "pnpm deploy:check-env",
      "pnpm deploy:checklist",
      "pnpm deploy:gaps",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard deployment page/API route smoke"
    ]);
    expect(deploymentToolingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "install-package-quality",
      "route-contract-tests",
      "deployment-scripts",
      "dashboard-build-smoke",
      "rollback-approval-boundary",
      "ci-reports-blockers"
    ]);
    expect(deploymentToolingRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/deployment-tooling-runtime.json",
        "coverage/deployment-package-typecheck.log",
        "coverage/deployment-package-tests.json",
        "coverage/deployment-route-contracts.json",
        "coverage/deploy-check-env.json",
        "coverage/deploy-checklist.json",
        "coverage/deploy-gaps.json",
        "coverage/deployment-dashboard-build.log",
        "coverage/deployment-production-approval-boundary.json",
        "coverage/deployment-ci-reports-redacted.json",
        "coverage/deployment-blocker-owner-list.json",
        "test-results/deployment-tooling-runtime"
      ])
    );
  });

  it("keeps deployment package scripts, root scripts, and runtime helper coverage wired", () => {
    for (const script of ["typecheck", "test"]) {
      expect(deploymentPackage).toContain(`"${script}"`);
    }
    for (const script of ["deploy:check-env", "deploy:checklist", "deploy:gaps", "test:unit"]) {
      expect(rootPackage).toContain(`"${script}"`);
    }
    expect(deploymentTest).toContain("buildDeploymentToolingRuntimeVerificationPlan");
    expect(deploymentTest).toContain("rollbackPreflightVerified");
    expect(deploymentTest).toContain("productionApprovalBoundaryVerified");
    expect(deploymentTest).toContain("ciDeploymentReportsCaptured");
  });

  it("keeps dashboard deployment route/page smoke seams pinned", () => {
    expect(dashboardRouteTest).toContain("request-rollback-plan");
    expect(dashboardRouteTest).toContain("request-production-approval");
    expect(dashboardRouteTest).toContain("does not perform external provider calls");
    expect(dashboardStaticTest).toContain("no-store tenant-scoped readiness API");
    expect(dashboardStaticTest).toContain("prisma.auditLog.create");
    expect(dashboardStaticTest).toContain("All live deployment actions remain disabled");
  });

  it("keeps readiness blocked until install, script, dashboard, rollback, CI, and blocker-owner evidence exists", () => {
    expect(deploymentToolingRuntimeReadiness.status).toBe("blocked");
    expect(deploymentToolingRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(deploymentToolingRuntimeReadiness.missingRootScripts).toEqual([]);
    expect(deploymentToolingRuntimeReadiness.requiredCommands).toEqual(deploymentToolingRuntimeCommands);
    expect(deploymentToolingRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Dependency install output plus @inkroute/deployment typecheck and test output.",
        "Deployment script outputs for deploy:check-env, deploy:checklist, and deploy:gaps.",
        "Dashboard build output plus deployment page and readiness API smoke output.",
        "Rollback preflight and production approval boundary proof.",
        "CI deployment report artifacts and documented blocker owner list."
      ])
    );
    expect(deploymentToolingRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Workspace dependencies must install before deployment scripts are meaningful.",
        "@inkroute/deployment tests and typecheck must pass.",
        "Dashboard deployment readiness route contract tests must pass.",
        "CI must capture deployment reports/artifacts."
      ])
    );
  });

  it("pins durable DeploymentToolingRun rows, deployment script flags, dashboard smoke, rollback, approval, CI, and blocker owner evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildDeploymentToolingRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "deployment-tooling-demo",
      commitSha: "abc1234",
      status: "dashboard_gated",
      runtimeMatrix: deploymentToolingRuntimeMatrix,
      artifactManifest: deploymentToolingRuntimeArtifactPaths,
      frozenInstallPassed: false,
      deploymentPackageTypecheckPassed: false,
      deploymentPackageTestsPassed: false,
      routeContractTestsPassed: false,
      deployCheckEnvPassed: false,
      deployChecklistPassed: false,
      deployGapsPassed: false,
      dashboardBuildPassed: false,
      dashboardPageSmokePassed: false,
      dashboardReadinessApiSmokePassed: false,
      rollbackPreflightVerified: false,
      productionApprovalBoundaryVerified: true,
      ciDeploymentReportsCaptured: false,
      blockerOwnersDocumented: true,
      blockerOwnerArtifactPath: "coverage/deployment-blocker-owner-list.json",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model DeploymentToolingRun");
    expect(schema).toContain("deployCheckEnvPassed");
    expect(schema).toContain("productionApprovalBoundaryVerified");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["DeploymentToolingRun", "AuditLog"]);
    expect(contract.requiredDeploymentFlags).toContain("rollbackPreflightVerified");
    expect(contract.artifactFields).toContain("blockerOwnerArtifactPath");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(deploymentToolingRunPersistencePreview.modelName).toBe("DeploymentToolingRun");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 deployment tooling runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/deployment-tooling-runtime-static.test.ts");
    expect(ciWorkflow).toContain("deployment-tooling-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/deployment-tooling-runtime.json");
    expect(ciWorkflow).toContain("test-results/deployment-tooling-runtime");
    expect(unitManifest).toContain("unit-web-deployment-tooling-runtime-static");
    expect(unitManifest).toContain("DeploymentToolingRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/deploymentToolingRuntime.ts");
    expect(gapTracker).toContain("live deployment tooling execution proof remains open");
  });
});
