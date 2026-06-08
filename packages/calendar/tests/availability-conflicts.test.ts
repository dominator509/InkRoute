import { describe, expect, it } from "vitest";
import {
  buildAvailabilitySlots,
  buildAvailabilityPersistencePlan,
  buildGoogleCalendarProviderSyncPlan,
  buildSignedIcsFeedDraft,
  buildSignedIcsFeedTokenHash,
  auditCalendarTimezones,
  detectCalendarConflicts,
  evaluateSignedIcsFeedAccess,
  isValidIanaTimezone,
  type CalendarTimeBlock,
} from "../src/index";
import type { AvailabilityWindow } from "@inkroute/types";

const window: AvailabilityWindow = {
  id: "window_1",
  tenantId: "tenant_1",
  artistId: "artist_1",
  kind: "booking",
  status: "open",
  startsAt: "2026-06-10T16:00:00.000Z",
  endsAt: "2026-06-10T22:00:00.000Z",
  timezone: "America/Los_Angeles",
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 15
};

const busy: CalendarTimeBlock = {
  id: "appointment_1",
  title: "Booked tattoo",
  startsAt: "2026-06-10T18:00:00.000Z",
  endsAt: "2026-06-10T20:00:00.000Z",
  timezone: "America/Los_Angeles",
  source: "appointment",
  bufferBeforeMinutes: 15,
  bufferAfterMinutes: 30,
  blocksBooking: true
};

describe("calendar availability", () => {
  it("marks generated slots that conflict with booked appointments", () => {
    const slots = buildAvailabilitySlots({ window, durationMinutes: 120, stepMinutes: 120, existingBlocks: [busy] });

    expect(slots).toHaveLength(3);
    expect(slots.some((slot) => slot.status === "conflicted")).toBe(true);
    expect(slots.some((slot) => slot.status === "open")).toBe(true);
  });

  it("distinguishes buffer overlap from direct overlap", () => {
    const conflicts = detectCalendarConflicts(
      {
        id: "candidate",
        title: "Candidate",
        startsAt: "2026-06-10T20:10:00.000Z",
        endsAt: "2026-06-10T21:00:00.000Z",
        timezone: "America/Los_Angeles",
        source: "availability_hold",
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        blocksBooking: true
      },
      [busy]
    );

    expect(conflicts[0]?.severity).toBe("warning");
  });

  it("creates signed ICS feed drafts as security-gated metadata", () => {
    const draft = buildSignedIcsFeedDraft({ tenantSlug: "mara-vale", artistSlug: "mara", expiresInDays: 30 });

    expect(draft.path).toContain("/calendar/mara/travel.ics");
    expect(draft.gapIds).toEqual(expect.arrayContaining(["GAP-055"]))
  });

  it("evaluates signed ICS feed token access and cache policy", () => {
    const token = "feed-token-001";
    const record = {
      tokenHash: buildSignedIcsFeedTokenHash(token),
      tenantSlug: "mara-vale",
      artistSlug: "mara",
      expiresAt: "2026-07-01T00:00:00.000Z",
    };

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record,
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }),
    ).toMatchObject({
      allowed: true,
      status: "allowed",
      cacheControl: "private, max-age=300, stale-while-revalidate=60",
      shouldLogAccess: true,
    });

    expect(
      evaluateSignedIcsFeedAccess({
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("missing_token");

    expect(
      evaluateSignedIcsFeedAccess({
        token: "wrong",
        record,
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("invalid_token");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, tenantSlug: "other" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("scope_mismatch");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, revokedAt: "2026-06-01T00:00:00.000Z" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("revoked");

    expect(
      evaluateSignedIcsFeedAccess({
        token,
        record: { ...record, expiresAt: "2026-06-01T00:00:00.000Z" },
        tenantSlug: "mara-vale",
        artistSlug: "mara",
        now: "2026-06-08T00:00:00.000Z",
      }).status,
    ).toBe("expired");
  });

  it("audits IANA timezones across blocks, windows, travel stops, and required city matrix", () => {
    expect(isValidIanaTimezone("America/Los_Angeles")).toBe(true);
    expect(isValidIanaTimezone("America/Phoenix")).toBe(true);
    expect(isValidIanaTimezone("PST")).toBe(false);
    expect(isValidIanaTimezone(" America/New_York")).toBe(false);

    const summary = auditCalendarTimezones({
      blocks: [busy],
      windows: [window],
      travelStops: [
        {
          id: "stop_1",
          timezone: "America/New_York",
        },
      ],
      requiredTimezones: ["America/Los_Angeles", "America/Phoenix", "America/New_York", "America/Chicago"],
    });

    expect(summary.status).toBe("pass");
    expect(summary.checkedCount).toBe(7);
    expect(summary.uniqueTimezones).toEqual([
      "America/Chicago",
      "America/Los_Angeles",
      "America/New_York",
      "America/Phoenix",
    ]);

    const failing = auditCalendarTimezones({
      blocks: [{ ...busy, id: "bad_block", timezone: "US/Pacific Time" }],
    });
    expect(failing.status).toBe("fail");
    expect(failing.findings[0]).toMatchObject({
      id: "block:bad_block",
      status: "fail",
    });
  });

  it("plans transactional availability window and slot hold persistence", () => {
    const windowPlan = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "create_availability_window",
      startsAt: "2026-06-10T16:00:00.000Z",
      endsAt: "2026-06-10T22:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      idempotencyKey: "availability-window:tenant_demo:artist_demo:2026-06-10",
    });
    const holdPlan = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "create_slot_hold",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      bookingRequestId: "booking_demo",
      availabilityWindowId: "window_demo",
      idempotencyKey: "slot-hold:tenant_demo:artist_demo:booking_demo",
    });

    expect(windowPlan).toMatchObject({
      status: "ready",
      requiresTransaction: true,
      idempotencyKey: "availability-window:tenant_demo:artist_demo:2026-06-10",
    });
    expect(windowPlan.writes.map((write) => write.model)).toEqual(["AvailabilityWindow", "CalendarAuditLog", "IdempotencyKey"]);
    expect(holdPlan.writes.map((write) => write.model)).toEqual(["AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"]);
    expect(holdPlan.writes.every((write) => write.tenantId === "tenant_demo")).toBe(true);
    expect(holdPlan.requiredControls).toContain("Lock the tenant/artist/time range or use an equivalent exclusion constraint before inserting slot holds.");
    expect(holdPlan.blockers).toEqual([]);
  });

  it("plans appointment confirmation and hold release audit writes", () => {
    const confirmation = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "confirm_appointment",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      bookingRequestId: "booking_demo",
      availabilityWindowId: "window_demo",
      holdId: "hold_demo",
      appointmentId: "appointment_demo",
      idempotencyKey: "appointment-confirm:tenant_demo:appointment_demo",
    });
    const release = buildAvailabilityPersistencePlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      action: "release_slot_hold",
      startsAt: "2026-06-10T18:00:00.000Z",
      endsAt: "2026-06-10T20:00:00.000Z",
      timezone: "America/Los_Angeles",
      actorId: "artist_demo",
      holdId: "hold_demo",
      idempotencyKey: "hold-release:tenant_demo:hold_demo",
    });

    expect(confirmation.writes.map((write) => write.model)).toEqual(["Appointment", "AvailabilityHold", "BookingRequest", "CalendarAuditLog", "IdempotencyKey"]);
    expect(confirmation.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      action: "confirm_appointment",
      bookingRequestId: "booking_demo",
      holdId: "hold_demo",
      appointmentId: "appointment_demo",
    });
    expect(release.writes.map((write) => write.model)).toEqual(["AvailabilityHold", "CalendarAuditLog", "IdempotencyKey"]);
  });

  it("blocks availability persistence without tenant scope, actor, valid time, timezone, and concurrency controls", () => {
    const blocked = buildAvailabilityPersistencePlan({
      tenantId: " ",
      artistId: "",
      action: "create_slot_hold",
      startsAt: "2026-06-10T20:00:00.000Z",
      endsAt: "2026-06-10T18:00:00.000Z",
      timezone: "PST",
      conflictIds: ["appointment_1"],
      existingHoldIds: ["hold_1"],
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "Missing tenant scope.",
      "Missing artist id.",
      "Availability mutations require an actor id for audit attribution.",
      "Missing idempotency key for availability mutation.",
      "Availability time range must have a valid start before end.",
      "Availability timezone must be a valid IANA identifier.",
      "Availability mutation has blocking calendar conflicts.",
      "Slot hold and appointment confirmation require a booking request id.",
      "Slot hold and appointment confirmation require an availability window id.",
      "Concurrent slot hold already exists for this tenant, artist, and time range.",
    ]);
  });

  it("plans Google OAuth connection and event upsert with encrypted token and audit writes", () => {
    const oauth = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "oauth_connect",
      occurredAt: "2026-06-08T10:00:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: false,
      providerWorkerEnabled: true,
      idempotencyKey: "google-oauth:tenant_demo:artist_demo",
    });
    const upsert = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "upsert_event",
      occurredAt: "2026-06-08T10:05:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      appointmentId: "appointment_demo",
      providerEventId: "event_demo",
      idempotencyKey: "google-event-upsert:tenant_demo:appointment_demo",
    });

    expect(oauth.status).toBe("ready");
    expect(oauth.providerCall).toBe("google.oauth.exchangeCode");
    expect(oauth.writes.map((write) => write.model)).toEqual(["CalendarProviderConnection", "CalendarProviderToken", "CalendarAuditLog", "IdempotencyKey"]);
    expect(upsert.status).toBe("ready");
    expect(upsert.providerCall).toBe("google.events.insertOrUpdate");
    expect(upsert.writes.map((write) => write.model)).toEqual(["CalendarProviderEvent", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"]);
    expect(upsert.writes.find((write) => write.model === "CalendarAuditLog")?.payload).toMatchObject({
      action: "upsert_event",
      appointmentId: "appointment_demo",
      providerCall: "google.events.insertOrUpdate",
    });
  });

  it("plans incremental sync recovery and push channel renewal controls", () => {
    const invalidIncremental = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "incremental_sync",
      occurredAt: "2026-06-08T10:10:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      syncToken: "sync_token_001",
      syncTokenInvalid: true,
      idempotencyKey: "google-incremental:tenant_demo:sync_token_001",
    });
    const renewal = buildGoogleCalendarProviderSyncPlan({
      tenantId: "tenant_demo",
      artistId: "artist_demo",
      calendarId: "primary",
      action: "renew_push_channel",
      occurredAt: "2026-06-08T10:15:00.000Z",
      oauthClientConfigured: true,
      requiredScopesGranted: true,
      refreshTokenEncrypted: true,
      providerWorkerEnabled: true,
      pushChannelId: "channel_001",
      pushResourceId: "resource_001",
      pushChannelExpiresAt: "2026-06-09T10:15:00.000Z",
      idempotencyKey: "google-channel-renew:tenant_demo:channel_001",
    });

    expect(invalidIncremental.status).toBe("blocked");
    expect(invalidIncremental.blockers).toContain("Google returned an invalid sync token; run full_resync before incremental sync.");
    expect(invalidIncremental.nextAction).toContain("Run full_resync");
    expect(renewal.status).toBe("ready");
    expect(renewal.providerCall).toBe("google.channels.watch");
    expect(renewal.writes.map((write) => write.model)).toEqual(["CalendarPushChannel", "CalendarSyncState", "CalendarAuditLog", "IdempotencyKey"]);
    expect(renewal.requiredControls).toContain("Renew push channels before expiration and validate webhook resource/channel ids before processing notifications.");
  });

  it("blocks Google sync when credentials, encrypted tokens, ids, or idempotency are missing", () => {
    const blocked = buildGoogleCalendarProviderSyncPlan({
      tenantId: "",
      artistId: "",
      calendarId: "",
      action: "delete_event",
      occurredAt: "2026-06-08T10:20:00.000Z",
      oauthClientConfigured: false,
      requiredScopesGranted: false,
      refreshTokenEncrypted: false,
      providerWorkerEnabled: false,
    });

    expect(blocked.status).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "Missing tenant scope.",
      "Missing artist id.",
      "Missing Google calendar id.",
      "Google OAuth client and redirect URI must be configured.",
      "Google Calendar scopes must be granted before provider sync.",
      "Google Calendar provider worker must be enabled before executing sync operations.",
      "Missing idempotency key for Google Calendar sync operation.",
      "Encrypted refresh token must be stored before Google Calendar provider calls.",
      "Appointment id is required before mutating Google Calendar events.",
      "Provider event id is required before deleting Google Calendar events.",
    ]);
  });
});
