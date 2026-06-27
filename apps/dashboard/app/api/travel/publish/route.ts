import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildTravelPublishMutationPlan, type TravelPublishMutationAction } from "@inkroute/calendar";
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
        plan,
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
        { ok: false, error: { code: "INVALID_TRAVEL_WINDOW", message: "Travel publish requires valid startsAt and endsAt instants." }, plan, gapIds: ["GAP-060"] },
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
              stopId: stop.id,
              artistId: stop.artistId,
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
            travelScheduleId: resultString(idempotency.result, "travelScheduleId"),
            travelCityId: resultString(idempotency.result, "travelCityId"),
            auditId: resultString(idempotency.result, "auditId"),
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
              idempotencyKey,
              idempotencyKeyId: idempotency.id,
              requestHash,
              stopId: stop.id,
              revalidationTags: plan.revalidationTags,
              notificationJobCount: plan.notificationJobCount,
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
              travelCityId: city.id,
              travelScheduleId: schedule.id,
              auditId: audit.id,
              requestHash,
              providerEffectsExecuted: false,
              cacheRevalidated: false,
            },
          },
        });

        return { status: "persisted" as const, idempotency, travelCityId: city.id, travelScheduleId: schedule.id, bookingStatus: schedule.bookingStatus, auditId: audit.id };
      });

      if (result.status === "artist_not_found") {
        return NextResponse.json(
          { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Travel publish artist must exist for this tenant." }, plan, gapIds: ["GAP-060"] },
          { status: 404, headers: noStoreHeaders },
        );
      }
      if (result.status === "idempotency_conflict") {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different travel publish payload." },
            idempotencyKeyId: result.idempotency.id,
            plan,
            gapIds: ["GAP-060"],
            boundary: "Travel publish idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
          },
          { status: 409, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          status: result.status === "replayed" ? "database-replayed" : "database-persisted",
          travelCityId: result.travelCityId,
          travelScheduleId: result.travelScheduleId,
          auditId: result.auditId,
          idempotencyKeyId: result.idempotency.id,
          idempotencyReplay: result.status === "replayed",
          plan,
          readiness: dashboardTravelPublishContract.readiness,
          gapIds: ["GAP-060"],
          boundary: "Travel publish now persists TravelCity/TravelSchedule plus AuditLog/IdempotencyKey metadata with request-hash replay protection; cache revalidation, notification provider queues, sync transports, rollback provider tests, and dashboard-to-public E2E proof remain evidence-gated.",
        },
        { status: result.status === "replayed" ? 200 : 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          { ok: false, error: { code: "TRAVEL_PUBLISH_PERSISTENCE_FAILED", message: "Travel publish mutation could not be persisted." }, plan, gapIds: ["GAP-060"] },
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
      plan,
      readiness: dashboardTravelPublishContract.readiness,
      gapIds: ["GAP-060"],
    },
    { status: 202, headers: noStoreHeaders },
  );
}
