import { createBookingTransitionPlan, type BookingLifecycleAction } from "@inkroute/booking";
import { prisma } from "@inkroute/db";
import type { BookingStatus } from "@inkroute/types";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../../dashboardAuth";

interface BookingStateRouteContext {
  params: Promise<{ bookingId: string }>;
}

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

export async function POST(request: NextRequest, context: BookingStateRouteContext) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "booking:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to mutate bookings." } }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Booking state body must be valid JSON." } }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const action = normalizeAction(input.action);
  if (!action) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_ACTION", message: "Booking state action is missing or unsupported." } },
      { status: 400 },
    );
  }

  const { bookingId } = await context.params;
  const tenantId = typeof input.tenantId === "string" && input.tenantId.trim() ? input.tenantId.trim() : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot mutate a booking for another tenant." } }, { status: 403 });
  }

  if (actor.source === "local-fallback") {
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
      { status: 409 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.bookingRequest.findFirst({
        where: { id: bookingId, tenantId },
        select: { id: true, status: true, assignedToUserId: true },
      });

      if (!booking) {
        return { status: "not_found" as const };
      }

      const plan = createBookingTransitionPlan({
        tenantId,
        bookingRequestId: booking.id,
        from: booking.status as BookingStatus,
        action,
        actorId: actor.actorUserId,
        actorType: actor.role === "admin" ? "admin" : "artist",
        occurredAt: new Date().toISOString(),
        reason: normalizeNote(input.note),
        idempotencyKey: normalizeIdempotencyKey(input.idempotencyKey),
      });

      if (!plan.canCommit || !plan.transition) {
        return { status: "invalid_transition" as const, plan };
      }

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
            idempotencyKey: normalizeIdempotencyKey(input.idempotencyKey) ?? null,
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
            assignedToUserChanged: typeof input.assignedToUserId === "string" && input.assignedToUserId.trim() !== booking.assignedToUserId,
          },
        },
        select: { id: true, createdAt: true },
      });

      return { status: "persisted" as const, plan, booking: updated, event, audit };
    });

    if (result.status === "not_found") {
      return NextResponse.json({ ok: false, error: { code: "BOOKING_NOT_FOUND", message: "Booking was not found for this tenant." } }, { status: 404 });
    }

    if (result.status === "invalid_transition") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TRANSITION", message: result.plan.reason }, plan: result.plan },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      source: actor.source,
      tenantId,
      booking: result.booking,
      event: result.event,
      auditId: result.audit.id,
      transition: result.plan.transition,
      gapIds: ["GAP-007", "GAP-037"],
      boundary: "Booking lifecycle mutation persisted in one tenant-scoped transaction with BookingStateEvent and AuditLog rows.",
    });
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
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "BOOKING_STATE_MUTATION_FAILED", message: "Booking state could not be persisted." } }, { status: 500 });
  }
}
