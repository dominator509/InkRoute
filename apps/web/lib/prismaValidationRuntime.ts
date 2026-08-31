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

export interface PrismaValidationRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly schemaPath: string;
  readonly databaseUrlMode: string;
  readonly status: PrismaValidationEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly relationNameEvidenceCaptured: boolean;
  readonly manyToManyEvidenceCaptured: boolean;
  readonly enumCompatibilityEvidenceCaptured: boolean;
  readonly generatedSqlEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly validateOutputPath?: string | null;
  readonly generatedSqlReviewPath?: string | null;
}

export interface PrismaValidationRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly schemaPath: string;
  readonly databaseUrlMode: string;
  readonly status: PrismaValidationEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly relationNameEvidenceCaptured: boolean;
  readonly manyToManyEvidenceCaptured: boolean;
  readonly enumCompatibilityEvidenceCaptured: boolean;
  readonly generatedSqlEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly validateOutputPath: string | null;
  readonly generatedSqlReviewPath: string | null;
}

export interface PrismaValidationRunRepository {
  readonly prismaValidationRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: PrismaValidationRunData;
      readonly update: Omit<PrismaValidationRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildPrismaValidationRunData(input: PrismaValidationRunRecordInput): PrismaValidationRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    schemaPath: input.schemaPath,
    databaseUrlMode: input.databaseUrlMode,
    status: input.status,
    commandMatrix: input.commands ?? prismaValidationRuntimeCommands,
    artifactManifest: input.artifacts ?? prismaValidationArtifactPaths,
    relationNameEvidenceCaptured: input.relationNameEvidenceCaptured,
    manyToManyEvidenceCaptured: input.manyToManyEvidenceCaptured,
    enumCompatibilityEvidenceCaptured: input.enumCompatibilityEvidenceCaptured,
    generatedSqlEvidenceCaptured: input.generatedSqlEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    validateOutputPath: input.validateOutputPath ?? null,
    generatedSqlReviewPath: input.generatedSqlReviewPath ?? null,
  };
}

export async function persistPrismaValidationRun(
  repository: PrismaValidationRunRepository,
  input: PrismaValidationRunRecordInput,
): Promise<unknown> {
  const data = buildPrismaValidationRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.prismaValidationRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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

export const prismaValidationRuntimeProofFiles = [
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034200_add_prisma_validation_runs/migration.sql",
  "apps/web/lib/prismaValidationRuntime.ts",
  "apps/web/tests/prisma-validation-runtime-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const prismaValidationEvidenceFlags = [
  "prismaCliValidationPassed",
  "relationNameReviewPassed",
  "implicitManyToManyReviewPassed",
  "enumCompatibilityReviewPassed",
  "generatedSqlSafetyReviewPassed",
  "databaseUrlModeCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type PrismaValidationEvidenceFlag = (typeof prismaValidationEvidenceFlags)[number];

export interface PrismaValidationEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<PrismaValidationEvidenceFlag, boolean>>;
}

export interface PrismaValidationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly PrismaValidationEvidenceFlag[];
  readonly requiredCommands: typeof prismaValidationRuntimeCommands;
  readonly requiredArtifacts: typeof prismaValidationArtifactPaths;
  readonly requiredEvidence: typeof prismaValidationEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface PrismaValidationExecutionPlan {
  readonly localCommands: typeof prismaValidationRuntimeCommands;
  readonly externalCommands: typeof prismaValidationExternalCommands;
  readonly localArtifacts: typeof prismaValidationArtifactPaths;
  readonly externalArtifacts: typeof prismaValidationExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly databaseUrlExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof prismaValidationExecutionPolicy;
  readonly requiredExternalEvidence: typeof prismaValidationRequiredExternalEvidence;
}

export interface PrismaValidationArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof prismaValidationRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const prismaValidationEvidenceBlockers: Record<PrismaValidationEvidenceFlag, string> = {
  prismaCliValidationPassed: "prisma validate must pass against packages/db/prisma/schema.prisma.",
  relationNameReviewPassed: "Prisma relation-name compatibility review must pass.",
  implicitManyToManyReviewPassed: "Prisma implicit many-to-many compatibility review must pass.",
  enumCompatibilityReviewPassed: "Prisma enum/database compatibility review must pass.",
  generatedSqlSafetyReviewPassed: "Prisma generated SQL safety review must pass with redacted artifacts.",
  databaseUrlModeCaptured: "Database URL mode must be captured without exposing credentials.",
  secretSafeArtifactsCaptured: "Prisma validation artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.",
};

export const prismaValidationExecutionPolicy = {
  codexMayClassifyStaticPrismaValidationReadiness: true,
  freshValidationRequiredAfterSchemaChanges: true,
  databaseUrlModeRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const prismaValidationExternalCommands = ["provider-backed persistPrismaValidationRun execution proof"] as const;

export const prismaValidationExternalArtifacts = ["provider-backed PrismaValidationRun persistence proof"] as const;

export const prismaValidationRequiredExternalEvidence = [
  "Fresh prisma validate output after every schema-changing commit.",
  "Database URL mode captured without credentials.",
  "Relation-name, implicit many-to-many, enum compatibility, and generated SQL safety review artifacts.",
  "Provider-backed PrismaValidationRun persistence row captured through persistPrismaValidationRun.",
  "Secret-safe Prisma validation artifacts with database URLs and generated SQL redacted.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitivePrismaValidationKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|client|database|postgres|url|uri|dsn|key|id|payload|artifact|sql|repository|repo|branch|pull|pr|reviewer|codeowner)/iu;
const sensitivePrismaValidationValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedPrismaValidationValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedPrismaValidationValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitivePrismaValidationKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedPrismaValidationValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitivePrismaValidationValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildPrismaValidationExecutionPlan(): PrismaValidationExecutionPlan {
  return {
    localCommands: prismaValidationRuntimeCommands,
    externalCommands: prismaValidationExternalCommands,
    localArtifacts: prismaValidationArtifactPaths,
    externalArtifacts: prismaValidationExternalArtifacts,
    commandExecutionAllowed: false,
    databaseUrlExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: prismaValidationExecutionPolicy,
    requiredExternalEvidence: prismaValidationRequiredExternalEvidence,
  };
}

export function buildRedactedPrismaValidationArtifact(artifact: unknown): unknown {
  return buildRedactedPrismaValidationValue(artifact, "", []);
}

export function buildPrismaValidationArtifactReview(artifact: unknown): PrismaValidationArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedPrismaValidationValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: prismaValidationRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildPrismaValidationEvidenceDecision = (
  input: PrismaValidationEvidenceInput,
): PrismaValidationEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, prismaValidationRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, prismaValidationArtifactPaths);
  const missingEvidence = prismaValidationEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => prismaValidationEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: prismaValidationRuntimeCommands,
    requiredArtifacts: prismaValidationArtifactPaths,
    requiredEvidence: prismaValidationEvidenceFlags,
    blockers,
  };
};




