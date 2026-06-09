import { buildBookingProviderHandoffRuntimeEvidencePlan } from "@inkroute/booking";

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
  auditPayloadsPersisted: false,
  retryPolicyVerified: false,
  rollbackPathsVerified: false,
  operatorReviewQueueConfigured: false,
  providerIdempotencyConfigured: false,
  providerSandboxEvidenceCaptured: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
