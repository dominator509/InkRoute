import { buildCalendarAutomatedTestReadinessPlan } from "@inkroute/calendar";
import {
  buildCalendarAutomationSecretSafeArtifactReview,
  buildRedactedCalendarAutomationArtifact,
} from "./calendarAutomatedTests";

export { buildRedactedCalendarAutomationArtifact };

export type CalendarAutomationRuntimeStatus =
  | "wired"
  | "route-gated"
  | "db-gated"
  | "provider-gated"
  | "timezone-gated"
  | "playwright-gated"
  | "race-gated"
  | "artifact-gated"
  | "ci-gated";

export interface CalendarAutomationRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: CalendarAutomationRuntimeStatus;
}

export interface CalendarAutomationExecutionPolicy {
  readonly codexMayClassifyStaticCalendarAutomationReadiness: boolean;
  readonly helperRouteCommandsRequiredForClosure: boolean;
  readonly seededPostgresRequiredForClosure: boolean;
  readonly googleProviderRequiredForClosure: boolean;
  readonly timezoneMatrixRequiredForClosure: boolean;
  readonly playwrightTravelRequiredForClosure: boolean;
  readonly concurrentHoldRaceRequiredForClosure: boolean;
  readonly signedFeedRevocationRequiredForClosure: boolean;
  readonly secretSafeArtifactsRequiredForClosure: boolean;
}

export interface CalendarAutomationExecutionPlan {
  readonly policy: typeof calendarAutomationExecutionPolicy;
  readonly surfaceContract: typeof calendarAutomationSurfaceContract;
  readonly commandExecutionAllowed: false;
  readonly seededPostgresExecutionAllowed: false;
  readonly googleProviderExecutionAllowed: false;
  readonly playwrightExecutionAllowed: false;
  readonly concurrentRaceExecutionAllowed: false;
  readonly signedFeedRevocationExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly artifactReviewExecutionAllowed: false;
  readonly localCommands: typeof calendarAutomationLocalCommands;
  readonly externalCommands: typeof calendarAutomationExternalCommands;
  readonly requiredExternalEvidence: typeof calendarAutomationRequiredExternalEvidence;
}

export type CalendarAutomationArtifactReview = ReturnType<
  typeof buildCalendarAutomationSecretSafeArtifactReview
>;

export interface CalendarAutomationPersistedRunPayload {
  readonly payloadId: "gap-059-calendar-automation-persisted-run";
  readonly requiredArtifact: "coverage/calendar-automation-persisted-run-payload.json";
  readonly providerBackedPersistenceRequired: true;
  readonly localPersistenceExecutionAllowed: false;
  readonly tenantIsolationEvidenceRequired: true;
  readonly postgresIntegrationEvidenceRequired: true;
  readonly googleProviderEvidenceRequired: true;
  readonly playwrightEvidenceRequired: true;
  readonly redactionRequired: true;
  readonly requiredExternalEvidence: typeof calendarAutomationRequiredExternalEvidence;
}

export const calendarAutomationExecutionPolicy = {
  codexMayClassifyStaticCalendarAutomationReadiness: true,
  helperRouteCommandsRequiredForClosure: true,
  seededPostgresRequiredForClosure: true,
  googleProviderRequiredForClosure: true,
  timezoneMatrixRequiredForClosure: true,
  playwrightTravelRequiredForClosure: true,
  concurrentHoldRaceRequiredForClosure: true,
  signedFeedRevocationRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies CalendarAutomationExecutionPolicy;

export const calendarAutomationRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
  "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
  "calendar Postgres integration tests",
  "Google test-calendar provider tests",
  "Playwright dashboard/public travel calendar smoke",
] as const;

export const calendarAutomationLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
  "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
] as const;

export const calendarAutomationExternalCommands = [
  "calendar Postgres integration tests",
  "Google test-calendar provider tests",
  "DST/recurrence provider matrix tests",
  "Playwright dashboard/public travel calendar smoke",
  "concurrent hold race-condition tests",
  "signed-feed revocation DB tests",
  "GitHub Actions calendar lifecycle test job",
  "calendar automation artifact retention review",
  "secret-safe calendar automation artifact review",
] as const;

export const calendarAutomationRequiredExternalEvidence = [
  "actual helper/route command output",
  "calendar Postgres integration tests",
  "Google test-calendar provider transcripts",
  "timezone matrix artifacts",
  "dashboard/public Playwright travel calendar smoke",
  "concurrent hold race tests",
  "signed-feed revocation DB tests",
  "CI calendar automation artifacts",
  "artifact retention proof",
  "tenant-isolated persisted calendar automation run payload",
  "secret-safe calendar automation artifact review",
] as const;

export const buildCalendarAutomationExecutionPlan = (): CalendarAutomationExecutionPlan => ({
  policy: calendarAutomationExecutionPolicy,
  surfaceContract: calendarAutomationSurfaceContract,
  commandExecutionAllowed: false,
  seededPostgresExecutionAllowed: false,
  googleProviderExecutionAllowed: false,
  playwrightExecutionAllowed: false,
  concurrentRaceExecutionAllowed: false,
  signedFeedRevocationExecutionAllowed: false,
  ciExecutionAllowed: false,
  artifactReviewExecutionAllowed: false,
  localCommands: calendarAutomationLocalCommands,
  externalCommands: calendarAutomationExternalCommands,
  requiredExternalEvidence: calendarAutomationRequiredExternalEvidence,
});

export const buildCalendarAutomationArtifactReview = (
  input: Parameters<typeof buildCalendarAutomationSecretSafeArtifactReview>[0],
): CalendarAutomationArtifactReview => buildCalendarAutomationSecretSafeArtifactReview(input);

export const buildCalendarAutomationPersistedRunPayload = (): CalendarAutomationPersistedRunPayload => ({
  payloadId: "gap-059-calendar-automation-persisted-run",
  requiredArtifact: "coverage/calendar-automation-persisted-run-payload.json",
  providerBackedPersistenceRequired: true,
  localPersistenceExecutionAllowed: false,
  tenantIsolationEvidenceRequired: true,
  postgresIntegrationEvidenceRequired: true,
  googleProviderEvidenceRequired: true,
  playwrightEvidenceRequired: true,
  redactionRequired: true,
  requiredExternalEvidence: calendarAutomationRequiredExternalEvidence,
});

export const calendarAutomationArtifactPaths = [
  "coverage/calendar-automation-runtime.json",
  "coverage/calendar-automation-calendar-typecheck.txt",
  "coverage/calendar-automation-calendar-test.txt",
  "coverage/calendar-automation-signed-ics-route.json",
  "coverage/calendar-automation-availability-preview-route.json",
  "coverage/calendar-automation-postgres-integration.json",
  "coverage/calendar-automation-google-provider-redacted.json",
  "coverage/calendar-automation-timezone-provider-matrix.json",
  "coverage/calendar-automation-dashboard-playwright-redacted.json",
  "coverage/calendar-automation-public-travel-playwright-redacted.json",
  "coverage/calendar-automation-concurrent-hold-race.json",
  "coverage/calendar-automation-signed-ics-revocation-db.json",
  "coverage/calendar-automation-ci-job.json",
  "coverage/calendar-automation-artifact-retention.json",
  "coverage/calendar-automation-persisted-run-payload.json",
  "coverage/calendar-automation-secret-safe-artifacts.json",
  "test-results/calendar-automation-runtime",
] as const;

export const calendarAutomationRuntimeProofFiles = [
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "apps/web/lib/calendarAutomatedTests.ts",
  "apps/web/lib/calendarAutomatedTestsRuntime.ts",
  "apps/web/tests/calendar-automation-static.test.ts",
  "apps/web/tests/calendar-automation-runtime-static.test.ts",
  "apps/web/tests/ics-feed-route.test.ts",
  "apps/web/tests/availability-preview-route.test.ts",
  "apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts",
  "apps/web/app/api/public/[tenantSlug]/availability-preview/route.ts",
  "apps/dashboard/app/calendar/page.tsx",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type CalendarAutomationEvidenceArtifact = (typeof calendarAutomationArtifactPaths)[number];

export interface CalendarAutomationSurfaceContractEntry {
  readonly surfaceId: string;
  readonly requiredCommand:
    | (typeof calendarAutomationRuntimeCommands)[number]
    | (typeof calendarAutomationExternalCommands)[number]
    | "Playwright dashboard calendar smoke"
    | "Playwright public travel calendar smoke"
    | "retain DB logs, Google transcripts, Playwright traces, and ICS import output"
    | "review calendar/travel artifacts for provider tokens, PII, and private booking data";
  readonly requiredArtifact: CalendarAutomationEvidenceArtifact;
  readonly automationBoundary:
    | "local-route"
    | "postgres"
    | "google-provider"
    | "timezone"
    | "playwright"
    | "race-condition"
    | "signed-feed-db"
    | "ci-proof"
    | "artifact-retention";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const calendarAutomationSurfaceContract: readonly CalendarAutomationSurfaceContractEntry[] = [
  {
    surfaceId: "signed-ics-route",
    requiredCommand: "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
    requiredArtifact: "coverage/calendar-automation-signed-ics-route.json",
    automationBoundary: "local-route",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "availability-preview-route",
    requiredCommand: "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
    requiredArtifact: "coverage/calendar-automation-availability-preview-route.json",
    automationBoundary: "local-route",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "postgres-integration",
    requiredCommand: "calendar Postgres integration tests",
    requiredArtifact: "coverage/calendar-automation-postgres-integration.json",
    automationBoundary: "postgres",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "google-provider",
    requiredCommand: "Google test-calendar provider tests",
    requiredArtifact: "coverage/calendar-automation-google-provider-redacted.json",
    automationBoundary: "google-provider",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "timezone-provider-matrix",
    requiredCommand: "DST/recurrence provider matrix tests",
    requiredArtifact: "coverage/calendar-automation-timezone-provider-matrix.json",
    automationBoundary: "timezone",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-public-playwright",
    requiredCommand: "Playwright dashboard/public travel calendar smoke",
    requiredArtifact: "coverage/calendar-automation-dashboard-playwright-redacted.json",
    automationBoundary: "playwright",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "concurrent-hold-race",
    requiredCommand: "concurrent hold race-condition tests",
    requiredArtifact: "coverage/calendar-automation-concurrent-hold-race.json",
    automationBoundary: "race-condition",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "signed-feed-revocation",
    requiredCommand: "signed-feed revocation DB tests",
    requiredArtifact: "coverage/calendar-automation-signed-ics-revocation-db.json",
    automationBoundary: "signed-feed-db",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-calendar-job",
    requiredCommand: "GitHub Actions calendar lifecycle test job",
    requiredArtifact: "coverage/calendar-automation-ci-job.json",
    automationBoundary: "ci-proof",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "artifact-retention",
    requiredCommand: "calendar automation artifact retention review",
    requiredArtifact: "coverage/calendar-automation-artifact-retention.json",
    automationBoundary: "artifact-retention",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
] as const;

export interface CalendarAutomationEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly signedIcsRouteTestsPassed: boolean;
  readonly availabilityPreviewRouteTestsPassed: boolean;
  readonly postgresIntegrationTestsPassed: boolean;
  readonly googleProviderTestsPassed: boolean;
  readonly timezoneProviderMatrixPassed: boolean;
  readonly dashboardCalendarPlaywrightPassed: boolean;
  readonly publicTravelPlaywrightPassed: boolean;
  readonly concurrentHoldRaceTestsPassed: boolean;
  readonly signedIcsRevocationDbTestsPassed: boolean;
  readonly ciCalendarJobEvidenceCaptured: boolean;
  readonly artifactRetentionVerified: boolean;
  readonly persistedAutomationRunPayloadCaptured: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly CalendarAutomationEvidenceArtifact[];
}

export interface CalendarAutomationEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly CalendarAutomationEvidenceArtifact[];
  readonly requiredCommands: typeof calendarAutomationRuntimeCommands;
  readonly requiredEvidence: typeof calendarAutomationDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export type CalendarAutomationDecisionRequiredEvidence = readonly [
  ...typeof calendarAutomationRuntimeReadiness.requiredEvidence,
  "tenant-isolated persisted calendar automation run payload",
  "secret-safe review of retained calendar/travel artifacts",
];

export function buildCalendarAutomationDecisionRequiredEvidence(
  readinessEvidence: typeof calendarAutomationRuntimeReadiness.requiredEvidence,
): CalendarAutomationDecisionRequiredEvidence {
  return [
    ...readinessEvidence,
    "tenant-isolated persisted calendar automation run payload",
    "secret-safe review of retained calendar/travel artifacts",
  ];
}

export const buildCalendarAutomationEvidenceDecision = (
  input: CalendarAutomationEvidenceInput,
): CalendarAutomationEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = calendarAutomationArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.signedIcsRouteTestsPassed ? ["Signed ICS route test evidence is missing."] : []),
    ...(!input.availabilityPreviewRouteTestsPassed
      ? ["Availability preview route test evidence is missing."]
      : []),
    ...(!input.postgresIntegrationTestsPassed
      ? ["Calendar Postgres integration evidence is missing."]
      : []),
    ...(!input.googleProviderTestsPassed
      ? ["Google test-calendar provider evidence is missing."]
      : []),
    ...(!input.timezoneProviderMatrixPassed
      ? ["DST/recurrence timezone provider matrix evidence is missing."]
      : []),
    ...(!input.dashboardCalendarPlaywrightPassed
      ? ["Dashboard calendar Playwright evidence is missing."]
      : []),
    ...(!input.publicTravelPlaywrightPassed
      ? ["Public travel calendar Playwright evidence is missing."]
      : []),
    ...(!input.concurrentHoldRaceTestsPassed
      ? ["Concurrent hold race-condition evidence is missing."]
      : []),
    ...(!input.signedIcsRevocationDbTestsPassed
      ? ["Signed ICS revocation DB evidence is missing."]
      : []),
    ...(!input.ciCalendarJobEvidenceCaptured ? ["CI calendar job evidence is missing."] : []),
    ...(!input.artifactRetentionVerified
      ? ["Calendar automation artifact retention evidence is missing."]
      : []),
    ...(!input.persistedAutomationRunPayloadCaptured
      ? ["Tenant-isolated persisted calendar automation run payload is missing."]
      : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe calendar automation artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All calendar automation artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: calendarAutomationRuntimeCommands,
    requiredEvidence: calendarAutomationDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: calendarAutomationArtifactPaths.length,
    },
  };
};

export const calendarAutomationRuntimeMatrix = [
  { id: "calendar-typecheck", command: "pnpm --filter @inkroute/calendar typecheck", artifact: "coverage/calendar-automation-calendar-typecheck.txt", status: "wired" },
  { id: "calendar-helper-tests", command: "pnpm --filter @inkroute/calendar test", artifact: "coverage/calendar-automation-calendar-test.txt", status: "wired" },
  { id: "signed-ics-route", command: "pnpm vitest run apps/web/tests/ics-feed-route.test.ts", artifact: "coverage/calendar-automation-signed-ics-route.json", status: "route-gated" },
  { id: "availability-preview-route", command: "pnpm vitest run apps/web/tests/availability-preview-route.test.ts", artifact: "coverage/calendar-automation-availability-preview-route.json", status: "route-gated" },
  { id: "postgres-integration", command: "calendar Postgres integration tests", artifact: "coverage/calendar-automation-postgres-integration.json", status: "db-gated" },
  { id: "google-provider", command: "Google test-calendar provider tests", artifact: "coverage/calendar-automation-google-provider-redacted.json", status: "provider-gated" },
  { id: "timezone-provider-matrix", command: "DST/recurrence provider matrix tests", artifact: "coverage/calendar-automation-timezone-provider-matrix.json", status: "timezone-gated" },
  { id: "dashboard-calendar-playwright", command: "Playwright dashboard calendar smoke", artifact: "coverage/calendar-automation-dashboard-playwright-redacted.json", status: "playwright-gated" },
  { id: "public-travel-playwright", command: "Playwright public travel calendar smoke", artifact: "coverage/calendar-automation-public-travel-playwright-redacted.json", status: "playwright-gated" },
  { id: "concurrent-hold-race", command: "concurrent hold race-condition tests", artifact: "coverage/calendar-automation-concurrent-hold-race.json", status: "race-gated" },
  { id: "signed-ics-revocation-db", command: "signed-feed revocation DB tests", artifact: "coverage/calendar-automation-signed-ics-revocation-db.json", status: "db-gated" },
  { id: "ci-calendar-job", command: "GitHub Actions calendar lifecycle test job", artifact: "coverage/calendar-automation-ci-job.json", status: "ci-gated" },
  { id: "artifact-retention", command: "retain DB logs, Google transcripts, Playwright traces, and ICS import output", artifact: "coverage/calendar-automation-artifact-retention.json", status: "artifact-gated" },
  { id: "persisted-run-payload", command: "capture tenant-isolated persisted calendar automation run payload", artifact: "coverage/calendar-automation-persisted-run-payload.json", status: "db-gated" },
  { id: "secret-safe-artifacts", command: "review calendar/travel artifacts for provider tokens, PII, and private booking data", artifact: "coverage/calendar-automation-secret-safe-artifacts.json", status: "artifact-gated" },
] as const satisfies readonly CalendarAutomationRuntimeMatrixEntry[];

export const calendarAutomationRuntimeReadiness = buildCalendarAutomatedTestReadinessPlan({
  packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
  calendarHelperTestsPassed: false,
  signedIcsRouteTestsPassed: false,
  availabilityPreviewRouteTestsPassed: false,
  postgresIntegrationTestsPassed: false,
  googleProviderTestsPassed: false,
  timezoneProviderMatrixTestsPassed: false,
  dashboardCalendarPlaywrightPassed: false,
  publicTravelPlaywrightPassed: false,
  concurrentHoldRaceTestsPassed: false,
  signedIcsRevocationDbTestsPassed: false,
  ciCalendarTestJobConfigured: true,
  artifactsCaptured: false,
});

export const calendarAutomationDecisionRequiredEvidence =
  buildCalendarAutomationDecisionRequiredEvidence(calendarAutomationRuntimeReadiness.requiredEvidence);


