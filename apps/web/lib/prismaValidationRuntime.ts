export type PrismaValidationRuntimeStatus = "ready" | "schema-gated" | "database-url-gated" | "migration-gated";

export interface PrismaValidationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: PrismaValidationRuntimeStatus;
}

export interface PrismaValidationRunPersistenceContract {
  readonly prismaModel: "PrismaValidationRun";
  readonly tenantRelation: "prismaValidationRuns";
  readonly migration: "20260609034200_add_prisma_validation_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesSchemaPath: true;
  readonly storesDatabaseUrlMode: true;
  readonly storesValidationStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesRelationNameEvidence: true;
  readonly storesManyToManyEvidence: true;
  readonly storesEnumCompatibilityEvidence: true;
  readonly storesGeneratedSqlEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const prismaValidationRunPersistenceContract = {
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
} as const satisfies PrismaValidationRunPersistenceContract;

export const prismaValidationRuntimeCommands = [
  "prisma validate --schema packages/db/prisma/schema.prisma",
  "Prisma relation-name compatibility review",
  "Prisma implicit many-to-many compatibility review",
  "Prisma enum/database compatibility review",
  "Prisma generated SQL safety review",
] as const;

export const prismaValidationArtifactPaths = [
  "coverage/prisma-validation-runtime.json",
  "coverage/prisma-validate-output.txt",
  "coverage/prisma-relation-name-review.json",
  "coverage/prisma-many-to-many-review.json",
  "coverage/prisma-enum-compatibility-review.json",
  "coverage/prisma-generated-sql-review-redacted.json",
  "coverage/prisma-validation-secret-safe-artifacts.json",
  "test-results/prisma-validation-runtime",
] as const;

export const prismaValidationRuntimeMatrix = [
  {
    id: "prisma-cli-validate",
    command: "prisma validate --schema packages/db/prisma/schema.prisma",
    artifact: "coverage/prisma-validate-output.txt",
    status: "database-url-gated",
  },
  {
    id: "relation-names-many-to-many",
    command: "Prisma relation-name compatibility review && Prisma implicit many-to-many compatibility review",
    artifact: "coverage/prisma-relation-name-review.json",
    status: "schema-gated",
  },
  {
    id: "enum-generated-sql-safety",
    command: "Prisma enum/database compatibility review && Prisma generated SQL safety review",
    artifact: "coverage/prisma-generated-sql-review-redacted.json",
    status: "migration-gated",
  },
] as const satisfies readonly PrismaValidationRuntimeMatrixEntry[];
