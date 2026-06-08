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
