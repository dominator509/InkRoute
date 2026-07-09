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

export interface CalendarLaunchRunPersistenceContract {
  readonly model: "CalendarLaunchRun";
  readonly tenantRelation: "calendarLaunchRuns";
  readonly migration: "20260609033300_add_calendar_launch_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "googleSyncManifest",
    "signedIcsManifest",
    "timezoneQaManifest",
  ];
  readonly evidenceBooleans: readonly [
    "calendarTypecheckPassed",
    "calendarTestsPassed",
    "availabilityRepositoriesImplemented",
    "availabilityPostgresIntegrationPassed",
    "concurrentHoldRaceTestsPassed",
    "tenantIsolationTestsPassed",
    "googleOauthConfigured",
    "googleEncryptedTokensConfigured",
    "googleWorkerEnabled",
    "googleFreebusySmokePassed",
    "googleEventSyncSmokePassed",
    "googlePushOrIncrementalSyncVerified",
    "signedIcsTokenPersistenceConfigured",
    "signedIcsAccessSmokePassed",
    "signedIcsClientImportSmokePassed",
    "timezoneDstQaPassed",
    "providerRenderMatrixPassed",
    "travelPublishPersistencePassed",
    "cacheRevalidationVerified",
    "dashboardCalendarSmokePassed",
    "publicTravelSmokePassed",
    "ciEvidenceCaptured",
    "calendarArtifactsSecretSafe",
  ];
  readonly artifactFields: readonly [
    "calendarTypecheckArtifactPath",
    "calendarTestArtifactPath",
    "postgresAvailabilityArtifactPath",
    "concurrentHoldRaceArtifactPath",
    "tenantIsolationArtifactPath",
    "googleOauthArtifactPath",
    "googleFreebusySyncArtifactPath",
    "googlePushIncrementalArtifactPath",
    "signedIcsTokenRouteArtifactPath",
    "icsClientImportsArtifactPath",
    "timezoneProviderMatrixArtifactPath",
    "travelPublishCacheArtifactPath",
    "dashboardPublicSmokeArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const calendarLaunchRunPersistenceContract: CalendarLaunchRunPersistenceContract = {
  model: "CalendarLaunchRun",
  tenantRelation: "calendarLaunchRuns",
  migration: "20260609033300_add_calendar_launch_runs",
  jsonFields: [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "googleSyncManifest",
    "signedIcsManifest",
    "timezoneQaManifest",
  ],
  evidenceBooleans: [
    "calendarTypecheckPassed",
    "calendarTestsPassed",
    "availabilityRepositoriesImplemented",
    "availabilityPostgresIntegrationPassed",
    "concurrentHoldRaceTestsPassed",
    "tenantIsolationTestsPassed",
    "googleOauthConfigured",
    "googleEncryptedTokensConfigured",
    "googleWorkerEnabled",
    "googleFreebusySmokePassed",
    "googleEventSyncSmokePassed",
    "googlePushOrIncrementalSyncVerified",
    "signedIcsTokenPersistenceConfigured",
    "signedIcsAccessSmokePassed",
    "signedIcsClientImportSmokePassed",
    "timezoneDstQaPassed",
    "providerRenderMatrixPassed",
    "travelPublishPersistencePassed",
    "cacheRevalidationVerified",
    "dashboardCalendarSmokePassed",
    "publicTravelSmokePassed",
    "ciEvidenceCaptured",
    "calendarArtifactsSecretSafe",
  ],
  artifactFields: [
    "calendarTypecheckArtifactPath",
    "calendarTestArtifactPath",
    "postgresAvailabilityArtifactPath",
    "concurrentHoldRaceArtifactPath",
    "tenantIsolationArtifactPath",
    "googleOauthArtifactPath",
    "googleFreebusySyncArtifactPath",
    "googlePushIncrementalArtifactPath",
    "signedIcsTokenRouteArtifactPath",
    "icsClientImportsArtifactPath",
    "timezoneProviderMatrixArtifactPath",
    "travelPublishCacheArtifactPath",
    "dashboardPublicSmokeArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

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

export const calendarLaunchRuntimeProofFiles = [
  "packages/calendar/package.json",
  "packages/calendar/src/index.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "apps/dashboard/app/api/calendar/route.ts",
  "apps/dashboard/tests/calendar-read-route-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts",
  "apps/web/lib/calendarLaunchRuntime.ts",
  "apps/web/tests/calendar-launch-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609033300_add_calendar_launch_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type CalendarLaunchRuntimeCommand = (typeof calendarLaunchRuntimeCommands)[number];
export type CalendarLaunchReadinessArea = (typeof calendarLaunchReadinessAreas)[number];
export type CalendarLaunchArtifact = (typeof calendarLaunchArtifactPaths)[number];

export interface CalendarLaunchSurfaceContractEntry {
  readonly surfaceId: string;
  readonly readinessArea: CalendarLaunchReadinessArea;
  readonly requiredCommand: CalendarLaunchRuntimeCommand;
  readonly requiredArtifact: CalendarLaunchArtifact;
  readonly launchBoundary:
    | "postgres"
    | "concurrency"
    | "tenant-isolation"
    | "google-provider"
    | "signed-ics"
    | "timezone-provider"
    | "travel-smoke"
    | "ci-proof";
  readonly providerBackedEvidenceRequired: boolean;
  readonly redactedArtifactRequired: true;
}

export const calendarLaunchSurfaceContract: readonly CalendarLaunchSurfaceContractEntry[] = [
  {
    surfaceId: "postgres-availability",
    readinessArea: "postgres-availability-integration",
    requiredCommand: "availability Postgres integration tests",
    requiredArtifact: "coverage/calendar-postgres-availability.json",
    launchBoundary: "postgres",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "concurrent-hold-race",
    readinessArea: "concurrent-hold-race-rejection",
    requiredCommand: "concurrent slot hold race-condition tests",
    requiredArtifact: "coverage/calendar-concurrent-hold-race.json",
    launchBoundary: "concurrency",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "tenant-isolated-availability",
    readinessArea: "tenant-isolation",
    requiredCommand: "availability Postgres integration tests",
    requiredArtifact: "coverage/calendar-tenant-isolation.json",
    launchBoundary: "tenant-isolation",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "google-oauth-freebusy-sync",
    readinessArea: "google-freebusy-smoke",
    requiredCommand: "Google Calendar OAuth/freebusy/event-sync smoke tests",
    requiredArtifact: "coverage/calendar-google-freebusy-sync.json",
    launchBoundary: "google-provider",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "signed-ics-token-route",
    readinessArea: "signed-ics-route-access",
    requiredCommand: "signed ICS token DB and route tests",
    requiredArtifact: "coverage/calendar-signed-ics-token-route.json",
    launchBoundary: "signed-ics",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "timezone-provider-matrix",
    readinessArea: "timezone-dst-recurrence-qa",
    requiredCommand: "timezone DST and provider render matrix QA",
    requiredArtifact: "coverage/calendar-timezone-provider-matrix.json",
    launchBoundary: "timezone-provider",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "dashboard-public-travel-smoke",
    readinessArea: "public-travel-smoke",
    requiredCommand: "dashboard/public travel calendar smoke tests",
    requiredArtifact: "coverage/calendar-dashboard-public-smoke.json",
    launchBoundary: "travel-smoke",
    providerBackedEvidenceRequired: false,
    redactedArtifactRequired: true,
  },
  {
    surfaceId: "ci-calendar-artifact-retention",
    readinessArea: "ci-evidence",
    requiredCommand: "GitHub Actions calendar launch evidence job",
    requiredArtifact: "coverage/calendar-ci-evidence.json",
    launchBoundary: "ci-proof",
    providerBackedEvidenceRequired: true,
    redactedArtifactRequired: true,
  },
] as const;

export const calendarLaunchLocalArtifacts = [
  "coverage/calendar-launch-runtime.json",
  "coverage/calendar-typecheck.txt",
  "coverage/calendar-test.txt",
] as const satisfies readonly CalendarLaunchArtifact[];

export const calendarLaunchExternalArtifacts = [
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
] as const satisfies readonly CalendarLaunchArtifact[];

export interface CalendarLaunchEvidenceInput {
  readonly calendarTypecheckPassed: boolean;
  readonly calendarTestsPassed: boolean;
  readonly availabilityRepositoriesImplemented: boolean;
  readonly availabilityPostgresIntegrationPassed: boolean;
  readonly concurrentHoldRaceTestsPassed: boolean;
  readonly tenantIsolationTestsPassed: boolean;
  readonly googleOauthConfigured: boolean;
  readonly googleEncryptedTokensConfigured: boolean;
  readonly googleWorkerEnabled: boolean;
  readonly googleFreebusySmokePassed: boolean;
  readonly googleEventSyncSmokePassed: boolean;
  readonly googlePushOrIncrementalSyncVerified: boolean;
  readonly signedIcsTokenPersistenceConfigured: boolean;
  readonly signedIcsAccessSmokePassed: boolean;
  readonly signedIcsClientImportSmokePassed: boolean;
  readonly timezoneDstQaPassed: boolean;
  readonly providerRenderMatrixPassed: boolean;
  readonly travelPublishPersistencePassed: boolean;
  readonly cacheRevalidationVerified: boolean;
  readonly dashboardCalendarSmokePassed: boolean;
  readonly publicTravelSmokePassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly calendarArtifactsSecretSafe: boolean;
  readonly calendarLaunchRunPersisted: boolean;
  readonly coveredReadinessAreas: readonly CalendarLaunchReadinessArea[];
  readonly capturedArtifacts: readonly CalendarLaunchArtifact[];
  readonly completedCommands: readonly CalendarLaunchRuntimeCommand[];
}

export interface CalendarLaunchRunRecordInput extends CalendarLaunchEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly calendarTypecheckArtifactPath?: string | null;
  readonly calendarTestArtifactPath?: string | null;
  readonly postgresAvailabilityArtifactPath?: string | null;
  readonly concurrentHoldRaceArtifactPath?: string | null;
  readonly tenantIsolationArtifactPath?: string | null;
  readonly googleOauthArtifactPath?: string | null;
  readonly googleFreebusySyncArtifactPath?: string | null;
  readonly googlePushIncrementalArtifactPath?: string | null;
  readonly signedIcsTokenRouteArtifactPath?: string | null;
  readonly icsClientImportsArtifactPath?: string | null;
  readonly timezoneProviderMatrixArtifactPath?: string | null;
  readonly travelPublishCacheArtifactPath?: string | null;
  readonly dashboardPublicSmokeArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface CalendarLaunchRunData
  extends Omit<
    CalendarLaunchRunRecordInput,
    "coveredReadinessAreas" | "capturedArtifacts" | "completedCommands" | "calendarLaunchRunPersisted"
  > {
  readonly commandMatrix: typeof calendarLaunchRuntimeMatrix;
  readonly readinessAreaManifest: readonly CalendarLaunchReadinessArea[];
  readonly artifactManifest: readonly CalendarLaunchArtifact[];
  readonly googleSyncManifest: {
    readonly googleOauthConfigured: boolean;
    readonly googleEncryptedTokensConfigured: boolean;
    readonly googleWorkerEnabled: boolean;
    readonly googleFreebusySmokePassed: boolean;
    readonly googleEventSyncSmokePassed: boolean;
    readonly googlePushOrIncrementalSyncVerified: boolean;
  };
  readonly signedIcsManifest: {
    readonly signedIcsTokenPersistenceConfigured: boolean;
    readonly signedIcsAccessSmokePassed: boolean;
    readonly signedIcsClientImportSmokePassed: boolean;
  };
  readonly timezoneQaManifest: {
    readonly timezoneDstQaPassed: boolean;
    readonly providerRenderMatrixPassed: boolean;
    readonly travelPublishPersistencePassed: boolean;
    readonly cacheRevalidationVerified: boolean;
  };
}

export interface CalendarLaunchRunRepository {
  readonly calendarLaunchRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: CalendarLaunchRunData;
      update: Omit<CalendarLaunchRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface CalendarLaunchEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReadinessAreas: readonly CalendarLaunchReadinessArea[];
  readonly missingArtifacts: readonly CalendarLaunchArtifact[];
  readonly missingCommands: readonly CalendarLaunchRuntimeCommand[];
  readonly requiredReadinessAreas: readonly CalendarLaunchReadinessArea[];
  readonly requiredArtifacts: typeof calendarLaunchArtifactPaths;
  readonly requiredCommands: typeof calendarLaunchRuntimeCommands;
  readonly requiredEvidence: typeof calendarLaunchRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface CalendarLaunchExecutionPlan {
  readonly localCommands: typeof calendarLaunchRuntimeLocalCommands;
  readonly externalCommands: typeof calendarLaunchRuntimeExternalCommands;
  readonly localArtifacts: typeof calendarLaunchLocalArtifacts;
  readonly externalArtifacts: typeof calendarLaunchExternalArtifacts;
  readonly surfaceContract: typeof calendarLaunchSurfaceContract;
  readonly calendarTypecheckExecutionAllowed: false;
  readonly calendarTestExecutionAllowed: false;
  readonly postgresIntegrationExecutionAllowed: false;
  readonly concurrentHoldRaceExecutionAllowed: false;
  readonly googleProviderSmokeExecutionAllowed: false;
  readonly signedIcsExecutionAllowed: false;
  readonly icsClientImportExecutionAllowed: false;
  readonly timezoneProviderQaExecutionAllowed: false;
  readonly dashboardPublicSmokeExecutionAllowed: false;
  readonly ciCalendarEvidenceExecutionAllowed: false;
  readonly providerBackedPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof calendarLaunchExecutionPolicy;
  readonly requiredExternalEvidence: typeof calendarLaunchRequiredExternalEvidence;
}

export interface CalendarLaunchArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof calendarLaunchRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const calendarLaunchRuntimeLocalCommands = [
  "pnpm --filter @inkroute/calendar typecheck",
  "pnpm --filter @inkroute/calendar test",
] as const satisfies readonly CalendarLaunchRuntimeCommand[];

export const calendarLaunchRuntimeExternalCommands = [
  "availability Postgres integration tests",
  "concurrent slot hold race-condition tests",
  "Google Calendar OAuth/freebusy/event-sync smoke tests",
  "signed ICS token DB and route tests",
  "Apple/Google/Outlook ICS import smoke tests",
  "timezone DST and provider render matrix QA",
  "dashboard/public travel calendar smoke tests",
  "GitHub Actions calendar launch evidence job",
] as const satisfies readonly CalendarLaunchRuntimeCommand[];

export function buildCalendarLaunchRunData(input: CalendarLaunchRunRecordInput): CalendarLaunchRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: calendarLaunchRuntimeMatrix,
    readinessAreaManifest: input.coveredReadinessAreas,
    artifactManifest: input.capturedArtifacts,
    googleSyncManifest: {
      googleOauthConfigured: input.googleOauthConfigured,
      googleEncryptedTokensConfigured: input.googleEncryptedTokensConfigured,
      googleWorkerEnabled: input.googleWorkerEnabled,
      googleFreebusySmokePassed: input.googleFreebusySmokePassed,
      googleEventSyncSmokePassed: input.googleEventSyncSmokePassed,
      googlePushOrIncrementalSyncVerified: input.googlePushOrIncrementalSyncVerified,
    },
    signedIcsManifest: {
      signedIcsTokenPersistenceConfigured: input.signedIcsTokenPersistenceConfigured,
      signedIcsAccessSmokePassed: input.signedIcsAccessSmokePassed,
      signedIcsClientImportSmokePassed: input.signedIcsClientImportSmokePassed,
    },
    timezoneQaManifest: {
      timezoneDstQaPassed: input.timezoneDstQaPassed,
      providerRenderMatrixPassed: input.providerRenderMatrixPassed,
      travelPublishPersistencePassed: input.travelPublishPersistencePassed,
      cacheRevalidationVerified: input.cacheRevalidationVerified,
    },
    calendarTypecheckPassed: input.calendarTypecheckPassed,
    calendarTestsPassed: input.calendarTestsPassed,
    availabilityRepositoriesImplemented: input.availabilityRepositoriesImplemented,
    availabilityPostgresIntegrationPassed: input.availabilityPostgresIntegrationPassed,
    concurrentHoldRaceTestsPassed: input.concurrentHoldRaceTestsPassed,
    tenantIsolationTestsPassed: input.tenantIsolationTestsPassed,
    googleOauthConfigured: input.googleOauthConfigured,
    googleEncryptedTokensConfigured: input.googleEncryptedTokensConfigured,
    googleWorkerEnabled: input.googleWorkerEnabled,
    googleFreebusySmokePassed: input.googleFreebusySmokePassed,
    googleEventSyncSmokePassed: input.googleEventSyncSmokePassed,
    googlePushOrIncrementalSyncVerified: input.googlePushOrIncrementalSyncVerified,
    signedIcsTokenPersistenceConfigured: input.signedIcsTokenPersistenceConfigured,
    signedIcsAccessSmokePassed: input.signedIcsAccessSmokePassed,
    signedIcsClientImportSmokePassed: input.signedIcsClientImportSmokePassed,
    timezoneDstQaPassed: input.timezoneDstQaPassed,
    providerRenderMatrixPassed: input.providerRenderMatrixPassed,
    travelPublishPersistencePassed: input.travelPublishPersistencePassed,
    cacheRevalidationVerified: input.cacheRevalidationVerified,
    dashboardCalendarSmokePassed: input.dashboardCalendarSmokePassed,
    publicTravelSmokePassed: input.publicTravelSmokePassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    calendarArtifactsSecretSafe: input.calendarArtifactsSecretSafe,
    calendarTypecheckArtifactPath: input.calendarTypecheckArtifactPath ?? null,
    calendarTestArtifactPath: input.calendarTestArtifactPath ?? null,
    postgresAvailabilityArtifactPath: input.postgresAvailabilityArtifactPath ?? null,
    concurrentHoldRaceArtifactPath: input.concurrentHoldRaceArtifactPath ?? null,
    tenantIsolationArtifactPath: input.tenantIsolationArtifactPath ?? null,
    googleOauthArtifactPath: input.googleOauthArtifactPath ?? null,
    googleFreebusySyncArtifactPath: input.googleFreebusySyncArtifactPath ?? null,
    googlePushIncrementalArtifactPath: input.googlePushIncrementalArtifactPath ?? null,
    signedIcsTokenRouteArtifactPath: input.signedIcsTokenRouteArtifactPath ?? null,
    icsClientImportsArtifactPath: input.icsClientImportsArtifactPath ?? null,
    timezoneProviderMatrixArtifactPath: input.timezoneProviderMatrixArtifactPath ?? null,
    travelPublishCacheArtifactPath: input.travelPublishCacheArtifactPath ?? null,
    dashboardPublicSmokeArtifactPath: input.dashboardPublicSmokeArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistCalendarLaunchRun(
  repository: CalendarLaunchRunRepository,
  input: CalendarLaunchRunRecordInput,
): Promise<unknown> {
  const data = buildCalendarLaunchRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.calendarLaunchRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

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
  availabilityRepositoriesImplemented: true,
  availabilityPostgresIntegrationPassed: false,
  concurrentHoldRaceTestsPassed: false,
  tenantIsolationTestsPassed: false,
  googleOauthConfigured: false,
  googleEncryptedTokensConfigured: false,
  googleWorkerEnabled: false,
  googleFreebusySmokePassed: false,
  googleEventSyncSmokePassed: false,
  googlePushOrIncrementalSyncVerified: false,
  signedIcsTokenPersistenceConfigured: true,
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

export function buildCalendarLaunchDecisionRequiredEvidence(
  readinessEvidence: typeof calendarLaunchRuntimeReadiness.requiredEvidence,
): CalendarLaunchRequiredEvidence {
  return [
    ...readinessEvidence,
    "CalendarLaunchRun row with command, readiness area, artifact, Google sync, signed ICS, and timezone QA matrices.",
    "Artifact bundle proving calendar package checks, Postgres availability integration, concurrent hold race rejection, tenant isolation, Google OAuth/sync, signed ICS token/imports, timezone/provider QA, travel publish/cache smoke, CI evidence, and secret-safe artifacts.",
  ];
}

export type CalendarLaunchRequiredEvidence = readonly [
  ...typeof calendarLaunchRuntimeReadiness.requiredEvidence,
  "CalendarLaunchRun row with command, readiness area, artifact, Google sync, signed ICS, and timezone QA matrices.",
  "Artifact bundle proving calendar package checks, Postgres availability integration, concurrent hold race rejection, tenant isolation, Google OAuth/sync, signed ICS token/imports, timezone/provider QA, travel publish/cache smoke, CI evidence, and secret-safe artifacts.",
];

export const calendarLaunchRequiredEvidence = buildCalendarLaunchDecisionRequiredEvidence(
  calendarLaunchRuntimeReadiness.requiredEvidence,
);

export function buildCalendarLaunchEvidenceDecision(
  input: CalendarLaunchEvidenceInput,
): CalendarLaunchEvidenceDecision {
  const coveredReadinessAreas = new Set(input.coveredReadinessAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReadinessAreas = calendarLaunchReadinessAreas.filter((area) => !coveredReadinessAreas.has(area));
  const missingArtifacts = calendarLaunchArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = calendarLaunchRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildCalendarLaunchEvidencePlan({
    packageScripts: {
      typecheck: "tsc --noEmit",
      test: "vitest run --passWithNoTests",
    },
    calendarTypecheckPassed: input.calendarTypecheckPassed,
    calendarTestsPassed: input.calendarTestsPassed,
    availabilityRepositoriesImplemented: input.availabilityRepositoriesImplemented,
    availabilityPostgresIntegrationPassed: input.availabilityPostgresIntegrationPassed,
    concurrentHoldRaceTestsPassed: input.concurrentHoldRaceTestsPassed,
    tenantIsolationTestsPassed: input.tenantIsolationTestsPassed,
    googleOauthConfigured: input.googleOauthConfigured,
    googleEncryptedTokensConfigured: input.googleEncryptedTokensConfigured,
    googleWorkerEnabled: input.googleWorkerEnabled,
    googleFreebusySmokePassed: input.googleFreebusySmokePassed,
    googleEventSyncSmokePassed: input.googleEventSyncSmokePassed,
    googlePushOrIncrementalSyncVerified: input.googlePushOrIncrementalSyncVerified,
    signedIcsTokenPersistenceConfigured: input.signedIcsTokenPersistenceConfigured,
    signedIcsAccessSmokePassed: input.signedIcsAccessSmokePassed,
    signedIcsClientImportSmokePassed: input.signedIcsClientImportSmokePassed,
    timezoneDstQaPassed: input.timezoneDstQaPassed,
    providerRenderMatrixPassed: input.providerRenderMatrixPassed,
    travelPublishPersistencePassed: input.travelPublishPersistencePassed,
    cacheRevalidationVerified: input.cacheRevalidationVerified,
    dashboardCalendarSmokePassed: input.dashboardCalendarSmokePassed,
    publicTravelSmokePassed: input.publicTravelSmokePassed,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    calendarArtifactsSecretSafe: input.calendarArtifactsSecretSafe,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.calendarLaunchRunPersisted) {
    blockers.push("CalendarLaunchRun persistence row must be captured for durable auditability.");
  }
  if (missingReadinessAreas.length > 0) {
    blockers.push("Every required calendar launch readiness area must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required calendar launch artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required calendar launch command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingReadinessAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingReadinessAreas,
    missingArtifacts,
    missingCommands,
    requiredReadinessAreas: calendarLaunchReadinessAreas,
    requiredArtifacts: calendarLaunchArtifactPaths,
    requiredCommands: calendarLaunchRuntimeCommands,
    requiredEvidence: calendarLaunchRequiredEvidence,
    blockers,
  };
}

const sensitiveCalendarLaunchKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|google|calendar|oauth|refresh|sync|ics|client|provider|repository|repo|branch|pullRequest|pr|reviewer|codeowner)$/iu;
const sensitiveCalendarLaunchValuePattern =
  /(https?:\/\/[^\s"']+|repo:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|branch:[A-Za-z0-9_./-]+|pr[_:#-]?[A-Za-z0-9_.-]+|reviewer[_:@-]?[A-Za-z0-9_.-]+|CODEOWNER:[A-Za-z0-9_.@/-]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:ya29\.|1\/\/)[A-Za-z0-9._-]+|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const redactCalendarLaunchString = (value: string): string =>
  value.replace(sensitiveCalendarLaunchValuePattern, "[REDACTED]");

export const calendarLaunchExecutionPolicy = {
  codexMayClassifyStaticCalendarReadiness: true,
  postgresMutationEvidenceRequiredForClosure: true,
  googleProviderEvidenceRequiredForClosure: true,
  signedIcsEvidenceRequiredForClosure: true,
  timezoneProviderQaRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const calendarLaunchRequiredExternalEvidence = [
  "Postgres availability mutation, concurrent hold race, and tenant-isolation evidence.",
  "Google OAuth, encrypted refresh token, FreeBusy, event sync, push or incremental recovery evidence.",
  "Signed ICS token persistence, route access, and Apple/Google/Outlook import evidence.",
  "Timezone, DST, recurrence, provider render matrix, travel publish, cache revalidation, and dashboard/public smoke evidence.",
  "GitHub Actions calendar launch evidence job URL and conclusion.",
  "Provider-backed CalendarLaunchRun persistence row captured from the target database.",
  "Secret-safe calendar artifacts with no Google tokens, signed feed tokens, client-private data, or raw tenant identifiers.",
] as const;

const buildRedactedCalendarLaunchValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedCalendarLaunchValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveCalendarLaunchKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedCalendarLaunchValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactCalendarLaunchString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildCalendarLaunchExecutionPlan(): CalendarLaunchExecutionPlan {
  return {
    localCommands: calendarLaunchRuntimeLocalCommands,
    externalCommands: calendarLaunchRuntimeExternalCommands,
    localArtifacts: calendarLaunchLocalArtifacts,
    externalArtifacts: calendarLaunchExternalArtifacts,
    surfaceContract: calendarLaunchSurfaceContract,
    calendarTypecheckExecutionAllowed: false,
    calendarTestExecutionAllowed: false,
    postgresIntegrationExecutionAllowed: false,
    concurrentHoldRaceExecutionAllowed: false,
    googleProviderSmokeExecutionAllowed: false,
    signedIcsExecutionAllowed: false,
    icsClientImportExecutionAllowed: false,
    timezoneProviderQaExecutionAllowed: false,
    dashboardPublicSmokeExecutionAllowed: false,
    ciCalendarEvidenceExecutionAllowed: false,
    providerBackedPersistenceExecutionAllowed: false,
    executionPolicy: calendarLaunchExecutionPolicy,
    requiredExternalEvidence: calendarLaunchRequiredExternalEvidence,
  };
}

export function buildRedactedCalendarLaunchArtifact(artifact: unknown): unknown {
  return buildRedactedCalendarLaunchValue(artifact, "", []);
}

export function buildCalendarLaunchArtifactReview(artifact: unknown): CalendarLaunchArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedCalendarLaunchValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: calendarLaunchRequiredExternalEvidence,
    safeForTracker: true,
  };
}

