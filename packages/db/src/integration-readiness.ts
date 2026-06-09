export interface DbIntegrationRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  postgresProvisioned: boolean;
  databaseUrlConfigured: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  prismaMigratePassed: boolean;
  prismaSeedPassed: boolean;
  seedVerificationPassed: boolean;
  tenantIsolationTestsPassed: boolean;
  workflowPersistenceTestsPassed: boolean;
  auditLogIntegrationTestsPassed: boolean;
  destructiveResetGuarded: boolean;
  migrationRollbackDocumented: boolean;
  commandOutputCaptured: boolean;
  ciDbJobPassed: boolean;
}

export interface DbIntegrationRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export function buildDbIntegrationRuntimeReadinessPlan(
  input: DbIntegrationRuntimeReadinessInput,
): DbIntegrationRuntimeReadinessPlan {
  const requiredScripts = ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/db package script is missing ${script}.`);
  if (!input.postgresProvisioned) blockers.push("A non-production Postgres database must be provisioned for integration tests.");
  if (!input.databaseUrlConfigured) blockers.push("DATABASE_URL and migration connection settings must target non-production Postgres fixtures.");
  if (!input.prismaValidatePassed) blockers.push("Prisma schema validation must pass against the current schema.");
  if (!input.prismaGeneratePassed) blockers.push("Prisma client generation must pass for the current schema.");
  if (!input.prismaMigratePassed) blockers.push("Prisma migration execution must pass against the integration database.");
  if (!input.prismaSeedPassed) blockers.push("Prisma seed execution must populate the integration database.");
  if (!input.seedVerificationPassed) blockers.push("Seed verification must prove required tenants, users, workflows, files, payments, messages, releases, SEO, and audit data exist.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Tenant-isolation integration tests must deny cross-tenant reads and writes across critical models.");
  if (!input.workflowPersistenceTestsPassed) blockers.push("Workflow persistence tests must prove booking, appointment, payment, file, message, notification, SEO, release, and feature-flag records persist correctly.");
  if (!input.auditLogIntegrationTestsPassed) blockers.push("Audit-log integration tests must prove tenant-scoped actor, entity, action, and metadata writes.");
  if (!input.destructiveResetGuarded) blockers.push("Destructive reset/migrate commands must be guarded against production connection strings.");
  if (!input.migrationRollbackDocumented) blockers.push("Migration rollback and restore procedure must be documented before DB integration closure.");
  if (!input.commandOutputCaptured) blockers.push("Command output for validate, generate, migrate, seed, verify, and integration tests must be captured.");
  if (!input.ciDbJobPassed) blockers.push("CI database integration job must pass or publish an explicit non-production DB evidence artifact.");

  if (!input.postgresProvisioned || !input.databaseUrlConfigured || !input.destructiveResetGuarded) {
    requiredEvidence.push("non-production Postgres provisioning, DATABASE_URL configuration, and destructive-reset guard proof");
  }
  if (!input.prismaValidatePassed || !input.prismaGeneratePassed || !input.prismaMigratePassed || !input.prismaSeedPassed || !input.seedVerificationPassed) {
    requiredEvidence.push("Prisma validate/generate/migrate/seed/verify command output");
  }
  if (!input.tenantIsolationTestsPassed || !input.workflowPersistenceTestsPassed || !input.auditLogIntegrationTestsPassed) {
    requiredEvidence.push("tenant isolation, workflow persistence, and audit-log integration test output");
  }
  if (!input.migrationRollbackDocumented || !input.commandOutputCaptured || !input.ciDbJobPassed) {
    requiredEvidence.push("migration rollback notes, captured command transcript, and CI DB job artifact");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/db db:validate",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "pnpm --filter @inkroute/db db:verify-seed",
      "pnpm --filter @inkroute/db test -- db-integration",
    ],
    requiredEvidence,
    blockers,
  };
}
