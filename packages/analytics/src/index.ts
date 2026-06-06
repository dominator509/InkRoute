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

export function createAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload) {
  return { name, payload } as const;
}
