import type { EntityId } from "@inkroute/types";

export type AnalyticsEventName =
  | "portfolio_item_viewed"
  | "booking_cta_clicked"
  | "booking_step_completed"
  | "booking_request_submitted"
  | "city_page_viewed"
  | "style_page_viewed"
  | "deposit_completed"
  | "travel_stop_viewed";

export interface AnalyticsEventPayload {
  tenantId: EntityId;
  artistId?: EntityId;
  clientId?: EntityId;
  bookingRequestId?: EntityId;
  portfolioItemId?: EntityId;
  city?: string;
  style?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  createdAt: string;
}

export interface AnalyticsEvent {
  readonly name: AnalyticsEventName;
  readonly payload: AnalyticsEventPayload;
}

export interface UtmAttribution {
  readonly source?: string;
  readonly medium?: string;
  readonly campaign?: string;
}

export interface PortfolioBookingAttribution {
  readonly portfolioItemId?: EntityId;
  readonly source?: string;
  readonly medium?: string;
  readonly campaign?: string;
  readonly reason: string;
}

export interface SeoAnalyticsRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  analyticsPackageTestsPassed: boolean;
  analyticsPackageTypecheckPassed: boolean;
  publicRouteUtmCaptureImplemented: boolean;
  analyticsIngestionApiImplemented: boolean;
  eventPersistenceAvailable: boolean;
  campaignTrackingPersistenceAvailable: boolean;
  portfolioAttributionCookieOrSessionConfigured: boolean;
  bookingRequestAttributionPersistenceAvailable: boolean;
  searchConsoleImportConfigured: boolean;
  searchConsoleCredentialsConfigured: boolean;
  dashboardReportingImplemented: boolean;
  tenantScopedReportingEnforced: boolean;
  attributionWindowConfigured: boolean;
  privacyRedactionConfigured: boolean;
  idempotencyStoreAvailable: boolean;
  playwrightClickThroughAttributionPassed: boolean;
  persistedBookingAttributionTestsPassed: boolean;
  searchConsoleImportTestsPassed: boolean;
  dashboardAnalyticsTestsPassed: boolean;
}

export interface SeoAnalyticsRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export function createAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload) {
  return { name, payload } as const;
}

function cleanAttributionValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return cleaned || undefined;
}

export function parseUtmAttribution(url: string): UtmAttribution {
  try {
    const parsed = new URL(url, "https://inkroute.local");
    return {
      source: cleanAttributionValue(parsed.searchParams.get("utm_source")),
      medium: cleanAttributionValue(parsed.searchParams.get("utm_medium")),
      campaign: cleanAttributionValue(parsed.searchParams.get("utm_campaign")),
    };
  } catch {
    return {};
  }
}

export function normalizeAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload): AnalyticsEvent {
  return {
    name,
    payload: {
      ...payload,
      city: payload.city?.trim(),
      style: payload.style?.trim().toLowerCase().replace(/\s+/g, "_"),
      source: cleanAttributionValue(payload.source ?? null),
      medium: cleanAttributionValue(payload.medium ?? null),
      campaign: cleanAttributionValue(payload.campaign ?? null),
    },
  };
}

export function derivePortfolioBookingAttribution(input: {
  bookingEvent: AnalyticsEvent;
  priorEvents: readonly AnalyticsEvent[];
  maxAgeMinutes?: number;
}): PortfolioBookingAttribution {
  const bookingTime = new Date(input.bookingEvent.payload.createdAt).getTime();
  const maxAgeMs = (input.maxAgeMinutes ?? 60 * 24 * 30) * 60_000;
  const candidates = input.priorEvents
    .filter((event) => event.name === "portfolio_item_viewed" && event.payload.tenantId === input.bookingEvent.payload.tenantId)
    .filter((event) => {
      const eventTime = new Date(event.payload.createdAt).getTime();
      return Number.isFinite(eventTime) && eventTime <= bookingTime && bookingTime - eventTime <= maxAgeMs;
    })
    .sort((a, b) => new Date(b.payload.createdAt).getTime() - new Date(a.payload.createdAt).getTime());
  const winner = candidates[0];

  if (!winner?.payload.portfolioItemId) {
    return { reason: "No recent tenant-scoped portfolio view was available for booking attribution." };
  }

  return {
    portfolioItemId: winner.payload.portfolioItemId,
    source: winner.payload.source ?? input.bookingEvent.payload.source,
    medium: winner.payload.medium ?? input.bookingEvent.payload.medium,
    campaign: winner.payload.campaign ?? input.bookingEvent.payload.campaign,
    reason: "Most recent tenant-scoped portfolio view before booking submission.",
  };
}

export function buildSeoAnalyticsRuntimeReadinessPlan(input: SeoAnalyticsRuntimeReadinessInput): SeoAnalyticsRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/analytics package script is missing ${script}.`);
  if (!input.analyticsPackageTestsPassed) blockers.push("@inkroute/analytics attribution tests must pass.");
  if (!input.analyticsPackageTypecheckPassed) blockers.push("@inkroute/analytics typecheck must pass.");
  if (!input.publicRouteUtmCaptureImplemented) blockers.push("Public routes must capture UTM and portfolio attribution context.");
  if (!input.analyticsIngestionApiImplemented) blockers.push("Analytics ingestion API must be implemented.");
  if (!input.eventPersistenceAvailable) blockers.push("Analytics event persistence must be available.");
  if (!input.campaignTrackingPersistenceAvailable) blockers.push("Campaign tracking persistence must be available.");
  if (!input.portfolioAttributionCookieOrSessionConfigured) blockers.push("Portfolio attribution cookie or session propagation must be configured.");
  if (!input.bookingRequestAttributionPersistenceAvailable) blockers.push("BookingRequest attribution persistence must be available.");
  if (!input.searchConsoleImportConfigured) blockers.push("Search Console import job must be configured.");
  if (!input.searchConsoleCredentialsConfigured) blockers.push("Search Console credentials must be configured in a secret store.");
  if (!input.dashboardReportingImplemented) blockers.push("SEO analytics dashboard reporting must be implemented.");
  if (!input.tenantScopedReportingEnforced) blockers.push("SEO analytics reports must enforce tenant scope.");
  if (!input.attributionWindowConfigured) blockers.push("Portfolio-to-booking attribution window must be configured.");
  if (!input.privacyRedactionConfigured) blockers.push("Analytics ingestion must redact or avoid sensitive client data.");
  if (!input.idempotencyStoreAvailable) blockers.push("Analytics ingestion idempotency store must be available.");
  if (!input.playwrightClickThroughAttributionPassed) blockers.push("Playwright click-through attribution test must pass.");
  if (!input.persistedBookingAttributionTestsPassed) blockers.push("Persisted booking attribution tests must pass.");
  if (!input.searchConsoleImportTestsPassed) blockers.push("Search Console import tests must pass.");
  if (!input.dashboardAnalyticsTestsPassed) blockers.push("Dashboard analytics reporting tests must pass.");

  if (!input.publicRouteUtmCaptureImplemented || !input.analyticsIngestionApiImplemented || !input.eventPersistenceAvailable || !input.campaignTrackingPersistenceAvailable) {
    requiredEvidence.push("public UTM capture, ingestion API, event persistence, and campaign tracking evidence");
  }
  if (!input.portfolioAttributionCookieOrSessionConfigured || !input.bookingRequestAttributionPersistenceAvailable || !input.playwrightClickThroughAttributionPassed || !input.persistedBookingAttributionTestsPassed) {
    requiredEvidence.push("portfolio click-through and persisted BookingRequest attribution evidence");
  }
  if (!input.searchConsoleImportConfigured || !input.searchConsoleCredentialsConfigured || !input.searchConsoleImportTestsPassed) {
    requiredEvidence.push("Search Console credential, import job, and import test evidence");
  }
  if (!input.dashboardReportingImplemented || !input.tenantScopedReportingEnforced || !input.dashboardAnalyticsTestsPassed) {
    requiredEvidence.push("tenant-scoped dashboard SEO analytics reporting evidence");
  }
  if (!input.privacyRedactionConfigured || !input.idempotencyStoreAvailable || !input.attributionWindowConfigured) {
    requiredEvidence.push("privacy redaction, idempotency, and attribution-window configuration evidence");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/analytics typecheck",
      "pnpm --filter @inkroute/analytics test",
      "public route UTM capture tests",
      "Playwright portfolio-to-booking attribution test",
      "BookingRequest attribution persistence integration tests",
      "Search Console import tests",
      "dashboard SEO analytics reporting tests",
    ],
    requiredEvidence,
    requiredControls: [
      "Capture UTM, SEO page, portfolio item, city, and style attribution at public route entry points.",
      "Propagate tenant-scoped portfolio attribution into BookingRequest persistence without crossing tenants.",
      "Persist analytics events, campaign tracking, imported Search Console rows, and booking attribution with idempotency.",
      "Keep analytics payloads free of medical notes, payment details, private URLs, and raw sensitive client content.",
      "Enforce tenant scope on every analytics dashboard report and Search Console import row.",
      "Prove click-through attribution from public portfolio/SEO pages into booking requests with E2E tests.",
    ],
    blockers,
  };
}
