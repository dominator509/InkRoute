import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildDestructiveSqlScanPolicy,
  buildMigrationRuntimeArtifactReview,
  buildMigrationRuntimeContract,
  buildMigrationRuntimeEvidenceDecision,
  buildMigrationRuntimeEvidenceEnvelope,
  buildMigrationRuntimeExecutionPlan,
  buildMigrationRollbackRehearsalEvidence,
  buildRedactedMigrationRuntimeArtifact,
  destructiveSqlScanRequiredEvidence,
  migrationRuntimeArtifactPaths,
  migrationRuntimeCommands,
  migrationRuntimeDecisionRequiredEvidence,
  migrationRuntimeExecutionPolicy,
  migrationRuntimeProofFiles,
  migrationRuntimeRequiredExternalEvidence,
} from "../lib/migrationRuntimeDryRun";

const root = join(__dirname, "..", "..");
const workflow = readFileSync(join(root, ".github/workflows/release-governance.yml"), "utf8");
const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const tracker = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const schemaExists = existsSync(join(root, "packages/db/prisma/schema.prisma"));
const migrationsDirectoryExists = existsSync(join(root, "packages/db/prisma/migrations"));

describe("migration runtime dry-run compatibility contract", () => {
  it("pins Prisma validate, diff, deploy, and GitHub dry-run commands", () => {
    expect(schemaExists).toBe(true);
    expect(migrationRuntimeCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/db prisma validate --schema packages/db/prisma/schema.prisma",
        "pnpm --filter @inkroute/db prisma migrate diff --from-url \"$DATABASE_URL\" --to-schema-datamodel packages/db/prisma/schema.prisma --script",
        "pnpm --filter @inkroute/db prisma migrate deploy",
        "release-governance migration dry run with staging DATABASE_URL",
      ]),
    );
  });

  it("requires destructive SQL scan evidence before migration approval", () => {
    const scan = buildDestructiveSqlScanPolicy();

    expect(scan.destructivePatterns).toEqual(expect.arrayContaining(["DROP TABLE", "DROP COLUMN", "ALTER TABLE .* DROP", "TRUNCATE"]));
    expect(scan.blockWithoutApproval).toBe(true);
    expect(scan.requiredEvidence).toBe(destructiveSqlScanRequiredEvidence);
  });

  it("builds a migration evidence envelope without storing database URLs", () => {
    const envelope = buildMigrationRuntimeEvidenceEnvelope({ migrationsDirectoryExists, stagingDatabaseUrlConfigured: false });
    const rehearsal = buildMigrationRollbackRehearsalEvidence({ releaseId: "rel_1", migrationLabel: "migration_1", destructiveSqlDetected: true });

    expect(envelope.schemaPath).toBe("packages/db/prisma/schema.prisma");
    expect(envelope.migrationDirectory).toBe("packages/db/prisma/migrations");
    expect(envelope.ci.rawDatabaseUrlStored).toBe(false);
    expect(envelope.rollbackPolicy.strategy).toBe("forward-fix-first");
    expect(envelope.rollbackRehearsal).toMatchObject({ rehearsalRecorded: true, rawDatabaseUrlStored: false });
    expect(rehearsal).toMatchObject({
      strategy: "forward-fix-first",
      dataLossAssessmentRequired: true,
      restoreRequiresIncidentApproval: true,
      artifact: "coverage/migration-rollback-evidence.json",
    });
  });

  it("keeps readiness blocked when real migrations and staging DATABASE_URL are missing", () => {
    const contract = buildMigrationRuntimeContract({ migrationsDirectoryExists, stagingDatabaseUrlConfigured: false });

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "Real Prisma migrations must be generated and committed before dry-run proof.",
        "Staging DATABASE_URL must be provisioned in GitHub Actions secrets.",
      ]),
    );
    expect(contract.blockers).not.toContain("Rollback or forward-fix rehearsal evidence must be recorded.");
    expect(migrationRuntimeArtifactPaths).toContain("coverage/migration-github-actions-dry-run.json");
  });

  it("builds a local execution plan without staging database, Prisma deploy, or GitHub Actions dry-run execution", () => {
    const plan = buildMigrationRuntimeExecutionPlan();

    expect(plan.id).toBe("gap-092-migration-runtime-dry-run");
    expect(plan.stagingDatabaseExecutionAllowed).toBe(false);
    expect(plan.prismaMigrateDeployAllowed).toBe(false);
    expect(plan.githubActionsDryRunAllowed).toBe(false);
    expect(plan.policy).toBe(migrationRuntimeExecutionPolicy);
    expect(plan.policy).toEqual({
      executeStagingDatabase: false,
      executePrismaMigrateDeploy: false,
      executeGithubActionsDryRun: false,
      executeBackupSnapshot: false,
      executeRollbackRehearsal: false,
      executeCi: false,
    });
    expect(plan.requiredCommands).toBe(migrationRuntimeCommands);
    expect(plan.requiredArtifacts).toBe(migrationRuntimeArtifactPaths);
    expect(plan.localPolicyArtifacts).toEqual(
      expect.arrayContaining(["coverage/migration-prisma-validate.json", "coverage/migration-destructive-sql-scan.json"]),
    );
    expect(plan.stagingDatabaseArtifacts).toEqual(
      expect.arrayContaining(["coverage/migration-prisma-diff.sql", "coverage/migration-backup-snapshot-redacted.json"]),
    );
    expect(plan.githubActionsArtifacts).toEqual(["coverage/migration-github-actions-dry-run.json"]);
    expect(plan.externalEvidenceRequired).toBe(migrationRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toEqual([
      "committed Prisma migrations",
      "staging Postgres DATABASE_URL in GitHub Actions secrets",
      "Prisma migrate diff and deploy dry runs",
      "backup snapshot, destructive approval, expand/contract, and forward-fix evidence",
      "release-governance GitHub Actions migration dry run and CI artifact capture",
    ]);
  });

  it("redacts migration runtime artifacts before persistence", () => {
    const rawArtifact = {
      databaseUrl: "postgresql://user:password@db.example.com:5432/inkroute",
      approval: {
        approverEmail: "dba@example.com",
        token: "postgres-secret-token",
      },
      result: "migration dry run blocked",
    };

    const redacted = buildRedactedMigrationRuntimeArtifact(rawArtifact);
    const review = buildMigrationRuntimeArtifactReview("migration-github-actions-dry-run", rawArtifact);
    const serialized = JSON.stringify(review.redactedArtifact);

    expect(JSON.stringify(redacted)).not.toContain("postgresql://user:password");
    expect(serialized).not.toContain("dba@example.com");
    expect(serialized).not.toContain("postgres-secret-token");
    expect(serialized).toContain("migration dry run blocked");
    expect(review.safeToPersist).toBe(true);
    expect(review.unsafeFindings).toEqual([]);
    expect(review.requiredArtifactPath).toBe("coverage/migration-github-actions-dry-run.json");
  });

  it("pins current migration runtime dry-run proof files for GAP-092", () => {
    expect(migrationRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/db/package.json",
      "packages/releases/package.json",
        "packages/releases/src/index.ts",
        "packages/releases/tests/feature-flags.test.ts",
        "packages/releases/tests/release-governance-workflow.test.ts",
        "apps/dashboard/lib/migrationRuntimeDryRun.ts",
        "apps/dashboard/tests/migration-runtime-dry-run-static.test.ts",
        ".github/workflows/release-governance.yml",
        ".github/workflows/ci.yml",
        "DATABASE_SCHEMA.md",
        "packages/db/prisma/schema.prisma",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of migrationRuntimeProofFiles) {
      expect(readFileSync(join(root, file), "utf8").length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-092 migration compatibility evidence as blocked until staging dry-run and safety artifacts are captured", () => {
    const blocked = buildMigrationRuntimeEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      workflowSourceTestsPassed: true,
      prismaSchemaPresent: true,
      prismaMigrationsCommitted: false,
      stagingDatabaseUrlConfigured: false,
      prismaValidatePassed: true,
      prismaDiffDryRunPassed: false,
      prismaMigrateDeployDryRunPassed: false,
      destructiveSqlScanPassed: false,
      backupSnapshotAttached: false,
      destructiveApprovalAttached: false,
      expandContractPlanAttached: false,
      forwardFixPlanAttached: false,
      rollbackEvidenceRecorded: true,
      githubActionsDryRunPassed: false,
      ciArtifactCaptured: false,
      capturedArtifacts: ["coverage/migration-runtime-dry-run.json"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual(
      expect.arrayContaining([
        "Committed Prisma migration evidence is required.",
        "Redacted staging DATABASE_URL secret evidence is required.",
        "Prisma migrate diff dry-run evidence is required.",
        "Backup snapshot evidence is required.",
        "GitHub Actions migration dry-run evidence is required.",
      ]),
    );
    expect(blocked.missingArtifacts).toContain("coverage/migration-prisma-diff.sql");
    expect(blocked.requiredCommands).toBe(migrationRuntimeCommands);
    expect(blocked.requiredEvidence).toBe(migrationRuntimeDecisionRequiredEvidence);

    const complete = buildMigrationRuntimeEvidenceDecision({
      releasesTypecheckPassed: true,
      releasesTestsPassed: true,
      workflowSourceTestsPassed: true,
      prismaSchemaPresent: true,
      prismaMigrationsCommitted: true,
      stagingDatabaseUrlConfigured: true,
      prismaValidatePassed: true,
      prismaDiffDryRunPassed: true,
      prismaMigrateDeployDryRunPassed: true,
      destructiveSqlScanPassed: true,
      backupSnapshotAttached: true,
      destructiveApprovalAttached: true,
      expandContractPlanAttached: true,
      forwardFixPlanAttached: true,
      rollbackEvidenceRecorded: true,
      githubActionsDryRunPassed: true,
      ciArtifactCaptured: true,
      capturedArtifacts: migrationRuntimeArtifactPaths,
    });

    expect(complete.status).toBe("complete");
    expect(complete.blockers).toEqual([]);
    expect(complete.missingArtifacts).toEqual([]);
    expect(complete.requiredEvidence).toBe(migrationRuntimeDecisionRequiredEvidence);
    expect(complete.redactedSummary).toContain("CI-safe redacted artifacts captured");
  });

  it("wires workflow and CI artifacts without claiming staging execution", () => {
    expect(workflow).toContain("Prisma migration compatibility dry run");
    expect(workflow).toContain("DATABASE_URL is required for Prisma migration compatibility dry run");
    expect(workflow).toContain("DROP TABLE|DROP COLUMN|ALTER TABLE .* DROP|TRUNCATE");
    expect(ci).toContain("Run Phase 12 migration runtime dry-run contracts");
    expect(ci).toContain("apps/dashboard/tests/migration-runtime-dry-run-static.test.ts");
    expect(tracker).toContain("GAP-092");
    expect(tracker).toContain("apps/dashboard/lib/migrationRuntimeDryRun.ts");
    expect(tracker).toContain("Migration compatibility evidence classifier wired and staging-proof gated");
    expect(tracker).toContain("migrationRuntimeDecisionRequiredEvidence");
    expect(tracker).toContain("staging database dry-run proof");
  });
});
