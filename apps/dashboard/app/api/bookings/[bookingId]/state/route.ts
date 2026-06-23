import {
  buildDashboardMutationPlan,
  createBookingTransitionPlan,
  type BookingLifecycleAction,
  type DashboardMutationAction,
} from "@inkroute/booking";
import { prisma } from "@inkroute/db";
import type { BookingStatus } from "@inkroute/types";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../../dashboardAuth";

interface BookingStateRouteContext {
  params: Promise<{ bookingId: string }>;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

const allowedActions = new Set<BookingLifecycleAction>([
  "request_more_info",
  "accept",
  "decline",
  "request_deposit",
  "record_deposit_paid",
  "schedule",
  "request_reschedule",
  "cancel",
  "complete",
  "mark_no_show",
  "archive",
]);

function normalizeAction(value: unknown): BookingLifecycleAction | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return allowedActions.has(normalized as BookingLifecycleAction) ? (normalized as BookingLifecycleAction) : null;
}

function normalizeNote(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2000) : undefined;
}

function normalizeIdempotencyKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 180) : undefined;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function toDashboardMutationAction(action: BookingLifecycleAction): DashboardMutationAction {
  switch (action) {
    case "accept":
    case "decline":
    case "complete":
      return action;
    case "record_deposit_paid":
      return "mark_deposit_paid";
    case "schedule":
      return "confirm_appointment";
    case "request_deposit":
      return "create_deposit_session";
    case "request_more_info":
    case "request_reschedule":
    case "cancel":
    case "mark_no_show":
    case "archive":
    default:
      return "request_changes";
  }
}

export async function POST(request: NextRequest, context: BookingStateRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "booking:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to mutate bookings." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Booking state body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const action = normalizeAction(input.action);
  if (!action) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "Booking state action is missing or unsupported." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const { bookingId } = await context.params;
  const tenantId = typeof input.tenantId === "string" && input.tenantId.trim() ? input.tenantId.trim() : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot mutate a booking for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          bookingId,
          action,
          error: {
            code: "PROVIDER_BOOKING_STATE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production booking lifecycle mutations require DB-backed actor resolution plus BookingStateEvent and AuditLog persistence; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          },
          productionBoundary: { localBookingStateMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        bookingId,
        action,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Booking lifecycle mutations require database-backed dashboard auth so BookingStateEvent and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-037"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey) ?? `booking-state:${tenantId}:${bookingId}:${action}`;
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findFirst({
        where: { id: bookingId, tenantId },
        select: { id: true, status: true, assignedToUserId: true },
      });

      if (!booking) {
        return { status: "not_found" as const };
      }

      const existingIdempotency = await tx.idempotencyKey.findUnique({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-booking-state", key: idempotencyKey } },
        select: { id: true, key: true, status: true, result: true },
      });
      if (existingIdempotency?.status === "completed" && existingIdempotency.result) {
        return { status: "replayed" as const, idempotency: existingIdempotency };
      }

      const reason = normalizeNote(input.note);
      const dashboardMutationPlan = buildDashboardMutationPlan({
        tenantId,
        actorId: actor.actorUserId,
        actorType: actor.role === "admin" ? "admin" : "artist",
        action: toDashboardMutationAction(action),
        bookingRequestId: booking.id,
        currentStatus: booking.status as BookingStatus,
        occurredAt: new Date().toISOString(),
        idempotencyKey,
      });
      const transitionPlanInput = {
        tenantId,
        bookingRequestId: booking.id,
        from: booking.status as BookingStatus,
        action,
        actorId: actor.actorUserId,
        actorType: actor.role === "admin" ? "admin" : "artist",
        occurredAt: new Date().toISOString(),
        ...(reason ? { reason } : {}),
      } as const;
      (transitionPlanInput as typeof transitionPlanInput & { idempotencyKey: string }).idempotencyKey = idempotencyKey;
      const plan = createBookingTransitionPlan(transitionPlanInput as Parameters<typeof createBookingTransitionPlan>[0]);

      if (!plan.canCommit || !plan.transition) {
        return { status: "invalid_transition" as const, plan, dashboardMutationPlan };
      }

      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-booking-state", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-booking-state",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/bookings/[bookingId]/state",
            bookingId,
            action,
            fromStatus: booking.status,
            actorRole: actor.role,
            rawPayloadStored: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/bookings/[bookingId]/state",
            bookingId,
            action,
            fromStatus: booking.status,
            actorRole: actor.role,
            replayObserved: true,
            rawPayloadStored: false,
          }),
        },
        select: { id: true, key: true },
      });

      const updated = await tx.bookingRequest.update({
        where: { id: booking.id },
        data: {
          status: plan.transition.to,
          ...(typeof input.assignedToUserId === "string" && input.assignedToUserId.trim() ? { assignedToUserId: input.assignedToUserId.trim() } : {}),
        },
        select: { id: true, status: true, updatedAt: true },
      });

      const event = await tx.bookingStateEvent.create({
        data: {
          tenantId,
          bookingRequestId: booking.id,
          actorUserId: actor.actorUserId,
          type: plan.transition.eventType,
          fromStatus: booking.status,
          toStatus: plan.transition.to,
          note: normalizeNote(input.note),
          metadata: {
            source: "dashboard-api",
            action,
            actorRole: actor.role,
            dashboardMutationPlan,
            idempotencyKey,
            idempotencyKeyId: idempotency.id,
          },
        },
        select: { id: true, type: true, createdAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: `booking.${action}`,
          entityType: "BookingRequest",
          entityId: booking.id,
          metadata: {
            source: "dashboard-api",
            fromStatus: booking.status,
            toStatus: plan.transition.to,
            eventId: event.id,
            actorRole: actor.role,
            dashboardMutationAuditAction: dashboardMutationPlan.auditAction,
            dashboardMutationProviderBoundary: dashboardMutationPlan.providerBoundary,
            idempotencyKey,
            idempotencyKeyId: idempotency.id,
            assignedToUserChanged: typeof input.assignedToUserId === "string" && input.assignedToUserId.trim() !== booking.assignedToUserId,
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-booking-state", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            bookingId: booking.id,
            action,
            fromStatus: booking.status,
            toStatus: plan.transition.to,
            eventId: event.id,
            auditId: audit.id,
            rawPayloadStored: false,
          }),
        },
        select: { id: true },
      });

      return { status: "persisted" as const, plan, dashboardMutationPlan, booking: updated, event, audit, idempotency };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    if (result.status === "invalid_transition") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TRANSITION", message: result.plan.reason }, plan: result.plan },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "replayed") {
      return NextResponse.json(
        {
          ok: true,
          source: actor.source,
          tenantId,
          bookingId,
          replayed: true,
          idempotencyKeyId: result.idempotency.id,
          result: result.idempotency.result,
          gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          boundary: "Booking lifecycle mutation replay returned the previously persisted idempotency result without duplicating BookingStateEvent or AuditLog rows.",
        },
        { headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        booking: result.booking,
        event: result.event,
        auditId: result.audit.id,
        idempotencyKeyId: result.idempotency.id,
        dashboardMutationPlan: result.dashboardMutationPlan,
        transition: result.plan.transition,
        gapIds: ["GAP-007", "GAP-037", "GAP-038"],
        boundary: "Booking lifecycle mutation persisted in one tenant-scoped transaction with IdempotencyKey, BookingStateEvent, and AuditLog rows.",
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
          bookingId,
          action,
          error: { code: "DATABASE_UNAVAILABLE", message: "Booking state mutation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "BOOKING_STATE_MUTATION_FAILED", message: "Booking state could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
