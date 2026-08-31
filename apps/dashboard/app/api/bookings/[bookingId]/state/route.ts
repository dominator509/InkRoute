import {
  buildDashboardMutationPlan,
  createBookingTransitionPlan,
  type BookingLifecycleAction,
  type DashboardMutationAction,
} from "@inkroute/booking";
import { prisma } from "@inkroute/db";
import type { BookingStatus } from "@inkroute/types";
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../../dashboardAuth";

interface BookingStateRouteContext {
  params: Promise<{ bookingId: string }>;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function selectorHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildBookingStateIdempotencyKey(parts: readonly string[]): string {
  return `booking-state:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
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

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function replayResultString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function summarizeBookingStateReplayResult(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      replayResultShape: "unavailable",
      rawResultEchoed: false,
      redactedFields: ["result.rawPayload", "result.note", "result.metadata"],
    };
  }

  const record = value as Record<string, unknown>;
  return {
    replayResultShape: "booking-state-summary",
    action: replayResultString(record, "action"),
    fromStatus: replayResultString(record, "fromStatus"),
    toStatus: replayResultString(record, "toStatus"),
    bookingStateEventPersisted: record.bookingStateEventPersisted === true,
    auditLogged: record.auditLogged === true,
    internalPersistenceIdsStored: record.internalPersistenceIdsStored === false ? false : null,
    rawResultEchoed: false,
    redactedFields: ["result.rawPayload", "result.note", "result.metadata", "result.eventId", "result.auditId"],
  };
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

function buildSafeBookingLifecycleReceipt(booking: { status: string; updatedAt: Date }) {
  return {
    bookingUpdated: true,
    status: booking.status,
    updatedAt: toIsoString(booking.updatedAt),
    bookingRequestIdEchoed: false,
  };
}

function buildBookingLifecycleResponseProjection() {
  return {
    bookingLifecycleResponseAllowlisted: true,
    tenantIdEchoed: false,
    bookingRequestIdEchoed: false,
    eventIdEchoed: false,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyResultEchoed: false,
    internalPersistenceIdsEchoed: false,
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

function buildSafeBookingTransitionReceipt(plan: ReturnType<typeof createBookingTransitionPlan>) {
  return {
    transitionApplied: Boolean(plan.transition),
    fromStatus: plan.transition?.from ?? null,
    toStatus: plan.transition?.to ?? null,
    eventType: plan.transition?.eventType ?? null,
    rawTransitionEchoed: false,
  };
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
          action,
          error: {
            code: "PROVIDER_BOOKING_STATE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production booking lifecycle mutations require DB-backed actor resolution plus BookingStateEvent and AuditLog persistence; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildBookingLifecycleResponseProjection(),
          productionBoundary: { localBookingStateMutationFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        action,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Booking lifecycle mutations require database-backed dashboard auth so BookingStateEvent and AuditLog rows can be persisted.",
        },
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildBookingLifecycleResponseProjection(),
        gapIds: ["GAP-007", "GAP-037"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey) ?? buildBookingStateIdempotencyKey([tenantId, bookingId, action]);
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
            bookingIdHash: selectorHash(bookingId),
            rawBookingIdStored: false,
            action,
            fromStatus: booking.status,
            actorRole: actor.role,
            rawPayloadStored: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/bookings/[bookingId]/state",
            bookingIdHash: selectorHash(bookingId),
            rawBookingIdStored: false,
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
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
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
            bookingStateEventPersisted: true,
            actorRole: actor.role,
            dashboardMutationAuditAction: dashboardMutationPlan.auditAction,
            dashboardMutationProviderBoundary: dashboardMutationPlan.providerBoundary,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
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
            action,
            fromStatus: booking.status,
            toStatus: plan.transition.to,
            bookingStateEventPersisted: true,
            auditLogged: true,
            rawPayloadStored: false,
            internalPersistenceIdsStored: false,
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
        { ok: false, error: { code: "INVALID_TRANSITION", message: result.plan.reason }, plan: buildSafeBookingTransitionPlanResponse(result.plan) },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "replayed") {
      return NextResponse.json(
        {
          ok: true,
          source: actor.source,
          replayed: true,
          idempotencyRecorded: true,
          idempotencyKeyIdEchoed: false,
          replayResult: summarizeBookingStateReplayResult(result.idempotency.result),
          tenantScope: { actorTenantMatched: true, bookingTenantMatched: true },
          responseProjection: buildBookingLifecycleResponseProjection(),
          internalPersistenceIdsEchoed: false,
          gapIds: ["GAP-007", "GAP-037", "GAP-038"],
          boundary: "Booking lifecycle mutation replay returned an allowlisted idempotency summary without duplicating BookingStateEvent or AuditLog rows.",
        },
        { headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        booking: buildSafeBookingLifecycleReceipt(result.booking),
        event: buildSafeBookingStateEventReceipt(result.event),
        auditLogged: true,
        idempotencyRecorded: true,
        auditIdEchoed: false,
        idempotencyKeyIdEchoed: false,
        internalPersistenceIdsEchoed: false,
        dashboardMutationPlan: buildSafeDashboardMutationPlanResponse(result.dashboardMutationPlan),
        transition: buildSafeBookingTransitionReceipt(result.plan),
        tenantScope: { actorTenantMatched: true, bookingTenantMatched: true },
        responseProjection: buildBookingLifecycleResponseProjection(),
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
          action,
          error: { code: "DATABASE_UNAVAILABLE", message: "Booking state mutation requires the dashboard database connection." },
          tenantScope: { actorTenantMatched: true },
          responseProjection: buildBookingLifecycleResponseProjection(),
          gapIds: ["GAP-007", "GAP-037"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "BOOKING_STATE_MUTATION_FAILED", message: "Booking state could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
