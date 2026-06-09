import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  workspaceRuntimeToolchainArtifactPaths,
  workspaceRuntimeToolchainCommands,
  workspaceRuntimeToolchainGeneratedReports,
  workspaceRuntimeToolchainMatrix,
  workspaceRuntimeToolchainReadiness,
  workspaceRuntimeToolchainRunPersistenceContract,
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
    ]);
    expect(workspaceRuntimeToolchainArtifactPaths).toContain("coverage/workspace-runtime-toolchain.json");
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
    expect(toolchainVerifier).toContain("buildWorkspaceRuntimeToolchainReadinessPlan");
    expect(workspaceTests).toContain("buildWorkspaceRuntimeToolchainReadinessPlan");
  });

  it("keeps generated reports present while runtime command evidence remains gated", () => {
    expect(workspaceRuntimeToolchainReadiness.status).toBe("blocked");
    expect(workspaceRuntimeToolchainReadiness.missingGeneratedReports).toEqual([]);
    expect(workspaceRuntimeToolchainReadiness.requiredCommands).toEqual([...workspaceRuntimeToolchainCommands]);
    expect(workspaceRuntimeToolchainReadiness.requiredEvidence).toEqual([
      "@inkroute/workspace package typecheck and test output.",
      "workspace:toolchain and workspace:all output.",
      "Generated workspace import, package-script, runtime-evidence, runtime-readiness, required-checks, and toolchain-readiness reports.",
      "Dependency install evidence and CI workspace job evidence.",
      "Web/dashboard build evidence before launch readiness claims.",
      "Runtime readiness report showing production blockers remain visible.",
    ]);
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

  it("wires CI, manifest, tracker, and artifacts without claiming runtime install/build proof", () => {
    expect(ciWorkflow).toContain("Run Phase 18 workspace runtime toolchain contracts");
    expect(ciWorkflow).toContain("workspace-runtime-toolchain-static.test.ts");
    expect(ciWorkflow).toContain("workspace-runtime-toolchain-artifacts");
    expect(unitManifest).toContain("unit-web-workspace-runtime-toolchain-static");
    expect(unitManifest).toContain("WorkspaceRuntimeToolchainRun Prisma model and app row contract");
    expect(gapTracker).toContain("WorkspaceRuntimeToolchainRun");
    expect(gapTracker).toContain("apps/web/lib/workspaceRuntimeToolchain.ts");
    expect(gapTracker).toContain("live package typecheck/test, workspace commands, install/build, CI, and artifact proof remain open");
  });
});
