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


export interface TenantIsolationRunPersistenceContract {
  readonly prismaModel: "TenantIsolationRun";
  readonly tenantRelation: "tenantIsolationRuns";
  readonly migration: "20260609034400_add_tenant_isolation_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDatabaseLifecycleEvidence: true;
  readonly storesRepositoryAdoptionEvidence: true;
  readonly storesTenantOwnedModelCoverage: true;
  readonly storesCrossTenantDenialEvidence: true;
  readonly storesMissingTenantRejectionEvidence: true;
  readonly storesAuditRowEvidence: true;
  readonly storesFixtureCleanupEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const tenantIsolationRunPersistenceContract = {
  prismaModel: "TenantIsolationRun",
  tenantRelation: "tenantIsolationRuns",
  migration: "20260609034400_add_tenant_isolation_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDatabaseLifecycleEvidence: true,
  storesRepositoryAdoptionEvidence: true,
  storesTenantOwnedModelCoverage: true,
  storesCrossTenantDenialEvidence: true,
  storesMissingTenantRejectionEvidence: true,
  storesAuditRowEvidence: true,
  storesFixtureCleanupEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies TenantIsolationRunPersistenceContract;

export interface TenantIsolationRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: TenantIsolationEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly databaseLifecycleEvidenceCaptured: boolean;
  readonly repositoryAdoptionEvidenceCaptured: boolean;
  readonly tenantOwnedModelCoverageCaptured: boolean;
  readonly crossTenantDenialEvidenceCaptured: boolean;
  readonly missingTenantRejectionEvidenceCaptured: boolean;
  readonly auditRowEvidenceCaptured: boolean;
  readonly fixtureCleanupEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly modelCoverageReportPath?: string | null;
  readonly denialMatrixReportPath?: string | null;
}

export interface TenantIsolationRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: TenantIsolationEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly databaseLifecycleEvidenceCaptured: boolean;
  readonly repositoryAdoptionEvidenceCaptured: boolean;
  readonly tenantOwnedModelCoverageCaptured: boolean;
  readonly crossTenantDenialEvidenceCaptured: boolean;
  readonly missingTenantRejectionEvidenceCaptured: boolean;
  readonly auditRowEvidenceCaptured: boolean;
  readonly fixtureCleanupEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly modelCoverageReportPath: string | null;
  readonly denialMatrixReportPath: string | null;
}

export interface TenantIsolationRunRepository {
  readonly tenantIsolationRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: TenantIsolationRunData;
      readonly update: Omit<TenantIsolationRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildTenantIsolationRunData(input: TenantIsolationRunRecordInput): TenantIsolationRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? tenantIsolationRuntimeCommands,
    artifactManifest: input.artifacts ?? tenantIsolationArtifactPaths,
    databaseLifecycleEvidenceCaptured: input.databaseLifecycleEvidenceCaptured,
    repositoryAdoptionEvidenceCaptured: input.repositoryAdoptionEvidenceCaptured,
    tenantOwnedModelCoverageCaptured: input.tenantOwnedModelCoverageCaptured,
    crossTenantDenialEvidenceCaptured: input.crossTenantDenialEvidenceCaptured,
    missingTenantRejectionEvidenceCaptured: input.missingTenantRejectionEvidenceCaptured,
    auditRowEvidenceCaptured: input.auditRowEvidenceCaptured,
    fixtureCleanupEvidenceCaptured: input.fixtureCleanupEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    modelCoverageReportPath: input.modelCoverageReportPath ?? null,
    denialMatrixReportPath: input.denialMatrixReportPath ?? null,
  };
}

export async function persistTenantIsolationRun(
  repository: TenantIsolationRunRepository,
  input: TenantIsolationRunRecordInput,
): Promise<unknown> {
  const data = buildTenantIsolationRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.tenantIsolationRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
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

export type TenantIsolationArtifact = (typeof tenantIsolationArtifactPaths)[number];
export type TenantIsolationExecutionArtifact =
  | TenantIsolationArtifact
  | "provider-backed TenantIsolationRun persistence proof";

export const tenantIsolationLocalArtifacts = [
  "coverage/tenant-isolation-runtime.json",
  "coverage/tenant-isolation-db-typecheck.txt",
  "coverage/tenant-isolation-db-test.txt",
] as const satisfies readonly TenantIsolationExecutionArtifact[];

export const tenantIsolationExternalArtifacts = [
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
  "provider-backed TenantIsolationRun persistence proof",
] as const satisfies readonly TenantIsolationExecutionArtifact[];

export const tenantIsolationRuntimeProofFiles = [
  "packages/db/package.json",
  "packages/db/src/tenant-scope.ts",
  "packages/db/tests/tenant-scope.test.ts",
  "packages/db/prisma/tenant-isolation-contract.json",
  "docs/db/TENANT_ISOLATION.md",
  "testing/manifests/db-integration-test-manifest.json",
  "apps/web/lib/tenantIsolationRuntime.ts",
  "apps/web/tests/tenant-isolation-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034400_add_tenant_isolation_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const tenantIsolationRuntimeControls = [
  "use-tenant-scope-helpers-for-every-tenant-owned-read-write-path",
  "reject-missing-or-mismatched-tenant-id-before-database-mutations",
  "persist-audit-rows-with-tenant-and-actor-metadata",
  "cleanup-only-seeded-test-tenants-and-redact-database-artifacts",
] as const;

export const tenantIsolationEvidenceFlags = [
  "dbTypecheckPassed",
  "dbTestsPassed",
  "prismaClientGenerated",
  "migrationsApplied",
  "seededMultiTenantFixturesLoaded",
  "repositoryLayerImplemented",
  "repositoryLayerUsesTenantHelpers",
  "allTenantOwnedModelsCovered",
  "crossTenantReadDenialPassed",
  "crossTenantWriteDenialPassed",
  "missingTenantWriteRejectionPassed",
  "tenantScopedAuditRowsVerified",
  "fixtureCleanupTenantScoped",
  "databaseEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type TenantIsolationEvidenceFlag = (typeof tenantIsolationEvidenceFlags)[number];

export interface TenantIsolationEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<TenantIsolationEvidenceFlag, boolean>>;
}

export interface TenantIsolationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly TenantIsolationEvidenceFlag[];
  readonly requiredCommands: typeof tenantIsolationRuntimeCommands;
  readonly requiredArtifacts: typeof tenantIsolationArtifactPaths;
  readonly requiredControls: typeof tenantIsolationRuntimeControls;
  readonly requiredEvidence: typeof tenantIsolationEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface TenantIsolationExecutionPlan {
  readonly localCommands: typeof tenantIsolationLocalCommands;
  readonly externalCommands: typeof tenantIsolationExternalCommands;
  readonly localArtifacts: typeof tenantIsolationLocalArtifacts;
  readonly externalArtifacts: typeof tenantIsolationExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof tenantIsolationExecutionPolicy;
  readonly requiredExternalEvidence: typeof tenantIsolationRequiredExternalEvidence;
}

export interface TenantIsolationArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof tenantIsolationRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const tenantIsolationLocalCommands = [
  "pnpm --filter @inkroute/db typecheck",
  "pnpm --filter @inkroute/db test",
] as const;

export const tenantIsolationExternalCommands = [
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "tenant isolation repository integration suite",
  "cross-tenant read/write denial matrix",
  "tenant-scoped fixture cleanup proof",
  "GitHub Actions tenant isolation evidence job",
  "provider-backed persistTenantIsolationRun execution proof",
] as const;

const tenantIsolationEvidenceBlockers: Record<TenantIsolationEvidenceFlag, string> = {
  dbTypecheckPassed: "DB package typecheck must pass.",
  dbTestsPassed: "DB package tests must pass.",
  prismaClientGenerated: "Prisma Client must be generated before tenant isolation integration proof.",
  migrationsApplied: "Migrations must be applied before tenant isolation integration proof.",
  seededMultiTenantFixturesLoaded: "Seeded multi-tenant fixtures must be loaded.",
  repositoryLayerImplemented: "Tenant-scoped repository/service adoption evidence must be captured before tenant isolation readiness.",
  repositoryLayerUsesTenantHelpers: "Repository/service layer must use tenant scope helpers.",
  allTenantOwnedModelsCovered: "Every tenant-owned model must be covered in the isolation matrix.",
  crossTenantReadDenialPassed: "Cross-tenant read denial tests must pass for tenant-owned reads.",
  crossTenantWriteDenialPassed: "Cross-tenant write denial tests must pass for tenant-owned mutations.",
  missingTenantWriteRejectionPassed: "Missing-tenant write rejection tests must pass before persistence.",
  tenantScopedAuditRowsVerified: "Tenant-scoped audit row metadata must be verified.",
  fixtureCleanupTenantScoped: "Fixture cleanup must be tenant-scoped and test-only.",
  databaseEvidenceCaptured: "Redacted database evidence must be captured.",
  ciEvidenceCaptured: "CI tenant isolation evidence must be captured.",
  secretSafeArtifactsCaptured: "Tenant isolation artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

export const tenantIsolationExecutionPolicy = {
  codexMayClassifyStaticTenantIsolationReadiness: true,
  seededDatabaseRequiredForClosure: true,
  tenantOwnedModelCoverageRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const tenantIsolationRequiredExternalEvidence = [
  "Prisma generate, migrate, seed, and seeded multi-tenant fixture evidence.",
  "Tenant-scoped repository/helper adoption evidence across every tenant-owned model.",
  "Cross-tenant read/write denial and missing-tenant write rejection evidence.",
  "Tenant-scoped AuditLog metadata and fixture cleanup evidence.",
  "Provider-backed TenantIsolationRun persistence row captured through persistTenantIsolationRun.",
  "Redacted database, CI, and secret-safe tenant isolation artifacts.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveTenantIsolationKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|tenant|user|client|actor|entity|database|postgres|url|uri|dsn|key|id|payload|artifact|audit|fixture)/iu;
const sensitiveTenantIsolationValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedTenantIsolationValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedTenantIsolationValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveTenantIsolationKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedTenantIsolationValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveTenantIsolationValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildTenantIsolationExecutionPlan(): TenantIsolationExecutionPlan {
  return {
    localCommands: tenantIsolationLocalCommands,
    externalCommands: tenantIsolationExternalCommands,
    localArtifacts: tenantIsolationLocalArtifacts,
    externalArtifacts: tenantIsolationExternalArtifacts,
    commandExecutionAllowed: false,
    databaseExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: tenantIsolationExecutionPolicy,
    requiredExternalEvidence: tenantIsolationRequiredExternalEvidence,
  };
}

export function buildRedactedTenantIsolationArtifact(artifact: unknown): unknown {
  return buildRedactedTenantIsolationValue(artifact, "", []);
}

export function buildTenantIsolationArtifactReview(artifact: unknown): TenantIsolationArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedTenantIsolationValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: tenantIsolationRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildTenantIsolationEvidenceDecision = (
  input: TenantIsolationEvidenceInput,
): TenantIsolationEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, tenantIsolationRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, tenantIsolationArtifactPaths);
  const missingControls = missingFrom(input.controls, tenantIsolationRuntimeControls);
  const missingEvidence = tenantIsolationEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => tenantIsolationEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: tenantIsolationRuntimeCommands,
    requiredArtifacts: tenantIsolationArtifactPaths,
    requiredControls: tenantIsolationRuntimeControls,
    requiredEvidence: tenantIsolationEvidenceFlags,
    blockers,
  };
};

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



