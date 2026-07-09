import { buildAvailabilitySlots, detectCalendarConflicts, type CalendarTimeBlock } from "@inkroute/calendar";
import { inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { prisma } from "@inkroute/db";
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

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

function toPublicWindow(row: {
  id: string;
  tenantId: string;
  artistId: string;
  kind: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  maxBookings: number | null;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}): AvailabilityWindow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    artistId: row.artistId,
    kind: row.kind,
    status: row.status,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    timezone: row.timezone,
    ...(row.maxBookings !== null ? { maxBookings: row.maxBookings } : {}),
    bufferBeforeMinutes: row.bufferBeforeMinutes,
    bufferAfterMinutes: row.bufferAfterMinutes,
  };
}

function buildPublicWindowReceipt(window: AvailabilityWindow) {
  return {
    kind: window.kind,
    status: window.status,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    timezone: window.timezone,
    ...(window.maxBookings !== undefined ? { maxBookings: window.maxBookings } : {}),
    bufferBeforeMinutes: window.bufferBeforeMinutes,
    bufferAfterMinutes: window.bufferAfterMinutes,
    responseProjection: {
      rawAvailabilityWindowEchoed: false,
      availabilityWindowIdEchoed: false,
      tenantIdEchoed: false,
      artistIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

function buildPublicSlotReceipts(slots: ReturnType<typeof buildAvailabilitySlots>) {
  return slots.map((slot) => ({
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    status: slot.status,
    conflictCount: slot.conflictIds.length,
    responseProjection: {
      rawSlotObjectEchoed: false,
      slotIdEchoed: false,
      conflictIdsEchoed: false,
    },
  }));
}

function buildPublicConflictReceipts(conflicts: ReturnType<typeof detectCalendarConflicts>) {
  return conflicts.map((conflict) => ({
    severity: conflict.severity,
    reason: conflict.reason,
    conflictingBlockLinked: true,
    responseProjection: {
      rawConflictObjectEchoed: false,
      conflictingBlockIdEchoed: false,
    },
  }));
}

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const normalizedTenantSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();

  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: {
          where: { slug: string };
          select: {
            id: true;
            slug: true;
            availabilityWindows: {
              where: { status: { in: string[] }; endsAt: { gte: Date } };
              orderBy: { startsAt: "asc" };
              take: number;
              select: {
                id: true;
                tenantId: true;
                artistId: true;
                kind: true;
                status: true;
                startsAt: true;
                endsAt: true;
                timezone: true;
                maxBookings: true;
                bufferBeforeMinutes: true;
                bufferAfterMinutes: true;
              };
            };
          };
        }) => Promise<{ id: string; slug: string; availabilityWindows: Array<Parameters<typeof toPublicWindow>[0]> } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedTenantSlug },
      select: {
        id: true,
        slug: true,
        availabilityWindows: {
          where: {
            status: { in: ["open", "waitlist"] },
            endsAt: { gte: new Date() },
          },
          orderBy: { startsAt: "asc" },
          take: 6,
          select: {
            id: true,
            tenantId: true,
            artistId: true,
            kind: true,
            status: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            maxBookings: true,
            bufferBeforeMinutes: true,
            bufferAfterMinutes: true,
          },
        },
      },
    });

    if (tenant) {
      const windows = tenant.availabilityWindows.map(toPublicWindow);
      return Response.json(
        {
          ok: true,
          status: "database_preview_read_only",
          gapIds: ["GAP-009", "GAP-056", "GAP-057"],
          data: {
            tenantSlug: tenant.slug,
            source: "database",
            windows: windows.map(buildPublicWindowReceipt),
            slotsByWindow: windows.map((window) => ({
              availabilityWindowIdEchoed: false,
              slots: buildPublicSlotReceipts(buildAvailabilitySlots({ window, durationMinutes: 120, stepMinutes: 120, existingBlocks: [] })),
            })),
            responseProjection: {
              rawAvailabilityWindowsEchoed: false,
              rawSlotObjectsEchoed: false,
              rawConflictObjectsEchoed: false,
              availabilityWindowIdsEchoed: false,
              tenantIdEchoed: false,
              artistIdEchoed: false,
              conflictIdsEchoed: false,
              internalPersistenceIdsEchoed: false,
            },
            boundary: {
              readOnly: true,
              holdsPersisted: false,
              conflictWritesPersisted: false,
              providerSyncExecuted: false,
              requiredNextWork: [
                "Persist slot holds transactionally before accepting bookings against these windows.",
                "Prove concurrent hold race rejection with seeded Postgres tests.",
                "Attach Google provider sync evidence only after OAuth credentials and encrypted tokens are configured.",
              ],
            },
          },
        },
        { headers: noStoreHeaders },
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
      return Response.json(
        {
          ok: false,
          error: { code: "PROVIDER_AVAILABILITY_NOT_CONFIGURED" },
          tenantSlug,
          productionBoundary: {
            staticPreviewDisabled: true,
            databaseAvailabilityReadFailed: true,
            gapIds: ["GAP-009", "GAP-056", "GAP-057"],
          },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }
  }

  if (normalizedTenantSlug !== inkrouteDemoTenant.slug) {
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
        window: buildPublicWindowReceipt(demoWindow),
        slots: buildPublicSlotReceipts(buildAvailabilitySlots({ window: demoWindow, durationMinutes: 120, stepMinutes: 120, existingBlocks: demoBusyBlocks })),
        conflicts: buildPublicConflictReceipts(detectCalendarConflicts(candidate, demoBusyBlocks)),
        responseProjection: {
          rawAvailabilityWindowsEchoed: false,
          rawSlotObjectsEchoed: false,
          rawConflictObjectsEchoed: false,
          availabilityWindowIdsEchoed: false,
          tenantIdEchoed: false,
          artistIdEchoed: false,
          conflictIdsEchoed: false,
          internalPersistenceIdsEchoed: false,
        },
      },
    },
    { headers: noStoreHeaders },
  );
}
