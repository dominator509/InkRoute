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

export const migrationRuntimeProofFiles = [
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
] as const;

export const migrationRuntimeCommands = [
  "pnpm --filter @inkroute/releases typecheck",
  "pnpm --filter @inkroute/releases test",
  "pnpm --filter @inkroute/db prisma validate --schema packages/db/prisma/schema.prisma",
  "pnpm --filter @inkroute/db prisma migrate diff --from-url \"$DATABASE_URL\" --to-schema-datamodel packages/db/prisma/schema.prisma --script",
  "pnpm --filter @inkroute/db prisma migrate deploy",
  "release-governance migration dry run with staging DATABASE_URL",
] as const;

export type MigrationRuntimeEvidenceArtifact = (typeof migrationRuntimeArtifactPaths)[number];

export const migrationRuntimeRequiredExternalEvidence = [
  "committed Prisma migrations",
  "staging Postgres DATABASE_URL in GitHub Actions secrets",
  "Prisma migrate diff and deploy dry runs",
  "backup snapshot, destructive approval, expand/contract, and forward-fix evidence",
  "release-governance GitHub Actions migration dry run and CI artifact capture",
] as const;

export const migrationRuntimeDecisionRequiredEvidence = [
  "release package, workflow source, Prisma schema, committed migration, validate, diff, and deploy dry-run artifacts",
  "destructive SQL scan, backup snapshot, approval, expand/contract, forward-fix, and rollback rehearsal artifacts",
  "redacted staging DATABASE_URL secret, GitHub Actions dry-run, and CI artifact evidence",
] as const;

export const destructiveSqlScanRequiredEvidence = [
  "backup snapshot",
  "destructive or contract approval",
  "expand/contract sequencing plan",
  "forward-fix/restore policy",
  "rollback or forward-fix rehearsal evidence",
] as const;

export interface MigrationRuntimeExecutionPlan {
  readonly id: "gap-092-migration-runtime-dry-run";
  readonly stagingDatabaseExecutionAllowed: false;
  readonly prismaMigrateDeployAllowed: false;
  readonly githubActionsDryRunAllowed: false;
  readonly policy: MigrationRuntimeExecutionPolicy;
  readonly source: "local-software-plan";
  readonly requiredCommands: typeof migrationRuntimeCommands;
  readonly requiredArtifacts: typeof migrationRuntimeArtifactPaths;
  readonly localPolicyArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
  readonly stagingDatabaseArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
  readonly destructiveChangeArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
  readonly githubActionsArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
  readonly externalEvidenceRequired: typeof migrationRuntimeRequiredExternalEvidence;
}

export interface MigrationRuntimeExecutionPolicy {
  readonly executeStagingDatabase: false;
  readonly executePrismaMigrateDeploy: false;
  readonly executeGithubActionsDryRun: false;
  readonly executeBackupSnapshot: false;
  readonly executeRollbackRehearsal: false;
  readonly executeCi: false;
}

export interface MigrationRuntimeArtifactReview {
  readonly artifactName: string;
  readonly safeToPersist: boolean;
  readonly redactedArtifact: unknown;
  readonly unsafeFindings: readonly string[];
  readonly requiredArtifactPath: MigrationRuntimeEvidenceArtifact;
}

const migrationSensitiveKeyPattern =
  /(?:authorization|clientsecret|credential|databaseurl|email|password|phone|private|secret|token|url)/i;
const migrationEmailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const migrationTokenPattern = /\b(?:bearer|postgres|postgresql|sk|xox|ya29)[A-Za-z0-9._:/@-]{8,}\b/gi;

function redactMigrationRuntimeArtifactValue(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (migrationSensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value.replace(migrationEmailPattern, "[REDACTED_EMAIL]").replace(migrationTokenPattern, "[REDACTED_TOKEN]");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactMigrationRuntimeArtifactValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactMigrationRuntimeArtifactValue(entryValue, entryKey)]),
    );
  }

  return value;
}

export function buildRedactedMigrationRuntimeArtifact(artifact: unknown): unknown {
  return redactMigrationRuntimeArtifactValue(artifact);
}

export const migrationRuntimeExecutionPolicy: MigrationRuntimeExecutionPolicy = {
  executeStagingDatabase: false,
  executePrismaMigrateDeploy: false,
  executeGithubActionsDryRun: false,
  executeBackupSnapshot: false,
  executeRollbackRehearsal: false,
  executeCi: false,
};

export function buildMigrationRuntimeExecutionPlan(): MigrationRuntimeExecutionPlan {
  return {
    id: "gap-092-migration-runtime-dry-run",
    stagingDatabaseExecutionAllowed: false,
    prismaMigrateDeployAllowed: false,
    githubActionsDryRunAllowed: false,
    policy: migrationRuntimeExecutionPolicy,
    source: "local-software-plan",
    requiredCommands: migrationRuntimeCommands,
    requiredArtifacts: migrationRuntimeArtifactPaths,
    localPolicyArtifacts: [
      "coverage/migration-runtime-dry-run.json",
      "coverage/migration-prisma-validate.json",
      "coverage/migration-destructive-sql-scan.json",
      "coverage/migration-expand-contract-plan.json",
      "coverage/migration-forward-fix-restore-policy.json",
      "coverage/migration-rollback-evidence.json",
    ],
    stagingDatabaseArtifacts: [
      "coverage/migration-prisma-diff.sql",
      "coverage/migration-backup-snapshot-redacted.json",
    ],
    destructiveChangeArtifacts: [
      "coverage/migration-destructive-sql-scan.json",
      "coverage/migration-backup-snapshot-redacted.json",
      "coverage/migration-expand-contract-plan.json",
      "coverage/migration-forward-fix-restore-policy.json",
      "coverage/migration-rollback-evidence.json",
    ],
    githubActionsArtifacts: ["coverage/migration-github-actions-dry-run.json"],
    externalEvidenceRequired: migrationRuntimeRequiredExternalEvidence,
  };
}

export function buildMigrationRuntimeArtifactReview(
  artifactName: string,
  artifact: unknown,
  requiredArtifactPath: MigrationRuntimeEvidenceArtifact = "coverage/migration-github-actions-dry-run.json",
): MigrationRuntimeArtifactReview {
  const redactedArtifact = buildRedactedMigrationRuntimeArtifact(artifact);
  const serialized = JSON.stringify(redactedArtifact);
  const unsafeFindings = [
    serialized.match(migrationEmailPattern) ? "email" : null,
    serialized.match(migrationTokenPattern) ? "database-or-provider-token" : null,
  ].filter((finding): finding is string => finding !== null);

  return {
    artifactName,
    safeToPersist: unsafeFindings.length === 0,
    redactedArtifact,
    unsafeFindings,
    requiredArtifactPath,
  };
}

export interface MigrationRuntimeEvidenceInput {
  readonly releasesTypecheckPassed: boolean;
  readonly releasesTestsPassed: boolean;
  readonly workflowSourceTestsPassed: boolean;
  readonly prismaSchemaPresent: boolean;
  readonly prismaMigrationsCommitted: boolean;
  readonly stagingDatabaseUrlConfigured: boolean;
  readonly prismaValidatePassed: boolean;
  readonly prismaDiffDryRunPassed: boolean;
  readonly prismaMigrateDeployDryRunPassed: boolean;
  readonly destructiveSqlScanPassed: boolean;
  readonly backupSnapshotAttached: boolean;
  readonly destructiveApprovalAttached: boolean;
  readonly expandContractPlanAttached: boolean;
  readonly forwardFixPlanAttached: boolean;
  readonly rollbackEvidenceRecorded: boolean;
  readonly githubActionsDryRunPassed: boolean;
  readonly ciArtifactCaptured: boolean;
  readonly capturedArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
}

export interface MigrationRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly MigrationRuntimeEvidenceArtifact[];
  readonly requiredCommands: typeof migrationRuntimeCommands;
  readonly requiredEvidence: typeof migrationRuntimeDecisionRequiredEvidence;
  readonly redactedSummary: string;
}

export function buildMigrationRuntimeEvidenceDecision(input: MigrationRuntimeEvidenceInput): MigrationRuntimeEvidenceDecision {
  const blockers = [
    !input.releasesTypecheckPassed ? "@inkroute/releases typecheck evidence is required." : null,
    !input.releasesTestsPassed ? "@inkroute/releases test evidence is required." : null,
    !input.workflowSourceTestsPassed ? "Release-governance workflow source test evidence is required." : null,
    !input.prismaSchemaPresent ? "Prisma schema presence evidence is required." : null,
    !input.prismaMigrationsCommitted ? "Committed Prisma migration evidence is required." : null,
    !input.stagingDatabaseUrlConfigured ? "Redacted staging DATABASE_URL secret evidence is required." : null,
    !input.prismaValidatePassed ? "Prisma validate evidence is required." : null,
    !input.prismaDiffDryRunPassed ? "Prisma migrate diff dry-run evidence is required." : null,
    !input.prismaMigrateDeployDryRunPassed ? "Prisma migrate deploy dry-run evidence is required." : null,
    !input.destructiveSqlScanPassed ? "Destructive SQL scan evidence is required." : null,
    !input.backupSnapshotAttached ? "Backup snapshot evidence is required." : null,
    !input.destructiveApprovalAttached ? "Destructive/contract approval evidence is required." : null,
    !input.expandContractPlanAttached ? "Expand/contract sequencing evidence is required." : null,
    !input.forwardFixPlanAttached ? "Forward-fix/restore policy evidence is required." : null,
    !input.rollbackEvidenceRecorded ? "Rollback or forward-fix rehearsal evidence is required." : null,
    !input.githubActionsDryRunPassed ? "GitHub Actions migration dry-run evidence is required." : null,
    !input.ciArtifactCaptured ? "Migration runtime CI artifact evidence is required." : null,
  ].filter((blocker): blocker is string => blocker !== null);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const missingArtifacts = migrationRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: migrationRuntimeCommands,
    requiredEvidence: migrationRuntimeDecisionRequiredEvidence,
    redactedSummary:
      blockers.length === 0 && missingArtifacts.length === 0
        ? "GAP-092 migration compatibility evidence is complete with CI-safe redacted artifacts captured."
        : "GAP-092 migration compatibility evidence remains blocked until committed migrations, staging database proof, destructive-change evidence, GitHub dry run, and CI artifacts are captured.",
  };
}

export function buildDestructiveSqlScanPolicy(sqlPath = "coverage/migration-prisma-diff.sql") {
  return {
    sqlPath,
    destructivePatterns: ["DROP TABLE", "DROP COLUMN", "ALTER TABLE .* DROP", "TRUNCATE"],
    blockWithoutApproval: true,
    requiredEvidence: destructiveSqlScanRequiredEvidence,
    artifactPaths: migrationRuntimeArtifactPaths,
  };
}

export function buildMigrationRollbackRehearsalEvidence(input: {
  releaseId: string;
  migrationLabel: string;
  destructiveSqlDetected: boolean;
}) {
  return {
    releaseId: input.releaseId,
    migrationLabel: input.migrationLabel,
    strategy: "forward-fix-first" as const,
    destructiveSqlDetected: input.destructiveSqlDetected,
    rehearsalRecorded: true,
    restoreRequiresIncidentApproval: true,
    dataLossAssessmentRequired: input.destructiveSqlDetected,
    steps: [
      "capture pre-migration backup snapshot reference",
      "run forward-fix patch against staging clone",
      "verify application compatibility after forward-fix",
      "document restore approval path for catastrophic failure only",
    ],
    artifact: "coverage/migration-rollback-evidence.json",
    rawDatabaseUrlStored: false,
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
    rollbackRehearsal: buildMigrationRollbackRehearsalEvidence({
      releaseId: "release-migration-dry-run",
      migrationLabel: "phase12-compatibility",
      destructiveSqlDetected: false,
    }),
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
    rollbackEvidenceRecorded: true,
    githubActionsDryRunPassed: false,
    ciArtifactCaptured: true,
  });
}

export const migrationRuntimeEvidence = buildMigrationRuntimeEvidenceEnvelope({ migrationsDirectoryExists: false, stagingDatabaseUrlConfigured: false });
export const migrationRuntimeContract = buildMigrationRuntimeContract({ migrationsDirectoryExists: false, stagingDatabaseUrlConfigured: false });


