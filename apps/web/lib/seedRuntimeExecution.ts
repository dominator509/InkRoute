import { buildSeedRuntimeExecutionEvidencePlan } from "@inkroute/db";

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


export interface SeedRuntimeExecutionRunPersistenceContract {
  readonly prismaModel: "SeedRuntimeExecutionRun";
  readonly tenantRelation: "seedRuntimeExecutionRuns";
  readonly migration: "20260609034100_add_seed_runtime_execution_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDatabaseProvisioningEvidence: true;
  readonly storesPrismaLifecycleEvidence: true;
  readonly storesSeedCommandEvidence: true;
  readonly storesSeededDomainQueryEvidence: true;
  readonly storesAppSmokeEvidence: true;
  readonly storesCommandTranscriptEvidence: true;
  readonly storesCiCleanCheckoutEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const seedRuntimeExecutionRunPersistenceContract = {
  prismaModel: "SeedRuntimeExecutionRun",
  tenantRelation: "seedRuntimeExecutionRuns",
  migration: "20260609034100_add_seed_runtime_execution_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDatabaseProvisioningEvidence: true,
  storesPrismaLifecycleEvidence: true,
  storesSeedCommandEvidence: true,
  storesSeededDomainQueryEvidence: true,
  storesAppSmokeEvidence: true,
  storesCommandTranscriptEvidence: true,
  storesCiCleanCheckoutEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies SeedRuntimeExecutionRunPersistenceContract;

export const seedRuntimeExecutionCommands = [
  "pnpm db:verify-seed",
  "pnpm db:seed-runtime-evidence",
  "provision non-production Postgres and configure DATABASE_URL",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "seeded demo tenant query smoke",
  "seeded workflow, payment, file, message, SEO, release, flag, and audit query smoke",
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

export const seedRuntimeExecutionProofFiles = [
  "package.json",
  "packages/db/package.json",
  "packages/db/prisma/seed.ts",
  "packages/db/prisma/seed-readiness.json",
  "scripts/db/verify-seed-readiness.mjs",
  "scripts/db/write-seed-runtime-evidence.mjs",
  "docs/db/SEED_READINESS.md",
  "packages/db/src/integration-readiness.ts",
  "packages/db/tests/db-integration-plan.test.ts",
  "apps/web/lib/seedRuntimeExecution.ts",
  "apps/web/tests/seed-runtime-execution-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034100_add_seed_runtime_execution_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const seedRuntimeExecutionEvidenceFlags = [
  "seedReadinessVerifierPassed",
  "postgresProvisioned",
  "databaseUrlConfigured",
  "prismaClientGenerated",
  "migrationApplied",
  "seedCommandPassed",
  "seededTenantFound",
  "seededTenantMembersFound",
  "seededBookingWorkflowFound",
  "seededPaymentsFilesMessagesFound",
  "seededSeoReleaseFlagsFound",
  "auditLogsCreated",
  "fakeDataOnlyVerified",
  "noProductionProviderCredentialsUsed",
  "webApiSeededDataSmokePassed",
  "dashboardSeededDataSmokePassed",
  "commandEvidenceCaptured",
  "ciOrCleanCheckoutEvidenceCaptured",
] as const;

export type SeedRuntimeExecutionEvidenceFlag = (typeof seedRuntimeExecutionEvidenceFlags)[number];

export interface SeedRuntimeExecutionEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<SeedRuntimeExecutionEvidenceFlag, boolean>>;
}

export interface SeedRuntimeExecutionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly SeedRuntimeExecutionEvidenceFlag[];
  readonly requiredCommands: typeof seedRuntimeExecutionCommands;
  readonly requiredArtifacts: typeof seedRuntimeExecutionArtifactPaths;
  readonly requiredEvidence: typeof seedRuntimeExecutionEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface SeedRuntimeExecutionPlan {
  readonly localCommands: typeof seedRuntimeExecutionLocalCommands;
  readonly externalCommands: typeof seedRuntimeExecutionExternalCommands;
  readonly localArtifacts: typeof seedRuntimeExecutionLocalArtifacts;
  readonly externalArtifacts: typeof seedRuntimeExecutionExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: SeedRuntimeExecutionPolicy;
  readonly requiredExternalEvidence: typeof seedRuntimeExecutionRequiredExternalEvidence;
}

export interface SeedRuntimeExecutionArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof seedRuntimeExecutionRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export type SeedRuntimeExecutionPolicy = {
  readonly codexMayClassifyStaticSeedReadiness: true;
  readonly nonProductionDatabaseRequiredForClosure: true;
  readonly databaseUrlRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
};

export const seedRuntimeExecutionPolicy: SeedRuntimeExecutionPolicy = {
  codexMayClassifyStaticSeedReadiness: true,
  nonProductionDatabaseRequiredForClosure: true,
  databaseUrlRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const seedRuntimeExecutionRequiredExternalEvidence = [
  "Non-production Postgres provisioning and redacted DATABASE_URL evidence.",
  "Prisma validate, generate, migration, and seed command output against the non-production database.",
  "Seeded tenant, member, workflow, payment, file, message, SEO, release, flag, and audit query proof.",
  "Web/API and dashboard seeded-data smoke evidence.",
  "Provider-backed SeedRuntimeExecutionRun persistence row captured through persistSeedRuntimeExecutionRun.",
  "Secret-safe redacted command transcript and CI or clean-checkout evidence.",
] as const;

export const seedRuntimeExecutionLocalCommands = ["pnpm db:verify-seed", "pnpm db:seed-runtime-evidence"] as const;

export const seedRuntimeExecutionExternalCommands = [
  "provision non-production Postgres and configure DATABASE_URL",
  "pnpm --filter @inkroute/db db:validate",
  "pnpm --filter @inkroute/db db:generate",
  "pnpm --filter @inkroute/db db:migrate",
  "pnpm --filter @inkroute/db db:seed",
  "seeded demo tenant query smoke",
  "seeded workflow, payment, file, message, SEO, release, flag, and audit query smoke",
  "web/API seeded-data smoke",
  "dashboard seeded-data smoke",
  "GitHub Actions seed execution evidence job",
] as const;

export const seedRuntimeExecutionLocalArtifacts = [
  "coverage/seed-runtime-execution.json",
  "coverage/seed-readiness-verifier-output.txt",
  "coverage/seed-fake-data-legal-placeholder-proof.json",
  "coverage/seed-production-provider-ban.json",
  "coverage/seed-command-transcript-redacted.log",
  "coverage/seed-ci-clean-checkout-evidence.json",
] as const;

export const seedRuntimeExecutionExternalArtifacts = [
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
  "test-results/seed-runtime-execution",
] as const;

export interface SeedRuntimeExecutionRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly readinessStatus: SeedRuntimeExecutionEvidenceDecision["status"];
  readonly seededTenantSlug?: string;
  readonly commandTranscriptPath?: string;
}

export interface SeedRuntimeExecutionRunRepository {
  readonly seedRuntimeExecutionRun: {
    readonly upsert: (input: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: Record<string, unknown>;
      readonly update: Record<string, unknown>;
    }) => Promise<unknown>;
  };
}

const seedRuntimeExecutionEvidenceBlockers: Record<SeedRuntimeExecutionEvidenceFlag, string> = {
  seedReadinessVerifierPassed: "Seed readiness verifier must pass.",
  postgresProvisioned: "A non-production Postgres database must be provisioned for seed execution.",
  databaseUrlConfigured: "DATABASE_URL must be configured for the non-production seed database.",
  prismaClientGenerated: "Prisma client generation must pass.",
  migrationApplied: "Prisma migrations must be applied before seed execution.",
  seedCommandPassed: "Seed command must pass.",
  seededTenantFound: "Seeded demo tenant must be readable after seed execution.",
  seededTenantMembersFound: "Seeded tenant members must be readable after seed execution.",
  seededBookingWorkflowFound: "Seeded booking workflow records must be readable after seed execution.",
  seededPaymentsFilesMessagesFound: "Seeded payment, file, and message records must be readable after seed execution.",
  seededSeoReleaseFlagsFound: "Seeded SEO, release, and feature flag records must be readable after seed execution.",
  auditLogsCreated: "Seeded audit logs must be created and readable.",
  fakeDataOnlyVerified: "Seed execution must prove fake/demo data only.",
  noProductionProviderCredentialsUsed: "Seed execution must not use production provider credentials or live provider endpoints.",
  webApiSeededDataSmokePassed: "Web/API seeded-data smoke must pass.",
  dashboardSeededDataSmokePassed: "Dashboard seeded-data smoke must pass.",
  commandEvidenceCaptured: "Redacted seed command transcript must be captured.",
  ciOrCleanCheckoutEvidenceCaptured: "CI or clean-checkout seed execution evidence must be captured.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveSeedRuntimeExecutionKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|tenant|member|workflow|booking|file|message|seo|release|flag|audit|user|client|database|postgres|url|uri|dsn|key|id|payload|body|transcript|artifact|path|provider|fake|demo|placeholder|legal|production|command|output|stdout|stderr|log|prisma|migration|seed|query|row|smoke|dashboard|web|api|ci|workflow|run|commit|clean|checkout|manifest|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitiveSeedRuntimeExecutionValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:tenant|member|workflow|booking|payment|file|message|seo|release|flag|audit|seed|demo|client|user|row|query|smoke|dashboard|web|api|ci|run|commit|artifact|provider|database|postgres|prisma)[-_:/]?[A-Za-z0-9_.-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedSeedRuntimeExecutionValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedSeedRuntimeExecutionValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveSeedRuntimeExecutionKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedSeedRuntimeExecutionValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveSeedRuntimeExecutionValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildSeedRuntimeExecutionPlan(): SeedRuntimeExecutionPlan {
  return {
    localCommands: seedRuntimeExecutionLocalCommands,
    externalCommands: seedRuntimeExecutionExternalCommands,
    localArtifacts: seedRuntimeExecutionLocalArtifacts,
    externalArtifacts: seedRuntimeExecutionExternalArtifacts,
    commandExecutionAllowed: false,
    databaseExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    ciExecutionAllowed: false,
    executionPolicy: seedRuntimeExecutionPolicy,
    requiredExternalEvidence: seedRuntimeExecutionRequiredExternalEvidence,
  };
}

export function buildRedactedSeedRuntimeExecutionArtifact(artifact: unknown): unknown {
  return buildRedactedSeedRuntimeExecutionValue(artifact, "", []);
}

export function buildSeedRuntimeExecutionArtifactReview(artifact: unknown): SeedRuntimeExecutionArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedSeedRuntimeExecutionValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: seedRuntimeExecutionRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildSeedRuntimeExecutionEvidenceDecision = (
  input: SeedRuntimeExecutionEvidenceInput,
): SeedRuntimeExecutionEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, seedRuntimeExecutionCommands);
  const missingArtifacts = missingFrom(input.artifacts, seedRuntimeExecutionArtifactPaths);
  const missingEvidence = seedRuntimeExecutionEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => seedRuntimeExecutionEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: seedRuntimeExecutionCommands,
    requiredArtifacts: seedRuntimeExecutionArtifactPaths,
    requiredEvidence: seedRuntimeExecutionEvidenceFlags,
    blockers,
  };
};

export const buildSeedRuntimeExecutionRunData = (
  input: SeedRuntimeExecutionRunRecordInput,
  decision: SeedRuntimeExecutionEvidenceDecision,
) => ({
  tenantId: input.tenantId,
  runId: input.runId,
  commitSha: input.commitSha,
  status: input.readinessStatus,
  commandMatrix: seedRuntimeExecutionMatrix,
  artifactManifest: decision.requiredArtifacts,
  databaseProvisioningEvidenceCaptured:
    !decision.missingEvidence.includes("postgresProvisioned") &&
    !decision.missingEvidence.includes("databaseUrlConfigured"),
  prismaLifecycleEvidenceCaptured:
    !decision.missingEvidence.includes("prismaClientGenerated") &&
    !decision.missingEvidence.includes("migrationApplied"),
  seedCommandEvidenceCaptured: !decision.missingEvidence.includes("seedCommandPassed"),
  seededDomainQueryEvidenceCaptured:
    !decision.missingEvidence.includes("seededTenantFound") &&
    !decision.missingEvidence.includes("seededTenantMembersFound") &&
    !decision.missingEvidence.includes("seededBookingWorkflowFound") &&
    !decision.missingEvidence.includes("seededPaymentsFilesMessagesFound") &&
    !decision.missingEvidence.includes("seededSeoReleaseFlagsFound") &&
    !decision.missingEvidence.includes("auditLogsCreated"),
  appSmokeEvidenceCaptured:
    !decision.missingEvidence.includes("webApiSeededDataSmokePassed") &&
    !decision.missingEvidence.includes("dashboardSeededDataSmokePassed"),
  commandTranscriptEvidenceCaptured: !decision.missingEvidence.includes("commandEvidenceCaptured"),
  ciCleanCheckoutEvidenceCaptured: !decision.missingEvidence.includes("ciOrCleanCheckoutEvidenceCaptured"),
  secretSafeArtifactsCaptured:
    !decision.missingEvidence.includes("fakeDataOnlyVerified") &&
    !decision.missingEvidence.includes("noProductionProviderCredentialsUsed"),
  seededTenantSlug: input.seededTenantSlug ?? "inkroute-demo",
  commandTranscriptPath: input.commandTranscriptPath ?? "coverage/seed-command-transcript-redacted.log",
});

export const persistSeedRuntimeExecutionRun = async (
  repository: SeedRuntimeExecutionRunRepository,
  input: SeedRuntimeExecutionRunRecordInput,
  decision: SeedRuntimeExecutionEvidenceDecision,
) => {
  const data = buildSeedRuntimeExecutionRunData(input, decision);

  return repository.seedRuntimeExecutionRun.upsert({
    where: { tenantId_runId: { tenantId: input.tenantId, runId: input.runId } },
    create: data,
    update: data,
  });
};

const seedRuntimeExecutionPackageReadiness = buildSeedRuntimeExecutionEvidencePlan({
  packageScripts: {
    "db:validate": "prisma validate --schema prisma/schema.prisma",
    "db:generate": "prisma generate --schema prisma/schema.prisma",
    "db:migrate": "prisma migrate dev --schema prisma/schema.prisma",
    "db:seed": "tsx prisma/seed.ts",
    "db:verify-seed": "node ../../scripts/db/verify-seed-readiness.mjs",
  },
  seedReadinessVerifierPassed: true,
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
  fakeDataOnlyVerified: true,
  noProductionProviderCredentialsUsed: true,
  webApiSeededDataSmokePassed: false,
  dashboardSeededDataSmokePassed: false,
  commandEvidenceCaptured: true,
  ciOrCleanCheckoutEvidenceCaptured: true,
});

export const seedRuntimeExecutionReadiness = {
  ...seedRuntimeExecutionPackageReadiness,
  requiredCommands: seedRuntimeExecutionCommands,
  requiredEvidence: seedRuntimeExecutionEvidenceFlags,
} as const;





