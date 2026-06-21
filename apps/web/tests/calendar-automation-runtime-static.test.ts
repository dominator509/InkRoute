import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCalendarAutomationArtifactReview,
  buildCalendarAutomationDecisionRequiredEvidence,
  buildCalendarAutomationEvidenceDecision,
  buildCalendarAutomationExecutionPlan,
  buildRedactedCalendarAutomationArtifact,
  calendarAutomationDecisionRequiredEvidence,
  calendarAutomationExternalCommands,
  calendarAutomationExecutionPolicy,
  calendarAutomationArtifactPaths,
  calendarAutomationLocalCommands,
  calendarAutomationRequiredExternalEvidence,
  calendarAutomationRuntimeCommands,
  calendarAutomationRuntimeMatrix,
  calendarAutomationRuntimeProofFiles,
  calendarAutomationRuntimeReadiness,
} from "../lib/calendarAutomatedTestsRuntime";

const root = resolve(__dirname, "../../..");
function readWorkspaceFile(path: string): string { return readFileSync(resolve(root, path), "utf8"); }

describe("calendar automated test runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const automationSource = readWorkspaceFile("apps/web/lib/calendarAutomatedTests.ts");
  const automationStaticTest = readWorkspaceFile("apps/web/tests/calendar-automation-static.test.ts");
  const icsRouteTest = readWorkspaceFile("apps/web/tests/ics-feed-route.test.ts");
  const availabilityRouteTest = readWorkspaceFile("apps/web/tests/availability-preview-route.test.ts");
  const calendarPage = readWorkspaceFile("apps/dashboard/app/calendar/page.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-059 commands, matrix rows, and artifacts", () => {
    expect(calendarAutomationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
      "pnpm vitest run apps/web/tests/availability-preview-route.test.ts",
      "calendar Postgres integration tests",
      "Google test-calendar provider tests",
      "Playwright dashboard/public travel calendar smoke",
    ]);
    expect(calendarAutomationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-helper-tests",
      "signed-ics-route",
      "availability-preview-route",
      "postgres-integration",
      "google-provider",
      "timezone-provider-matrix",
      "dashboard-calendar-playwright",
      "public-travel-playwright",
      "concurrent-hold-race",
      "signed-ics-revocation-db",
      "ci-calendar-job",
      "artifact-retention",
      "secret-safe-artifacts",
    ]);
    expect(calendarAutomationArtifactPaths).toContain("coverage/calendar-automation-runtime.json");
    expect(calendarAutomationArtifactPaths).toContain("test-results/calendar-automation-runtime");
  });

  it("pins current calendar automation proof files for GAP-059", () => {
    expect(calendarAutomationRuntimeProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of calendarAutomationRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, existing automation contract, routes, and dashboard calendar surface wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildCalendarAutomatedTestReadinessPlan");
    expect(calendarTests).toContain("buildCalendarAutomatedTestReadinessPlan");
    expect(automationSource).toContain("calendarAutomatedTestSuites");
    expect(automationSource).toContain("buildRedactedCalendarAutomationArtifact");
    expect(automationSource).toContain("buildCalendarAutomationSecretSafeArtifactReview");
    expect(automationSource).toContain("redactCalendarAutomationArtifactValue");
    expect(automationSource).toContain("calendarAutomationPrivateArtifactKeys");
    expect(automationSource).toContain("concurrent-hold-race");
    expect(automationStaticTest).toContain("enumerates the full Phase 8 calendar and travel test matrix");
    expect(automationStaticTest).toContain("redacts provider tokens, signed feed tokens, PII, and private booking data");
    expect(automationStaticTest).toContain("recursively reviews retained calendar artifacts for secret-safe redaction");
    expect(icsRouteTest).toContain("travel.ics");
    expect(availabilityRouteTest).toContain("availability-preview");
    expect(calendarPage).toContain("calendar");
  });

  it("keeps DB, Google, timezone, Playwright, race, revocation, CI, and artifact blockers explicit", () => {
    expect(calendarAutomationRuntimeReadiness.status).toBe("blocked");
    expect(calendarAutomationRuntimeReadiness.missingScripts).toEqual([]);
    expect(calendarAutomationRuntimeReadiness.requiredCommands).toBe(calendarAutomationRuntimeCommands);
    expect(calendarAutomationRuntimeReadiness.requiredEvidence).toBe(calendarAutomationDecisionRequiredEvidence);
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Postgres calendar integration tests must pass for availability, holds, appointments, audit logs, and feed tokens.");
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Google provider integration tests must pass against a test calendar.");
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Calendar test artifacts must capture DB logs, Google provider transcripts, Playwright traces, and ICS import output.");
  });

  it("pins the non-executing GAP-059 calendar automation execution policy", () => {
    const plan = buildCalendarAutomationExecutionPlan();

    expect(calendarAutomationExecutionPolicy).toEqual({
      codexMayClassifyStaticCalendarAutomationReadiness: true,
      helperRouteCommandsRequiredForClosure: true,
      seededPostgresRequiredForClosure: true,
      googleProviderRequiredForClosure: true,
      timezoneMatrixRequiredForClosure: true,
      playwrightTravelRequiredForClosure: true,
      concurrentHoldRaceRequiredForClosure: true,
      signedFeedRevocationRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(calendarAutomationExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.seededPostgresExecutionAllowed).toBe(false);
    expect(plan.googleProviderExecutionAllowed).toBe(false);
    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.concurrentRaceExecutionAllowed).toBe(false);
    expect(plan.signedFeedRevocationExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(calendarAutomationLocalCommands);
    expect(plan.externalCommands).toBe(calendarAutomationExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(calendarAutomationRequiredExternalEvidence);
    expect(calendarAutomationRequiredExternalEvidence).toEqual([
      "actual helper/route command output",
      "calendar Postgres integration tests",
      "Google test-calendar provider transcripts",
      "timezone matrix artifacts",
      "dashboard/public Playwright travel calendar smoke",
      "concurrent hold race tests",
      "signed-feed revocation DB tests",
      "CI calendar automation artifacts",
      "artifact retention proof",
      "secret-safe calendar automation artifact review",
    ]);
  });

  it("pins calendar automation artifact redaction and review through the runtime contract", () => {
    const redacted = buildRedactedCalendarAutomationArtifact({
      artifactId: "calendar-automation-secret-safe-artifacts",
      payload: {
        googleAccessToken: "provider-token",
        signedFeedToken: "feed-token",
        clientEmail: "client@example.test",
        bookingPrivateNotes: "private location note",
        publicSummary: "calendar automation evidence captured",
        nested: {
          publicSummary: "nested public evidence",
          travelAddress: "private travel address",
        },
      },
    });

    expect(redacted.payload.googleAccessToken).toBe("[redacted]");
    expect(redacted.payload.signedFeedToken).toBe("[redacted]");
    expect(redacted.payload.clientEmail).toBe("[redacted]");
    expect(redacted.payload.bookingPrivateNotes).toBe("[redacted]");
    expect(redacted.payload.publicSummary).toBe("calendar automation evidence captured");
    expect(redacted.payload.nested).toEqual({
      publicSummary: "nested public evidence",
      travelAddress: "[redacted]",
    });

    const review = buildCalendarAutomationArtifactReview({
      artifacts: [
        {
          artifactId: "calendar-automation-secret-safe-artifacts",
          payload: {
            googleRefreshToken: "refresh-token",
            publicSummary: "safe calendar automation evidence",
          },
        },
      ],
    });

    expect(review.passed).toBe(true);
    expect(review.reviewedArtifactIds).toEqual(["calendar-automation-secret-safe-artifacts"]);
    expect(review.blockers).toEqual([]);
    expect(review.redactedArtifacts[0]?.payload.googleRefreshToken).toBe("[redacted]");
    expect(review.redactedArtifacts[0]?.payload.publicSummary).toBe("safe calendar automation evidence");
  });

  it("classifies calendar automation evidence before GAP-059 can close", () => {
    const blockedDecision = buildCalendarAutomationEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      signedIcsRouteTestsPassed: true,
      availabilityPreviewRouteTestsPassed: true,
      postgresIntegrationTestsPassed: false,
      googleProviderTestsPassed: false,
      timezoneProviderMatrixPassed: false,
      dashboardCalendarPlaywrightPassed: false,
      publicTravelPlaywrightPassed: false,
      concurrentHoldRaceTestsPassed: false,
      signedIcsRevocationDbTestsPassed: false,
      ciCalendarJobEvidenceCaptured: false,
      artifactRetentionVerified: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/calendar-automation-runtime.json",
        "coverage/calendar-automation-calendar-typecheck.txt",
        "coverage/calendar-automation-calendar-test.txt",
        "coverage/calendar-automation-signed-ics-route.json",
        "coverage/calendar-automation-availability-preview-route.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Calendar Postgres integration evidence is missing.");
    expect(blockedDecision.blockers).toContain("Google test-calendar provider evidence is missing.");
    expect(blockedDecision.blockers).toContain("Dashboard calendar Playwright evidence is missing.");
    expect(blockedDecision.blockers).toContain("Signed ICS revocation DB evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe calendar automation artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/calendar-automation-postgres-integration.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/calendar-automation-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(calendarAutomationRuntimeCommands);
    expect(calendarAutomationDecisionRequiredEvidence).toEqual(
      buildCalendarAutomationDecisionRequiredEvidence(calendarAutomationRuntimeReadiness.requiredEvidence),
    );
    expect(blockedDecision.requiredEvidence).toBe(calendarAutomationDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: calendarAutomationArtifactPaths.length,
    });

    const completeDecision = buildCalendarAutomationEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      signedIcsRouteTestsPassed: true,
      availabilityPreviewRouteTestsPassed: true,
      postgresIntegrationTestsPassed: true,
      googleProviderTestsPassed: true,
      timezoneProviderMatrixPassed: true,
      dashboardCalendarPlaywrightPassed: true,
      publicTravelPlaywrightPassed: true,
      concurrentHoldRaceTestsPassed: true,
      signedIcsRevocationDbTestsPassed: true,
      ciCalendarJobEvidenceCaptured: true,
      artifactRetentionVerified: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: calendarAutomationArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming DB/provider/Playwright evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 8 calendar automation runtime contracts");
    expect(ciWorkflow).toContain("calendar-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("calendar-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-calendar-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/calendarAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("calendar automation evidence classifier");
    expect(gapTracker).toContain("recursive local artifact-redaction review helper");
    expect(gapTracker).toContain("buildCalendarAutomationExecutionPlan");
    expect(gapTracker).toContain("buildCalendarAutomationDecisionRequiredEvidence");
    expect(gapTracker).toContain("calendarAutomationDecisionRequiredEvidence");
    expect(gapTracker).toContain("calendarAutomationExecutionPolicy");
    expect(gapTracker).toContain("calendarAutomationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedCalendarAutomationArtifact");
    expect(gapTracker).toContain("buildCalendarAutomationArtifactReview");
    expect(gapTracker).toContain("non-executing calendar automation execution policy");
    expect(gapTracker).toContain("GAP-059 is calendar-automation-runtime-matrix wired with calendar automation evidence classifier");
    expect(calendarAutomationArtifactPaths).toContain("coverage/calendar-automation-secret-safe-artifacts.json");
  });
});

