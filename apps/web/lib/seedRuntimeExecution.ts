import { buildSeedRuntimeExecutionEvidencePlan } from "@inkroute/db/integration-readiness";

export type SeedRuntimeExecutionStatus =
  | "wired"
  | "database-gated"
  | "migration-gated"
  | "query-gated"
  | "smoke-gated"
  | "ci-gated";

export interface SeedRuntimeExecutionMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeedRuntimeExecutionStatus;
}

export const seedRuntimeExecutionCommands = [
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

export const seedRuntimeExecutionArtifactPaths = [
  "coverage/seed-runtime-execution.json",
  "coverage/seed-readiness-verifier-output.txt",
  "coverage/seed-fake-data-legal-placeholder-proof.json",
  "coverage/seed-production-provider-ban.json",
  "coverage/seed-postgres-provisioning-redacted.json",
  "coverage/seed-database-url-redacted.json",
  "coverage/seed-prisma-validate-output.txt",
  "coverage/seed-prisma-generate-output.txt",
  "coverage/seed-prisma-migrate-output.txt",
  "coverage/seed-command-output.txt",
  "coverage/seeded-tenant-query.json",
  "coverage/seeded-tenant-members-query.json",
  "coverage/seeded-booking-workflow-query.json",
  "coverage/seeded-payments-files-messages-query.json",
  "coverage/seeded-seo-release-flags-query.json",
  "coverage/seeded-audit-logs-query.json",
  "coverage/seed-web-api-smoke.json",
  "coverage/seed-dashboard-smoke.json",
  "coverage/seed-command-transcript-redacted.log",
  "coverage/seed-ci-clean-checkout-evidence.json",
  "test-results/seed-runtime-execution",
] as const;

export const seedRuntimeExecutionMatrix = [
  {
    id: "seed-readiness-safety",
    command: "pnpm db:verify-seed",
    artifact: "coverage/seed-readiness-verifier-output.txt",
    status: "wired",
  },
  {
    id: "non-production-postgres-url",
    command: "provision non-production Postgres and configure DATABASE_URL",
    artifact: "coverage/seed-postgres-provisioning-redacted.json",
    status: "database-gated",
  },
  {
    id: "prisma-generate-migrate",
    command: "pnpm --filter @inkroute/db db:generate && pnpm --filter @inkroute/db db:migrate",
    artifact: "coverage/seed-prisma-migrate-output.txt",
    status: "migration-gated",
  },
  {
    id: "seed-command",
    command: "pnpm --filter @inkroute/db db:seed",
    artifact: "coverage/seed-command-output.txt",
    status: "database-gated",
  },
  {
    id: "seeded-core-domain-queries",
    command: "seeded demo tenant query smoke",
    artifact: "coverage/seeded-tenant-query.json",
    status: "query-gated",
  },
  {
    id: "seeded-workflow-payment-message-seo-release-queries",
    command: "seeded workflow, payment, file, message, SEO, release, flag, and audit query smoke",
    artifact: "coverage/seeded-payments-files-messages-query.json",
    status: "query-gated",
  },
  {
    id: "web-dashboard-seeded-data-smoke",
    command: "web/API seeded-data smoke && dashboard seeded-data smoke",
    artifact: "coverage/seed-web-api-smoke.json",
    status: "smoke-gated",
  },
  {
    id: "command-ci-clean-checkout-evidence",
    command: "GitHub Actions seed execution evidence job",
    artifact: "coverage/seed-ci-clean-checkout-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly SeedRuntimeExecutionMatrixEntry[];

export const seedRuntimeExecutionReadiness = buildSeedRuntimeExecutionEvidencePlan({
  packageScripts: {
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
    "db:seed": "tsx prisma/seed.ts",
    "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs",
  },
  seedReadinessVerifierPassed: false,
  postgresProvisioned: false,
  databaseUrlConfigured: false,
  prismaClientGenerated: false,
  migrationApplied: false,
  seedCommandPassed: false,
  seededTenantFound: false,
  seededTenantMembersFound: false,
  seededBookingWorkflowFound: false,
  seededPaymentsFilesMessagesFound: false,
  seededSeoReleaseFlagsFound: false,
  auditLogsCreated: false,
  fakeDataOnlyVerified: false,
  noProductionProviderCredentialsUsed: false,
  webApiSeededDataSmokePassed: false,
  dashboardSeededDataSmokePassed: false,
  commandEvidenceCaptured: false,
  ciOrCleanCheckoutEvidenceCaptured: false,
});
