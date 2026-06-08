import { describe, expect, it } from "vitest";
import {
  buildAvailabilitySlots,
  buildSignedIcsFeedDraft,
  buildSignedIcsFeedTokenHash,
  detectCalendarConflicts,
  evaluateSignedIcsFeedAccess,
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
});
