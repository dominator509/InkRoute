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

const calendarAutomationPrivateArtifactKeys = [
  "googleAccessToken",
  "googleRefreshToken",
  "icsFeedToken",
  "signedFeedToken",
  "clientEmail",
  "clientName",
  "privateBookingNotes",
  "locationPrivateNotes",
] as const;

type CalendarAutomationArtifactPayload = Record<string, unknown>;

const calendarAutomationPrivateArtifactKeySet = new Set<string>(calendarAutomationPrivateArtifactKeys);

function redactCalendarAutomationArtifactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactCalendarAutomationArtifactValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as CalendarAutomationArtifactPayload).map(([key, entry]) => [
        key,
        calendarAutomationPrivateArtifactKeySet.has(key)
          ? "[redacted]"
          : redactCalendarAutomationArtifactValue(entry),
      ]),
    );
  }

  return value;
}

function collectCalendarAutomationPrivateValues(payload: CalendarAutomationArtifactPayload): readonly string[] {
  const values: string[] = [];

  const visit = (value: unknown, key?: string): void => {
    if (calendarAutomationPrivateArtifactKeySet.has(key ?? "") && typeof value === "string" && value.length > 0) {
      values.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        visit(entry);
      }
      return;
    }

    if (value && typeof value === "object") {
      for (const [entryKey, entryValue] of Object.entries(value as CalendarAutomationArtifactPayload)) {
        visit(entryValue, entryKey);
      }
    }
  };

  visit(payload);
  return values;
}

export function buildRedactedCalendarAutomationArtifact(input: {
  readonly artifactId: string;
  readonly payload: CalendarAutomationArtifactPayload;
}): { readonly artifactId: string; readonly payload: Record<string, unknown>; readonly redactedSummary: string } {
  return {
    artifactId: input.artifactId,
    payload: redactCalendarAutomationArtifactValue(input.payload) as CalendarAutomationArtifactPayload,
    redactedSummary:
      "Calendar automation artifacts redact provider tokens, signed-feed tokens, client PII, and private booking/location notes before retention.",
  };
}

export function buildCalendarAutomationSecretSafeArtifactReview(input: {
  readonly artifacts: readonly {
    readonly artifactId: string;
    readonly payload: CalendarAutomationArtifactPayload;
  }[];
}): {
  readonly passed: boolean;
  readonly reviewedArtifactIds: readonly string[];
  readonly blockers: readonly string[];
  readonly redactedArtifacts: readonly ReturnType<typeof buildRedactedCalendarAutomationArtifact>[];
} {
  const redactedArtifacts = input.artifacts.map((artifact) => buildRedactedCalendarAutomationArtifact(artifact));
  const redactedSerialized = JSON.stringify(redactedArtifacts);
  const privateValues = input.artifacts.flatMap((artifact) => collectCalendarAutomationPrivateValues(artifact.payload));
  const leakedValues = privateValues.filter((value) => redactedSerialized.includes(value));
  const blockers = [
    ...(input.artifacts.length === 0 ? ["Calendar automation artifact review requires at least one retained artifact."] : []),
    ...(leakedValues.length > 0
      ? ["Calendar automation artifact review found unredacted provider token, signed-feed token, PII, or private booking data."]
      : []),
  ];

  return {
    passed: blockers.length === 0,
    reviewedArtifactIds: input.artifacts.map((artifact) => artifact.artifactId),
    blockers,
    redactedArtifacts,
  };
}

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
