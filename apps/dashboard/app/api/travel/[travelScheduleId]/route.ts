import { buildTenantDashboardView, demoTravelStops } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

interface TravelDetailRouteContext {
  params: Promise<{ travelScheduleId: string }>;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function buildTravelDetailResponseProjection() {
  return {
    travelScheduleIdEchoed: false,
    tenantIdEchoed: false,
    artistIdEchoed: false,
    travelCityIdEchoed: false,
    availabilityWindowIdsEchoed: false,
    bookingRequestIdsEchoed: false,
    appointmentIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeLocalTravelStop(travel: unknown) {
  const {
    id: _id,
    tenantId: _tenantId,
    artistId: _artistId,
    travelCityId: _travelCityId,
    cityId: _cityId,
    availabilityWindowIds: _availabilityWindowIds,
    bookingRequestIds: _bookingRequestIds,
    appointmentIds: _appointmentIds,
    ...safeTravel
  } = travel as Record<string, unknown>;

  return {
    ...safeTravel,
    linked: {
      travelScheduleLinked: Boolean(_id),
      artistLinked: Boolean(_artistId),
      travelCityLinked: Boolean(_travelCityId ?? _cityId),
    },
    responseProjection: buildTravelDetailResponseProjection(),
  };
}

export async function GET(request: NextRequest, context: TravelDetailRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "travel:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read travel schedules." } }, { status: 403, headers: noStoreHeaders });
  }

  const { travelScheduleId } = await context.params;
  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query a travel schedule for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard travel reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
          responseProjection: buildTravelDetailResponseProjection(),
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const travel = demoTravelStops.find((row) => row.id === travelScheduleId);
    if (!travel) {
      return NextResponse.json({ ok: false, error: { code: "TRAVEL_NOT_FOUND", message: "Travel schedule was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        persistence: "local-fallback",
        travel: buildSafeLocalTravelStop(travel),
        responseProjection: buildTravelDetailResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Local fallback returns a demo travel stop only; database mode is required for live travel reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.travelSchedule.findFirst({
        where: { id: travelScheduleId, tenantId },
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
              bookingRequests: { select: { id: true, status: true, clientNameSnapshot: true } },
              appointments: { select: { id: true, status: true, startsAt: true, endsAt: true } },
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

      if (!row) return { status: "not_found" as const };

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "travel:read:detail",
          entityType: "TravelSchedule",
          entityId: row.id,
          metadata: {
            source: "dashboard-api",
            redaction: "buildTenantDashboardView",
            availabilityCount: row.availability.length,
            bookingRequestCount: row.travelCity.bookingRequests.length,
            appointmentCount: row.travelCity.appointments.length,
            redactsInternalNotes: true,
          },
        },
        select: { id: true },
      });

      return { status: "found" as const, row, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "TRAVEL_NOT_FOUND", message: "Travel schedule was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    const view = buildTenantDashboardView({
      collection: "travel",
      tenantId,
      source: "repository",
      records: [
        {
          artistLinked: Boolean(result.row.artistId),
          title: result.row.title,
          cityLinked: Boolean(result.row.travelCity.id),
          city: result.row.travelCity.city,
          region: result.row.travelCity.region,
          country: result.row.travelCity.country,
          slug: result.row.travelCity.slug,
          timezone: result.row.timezone || result.row.travelCity.timezone,
          startsAt: result.row.startsAt.toISOString(),
          endsAt: result.row.endsAt.toISOString(),
          bookingStatus: result.row.bookingStatus,
          publicNotes: result.row.publicNotes,
          publicSummary: result.row.travelCity.publicSummary,
          waitlistEnabled: result.row.travelCity.waitlistEnabled,
          latitude: toNumber(result.row.travelCity.latitude),
          longitude: toNumber(result.row.travelCity.longitude),
          studioName: result.row.studio?.name ?? null,
          studioLocation: result.row.studio ? [result.row.studio.city, result.row.studio.region].filter(Boolean).join(", ") : null,
          guestSpotUrl: result.row.guestSpotUrl,
          internalNotes: result.row.internalNotes,
          availabilityCount: result.row.availability.length,
          bookingRequestCount: result.row.travelCity.bookingRequests.length,
          appointmentCount: result.row.travelCity.appointments.length,
          availability: result.row.availability.map((window) => ({
            kind: window.kind,
            status: window.status,
            startsAt: window.startsAt.toISOString(),
            endsAt: window.endsAt.toISOString(),
            timezone: window.timezone,
            maxBookings: window.maxBookings,
            bufferBeforeMinutes: window.bufferBeforeMinutes,
            bufferAfterMinutes: window.bufferAfterMinutes,
            publicLabel: window.publicLabel,
            internalNotes: window.internalNotes ? "[redacted-dashboard-field]" : null,
            hasInternalNotes: Boolean(window.internalNotes),
          })),
          bookingRequests: result.row.travelCity.bookingRequests.map((booking) => ({
            status: booking.status,
            clientName: "[redacted-dashboard-field]",
          })),
          appointments: result.row.travelCity.appointments.map((appointment) => ({
            status: appointment.status,
            startsAt: appointment.startsAt.toISOString(),
            endsAt: appointment.endsAt.toISOString(),
          })),
        },
      ],
      redactedFields: ["internalNotes", "guestSpotUrl"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        persistence: "database",
        travel: view.records[0],
        auditLogged: true,
        auditIdEchoed: false,
        travelScheduleIdEchoed: false,
        tenantIdEchoed: false,
        artistIdEchoed: false,
        travelCityIdEchoed: false,
        availabilityWindowIdsEchoed: false,
        bookingRequestIdsEchoed: false,
        appointmentIdsEchoed: false,
        internalPersistenceIdsEchoed: false,
        responseProjection: buildTravelDetailResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Dashboard travel detail reads are tenant-scoped, internal-note redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel detail reads require the dashboard database connection." },
          responseProjection: buildTravelDetailResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_DETAIL_READ_FAILED", message: "Travel schedule could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
