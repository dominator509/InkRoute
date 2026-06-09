import {
  auditCalendarTimezones,
  buildTimezoneRecurrenceQaPlan,
  buildTimezoneRuntimeReadinessPlan,
  isValidIanaTimezone,
  type TimezoneQaCase,
  type TimezoneQaCheck,
  type TimezoneRecurrenceQaPlan,
  type TimezoneRuntimeReadinessPlan,
} from "@inkroute/calendar";

export interface TimezoneBoundaryValidationInput {
  id: string;
  timezone: string;
  source: "route" | "persistence" | "provider";
}

export interface TimezoneBoundaryValidationResult {
  id: string;
  timezone: string;
  source: TimezoneBoundaryValidationInput["source"];
  valid: boolean;
  reason: string;
}

export interface DashboardTimezoneRecurrenceQaContract {
  requiredTimezones: readonly string[];
  requiredChecks: readonly TimezoneQaCheck[];
  qaCases: readonly TimezoneQaCase[];
  qaPlan: TimezoneRecurrenceQaPlan;
  readiness: TimezoneRuntimeReadinessPlan;
}

export const requiredSchedulingTimezones = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "Europe/London",
  "Asia/Tokyo",
] as const;

export const requiredTimezoneChecks = [
  "iana_validation",
  "dst_transition",
  "recurrence_expansion",
  "provider_render_matrix",
  "all_day_travel_window",
] as const satisfies readonly TimezoneQaCheck[];

export const dashboardTimezoneQaCases = [
  {
    id: "iana-los-angeles",
    timezone: "America/Los_Angeles",
    startsAt: "2026-06-09T16:00:00.000Z",
    endsAt: "2026-06-09T18:00:00.000Z",
    check: "iana_validation",
    expectedLocalLabel: "Los Angeles daytime tattoo session",
  },
  {
    id: "dst-spring-new-york",
    timezone: "America/New_York",
    startsAt: "2026-03-08T06:30:00.000Z",
    endsAt: "2026-03-08T08:30:00.000Z",
    check: "dst_transition",
    expectedLocalLabel: "Spring-forward boundary remains explicit",
  },
  {
    id: "dst-fall-chicago",
    timezone: "America/Chicago",
    startsAt: "2026-11-01T06:30:00.000Z",
    endsAt: "2026-11-01T08:30:00.000Z",
    check: "dst_transition",
    expectedLocalLabel: "Fall-back boundary remains explicit",
  },
  {
    id: "weekly-london-guest-spot",
    timezone: "Europe/London",
    startsAt: "2026-06-10T10:00:00.000Z",
    endsAt: "2026-06-10T12:00:00.000Z",
    check: "recurrence_expansion",
    recurrenceRule: "FREQ=WEEKLY;COUNT=4",
    expandedOccurrenceCount: 4,
  },
  {
    id: "tokyo-provider-render",
    timezone: "Asia/Tokyo",
    startsAt: "2026-06-11T00:00:00.000Z",
    endsAt: "2026-06-11T02:00:00.000Z",
    check: "provider_render_matrix",
    provider: "google",
    expectedLocalLabel: "Tokyo Google render smoke",
  },
  {
    id: "all-day-la-travel",
    timezone: "America/Los_Angeles",
    startsAt: "2026-06-12T07:00:00.000Z",
    endsAt: "2026-06-13T07:00:00.000Z",
    check: "all_day_travel_window",
    provider: "ics",
    expectedLocalLabel: "All-day travel window renders in city timezone",
  },
] as const satisfies readonly TimezoneQaCase[];

export function validateTimezoneBoundaries(
  inputs: readonly TimezoneBoundaryValidationInput[],
): readonly TimezoneBoundaryValidationResult[] {
  return inputs.map((input) => {
    const valid = isValidIanaTimezone(input.timezone);
    return {
      ...input,
      valid,
      reason: valid
        ? "Timezone is a trimmed region-style IANA identifier."
        : "Timezone must be trimmed and use a valid region-style IANA identifier before persistence or provider rendering.",
    };
  });
}

export function buildDashboardTimezoneQaPlan(): TimezoneRecurrenceQaPlan {
  return buildTimezoneRecurrenceQaPlan({
    cases: dashboardTimezoneQaCases,
    requiredTimezones: requiredSchedulingTimezones,
    requiredChecks: requiredTimezoneChecks,
    temporalStrategySelected: true,
    providerRenderSmokeTested: false,
  });
}

export function buildDashboardTimezoneReadiness(): TimezoneRuntimeReadinessPlan {
  return buildTimezoneRuntimeReadinessPlan({
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
}

export function buildDashboardTimezoneRecurrenceQaContract(): DashboardTimezoneRecurrenceQaContract {
  return {
    requiredTimezones: requiredSchedulingTimezones,
    requiredChecks: requiredTimezoneChecks,
    qaCases: dashboardTimezoneQaCases,
    qaPlan: buildDashboardTimezoneQaPlan(),
    readiness: buildDashboardTimezoneReadiness(),
  };
}

export function auditDashboardCalendarTimezoneInputs(input: {
  windows?: readonly { id: string; timezone: string }[];
  travelStops?: readonly { id: string; timezone: string }[];
}) {
  return auditCalendarTimezones({
    windows: input.windows,
    travelStops: input.travelStops,
    requiredTimezones: requiredSchedulingTimezones,
  });
}

export const dashboardTimezoneRecurrenceQaContract = buildDashboardTimezoneRecurrenceQaContract();
