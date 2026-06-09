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

export type SeoAnalyticsAttributionRuntimeStatus =
  | "wired"
  | "persistence-gated"
  | "provider-gated"
  | "dashboard-gated"
  | "integration-gated"
  | "ci-gated";

export interface SeoAnalyticsAttributionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: SeoAnalyticsAttributionRuntimeStatus;
}

export const seoAnalyticsRuntimeCommands = [
  "pnpm --filter @inkroute/analytics typecheck",
  "pnpm --filter @inkroute/analytics test",
  "pnpm vitest run apps/web/tests/seo-analytics-attribution-static.test.ts",
  "seeded AnalyticsEvent/Campaign persistence tests",
  "tenant-scoped dashboard SEO analytics report tests",
  "Search Console import fixture and credential-bound job tests",
  "Playwright public portfolio-to-booking attribution tests",
  "seeded BookingRequest attribution integration tests",
] as const;

export const seoAnalyticsArtifactPaths = [
  "coverage/seo-analytics-attribution.json",
  "coverage/seo-analytics-analytics-typecheck.txt",
  "coverage/seo-analytics-analytics-test.txt",
  "coverage/seo-analytics-public-cookie-capture.json",
  "coverage/seo-analytics-ingestion-redaction.json",
  "coverage/seo-analytics-idempotency-store.json",
  "coverage/seo-analytics-event-persistence.json",
  "coverage/seo-analytics-campaign-persistence.json",
  "coverage/seo-analytics-dashboard-report.json",
  "coverage/search-console-import-fixture.json",
  "coverage/search-console-import-credentials-redacted.json",
  "coverage/playwright-seo-attribution-results.json",
  "coverage/seo-analytics-booking-attribution-integration.json",
  "coverage/seo-analytics-ci-evidence.json",
  "coverage/seo-analytics-secret-safe-artifacts.json",
  "test-results/seo-analytics",
] as const;

export const seoAnalyticsAttributionRuntimeMatrix: readonly SeoAnalyticsAttributionRuntimeMatrixEntry[] = [
  { id: "analytics-typecheck", command: "pnpm --filter @inkroute/analytics typecheck", artifact: "coverage/seo-analytics-analytics-typecheck.txt", status: "wired" },
  { id: "analytics-tests", command: "pnpm --filter @inkroute/analytics test", artifact: "coverage/seo-analytics-analytics-test.txt", status: "wired" },
  { id: "public-cookie-capture", command: "public route UTM/portfolio cookie contract", artifact: "coverage/seo-analytics-public-cookie-capture.json", status: "wired" },
  { id: "ingestion-redaction", command: "public analytics ingestion redaction contract", artifact: "coverage/seo-analytics-ingestion-redaction.json", status: "wired" },
  { id: "idempotency-store", command: "analytics ingestion idempotency storage tests", artifact: "coverage/seo-analytics-idempotency-store.json", status: "persistence-gated" },
  { id: "event-persistence", command: "seeded AnalyticsEvent persistence tests", artifact: "coverage/seo-analytics-event-persistence.json", status: "persistence-gated" },
  { id: "campaign-persistence", command: "seeded Campaign persistence tests", artifact: "coverage/seo-analytics-campaign-persistence.json", status: "persistence-gated" },
  { id: "dashboard-reporting", command: "tenant-scoped dashboard SEO analytics report tests", artifact: "coverage/seo-analytics-dashboard-report.json", status: "dashboard-gated" },
  { id: "search-console-import", command: "Search Console import fixture and credential-bound job tests", artifact: "coverage/search-console-import-fixture.json", status: "provider-gated" },
  { id: "playwright-click-through", command: "Playwright public portfolio-to-booking attribution tests", artifact: "coverage/playwright-seo-attribution-results.json", status: "integration-gated" },
  { id: "booking-attribution-integration", command: "seeded BookingRequest attribution integration tests", artifact: "coverage/seo-analytics-booking-attribution-integration.json", status: "integration-gated" },
  { id: "ci-seo-analytics-job", command: "GitHub Actions SEO analytics attribution job", artifact: "coverage/seo-analytics-ci-evidence.json", status: "ci-gated" },
  { id: "secret-safe-artifacts", command: "redacted SEO analytics artifact audit", artifact: "coverage/seo-analytics-secret-safe-artifacts.json", status: "ci-gated" },
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
