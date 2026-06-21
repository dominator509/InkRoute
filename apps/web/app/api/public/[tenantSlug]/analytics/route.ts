import { NextResponse } from "next/server";
import { inkrouteDemoTenant } from "@inkroute/config";
import type { AnalyticsEventName } from "@inkroute/analytics";
import { buildPublicSeoAnalyticsEvent, redactAnalyticsPayload } from "../../../../../lib/seoAnalyticsAttribution";

const allowedEvents = new Set<AnalyticsEventName>([
  "portfolio_item_viewed",
  "booking_cta_clicked",
  "booking_request_submitted",
  "city_page_viewed",
  "style_page_viewed",
  "travel_stop_viewed",
]);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  if (tenantSlug !== inkrouteDemoTenant.slug) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "Tenant analytics scope was not found." } }, { status: 404, headers: noStoreHeaders });
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

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_SEO_ANALYTICS_NOT_CONFIGURED",
          message: "Production SEO analytics ingestion requires durable AnalyticsEvent/Campaign persistence and idempotency storage; preview-only acceptance is disabled.",
          gapIds: ["GAP-074", "GAP-078"],
        },
        productionBoundary: {
          previewAnalyticsAcceptanceDisabled: true,
          requiredBeforeEnablement: [
            "tenant-scoped AnalyticsEvent persistence",
            "Campaign and idempotency storage",
            "dashboard SEO analytics report execution",
            "Search Console import and attribution proof",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const url = stringValue(body.url) ?? request.headers.get("referer") ?? `https://inkroute.example/${tenantSlug}`;
  const event = buildPublicSeoAnalyticsEvent({
    tenantId: inkrouteDemoTenant.id,
    name,
    url,
    ...(portfolioItemId ? { portfolioItemId } : {}),
    ...(city ? { city } : {}),
    ...(style ? { style } : {}),
    ...(bookingRequestId ? { bookingRequestId } : {}),
  });
  const idempotencyKey = request.headers.get("idempotency-key") ?? `seo-analytics:${inkrouteDemoTenant.id}:${name}:${event.payload.createdAt}`;

  return NextResponse.json(
    {
      ok: true,
      status: "accepted_without_provider_persistence",
      event: { name: event.name, payload: redactAnalyticsPayload(event.payload) },
      idempotencyKey,
      gapIds: ["GAP-074"],
      boundary: "SEO analytics ingestion normalizes and redacts public attribution events; durable event/campaign/Search Console persistence remains gated.",
    },
    { status: 202, headers: noStoreHeaders },
  );
}
