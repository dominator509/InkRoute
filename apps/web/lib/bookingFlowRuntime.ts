import { buildBookingFlowRuntimeEvidencePlan } from "../app/api/public/[tenantSlug]/booking-requests/test-helpers";

export type BookingFlowRuntimeStatus =
  | "wired"
  | "install-gated"
  | "next-gated"
  | "browser-gated"
  | "database-gated"
  | "ci-gated";

export interface BookingFlowRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingFlowRuntimeStatus;
}


export interface BookingFlowRuntimeRunPersistenceContract {
  readonly prismaModel: "BookingFlowRuntimeRun";
  readonly tenantRelation: "bookingFlowRuntimeRuns";
  readonly migration: "20260609035300_add_booking_flow_runtime_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDependencyInstallEvidence: true;
  readonly storesPrismaGenerationEvidence: true;
  readonly storesWebTypecheckBuildEvidence: true;
  readonly storesRouteRuntimeSmokeEvidence: true;
  readonly storesBrowserSmokeEvidence: true;
  readonly storesDatabaseSmokeEvidence: true;
  readonly storesProviderBoundaryEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const bookingFlowRuntimeRunPersistenceContract = {
  prismaModel: "BookingFlowRuntimeRun",
  tenantRelation: "bookingFlowRuntimeRuns",
  migration: "20260609035300_add_booking_flow_runtime_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDependencyInstallEvidence: true,
  storesPrismaGenerationEvidence: true,
  storesWebTypecheckBuildEvidence: true,
  storesRouteRuntimeSmokeEvidence: true,
  storesBrowserSmokeEvidence: true,
  storesDatabaseSmokeEvidence: true,
  storesProviderBoundaryEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies BookingFlowRuntimeRunPersistenceContract;

export interface BookingFlowRuntimeRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingFlowRuntimeEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly dependencyInstallEvidenceCaptured: boolean;
  readonly prismaGenerationEvidenceCaptured: boolean;
  readonly webTypecheckBuildEvidenceCaptured: boolean;
  readonly routeRuntimeSmokeEvidenceCaptured: boolean;
  readonly browserSmokeEvidenceCaptured: boolean;
  readonly databaseSmokeEvidenceCaptured: boolean;
  readonly providerBoundaryEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeSmokeReportPath?: string | null;
  readonly browserSmokeReportPath?: string | null;
}

export interface BookingFlowRuntimeRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingFlowRuntimeEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly dependencyInstallEvidenceCaptured: boolean;
  readonly prismaGenerationEvidenceCaptured: boolean;
  readonly webTypecheckBuildEvidenceCaptured: boolean;
  readonly routeRuntimeSmokeEvidenceCaptured: boolean;
  readonly browserSmokeEvidenceCaptured: boolean;
  readonly databaseSmokeEvidenceCaptured: boolean;
  readonly providerBoundaryEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeSmokeReportPath: string | null;
  readonly browserSmokeReportPath: string | null;
}

export interface BookingFlowRuntimeRunRepository {
  readonly bookingFlowRuntimeRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: BookingFlowRuntimeRunData;
      readonly update: Omit<BookingFlowRuntimeRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildBookingFlowRuntimeRunData(
  input: BookingFlowRuntimeRunRecordInput,
): BookingFlowRuntimeRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? bookingFlowRuntimeCommands,
    artifactManifest: input.artifacts ?? bookingFlowRuntimeArtifactPaths,
    dependencyInstallEvidenceCaptured: input.dependencyInstallEvidenceCaptured,
    prismaGenerationEvidenceCaptured: input.prismaGenerationEvidenceCaptured,
    webTypecheckBuildEvidenceCaptured: input.webTypecheckBuildEvidenceCaptured,
    routeRuntimeSmokeEvidenceCaptured: input.routeRuntimeSmokeEvidenceCaptured,
    browserSmokeEvidenceCaptured: input.browserSmokeEvidenceCaptured,
    databaseSmokeEvidenceCaptured: input.databaseSmokeEvidenceCaptured,
    providerBoundaryEvidenceCaptured: input.providerBoundaryEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    routeSmokeReportPath: input.routeSmokeReportPath ?? null,
    browserSmokeReportPath: input.browserSmokeReportPath ?? null,
  };
}

export async function persistBookingFlowRuntimeRun(
  repository: BookingFlowRuntimeRunRepository,
  input: BookingFlowRuntimeRunRecordInput,
): Promise<unknown> {
  const data = buildBookingFlowRuntimeRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.bookingFlowRuntimeRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const bookingFlowRuntimeCommands = [
  "pnpm install",
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "Playwright booking page smoke for /booking",
  "Playwright booking confirmation smoke for /booking/confirmation",
  "Next public booking API route runtime smoke",
  "dev-DB booking transaction smoke",
] as const;

export const bookingFlowRuntimeArtifactPaths = [
  "coverage/booking-flow-runtime.json",
  "coverage/booking-flow-install.txt",
  "coverage/booking-flow-prisma-generate.txt",
  "coverage/booking-flow-web-typecheck.txt",
  "coverage/booking-flow-web-build.txt",
  "coverage/booking-flow-contract-test.txt",
  "coverage/booking-flow-next-route-smoke.json",
  "coverage/booking-flow-local-fallback.json",
  "coverage/booking-flow-db-transaction-smoke.json",
  "coverage/booking-flow-provider-boundaries.json",
  "coverage/booking-flow-client-server-boundaries.json",
  "coverage/booking-flow-secret-safe-artifacts.json",
  "test-results/booking-flow-runtime",
] as const;

export const bookingFlowRuntimeProofFiles = [
  "apps/web/package.json",
  "apps/web/app/booking/page.tsx",
  "apps/web/app/booking/BookingFlowClient.tsx",
  "apps/web/app/booking/confirmation/page.tsx",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts",
  "apps/web/tests/booking-requests-contract.test.ts",
  "apps/web/lib/localRuntimeState.ts",
  "apps/web/lib/bookingFlowRuntime.ts",
  "apps/web/tests/booking-flow-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609035300_add_booking_flow_runtime_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const bookingFlowRuntimeMatrix = [
  {
    id: "install-and-prisma-client",
    command: "pnpm install && pnpm db:generate",
    artifact: "coverage/booking-flow-prisma-generate.txt",
    status: "install-gated",
  },
  {
    id: "web-typecheck-build-boundaries",
    command: "pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/booking-flow-web-build.txt",
    status: "next-gated",
  },
  {
    id: "booking-route-contract-and-next-smoke",
    command: "pnpm --filter @inkroute/web test -- booking-requests-contract && Next public booking API route runtime smoke",
    artifact: "coverage/booking-flow-next-route-smoke.json",
    status: "wired",
  },
  {
    id: "booking-and-confirmation-browser-smoke",
    command: "Playwright booking page smoke for /booking && Playwright booking confirmation smoke for /booking/confirmation",
    artifact: "test-results/booking-flow-runtime",
    status: "browser-gated",
  },
  {
    id: "local-fallback-db-provider-boundaries",
    command: "dev-DB booking transaction smoke",
    artifact: "coverage/booking-flow-db-transaction-smoke.json",
    status: "database-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions booking flow runtime evidence job",
    artifact: "coverage/booking-flow-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingFlowRuntimeMatrixEntry[];

export const bookingFlowRuntimeControls = [
  "verify-booking-confirmation-pages-in-real-next-runtime",
  "exercise-public-booking-api-route-with-db-and-local-runtime-scopes",
  "preserve-provider-gated-reference-upload-deposit-notification-calendar-boundaries",
  "keep-local-runtime-fallback-tenant-scoped-and-non-production",
  "redact-medical-payment-provider-private-file-client-data-from-artifacts",
] as const;

export const bookingFlowRuntimeEvidenceFlags = [
  "dependenciesInstalled",
  "prismaClientGenerated",
  "webTypecheckPassed",
  "webBuildPassed",
  "bookingRouteContractTestsPassed",
  "bookingPageBrowserSmokePassed",
  "confirmationPageBrowserSmokePassed",
  "nextRouteRuntimeSmokePassed",
  "localRuntimeFallbackVerified",
  "databaseRuntimeSmokePassed",
  "providerGatedBoundariesPreserved",
  "clientServerComponentBoundaryVerified",
  "ciArtifactsCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type BookingFlowRuntimeEvidenceFlag = (typeof bookingFlowRuntimeEvidenceFlags)[number];

export interface BookingFlowRuntimeEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<BookingFlowRuntimeEvidenceFlag, boolean>>;
}

export interface BookingFlowRuntimeEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly BookingFlowRuntimeEvidenceFlag[];
  readonly requiredCommands: typeof bookingFlowRuntimeCommands;
  readonly requiredArtifacts: typeof bookingFlowRuntimeArtifactPaths;
  readonly requiredControls: typeof bookingFlowRuntimeControls;
  readonly requiredEvidence: typeof bookingFlowRuntimeEvidenceFlags;
  readonly blockers: readonly string[];
}

const bookingFlowRuntimeEvidenceBlockers: Record<BookingFlowRuntimeEvidenceFlag, string> = {
  dependenciesInstalled: "Workspace dependencies must be installed with a committed lockfile before booking runtime evidence can close.",
  prismaClientGenerated: "Generated Prisma Client must exist before DB-backed booking runtime proof.",
  webTypecheckPassed: "Web typecheck must pass.",
  webBuildPassed: "Web build must pass.",
  bookingRouteContractTestsPassed: "Booking route contract tests must pass.",
  bookingPageBrowserSmokePassed: "Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.",
  confirmationPageBrowserSmokePassed: "Browser smoke must prove /booking/confirmation renders persisted workflow/provider boundary state.",
  nextRouteRuntimeSmokePassed: "Next public booking API route runtime smoke must pass.",
  localRuntimeFallbackVerified: "Local-runtime fallback must remain tenant-scoped and visibly non-production.",
  databaseRuntimeSmokePassed: "Dev-DB booking transaction smoke must pass.",
  providerGatedBoundariesPreserved: "Provider-gated reference upload, deposit, notification, and calendar boundaries must be preserved.",
  clientServerComponentBoundaryVerified: "Client/server component boundaries must be verified in a real Next runtime.",
  ciArtifactsCaptured: "CI booking flow runtime evidence must be captured.",
  secretSafeArtifactsCaptured: "Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildBookingFlowRuntimeEvidenceDecision = (
  input: BookingFlowRuntimeEvidenceInput,
): BookingFlowRuntimeEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, bookingFlowRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, bookingFlowRuntimeArtifactPaths);
  const missingControls = missingFrom(input.controls, bookingFlowRuntimeControls);
  const missingEvidence = bookingFlowRuntimeEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => bookingFlowRuntimeEvidenceBlockers[flag]);

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
    requiredCommands: bookingFlowRuntimeCommands,
    requiredArtifacts: bookingFlowRuntimeArtifactPaths,
    requiredControls: bookingFlowRuntimeControls,
    requiredEvidence: bookingFlowRuntimeEvidenceFlags,
    blockers,
  };
};

export interface BookingFlowRuntimeExecutionPolicy {
  readonly codexMayClassifyStaticBookingFlowReadiness: true;
  readonly dependencyInstallRequiredForClosure: true;
  readonly generatedPrismaClientRequiredForClosure: true;
  readonly nextRuntimeSmokeRequiredForClosure: true;
  readonly browserSmokeRequiredForClosure: true;
  readonly databaseTransactionSmokeRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface BookingFlowRuntimeExecutionPlan {
  readonly localCommands: typeof bookingFlowRuntimeLocalCommands;
  readonly externalCommands: typeof bookingFlowRuntimeExternalCommands;
  readonly requiredExternalEvidence: typeof bookingFlowRuntimeRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly dependencyInstallExecutionAllowed: false;
  readonly prismaGenerateExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly nextRuntimeExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof bookingFlowRuntimeExecutionPolicy;
}

export interface BookingFlowRuntimeArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof bookingFlowRuntimeRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const bookingFlowRuntimeLocalCommands = [
  "static booking UI submit wiring review",
  "static booking route helper contract review",
  "static local-runtime fallback boundary review",
] as const;

export const bookingFlowRuntimeExternalCommands = [
  "pnpm install",
  "pnpm db:generate",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "pnpm --filter @inkroute/web test -- booking-requests-contract",
  "Playwright booking page smoke for /booking",
  "Playwright booking confirmation smoke for /booking/confirmation",
  "Next public booking API route runtime smoke",
  "dev-DB booking transaction smoke",
  "provider-backed persistBookingFlowRuntimeRun execution",
  "CI booking flow runtime artifact capture",
] as const;

export const bookingFlowRuntimeRequiredExternalEvidence = [
  "pnpm install output with committed lockfile",
  "pnpm db:generate output with generated Prisma Client present",
  "pnpm --filter @inkroute/web typecheck output",
  "pnpm --filter @inkroute/web build output",
  "booking route contract test output",
  "Next public booking API route runtime smoke",
  "Playwright /booking browser smoke",
  "Playwright /booking/confirmation browser smoke",
  "dev-DB booking transaction smoke",
  "provider-backed BookingFlowRuntimeRun persistence execution",
  "CI booking flow runtime artifacts",
  "secret-safe booking flow artifact review",
] as const;

export const bookingFlowRuntimeExecutionPolicy: BookingFlowRuntimeExecutionPolicy = {
  codexMayClassifyStaticBookingFlowReadiness: true,
  dependencyInstallRequiredForClosure: true,
  generatedPrismaClientRequiredForClosure: true,
  nextRuntimeSmokeRequiredForClosure: true,
  browserSmokeRequiredForClosure: true,
  databaseTransactionSmokeRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildBookingFlowRuntimeExecutionPlan = (): BookingFlowRuntimeExecutionPlan => ({
  localCommands: bookingFlowRuntimeLocalCommands,
  externalCommands: bookingFlowRuntimeExternalCommands,
  requiredExternalEvidence: bookingFlowRuntimeRequiredExternalEvidence,
  commandExecutionAllowed: false,
  dependencyInstallExecutionAllowed: false,
  prismaGenerateExecutionAllowed: false,
  databaseExecutionAllowed: false,
  browserExecutionAllowed: false,
  nextRuntimeExecutionAllowed: false,
  ciExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  executionPolicy: bookingFlowRuntimeExecutionPolicy,
});

const bookingFlowRuntimeSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|stripe|payment|deposit|medical|note|email|phone|calendar|notification|upload|reference|booking|session|cookie|csrf|prisma|connection|route|request|response|payload|body|workflow|consumer|local|browser|playwright|trace|screenshot|video|html|dom|confirmation|anti|bot|turnstile|captcha|transaction|state|event|audit|artifact|path|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner|id|key)/i;
const bookingFlowRuntimeSensitiveArtifactValuePattern =
  /(https?:\/\/[^\s"']+|prisma:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|gh[psuor]|github_pat)_[A-Za-z0-9_]+|(?:tenant|client|booking|request|workflow|consumer|upload|reference|payment|deposit|audit|state|event|session|provider|route|trace|screenshot|transaction|ci|run|commit|prisma|database)[-_:/]?[A-Za-z0-9_.-]{6,}|medical:[^"'\n\r]+|private-file|[A-Za-z0-9_-]{24,})/giu;

export const buildRedactedBookingFlowRuntimeArtifact = (
  artifact: unknown,
): Pick<BookingFlowRuntimeArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (bookingFlowRuntimeSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_BOOKING_FLOW_RUNTIME_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    if (typeof value === "string") {
      const redactedValue = value.replace(
        bookingFlowRuntimeSensitiveArtifactValuePattern,
        "[REDACTED_BOOKING_FLOW_RUNTIME_PRIVATE_VALUE]",
      );
      if (redactedValue !== value) {
        redactions.push(path || "$");
      }
      return redactedValue;
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildBookingFlowRuntimeArtifactReview = (artifact: unknown): BookingFlowRuntimeArtifactReview => {
  const redacted = buildRedactedBookingFlowRuntimeArtifact(artifact);
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
    requiredExternalEvidence: bookingFlowRuntimeRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};

export const bookingFlowRuntimeReadiness = buildBookingFlowRuntimeEvidencePlan({
  packageScripts: { typecheck: "tsc --noEmit", build: "next build", test: "playwright test" },
  dependenciesInstalled: false,
  prismaClientGenerated: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  bookingRouteContractTestsPassed: true,
  bookingPageBrowserSmokePassed: false,
  confirmationPageBrowserSmokePassed: false,
  nextRouteRuntimeSmokePassed: false,
  localRuntimeFallbackVerified: true,
  databaseRuntimeSmokePassed: false,
  providerGatedBoundariesPreserved: true,
  clientServerComponentBoundaryVerified: false,
  ciArtifactsCaptured: false,
  secretSafeArtifactsCaptured: false,
});



