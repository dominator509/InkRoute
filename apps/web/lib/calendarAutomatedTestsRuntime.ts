import { buildCalendarAutomatedTestReadinessPlan } from "@inkroute/calendar";

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

export const calendarAutomationRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
  "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
  "calendar Postgres integration tests",
  "Google test-calendar provider tests",
  "Playwright dashboard/public travel calendar smoke",
] as const;

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
  "coverage/calendar-automation-secret-safe-artifacts.json",
  "test-results/calendar-automation-runtime",
] as const;

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
