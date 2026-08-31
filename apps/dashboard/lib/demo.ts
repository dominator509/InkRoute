import { bookingLifecycleTransitions, calculateTattooReadinessScore, type BookingDraft } from "@inkroute/booking";
import {
  appointmentToGoogleCalendarEventDraft,
  applyBuffers,
  buildAvailabilitySlots,
  buildCalendarSyncPlan,
  buildGoogleFreeBusyRequestDraft,
  buildSignedIcsFeedDraft,
  buildTravelPublishPlan,
  buildTravelScheduleIcs,
  detectCalendarConflicts,
  type CalendarTimeBlock,
} from "@inkroute/calendar";
import {
  buildTenantDashboardView,
  demoPortfolioItems,
  demoSeoCityPages,
  demoSeoStylePages,
  demoTestimonials,
  demoTravelStops,
  inkrouteDemoArtist,
  inkrouteDemoTenant,
  type DashboardDataCollection,
} from "@inkroute/config";
import {
  buildDeliveryLogDraft,
  buildDeliveryPlan,
  buildFullAutomationSequence,
  buildMessageThreadDraft,
  createProviderSendDraft,
  interpretEmailWebhook,
  interpretPushReceipt,
  interpretSmsWebhook,
  providerBoundaryMatrix,
  renderTemplate,
  renderTemplateText,
  type ClientConsentSnapshot,
  type NotificationTemplateKey,
} from "@inkroute/notifications";
import {
  buildStripeCheckoutSessionDraft,
  calculateDepositPolicy,
  evaluateNoShowPolicy,
  evaluateRefundPolicy,
  generateReceiptNumber,
  interpretStripeWebhook,
  type RefundDecision,
  type NoShowDecision,
} from "@inkroute/payments";
import { redactRecord } from "@inkroute/security";
import { createHash } from "node:crypto";
import type {
  AppointmentStatus,
  AvailabilityWindow,
  BookingStatus,
  BodyPlacement,
  ErrorReportStatus,
  ErrorSeverity,
  FeatureFlag,
  MessageStatus,
  PaymentStatus,
  ReviewStatus,
  TattooStyle,
} from "@inkroute/types";

export interface DashboardBookingRow {
  id: string;
  clientName: string;
  clientEmail: string;
  city: string;
  preferredWindow: string;
  style: TattooStyle;
  placement: BodyPlacement;
  sizeEstimate: string;
  budgetRange: string;
  ideaSummary: string;
  status: BookingStatus;
  readinessScore: number;
  createdAt: string;
  portfolioAttribution: string;
  depositEstimateCents: number;
  notes: string[];
}

const ariSerpentDraft: BookingDraft = {
  preferredCitySlug: "seattle-wa",
  preferredDateWindow: "Flexible during Seattle week",
  locationPreference: "Guest Spot Studio",
  style: "blackwork",
  placement: "forearm",
  sizeEstimate: "8 inches, outer forearm panel",
  budgetRange: "$900-$1,500",
  ideaSummary:
    "I want a blackwork serpent piece with geometric orbit lines, inspired by the portfolio serpent but less dense near the wrist. I have references and want strong healed contrast.",
  referenceImages: [{ localId: "ref_ari_01", filename: "serpent-reference.jpg", mimeType: "image/jpeg", sizeBytes: 842100, uploadStatus: "local_only" }],
  clientName: "Ari M.",
  clientEmail: "ari@example.test",
  clientPhone: "+15550101010",
  medicalNotes: "Sensitive notes would be private after persistence is implemented.",
  marketingOptIn: true,
  smsOptIn: true,
  policyAccepted: true,
  ageAcknowledged: true,
  privacyAcknowledged: true,
  depositBoundaryAcknowledged: true,
  portfolioAttributionId: "pf_orbital_serpent",
};

const minaFloralDraft: BookingDraft = {
  preferredCitySlug: "oakland-ca",
  preferredDateWindow: "Weekday preferred",
  locationPreference: "Quiet private studio",
  style: "fine_line",
  placement: "upper_arm",
  sizeEstimate: "Palm-sized floral study",
  budgetRange: "$500-$900",
  ideaSummary:
    "Fine-line floral upper arm piece with a softer ornamental frame. I like the Ritual Floral composition and want something that can heal cleanly at medium scale.",
  referenceImages: [],
  clientName: "Mina L.",
  clientEmail: "mina@example.test",
  clientPhone: "+15550102020",
  medicalNotes: "Medical notes are redacted in dashboard projections and require provider-backed persistence evidence before production use.",
  marketingOptIn: false,
  smsOptIn: false,
  policyAccepted: true,
  ageAcknowledged: true,
  privacyAcknowledged: true,
  depositBoundaryAcknowledged: true,
  portfolioAttributionId: "pf_ritual_floral",
};

const jonBackpieceDraft: BookingDraft = {
  preferredCitySlug: "san-diego-ca",
  preferredDateWindow: "Waitlist me for cancellations",
  locationPreference: "Private guest spot",
  style: "ornamental",
  placement: "back",
  sizeEstimate: "Large back composition",
  budgetRange: "$2,500+",
  ideaSummary:
    "I am interested in an architectural ornamental back piece. I need a consult because the design should work around an existing shoulder tattoo and long-session endurance.",
  referenceImages: [{ localId: "ref_jon_01", filename: "back-layout.png", mimeType: "image/png", sizeBytes: 1400200, uploadStatus: "local_only" }],
  clientName: "Jon R.",
  clientEmail: "jon@example.test",
  clientPhone: "+15550103030",
  medicalNotes: "Client mentions prior tattoo placement conflict; final medical/legal review required.",
  marketingOptIn: true,
  smsOptIn: true,
  policyAccepted: true,
  ageAcknowledged: true,
  privacyAcknowledged: true,
  depositBoundaryAcknowledged: true,
  portfolioAttributionId: "pf_silent_gate",
};

const noaFlashDraft: BookingDraft = {
  preferredCitySlug: "seattle-wa",
  preferredDateWindow: "Specific date during the travel stop",
  locationPreference: "Flash travel slot",
  style: "flash",
  placement: "leg",
  sizeEstimate: "3-4 inches",
  budgetRange: "$250-$500",
  ideaSummary:
    "I want one of the black sun flash pieces if there is a quick opening during the Seattle guest spot. I can take a short-notice appointment.",
  referenceImages: [],
  clientName: "Noa T.",
  clientEmail: "noa@example.test",
  clientPhone: "+15550104040",
  medicalNotes: "",
  marketingOptIn: false,
  smsOptIn: true,
  policyAccepted: true,
  ageAcknowledged: true,
  privacyAcknowledged: true,
  depositBoundaryAcknowledged: false,
  portfolioAttributionId: "pf_black_sun",
};

const bookingDrafts = {
  booking_ari_serpent: ariSerpentDraft,
  booking_mina_floral: minaFloralDraft,
  booking_jon_backpiece: jonBackpieceDraft,
  booking_noa_flash: noaFlashDraft,
} as const satisfies Record<string, BookingDraft>;

function scoreFor(id: keyof typeof bookingDrafts) {
  return calculateTattooReadinessScore(bookingDrafts[id]).percentage;
}

export const dashboardBookingRows: DashboardBookingRow[] = [
  {
    id: "booking_ari_serpent",
    clientName: "Ari M.",
    clientEmail: "ari@example.test",
    city: "Seattle, WA",
    preferredWindow: "Flexible during Seattle week",
    style: "blackwork",
    placement: "forearm",
    sizeEstimate: "8 inches, outer forearm panel",
    budgetRange: "$900-$1,500",
    ideaSummary: bookingDrafts.booking_ari_serpent.ideaSummary,
    status: "submitted",
    readinessScore: scoreFor("booking_ari_serpent"),
    createdAt: "2026-06-01T18:15:00-07:00",
    portfolioAttribution: "Orbital Serpent",
    depositEstimateCents: calculateDepositPolicy({ estimatedSessionHours: 3, city: "Seattle" }).depositAmountCents,
    notes: ["Strong portfolio attribution", "SMS opt-in captured", "Reference metadata is local-only"],
  },
  {
    id: "booking_mina_floral",
    clientName: "Mina L.",
    clientEmail: "mina@example.test",
    city: "Oakland, CA",
    preferredWindow: "Weekday preferred",
    style: "fine_line",
    placement: "upper_arm",
    sizeEstimate: "Palm-sized floral study",
    budgetRange: "$500-$900",
    ideaSummary: bookingDrafts.booking_mina_floral.ideaSummary,
    status: "needs_info",
    readinessScore: scoreFor("booking_mina_floral"),
    createdAt: "2026-05-31T14:40:00-07:00",
    portfolioAttribution: "Ritual Floral",
    depositEstimateCents: calculateDepositPolicy({ estimatedSessionHours: 2, city: "Oakland" }).depositAmountCents,
    notes: ["Ask for one reference image", "Good style fit", "No SMS opt-in"],
  },
  {
    id: "booking_jon_backpiece",
    clientName: "Jon R.",
    clientEmail: "jon@example.test",
    city: "San Diego, CA",
    preferredWindow: "Waitlist for cancellations",
    style: "ornamental",
    placement: "back",
    sizeEstimate: "Large back composition",
    budgetRange: "$2,500+",
    ideaSummary: bookingDrafts.booking_jon_backpiece.ideaSummary,
    status: "accepted",
    readinessScore: scoreFor("booking_jon_backpiece"),
    createdAt: "2026-05-29T09:05:00-07:00",
    portfolioAttribution: "Silent Gate",
    depositEstimateCents: calculateDepositPolicy({ estimatedSessionHours: 6, city: "San Diego" }).depositAmountCents,
    notes: ["Consult recommended", "Large-session deposit estimate", "Placement conflict to review"],
  },
  {
    id: "booking_noa_flash",
    clientName: "Noa T.",
    clientEmail: "noa@example.test",
    city: "Seattle, WA",
    preferredWindow: "Specific Seattle flash slot",
    style: "flash",
    placement: "leg",
    sizeEstimate: "3-4 inches",
    budgetRange: "$250-$500",
    ideaSummary: bookingDrafts.booking_noa_flash.ideaSummary,
    status: "deposit_pending",
    readinessScore: scoreFor("booking_noa_flash"),
    createdAt: "2026-05-28T20:12:00-07:00",
    portfolioAttribution: "Black Sun Flash",
    depositEstimateCents: calculateDepositPolicy({ estimatedSessionHours: 1.5, city: "Seattle" }).depositAmountCents,
    notes: ["Deposit boundary not accepted in demo draft", "Good candidate for Flash Drop Booking"],
  },
];

export interface DashboardClientRow {
  id: string;
  preferredName: string;
  email: string;
  city: string;
  tags: string[];
  lifetimeValueCents: number;
  lastActivity: string;
  riskFlags: string[];
}

export const dashboardClients: DashboardClientRow[] = [
  { id: "client_ari", preferredName: "Ari M.", email: "ari@example.test", city: "Portland, OR", tags: ["blackwork", "repeat-interest"], lifetimeValueCents: 0, lastActivity: "New request submitted", riskFlags: [] },
  { id: "client_mina", preferredName: "Mina L.", email: "mina@example.test", city: "Oakland, CA", tags: ["fine-line", "needs-reference"], lifetimeValueCents: 55000, lastActivity: "More info requested", riskFlags: ["Missing reference image"] },
  { id: "client_jon", preferredName: "Jon R.", email: "jon@example.test", city: "San Diego, CA", tags: ["ornamental", "large-project"], lifetimeValueCents: 120000, lastActivity: "Accepted pending deposit", riskFlags: ["Placement conflict review"] },
  { id: "client_noa", preferredName: "Noa T.", email: "noa@example.test", city: "Seattle, WA", tags: ["flash", "short-notice"], lifetimeValueCents: 0, lastActivity: "Deposit requested", riskFlags: ["Deposit boundary not acknowledged"] },
];

export interface DashboardAppointmentRow {
  id: string;
  title: string;
  clientName: string;
  city: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: AppointmentStatus;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
}

export const dashboardAppointments: DashboardAppointmentRow[] = [
  { id: "appt_consult_jon", title: "Back piece consult", clientName: "Jon R.", city: "San Diego", startsAt: "2026-08-04T11:00:00-07:00", endsAt: "2026-08-04T11:45:00-07:00", timezone: "America/Los_Angeles", status: "tentative", bufferBeforeMinutes: 15, bufferAfterMinutes: 15 },
  { id: "appt_flash_noa", title: "Black Sun Flash", clientName: "Noa T.", city: "Seattle", startsAt: "2026-07-11T15:00:00-07:00", endsAt: "2026-07-11T17:00:00-07:00", timezone: "America/Los_Angeles", status: "confirmed", bufferBeforeMinutes: 30, bufferAfterMinutes: 30 },
  { id: "appt_healed_mina", title: "Healed photo follow-up", clientName: "Mina L.", city: "Oakland", startsAt: "2026-09-20T10:30:00-07:00", endsAt: "2026-09-20T11:00:00-07:00", timezone: "America/Los_Angeles", status: "tentative", bufferBeforeMinutes: 0, bufferAfterMinutes: 15 },
];

export const dashboardAvailabilityWindows: AvailabilityWindow[] = [
  {
    id: "avail_seattle_flash_0711",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    kind: "flash",
    status: "open",
    startsAt: "2026-07-11T11:00:00-07:00",
    endsAt: "2026-07-11T18:00:00-07:00",
    timezone: "America/Los_Angeles",
    maxBookings: 3,
    bufferBeforeMinutes: 30,
    bufferAfterMinutes: 30,
  },
  {
    id: "avail_sandiego_consults_0804",
    tenantId: inkrouteDemoTenant.id,
    artistId: inkrouteDemoArtist.id,
    kind: "consultation",
    status: "waitlist",
    startsAt: "2026-08-04T10:00:00-07:00",
    endsAt: "2026-08-04T14:00:00-07:00",
    timezone: "America/Los_Angeles",
    maxBookings: 4,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
  },
];

export const dashboardBusyBlocks: CalendarTimeBlock[] = dashboardAppointments.map((appointment) => ({
  id: appointment.id,
  title: appointment.title,
  startsAt: appointment.startsAt,
  endsAt: appointment.endsAt,
  timezone: appointment.timezone,
  source: "appointment",
  bufferBeforeMinutes: appointment.bufferBeforeMinutes,
  bufferAfterMinutes: appointment.bufferAfterMinutes,
  blocksBooking: true,
}));

export const dashboardAvailabilitySlots = dashboardAvailabilityWindows.flatMap((window) =>
  buildAvailabilitySlots({
    window,
    durationMinutes: window.kind === "flash" ? 120 : 45,
    stepMinutes: window.kind === "flash" ? 120 : 45,
    existingBlocks: dashboardBusyBlocks,
    maxSlots: 6,
  }),
);

export const dashboardCalendarConflictPreview = detectCalendarConflicts(
  {
    id: "candidate_seattle_flash_overlap",
    title: "Candidate Seattle flash slot",
    startsAt: "2026-07-11T14:30:00-07:00",
    endsAt: "2026-07-11T16:30:00-07:00",
    timezone: "America/Los_Angeles",
    source: "availability_hold",
    bufferBeforeMinutes: 30,
    bufferAfterMinutes: 30,
    blocksBooking: true,
  },
  dashboardBusyBlocks,
);

export const dashboardBufferedBlocks = dashboardBusyBlocks.map(applyBuffers);

export const dashboardGoogleEventDraft = appointmentToGoogleCalendarEventDraft({
  appointment: dashboardBusyBlocks[1]!,
  tenantId: inkrouteDemoTenant.id,
  bookingRequestId: "booking_noa_flash",
  clientEmail: "noa@example.test",
  location: "Guest Spot Studio, Seattle, WA",
});

export const dashboardGoogleFreeBusyDraft = buildGoogleFreeBusyRequestDraft({
  calendarIds: ["primary", "guest-spot-studio@example.test"],
  timeMin: "2026-07-10T00:00:00-07:00",
  timeMax: "2026-07-16T00:00:00-07:00",
  timezone: "America/Los_Angeles",
});

export const dashboardCalendarSyncPlans = [buildCalendarSyncPlan("internal"), buildCalendarSyncPlan("ics"), buildCalendarSyncPlan("google")];
export const dashboardTravelPublishPlans = demoTravelStops.map(buildTravelPublishPlan);
export const dashboardSignedIcsFeedDraft = buildSignedIcsFeedDraft({ tenantSlug: inkrouteDemoTenant.slug, artistSlug: inkrouteDemoArtist.slug });

export interface DashboardPaymentRow {
  id: string;
  clientName: string;
  bookingId: string;
  amountCents: number;
  status: PaymentStatus;
  provider: "stripe" | "manual";
  dueAt: string;
  policyReason: string;
  policyVersion: string;
  riskScore: number;
  decision: string;
  refundDecision: RefundDecision;
  noShowDecision: NoShowDecision;
  checkoutClientReferenceId: string;
  checkoutIdempotencyKey: string;
  receiptNumber: string;
}

export const dashboardPayments: DashboardPaymentRow[] = dashboardBookingRows.map((booking, index) => {
  const policy = calculateDepositPolicy({
    estimatedSessionHours: Math.max(1, booking.depositEstimateCents / 5000),
    city: booking.city,
    cityDemandScore: booking.city === "Seattle" ? 5 : 3,
    travelRiskTier: booking.city === "Seattle" ? "high_demand_guest_spot" : "standard_travel",
    appointmentType: booking.style === "flash" ? "flash" : booking.sizeEstimate.includes("sleeve") ? "large_scale" : "custom",
    clientNoShowCount: booking.clientName === "Jon R." ? 1 : 0,
  });
  const sessionDraft = buildStripeCheckoutSessionDraft({
    tenantId: inkrouteDemoTenant.id,
    bookingRequestId: booking.id,
    amountCents: policy.depositAmountCents,
    currency: policy.currency,
    successUrl: "https://example.test/booking/deposit/success",
    cancelUrl: "https://example.test/booking/deposit/cancel",
    clientEmail: booking.clientEmail,
    clientName: booking.clientName,
    artistDisplayName: inkrouteDemoArtist.displayName,
    description: `Deposit preview for ${booking.style} tattoo request`,
    policyVersion: policy.policyVersion,
  });
  const refund = evaluateRefundPolicy({
    amountPaidCents: policy.depositAmountCents,
    cancellationRequestedAt: "2026-07-08T10:00:00-07:00",
    appointmentStartsAt: "2026-07-11T15:00:00-07:00",
    nonRefundableWindowHours: policy.nonRefundableWindowHours,
    policyAllowsManualReview: true,
  });
  const noShow = evaluateNoShowPolicy({
    depositAmountCents: policy.depositAmountCents,
    appointmentStartsAt: "2026-07-11T15:00:00-07:00",
    markedAt: "2026-07-11T15:45:00-07:00",
    clientArrivedMinutesLate: booking.clientName === "Jon R." ? 45 : 0,
    clientContactedArtist: booking.clientName !== "Jon R.",
  });
  return {
    id: `deposit_${booking.id}`,
    clientName: booking.clientName,
    bookingId: booking.id,
    amountCents: policy.depositAmountCents,
    status: booking.status === "deposit_pending" ? "pending" : booking.status === "accepted" ? "not_required" : "pending",
    provider: "stripe",
    dueAt: "2026-06-07T12:00:00-07:00",
    policyReason: policy.reason,
    policyVersion: policy.policyVersion,
    riskScore: policy.riskScore,
    decision: policy.decision,
    refundDecision: refund.decision,
    noShowDecision: noShow.decision,
    checkoutClientReferenceId: sessionDraft.clientReferenceId,
    checkoutIdempotencyKey: sessionDraft.idempotencyKey,
    receiptNumber: generateReceiptNumber(inkrouteDemoTenant.slug, "2026-07-11T16:00:00-07:00", index + 1),
  };
});

export const dashboardWebhookPreview = [
  interpretStripeWebhook("checkout.session.completed"),
  interpretStripeWebhook("payment_intent.payment_failed"),
  interpretStripeWebhook("charge.dispute.created"),
];

export interface DashboardErrorRow {
  id: string;
  severity: ErrorSeverity;
  status: ErrorReportStatus;
  surface: "web" | "dashboard" | "mobile" | "api";
  title: string;
  affectedRoute: string;
  release: string;
  firstSeenAt: string;
  redactionStatus: string;
}

export const dashboardErrors: DashboardErrorRow[] = [
  { id: "err_001", severity: "high", status: "open", surface: "web", title: "Booking API fallback/provider follow-up evidence gated after validation", affectedRoute: "/api/public/inkroute-demo/booking-requests", release: "phase4-demo", firstSeenAt: "2026-06-01T20:00:00-07:00", redactionStatus: "No PII logged in demo" },
  { id: "err_002", severity: "medium", status: "triaged", surface: "dashboard", title: "Dashboard build not verified due missing dependencies", affectedRoute: "/dashboard/*", release: "phase5-demo", firstSeenAt: "2026-06-02T09:10:00-07:00", redactionStatus: "System-only gap" },
  { id: "err_003", severity: "medium", status: "open", surface: "mobile", title: "Expo app API client local contract awaits seeded smoke evidence", affectedRoute: "apps/mobile", release: "phase6-mobile-api", firstSeenAt: "2026-05-30T10:00:00-07:00", redactionStatus: "No device context captured; provider auth and device smoke remain gated" },
];

export interface DashboardTemplateRow {
  key: NotificationTemplateKey;
  channel: "email" | "sms" | "push" | "in_app";
  status: MessageStatus;
  preview: string;
  complianceNote: string;
}

const notificationContext = { artistName: inkrouteDemoArtist.displayName, clientName: "Ari", city: "Seattle", appointmentDate: "July 11, 2026", aftercareUrl: "/aftercare" };

export const dashboardTemplates: DashboardTemplateRow[] = [
  { key: "booking_request_received", channel: "email", status: "draft", preview: renderTemplateText("booking_request_received", notificationContext), complianceNote: "Provider delivery and unsubscribe footer proof remain evidence-gated" },
  { key: "deposit_request", channel: "sms", status: "draft", preview: renderTemplateText("deposit_request", notificationContext), complianceNote: "SMS consent, STOP handling, and provider logs required" },
  { key: "appointment_prep_72h", channel: "email", status: "draft", preview: renderTemplateText("appointment_prep_72h", notificationContext), complianceNote: "Artist-specific prep language must be reviewed" },
  { key: "aftercare_day_0", channel: "push", status: "draft", preview: renderTemplateText("aftercare_day_0", notificationContext), complianceNote: "Mobile push tokens and aftercare review remain runtime-evidence gated" },
  { key: "healed_photo_request_30d", channel: "email", status: "draft", preview: renderTemplateText("healed_photo_request_30d", notificationContext), complianceNote: "Private upload link required before production" },
];

export const dashboardFeatureFlags: FeatureFlag[] = [
  { key: "nomad_mode", enabled: true, description: "Show travel schedule and city availability controls", scope: "tenant" },
  { key: "flash_drop_booking", enabled: false, description: "Expose limited flash designs with bookable slots", scope: "tenant" },
  { key: "aftercare_automation", enabled: false, description: "Schedule aftercare check-ins after completed appointments", scope: "tenant" },
  { key: "portfolio_attribution", enabled: true, description: "Track portfolio-to-booking attribution", scope: "tenant" },
];

export interface DashboardReleaseRow {
  version: string;
  channel: string;
  status: string;
  notes: string;
  compatibility: string;
}

export const dashboardReleases: DashboardReleaseRow[] = [
  { version: "0.5.0-phase5", channel: "development", status: "control-plane", notes: "Dashboard read and mutation contracts added", compatibility: "Requires dependency install and Next.js build verification" },
  { version: "0.4.0-phase4", channel: "development", status: "runtime-gated", notes: "Booking flow and tenant-scoped API contract wired", compatibility: "Provider/database persistence proof remains gated" },
  { version: "0.3.0-phase3", channel: "development", status: "runtime-gated", notes: "Public website route contracts added", compatibility: "Provider-backed CMS/database content proof remains gated" },
];

export interface DashboardTimelineEvent {
  at: string;
  title: string;
  detail: string;
  actor: string;
}

export const clientTimeline: DashboardTimelineEvent[] = [
  { at: "2026-05-28", title: "Portfolio image viewed", detail: "Orbital Serpent attribution captured", actor: "system" },
  { at: "2026-05-29", title: "Booking request submitted", detail: "Structured intake captured with readiness score", actor: "client" },
  { at: "2026-05-30", title: "Artist note drafted", detail: "Needs placement confirmation before deposit", actor: "artist" },
  { at: "2026-06-01", title: "Deposit estimate calculated", detail: "Stripe Checkout readiness contract remains provider-evidence gated", actor: "system" },
];

export const dashboardSeoPages = [
  ...demoSeoCityPages.map((page) => ({ id: page.slug, type: "City", slug: page.slug, title: page.title, status: "published", canonicalPath: page.canonicalPath })),
  ...demoSeoStylePages.map((page) => ({ id: page.slug, type: "Style", slug: page.slug, title: page.title, status: "published", canonicalPath: page.canonicalPath })),
];

export const dashboardReviewQueue = demoTestimonials.map((review): { id: string; displayName: string; rating: number; status: ReviewStatus; quote: string } => ({
  id: review.id,
  displayName: review.displayName,
  rating: review.rating,
  status: "approved",
  quote: review.quote,
}));

export const dashboardPortfolio = demoPortfolioItems.map((item) => ({
  ...item,
  attributionCount: dashboardBookingRows.filter((booking) => booking.portfolioAttribution === item.title).length,
  needsAltTextReview: item.altText.length < 24,
}));

export const dashboardTravelIcsPreview = buildTravelScheduleIcs(`${inkrouteDemoArtist.displayName} travel`, demoTravelStops).split("\r\n").slice(0, 8);

export const bookingStatusActionSummary = bookingLifecycleTransitions.map((transition) => ({
  label: `${transition.from} → ${transition.to}`,
  action: transition.action,
  actor: transition.actor,
  requiresAudit: transition.requiresAudit,
}));

export const dashboardShellContext = {
  tenant: inkrouteDemoTenant,
  artist: inkrouteDemoArtist,
  authStatus: "Mocked owner session for local layout preview; real auth/session provider proof remains evidence-gated.",
};


export const dashboardNotificationConsent: ClientConsentSnapshot = {
  clientId: "client_ari",
  email: "ari@example.test",
  phone: "+15550101010",
  pushToken: "ExponentPushToken[demo-ari-token]",
  inAppUserId: "client_ari",
  emailOptIn: true,
  smsOptIn: true,
  pushOptIn: true,
  marketingOptIn: true,
  transactionalAllowed: true,
};

export const dashboardNotificationPlans = [
  buildDeliveryPlan({ key: "booking_request_accepted", context: notificationContext, consent: dashboardNotificationConsent }),
  buildDeliveryPlan({ key: "deposit_request", context: { ...notificationContext, depositUrl: "https://example.test/deposit/demo" }, consent: dashboardNotificationConsent }),
  buildDeliveryPlan({ key: "city_waitlist_opening", context: { ...notificationContext, bookingUrl: "https://example.test/cities/seattle-wa" }, consent: dashboardNotificationConsent }),
  buildDeliveryPlan({
    key: "flash_drop_announcement",
    context: { ...notificationContext, flashDropUrl: "https://example.test/flash/seattle-black-sun" },
    consent: { ...dashboardNotificationConsent, marketingOptIn: false, smsOptIn: false },
  }),
];

export const dashboardNotificationAutomationSequence = buildFullAutomationSequence();

export const dashboardProviderBoundaryMatrix = providerBoundaryMatrix;

const renderedDepositTemplate = renderTemplate("deposit_request", { ...notificationContext, depositUrl: "https://example.test/deposit/demo" });

export const dashboardProviderSendDrafts = [
  createProviderSendDraft({
    channel: "email",
    ...(dashboardNotificationConsent.email ? { destination: dashboardNotificationConsent.email } : {}),
    template: renderedDepositTemplate,
  }),
  createProviderSendDraft({
    channel: "sms",
    ...(dashboardNotificationConsent.phone ? { destination: dashboardNotificationConsent.phone } : {}),
    template: renderedDepositTemplate,
  }),
  createProviderSendDraft({
    channel: "push",
    ...(dashboardNotificationConsent.pushToken ? { destination: dashboardNotificationConsent.pushToken } : {}),
    template: renderedDepositTemplate,
  }),
];

export const dashboardDeliveryLogDrafts = [
  buildDeliveryLogDraft({ tenantId: inkrouteDemoTenant.id, clientId: "client_ari", notificationType: "booking_request_accepted", channel: "email", ...(dashboardNotificationConsent.email ? { destination: dashboardNotificationConsent.email } : {}), status: "queued" }),
  buildDeliveryLogDraft({ tenantId: inkrouteDemoTenant.id, clientId: "client_ari", notificationType: "deposit_request", channel: "sms", ...(dashboardNotificationConsent.phone ? { destination: dashboardNotificationConsent.phone } : {}), status: "queued" }),
  buildDeliveryLogDraft({ tenantId: inkrouteDemoTenant.id, clientId: "client_ari", notificationType: "aftercare_day_0", channel: "push", ...(dashboardNotificationConsent.pushToken ? { destination: dashboardNotificationConsent.pushToken } : {}), status: "queued" }),
];

export const dashboardProviderWebhookPreviews = [
  interpretEmailWebhook("email.delivered"),
  interpretSmsWebhook("message-status-delivered"),
  interpretSmsWebhook("inbound-message", "STOP"),
  interpretPushReceipt("ok"),
];

export const dashboardMessageThreadDrafts = [
  buildMessageThreadDraft({
    subject: "Placement clarification for Ari",
    body: "Can you confirm whether the serpent should wrap onto the inner forearm, or stay entirely on the outer panel?",
    relatedBookingRequestId: "booking_ari_serpent",
  }),
  buildMessageThreadDraft({
    subject: "Aftercare check-in draft",
    body: "Checking in on healing progress. Send a photo privately if anything looks unusual or if you want feedback.",
    relatedAppointmentId: "appt_flash_noa",
    status: "draft",
  }),
];

function redactDashboardRecord<TRecord extends object>(record: TRecord, overrides?: Partial<Record<keyof TRecord, unknown>>): TRecord {
  return {
    ...redactRecord(record as Record<string, unknown>),
    ...overrides,
  } as TRecord;
}

function projectDashboardDemoRows<TRecord extends { id: string }>(
  collection: DashboardDataCollection,
  records: readonly TRecord[],
  redactedFields?: readonly string[],
): TRecord[] {
  return buildTenantDashboardView({
    collection,
    tenantId: inkrouteDemoTenant.id,
    source: "demo-static",
    records: records.map((record) => ({ ...record, tenantId: inkrouteDemoTenant.id })),
    ...(redactedFields ? { redactedFields } : {}),
  }).records as TRecord[];
}

export const dashboardProjectedBookingRows = projectDashboardDemoRows("bookings", dashboardBookingRows, [
  "clientEmail",
  "clientPhone",
  "medicalNotes",
]);

export const dashboardProjectedClients = projectDashboardDemoRows("clients", dashboardClients, [
  "email",
  "phone",
  "medicalNotes",
  "privateNotes",
]);

export const dashboardProjectedPayments = projectDashboardDemoRows("payments", dashboardPayments, [
  "checkoutClientReferenceId",
  "checkoutIdempotencyKey",
  "stripePaymentIntentId",
  "providerSessionId",
]);

export const dashboardProjectedPortfolio = projectDashboardDemoRows("portfolio", dashboardPortfolio, [
  "attributionKey",
  "objectKey",
]);

export const dashboardRedactedProviderSendDrafts = dashboardProviderSendDrafts.map((draft) =>
  redactDashboardRecord(draft, {
    credentialEnvVar: "[redacted-provider-credential]",
  } as Partial<Record<keyof typeof draft, unknown>>),
);

function buildDashboardDemoDeliveryLogKey(index: number): string {
  return `delivery-log-preview:${createHash("sha256").update(String(index + 1)).digest("hex")}`;
}

export const dashboardRedactedDeliveryLogDrafts = dashboardDeliveryLogDrafts.map((log, index) =>
  redactDashboardRecord(log, {
    idempotencyKey: buildDashboardDemoDeliveryLogKey(index),
  } as Partial<Record<keyof typeof log, unknown>>),
);

export const dashboardRedactedProviderWebhookPreviews = dashboardProviderWebhookPreviews.map((event) =>
  redactDashboardRecord(event),
);

export const dashboardRedactedMessageThreadDrafts = dashboardMessageThreadDrafts.map((thread) =>
  redactDashboardRecord(thread, {
    bodyPreview: "[redacted-message-body]",
    piiRedactionNote: "Message body redacted before dashboard rendering; use persisted tenant-scoped thread APIs for live reads.",
  } as Partial<Record<keyof typeof thread, unknown>>),
);
