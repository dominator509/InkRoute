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
    id: "contact-form-local-persistence",
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
