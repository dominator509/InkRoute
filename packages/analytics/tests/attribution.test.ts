import { describe, expect, it } from "vitest";
import {
  buildSeoAnalyticsRuntimeReadinessPlan,
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

  it("summarizes SEO analytics runtime readiness across UTM capture, ingestion, attribution persistence, Search Console imports, dashboard reporting, privacy, and E2E evidence", () => {
    const plan = buildSeoAnalyticsRuntimeReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      analyticsPackageTestsPassed: true,
      analyticsPackageTypecheckPassed: true,
      publicRouteUtmCaptureImplemented: true,
      analyticsIngestionApiImplemented: true,
      eventPersistenceAvailable: true,
      campaignTrackingPersistenceAvailable: true,
      portfolioAttributionCookieOrSessionConfigured: true,
      bookingRequestAttributionPersistenceAvailable: true,
      searchConsoleImportConfigured: true,
      searchConsoleCredentialsConfigured: true,
      dashboardReportingImplemented: true,
      tenantScopedReportingEnforced: true,
      attributionWindowConfigured: true,
      privacyRedactionConfigured: true,
      idempotencyStoreAvailable: true,
      playwrightClickThroughAttributionPassed: true,
      persistedBookingAttributionTestsPassed: true,
      searchConsoleImportTestsPassed: true,
      dashboardAnalyticsTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredControls).toContain("Propagate tenant-scoped portfolio attribution into BookingRequest persistence without crossing tenants.");
    expect(plan.requiredCommands).toContain("Playwright portfolio-to-booking attribution test");
  });

  it("blocks SEO analytics runtime readiness until ingestion, persistence, Search Console import, dashboard reporting, privacy controls, and E2E evidence exist", () => {
    const plan = buildSeoAnalyticsRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      analyticsPackageTestsPassed: true,
      analyticsPackageTypecheckPassed: false,
      publicRouteUtmCaptureImplemented: false,
      analyticsIngestionApiImplemented: false,
      eventPersistenceAvailable: false,
      campaignTrackingPersistenceAvailable: false,
      portfolioAttributionCookieOrSessionConfigured: false,
      bookingRequestAttributionPersistenceAvailable: false,
      searchConsoleImportConfigured: false,
      searchConsoleCredentialsConfigured: false,
      dashboardReportingImplemented: false,
      tenantScopedReportingEnforced: false,
      attributionWindowConfigured: false,
      privacyRedactionConfigured: false,
      idempotencyStoreAvailable: false,
      playwrightClickThroughAttributionPassed: false,
      persistedBookingAttributionTestsPassed: false,
      searchConsoleImportTestsPassed: false,
      dashboardAnalyticsTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredEvidence).toEqual([
      "public UTM capture, ingestion API, event persistence, and campaign tracking evidence",
      "portfolio click-through and persisted BookingRequest attribution evidence",
      "Search Console credential, import job, and import test evidence",
      "tenant-scoped dashboard SEO analytics reporting evidence",
      "privacy redaction, idempotency, and attribution-window configuration evidence",
    ]);
    expect(plan.blockers).toContain("Public routes must capture UTM and portfolio attribution context.");
    expect(plan.blockers).toContain("BookingRequest attribution persistence must be available.");
    expect(plan.blockers).toContain("Search Console import job must be configured.");
    expect(plan.blockers).toContain("Dashboard analytics reporting tests must pass.");
  });
});
