import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { availabilityWindowInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;
const availabilityTransactionOptions = {
  isolationLevel: "Serializable",
} as const;

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

function resultAvailabilityWindowId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("availabilityWindowId" in result)) {
    return null;
  }

  const value = (result as { availabilityWindowId?: unknown }).availabilityWindowId;
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
      { ok: false, error: { code, message: "Actor is not allowed to create availability windows." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create availability windows for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Availability body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = availabilityWindowInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Availability payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `availability-create:${tenantId}:${hashIdempotencySubject(
      `${input.artistId}:${input.travelCityId ?? "studio"}:${input.travelScheduleId ?? "standalone"}:${input.startsAt}`,
    )}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_AVAILABILITY_PERSISTENCE_NOT_CONFIGURED",
            message: "Production availability creation requires DB-backed dashboard auth, tenant-scoped AvailabilityWindow persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-009", "GAP-037", "GAP-038", "GAP-056"],
          },
          productionBoundary: { localAvailabilityMutationFallbackDisabled: true },
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
          message: "Availability creation requires database-backed dashboard auth so AvailabilityWindow and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-009", "GAP-037", "GAP-038", "GAP-056"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const publicLabel = normalizeOptionalText(input.publicLabel);
    const internalNotes = normalizeOptionalText(input.internalNotes);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-availability-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-availability-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/availability",
            action: "create_availability_window",
            availabilityHash: hashIdempotencySubject(
              `${input.artistId}:${input.travelCityId ?? "studio"}:${input.travelScheduleId ?? "standalone"}:${input.startsAt}`,
            ),
            rawNotesStoredInResult: false,
            persistedOverlapGuardRequired: true,
            concurrentHoldProtectionConfigured: true,
            concurrentHoldProtectionVerified: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/availability",
            action: "create_availability_window",
            replayObserved: true,
            availabilityHash: hashIdempotencySubject(
              `${input.artistId}:${input.travelCityId ?? "studio"}:${input.travelScheduleId ?? "standalone"}:${input.startsAt}`,
            ),
            rawNotesStoredInResult: false,
            persistedOverlapGuardRequired: true,
            concurrentHoldProtectionConfigured: true,
            concurrentHoldProtectionVerified: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayAvailabilityWindowId = idempotency.status === "completed" ? resultAvailabilityWindowId(idempotency.result) : null;
      if (replayAvailabilityWindowId) {
        const availabilityWindow = await tx.availabilityWindow.findFirst({
          where: { id: replayAvailabilityWindowId, tenantId },
          select: {
            id: true,
            tenantId: true,
            artistId: true,
            travelCityId: true,
            travelScheduleId: true,
            kind: true,
            status: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            maxBookings: true,
            bufferBeforeMinutes: true,
            bufferAfterMinutes: true,
            publicLabel: true,
            createdAt: true,
          },
        });

        if (availabilityWindow) {
          return { status: "replayed" as const, availabilityWindow, idempotency };
        }
      }

      const artist = await tx.artist.findFirst({ where: { id: input.artistId, tenantId }, select: { id: true } });
      if (!artist) {
        return { status: "artist_not_found" as const };
      }

      if (input.travelCityId !== undefined) {
        const travelCity = await tx.travelCity.findFirst({ where: { id: input.travelCityId, tenantId }, select: { id: true } });
        if (!travelCity) {
          return { status: "travel_city_not_found" as const };
        }
      }

      if (input.travelScheduleId !== undefined) {
        const travelSchedule = await tx.travelSchedule.findFirst({
          where: { id: input.travelScheduleId, tenantId },
          select: { id: true, artistId: true, travelCityId: true },
        });
        if (!travelSchedule) {
          return { status: "travel_schedule_not_found" as const };
        }
        if (travelSchedule.artistId !== input.artistId) {
          return { status: "schedule_scope_mismatch" as const };
        }
        if (input.travelCityId !== undefined && travelSchedule.travelCityId !== input.travelCityId) {
          return { status: "schedule_scope_mismatch" as const };
        }
      }

      const conflictingAvailabilityWindow = await tx.availabilityWindow.findFirst({
        where: {
          tenantId,
          artistId: input.artistId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true, startsAt: true, endsAt: true, status: true },
      });
      if (conflictingAvailabilityWindow) {
        return { status: "availability_conflict" as const, conflictingAvailabilityWindow, idempotency };
      }

      const availabilityWindow = await tx.availabilityWindow.create({
        data: {
          tenantId,
          artistId: input.artistId,
          ...(input.travelCityId !== undefined ? { travelCityId: input.travelCityId } : {}),
          ...(input.travelScheduleId !== undefined ? { travelScheduleId: input.travelScheduleId } : {}),
          kind: input.kind,
          status: input.status,
          startsAt,
          endsAt,
          timezone: input.timezone,
          ...(input.maxBookings !== undefined ? { maxBookings: input.maxBookings } : {}),
          bufferBeforeMinutes: input.bufferBeforeMinutes,
          bufferAfterMinutes: input.bufferAfterMinutes,
          ...(publicLabel !== undefined ? { publicLabel } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        },
        select: {
          id: true,
          tenantId: true,
          artistId: true,
          travelCityId: true,
          travelScheduleId: true,
          kind: true,
          status: true,
          startsAt: true,
          endsAt: true,
          timezone: true,
          maxBookings: true,
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true,
          publicLabel: true,
          createdAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "availability.create",
          entityType: "AvailabilityWindow",
          entityId: availabilityWindow.id,
          metadata: {
            source: "dashboard-api",
            artistId: availabilityWindow.artistId,
            travelCityId: availabilityWindow.travelCityId,
            travelScheduleId: availabilityWindow.travelScheduleId,
            kind: availabilityWindow.kind,
            status: availabilityWindow.status,
            conflictBoundary: "Tenant-scoped persisted overlap guard ran before AvailabilityWindow create; concurrent hold race proof remains governed by GAP-056 evidence gates.",
            concurrentHoldProtectionConfigured: true,
            hasInternalNotes: internalNotes !== undefined,
            idempotencyKeyId: idempotency.id,
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-availability-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            availabilityWindowId: availabilityWindow.id,
            auditId: audit.id,
            created: true,
            rawNotesStoredInResult: false,
            persistedOverlapGuardApplied: true,
            concurrentHoldProtectionConfigured: true,
            concurrentHoldProtectionVerified: false,
          }),
        },
      });

      return { status: "created" as const, availabilityWindow, audit, idempotency };
    }, availabilityTransactionOptions);

    if (result.status === "artist_not_found" || result.status === "travel_city_not_found" || result.status === "travel_schedule_not_found") {
      return NextResponse.json(
        { ok: false, error: { code: "RELATED_RECORD_NOT_FOUND", message: "Availability artist, city, and schedule records must exist for this tenant." } },
        { status: 404, headers: noStoreHeaders },
      );
    }

    if (result.status === "schedule_scope_mismatch") {
      return NextResponse.json(
        { ok: false, error: { code: "AVAILABILITY_SCOPE_MISMATCH", message: "Availability artist and city must match the selected travel schedule." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    if (result.status === "availability_conflict") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "AVAILABILITY_CONFLICT",
            message: "Availability window overlaps an existing tenant-scoped artist availability window.",
          },
          conflict: {
            availabilityWindowId: result.conflictingAvailabilityWindow.id,
            startsAt: result.conflictingAvailabilityWindow.startsAt.toISOString(),
            endsAt: result.conflictingAvailabilityWindow.endsAt.toISOString(),
            status: result.conflictingAvailabilityWindow.status,
          },
          idempotencyKeyId: result.idempotency.id,
          persistedOverlapGuardApplied: true,
          concurrentHoldProtectionConfigured: true,
          concurrentHoldProtectionVerified: false,
          gapIds: ["GAP-056"],
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        availabilityWindow: {
          ...result.availabilityWindow,
          startsAt: result.availabilityWindow.startsAt.toISOString(),
          endsAt: result.availabilityWindow.endsAt.toISOString(),
          createdAt: result.availabilityWindow.createdAt.toISOString(),
        },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        persistedOverlapGuardApplied: result.status === "created",
        concurrentHoldProtectionConfigured: true,
        concurrentHoldProtectionVerified: false,
        gapIds: ["GAP-007", "GAP-009", "GAP-037", "GAP-038", "GAP-056"],
        boundary: "Dashboard availability creation is tenant-scoped, no-store, idempotency-backed, audited, and protected by a persisted overlap guard inside a serializable transaction; concurrent hold race proof and seeded integration tests remain evidence-gated.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Availability creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-009", "GAP-037", "GAP-038", "GAP-056"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "AVAILABILITY_CREATE_FAILED", message: "Availability window could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
