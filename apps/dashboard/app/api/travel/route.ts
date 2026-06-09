import { buildTenantDashboardView, demoTravelStops } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "travel:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read travel schedules." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query travel schedules for another tenant." } }, { status: 403 });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        count: demoTravelStops.length,
        travel: demoTravelStops.slice(0, limit),
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Local fallback returns demo travel stops only; database mode is required for live travel reads.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.travelSchedule.findMany({
        where: { tenantId },
        orderBy: { startsAt: "asc" },
        take: limit,
        select: {
          id: true,
          tenantId: true,
          artistId: true,
          title: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          bookingStatus: true,
          guestSpotUrl: true,
          publicNotes: true,
          internalNotes: true,
          travelCity: {
            select: {
              id: true,
              slug: true,
              city: true,
              region: true,
              country: true,
              timezone: true,
              latitude: true,
              longitude: true,
              publicSummary: true,
              waitlistEnabled: true,
            },
          },
          studio: { select: { id: true, name: true, city: true, region: true } },
          availability: {
            orderBy: { startsAt: "asc" },
            select: {
              id: true,
              kind: true,
              status: true,
              startsAt: true,
              endsAt: true,
              timezone: true,
              maxBookings: true,
              bufferBeforeMinutes: true,
              bufferAfterMinutes: true,
              publicLabel: true,
              internalNotes: true,
            },
          },
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "travel:read:list",
          entityType: "TravelSchedule",
          metadata: {
            source: "dashboard-api",
            count: rows.length,
            limit,
            redaction: "buildTenantDashboardView",
            redactsInternalNotes: true,
          },
        },
        select: { id: true },
      });

      return { rows, audit };
    });

    const view = buildTenantDashboardView({
      collection: "travel",
      tenantId,
      source: "repository",
      records: result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        artistId: row.artistId,
        title: row.title,
        cityId: row.travelCity.id,
        city: row.travelCity.city,
        region: row.travelCity.region,
        country: row.travelCity.country,
        slug: row.travelCity.slug,
        timezone: row.timezone || row.travelCity.timezone,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        bookingStatus: row.bookingStatus,
        publicNotes: row.publicNotes,
        publicSummary: row.travelCity.publicSummary,
        waitlistEnabled: row.travelCity.waitlistEnabled,
        latitude: toNumber(row.travelCity.latitude),
        longitude: toNumber(row.travelCity.longitude),
        studioName: row.studio?.name ?? null,
        studioLocation: row.studio ? [row.studio.city, row.studio.region].filter(Boolean).join(", ") : null,
        guestSpotUrl: row.guestSpotUrl,
        internalNotes: row.internalNotes,
        availabilityCount: row.availability.length,
        openAvailabilityCount: row.availability.filter((window) => window.status === "open").length,
        availability: row.availability.map((window) => ({
          id: window.id,
          kind: window.kind,
          status: window.status,
          startsAt: window.startsAt.toISOString(),
          endsAt: window.endsAt.toISOString(),
          timezone: window.timezone,
          maxBookings: window.maxBookings,
          bufferBeforeMinutes: window.bufferBeforeMinutes,
          bufferAfterMinutes: window.bufferAfterMinutes,
          publicLabel: window.publicLabel,
          internalNotes: window.internalNotes,
        })),
      })),
      redactedFields: ["internalNotes", "guestSpotUrl"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        count: view.records.length,
        travel: view.records,
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Dashboard travel list reads are tenant-scoped, internal-note redacted, no-store, and audited.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel list reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_LIST_READ_FAILED", message: "Travel schedules could not be loaded." } }, { status: 500 });
  }
}
