import { buildAvailabilitySlots, detectCalendarConflicts, type CalendarTimeBlock } from "@inkroute/calendar";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import type { AvailabilityWindow } from "@inkroute/types";

const noStoreHeaders = { "Cache-Control": "private, no-store" } as const;

const demoWindow: AvailabilityWindow = {
  id: "public_preview_seattle_flash",
  tenantId: inkrouteDemoTenant.id,
  artistId: inkrouteDemoArtist.id,
  kind: "flash",
  status: "open",
  startsAt: "2026-07-11T11:00:00-07:00",
  endsAt: "2026-07-11T18:00:00-07:00",
  timezone: "America/Los_Angeles",
  maxBookings: 3,
  bufferBeforeMinutes: 30,
  bufferAfterMinutes: 30,
};

const demoBusyBlocks: CalendarTimeBlock[] = [
  {
    id: "appt_flash_noa",
    title: "Black Sun Flash",
    startsAt: "2026-07-11T15:00:00-07:00",
    endsAt: "2026-07-11T17:00:00-07:00",
    timezone: "America/Los_Angeles",
    source: "appointment",
    bufferBeforeMinutes: 30,
    bufferAfterMinutes: 30,
    blocksBooking: true,
  },
];

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;

  if (tenantSlug !== inkrouteDemoTenant.slug) {
    return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "No demo availability exists for this tenant." } }, { status: 404, headers: noStoreHeaders });
  }

  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        ok: false,
        error: { code: "PROVIDER_AVAILABILITY_NOT_CONFIGURED" },
        tenantSlug,
        productionBoundary: {
          staticPreviewDisabled: true,
          gapIds: ["GAP-009", "GAP-056", "GAP-057"],
          requiredBeforeEnablement: [
            "tenant-scoped availability repository execution",
            "persisted conflict detection",
            "concurrent hold race rejection",
            "calendar provider smoke evidence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const candidate: CalendarTimeBlock = {
    id: "candidate_preview_slot",
    title: "Candidate public flash slot",
    startsAt: "2026-07-11T14:30:00-07:00",
    endsAt: "2026-07-11T16:30:00-07:00",
    timezone: "America/Los_Angeles",
    source: "availability_hold",
    bufferBeforeMinutes: 30,
    bufferAfterMinutes: 30,
    blocksBooking: true,
  };

  return Response.json(
    {
      ok: true,
      status: "static_preview_not_persistent",
      gapIds: ["GAP-009", "GAP-056", "GAP-057"],
      data: {
        window: demoWindow,
        slots: buildAvailabilitySlots({ window: demoWindow, durationMinutes: 120, stepMinutes: 120, existingBlocks: demoBusyBlocks }),
        conflicts: detectCalendarConflicts(candidate, demoBusyBlocks),
      },
    },
    { headers: noStoreHeaders },
  );
}
