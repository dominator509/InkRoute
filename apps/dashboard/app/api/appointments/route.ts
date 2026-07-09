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
          status: "draft_persisted_after_appointment",
          reason: "A local Deposit draft is persisted transactionally after Appointment persistence; Stripe checkout/provider collection remains payment-workflow gated.",
          amountCents: input.depositRequiredCents,
          gapIds: ["GAP-038", "GAP-060"],
        }
      : {
          status: "not_requested",
          reason: "No depositRequiredCents was supplied for this appointment.",
        },
    notification: {
      status: "queued_local_intent",
      reason: "A local NotificationJob handoff is queued transactionally after Appointment persistence; provider dispatch remains worker/provider-gated.",
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

function buildSafeBookingTransitionPlanResponse(plan: ReturnType<typeof createBookingTransitionPlan>) {
  return {
    status: plan.status,
    canCommit: plan.canCommit,
    reason: plan.reason,
    transitionPresent: Boolean(plan.transition),
    requiresAtomicTransaction: plan.requiresAtomicTransaction,
    writeModelCount: plan.writes.length,
    writeModels: plan.writes.map((write) => write.model),
    rawTransitionEchoed: false,
    rawWritePayloadsEchoed: false,
    rawTenantIdEchoed: false,
    rawBookingRequestIdEchoed: false,
    rawActorIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeDashboardMutationPlanResponse(plan: ReturnType<typeof buildDashboardMutationPlan>) {
  return {
    status: plan.status,
    action: plan.action,
    providerBoundary: plan.providerBoundary,
    requiresAudit: plan.requiresAudit,
    requiresIdempotency: plan.requiresIdempotency,
    canCommit: plan.canCommit,
    writeModels: plan.writes,
    auditAction: plan.auditAction,
    blockers: plan.blockers,
    idempotencyKeyPresent: Boolean(plan.idempotencyKey),
    rawTenantIdEchoed: false,
    rawActorIdEchoed: false,
    rawBookingRequestIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawDashboardMutationPlanEchoed: false,
  };
}

function toIsoString(value: { toISOString: () => string } | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function buildSafeAppointmentReceipt(appointment: {
  status: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  depositRequiredCents: number | null;
  createdAt: Date;
}) {
  return {
    appointmentPersisted: true,
    status: appointment.status,
    title: appointment.title,
    startsAt: toIsoString(appointment.startsAt),
    endsAt: toIsoString(appointment.endsAt),
    timezone: appointment.timezone,
    depositRequiredCents: appointment.depositRequiredCents,
    createdAt: toIsoString(appointment.createdAt),
    appointmentIdEchoed: false,
    artistIdEchoed: false,
    clientIdEchoed: false,
    bookingRequestIdEchoed: false,
    travelCityIdEchoed: false,
    studioIdEchoed: false,
  };
}

function buildAppointmentCreateResponseProjection() {
  return {
    appointmentCreateResponseAllowlisted: true,
    tenantIdEchoed: false,
    appointmentIdEchoed: false,
    artistIdEchoed: false,
    clientIdEchoed: false,
    bookingRequestIdEchoed: false,
    auditIdEchoed: false,
    depositAuditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeAppointmentBookingReceipt(booking: { status: string; updatedAt: Date }) {
  return {
    bookingUpdated: true,
    status: booking.status,
    updatedAt: toIsoString(booking.updatedAt),
    bookingRequestIdEchoed: false,
  };
}

function buildSafeBookingStateEventReceipt(event: { type: string; createdAt: Date }) {
  return {
    bookingStateEventPersisted: true,
    type: event.type,
    createdAt: toIsoString(event.createdAt),
    eventIdEchoed: false,
  };
}

function buildSafeDepositDraftReceipt(depositDraft: { amountCents: number; currency: string; status: string; createdAt: Date } | null) {
  return depositDraft
    ? {
        depositDraftPersisted: true,
        amountCents: depositDraft.amountCents,
        currency: depositDraft.currency,
        status: depositDraft.status,
        createdAt: toIsoString(depositDraft.createdAt),
        depositDraftIdEchoed: false,
      }
    : {
        depositDraftPersisted: false,
        depositDraftIdEchoed: false,
      };
}

function buildSafeNotificationJobReceipt(notificationJob: { state: string; templateKey: string; channel: string; createdAt: Date }) {
  return {
    notificationJobQueued: true,
    state: notificationJob.state,
    templateKey: notificationJob.templateKey,
    channel: notificationJob.channel,
    createdAt: toIsoString(notificationJob.createdAt),
    notificationJobIdEchoed: false,
    sourceEntityIdEchoed: false,
    actorUserIdEchoed: false,
    rawNotificationJobPayloadEchoed: false,
  };
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
          error: {
            code: "PROVIDER_APPOINTMENT_PERSISTENCE_NOT_CONFIGURED",
            message: "Production appointment creation requires DB-backed dashboard auth, Appointment persistence, BookingStateEvent, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildAppointmentCreateResponseProjection(),
          productionBoundary: { localAppointmentMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Appointment creation requires database-backed dashboard auth so Appointment, BookingStateEvent, and AuditLog rows can be persisted.",
        },
        lifecycleIntents,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildAppointmentCreateResponseProjection(),
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
            bookingRequestIdHash: hashIdempotencySubject(input.bookingRequestId),
            rawBookingRequestIdStored: false,
            appointmentHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.artistId}:${input.clientId}:${input.startsAt}:${input.endsAt}`,
            ),
            lifecycleIntents,
            calendarProviderInserted: false,
            depositDraftPlanned: input.depositRequiredCents !== undefined,
            depositSessionCreated: false,
            notificationJobPlanned: true,
            notificationProviderExecution: "deferred",
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/appointments",
            action: "create_appointment",
            bookingRequestIdHash: hashIdempotencySubject(input.bookingRequestId),
            rawBookingRequestIdStored: false,
            replayObserved: true,
            appointmentHash: hashIdempotencySubject(
              `${input.bookingRequestId}:${input.artistId}:${input.clientId}:${input.startsAt}:${input.endsAt}`,
            ),
            lifecycleIntents,
            calendarProviderInserted: false,
            depositDraftPlanned: input.depositRequiredCents !== undefined,
            depositSessionCreated: false,
            notificationJobPlanned: true,
            notificationProviderExecution: "deferred",
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

      if (idempotency.status === "completed") {
        const appointment = await tx.appointment.findFirst({
          where: {
            tenantId,
            bookingRequestId: booking.id,
            artistId: input.artistId,
            clientId: input.clientId,
            startsAt: new Date(input.startsAt),
            endsAt: new Date(input.endsAt),
            timezone: input.timezone,
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
            depositDraft: null,
            notificationJob: null,
            dashboardMutationPlan: {
              replayed: true,
              providerBoundary: "Appointment idempotency replay; provider calendar, deposit, and notification execution remain deferred after the local NotificationJob handoff intent.",
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
            appointmentPersisted: true,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
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
            bookingRequestMatched: true,
            fromStatus: booking.status,
            toStatus: transitionPlan.transition.to,
            bookingStateEventPersisted: true,
            lifecycleIntents,
            dashboardMutationAuditAction: dashboardMutationPlan.auditAction,
            dashboardMutationProviderBoundary: dashboardMutationPlan.providerBoundary,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
          },
        },
        select: { id: true, createdAt: true },
      });

      const depositDraft =
        input.depositRequiredCents !== undefined
          ? await tx.deposit.create({
              data: {
                tenantId,
                bookingRequestId: booking.id,
                appointmentId: appointment.id,
                amountCents: input.depositRequiredCents,
                currency: "usd",
                status: "pending",
                policySnapshot: {
                  source: "dashboard-api",
                  action: "appointment.create.deposit_draft",
                  providerCollection: "deferred",
                  stripeCheckoutCreated: false,
                  appointmentPersisted: true,
                  bookingRequestMatched: true,
                  idempotencyPersisted: true,
                  rawIdempotencyKeyStored: false,
                  internalPersistenceIdsStored: false,
                  gapIds: ["GAP-038", "GAP-060"],
                },
              },
              select: { id: true, amountCents: true, currency: true, status: true, createdAt: true },
            })
          : null;

      const depositAudit =
        depositDraft !== null
          ? await tx.paymentAuditLog.create({
              data: {
                tenantId,
                depositId: depositDraft.id,
                actorUserId: actor.actorUserId,
                action: "deposit:draft:create_from_appointment",
                provider: "stripe",
                metadata: {
                  source: "dashboard-api",
                  amountCents: depositDraft.amountCents,
                  currency: depositDraft.currency,
                  stripeCheckoutCreated: false,
                  providerCollection: "deferred",
                  appointmentPersisted: true,
                  bookingRequestMatched: true,
                  idempotencyPersisted: true,
                  rawIdempotencyKeyStored: false,
                  internalPersistenceIdsStored: false,
                  gapIds: ["GAP-038", "GAP-060"],
                },
              },
              select: { id: true, createdAt: true },
            })
          : null;

      const notificationJob = await tx.notificationJob.create({
        data: {
          tenantId,
          sourceAction: "appointment.create.notification",
          sourceEntityType: "Appointment",
          sourceEntityId: appointment.id,
          templateKey: "appointment_created",
          channel: "in_app",
          state: "queued",
          priority: 5,
          idempotencyKey: `${idempotencyKey}:appointment-notification`,
          actorUserId: actor.actorUserId,
          scheduledAt: new Date(now),
          availableAt: new Date(now),
          payload: {
            source: "dashboard-api",
            providerExecution: "deferred",
            appointmentIdHash: hashIdempotencySubject(appointment.id),
            bookingRequestIdHash: hashIdempotencySubject(booking.id),
            clientIdHash: hashIdempotencySubject(input.clientId),
            artistIdHash: hashIdempotencySubject(input.artistId),
            rawAppointmentIdStored: false,
            rawBookingRequestIdStored: false,
            rawClientIdStored: false,
            rawArtistIdStored: false,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            timezone: input.timezone,
            gapIds: ["GAP-010", "GAP-038", "GAP-065"],
          },
        },
        select: { id: true, state: true, templateKey: true, channel: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-appointment-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            appointmentPersisted: true,
            bookingStateEventPersisted: true,
            auditLogged: true,
            lifecycleIntents,
            depositDraftPersisted: depositDraft !== null,
            depositAuditPersisted: depositAudit !== null,
            stripeCheckoutCreated: false,
            notificationJobQueued: true,
            notificationProviderExecution: "deferred",
            calendarProviderInserted: false,
            depositSessionCreated: false,
            internalPersistenceIdsStored: false,
          }),
        },
      });

      return { status: "persisted" as const, appointment, booking: updatedBooking, event, audit, depositDraft, depositAudit, notificationJob, lifecycleIntents, dashboardMutationPlan, idempotency };
    });

    if (result.status === "booking_not_found") {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "appointment_exists") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "APPOINTMENT_ALREADY_EXISTS", message: "This booking already has an appointment." },
          responseProjection: {
            duplicateAppointmentIdEchoed: false,
            internalPersistenceIdsEchoed: false,
          },
        },
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
        { ok: false, error: { code: "INVALID_TRANSITION", message: result.transitionPlan.reason }, plan: buildSafeBookingTransitionPlanResponse(result.transitionPlan) },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        appointment: buildSafeAppointmentReceipt(result.appointment),
        booking: buildSafeAppointmentBookingReceipt(result.booking),
        event: buildSafeBookingStateEventReceipt(result.event),
        auditLogged: result.status === "persisted",
        auditIdEchoed: false,
        depositDraft: buildSafeDepositDraftReceipt(result.depositDraft),
        depositAuditLogged: result.status === "persisted" && Boolean(result.depositAudit),
        depositAuditIdEchoed: false,
        notificationJob: buildSafeNotificationJobReceipt(result.notificationJob),
        idempotencyRecorded: true,
        idempotencyKeyIdEchoed: false,
        internalPersistenceIdsEchoed: false,
        idempotencyReplay: result.status === "replayed",
        lifecycleIntents: result.lifecycleIntents,
        dashboardMutationPlan: buildSafeDashboardMutationPlanResponse(result.dashboardMutationPlan),
        tenantScope: { actorTenantMatched: true, bookingTenantMatched: true, appointmentRelatedRecordsTenantMatched: true },
        responseProjection: buildAppointmentCreateResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-038"],
        boundary: "Appointment creation is idempotency-backed and persisted in one tenant-scoped transaction with BookingStateEvent, AuditLog, local Deposit draft, PaymentAuditLog, and local NotificationJob handoff rows when requested; provider calendar, Stripe checkout, and notification execution remain deferred workflow intents.",
      },
      { status: result.status === "persisted" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          error: { code: "DATABASE_UNAVAILABLE", message: "Appointment creation requires the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildAppointmentCreateResponseProjection(),
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
