import { describe, expect, it } from "vitest";
import {
  createAnalyticsEvent,
  derivePortfolioBookingAttribution,
  normalizeAnalyticsEvent,
  parseUtmAttribution,
} from "../src/index";

describe("analytics attribution helpers", () => {
  it("parses and normalizes UTM attribution values safely", () => {
    expect(parseUtmAttribution("https://artist.example/portfolio?utm_source=Instagram Stories&utm_medium=Social&utm_campaign=Flash Drop!!!")).toEqual({
      source: "instagram-stories",
      medium: "social",
      campaign: "flash-drop",
    });
    expect(parseUtmAttribution("not a url")).toEqual({});
  });

  it("normalizes event attribution and style fields", () => {
    expect(
      normalizeAnalyticsEvent("style_page_viewed", {
        tenantId: "tenant_001",
        style: "Fine Line",
        source: " Instagram ",
        medium: "Paid Social",
        campaign: "Summer Guest Spot",
        createdAt: "2026-06-08T00:00:00.000Z",
      }),
    ).toMatchObject({
      name: "style_page_viewed",
      payload: {
        style: "fine_line",
        source: "instagram",
        medium: "paid-social",
        campaign: "summer-guest-spot",
      },
    });
  });

  it("attributes a booking submission to the most recent tenant-scoped portfolio view", () => {
    const booking = createAnalyticsEvent("booking_request_submitted", {
      tenantId: "tenant_001",
      bookingRequestId: "booking_001",
      source: "direct",
      createdAt: "2026-06-08T12:00:00.000Z",
    });
    const attribution = derivePortfolioBookingAttribution({
      bookingEvent: booking,
      priorEvents: [
        createAnalyticsEvent("portfolio_item_viewed", {
          tenantId: "tenant_002",
          portfolioItemId: "portfolio_other",
          createdAt: "2026-06-08T11:59:00.000Z",
        }),
        createAnalyticsEvent("portfolio_item_viewed", {
          tenantId: "tenant_001",
          portfolioItemId: "portfolio_old",
          source: "instagram",
          createdAt: "2026-06-08T10:00:00.000Z",
        }),
        createAnalyticsEvent("portfolio_item_viewed", {
          tenantId: "tenant_001",
          portfolioItemId: "portfolio_recent",
          source: "google",
          medium: "organic",
          campaign: "city-seo",
          createdAt: "2026-06-08T11:30:00.000Z",
        }),
      ],
      maxAgeMinutes: 180,
    });

    expect(attribution).toEqual({
      portfolioItemId: "portfolio_recent",
      source: "google",
      medium: "organic",
      campaign: "city-seo",
      reason: "Most recent tenant-scoped portfolio view before booking submission.",
    });
  });

  it("does not attribute across tenants or outside the attribution window", () => {
    const booking = createAnalyticsEvent("booking_request_submitted", {
      tenantId: "tenant_001",
      createdAt: "2026-06-08T12:00:00.000Z",
    });
    const attribution = derivePortfolioBookingAttribution({
      bookingEvent: booking,
      priorEvents: [
        createAnalyticsEvent("portfolio_item_viewed", {
          tenantId: "tenant_001",
          portfolioItemId: "portfolio_old",
          createdAt: "2026-06-01T12:00:00.000Z",
        }),
      ],
      maxAgeMinutes: 60,
    });

    expect(attribution).toEqual({
      reason: "No recent tenant-scoped portfolio view was available for booking attribution.",
    });
  });
});
