import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile API client static contract", () => {
  const apiClientSource = readWorkspaceFile("apps/mobile/src/lib/mobileApiClient.ts");
  const homeScreenSource = readWorkspaceFile("apps/mobile/src/screens/HomeScreen.tsx");
  const bookingScreenSource = readWorkspaceFile("apps/mobile/src/screens/BookingRequestsScreen.tsx");
  const travelScreenSource = readWorkspaceFile("apps/mobile/src/screens/TravelUpdateScreen.tsx");
  const appointmentsScreenSource = readWorkspaceFile("apps/mobile/src/screens/AppointmentsScreen.tsx");
  const clientsScreenSource = readWorkspaceFile("apps/mobile/src/screens/ClientsScreen.tsx");
  const portfolioScreenSource = readWorkspaceFile("apps/mobile/src/screens/PortfolioUploadScreen.tsx");
  const notificationsScreenSource = readWorkspaceFile("apps/mobile/src/screens/NotificationsScreen.tsx");
  const systemStatusScreenSource = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

  it("uses shared mobile-support request planning for tenant/auth/request-id headers", () => {
    expect(apiClientSource).toContain("buildMobileApiRequestPlan");
    expect(apiClientSource).toContain("baseUrl: session.baseUrl");
    expect(apiClientSource).toContain("tenantId: session.tenantId");
    expect(apiClientSource).toContain("accessToken: session.accessToken");
    expect(apiClientSource).toContain("requestId: request.requestId");
    expect(apiClientSource).toContain("idempotencyKey: request.idempotencyKey");
  });

  it("exposes safe mobile request proof without echoing auth or replay identifiers", () => {
    expect(apiClientSource).toContain("buildMobileApiSafeRequestProof");
    expect(apiClientSource).toContain("authHeaderAttached: plan.headerProof.authorizationHeaderAttached");
    expect(apiClientSource).toContain("tenantHeaderAttached: plan.headerProof.tenantHeaderAttached");
    expect(apiClientSource).toContain("requestIdHeaderAttached: plan.headerProof.requestIdHeaderAttached");
    expect(apiClientSource).toContain("idempotencyHeaderAttached: plan.headerProof.idempotencyHeaderAttached");
    expect(apiClientSource).toContain("rawAuthorizationHeaderEchoed: false");
    expect(apiClientSource).toContain("rawAccessTokenEchoed: false");
    expect(apiClientSource).toContain("rawTenantIdEchoed: false");
    expect(apiClientSource).toContain("rawRequestIdEchoed: false");
    expect(apiClientSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(apiClientSource).toContain("rawUrlEchoed: false");
    expect(apiClientSource).toContain("rawBodyEchoed: false");
  });

  it("blocks unsafe requests before fetch and redacts response errors", () => {
    expect(apiClientSource).toContain('if (plan.status !== "ready" || !plan.url)');
    expect(apiClientSource).toContain("plan.blockers.join");
    expect(apiClientSource).toContain("Sensitive response details were redacted");
    expect(apiClientSource).not.toContain("await response.text()");
  });

  it("validates response envelopes before screens consume data", () => {
    expect(apiClientSource).toContain("assertMobileApiEnvelope");
    expect(apiClientSource).toContain('typeof envelope.ok !== "boolean"');
    expect(apiClientSource).toContain("envelope.requestId !== requestId");
    expect(apiClientSource).toContain('"INVALID_ENVELOPE"');
  });

  it("surfaces API sync coverage in mobile screens without hiding runtime gates", () => {
    expect(homeScreenSource).toContain("mobileApiSyncPreview");
    expect(homeScreenSource).toContain("API sync contract");
    expect(bookingScreenSource).toContain("mobileApiSyncPreview");
    expect(bookingScreenSource).toContain("Typed client ready");
    expect(bookingScreenSource).toContain("provider auth and seeded API smoke");
    expect(bookingScreenSource).toContain("mobileBookingLifecycleActionContract");
    expect(bookingScreenSource).toContain("loadMobileBookingRequests");
    expect(bookingScreenSource).toContain("submitMobileBookingLifecycleAction");
    expect(bookingScreenSource).toContain("mobileApiFetch<MobileBookingRequestSummary[]>");
    expect(bookingScreenSource).toContain('/api/mobile/bookings/${encodeURIComponent(input.bookingId)}/actions');
    expect(travelScreenSource).toContain("loadMobileTravelStops");
    expect(travelScreenSource).toContain("publishMobileTravelStop");
    expect(travelScreenSource).toContain("mobileApiFetch<MobileTravelStopSummary[]>");
    expect(travelScreenSource).toContain('/api/mobile/travel-stops/${encodeURIComponent(input.travelStopId)}/publish');
    expect(appointmentsScreenSource).toContain("loadMobileAppointments");
    expect(appointmentsScreenSource).toContain("loadMobileAvailability");
    expect(clientsScreenSource).toContain("loadMobileClients");
    expect(clientsScreenSource).toContain("loadMobileClientTimeline");
    expect(portfolioScreenSource).toContain("loadMobilePortfolio");
    expect(portfolioScreenSource).toContain("createMobilePortfolioUploadIntent");
    expect(notificationsScreenSource).toContain("loadMobileNotifications");
    expect(notificationsScreenSource).toContain("loadMobileMessages");
    expect(systemStatusScreenSource).toContain("loadMobileReleaseHealth");
    expect(bookingScreenSource).toContain("lifecycle contract ready");
    expect(bookingScreenSource).toContain("provider execution gated");
    expect(bookingScreenSource).not.toContain("Actions disabled");
  });
});
