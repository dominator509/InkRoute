import { buildCalendarLaunchEvidencePlan } from "@inkroute/calendar";

export type CalendarLaunchRuntimeStatus =
  | "wired"
  | "database-gated"
  | "google-gated"
  | "ics-gated"
  | "qa-gated"
  | "ci-gated";

export interface CalendarLaunchRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: CalendarLaunchRuntimeStatus;
}

export const calendarLaunchRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "availability Postgres integration tests",
  "concurrent slot hold race-condition tests",
  "Google Calendar OAuth/freebusy/event-sync smoke tests",
  "signed ICS token DB and route tests",
  "Apple/Google/Outlook ICS import smoke tests",
  "timezone DST and provider render matrix QA",
  "dashboard/public travel calendar smoke tests",
  "GitHub Actions calendar launch evidence job",
] as const;

export const calendarLaunchReadinessAreas = [
  "calendar-typecheck-test",
  "tenant-scoped-availability-repositories",
  "postgres-availability-integration",
  "concurrent-hold-race-rejection",
  "tenant-isolation",
  "google-oauth-config",
  "google-encrypted-refresh-token-persistence",
  "google-provider-sync-worker",
  "google-freebusy-smoke",
  "google-event-create-update-delete-sync",
  "google-push-or-incremental-recovery",
  "signed-ics-token-persistence",
  "signed-ics-route-access",
  "signed-ics-client-imports",
  "timezone-dst-recurrence-qa",
  "provider-render-matrix",
  "travel-publish-persistence-rollback",
  "cache-revalidation",
  "dashboard-calendar-smoke",
  "public-travel-smoke",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const calendarLaunchArtifactPaths = [
  "coverage/calendar-launch-runtime.json",
  "coverage/calendar-typecheck.txt",
  "coverage/calendar-test.txt",
  "coverage/calendar-postgres-availability.json",
  "coverage/calendar-concurrent-hold-race.json",
  "coverage/calendar-tenant-isolation.json",
  "coverage/calendar-google-oauth-redacted.json",
  "coverage/calendar-google-freebusy-sync.json",
  "coverage/calendar-google-push-incremental.json",
  "coverage/calendar-signed-ics-token-route.json",
  "coverage/calendar-ics-client-imports.json",
  "coverage/calendar-timezone-provider-matrix.json",
  "coverage/calendar-travel-publish-cache.json",
  "coverage/calendar-dashboard-public-smoke.json",
  "coverage/calendar-ci-evidence.json",
  "coverage/calendar-secret-safe-artifacts.json",
  "test-results/calendar-launch-runtime",
] as const;

export const calendarLaunchRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/calendar-test.txt",
    status: "wired",
  },
  {
    id: "postgres-availability-integration",
    command: "availability Postgres integration tests",
    artifact: "coverage/calendar-postgres-availability.json",
    status: "database-gated",
  },
  {
    id: "concurrent-hold-race",
    command: "concurrent slot hold race-condition tests",
    artifact: "coverage/calendar-concurrent-hold-race.json",
    status: "database-gated",
  },
  {
    id: "tenant-isolation",
    command: "calendar tenant-isolation tests",
    artifact: "coverage/calendar-tenant-isolation.json",
    status: "database-gated",
  },
  {
    id: "google-oauth-freebusy-sync",
    command: "Google Calendar OAuth/freebusy/event-sync smoke tests",
    artifact: "coverage/calendar-google-freebusy-sync.json",
    status: "google-gated",
  },
  {
    id: "google-push-incremental-recovery",
    command: "Google push channel or incremental sync recovery verification",
    artifact: "coverage/calendar-google-push-incremental.json",
    status: "google-gated",
  },
  {
    id: "signed-ics-token-route",
    command: "signed ICS token DB and route tests",
    artifact: "coverage/calendar-signed-ics-token-route.json",
    status: "ics-gated",
  },
  {
    id: "ics-client-imports",
    command: "Apple/Google/Outlook ICS import smoke tests",
    artifact: "coverage/calendar-ics-client-imports.json",
    status: "ics-gated",
  },
  {
    id: "timezone-provider-matrix",
    command: "timezone DST and provider render matrix QA",
    artifact: "coverage/calendar-timezone-provider-matrix.json",
    status: "qa-gated",
  },
  {
    id: "travel-publish-cache-smoke",
    command: "dashboard/public travel calendar smoke tests with publish persistence and cache revalidation",
    artifact: "coverage/calendar-travel-publish-cache.json",
    status: "qa-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions calendar launch evidence job",
    artifact: "coverage/calendar-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly CalendarLaunchRuntimeMatrixEntry[];

export const calendarLaunchRuntimeReadiness = buildCalendarLaunchEvidencePlan({
  packageScripts: {
    typecheck: "tsc --noEmit",
    test: "vitest run --passWithNoTests",
  },
  calendarTypecheckPassed: false,
  calendarTestsPassed: false,
  availabilityRepositoriesImplemented: false,
  availabilityPostgresIntegrationPassed: false,
  concurrentHoldRaceTestsPassed: false,
  tenantIsolationTestsPassed: false,
  googleOauthConfigured: false,
  googleEncryptedTokensConfigured: false,
  googleWorkerEnabled: false,
  googleFreebusySmokePassed: false,
  googleEventSyncSmokePassed: false,
  googlePushOrIncrementalSyncVerified: false,
  signedIcsTokenPersistenceConfigured: false,
  signedIcsAccessSmokePassed: false,
  signedIcsClientImportSmokePassed: false,
  timezoneDstQaPassed: false,
  providerRenderMatrixPassed: false,
  travelPublishPersistencePassed: false,
  cacheRevalidationVerified: false,
  dashboardCalendarSmokePassed: false,
  publicTravelSmokePassed: false,
  ciEvidenceCaptured: false,
  calendarArtifactsSecretSafe: false,
});
