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
  "coverage/database-operations-redacted-evidence-bundle.json",
  "test-results/database-operations-runtime"
] as const;

export const databaseOperationsRuntimeProofFiles = [
  "apps/web/lib/databaseOperationsRuntime.ts",
  "apps/web/tests/database-operations-runtime-static.test.ts",
  "deployment/DATABASE_MIGRATION_GUIDE.md",
  "deployment/manifests/database-operations-evidence.json",
  "deployment/scripts/verify-database-operations.mjs",
  "packages/deployment/src/index.ts",
  "packages/deployment/tests/deployment-readiness.test.ts",
  "DATABASE_SCHEMA.md",
  "packages/db/package.json",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/seed.ts",
  "packages/db/prisma/migrations/20260609020000_add_database_operations_runs/migration.sql",
  "packages/releases/src/index.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json"
] as const;

export const databaseOperationsRuntimeCommands = [
  "pnpm deploy:verify-database-ops",
  "pnpm db:generate",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm db:migrate",
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
] as const;

export const databaseOperationsRuntimeLocalCommands = [
  "pnpm deploy:verify-database-ops",
  "pnpm db:generate",
  "pnpm --filter @inkroute/db db:validate",
  "database destructive SQL scan",
  "database generated SQL review",
  "database production data-safety review",
] as const;

const databaseOperationsRuntimeLocalCommandSet = new Set<string>(databaseOperationsRuntimeLocalCommands);

export const databaseOperationsRuntimeExternalCommands = databaseOperationsRuntimeCommands.filter(
  (command) => !databaseOperationsRuntimeLocalCommandSet.has(command),
);

export const databaseOperationsRuntimeRequiredExternalEvidence = [
  "Provider branch, migration dry-run, staging apply, backup/restore, and tenant-isolation artifacts must be captured outside Codex with connection strings redacted.",
  "Generated SQL and destructive SQL review artifacts must redact literals, tenant identifiers, and provider branch labels.",
  "Branch promotion and production data-safety proof must remain approval-gated and must not include production connection strings.",
  "CI database-operations artifacts must redact run URLs, provider IDs, database URLs, and customer data before retention.",
  "Redacted database operations evidence bundle captured without raw connection strings, provider IDs, branch labels, SQL literals, tenant identifiers, run URLs, or customer data.",
] as const;

export type DatabaseOperationsRuntimeExecutionPolicy = {
  readonly codexMayClassifySchemaAndSqlArtifacts: true;
  readonly providerBranchRequiredForDatabaseProof: true;
  readonly productionConnectionStringsForbidden: true;
  readonly destructiveSqlReviewRequired: true;
  readonly promotionApprovalRequired: true;
  readonly backupRestoreRequiresProviderDatabase: true;
};

export const databaseOperationsRuntimeExecutionPolicy: DatabaseOperationsRuntimeExecutionPolicy = {
  codexMayClassifySchemaAndSqlArtifacts: true,
  providerBranchRequiredForDatabaseProof: true,
  productionConnectionStringsForbidden: true,
  destructiveSqlReviewRequired: true,
  promotionApprovalRequired: true,
  backupRestoreRequiresProviderDatabase: true,
};

export type DatabaseOperationsRuntimeArtifact = (typeof databaseOperationsRuntimeArtifactPaths)[number];

export type DatabaseOperationsRuntimeCommand = (typeof databaseOperationsRuntimeCommands)[number];

export const databaseOperationsRuntimeLocalArtifacts = [
  "coverage/database-operations-runtime.json",
  "coverage/database-operations-verifier.json",
  "coverage/database-prisma-generate.log",
  "coverage/database-prisma-validate.log",
  "coverage/database-destructive-sql-scan.json",
  "coverage/database-production-data-safety-review.md",
  "test-results/database-operations-runtime",
] as const satisfies readonly DatabaseOperationsRuntimeArtifact[];

export const databaseOperationsRuntimeExternalArtifacts = databaseOperationsRuntimeArtifactPaths.filter(
  (artifact) =>
    artifact !== "coverage/database-operations-runtime.json" &&
    artifact !== "coverage/database-operations-verifier.json" &&
    artifact !== "coverage/database-prisma-generate.log" &&
    artifact !== "coverage/database-prisma-validate.log" &&
    artifact !== "coverage/database-destructive-sql-scan.json" &&
    artifact !== "coverage/database-production-data-safety-review.md" &&
    artifact !== "test-results/database-operations-runtime",
);

export type DatabaseOperationsRuntimeEvidenceInput = {
  providerBranchProvisioned: boolean;
  secretStoreReferenceConfigured: boolean;
  verifierPassed: boolean;
  prismaGeneratePassed: boolean;
  prismaValidatePassed: boolean;
  migrationDryRunPassed: boolean;
  generatedSqlReviewed: boolean;
  destructiveSqlScanPassed: boolean;
  stagingMigrationApplied: boolean;
  seedPolicyVerified: boolean;
  backupRestoreDrillPassed: boolean;
  tenantIsolationSmokePassed: boolean;
  branchPromotionApproved: boolean;
  productionDataSafetyReviewed: boolean;
  ciDatabaseOperationsArtifactsCaptured: boolean;
  requiredCommandsRun: readonly DatabaseOperationsRuntimeCommand[];
  capturedArtifacts: readonly DatabaseOperationsRuntimeArtifact[];
};

export type DatabaseOperationsRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: DatabaseOperationsRuntimeArtifact[];
  requiredCommands: typeof databaseOperationsRuntimeCommands;
  requiredEvidence: typeof databaseOperationsRuntimeArtifactPaths;
  databaseOperationsPolicy: {
    productionConnectionStringsForbidden: true;
    destructiveSqlReviewRequired: true;
    promotionApprovalRequired: true;
  };
};

export interface DatabaseOperationsRuntimeExecutionPlan {
  readonly localCommands: typeof databaseOperationsRuntimeLocalCommands;
  readonly externalCommands: typeof databaseOperationsRuntimeExternalCommands;
  readonly localArtifacts: typeof databaseOperationsRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof databaseOperationsRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly prismaGenerateExecutionAllowed: false;
  readonly prismaValidateExecutionAllowed: false;
  readonly migrationDryRunExecutionAllowed: false;
  readonly stagingMigrationExecutionAllowed: false;
  readonly seedExecutionAllowed: false;
  readonly backupRestoreExecutionAllowed: false;
  readonly tenantIsolationExecutionAllowed: false;
  readonly branchPromotionExecutionAllowed: false;
  readonly productionDataSafetyExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly executionPolicy: typeof databaseOperationsRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof databaseOperationsRuntimeRequiredExternalEvidence;
}

export interface DatabaseOperationsRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/database-operations-redacted-evidence-bundle.json";
  readonly review: DatabaseOperationsRuntimeArtifactReview;
  readonly requiredArtifacts: typeof databaseOperationsRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof databaseOperationsRuntimeRequiredExternalEvidence;
  readonly providerDatabaseExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
}

export interface DatabaseOperationsRuntimeArtifactReview {
  readonly artifactPath: DatabaseOperationsRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof databaseOperationsRuntimeRequiredExternalEvidence;
}

const sensitiveDatabaseOperationsKeyPattern =
  /(token|secret|password|authorization|cookie|databaseUrl|directUrl|connectionString|providerBranch|projectId|branchId|snapshotId|restoreId|query|sql|tenantId|userId|runId|email|phone|ciRunUrl|repository|repo|pull|pr|reviewer|codeowner)/i;

const sensitiveDatabaseOperationsStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DATABASE_URL]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:tenant|user|project|branch|snapshot|restore|run|db|repo|pull|pr|reviewer|codeowner)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildDatabaseOperationsRuntimeEvidenceDecision(
  input: DatabaseOperationsRuntimeEvidenceInput,
): DatabaseOperationsRuntimeEvidenceDecision {
  const blockers = [
    !input.providerBranchProvisioned && "Capture provider database branch proof.",
    !input.secretStoreReferenceConfigured && "Capture database secret-store reference proof.",
    !input.verifierPassed && "Run database operations verifier.",
    !input.prismaGeneratePassed && "Run Prisma generate.",
    !input.prismaValidatePassed && "Run Prisma validate.",
    !input.migrationDryRunPassed && "Capture migration dry-run proof.",
    !input.generatedSqlReviewed && "Capture generated SQL review proof.",
    !input.destructiveSqlScanPassed && "Run destructive SQL scan.",
    !input.stagingMigrationApplied && "Apply migration to staging.",
    !input.seedPolicyVerified && "Verify seed policy.",
    !input.backupRestoreDrillPassed && "Run backup/restore drill.",
    !input.tenantIsolationSmokePassed && "Run tenant-isolation smoke.",
    !input.branchPromotionApproved && "Capture branch promotion approval.",
    !input.productionDataSafetyReviewed && "Capture production data-safety review.",
    !input.ciDatabaseOperationsArtifactsCaptured && "Capture CI database-operations artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = databaseOperationsRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = databaseOperationsRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: databaseOperationsRuntimeCommands,
    requiredEvidence: databaseOperationsRuntimeArtifactPaths,
    databaseOperationsPolicy: {
      productionConnectionStringsForbidden: true,
      destructiveSqlReviewRequired: true,
      promotionApprovalRequired: true,
    },
  };
}

export function buildDatabaseOperationsRuntimeExecutionPlan(): DatabaseOperationsRuntimeExecutionPlan {
  return {
    localCommands: databaseOperationsRuntimeLocalCommands,
    externalCommands: databaseOperationsRuntimeExternalCommands,
    localArtifacts: databaseOperationsRuntimeLocalArtifacts,
    externalArtifacts: databaseOperationsRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    prismaGenerateExecutionAllowed: false,
    prismaValidateExecutionAllowed: false,
    migrationDryRunExecutionAllowed: false,
    stagingMigrationExecutionAllowed: false,
    seedExecutionAllowed: false,
    backupRestoreExecutionAllowed: false,
    tenantIsolationExecutionAllowed: false,
    branchPromotionExecutionAllowed: false,
    productionDataSafetyExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    executionPolicy: databaseOperationsRuntimeExecutionPolicy,
    externalEvidenceRequired: databaseOperationsRuntimeRequiredExternalEvidence,
  };
}

function redactDatabaseOperationsString(value: string, redactions: Set<string>): string {
  return sensitiveDatabaseOperationsStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactDatabaseOperationsValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveDatabaseOperationsKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactDatabaseOperationsString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactDatabaseOperationsValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactDatabaseOperationsValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedDatabaseOperationsArtifact(artifact: unknown): unknown {
  return redactDatabaseOperationsValue(artifact, new Set<string>());
}

export function buildDatabaseOperationsRuntimeArtifactReview(
  artifactPath: DatabaseOperationsRuntimeArtifact | string,
  artifact: unknown,
): DatabaseOperationsRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactDatabaseOperationsValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: databaseOperationsRuntimeRequiredExternalEvidence,
  };
}

export function buildDatabaseOperationsRuntimeRedactedEvidenceBundle(
  artifactPath: DatabaseOperationsRuntimeArtifact | string,
  artifact: unknown,
): DatabaseOperationsRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/database-operations-redacted-evidence-bundle.json",
    review: buildDatabaseOperationsRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: databaseOperationsRuntimeArtifactPaths,
    externalEvidenceRequired: databaseOperationsRuntimeRequiredExternalEvidence,
    providerDatabaseExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
  };
}

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
    id: "migration-dry-run",
    command: "database migration dry-run",
    artifact: "coverage/database-migration-dry-run-redacted.json",
    status: "database-gated"
  },
  {
    id: "generated-sql-review",
    command: "database generated SQL review",
    artifact: "coverage/database-migration-dry-run-redacted.json",
    status: "database-gated"
  },
  {
    id: "destructive-sql-scan",
    command: "database destructive SQL scan",
    artifact: "coverage/database-destructive-sql-scan.json",
    status: "database-gated"
  },
  {
    id: "staging-migration-apply",
    command: "database staging migration apply",
    artifact: "coverage/database-staging-migration-apply-redacted.json",
    status: "database-gated"
  },
  {
    id: "seed-policy",
    command: "database seed policy verification",
    artifact: "coverage/database-seed-policy-redacted.json",
    status: "database-gated"
  },
  {
    id: "backup-restore-drill",
    command: "database backup/restore drill",
    artifact: "coverage/database-backup-restore-drill-redacted.json",
    status: "database-gated"
  },
  {
    id: "tenant-isolation-smoke",
    command: "database tenant-isolation smoke",
    artifact: "coverage/database-tenant-isolation-smoke-redacted.json",
    status: "database-gated"
  },
  {
    id: "branch-promotion",
    command: "database branch promotion approval",
    artifact: "coverage/database-branch-promotion-approval-redacted.json",
    status: "approval-gated"
  },
  {
    id: "production-data-safety-review",
    command: "database production data-safety review",
    artifact: "coverage/database-production-data-safety-review.md",
    status: "approval-gated"
  },
  {
    id: "ci-database-operations-artifacts",
    command: "capture CI database-operations artifacts",
    artifact: "coverage/database-operations-ci-run-redacted.json",
    status: "ci-gated"
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted database operations evidence bundle",
    artifact: "coverage/database-operations-redacted-evidence-bundle.json",
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
  requiredCommands: databaseOperationsRuntimeCommands,
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

