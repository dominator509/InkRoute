import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildAvailabilityPersistencePlan, type AvailabilityPersistencePlan } from "@inkroute/calendar";
import { prisma } from "@inkroute/db";

import { dashboardAvailabilityPersistenceContract } from "../../../../lib/availabilityPersistence";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  return typeof result[key] === "string" ? result[key] : null;
}

function buildSafeAvailabilityHoldPlanResponse(plan: AvailabilityPersistencePlan) {
  return {
    status: plan.status,
    action: plan.action,
    requiresTransaction: plan.requiresTransaction,
    requiredControls: plan.requiredControls,
    blockers: plan.blockers,
    writeModels: plan.writes.map((write) => write.model),
    writePayloadsEchoed: false,
    idempotencyKeyPresent: Boolean(plan.idempotencyKey),
    rawIdempotencyKeyEchoed: false,
    bookingRequestIdEchoed: false,
    availabilityWindowIdEchoed: false,
    holdIdEchoed: false,
    actorIdEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildCalendarHoldResponseProjection() {
  return {
    calendarHoldResponseAllowlisted: true,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawPlanPayloadEchoed: false,
    rawHoldRecordEchoed: false,
    availabilityWindowIdEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeCalendarHoldResponse(
  result: { status: "created" | "replayed" },
  plan: AvailabilityPersistencePlan,
) {
  return {
    ok: true,
    status: result.status === "replayed" ? "database-replayed" : "database-persisted",
    idempotencyReplay: result.status === "replayed",
    responseProjection: buildCalendarHoldResponseProjection(),
    plan: buildSafeAvailabilityHoldPlanResponse(plan),
    readiness: dashboardAvailabilityPersistenceContract.readiness,
    gapIds: ["GAP-056"],
    boundary: "Slot hold is tenant-scoped, idempotency-backed, and persisted as an AvailabilityWindow admin hold with AuditLog metadata; response receipts do not echo audit IDs, idempotency-key IDs, raw plan payloads, raw hold records, or availability-window IDs, while seeded race-condition and cross-tenant integration proof remains evidence-gated.",
  };
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to mutate availability." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create a slot hold for another tenant." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const artistId = String(body?.artistId ?? "");
  const timezone = String(body?.timezone ?? "");
  const bookingRequestId = typeof body?.bookingRequestId === "string" ? body.bookingRequestId : undefined;
  const availabilityWindowId = typeof body?.availabilityWindowId === "string" ? body.availabilityWindowId : undefined;
  const rawIdempotencyKey = request.headers.get("idempotency-key") ?? (typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined);
  const plan = buildAvailabilityPersistencePlan({
    tenantId,
    artistId,
    action: "create_slot_hold",
    startsAt: String(body?.startsAt ?? ""),
    endsAt: String(body?.endsAt ?? ""),
    timezone,
    actorId: actor.actorUserId,
    ...(bookingRequestId ? { bookingRequestId } : {}),
    ...(availabilityWindowId ? { availabilityWindowId } : {}),
    ...(rawIdempotencyKey ? { idempotencyKey: rawIdempotencyKey } : {}),
    conflictIds: Array.isArray(body?.conflictIds) ? body.conflictIds.map(String) : [],
    existingHoldIds: Array.isArray(body?.existingHoldIds) ? body.existingHoldIds.map(String) : [],
  });

  if (plan.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "AVAILABILITY_HOLD_BLOCKED", message: "Slot hold is not safe to persist." },
        plan: buildSafeAvailabilityHoldPlanResponse(plan),
        readiness: dashboardAvailabilityPersistenceContract.readiness,
        gapIds: ["GAP-056"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  const startsAt = parseDate(body?.startsAt);
  const endsAt = parseDate(body?.endsAt);
  if (!startsAt || !endsAt || startsAt >= endsAt) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INVALID_HOLD_WINDOW", message: "Slot holds require valid startsAt and endsAt instants." },
        plan: buildSafeAvailabilityHoldPlanResponse(plan),
        readiness: dashboardAvailabilityPersistenceContract.readiness,
        gapIds: ["GAP-056"],
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const requestHash = hashIdempotencySubject(
    JSON.stringify({
      tenantId,
      artistId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timezone,
      bookingRequestId: bookingRequestId ?? null,
      availabilityWindowId: availabilityWindowId ?? null,
    }),
  );
  const idempotencyKey = rawIdempotencyKey ?? `calendar-hold:${tenantId}:${artistId}:${requestHash}`;

  if (actor.source === "local-fallback" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        status: "repository-required",
        error: {
          code: "PROVIDER_CALENDAR_HOLD_PERSISTENCE_NOT_CONFIGURED",
          message: "Production slot holds require DB-backed actor resolution, tenant-scoped persistence, idempotency proof, and audit logs; local fallback writes are disabled.",
        },
        productionBoundary: { localCalendarHoldFallbackDisabled: true },
        plan: buildSafeAvailabilityHoldPlanResponse(plan),
        readiness: dashboardAvailabilityPersistenceContract.readiness,
        gapIds: ["GAP-056"],
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (actor.source !== "local-fallback") {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const artist = await tx.artist.findFirst({ where: { id: artistId, tenantId }, select: { id: true, displayName: true } });
        if (!artist) return { status: "artist_not_found" as const };

        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId, scope: "availability.slot_hold", key: idempotencyKey } },
          create: {
            tenantId,
            scope: "availability.slot_hold",
            key: idempotencyKey,
            status: "pending",
            requestHash,
            metadata: {
              action: "create_slot_hold",
              artistMatched: true,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              timezone,
              bookingRequestMatched: Boolean(bookingRequestId),
              availabilityWindowMatched: Boolean(availabilityWindowId),
              requestHashPersisted: true,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
            },
          },
          update: {},
          select: { id: true, status: true, requestHash: true, result: true },
        });

        if (idempotency.requestHash !== requestHash) {
          return { status: "idempotency_conflict" as const, idempotency };
        }

        if (idempotency.status === "completed") {
          return {
            status: "replayed" as const,
            idempotency,
            availabilityWindowPersisted: resultString(idempotency.result, "availabilityWindowPersisted") === "true",
            auditLogged: resultString(idempotency.result, "auditLogged") === "true",
          };
        }

        const overlapping = await tx.availabilityWindow.findFirst({
          where: {
            tenantId,
            artistId: artist.id,
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
            status: { in: ["open", "waitlist", "full"] },
          },
          select: { id: true },
        });
        if (overlapping) return { status: "conflict" as const, conflictId: overlapping.id };

        const hold = await tx.availabilityWindow.create({
          data: {
            tenantId,
            artistId: artist.id,
            kind: "admin_hold",
            status: "full",
            startsAt,
            endsAt,
            timezone,
            publicLabel: "Dashboard slot hold",
            internalNotes: "Slot hold created by dashboard actor; raw actor id stored only on AuditLog.",
          },
          select: { id: true, artistId: true, startsAt: true, endsAt: true, timezone: true, status: true, kind: true },
        });

        const audit = await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: actor.actorUserId,
            action: "availability.slot_hold.create",
            entityType: "AvailabilityWindow",
            entityId: hold.id,
            metadata: {
              source: "dashboard-calendar-holds-route",
              idempotencyPersisted: true,
              requestHashPersisted: true,
              bookingRequestMatched: Boolean(bookingRequestId),
              availabilityWindowMatched: Boolean(availabilityWindowId),
              rawIdempotencyKeyStored: false,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
            },
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId, scope: "availability.slot_hold", key: idempotencyKey } },
          data: {
            status: "completed",
            result: {
              availabilityWindowPersisted: "true",
              auditLogged: "true",
              internalPersistenceIdsStored: "false",
              requestHashPersisted: "true",
              rawRequestHashStored: "false",
            },
          },
        });

        return { status: "created" as const, idempotency, availabilityWindowPersisted: true, auditLogged: Boolean(audit.id) };
      });

      if (result.status === "artist_not_found") {
        return NextResponse.json(
          { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Slot hold artist must exist for this tenant." }, gapIds: ["GAP-056"] },
          { status: 404, headers: noStoreHeaders },
        );
      }
      if (result.status === "conflict") {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "AVAILABILITY_CONFLICT", message: "Slot hold overlaps an existing availability window." },
            responseProjection: {
              calendarHoldConflictResponseAllowlisted: true,
              conflictingAvailabilityWindowIdEchoed: false,
              tenantIdEchoed: false,
              internalPersistenceIdsEchoed: false,
            },
            gapIds: ["GAP-056"],
          },
          { status: 409, headers: noStoreHeaders },
        );
      }
      if (result.status === "idempotency_conflict") {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different slot-hold payload." },
            responseProjection: {
              calendarHoldIdempotencyConflictResponseAllowlisted: true,
              idempotencyKeyIdEchoed: false,
              rawIdempotencyKeyEchoed: false,
              tenantIdEchoed: false,
              internalPersistenceIdsEchoed: false,
            },
            gapIds: ["GAP-056"],
            boundary: "Calendar hold idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
          },
          { status: 409, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        buildSafeCalendarHoldResponse(result, plan),
        { status: result.status === "replayed" ? 200 : 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          { ok: false, error: { code: "AVAILABILITY_HOLD_PERSISTENCE_FAILED", message: "Slot hold could not be persisted." }, gapIds: ["GAP-056"] },
          { status: 500, headers: noStoreHeaders },
        );
      }
    }
  }

  return NextResponse.json(
    {
      ok: false,
      status: "repository-required",
      message: "Slot hold plan is valid, but durable availability repositories must execute the transaction.",
      plan: buildSafeAvailabilityHoldPlanResponse(plan),
      readiness: dashboardAvailabilityPersistenceContract.readiness,
      gapIds: ["GAP-056"],
    },
    { status: 202, headers: noStoreHeaders },
  );
}
