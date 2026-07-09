import { buildBookingContactRuntimeEvidencePlan } from "@inkroute/booking";

export type BookingContactRuntimeStatus =
  | "wired"
  | "persistence-gated"
  | "provider-gated"
  | "e2e-gated"
  | "ci-gated";

export interface BookingContactRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingContactRuntimeStatus;
}


export interface BookingContactRunPersistenceContract {
  readonly prismaModel: "BookingContactRun";
  readonly tenantRelation: "bookingContactRuns";
  readonly migration: "20260609035100_add_booking_contact_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesDatabasePersistenceEvidence: true;
  readonly storesTenantIsolationEvidence: true;
  readonly storesProviderHandoffEvidence: true;
  readonly storesNoLivePaymentEvidence: true;
  readonly storesApiE2eEvidence: true;
  readonly storesBrowserE2eEvidence: true;
  readonly storesWebBuildEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const bookingContactRunPersistenceContract = {
  prismaModel: "BookingContactRun",
  tenantRelation: "bookingContactRuns",
  migration: "20260609035100_add_booking_contact_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesDatabasePersistenceEvidence: true,
  storesTenantIsolationEvidence: true,
  storesProviderHandoffEvidence: true,
  storesNoLivePaymentEvidence: true,
  storesApiE2eEvidence: true,
  storesBrowserE2eEvidence: true,
  storesWebBuildEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies BookingContactRunPersistenceContract;

export interface BookingContactRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingContactEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly databasePersistenceEvidenceCaptured: boolean;
  readonly tenantIsolationEvidenceCaptured: boolean;
  readonly providerHandoffEvidenceCaptured: boolean;
  readonly noLivePaymentEvidenceCaptured: boolean;
  readonly apiE2eEvidenceCaptured: boolean;
  readonly browserE2eEvidenceCaptured: boolean;
  readonly webBuildEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly e2eReportPath?: string | null;
  readonly providerBoundaryReportPath?: string | null;
}

export interface BookingContactRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: BookingContactEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly databasePersistenceEvidenceCaptured: boolean;
  readonly tenantIsolationEvidenceCaptured: boolean;
  readonly providerHandoffEvidenceCaptured: boolean;
  readonly noLivePaymentEvidenceCaptured: boolean;
  readonly apiE2eEvidenceCaptured: boolean;
  readonly browserE2eEvidenceCaptured: boolean;
  readonly webBuildEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly e2eReportPath: string | null;
  readonly providerBoundaryReportPath: string | null;
}

export interface BookingContactRunRepository {
  readonly bookingContactRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: BookingContactRunData;
      readonly update: Omit<BookingContactRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildBookingContactRunData(input: BookingContactRunRecordInput): BookingContactRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? bookingContactRuntimeCommands,
    artifactManifest: input.artifacts ?? bookingContactArtifactPaths,
    databasePersistenceEvidenceCaptured: input.databasePersistenceEvidenceCaptured,
    tenantIsolationEvidenceCaptured: input.tenantIsolationEvidenceCaptured,
    providerHandoffEvidenceCaptured: input.providerHandoffEvidenceCaptured,
    noLivePaymentEvidenceCaptured: input.noLivePaymentEvidenceCaptured,
    apiE2eEvidenceCaptured: input.apiE2eEvidenceCaptured,
    browserE2eEvidenceCaptured: input.browserE2eEvidenceCaptured,
    webBuildEvidenceCaptured: input.webBuildEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    e2eReportPath: input.e2eReportPath ?? null,
    providerBoundaryReportPath: input.providerBoundaryReportPath ?? null,
  };
}

export async function persistBookingContactRun(
  repository: BookingContactRunRepository,
  input: BookingContactRunRecordInput,
): Promise<unknown> {
  const data = buildBookingContactRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.bookingContactRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const bookingContactRuntimeCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "booking/contact API E2E tests",
  "booking/contact browser E2E tests",
  "provider sandbox handoff boundary tests",
  "GitHub Actions booking/contact runtime evidence job",
] as const;

export const bookingContactArtifactPaths = [
  "coverage/booking-contact-runtime.json",
  "coverage/booking-contact-booking-typecheck.txt",
  "coverage/booking-contact-booking-test.txt",
  "coverage/booking-contact-web-typecheck.txt",
  "coverage/booking-contact-web-build.txt",
  "coverage/booking-contact-route-plan.json",
  "coverage/booking-contact-contact-persistence.json",
  "coverage/booking-contact-provider-boundaries.json",
  "coverage/booking-contact-api-e2e.json",
  "coverage/booking-contact-browser-e2e.json",
  "coverage/booking-contact-ci-evidence.json",
  "test-results/booking-contact-runtime",
] as const;

export const bookingContactRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/booking/package.json",
  "packages/booking/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/app/api/public/[tenantSlug]/contact/route.ts",
  "apps/web/app/contact/page.tsx",
  "apps/web/lib/localRuntimeState.ts",
  "apps/web/app/booking/confirmation/page.tsx",
  "apps/web/lib/bookingContactRuntime.ts",
  "apps/web/tests/booking-contact-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609035100_add_booking_contact_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const bookingContactRuntimeMatrix = [
  {
    id: "booking-and-web-package-gates",
    command: "pnpm --filter @inkroute/booking typecheck && pnpm --filter @inkroute/booking test && pnpm --filter @inkroute/web typecheck && pnpm --filter @inkroute/web build",
    artifact: "coverage/booking-contact-web-build.txt",
    status: "wired",
  },
  {
    id: "public-route-post-submit-plan",
    command: "booking/contact API E2E tests",
    artifact: "coverage/booking-contact-route-plan.json",
    status: "wired",
  },
  {
    id: "contact-form-db-first-persistence",
    command: "booking/contact API E2E tests",
    artifact: "coverage/booking-contact-contact-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "provider-gated-handoff-boundaries",
    command: "provider sandbox handoff boundary tests",
    artifact: "coverage/booking-contact-provider-boundaries.json",
    status: "provider-gated",
  },
  {
    id: "api-and-browser-e2e",
    command: "booking/contact API E2E tests && booking/contact browser E2E tests",
    artifact: "coverage/booking-contact-browser-e2e.json",
    status: "e2e-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions booking/contact runtime evidence job",
    artifact: "coverage/booking-contact-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingContactRuntimeMatrixEntry[];

export const bookingContactRuntimeControls = [
  "persist-booking-contact-before-provider-handoff-work",
  "keep-provider-work-idempotent-audit-logged-tenant-scoped-retryable",
  "preserve-no-live-payment-until-stripe-sandbox-and-copy-review",
  "render-confirmation-from-persisted-workflow-state",
  "redact-medical-payment-provider-private-file-client-data-from-artifacts",
] as const;

export const bookingContactEvidenceFlags = [
  "bookingTestsPassed",
  "bookingTypecheckPassed",
  "webTypecheckPassed",
  "webBuildPassed",
  "bookingRouteUsesPostSubmitPlan",
  "confirmationUiUsesWorkflowState",
  "contactFormPersistenceConfigured",
  "databasePersistenceIntegrationPassed",
  "tenantIsolationIntegrationPassed",
  "referenceUploadHandoffGated",
  "depositHandoffGated",
  "notificationHandoffGated",
  "calendarHandoffGated",
  "noLivePaymentBoundaryPreserved",
  "browserE2ePassed",
  "apiE2ePassed",
  "providerSandboxEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type BookingContactEvidenceFlag = (typeof bookingContactEvidenceFlags)[number];

export interface BookingContactEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<BookingContactEvidenceFlag, boolean>>;
}

export interface BookingContactEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly BookingContactEvidenceFlag[];
  readonly requiredCommands: typeof bookingContactRuntimeCommands;
  readonly requiredArtifacts: typeof bookingContactArtifactPaths;
  readonly requiredControls: typeof bookingContactRuntimeControls;
  readonly requiredEvidence: typeof bookingContactEvidenceFlags;
  readonly blockers: readonly string[];
}

const bookingContactEvidenceBlockers: Record<BookingContactEvidenceFlag, string> = {
  bookingTestsPassed: "Booking package tests must pass.",
  bookingTypecheckPassed: "Booking package typecheck must pass.",
  webTypecheckPassed: "Web app typecheck must pass.",
  webBuildPassed: "Web app build must pass.",
  bookingRouteUsesPostSubmitPlan: "Booking route must emit the package post-submit handoff plan.",
  confirmationUiUsesWorkflowState: "Confirmation UI must render from persisted workflow state.",
  contactFormPersistenceConfigured: "Contact form persistence must be configured.",
  databasePersistenceIntegrationPassed: "Database integration evidence must prove booking/contact persistence and transaction behavior.",
  tenantIsolationIntegrationPassed: "Tenant isolation integration evidence must prove booking/contact records are tenant-scoped.",
  referenceUploadHandoffGated: "Reference upload handoff must remain provider-gated until credentials and evidence exist.",
  depositHandoffGated: "Deposit handoff must remain provider-gated and no-live-payment until Stripe sandbox evidence exists.",
  notificationHandoffGated: "Notification handoff must remain provider-gated until credentials and evidence exist.",
  calendarHandoffGated: "Calendar handoff must remain provider-gated until credentials and evidence exist.",
  noLivePaymentBoundaryPreserved: "No-live-payment behavior must be preserved until Stripe sandbox credentials and reviewed deposit copy are configured.",
  browserE2ePassed:
    "Browser E2E must cover booking submission, confirmation state, contact submission, validation errors, and provider-gated handoffs.",
  apiE2ePassed: "Booking/contact API E2E tests must pass.",
  providerSandboxEvidenceCaptured: "Provider sandbox handoff boundary evidence must be captured.",
  ciEvidenceCaptured: "CI booking/contact runtime evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Booking/contact artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildBookingContactEvidenceDecision = (
  input: BookingContactEvidenceInput,
): BookingContactEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, bookingContactRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, bookingContactArtifactPaths);
  const missingControls = missingFrom(input.controls, bookingContactRuntimeControls);
  const missingEvidence = bookingContactEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => bookingContactEvidenceBlockers[flag]);

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
    requiredCommands: bookingContactRuntimeCommands,
    requiredArtifacts: bookingContactArtifactPaths,
    requiredControls: bookingContactRuntimeControls,
    requiredEvidence: bookingContactEvidenceFlags,
    blockers,
  };
};

export interface BookingContactExecutionPolicy {
  readonly codexMayClassifyStaticBookingContactReadiness: true;
  readonly databaseTransactionsRequiredForClosure: true;
  readonly tenantIsolationRequiredForClosure: true;
  readonly providerSandboxEvidenceRequiredForClosure: true;
  readonly noLivePaymentBoundaryRequiredUntilStripeSandboxProof: true;
  readonly browserAndApiE2eRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface BookingContactExecutionPlan {
  readonly localCommands: typeof bookingContactLocalCommands;
  readonly externalCommands: typeof bookingContactExternalCommands;
  readonly requiredExternalEvidence: typeof bookingContactRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly paymentExecutionAllowed: false;
  readonly browserExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof bookingContactExecutionPolicy;
}

export interface BookingContactArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof bookingContactRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const bookingContactLocalCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "static booking/contact route handoff review",
  "static contact DB-first persistence and local-fallback fail-closed review",
] as const;

export const bookingContactExternalCommands = [
  "pnpm --filter @inkroute/web typecheck",
  "pnpm --filter @inkroute/web build",
  "booking/contact API E2E tests",
  "booking/contact browser E2E tests",
  "provider sandbox handoff boundary tests",
  "provider-backed persistBookingContactRun execution",
  "CI booking/contact runtime artifact capture",
] as const;

export const bookingContactRequiredExternalEvidence = [
  "live DB transaction integration evidence",
  "provider-backed BookingContactRun persistence execution",
  "booking/contact tenant-isolation integration proof",
  "booking/contact API E2E evidence",
  "booking/contact browser E2E evidence",
  "provider sandbox upload, deposit, notification, and calendar handoff evidence",
  "Stripe sandbox no-live-payment boundary proof before enabling payment capture",
  "web typecheck and build evidence",
  "CI booking/contact runtime artifacts",
  "secret-safe booking/contact artifact review",
] as const;

export const bookingContactExecutionPolicy: BookingContactExecutionPolicy = {
  codexMayClassifyStaticBookingContactReadiness: true,
  databaseTransactionsRequiredForClosure: true,
  tenantIsolationRequiredForClosure: true,
  providerSandboxEvidenceRequiredForClosure: true,
  noLivePaymentBoundaryRequiredUntilStripeSandboxProof: true,
  browserAndApiE2eRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildBookingContactExecutionPlan = (): BookingContactExecutionPlan => ({
  localCommands: bookingContactLocalCommands,
  externalCommands: bookingContactExternalCommands,
  requiredExternalEvidence: bookingContactRequiredExternalEvidence,
  commandExecutionAllowed: false,
  databaseExecutionAllowed: false,
  providerExecutionAllowed: false,
  paymentExecutionAllowed: false,
  browserExecutionAllowed: false,
  ciExecutionAllowed: false,
  providerPersistenceExecutionAllowed: false,
  executionPolicy: bookingContactExecutionPolicy,
});

const bookingContactSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|stripe|payment|deposit|medical|note|email|phone|calendar|notification|upload|reference|booking|contact|message|thread|destination|hash|idempotency|handoff|audit|session|cookie|csrf|route|request|response|payload|body|local|fallback|browser|playwright|trace|screenshot|video|html|dom|confirmation|transaction|state|event|artifact|path|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner|id|key)/i;
const bookingContactSensitiveArtifactValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:sk|pk|tok|pi|stripe|provider|gh[psuor]|github_pat)_[A-Za-z0-9_-]+|provider-token[^"'\s]*|(?:tenant|client|contact|message|thread|notification|handoff|idempotency|booking|request|workflow|upload|reference|payment|deposit|audit|state|event|session|provider|route|trace|screenshot|transaction|ci|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner|database)[-_:/]?[A-Za-z0-9_.-]{6,}|medical:[^"'\n\r]+|private-file|[A-Za-z0-9_-]{24,})/giu;

export const buildRedactedBookingContactArtifact = (
  artifact: unknown,
): Pick<BookingContactArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (bookingContactSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_BOOKING_CONTACT_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    if (typeof value === "string") {
      const redactedValue = value.replace(
        bookingContactSensitiveArtifactValuePattern,
        "[REDACTED_BOOKING_CONTACT_PRIVATE_VALUE]",
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

export const buildBookingContactArtifactReview = (artifact: unknown): BookingContactArtifactReview => {
  const redacted = buildRedactedBookingContactArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "postgres://",
    "client@example.com",
    "tenant.example.com",
    "sk_",
    "stripe_",
    "tok_",
    "medical:",
    "private-file",
    "provider-token",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: bookingContactRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};

export const bookingContactRuntimeReadiness = buildBookingContactRuntimeEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  bookingTestsPassed: false,
  bookingTypecheckPassed: false,
  webTypecheckPassed: false,
  webBuildPassed: false,
  bookingRouteUsesPostSubmitPlan: true,
  confirmationUiUsesWorkflowState: true,
  contactFormPersistenceConfigured: true,
  databasePersistenceIntegrationPassed: false,
  tenantIsolationIntegrationPassed: false,
  referenceUploadHandoffGated: true,
  depositHandoffGated: true,
  notificationHandoffGated: true,
  calendarHandoffGated: true,
  noLivePaymentBoundaryPreserved: true,
  browserE2ePassed: false,
  apiE2ePassed: false,
  providerSandboxEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});



