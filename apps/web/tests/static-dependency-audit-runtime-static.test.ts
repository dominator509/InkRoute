import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  staticDependencyAuditArtifactPaths,
  staticDependencyAuditCommands,
  staticDependencyAuditCoverageAreas,
  staticDependencyAuditExternalArtifacts,
  staticDependencyAuditExternalCommands,
  staticDependencyAuditExecutionPolicy,
  staticDependencyAuditLocalArtifacts,
  staticDependencyAuditLocalCommands,
  staticDependencyAuditProofFiles,
  staticDependencyAuditReadiness,
  staticDependencyAuditReadinessRequiredEvidence,
  staticDependencyAuditRequiredEvidence,
  staticDependencyAuditRequiredExternalEvidence,
  staticDependencyAuditRunPersistenceContract,
  staticDependencyAuditRuntimeMatrix,
  buildRedactedStaticDependencyAuditArtifact,
  buildStaticDependencyAuditArtifactReview,
  buildStaticDependencyAuditDecisionRequiredEvidence,
  buildStaticDependencyAuditEvidenceDecision,
  buildStaticDependencyAuditExecutionPlan,
  buildStaticDependencyAuditRedactedEvidenceBundle,
} from "../lib/staticDependencyAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("static dependency audit runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const workspacePackageJson = readRepoFile("packages/workspace/package.json");
  const workspaceImportAudit = readRepoFile("scripts/workspace/audit-workspace-imports.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const workspaceProtocol = readRepoFile("docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md");
  const workspaceImportManifest = readRepoFile("docs/workspace/manifests/workspace-import-audit.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const staticDependencyAuditMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032200_add_static_dependency_audit_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins static dependency commands, coverage areas, matrix rows, and artifact paths", () => {
    expect(staticDependencyAuditCommands).toEqual([
      "node scripts/workspace/audit-workspace-imports.mjs",
      "pnpm --filter @inkroute/workspace test",
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm install",
      "pnpm typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "inspect peer dependency compatibility and version warnings",
      "capture runtime dependency resolution proof",
    ]);
    expect(staticDependencyAuditCoverageAreas).toEqual([
      "declared-workspace-dependencies",
      "workspace-source-imports",
      "tsconfig-path-aliases",
      "package-source-entrypoints",
      "manifest-main-types-export-targets",
      "bare-third-party-imports",
      "root-devdependency-test-tooling",
      "runtime-resolution-boundary",
      "peer-version-boundary",
    ]);
    expect(staticDependencyAuditRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "workspace-import-audit",
      "workspace-package-tests",
      "workspace-package-typecheck",
      "dependency-install-resolution",
      "workspace-typecheck-resolution",
      "web-build-resolution",
      "dashboard-build-resolution",
      "ci-workspace-resolution",
      "peer-version-review",
      "runtime-resolution-proof",
      "redacted-evidence-bundle",
    ]);
    expect(staticDependencyAuditArtifactPaths).toContain("coverage/static-dependency-audit-runtime.json");
    expect(staticDependencyAuditArtifactPaths).toContain("coverage/static-dependency-redacted-evidence-bundle.json");
    expect(staticDependencyAuditArtifactPaths).toContain("test-results/static-dependency-audit-runtime");
  });

  it("pins the StaticDependencyAuditRun persistence model and migration", () => {
    expect(staticDependencyAuditRunPersistenceContract.model).toBe("StaticDependencyAuditRun");
    expect(staticDependencyAuditRunPersistenceContract.tenantRelation).toBe("staticDependencyAuditRuns");
    expect(staticDependencyAuditRunPersistenceContract.migration).toBe("20260609032200_add_static_dependency_audit_runs");
    expect(staticDependencyAuditRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "coverageAreaManifest",
      "locallyVerifiedAudit",
      "artifactManifest",
      "peerVersionReviewManifest",
    ]);
    expect(staticDependencyAuditRunPersistenceContract.evidenceBooleans).toContain("workspaceImportAuditPassed");
    expect(staticDependencyAuditRunPersistenceContract.evidenceBooleans).toContain("peerVersionReviewCaptured");
    expect(staticDependencyAuditRunPersistenceContract.evidenceBooleans).toContain("runtimeResolutionProofCaptured");
    expect(staticDependencyAuditRunPersistenceContract.artifactFields).toContain("dependencyInstallArtifactPath");
    expect(staticDependencyAuditRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("staticDependencyAuditRuns StaticDependencyAuditRun[]");
    expect(prismaSchema).toContain("model StaticDependencyAuditRun");
    expect(prismaSchema).toContain("coverageAreaManifest");
    expect(prismaSchema).toContain("runtimeResolutionProofCaptured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(staticDependencyAuditMigration).toContain('CREATE TABLE "StaticDependencyAuditRun"');
    expect(staticDependencyAuditMigration).toContain('"locallyVerifiedAudit" JSONB NOT NULL');
    expect(staticDependencyAuditMigration).toContain('"runtimeResolutionProofCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(staticDependencyAuditMigration).toContain('CREATE UNIQUE INDEX "StaticDependencyAuditRun_tenantId_runId_key"');
  });

  it("keeps workspace import audit script, package tests, protocol, and manifest aligned", () => {
    expect(rootPackageJson).toContain("audit-workspace-imports.mjs");
    expect(workspacePackageJson).toContain('"typecheck"');
    expect(workspacePackageJson).toContain('"test"');
    expect(workspaceImportAudit).toContain("workspace imports");
    expect(workspaceImportAudit).toContain("external imports");
    expect(workspaceTests).toContain("allows shared root dev dependency tooling for external test imports");
    expect(workspaceProtocol).toContain("workspace import");
    expect(workspaceImportManifest).toContain("workspace-import-audit");
  });

  it("preserves the verified static audit result while runtime resolution remains gated", () => {
    expect(staticDependencyAuditReadiness.status).toBe("blocked");
    expect(staticDependencyAuditReadiness.locallyVerifiedAudit).toEqual({
      command: "node scripts/workspace/audit-workspace-imports.mjs",
      projects: 25,
      sourceFiles: 809,
      workspaceImports: 139,
      externalImports: 174,
      entrypointFindings: 0,
    });
    expect(staticDependencyAuditReadiness.requiredCommands).toBe(staticDependencyAuditCommands);
    expect(staticDependencyAuditReadiness.requiredEvidence).toBe(staticDependencyAuditReadinessRequiredEvidence);
    expect(staticDependencyAuditReadiness.blockers).toContain(
      "pnpm install, pnpm typecheck, and app builds must prove runtime dependency resolution.",
    );
  });

  it("blocks static dependency audit closure until runtime resolution, peer review, persistence, artifacts, and commands are proven", () => {
    const decision = buildStaticDependencyAuditEvidenceDecision({
      workspaceImportAuditPassed: true,
      workspacePackageTestsPassed: false,
      workspacePackageTypecheckPassed: false,
      dependencyInstallEvidenceCaptured: false,
      workspaceTypecheckPassed: false,
      webBuildEvidenceCaptured: false,
      dashboardBuildEvidenceCaptured: false,
      ciWorkspaceResolutionPassed: false,
      ciEvidenceCaptured: false,
      peerVersionReviewCaptured: false,
      runtimeResolutionProofCaptured: false,
      staticDependencyAuditRunPersisted: false,
      redactedEvidenceBundleCaptured: false,
      coveredAreas: [
        "declared-workspace-dependencies",
        "workspace-source-imports",
        "tsconfig-path-aliases",
      ],
      capturedArtifacts: [
        "coverage/static-dependency-audit-runtime.json",
        "coverage/static-dependency-audit-output.txt",
      ],
      completedCommands: ["node scripts/workspace/audit-workspace-imports.mjs"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCoverageAreas).toEqual([
      "package-source-entrypoints",
      "manifest-main-types-export-targets",
      "bare-third-party-imports",
      "root-devdependency-test-tooling",
      "runtime-resolution-boundary",
      "peer-version-boundary",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/static-dependency-workspace-package-test.txt",
      "coverage/static-dependency-workspace-package-typecheck.txt",
      "coverage/static-dependency-install-output.txt",
      "coverage/static-dependency-typecheck-output.txt",
      "coverage/static-dependency-web-build-output.txt",
      "coverage/static-dependency-dashboard-build-output.txt",
      "coverage/static-dependency-ci-job.json",
      "coverage/static-dependency-peer-version-review.json",
      "coverage/static-dependency-redacted-evidence-bundle.json",
      "test-results/static-dependency-audit-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/workspace test",
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm install",
      "pnpm typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "inspect peer dependency compatibility and version warnings",
      "capture runtime dependency resolution proof",
    ]);
    expect(decision.requiredCoverageAreas).toBe(staticDependencyAuditCoverageAreas);
    expect(decision.requiredArtifacts).toBe(staticDependencyAuditArtifactPaths);
    expect(decision.requiredCommands).toBe(staticDependencyAuditCommands);
    expect(decision.requiredEvidence).toEqual(
      buildStaticDependencyAuditDecisionRequiredEvidence(staticDependencyAuditReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(staticDependencyAuditRequiredEvidence);
    expect(decision.blockers).toContain("@inkroute/workspace package tests must pass after the static dependency audit patch.");
    expect(decision.blockers).toContain("StaticDependencyAuditRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Redacted static dependency audit evidence bundle must be captured.");
    expect(decision.blockers).toContain("Every required static dependency audit coverage area must be captured.");
  });

  it("completes static dependency audit closure when dependency boundaries, runtime resolution, CI, persistence, artifacts, and commands are proven", () => {
    const decision = buildStaticDependencyAuditEvidenceDecision({
      workspaceImportAuditPassed: true,
      workspacePackageTestsPassed: true,
      workspacePackageTypecheckPassed: true,
      dependencyInstallEvidenceCaptured: true,
      workspaceTypecheckPassed: true,
      webBuildEvidenceCaptured: true,
      dashboardBuildEvidenceCaptured: true,
      ciWorkspaceResolutionPassed: true,
      ciEvidenceCaptured: true,
      peerVersionReviewCaptured: true,
      runtimeResolutionProofCaptured: true,
      staticDependencyAuditRunPersisted: true,
      redactedEvidenceBundleCaptured: true,
      coveredAreas: staticDependencyAuditCoverageAreas,
      capturedArtifacts: staticDependencyAuditArtifactPaths,
      completedCommands: staticDependencyAuditCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCoverageAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.requiredEvidence).toEqual(
      buildStaticDependencyAuditDecisionRequiredEvidence(staticDependencyAuditReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(staticDependencyAuditRequiredEvidence);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runtime resolution is proven", () => {
    expect(ciWorkflow).toContain("Run Phase 18 static dependency audit runtime contracts");
    expect(ciWorkflow).toContain("static-dependency-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("static-dependency-audit-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-static-dependency-audit-runtime-static");
    expect(unitManifest).toContain("StaticDependencyAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("StaticDependencyAuditRun");
    expect(gapTracker).toContain("apps/web/lib/staticDependencyAuditRuntime.ts");
    expect(gapTracker).toContain("GAP-131 static dependency audit artifact hardening");
    expect(gapTracker).toContain("staticDependencyAuditCoverageAreas");
    expect(gapTracker).toContain("buildStaticDependencyAuditExecutionPlan");
    expect(gapTracker).toContain("staticDependencyAuditExecutionPolicy");
    expect(gapTracker).toContain("staticDependencyAuditReadinessRequiredEvidence");
    expect(gapTracker).toContain("staticDependencyAuditRequiredEvidence");
    expect(gapTracker).toContain("staticDependencyAuditRequiredExternalEvidence");
    expect(gapTracker).toContain("staticDependencyAuditLocalArtifacts");
    expect(gapTracker).toContain("staticDependencyAuditExternalArtifacts");
    expect(gapTracker).toContain("buildStaticDependencyAuditArtifactReview");
    expect(gapTracker).toContain("buildStaticDependencyAuditRedactedEvidenceBundle");
  });

  it("pins current static dependency audit runtime proof files for GAP-131", () => {
    expect(staticDependencyAuditProofFiles).toEqual(
      expect.arrayContaining([
      "docs/workspace/README.md",
      "apps/dashboard/package.json",
      "apps/web/package.json",
        "scripts/workspace/audit-workspace-imports.mjs",
        "packages/workspace/package.json",
        "packages/workspace/src/index.ts",
        "docs/workspace/manifests/workspace-import-audit.json",
        "apps/web/lib/staticDependencyAuditRuntime.ts",
        "apps/web/tests/static-dependency-audit-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609032200_add_static_dependency_audit_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of staticDependencyAuditProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-131 execution policy non-executing while separating runtime resolution proof", () => {
    const plan = buildStaticDependencyAuditExecutionPlan();

    expect(plan.localCommands).toBe(staticDependencyAuditLocalCommands);
    expect(plan.externalCommands).toBe(staticDependencyAuditExternalCommands);
    expect(plan.localArtifacts).toBe(staticDependencyAuditLocalArtifacts);
    expect(plan.externalArtifacts).toBe(staticDependencyAuditExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/static-dependency-audit-runtime.json",
      "coverage/static-dependency-audit-output.txt",
    ]);
    expect(plan.externalArtifacts).toEqual([
      "coverage/static-dependency-workspace-package-test.txt",
      "coverage/static-dependency-workspace-package-typecheck.txt",
      "coverage/static-dependency-install-output.txt",
      "coverage/static-dependency-typecheck-output.txt",
      "coverage/static-dependency-web-build-output.txt",
      "coverage/static-dependency-dashboard-build-output.txt",
      "coverage/static-dependency-ci-job.json",
      "coverage/static-dependency-peer-version-review.json",
      "coverage/static-dependency-redacted-evidence-bundle.json",
      "test-results/static-dependency-audit-runtime",
    ]);
    expect(plan).toMatchObject({
      workspaceImportAuditExecutionAllowed: false,
      workspacePackageTestExecutionAllowed: false,
      workspacePackageTypecheckExecutionAllowed: false,
      dependencyInstallExecutionAllowed: false,
      workspaceTypecheckExecutionAllowed: false,
      webBuildExecutionAllowed: false,
      dashboardBuildExecutionAllowed: false,
      ciWorkspaceResolutionExecutionAllowed: false,
      peerVersionReviewExecutionAllowed: false,
      runtimeResolutionProofExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(staticDependencyAuditExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticDependencyAudit: true,
      packageRuntimeProofRequiredForClosure: true,
      installTypecheckBuildEvidenceRequiredForClosure: true,
      ciWorkspaceEvidenceRequiredForClosure: true,
      peerVersionReviewRequiredForClosure: true,
      runtimeResolutionProofRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(staticDependencyAuditRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("Redacted static dependency audit evidence bundle captured without raw install logs, registry URLs, tokens, database URLs, or package-owner identifiers.");
  });

  it("redacts static dependency audit artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "static_dep_01HZYXZYXZYXZYXZYXZYXZYXZ",
      registryUrl: "https://registry.npmjs.org/@inkroute/workspace",
      installOutput: "resolved by engineer@example.com with token github_pat_1234567890ABCDEFGHIJKLMNOP",
      peerReview: {
        packageId: "@scope/private-package-01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      dependencyTreeOutput: "workspace app resolved package @inkroute/db from ../packages/db",
      pnpmLockfileExcerpt: "registry.npmjs.org/@stripe/stripe-js/-/stripe-js-4.1.0.tgz",
      ciWorkspaceResolutionPayload: {
        workflowRunUrl: "https://github.com/example/inkroute/actions/runs/123456789",
        commandStdout: "pnpm install resolved workspace dependencies",
      },
      runtimeResolutionProof: {
        webBuildArtifactPath: "test-results/static-dependency-audit-runtime/web-build.log",
        dashboardBuildOutput: "dashboard imported package-runtime-01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr-3131",
      reviewerHandle: "reviewer_dependency_owner",
      codeownerSelector: "CODEOWNER:workspace-platform-team",
    };

    expect(buildRedactedStaticDependencyAuditArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      registryUrl: "[REDACTED]",
      installOutput: "[REDACTED]",
      peerReview: "[REDACTED]",
      persistence: "[REDACTED]",
      dependencyTreeOutput: "[REDACTED]",
      pnpmLockfileExcerpt: "[REDACTED]",
      ciWorkspaceResolutionPayload: "[REDACTED]",
      runtimeResolutionProof: "[REDACTED]",
      repositorySelector: "[REDACTED]",
      pullRequestSelector: "[REDACTED]",
      reviewerHandle: "[REDACTED]",
      codeownerSelector: "[REDACTED]",
    });

    const review = buildStaticDependencyAuditArtifactReview(artifact);
    const bundle = buildStaticDependencyAuditRedactedEvidenceBundle(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(staticDependencyAuditRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "registryUrl",
        "installOutput",
        "peerReview",
        "persistence",
        "dependencyTreeOutput",
        "pnpmLockfileExcerpt",
        "ciWorkspaceResolutionPayload",
        "runtimeResolutionProof",
        "repositorySelector",
        "pullRequestSelector",
        "reviewerHandle",
        "codeownerSelector",
      ]),
    );
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/static-dependency-redacted-evidence-bundle.json");
    expect(bundle.review.safeForTracker).toBe(true);
    expect(bundle.requiredArtifacts).toBe(staticDependencyAuditArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(staticDependencyAuditRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
  });
});



