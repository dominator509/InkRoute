import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  calendarLaunchArtifactPaths,
  calendarLaunchReadinessAreas,
  calendarLaunchRuntimeCommands,
  calendarLaunchRuntimeMatrix,
  calendarLaunchRuntimeReadiness,
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

  it("keeps calendar package scripts, launch helper, read route redaction, and ICS route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildCalendarLaunchEvidencePlan");
    expect(calendarTests).toContain("availability");
    expect(dashboardCalendarRoute).toContain("calendar:read");
    expect(dashboardCalendarTest).toContain("encrypted-token omission");
    expect(publicTravelIcsRoute).toContain("ics");
  });

  it("keeps calendar launch blockers explicit until provider/database evidence exists", () => {
    expect(calendarLaunchRuntimeReadiness.status).toBe("blocked");
    expect(calendarLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(calendarLaunchRuntimeReadiness.requiredCommands).toEqual([...calendarLaunchRuntimeCommands]);
    expect(calendarLaunchRuntimeReadiness.requiredEvidence).toContain(
      "tenant-scoped availability repository, Postgres integration, race-condition, and tenant-isolation evidence",
    );
    expect(calendarLaunchRuntimeReadiness.requiredEvidence).toContain(
      "Google OAuth, encrypted token, worker, FreeBusy, event sync, and push/incremental recovery evidence",
    );
    expect(calendarLaunchRuntimeReadiness.blockers).toContain("Google OAuth client, redirect URI, and scopes must be configured.");
    expect(calendarLaunchRuntimeReadiness.blockers).toContain("Signed ICS access route smoke tests must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming calendar launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 calendar launch runtime contracts");
    expect(ciWorkflow).toContain("calendar-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("calendar-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-calendar-launch-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/calendarLaunchRuntime.ts");
    expect(gapTracker).toContain("live calendar typecheck/tests, Postgres mutation integration, concurrent hold race rejection, tenant isolation, Google OAuth/sync, signed ICS runtime/import, timezone/provider QA, travel publish/cache, smoke tests, CI evidence, and secret-safe artifacts remain open");
  });
});
