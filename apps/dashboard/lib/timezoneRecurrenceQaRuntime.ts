import { buildTimezoneRuntimeReadinessPlan } from "@inkroute/calendar";

export type TimezoneRecurrenceRuntimeStatus =
  | "wired"
  | "strategy-gated"
  | "boundary-gated"
  | "dst-gated"
  | "recurrence-gated"
  | "provider-gated"
  | "persistence-gated"
  | "ci-gated";

export interface TimezoneRecurrenceRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: TimezoneRecurrenceRuntimeStatus;
}

export const timezoneRecurrenceRuntimeCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "timezone route/persistence boundary tests",
  "stored recurrence expansion integration tests",
  "Google Calendar timezone render smoke",
  "ICS timezone import/render smoke",
] as const;

export const timezoneRecurrenceArtifactPaths = [
  "coverage/timezone-recurrence-runtime.json",
  "coverage/timezone-recurrence-calendar-typecheck.txt",
  "coverage/timezone-recurrence-calendar-test.txt",
  "coverage/timezone-recurrence-strategy.json",
  "coverage/timezone-recurrence-temporal-library.json",
  "coverage/timezone-recurrence-route-iana-validation.json",
  "coverage/timezone-recurrence-persistence-iana-validation.json",
  "coverage/timezone-recurrence-utc-plus-timezone-storage.json",
  "coverage/timezone-recurrence-dst-spring.json",
  "coverage/timezone-recurrence-dst-fall.json",
  "coverage/timezone-recurrence-expansion.json",
  "coverage/timezone-recurrence-all-day-travel.json",
  "coverage/timezone-recurrence-cross-city-render.json",
  "coverage/timezone-recurrence-provider-render.json",
  "coverage/timezone-recurrence-google-render-redacted.json",
  "coverage/timezone-recurrence-ics-render-redacted.json",
  "coverage/timezone-recurrence-seeded-persistence.json",
  "coverage/timezone-recurrence-secret-safe-artifacts.json",
  "test-results/timezone-recurrence-runtime",
] as const;

export const timezoneRecurrenceRuntimeMatrix = [
  {
    id: "calendar-typecheck",
    command: "pnpm --filter @inkroute/calendar typecheck",
    artifact: "coverage/timezone-recurrence-calendar-typecheck.txt",
    status: "wired",
  },
  {
    id: "calendar-tests",
    command: "pnpm --filter @inkroute/calendar test",
    artifact: "coverage/timezone-recurrence-calendar-test.txt",
    status: "wired",
  },
  {
    id: "timezone-strategy",
    command: "document selected timezone/date strategy",
    artifact: "coverage/timezone-recurrence-strategy.json",
    status: "wired",
  },
  {
    id: "temporal-date-library",
    command: "implement Temporal/date-library at route, persistence, and provider boundaries",
    artifact: "coverage/timezone-recurrence-temporal-library.json",
    status: "strategy-gated",
  },
  {
    id: "route-iana-validation",
    command: "timezone route/persistence boundary tests",
    artifact: "coverage/timezone-recurrence-route-iana-validation.json",
    status: "wired",
  },
  {
    id: "persistence-iana-validation",
    command: "enforce IANA timezone validation in durable repositories",
    artifact: "coverage/timezone-recurrence-persistence-iana-validation.json",
    status: "boundary-gated",
  },
  {
    id: "utc-plus-timezone-storage",
    command: "prove UTC instants plus IANA timezone identifiers are stored",
    artifact: "coverage/timezone-recurrence-utc-plus-timezone-storage.json",
    status: "wired",
  },
  {
    id: "dst-spring",
    command: "DST spring-forward behavior tests",
    artifact: "coverage/timezone-recurrence-dst-spring.json",
    status: "dst-gated",
  },
  {
    id: "dst-fall",
    command: "DST fall-back behavior tests",
    artifact: "coverage/timezone-recurrence-dst-fall.json",
    status: "dst-gated",
  },
  {
    id: "recurrence-expansion",
    command: "stored recurrence expansion integration tests",
    artifact: "coverage/timezone-recurrence-expansion.json",
    status: "recurrence-gated",
  },
  {
    id: "all-day-travel",
    command: "all-day/travel window floating-time drift tests",
    artifact: "coverage/timezone-recurrence-all-day-travel.json",
    status: "recurrence-gated",
  },
  {
    id: "cross-city-render",
    command: "cross-city rendering tests for Los Angeles, Phoenix, New York, and Chicago",
    artifact: "coverage/timezone-recurrence-cross-city-render.json",
    status: "provider-gated",
  },
  {
    id: "provider-render",
    command: "internal/provider rendered calendar label smoke tests",
    artifact: "coverage/timezone-recurrence-provider-render.json",
    status: "provider-gated",
  },
  {
    id: "google-render",
    command: "Google Calendar timezone render smoke",
    artifact: "coverage/timezone-recurrence-google-render-redacted.json",
    status: "provider-gated",
  },
  {
    id: "ics-render",
    command: "ICS timezone import/render smoke",
    artifact: "coverage/timezone-recurrence-ics-render-redacted.json",
    status: "provider-gated",
  },
  {
    id: "seeded-persistence-boundary",
    command: "seeded persistence-boundary tests for stored availability, appointments, travel windows, and recurrence expansion",
    artifact: "coverage/timezone-recurrence-seeded-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions timezone/recurrence QA evidence job",
    artifact: "coverage/timezone-recurrence-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly TimezoneRecurrenceRuntimeMatrixEntry[];

export const timezoneRecurrenceRuntimeReadiness = buildTimezoneRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run",
    typecheck: "tsc --noEmit",
  },
  calendarTestsPassed: false,
  calendarTypecheckPassed: false,
  timezoneStrategySelected: true,
  temporalOrDateLibraryImplemented: false,
  routeIanaValidationEnforced: true,
  persistenceIanaValidationEnforced: true,
  storedUtcAndTimezoneVerified: true,
  dstSpringForwardTested: false,
  dstFallBackTested: false,
  recurringAvailabilityExpansionTested: false,
  allDayTravelWindowTested: false,
  crossCityRenderingTested: false,
  providerRenderSmokeTested: false,
  googleProviderTimezoneSmokeTested: false,
  icsProviderTimezoneSmokeTested: false,
  seededPersistenceBoundaryTestsPassed: false,
});
