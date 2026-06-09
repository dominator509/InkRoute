import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardGoogleCalendarReadiness,
  dashboardGoogleCalendarSyncContract,
} from "../lib/googleCalendarSync";

const repoRoot = resolve(__dirname, "../../..");

describe("dashboard Google Calendar sync contract", () => {
  it("covers OAuth, FreeBusy, event mutation, full/incremental sync, and push renewal actions", () => {
    expect(dashboardGoogleCalendarSyncContract.supportedActions).toEqual([
      "oauth_connect",
      "freebusy_check",
      "upsert_event",
      "delete_event",
      "incremental_sync",
      "full_resync",
      "renew_push_channel",
    ]);
    expect(dashboardGoogleCalendarSyncContract.samplePlans).toHaveLength(7);
  });

  it("requires encrypted tokens, idempotency, invalid-sync recovery, push validation, and audit logs", () => {
    const controls = dashboardGoogleCalendarSyncContract.samplePlans.flatMap((plan) => plan.requiredControls).join("\n");

    expect(controls).toContain("Encrypt refresh tokens");
    expect(controls).toContain("Claim idempotency key");
    expect(controls).toContain("On Google 410 invalid sync token");
    expect(controls).toContain("Renew push channels before expiration");
    expect(controls).toContain("Persist redacted CalendarAuditLog");
  });

  it("keeps runtime readiness blocked until SDK, OAuth, Google smoke, tenant, and artifact proof exists", () => {
    const readiness = buildDashboardGoogleCalendarReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("Google Calendar SDK/client dependency must be installed and pinned.");
    expect(readiness.blockers).toContain("Google OAuth app, redirect URI, and client credentials must be configured.");
    expect(readiness.blockers).toContain("Google FreeBusy smoke test must pass against a test calendar.");
    expect(readiness.blockers).toContain("Google calendar provider tests must deny cross-tenant connection and event access.");
    expect(readiness.blockers).toContain("Google test calendar evidence must be attached for OAuth, freebusy, event sync, push, and recovery flows.");
  });

  it("wires the dashboard Google sync API through the provider sync plan", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/api/calendar/google-sync/route.ts"), "utf8");

    expect(routeSource).toContain("buildGoogleCalendarProviderSyncPlan");
    expect(routeSource).toContain("calendar:write");
    expect(routeSource).toContain("GOOGLE_CALENDAR_SYNC_BLOCKED");
    expect(routeSource).toContain("provider-worker-required");
  });
});
