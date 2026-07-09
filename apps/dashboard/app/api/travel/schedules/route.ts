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

function buildTravelScheduleResponseProjection() {
  return {
    travelScheduleResponseAllowlisted: true,
    travelScheduleIdEchoed: false,
    tenantIdEchoed: false,
    artistIdEchoed: false,
    travelCityIdEchoed: false,
    studioIdEchoed: false,
    auditIdEchoed: false,
    notificationJobIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeTravelScheduleResponse(result: {
  status: "created" | "replayed";
  travelSchedule: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    bookingStatus: string;
    guestSpotUrl: string | null;
    publicNotes: string | null;
    createdAt: Date;
  };
}) {
  return {
    responseProjection: buildTravelScheduleResponseProjection(),
    travelSchedule: {
      title: result.travelSchedule.title,
      startsAt: result.travelSchedule.startsAt.toISOString(),
      endsAt: result.travelSchedule.endsAt.toISOString(),
      timezone: result.travelSchedule.timezone,
      bookingStatus: result.travelSchedule.bookingStatus,
      guestSpotUrl: result.travelSchedule.guestSpotUrl,
      publicNotes: result.travelSchedule.publicNotes,
      createdAt: result.travelSchedule.createdAt.toISOString(),
    },
    persistenceReceipt: {
      travelSchedulePersisted: true,
      auditPersisted: result.status === "created",
      idempotencyPersisted: true,
      idempotencyReplay: result.status === "replayed",
      notificationJobQueued: result.status === "created",
    },
  };
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
          tenantScope: { actorTenantMatched: true },
          error: {
            code: "PROVIDER_TRAVEL_SCHEDULE_PERSISTENCE_NOT_CONFIGURED",
            message: "Production travel schedule creation requires DB-backed dashboard auth, tenant-scoped TravelSchedule persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
          },
          productionBoundary: { localTravelScheduleMutationFallbackDisabled: true },
          responseProjection: buildTravelScheduleResponseProjection(),
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        error: {
          code: "DATABASE_REQUIRED",
          message: "Travel schedule creation requires database-backed dashboard auth so TravelSchedule and AuditLog rows can be persisted.",
        },
        responseProjection: buildTravelScheduleResponseProjection(),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const guestSpotUrl = normalizeOptionalText(input.guestSpotUrl);
    const publicNotes = normalizeOptionalText(input.publicNotes);
    const internalNotes = normalizeOptionalText(input.internalNotes);
    const now = new Date();
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
            notificationFanoutQueued: true,
            notificationProviderExecution: "deferred",
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
            notificationFanoutQueued: true,
            notificationProviderExecution: "deferred",
          }),
        },
        select: { id: true, status: true, result: true },
      });
      if (idempotency.status === "completed") {
        const travelSchedule = await tx.travelSchedule.findFirst({
          where: {
            tenantId,
            artistId: input.artistId,
            travelCityId: input.travelCityId,
            title: input.title,
            startsAt: new Date(input.startsAt),
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
            artistMatched: true,
            travelCityMatched: true,
            bookingStatus: travelSchedule.bookingStatus,
            hasInternalNotes: internalNotes !== undefined,
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
          },
        },
        select: { id: true, createdAt: true },
      });

      const notificationJob = await tx.notificationJob.create({
        data: {
          tenantId,
          sourceAction: "travel.schedule.waitlist_fanout",
          templateKey: "travel_schedule_waitlist_fanout",
          channel: "in_app",
          state: "queued",
          idempotencyKey: `${idempotencyKey}:waitlist-fanout`,
          actorUserId: actor.actorUserId,
          scheduledAt: now,
          availableAt: now,
          payload: toJsonValue({
            route: "/api/travel/schedules",
            travelScheduleId: travelSchedule.id,
            travelCityId: travelSchedule.travelCityId,
            artistId: travelSchedule.artistId,
            bookingStatus: travelSchedule.bookingStatus,
            startsAt: travelSchedule.startsAt.toISOString(),
            endsAt: travelSchedule.endsAt.toISOString(),
            timezone: travelSchedule.timezone,
            providerExecution: "deferred",
            rawNotesStoredInResult: false,
            publicCacheRevalidated: false,
          }),
        },
        select: { id: true, state: true, sourceAction: true, templateKey: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-travel-schedule-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            travelSchedulePersisted: true,
            auditLogged: true,
            notificationFanoutIntentPersisted: true,
            created: true,
            rawNotesStoredInResult: false,
            publicCacheRevalidated: false,
            notificationFanoutQueued: true,
            internalPersistenceIdsStored: false,
          }),
        },
      });

      return { status: "created" as const, travelSchedule, audit, notificationJob, idempotency };
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
        tenantScope: { actorTenantMatched: true },
        persistence: "database",
        ...buildSafeTravelScheduleResponse(result),
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
        boundary: "Dashboard travel schedule creation is tenant-scoped, no-store, idempotency-backed, audited, and queues a local NotificationJob fanout intent; public cache/SEO, provider sends, worker execution, and integration tests remain evidence-gated.",
      },
      { status: result.status === "created" ? 201 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantScope: { actorTenantMatched: true },
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel schedule creation requires the dashboard database connection." },
          responseProjection: buildTravelScheduleResponseProjection(),
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046", "GAP-047"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_SCHEDULE_CREATE_FAILED", message: "Travel schedule could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}

