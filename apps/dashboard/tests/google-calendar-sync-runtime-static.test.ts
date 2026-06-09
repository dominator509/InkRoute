import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  googleCalendarSyncArtifactPaths,
  googleCalendarSyncRuntimeCommands,
  googleCalendarSyncRuntimeMatrix,
  googleCalendarSyncRuntimeReadiness,
} from "../lib/googleCalendarSyncRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Google Calendar sync runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const syncSource = readWorkspaceFile("apps/dashboard/lib/googleCalendarSync.ts");
  const syncStaticTest = readWorkspaceFile("apps/dashboard/tests/google-calendar-sync-static.test.ts");
  const syncRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/google-sync/route.ts");
  const calendarRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/route.ts");
  const readRouteStaticTest = readWorkspaceFile("apps/dashboard/tests/calendar-read-route-static.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-057 commands, matrix rows, and artifacts", () => {
    expect(googleCalendarSyncRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "Google OAuth callback smoke test",
      "Google FreeBusy test-calendar smoke",
      "Google event insert/update/delete smoke",
      "Google invalid sync-token full-resync smoke",
      "Google push channel renewal/webhook smoke",
    ]);
    expect(googleCalendarSyncRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "google-sdk-client",
      "oauth-app",
      "oauth-callback",
      "required-scopes",
      "encrypted-token-repository",
      "provider-worker",
      "freebusy-smoke",
      "event-crud-smoke",
      "full-incremental-sync",
      "invalid-token-recovery",
      "push-renewal",
      "push-webhook",
      "retry-backoff",
      "idempotency-store",
      "calendar-audit-log",
      "tenant-isolation",
      "test-calendar-artifacts",
      "ci-secret-safe-evidence",
    ]);
    expect(googleCalendarSyncArtifactPaths).toContain("coverage/google-calendar-sync-runtime.json");
    expect(googleCalendarSyncArtifactPaths).toContain("test-results/google-calendar-sync-runtime");
  });

  it("keeps package helper, dashboard provider-worker contract, sync route, and calendar read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildGoogleCalendarProviderSyncPlan");
    expect(calendarSource).toContain("buildGoogleCalendarRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildGoogleCalendarRuntimeReadinessPlan");
    expect(syncSource).toContain("GoogleCalendarSyncRepository");
    expect(syncSource).toContain("loadEncryptedConnection");
    expect(syncSource).toContain("runGoogleCalendarTransaction");
    expect(syncStaticTest).toContain("covers OAuth, FreeBusy, event mutation, full/incremental sync, and push renewal actions");
    expect(syncRoute).toContain("GOOGLE_CALENDAR_SYNC_BLOCKED");
    expect(syncRoute).toContain("provider-worker-required");
    expect(calendarRoute).toContain("CalendarProviderConnection");
    expect(readRouteStaticTest).toContain("CalendarProviderConnection");
  });

  it("keeps SDK, OAuth, token, provider, smoke, push, isolation, and artifact blockers explicit", () => {
    expect(googleCalendarSyncRuntimeReadiness.status).toBe("blocked");
    expect(googleCalendarSyncRuntimeReadiness.missingScripts).toEqual([]);
    expect(googleCalendarSyncRuntimeReadiness.requiredCommands).toEqual([...googleCalendarSyncRuntimeCommands]);
    expect(googleCalendarSyncRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Google SDK/client setup plus OAuth app, scopes, and callback route evidence",
      "Google test calendar FreeBusy and event insert/update/delete smoke-test output",
      "Google push channel renewal and webhook handler test output",
      "retry/idempotency, tenant-isolation, and Google test-calendar artifact evidence",
    ]));
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google Calendar SDK/client dependency must be installed and pinned.");
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google FreeBusy smoke test must pass against a test calendar.");
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google test calendar evidence must be attached for OAuth, freebusy, event sync, push, and recovery flows.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Google provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 Google Calendar sync runtime contracts");
    expect(ciWorkflow).toContain("google-calendar-sync-runtime-static.test.ts");
    expect(ciWorkflow).toContain("google-calendar-sync-runtime-artifacts");
    expect(unitManifest).toContain("unit-google-calendar-sync-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/googleCalendarSyncRuntime.ts");
    expect(gapTracker).toContain("GAP-057 is google-calendar-sync-runtime-matrix wired");
    expect(googleCalendarSyncArtifactPaths).toContain("coverage/google-calendar-sync-secret-safe-artifacts.json");
  });
});
