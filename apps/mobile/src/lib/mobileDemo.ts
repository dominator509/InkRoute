import { calculateTattooReadinessScore, emptyBookingDraft } from "@inkroute/booking";
import { canAccessTenant, rolePermissions } from "@inkroute/auth";
import { buildTravelScheduleIcs } from "@inkroute/calendar";
import { demoPortfolioItems, demoTravelStops, inkrouteDemoArtist, inkrouteDemoTenant } from "@inkroute/config";
import { buildDeliveryPlan, buildFullAutomationSequence, renderTemplateText, type ClientConsentSnapshot } from "@inkroute/notifications";
import {
  buildAlertRoute,
  buildObservabilityReportDraft,
  buildSentrySetupChecklist,
  observabilityProviderBoundaries,
} from "@inkroute/observability";
import {
  demoFeatureFlagDecisions,
  demoMobileUpdatePlan,
  demoReleaseCandidate,
  demoReleaseHealthChecks,
  demoRollbackPlan,
  buildProviderRuntimeGates,
} from "@inkroute/releases";

import {
  buildPrivacyRequestDraft,
  buildTenantIsolationFixtures,
  buildTrustCenterChecklist,
  summarizeSecurityPosture,
  validateUploadDraft,
} from "@inkroute/security";
import {
  phase6HealthChecks,
  phase6MobileBoundaries,
  summarizeOfflineQueue,
  type MobileSessionPreview,
  type OfflineQueueItem,
} from "@inkroute/mobile-support";

export const mobileSessionPreview: MobileSessionPreview = {
  status: "mock_owner",
  tenantSlug: inkrouteDemoTenant.slug,
  userLabel: "Mara Vale",
  roleLabel: "Owner / artist",
  biometricAvailable: true,
  sessionBoundary: "Mocked session only. Production requires auth provider tokens, secure refresh, and tenant membership verification.",
};

export const mobileAccessPreview = {
  canReadTenant: canAccessTenant({ tenantId: inkrouteDemoTenant.id, userId: "user_mara_demo", role: "owner" }, inkrouteDemoTenant.id),
  ownerPermissionCount: rolePermissions.owner.length,
};

export const mobileReadinessPreview = calculateTattooReadinessScore({
  ...emptyBookingDraft,
  preferredCitySlug: "seattle-wa",
  preferredDateWindow: "Flexible during Seattle guest spot",
  style: "ornamental",
  placement: "forearm",
  sizeEstimate: "Palm to half-forearm scale",
  budgetRange: "$900-$1,500",
  ideaSummary:
    "Ornamental blackwork concept with a serpent reference, clean negative space, and flexibility on final composition after artist review.",
  referenceImages: [{ localId: "local_ref_01", filename: "serpent-reference.jpg", sizeBytes: 432000, mimeType: "image/jpeg", uploadStatus: "local_only" }],
  clientName: "Ari M.",
  clientEmail: "ari@example.com",
  policyAccepted: true,
  ageAcknowledged: true,
  privacyAcknowledged: true,
  depositBoundaryAcknowledged: true,
});

export const mobileBookingQueue = [
  {
    id: "booking_req_1001",
    client: "Ari M.",
    city: "Seattle",
    style: "Ornamental blackwork",
    placement: "Forearm",
    score: mobileReadinessPreview.percentage,
    status: "Submitted",
    summary: "Strong request with references, budget, placement, and flexible travel-week timing.",
  },
  {
    id: "booking_req_1002",
    client: "Mina L.",
    city: "Oakland",
    style: "Fine-line floral",
    placement: "Upper arm",
    score: 76,
    status: "Needs review",
    summary: "Missing exact size, but contact and concept are clear enough for artist review.",
  },
  {
    id: "booking_req_1003",
    client: "Jon R.",
    city: "San Diego",
    style: "Flash",
    placement: "Leg",
    score: 58,
    status: "Waitlist",
    summary: "Waitlist request needs updated timing and deposit policy handoff once city opens.",
  },
];

export const mobileAppointments = [
  {
    id: "appt_2001",
    client: "Ari M.",
    title: "Ornamental forearm consult",
    city: "Seattle",
    time: "Jul 11, 2026 · 11:00 AM",
    duration: "45 min consult + 15 min buffer",
    status: "Tentative",
  },
  {
    id: "appt_2002",
    client: "Jon R.",
    title: "Blackwork flash session",
    city: "Oakland",
    time: "Sep 19, 2026 · 2:00 PM",
    duration: "2 hr session + 30 min buffer",
    status: "Deposit pending",
  },
];

export const mobileClients = [
  {
    id: "client_3001",
    name: "Ari M.",
    city: "Seattle",
    tags: ["ornamental", "high readiness", "reference uploaded"],
    lastTouch: "Booking request submitted",
    privateBoundary: "Medical notes and IDs are not shown in this demo-safe mobile preview.",
  },
  {
    id: "client_3002",
    name: "Mina L.",
    city: "Oakland",
    tags: ["fine line", "needs size", "aftercare candidate"],
    lastTouch: "Needs more size context",
    privateBoundary: "Timeline is static; production requires tenant-scoped API and field-level access.",
  },
];

export const portfolioUploadDraft = {
  title: "Black Sun Flash",
  styleTags: ["blackwork", "flash"],
  freshness: "fresh",
  placement: "leg",
  city: "Oakland",
  caption: "Limited flash concept ready for future travel-week drop.",
  altText: "Blackwork sun flash tattoo concept with bold negative space",
  storageBoundary: "Metadata preview only. Image bytes, derivatives, moderation, and signed uploads are not wired.",
};

export const notificationPreviews = [
  {
    key: "booking_request_received",
    channel: "Email + push",
    body: renderTemplateText("booking_request_received", { artistName: inkrouteDemoArtist.displayName, clientName: "Ari" }),
  },
  {
    key: "appointment_prep",
    channel: "SMS + push",
    body: renderTemplateText("appointment_prep_24h", {
      artistName: inkrouteDemoArtist.displayName,
      clientName: "Mina",
      appointmentDate: "Sep 19",
    }),
  },
  {
    key: "healed_photo_request",
    channel: "Email",
    body: renderTemplateText("healed_photo_request_30d", { artistName: inkrouteDemoArtist.displayName, clientName: "Jon" }),
  },
];

export const offlineQueueItems: OfflineQueueItem[] = [
  {
    id: "offline_1",
    kind: "booking_note",
    label: "Add artist review note to Ari booking",
    status: "queued",
    createdAt: "2026-06-03T08:00:00-07:00",
    retryCount: 0,
    sensitive: true,
  },
  {
    id: "offline_2",
    kind: "travel_update",
    label: "Publish Oakland cancellation opening",
    status: "failed",
    createdAt: "2026-06-03T08:20:00-07:00",
    lastAttemptAt: "2026-06-03T08:30:00-07:00",
    retryCount: 2,
    sensitive: false,
  },
  {
    id: "offline_3",
    kind: "portfolio_metadata",
    label: "Save healed/fresh label for Black Sun Flash",
    status: "queued",
    createdAt: "2026-06-03T08:40:00-07:00",
    retryCount: 0,
    sensitive: false,
  },
];

export const offlineQueueSummary = summarizeOfflineQueue(offlineQueueItems);
export const mobileBoundaries = phase6MobileBoundaries;
export const mobileHealthChecks = phase6HealthChecks;
export const mobileTravelStops = demoTravelStops;
export const mobilePortfolioItems = demoPortfolioItems;
export const mobileIcsPreview = buildTravelScheduleIcs(`${inkrouteDemoArtist.displayName} travel`, demoTravelStops).slice(0, 180);


export const mobileNotificationConsent: ClientConsentSnapshot = {
  clientId: "client_mobile_ari",
  email: "ari@example.test",
  phone: "+15550101010",
  pushToken: "ExponentPushToken[mobile-demo-token]",
  inAppUserId: "client_mobile_ari",
  emailOptIn: true,
  smsOptIn: true,
  pushOptIn: true,
  marketingOptIn: false,
  transactionalAllowed: true,
};

export const mobileNotificationPlans = [
  buildDeliveryPlan({
    key: "appointment_prep_24h",
    context: { artistName: inkrouteDemoArtist.displayName, clientName: "Ari", appointmentDate: "Jul 11, 2026" },
    consent: mobileNotificationConsent,
  }),
  buildDeliveryPlan({
    key: "flash_drop_announcement",
    context: { artistName: inkrouteDemoArtist.displayName, clientName: "Ari", flashDropUrl: "https://example.test/flash" },
    consent: mobileNotificationConsent,
  }),
];

export const mobileAutomationSequence = buildFullAutomationSequence();


export const mobileCrashReportDraft = buildObservabilityReportDraft({
  tenantId: inkrouteDemoTenant.id,
  source: "mobile",
  runtime: "react-native",
  environment: "development",
  message: "Expo mobile crash capture is scaffolded but not connected to Sentry",
  route: "apps/mobile/App.tsx",
  release: "phase11-mobile-demo",
  metadata: {
    userEmail: "artist@example.test",
    device: "simulator-not-run",
    token: "demo-token-should-redact",
  },
  tags: { phase: "11", surface: "mobile" },
});

export const mobileCrashAlertRoute = buildAlertRoute(mobileCrashReportDraft);
export const mobileSentryChecklist = buildSentrySetupChecklist("react-native");
export const mobileObservabilityBoundaries = observabilityProviderBoundaries.filter((boundary) => boundary.surface === "mobile" || boundary.surface === "all");

export const mobileReleaseCandidate = demoReleaseCandidate;
export const mobileReleaseHealthChecks = demoReleaseHealthChecks;
export const mobileOtaUpdatePlan = demoMobileUpdatePlan;
export const mobileFeatureFlagDecisions = demoFeatureFlagDecisions;
export const mobileProviderRuntimeGates = buildProviderRuntimeGates(mobileFeatureFlagDecisions);
export const mobileRollbackPlan = demoRollbackPlan;


export const mobileSecurityControls = buildTrustCenterChecklist();
export const mobileSecuritySummary = summarizeSecurityPosture(mobileSecurityControls);
export const mobileTenantIsolationFixtures = buildTenantIsolationFixtures();
export const mobilePrivacyDraft = buildPrivacyRequestDraft("export");
export const mobileUploadValidationPreview = validateUploadDraft({
  kind: "reference_private",
  filename: "travel-reference.heic",
  mimeType: "image/heic",
  sizeBytes: 1_240_000,
  declaredByAuthenticatedUser: false,
});
