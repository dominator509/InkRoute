export const dbIntegrationRuntimeReadinessCommands = [
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "pnpm --filter @inkroute/db db:verify-seed",
  "pnpm --filter @inkroute/db test -- db-integration",
] as const;

export const prismaSchemaLifecycleReadinessCommands = [
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

export const prismaSchemaLifecycleReadinessEvidence = [
  "Phase 2 schema model/enum coverage remains intact.",
  "Non-production Postgres provisioning plus DATABASE_URL and DIRECT_URL configuration proof.",
  "Prisma validate/generate/migrate command output.",
  "Generated migration SQL review notes and drift-check output.",
  "Seed readiness and seed execution output using fake/demo data only.",
  "Production URL destructive-command guard proof.",
  "CI or clean-checkout Prisma lifecycle evidence.",
] as const;

export type PrismaSchemaLifecycleReadinessEvidence =
  (typeof prismaSchemaLifecycleReadinessEvidence)[number];

export const dbIntegrationRuntimeReadinessEvidence = [
  "non-production Postgres provisioning, DATABASE_URL configuration, and destructive-reset guard proof",
  "Prisma validate/generate/migrate/seed/verify command output",
  "tenant isolation, workflow persistence, and audit-log integration test output",
  "migration rollback notes, captured command transcript, and CI DB job artifact",
] as const;

export type DbIntegrationRuntimeReadinessEvidence =
  (typeof dbIntegrationRuntimeReadinessEvidence)[number];

export const seedRuntimeExecutionEvidenceCommands = [
  "pnpm db:verify-seed",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "seeded demo tenant query smoke",
  "web/API seeded-data smoke",
  "dashboard seeded-data smoke",
  "GitHub Actions seed execution evidence job",
] as const;

export const seedRuntimeExecutionRequiredEvidence = [
  "seed readiness, fake-data, legal-placeholder, and production-provider ban evidence",
  "non-production Postgres, DATABASE_URL, Prisma generate, migration, and seed command evidence",
  "seeded tenant, membership, workflow, payment/file/message, SEO/release/flag, and audit-log query evidence",
  "web/API and dashboard seeded-data smoke evidence",
  "captured command transcript and CI or clean-checkout seed evidence",
] as const;

export type SeedRuntimeExecutionRequiredEvidence =
  (typeof seedRuntimeExecutionRequiredEvidence)[number];

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
  requiredCommands: typeof dbIntegrationRuntimeReadinessCommands;
  requiredEvidence: readonly DbIntegrationRuntimeReadinessEvidence[];
  blockers: readonly string[];
}

export interface PrismaSchemaLifecycleReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  schemaModelsCount: number;
  schemaEnumsCount: number;
  minimumExpectedModels: number;
  minimumExpectedEnums: number;
  postgresProvisioned: boolean;
  databaseUrlConfigured: boolean;
  directUrlConfigured: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  migrationGenerated: boolean;
  migrationSqlReviewed: boolean;
  migrationAppliedToDevDb: boolean;
  seedScriptPassed: boolean;
  seedReadinessVerified: boolean;
  destructiveProductionUrlGuarded: boolean;
  migrationDriftChecked: boolean;
  commandEvidenceCaptured: boolean;
  ciEvidenceCaptured: boolean;
}

export interface PrismaSchemaLifecycleReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  schemaCoverageStatus: "pass" | "blocked";
  requiredCommands: typeof prismaSchemaLifecycleReadinessCommands;
  requiredEvidence: typeof prismaSchemaLifecycleReadinessEvidence;
  blockers: readonly string[];
}

export interface SeedRuntimeExecutionEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  seedReadinessVerifierPassed: boolean;
  postgresProvisioned: boolean;
  databaseUrlConfigured: boolean;
  prismaClientGenerated: boolean;
  migrationApplied: boolean;
  seedCommandPassed: boolean;
  seededTenantFound: boolean;
  seededTenantMembersFound: boolean;
  seededBookingWorkflowFound: boolean;
  seededPaymentsFilesMessagesFound: boolean;
  seededSeoReleaseFlagsFound: boolean;
  auditLogsCreated: boolean;
  fakeDataOnlyVerified: boolean;
  noProductionProviderCredentialsUsed: boolean;
  webApiSeededDataSmokePassed: boolean;
  dashboardSeededDataSmokePassed: boolean;
  commandEvidenceCaptured: boolean;
  ciOrCleanCheckoutEvidenceCaptured: boolean;
}

export interface SeedRuntimeExecutionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof seedRuntimeExecutionEvidenceCommands;
  requiredEvidence: readonly SeedRuntimeExecutionRequiredEvidence[];
  blockers: readonly string[];
}

export function buildDbIntegrationRuntimeReadinessPlan(
  input: DbIntegrationRuntimeReadinessInput,
): DbIntegrationRuntimeReadinessPlan {
  const requiredScripts = ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: DbIntegrationRuntimeReadinessEvidence[] = [];

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
    requiredEvidence.push(dbIntegrationRuntimeReadinessEvidence[0]);
  }
  if (!input.prismaValidatePassed || !input.prismaGeneratePassed || !input.prismaMigratePassed || !input.prismaSeedPassed || !input.seedVerificationPassed) {
    requiredEvidence.push(dbIntegrationRuntimeReadinessEvidence[1]);
  }
  if (!input.tenantIsolationTestsPassed || !input.workflowPersistenceTestsPassed || !input.auditLogIntegrationTestsPassed) {
    requiredEvidence.push(dbIntegrationRuntimeReadinessEvidence[2]);
  }
  if (!input.migrationRollbackDocumented || !input.commandOutputCaptured || !input.ciDbJobPassed) {
    requiredEvidence.push(dbIntegrationRuntimeReadinessEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: dbIntegrationRuntimeReadinessCommands,
    requiredEvidence:
      requiredEvidence.length === dbIntegrationRuntimeReadinessEvidence.length
        ? dbIntegrationRuntimeReadinessEvidence
        : requiredEvidence,
    blockers,
  };
}

export function buildPrismaSchemaLifecycleReadinessPlan(
  input: PrismaSchemaLifecycleReadinessInput,
): PrismaSchemaLifecycleReadinessPlan {
  const requiredScripts = ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];

  const schemaCoverageStatus =
    input.schemaModelsCount >= input.minimumExpectedModels && input.schemaEnumsCount >= input.minimumExpectedEnums ? "pass" : "blocked";

  for (const script of missingScripts) blockers.push(`@inkroute/db package script is missing ${script}.`);
  if (schemaCoverageStatus !== "pass") {
    blockers.push("Prisma schema must retain the expected Phase 2 model and enum coverage before migration evidence can close.");
  }
  if (!input.postgresProvisioned) blockers.push("A non-production Postgres database must be provisioned.");
  if (!input.databaseUrlConfigured) blockers.push("DATABASE_URL must target a non-production Postgres database.");
  if (!input.directUrlConfigured) blockers.push("DIRECT_URL must be configured for Prisma migrations when required by the provider.");
  if (!input.prismaValidatePassed) blockers.push("Prisma schema validation must pass.");
  if (!input.prismaGeneratePassed) blockers.push("Prisma Client generation must pass.");
  if (!input.migrationGenerated) blockers.push("A Prisma migration must be generated from the current schema.");
  if (!input.migrationSqlReviewed) blockers.push("Generated migration SQL must be reviewed before applying to shared environments.");
  if (!input.migrationAppliedToDevDb) blockers.push("Generated migration must apply cleanly to a non-production development database.");
  if (!input.seedScriptPassed) blockers.push("Prisma seed script must execute against the migrated development database.");
  if (!input.seedReadinessVerified) blockers.push("Seed readiness verifier must pass before seed execution is trusted.");
  if (!input.destructiveProductionUrlGuarded) blockers.push("Destructive migrate/reset commands must be guarded from production URLs.");
  if (!input.migrationDriftChecked) blockers.push("Migration drift must be checked after applying migrations.");
  if (!input.commandEvidenceCaptured) blockers.push("Command evidence for validate, generate, migrate, review, seed, and drift checks must be captured.");
  if (!input.ciEvidenceCaptured) blockers.push("CI or clean-checkout evidence for the Prisma lifecycle must be captured.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    schemaCoverageStatus,
    requiredCommands: prismaSchemaLifecycleReadinessCommands,
    requiredEvidence: prismaSchemaLifecycleReadinessEvidence,
    blockers,
  };
}

export function buildSeedRuntimeExecutionEvidencePlan(
  input: SeedRuntimeExecutionEvidenceInput,
): SeedRuntimeExecutionEvidencePlan {
  const requiredScripts = ["db:validate", "db:generate", "db:migrate", "db:seed", "db:verify-seed"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: SeedRuntimeExecutionRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/db package script is missing ${script}.`);
  if (!input.seedReadinessVerifierPassed) blockers.push("Seed readiness verifier must pass before runtime seed execution.");
  if (!input.postgresProvisioned) blockers.push("A non-production Postgres database must be provisioned for seed execution.");
  if (!input.databaseUrlConfigured) blockers.push("DATABASE_URL must target the non-production seed database.");
  if (!input.prismaClientGenerated) blockers.push("Prisma Client must be generated before seed execution.");
  if (!input.migrationApplied) blockers.push("Current Prisma migration must apply before seed execution.");
  if (!input.seedCommandPassed) blockers.push("pnpm --filter @inkroute/db db:seed must pass.");
  if (!input.seededTenantFound) blockers.push("Seeded demo tenant must be readable after seed execution.");
  if (!input.seededTenantMembersFound) blockers.push("Seeded demo tenant members must be readable after seed execution.");
  if (!input.seededBookingWorkflowFound) blockers.push("Seeded booking, appointment, and lifecycle workflow records must be readable.");
  if (!input.seededPaymentsFilesMessagesFound) blockers.push("Seeded payment, file, message, notification, and consent records must be readable.");
  if (!input.seededSeoReleaseFlagsFound) blockers.push("Seeded SEO, release, and feature-flag records must be readable.");
  if (!input.auditLogsCreated) blockers.push("Seed execution must create audit-log records for demo setup.");
  if (!input.fakeDataOnlyVerified) blockers.push("Seeded data must be verified as fake/demo-only with legal placeholder language.");
  if (!input.noProductionProviderCredentialsUsed) blockers.push("Seed execution must not use production provider credentials or live provider endpoints.");
  if (!input.webApiSeededDataSmokePassed) blockers.push("Web/API smoke must read seeded demo records.");
  if (!input.dashboardSeededDataSmokePassed) blockers.push("Dashboard smoke must read seeded demo records.");
  if (!input.commandEvidenceCaptured) blockers.push("Seed command transcript and seeded-record query evidence must be captured.");
  if (!input.ciOrCleanCheckoutEvidenceCaptured) blockers.push("CI or clean-checkout seed execution evidence must be captured.");

  if (!input.seedReadinessVerifierPassed || !input.fakeDataOnlyVerified || !input.noProductionProviderCredentialsUsed) {
    requiredEvidence.push(seedRuntimeExecutionRequiredEvidence[0]);
  }
  if (!input.postgresProvisioned || !input.databaseUrlConfigured || !input.prismaClientGenerated || !input.migrationApplied || !input.seedCommandPassed) {
    requiredEvidence.push(seedRuntimeExecutionRequiredEvidence[1]);
  }
  if (!input.seededTenantFound || !input.seededTenantMembersFound || !input.seededBookingWorkflowFound || !input.seededPaymentsFilesMessagesFound || !input.seededSeoReleaseFlagsFound || !input.auditLogsCreated) {
    requiredEvidence.push(seedRuntimeExecutionRequiredEvidence[2]);
  }
  if (!input.webApiSeededDataSmokePassed || !input.dashboardSeededDataSmokePassed) {
    requiredEvidence.push(seedRuntimeExecutionRequiredEvidence[3]);
  }
  if (!input.commandEvidenceCaptured || !input.ciOrCleanCheckoutEvidenceCaptured) {
    requiredEvidence.push(seedRuntimeExecutionRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: seedRuntimeExecutionEvidenceCommands,
    requiredEvidence,
    blockers,
  };
}
