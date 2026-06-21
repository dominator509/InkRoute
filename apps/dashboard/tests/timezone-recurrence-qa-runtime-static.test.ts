import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedTimezoneRecurrenceArtifact,
  buildTimezoneRecurrenceArtifactReview,
  buildTimezoneRecurrenceEvidenceDecision,
  buildTimezoneRecurrenceExecutionPlan,
  timezoneRecurrenceArtifactPaths,
  timezoneRecurrenceDecisionRequiredEvidence,
  timezoneRecurrenceExternalCommands,
  timezoneRecurrenceLocalCommands,
  timezoneRecurrenceRequiredExternalEvidence,
  timezoneRecurrenceRuntimeCommands,
  timezoneRecurrenceRuntimeMatrix,
  timezoneRecurrenceRuntimeProofFiles,
  timezoneRecurrenceRuntimeReadiness,
} from "../lib/timezoneRecurrenceQaRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("timezone recurrence QA runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const qaSource = readWorkspaceFile("apps/dashboard/lib/timezoneRecurrenceQa.ts");
  const qaStaticTest = readWorkspaceFile("apps/dashboard/tests/timezone-recurrence-qa-static.test.ts");
  const routeSource = readWorkspaceFile("apps/dashboard/app/api/calendar/timezone-qa/route.ts");
  const calendarRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/route.ts");
  const readRouteStaticTest = readWorkspaceFile("apps/dashboard/tests/calendar-read-route-static.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-058 commands, matrix rows, and artifacts", () => {
    expect(timezoneRecurrenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "timezone route/persistence boundary tests",
      "stored recurrence expansion integration tests",
      "Google Calendar timezone render smoke",
      "ICS timezone import/render smoke",
    ]);
    expect(timezoneRecurrenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "timezone-strategy",
      "temporal-date-library",
      "route-iana-validation",
      "persistence-iana-validation",
      "utc-plus-timezone-storage",
      "dst-spring",
      "dst-fall",
      "recurrence-expansion",
      "all-day-travel",
      "cross-city-render",
      "provider-render",
      "google-render",
      "ics-render",
      "seeded-persistence-boundary",
      "ci-secret-safe-evidence",
    ]);
    expect(timezoneRecurrenceArtifactPaths).toContain("coverage/timezone-recurrence-runtime.json");
    expect(timezoneRecurrenceArtifactPaths).toContain("test-results/timezone-recurrence-runtime");
  });

  it("pins current timezone recurrence proof files for GAP-058", () => {
    expect(timezoneRecurrenceRuntimeProofFiles).toEqual(expect.arrayContaining([
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
    ]));
    for (const file of timezoneRecurrenceRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, dashboard QA contract, API boundary, and calendar read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildTimezoneRecurrenceQaPlan");
    expect(calendarSource).toContain("buildTimezoneRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildTimezoneRuntimeReadinessPlan");
    expect(qaSource).toContain("dashboardTimezoneQaCases");
    expect(qaSource).toContain("validateTimezoneBoundaries");
    expect(qaSource).toContain("buildTimezoneRecurrenceLocalEvidence");
    expect(qaSource).toContain("isUtcInstant");
    expect(qaStaticTest).toContain("covers IANA validation, DST, recurrence, provider render, and all-day travel checks");
    expect(qaStaticTest).toContain("builds local timezone recurrence evidence");
    expect(qaStaticTest).toContain("blocks local timezone recurrence evidence");
    expect(routeSource).toContain("validateTimezoneBoundaries");
    expect(routeSource).toContain("TENANT_MISMATCH");
    expect(routeSource).toContain("TIMEZONE_RECURRENCE_RUNTIME_EVIDENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("diagnosticTimezoneQaDisabled");
    expect(calendarRoute).toContain("timezone");
    expect(readRouteStaticTest).toContain("timezone");
  });

  it("keeps Temporal/date-library, boundary, DST, recurrence, provider, and seeded persistence blockers explicit", () => {
    expect(timezoneRecurrenceRuntimeReadiness.status).toBe("blocked");
    expect(timezoneRecurrenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(timezoneRecurrenceRuntimeReadiness.requiredCommands).toBe(timezoneRecurrenceRuntimeCommands);
    expect(timezoneRecurrenceRuntimeReadiness.requiredEvidence).toBe(timezoneRecurrenceDecisionRequiredEvidence);
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("DST spring-forward behavior must be tested.");
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("ICS timezone rendering/import smoke test must pass.");
  });

  it("classifies timezone recurrence evidence before GAP-058 can close", () => {
    const blockedDecision = buildTimezoneRecurrenceEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      timezoneStrategyVerified: true,
      temporalDateLibraryVerified: false,
      routeIanaValidationVerified: true,
      persistenceIanaValidationVerified: false,
      utcPlusTimezoneStorageVerified: true,
      dstSpringVerified: false,
      dstFallVerified: false,
      recurrenceExpansionVerified: false,
      allDayTravelVerified: false,
      crossCityRenderVerified: false,
      providerRenderVerified: false,
      googleRenderSmokePassed: false,
      icsRenderSmokePassed: false,
      seededPersistenceBoundaryVerified: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/timezone-recurrence-runtime.json",
        "coverage/timezone-recurrence-calendar-typecheck.txt",
        "coverage/timezone-recurrence-calendar-test.txt",
        "coverage/timezone-recurrence-strategy.json",
        "coverage/timezone-recurrence-route-iana-validation.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Temporal/date-library implementation evidence is missing.");
    expect(blockedDecision.blockers).toContain("Persistence IANA timezone validation evidence is missing.");
    expect(blockedDecision.blockers).toContain("DST spring-forward test evidence is missing.");
    expect(blockedDecision.blockers).toContain("Google Calendar timezone render smoke evidence is missing.");
    expect(blockedDecision.blockers).toContain("Seeded persistence-boundary timezone evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe timezone recurrence artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/timezone-recurrence-temporal-library.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/timezone-recurrence-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(timezoneRecurrenceRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(timezoneRecurrenceDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: timezoneRecurrenceArtifactPaths.length,
    });

    const completeDecision = buildTimezoneRecurrenceEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      timezoneStrategyVerified: true,
      temporalDateLibraryVerified: true,
      routeIanaValidationVerified: true,
      persistenceIanaValidationVerified: true,
      utcPlusTimezoneStorageVerified: true,
      dstSpringVerified: true,
      dstFallVerified: true,
      recurrenceExpansionVerified: true,
      allDayTravelVerified: true,
      crossCityRenderVerified: true,
      providerRenderVerified: true,
      googleRenderSmokePassed: true,
      icsRenderSmokePassed: true,
      seededPersistenceBoundaryVerified: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: timezoneRecurrenceArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toBe(timezoneRecurrenceDecisionRequiredEvidence);
  });

  it("keeps GAP-058 execution policy non-executing and external evidence explicit", () => {
    const plan = buildTimezoneRecurrenceExecutionPlan();

    expect(plan.policy.codexMayClassifyStaticTimezoneRecurrenceReadiness).toBe(true);
    expect(plan.policy.temporalDateLibraryRequiredForClosure).toBe(true);
    expect(plan.policy.persistenceBoundaryRequiredForClosure).toBe(true);
    expect(plan.policy.dstRecurrenceIntegrationRequiredForClosure).toBe(true);
    expect(plan.policy.providerRenderSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.seededPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.temporalLibraryExecutionAllowed).toBe(false);
    expect(plan.persistenceBoundaryExecutionAllowed).toBe(false);
    expect(plan.providerRenderExecutionAllowed).toBe(false);
    expect(plan.seededPersistenceExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(timezoneRecurrenceLocalCommands);
    expect(plan.externalCommands).toBe(timezoneRecurrenceExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(timezoneRecurrenceRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe timezone recurrence artifact review");
  });

  it("redacts GAP-058 timezone recurrence artifacts before secret-safe review", () => {
    const artifact = {
      tenantDomain: "tenant.example.test",
      googleCalendarRenderUrl: "https://private/google",
      icsImportUrl: "https://private/feed.ics",
      appointmentCustomerEmail: "client@example.test",
      nested: {
        timezoneProviderPayload: "provider_private",
        publicSummary: "timezone recurrence evidence captured",
      },
    };

    const redacted = buildRedactedTimezoneRecurrenceArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantDomain",
      "googleCalendarRenderUrl",
      "icsImportUrl",
      "appointmentCustomerEmail",
      "nested.timezoneProviderPayload",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantDomain: "[REDACTED]",
      googleCalendarRenderUrl: "[REDACTED]",
      icsImportUrl: "[REDACTED]",
      appointmentCustomerEmail: "[REDACTED]",
      nested: {
        timezoneProviderPayload: "[REDACTED]",
        publicSummary: "timezone recurrence evidence captured",
      },
    });

    const review = buildTimezoneRecurrenceArtifactReview({
      publicSummary: "safe timezone recurrence evidence",
      recurrenceDatabaseSnapshot: "db_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["recurrenceDatabaseSnapshot"]);
    expect(review.requiredExternalEvidence).toBe(timezoneRecurrenceRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("seeded persistence-boundary evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/persistence readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 timezone recurrence QA runtime contracts");
    expect(ciWorkflow).toContain("timezone-recurrence-qa-runtime-static.test.ts");
    expect(ciWorkflow).toContain("timezone-recurrence-runtime-artifacts");
    expect(unitManifest).toContain("unit-timezone-recurrence-qa-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/timezoneRecurrenceQaRuntime.ts");
    expect(gapTracker).toContain("timezone/provider evidence classifier");
    expect(gapTracker).toContain("local timezone recurrence evidence builder");
    expect(gapTracker).toContain("GAP-058 is timezone-recurrence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildTimezoneRecurrenceExecutionPlan");
    expect(gapTracker).toContain("timezoneRecurrenceExecutionPolicy");
    expect(gapTracker).toContain("timezoneRecurrenceRequiredExternalEvidence");
    expect(gapTracker).toContain("timezoneRecurrenceDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedTimezoneRecurrenceArtifact");
    expect(gapTracker).toContain("buildTimezoneRecurrenceArtifactReview");
    expect(timezoneRecurrenceArtifactPaths).toContain("coverage/timezone-recurrence-secret-safe-artifacts.json");
  });
});

