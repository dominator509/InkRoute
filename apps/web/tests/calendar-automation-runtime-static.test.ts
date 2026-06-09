import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calendarAutomationArtifactPaths, calendarAutomationRuntimeCommands, calendarAutomationRuntimeMatrix, calendarAutomationRuntimeReadiness } from "../lib/calendarAutomatedTestsRuntime";

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

  it("keeps package helper, existing automation contract, routes, and dashboard calendar surface wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildCalendarAutomatedTestReadinessPlan");
    expect(calendarTests).toContain("buildCalendarAutomatedTestReadinessPlan");
    expect(automationSource).toContain("calendarAutomatedTestSuites");
    expect(automationSource).toContain("concurrent-hold-race");
    expect(automationStaticTest).toContain("enumerates the full Phase 8 calendar and travel test matrix");
    expect(icsRouteTest).toContain("travel.ics");
    expect(availabilityRouteTest).toContain("availability-preview");
    expect(calendarPage).toContain("calendar");
  });

  it("keeps DB, Google, timezone, Playwright, race, revocation, CI, and artifact blockers explicit", () => {
    expect(calendarAutomationRuntimeReadiness.status).toBe("blocked");
    expect(calendarAutomationRuntimeReadiness.missingScripts).toEqual([]);
    expect(calendarAutomationRuntimeReadiness.requiredCommands).toEqual([...calendarAutomationRuntimeCommands]);
    expect(calendarAutomationRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "calendar helper and public route test output",
      "Postgres integration output for availability persistence, concurrent holds, audit logs, and signed-feed revocation",
      "Google test-calendar provider integration transcript",
      "DST/recurrence provider matrix output for internal, Google, and ICS render paths",
      "Playwright dashboard calendar and public travel smoke-test artifacts",
      "CI calendar test job configuration and retained artifacts",
    ]));
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Postgres calendar integration tests must pass for availability, holds, appointments, audit logs, and feed tokens.");
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Google provider integration tests must pass against a test calendar.");
    expect(calendarAutomationRuntimeReadiness.blockers).toContain("Calendar test artifacts must capture DB logs, Google provider transcripts, Playwright traces, and ICS import output.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming DB/provider/Playwright evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 8 calendar automation runtime contracts");
    expect(ciWorkflow).toContain("calendar-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("calendar-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-calendar-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/calendarAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("GAP-059 is calendar-automation-runtime-matrix wired");
    expect(calendarAutomationArtifactPaths).toContain("coverage/calendar-automation-secret-safe-artifacts.json");
  });
});
