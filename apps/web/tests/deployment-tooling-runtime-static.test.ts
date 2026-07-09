import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDeploymentToolingRuntimeArtifactReview,
  buildDeploymentToolingRuntimeEvidenceDecision,
  buildDeploymentToolingRuntimeExecutionPlan,
  buildDeploymentToolingRuntimeRedactedBlockerOwnerPacket,
  buildRedactedDeploymentToolingArtifact,
  buildDeploymentToolingRunData,
  buildDeploymentToolingRunPersistenceContract,
  deploymentToolingBlockerOwnerContract,
  deploymentToolingRunPersistencePreview,
  deploymentToolingRuntimeArtifactPaths,
  deploymentToolingRuntimeCommands,
  deploymentToolingRuntimeExternalArtifacts,
  deploymentToolingRuntimeExternalCommands,
  deploymentToolingRuntimeExecutionPolicy,
  deploymentToolingRuntimeLocalArtifacts,
  deploymentToolingRuntimeLocalCommands,
  deploymentToolingRuntimeMatrix,
  deploymentToolingRuntimeProofFiles,
  deploymentToolingRuntimeReadiness,
  deploymentToolingRuntimeRequiredExternalEvidence,
  persistDeploymentToolingRun
} from "../lib/deploymentToolingRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const rootPackage = read("package.json");
const deploymentPackage = read("packages/deployment/package.json");
const deploymentTest = read("packages/deployment/tests/deployment-readiness.test.ts");
const dashboardRouteTest = read("apps/web/tests/dashboard-deployment-readiness-route.test.ts");
const dashboardStaticTest = read("apps/dashboard/tests/deployment-readiness-route-static.test.ts");
const deploymentPage = read("apps/dashboard/app/deployment/page.tsx");
const deploymentActionPanel = read("apps/dashboard/components/DeploymentReadinessActionPanel.tsx");
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
      "dashboard deployment page smoke",
      "dashboard deployment readiness API smoke",
      "verify rollback preflight remains non-mutating",
      "verify production approval boundary remains blocked without required evidence",
      "capture CI deployment reports",
      "capture deployment blocker-owner artifact"
    ]);
    expect(deploymentToolingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "install-package-quality",
      "route-contract-tests",
      "deployment-scripts",
      "dashboard-build",
      "dashboard-page-smoke",
      "dashboard-readiness-api-smoke",
      "rollback-preflight",
      "production-approval-boundary",
      "ci-deployment-reports",
      "blocker-owner-artifact",
      "redacted-blocker-owner-packet"
    ]);
    expect(deploymentToolingBlockerOwnerContract.map((entry) => entry.blockerId)).toEqual([
      "dependency-install",
      "deployment-package-quality",
      "dashboard-runtime-smoke",
      "rollback-approval-boundary",
      "ci-deployment-reports",
      "owner-retention"
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
        "coverage/deployment-dashboard-page-smoke.json",
        "coverage/deployment-readiness-api-smoke.json",
        "coverage/deployment-rollback-preflight.json",
        "coverage/deployment-production-approval-boundary.json",
        "coverage/deployment-ci-reports-redacted.json",
        "coverage/deployment-blocker-owner-list.json",
        "coverage/deployment-blocker-owner-redacted-packet.json",
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
    expect(deploymentPage).toContain("DeploymentReadinessActionPanel");
    expect(deploymentActionPanel).toContain('fetch("/api/deployment/readiness"');
    expect(deploymentActionPanel).toContain("Request readiness review");
    expect(deploymentActionPanel).toContain("provider deploys, migrations, EAS updates, Sentry uploads, and rollback execution remain gated");
  });

  it("keeps readiness blocked until install, script, dashboard, rollback, CI, and blocker-owner evidence exists", () => {
    expect(deploymentToolingRuntimeReadiness.status).toBe("blocked");
    expect(deploymentToolingRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(deploymentToolingRuntimeReadiness.missingRootScripts).toEqual([]);
    expect(deploymentToolingRuntimeReadiness.requiredCommands).toBe(deploymentToolingRuntimeCommands);
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
    const runData = buildDeploymentToolingRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "deployment-tooling-demo",
      status: "dashboard_gated",
      productionApprovalBoundaryVerified: true,
      blockerOwnerArtifactPath: "coverage/deployment-blocker-owner-list.json",
    });
    expect(persistDeploymentToolingRun).toBeTypeOf("function");
    expect(String(persistDeploymentToolingRun)).toContain("repository.deploymentToolingRun.upsert");
  });

  it("pins current deployment tooling runtime proof files for GAP-113", () => {
    expect(deploymentToolingRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/app/api/deployment/readiness/route.ts",
      "apps/dashboard/app/deployment/page.tsx",
      "apps/dashboard/components/DeploymentReadinessActionPanel.tsx",
      "deployment/manifests/environment-contract.json",
      "deployment/scripts/check-env.mjs",
      "deployment/scripts/final-gap-summary.mjs",
      "deployment/scripts/print-launch-checklist.mjs",
      "apps/dashboard/package.json",
        "apps/web/lib/deploymentToolingRuntime.ts",
        "apps/web/tests/deployment-tooling-runtime-static.test.ts",
        "packages/deployment/src/index.ts",
        "packages/deployment/tests/deployment-readiness.test.ts",
        "packages/db/prisma/migrations/20260609016000_add_deployment_tooling_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of deploymentToolingRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 deployment tooling runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/deployment-tooling-runtime-static.test.ts");
    expect(ciWorkflow).toContain("deployment-tooling-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/deployment-tooling-runtime.json");
    expect(ciWorkflow).toContain("test-results/deployment-tooling-runtime");
    expect(unitManifest).toContain("unit-web-deployment-tooling-runtime-static");
    expect(unitManifest).toContain("GAP-113 CI retains deployment tooling runtime contract and artifact paths without claiming full deployment execution has passed");
    expect(gapTracker).toContain("apps/web/lib/deploymentToolingRuntime.ts");
    expect(gapTracker).toContain("Deployment tooling evidence classifier wired and execution proof gated");
    expect(gapTracker).toContain("GAP-113 is deployment-tooling-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("persistDeploymentToolingRun upsert seam");
    expect(gapTracker).toContain("deploymentToolingBlockerOwnerContract");
    expect(gapTracker).toContain("buildDeploymentToolingRuntimeRedactedBlockerOwnerPacket");
    expect(gapTracker).toContain("GAP-113 deployment tooling artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("classifies GAP-113 evidence as blocked until deployment tooling execution proof is captured", () => {
    const blockedDecision = buildDeploymentToolingRuntimeEvidenceDecision({
      frozenInstallPassed: true,
      deploymentPackageTypecheckPassed: false,
      deploymentPackageTestsPassed: false,
      routeContractTestsPassed: true,
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
      redactedBlockerOwnerPacketCaptured: false,
      requiredCommandsRun: deploymentToolingRuntimeCommands.filter(
        (command) =>
          command !== "pnpm --filter @inkroute/deployment test" &&
          command !== "pnpm deploy:checklist" &&
          command !== "pnpm --filter @inkroute/dashboard build" &&
          command !== "dashboard deployment page smoke" &&
          command !== "dashboard deployment readiness API smoke" &&
          command !== "verify rollback preflight remains non-mutating" &&
          command !== "capture CI deployment reports",
      ),
      capturedArtifacts: [
        "coverage/deployment-tooling-runtime.json",
        "coverage/deployment-install.log",
        "coverage/deployment-route-contracts.json",
        "coverage/deployment-production-approval-boundary.json",
        "coverage/deployment-blocker-owner-list.json",
        "test-results/deployment-tooling-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run @inkroute/deployment typecheck.",
        "Run @inkroute/deployment tests.",
        "Run deploy:check-env.",
        "Run deploy:checklist.",
        "Run deploy:gaps.",
        "Run dashboard build.",
        "Capture dashboard deployment page smoke proof.",
        "Capture rollback preflight proof.",
        "Capture CI deployment report artifacts.",
        "Capture retained redacted deployment blocker-owner packet proof.",
        "Required command not recorded: pnpm --filter @inkroute/deployment test",
        "Required command not recorded: pnpm deploy:checklist",
        "Required command not recorded: pnpm --filter @inkroute/dashboard build",
        "Required command not recorded: dashboard deployment page smoke",
        "Required command not recorded: dashboard deployment readiness API smoke",
        "Required command not recorded: verify rollback preflight remains non-mutating",
        "Required command not recorded: capture CI deployment reports",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/deployment-package-typecheck.log",
        "coverage/deployment-package-tests.json",
        "coverage/deploy-check-env.json",
        "coverage/deploy-checklist.json",
        "coverage/deployment-dashboard-build.log",
        "coverage/deployment-ci-reports-redacted.json",
        "coverage/deployment-blocker-owner-redacted-packet.json",
      ]),
    );
    expect(blockedDecision.requiredCommands).toBe(deploymentToolingRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(deploymentToolingRuntimeArtifactPaths);
    expect(blockedDecision.deploymentPolicy).toEqual({
      productionActionsRemainApprovalGated: true,
      rollbackPreflightRequired: true,
      blockerOwnersRequired: true,
    });

    const completeDecision = buildDeploymentToolingRuntimeEvidenceDecision({
      frozenInstallPassed: true,
      deploymentPackageTypecheckPassed: true,
      deploymentPackageTestsPassed: true,
      routeContractTestsPassed: true,
      deployCheckEnvPassed: true,
      deployChecklistPassed: true,
      deployGapsPassed: true,
      dashboardBuildPassed: true,
      dashboardPageSmokePassed: true,
      dashboardReadinessApiSmokePassed: true,
      rollbackPreflightVerified: true,
      productionApprovalBoundaryVerified: true,
      ciDeploymentReportsCaptured: true,
      blockerOwnersDocumented: true,
      redactedBlockerOwnerPacketCaptured: true,
      requiredCommandsRun: deploymentToolingRuntimeCommands,
      capturedArtifacts: deploymentToolingRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(deploymentToolingRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(deploymentToolingRuntimeArtifactPaths);
  });

  it("keeps deployment tooling execution disabled while separating local and external proof", () => {
    const plan = buildDeploymentToolingRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(deploymentToolingRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(deploymentToolingRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(deploymentToolingRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(deploymentToolingRuntimeExternalArtifacts);
    expect(plan.blockerOwnerContract).toBe(deploymentToolingBlockerOwnerContract);
    expect(plan.blockerOwnerContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockerId: "dependency-install",
          ownerRole: "platform",
          requiredEvidenceArtifact: "coverage/deployment-install.log",
          executionBoundary: "provider-proof",
          redactedOwnerEvidenceRequired: true,
          secretsForbidden: true,
        }),
        expect.objectContaining({
          blockerId: "ci-deployment-reports",
          ownerRole: "ci",
          requiredEvidenceArtifact: "coverage/deployment-ci-reports-redacted.json",
          executionBoundary: "ci-proof",
          redactedOwnerEvidenceRequired: true,
          secretsForbidden: true,
        }),
        expect.objectContaining({
          blockerId: "owner-retention",
          ownerRole: "release-manager",
          requiredEvidenceArtifact: "coverage/deployment-blocker-owner-list.json",
          executionBoundary: "human-approval-proof",
          redactedOwnerEvidenceRequired: true,
          secretsForbidden: true,
        }),
      ]),
    );
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/deployment-tooling-runtime.json",
        "coverage/deployment-package-typecheck.log",
        "coverage/deployment-package-tests.json",
        "coverage/deployment-route-contracts.json",
        "coverage/deploy-check-env.json",
        "coverage/deploy-checklist.json",
        "coverage/deploy-gaps.json",
        "test-results/deployment-tooling-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/deployment-install.log",
        "coverage/deployment-dashboard-build.log",
        "coverage/deployment-dashboard-page-smoke.json",
        "coverage/deployment-readiness-api-smoke.json",
        "coverage/deployment-rollback-preflight.json",
        "coverage/deployment-production-approval-boundary.json",
        "coverage/deployment-ci-reports-redacted.json",
        "coverage/deployment-blocker-owner-list.json",
        "coverage/deployment-blocker-owner-redacted-packet.json",
      ]),
    );
    expect(plan.frozenInstallExecutionAllowed).toBe(false);
    expect(plan.packageQualityExecutionAllowed).toBe(false);
    expect(plan.deploymentScriptExecutionAllowed).toBe(false);
    expect(plan.dashboardBuildExecutionAllowed).toBe(false);
    expect(plan.dashboardSmokeExecutionAllowed).toBe(false);
    expect(plan.rollbackPreflightExecutionAllowed).toBe(false);
    expect(plan.productionApprovalExecutionAllowed).toBe(false);
    expect(plan.ciReportExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(deploymentToolingRuntimeExecutionPolicy);
    expect(plan.executionPolicy.externalEvidenceRequired).toBe(deploymentToolingRuntimeRequiredExternalEvidence);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyLocalCommands: true,
      dependencyInstallRequiresUserApproval: true,
      dashboardRuntimeSmokeRequiresRunningApp: true,
      productionApprovalMustRemainHumanGated: true,
      ciProviderRequiredForDeploymentReports: true,
      providerEnvironmentRequiredForPersistence: true,
    });
  });

  it("redacts deployment tooling artifacts before retention or handoff", () => {
    const rawArtifact = {
      env: { RENDER_API_KEY: "rk_live_secret", DATABASE_URL: "postgres://tenant_demo:secret@db.example.com/inkroute" },
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      deployUrl: "https://inkroute-dashboard.example.com/deployment?tenant=tenant_demo",
      approvalPayload: { approvedByEmail: "owner@example.com", phone: "+1 555 444 2222" },
      blockerOwners: ["owner_123", "artist@example.com"],
      repositoryEvidence: "repo:dominator509/InkRoute",
      branchEvidence: "branch:production/deployment-tooling",
      pullRequestEvidence: "pr_deployment_tooling",
      reviewerEvidence: "reviewer_deployment_owner",
      codeownerEvidence: "CODEOWNER:deployment-platform-team",
      nested: {
        authorization: "Bearer deployment-secret-token",
        providerResourceId: "deployment_abc123",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedDeploymentToolingArtifact(rawArtifact);
    const review = buildDeploymentToolingRuntimeArtifactReview("coverage/deployment-ci-reports-redacted.json", rawArtifact);
    const packet = buildDeploymentToolingRuntimeRedactedBlockerOwnerPacket(rawArtifact);
    const serialized = JSON.stringify({ review, packet });

    expect(JSON.stringify(redacted)).not.toContain("postgres://");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("inkroute-dashboard.example.com");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 444 2222");
    expect(serialized).not.toContain("Bearer deployment-secret-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("deployment_abc123");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/deployment-tooling");
    expect(serialized).not.toContain("pr_deployment_tooling");
    expect(serialized).not.toContain("reviewer_deployment_owner");
    expect(serialized).not.toContain("CODEOWNER:deployment-platform-team");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "[REDACTED_BRANCH_SELECTOR]",
        "[REDACTED_CODEOWNER_SELECTOR]",
        "[REDACTED_PR_SELECTOR]",
        "[REDACTED_REPOSITORY_SELECTOR]",
        "[REDACTED_REVIEWER_SELECTOR]",
        "authorization",
        "blockerOwners",
        "ciRunUrl",
        "deployUrl",
        "env",
        "approvalPayload",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(deploymentToolingRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Frozen install, dashboard build, and route-smoke artifacts must be captured outside Codex when execution is approved.",
        "Deployment approval and rollback-preflight artifacts must prove production actions stayed human-gated and non-mutating.",
        "CI deployment reports must be retained with run URLs, provider identifiers, tokens, and environment details redacted.",
        "Provider-backed DeploymentToolingRun persistence must execute only in approved provider environments.",
        "Retained redacted blocker-owner packet must be captured for deploymentToolingBlockerOwnerContract before closure.",
      ]),
    );
    expect(packet.status).toBe("redacted-blocker-owner-packet-ready");
    expect(packet.artifactPath).toBe("coverage/deployment-blocker-owner-redacted-packet.json");
    expect(packet.blockerOwnerContract).toBe(deploymentToolingBlockerOwnerContract);
    expect(packet.review.containsUnredactedSensitiveValues).toBe(false);
    expect(packet.requiredArtifacts).toBe(deploymentToolingRuntimeArtifactPaths);
    expect(packet.externalEvidenceRequired).toBe(deploymentToolingRuntimeRequiredExternalEvidence);
    expect(packet.providerExecutionAllowed).toBe(false);
  });
});

