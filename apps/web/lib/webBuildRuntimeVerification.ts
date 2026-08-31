export type WebBuildRuntimeVerificationStatus = "wired" | "prisma-gated" | "typecheck-gated" | "build-gated" | "browser-gated" | "ci-gated";

export interface WebBuildRuntimeVerificationMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: WebBuildRuntimeVerificationStatus;
}

export interface WebBuildRuntimeRunPersistenceContract {
  readonly prismaModel: "WebBuildRuntimeRun";
  readonly tenantRelation: "webBuildRuntimeRuns";
  readonly migration: "20260609034900_add_web_build_runtime_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesPrismaClientEvidence: true;
  readonly storesTypecheckEvidence: true;
  readonly storesBuildEvidence: true;
  readonly storesBrowserSmokeEvidence: true;
  readonly storesFallbackEvidence: true;
  readonly storesExactOptionalEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const webBuildRuntimeRunPersistenceContract = {
  prismaModel: "WebBuildRuntimeRun",
  tenantRelation: "webBuildRuntimeRuns",
  migration: "20260609034900_add_web_build_runtime_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesPrismaClientEvidence: true,
  storesTypecheckEvidence: true,
  storesBuildEvidence: true,
  storesBrowserSmokeEvidence: true,
  storesFallbackEvidence: true,
  storesExactOptionalEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies WebBuildRuntimeRunPersistenceContract;

export interface WebBuildRuntimeRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: WebBuildRuntimeVerificationEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly prismaClientEvidenceCaptured: boolean;
  readonly typecheckEvidenceCaptured: boolean;
  readonly buildEvidenceCaptured: boolean;
  readonly browserSmokeEvidenceCaptured: boolean;
  readonly fallbackEvidenceCaptured: boolean;
  readonly exactOptionalEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly typecheckOutputPath?: string | null;
  readonly buildOutputPath?: string | null;
}

export interface WebBuildRuntimeRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: WebBuildRuntimeVerificationEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly prismaClientEvidenceCaptured: boolean;
  readonly typecheckEvidenceCaptured: boolean;
  readonly buildEvidenceCaptured: boolean;
  readonly browserSmokeEvidenceCaptured: boolean;
  readonly fallbackEvidenceCaptured: boolean;
  readonly exactOptionalEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly typecheckOutputPath: string | null;
  readonly buildOutputPath: string | null;
}

export interface WebBuildRuntimeRunRepository {
  readonly webBuildRuntimeRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: WebBuildRuntimeRunData;
      readonly update: Omit<WebBuildRuntimeRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildWebBuildRuntimeRunData(input: WebBuildRuntimeRunRecordInput): WebBuildRuntimeRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? webBuildRuntimeVerificationCommands,
    artifactManifest: input.artifacts ?? webBuildRuntimeVerificationArtifactPaths,
    prismaClientEvidenceCaptured: input.prismaClientEvidenceCaptured,
    typecheckEvidenceCaptured: input.typecheckEvidenceCaptured,
    buildEvidenceCaptured: input.buildEvidenceCaptured,
    browserSmokeEvidenceCaptured: input.browserSmokeEvidenceCaptured,
    fallbackEvidenceCaptured: input.fallbackEvidenceCaptured,
    exactOptionalEvidenceCaptured: input.exactOptionalEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    typecheckOutputPath: input.typecheckOutputPath ?? null,
    buildOutputPath: input.buildOutputPath ?? null,
  };
}

export async function persistWebBuildRuntimeRun(
  repository: WebBuildRuntimeRunRepository,
  input: WebBuildRuntimeRunRecordInput,
): Promise<unknown> {
  const data = buildWebBuildRuntimeRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.webBuildRuntimeRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const webBuildRuntimeVerificationCommands = [
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "web browser smoke for public booking and content routes",
  "Prisma DB-backed booking route smoke",
  "local DB-unavailable fallback smoke",
] as const;

export const webBuildRuntimeVerificationArtifactPaths = [
  "coverage/web-build-runtime-verification.json",
  "coverage/web-build-prisma-generate.txt",
  "coverage/web-build-typecheck.txt",
  "coverage/web-build-next-build.txt",
  "coverage/web-build-browser-smoke.json",
  "coverage/web-build-prisma-client-runtime.json",
  "coverage/web-build-db-fallback-smoke.json",
  "coverage/web-build-exact-optional-property-review.json",
  "coverage/web-build-secret-safe-artifacts.json",
  "test-results/web-build-runtime-verification",
] as const;

export const webBuildRuntimeVerificationProofFiles = [
  "package.json",
  "apps/web/package.json",
  "packages/db/src/prisma.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/dashboard/app/api/security/privacy-requests/route.ts",
  "apps/web/lib/webBuildRuntimeVerification.ts",
  "apps/web/tests/web-build-runtime-verification-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034900_add_web_build_runtime_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const webBuildRuntimeVerificationMatrix = [
  {
    id: "prisma-client-generation",
    command: "pnpm db:generate",
    artifact: "coverage/web-build-prisma-generate.txt",
    status: "prisma-gated",
  },
  {
    id: "web-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/web-build-typecheck.txt",
    status: "typecheck-gated",
  },
  {
    id: "web-next-build",
    command: "pnpm --filter @inkroute/web build",
    artifact: "coverage/web-build-next-build.txt",
    status: "build-gated",
  },
  {
    id: "browser-smoke",
    command: "web browser smoke for public booking and content routes",
    artifact: "coverage/web-build-browser-smoke.json",
    status: "browser-gated",
  },
  {
    id: "fallback-and-exact-optional-review",
    command: "Prisma DB-backed booking route smoke && local DB-unavailable fallback smoke",
    artifact: "coverage/web-build-db-fallback-smoke.json",
    status: "ci-gated",
  },
] as const satisfies readonly WebBuildRuntimeVerificationMatrixEntry[];

export const webBuildRuntimeVerificationEvidenceFlags = [
  "prismaClientGenerated",
  "webTypecheckPassed",
  "webBuildPassed",
  "browserSmokePassed",
  "dbBackedBookingRouteSmokePassed",
  "dbUnavailableFallbackSmokePassed",
  "exactOptionalPropertyReviewPassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type WebBuildRuntimeVerificationEvidenceFlag =
  (typeof webBuildRuntimeVerificationEvidenceFlags)[number];

export interface WebBuildRuntimeVerificationEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<WebBuildRuntimeVerificationEvidenceFlag, boolean>>;
}

export interface WebBuildRuntimeVerificationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingEvidence: readonly WebBuildRuntimeVerificationEvidenceFlag[];
  readonly requiredCommands: typeof webBuildRuntimeVerificationCommands;
  readonly requiredArtifacts: typeof webBuildRuntimeVerificationArtifactPaths;
  readonly requiredEvidence: typeof webBuildRuntimeVerificationEvidenceFlags;
  readonly blockers: readonly string[];
}

const webBuildRuntimeVerificationEvidenceBlockers: Record<WebBuildRuntimeVerificationEvidenceFlag, string> = {
  prismaClientGenerated: "Prisma Client must be generated before DB-backed web runtime verification.",
  webTypecheckPassed: "Web typecheck must pass.",
  webBuildPassed: "Next web build must pass.",
  browserSmokePassed: "Browser smoke for public booking and content routes must pass.",
  dbBackedBookingRouteSmokePassed: "DB-backed booking route smoke must pass with generated Prisma Client present.",
  dbUnavailableFallbackSmokePassed: "Local DB-unavailable fallback smoke must pass without masking DB-backed runtime requirements.",
  exactOptionalPropertyReviewPassed: "Exact optional property payload review must pass.",
  ciEvidenceCaptured: "CI web build/runtime evidence must be captured.",
  secretSafeArtifactsCaptured: "Web build/runtime artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildWebBuildRuntimeVerificationEvidenceDecision = (
  input: WebBuildRuntimeVerificationEvidenceInput,
): WebBuildRuntimeVerificationEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, webBuildRuntimeVerificationCommands);
  const missingArtifacts = missingFrom(input.artifacts, webBuildRuntimeVerificationArtifactPaths);
  const missingEvidence = webBuildRuntimeVerificationEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => webBuildRuntimeVerificationEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 && missingArtifacts.length === 0 && missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingEvidence,
    requiredCommands: webBuildRuntimeVerificationCommands,
    requiredArtifacts: webBuildRuntimeVerificationArtifactPaths,
    requiredEvidence: webBuildRuntimeVerificationEvidenceFlags,
    blockers,
  };
};

export interface WebBuildRuntimeVerificationExecutionPolicy {
  readonly codexMayClassifyStaticCompileUnblockers: true;
  readonly generatedPrismaClientRequiredForClosure: true;
  readonly webTypecheckAndBuildRequiredForClosure: true;
  readonly browserSmokeRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface WebBuildRuntimeVerificationExecutionPlan {
  readonly localCommands: typeof webBuildRuntimeVerificationLocalCommands;
  readonly externalCommands: typeof webBuildRuntimeVerificationExternalCommands;
  readonly requiredExternalEvidence: typeof webBuildRuntimeVerificationRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly prismaGenerateExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly buildExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: WebBuildRuntimeVerificationExecutionPolicy;
}

export interface WebBuildRuntimeVerificationArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof webBuildRuntimeVerificationRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const webBuildRuntimeVerificationRequiredExternalEvidence = [
  "pnpm db:generate output with generated Prisma Client present",
  "pnpm --filter @inkroute/web typecheck output",
  "pnpm --filter @inkroute/web build output",
  "provider-backed WebBuildRuntimeRun persistence execution",
  "DB-backed public booking route smoke",
  "DB-unavailable fallback smoke output",
  "browser smoke for public booking and content routes",
  "CI web build/runtime evidence",
  "secret-safe web build/runtime artifact review",
] as const;

export const webBuildRuntimeVerificationExecutionPolicy: WebBuildRuntimeVerificationExecutionPolicy = {
  codexMayClassifyStaticCompileUnblockers: true,
  generatedPrismaClientRequiredForClosure: true,
  webTypecheckAndBuildRequiredForClosure: true,
  browserSmokeRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const webBuildRuntimeVerificationLocalCommands = [
  "static compile-unblocker source review",
  "static exact-optional-property payload review",
  "static WebBuildRuntimeRun persistence contract review",
] as const;

export const webBuildRuntimeVerificationExternalCommands = [
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "web browser smoke for public booking and content routes",
  "Prisma DB-backed booking route smoke",
  "local DB-unavailable fallback smoke",
  "provider-backed persistWebBuildRuntimeRun execution",
  "CI web build/runtime artifact capture",
] as const;

export const buildWebBuildRuntimeVerificationExecutionPlan =
  (): WebBuildRuntimeVerificationExecutionPlan => ({
    localCommands: webBuildRuntimeVerificationLocalCommands,
    externalCommands: webBuildRuntimeVerificationExternalCommands,
    requiredExternalEvidence: webBuildRuntimeVerificationRequiredExternalEvidence,
    commandExecutionAllowed: false,
    prismaGenerateExecutionAllowed: false,
    databaseExecutionAllowed: false,
    buildExecutionAllowed: false,
    browserExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: webBuildRuntimeVerificationExecutionPolicy,
  });

const webBuildRuntimeVerificationSensitiveArtifactKeyPattern =
  /(browser|buildlog|card|client|commandoutput|connection|cookie|database|db|domain|dsn|email|env|html|medical|output|password|payment|phone|prisma|private|route|secret|session|stack|string|tenant|token|uri|url)/i;

export const buildRedactedWebBuildRuntimeVerificationArtifact = (
  artifact: unknown,
): Pick<WebBuildRuntimeVerificationArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (webBuildRuntimeVerificationSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_WEB_BUILD_RUNTIME_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildWebBuildRuntimeVerificationArtifactReview = (
  artifact: unknown,
): WebBuildRuntimeVerificationArtifactReview => {
  const redacted = buildRedactedWebBuildRuntimeVerificationArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "mysql://",
    "mongodb://",
    "DATABASE_URL",
    "client@example.com",
    "tenant.example.com",
    "sk_",
    "session_",
    "prisma://",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: webBuildRuntimeVerificationRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



