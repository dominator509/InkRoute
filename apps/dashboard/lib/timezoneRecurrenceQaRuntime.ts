import { buildExplicitTimezoneDateBoundaryEvidence, buildTimezoneRuntimeReadinessPlan } from "@inkroute/calendar";

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

export const timezoneRecurrenceRuntimeProofFiles = [
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "packages/db/prisma/schema.prisma",
  "apps/dashboard/lib/timezoneRecurrenceQa.ts",
  "apps/dashboard/lib/timezoneRecurrenceQaRuntime.ts",
  "apps/dashboard/app/api/calendar/timezone-qa/route.ts",
  "apps/dashboard/app/api/calendar/route.ts",
  "apps/dashboard/tests/timezone-recurrence-qa-static.test.ts",
  "apps/dashboard/tests/timezone-recurrence-qa-runtime-static.test.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "testing/manifests/unit-test-manifest.json",
  ".github/workflows/ci.yml",
] as const;

export type TimezoneRecurrenceEvidenceArtifact = (typeof timezoneRecurrenceArtifactPaths)[number];

export interface TimezoneRecurrenceExecutionPolicy {
  readonly codexMayClassifyStaticTimezoneRecurrenceReadiness: true;
  readonly temporalDateLibraryRequiredForClosure: true;
  readonly persistenceBoundaryRequiredForClosure: true;
  readonly dstRecurrenceIntegrationRequiredForClosure: true;
  readonly providerRenderSmokeRequiredForClosure: true;
  readonly seededPersistenceRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface TimezoneRecurrenceExecutionPlan {
  readonly policy: typeof timezoneRecurrenceExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly temporalLibraryExecutionAllowed: false;
  readonly persistenceBoundaryExecutionAllowed: false;
  readonly providerRenderExecutionAllowed: false;
  readonly seededPersistenceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof timezoneRecurrenceLocalCommands;
  readonly externalCommands: typeof timezoneRecurrenceExternalCommands;
  readonly requiredExternalEvidence: typeof timezoneRecurrenceRequiredExternalEvidence;
}

export interface TimezoneRecurrenceArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof timezoneRecurrenceRequiredExternalEvidence;
}

export interface TimezoneRecurrenceEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly timezoneStrategyVerified: boolean;
  readonly temporalDateLibraryVerified: boolean;
  readonly routeIanaValidationVerified: boolean;
  readonly persistenceIanaValidationVerified: boolean;
  readonly utcPlusTimezoneStorageVerified: boolean;
  readonly dstSpringVerified: boolean;
  readonly dstFallVerified: boolean;
  readonly recurrenceExpansionVerified: boolean;
  readonly allDayTravelVerified: boolean;
  readonly crossCityRenderVerified: boolean;
  readonly providerRenderVerified: boolean;
  readonly googleRenderSmokePassed: boolean;
  readonly icsRenderSmokePassed: boolean;
  readonly seededPersistenceBoundaryVerified: boolean;
  readonly secretSafeArtifactReviewPassed: boolean;
  readonly capturedArtifacts: readonly TimezoneRecurrenceEvidenceArtifact[];
}

export interface TimezoneRecurrenceEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly blockers: readonly string[];
  readonly missingArtifacts: readonly TimezoneRecurrenceEvidenceArtifact[];
  readonly requiredCommands: typeof timezoneRecurrenceRuntimeCommands;
  readonly requiredEvidence: typeof timezoneRecurrenceDecisionRequiredEvidence;
  readonly redactedSummary: {
    readonly capturedArtifactCount: number;
    readonly requiredArtifactCount: number;
  };
}

export const timezoneRecurrenceExecutionPolicy = {
  codexMayClassifyStaticTimezoneRecurrenceReadiness: true,
  temporalDateLibraryRequiredForClosure: true,
  persistenceBoundaryRequiredForClosure: true,
  dstRecurrenceIntegrationRequiredForClosure: true,
  providerRenderSmokeRequiredForClosure: true,
  seededPersistenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies TimezoneRecurrenceExecutionPolicy;

export const timezoneRecurrenceRequiredExternalEvidence = [
  "Temporal/date-library implementation proof",
  "route/persistence IANA validation proof",
  "UTC+timezone storage proof",
  "DST spring/fall integration proof",
  "stored recurrence expansion integration tests",
  "all-day travel drift tests",
  "cross-city rendering artifacts",
  "Google Calendar timezone render smoke",
  "ICS timezone import/render smoke",
  "seeded persistence-boundary evidence",
  "CI timezone recurrence evidence",
  "secret-safe timezone recurrence artifact review",
] as const;

export const timezoneRecurrenceDecisionRequiredEvidence = [
  "documented Temporal/date-library strategy with route, persistence, provider, and render usage",
  "route and persistence IANA validation plus UTC+timezone storage evidence",
  "DST, recurrence expansion, and all-day travel-window test output",
  "cross-city internal, Google, and ICS provider render smoke-test artifacts",
  "seeded persistence-boundary tests for stored availability, appointments, travel windows, and recurrence expansion",
  "secret-safe review of retained timezone recurrence artifacts",
] as const;

export const timezoneRecurrenceLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
  "pnpm vitest run apps/dashboard/tests/timezone-recurrence-qa-static.test.ts",
  "static local timezone recurrence evidence builder review",
] as const;

export const timezoneRecurrenceExternalCommands = [
  "timezone route/persistence boundary tests",
  "stored recurrence expansion integration tests",
  "Google Calendar timezone render smoke",
  "ICS timezone import/render smoke",
  "seeded persistence-boundary tests",
  "GitHub Actions timezone recurrence QA evidence job",
] as const;

const sensitiveTimezoneRecurrenceArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|timezone|calendar|google|ics|artist|appointment|travel|recurrence|availability|email|phone|medical|payment|customer)/i;

const redactTimezoneRecurrenceArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactTimezoneRecurrenceArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveTimezoneRecurrenceArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactTimezoneRecurrenceArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const buildTimezoneRecurrenceExecutionPlan = (): TimezoneRecurrenceExecutionPlan => ({
  policy: timezoneRecurrenceExecutionPolicy,
  commandExecutionAllowed: false,
  temporalLibraryExecutionAllowed: false,
  persistenceBoundaryExecutionAllowed: false,
  providerRenderExecutionAllowed: false,
  seededPersistenceExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: timezoneRecurrenceLocalCommands,
  externalCommands: timezoneRecurrenceExternalCommands,
  requiredExternalEvidence: timezoneRecurrenceRequiredExternalEvidence,
});

export const buildRedactedTimezoneRecurrenceArtifact = (artifact: unknown): Pick<TimezoneRecurrenceArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactTimezoneRecurrenceArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildTimezoneRecurrenceArtifactReview = (artifact: unknown): TimezoneRecurrenceArtifactReview => {
  const redacted = buildRedactedTimezoneRecurrenceArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: timezoneRecurrenceRequiredExternalEvidence,
  };
};

export const buildTimezoneRecurrenceEvidenceDecision = (
  input: TimezoneRecurrenceEvidenceInput,
): TimezoneRecurrenceEvidenceDecision => {
  const captured = new Set(input.capturedArtifacts);
  const missingArtifacts = timezoneRecurrenceArtifactPaths.filter((artifact) => !captured.has(artifact));
  const blockers = [
    ...(!input.calendarTypecheckPassed ? ["Calendar package typecheck evidence is missing."] : []),
    ...(!input.calendarTestsPassed ? ["Calendar package test evidence is missing."] : []),
    ...(!input.timezoneStrategyVerified ? ["Timezone strategy evidence is missing."] : []),
    ...(!input.temporalDateLibraryVerified
      ? ["Temporal/date-library implementation evidence is missing."]
      : []),
    ...(!input.routeIanaValidationVerified ? ["Route IANA timezone validation evidence is missing."] : []),
    ...(!input.persistenceIanaValidationVerified
      ? ["Persistence IANA timezone validation evidence is missing."]
      : []),
    ...(!input.utcPlusTimezoneStorageVerified
      ? ["UTC instant plus IANA timezone storage evidence is missing."]
      : []),
    ...(!input.dstSpringVerified ? ["DST spring-forward test evidence is missing."] : []),
    ...(!input.dstFallVerified ? ["DST fall-back test evidence is missing."] : []),
    ...(!input.recurrenceExpansionVerified ? ["Stored recurrence expansion evidence is missing."] : []),
    ...(!input.allDayTravelVerified ? ["All-day travel-window evidence is missing."] : []),
    ...(!input.crossCityRenderVerified ? ["Cross-city calendar rendering evidence is missing."] : []),
    ...(!input.providerRenderVerified ? ["Internal/provider render evidence is missing."] : []),
    ...(!input.googleRenderSmokePassed ? ["Google Calendar timezone render smoke evidence is missing."] : []),
    ...(!input.icsRenderSmokePassed ? ["ICS timezone import/render smoke evidence is missing."] : []),
    ...(!input.seededPersistenceBoundaryVerified
      ? ["Seeded persistence-boundary timezone evidence is missing."]
      : []),
    ...(!input.secretSafeArtifactReviewPassed
      ? ["Secret-safe timezone recurrence artifact review evidence is missing."]
      : []),
    ...(missingArtifacts.length > 0 ? ["All timezone recurrence artifacts must be captured."] : []),
  ];

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    blockers,
    missingArtifacts,
    requiredCommands: timezoneRecurrenceRuntimeCommands,
    requiredEvidence: timezoneRecurrenceDecisionRequiredEvidence,
    redactedSummary: {
      capturedArtifactCount: captured.size,
      requiredArtifactCount: timezoneRecurrenceArtifactPaths.length,
    },
  };
};

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
    command: "document explicit Intl.DateTimeFormat timezone/date boundary at route, persistence, provider, and render boundaries",
    artifact: "coverage/timezone-recurrence-temporal-library.json",
    status: "wired",
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
  temporalOrDateLibraryImplemented: buildExplicitTimezoneDateBoundaryEvidence().status === "ready",
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


