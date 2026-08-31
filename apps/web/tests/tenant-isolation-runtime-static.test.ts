import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedTenantIsolationArtifact,
  buildTenantIsolationArtifactReview,
  buildTenantIsolationEvidenceDecision,
  buildTenantIsolationExecutionPlan,
  buildTenantIsolationRunData,
  persistTenantIsolationRun,
  tenantIsolationArtifactPaths,
  tenantIsolationEvidenceFlags,
  tenantIsolationExternalArtifacts,
  tenantIsolationExternalCommands,
  tenantIsolationExecutionPolicy,
  tenantIsolationLocalArtifacts,
  tenantIsolationLocalCommands,
  tenantIsolationModelCoverage,
  tenantIsolationRequiredExternalEvidence,
  tenantIsolationRuntimeCommands,
  tenantIsolationRuntimeControls,
  tenantIsolationRuntimeMatrix,
  tenantIsolationRuntimeProofFiles,
  tenantIsolationRuntimeReadiness,
  tenantIsolationRunPersistenceContract,
} from "../lib/tenantIsolationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("tenant isolation runtime contract", () => {
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const tenantScopeSource = readRepoFile("packages/db/src/tenant-scope.ts");
  const tenantScopeTests = readRepoFile("packages/db/tests/tenant-scope.test.ts");
  const tenantIsolationContract = readRepoFile("packages/db/prisma/tenant-isolation-contract.json");
  const tenantIsolationDocs = readRepoFile("docs/db/TENANT_ISOLATION.md");
  const dbManifest = readRepoFile("testing/manifests/db-integration-test-manifest.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const tenantIsolationRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034400_add_tenant_isolation_runs/migration.sql");

  it("pins tenant isolation commands, model coverage, matrix rows, and artifacts", () => {
    expect(tenantIsolationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/db typecheck",
      "pnpm --filter @inkroute/db test",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "tenant isolation repository integration suite",
      "cross-tenant read/write denial matrix",
      "tenant-scoped fixture cleanup proof",
      "GitHub Actions tenant isolation evidence job",
    ]);
    expect(tenantIsolationModelCoverage).toEqual(
      expect.arrayContaining(["TenantMember", "BookingRequest", "Payment", "FileAsset", "MessageThread", "Notification", "ReleaseRecord", "AuditLog"]),
    );
    expect(tenantIsolationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "db-package-gates",
      "prisma-generate-migrate-seed",
      "seeded-multi-tenant-fixtures",
      "repository-helper-adoption",
      "tenant-owned-model-coverage",
      "cross-tenant-denial-matrix",
      "missing-tenant-write-rejection",
      "audit-rows-and-fixture-cleanup",
      "ci-secret-safe-artifacts",
    ]);
    expect(tenantIsolationArtifactPaths).toContain("coverage/tenant-isolation-runtime.json");
    expect(tenantIsolationArtifactPaths).toContain("coverage/tenant-isolation-secret-safe-artifacts.json");
    expect(tenantIsolationArtifactPaths).toContain("test-results/tenant-isolation-runtime");
  });

  it("pins tenant isolation runtime control helper identity", () => {
    const decision = buildTenantIsolationEvidenceDecision({
      commands: tenantIsolationRuntimeCommands,
      artifacts: tenantIsolationArtifactPaths,
      controls: tenantIsolationRuntimeControls,
      evidence: Object.fromEntries(tenantIsolationEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof tenantIsolationEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(tenantIsolationRuntimeControls);
    expect(gapTracker).toContain("tenantIsolationRuntimeControls");
  });

  it("keeps tenant scope helpers, contract, docs, package scripts, and DB manifest wired", () => {
    for (const scriptName of ["typecheck", "test", "db:validate", "db:generate", "db:migrate", "db:seed"]) {
      expect(dbPackageJson).toContain(`"${scriptName}"`);
    }
    for (const helper of ["withTenantWhere", "withTenantData", "assertTenantScopedWhere", "assertTenantScopedData", "tenantOwnedModelNames", "buildTenantIsolationRepositoryEvidencePlan"]) {
      expect(tenantScopeSource).toContain(helper);
      expect(tenantScopeTests).toContain(helper);
    }
    expect(tenantIsolationContract).toContain("tenantOwnedModels");
    expect(tenantIsolationContract).toContain("cross-tenant reads return no rows");
    expect(tenantIsolationDocs).toContain("Tenant Isolation Contract");
    expect(dbManifest).toContain("tenant");
  });

  it("keeps repository evidence blocked until database, repository, denial, audit, cleanup, CI, and safe artifacts exist", () => {
    expect(tenantIsolationRuntimeReadiness.status).toBe("blocked");
    expect(tenantIsolationRuntimeReadiness.missingScripts).toEqual([]);
    expect(tenantIsolationRuntimeReadiness.requiredCommands).toBe(tenantIsolationRuntimeCommands);
    expect(tenantIsolationRuntimeReadiness.requiredControls).toBe(tenantIsolationRuntimeControls);
    expect(tenantIsolationRuntimeReadiness.requiredEvidence).toBe(tenantIsolationEvidenceFlags);
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Tenant-scoped repository/service adoption evidence must be captured before tenant isolation readiness.",
    );
    expect(tenantIsolationRuntimeReadiness.blockers).not.toContain(
      "Tenant-scoped repository/service layer must be implemented.",
    );
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Cross-tenant write denial tests must pass for tenant-owned mutations.",
    );
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Tenant isolation artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("pins the TenantIsolationRun persistence model and migration", () => {
    const runData = buildTenantIsolationRunData({
      tenantId: "tenant_static",
      runId: "tenant_isolation_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["tenant isolation repository integration suite"],
      artifacts: ["coverage/tenant-isolation-repository-helper-adoption.json"],
      databaseLifecycleEvidenceCaptured: true,
      repositoryAdoptionEvidenceCaptured: false,
      tenantOwnedModelCoverageCaptured: false,
      crossTenantDenialEvidenceCaptured: false,
      missingTenantRejectionEvidenceCaptured: false,
      auditRowEvidenceCaptured: false,
      fixtureCleanupEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      modelCoverageReportPath: "coverage/tenant-isolation-model-coverage.json",
      denialMatrixReportPath: "coverage/tenant-isolation-cross-tenant-read-denial.json",
    });

    expect(tenantIsolationRunPersistenceContract).toEqual({
      prismaModel: "TenantIsolationRun",
      tenantRelation: "tenantIsolationRuns",
      migration: "20260609034400_add_tenant_isolation_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDatabaseLifecycleEvidence: true,
      storesRepositoryAdoptionEvidence: true,
      storesTenantOwnedModelCoverage: true,
      storesCrossTenantDenialEvidence: true,
      storesMissingTenantRejectionEvidence: true,
      storesAuditRowEvidence: true,
      storesFixtureCleanupEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "tenant_isolation_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["tenant isolation repository integration suite"],
      artifactManifest: ["coverage/tenant-isolation-repository-helper-adoption.json"],
      databaseLifecycleEvidenceCaptured: true,
      repositoryAdoptionEvidenceCaptured: false,
      crossTenantDenialEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      modelCoverageReportPath: "coverage/tenant-isolation-model-coverage.json",
      denialMatrixReportPath: "coverage/tenant-isolation-cross-tenant-read-denial.json",
    });
    expect(String(persistTenantIsolationRun)).toContain("repository.tenantIsolationRun.upsert");
    expect(prismaSchema).toContain("model TenantIsolationRun");
    expect(prismaSchema).toContain("tenantIsolationRuns TenantIsolationRun[]");
    expect(prismaSchema).toContain("repositoryAdoptionEvidenceCaptured");
    expect(prismaSchema).toContain("crossTenantDenialEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(tenantIsolationRunMigration).toContain('CREATE TABLE "TenantIsolationRun"');
    expect(tenantIsolationRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(tenantIsolationRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(tenantIsolationRunMigration).toContain('"TenantIsolationRun_tenantId_runId_key"');
  });

  it("blocks tenant isolation completion when repository, denial, audit, cleanup, or safe evidence is missing", () => {
    const decision = buildTenantIsolationEvidenceDecision({
      commands: ["pnpm --filter @inkroute/db typecheck"],
      artifacts: ["coverage/tenant-isolation-db-typecheck.txt"],
      controls: ["use-tenant-scope-helpers-for-every-tenant-owned-read-write-path"],
      evidence: {
        dbTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("cross-tenant read/write denial matrix");
    expect(decision.missingArtifacts).toContain("coverage/tenant-isolation-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("reject-missing-or-mismatched-tenant-id-before-database-mutations");
    expect(decision.missingEvidence).toContain("repositoryLayerImplemented");
    expect(decision.missingEvidence).toContain("crossTenantWriteDenialPassed");
    expect(decision.blockers).toContain("Tenant-scoped repository/service adoption evidence must be captured before tenant isolation readiness.");
    expect(decision.blockers).not.toContain("Tenant-scoped repository/service layer must be implemented.");
    expect(decision.blockers).toContain("Cross-tenant write denial tests must pass for tenant-owned mutations.");
  });

  it("completes tenant isolation only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(tenantIsolationEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildTenantIsolationEvidenceDecision({
      commands: tenantIsolationRuntimeCommands,
      artifacts: tenantIsolationArtifactPaths,
      controls: tenantIsolationRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(tenantIsolationEvidenceFlags);
  });

  it("keeps tenant isolation execution classified, redacted, and database-gated", () => {
    const executionPlan = buildTenantIsolationExecutionPlan();
    expect(executionPlan.localCommands).toBe(tenantIsolationLocalCommands);
    expect(executionPlan.externalCommands).toBe(tenantIsolationExternalCommands);
    expect(executionPlan.localArtifacts).toBe(tenantIsolationLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(tenantIsolationExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/tenant-isolation-db-test.txt");
    expect(executionPlan.externalArtifacts).toContain("coverage/tenant-isolation-database-evidence-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("provider-backed TenantIsolationRun persistence proof");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(tenantIsolationExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticTenantIsolationReadiness: true,
      seededDatabaseRequiredForClosure: true,
      tenantOwnedModelCoverageRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(tenantIsolationRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed TenantIsolationRun persistence row captured through persistTenantIsolationRun.",
    );

    const artifact = {
      tenantId: "tenant_a_1234567890abcdefghijklmnopqrstuvwxyz",
      crossTenantId: "tenant_b_1234567890abcdefghijklmnopqrstuvwxyz",
      actorEmail: "admin@example.com",
      databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
      repositorySelector: "repo:dominator509/InkRoute",
      branchSelector: "branch:production/tenant-isolation",
      pullRequestSelector: "pr_tenant_isolation",
      reviewerHandle: "reviewer_tenant_owner",
      codeownerSelector: "CODEOWNER:tenant-security-team",
      nested: {
        auditLogId: "audit_1234567890abcdefghijklmnopqrstuvwxyz",
        publicSummary: "tenant isolation evidence captured",
      },
    };
    const redactedOnly = buildRedactedTenantIsolationArtifact(artifact);
    const review = buildTenantIsolationArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("tenant_a_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("tenant_b_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("admin@example.com");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("audit_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/tenant-isolation");
    expect(serialized).not.toContain("pr_tenant_isolation");
    expect(serialized).not.toContain("reviewer_tenant_owner");
    expect(serialized).not.toContain("CODEOWNER:tenant-security-team");
    expect(review.redactions).toEqual([
      "tenantId",
      "crossTenantId",
      "actorEmail",
      "databaseUrl",
      "repositorySelector",
      "branchSelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.auditLogId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(tenantIsolationRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live tenant isolation proof", () => {
    expect(ciWorkflow).toContain("Run Phase 2 tenant isolation runtime contracts");
    expect(ciWorkflow).toContain("tenant-isolation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("tenant-isolation-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/tenant-isolation-runtime.json");
    expect(unitManifest).toContain("unit-web-tenant-isolation-runtime-static");
    expect(unitManifest).toContain("TenantIsolationRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/tenantIsolationRuntime.ts");
    expect(gapTracker).toContain("persistTenantIsolationRun upsert seam");
    expect(gapTracker).toContain("GAP-022 is tenant-isolation-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live Prisma generate/migrate/seed, seeded multi-tenant fixtures, provider-backed persistTenantIsolationRun execution, repository helper adoption, tenant-owned model coverage, cross-tenant denial tests, missing-tenant write rejection, audit-row integration, fixture cleanup, database evidence, CI evidence, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildTenantIsolationExecutionPlan");
    expect(gapTracker).toContain("tenantIsolationLocalArtifacts");
    expect(gapTracker).toContain("tenantIsolationExternalArtifacts");
    expect(gapTracker).toContain("tenantIsolationExecutionPolicy");
    expect(gapTracker).toContain("tenantIsolationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedTenantIsolationArtifact");
    expect(gapTracker).toContain("buildTenantIsolationArtifactReview");
    expect(gapTracker).toContain("GAP-022 tenant isolation artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("pins current tenant isolation proof files for GAP-022", () => {
    expect(tenantIsolationRuntimeProofFiles).toContain("packages/db/package.json");
    expect(tenantIsolationRuntimeProofFiles).toContain("apps/web/lib/tenantIsolationRuntime.ts");
    expect(tenantIsolationRuntimeProofFiles).toContain("apps/web/tests/tenant-isolation-runtime-static.test.ts");
    for (const proofFile of tenantIsolationRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


