import { buildMigrationRuntimeDryRunReadinessPlan } from "@inkroute/releases";

export const migrationRuntimeArtifactPaths = [
  "coverage/migration-runtime-dry-run.json",
  "coverage/migration-prisma-validate.json",
  "coverage/migration-prisma-diff.sql",
  "coverage/migration-destructive-sql-scan.json",
  "coverage/migration-backup-snapshot-redacted.json",
  "coverage/migration-expand-contract-plan.json",
  "coverage/migration-forward-fix-restore-policy.json",
  "coverage/migration-rollback-evidence.json",
  "coverage/migration-github-actions-dry-run.json",
  "test-results/migration-runtime-dry-run",
] as const;

export const migrationRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm --filter @inkroute/db prisma validate --schema packages/db/prisma/schema.prisma",
  "pnpm --filter @inkroute/db prisma migrate diff --from-url \"$DATABASE_URL\" --to-schema-datamodel packages/db/prisma/schema.prisma --script",
  "pnpm --filter @inkroute/db prisma migrate deploy",
  "release-governance migration dry run with staging DATABASE_URL",
] as const;

export function buildDestructiveSqlScanPolicy(sqlPath = "coverage/migration-prisma-diff.sql") {
  return {
    sqlPath,
    destructivePatterns: ["DROP TABLE", "DROP COLUMN", "ALTER TABLE .* DROP", "TRUNCATE"],
    blockWithoutApproval: true,
    requiredEvidence: [
      "backup snapshot",
      "destructive or contract approval",
      "expand/contract sequencing plan",
      "forward-fix/restore policy",
      "rollback or forward-fix rehearsal evidence",
    ],
    artifactPaths: migrationRuntimeArtifactPaths,
  };
}

export function buildMigrationRuntimeEvidenceEnvelope(input: { migrationsDirectoryExists: boolean; stagingDatabaseUrlConfigured: boolean }) {
  return {
    schemaPath: "packages/db/prisma/schema.prisma",
    migrationDirectory: "packages/db/prisma/migrations",
    migrationsDirectoryExists: input.migrationsDirectoryExists,
    stagingDatabaseUrlConfigured: input.stagingDatabaseUrlConfigured,
    commands: migrationRuntimeCommands,
    destructiveSqlScan: buildDestructiveSqlScanPolicy(),
    rollbackPolicy: {
      strategy: "forward-fix-first",
      restoreRequiresIncidentApproval: true,
      rollbackEvidenceRequired: true,
    },
    ci: {
      workflow: ".github/workflows/release-governance.yml",
      artifactPaths: migrationRuntimeArtifactPaths,
      rawDatabaseUrlStored: false,
    },
  };
}

export function buildMigrationRuntimeContract(input: { migrationsDirectoryExists: boolean; stagingDatabaseUrlConfigured?: boolean } = { migrationsDirectoryExists: false }) {
  return buildMigrationRuntimeDryRunReadinessPlan({
    packageScripts: ["test", "typecheck"],
    releasesTestsPassed: false,
    releasesTypecheckPassed: false,
    workflowSourceTestsPassed: false,
    prismaSchemaPresent: true,
    prismaMigrationsGenerated: input.migrationsDirectoryExists,
    stagingDatabaseUrlConfigured: Boolean(input.stagingDatabaseUrlConfigured),
    prismaValidatePassed: false,
    prismaDiffDryRunPassed: false,
    prismaMigrateDeployDryRunPassed: false,
    destructiveSqlScanPassed: false,
    backupSnapshotAttached: false,
    destructiveApprovalAttached: false,
    expandContractPlanAttached: false,
    forwardFixPlanAttached: false,
    rollbackEvidenceRecorded: false,
    githubActionsDryRunPassed: false,
    ciArtifactCaptured: true,
  });
}

export const migrationRuntimeEvidence = buildMigrationRuntimeEvidenceEnvelope({ migrationsDirectoryExists: false, stagingDatabaseUrlConfigured: false });
export const migrationRuntimeContract = buildMigrationRuntimeContract({ migrationsDirectoryExists: false, stagingDatabaseUrlConfigured: false });
