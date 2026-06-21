import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCalendarLaunchArtifactReview,
  buildCalendarLaunchDecisionRequiredEvidence,
  buildCalendarLaunchEvidenceDecision,
  buildCalendarLaunchExecutionPlan,
  buildCalendarLaunchRunData,
  buildRedactedCalendarLaunchArtifact,
  calendarLaunchArtifactPaths,
  calendarLaunchExecutionPolicy,
  calendarLaunchExternalArtifacts,
  calendarLaunchLocalArtifacts,
  calendarLaunchReadinessAreas,
  calendarLaunchRunPersistenceContract,
  calendarLaunchRequiredEvidence,
  calendarLaunchRequiredExternalEvidence,
  calendarLaunchRuntimeExternalCommands,
  calendarLaunchRuntimeLocalCommands,
  calendarLaunchRuntimeCommands,
  calendarLaunchRuntimeMatrix,
  calendarLaunchRuntimeReadiness,
  calendarLaunchRuntimeProofFiles,
  persistCalendarLaunchRun,
} from "../lib/calendarLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("calendar launch runtime contract", () => {
  const calendarPackageJson = readRepoFile("packages/calendar/package.json");
  const calendarSource = readRepoFile("packages/calendar/src/index.ts");
  const calendarTests = readRepoFile("packages/calendar/tests/availability-conflicts.test.ts");
  const dashboardCalendarRoute = readRepoFile("apps/dashboard/app/api/calendar/route.ts");
  const dashboardCalendarTest = readRepoFile("apps/dashboard/tests/calendar-read-route-static.test.ts");
  const publicTravelIcsRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const calendarLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033300_add_calendar_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins calendar launch commands, readiness areas, matrix rows, and artifacts", () => {
    expect(calendarLaunchRuntimeCommands).toEqual([
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
    ]);
    expect(calendarLaunchReadinessAreas).toContain("google-encrypted-refresh-token-persistence");
    expect(calendarLaunchReadinessAreas).toContain("signed-ics-client-imports");
    expect(calendarLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "postgres-availability-integration",
      "concurrent-hold-race",
      "tenant-isolation",
      "google-oauth-freebusy-sync",
      "google-push-incremental-recovery",
      "signed-ics-token-route",
      "ics-client-imports",
      "timezone-provider-matrix",
      "travel-publish-cache-smoke",
      "ci-secret-safe-artifacts",
    ]);
    expect(calendarLaunchArtifactPaths).toContain("coverage/calendar-launch-runtime.json");
    expect(calendarLaunchArtifactPaths).toContain("test-results/calendar-launch-runtime");
  });

  it("pins the CalendarLaunchRun persistence model and migration", () => {
    const runData = buildCalendarLaunchRunData({
      tenantId: "tenant_static",
      runId: "calendar_static",
      commitSha: "abc123",
      status: "blocked",
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
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
      calendarLaunchRunPersisted: false,
      coveredReadinessAreas: ["calendar-typecheck-test"],
      capturedArtifacts: [
        "coverage/calendar-launch-runtime.json",
        "coverage/calendar-typecheck.txt",
        "coverage/calendar-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/calendar typecheck",
        "pnpm --filter @inkroute/calendar test",
      ],
      calendarTypecheckArtifactPath: "coverage/calendar-typecheck.txt",
      calendarTestArtifactPath: "coverage/calendar-test.txt",
    });

    expect(calendarLaunchRunPersistenceContract.model).toBe("CalendarLaunchRun");
    expect(calendarLaunchRunPersistenceContract.tenantRelation).toBe("calendarLaunchRuns");
    expect(calendarLaunchRunPersistenceContract.migration).toBe("20260609033300_add_calendar_launch_runs");
    expect(calendarLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "googleSyncManifest",
      "signedIcsManifest",
      "timezoneQaManifest",
    ]);
    expect(calendarLaunchRunPersistenceContract.evidenceBooleans).toContain("concurrentHoldRaceTestsPassed");
    expect(calendarLaunchRunPersistenceContract.evidenceBooleans).toContain("googleEncryptedTokensConfigured");
    expect(calendarLaunchRunPersistenceContract.evidenceBooleans).toContain("calendarArtifactsSecretSafe");
    expect(calendarLaunchRunPersistenceContract.artifactFields).toContain("signedIcsTokenRouteArtifactPath");
    expect(calendarLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("calendarLaunchRuns CalendarLaunchRun[]");
    expect(prismaSchema).toContain("model CalendarLaunchRun");
    expect(prismaSchema).toContain("googleSyncManifest");
    expect(prismaSchema).toContain("googlePushOrIncrementalSyncVerified");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(calendarLaunchMigration).toContain('CREATE TABLE "CalendarLaunchRun"');
    expect(calendarLaunchMigration).toContain('"signedIcsManifest" JSONB NOT NULL');
    expect(calendarLaunchMigration).toContain('"calendarArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(calendarLaunchMigration).toContain('CREATE UNIQUE INDEX "CalendarLaunchRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "calendar_static",
      commitSha: "abc123",
      status: "blocked",
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      googleOauthConfigured: false,
      calendarTypecheckArtifactPath: "coverage/calendar-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(calendarLaunchRuntimeMatrix);
    expect(runData.readinessAreaManifest).toEqual(["calendar-typecheck-test"]);
    expect(runData.googleSyncManifest.googleEncryptedTokensConfigured).toBe(false);
    expect(String(persistCalendarLaunchRun)).toContain("repository.calendarLaunchRun.upsert");
  });

  it("keeps calendar package scripts, launch helper, read route redaction, and ICS route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildCalendarLaunchEvidencePlan");
    expect(calendarTests).toContain("availability");
    expect(dashboardCalendarRoute).toContain("calendar:read");
    expect(dashboardCalendarTest).toContain("encrypted-token omission");
    expect(publicTravelIcsRoute).toContain("ics");
    expect(publicTravelIcsRoute).toContain('"Cache-Control": "private, no-store"');
    expect(publicTravelIcsRoute).toContain('const privateNoStoreHeaders = { "Cache-Control": "private, no-store" } as const');
    expect(publicTravelIcsRoute).toContain("headers: privateNoStoreHeaders");
    expect(publicTravelIcsRoute).toContain("...privateNoStoreHeaders");
    expect(publicTravelIcsRoute).not.toContain('headers: { "Cache-Control": "private, no-store" }');
  });

  it("keeps calendar launch blockers explicit until provider/database evidence exists", () => {
    expect(calendarLaunchRuntimeReadiness.status).toBe("blocked");
    expect(calendarLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(calendarLaunchRuntimeReadiness.requiredCommands).toBe(calendarLaunchRuntimeCommands);
    expect(calendarLaunchRuntimeReadiness.requiredEvidence).toBe(calendarLaunchRequiredEvidence);
    expect(calendarLaunchRuntimeReadiness.blockers).toContain("Google OAuth client, redirect URI, and scopes must be configured.");
    expect(calendarLaunchRuntimeReadiness.blockers).toContain("Signed ICS access route smoke tests must pass.");
  });

  it("blocks calendar launch closure until database, Google, ICS, timezone, travel, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildCalendarLaunchEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
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
      calendarLaunchRunPersisted: false,
      coveredReadinessAreas: ["calendar-typecheck-test"],
      capturedArtifacts: [
        "coverage/calendar-launch-runtime.json",
        "coverage/calendar-typecheck.txt",
        "coverage/calendar-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/calendar typecheck",
        "pnpm --filter @inkroute/calendar test",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReadinessAreas).toEqual([
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
    ]);
    expect(decision.missingArtifacts).toEqual([
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
    ]);
    expect(decision.missingCommands).toEqual([
      "availability Postgres integration tests",
      "concurrent slot hold race-condition tests",
      "Google Calendar OAuth/freebusy/event-sync smoke tests",
      "signed ICS token DB and route tests",
      "Apple/Google/Outlook ICS import smoke tests",
      "timezone DST and provider render matrix QA",
      "dashboard/public travel calendar smoke tests",
      "GitHub Actions calendar launch evidence job",
    ]);
    expect(decision.requiredReadinessAreas).toBe(calendarLaunchReadinessAreas);
    expect(decision.requiredArtifacts).toBe(calendarLaunchArtifactPaths);
    expect(decision.requiredCommands).toBe(calendarLaunchRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildCalendarLaunchDecisionRequiredEvidence(calendarLaunchRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(calendarLaunchRequiredEvidence);
    expect(decision.blockers).toContain("Google OAuth client, redirect URI, and scopes must be configured.");
    expect(decision.blockers).toContain("CalendarLaunchRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required calendar launch readiness area must be covered.");
  });

  it("completes calendar launch closure when database, Google, ICS, timezone, travel, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildCalendarLaunchEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      availabilityRepositoriesImplemented: true,
      availabilityPostgresIntegrationPassed: true,
      concurrentHoldRaceTestsPassed: true,
      tenantIsolationTestsPassed: true,
      googleOauthConfigured: true,
      googleEncryptedTokensConfigured: true,
      googleWorkerEnabled: true,
      googleFreebusySmokePassed: true,
      googleEventSyncSmokePassed: true,
      googlePushOrIncrementalSyncVerified: true,
      signedIcsTokenPersistenceConfigured: true,
      signedIcsAccessSmokePassed: true,
      signedIcsClientImportSmokePassed: true,
      timezoneDstQaPassed: true,
      providerRenderMatrixPassed: true,
      travelPublishPersistencePassed: true,
      cacheRevalidationVerified: true,
      dashboardCalendarSmokePassed: true,
      publicTravelSmokePassed: true,
      ciEvidenceCaptured: true,
      calendarArtifactsSecretSafe: true,
      calendarLaunchRunPersisted: true,
      coveredReadinessAreas: calendarLaunchReadinessAreas,
      capturedArtifacts: calendarLaunchArtifactPaths,
      completedCommands: calendarLaunchRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming calendar launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 calendar launch runtime contracts");
    expect(ciWorkflow).toContain("calendar-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("calendar-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-calendar-launch-runtime-static");
    expect(unitManifest).toContain("CalendarLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("CalendarLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/calendarLaunchRuntime.ts");
    expect(gapTracker).toContain("buildCalendarLaunchDecisionRequiredEvidence");
    expect(gapTracker).toContain("calendarLaunchRequiredEvidence");
    expect(gapTracker).toContain("persistCalendarLaunchRun upsert seam");
    expect(gapTracker).toContain("live calendar typecheck/tests, Postgres mutation integration, concurrent hold race rejection, tenant isolation, Google OAuth/sync, signed ICS runtime/import, timezone/provider QA, travel publish/cache, smoke tests, CI evidence, provider-backed persistCalendarLaunchRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-009 is calendar-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current calendar launch proof files for GAP-009", () => {
    expect(calendarLaunchRuntimeProofFiles).toContain("packages/calendar/package.json");
    expect(calendarLaunchRuntimeProofFiles).toContain("apps/web/lib/calendarLaunchRuntime.ts");
    expect(calendarLaunchRuntimeProofFiles).toContain("apps/web/tests/calendar-launch-runtime-static.test.ts");
    for (const proofFile of calendarLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-009 execution policy non-executing while separating calendar provider proof", () => {
    const plan = buildCalendarLaunchExecutionPlan();

    expect(plan.localCommands).toBe(calendarLaunchRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(calendarLaunchRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(calendarLaunchLocalArtifacts);
    expect(plan.externalArtifacts).toBe(calendarLaunchExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/calendar-test.txt");
    expect(plan.externalArtifacts).toContain("coverage/calendar-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/calendar-launch-runtime");
    expect(plan.executionPolicy).toBe(calendarLaunchExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(calendarLaunchRequiredExternalEvidence);
    expect(plan).toMatchObject({
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
      executionPolicy: {
        codexMayClassifyStaticCalendarReadiness: true,
        postgresMutationEvidenceRequiredForClosure: true,
        googleProviderEvidenceRequiredForClosure: true,
        signedIcsEvidenceRequiredForClosure: true,
        timezoneProviderQaRequiredForClosure: true,
        providerDatabaseRequiredForPersistence: true,
        secretSafeArtifactsRequiredForClosure: true,
      },
    });
  });

  it("redacts calendar launch artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "calendar_launch_01HZYXZYXZYXZYXZYXZYXZYXZ",
      googleRefreshToken: "1//1234567890ABCDEFGHIJKLMNOP",
      googleAccessToken: "ya29.1234567890ABCDEFGHIJKLMNOP",
      signedIcsUrl: "https://inkroute.example/calendar/feed?token=secret-token",
      clientEmail: "artist@example.com",
      clientPhone: "+1 (555) 867-5309",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
    };

    expect(buildRedactedCalendarLaunchArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      googleRefreshToken: "[REDACTED]",
      googleAccessToken: "[REDACTED]",
      signedIcsUrl: "[REDACTED]",
      clientEmail: "[REDACTED]",
      clientPhone: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
    });

    const review = buildCalendarLaunchArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(calendarLaunchRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "googleRefreshToken",
        "googleAccessToken",
        "signedIcsUrl",
        "clientEmail",
        "clientPhone",
        "persistence.tenantId",
        "persistence.databaseUrl",
      ]),
    );
  });
});



