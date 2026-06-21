import { buildPrismaSchemaLifecycleReadinessPlan } from "@inkroute/db/integration-readiness";

export type PrismaLifecycleRuntimeStatus =
  | "wired"
  | "database-gated"
  | "migration-gated"
  | "ci-gated";

export interface PrismaLifecycleRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PrismaLifecycleRuntimeStatus;
}

export interface PrismaLifecycleRunPersistenceContract {
  readonly model: "PrismaLifecycleRun";
  readonly tenantRelation: "prismaLifecycleRuns";
  readonly migration: "20260609032600_add_prisma_lifecycle_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "packageScriptManifest",
    "artifactManifest",
    "sqlReviewManifest",
    "driftCheckManifest",
  ];
  readonly evidenceBooleans: readonly [
    "postgresProvisioned",
    "databaseUrlConfigured",
    "directUrlConfigured",
    "prismaValidatePassed",
    "prismaGeneratePassed",
    "migrationGenerated",
    "migrationSqlReviewed",
    "migrationAppliedToDevDb",
    "seedReadinessVerified",
    "seedScriptPassed",
    "destructiveProductionUrlGuarded",
    "migrationDriftChecked",
    "commandEvidenceCaptured",
    "ciEvidenceCaptured",
  ];
  readonly artifactFields: readonly [
    "validateArtifactPath",
    "generateArtifactPath",
    "migrateArtifactPath",
    "seedReadinessArtifactPath",
    "seedArtifactPath",
    "sqlReviewArtifactPath",
    "driftCheckArtifactPath",
    "productionUrlGuardArtifactPath",
    "ciDbLifecycleArtifactPath",
    "ciRunUrl",
  ];
}

export const prismaLifecycleRunPersistenceContract: PrismaLifecycleRunPersistenceContract = {
  model: "PrismaLifecycleRun",
  tenantRelation: "prismaLifecycleRuns",
  migration: "20260609032600_add_prisma_lifecycle_runs",
  jsonFields: [
    "commandMatrix",
    "packageScriptManifest",
    "artifactManifest",
    "sqlReviewManifest",
    "driftCheckManifest",
  ],
  evidenceBooleans: [
    "postgresProvisioned",
    "databaseUrlConfigured",
    "directUrlConfigured",
    "prismaValidatePassed",
    "prismaGeneratePassed",
    "migrationGenerated",
    "migrationSqlReviewed",
    "migrationAppliedToDevDb",
    "seedReadinessVerified",
    "seedScriptPassed",
    "destructiveProductionUrlGuarded",
    "migrationDriftChecked",
    "commandEvidenceCaptured",
    "ciEvidenceCaptured",
  ],
  artifactFields: [
    "validateArtifactPath",
    "generateArtifactPath",
    "migrateArtifactPath",
    "seedReadinessArtifactPath",
    "seedArtifactPath",
    "sqlReviewArtifactPath",
    "driftCheckArtifactPath",
    "productionUrlGuardArtifactPath",
    "ciDbLifecycleArtifactPath",
    "ciRunUrl",
  ],
};

export const prismaLifecycleCommands = [
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm db:verify-seed",
  "pnpm --filter @inkroute/db db:seed",
  "Prisma migration SQL review",
  "Prisma migration drift check",
  "prove destructive migrate/reset commands are guarded from production URLs",
  "GitHub Actions DB lifecycle evidence job",
] as const;

export const prismaLifecyclePackageScripts = [
  "db:validate",
  "db:generate",
  "db:migrate",
  "db:seed",
  "db:verify-seed",
] as const;

export const prismaLifecycleArtifactPaths = [
  "coverage/prisma-lifecycle-runtime.json",
  "coverage/prisma-validate-output.txt",
  "coverage/prisma-generate-output.txt",
  "coverage/prisma-migrate-output.txt",
  "coverage/prisma-seed-readiness-output.txt",
  "coverage/prisma-seed-output.txt",
  "coverage/prisma-migration-sql-review.json",
  "coverage/prisma-drift-check-output.txt",
  "coverage/prisma-production-url-guard.json",
  "coverage/prisma-db-lifecycle-ci-job.json",
  "test-results/prisma-lifecycle-runtime",
] as const;

export const prismaLifecycleProofFiles = [
  "apps/web/lib/prismaLifecycleRuntime.ts",
  "apps/web/tests/prisma-lifecycle-runtime-static.test.ts",
  "packages/db/package.json",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/seed.ts",
  "packages/db/src/integration-readiness.ts",
  "packages/db/tests/db-integration-plan.test.ts",
  "packages/db/prisma/migrations/20260609032600_add_prisma_lifecycle_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type PrismaLifecycleCommand = (typeof prismaLifecycleCommands)[number];
export type PrismaLifecyclePackageScript = (typeof prismaLifecyclePackageScripts)[number];
export type PrismaLifecycleArtifact = (typeof prismaLifecycleArtifactPaths)[number];

export interface PrismaLifecycleEvidenceInput {
  readonly postgresProvisioned: boolean;
  readonly databaseUrlConfigured: boolean;
  readonly directUrlConfigured: boolean;
  readonly prismaValidatePassed: boolean;
  readonly prismaGeneratePassed: boolean;
  readonly migrationGenerated: boolean;
  readonly migrationSqlReviewed: boolean;
  readonly migrationAppliedToDevDb: boolean;
  readonly seedReadinessVerified: boolean;
  readonly seedScriptPassed: boolean;
  readonly destructiveProductionUrlGuarded: boolean;
  readonly migrationDriftChecked: boolean;
  readonly commandEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly prismaLifecycleRunPersisted: boolean;
  readonly presentPackageScripts: readonly PrismaLifecyclePackageScript[];
  readonly capturedArtifacts: readonly PrismaLifecycleArtifact[];
  readonly completedCommands: readonly PrismaLifecycleCommand[];
}

export interface PrismaLifecycleRunRecordInput extends PrismaLifecycleEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly sqlReviewManifest?: readonly string[];
  readonly driftCheckManifest?: readonly string[];
  readonly validateArtifactPath?: string | null;
  readonly generateArtifactPath?: string | null;
  readonly migrateArtifactPath?: string | null;
  readonly seedReadinessArtifactPath?: string | null;
  readonly seedArtifactPath?: string | null;
  readonly sqlReviewArtifactPath?: string | null;
  readonly driftCheckArtifactPath?: string | null;
  readonly productionUrlGuardArtifactPath?: string | null;
  readonly ciDbLifecycleArtifactPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface PrismaLifecycleRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string | null;
  readonly status: string;
  readonly commandMatrix: readonly PrismaLifecycleRuntimeMatrixEntry[];
  readonly packageScriptManifest: readonly PrismaLifecyclePackageScript[];
  readonly artifactManifest: readonly PrismaLifecycleArtifact[];
  readonly sqlReviewManifest: readonly string[];
  readonly driftCheckManifest: readonly string[];
  readonly postgresProvisioned: boolean;
  readonly databaseUrlConfigured: boolean;
  readonly directUrlConfigured: boolean;
  readonly prismaValidatePassed: boolean;
  readonly prismaGeneratePassed: boolean;
  readonly migrationGenerated: boolean;
  readonly migrationSqlReviewed: boolean;
  readonly migrationAppliedToDevDb: boolean;
  readonly seedReadinessVerified: boolean;
  readonly seedScriptPassed: boolean;
  readonly destructiveProductionUrlGuarded: boolean;
  readonly migrationDriftChecked: boolean;
  readonly commandEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly validateArtifactPath: string | null;
  readonly generateArtifactPath: string | null;
  readonly migrateArtifactPath: string | null;
  readonly seedReadinessArtifactPath: string | null;
  readonly seedArtifactPath: string | null;
  readonly sqlReviewArtifactPath: string | null;
  readonly driftCheckArtifactPath: string | null;
  readonly productionUrlGuardArtifactPath: string | null;
  readonly ciDbLifecycleArtifactPath: string | null;
  readonly ciRunUrl: string | null;
}

export interface PrismaLifecycleRunRepository {
  readonly prismaLifecycleRun: {
    upsert(input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: PrismaLifecycleRunData;
      readonly update: Omit<PrismaLifecycleRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface PrismaLifecycleEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingPackageScripts: readonly PrismaLifecyclePackageScript[];
  readonly missingArtifacts: readonly PrismaLifecycleArtifact[];
  readonly missingCommands: readonly PrismaLifecycleCommand[];
  readonly requiredPackageScripts: readonly PrismaLifecyclePackageScript[];
  readonly requiredArtifacts: typeof prismaLifecycleArtifactPaths;
  readonly requiredCommands: typeof prismaLifecycleCommands;
  readonly requiredEvidence: typeof prismaLifecycleRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface PrismaLifecycleExecutionPolicy {
  readonly codexMayClassifyStaticPrismaReadiness: true;
  readonly nonProductionPostgresRequiredForClosure: true;
  readonly prismaLifecycleCommandsRequiredForClosure: true;
  readonly migrationSqlReviewRequiredForClosure: true;
  readonly migrationDriftCheckRequiredForClosure: true;
  readonly productionUrlGuardProofRequiredForClosure: true;
  readonly ciEvidenceRequiredForClosure: true;
  readonly providerPersistenceRequiredForClosure: true;
}

export interface PrismaLifecycleExecutionPlan {
  readonly localCommands: typeof prismaLifecycleCommands;
  readonly packageScripts: typeof prismaLifecyclePackageScripts;
  readonly artifactPaths: typeof prismaLifecycleArtifactPaths;
  readonly proofFiles: typeof prismaLifecycleProofFiles;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof prismaLifecycleExecutionPolicy;
  readonly requiredExternalEvidence: typeof prismaLifecycleRequiredExternalEvidence;
}

export const prismaLifecycleExecutionPolicy: PrismaLifecycleExecutionPolicy = {
  codexMayClassifyStaticPrismaReadiness: true,
  nonProductionPostgresRequiredForClosure: true,
  prismaLifecycleCommandsRequiredForClosure: true,
  migrationSqlReviewRequiredForClosure: true,
  migrationDriftCheckRequiredForClosure: true,
  productionUrlGuardProofRequiredForClosure: true,
  ciEvidenceRequiredForClosure: true,
  providerPersistenceRequiredForClosure: true,
};

export const prismaLifecycleRequiredExternalEvidence = [
  "Non-production Postgres provisioning plus redacted DATABASE_URL and DIRECT_URL configuration proof.",
  "Prisma validate, generate, migrate, and seed command output.",
  "Generated migration SQL review and migration drift-check output.",
  "Production URL destructive-command guard proof.",
  "GitHub Actions or clean-checkout Prisma lifecycle evidence.",
  "Provider-backed persistPrismaLifecycleRun execution evidence.",
] as const;

export function buildPrismaLifecycleExecutionPlan(): PrismaLifecycleExecutionPlan {
  return {
    localCommands: prismaLifecycleCommands,
    packageScripts: prismaLifecyclePackageScripts,
    artifactPaths: prismaLifecycleArtifactPaths,
    proofFiles: prismaLifecycleProofFiles,
    commandExecutionAllowed: false,
    databaseExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: prismaLifecycleExecutionPolicy,
    requiredExternalEvidence: prismaLifecycleRequiredExternalEvidence,
  };
}

export const prismaLifecycleRuntimeMatrix = [
  {
    id: "schema-validate",
    command: "pnpm --filter @inkroute/db db:validate",
    artifact: "coverage/prisma-validate-output.txt",
    status: "database-gated",
  },
  {
    id: "client-generate",
    command: "pnpm --filter @inkroute/db db:generate",
    artifact: "coverage/prisma-generate-output.txt",
    status: "database-gated",
  },
  {
    id: "migration-generate-apply",
    command: "pnpm --filter @inkroute/db db:migrate",
    artifact: "coverage/prisma-migrate-output.txt",
    status: "migration-gated",
  },
  {
    id: "seed-readiness",
    command: "pnpm db:verify-seed",
    artifact: "coverage/prisma-seed-readiness-output.txt",
    status: "wired",
  },
  {
    id: "seed-execution",
    command: "pnpm --filter @inkroute/db db:seed",
    artifact: "coverage/prisma-seed-output.txt",
    status: "database-gated",
  },
  {
    id: "migration-sql-review",
    command: "Prisma migration SQL review",
    artifact: "coverage/prisma-migration-sql-review.json",
    status: "migration-gated",
  },
  {
    id: "migration-drift-check",
    command: "Prisma migration drift check",
    artifact: "coverage/prisma-drift-check-output.txt",
    status: "migration-gated",
  },
  {
    id: "production-url-guard",
    command: "prove destructive migrate/reset commands are guarded from production URLs",
    artifact: "coverage/prisma-production-url-guard.json",
    status: "wired",
  },
  {
    id: "ci-db-lifecycle",
    command: "GitHub Actions DB lifecycle evidence job",
    artifact: "coverage/prisma-db-lifecycle-ci-job.json",
    status: "ci-gated",
  },
] as const satisfies readonly PrismaLifecycleRuntimeMatrixEntry[];

export const prismaLifecycleReadiness = buildPrismaSchemaLifecycleReadinessPlan({
  packageScripts: {
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
    "db:seed": "tsx prisma/seed.ts",
    "db:verify-seed": "tsx prisma/seed.ts --verify",
  },
  schemaModelsCount: 44,
  schemaEnumsCount: 36,
  minimumExpectedModels: 44,
  minimumExpectedEnums: 36,
  postgresProvisioned: false,
  databaseUrlConfigured: false,
  directUrlConfigured: false,
  prismaValidatePassed: false,
  prismaGeneratePassed: false,
  migrationGenerated: false,
  migrationSqlReviewed: false,
  migrationAppliedToDevDb: false,
  seedScriptPassed: false,
  seedReadinessVerified: false,
  destructiveProductionUrlGuarded: true,
  migrationDriftChecked: false,
  commandEvidenceCaptured: false,
  ciEvidenceCaptured: false,
});

export const prismaLifecycleReadinessRequiredEvidence = prismaLifecycleReadiness.requiredEvidence;

export function buildPrismaLifecycleDecisionRequiredEvidence(
  readinessEvidence: typeof prismaLifecycleReadinessRequiredEvidence,
): PrismaLifecycleRequiredEvidence {
  return [
    ...readinessEvidence,
    "PrismaLifecycleRun row with command, package script, artifact, SQL review, and drift check matrices.",
    "Artifact bundle proving non-production DB URLs, validate/generate/migrate, seed readiness, seed execution, SQL review, drift check, production URL guard, and CI evidence.",
  ];
}

export type PrismaLifecycleRequiredEvidence = readonly [
  ...typeof prismaLifecycleReadinessRequiredEvidence,
  "PrismaLifecycleRun row with command, package script, artifact, SQL review, and drift check matrices.",
  "Artifact bundle proving non-production DB URLs, validate/generate/migrate, seed readiness, seed execution, SQL review, drift check, production URL guard, and CI evidence.",
];

export const prismaLifecycleRequiredEvidence = buildPrismaLifecycleDecisionRequiredEvidence(
  prismaLifecycleReadinessRequiredEvidence,
);

export function buildPrismaLifecycleEvidenceDecision(
  input: PrismaLifecycleEvidenceInput,
): PrismaLifecycleEvidenceDecision {
  const presentPackageScripts = new Set(input.presentPackageScripts);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingPackageScripts = prismaLifecyclePackageScripts.filter((script) => !presentPackageScripts.has(script));
  const missingArtifacts = prismaLifecycleArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = prismaLifecycleCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildPrismaSchemaLifecycleReadinessPlan({
    packageScripts: Object.fromEntries(input.presentPackageScripts.map((script) => [script, script])),
    schemaModelsCount: 44,
    schemaEnumsCount: 36,
    minimumExpectedModels: 44,
    minimumExpectedEnums: 36,
    postgresProvisioned: input.postgresProvisioned,
    databaseUrlConfigured: input.databaseUrlConfigured,
    directUrlConfigured: input.directUrlConfigured,
    prismaValidatePassed: input.prismaValidatePassed,
    prismaGeneratePassed: input.prismaGeneratePassed,
    migrationGenerated: input.migrationGenerated,
    migrationSqlReviewed: input.migrationSqlReviewed,
    migrationAppliedToDevDb: input.migrationAppliedToDevDb,
    seedScriptPassed: input.seedScriptPassed,
    seedReadinessVerified: input.seedReadinessVerified,
    destructiveProductionUrlGuarded: input.destructiveProductionUrlGuarded,
    migrationDriftChecked: input.migrationDriftChecked,
    commandEvidenceCaptured: input.commandEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.prismaLifecycleRunPersisted) {
    blockers.push("PrismaLifecycleRun persistence row must be captured for durable auditability.");
  }
  if (missingPackageScripts.length > 0) {
    blockers.push("Every required Prisma lifecycle package script must be present.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required Prisma lifecycle artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required Prisma lifecycle command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingPackageScripts.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingPackageScripts,
    missingArtifacts,
    missingCommands,
    requiredPackageScripts: prismaLifecyclePackageScripts,
    requiredArtifacts: prismaLifecycleArtifactPaths,
    requiredCommands: prismaLifecycleCommands,
    requiredEvidence: prismaLifecycleRequiredEvidence,
    blockers,
  };
}

export function buildPrismaLifecycleRunData(input: PrismaLifecycleRunRecordInput): PrismaLifecycleRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: prismaLifecycleRuntimeMatrix,
    packageScriptManifest: input.presentPackageScripts,
    artifactManifest: input.capturedArtifacts,
    sqlReviewManifest: input.sqlReviewManifest ?? [
      "SQL review evidence is required before Prisma lifecycle closure.",
    ],
    driftCheckManifest: input.driftCheckManifest ?? [
      "Migration drift check evidence is required before Prisma lifecycle closure.",
    ],
    postgresProvisioned: input.postgresProvisioned,
    databaseUrlConfigured: input.databaseUrlConfigured,
    directUrlConfigured: input.directUrlConfigured,
    prismaValidatePassed: input.prismaValidatePassed,
    prismaGeneratePassed: input.prismaGeneratePassed,
    migrationGenerated: input.migrationGenerated,
    migrationSqlReviewed: input.migrationSqlReviewed,
    migrationAppliedToDevDb: input.migrationAppliedToDevDb,
    seedReadinessVerified: input.seedReadinessVerified,
    seedScriptPassed: input.seedScriptPassed,
    destructiveProductionUrlGuarded: input.destructiveProductionUrlGuarded,
    migrationDriftChecked: input.migrationDriftChecked,
    commandEvidenceCaptured: input.commandEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    validateArtifactPath: input.validateArtifactPath ?? null,
    generateArtifactPath: input.generateArtifactPath ?? null,
    migrateArtifactPath: input.migrateArtifactPath ?? null,
    seedReadinessArtifactPath: input.seedReadinessArtifactPath ?? null,
    seedArtifactPath: input.seedArtifactPath ?? null,
    sqlReviewArtifactPath: input.sqlReviewArtifactPath ?? null,
    driftCheckArtifactPath: input.driftCheckArtifactPath ?? null,
    productionUrlGuardArtifactPath: input.productionUrlGuardArtifactPath ?? null,
    ciDbLifecycleArtifactPath: input.ciDbLifecycleArtifactPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistPrismaLifecycleRun(
  repository: PrismaLifecycleRunRepository,
  input: PrismaLifecycleRunRecordInput,
): Promise<unknown> {
  const data = buildPrismaLifecycleRunData(input);
  const update = {
    commitSha: data.commitSha,
    status: data.status,
    commandMatrix: data.commandMatrix,
    packageScriptManifest: data.packageScriptManifest,
    artifactManifest: data.artifactManifest,
    sqlReviewManifest: data.sqlReviewManifest,
    driftCheckManifest: data.driftCheckManifest,
    postgresProvisioned: data.postgresProvisioned,
    databaseUrlConfigured: data.databaseUrlConfigured,
    directUrlConfigured: data.directUrlConfigured,
    prismaValidatePassed: data.prismaValidatePassed,
    prismaGeneratePassed: data.prismaGeneratePassed,
    migrationGenerated: data.migrationGenerated,
    migrationSqlReviewed: data.migrationSqlReviewed,
    migrationAppliedToDevDb: data.migrationAppliedToDevDb,
    seedReadinessVerified: data.seedReadinessVerified,
    seedScriptPassed: data.seedScriptPassed,
    destructiveProductionUrlGuarded: data.destructiveProductionUrlGuarded,
    migrationDriftChecked: data.migrationDriftChecked,
    commandEvidenceCaptured: data.commandEvidenceCaptured,
    ciEvidenceCaptured: data.ciEvidenceCaptured,
    validateArtifactPath: data.validateArtifactPath,
    generateArtifactPath: data.generateArtifactPath,
    migrateArtifactPath: data.migrateArtifactPath,
    seedReadinessArtifactPath: data.seedReadinessArtifactPath,
    seedArtifactPath: data.seedArtifactPath,
    sqlReviewArtifactPath: data.sqlReviewArtifactPath,
    driftCheckArtifactPath: data.driftCheckArtifactPath,
    productionUrlGuardArtifactPath: data.productionUrlGuardArtifactPath,
    ciDbLifecycleArtifactPath: data.ciDbLifecycleArtifactPath,
    ciRunUrl: data.ciRunUrl,
  };

  return repository.prismaLifecycleRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update,
  });
}

