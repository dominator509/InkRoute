import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardGoogleCalendarReadiness,
  createInMemoryGoogleCalendarSyncRepository,
  dashboardGoogleCalendarSyncContract,
  executeGoogleCalendarSyncMutation,
  sanitizeGoogleCalendarProviderResult,
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

  it("sanitizes nested Google provider payloads before persistence", () => {
    const result = sanitizeGoogleCalendarProviderResult({
      providerCall: "freebusy.query",
      providerReference: "calendar_primary",
      nextSyncToken: "sync_token_redacted_reference",
      redactedPayload: {
        visibleStatus: "busy",
        accessToken: "ya29.secret",
        nested: {
          refreshToken: "refresh_secret",
          attendees: [{ attendeeEmail: "client@example.com" }],
        },
      },
    });

    expect(result?.redactedPayload).toEqual({
      visibleStatus: "busy",
      accessToken: "[redacted]",
      nested: {
        refreshToken: "[redacted]",
        attendees: [{ attendeeEmail: "[redacted]" }],
      },
    });
    expect(JSON.stringify(result)).not.toContain("ya29.secret");
    expect(JSON.stringify(result)).not.toContain("refresh_secret");
    expect(JSON.stringify(result)).not.toContain("client@example.com");
  });

  it("executes a local Google sync repository contract for connection scope, idempotency, redaction, and transaction capture", async () => {
    const repository = createInMemoryGoogleCalendarSyncRepository();
    repository.state.authorizedConnectionKeys.add("tenant_demo:artist_demo:primary:freebusy_check");
    repository.state.encryptedConnections.set("tenant_demo:artist_demo:primary", {
      refreshTokenEncrypted: true,
      requiredScopesGranted: true,
    });

    const input = {
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "freebusy_check" as const,
      occurredAt: "2026-06-09T12:00:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      idempotencyKey: "google-calendar-freebusy",
      requestId: "request-1",
      appointmentId: "appointment_demo",
      providerEventId: "google_event_demo_redacted",
      syncToken: "sync_token_demo_redacted",
      syncTokenInvalid: false,
      pushChannelId: "push_channel_demo",
      pushResourceId: "push_resource_demo_redacted",
      pushChannelExpiresAt: "2026-06-10T12:00:00.000Z",
      retryAttempt: 0,
    };

    const first = await executeGoogleCalendarSyncMutation(input, repository, async () => ({
      providerCall: "freebusy.query",
      providerReference: "calendar_primary",
      nextSyncToken: null,
      redactedPayload: {
        visibleStatus: "busy",
        accessToken: "ya29.secret",
        nested: { attendeeEmail: "client@example.com" },
      },
    }));
    const duplicate = await executeGoogleCalendarSyncMutation(input, repository);

    expect(first.status).toBe("ready");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.transactions).toHaveLength(1);
    expect(JSON.stringify(repository.state.transactions[0].providerResult)).not.toContain("ya29.secret");
    expect(JSON.stringify(repository.state.transactions[0].providerResult)).not.toContain("client@example.com");

    await expect(
      executeGoogleCalendarSyncMutation(
        {
          ...input,
          tenantId: "other_tenant",
          idempotencyKey: "other-key",
          requestId: "request-2",
        },
        repository,
      ),
    ).rejects.toThrow("GOOGLE_CALENDAR_CONNECTION_ACCESS_DENIED");
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
    expect(routeSource).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });
});
