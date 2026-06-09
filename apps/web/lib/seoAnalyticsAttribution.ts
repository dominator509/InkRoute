import {
  buildSeoAnalyticsRuntimeReadinessPlan,
  createAnalyticsEvent,
  normalizeAnalyticsEvent,
  parseUtmAttribution,
  type AnalyticsEventName,
  type AnalyticsEventPayload,
  type SeoAnalyticsRuntimeReadinessPlan,
} from "@inkroute/analytics";

export const seoAttributionCookieNames = {
  source: "inkroute_utm_source",
  medium: "inkroute_utm_medium",
  campaign: "inkroute_utm_campaign",
  portfolioItemId: "inkroute_portfolio_attribution_id",
  landingPath: "inkroute_landing_path",
} as const;

export const seoAttributionCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export const seoAnalyticsArtifactPaths = [
  "coverage/seo-analytics-attribution.json",
  "coverage/seo-analytics-dashboard-report.json",
  "coverage/search-console-import-fixture.json",
  "coverage/playwright-seo-attribution-results.json",
  "test-results/seo-analytics",
] as const;

export function attributionCookiesForUrl(url: string, portfolioItemId?: string) {
  const utm = parseUtmAttribution(url);
  const parsed = new URL(url, "https://inkroute.local");
  return {
    ...(utm.source ? { [seoAttributionCookieNames.source]: utm.source } : {}),
    ...(utm.medium ? { [seoAttributionCookieNames.medium]: utm.medium } : {}),
    ...(utm.campaign ? { [seoAttributionCookieNames.campaign]: utm.campaign } : {}),
    ...(portfolioItemId ? { [seoAttributionCookieNames.portfolioItemId]: portfolioItemId } : {}),
    [seoAttributionCookieNames.landingPath]: parsed.pathname,
  };
}

export function buildPublicSeoAnalyticsEvent(input: {
  tenantId: string;
  name: AnalyticsEventName;
  url: string;
  portfolioItemId?: string;
  city?: string;
  style?: string;
  bookingRequestId?: string;
  now?: string;
}) {
  const utm = parseUtmAttribution(input.url);
  const payload: AnalyticsEventPayload = {
    tenantId: input.tenantId,
    ...(input.bookingRequestId ? { bookingRequestId: input.bookingRequestId } : {}),
    ...(input.portfolioItemId ? { portfolioItemId: input.portfolioItemId } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(input.style ? { style: input.style } : {}),
    ...(utm.source ? { source: utm.source } : {}),
    ...(utm.medium ? { medium: utm.medium } : {}),
    ...(utm.campaign ? { campaign: utm.campaign } : {}),
    createdAt: input.now ?? new Date().toISOString(),
  };
  return normalizeAnalyticsEvent(input.name, createAnalyticsEvent(input.name, payload).payload);
}

export function redactAnalyticsPayload(payload: AnalyticsEventPayload): AnalyticsEventPayload {
  return {
    tenantId: payload.tenantId,
    ...(payload.artistId ? { artistId: payload.artistId } : {}),
    ...(payload.clientId ? { clientId: payload.clientId } : {}),
    ...(payload.bookingRequestId ? { bookingRequestId: payload.bookingRequestId } : {}),
    ...(payload.portfolioItemId ? { portfolioItemId: payload.portfolioItemId } : {}),
    ...(payload.city ? { city: payload.city } : {}),
    ...(payload.style ? { style: payload.style } : {}),
    ...(payload.source ? { source: payload.source } : {}),
    ...(payload.medium ? { medium: payload.medium } : {}),
    ...(payload.campaign ? { campaign: payload.campaign } : {}),
    createdAt: payload.createdAt,
  };
}

export function buildSeoAnalyticsAttributionContract(): SeoAnalyticsRuntimeReadinessPlan {
  return buildSeoAnalyticsRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    analyticsPackageTestsPassed: false,
    analyticsPackageTypecheckPassed: false,
    publicRouteUtmCaptureImplemented: true,
    analyticsIngestionApiImplemented: true,
    eventPersistenceAvailable: false,
    campaignTrackingPersistenceAvailable: false,
    portfolioAttributionCookieOrSessionConfigured: true,
    bookingRequestAttributionPersistenceAvailable: true,
    searchConsoleImportConfigured: false,
    searchConsoleCredentialsConfigured: false,
    dashboardReportingImplemented: false,
    tenantScopedReportingEnforced: false,
    attributionWindowConfigured: true,
    privacyRedactionConfigured: true,
    idempotencyStoreAvailable: false,
    playwrightClickThroughAttributionPassed: false,
    persistedBookingAttributionTestsPassed: false,
    searchConsoleImportTestsPassed: false,
    dashboardAnalyticsTestsPassed: false,
  });
}

export const seoAnalyticsAttributionContract = buildSeoAnalyticsAttributionContract();
