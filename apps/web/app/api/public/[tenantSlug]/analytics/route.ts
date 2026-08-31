import { prisma } from "@inkroute/db";
import { inkrouteDemoTenant } from "@inkroute/config";
import type { AnalyticsEventName } from "@inkroute/analytics";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildPublicSeoAnalyticsEvent,
  persistSeoAnalyticsAttribution,
  redactAnalyticsPayload,
} from "../../../../../lib/seoAnalyticsAttribution";

const allowedEvents = new Set<AnalyticsEventName>([
  "portfolio_item_viewed",
  "booking_cta_clicked",
  "booking_request_submitted",
  "city_page_viewed",
  "style_page_viewed",
  "travel_stop_viewed",
]);

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function analyticsIdempotencyFingerprint(event: ReturnType<typeof buildPublicSeoAnalyticsEvent>) {
  return createHash("sha256").update(JSON.stringify(redactAnalyticsPayload(event.payload))).digest("hex");
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const message = error.message.toLowerCase();
  return message.includes("database") || message.includes("connect") || message.includes("prisma") || message.includes("p1001") || message.includes("p2024");
}

async function resolveAnalyticsTenant(tenantSlug: string): Promise<
  | { status: "database"; tenantId: string }
  | { status: "local-fallback"; tenantId: string }
  | { status: "not_found" }
  | { status: "unavailable"; error: unknown }
> {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } });
    if (tenant) return { status: "database", tenantId: tenant.id };
    if (process.env.NODE_ENV !== "production" && tenantSlug === inkrouteDemoTenant.slug) return { status: "local-fallback", tenantId: inkrouteDemoTenant.id };
    return { status: "not_found" };
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && tenantSlug === inkrouteDemoTenant.slug) return { status: "local-fallback", tenantId: inkrouteDemoTenant.id };
    return { status: "unavailable", error };
  }
}

function buildSafePublicAnalyticsEventResponse(event: ReturnType<typeof buildPublicSeoAnalyticsEvent>) {
  const payload = redactAnalyticsPayload(event.payload);
  return {
    name: event.name,
    payload: {
      name: payload.name,
      url: payload.url,
      createdAt: payload.createdAt,
      ...(payload.utmSource ? { utmSource: payload.utmSource } : {}),
      ...(payload.utmMedium ? { utmMedium: payload.utmMedium } : {}),
      ...(payload.utmCampaign ? { utmCampaign: payload.utmCampaign } : {}),
      ...(payload.city ? { city: payload.city } : {}),
      ...(payload.style ? { style: payload.style } : {}),
    },
    responseProjection: {
      tenantIdEchoed: false,
      bookingRequestIdEchoed: false,
      portfolioItemIdEchoed: false,
      rawAttributionIdsEchoed: false,
    },
  };
}

export async function POST(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  const tenant = await resolveAnalyticsTenant(tenantSlug);
  if (tenant.status === "not_found") {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Tenant analytics scope was not found." } }, { status: 404, headers: noStoreHeaders });
  }
  if (tenant.status === "unavailable") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Production SEO analytics ingestion requires durable tenant-scoped AnalyticsEvent and Campaign persistence; local preview acceptance is disabled.",
          gapIds: ["GAP-074", "GAP-078"],
        },
        productionBoundary: {
          previewAnalyticsAcceptanceDisabled: true,
          durableAnalyticsPersistenceRequired: true,
          providerSearchConsoleImportRequired: false,
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = stringValue(body.name) as AnalyticsEventName | undefined;
  if (!name || !allowedEvents.has(name)) {
    return NextResponse.json({ ok: false, error: { code: "INVALID_EVENT", message: "Unsupported SEO analytics event." } }, { status: 400, headers: noStoreHeaders });
  }

  const portfolioItemId = stringValue(body.portfolioItemId);
  const city = stringValue(body.city);
  const style = stringValue(body.style);
  const bookingRequestId = stringValue(body.bookingRequestId);
  const url = stringValue(body.url) ?? request.headers.get("referer") ?? `https://inkroute.example/${tenantSlug}`;
  const event = buildPublicSeoAnalyticsEvent({
    tenantId: tenant.tenantId,
    name,
    url,
    ...(portfolioItemId ? { portfolioItemId } : {}),
    ...(city ? { city } : {}),
    ...(style ? { style } : {}),
    ...(bookingRequestId ? { bookingRequestId } : {}),
  });
  const idempotencyKey = request.headers.get("idempotency-key") ?? `seo-analytics:${analyticsIdempotencyFingerprint(event)}`;

  if (tenant.status === "database") {
    try {
      await persistSeoAnalyticsAttribution(prisma, { event, idempotencyKey });
      return NextResponse.json(
        {
          ok: true,
          status: "database_persisted",
          event: buildSafePublicAnalyticsEventResponse(event),
          idempotency: {
            recorded: true,
            keyEchoed: false,
            generatedFallbackUsed: !request.headers.get("idempotency-key"),
          },
          persistence: {
            analyticsEvent: true,
            campaign: Boolean(event.payload.campaign),
            providerSearchConsoleImported: false,
          },
          responseProjection: {
            tenantIdEchoed: false,
            bookingRequestIdEchoed: false,
            portfolioItemIdEchoed: false,
            rawAttributionIdsEchoed: false,
            rawIdempotencyKeyEchoed: false,
          },
          gapIds: ["GAP-074"],
          boundary: "SEO analytics ingestion stores redacted tenant-scoped AnalyticsEvent/Campaign rows; Search Console import, click-through proof, booking attribution integration, and CI evidence remain gated.",
        },
        { status: 202, headers: noStoreHeaders },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "ANALYTICS_PERSISTENCE_FAILED", message: "SEO analytics event could not be persisted." },
            gapIds: ["GAP-074", "GAP-078"],
          },
          { status: 500, headers: noStoreHeaders },
        );
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      status: "accepted_without_provider_persistence",
      event: buildSafePublicAnalyticsEventResponse(event),
      idempotency: {
        recorded: false,
        keyEchoed: false,
        generatedFallbackUsed: !request.headers.get("idempotency-key"),
      },
      responseProjection: {
        tenantIdEchoed: false,
        bookingRequestIdEchoed: false,
        portfolioItemIdEchoed: false,
        rawAttributionIdsEchoed: false,
        rawIdempotencyKeyEchoed: false,
      },
      gapIds: ["GAP-074"],
      boundary: "SEO analytics ingestion normalizes and redacts public attribution events; durable database persistence was unavailable, so this non-production response is local-preview only.",
    },
    { status: 202, headers: noStoreHeaders },
  );
}
