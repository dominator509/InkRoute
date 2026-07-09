import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrismaValidationArtifactReview,
  buildPrismaValidationEvidenceDecision,
  buildPrismaValidationExecutionPlan,
  buildPrismaValidationRunData,
  buildRedactedPrismaValidationArtifact,
  persistPrismaValidationRun,
  prismaValidationArtifactPaths,
  prismaValidationEvidenceFlags,
  prismaValidationExternalArtifacts,
  prismaValidationExternalCommands,
  prismaValidationExecutionPolicy,
  prismaValidationRequiredExternalEvidence,
  prismaValidationRunPersistenceContract,
  prismaValidationRuntimeCommands,
  prismaValidationRuntimeMatrix,
  prismaValidationRuntimeProofFiles,
} from "../lib/prismaValidationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Prisma validation runtime contract", () => {
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaValidationRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034200_add_prisma_validation_runs/migration.sql");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins Prisma validation commands, matrix rows, and artifact paths", () => {
    expect(prismaValidationRuntimeCommands).toEqual([
      "prisma validate --schema packages/db/prisma/schema.prisma",
      "Prisma relation-name compatibility review",
      "Prisma implicit many-to-many compatibility review",
      "Prisma enum/database compatibility review",
      "Prisma generated SQL safety review",
    ]);
    expect(prismaValidationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "prisma-cli-validate",
      "relation-names-many-to-many",
      "enum-generated-sql-safety",
    ]);
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validation-runtime.json");
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validate-output.txt");
    expect(prismaValidationArtifactPaths).toContain("coverage/prisma-validation-secret-safe-artifacts.json");
  });

  it("pins the PrismaValidationRun persistence model and migration", () => {
    const runData = buildPrismaValidationRunData({
      tenantId: "tenant_static",
      runId: "prisma_validation_static",
      commitSha: "abc123",
      schemaPath: "packages/db/prisma/schema.prisma",
      databaseUrlMode: "non-production",
      status: "blocked",
      commands: ["prisma validate --schema packages/db/prisma/schema.prisma"],
      artifacts: ["coverage/prisma-validate-output.txt"],
      relationNameEvidenceCaptured: true,
      manyToManyEvidenceCaptured: true,
      enumCompatibilityEvidenceCaptured: false,
      generatedSqlEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      validateOutputPath: "coverage/prisma-validate-output.txt",
      generatedSqlReviewPath: "coverage/prisma-generated-sql-review-redacted.json",
    });

    expect(prismaValidationRunPersistenceContract).toEqual({
      prismaModel: "PrismaValidationRun",
      tenantRelation: "prismaValidationRuns",
      migration: "20260609034200_add_prisma_validation_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesSchemaPath: true,
      storesDatabaseUrlMode: true,
      storesValidationStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesRelationNameEvidence: true,
      storesManyToManyEvidence: true,
      storesEnumCompatibilityEvidence: true,
      storesGeneratedSqlEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "prisma_validation_static",
      commitSha: "abc123",
      schemaPath: "packages/db/prisma/schema.prisma",
      databaseUrlMode: "non-production",
      status: "blocked",
      commandMatrix: ["prisma validate --schema packages/db/prisma/schema.prisma"],
      artifactManifest: ["coverage/prisma-validate-output.txt"],
      relationNameEvidenceCaptured: true,
      manyToManyEvidenceCaptured: true,
      enumCompatibilityEvidenceCaptured: false,
      generatedSqlEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      validateOutputPath: "coverage/prisma-validate-output.txt",
      generatedSqlReviewPath: "coverage/prisma-generated-sql-review-redacted.json",
    });
    expect(String(persistPrismaValidationRun)).toContain("repository.prismaValidationRun.upsert");
    expect(prismaSchema).toContain("model PrismaValidationRun");
    expect(prismaSchema).toContain("prismaValidationRuns PrismaValidationRun[]");
    expect(prismaSchema).toContain("relationNameEvidenceCaptured");
    expect(prismaSchema).toContain("generatedSqlEvidenceCaptured");
    expect(prismaValidationRunMigration).toContain('CREATE TABLE "PrismaValidationRun"');
    expect(prismaValidationRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(prismaValidationRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(prismaValidationRunMigration).toContain('"PrismaValidationRun_tenantId_runId_key"');
  });

  it("blocks Prisma validation completion when reviews, database URL mode, or safe artifacts are missing", () => {
    const decision = buildPrismaValidationEvidenceDecision({
      commands: ["prisma validate --schema packages/db/prisma/schema.prisma"],
      artifacts: ["coverage/prisma-validate-output.txt"],
      evidence: {
        prismaCliValidationPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Prisma generated SQL safety review");
    expect(decision.missingArtifacts).toContain("coverage/prisma-validation-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("relationNameReviewPassed");
    expect(decision.missingEvidence).toContain("databaseUrlModeCaptured");
    expect(decision.blockers).toContain("Prisma relation-name compatibility review must pass.");
    expect(decision.blockers).toContain("Database URL mode must be captured without exposing credentials.");
  });

  it("completes Prisma validation only when every command, artifact, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(prismaValidationEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildPrismaValidationEvidenceDecision({
      commands: prismaValidationRuntimeCommands,
      artifacts: prismaValidationArtifactPaths,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(prismaValidationEvidenceFlags);
  });

  it("keeps Prisma validation execution classified, redacted, and persistence-gated", () => {
    const executionPlan = buildPrismaValidationExecutionPlan();
    expect(executionPlan.localCommands).toBe(prismaValidationRuntimeCommands);
    expect(executionPlan.externalCommands).toBe(prismaValidationExternalCommands);
    expect(executionPlan.externalCommands).toEqual(["provider-backed persistPrismaValidationRun execution proof"]);
    expect(executionPlan.localArtifacts).toBe(prismaValidationArtifactPaths);
    expect(executionPlan.externalArtifacts).toBe(prismaValidationExternalArtifacts);
    expect(executionPlan.externalArtifacts).toEqual(["provider-backed PrismaValidationRun persistence proof"]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseUrlExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(prismaValidationExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticPrismaValidationReadiness: true,
      freshValidationRequiredAfterSchemaChanges: true,
      databaseUrlModeRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(prismaValidationRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed PrismaValidationRun persistence row captured through persistPrismaValidationRun.",
    );

    const artifact = {
      databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
      generatedSql: "INSERT INTO \"Tenant\" (\"id\") VALUES ('tenant_1234567890abcdefghijklmnopqrstuvwxyz')",
      tenantId: "tenant_1234567890abcdefghijklmnopqrstuvwxyz",
      repositorySelector: "repo:dominator509/InkRoute",
      branchSelector: "branch:production/prisma-validation",
      pullRequestSelector: "pr_prisma_validation",
      reviewerHandle: "reviewer_prisma_owner",
      codeownerSelector: "CODEOWNER:data-platform-team",
      nested: {
        schemaUrl: "https://db.example.com/schema.prisma",
        publicSummary: "Prisma validation evidence captured",
      },
    };
    const redactedOnly = buildRedactedPrismaValidationArtifact(artifact);
    const review = buildPrismaValidationArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("tenant_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("https://db.example.com/schema.prisma");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/prisma-validation");
    expect(serialized).not.toContain("pr_prisma_validation");
    expect(serialized).not.toContain("reviewer_prisma_owner");
    expect(serialized).not.toContain("CODEOWNER:data-platform-team");
    expect(review.redactions).toEqual([
      "databaseUrl",
      "generatedSql",
      "tenantId",
      "repositorySelector",
      "branchSelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.schemaUrl",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(prismaValidationRequiredExternalEvidence);
  });

  it("wires manifest and tracker evidence for GAP-019", () => {
    expect(unitManifest).toContain("unit-web-prisma-validation-runtime-static");
    expect(unitManifest).toContain("PrismaValidationRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/prismaValidationRuntime.ts");
    expect(gapTracker).toContain("persistPrismaValidationRun upsert seam");
    expect(gapTracker).toContain("provider-backed persistPrismaValidationRun execution");
    expect(gapTracker).toContain("GAP-019 is prisma-validation-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildPrismaValidationExecutionPlan");
    expect(gapTracker).toContain("prismaValidationRuntimeCommands/prismaValidationExternalCommands");
    expect(gapTracker).toContain("prismaValidationExecutionPolicy");
    expect(gapTracker).toContain("prismaValidationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPrismaValidationArtifact");
    expect(gapTracker).toContain("buildPrismaValidationArtifactReview");
    expect(gapTracker).toContain("GAP-019 Prisma validation artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("pins current Prisma validation proof files for GAP-019", () => {
    expect(prismaValidationRuntimeProofFiles).toContain("apps/web/lib/prismaValidationRuntime.ts");
    expect(prismaValidationRuntimeProofFiles).toContain("apps/web/tests/prisma-validation-runtime-static.test.ts");
    for (const proofFile of prismaValidationRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

