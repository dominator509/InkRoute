import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDatabaseOperationsRuntimeArtifactReview,
  buildDatabaseOperationsRuntimeEvidenceDecision,
  buildDatabaseOperationsRuntimeExecutionPlan,
  buildDatabaseOperationsRuntimeRedactedEvidenceBundle,
  buildRedactedDatabaseOperationsArtifact,
  databaseOperationsRuntimeArtifactPaths,
  databaseOperationsRuntimeCommands,
  databaseOperationsRuntimeExternalArtifacts,
  databaseOperationsRuntimeExternalCommands,
  databaseOperationsRuntimeExecutionPolicy,
  databaseOperationsRuntimeLocalArtifacts,
  databaseOperationsRuntimeLocalCommands,
  databaseOperationsRuntimeMatrix,
  databaseOperationsRuntimeProofFiles,
  databaseOperationsRuntimeReadiness,
  databaseOperationsRuntimeRequiredExternalEvidence,
  databaseOperationsRunPersistenceContract
} from "../lib/databaseOperationsRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const dbEvidence = read("deployment/manifests/database-operations-evidence.json");
const dbVerifier = read("deployment/scripts/verify-database-operations.mjs");
const dbPackage = read("packages/db/package.json");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read("packages/db/prisma/migrations/20260609020000_add_database_operations_runs/migration.sql");

describe("GAP-117 database operations runtime wiring", () => {
  it("pins database operations commands, matrix entries, and redacted artifact paths", () => {
    expect(databaseOperationsRuntimeCommands).toEqual([
      "pnpm deploy:verify-database-ops",
      "pnpm db:generate",
      "pnpm --filter @inkroute/db db:validate",
      "database migration dry-run",
      "database generated SQL review",
      "database staging migration apply",
      "pnpm db:seed",
      "database seed policy verification",
      "database destructive SQL scan",
      "database backup/restore drill",
      "database tenant-isolation smoke",
      "database branch promotion approval",
      "database production data-safety review",
      "capture CI database-operations artifacts"
    ]);
    expect(databaseOperationsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "operations-verifier",
      "provider-branch-secret-store",
      "prisma-generate-validate",
      "migration-dry-run",
      "generated-sql-review",
      "destructive-sql-scan",
      "staging-migration-apply",
      "seed-policy",
      "backup-restore-drill",
      "tenant-isolation-smoke",
      "branch-promotion",
      "production-data-safety-review",
      "ci-database-operations-artifacts",
      "redacted-evidence-bundle"
    ]);
    expect(databaseOperationsRuntimeMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "migration-dry-run", artifact: "coverage/database-migration-dry-run-redacted.json" }),
        expect.objectContaining({ id: "generated-sql-review", artifact: "coverage/database-migration-dry-run-redacted.json" }),
        expect.objectContaining({ id: "backup-restore-drill", artifact: "coverage/database-backup-restore-drill-redacted.json" }),
        expect.objectContaining({ id: "production-data-safety-review", artifact: "coverage/database-production-data-safety-review.md" }),
        expect.objectContaining({ id: "ci-database-operations-artifacts", command: "capture CI database-operations artifacts" }),
        expect.objectContaining({ id: "redacted-evidence-bundle", artifact: "coverage/database-operations-redacted-evidence-bundle.json" })
      ])
    );
    expect(databaseOperationsRuntimeArtifactPaths).toContain("coverage/database-destructive-sql-scan.json");
    expect(databaseOperationsRuntimeArtifactPaths).toContain("coverage/database-operations-redacted-evidence-bundle.json");
    expect(databaseOperationsRuntimeArtifactPaths).toContain("test-results/database-operations-runtime");
  });

  it("keeps DB operations manifest, verifier, package scripts, and blocked SQL gates wired", () => {
    for (const command of ["pnpm db:generate", "pnpm --filter @inkroute/db db:validate", "pnpm db:migrate", "pnpm db:seed"]) {
      expect(dbEvidence).toContain(command);
    }
    for (const checkId of [
      "staging-branch-provisioned",
      "migration-dry-run",
      "destructive-change-scan",
      "staging-migration-apply",
      "seed-policy",
      "backup-restore-drill",
      "tenant-isolation-smoke",
      "branch-promotion"
    ]) {
      expect(dbEvidence).toContain(checkId);
    }
    for (const pattern of ["DROP TABLE", "DROP COLUMN", "ALTER TABLE DROP", "TRUNCATE"]) {
      expect(dbEvidence).toContain(pattern);
    }
    expect(dbVerifier).toContain("database-operations-evidence.json");
    expect(dbPackage).toContain('"db:validate"');
    expect(dbPackage).toContain('"db:generate"');
    expect(dbPackage).toContain('"db:migrate"');
    expect(dbPackage).toContain('"db:seed"');
    expect(deploymentTests).toContain("buildDatabaseOperationsRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until provider DB, Prisma lifecycle, migration, backup, tenant isolation, branch promotion, and safety proof exists", () => {
    expect(databaseOperationsRuntimeReadiness.status).toBe("blocked");
    expect(databaseOperationsRuntimeReadiness.missingCommands).toEqual([]);
    expect(databaseOperationsRuntimeReadiness.missingScripts).toEqual([]);
    expect(databaseOperationsRuntimeReadiness.missingChecks).toEqual(
      expect.arrayContaining(["staging-branch-provisioned", "migration-dry-run", "backup-restore-drill", "branch-promotion"])
    );
    expect(databaseOperationsRuntimeReadiness.requiredCommands).toBe(databaseOperationsRuntimeCommands);
    expect(databaseOperationsRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Redacted staging database branch/provider label and secret-store reference.",
        "Prisma validate, generate, migration dry-run, and generated SQL review output.",
        "Destructive SQL scan output covering DROP TABLE, DROP COLUMN, ALTER TABLE DROP, and TRUNCATE.",
        "Staging migration apply log, migration id, seed output, and app compatibility smoke.",
        "Backup snapshot, restore drill log, and RTO/RPO note.",
        "Tenant-isolation smoke output and tenant-scoped query audit label.",
        "Branch promotion approval, production branch label, and rollback branch/restore evidence."
      ])
    );
    expect(databaseOperationsRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Database provider branch/project must be provisioned and verified with redacted evidence.",
        "Database operations evidence must include every required operation check.",
        "pnpm deploy:verify-database-ops must pass.",
        "Backup/restore drill must pass with RTO/RPO evidence.",
        "Production data safety, seed policy, and destructive SQL gates must be reviewed."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 database operations runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/database-operations-runtime-static.test.ts");
    expect(ciWorkflow).toContain("database-operations-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/database-operations-runtime.json");
    expect(ciWorkflow).toContain("coverage/database-migration-dry-run-redacted.json");
    expect(ciWorkflow).toContain("coverage/database-production-data-safety-review.md");
    expect(ciWorkflow).toContain("coverage/database-operations-ci-run-redacted.json");
    expect(ciWorkflow).toContain("test-results/database-operations-runtime");
    expect(unitManifest).toContain("unit-web-database-operations-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/databaseOperationsRuntime.ts");
    expect(gapTracker).toContain("Database operations evidence classifier wired and provider DB proof gated");
    expect(gapTracker).toContain("GAP-117 is database-operations-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("databaseOperationsRuntimeCommands");
    expect(gapTracker).toContain("buildDatabaseOperationsRuntimeExecutionPlan");
    expect(gapTracker).toContain("databaseOperationsRuntimeExecutionPolicy");
    expect(gapTracker).toContain("databaseOperationsRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildDatabaseOperationsRuntimeArtifactReview");
    expect(gapTracker).toContain("buildDatabaseOperationsRuntimeRedactedEvidenceBundle");
  });

  it("pins current database operations runtime proof files for GAP-117", () => {
    expect(databaseOperationsRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "deployment/DATABASE_MIGRATION_GUIDE.md",
      "packages/db/prisma/seed.ts",
      "packages/deployment/src/index.ts",
      "packages/releases/src/index.ts",
        "apps/web/lib/databaseOperationsRuntime.ts",
        "apps/web/tests/database-operations-runtime-static.test.ts",
        "deployment/manifests/database-operations-evidence.json",
        "deployment/scripts/verify-database-operations.mjs",
        "packages/db/prisma/migrations/20260609020000_add_database_operations_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of databaseOperationsRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable DatabaseOperationsRun persistence for provider DB operations proof", () => {
    expect(databaseOperationsRunPersistenceContract.prismaModel).toBe("DatabaseOperationsRun");
    expect(databaseOperationsRunPersistenceContract.tenantRelation).toBe("databaseOperationsRuns");
    expect(databaseOperationsRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(databaseOperationsRunPersistenceContract.jsonFields).toEqual([
      "operationCheckMatrix",
      "destructiveSqlScan",
      "artifactManifest"
    ]);
    expect(databaseOperationsRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "providerBranchProvisioned",
        "secretStoreReferenceConfigured",
        "prismaGeneratePassed",
        "migrationDryRunPassed",
        "destructiveSqlScanPassed",
        "backupRestoreDrillPassed",
        "tenantIsolationSmokePassed",
        "productionDataSafetyReviewed",
        "ciDatabaseOperationsArtifactsCaptured"
      ])
    );
    expect(databaseOperationsRunPersistenceContract.redactedArtifactFields).toContain("providerBranchArtifactPath");
    expect(prismaSchema).toContain("databaseOperationsRuns DatabaseOperationsRun[]");
    expect(prismaSchema).toContain("model DatabaseOperationsRun");
    expect(prismaSchema).toContain("operationCheckMatrix                    Json");
    expect(prismaSchema).toContain("destructiveSqlScanPassed                Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "DatabaseOperationsRun"');
    expect(prismaMigration).toContain('"productionDataSafetyArtifactPath" TEXT');
    expect(unitManifest).toContain("DatabaseOperationsRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609020000_add_database_operations_runs/migration.sql");
  });

  it("classifies GAP-117 evidence as blocked until provider database operations proof is captured", () => {
    const blockedDecision = buildDatabaseOperationsRuntimeEvidenceDecision({
      providerBranchProvisioned: false,
      secretStoreReferenceConfigured: false,
      verifierPassed: true,
      prismaGeneratePassed: true,
      prismaValidatePassed: true,
      migrationDryRunPassed: false,
      generatedSqlReviewed: false,
      destructiveSqlScanPassed: true,
      stagingMigrationApplied: false,
      seedPolicyVerified: false,
      backupRestoreDrillPassed: false,
      tenantIsolationSmokePassed: false,
      branchPromotionApproved: false,
      productionDataSafetyReviewed: false,
      ciDatabaseOperationsArtifactsCaptured: false,
      requiredCommandsRun: databaseOperationsRuntimeCommands.filter(
        (command) =>
          command !== "database migration dry-run" &&
          command !== "database generated SQL review" &&
          command !== "database staging migration apply" &&
          command !== "database seed policy verification" &&
          command !== "database backup/restore drill" &&
          command !== "database branch promotion approval" &&
          command !== "database production data-safety review" &&
          command !== "capture CI database-operations artifacts",
      ),
      capturedArtifacts: [
        "coverage/database-operations-runtime.json",
        "coverage/database-operations-verifier.json",
        "coverage/database-prisma-generate.log",
        "coverage/database-prisma-validate.log",
        "coverage/database-destructive-sql-scan.json",
        "test-results/database-operations-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture provider database branch proof.",
        "Capture database secret-store reference proof.",
        "Capture migration dry-run proof.",
        "Capture generated SQL review proof.",
        "Apply migration to staging.",
        "Run backup/restore drill.",
        "Run tenant-isolation smoke.",
        "Capture branch promotion approval.",
        "Capture production data-safety review.",
        "Capture CI database-operations artifacts.",
        "Required command not recorded: database migration dry-run",
        "Required command not recorded: database generated SQL review",
        "Required command not recorded: database staging migration apply",
        "Required command not recorded: database seed policy verification",
        "Required command not recorded: database backup/restore drill",
        "Required command not recorded: database branch promotion approval",
        "Required command not recorded: database production data-safety review",
        "Required command not recorded: capture CI database-operations artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/database-provider-branch-redacted.json",
        "coverage/database-migration-dry-run-redacted.json",
        "coverage/database-staging-migration-apply-redacted.json",
        "coverage/database-backup-restore-drill-redacted.json",
        "coverage/database-branch-promotion-approval-redacted.json",
        "coverage/database-operations-ci-run-redacted.json",
        "coverage/database-operations-redacted-evidence-bundle.json",
      ]),
    );
    expect(blockedDecision.databaseOperationsPolicy).toEqual({
      productionConnectionStringsForbidden: true,
      destructiveSqlReviewRequired: true,
      promotionApprovalRequired: true,
    });

    const completeDecision = buildDatabaseOperationsRuntimeEvidenceDecision({
      providerBranchProvisioned: true,
      secretStoreReferenceConfigured: true,
      verifierPassed: true,
      prismaGeneratePassed: true,
      prismaValidatePassed: true,
      migrationDryRunPassed: true,
      generatedSqlReviewed: true,
      destructiveSqlScanPassed: true,
      stagingMigrationApplied: true,
      seedPolicyVerified: true,
      backupRestoreDrillPassed: true,
      tenantIsolationSmokePassed: true,
      branchPromotionApproved: true,
      productionDataSafetyReviewed: true,
      ciDatabaseOperationsArtifactsCaptured: true,
      requiredCommandsRun: databaseOperationsRuntimeCommands,
      capturedArtifacts: databaseOperationsRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(databaseOperationsRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(databaseOperationsRuntimeArtifactPaths);
  });

  it("keeps provider database operations disabled while splitting local SQL/schema checks from external proof", () => {
    const plan = buildDatabaseOperationsRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(databaseOperationsRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(databaseOperationsRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(databaseOperationsRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(databaseOperationsRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/database-operations-runtime.json",
        "coverage/database-operations-verifier.json",
        "coverage/database-prisma-generate.log",
        "coverage/database-prisma-validate.log",
        "coverage/database-destructive-sql-scan.json",
        "coverage/database-production-data-safety-review.md",
        "test-results/database-operations-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/database-provider-branch-redacted.json",
        "coverage/database-migration-dry-run-redacted.json",
        "coverage/database-staging-migration-apply-redacted.json",
        "coverage/database-seed-policy-redacted.json",
        "coverage/database-backup-restore-drill-redacted.json",
        "coverage/database-tenant-isolation-smoke-redacted.json",
        "coverage/database-branch-promotion-approval-redacted.json",
        "coverage/database-operations-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.prismaGenerateExecutionAllowed).toBe(false);
    expect(plan.prismaValidateExecutionAllowed).toBe(false);
    expect(plan.migrationDryRunExecutionAllowed).toBe(false);
    expect(plan.stagingMigrationExecutionAllowed).toBe(false);
    expect(plan.seedExecutionAllowed).toBe(false);
    expect(plan.backupRestoreExecutionAllowed).toBe(false);
    expect(plan.tenantIsolationExecutionAllowed).toBe(false);
    expect(plan.branchPromotionExecutionAllowed).toBe(false);
    expect(plan.productionDataSafetyExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(databaseOperationsRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifySchemaAndSqlArtifacts: true,
      providerBranchRequiredForDatabaseProof: true,
      productionConnectionStringsForbidden: true,
      destructiveSqlReviewRequired: true,
      promotionApprovalRequired: true,
      backupRestoreRequiresProviderDatabase: true,
    });
    expect(plan.externalEvidenceRequired).toBe(databaseOperationsRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted database operations evidence bundle captured without raw connection strings, provider IDs, branch labels, SQL literals, tenant identifiers, run URLs, or customer data.",
    );
  });

  it("redacts database operations artifacts before review or retention", () => {
    const rawArtifact = {
      databaseUrl: "postgres://tenant_demo:secret@db.example.com/inkroute",
      directUrl: "postgres://tenant_demo:secret@direct.example.com/inkroute",
      providerBranch: "branch_prod_123",
      snapshotId: "snapshot_secret_456",
      restoreId: "restore_secret_789",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      generatedSql: "SELECT * FROM Booking WHERE tenant_id = 'tenant_demo' AND email = 'client@example.com'",
      destructiveSqlScan: ["DROP TABLE tenant_demo.Booking"],
      nested: {
        authorization: "Bearer database-operations-token",
        phone: "+1 555 333 9090",
      },
    };
    const redacted = buildRedactedDatabaseOperationsArtifact(rawArtifact);
    const review = buildDatabaseOperationsRuntimeArtifactReview("coverage/database-migration-dry-run-redacted.json", rawArtifact);
    const bundle = buildDatabaseOperationsRuntimeRedactedEvidenceBundle("coverage/database-migration-dry-run-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("postgres://");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("branch_prod_123");
    expect(serialized).not.toContain("snapshot_secret_456");
    expect(serialized).not.toContain("restore_secret_789");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 333 9090");
    expect(serialized).not.toContain("Bearer database-operations-token");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "ciRunUrl",
        "databaseUrl",
        "destructiveSqlScan",
        "directUrl",
        "generatedSql",
        "providerBranch",
        "restoreId",
        "snapshotId",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(databaseOperationsRuntimeRequiredExternalEvidence);
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/database-operations-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(databaseOperationsRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(databaseOperationsRuntimeRequiredExternalEvidence);
    expect(bundle.providerDatabaseExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Provider branch, migration dry-run, staging apply, backup/restore, and tenant-isolation artifacts must be captured outside Codex with connection strings redacted.",
        "Generated SQL and destructive SQL review artifacts must redact literals, tenant identifiers, and provider branch labels.",
        "Branch promotion and production data-safety proof must remain approval-gated and must not include production connection strings.",
        "CI database-operations artifacts must redact run URLs, provider IDs, database URLs, and customer data before retention.",
      ]),
    );
  });
});

