import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  timezoneRecurrenceArtifactPaths,
  timezoneRecurrenceRuntimeCommands,
  timezoneRecurrenceRuntimeMatrix,
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

  it("keeps package helper, dashboard QA contract, API boundary, and calendar read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildTimezoneRecurrenceQaPlan");
    expect(calendarSource).toContain("buildTimezoneRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildTimezoneRuntimeReadinessPlan");
    expect(qaSource).toContain("dashboardTimezoneQaCases");
    expect(qaSource).toContain("validateTimezoneBoundaries");
    expect(qaStaticTest).toContain("covers IANA validation, DST, recurrence, provider render, and all-day travel checks");
    expect(routeSource).toContain("validateTimezoneBoundaries");
    expect(routeSource).toContain("TENANT_MISMATCH");
    expect(calendarRoute).toContain("timezone");
    expect(readRouteStaticTest).toContain("timezone");
  });

  it("keeps Temporal/date-library, boundary, DST, recurrence, provider, and seeded persistence blockers explicit", () => {
    expect(timezoneRecurrenceRuntimeReadiness.status).toBe("blocked");
    expect(timezoneRecurrenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(timezoneRecurrenceRuntimeReadiness.requiredCommands).toEqual([...timezoneRecurrenceRuntimeCommands]);
    expect(timezoneRecurrenceRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "documented Temporal/date-library strategy with route, persistence, provider, and render usage",
      "DST, recurrence expansion, and all-day travel-window test output",
      "cross-city internal, Google, and ICS provider render smoke-test artifacts",
      "seeded persistence-boundary tests for stored availability, appointments, travel windows, and recurrence expansion",
    ]));
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("DST spring-forward behavior must be tested.");
    expect(timezoneRecurrenceRuntimeReadiness.blockers).toContain("ICS timezone rendering/import smoke test must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/persistence readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 timezone recurrence QA runtime contracts");
    expect(ciWorkflow).toContain("timezone-recurrence-qa-runtime-static.test.ts");
    expect(ciWorkflow).toContain("timezone-recurrence-runtime-artifacts");
    expect(unitManifest).toContain("unit-timezone-recurrence-qa-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/timezoneRecurrenceQaRuntime.ts");
    expect(gapTracker).toContain("GAP-058 is timezone-recurrence-runtime-matrix wired");
    expect(timezoneRecurrenceArtifactPaths).toContain("coverage/timezone-recurrence-secret-safe-artifacts.json");
  });
});
