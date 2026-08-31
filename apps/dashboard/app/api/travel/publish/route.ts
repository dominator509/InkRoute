import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildTravelPublishMutationPlan,
  type TravelPublishMutationAction,
  type TravelPublishMutationPlan,
} from "@inkroute/calendar";
import { demoTravelStops } from "@inkroute/config";
import { prisma } from "@inkroute/db";
import type { TravelStop } from "@inkroute/types";

import { dashboardTravelPublishContract } from "../../../../lib/travelPublish";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

const supportedActions = new Set<TravelPublishMutationAction>(dashboardTravelPublishContract.supportedActions);

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "travel-city";
}

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hashTravelPublishSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resultString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  return typeof result[key] === "string" ? result[key] : null;
}

function buildSafeTravelPublishPlanResponse(plan: TravelPublishMutationPlan) {
  return {
    status: plan.status,
    action: plan.action,
    requiresTransaction: plan.requiresTransaction,
    revalidationTagCount: plan.revalidationTags.length,
    notificationJobCount: plan.notificationJobCount,
    writeModels: plan.writes.map((write) => write.model),
    requiredControls: plan.requiredControls,
    rollbackStepCount: plan.rollbackPlan.length,
    blockers: plan.blockers,
    idempotencyKeyPresent: Boolean(plan.idempotencyKey),
    rawIdempotencyKeyEchoed: false,
    rawStopPayloadEchoed: false,
    rawPreviousStopPayloadEchoed: false,
    rawWritePayloadsEchoed: false,
    rawWaitlistClientIdsEchoed: false,
    rawRevalidationTagsEchoed: false,
    rawRollbackReasonEchoed: false,
    rawActorIdEchoed: false,
  };
}

function buildTravelPublishResponseProjection() {
  return {
    travelPublishResponseAllowlisted: true,
    auditIdEchoed: false,
    idempotencyKeyIdEchoed: false,
    rawIdempotencyKeyEchoed: false,
    travelCityIdEchoed: false,
    travelScheduleIdEchoed: false,
    rawPlanPayloadEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeTravelPublishResponse(
  result: { status: "persisted" | "replayed" },
  plan: TravelPublishMutationPlan,
) {
  return {
    ok: true,
    status: result.status === "replayed" ? "database-replayed" : "database-persisted",
    idempotencyReplay: result.status === "replayed",
    responseProjection: buildTravelPublishResponseProjection(),
    plan: buildSafeTravelPublishPlanResponse(plan),
    readiness: dashboardTravelPublishContract.readiness,
    gapIds: ["GAP-060"],
    boundary: "Travel publish persists TravelCity/TravelSchedule plus AuditLog/IdempotencyKey metadata with request-hash replay protection; response receipts do not echo audit IDs, idempotency-key IDs, raw plan payloads, travel city IDs, travel schedule IDs, or other internal persistence IDs, while cache revalidation, notification provider queues, sync transports, rollback provider tests, and dashboard-to-public E2E proof remain evidence-gated.",
  };
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "travel:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to publish travel updates." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot publish travel for another tenant." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const action = String(body?.action ?? "");
  if (!supportedActions.has(action as TravelPublishMutationAction)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNSUPPORTED_TRAVEL_PUBLISH_ACTION", message: "Travel publish action is not supported." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production" && actor.source === "local-fallback") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TRAVEL_PUBLISH_REPOSITORY_NOT_CONFIGURED",
          message: "Production travel publish requires durable repository execution, cache revalidation, provider rollback handling, and transport evidence; demo-backed mutation planning is disabled.",
          gapIds: ["GAP-060"],
        },
        productionBoundary: {
          demoTravelPublishPlanDisabled: true,
          requiresDurableTravelRepository: true,
          requiresProviderRollbackEvidence: true,
          requiresDashboardToPublicE2eEvidence: true,
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const stop = {
    ...demoTravelStops[0],
    ...(typeof body?.stop === "object" && body.stop !== null ? body.stop as Record<string, unknown> : {}),
    tenantId,
  } as TravelStop;
  const previousStop = typeof body?.previousStop === "object" && body.previousStop !== null
    ? { ...stop, ...(body.previousStop as Record<string, unknown>), tenantId } as TravelStop
    : undefined;
  const changedFieldNames = Array.isArray(body?.changedFieldNames) ? body.changedFieldNames.map(String) : undefined;

  const plan = buildTravelPublishMutationPlan({
    tenantId,
    artistId: String(body?.artistId ?? stop.artistId),
    actorId: actor.actorUserId,
    action: action as TravelPublishMutationAction,
    stop,
    previousStop,
    idempotencyKey: typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined,
    consentedWaitlistClientIds: Array.isArray(body?.consentedWaitlistClientIds)
      ? body.consentedWaitlistClientIds.map(String)
      : [],
    changedFieldNames,
    providerActionsSucceeded: body?.providerActionsSucceeded !== false,
    rollbackReason: typeof body?.rollbackReason === "string" ? body.rollbackReason : undefined,
  });

  if (plan.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "TRAVEL_PUBLISH_BLOCKED", message: "Travel publish mutation is not safe to execute." },
        plan: buildSafeTravelPublishPlanResponse(plan),
        readiness: dashboardTravelPublishContract.readiness,
        gapIds: ["GAP-060"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  if (actor.source !== "local-fallback") {
    const startsAt = parseDate(stop.startsAt);
    const endsAt = parseDate(stop.endsAt);
    if (!startsAt || !endsAt || startsAt >= endsAt) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_TRAVEL_WINDOW", message: "Travel publish requires valid startsAt and endsAt instants." }, plan: buildSafeTravelPublishPlanResponse(plan), gapIds: ["GAP-060"] },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey : `travel-publish:${tenantId}:${action}:${stop.id}:${startsAt.toISOString()}`;
    const requestHash = hashTravelPublishSubject(
      JSON.stringify({
        tenantId,
        action,
        artistId: stop.artistId,
        stopId: stop.id,
        city: stop.city,
        region: stop.region,
        country: stop.country,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: stop.timezone,
        bookingStatus: stop.bookingStatus,
        changedFieldNames: changedFieldNames ?? [],
      }),
    );
    const citySlug = slugify(`${stop.city}-${stop.region}-${stop.country}`);
    try {
      const result = await prisma.$transaction(async (tx) => {
        const artist = await tx.artist.findFirst({ where: { id: stop.artistId, tenantId }, select: { id: true } });
        if (!artist) return { status: "artist_not_found" as const };

        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId, scope: "travel.publish", key: idempotencyKey } },
          create: {
            tenantId,
            scope: "travel.publish",
            key: idempotencyKey,
            status: "pending",
            requestHash,
            metadata: {
              action,
              travelStopMatched: true,
              artistMatched: true,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
              citySlug,
              providerEffectsExecuted: false,
              cacheRevalidated: false,
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
            travelCityPersisted: resultString(idempotency.result, "travelCityPersisted") === "true",
            travelSchedulePersisted: resultString(idempotency.result, "travelSchedulePersisted") === "true",
            auditLogged: resultString(idempotency.result, "auditLogged") === "true",
            bookingStatus: resultString(idempotency.result, "bookingStatus"),
          };
        }

        const city = await tx.travelCity.upsert({
          where: { tenantId_slug: { tenantId, slug: citySlug } },
          create: {
            tenantId,
            slug: citySlug,
            city: stop.city,
            region: stop.region,
            country: stop.country,
            timezone: stop.timezone,
            publicSummary: stop.publicNotes,
            waitlistEnabled: stop.bookingStatus !== "closed",
          },
          update: {
            city: stop.city,
            region: stop.region,
            country: stop.country,
            timezone: stop.timezone,
            publicSummary: stop.publicNotes,
            waitlistEnabled: stop.bookingStatus !== "closed",
          },
          select: { id: true },
        });

        const existingSchedule = await tx.travelSchedule.findFirst({
          where: { tenantId, artistId: stop.artistId, travelCityId: city.id, startsAt },
          select: { id: true },
        });
        const scheduleData = {
          tenantId,
          artistId: stop.artistId,
          travelCityId: city.id,
          title: `${stop.city} guest spot`,
          startsAt,
          endsAt,
          timezone: stop.timezone,
          bookingStatus: action === "unpublish" ? "closed" : stop.bookingStatus,
          ...(action === "unpublish" ? { publicNotes: "Travel stop unpublished from dashboard." } : stop.publicNotes ? { publicNotes: stop.publicNotes } : {}),
          internalNotes: `Travel publish ${action} via dashboard route; provider/cache effects deferred.`,
        };
        const schedule = existingSchedule
          ? await tx.travelSchedule.update({ where: { id: existingSchedule.id }, data: scheduleData, select: { id: true, bookingStatus: true } })
          : await tx.travelSchedule.create({ data: scheduleData, select: { id: true, bookingStatus: true } });

        const audit = await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: actor.actorUserId,
            action: `travel.publish.${action}`,
            entityType: "TravelSchedule",
            entityId: schedule.id,
            metadata: {
              source: "dashboard-travel-publish-route",
              idempotencyPersisted: true,
              requestHashPersisted: true,
              stopMatched: true,
              revalidationTagCount: plan.revalidationTags.length,
              notificationJobCount: plan.notificationJobCount,
              rawIdempotencyKeyStored: false,
              rawRequestHashStored: false,
              rawRevalidationTagsStored: false,
              internalPersistenceIdsStored: false,
              providerEffectsExecuted: false,
              cacheRevalidated: false,
            },
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId, scope: "travel.publish", key: idempotencyKey } },
          data: {
            status: "completed",
            result: {
              travelCityPersisted: true,
              travelSchedulePersisted: true,
              auditLogged: true,
              requestHashPersisted: true,
              rawRequestHashStored: false,
              bookingStatus: schedule.bookingStatus,
              providerEffectsExecuted: false,
              cacheRevalidated: false,
              internalPersistenceIdsStored: false,
            },
          },
        });

        return {
          status: "persisted" as const,
          idempotency,
          travelCityPersisted: Boolean(city.id),
          travelSchedulePersisted: Boolean(schedule.id),
          auditLogged: Boolean(audit.id),
          bookingStatus: schedule.bookingStatus,
        };
      });

      if (result.status === "artist_not_found") {
        return NextResponse.json(
          { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Travel publish artist must exist for this tenant." }, plan: buildSafeTravelPublishPlanResponse(plan), gapIds: ["GAP-060"] },
          { status: 404, headers: noStoreHeaders },
        );
      }
      if (result.status === "idempotency_conflict") {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different travel publish payload." },
            responseProjection: {
              travelPublishIdempotencyConflictResponseAllowlisted: true,
              idempotencyKeyIdEchoed: false,
              rawIdempotencyKeyEchoed: false,
            },
            plan: buildSafeTravelPublishPlanResponse(plan),
            gapIds: ["GAP-060"],
            boundary: "Travel publish idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
          },
          { status: 409, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        buildSafeTravelPublishResponse(result, plan),
        { status: result.status === "replayed" ? 200 : 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          { ok: false, error: { code: "TRAVEL_PUBLISH_PERSISTENCE_FAILED", message: "Travel publish mutation could not be persisted." }, plan: buildSafeTravelPublishPlanResponse(plan), gapIds: ["GAP-060"] },
          { status: 500, headers: noStoreHeaders },
        );
      }
    }
  }

  return NextResponse.json(
    {
      ok: false,
      status: "repository-required",
      message: "Travel publish plan is valid, but durable repository, revalidation, sync, and notification transports must execute after commit.",
      plan: buildSafeTravelPublishPlanResponse(plan),
      readiness: dashboardTravelPublishContract.readiness,
      gapIds: ["GAP-060"],
    },
    { status: 202, headers: noStoreHeaders },
  );
}
