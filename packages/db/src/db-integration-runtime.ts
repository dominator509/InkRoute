import { buildDbIntegrationRuntimeReadinessPlan } from "./integration-readiness";

export type DbIntegrationRuntimeStatus =
  | "wired"
  | "database-gated"
  | "ci-gated"
  | "human-gated";

export interface DbIntegrationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: DbIntegrationRuntimeStatus;
}

export interface DbIntegrationRunPersistenceInput {
  tenantId: string;
  runId: string;
  commitSha?: string | null;
  status: "blocked" | "running" | "passed" | "failed" | "database_gated";
  runtimeMatrix: readonly DbIntegrationRuntimeMatrixEntry[];
  artifactManifest: readonly string[];
  nonProductionPostgresProvisioned: boolean;
  databaseUrlConfigured: boolean;
  directUrlConfigured: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  prismaMigratePassed: boolean;
  prismaSeedPassed: boolean;
  seedVerificationPassed: boolean;
  tenantIsolationPassed: boolean;
  workflowPersistencePassed: boolean;
  auditLogIntegrationPassed: boolean;
  destructiveResetGuarded: boolean;
  rollbackDocumented: boolean;
  redactedTranscriptPath?: string | null;
  ciRunUrl?: string | null;
}

export interface DbIntegrationRunPersistenceContract {
  modelName: "DbIntegrationRun";
  row: DbIntegrationRunPersistenceInput;
  transactionWrites: readonly ["DbIntegrationRun", "AuditLog"];
  requiredDbFlags: readonly [
    "nonProductionPostgresProvisioned",
    "databaseUrlConfigured",
    "directUrlConfigured",
    "prismaValidatePassed",
    "prismaGeneratePassed",
    "prismaMigratePassed",
    "prismaSeedPassed",
    "seedVerificationPassed",
    "tenantIsolationPassed",
    "workflowPersistencePassed",
    "auditLogIntegrationPassed",
    "destructiveResetGuarded",
    "rollbackDocumented",
  ];
  artifactFields: readonly ["runtimeMatrix", "artifactManifest", "redactedTranscriptPath"];
  tenantIsolationKey: "tenantId";
}

export type DbIntegrationRunData = DbIntegrationRunPersistenceInput & {
  commitSha: string | null;
  redactedTranscriptPath: string | null;
  ciRunUrl: string | null;
};

export interface DbIntegrationRunRepository {
  readonly dbIntegrationRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: DbIntegrationRunData;
      update: DbIntegrationRunData;
    }): unknown;
  };
}

export const dbIntegrationRuntimeArtifactPaths = [
  "coverage/db-integration-runtime.json",
  "coverage/db-postgres-provisioning-redacted.json",
  "coverage/db-prisma-validate.log",
  "coverage/db-prisma-generate.log",
  "coverage/db-prisma-migrate.log",
  "coverage/db-seed-execution.log",
  "coverage/db-seed-verification.json",
  "coverage/db-tenant-isolation-results.json",
  "coverage/db-workflow-persistence-results.json",
  "coverage/db-audit-log-integration-results.json",
  "coverage/db-destructive-reset-guard.json",
  "coverage/db-migration-rollback.md",
  "coverage/db-command-transcript-redacted.log",
  "coverage/db-ci-run-redacted.json",
  "test-results/db-integration-runtime"
] as const;

export const dbIntegrationRuntimeProofFiles = [
  "packages/db/src/db-integration-runtime.ts",
  "packages/db/src/integration-readiness.ts",
  "packages/db/src/index.ts",
  "packages/db/tests/db-integration-runtime-static.test.ts",
  "packages/db/tests/db-integration-plan.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609010000_add_db_integration_runs/migration.sql",
  "packages/db/prisma/seed.ts",
  "packages/db/package.json",
  "testing/manifests/db-integration-test-manifest.json",
  "testing/manifests/unit-test-manifest.json",
  "testing/scripts/verify-test-manifest.mjs",
  ".github/workflows/ci.yml",
  "TESTING_PLAN.md",
] as const;

export const dbIntegrationRuntimeCommands = [
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "pnpm --filter @inkroute/db db:verify-seed",
  "pnpm --filter @inkroute/db test -- db-integration"
] as const;

export const dbIntegrationRuntimeRequiredExternalEvidence = [
  "Non-production Postgres provisioning proof",
  "DATABASE_URL and DIRECT_URL configuration proof",
  "Prisma migrate/seed/verify execution proof",
  "Tenant-isolation/workflow/audit-log integration proof",
  "Migration rollback and redacted transcript proof",
  "CI DB artifact proof",
  "Provider-backed DbIntegrationRun persistence proof",
] as const;

export type DbIntegrationRuntimeArtifact = (typeof dbIntegrationRuntimeArtifactPaths)[number];

export type DbIntegrationRuntimeCommand = (typeof dbIntegrationRuntimeCommands)[number];

export const dbIntegrationRuntimeLocalCommands = dbIntegrationRuntimeCommands.slice(0, 2);

export const dbIntegrationRuntimeExternalCommands = dbIntegrationRuntimeCommands.slice(2);

export const dbIntegrationRuntimeLocalArtifacts = [
  "coverage/db-integration-runtime.json",
  "coverage/db-prisma-validate.log",
  "coverage/db-prisma-generate.log",
  "coverage/db-destructive-reset-guard.json",
  "coverage/db-command-transcript-redacted.log",
  "test-results/db-integration-runtime",
] as const satisfies readonly DbIntegrationRuntimeArtifact[];

export const dbIntegrationRuntimeExternalArtifacts = [
  "coverage/db-postgres-provisioning-redacted.json",
  "coverage/db-prisma-migrate.log",
  "coverage/db-seed-execution.log",
  "coverage/db-seed-verification.json",
  "coverage/db-tenant-isolation-results.json",
  "coverage/db-workflow-persistence-results.json",
  "coverage/db-audit-log-integration-results.json",
  "coverage/db-migration-rollback.md",
  "coverage/db-ci-run-redacted.json",
] as const satisfies readonly DbIntegrationRuntimeArtifact[];

export type DbIntegrationRuntimeExecutionPolicy = {
  localValidateGenerateOnly: true;
  postgresProvisioningRequiresExternalEvidence: true;
  databaseUrlRequiresExternalEvidence: true;
  prismaMigrationSeedRequiresExternalEvidence: true;
  integrationTestsRequireExternalEvidence: true;
  ciDbRequiresExternalEvidence: true;
  persistenceRequiresExternalEvidence: true;
  externalEvidenceRequired: typeof dbIntegrationRuntimeRequiredExternalEvidence;
};

export type DbIntegrationRuntimeEvidenceInput = {
  nonProductionPostgresProvisioned: boolean;
  databaseUrlConfigured: boolean;
  directUrlConfigured: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  prismaMigratePassed: boolean;
  prismaSeedPassed: boolean;
  seedVerificationPassed: boolean;
  tenantIsolationPassed: boolean;
  workflowPersistencePassed: boolean;
  auditLogIntegrationPassed: boolean;
  destructiveResetGuarded: boolean;
  rollbackDocumented: boolean;
  commandTranscriptCaptured: boolean;
  ciDbArtifactCaptured: boolean;
  requiredCommandsRun: readonly DbIntegrationRuntimeCommand[];
  capturedArtifacts: readonly DbIntegrationRuntimeArtifact[];
};

export type DbIntegrationRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: DbIntegrationRuntimeArtifact[];
  requiredCommands: typeof dbIntegrationRuntimeCommands;
  requiredEvidence: typeof dbIntegrationRuntimeArtifactPaths;
  databasePolicy: {
    productionDataForbidden: true;
    destructiveResetGuardRequired: true;
    commandTranscriptsRedacted: true;
  };
};

export type DbIntegrationRuntimeExecutionPlan = {
  status: "local-plan-ready";
  policy: DbIntegrationRuntimeExecutionPolicy;
  externalEvidenceRequired: typeof dbIntegrationRuntimeRequiredExternalEvidence;
  postgresProvisioningExecutionAllowed: false;
  databaseUrlExecutionAllowed: false;
  prismaMigrationExecutionAllowed: false;
  seedExecutionAllowed: false;
  integrationTestExecutionAllowed: false;
  ciDbExecutionAllowed: false;
  persistenceExecutionAllowed: false;
  localCommands: typeof dbIntegrationRuntimeLocalCommands;
  externalCommands: typeof dbIntegrationRuntimeExternalCommands;
  localArtifacts: typeof dbIntegrationRuntimeLocalArtifacts;
  externalArtifacts: typeof dbIntegrationRuntimeExternalArtifacts;
  disabledReasons: readonly string[];
};

export const dbIntegrationRuntimeExecutionPolicy: DbIntegrationRuntimeExecutionPolicy = {
  localValidateGenerateOnly: true,
  postgresProvisioningRequiresExternalEvidence: true,
  databaseUrlRequiresExternalEvidence: true,
  prismaMigrationSeedRequiresExternalEvidence: true,
  integrationTestsRequireExternalEvidence: true,
  ciDbRequiresExternalEvidence: true,
  persistenceRequiresExternalEvidence: true,
  externalEvidenceRequired: dbIntegrationRuntimeRequiredExternalEvidence,
};

export type DbIntegrationRuntimeArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof dbIntegrationRuntimeArtifactPaths;
  retainedExternalGates: readonly string[];
};

const dbIntegrationRuntimeSensitivePatterns = [
  /(database[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(direct[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(postgres(?:ql)?:\/\/)[^"'\s]+/gi,
  /(run[_-]?id['":=\s]+)[^"',\s}]+/gi,
  /(commit[_-]?sha['":=\s]+)[^"',\s}]+/gi,
  /(ci[_-]?run[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(redacted[_-]?transcript[_-]?path['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(token['":=\s]+)[^"',\s}]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
] as const;

export function buildRedactedDbIntegrationRuntimeArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return dbIntegrationRuntimeSensitivePatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedDbIntegrationRuntimeArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /databaseUrl|directUrl|url|token|secret|authorization|credential|password|raw|payload|body|stack|error|ciRunUrl|commitSha|runId|redactedTranscriptPath|commandTranscript|command|output|log|env|postgres|prisma|migration|seed|tenant|audit|workflow|rowId|recordId|reset|rollback|dsn/i.test(key)
          ? "[REDACTED]"
          : buildRedactedDbIntegrationRuntimeArtifact(entry),
      ]),
    );
  }

  return value;
}

export function buildDbIntegrationRuntimeExecutionPlan(): DbIntegrationRuntimeExecutionPlan {
  return {
    status: "local-plan-ready",
    policy: dbIntegrationRuntimeExecutionPolicy,
    externalEvidenceRequired: dbIntegrationRuntimeRequiredExternalEvidence,
    postgresProvisioningExecutionAllowed: false,
    databaseUrlExecutionAllowed: false,
    prismaMigrationExecutionAllowed: false,
    seedExecutionAllowed: false,
    integrationTestExecutionAllowed: false,
    ciDbExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    localCommands: dbIntegrationRuntimeLocalCommands,
    externalCommands: dbIntegrationRuntimeExternalCommands,
    localArtifacts: dbIntegrationRuntimeLocalArtifacts,
    externalArtifacts: dbIntegrationRuntimeExternalArtifacts,
    disabledReasons: [
      "Non-production Postgres proof requires provisioned database infrastructure.",
      "DATABASE_URL and DIRECT_URL execution proof requires non-production credentials.",
      "Prisma migrate/seed execution requires non-production Postgres.",
      "Tenant-isolation, workflow, and audit-log tests require integration data.",
      "CI DB artifact proof requires CI database job execution.",
      "DbIntegrationRun persistence proof requires provider-backed database execution.",
    ],
  };
}

export function buildDbIntegrationRuntimeArtifactReview(rawArtifact: unknown): DbIntegrationRuntimeArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedDbIntegrationRuntimeArtifact(rawArtifact),
    requiredArtifacts: dbIntegrationRuntimeArtifactPaths,
    retainedExternalGates: [
      "Non-production Postgres provisioning proof",
      "DATABASE_URL and DIRECT_URL configuration proof",
      "Prisma migrate/seed/verify execution proof",
      "Tenant-isolation/workflow/audit-log integration proof",
      "Migration rollback and redacted transcript proof",
      "CI DB artifact proof",
      "Provider-backed DbIntegrationRun persistence proof",
    ],
  };
}

export function buildDbIntegrationRuntimeEvidenceDecision(
  input: DbIntegrationRuntimeEvidenceInput,
): DbIntegrationRuntimeEvidenceDecision {
  const blockers = [
    !input.nonProductionPostgresProvisioned && "Provision non-production Postgres.",
    !input.databaseUrlConfigured && "Configure non-production DATABASE_URL.",
    !input.directUrlConfigured && "Configure non-production DIRECT_URL.",
    !input.prismaValidatePassed && "Run Prisma schema validation.",
    !input.prismaGeneratePassed && "Run Prisma client generation.",
    !input.prismaMigratePassed && "Run Prisma migrations against non-production Postgres.",
    !input.prismaSeedPassed && "Run Prisma seed against non-production Postgres.",
    !input.seedVerificationPassed && "Run seed verification.",
    !input.tenantIsolationPassed && "Run tenant-isolation integration tests.",
    !input.workflowPersistencePassed && "Run workflow persistence integration tests.",
    !input.auditLogIntegrationPassed && "Run audit-log integration tests.",
    !input.destructiveResetGuarded && "Capture destructive reset guard proof.",
    !input.rollbackDocumented && "Document migration rollback notes.",
    !input.commandTranscriptCaptured && "Capture redacted DB command transcript.",
    !input.ciDbArtifactCaptured && "Capture CI DB artifact proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = dbIntegrationRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = dbIntegrationRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: dbIntegrationRuntimeCommands,
    requiredEvidence: dbIntegrationRuntimeArtifactPaths,
    databasePolicy: {
      productionDataForbidden: true,
      destructiveResetGuardRequired: true,
      commandTranscriptsRedacted: true,
    },
  };
}

export const dbIntegrationRuntimeMatrix: readonly DbIntegrationRuntimeMatrixEntry[] = [
  {
    id: "non-production-postgres",
    command: "provision non-production Postgres and configure DATABASE_URL/DIRECT_URL",
    artifact: "coverage/db-postgres-provisioning-redacted.json",
    status: "database-gated"
  },
  {
    id: "prisma-validate-generate",
    command: "pnpm --filter @inkroute/db db:validate && pnpm --filter @inkroute/db db:generate",
    artifact: "coverage/db-prisma-generate.log",
    status: "database-gated"
  },
  {
    id: "prisma-migrate-seed",
    command: "pnpm --filter @inkroute/db db:migrate && pnpm --filter @inkroute/db db:seed",
    artifact: "coverage/db-prisma-migrate.log",
    status: "database-gated"
  },
  {
    id: "seed-verification",
    command: "pnpm --filter @inkroute/db db:verify-seed",
    artifact: "coverage/db-seed-verification.json",
    status: "database-gated"
  },
  {
    id: "tenant-isolation",
    command: "pnpm --filter @inkroute/db test -- db-integration tenant-isolation",
    artifact: "coverage/db-tenant-isolation-results.json",
    status: "database-gated"
  },
  {
    id: "workflow-persistence",
    command: "pnpm --filter @inkroute/db test -- db-integration workflow-persistence",
    artifact: "coverage/db-workflow-persistence-results.json",
    status: "database-gated"
  },
  {
    id: "audit-log-integration",
    command: "pnpm --filter @inkroute/db test -- db-integration audit-log",
    artifact: "coverage/db-audit-log-integration-results.json",
    status: "database-gated"
  },
  {
    id: "destructive-reset-guard",
    command: "prove destructive migrate/reset commands reject production connection strings",
    artifact: "coverage/db-destructive-reset-guard.json",
    status: "human-gated"
  },
  {
    id: "rollback-transcript-ci",
    command: "capture rollback notes, redacted command transcript, and CI DB artifact",
    artifact: "coverage/db-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export function buildDbIntegrationRunPersistenceContract(
  input: DbIntegrationRunPersistenceInput,
): DbIntegrationRunPersistenceContract {
  return {
    modelName: "DbIntegrationRun",
    row: input,
    transactionWrites: ["DbIntegrationRun", "AuditLog"],
    requiredDbFlags: [
      "nonProductionPostgresProvisioned",
      "databaseUrlConfigured",
      "directUrlConfigured",
      "prismaValidatePassed",
      "prismaGeneratePassed",
      "prismaMigratePassed",
      "prismaSeedPassed",
      "seedVerificationPassed",
      "tenantIsolationPassed",
      "workflowPersistencePassed",
      "auditLogIntegrationPassed",
      "destructiveResetGuarded",
      "rollbackDocumented",
    ],
    artifactFields: ["runtimeMatrix", "artifactManifest", "redactedTranscriptPath"],
    tenantIsolationKey: "tenantId",
  };
}

export function buildDbIntegrationRunData(input: DbIntegrationRunPersistenceInput): DbIntegrationRunData {
  return {
    ...input,
    commitSha: input.commitSha ?? null,
    redactedTranscriptPath: input.redactedTranscriptPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export function persistDbIntegrationRun(
  repository: DbIntegrationRunRepository,
  input: DbIntegrationRunPersistenceInput,
): unknown {
  const data = buildDbIntegrationRunData(input);

  return repository.dbIntegrationRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update: data,
  });
}

const dbIntegrationRuntimePackageReadiness = buildDbIntegrationRuntimeReadinessPlan({
  packageScripts: {
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
    "db:seed": "tsx prisma/seed.ts",
    "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs"
  },
  postgresProvisioned: false,
  databaseUrlConfigured: false,
  prismaValidatePassed: false,
  prismaGeneratePassed: false,
  prismaMigratePassed: false,
  prismaSeedPassed: false,
  seedVerificationPassed: false,
  tenantIsolationTestsPassed: false,
  workflowPersistenceTestsPassed: false,
  auditLogIntegrationTestsPassed: false,
  destructiveResetGuarded: false,
  migrationRollbackDocumented: false,
  commandOutputCaptured: false,
  ciDbJobPassed: false
});

export const dbIntegrationRuntimeReadiness = {
  ...dbIntegrationRuntimePackageReadiness,
  requiredCommands: dbIntegrationRuntimeCommands,
} as const;

export const dbIntegrationRunPersistencePreview = buildDbIntegrationRunPersistenceContract({
  tenantId: "tenant_demo",
  runId: "db-integration-demo",
  status: "database_gated",
  runtimeMatrix: dbIntegrationRuntimeMatrix,
  artifactManifest: dbIntegrationRuntimeArtifactPaths,
  nonProductionPostgresProvisioned: false,
  databaseUrlConfigured: false,
  directUrlConfigured: false,
  prismaValidatePassed: false,
  prismaGeneratePassed: false,
  prismaMigratePassed: false,
  prismaSeedPassed: false,
  seedVerificationPassed: false,
  tenantIsolationPassed: false,
  workflowPersistencePassed: false,
  auditLogIntegrationPassed: false,
  destructiveResetGuarded: false,
  rollbackDocumented: false,
  redactedTranscriptPath: "coverage/db-command-transcript-redacted.log",
});
