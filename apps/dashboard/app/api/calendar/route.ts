import { prisma } from "@inkroute/db";
import { NextRequest, NextResponse } from "next/server";
import { dashboardAppointments, dashboardAvailabilitySlots, dashboardCalendarSyncPlans } from "../../../lib/demo";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

function redactProviderPayload(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, payload]) => [
      key,
      /token|secret|email|attendee|payload|provider|external|id/i.test(key) ? "[redacted-dashboard-field]" : payload,
    ]),
  );
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read calendar data." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot query calendar data for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_DASHBOARD_READS_NOT_CONFIGURED",
            message: "Production dashboard calendar reads require DB-backed actor resolution and tenant-scoped repository data; local fallback demo payloads are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-055", "GAP-056", "GAP-057", "GAP-058"],
          },
          productionBoundary: { localDashboardReadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "local-fallback",
        syncPlans: dashboardCalendarSyncPlans,
        appointments: dashboardAppointments.slice(0, limit),
        availabilitySlots: dashboardAvailabilitySlots.slice(0, limit),
        gapIds: ["GAP-007", "GAP-037", "GAP-055", "GAP-056", "GAP-057", "GAP-058"],
        boundary: "Local fallback returns demo calendar data only; database mode is required for live calendar reads.",
      },
      { headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [connections, events, availability] = await Promise.all([
        tx.calendarConnection.findMany({
          where: { tenantId },
          orderBy: { updatedAt: "desc" },
          take: limit,
          select: {
            id: true,
            artistId: true,
            provider: true,
            providerAccountId: true,
            displayName: true,
            syncStatus: true,
            lastSyncedAt: true,
            updatedAt: true,
          },
        }),
        tx.calendarEvent.findMany({
          where: { tenantId },
          orderBy: { startsAt: "asc" },
          take: limit,
          select: {
            id: true,
            calendarConnectionId: true,
            appointmentId: true,
            provider: true,
            externalEventId: true,
            title: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            status: true,
            rawPayload: true,
          },
        }),
        tx.availabilityWindow.findMany({
          where: { tenantId },
          orderBy: { startsAt: "asc" },
          take: limit,
          select: {
            id: true,
            artistId: true,
            travelCityId: true,
            travelScheduleId: true,
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
        }),
      ]);

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "calendar:read",
          entityType: "Calendar",
          metadata: {
            source: "dashboard-api",
            connectionCount: connections.length,
            eventCount: events.length,
            availabilityCount: availability.length,
            redactedFields: ["providerAccountId", "externalEventId", "rawPayload", "internalNotes", "encryptedAccessToken", "encryptedRefreshToken"],
          },
        },
        select: { id: true },
      });

      return { connections, events, availability, audit };
    });

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        connections: result.connections.map((connection) => ({
          id: connection.id,
          artistId: connection.artistId,
          provider: connection.provider,
          providerAccountId: connection.providerAccountId ? "[redacted-dashboard-field]" : null,
          displayName: connection.displayName,
          syncStatus: connection.syncStatus,
          lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
          updatedAt: connection.updatedAt.toISOString(),
        })),
        events: result.events.map((event) => ({
          id: event.id,
          calendarConnectionId: event.calendarConnectionId,
          appointmentId: event.appointmentId,
          provider: event.provider,
          externalEventId: event.externalEventId ? "[redacted-dashboard-field]" : null,
          title: event.title,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt.toISOString(),
          timezone: event.timezone,
          status: event.status,
          rawPayload: redactProviderPayload(event.rawPayload),
        })),
        availability: result.availability.map((window) => ({
          id: window.id,
          artistId: window.artistId,
          travelCityId: window.travelCityId,
          travelScheduleId: window.travelScheduleId,
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
        })),
        auditId: result.audit.id,
        gapIds: ["GAP-007", "GAP-037", "GAP-055", "GAP-056", "GAP-057", "GAP-058"],
        boundary: "Dashboard calendar reads are tenant-scoped, provider-secret safe, no-store, and audited; OAuth sync and provider mutations remain gated.",
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Calendar reads require the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-055", "GAP-056", "GAP-057", "GAP-058"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "CALENDAR_READ_FAILED", message: "Calendar data could not be loaded." } }, { status: 500, headers: noStoreHeaders });
  }
}
