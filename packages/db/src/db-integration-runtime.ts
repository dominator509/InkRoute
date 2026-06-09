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

export const dbIntegrationRuntimeCommands = [
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "pnpm --filter @inkroute/db db:verify-seed",
  "pnpm --filter @inkroute/db test -- db-integration"
] as const;

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

export const dbIntegrationRuntimeReadiness = buildDbIntegrationRuntimeReadinessPlan({
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
