import { buildTenantIsolationRepositoryEvidencePlan, tenantOwnedModelNames } from "@inkroute/db";

export type TenantIsolationRuntimeStatus =
  | "wired"
  | "database-gated"
  | "repository-gated"
  | "denial-gated"
  | "audit-gated"
  | "ci-gated";

export interface TenantIsolationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: TenantIsolationRuntimeStatus;
}

export const tenantIsolationRuntimeCommands = [
  "pnpm --filter @inkroute/db typecheck",
  "pnpm --filter @inkroute/db test",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "tenant isolation repository integration suite",
  "cross-tenant read/write denial matrix",
  "tenant-scoped fixture cleanup proof",
  "GitHub Actions tenant isolation evidence job",
] as const;

export const tenantIsolationArtifactPaths = [
  "coverage/tenant-isolation-runtime.json",
  "coverage/tenant-isolation-db-typecheck.txt",
  "coverage/tenant-isolation-db-test.txt",
  "coverage/tenant-isolation-prisma-generate.txt",
  "coverage/tenant-isolation-prisma-migrate.txt",
  "coverage/tenant-isolation-db-seed.txt",
  "coverage/tenant-isolation-fixtures-redacted.json",
  "coverage/tenant-isolation-repository-helper-adoption.json",
  "coverage/tenant-isolation-model-coverage.json",
  "coverage/tenant-isolation-cross-tenant-read-denial.json",
  "coverage/tenant-isolation-cross-tenant-write-denial.json",
  "coverage/tenant-isolation-missing-tenant-write-rejection.json",
  "coverage/tenant-isolation-audit-rows-redacted.json",
  "coverage/tenant-isolation-fixture-cleanup.json",
  "coverage/tenant-isolation-database-evidence-redacted.json",
  "coverage/tenant-isolation-ci-evidence.json",
  "coverage/tenant-isolation-secret-safe-artifacts.json",
  "test-results/tenant-isolation-runtime",
] as const;

export const tenantIsolationRuntimeMatrix = [
  {
    id: "db-package-gates",
    command: "pnpm --filter @inkroute/db typecheck && pnpm --filter @inkroute/db test",
    artifact: "coverage/tenant-isolation-db-test.txt",
    status: "wired",
  },
  {
    id: "prisma-generate-migrate-seed",
    command: "pnpm --filter @inkroute/db db:generate && pnpm --filter @inkroute/db db:migrate && pnpm --filter @inkroute/db db:seed",
    artifact: "coverage/tenant-isolation-db-seed.txt",
    status: "database-gated",
  },
  {
    id: "seeded-multi-tenant-fixtures",
    command: "load seeded multi-tenant fixtures",
    artifact: "coverage/tenant-isolation-fixtures-redacted.json",
    status: "database-gated",
  },
  {
    id: "repository-helper-adoption",
    command: "tenant isolation repository integration suite",
    artifact: "coverage/tenant-isolation-repository-helper-adoption.json",
    status: "repository-gated",
  },
  {
    id: "tenant-owned-model-coverage",
    command: "cover every tenant-owned model in the isolation matrix",
    artifact: "coverage/tenant-isolation-model-coverage.json",
    status: "repository-gated",
  },
  {
    id: "cross-tenant-denial-matrix",
    command: "cross-tenant read/write denial matrix",
    artifact: "coverage/tenant-isolation-cross-tenant-read-denial.json",
    status: "denial-gated",
  },
  {
    id: "missing-tenant-write-rejection",
    command: "missing-tenant write rejection tests",
    artifact: "coverage/tenant-isolation-missing-tenant-write-rejection.json",
    status: "denial-gated",
  },
  {
    id: "audit-rows-and-fixture-cleanup",
    command: "tenant-scoped fixture cleanup proof",
    artifact: "coverage/tenant-isolation-audit-rows-redacted.json",
    status: "audit-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions tenant isolation evidence job",
    artifact: "coverage/tenant-isolation-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly TenantIsolationRuntimeMatrixEntry[];

export const tenantIsolationModelCoverage = tenantOwnedModelNames;

export const tenantIsolationRuntimeReadiness = buildTenantIsolationRepositoryEvidencePlan({
  packageScripts: ["test", "typecheck", "db:validate", "db:generate", "db:migrate", "db:seed"],
  dbTypecheckPassed: false,
  dbTestsPassed: false,
  prismaClientGenerated: false,
  migrationsApplied: false,
  seededMultiTenantFixturesLoaded: false,
  repositoryLayerImplemented: false,
  repositoryLayerUsesTenantHelpers: false,
  allTenantOwnedModelsCovered: false,
  crossTenantReadDenialPassed: false,
  crossTenantWriteDenialPassed: false,
  missingTenantWriteRejectionPassed: false,
  tenantScopedAuditRowsVerified: false,
  fixtureCleanupTenantScoped: false,
  databaseEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
