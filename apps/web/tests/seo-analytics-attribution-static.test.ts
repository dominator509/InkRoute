import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  attributionCookiesForUrl,
  buildPublicSeoAnalyticsEvent,
  redactAnalyticsPayload,
  seoAnalyticsArtifactPaths,
  seoAnalyticsAttributionContract,
  seoAttributionCookieNames,
} from "../lib/seoAnalyticsAttribution";

const middlewareSource = readFileSync(join(process.cwd(), "apps/web/middleware.ts"), "utf8");
const analyticsRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/analytics/route.ts"), "utf8");
const bookingRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts"), "utf8");

describe("GAP-074 SEO analytics attribution wiring", () => {
  it("captures UTM and portfolio attribution cookies at public route entry", () => {
    const cookies = attributionCookiesForUrl("https://inkroute.example/portfolio?utm_source=Instagram&utm_medium=Social&utm_campaign=Flash Drop&portfolioItemId=portfolio_1", "portfolio_1");
    expect(cookies[seoAttributionCookieNames.source]).toBe("instagram");
    expect(cookies[seoAttributionCookieNames.medium]).toBe("social");
    expect(cookies[seoAttributionCookieNames.campaign]).toBe("flash-drop");
    expect(cookies[seoAttributionCookieNames.portfolioItemId]).toBe("portfolio_1");
    expect(middlewareSource).toContain("attributionCookiesForUrl");
    expect(middlewareSource).toContain("seoAttributionCookieMaxAgeSeconds");
  });

  it("normalizes and redacts public analytics ingestion events", () => {
    const event = buildPublicSeoAnalyticsEvent({
      tenantId: "tenant_001",
      name: "booking_request_submitted",
      url: "https://inkroute.example/booking?utm_source=Newsletter&utm_medium=Email&utm_campaign=Guest Spot",
      bookingRequestId: "booking_001",
      style: "Fine Line",
      now: "2026-06-09T00:00:00.000Z",
    });
    expect(event.payload).toMatchObject({ source: "newsletter", medium: "email", campaign: "guest-spot", style: "fine_line" });
    expect(redactAnalyticsPayload({ ...event.payload, city: "Seattle" })).not.toHaveProperty("medicalNotes");
  });

  it("exposes a tenant-scoped public ingestion route with idempotency and no-store boundaries", () => {
    expect(analyticsRouteSource).toContain("allowedEvents");
    expect(analyticsRouteSource).toContain("idempotency-key");
    expect(analyticsRouteSource).toContain("redactAnalyticsPayload");
    expect(analyticsRouteSource).toContain('"Cache-Control": "no-store"');
    expect(analyticsRouteSource).toContain("accepted_without_provider_persistence");
  });

  it("keeps BookingRequest attribution persistence wired through existing fields", () => {
    expect(bookingRouteSource).toContain("portfolioAttributionId");
    expect(bookingRouteSource).toContain("utmSource");
    expect(bookingRouteSource).toContain("utmMedium");
    expect(bookingRouteSource).toContain("utmCampaign");
  });

  it("tracks remaining production analytics blockers and artifacts", () => {
    expect(seoAnalyticsAttributionContract.status).toBe("blocked");
    expect(seoAnalyticsAttributionContract.blockers).toContain("Analytics event persistence must be available.");
    expect(seoAnalyticsAttributionContract.blockers).toContain("Search Console import job must be configured.");
    expect(seoAnalyticsArtifactPaths).toContain("coverage/playwright-seo-attribution-results.json");
    expect(seoAnalyticsArtifactPaths).toContain("test-results/seo-analytics");
  });
});
