import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runtimeEvidenceArtifactPaths,
  runtimeEvidenceCommands,
  runtimeEvidenceCurrentRecords,
  runtimeEvidenceExternalArtifacts,
  runtimeEvidenceExternalCommands,
  runtimeEvidenceExecutionPolicy,
  runtimeEvidenceLocalArtifacts,
  runtimeEvidenceLocalCommands,
  runtimeEvidenceMatrix,
  runtimeEvidenceProofFiles,
  runtimeEvidenceReadiness,
  runtimeEvidenceReadinessRequiredEvidence,
  runtimeEvidenceRequiredEvidence,
  runtimeEvidenceRequiredExternalEvidence,
  runtimeEvidenceRequirementIds,
  runtimeEvidenceRunPersistenceContract,
  buildRedactedRuntimeEvidenceArtifact,
  buildRuntimeEvidenceArtifactReview,
  buildRuntimeEvidenceDecision,
  buildRuntimeEvidenceDecisionRequiredEvidence,
  buildRuntimeEvidenceExecutionPlan,
  buildRuntimeEvidenceRedactedEvidenceBundle,
} from "../lib/runtimeEvidenceMatrix";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("runtime evidence matrix contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const runtimeEvidenceContract = readRepoFile("docs/workspace/manifests/runtime-evidence-contract.json");
  const runtimeEvidenceManifest = readRepoFile("docs/workspace/manifests/runtime-evidence.json");
  const runtimeEvidenceVerifier = readRepoFile("scripts/workspace/verify-runtime-evidence.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const runtimeEvidenceMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032300_add_runtime_evidence_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins required runtime commands, requirement ids, matrix rows, and artifact paths", () => {
    expect(runtimeEvidenceCommands).toEqual([
      "pnpm install",
      "pnpm workspace:runtime-evidence",
      "pnpm workspace:all",
      "pnpm handoff:all",
      "pnpm quality:all",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "runtime evidence report keeps production blockers visible",
    ]);
    expect(runtimeEvidenceRequirementIds).toEqual([
      "dependency-install",
      "workspace-runtime-evidence",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
    ]);
    expect(runtimeEvidenceMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "workspace-runtime-evidence",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
      "ci-runtime-readiness",
      "production-blockers-visible",
      "redacted-evidence-bundle",
    ]);
    expect(runtimeEvidenceArtifactPaths).toContain("coverage/runtime-evidence-matrix.json");
    expect(runtimeEvidenceArtifactPaths).toContain("coverage/runtime-evidence-redacted-evidence-bundle.json");
    expect(runtimeEvidenceArtifactPaths).toContain("test-results/runtime-evidence-matrix");
  });

  it("pins the RuntimeEvidenceRun persistence model and migration", () => {
    expect(runtimeEvidenceRunPersistenceContract.model).toBe("RuntimeEvidenceRun");
    expect(runtimeEvidenceRunPersistenceContract.tenantRelation).toBe("runtimeEvidenceRuns");
    expect(runtimeEvidenceRunPersistenceContract.migration).toBe("20260609032300_add_runtime_evidence_runs");
    expect(runtimeEvidenceRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "requirementManifest",
      "artifactManifest",
      "redactedEvidenceManifest",
      "productionBlockerManifest",
    ]);
    expect(runtimeEvidenceRunPersistenceContract.evidenceBooleans).toContain("installEvidenceCaptured");
    expect(runtimeEvidenceRunPersistenceContract.evidenceBooleans).toContain("runtimeEvidenceAuditPassed");
    expect(runtimeEvidenceRunPersistenceContract.evidenceBooleans).toContain("redactedEvidenceLabelsCaptured");
    expect(runtimeEvidenceRunPersistenceContract.artifactFields).toContain("qualityAllArtifactPath");
    expect(runtimeEvidenceRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("runtimeEvidenceRuns RuntimeEvidenceRun[]");
    expect(prismaSchema).toContain("model RuntimeEvidenceRun");
    expect(prismaSchema).toContain("redactedEvidenceManifest");
    expect(prismaSchema).toContain("redactedEvidenceLabelsCaptured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(runtimeEvidenceMigration).toContain('CREATE TABLE "RuntimeEvidenceRun"');
    expect(runtimeEvidenceMigration).toContain('"redactedEvidenceManifest" JSONB NOT NULL');
    expect(runtimeEvidenceMigration).toContain('"redactedEvidenceLabelsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(runtimeEvidenceMigration).toContain('CREATE UNIQUE INDEX "RuntimeEvidenceRun_tenantId_runId_key"');
  });

  it("keeps runtime evidence scripts, manifests, verifier, and helper tests aligned", () => {
    expect(rootPackageJson).toContain('"workspace:runtime-evidence"');
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain("workspace:runtime-evidence");
    expect(runtimeEvidenceContract).toContain("pnpm install");
    expect(runtimeEvidenceContract).toContain("pnpm quality:all");
    expect(runtimeEvidenceManifest).toContain("runtime-evidence");
    expect(runtimeEvidenceVerifier).toContain("buildRuntimeEvidenceReadinessPlan");
    expect(workspaceTests).toContain("buildRuntimeEvidenceReadinessPlan");
  });

  it("keeps missing runtime proof explicit until redacted command evidence exists", () => {
    expect(runtimeEvidenceReadiness.status).toBe("blocked");
    expect(runtimeEvidenceCurrentRecords.map((record) => record.id)).toEqual([
      "dependency-install",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
    ]);
    expect(runtimeEvidenceReadiness.missingEvidenceIds).toEqual(["workspace-runtime-evidence"]);
    expect(runtimeEvidenceReadiness.nonPassingEvidenceIds).toEqual([
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
    ]);
    expect(runtimeEvidenceReadiness.requiredCommands).toBe(runtimeEvidenceCommands);
    expect(runtimeEvidenceReadiness.requiredEvidence).toBe(runtimeEvidenceReadinessRequiredEvidence);
    expect(runtimeEvidenceReadiness.blockers).toContain("Runtime evidence is missing for pnpm workspace:runtime-evidence.");
    expect(runtimeEvidenceReadiness.blockers).toContain("Runtime evidence for pnpm workspace:all must be passed with a redacted evidence label.");
    expect(runtimeEvidenceReadiness.blockers).toContain("Runtime evidence audit must pass before runtime readiness can be claimed.");
  });

  it("blocks runtime evidence closure until commands, redacted labels, CI, persistence, artifacts, and requirements are proven", () => {
    const decision = buildRuntimeEvidenceDecision({
      installEvidenceCaptured: false,
      runtimeEvidenceCommandPassed: false,
      workspaceAllPassed: false,
      handoffAllPassed: false,
      qualityAllPassed: false,
      typecheckPassed: false,
      unitTestsPassed: false,
      webBuildEvidenceCaptured: false,
      dashboardBuildEvidenceCaptured: false,
      ciRuntimeReadinessPassed: false,
      ciEvidenceCaptured: false,
      runtimeEvidenceAuditPassed: false,
      redactedEvidenceLabelsCaptured: false,
      productionBlockersVisible: true,
      runtimeEvidenceRunPersisted: false,
      redactedEvidenceBundleCaptured: false,
      passedRequirementIds: ["dependency-install"],
      capturedArtifacts: [
        "coverage/runtime-evidence-matrix.json",
        "coverage/runtime-evidence-production-blockers.json",
      ],
      completedCommands: ["pnpm install"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingRequirementIds).toEqual([
      "workspace-runtime-evidence",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/runtime-evidence-install-output.txt",
      "coverage/runtime-evidence-workspace-output.txt",
      "coverage/runtime-evidence-workspace-all-output.txt",
      "coverage/runtime-evidence-handoff-all-output.txt",
      "coverage/runtime-evidence-quality-all-output.txt",
      "coverage/runtime-evidence-typecheck-output.txt",
      "coverage/runtime-evidence-unit-output.txt",
      "coverage/runtime-evidence-web-build-output.txt",
      "coverage/runtime-evidence-dashboard-build-output.txt",
      "coverage/runtime-evidence-ci-job.json",
      "coverage/runtime-evidence-redacted-evidence-bundle.json",
      "test-results/runtime-evidence-matrix",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm workspace:runtime-evidence",
      "pnpm workspace:all",
      "pnpm handoff:all",
      "pnpm quality:all",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
      "runtime evidence report keeps production blockers visible",
    ]);
    expect(decision.requiredRequirementIds).toBe(runtimeEvidenceRequirementIds);
    expect(decision.requiredArtifacts).toBe(runtimeEvidenceArtifactPaths);
    expect(decision.requiredCommands).toBe(runtimeEvidenceCommands);
    expect(decision.requiredEvidence).toEqual(
      buildRuntimeEvidenceDecisionRequiredEvidence(runtimeEvidenceReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(runtimeEvidenceRequiredEvidence);
    expect(decision.blockers).toContain("Runtime evidence is missing for pnpm install.");
    expect(decision.blockers).toContain("RuntimeEvidenceRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Redacted runtime evidence bundle must be captured.");
    expect(decision.blockers).toContain("Every required runtime evidence requirement must have passing evidence.");
  });

  it("completes runtime evidence closure when all command, redacted-label, CI, persistence, artifact, and requirement proof exists", () => {
    const decision = buildRuntimeEvidenceDecision({
      installEvidenceCaptured: true,
      runtimeEvidenceCommandPassed: true,
      workspaceAllPassed: true,
      handoffAllPassed: true,
      qualityAllPassed: true,
      typecheckPassed: true,
      unitTestsPassed: true,
      webBuildEvidenceCaptured: true,
      dashboardBuildEvidenceCaptured: true,
      ciRuntimeReadinessPassed: true,
      ciEvidenceCaptured: true,
      runtimeEvidenceAuditPassed: true,
      redactedEvidenceLabelsCaptured: true,
      productionBlockersVisible: true,
      runtimeEvidenceRunPersisted: true,
      redactedEvidenceBundleCaptured: true,
      passedRequirementIds: runtimeEvidenceRequirementIds,
      capturedArtifacts: runtimeEvidenceArtifactPaths,
      completedCommands: runtimeEvidenceCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingRequirementIds).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming command evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 18 runtime evidence matrix contracts");
    expect(ciWorkflow).toContain("runtime-evidence-matrix-static.test.ts");
    expect(ciWorkflow).toContain("runtime-evidence-matrix-artifacts");
    expect(unitManifest).toContain("unit-web-runtime-evidence-matrix-static");
    expect(unitManifest).toContain("RuntimeEvidenceRun Prisma model and app row contract");
    expect(gapTracker).toContain("RuntimeEvidenceRun");
    expect(gapTracker).toContain("apps/web/lib/runtimeEvidenceMatrix.ts");
    expect(gapTracker).toContain("live install, workspace, handoff, quality, typecheck, unit, build, CI, redacted evidence labels, persisted run rows, and artifact proof remain gated with production blockers visible");
    expect(gapTracker).toContain("GAP-132 is runtime-evidence-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildRuntimeEvidenceExecutionPlan");
    expect(gapTracker).toContain("runtimeEvidenceExecutionPolicy");
    expect(gapTracker).toContain("buildRuntimeEvidenceDecisionRequiredEvidence");
    expect(gapTracker).toContain("runtimeEvidenceRequiredEvidence");
    expect(gapTracker).toContain("runtimeEvidenceRequiredExternalEvidence");
    expect(gapTracker).toContain("runtimeEvidenceCurrentRecords");
    expect(gapTracker).toContain("buildRuntimeEvidenceArtifactReview");
    expect(gapTracker).toContain("buildRuntimeEvidenceRedactedEvidenceBundle");
  });

  it("pins current runtime evidence matrix proof files for GAP-132", () => {
    expect(runtimeEvidenceProofFiles).toEqual(
      expect.arrayContaining([
      "docs/workspace/README.md",
      "docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md",
      "docs/workspace/manifests/runtime-evidence-audit.json",
      "docs/workspace/manifests/runtime-readiness.json",
      "packages/quality/src/index.ts",
      "packages/quality/tests/quality-gates.test.ts",
      "packages/workspace/src/index.ts",
      "scripts/quality/print-quality-gates.mjs",
      "apps/dashboard/package.json",
      "apps/web/package.json",
        "scripts/workspace/print-runtime-readiness.mjs",
        "scripts/workspace/verify-runtime-evidence.mjs",
        "docs/workspace/manifests/runtime-evidence.json",
        "apps/web/lib/runtimeEvidenceMatrix.ts",
        "apps/web/tests/runtime-evidence-matrix-static.test.ts",
        "packages/db/prisma/migrations/20260609032300_add_runtime_evidence_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of runtimeEvidenceProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-132 execution policy non-executing while separating runtime command evidence", () => {
    const plan = buildRuntimeEvidenceExecutionPlan();

    expect(plan.localCommands).toBe(runtimeEvidenceLocalCommands);
    expect(plan.externalCommands).toBe(runtimeEvidenceExternalCommands);
    expect(plan.localArtifacts).toBe(runtimeEvidenceLocalArtifacts);
    expect(plan.externalArtifacts).toBe(runtimeEvidenceExternalArtifacts);
    expect(plan.localArtifacts).toEqual(["coverage/runtime-evidence-production-blockers.json"]);
    expect(plan.externalArtifacts).toContain("coverage/runtime-evidence-ci-job.json");
    expect(plan.externalArtifacts).toContain("coverage/runtime-evidence-redacted-evidence-bundle.json");
    expect(plan.externalArtifacts).toContain("test-results/runtime-evidence-matrix");
    expect(plan).toMatchObject({
      installExecutionAllowed: false,
      workspaceRuntimeEvidenceExecutionAllowed: false,
      workspaceAllExecutionAllowed: false,
      handoffAllExecutionAllowed: false,
      qualityAllExecutionAllowed: false,
      typecheckExecutionAllowed: false,
      unitTestExecutionAllowed: false,
      webBuildExecutionAllowed: false,
      dashboardBuildExecutionAllowed: false,
      ciRuntimeReadinessExecutionAllowed: false,
      productionBlockerVisibilityExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(runtimeEvidenceExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticRuntimeEvidence: true,
      commandEvidenceRequiredForClosure: true,
      redactedEvidenceLabelsRequiredForClosure: true,
      ciRuntimeReadinessRequiredForClosure: true,
      productionBlockerVisibilityRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(runtimeEvidenceRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain(
      "Redacted command evidence for install, workspace, handoff, quality, typecheck, unit, and build commands.",
    );
    expect(plan.requiredExternalEvidence).toContain("Durable RuntimeEvidenceRun persistence row captured from the target database.");
    expect(plan.requiredExternalEvidence).toContain("Redacted runtime evidence bundle captured without raw command logs, CI URLs, database URLs, tokens, or operator identifiers.");
  });

  it("redacts runtime evidence artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "runtime_evidence_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      evidenceLabel: "passed by engineer@example.com with token github_pat_1234567890ABCDEFGHIJKLMNOP",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      commandOutput: "workspace:all failed with PRIVATE_ENV=value",
      rawLog: "dashboard build stack tenant_private_123",
      artifactPath: "coverage/private-runtime-artifact.json",
      productionBlockerNotes: "operator user_private_123 must rerun quality gate",
      contactPhone: "+1 (555) 867-5309",
      neutralRuntimeLabel: "runtime_evidence_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralRepositoryLabel: "repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralBranchLabel: "branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralPrLabel: "pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralReviewerLabel: "reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCodeownerLabel: "codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCiLabel: "ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactLocation: "coverage/runtime-evidence/private-output.json",
      neutralDatabaseLocation: "postgresql://tenant_demo:secret@db.example.com/inkroute",
    };

    expect(buildRedactedRuntimeEvidenceArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      evidenceLabel: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
      commandOutput: "[REDACTED]",
      rawLog: "[REDACTED]",
      artifactPath: "[REDACTED]",
      productionBlockerNotes: "[REDACTED]",
      contactPhone: "[REDACTED]",
      neutralRuntimeLabel: "[REDACTED]",
      neutralRepositoryLabel: "[REDACTED]",
      neutralBranchLabel: "[REDACTED]",
      neutralPrLabel: "[REDACTED]",
      neutralReviewerLabel: "[REDACTED]",
      neutralCodeownerLabel: "[REDACTED]",
      neutralCiLabel: "[REDACTED]",
      neutralArtifactLocation: "[REDACTED]",
      neutralDatabaseLocation: "[REDACTED]",
    });

    const review = buildRuntimeEvidenceArtifactReview(artifact);
    const bundle = buildRuntimeEvidenceRedactedEvidenceBundle(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(runtimeEvidenceRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "ciRunUrl",
        "evidenceLabel",
        "persistence.tenantId",
        "persistence.databaseUrl",
        "commandOutput",
        "rawLog",
        "artifactPath",
        "productionBlockerNotes",
        "contactPhone",
        "neutralRuntimeLabel",
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
    expect(review.requiredExternalEvidence).toContain("Production blockers remain visible in runtime evidence until resolved.");
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/runtime-evidence-redacted-evidence-bundle.json");
    expect(bundle.review.safeForTracker).toBe(true);
    expect(bundle.requiredArtifacts).toBe(runtimeEvidenceArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(runtimeEvidenceRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
  });
});


