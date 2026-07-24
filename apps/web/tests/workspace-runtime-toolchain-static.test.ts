import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  workspaceRuntimeToolchainArtifactPaths,
  workspaceRuntimeToolchainCommands,
  workspaceRuntimeToolchainExternalArtifacts,
  workspaceRuntimeToolchainExternalCommands,
  workspaceRuntimeToolchainExecutionPolicy,
  workspaceRuntimeToolchainGeneratedReports,
  workspaceRuntimeToolchainLocalArtifacts,
  workspaceRuntimeToolchainLocalCommands,
  workspaceRuntimeToolchainMatrix,
  workspaceRuntimeToolchainProofFiles,
  workspaceRuntimeToolchainReadiness,
  workspaceRuntimeToolchainReadinessRequiredEvidence,
  workspaceRuntimeToolchainRequiredExternalEvidence,
  workspaceRuntimeToolchainRequiredEvidence,
  workspaceRuntimeToolchainRunPersistenceContract,
  buildWorkspaceRuntimeToolchainDecisionRequiredEvidence,
  buildWorkspaceRuntimeToolchainEvidenceDecision,
  buildRedactedWorkspaceRuntimeToolchainArtifact,
  buildWorkspaceRuntimeToolchainArtifactReview,
  buildWorkspaceRuntimeToolchainExecutionPlan,
  buildWorkspaceRuntimeToolchainRedactedEvidenceBundle,
} from "../lib/workspaceRuntimeToolchain";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("workspace runtime toolchain contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const workspacePackageJson = readRepoFile("packages/workspace/package.json");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const toolchainContract = readRepoFile("docs/workspace/manifests/workspace-toolchain-readiness-contract.json");
  const toolchainVerifier = readRepoFile("scripts/workspace/verify-workspace-toolchain.mjs");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const workspaceRuntimeToolchainMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032100_add_workspace_runtime_toolchain_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins workspace runtime commands, reports, matrix rows, and artifacts", () => {
    expect(workspaceRuntimeToolchainCommands).toEqual([
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm --filter @inkroute/workspace test",
      "pnpm workspace:toolchain",
      "pnpm workspace:all",
      "pnpm install",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "runtime readiness report keeps production blockers visible",
    ]);
    expect(workspaceRuntimeToolchainGeneratedReports).toContain("docs/workspace/manifests/runtime-readiness.json");
    expect(workspaceRuntimeToolchainMatrix.map((entry) => entry.id)).toEqual([
      "workspace-package-typecheck",
      "workspace-package-test",
      "workspace-toolchain",
      "workspace-all",
      "dependency-install",
      "web-build",
      "dashboard-build",
      "ci-workspace-job",
      "production-blocker-visibility",
      "redacted-evidence-bundle",
    ]);
    expect(workspaceRuntimeToolchainArtifactPaths).toContain("coverage/workspace-runtime-toolchain.json");
    expect(workspaceRuntimeToolchainArtifactPaths).toContain("coverage/workspace-runtime-redacted-evidence-bundle.json");
    expect(workspaceRuntimeToolchainArtifactPaths).toContain("test-results/workspace-runtime-toolchain");
  });

  it("pins the WorkspaceRuntimeToolchainRun persistence model and migration", () => {
    expect(workspaceRuntimeToolchainRunPersistenceContract.model).toBe("WorkspaceRuntimeToolchainRun");
    expect(workspaceRuntimeToolchainRunPersistenceContract.tenantRelation).toBe("workspaceRuntimeToolchainRuns");
    expect(workspaceRuntimeToolchainRunPersistenceContract.migration).toBe(
      "20260609032100_add_workspace_runtime_toolchain_runs",
    );
    expect(workspaceRuntimeToolchainRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "generatedReportManifest",
      "artifactManifest",
      "productionBlockerManifest",
    ]);
    expect(workspaceRuntimeToolchainRunPersistenceContract.evidenceBooleans).toContain("packageTypecheckPassed");
    expect(workspaceRuntimeToolchainRunPersistenceContract.evidenceBooleans).toContain("workspaceAllPassed");
    expect(workspaceRuntimeToolchainRunPersistenceContract.evidenceBooleans).toContain("productionBlockersVisible");
    expect(workspaceRuntimeToolchainRunPersistenceContract.artifactFields).toContain("dependencyInstallArtifactPath");
    expect(workspaceRuntimeToolchainRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("workspaceRuntimeToolchainRuns WorkspaceRuntimeToolchainRun[]");
    expect(prismaSchema).toContain("model WorkspaceRuntimeToolchainRun");
    expect(prismaSchema).toContain("generatedReportManifest");
    expect(prismaSchema).toContain("dashboardBuildEvidenceCaptured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(workspaceRuntimeToolchainMigration).toContain('CREATE TABLE "WorkspaceRuntimeToolchainRun"');
    expect(workspaceRuntimeToolchainMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(workspaceRuntimeToolchainMigration).toContain('"productionBlockersVisible" BOOLEAN NOT NULL DEFAULT false');
    expect(workspaceRuntimeToolchainMigration).toContain(
      'CREATE UNIQUE INDEX "WorkspaceRuntimeToolchainRun_tenantId_runId_key"',
    );
  });

  it("keeps workspace package, scripts, contract, verifier, and helper tests wired", () => {
    expect(rootPackageJson).toContain('"workspace:toolchain"');
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(workspacePackageJson).toContain('"typecheck"');
    expect(workspacePackageJson).toContain('"test"');
    expect(toolchainContract).toContain("workspace-toolchain-readiness");
    expect(toolchainContract).toContain("workspace:all");
    expect(toolchainVerifier).toContain("workspace-toolchain-readiness-contract.json");
    expect(workspaceTests).toContain("buildWorkspaceRuntimeToolchainReadinessPlan");
  });

  it("keeps generated reports present while runtime command evidence remains gated", () => {
    expect(workspaceRuntimeToolchainReadiness.status).toBe("blocked");
    expect(workspaceRuntimeToolchainReadiness.missingGeneratedReports).toEqual([]);
    expect(workspaceRuntimeToolchainReadiness.requiredCommands).toBe(workspaceRuntimeToolchainCommands);
    expect(workspaceRuntimeToolchainReadiness.requiredEvidence).toBe(workspaceRuntimeToolchainReadinessRequiredEvidence);
    expect(workspaceRuntimeToolchainReadiness.blockers).toEqual([
      "@inkroute/workspace typecheck must pass.",
      "@inkroute/workspace tests must pass.",
      "pnpm workspace:toolchain must pass.",
      "pnpm workspace:all must pass.",
      "GitHub Actions Phase 18 workspace runtime readiness job must pass.",
      "CI evidence for workspace runtime readiness must be captured.",
      "Dependency install evidence must be captured before runtime readiness is more than static pre-install signal.",
      "Web and dashboard app build evidence must be captured before runtime readiness can support launch readiness.",
    ]);
  });

  it("blocks workspace runtime closure until package, command, install, build, CI, persistence, artifact, and report evidence exist", () => {
    const decision = buildWorkspaceRuntimeToolchainEvidenceDecision({
      toolchainAuditPassed: true,
      packageTypecheckPassed: false,
      packageTestsPassed: false,
      workspaceToolchainPassed: true,
      workspaceAllPassed: false,
      dependencyInstallEvidenceCaptured: false,
      webBuildEvidenceCaptured: false,
      dashboardBuildEvidenceCaptured: false,
      ciWorkspaceJobPassed: false,
      ciEvidenceCaptured: false,
      productionBlockersVisible: true,
      workspaceRuntimeToolchainRunPersisted: false,
      redactedEvidenceBundleCaptured: false,
      capturedReports: [
        "docs/workspace/manifests/workspace-import-audit.json",
        "docs/workspace/manifests/package-script-audit.json",
      ],
      capturedArtifacts: [
        "coverage/workspace-runtime-toolchain.json",
        "coverage/workspace-toolchain-output.txt",
        "coverage/workspace-production-blockers.json",
      ],
      completedCommands: ["pnpm workspace:toolchain"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReports).toEqual([
      "docs/workspace/manifests/runtime-evidence-audit.json",
      "docs/workspace/manifests/runtime-readiness.json",
      "docs/workspace/manifests/workspace-required-checks-audit.json",
      "docs/workspace/manifests/workspace-toolchain-readiness-audit.json",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/workspace-package-typecheck.txt",
      "coverage/workspace-package-test.txt",
      "coverage/workspace-all-output.txt",
      "coverage/workspace-install-output.txt",
      "coverage/workspace-web-build-output.txt",
      "coverage/workspace-dashboard-build-output.txt",
      "coverage/workspace-ci-job.json",
      "coverage/workspace-runtime-redacted-evidence-bundle.json",
      "test-results/workspace-runtime-toolchain",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm --filter @inkroute/workspace test",
      "pnpm workspace:all",
      "pnpm install",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "runtime readiness report keeps production blockers visible",
    ]);
    expect(decision.requiredReports).toBe(workspaceRuntimeToolchainGeneratedReports);
    expect(decision.requiredArtifacts).toBe(workspaceRuntimeToolchainArtifactPaths);
    expect(decision.requiredCommands).toBe(workspaceRuntimeToolchainCommands);
    expect(decision.requiredEvidence).toEqual(
      buildWorkspaceRuntimeToolchainDecisionRequiredEvidence(workspaceRuntimeToolchainReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(workspaceRuntimeToolchainRequiredEvidence);
    expect(decision.blockers).toContain("@inkroute/workspace typecheck must pass.");
    expect(decision.blockers).toContain("WorkspaceRuntimeToolchainRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Redacted workspace runtime evidence bundle must be captured.");
    expect(decision.blockers).toContain("Every required workspace runtime report must be captured.");
  });

  it("completes workspace runtime closure when reports, commands, install, builds, CI, persistence, and artifacts are proven", () => {
    const decision = buildWorkspaceRuntimeToolchainEvidenceDecision({
      toolchainAuditPassed: true,
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      workspaceToolchainPassed: true,
      workspaceAllPassed: true,
      dependencyInstallEvidenceCaptured: true,
      webBuildEvidenceCaptured: true,
      dashboardBuildEvidenceCaptured: true,
      ciWorkspaceJobPassed: true,
      ciEvidenceCaptured: true,
      productionBlockersVisible: true,
      workspaceRuntimeToolchainRunPersisted: true,
      redactedEvidenceBundleCaptured: true,
      capturedReports: workspaceRuntimeToolchainGeneratedReports,
      capturedArtifacts: workspaceRuntimeToolchainArtifactPaths,
      completedCommands: workspaceRuntimeToolchainCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReports).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runtime install/build proof", () => {
    expect(ciWorkflow).toContain("Run Phase 18 workspace runtime toolchain contracts");
    expect(ciWorkflow).toContain("workspace-runtime-toolchain-static.test.ts");
    expect(ciWorkflow).toContain("workspace-runtime-toolchain-artifacts");
    expect(unitManifest).toContain("unit-web-workspace-runtime-toolchain-static");
    expect(unitManifest).toContain("WorkspaceRuntimeToolchainRun Prisma model and app row contract");
    expect(gapTracker).toContain("WorkspaceRuntimeToolchainRun");
    expect(gapTracker).toContain("apps/web/lib/workspaceRuntimeToolchain.ts");
    expect(gapTracker).toContain("live package typecheck/test, workspace commands, install/build, CI, and artifact proof remain open");
    expect(gapTracker).toContain("GAP-130 workspace runtime toolchain artifact hardening");
    expect(gapTracker).toContain("buildWorkspaceRuntimeToolchainExecutionPlan");
    expect(gapTracker).toContain("workspaceRuntimeToolchainExecutionPolicy");
    expect(gapTracker).toContain("workspaceRuntimeToolchainReadinessRequiredEvidence");
    expect(gapTracker).toContain("workspaceRuntimeToolchainRequiredEvidence");
    expect(gapTracker).toContain("workspaceRuntimeToolchainRequiredExternalEvidence");
    expect(gapTracker).toContain("buildWorkspaceRuntimeToolchainArtifactReview");
    expect(gapTracker).toContain("buildWorkspaceRuntimeToolchainRedactedEvidenceBundle");
  });

  it("pins current workspace runtime toolchain proof files for GAP-130", () => {
    expect(workspaceRuntimeToolchainProofFiles).toEqual(
      expect.arrayContaining([
      "docs/workspace/README.md",
      "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
      "packages/quality/src/index.ts",
      "packages/quality/tests/quality-gates.test.ts",
      "scripts/quality/print-quality-gates.mjs",
      "scripts/workspace/audit-package-scripts.mjs",
      "scripts/workspace/audit-workspace-imports.mjs",
      "scripts/workspace/print-runtime-readiness.mjs",
      "apps/dashboard/package.json",
      "apps/web/package.json",
        "packages/workspace/package.json",
        "packages/workspace/src/index.ts",
        "packages/workspace/tests/workspace-audit.test.ts",
        "docs/workspace/manifests/runtime-readiness.json",
        "apps/web/lib/workspaceRuntimeToolchain.ts",
        "apps/web/tests/workspace-runtime-toolchain-static.test.ts",
        "packages/db/prisma/migrations/20260609032100_add_workspace_runtime_toolchain_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of workspaceRuntimeToolchainProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-130 execution policy non-executing while separating install, build, CI, and persistence proof", () => {
    const plan = buildWorkspaceRuntimeToolchainExecutionPlan();

    expect(plan.localCommands).toBe(workspaceRuntimeToolchainLocalCommands);
    expect(plan.externalCommands).toBe(workspaceRuntimeToolchainExternalCommands);
    expect(plan.localArtifacts).toBe(workspaceRuntimeToolchainLocalArtifacts);
    expect(plan.externalArtifacts).toBe(workspaceRuntimeToolchainExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/workspace-production-blockers.json");
    expect(plan.externalArtifacts).toEqual([
      "coverage/workspace-install-output.txt",
      "coverage/workspace-web-build-output.txt",
      "coverage/workspace-dashboard-build-output.txt",
      "coverage/workspace-ci-job.json",
      "coverage/workspace-runtime-redacted-evidence-bundle.json",
      "test-results/workspace-runtime-toolchain",
    ]);
    expect(plan).toMatchObject({
      packageTypecheckExecutionAllowed: false,
      packageTestExecutionAllowed: false,
      workspaceToolchainExecutionAllowed: false,
      workspaceAllExecutionAllowed: false,
      dependencyInstallExecutionAllowed: false,
      webBuildExecutionAllowed: false,
      dashboardBuildExecutionAllowed: false,
      ciWorkspaceJobExecutionAllowed: false,
      productionBlockerVisibilityExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(workspaceRuntimeToolchainExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticWorkspaceToolchain: true,
      packageRuntimeProofRequiredForClosure: true,
      installAndBuildEvidenceRequiredForClosure: true,
      ciWorkspaceEvidenceRequiredForClosure: true,
      productionBlockerVisibilityRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(workspaceRuntimeToolchainRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("pnpm install evidence captured after dependency resolution.");
    expect(plan.requiredExternalEvidence).toContain("Durable WorkspaceRuntimeToolchainRun persistence row captured from the target database.");
    expect(plan.requiredExternalEvidence).toContain("Redacted workspace runtime evidence bundle captured without raw install logs, CI URLs, database URLs, tokens, or operator identifiers.");
  });

  it("redacts workspace runtime toolchain artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "workspace_toolchain_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      installOutput: "resolved for engineer@example.com using token github_pat_1234567890ABCDEFGHIJKLMNOP",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      packageScriptAuditOutput: "script audit found user_private_123",
      webBuildLog: "build failed with PRIVATE_ENV=value",
      dashboardBuildOutput: "dashboard build stack tenant_private_123",
      runtimeReadinessReport: { productionBlocker: "blocker_private_123" },
      toolchainArtifactPath: "coverage/private-toolchain-artifact.json",
      blockerContact: "+1 (555) 867-5309",
      neutralWorkspaceLabel: "workspace_toolchain_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralRepositoryLabel: "repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralBranchLabel: "branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralPrLabel: "pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralReviewerLabel: "reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCodeownerLabel: "codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCiLabel: "ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactLocation: "coverage/workspace-runtime-toolchain/private-output.json",
      neutralDatabaseLocation: "postgresql://tenant_demo:secret@db.example.com/inkroute",
    };

    expect(buildRedactedWorkspaceRuntimeToolchainArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      installOutput: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
      packageScriptAuditOutput: "[REDACTED]",
      webBuildLog: "[REDACTED]",
      dashboardBuildOutput: "[REDACTED]",
      runtimeReadinessReport: "[REDACTED]",
      toolchainArtifactPath: "[REDACTED]",
      blockerContact: "[REDACTED]",
      neutralWorkspaceLabel: "[REDACTED]",
      neutralRepositoryLabel: "[REDACTED]",
      neutralBranchLabel: "[REDACTED]",
      neutralPrLabel: "[REDACTED]",
      neutralReviewerLabel: "[REDACTED]",
      neutralCodeownerLabel: "[REDACTED]",
      neutralCiLabel: "[REDACTED]",
      neutralArtifactLocation: "[REDACTED]",
      neutralDatabaseLocation: "[REDACTED]",
    });

    const review = buildWorkspaceRuntimeToolchainArtifactReview(artifact);
    const bundle = buildWorkspaceRuntimeToolchainRedactedEvidenceBundle(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(workspaceRuntimeToolchainRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "ciRunUrl",
        "installOutput",
        "persistence.tenantId",
        "persistence.databaseUrl",
        "packageScriptAuditOutput",
        "webBuildLog",
        "dashboardBuildOutput",
        "runtimeReadinessReport",
        "toolchainArtifactPath",
        "blockerContact",
        "neutralWorkspaceLabel",
        "neutralRepositoryLabel",
        "neutralBranchLabel",
        "neutralPrLabel",
        "neutralReviewerLabel",
        "neutralCodeownerLabel",
        "neutralCiLabel",
        "neutralArtifactLocation",
        "neutralDatabaseLocation",
      ]),
    );
    expect(review.requiredExternalEvidence).toContain(
      "Runtime readiness report keeps production blockers visible in redacted evidence.",
    );
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/workspace-runtime-redacted-evidence-bundle.json");
    expect(bundle.review.safeForTracker).toBe(true);
    expect(bundle.requiredArtifacts).toBe(workspaceRuntimeToolchainArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(workspaceRuntimeToolchainRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
  });
});



