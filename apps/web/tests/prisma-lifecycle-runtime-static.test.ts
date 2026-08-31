import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrismaLifecycleDecisionRequiredEvidence,
  buildPrismaLifecycleExecutionPlan,
  buildPrismaLifecycleRedactedEvidenceBundle,
  buildPrismaLifecycleRunData,
  prismaLifecycleArtifactPaths,
  prismaLifecycleCommands,
  prismaLifecycleExecutionPolicy,
  prismaLifecyclePackageScripts,
  prismaLifecycleProofFiles,
  prismaLifecycleReadiness,
  prismaLifecycleReadinessRequiredEvidence,
  prismaLifecycleRequiredEvidence,
  prismaLifecycleRequiredExternalEvidence,
  prismaLifecycleRunPersistenceContract,
  prismaLifecycleRuntimeMatrix,
  buildPrismaLifecycleEvidenceDecision,
  persistPrismaLifecycleRun,
} from "../lib/prismaLifecycleRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Prisma lifecycle runtime contract", () => {
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const seed = readRepoFile("packages/db/prisma/seed.ts");
  const integrationReadiness = readRepoFile("packages/db/src/integration-readiness.ts");
  const dbTests = readRepoFile("packages/db/tests/db-integration-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaLifecycleMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032600_add_prisma_lifecycle_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins Prisma lifecycle scripts, commands, matrix rows, and artifacts", () => {
    expect(prismaLifecycleCommands).toEqual([
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm db:verify-seed",
      "pnpm --filter @inkroute/db db:seed",
      "Prisma migration SQL review",
      "Prisma migration drift check",
      "prove destructive migrate/reset commands are guarded from production URLs",
      "GitHub Actions DB lifecycle evidence job",
    ]);
    expect(prismaLifecyclePackageScripts).toEqual([
      "db:validate",
      "db:generate",
      "db:migrate",
      "db:seed",
      "db:verify-seed",
    ]);
    expect(prismaLifecycleRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "schema-validate",
      "client-generate",
      "migration-generate-apply",
      "seed-readiness",
      "seed-execution",
      "migration-sql-review",
      "migration-drift-check",
      "production-url-guard",
      "ci-db-lifecycle",
      "redacted-evidence-bundle",
    ]);
    expect(prismaLifecycleArtifactPaths).toContain("coverage/prisma-lifecycle-runtime.json");
    expect(prismaLifecycleArtifactPaths).toContain("coverage/prisma-lifecycle-redacted-evidence-bundle.json");
    expect(prismaLifecycleArtifactPaths).toContain("test-results/prisma-lifecycle-runtime");
  });

  it("pins the PrismaLifecycleRun persistence model and migration", () => {
    const runData = buildPrismaLifecycleRunData({
      tenantId: "tenant_static",
      runId: "prisma_static",
      commitSha: "abc123",
      status: "blocked",
      postgresProvisioned: false,
      databaseUrlConfigured: false,
      directUrlConfigured: false,
      prismaValidatePassed: false,
      prismaGeneratePassed: false,
      migrationGenerated: false,
      migrationSqlReviewed: false,
      migrationAppliedToDevDb: false,
      seedReadinessVerified: false,
      seedScriptPassed: false,
      destructiveProductionUrlGuarded: true,
      migrationDriftChecked: false,
      commandEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      prismaLifecycleRunPersisted: false,
      presentPackageScripts: prismaLifecyclePackageScripts,
      capturedArtifacts: ["coverage/prisma-lifecycle-runtime.json", "coverage/prisma-production-url-guard.json"],
      completedCommands: [],
      productionUrlGuardArtifactPath: "coverage/prisma-production-url-guard.json",
    });

    expect(prismaLifecycleRunPersistenceContract.model).toBe("PrismaLifecycleRun");
    expect(prismaLifecycleRunPersistenceContract.tenantRelation).toBe("prismaLifecycleRuns");
    expect(prismaLifecycleRunPersistenceContract.migration).toBe("20260609032600_add_prisma_lifecycle_runs");
    expect(prismaLifecycleRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "packageScriptManifest",
      "artifactManifest",
      "sqlReviewManifest",
      "driftCheckManifest",
    ]);
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("postgresProvisioned");
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("migrationSqlReviewed");
    expect(prismaLifecycleRunPersistenceContract.evidenceBooleans).toContain("destructiveProductionUrlGuarded");
    expect(prismaLifecycleRunPersistenceContract.artifactFields).toContain("driftCheckArtifactPath");
    expect(prismaLifecycleRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(schema).toContain("prismaLifecycleRuns PrismaLifecycleRun[]");
    expect(schema).toContain("model PrismaLifecycleRun");
    expect(schema).toContain("sqlReviewManifest");
    expect(schema).toContain("migrationDriftChecked");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(prismaLifecycleMigration).toContain('CREATE TABLE "PrismaLifecycleRun"');
    expect(prismaLifecycleMigration).toContain('"sqlReviewManifest" JSONB NOT NULL');
    expect(prismaLifecycleMigration).toContain('"migrationDriftChecked" BOOLEAN NOT NULL DEFAULT false');
    expect(prismaLifecycleMigration).toContain('CREATE UNIQUE INDEX "PrismaLifecycleRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "prisma_static",
      commitSha: "abc123",
      status: "blocked",
      destructiveProductionUrlGuarded: true,
      postgresProvisioned: false,
      prismaValidatePassed: false,
      productionUrlGuardArtifactPath: "coverage/prisma-production-url-guard.json",
    });
    expect(runData.commandMatrix).toBe(prismaLifecycleRuntimeMatrix);
    expect(runData.packageScriptManifest).toBe(prismaLifecyclePackageScripts);
    expect(String(persistPrismaLifecycleRun)).toContain("repository.prismaLifecycleRun.upsert");
  });

  it("keeps Prisma schema, seed, package scripts, helper, and tests wired", () => {
    for (const scriptName of prismaLifecyclePackageScripts) {
      expect(dbPackageJson).toContain(`"${scriptName}"`);
    }
    expect(schema).toContain("model Tenant");
    expect(schema).toContain("enum");
    expect(seed).toContain("seed");
    expect(integrationReadiness).toContain("buildPrismaSchemaLifecycleReadinessPlan");
    expect(dbTests).toContain("buildPrismaSchemaLifecycleReadinessPlan");
  });

  it("keeps schema coverage wired while DB lifecycle evidence remains gated", () => {
    expect(prismaLifecycleReadiness.status).toBe("blocked");
    expect(prismaLifecycleReadiness.missingScripts).toEqual([]);
    expect(prismaLifecycleReadiness.schemaCoverageStatus).toBe("pass");
    expect(prismaLifecycleReadiness.requiredCommands).toBe(prismaLifecycleCommands);
    expect(prismaLifecycleReadiness.requiredEvidence).toBe(prismaLifecycleReadinessRequiredEvidence);
    expect(prismaLifecycleReadiness.blockers).toContain("A non-production Postgres database must be provisioned.");
    expect(prismaLifecycleReadiness.blockers).toContain("Prisma schema validation must pass.");
  });

  it("blocks Prisma lifecycle closure until DB config, commands, SQL review, drift, CI, persistence, artifacts, and scripts are proven", () => {
    const executionPlan = buildPrismaLifecycleExecutionPlan();

    expect(executionPlan.localCommands).toBe(prismaLifecycleCommands);
    expect(executionPlan.packageScripts).toBe(prismaLifecyclePackageScripts);
    expect(executionPlan.artifactPaths).toBe(prismaLifecycleArtifactPaths);
    expect(executionPlan.proofFiles).toBe(prismaLifecycleProofFiles);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(prismaLifecycleExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticPrismaReadiness: true,
      nonProductionPostgresRequiredForClosure: true,
      prismaLifecycleCommandsRequiredForClosure: true,
      migrationSqlReviewRequiredForClosure: true,
      migrationDriftCheckRequiredForClosure: true,
      productionUrlGuardProofRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      providerPersistenceRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(prismaLifecycleRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Redacted Prisma lifecycle evidence bundle captured without raw database URLs, SQL containing secrets, command logs, tokens, URLs, or actor identifiers.",
    );
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed persistPrismaLifecycleRun execution evidence.",
    );

    const decision = buildPrismaLifecycleEvidenceDecision({
      postgresProvisioned: false,
      databaseUrlConfigured: false,
      directUrlConfigured: false,
      prismaValidatePassed: false,
      prismaGeneratePassed: false,
      migrationGenerated: false,
      migrationSqlReviewed: false,
      migrationAppliedToDevDb: false,
      seedReadinessVerified: false,
      seedScriptPassed: false,
      destructiveProductionUrlGuarded: true,
      migrationDriftChecked: false,
      commandEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      prismaLifecycleRunPersisted: false,
      presentPackageScripts: ["db:validate", "db:generate"],
      capturedArtifacts: [
        "coverage/prisma-lifecycle-runtime.json",
        "coverage/prisma-production-url-guard.json",
      ],
      completedCommands: ["pnpm --filter @inkroute/db db:validate"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingPackageScripts).toEqual(["db:migrate", "db:seed", "db:verify-seed"]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/prisma-validate-output.txt",
      "coverage/prisma-generate-output.txt",
      "coverage/prisma-migrate-output.txt",
      "coverage/prisma-seed-readiness-output.txt",
      "coverage/prisma-seed-output.txt",
      "coverage/prisma-migration-sql-review.json",
      "coverage/prisma-drift-check-output.txt",
      "coverage/prisma-db-lifecycle-ci-job.json",
      "coverage/prisma-lifecycle-redacted-evidence-bundle.json",
      "test-results/prisma-lifecycle-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm db:verify-seed",
      "pnpm --filter @inkroute/db db:seed",
      "Prisma migration SQL review",
      "Prisma migration drift check",
      "prove destructive migrate/reset commands are guarded from production URLs",
      "GitHub Actions DB lifecycle evidence job",
    ]);
    expect(decision.requiredPackageScripts).toBe(prismaLifecyclePackageScripts);
    expect(decision.requiredArtifacts).toBe(prismaLifecycleArtifactPaths);
    expect(decision.requiredCommands).toBe(prismaLifecycleCommands);
    expect(decision.requiredEvidence).toEqual(
      buildPrismaLifecycleDecisionRequiredEvidence(prismaLifecycleReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(prismaLifecycleRequiredEvidence);
    expect(decision.blockers).toContain("A non-production Postgres database must be provisioned.");
    expect(decision.blockers).toContain("PrismaLifecycleRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required Prisma lifecycle package script must be present.");
  });

  it("completes Prisma lifecycle closure when DB config, commands, SQL review, drift, CI, persistence, artifacts, and scripts are proven", () => {
    const decision = buildPrismaLifecycleEvidenceDecision({
      postgresProvisioned: true,
      databaseUrlConfigured: true,
      directUrlConfigured: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      migrationGenerated: true,
      migrationSqlReviewed: true,
      migrationAppliedToDevDb: true,
      seedReadinessVerified: true,
      seedScriptPassed: true,
      destructiveProductionUrlGuarded: true,
      migrationDriftChecked: true,
      commandEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      prismaLifecycleRunPersisted: true,
      presentPackageScripts: prismaLifecyclePackageScripts,
      capturedArtifacts: prismaLifecycleArtifactPaths,
      completedCommands: prismaLifecycleCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingPackageScripts).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without touching real database state", () => {
    expect(ciWorkflow).toContain("Run Phase 2 Prisma lifecycle runtime contracts");
    expect(ciWorkflow).toContain("prisma-lifecycle-runtime-static.test.ts");
    expect(ciWorkflow).toContain("prisma-lifecycle-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-prisma-lifecycle-runtime-static");
    expect(unitManifest).toContain("PrismaLifecycleRun Prisma model and app row contract");
    expect(gapTracker).toContain("PrismaLifecycleRun");
    expect(gapTracker).toContain("apps/web/lib/prismaLifecycleRuntime.ts");
    expect(gapTracker).toContain("persistPrismaLifecycleRun upsert seam");
    expect(gapTracker).toContain("buildPrismaLifecycleExecutionPlan");
    expect(gapTracker).toContain("buildPrismaLifecycleDecisionRequiredEvidence");
    expect(gapTracker).toContain("prismaLifecycleRequiredEvidence");
    expect(gapTracker).toContain("prismaLifecycleExecutionPolicy");
    expect(gapTracker).toContain("prismaLifecycleRequiredExternalEvidence");
    expect(gapTracker).toContain("buildPrismaLifecycleRedactedEvidenceBundle");
    expect(gapTracker).toContain(
      "live non-production Postgres provisioning, Prisma validate/generate/migrate, SQL review, seed, drift, production URL guard proof, command evidence, CI evidence, provider-backed persistPrismaLifecycleRun execution, and artifact proof remain gated",
    );
    expect(gapTracker).toContain("GAP-002 | Gap | Prisma lifecycle proof matrix needs durable DB lifecycle evidence");
  });

  it("pins current Prisma lifecycle runtime proof files for GAP-002", () => {
    expect(prismaLifecycleProofFiles).toEqual(
      expect.arrayContaining([
        "apps/web/lib/prismaLifecycleRuntime.ts",
        "apps/web/tests/prisma-lifecycle-runtime-static.test.ts",
        "packages/db/package.json",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260609032600_add_prisma_lifecycle_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of prismaLifecycleProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("builds a redacted Prisma lifecycle evidence bundle for handoff use", () => {
    const artifact = {
      databaseUrl: "postgres://user:pass@example.invalid/db",
      directUrl: "postgres://direct:pass@example.invalid/db",
      migrationSql: "-- token github_pat_1234567890ABCDEFGHIJKLMNOP",
      commandOutput: "migrated by owner@example.com",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      schemaValidateArtifactPath: "test-results/prisma-lifecycle-runtime/schema-validate.log",
      migrationDriftPayload: {
        driftOutput: "changed table tenant_runtime_prisma_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      destructiveResetGuardReport: {
        productionDatabaseUrl: "postgres://prod:secret@example.neon.tech/inkroute",
        rollbackTranscript: "reset blocked for production-provider-01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      seedExecutionManifest: {
        rowId: "row_01HZYXZYXZYXZYXZYXZYXZYXZ",
        queryOutput: "seeded tenant and workflow rows",
      },
      safeSummary: "Prisma lifecycle proof captured",
      neutralMigrationTrace: "migration_sql_01HZYXZYXZYXZYXZYXZYXZYXZ updated table_row_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCiTrace: "workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ checked commit_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactLocation: "test-results/prisma-lifecycle-runtime/private-schema.log",
      neutralGuardTrace: "production_guard_01HZYXZYXZYXZYXZYXZYXZYXZ blocked reset_plan_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const bundle = buildPrismaLifecycleRedactedEvidenceBundle(artifact);

    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/prisma-lifecycle-redacted-evidence-bundle.json");
    expect(bundle.requiredArtifacts).toBe(prismaLifecycleArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(prismaLifecycleRequiredExternalEvidence);
    expect(bundle.databaseExecutionAllowed).toBe(false);
    expect(bundle.providerExecutionAllowed).toBe(false);
    expect(bundle.redactions).toEqual(
      expect.arrayContaining([
        "database",
        "direct",
        "url",
        "sql",
        "token",
        "email",
        "output",
        "environment",
        "artifact",
        "drift",
        "destructive",
        "rollback",
        "seed",
        "query",
      ]),
    );
    expect(bundle.redactedArtifact).toMatchObject({
      databaseUrl: "[REDACTED]",
      directUrl: "[REDACTED]",
      migrationSql: "[REDACTED]",
      commandOutput: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      schemaValidateArtifactPath: "[REDACTED]",
      migrationDriftPayload: "[REDACTED]",
      destructiveResetGuardReport: "[REDACTED]",
      seedExecutionManifest: "[REDACTED]",
      safeSummary: "Prisma lifecycle proof captured",
      neutralMigrationTrace: "[REDACTED]",
      neutralCiTrace: "[REDACTED]",
      neutralArtifactLocation: "[REDACTED]",
      neutralGuardTrace: "[REDACTED] blocked [REDACTED]",
    });
  });
});



