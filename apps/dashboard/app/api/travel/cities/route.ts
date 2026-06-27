import { createHash } from "node:crypto";
import { prisma } from "@inkroute/db";
import { travelCityInputSchema } from "@inkroute/validators";
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

function resultTravelCityId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("travelCityId" in result)) {
    return null;
  }

  const value = (result as { travelCityId?: unknown }).travelCityId;
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
      { ok: false, error: { code, message: "Actor is not allowed to create travel cities." } },
      { status, headers: noStoreHeaders },
    );
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create travel cities for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON", message: "Travel city body must be valid JSON." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const parsed = travelCityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Travel city payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `travel-city-create:${tenantId}:${hashIdempotencySubject(input.slug)}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_TRAVEL_CITY_PERSISTENCE_NOT_CONFIGURED",
            message: "Production travel city creation requires DB-backed dashboard auth, tenant-scoped TravelCity persistence, and AuditLog rows; local fallback mutations are disabled.",
            gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046"],
          },
          productionBoundary: { localTravelCityMutationFallbackDisabled: true },
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
          message: "Travel city creation requires database-backed dashboard auth so TravelCity and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const publicSummary = normalizeOptionalText(input.publicSummary);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-travel-city-create", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-travel-city-create",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/travel/cities",
            action: "create_travel_city",
            slugHash: hashIdempotencySubject(input.slug),
            rawLocationStoredInResult: false,
            publicCacheRevalidated: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/travel/cities",
            action: "create_travel_city",
            replayObserved: true,
            slugHash: hashIdempotencySubject(input.slug),
            rawLocationStoredInResult: false,
            publicCacheRevalidated: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayTravelCityId = idempotency.status === "completed" ? resultTravelCityId(idempotency.result) : null;
      if (replayTravelCityId) {
        const travelCity = await tx.travelCity.findFirst({
          where: { id: replayTravelCityId, tenantId },
          select: {
            id: true,
            tenantId: true,
            slug: true,
            city: true,
            region: true,
            country: true,
            timezone: true,
            latitude: true,
            longitude: true,
            publicSummary: true,
            waitlistEnabled: true,
            createdAt: true,
          },
        });

        if (travelCity) {
          return { status: "replayed" as const, travelCity, idempotency };
        }
      }

      const existing = await tx.travelCity.findUnique({
        where: { tenantId_slug: { tenantId, slug: input.slug } },
        select: { id: true },
      });
      if (existing) {
        return { status: "slug_exists" as const, travelCityId: existing.id };
      }

      const travelCity = await tx.travelCity.create({
        data: {
          tenantId,
          slug: input.slug,
          city: input.city.trim(),
          region: input.region.trim(),
          country: input.country.trim(),
          timezone: input.timezone,
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
          ...(publicSummary !== undefined ? { publicSummary } : {}),
          waitlistEnabled: input.waitlistEnabled,
        },
        select: {
          id: true,
          tenantId: true,
          slug: true,
          city: true,
          region: true,
          country: true,
          timezone: true,
          latitude: true,
          longitude: true,
          publicSummary: true,
          waitlistEnabled: true,
          createdAt: true,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "travel.city.create",
          entityType: "TravelCity",
          entityId: travelCity.id,
          metadata: {
            source: "dashboard-api",
            slug: travelCity.slug,
            waitlistEnabled: travelCity.waitlistEnabled,
            idempotencyKeyId: idempotency.id,
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-travel-city-create", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            travelCityId: travelCity.id,
            auditId: audit.id,
            created: true,
            rawLocationStoredInResult: false,
            publicCacheRevalidated: false,
          }),
        },
      });

      return { status: "created" as const, travelCity, audit, idempotency };
    });

    if (result.status === "slug_exists") {
      return NextResponse.json(
        { ok: false, error: { code: "TRAVEL_CITY_SLUG_EXISTS", message: "A travel city with this slug already exists for this tenant.", travelCityId: result.travelCityId } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        travelCity: {
          ...result.travelCity,
          latitude: result.travelCity.latitude === null ? null : Number(result.travelCity.latitude),
          longitude: result.travelCity.longitude === null ? null : Number(result.travelCity.longitude),
          createdAt: result.travelCity.createdAt.toISOString(),
        },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046"],
        boundary: "Dashboard travel city creation is tenant-scoped, no-store, idempotency-backed, and audited; public SEO/cache revalidation and integration tests remain evidence-gated.",
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
          error: { code: "DATABASE_UNAVAILABLE", message: "Travel city creation requires the dashboard database connection." },
          gapIds: ["GAP-007", "GAP-037", "GAP-038", "GAP-046"],
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json(
        { ok: false, error: { code: "TRAVEL_CITY_SLUG_EXISTS", message: "A travel city with this slug already exists for this tenant." } },
        { status: 409, headers: noStoreHeaders },
      );
    }

    return NextResponse.json({ ok: false, error: { code: "TRAVEL_CITY_CREATE_FAILED", message: "Travel city could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}

