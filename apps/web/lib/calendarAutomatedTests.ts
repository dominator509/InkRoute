import {
  buildCalendarAutomatedTestReadinessPlan,
  type CalendarAutomatedTestReadinessPlan,
} from "@inkroute/calendar";

export type CalendarAutomatedTestSuiteId =
  | "calendar-helper-unit"
  | "signed-ics-route"
  | "availability-preview-route"
  | "calendar-postgres-integration"
  | "google-provider"
  | "timezone-provider-matrix"
  | "dashboard-calendar-playwright"
  | "public-travel-playwright"
  | "concurrent-hold-race"
  | "signed-ics-revocation-db";

export interface CalendarAutomatedTestSuite {
  id: CalendarAutomatedTestSuiteId;
  command: string;
  requiredArtifact: string;
  secretPolicy: "redacted-only";
}

export interface CalendarAutomatedTestContract {
  suites: readonly CalendarAutomatedTestSuite[];
  ciArtifactPaths: readonly string[];
  readiness: CalendarAutomatedTestReadinessPlan;
}

export const calendarAutomatedTestSuites = [
  {
    id: "calendar-helper-unit",
    command: "pnpm --filter @inkroute/calendar test",
    requiredArtifact: "coverage/calendar-helper-unit.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "signed-ics-route",
    command: "pnpm vitest run apps/web/tests/ics-feed-route.test.ts apps/web/tests/signed-ics-feed-static.test.ts",
    requiredArtifact: "coverage/signed-ics-route.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "availability-preview-route",
    command: "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
    requiredArtifact: "coverage/availability-preview-route.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "calendar-postgres-integration",
    command: "pnpm vitest run apps/dashboard/tests/availability-persistence-static.test.ts",
    requiredArtifact: "coverage/calendar-postgres-integration.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "google-provider",
    command: "pnpm vitest run apps/dashboard/tests/google-calendar-sync-static.test.ts",
    requiredArtifact: "coverage/google-provider-redacted.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "timezone-provider-matrix",
    command: "pnpm vitest run apps/dashboard/tests/timezone-recurrence-qa-static.test.ts",
    requiredArtifact: "coverage/timezone-provider-matrix.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "dashboard-calendar-playwright",
    command: "pnpm test:e2e -- --grep @calendar-dashboard",
    requiredArtifact: "coverage/playwright-calendar-dashboard-results.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "public-travel-playwright",
    command: "pnpm test:e2e -- --grep @public-travel",
    requiredArtifact: "coverage/playwright-public-travel-results.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "concurrent-hold-race",
    command: "pnpm vitest run apps/dashboard/tests/availability-persistence-static.test.ts",
    requiredArtifact: "coverage/concurrent-hold-race.json",
    secretPolicy: "redacted-only",
  },
  {
    id: "signed-ics-revocation-db",
    command: "pnpm vitest run apps/web/tests/signed-ics-feed-static.test.ts",
    requiredArtifact: "coverage/signed-ics-revocation-db.json",
    secretPolicy: "redacted-only",
  },
] as const satisfies readonly CalendarAutomatedTestSuite[];

export const calendarCiArtifactPaths = [
  "coverage/calendar-*.json",
  "coverage/signed-ics-*.json",
  "coverage/google-provider-redacted.json",
  "coverage/timezone-provider-matrix.json",
  "coverage/playwright-calendar-*.json",
  "coverage/playwright-public-travel-results.json",
  "test-results/calendar",
  "test-results/travel",
] as const;

export function buildCalendarAutomatedTestContract(): CalendarAutomatedTestContract {
  return {
    suites: calendarAutomatedTestSuites,
    ciArtifactPaths: calendarCiArtifactPaths,
    readiness: buildCalendarAutomatedTestReadinessPlan({
      packageScripts: {
        test: "vitest run",
        typecheck: "tsc --noEmit",
      },
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
    }),
  };
}

export const calendarAutomatedTestContract = buildCalendarAutomatedTestContract();
