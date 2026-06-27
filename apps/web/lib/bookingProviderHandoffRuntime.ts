import {
  buildBookingProviderHandoffRuntimeEvidencePlan,
  bookingProviderHandoffRuntimeRequiredControls,
} from "@inkroute/booking";

export { bookingProviderHandoffRuntimeRequiredControls };

export type BookingProviderHandoffRuntimeStatus =
  | "wired"
  | "worker-gated"
  | "provider-gated"
  | "rollback-gated"
  | "ci-gated";

export interface BookingProviderHandoffRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: BookingProviderHandoffRuntimeStatus;
}

export const bookingProviderHandoffRuntimeCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/calendar test",
  "Stripe CLI deposit session sandbox test",
  "email/SMS/push notification sandbox delivery tests",
  "Google Calendar tentative hold sandbox test",
  "persisted provider worker execution tests",
  "provider rollback/retry integration tests",
  "GitHub Actions provider handoff evidence job",
] as const;

export const bookingProviderHandoffReadinessAreas = [
  "accepted-booking-gate",
  "persisted-tenant-scoped-worker-queue",
  "reference-upload-worker-execution",
  "stripe-deposit-sandbox-session",
  "notification-sandbox-delivery",
  "google-calendar-tentative-hold",
  "audit-payload-persistence",
  "retry-policy",
  "rollback-paths",
  "operator-review-queue",
  "provider-idempotency",
  "provider-sandbox-evidence",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const bookingProviderHandoffArtifactPaths = [
  "coverage/booking-provider-handoff-runtime.json",
  "coverage/booking-provider-handoff-booking-typecheck.txt",
  "coverage/booking-provider-handoff-booking-test.txt",
  "coverage/booking-provider-handoff-payments-test.txt",
  "coverage/booking-provider-handoff-notifications-test.txt",
  "coverage/booking-provider-handoff-calendar-test.txt",
  "coverage/booking-provider-handoff-route-plan.json",
  "coverage/booking-provider-handoff-worker-queue.json",
  "coverage/booking-provider-handoff-reference-upload-worker.json",
  "coverage/booking-provider-handoff-stripe-sandbox-redacted.json",
  "coverage/booking-provider-handoff-notification-sandbox-redacted.json",
  "coverage/booking-provider-handoff-calendar-sandbox-redacted.json",
  "coverage/booking-provider-handoff-audit-payloads.json",
  "coverage/booking-provider-handoff-retry-rollback.json",
  "coverage/booking-provider-handoff-idempotency.json",
  "coverage/booking-provider-handoff-ci-evidence.json",
  "coverage/booking-provider-handoff-secret-safe-artifacts.json",
  "test-results/booking-provider-handoff-runtime",
] as const;

export const bookingProviderHandoffRuntimeProofFiles = [
  "packages/booking/package.json",
  "packages/booking/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "packages/payments/package.json",
  "packages/payments/src/index.ts",
  "packages/notifications/package.json",
  "packages/notifications/src/index.ts",
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/tests/booking-requests-contract.test.ts",
  "apps/web/lib/bookingProviderHandoffRuntime.ts",
  "apps/web/tests/booking-provider-handoff-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const bookingProviderHandoffRuntimeMatrix = [
  {
    id: "booking-typecheck",
    command: "pnpm --filter @inkroute/booking typecheck",
    artifact: "coverage/booking-provider-handoff-booking-typecheck.txt",
    status: "wired",
  },
  {
    id: "booking-tests",
    command: "pnpm --filter @inkroute/booking test",
    artifact: "coverage/booking-provider-handoff-booking-test.txt",
    status: "wired",
  },
  {
    id: "provider-package-tests",
    command: "pnpm --filter @inkroute/payments test && pnpm --filter @inkroute/notifications test && pnpm --filter @inkroute/calendar test",
    artifact: "coverage/booking-provider-handoff-payments-test.txt",
    status: "wired",
  },
  {
    id: "booking-route-provider-handoff-plan",
    command: "assert booking route returns provider handoff evidence with post-submit workflow plans",
    artifact: "coverage/booking-provider-handoff-route-plan.json",
    status: "wired",
  },
  {
    id: "persisted-worker-queue",
    command: "persisted provider worker execution tests",
    artifact: "coverage/booking-provider-handoff-worker-queue.json",
    status: "worker-gated",
  },
  {
    id: "reference-upload-worker",
    command: "reference upload worker execution tests",
    artifact: "coverage/booking-provider-handoff-reference-upload-worker.json",
    status: "worker-gated",
  },
  {
    id: "stripe-deposit-sandbox",
    command: "Stripe CLI deposit session sandbox test",
    artifact: "coverage/booking-provider-handoff-stripe-sandbox-redacted.json",
    status: "provider-gated",
  },
  {
    id: "notification-sandbox",
    command: "email/SMS/push notification sandbox delivery tests",
    artifact: "coverage/booking-provider-handoff-notification-sandbox-redacted.json",
    status: "provider-gated",
  },
  {
    id: "calendar-sandbox",
    command: "Google Calendar tentative hold sandbox test",
    artifact: "coverage/booking-provider-handoff-calendar-sandbox-redacted.json",
    status: "provider-gated",
  },
  {
    id: "audit-retry-rollback-operator-review",
    command: "provider rollback/retry integration tests",
    artifact: "coverage/booking-provider-handoff-retry-rollback.json",
    status: "rollback-gated",
  },
  {
    id: "provider-idempotency",
    command: "provider idempotency replay and worker restart tests",
    artifact: "coverage/booking-provider-handoff-idempotency.json",
    status: "rollback-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions provider handoff evidence job",
    artifact: "coverage/booking-provider-handoff-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly BookingProviderHandoffRuntimeMatrixEntry[];

export const bookingProviderHandoffRuntimeReadiness = buildBookingProviderHandoffRuntimeEvidencePlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  bookingTestsPassed: false,
  bookingTypecheckPassed: false,
  paymentsTestsPassed: false,
  notificationsTestsPassed: false,
  calendarTestsPassed: false,
  acceptedBookingGateEnforced: true,
  persistedWorkerQueueConfigured: true,
  referenceUploadWorkerExecuted: true,
  stripeDepositSessionSandboxPassed: false,
  notificationQueueDeliverySandboxPassed: false,
  calendarHoldSandboxPassed: false,
  auditPayloadsPersisted: true,
  retryPolicyVerified: true,
  rollbackPathsVerified: true,
  operatorReviewQueueConfigured: true,
  providerIdempotencyConfigured: false,
  providerSandboxEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export const bookingProviderHandoffEvidenceFlags = [
  "bookingTestsPassed",
  "bookingTypecheckPassed",
  "paymentsTestsPassed",
  "notificationsTestsPassed",
  "calendarTestsPassed",
  "acceptedBookingGateEnforced",
  "persistedWorkerQueueConfigured",
  "referenceUploadWorkerExecuted",
  "stripeDepositSessionSandboxPassed",
  "notificationQueueDeliverySandboxPassed",
  "calendarHoldSandboxPassed",
  "auditPayloadsPersisted",
  "retryPolicyVerified",
  "rollbackPathsVerified",
  "operatorReviewQueueConfigured",
  "providerIdempotencyConfigured",
  "providerSandboxEvidenceCaptured",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type BookingProviderHandoffEvidenceFlag = (typeof bookingProviderHandoffEvidenceFlags)[number];

export interface BookingProviderHandoffEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly readinessAreas?: readonly string[];
  readonly evidence?: Partial<Record<BookingProviderHandoffEvidenceFlag, boolean>>;
}

export interface BookingProviderHandoffEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingReadinessAreas: readonly string[];
  readonly missingEvidence: readonly BookingProviderHandoffEvidenceFlag[];
  readonly requiredCommands: typeof bookingProviderHandoffRuntimeCommands;
  readonly requiredArtifacts: typeof bookingProviderHandoffArtifactPaths;
  readonly requiredReadinessAreas: readonly string[];
  readonly requiredEvidence: typeof bookingProviderHandoffEvidenceFlags;
  readonly blockers: readonly string[];
}

const bookingProviderHandoffEvidenceBlockers: Record<BookingProviderHandoffEvidenceFlag, string> = {
  bookingTestsPassed: "Booking package tests must pass.",
  bookingTypecheckPassed: "Booking package typecheck must pass.",
  paymentsTestsPassed: "Payments package tests must pass.",
  notificationsTestsPassed: "Notifications package tests must pass.",
  calendarTestsPassed: "Calendar package tests must pass.",
  acceptedBookingGateEnforced: "Accepted-booking gate must be enforced before provider handoffs.",
  persistedWorkerQueueConfigured: "Persisted tenant-scoped provider worker queue must be configured.",
  referenceUploadWorkerExecuted: "Reference upload worker execution evidence must be captured.",
  stripeDepositSessionSandboxPassed: "Stripe deposit session sandbox test must pass without live-payment mode.",
  notificationQueueDeliverySandboxPassed: "Notification sandbox delivery tests must pass.",
  calendarHoldSandboxPassed: "Google Calendar tentative hold sandbox test must pass.",
  auditPayloadsPersisted: "Provider handoff audit payloads must be persisted.",
  retryPolicyVerified: "Provider handoff retry policy must be verified.",
  rollbackPathsVerified: "Provider rollback paths must be verified.",
  operatorReviewQueueConfigured: "Operator review queue must be configured for provider failures.",
  providerIdempotencyConfigured: "Provider handoffs must enforce idempotency across retries, worker restarts, and webhook replays.",
  providerSandboxEvidenceCaptured: "Provider sandbox transcripts must be captured.",
  ciEvidenceCaptured: "CI provider handoff evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Provider handoff artifacts must be redacted and free of secrets, provider tokens, payment data, raw PII, medical, and private file data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildBookingProviderHandoffEvidenceDecision = (
  input: BookingProviderHandoffEvidenceInput,
): BookingProviderHandoffEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, bookingProviderHandoffRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, bookingProviderHandoffArtifactPaths);
  const missingReadinessAreas = missingFrom(input.readinessAreas, bookingProviderHandoffReadinessAreas);
  const missingEvidence = bookingProviderHandoffEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => bookingProviderHandoffEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingReadinessAreas.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingReadinessAreas,
    missingEvidence,
    requiredCommands: bookingProviderHandoffRuntimeCommands,
    requiredArtifacts: bookingProviderHandoffArtifactPaths,
    requiredReadinessAreas: bookingProviderHandoffReadinessAreas,
    requiredEvidence: bookingProviderHandoffEvidenceFlags,
    blockers,
  };
};

export interface BookingProviderHandoffExecutionPolicy {
  readonly codexMayClassifyStaticProviderHandoffReadiness: true;
  readonly acceptedBookingGateRequiredForClosure: true;
  readonly persistedWorkerExecutionRequiredForClosure: true;
  readonly providerSandboxEvidenceRequiredForClosure: true;
  readonly rollbackRetryIdempotencyRequiredForClosure: true;
  readonly operatorReviewRequiredForProviderFailures: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface BookingProviderHandoffExecutionPlan {
  readonly localCommands: typeof bookingProviderHandoffLocalCommands;
  readonly externalCommands: typeof bookingProviderHandoffExternalCommands;
  readonly requiredExternalEvidence: typeof bookingProviderHandoffRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly providerExecutionAllowed: false;
  readonly paymentExecutionAllowed: false;
  readonly notificationExecutionAllowed: false;
  readonly calendarExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof bookingProviderHandoffExecutionPolicy;
}

export interface BookingProviderHandoffArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof bookingProviderHandoffRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const bookingProviderHandoffLocalCommands = [
  "pnpm --filter @inkroute/booking typecheck",
  "pnpm --filter @inkroute/booking test",
  "static booking route provider handoff evidence review",
  "static post-submit workflow plan review",
] as const;

export const bookingProviderHandoffExternalCommands = [
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/notifications test",
  "pnpm --filter @inkroute/calendar test",
  "Stripe CLI deposit session sandbox test",
  "email/SMS/push notification sandbox delivery tests",
  "Google Calendar tentative hold sandbox test",
  "persisted provider worker execution tests",
  "provider rollback/retry integration tests",
  "GitHub Actions provider handoff evidence job",
] as const;

export const bookingProviderHandoffRequiredExternalEvidence = [
  "persisted tenant-scoped provider worker execution evidence",
  "reference upload worker execution transcript",
  "Stripe deposit session sandbox transcript",
  "email SMS push notification sandbox delivery logs",
  "Google Calendar tentative hold sandbox transcript",
  "provider audit payload persistence evidence",
  "provider retry rollback and operator-review queue evidence",
  "provider idempotency replay and worker restart evidence",
  "fresh CI provider handoff artifacts",
  "secret-safe booking provider handoff artifact review",
] as const;

export const bookingProviderHandoffExecutionPolicy: BookingProviderHandoffExecutionPolicy = {
  codexMayClassifyStaticProviderHandoffReadiness: true,
  acceptedBookingGateRequiredForClosure: true,
  persistedWorkerExecutionRequiredForClosure: true,
  providerSandboxEvidenceRequiredForClosure: true,
  rollbackRetryIdempotencyRequiredForClosure: true,
  operatorReviewRequiredForProviderFailures: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildBookingProviderHandoffExecutionPlan = (): BookingProviderHandoffExecutionPlan => ({
  localCommands: bookingProviderHandoffLocalCommands,
  externalCommands: bookingProviderHandoffExternalCommands,
  requiredExternalEvidence: bookingProviderHandoffRequiredExternalEvidence,
  commandExecutionAllowed: false,
  providerExecutionAllowed: false,
  paymentExecutionAllowed: false,
  notificationExecutionAllowed: false,
  calendarExecutionAllowed: false,
  databaseExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: bookingProviderHandoffExecutionPolicy,
});

const bookingProviderHandoffSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|stripe|payment|deposit|medical|note|email|phone|calendar|notification|sms|push|upload|reference|booking|session|cookie|webhook|idempotency|audit|rollback)/i;

export const buildRedactedBookingProviderHandoffArtifact = (
  artifact: unknown,
): Pick<BookingProviderHandoffArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (bookingProviderHandoffSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_BOOKING_PROVIDER_HANDOFF_PRIVATE_VALUE]"];
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

export const buildBookingProviderHandoffArtifactReview = (
  artifact: unknown,
): BookingProviderHandoffArtifactReview => {
  const redacted = buildRedactedBookingProviderHandoffArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "sk_",
    "stripe_",
    "client@example.com",
    "tenant.example.com",
    "provider-token",
    "medical:",
    "private-file",
    "webhook_secret",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: bookingProviderHandoffRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



