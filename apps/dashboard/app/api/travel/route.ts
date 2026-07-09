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

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function buildSafeTravelReadRecord(record: Record<string, unknown>) {
  const {
    id: _id,
    tenantId: _tenantId,
    artistId: _artistId,
    cityId: _cityId,
    travelCityId: _travelCityId,
    studioId: _studioId,
    bookingRequestId: _bookingRequestId,
    bookingRequestIds: _bookingRequestIds,
    appointmentId: _appointmentId,
    appointmentIds: _appointmentIds,
    availabilityWindowId: _availabilityWindowId,
    availabilityWindowIds: _availabilityWindowIds,
    availability,
    ...safeRecord
  } = record;

  return {
    ...safeRecord,
    artistLinked: Boolean(_artistId),
    travelCityLinked: Boolean(_cityId ?? _travelCityId),
    availability: Array.isArray(availability)
      ? availability.map((window) => {
          if (typeof window !== "object" || window === null) return window;
          const { id: _windowId, ...safeWindow } = window as Record<string, unknown>;
          return {
            ...safeWindow,
            responseProjection: { availabilityWindowIdEchoed: false },
          };
        })
      : availability,
    responseProjection: {
      travelScheduleIdEchoed: false,
      tenantIdEchoed: false,
      artistIdEchoed: false,
      travelCityIdEchoed: false,
      availabilityWindowIdsEchoed: false,
      bookingRequestIdsEchoed: false,
      appointmentIdsEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

function buildTravelListResponseProjection() {
  return {
    tenantIdEchoed: false,
    travelScheduleIdsEchoed: false,
    artistIdsEchoed: false,
    travelCityIdsEchoed: false,
    availabilityWindowIdsEchoed: false,
    bookingRequestIdsEchoed: false,
    appointmentIdsEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "travel:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read travel schedules." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query travel schedules for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard travel reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildTravelListResponseProjection(),
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantIdEchoed: false,
        persistence: "local-fallback",
        count: demoTravelStops.length,
        travel: demoTravelStops.slice(0, limit).map((stop) => buildSafeTravelReadRecord(stop as Record<string, unknown>)),
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildTravelListResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Local fallback returns demo travel stops only; database mode is required for live travel reads.",
      },
      { headers: noStoreHeaders },
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
        title: row.title,
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
      })),
      redactedFields: ["internalNotes", "guestSpotUrl"],
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        persistence: "database",
        count: view.records.length,
        travel: view.records.map((record) => buildSafeTravelReadRecord(record as Record<string, unknown>)),
        auditLogged: true,
        auditIdEchoed: false,
        internalPersistenceIdsEchoed: false,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildTravelListResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        boundary: "Dashboard travel list reads are tenant-scoped, internal-note redacted, no-store, and audited.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel list reads require the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildTravelListResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-046", "GAP-047"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_LIST_READ_FAILED", message: "Travel schedules could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
