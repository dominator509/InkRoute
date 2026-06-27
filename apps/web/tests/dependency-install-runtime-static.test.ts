import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDependencyInstallDecisionRequiredEvidence,
  buildDependencyInstallEvidenceDecision,
  buildDependencyInstallExecutionPlan,
  buildDependencyInstallRedactedEvidenceBundle,
  buildDependencyInstallRunData,
  dependencyInstallArtifactPaths,
  dependencyInstallExecutionPolicy,
  dependencyInstallProofFiles,
  dependencyInstallReadiness,
  dependencyInstallReadinessRequiredEvidence,
  dependencyInstallRequiredEvidence,
  dependencyInstallRequiredExternalEvidence,
  dependencyInstallRunPersistenceContract,
  dependencyInstallRuntimeCommands,
  dependencyInstallRuntimeMatrix,
  dependencyInstallSourceFiles,
  persistDependencyInstallRun,
} from "../lib/dependencyInstallRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dependency install runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const pnpmWorkspace = readRepoFile("pnpm-workspace.yaml");
  const pnpmLockfile = readRepoFile("pnpm-lock.yaml");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const runtimeEvidence = readRepoFile("docs/workspace/manifests/runtime-evidence.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const dependencyInstallMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032500_add_dependency_install_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins dependency commands, source files, matrix rows, and artifact paths", () => {
    expect(dependencyInstallRuntimeCommands).toEqual([
      "corepack enable",
      "pnpm install",
      "pnpm install --frozen-lockfile",
      "pnpm workspace:all",
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test:unit",
      "GitHub Actions CI quality job",
      "dependency readiness report keeps provider/runtime/legal blockers visible",
    ]);
    expect(dependencyInstallSourceFiles).toEqual([
      "package.json",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
    ]);
    expect(dependencyInstallRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "package-manager-corepack",
      "dependency-install",
      "frozen-lockfile-install",
      "workspace-audit-after-install",
      "typecheck-after-install",
      "lint-after-install",
      "unit-tests-after-install",
      "ci-quality-job",
      "production-blocker-visibility",
      "redacted-evidence-bundle",
    ]);
    expect(dependencyInstallArtifactPaths).toContain("coverage/dependency-install-runtime.json");
    expect(dependencyInstallArtifactPaths).toContain("coverage/dependency-install-redacted-evidence-bundle.json");
    expect(dependencyInstallArtifactPaths).toContain("test-results/dependency-install-runtime");
  });

  it("pins the DependencyInstallRun persistence model and migration", () => {
    const runData = buildDependencyInstallRunData({
      tenantId: "tenant_static",
      runId: "dependency_static",
      commitSha: "abc123",
      status: "blocked",
      packageJsonPresent: true,
      pnpmWorkspacePresent: true,
      pnpmLockfilePresent: true,
      packageManagerPinned: true,
      lockfileCommitted: true,
      corepackEnabled: false,
      installCommandPassed: false,
      frozenLockfileInstallPassed: false,
      workspaceAuditPassed: false,
      typecheckPassed: false,
      lintPassed: false,
      unitTestsPassed: false,
      ciQualityJobPassed: false,
      ciEvidenceCaptured: false,
      productionBlockersVisible: true,
      dependencyInstallRunPersisted: false,
      presentSourceFiles: dependencyInstallSourceFiles,
      capturedArtifacts: ["coverage/dependency-install-runtime.json", "coverage/dependency-production-blockers.json"],
      completedCommands: [],
      productionBlockerArtifactPath: "coverage/dependency-production-blockers.json",
    });

    expect(dependencyInstallRunPersistenceContract.model).toBe("DependencyInstallRun");
    expect(dependencyInstallRunPersistenceContract.tenantRelation).toBe("dependencyInstallRuns");
    expect(dependencyInstallRunPersistenceContract.migration).toBe("20260609032500_add_dependency_install_runs");
    expect(dependencyInstallRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "sourceFileManifest",
      "artifactManifest",
      "productionBlockerManifest",
    ]);
    expect(dependencyInstallRunPersistenceContract.evidenceBooleans).toContain("packageManagerPinned");
    expect(dependencyInstallRunPersistenceContract.evidenceBooleans).toContain("frozenLockfileInstallPassed");
    expect(dependencyInstallRunPersistenceContract.evidenceBooleans).toContain("ciEvidenceCaptured");
    expect(dependencyInstallRunPersistenceContract.artifactFields).toContain("installArtifactPath");
    expect(dependencyInstallRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("dependencyInstallRuns DependencyInstallRun[]");
    expect(prismaSchema).toContain("model DependencyInstallRun");
    expect(prismaSchema).toContain("sourceFileManifest");
    expect(prismaSchema).toContain("frozenLockfileInstallPassed");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(dependencyInstallMigration).toContain('CREATE TABLE "DependencyInstallRun"');
    expect(dependencyInstallMigration).toContain('"sourceFileManifest" JSONB NOT NULL');
    expect(dependencyInstallMigration).toContain('"frozenLockfileInstallPassed" BOOLEAN NOT NULL DEFAULT false');
    expect(dependencyInstallMigration).toContain('CREATE UNIQUE INDEX "DependencyInstallRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "dependency_static",
      commitSha: "abc123",
      status: "blocked",
      packageJsonPresent: true,
      pnpmWorkspacePresent: true,
      pnpmLockfilePresent: true,
      installCommandPassed: false,
      frozenLockfileInstallPassed: false,
      productionBlockersVisible: true,
      productionBlockerArtifactPath: "coverage/dependency-production-blockers.json",
    });
    expect(runData.commandMatrix).toBe(dependencyInstallRuntimeMatrix);
    expect(runData.sourceFileManifest).toBe(dependencyInstallSourceFiles);
    expect(String(persistDependencyInstallRun)).toContain("repository.dependencyInstallRun.upsert");
  });

  it("keeps dependency source files, package manager pin, lockfile, and helper tests wired", () => {
    expect(rootPackageJson).toContain('"packageManager"');
    expect(rootPackageJson).toContain("pnpm");
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain('"test:unit"');
    expect(pnpmWorkspace).toContain("apps/*");
    expect(pnpmWorkspace).toContain("packages/*");
    expect(pnpmLockfile).toContain("lockfileVersion");
    expect(workspaceTests).toContain("buildDependencyInstallReadinessPlan");
    expect(runtimeEvidence).toContain("pnpm install");
  });

  it("keeps source readiness complete while install and quality evidence remain gated", () => {
    const executionPlan = buildDependencyInstallExecutionPlan();

    expect(executionPlan.localCommands).toBe(dependencyInstallRuntimeCommands);
    expect(executionPlan.artifactPaths).toBe(dependencyInstallArtifactPaths);
    expect(executionPlan.proofFiles).toBe(dependencyInstallProofFiles);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dependencyInstallExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticDependencyReadiness: true,
      localInstallOutputRequiredForClosure: true,
      frozenLockfileOutputRequiredForClosure: true,
      workspaceQualityOutputRequiredForClosure: true,
      ciQualityEvidenceRequiredForClosure: true,
      providerPersistenceRequiredForClosure: true,
      productionBlockerArtifactRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dependencyInstallRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Redacted dependency install evidence bundle captured without raw install logs, tokens, URLs, environment values, or actor identifiers.",
    );
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed persistDependencyInstallRun execution evidence.",
    );
    expect(dependencyInstallReadiness.status).toBe("blocked");
    expect(dependencyInstallReadiness.missingSourceFiles).toEqual([]);
    expect(dependencyInstallReadiness.requiredCommands).toBe(dependencyInstallRuntimeCommands);
    expect(dependencyInstallReadiness.requiredEvidence).toBe(dependencyInstallReadinessRequiredEvidence);
    expect(dependencyInstallReadiness.blockers).toEqual([
      "pnpm install must pass in the working environment.",
      "pnpm install --frozen-lockfile must pass in CI or a clean checkout.",
      "pnpm typecheck must pass after dependency install.",
      "pnpm lint must pass after dependency install.",
      "pnpm test:unit must pass after dependency install.",
      "pnpm workspace:all must pass after dependency install.",
      "CI evidence for install, typecheck, lint, tests, and workspace audits must be captured.",
    ]);
  });

  it("blocks dependency install closure until install, quality, CI, persistence, source, artifact, and command evidence are proven", () => {
    const decision = buildDependencyInstallEvidenceDecision({
      packageJsonPresent: true,
      pnpmWorkspacePresent: true,
      pnpmLockfilePresent: true,
      packageManagerPinned: true,
      lockfileCommitted: true,
      corepackEnabled: false,
      installCommandPassed: false,
      frozenLockfileInstallPassed: false,
      workspaceAuditPassed: false,
      typecheckPassed: false,
      lintPassed: false,
      unitTestsPassed: false,
      ciQualityJobPassed: false,
      ciEvidenceCaptured: false,
      productionBlockersVisible: true,
      dependencyInstallRunPersisted: false,
      presentSourceFiles: ["package.json", "pnpm-workspace.yaml"],
      capturedArtifacts: [
        "coverage/dependency-install-runtime.json",
        "coverage/dependency-production-blockers.json",
      ],
      completedCommands: ["corepack enable"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingSourceFiles).toEqual(["pnpm-lock.yaml"]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/dependency-corepack-output.txt",
      "coverage/dependency-install-output.txt",
      "coverage/dependency-frozen-lockfile-output.txt",
      "coverage/dependency-workspace-all-output.txt",
      "coverage/dependency-typecheck-output.txt",
      "coverage/dependency-lint-output.txt",
      "coverage/dependency-unit-output.txt",
      "coverage/dependency-ci-quality-job.json",
      "coverage/dependency-install-redacted-evidence-bundle.json",
      "test-results/dependency-install-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm install",
      "pnpm install --frozen-lockfile",
      "pnpm workspace:all",
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test:unit",
      "GitHub Actions CI quality job",
      "dependency readiness report keeps provider/runtime/legal blockers visible",
    ]);
    expect(decision.requiredSourceFiles).toBe(dependencyInstallSourceFiles);
    expect(decision.requiredArtifacts).toBe(dependencyInstallArtifactPaths);
    expect(decision.requiredCommands).toBe(dependencyInstallRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildDependencyInstallDecisionRequiredEvidence(dependencyInstallReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(dependencyInstallRequiredEvidence);
    expect(decision.blockers).toContain("pnpm install must pass in the working environment.");
    expect(decision.blockers).toContain("DependencyInstallRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required dependency source file must be present.");
  });

  it("completes dependency install closure when source, install, quality, CI, persistence, artifacts, and commands are proven", () => {
    const decision = buildDependencyInstallEvidenceDecision({
      packageJsonPresent: true,
      pnpmWorkspacePresent: true,
      pnpmLockfilePresent: true,
      packageManagerPinned: true,
      lockfileCommitted: true,
      corepackEnabled: true,
      installCommandPassed: true,
      frozenLockfileInstallPassed: true,
      workspaceAuditPassed: true,
      typecheckPassed: true,
      lintPassed: true,
      unitTestsPassed: true,
      ciQualityJobPassed: true,
      ciEvidenceCaptured: true,
      productionBlockersVisible: true,
      dependencyInstallRunPersisted: true,
      presentSourceFiles: dependencyInstallSourceFiles,
      capturedArtifacts: dependencyInstallArtifactPaths,
      completedCommands: dependencyInstallRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingSourceFiles).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming install evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 1 dependency install runtime contracts");
    expect(ciWorkflow).toContain("dependency-install-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dependency-install-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-dependency-install-runtime-static");
    expect(unitManifest).toContain("DependencyInstallRun Prisma model and app row contract");
    expect(gapTracker).toContain("DependencyInstallRun");
    expect(gapTracker).toContain("apps/web/lib/dependencyInstallRuntime.ts");
    expect(gapTracker).toContain("persistDependencyInstallRun upsert seam");
    expect(gapTracker).toContain("buildDependencyInstallExecutionPlan");
    expect(gapTracker).toContain("dependencyInstallExecutionPolicy");
    expect(gapTracker).toContain("dependencyInstallReadinessRequiredEvidence");
    expect(gapTracker).toContain("dependencyInstallRequiredEvidence");
    expect(gapTracker).toContain("dependencyInstallRequiredExternalEvidence");
    expect(gapTracker).toContain("buildDependencyInstallRedactedEvidenceBundle");
    expect(gapTracker).toContain(
      "live install, frozen-lockfile install, typecheck, lint, unit-test, workspace audit, CI, provider-backed persistDependencyInstallRun execution, production-blocker visibility, and artifact evidence remain gated",
    );
    expect(gapTracker).toContain("GAP-001 is dependency-install-runtime-matrix wired with evidence classifier");
  });

  it("pins current dependency install runtime proof files for GAP-001", () => {
    expect(dependencyInstallProofFiles).toEqual(
      expect.arrayContaining([
      "packages/workspace/src/index.ts",
        "package.json",
        "pnpm-workspace.yaml",
        "pnpm-lock.yaml",
        "apps/web/lib/dependencyInstallRuntime.ts",
        "apps/web/tests/dependency-install-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609032500_add_dependency_install_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of dependencyInstallProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("builds a redacted dependency install evidence bundle for handoff use", () => {
    const artifact = {
      installOutput: "installed with token github_pat_1234567890ABCDEFGHIJKLMNOP",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      actorEmail: "owner@example.com",
      environment: { DATABASE_URL: "postgres://user:pass@example.invalid/db" },
      safeSummary: "dependency install proof captured",
    };

    const bundle = buildDependencyInstallRedactedEvidenceBundle(artifact);

    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/dependency-install-redacted-evidence-bundle.json");
    expect(bundle.requiredArtifacts).toBe(dependencyInstallArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(dependencyInstallRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
    expect(bundle.redactions).toEqual(
      expect.arrayContaining(["token", "url", "email", "actor", "log", "output", "environment"]),
    );
    expect(bundle.redactedArtifact).toMatchObject({
      installOutput: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      actorEmail: "[REDACTED]",
      environment: "[REDACTED]",
      safeSummary: "dependency install proof captured",
    });
  });
});



