import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { travelScheduleInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function hashIdempotencySubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultTravelScheduleId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("travelScheduleId" in result)) {
    return null;
  }

  const value = (result as { travelScheduleId?: unknown }).travelScheduleId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "travel:write");
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 403;
    const code = status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN";
    return NextResponse.json(
      { ok: false, error: { code, message: "Actor is not allowed to create travel schedules." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create travel schedules for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Travel schedule body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = travelScheduleInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Travel schedule payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `travel-schedule-create:${tenantId}:${hashIdempotencySubject(
      `${input.artistId}:${input.travelCityId}:${input.title}:${input.startsAt}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_TRAVEL_SCHEDULE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production travel schedule creation requires DB-backed dashboard auth, tenant-scoped TravelSchedule persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
          },
          productionBoundary: { localTravelScheduleMutationFallbackDisabled: true },
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
          message: "Travel schedule creation requires database-backed dashboard auth so TravelSchedule and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const guestSpotUrl = normalizeOptionalText(input.guestSpotUrl);
    const publicNotes = normalizeOptionalText(input.publicNotes);
    const internalNotes = normalizeOptionalText(input.internalNotes);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-travel-schedule-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-travel-schedule-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/travel/schedules",
            action: "create_travel_schedule",
            scheduleHash: hashIdempotencySubject(`${input.artistId}:${input.travelCityId}:${input.title}:${input.startsAt}`),
            rawNotesStoredInResult: false,
            publicCacheRevalidated: false,
            notificationFanoutQueued: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/travel/schedules",
            action: "create_travel_schedule",
            replayObserved: true,
            scheduleHash: hashIdempotencySubject(`${input.artistId}:${input.travelCityId}:${input.title}:${input.startsAt}`),
            rawNotesStoredInResult: false,
            publicCacheRevalidated: false,
            notificationFanoutQueued: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayTravelScheduleId = idempotency.status === "completed" ? resultTravelScheduleId(idempotency.result) : null;
      if (replayTravelScheduleId) {
        const travelSchedule = await tx.travelSchedule.findFirst({
          where: { id: replayTravelScheduleId, tenantId },
          select: {
            id: true,
            tenantId: true,
            artistId: true,
            travelCityId: true,
            studioId: true,
            title: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            bookingStatus: true,
            guestSpotUrl: true,
            publicNotes: true,
            createdAt: true,
          },
        });

        if (travelSchedule) {
          return { status: "replayed" as const, travelSchedule, idempotency };
        }
      }

      const artist = await tx.artist.findFirst({ where: { id: input.artistId, tenantId }, select: { id: true } });
      if (!artist) {
        return { status: "artist_not_found" as const };
      }

      const travelCity = await tx.travelCity.findFirst({ where: { id: input.travelCityId, tenantId }, select: { id: true } });
      if (!travelCity) {
        return { status: "travel_city_not_found" as const };
      }

      if (input.studioId !== undefined) {
        const studio = await tx.studio.findFirst({ where: { id: input.studioId, tenantId }, select: { id: true } });
        if (!studio) {
          return { status: "studio_not_found" as const };
        }
      }

      const travelSchedule = await tx.travelSchedule.create({
        data: {
          tenantId,
          artistId: input.artistId,
          travelCityId: input.travelCityId,
          ...(input.studioId !== undefined ? { studioId: input.studioId } : {}),
          title: input.title.trim(),
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
          timezone: input.timezone,
          bookingStatus: input.bookingStatus,
          ...(guestSpotUrl !== undefined ? { guestSpotUrl } : {}),
          ...(publicNotes !== undefined ? { publicNotes } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        },
        select: {
          id: true,
          tenantId: true,
          artistId: true,
          travelCityId: true,
          studioId: true,
          title: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          bookingStatus: true,
          guestSpotUrl: true,
          publicNotes: true,
          createdAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "travel.schedule.create",
          entityType: "TravelSchedule",
          entityId: travelSchedule.id,
          metadata: {
            source: "dashboard-api",
            artistId: travelSchedule.artistId,
            travelCityId: travelSchedule.travelCityId,
            bookingStatus: travelSchedule.bookingStatus,
            hasInternalNotes: internalNotes !== undefined,
            idempotencyKeyId: idempotency.id,
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-travel-schedule-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            travelScheduleId: travelSchedule.id,
            auditId: audit.id,
            created: true,
            rawNotesStoredInResult: false,
            publicCacheRevalidated: false,
            notificationFanoutQueued: false,
          }),
        },
      });

      return { status: "created" as const, travelSchedule, audit, idempotency };
    });

    if (result.status === "artist_not_found" || result.status === "travel_city_not_found" || result.status === "studio_not_found") {
      return NextResponse.json(
        { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Travel schedule artist, city, and studio records must exist for this tenant." } },
        { status: 404, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        travelSchedule: {
          ...result.travelSchedule,
          startsAt: result.travelSchedule.startsAt.toISOString(),
          endsAt: result.travelSchedule.endsAt.toISOString(),
          createdAt: result.travelSchedule.createdAt.toISOString(),
        },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
        boundary: "Dashboard travel schedule creation is tenant-scoped, no-store, idempotency-backed, and audited; public cache/SEO/notification fanout and integration tests remain evidence-gated.",
      },
      { status: result.status === "created" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel schedule creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_SCHEDULE_CREATE_FAILED", message: "Travel schedule could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}

