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
