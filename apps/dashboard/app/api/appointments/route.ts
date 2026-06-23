import { createHash } from "node:crypto";
import { buildDashboardMutationPlan, createBookingTransitionPlan } from "@inkroute/booking";
import { prisma } from "@inkroute/db";
import type { BookingStatus } from "@inkroute/types";
import { appointmentInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function invalidJsonResponse() {
  return NextResponse.json(
    { ok: false, error: { code: "INVALID_JSON", message: "Appointment body must be valid JSON." } },
    { status: 400, headers: noStoreHeaders },
  );
}

function missingBookingResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "BOOKING_REQUEST_REQUIRED",
        message: "Dashboard appointment creation must be attached to a booking request so scheduling state, audit, and lifecycle intents are traceable.",
        gapIds: ["GAP-037", "GAP-038"],
      },
    },
    { status: 400, headers: noStoreHeaders },
  );
}

function appointmentLifecycleIntents(input: { depositRequiredCents?: number; startsAt: string; endsAt: string; timezone: string }) {
  return {
    deposit: input.depositRequiredCents !== undefined
      ? {
          status: "deferred",
          reason: "Deposit session/provider collection is handled by the payment workflow after Appointment persistence.",
          amountCents: input.depositRequiredCents,
          gapIds: ["GAP-038", "GAP-060"],
        }
      : {
          status: "not_requested",
          reason: "No depositRequiredCents was supplied for this appointment.",
        },
    notification: {
      status: "deferred",
      reason: "Client/staff notification dispatch is queued by the notification scheduler/worker after Appointment persistence.",
      gapIds: ["GAP-010", "GAP-038", "GAP-065"],
    },
    calendar: {
      status: "deferred",
      reason: "Calendar provider event insertion requires the calendar connection/sync workflow after Appointment persistence.",
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
      gapIds: ["GAP-038", "GAP-057", "GAP-058"],
    },
  };
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function resultAppointmentId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("appointmentId" in result)) {
    return null;
  }

  const value = (result as { appointmentId?: unknown }).appointmentId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "booking:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create appointments." } },
      { status, headers: noStoreHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonResponse();
  }

  const parsed = appointmentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Appointment payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const tenantId = actor.tenantId;
  if (!input.bookingRequestId) {
    return missingBookingResponse();
  }

  const lifecycleIntents = appointmentLifecycleIntents({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: input.timezone,
    ...(input.depositRequiredCents !== undefined ? { depositRequiredCents: input.depositRequiredCents } : {}),
  });
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `appointment-create:${tenantId}:${hashIdempotencySubject(
      `${input.bookingRequestId}:${input.artistId}:${input.clientId}:${input.startsAt}:${input.endsAt}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_APPOINTMENT_PERSISTENCE_NOT_CONFIGURED",
            message: "Production appointment creation requires DB-backed dashboard auth, Appointment persistence, BookingStateEvent, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          },
          productionBoundary: { localAppointmentMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Appointment creation requires database-backed dashboard auth so Appointment, BookingStateEvent, and AuditLog rows can be persisted.",
        },
        lifecycleIntents,
        gapIds: ["GAP-007", "GAP-037", "GAP-038"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-appointment-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-appointment-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/appointments",
            action: "create_appointment",
            bookingRequestId: input.bookingRequestId,
            appointmentHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.artistId}:${input.clientId}:${input.startsAt}:${input.endsAt}`,
            ),
            lifecycleIntents,
            calendarProviderInserted: false,
            depositSessionCreated: false,
            notificationDispatched: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/appointments",
            action: "create_appointment",
            bookingRequestId: input.bookingRequestId,
            replayObserved: true,
            appointmentHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.artistId}:${input.clientId}:${input.startsAt}:${input.endsAt}`,
            ),
            lifecycleIntents,
            calendarProviderInserted: false,
            depositSessionCreated: false,
            notificationDispatched: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const booking = await tx.bookingRequest.findFirst({
        where: { id: input.bookingRequestId, tenantId },
        select: {
          id: true,
          status: true,
          artistId: true,
          clientId: true,
          travelCityId: true,
          appointment: { select: { id: true } },
        },
      });

      if (!booking) {
        return { status: "booking_not_found" as const };
      }

      const replayAppointmentId = idempotency.status === "completed" ? resultAppointmentId(idempotency.result) : null;
      if (replayAppointmentId) {
        const appointment = await tx.appointment.findFirst({
          where: { id: replayAppointmentId, tenantId, bookingRequestId: booking.id },
          select: {
            id: true,
            status: true,
            title: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            artistId: true,
            clientId: true,
            bookingRequestId: true,
            travelCityId: true,
            studioId: true,
            depositRequiredCents: true,
            createdAt: true,
          },
        });
        const replayBooking = await tx.bookingRequest.findFirst({
          where: { id: booking.id, tenantId },
          select: { id: true, status: true, updatedAt: true },
        });
        const event = await tx.bookingStateEvent.findFirst({
          where: { tenantId, bookingRequestId: booking.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, type: true, createdAt: true },
        });

        if (appointment && replayBooking) {
          return {
            status: "replayed" as const,
            appointment,
            booking: replayBooking,
            event,
            lifecycleIntents,
            dashboardMutationPlan: {
              replayed: true,
              providerBoundary: "Appointment idempotency replay; provider calendar, deposit, and notification execution remain deferred workflow intents.",
            },
            idempotency,
          };
        }
      }

      if (booking.appointment) {
        return { status: "appointment_exists" as const, appointmentId: booking.appointment.id };
      }

      if (booking.artistId !== input.artistId || booking.clientId !== input.clientId) {
        return { status: "booking_scope_mismatch" as const };
      }

      const travelCityId = input.travelCityId ?? booking.travelCityId ?? undefined;
      if (input.travelCityId !== undefined && booking.travelCityId !== null && input.travelCityId !== booking.travelCityId) {
        return { status: "travel_scope_mismatch" as const };
      }

      const artist = await tx.artist.findFirst({ where: { id: input.artistId, tenantId }, select: { id: true } });
      if (!artist) {
        return { status: "artist_not_found" as const };
      }

      const client = await tx.client.findFirst({ where: { id: input.clientId, tenantId }, select: { id: true } });
      if (!client) {
        return { status: "client_not_found" as const };
      }

      if (travelCityId !== undefined) {
        const travelCity = await tx.travelCity.findFirst({ where: { id: travelCityId, tenantId }, select: { id: true } });
        if (!travelCity) {
          return { status: "travel_city_not_found" as const };
        }
      }

      if (input.studioId !== undefined) {
        const studio = await tx.studio.findFirst({ where: { id: input.studioId, tenantId }, select: { id: true } });
        if (!studio) {
          return { status: "studio_not_found" as const };
        }
      }

      const now = new Date().toISOString();
      const dashboardMutationPlan = buildDashboardMutationPlan({
        tenantId,
        actorId: actor.actorUserId,
        actorType: actor.role === "admin" ? "admin" : "artist",
        action: "confirm_appointment",
        bookingRequestId: booking.id,
        currentStatus: booking.status as BookingStatus,
        occurredAt: now,
      });
      const transitionPlan = createBookingTransitionPlan({
        tenantId,
        bookingRequestId: booking.id,
        from: booking.status as BookingStatus,
        action: "schedule",
        actorId: actor.actorUserId,
        actorType: actor.role === "admin" ? "admin" : "artist",
        occurredAt: now,
        reason: "Appointment created from dashboard API.",
      });

      if (!transitionPlan.canCommit || !transitionPlan.transition) {
        return { status: "invalid_transition" as const, transitionPlan, dashboardMutationPlan };
      }

      const appointment = await tx.appointment.create({
        data: {
          tenantId,
          artistId: input.artistId,
          clientId: input.clientId,
          bookingRequestId: booking.id,
          ...(travelCityId !== undefined ? { travelCityId } : {}),
          ...(input.studioId !== undefined ? { studioId: input.studioId } : {}),
          title: input.title,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          timezone: input.timezone,
          ...(input.locationLabel !== undefined ? { locationLabel: input.locationLabel } : {}),
          ...(input.depositRequiredCents !== undefined ? { depositRequiredCents: input.depositRequiredCents } : {}),
          ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
          ...(input.clientPrepNotes !== undefined ? { clientPrepNotes: input.clientPrepNotes } : {}),
        },
        select: {
          id: true,
          status: true,
          title: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          artistId: true,
          clientId: true,
          bookingRequestId: true,
          travelCityId: true,
          studioId: true,
          depositRequiredCents: true,
          createdAt: true,
        },
      });

      const updatedBooking = await tx.bookingRequest.update({
        where: { id: booking.id },
        data: { status: transitionPlan.transition.to },
        select: { id: true, status: true, updatedAt: true },
      });

      const event = await tx.bookingStateEvent.create({
        data: {
          tenantId,
          bookingRequestId: booking.id,
          actorUserId: actor.actorUserId,
          type: transitionPlan.transition.eventType,
          fromStatus: booking.status,
          toStatus: transitionPlan.transition.to,
          note: "Appointment created from dashboard API.",
          metadata: {
            source: "dashboard-api",
            action: "create_appointment",
            appointmentId: appointment.id,
            idempotencyKeyId: idempotency.id,
            lifecycleIntents,
            dashboardMutationPlan,
          },
        },
        select: { id: true, type: true, createdAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "appointment.create",
          entityType: "Appointment",
          entityId: appointment.id,
          metadata: {
            source: "dashboard-api",
            bookingRequestId: booking.id,
            fromStatus: booking.status,
            toStatus: transitionPlan.transition.to,
            eventId: event.id,
            lifecycleIntents,
            dashboardMutationAuditAction: dashboardMutationPlan.auditAction,
            dashboardMutationProviderBoundary: dashboardMutationPlan.providerBoundary,
            idempotencyKeyId: idempotency.id,
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-appointment-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            appointmentId: appointment.id,
            bookingRequestId: booking.id,
            eventId: event.id,
            auditId: audit.id,
            lifecycleIntents,
            calendarProviderInserted: false,
            depositSessionCreated: false,
            notificationDispatched: false,
          }),
        },
      });

      return { status: "persisted" as const, appointment, booking: updatedBooking, event, audit, lifecycleIntents, dashboardMutationPlan, idempotency };
    });

    if (result.status === "booking_not_found") {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "appointment_exists") {
      return NextResponse.json(
        { ok: false, error: { code: "APPOINTMENT_ALREADY_EXISTS", message: "This booking already has an appointment.", appointmentId: result.appointmentId } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "booking_scope_mismatch" || result.status === "travel_scope_mismatch") {
      return NextResponse.json(
        { ok: false, error: { code: "BOOKING_APPOINTMENT_SCOPE_MISMATCH", message: "Appointment artist, client, or travel city does not match the tenant-scoped booking request." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "artist_not_found" || result.status === "client_not_found" || result.status === "travel_city_not_found" || result.status === "studio_not_found") {
      return NextResponse.json(
        { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Appointment related records must exist for this tenant before scheduling." } },
        { status: 404, headers: noStoreHeaders },
      );
    }

    if (result.status === "invalid_transition") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TRANSITION", message: result.transitionPlan.reason }, plan: result.transitionPlan },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        appointment: result.appointment,
        booking: result.booking,
        event: result.event,
        auditId: result.status === "persisted" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        lifecycleIntents: result.lifecycleIntents,
        dashboardMutationPlan: result.dashboardMutationPlan,
        gapIds: ["GAP-007", "GAP-037", "GAP-038"],
        boundary: "Appointment creation is idempotency-backed and persisted in one tenant-scoped transaction with BookingStateEvent and AuditLog rows; provider calendar, deposit, and notification execution remain deferred workflow intents.",
      },
      { status: result.status === "persisted" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Appointment creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-038"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: { code: "APPOINTMENT_ALREADY_EXISTS", message: "This booking already has an appointment." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, error: { code: "APPOINTMENT_CREATE_FAILED", message: "Appointment could not be persisted." } },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
