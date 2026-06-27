export type BookingPersistenceApiRuntimeStatus =
  | "implemented"
  | "runtime-gated"
  | "database-gated"
  | "provider-gated"
  | "ci-gated";

export interface BookingPersistenceApiRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingPersistenceApiRuntimeStatus;
}


export interface BookingPersistenceApiRunPersistenceContract {
  readonly prismaModel: "BookingPersistenceApiRun";
  readonly tenantRelation: "bookingPersistenceApiRuns";
  readonly migration: "20260609035400_add_booking_persistence_api_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesRouteContractEvidence: true;
  readonly storesWebTypecheckBuildEvidence: true;
  readonly storesPrismaGenerationEvidence: true;
  readonly storesDatabaseTransactionEvidence: true;
  readonly storesNextRouteSmokeEvidence: true;
  readonly storesProviderBoundaryEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const bookingPersistenceApiRunPersistenceContract = {
  prismaModel: "BookingPersistenceApiRun",
  tenantRelation: "bookingPersistenceApiRuns",
  migration: "20260609035400_add_booking_persistence_api_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesRouteContractEvidence: true,
  storesWebTypecheckBuildEvidence: true,
  storesPrismaGenerationEvidence: true,
  storesDatabaseTransactionEvidence: true,
  storesNextRouteSmokeEvidence: true,
  storesProviderBoundaryEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies BookingPersistenceApiRunPersistenceContract;

export interface BookingPersistenceApiRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingPersistenceApiEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly routeContractEvidenceCaptured: boolean;
  readonly webTypecheckBuildEvidenceCaptured: boolean;
  readonly prismaGenerationEvidenceCaptured: boolean;
  readonly databaseTransactionEvidenceCaptured: boolean;
  readonly nextRouteSmokeEvidenceCaptured: boolean;
  readonly providerBoundaryEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly transactionSmokeReportPath?: string | null;
  readonly nextRouteSmokeReportPath?: string | null;
}

export interface BookingPersistenceApiRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingPersistenceApiEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly routeContractEvidenceCaptured: boolean;
  readonly webTypecheckBuildEvidenceCaptured: boolean;
  readonly prismaGenerationEvidenceCaptured: boolean;
  readonly databaseTransactionEvidenceCaptured: boolean;
  readonly nextRouteSmokeEvidenceCaptured: boolean;
  readonly providerBoundaryEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly transactionSmokeReportPath: string | null;
  readonly nextRouteSmokeReportPath: string | null;
}

export interface BookingPersistenceApiRunRepository {
  readonly bookingPersistenceApiRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: BookingPersistenceApiRunData;
      readonly update: Omit<BookingPersistenceApiRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildBookingPersistenceApiRunData(
  input: BookingPersistenceApiRunRecordInput,
): BookingPersistenceApiRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? bookingPersistenceApiRuntimeCommands,
    artifactManifest: input.artifacts ?? bookingPersistenceApiArtifactPaths,
    routeContractEvidenceCaptured: input.routeContractEvidenceCaptured,
    webTypecheckBuildEvidenceCaptured: input.webTypecheckBuildEvidenceCaptured,
    prismaGenerationEvidenceCaptured: input.prismaGenerationEvidenceCaptured,
    databaseTransactionEvidenceCaptured: input.databaseTransactionEvidenceCaptured,
    nextRouteSmokeEvidenceCaptured: input.nextRouteSmokeEvidenceCaptured,
    providerBoundaryEvidenceCaptured: input.providerBoundaryEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    transactionSmokeReportPath: input.transactionSmokeReportPath ?? null,
    nextRouteSmokeReportPath: input.nextRouteSmokeReportPath ?? null,
  };
}

export async function persistBookingPersistenceApiRun(
  repository: BookingPersistenceApiRunRepository,
  input: BookingPersistenceApiRunRecordInput,
): Promise<unknown> {
  const data = buildBookingPersistenceApiRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.bookingPersistenceApiRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const bookingPersistenceApiRuntimeCommands = [
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm db:generate",
  "Next public booking API route runtime smoke",
  "dev-DB booking transaction smoke",
  "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
  "GitHub Actions booking persistence API evidence job",
] as const;

export const bookingPersistenceApiArtifactPaths = [
  "coverage/booking-persistence-api-runtime.json",
  "coverage/booking-persistence-contract-test.txt",
  "coverage/booking-persistence-web-typecheck.txt",
  "coverage/booking-persistence-web-build.txt",
  "coverage/booking-persistence-prisma-generate.txt",
  "coverage/booking-persistence-next-route-smoke.json",
  "coverage/booking-persistence-db-transaction.json",
  "coverage/booking-persistence-provider-workers.json",
  "coverage/booking-persistence-secret-safe-artifacts.json",
  "test-results/booking-persistence-api-runtime",
] as const;

export const bookingPersistenceApiRuntimeProofFiles = [
  "apps/web/package.json",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts",
  "apps/web/tests/booking-requests-contract.test.ts",
  "packages/validators/src/booking.ts",
  "packages/security/src/index.ts",
  "apps/web/lib/localRuntimeState.ts",
  "apps/web/lib/bookingPersistenceApiRuntime.ts",
  "apps/web/tests/booking-persistence-api-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609035400_add_booking_persistence_api_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const bookingPersistenceApiRuntimeMatrix = [
  {
    id: "route-contract-tests",
    command: "pnpm --filter @inkroute/web test -- booking-requests-contract",
    artifact: "coverage/booking-persistence-contract-test.txt",
    status: "implemented",
  },
  {
    id: "web-typecheck-build",
    command: "pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/booking-persistence-web-build.txt",
    status: "runtime-gated",
  },
  {
    id: "prisma-client-and-db-transaction",
    command: "pnpm db:generate && dev-DB booking transaction smoke",
    artifact: "coverage/booking-persistence-db-transaction.json",
    status: "database-gated",
  },
  {
    id: "next-route-runtime-smoke",
    command: "Next public booking API route runtime smoke",
    artifact: "coverage/booking-persistence-next-route-smoke.json",
    status: "runtime-gated",
  },
  {
    id: "provider-worker-execution-boundaries",
    command: "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
    artifact: "coverage/booking-persistence-provider-workers.json",
    status: "provider-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions booking persistence API evidence job",
    artifact: "coverage/booking-persistence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingPersistenceApiRuntimeMatrixEntry[];

export const bookingPersistenceApiImplementedControls = [
  "Resolve tenant scope before persistence and fall back only when the database is unavailable.",
  "Require DB-scope anti-bot proof before database writes.",
  "Gate medical-note persistence on encryption policy and key readiness.",
  "Write BookingRequest, BookingStateEvent, and AuditLog records through a transaction on the database path.",
  "Keep provider workers for reference upload, deposit, notification, and calendar handoffs separate from the route persistence contract.",
] as const;

export const bookingPersistenceApiRemainingRuntimeEvidence = [
  "fresh booking route contract test output",
  "generated Prisma Client and dev-DB transaction smoke output",
  "web typecheck/build output",
  "Next route runtime smoke transcript",
  "provider worker execution evidence tracked by GAP-033 and GAP-034",
  "CI artifact bundle with redaction/secret-safety proof",
] as const;

export const bookingPersistenceApiEvidenceFlags = [
  "routeContractTestsPassed",
  "webTypecheckPassed",
  "webBuildPassed",
  "prismaClientGenerated",
  "nextRouteRuntimeSmokePassed",
  "devDbTransactionSmokePassed",
  "providerWorkerBoundaryEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type BookingPersistenceApiEvidenceFlag = (typeof bookingPersistenceApiEvidenceFlags)[number];

export interface BookingPersistenceApiEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<BookingPersistenceApiEvidenceFlag, boolean>>;
}

export interface BookingPersistenceApiEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly BookingPersistenceApiEvidenceFlag[];
  readonly requiredCommands: typeof bookingPersistenceApiRuntimeCommands;
  readonly requiredArtifacts: typeof bookingPersistenceApiArtifactPaths;
  readonly requiredControls: typeof bookingPersistenceApiImplementedControls;
  readonly requiredEvidence: typeof bookingPersistenceApiEvidenceFlags;
  readonly blockers: readonly string[];
}

const bookingPersistenceApiEvidenceBlockers: Record<BookingPersistenceApiEvidenceFlag, string> = {
  routeContractTestsPassed: "Fresh booking route contract test output must be captured.",
  webTypecheckPassed: "Web typecheck must pass.",
  webBuildPassed: "Web build must pass.",
  prismaClientGenerated: "Generated Prisma Client evidence is required for DB-backed runtime.",
  nextRouteRuntimeSmokePassed: "Next public booking API route runtime smoke must pass.",
  devDbTransactionSmokePassed: "Dev-DB booking transaction smoke must pass.",
  providerWorkerBoundaryEvidenceCaptured:
    "Provider worker boundary evidence for reference, deposit, notification, and calendar handoffs must be captured or remain tracked under GAP-033/GAP-034.",
  ciEvidenceCaptured: "CI booking persistence API evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Booking persistence API artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildBookingPersistenceApiEvidenceDecision = (
  input: BookingPersistenceApiEvidenceInput,
): BookingPersistenceApiEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, bookingPersistenceApiRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, bookingPersistenceApiArtifactPaths);
  const missingControls = missingFrom(input.controls, bookingPersistenceApiImplementedControls);
  const missingEvidence = bookingPersistenceApiEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => bookingPersistenceApiEvidenceBlockers[flag]);

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
    requiredCommands: bookingPersistenceApiRuntimeCommands,
    requiredArtifacts: bookingPersistenceApiArtifactPaths,
    requiredControls: bookingPersistenceApiImplementedControls,
    requiredEvidence: bookingPersistenceApiEvidenceFlags,
    blockers,
  };
};

export interface BookingPersistenceApiExecutionPolicy {
  readonly codexMayClassifyStaticRouteReadiness: true;
  readonly generatedPrismaClientRequiredForClosure: true;
  readonly databaseTransactionSmokeRequiredForClosure: true;
  readonly nextRouteRuntimeSmokeRequiredForClosure: true;
  readonly providerWorkerEvidenceTrackedSeparately: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface BookingPersistenceApiExecutionPlan {
  readonly localCommands: typeof bookingPersistenceApiLocalCommands;
  readonly externalCommands: typeof bookingPersistenceApiExternalCommands;
  readonly requiredExternalEvidence: typeof bookingPersistenceApiRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly prismaGenerateExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly nextRuntimeExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof bookingPersistenceApiExecutionPolicy;
}

export interface BookingPersistenceApiArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof bookingPersistenceApiRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const bookingPersistenceApiLocalCommands = [
  "static booking request route persistence review",
  "static anti-bot DB-scope contract review",
  "static encryption policy persistence boundary review",
] as const;

export const bookingPersistenceApiExternalCommands = [
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "pnpm db:generate",
  "dev-DB booking transaction smoke",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "Next public booking API route runtime smoke",
  "provider-backed persistBookingPersistenceApiRun execution",
  "CI booking persistence API artifact capture",
] as const;

export const bookingPersistenceApiRequiredExternalEvidence = [
  "fresh booking route contract test output",
  "pnpm db:generate output with generated Prisma Client present",
  "dev-DB booking transaction smoke output",
  "pnpm --filter @inkroute/web typecheck output",
  "pnpm --filter @inkroute/web build output",
  "Next public booking API route runtime smoke transcript",
  "provider-backed BookingPersistenceApiRun persistence execution",
  "provider worker boundary evidence tracked under GAP-033 and GAP-034",
  "CI booking persistence API artifacts",
  "secret-safe booking persistence API artifact review",
] as const;

export const bookingPersistenceApiExecutionPolicy: BookingPersistenceApiExecutionPolicy = {
  codexMayClassifyStaticRouteReadiness: true,
  generatedPrismaClientRequiredForClosure: true,
  databaseTransactionSmokeRequiredForClosure: true,
  nextRouteRuntimeSmokeRequiredForClosure: true,
  providerWorkerEvidenceTrackedSeparately: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildBookingPersistenceApiExecutionPlan = (): BookingPersistenceApiExecutionPlan => ({
  localCommands: bookingPersistenceApiLocalCommands,
  externalCommands: bookingPersistenceApiExternalCommands,
  requiredExternalEvidence: bookingPersistenceApiRequiredExternalEvidence,
  commandExecutionAllowed: false,
  prismaGenerateExecutionAllowed: false,
  databaseExecutionAllowed: false,
  nextRuntimeExecutionAllowed: false,
  providerExecutionAllowed: false,
  ciExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  executionPolicy: bookingPersistenceApiExecutionPolicy,
});

const bookingPersistenceApiSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|stripe|payment|deposit|medical|note|email|phone|calendar|notification|upload|reference|booking|session|cookie|prisma|connection|audit|bot)/i;

export const buildRedactedBookingPersistenceApiArtifact = (
  artifact: unknown,
): Pick<BookingPersistenceApiArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (bookingPersistenceApiSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_BOOKING_PERSISTENCE_API_PRIVATE_VALUE]"];
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

export const buildBookingPersistenceApiArtifactReview = (
  artifact: unknown,
): BookingPersistenceApiArtifactReview => {
  const redacted = buildRedactedBookingPersistenceApiArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "sk_",
    "stripe_",
    "medical:",
    "private-file",
    "prisma://",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: bookingPersistenceApiRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



