import { buildDatabaseOperationsRuntimeReadinessPlan } from "@inkroute/deployment";

export type DatabaseOperationsRuntimeStatus =
  | "wired"
  | "database-gated"
  | "approval-gated"
  | "ci-gated";

export interface DatabaseOperationsRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DatabaseOperationsRuntimeStatus;
}

export interface DatabaseOperationsRunPersistenceContract {
  readonly prismaModel: "DatabaseOperationsRun";
  readonly tenantRelation: "databaseOperationsRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["operationCheckMatrix", "destructiveSqlScan", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "providerBranchProvisioned",
    "secretStoreReferenceConfigured",
    "verifierPassed",
    "prismaGeneratePassed",
    "prismaValidatePassed",
    "migrationDryRunPassed",
    "generatedSqlReviewed",
    "destructiveSqlScanPassed",
    "stagingMigrationApplied",
    "seedPolicyVerified",
    "backupRestoreDrillPassed",
    "tenantIsolationSmokePassed",
    "branchPromotionApproved",
    "productionDataSafetyReviewed",
    "ciDatabaseOperationsArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "providerBranchArtifactPath",
    "migrationDryRunArtifactPath",
    "destructiveSqlScanArtifactPath",
    "backupRestoreArtifactPath",
    "tenantIsolationArtifactPath",
    "branchPromotionArtifactPath",
    "productionDataSafetyArtifactPath"
  ];
}

export const databaseOperationsRuntimeArtifactPaths = [
  "coverage/database-operations-runtime.json",
  "coverage/database-operations-verifier.json",
  "coverage/database-provider-branch-redacted.json",
  "coverage/database-prisma-generate.log",
  "coverage/database-prisma-validate.log",
  "coverage/database-migration-dry-run-redacted.json",
  "coverage/database-destructive-sql-scan.json",
  "coverage/database-staging-migration-apply-redacted.json",
  "coverage/database-seed-policy-redacted.json",
  "coverage/database-backup-restore-drill-redacted.json",
  "coverage/database-tenant-isolation-smoke-redacted.json",
  "coverage/database-branch-promotion-approval-redacted.json",
  "coverage/database-production-data-safety-review.md",
  "coverage/database-operations-ci-run-redacted.json",
  "test-results/database-operations-runtime"
] as const;

export const databaseOperationsRuntimeCommands = [
  "pnpm deploy:verify-database-ops",
  "pnpm db:generate",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm db:migrate",
  "pnpm db:seed",
  "database destructive SQL scan",
  "database backup/restore drill",
  "database tenant-isolation smoke",
  "database branch promotion approval"
] as const;

export const databaseOperationsRuntimeMatrix: readonly DatabaseOperationsRuntimeMatrixEntry[] = [
  {
    id: "operations-verifier",
    command: "pnpm deploy:verify-database-ops",
    artifact: "coverage/database-operations-verifier.json",
    status: "wired"
  },
  {
    id: "provider-branch-secret-store",
    command: "provision verified redacted staging database branch and secret-store reference",
    artifact: "coverage/database-provider-branch-redacted.json",
    status: "database-gated"
  },
  {
    id: "prisma-generate-validate",
    command: "pnpm db:generate && pnpm --filter @inkroute/db db:validate",
    artifact: "coverage/database-prisma-validate.log",
    status: "database-gated"
  },
  {
    id: "migration-dry-run-destructive-scan",
    command: "pnpm db:migrate plus database destructive SQL scan",
    artifact: "coverage/database-destructive-sql-scan.json",
    status: "database-gated"
  },
  {
    id: "staging-apply-seed-policy",
    command: "apply staging migration and verify seed policy",
    artifact: "coverage/database-staging-migration-apply-redacted.json",
    status: "database-gated"
  },
  {
    id: "backup-restore-tenant-isolation",
    command: "database backup/restore drill and database tenant-isolation smoke",
    artifact: "coverage/database-tenant-isolation-smoke-redacted.json",
    status: "database-gated"
  },
  {
    id: "branch-promotion-data-safety",
    command: "database branch promotion approval and production data safety review",
    artifact: "coverage/database-branch-promotion-approval-redacted.json",
    status: "approval-gated"
  },
  {
    id: "ci-database-operations-artifacts",
    command: "GitHub Actions database operations artifact capture",
    artifact: "coverage/database-operations-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const databaseOperationsRunPersistenceContract: DatabaseOperationsRunPersistenceContract = {
  prismaModel: "DatabaseOperationsRun",
  tenantRelation: "databaseOperationsRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["operationCheckMatrix", "destructiveSqlScan", "artifactManifest"],
  requiredBooleanProofs: [
    "providerBranchProvisioned",
    "secretStoreReferenceConfigured",
    "verifierPassed",
    "prismaGeneratePassed",
    "prismaValidatePassed",
    "migrationDryRunPassed",
    "generatedSqlReviewed",
    "destructiveSqlScanPassed",
    "stagingMigrationApplied",
    "seedPolicyVerified",
    "backupRestoreDrillPassed",
    "tenantIsolationSmokePassed",
    "branchPromotionApproved",
    "productionDataSafetyReviewed",
    "ciDatabaseOperationsArtifactsCaptured"
  ],
  redactedArtifactFields: [
    "providerBranchArtifactPath",
    "migrationDryRunArtifactPath",
    "destructiveSqlScanArtifactPath",
    "backupRestoreArtifactPath",
    "tenantIsolationArtifactPath",
    "branchPromotionArtifactPath",
    "productionDataSafetyArtifactPath"
  ]
};

export const databaseOperationsRuntimeReadiness = buildDatabaseOperationsRuntimeReadinessPlan({
  providerStatus: "not_provisioned",
  requiredCommands: [
    "pnpm db:generate",
    "pnpm --filter @inkroute/db db:validate",
    "pnpm db:migrate",
    "pnpm db:seed"
  ],
  dbPackageScripts: {
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
    "db:seed": "tsx prisma/seed.ts"
  },
  operationChecks: [],
  verifierPassed: false,
  prismaGeneratePassed: false,
  prismaValidatePassed: false,
  migrationDryRunPassed: false,
  stagingMigrationApplied: false,
  backupRestoreDrillPassed: false,
  tenantIsolationSmokePassed: false,
  branchPromotionApproved: false,
  productionDataSafetyReviewed: false
});
