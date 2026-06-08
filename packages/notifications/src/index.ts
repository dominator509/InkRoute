import type { MessageChannel, MessageDirection, MessageStatus, NotificationChannel, NotificationStatus } from "@inkroute/types";

export type NotificationTemplateKey =
  | "booking_request_received"
  | "booking_request_needs_info"
  | "booking_request_accepted"
  | "booking_request_declined"
  | "deposit_request"
  | "deposit_paid_receipt"
  | "deposit_failed"
  | "appointment_confirmed"
  | "appointment_prep_72h"
  | "appointment_prep_24h"
  | "reschedule_notice"
  | "cancellation_notice"
  | "aftercare_day_0"
  | "aftercare_day_2"
  | "aftercare_day_7"
  | "aftercare_day_14"
  | "healed_photo_request_30d"
  | "healed_photo_request_90d"
  | "city_waitlist_opening"
  | "flash_drop_announcement"
  | "review_request";

export type NotificationAudience = "client" | "artist" | "assistant" | "studio_manager" | "system";
export type NotificationProvider = "resend" | "twilio" | "expo" | "in_app" | "system";
export type MessagePurpose = "transactional" | "marketing" | "support" | "system";
export type AutomationTrigger = "booking" | "deposit" | "appointment" | "aftercare" | "travel" | "review" | "manual";
export type DeliveryPlanStatus = "allowed" | "blocked" | "requires_provider" | "requires_destination" | "requires_review";

export interface NotificationTemplateContext {
  artistName: string;
  clientName: string;
  tenantName?: string;
  city?: string;
  studioName?: string;
  appointmentDate?: string;
  appointmentStartsAt?: string;
  depositUrl?: string;
  aftercareUrl?: string;
  bookingUrl?: string;
  portfolioUrl?: string;
  reviewUrl?: string;
  healedPhotoUploadUrl?: string;
  unsubscribeUrl?: string;
  flashDropUrl?: string;
  supportEmail?: string;
  policyUrl?: string;
}

export interface RenderedNotificationTemplate {
  key: NotificationTemplateKey;
  purpose: MessagePurpose;
  defaultChannels: NotificationChannel[];
  subject: string;
  body: string;
  smsBody: string;
  pushTitle: string;
  pushBody: string;
  complianceFooter: string;
  containsSensitiveContent: boolean;
  requiresHumanReview: boolean;
}

export interface ClientConsentSnapshot {
  clientId?: string;
  email?: string;
  phone?: string;
  pushToken?: string;
  inAppUserId?: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushOptIn: boolean;
  marketingOptIn: boolean;
  transactionalAllowed: boolean;
  unsubscribedAt?: string;
  smsStoppedAt?: string;
  pushDisabledAt?: string;
}

export interface DeliveryCandidate {
  channel: NotificationChannel;
  provider: NotificationProvider;
  destinationMasked?: string | undefined;
  status: DeliveryPlanStatus;
  reason: string;
}

export interface NotificationDeliveryPlan {
  template: RenderedNotificationTemplate;
  audience: NotificationAudience;
  purpose: MessagePurpose;
  candidates: DeliveryCandidate[];
  chosenChannels: NotificationChannel[];
  blockedChannels: DeliveryCandidate[];
  requiresProviderCredential: boolean;
  requiresAuditLog: boolean;
  complianceNotes: string[];
}

export interface NotificationSequenceStep {
  id: string;
  trigger: AutomationTrigger;
  templateKey: NotificationTemplateKey;
  audience: NotificationAudience;
  scheduledOffsetMinutes: number;
  recommendedChannels: NotificationChannel[];
  status: "draft" | "ready_to_queue" | "blocked";
  reason: string;
}

export interface DeliveryLogDraft {
  idempotencyKey: string;
  notificationType: NotificationTemplateKey;
  channel: NotificationChannel;
  provider: NotificationProvider;
  status: NotificationStatus;
  destinationHash: string;
  providerMessageId?: string | undefined;
  providerStatus?: string | undefined;
  redactionSummary: string;
  shouldWriteAuditLog: boolean;
}

export interface MessageThreadDraft {
  subject: string;
  channel: MessageChannel;
  direction: MessageDirection;
  status: MessageStatus;
  bodyPreview: string;
  relatedBookingRequestId?: string | undefined;
  relatedAppointmentId?: string | undefined;
  piiRedactionNote: string;
}

export interface ProviderSendDraft {
  provider: NotificationProvider;
  channel: NotificationChannel;
  credentialEnvVar: string;
  toMasked: string;
  payloadPreview: Record<string, string | boolean | number | undefined>;
  enabled: false;
  disabledReason: string;
}

export interface EmailProviderSendPlanInput {
  tenantId: string;
  notificationId: string;
  deliveryId: string;
  templateKey: NotificationTemplateKey;
  context: NotificationTemplateContext;
  consent: ClientConsentSnapshot;
  requestId: string;
  providerSdkInstalled: boolean;
  providerApiKeyConfigured: boolean;
  senderDomainVerified: boolean;
  unsubscribeFooterPresent: boolean;
  destinationSuppressed?: boolean;
  deliveryLogPersistenceAvailable: boolean;
}

export interface EmailProviderSendPlan {
  status: "ready" | "blocked";
  provider: "resend";
  channel: "email";
  tenantId: string;
  notificationId: string;
  deliveryId: string;
  toMasked: string | null;
  idempotencyKey: string;
  payloadPreview: {
    subject: string;
    bodyPreview: string;
    containsSensitiveContent: boolean;
    unsubscribeFooterPresent: boolean;
  };
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export interface SmsProviderSendPlanInput {
  tenantId: string;
  notificationId: string;
  deliveryId: string;
  templateKey: NotificationTemplateKey;
  context: NotificationTemplateContext;
  consent: ClientConsentSnapshot;
  requestId: string;
  providerSdkInstalled: boolean;
  accountSidConfigured: boolean;
  authTokenConfigured: boolean;
  messagingServiceConfigured: boolean;
  legalConsentCopyApproved: boolean;
  consentProofAvailable: boolean;
  quietHoursPolicyConfigured: boolean;
  withinQuietHours?: boolean;
  destinationSuppressed?: boolean;
  deliveryLogPersistenceAvailable: boolean;
}

export interface SmsProviderSendPlan {
  status: "ready" | "blocked";
  provider: "twilio";
  channel: "sms";
  tenantId: string;
  notificationId: string;
  deliveryId: string;
  toMasked: string | null;
  idempotencyKey: string;
  payloadPreview: {
    bodyPreview: string;
    purpose: MessagePurpose;
    requiresHumanReview: boolean;
  };
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export interface ProviderWebhookInterpretation {
  provider: NotificationProvider;
  eventType: string;
  normalizedStatus: NotificationStatus;
  shouldUpdateDeliveryLog: boolean;
  requiresSignatureVerification: boolean;
  requiresInboundMessageHandling: boolean;
  notes: string[];
}

export interface ProviderEventReconciliationInput {
  provider: NotificationProvider;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  inboundBody?: string;
  alreadyProcessedEventIds?: readonly string[];
}

export interface ProviderEventReconciliationPlan {
  provider: NotificationProvider;
  eventId: string;
  idempotencyKey: string;
  interpretation: ProviderWebhookInterpretation;
  shouldUpdateDeliveryLog: boolean;
  shouldSuppressDestination: boolean;
  shouldCreateInboundThread: boolean;
  shouldMarkPushTokenInactive: boolean;
  blockers: readonly string[];
  requiredChecks: readonly string[];
}

export const notificationTemplateCatalog: Record<NotificationTemplateKey, { purpose: MessagePurpose; defaultChannels: NotificationChannel[]; requiresHumanReview?: boolean; sensitive?: boolean }> = {
  booking_request_received: { purpose: "transactional", defaultChannels: ["email", "push", "in_app"] },
  booking_request_needs_info: { purpose: "transactional", defaultChannels: ["email", "sms", "push", "in_app"] },
  booking_request_accepted: { purpose: "transactional", defaultChannels: ["email", "sms", "push", "in_app"] },
  booking_request_declined: { purpose: "transactional", defaultChannels: ["email", "in_app"], requiresHumanReview: true },
  deposit_request: { purpose: "transactional", defaultChannels: ["email", "sms", "in_app"] },
  deposit_paid_receipt: { purpose: "transactional", defaultChannels: ["email", "in_app"] },
  deposit_failed: { purpose: "transactional", defaultChannels: ["email", "sms", "in_app"] },
  appointment_confirmed: { purpose: "transactional", defaultChannels: ["email", "sms", "push", "in_app"] },
  appointment_prep_72h: { purpose: "transactional", defaultChannels: ["email", "push"] },
  appointment_prep_24h: { purpose: "transactional", defaultChannels: ["sms", "push", "in_app"] },
  reschedule_notice: { purpose: "transactional", defaultChannels: ["email", "sms", "push", "in_app"] },
  cancellation_notice: { purpose: "transactional", defaultChannels: ["email", "sms", "in_app"], requiresHumanReview: true },
  aftercare_day_0: { purpose: "transactional", defaultChannels: ["email", "push", "in_app"], sensitive: true, requiresHumanReview: true },
  aftercare_day_2: { purpose: "transactional", defaultChannels: ["email", "push"] , sensitive: true, requiresHumanReview: true},
  aftercare_day_7: { purpose: "transactional", defaultChannels: ["email", "push"], sensitive: true, requiresHumanReview: true },
  aftercare_day_14: { purpose: "transactional", defaultChannels: ["email", "push"], sensitive: true, requiresHumanReview: true },
  healed_photo_request_30d: { purpose: "transactional", defaultChannels: ["email", "push", "in_app"] },
  healed_photo_request_90d: { purpose: "marketing", defaultChannels: ["email", "push"], requiresHumanReview: true },
  city_waitlist_opening: { purpose: "marketing", defaultChannels: ["email", "sms", "push"] },
  flash_drop_announcement: { purpose: "marketing", defaultChannels: ["email", "sms", "push"] },
  review_request: { purpose: "transactional", defaultChannels: ["email", "push", "in_app"] },
};

const DEFAULT_SUPPORT_EMAIL = "support@example.test";

function valueOrFallback(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

function compactText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function smsLimit(input: string): string {
  const compact = compactText(input);
  return compact.length > 280 ? `${compact.slice(0, 277)}...` : compact;
}

function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  if (!domain) return "email:masked";
  const visible = name.slice(0, 2) || "xx";
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";
  return `***-***-${last4}`;
}

function stableDestinationHash(destination: string | undefined): string {
  if (!destination) return "missing_destination";
  let hash = 0;
  for (let index = 0; index < destination.length; index += 1) {
    hash = (hash * 31 + destination.charCodeAt(index)) % 1_000_000_007;
  }
  return `masked_${hash.toString(16)}`;
}

export function maskDestination(channel: NotificationChannel, destination: string | undefined): string | undefined {
  if (!destination) return undefined;
  if (channel === "email") return maskEmail(destination);
  if (channel === "sms") return maskPhone(destination);
  if (channel === "push") return `push_${destination.slice(0, 6)}***`;
  return destination.slice(0, 18);
}

export function renderTemplate(key: NotificationTemplateKey, context: NotificationTemplateContext): RenderedNotificationTemplate;
export function renderTemplate(key: NotificationTemplateKey, context: NotificationTemplateContext, format: "body"): string;
export function renderTemplate(key: NotificationTemplateKey, context: NotificationTemplateContext, format?: "body"): RenderedNotificationTemplate | string {
  const artistName = valueOrFallback(context.artistName, "your artist");
  const clientName = valueOrFallback(context.clientName, "there");
  const city = valueOrFallback(context.city, "your selected city");
  const appointmentDate = valueOrFallback(context.appointmentDate ?? context.appointmentStartsAt, "your appointment date");
  const bookingUrl = valueOrFallback(context.bookingUrl, "booking link pending");
  const depositUrl = valueOrFallback(context.depositUrl, "deposit link pending");
  const aftercareUrl = valueOrFallback(context.aftercareUrl, "aftercare link pending");
  const uploadUrl = valueOrFallback(context.healedPhotoUploadUrl, "healed-photo upload link pending");
  const reviewUrl = valueOrFallback(context.reviewUrl, "review link pending");
  const unsubscribe = valueOrFallback(context.unsubscribeUrl, "unsubscribe link pending");
  const support = valueOrFallback(context.supportEmail, DEFAULT_SUPPORT_EMAIL);

  const templates: Record<NotificationTemplateKey, Omit<RenderedNotificationTemplate, "key" | "purpose" | "defaultChannels" | "containsSensitiveContent" | "requiresHumanReview">> = {
    booking_request_received: {
      subject: `${artistName} received your tattoo request`,
      body: `Thanks ${clientName}. ${artistName} received your tattoo request and will review the idea, placement, timing, and references soon. You can review your request here: ${bookingUrl}.`,
      smsBody: `Thanks ${clientName}. ${artistName} received your tattoo request and will review it soon.`,
      pushTitle: "Booking request received",
      pushBody: `${artistName} will review your request soon.`,
      complianceFooter: `Questions? Contact ${support}.`,
    },
    booking_request_needs_info: {
      subject: `${artistName} needs a little more info`,
      body: `${clientName}, ${artistName} needs a bit more detail before reviewing your tattoo request. Add placement, size, references, or schedule notes here: ${bookingUrl}.`,
      smsBody: `${artistName} needs more info before reviewing your request. Check your InkRoute link: ${bookingUrl}`,
      pushTitle: "More info needed",
      pushBody: "Add missing booking details so your artist can review.",
      complianceFooter: `Transactional booking update. Contact ${support} for help.`,
    },
    booking_request_accepted: {
      subject: `${artistName} accepted your tattoo request`,
      body: `${clientName}, your request with ${artistName} has been accepted for ${city}. Next steps: review the deposit policy, confirm timing, and watch for final appointment details.`,
      smsBody: `${clientName}, ${artistName} accepted your tattoo request for ${city}. Watch for deposit and scheduling details.`,
      pushTitle: "Request accepted",
      pushBody: `Next steps are ready for ${city}.`,
      complianceFooter: `Deposits and appointment policies are subject to the artist's posted terms.`,
    },
    booking_request_declined: {
      subject: `Update on your tattoo request`,
      body: `${clientName}, ${artistName} reviewed your request and is not able to take it on right now. This can happen because of fit, timing, travel schedule, or project scope.`,
      smsBody: `${artistName} sent an update on your tattoo request. Please check your InkRoute message thread.`,
      pushTitle: "Booking request update",
      pushBody: "Your artist sent an update on your request.",
      complianceFooter: `This message should be reviewed by the artist before sending.`,
    },
    deposit_request: {
      subject: `Deposit requested for your ${artistName} appointment`,
      body: `${clientName}, secure your appointment request with ${artistName} using this deposit link: ${depositUrl}. Review cancellation/no-show policies before paying.`,
      smsBody: `${artistName} sent your deposit link: ${depositUrl}. Review policy before paying.`,
      pushTitle: "Deposit requested",
      pushBody: "Secure your appointment request after reviewing policy.",
      complianceFooter: `Payment links must be generated by Stripe in production.`,
    },
    deposit_paid_receipt: {
      subject: `Deposit receipt for ${artistName}`,
      body: `Thanks ${clientName}. Your deposit for ${artistName} has been recorded. Your appointment request will move toward scheduling after artist confirmation.`,
      smsBody: `Deposit received for ${artistName}. Watch for final scheduling details.`,
      pushTitle: "Deposit received",
      pushBody: "Your request is moving toward scheduling.",
      complianceFooter: `Receipt delivery and tax language require production payment records.`,
    },
    deposit_failed: {
      subject: `Deposit payment issue`,
      body: `${clientName}, your deposit payment for ${artistName} was not completed. Use the payment link again or contact ${support}.`,
      smsBody: `Deposit payment was not completed. Try again or contact ${support}.`,
      pushTitle: "Deposit issue",
      pushBody: "Your deposit payment was not completed.",
      complianceFooter: `Do not send raw card or payment details by message.`,
    },
    appointment_confirmed: {
      subject: `Appointment confirmed with ${artistName}`,
      body: `${clientName}, your appointment with ${artistName} is confirmed for ${appointmentDate} in ${city}. Review prep instructions and policies before arriving.`,
      smsBody: `Confirmed: ${artistName} appointment ${appointmentDate} in ${city}. Review prep instructions.`,
      pushTitle: "Appointment confirmed",
      pushBody: `${appointmentDate} in ${city}.`,
      complianceFooter: `Calendar holds must be verified before this message sends in production.`,
    },
    appointment_prep_72h: {
      subject: `Prep for your ${artistName} tattoo appointment`,
      body: `${clientName}, your appointment with ${artistName} is coming up on ${appointmentDate}. Hydrate, eat well, avoid alcohol, bring ID, and review any artist-specific prep notes.`,
      smsBody: `Prep reminder: hydrate, eat well, avoid alcohol, bring ID, and review notes for ${appointmentDate}.`,
      pushTitle: "Appointment prep",
      pushBody: "Hydrate, eat, bring ID, and review prep notes.",
      complianceFooter: `Artist-specific prep language should be reviewed before automation.`,
    },
    appointment_prep_24h: {
      subject: `Tomorrow's tattoo appointment with ${artistName}`,
      body: `${clientName}, reminder: your appointment with ${artistName} is ${appointmentDate}. Confirm travel time, eat beforehand, and avoid alcohol or blood-thinning substances unless medically directed.`,
      smsBody: `Reminder: ${artistName} appointment ${appointmentDate}. Eat beforehand, hydrate, bring ID.`,
      pushTitle: "Appointment tomorrow",
      pushBody: "Confirm travel time, eat beforehand, and bring ID.",
      complianceFooter: `Medical wording requires review before production use.`,
    },
    reschedule_notice: {
      subject: `Schedule update needed`,
      body: `${clientName}, your appointment with ${artistName} needs a schedule update. Please review available options or reply in your InkRoute message thread.`,
      smsBody: `${artistName} needs to update your appointment schedule. Please check InkRoute.`,
      pushTitle: "Schedule update",
      pushBody: "Review reschedule options in InkRoute.",
      complianceFooter: `Reschedule windows must match published policy.`,
    },
    cancellation_notice: {
      subject: `Appointment cancellation notice`,
      body: `${clientName}, your appointment with ${artistName} has been cancelled. Review policy terms and contact ${support} with questions.`,
      smsBody: `Your ${artistName} appointment was cancelled. Check InkRoute for policy details.`,
      pushTitle: "Appointment cancelled",
      pushBody: "Review policy details in InkRoute.",
      complianceFooter: `Cancellation/refund language must be attorney-reviewed before production.`,
    },
    aftercare_day_0: {
      subject: `Aftercare starts now`,
      body: `${clientName}, your tattoo aftercare starts now. Follow ${artistName}'s final instructions, keep the area clean, and review general aftercare here: ${aftercareUrl}.`,
      smsBody: `Aftercare starts now. Follow ${artistName}'s instructions and review ${aftercareUrl}.`,
      pushTitle: "Aftercare starts now",
      pushBody: "Follow artist instructions and keep the area clean.",
      complianceFooter: `Aftercare messages are educational and require artist/legal review.`,
    },
    aftercare_day_2: {
      subject: `Two-day tattoo aftercare check-in`,
      body: `${clientName}, two-day check-in: keep following ${artistName}'s aftercare instructions. If anything feels unusual, contact the artist or a qualified medical professional as appropriate.`,
      smsBody: `Aftercare check-in: keep following instructions. Contact the artist if you have concerns.`,
      pushTitle: "Aftercare check-in",
      pushBody: "Keep following instructions and monitor healing.",
      complianceFooter: `Medical guidance must be reviewed; do not diagnose in automated messages.`,
    },
    aftercare_day_7: {
      subject: `One-week tattoo aftercare check-in`,
      body: `${clientName}, one-week check-in: keep monitoring healing, avoid soaking and sun exposure, and contact ${artistName} if you have concerns.`,
      smsBody: `One-week aftercare check-in: monitor healing and avoid soaking/sun exposure.`,
      pushTitle: "One-week aftercare",
      pushBody: "Monitor healing and avoid soaking or sun exposure.",
      complianceFooter: `Aftercare automation must be opt-out aware and artist-reviewed.`,
    },
    aftercare_day_14: {
      subject: `Two-week tattoo aftercare check-in`,
      body: `${clientName}, two-week check-in: continue gentle care while the tattoo settles. ${artistName} may request healed photos later for portfolio and quality tracking.`,
      smsBody: `Two-week aftercare check-in: continue gentle care while the tattoo settles.`,
      pushTitle: "Two-week aftercare",
      pushBody: "Continue gentle care while the tattoo settles.",
      complianceFooter: `Photo use requires explicit permission before publication.`,
    },
    healed_photo_request_30d: {
      subject: `${artistName} would love a healed photo`,
      body: `${clientName}, if your tattoo is healed enough, ${artistName} would appreciate a healed photo for quality tracking. Upload privately here: ${uploadUrl}.`,
      smsBody: `${artistName} would appreciate a healed photo if ready: ${uploadUrl}.`,
      pushTitle: "Healed photo request",
      pushBody: "Upload a private healed photo when ready.",
      complianceFooter: `Private upload links must be signed and permission-gated.`,
    },
    healed_photo_request_90d: {
      subject: `Final healed photo check-in`,
      body: `${clientName}, ${artistName} is checking in one more time for a settled healed photo. Upload privately here: ${uploadUrl}.`,
      smsBody: `${artistName} is checking in for a healed photo: ${uploadUrl}.`,
      pushTitle: "Healed photo check-in",
      pushBody: "Share a private healed photo if you want to.",
      complianceFooter: `Marketing/photo-use opt-in must be honored. Unsubscribe: ${unsubscribe}.`,
    },
    city_waitlist_opening: {
      subject: `${artistName} has ${city} availability`,
      body: `${clientName}, ${artistName} opened tattoo availability in ${city}. Review the travel stop and request a slot here: ${bookingUrl}.`,
      smsBody: `${artistName} opened ${city} availability: ${bookingUrl}. Reply STOP to opt out.`,
      pushTitle: `${city} availability open`,
      pushBody: `${artistName} has new travel availability.`,
      complianceFooter: `Marketing opt-in and city waitlist consent required. Unsubscribe: ${unsubscribe}.`,
    },
    flash_drop_announcement: {
      subject: `${artistName} flash drop is live`,
      body: `${clientName}, ${artistName} released limited flash availability. View designs and request a slot here: ${valueOrFallback(context.flashDropUrl, bookingUrl)}.`,
      smsBody: `${artistName} flash drop is live: ${valueOrFallback(context.flashDropUrl, bookingUrl)}. Reply STOP to opt out.`,
      pushTitle: "Flash drop live",
      pushBody: "Limited designs and slots are available.",
      complianceFooter: `Marketing opt-in required. Unsubscribe: ${unsubscribe}.`,
    },
    review_request: {
      subject: `How was your tattoo experience?`,
      body: `${clientName}, ${artistName} would appreciate a review when you have a moment: ${reviewUrl}. Your feedback helps future clients understand the experience.`,
      smsBody: `${artistName} would appreciate a review: ${reviewUrl}.`,
      pushTitle: "Review request",
      pushBody: "Share feedback about your tattoo experience.",
      complianceFooter: `Review requests must follow platform and consent policies.`,
    },
  };

  const catalog = notificationTemplateCatalog[key];
  const rendered: RenderedNotificationTemplate = {
    key,
    purpose: catalog.purpose,
    defaultChannels: catalog.defaultChannels,
    subject: templates[key].subject,
    body: compactText(templates[key].body),
    smsBody: smsLimit(templates[key].smsBody),
    pushTitle: templates[key].pushTitle,
    pushBody: smsLimit(templates[key].pushBody),
    complianceFooter: templates[key].complianceFooter,
    containsSensitiveContent: catalog.sensitive ?? false,
    requiresHumanReview: catalog.requiresHumanReview ?? false,
  };

  if (format === "body") return rendered.body;
  return rendered;
}

export function renderTemplateText(key: NotificationTemplateKey, context: NotificationTemplateContext): string {
  return renderTemplate(key, context, "body");
}

function destinationForChannel(consent: ClientConsentSnapshot, channel: NotificationChannel): string | undefined {
  if (channel === "email") return consent.email;
  if (channel === "sms") return consent.phone;
  if (channel === "push") return consent.pushToken;
  return consent.inAppUserId ?? consent.clientId;
}

function providerForChannel(channel: NotificationChannel): NotificationProvider {
  if (channel === "email") return "resend";
  if (channel === "sms") return "twilio";
  if (channel === "push") return "expo";
  return "in_app";
}

export function evaluateConsentForChannel(params: {
  channel: NotificationChannel;
  purpose: MessagePurpose;
  consent: ClientConsentSnapshot;
}): { allowed: boolean; reason: string } {
  const { channel, purpose, consent } = params;

  if (channel === "in_app") {
    return destinationForChannel(consent, channel) ? { allowed: true, reason: "In-app delivery is available for this client." } : { allowed: false, reason: "No in-app client/user destination is available." };
  }

  if (purpose === "transactional") {
    if (!consent.transactionalAllowed) return { allowed: false, reason: "Transactional delivery is disabled for this client." };
    if (channel === "email") return consent.email ? { allowed: true, reason: "Transactional email allowed." } : { allowed: false, reason: "Client email is missing." };
    if (channel === "sms") {
      if (!consent.phone) return { allowed: false, reason: "Client phone is missing." };
      if (consent.smsStoppedAt) return { allowed: false, reason: "Client has sent STOP or disabled SMS." };
      return consent.smsOptIn ? { allowed: true, reason: "Transactional SMS allowed with SMS opt-in." } : { allowed: false, reason: "SMS opt-in missing." };
    }
    if (channel === "push") {
      if (!consent.pushToken) return { allowed: false, reason: "Push token is missing." };
      if (consent.pushDisabledAt) return { allowed: false, reason: "Client disabled push notifications." };
      return consent.pushOptIn ? { allowed: true, reason: "Transactional push allowed." } : { allowed: false, reason: "Push opt-in missing." };
    }
  }

  if (purpose === "marketing") {
    if (consent.unsubscribedAt) return { allowed: false, reason: "Client unsubscribed from marketing." };
    if (!consent.marketingOptIn) return { allowed: false, reason: "Marketing opt-in missing." };
    if (channel === "email") return consent.emailOptIn && consent.email ? { allowed: true, reason: "Marketing email allowed." } : { allowed: false, reason: "Email marketing opt-in or destination missing." };
    if (channel === "sms") {
      if (consent.smsStoppedAt) return { allowed: false, reason: "Client has sent STOP or disabled SMS." };
      return consent.smsOptIn && Boolean(consent.phone) ? { allowed: true, reason: "Marketing SMS allowed." } : { allowed: false, reason: "SMS marketing opt-in or phone missing." };
    }
    if (channel === "push") return consent.pushOptIn && Boolean(consent.pushToken) ? { allowed: true, reason: "Marketing push allowed." } : { allowed: false, reason: "Push marketing opt-in or token missing." };
  }

  return { allowed: false, reason: "Unsupported channel/purpose combination." };
}

export function buildDeliveryPlan(params: {
  key: NotificationTemplateKey;
  context: NotificationTemplateContext;
  consent: ClientConsentSnapshot;
  audience?: NotificationAudience;
  channels?: NotificationChannel[];
}): NotificationDeliveryPlan {
  const template = renderTemplate(params.key, params.context);
  const channels = params.channels ?? template.defaultChannels;
  const candidates = channels.map((channel): DeliveryCandidate => {
    const destination = destinationForChannel(params.consent, channel);
    if (!destination) {
      return { channel, provider: providerForChannel(channel), status: "requires_destination", reason: "Destination missing for this channel." };
    }
    const consent = evaluateConsentForChannel({ channel, purpose: template.purpose, consent: params.consent });
    if (!consent.allowed) {
      return { channel, provider: providerForChannel(channel), destinationMasked: maskDestination(channel, destination), status: "blocked", reason: consent.reason };
    }
    if (channel !== "in_app") {
      return { channel, provider: providerForChannel(channel), destinationMasked: maskDestination(channel, destination), status: "requires_provider", reason: `${providerForChannel(channel)} credentials and delivery worker are required.` };
    }
    return { channel, provider: "in_app", destinationMasked: maskDestination(channel, destination), status: "allowed", reason: consent.reason };
  });

  return {
    template,
    audience: params.audience ?? "client",
    purpose: template.purpose,
    candidates,
    chosenChannels: candidates.filter((candidate) => candidate.status === "allowed" || candidate.status === "requires_provider").map((candidate) => candidate.channel),
    blockedChannels: candidates.filter((candidate) => candidate.status === "blocked" || candidate.status === "requires_destination"),
    requiresProviderCredential: candidates.some((candidate) => candidate.status === "requires_provider"),
    requiresAuditLog: template.purpose === "transactional" || template.containsSensitiveContent,
    complianceNotes: [
      template.complianceFooter,
      template.requiresHumanReview ? "Human review required before this automation can be enabled." : "Template can be queued after provider, consent, and audit controls are implemented.",
      template.purpose === "marketing" ? "Marketing delivery must honor unsubscribe, STOP, and audience segmentation." : "Transactional delivery still requires opt-out and destination checks.",
    ],
  };
}

export function buildDeliveryLogDraft(params: {
  notificationType: NotificationTemplateKey;
  channel: NotificationChannel;
  destination?: string;
  status?: NotificationStatus;
  providerMessageId?: string | undefined;
  providerStatus?: string | undefined;
  tenantId: string;
  clientId?: string;
}): DeliveryLogDraft {
  const provider = providerForChannel(params.channel);
  return {
    idempotencyKey: `${params.tenantId}:${params.clientId ?? "unknown_client"}:${params.notificationType}:${params.channel}`,
    notificationType: params.notificationType,
    channel: params.channel,
    provider,
    status: params.status ?? "queued",
    destinationHash: stableDestinationHash(params.destination),
    providerMessageId: params.providerMessageId,
    providerStatus: params.providerStatus,
    redactionSummary: "Destination is hashed/masked; body content should not be logged in production.",
    shouldWriteAuditLog: notificationTemplateCatalog[params.notificationType].purpose === "transactional",
  };
}

function sequenceStep(params: Omit<NotificationSequenceStep, "id">): NotificationSequenceStep {
  return {
    id: `${params.trigger}_${params.templateKey}_${params.scheduledOffsetMinutes}`,
    ...params,
  };
}

export function buildBookingNotificationSequence(): NotificationSequenceStep[] {
  return [
    sequenceStep({ trigger: "booking", templateKey: "booking_request_received", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "push", "in_app"], status: "ready_to_queue", reason: "Send after a booking request is persisted." }),
    sequenceStep({ trigger: "booking", templateKey: "booking_request_needs_info", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push", "in_app"], status: "ready_to_queue", reason: "Send when artist marks request as needs_info." }),
    sequenceStep({ trigger: "booking", templateKey: "booking_request_accepted", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push", "in_app"], status: "ready_to_queue", reason: "Send after accepted state event and before deposit request." }),
    sequenceStep({ trigger: "deposit", templateKey: "deposit_request", audience: "client", scheduledOffsetMinutes: 10, recommendedChannels: ["email", "sms", "in_app"], status: "blocked", reason: "Requires Stripe Checkout URL and deposit persistence." }),
  ];
}

export function buildAppointmentNotificationSequence(): NotificationSequenceStep[] {
  return [
    sequenceStep({ trigger: "appointment", templateKey: "appointment_confirmed", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push", "in_app"], status: "blocked", reason: "Requires persisted appointment and calendar hold." }),
    sequenceStep({ trigger: "appointment", templateKey: "appointment_prep_72h", audience: "client", scheduledOffsetMinutes: -4320, recommendedChannels: ["email", "push"], status: "ready_to_queue", reason: "Queue 72 hours before appointment after policy review." }),
    sequenceStep({ trigger: "appointment", templateKey: "appointment_prep_24h", audience: "client", scheduledOffsetMinutes: -1440, recommendedChannels: ["sms", "push", "in_app"], status: "ready_to_queue", reason: "Queue 24 hours before appointment with SMS opt-in." }),
    sequenceStep({ trigger: "appointment", templateKey: "reschedule_notice", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push", "in_app"], status: "ready_to_queue", reason: "Send when reschedule state is created." }),
  ];
}

export function buildAftercareSequence(): NotificationSequenceStep[] {
  return [
    sequenceStep({ trigger: "aftercare", templateKey: "aftercare_day_0", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "push", "in_app"], status: "blocked", reason: "Requires artist/legal aftercare review before automation." }),
    sequenceStep({ trigger: "aftercare", templateKey: "aftercare_day_2", audience: "client", scheduledOffsetMinutes: 2880, recommendedChannels: ["email", "push"], status: "blocked", reason: "Requires aftercare content review and opt-out handling." }),
    sequenceStep({ trigger: "aftercare", templateKey: "aftercare_day_7", audience: "client", scheduledOffsetMinutes: 10080, recommendedChannels: ["email", "push"], status: "blocked", reason: "Requires aftercare content review and opt-out handling." }),
    sequenceStep({ trigger: "aftercare", templateKey: "aftercare_day_14", audience: "client", scheduledOffsetMinutes: 20160, recommendedChannels: ["email", "push"], status: "blocked", reason: "Requires aftercare content review and opt-out handling." }),
    sequenceStep({ trigger: "aftercare", templateKey: "healed_photo_request_30d", audience: "client", scheduledOffsetMinutes: 43200, recommendedChannels: ["email", "push", "in_app"], status: "blocked", reason: "Requires private signed upload link before sending." }),
  ];
}

export function buildTravelMarketingSequence(): NotificationSequenceStep[] {
  return [
    sequenceStep({ trigger: "travel", templateKey: "city_waitlist_opening", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push"], status: "blocked", reason: "Requires city waitlist consent filtering and unsubscribe enforcement." }),
    sequenceStep({ trigger: "travel", templateKey: "flash_drop_announcement", audience: "client", scheduledOffsetMinutes: 0, recommendedChannels: ["email", "sms", "push"], status: "blocked", reason: "Requires marketing opt-in and flash drop public page." }),
  ];
}

export function buildFullAutomationSequence(): NotificationSequenceStep[] {
  return [...buildBookingNotificationSequence(), ...buildAppointmentNotificationSequence(), ...buildAftercareSequence(), ...buildTravelMarketingSequence(), sequenceStep({ trigger: "review", templateKey: "review_request", audience: "client", scheduledOffsetMinutes: 10080, recommendedChannels: ["email", "push", "in_app"], status: "ready_to_queue", reason: "Send one week after completed appointment if reviews are enabled." })];
}

export function createProviderSendDraft(params: {
  channel: NotificationChannel;
  destination?: string;
  template: RenderedNotificationTemplate;
}): ProviderSendDraft {
  const provider = providerForChannel(params.channel);
  const credentialEnvVar = provider === "resend" ? "RESEND_API_KEY" : provider === "twilio" ? "TWILIO_AUTH_TOKEN" : provider === "expo" ? "EXPO_ACCESS_TOKEN" : "IN_APP_DELIVERY_WORKER";
  const payloadPreview: Record<string, string | boolean | number | undefined> = {
    subject: params.channel === "email" ? params.template.subject : undefined,
    body: params.channel === "email" ? params.template.body : params.channel === "sms" ? params.template.smsBody : params.template.pushBody,
    pushTitle: params.channel === "push" ? params.template.pushTitle : undefined,
    containsSensitiveContent: params.template.containsSensitiveContent,
    requiresHumanReview: params.template.requiresHumanReview,
  };

  return {
    provider,
    channel: params.channel,
    credentialEnvVar,
    toMasked: maskDestination(params.channel, params.destination) ?? "missing destination",
    payloadPreview,
    enabled: false,
    disabledReason: "Provider SDK, credentials, worker queue, delivery logs, and opt-out enforcement are not wired in this scaffold.",
  };
}

export function buildEmailProviderSendPlan(input: EmailProviderSendPlanInput): EmailProviderSendPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before email delivery.");
  if (!input.notificationId.trim()) blockers.push("Notification id is required before email delivery.");
  if (!input.deliveryId.trim()) blockers.push("Notification delivery id is required before email delivery.");
  if (!input.requestId.trim()) blockers.push("Request id is required for email delivery traceability.");
  if (!input.providerSdkInstalled) blockers.push("Email provider SDK must be installed before sending.");
  if (!input.providerApiKeyConfigured) blockers.push("Email provider API key must be configured in a secret store before sending.");
  if (!input.senderDomainVerified) blockers.push("Email sender domain must be verified before sending.");
  if (!input.unsubscribeFooterPresent) blockers.push("Email messages must include an unsubscribe or preference footer before sending.");
  if (input.destinationSuppressed) blockers.push("Email destination is suppressed and must not be sent.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available before provider send.");

  const delivery = buildDeliveryPlan({
    key: input.templateKey,
    context: input.context,
    consent: input.consent,
    audience: "client",
  });
  const emailCandidate = delivery.candidates.find((candidate) => candidate.channel === "email");
  if (!emailCandidate || emailCandidate.status === "blocked" || emailCandidate.status === "requires_destination") {
    blockers.push(emailCandidate?.reason ?? "Email delivery candidate is unavailable.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "resend",
    channel: "email",
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    deliveryId: input.deliveryId,
    toMasked: input.consent.email ? maskDestination("email", input.consent.email) ?? null : null,
    idempotencyKey: `email-send:${input.tenantId}:${input.deliveryId}:${input.requestId}`,
    payloadPreview: {
      subject: delivery.template.subject,
      bodyPreview: compactText(delivery.template.body).slice(0, 180),
      containsSensitiveContent: delivery.template.containsSensitiveContent,
      unsubscribeFooterPresent: input.unsubscribeFooterPresent,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "AuditLog", "IdempotencyKey"],
    requiredControls: [
      "Persist queued NotificationDelivery before provider send and final provider status after send.",
      "Use provider idempotency/request metadata to prevent duplicate sends.",
      "Check bounce, complaint, unsubscribe, and tenant suppression lists immediately before send.",
      "Include unsubscribe or preference-center footer on every email.",
      "Store only masked destination and redacted body preview in logs.",
      "Verify provider webhook signatures before reconciling delivered, bounced, or complained events.",
    ],
    blockers,
  };
}

export function buildSmsProviderSendPlan(input: SmsProviderSendPlanInput): SmsProviderSendPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before SMS delivery.");
  if (!input.notificationId.trim()) blockers.push("Notification id is required before SMS delivery.");
  if (!input.deliveryId.trim()) blockers.push("Notification delivery id is required before SMS delivery.");
  if (!input.requestId.trim()) blockers.push("Request id is required for SMS delivery traceability.");
  if (!input.providerSdkInstalled) blockers.push("SMS provider SDK must be installed before sending.");
  if (!input.accountSidConfigured) blockers.push("Twilio account SID must be configured in a secret store before sending.");
  if (!input.authTokenConfigured) blockers.push("Twilio auth token must be configured in a secret store before sending.");
  if (!input.messagingServiceConfigured) blockers.push("Twilio messaging service SID must be configured before sending.");
  if (!input.legalConsentCopyApproved) blockers.push("SMS consent and compliance copy must be legal-approved before sending.");
  if (!input.consentProofAvailable) blockers.push("SMS delivery requires stored consent proof for this destination.");
  if (!input.quietHoursPolicyConfigured) blockers.push("SMS quiet-hours policy must be configured before sending.");
  if (input.withinQuietHours) blockers.push("SMS delivery is inside quiet hours and must be delayed.");
  if (input.destinationSuppressed || input.consent.smsStoppedAt) blockers.push("SMS destination is suppressed by STOP/unsubscribe state and must not be sent.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available before SMS provider send.");

  const delivery = buildDeliveryPlan({
    key: input.templateKey,
    context: input.context,
    consent: input.consent,
    audience: "client",
  });
  const smsCandidate = delivery.candidates.find((candidate) => candidate.channel === "sms");
  if (!smsCandidate || smsCandidate.status === "blocked" || smsCandidate.status === "requires_destination") {
    blockers.push(smsCandidate?.reason ?? "SMS delivery candidate is unavailable.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "twilio",
    channel: "sms",
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    deliveryId: input.deliveryId,
    toMasked: input.consent.phone ? maskDestination("sms", input.consent.phone) ?? null : null,
    idempotencyKey: `sms-send:${input.tenantId}:${input.deliveryId}:${input.requestId}`,
    payloadPreview: {
      bodyPreview: smsLimit(delivery.template.smsBody),
      purpose: delivery.template.purpose,
      requiresHumanReview: delivery.template.requiresHumanReview,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "ConsentSnapshot", "AuditLog", "IdempotencyKey"],
    requiredControls: [
      "Persist queued NotificationDelivery before provider send and final Twilio status after send.",
      "Use request idempotency metadata to prevent duplicate SMS sends.",
      "Check STOP, unsubscribe, consent proof, and tenant suppression state immediately before send.",
      "Apply tenant quiet-hours policy before Twilio API calls.",
      "Store only masked phone numbers and redacted SMS body previews in logs.",
      "Verify Twilio webhook signatures before reconciling delivered, failed, STOP, START, or HELP events.",
    ],
    blockers,
  };
}

export function buildMessageThreadDraft(params: {
  subject: string;
  body: string;
  channel?: MessageChannel;
  direction?: MessageDirection;
  status?: MessageStatus;
  relatedBookingRequestId?: string | undefined;
  relatedAppointmentId?: string | undefined;
}): MessageThreadDraft {
  return {
    subject: params.subject,
    channel: params.channel ?? "in_app",
    direction: params.direction ?? "outbound",
    status: params.status ?? "draft",
    bodyPreview: compactText(params.body).slice(0, 240),
    relatedBookingRequestId: params.relatedBookingRequestId,
    relatedAppointmentId: params.relatedAppointmentId,
    piiRedactionNote: "Thread previews should exclude medical notes, payment details, file URLs, and full client contact data from logs.",
  };
}

export function interpretEmailWebhook(eventType: string): ProviderWebhookInterpretation {
  const normalized = eventType.toLowerCase();
  const status: NotificationStatus = normalized.includes("delivered") ? "delivered" : normalized.includes("bounce") || normalized.includes("complaint") || normalized.includes("failed") ? "failed" : normalized.includes("sent") ? "sent" : "queued";
  return {
    provider: "resend",
    eventType,
    normalizedStatus: status,
    shouldUpdateDeliveryLog: true,
    requiresSignatureVerification: true,
    requiresInboundMessageHandling: false,
    notes: ["Verify provider signature before updating delivery logs.", "Do not store full email body in webhook logs."],
  };
}

export function interpretSmsWebhook(eventType: string, inboundBody?: string): ProviderWebhookInterpretation {
  const normalized = eventType.toLowerCase();
  const inbound = Boolean(inboundBody);
  const stopped = inboundBody?.trim().toLowerCase() === "stop";
  const status: NotificationStatus = normalized.includes("delivered") ? "delivered" : normalized.includes("failed") || normalized.includes("undelivered") ? "failed" : normalized.includes("sent") ? "sent" : "queued";
  return {
    provider: "twilio",
    eventType,
    normalizedStatus: status,
    shouldUpdateDeliveryLog: !inbound || !stopped,
    requiresSignatureVerification: true,
    requiresInboundMessageHandling: inbound,
    notes: [
      "Verify provider signature before trusting SMS callbacks.",
      stopped ? "Inbound STOP must immediately suppress future SMS for this client/phone." : "Inbound SMS should create a tenant-scoped message thread after consent and routing checks.",
    ],
  };
}

export function interpretPushReceipt(status: string): ProviderWebhookInterpretation {
  const normalized = status.toLowerCase();
  return {
    provider: "expo",
    eventType: status,
    normalizedStatus: normalized === "ok" || normalized === "delivered" ? "delivered" : normalized === "error" || normalized === "failed" ? "failed" : "sent",
    shouldUpdateDeliveryLog: true,
    requiresSignatureVerification: false,
    requiresInboundMessageHandling: false,
    notes: ["Expo push receipts should be polled or processed by worker.", "Invalid tokens should be marked inactive without logging full token values."],
  };
}

export function buildProviderEventReconciliationPlan(input: ProviderEventReconciliationInput): ProviderEventReconciliationPlan {
  const interpretation = input.provider === "resend"
    ? interpretEmailWebhook(input.eventType)
    : input.provider === "twilio"
      ? interpretSmsWebhook(input.eventType, input.inboundBody)
      : input.provider === "expo"
        ? interpretPushReceipt(input.eventType)
        : {
            provider: input.provider,
            eventType: input.eventType,
            normalizedStatus: "queued",
            shouldUpdateDeliveryLog: false,
            requiresSignatureVerification: false,
            requiresInboundMessageHandling: false,
            notes: ["Unsupported notification provider event should be logged and ignored."],
          } satisfies ProviderWebhookInterpretation;
  const blockers: string[] = [];
  const requiredChecks = [
    "Verify provider signature or trusted receipt source before reconciliation.",
    "Resolve tenant-scoped NotificationDelivery by provider message id or internal idempotency key.",
    "Persist provider event id for replay protection before mutating delivery state.",
    "Store only redacted destinations and body previews in logs.",
  ];
  const normalizedInbound = input.inboundBody?.trim().toLowerCase();
  const shouldSuppressDestination =
    (input.provider === "twilio" && (normalizedInbound === "stop" || normalizedInbound === "unsubscribe")) ||
    (input.provider === "resend" && /bounce|complaint|unsubscribe/i.test(input.eventType));
  const shouldMarkPushTokenInactive = input.provider === "expo" && /DeviceNotRegistered|invalid|notregistered/i.test(input.eventType);

  if (!input.eventId.trim()) {
    blockers.push("Missing provider event id.");
  }
  if (input.alreadyProcessedEventIds?.includes(input.eventId)) {
    blockers.push("Provider event id was already processed.");
  }
  if (interpretation.shouldUpdateDeliveryLog && !input.providerMessageId) {
    blockers.push("Provider message id is required to update an existing delivery log.");
  }
  if (input.provider === "system" || input.provider === "in_app") {
    blockers.push("Provider event reconciliation only supports external email, SMS, and push providers.");
  }

  return {
    provider: input.provider,
    eventId: input.eventId,
    idempotencyKey: `notification-provider-event:${input.provider}:${input.eventId}`,
    interpretation,
    shouldUpdateDeliveryLog: blockers.length === 0 && interpretation.shouldUpdateDeliveryLog,
    shouldSuppressDestination,
    shouldCreateInboundThread: blockers.length === 0 && interpretation.requiresInboundMessageHandling && !shouldSuppressDestination,
    shouldMarkPushTokenInactive,
    blockers,
    requiredChecks,
  };
}

export type ExpoPushPermissionStatus = "granted" | "denied" | "undetermined";

export interface ExpoPushRegistrationPlanInput {
  tenantId: string;
  userId: string;
  deviceId: string;
  permissionStatus: ExpoPushPermissionStatus;
  expoPushToken?: string | null;
  pushOptIn: boolean;
  registeredAt: string;
}

export interface ExpoPushRegistrationPlan {
  status: "ready" | "blocked";
  provider: "expo";
  tenantId: string;
  userId: string;
  deviceId: string;
  tokenMasked: string | null;
  shouldPersistToken: boolean;
  shouldPersistOptOut: boolean;
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export interface ExpoPushDeliveryPlanInput {
  tenantId: string;
  notificationId: string;
  templateKey: NotificationTemplateKey;
  context: NotificationTemplateContext;
  consent: ClientConsentSnapshot;
  requestId: string;
  deepLinkPath?: string;
}

export interface ExpoPushDeliveryPlan {
  status: "ready" | "blocked";
  provider: "expo";
  channel: "push";
  tenantId: string;
  notificationId: string;
  toMasked: string | null;
  idempotencyKey: string;
  payloadPreview: {
    title: string;
    body: string;
    deepLinkPath: string | null;
    containsSensitiveContent: boolean;
  };
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export interface ExpoPushReceiptProcessingPlanInput {
  tenantId: string;
  deliveryId: string;
  receiptId: string;
  receiptStatus: "ok" | "error";
  requestId: string;
  alreadyProcessedReceiptIds?: readonly string[];
  errorCode?: string;
  errorMessage?: string;
}

export interface ExpoPushReceiptProcessingPlan {
  status: "ready" | "blocked";
  provider: "expo";
  tenantId: string;
  deliveryId: string;
  receiptId: string;
  normalizedStatus: NotificationStatus;
  idempotencyKey: string;
  shouldUpdateDeliveryLog: boolean;
  shouldMarkPushTokenInactive: boolean;
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export interface ExpoPushTapRoutingPlanInput {
  tenantId: string;
  notificationId: string;
  userId: string;
  deepLinkPath?: string;
  pushOptIn: boolean;
  requestId: string;
}

export interface ExpoPushTapRoutingPlan {
  status: "ready" | "blocked";
  tenantId: string;
  notificationId: string;
  userId: string;
  routePath: string | null;
  idempotencyKey: string;
  requiredWrites: string[];
  requiredControls: string[];
  blockers: string[];
}

export type NotificationPersistenceAction =
  | "create_thread"
  | "append_message"
  | "create_notification"
  | "record_delivery"
  | "update_delivery_status"
  | "mark_thread_read";

export type NotificationPersistenceWriteModel =
  | "MessageThread"
  | "Message"
  | "Notification"
  | "NotificationDelivery"
  | "NotificationReadState"
  | "NotificationAuditLog"
  | "IdempotencyKey";

export interface NotificationPersistencePlanInput {
  tenantId: string;
  action: NotificationPersistenceAction;
  actorId?: string;
  threadId?: string;
  messageId?: string;
  notificationId?: string;
  deliveryId?: string;
  clientId?: string;
  templateKey?: NotificationTemplateKey;
  channel?: NotificationChannel;
  provider?: NotificationProvider;
  status?: NotificationStatus | MessageStatus;
  destination?: string;
  bodyPreview?: string;
  idempotencyKey?: string;
  destinationRedacted?: boolean;
  bodyRedacted?: boolean;
}

export interface NotificationPersistenceWrite {
  model: NotificationPersistenceWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface NotificationPersistencePlan {
  status: "ready" | "blocked";
  action: NotificationPersistenceAction;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly NotificationPersistenceWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export function buildExpoPushRegistrationPlan(input: ExpoPushRegistrationPlanInput): ExpoPushRegistrationPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before registering Expo push tokens.");
  if (!input.userId.trim()) blockers.push("User id is required before registering Expo push tokens.");
  if (!input.deviceId.trim()) blockers.push("Device id is required before registering Expo push tokens.");
  if (input.permissionStatus !== "granted") blockers.push("Expo push permission must be granted before token registration.");
  if (!input.expoPushToken?.trim() && input.permissionStatus === "granted") blockers.push("Expo push token is required after permission is granted.");

  return {
    status: blockers.length === 0 && input.pushOptIn ? "ready" : "blocked",
    provider: "expo",
    tenantId: input.tenantId,
    userId: input.userId,
    deviceId: input.deviceId,
    tokenMasked: input.expoPushToken ? maskDestination("push", input.expoPushToken) ?? null : null,
    shouldPersistToken: blockers.length === 0 && input.pushOptIn,
    shouldPersistOptOut: input.permissionStatus === "denied" || !input.pushOptIn,
    requiredWrites: ["PushToken", "NotificationPreference", "AuditLog"],
    requiredControls: [
      "Persist Expo tokens tenant/user/device scoped.",
      "Store only masked token previews in logs.",
      "Respect push opt-out before delivery.",
      "Mark invalid tokens inactive from Expo receipt reconciliation.",
    ],
    blockers: input.pushOptIn ? blockers : [...blockers, "Push opt-in is required before token registration."],
  };
}

export function buildExpoPushDeliveryPlan(input: ExpoPushDeliveryPlanInput): ExpoPushDeliveryPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before push delivery.");
  if (!input.notificationId.trim()) blockers.push("Notification id is required before push delivery.");
  if (!input.requestId.trim()) blockers.push("Request id is required for push delivery traceability.");
  const delivery = buildDeliveryPlan({
    key: input.templateKey,
    context: input.context,
    consent: input.consent,
    audience: "client",
  });
  const template = delivery.template;
  const pushCandidate = delivery.candidates.find((candidate) => candidate.channel === "push");
  if (!pushCandidate || pushCandidate.status === "blocked" || pushCandidate.status === "requires_destination") {
    blockers.push(pushCandidate?.reason ?? "Push delivery candidate is unavailable.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "expo",
    channel: "push",
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    toMasked: input.consent.pushToken ? maskDestination("push", input.consent.pushToken) ?? null : null,
    idempotencyKey: `expo-push:${input.tenantId}:${input.notificationId}:${input.requestId}`,
    payloadPreview: {
      title: template.pushTitle,
      body: template.pushBody,
      deepLinkPath: input.deepLinkPath ?? null,
      containsSensitiveContent: template.containsSensitiveContent,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "AuditLog"],
    requiredControls: [
      "Do not log full Expo push tokens.",
      "Persist delivery log before provider send.",
      "Attach deep-link target for tap routing without embedding private file URLs.",
      "Process Expo receipts for delivery state and invalid-token suppression.",
    ],
    blockers,
  };
}

export function buildExpoPushReceiptProcessingPlan(input: ExpoPushReceiptProcessingPlanInput): ExpoPushReceiptProcessingPlan {
  const blockers: string[] = [];
  const invalidToken = /DeviceNotRegistered|InvalidCredentials|MessageTooBig|invalid|notregistered/i.test(input.errorCode ?? input.errorMessage ?? "");

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before processing Expo push receipts.");
  if (!input.deliveryId.trim()) blockers.push("Notification delivery id is required before processing Expo push receipts.");
  if (!input.receiptId.trim()) blockers.push("Expo receipt id is required before processing receipts.");
  if (!input.requestId.trim()) blockers.push("Request id is required for Expo receipt traceability.");
  if (input.alreadyProcessedReceiptIds?.includes(input.receiptId)) blockers.push("Expo receipt id was already processed.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "expo",
    tenantId: input.tenantId,
    deliveryId: input.deliveryId,
    receiptId: input.receiptId,
    normalizedStatus: input.receiptStatus === "ok" ? "delivered" : "failed",
    idempotencyKey: `expo-receipt:${input.tenantId}:${input.receiptId}:${input.requestId}`,
    shouldUpdateDeliveryLog: blockers.length === 0,
    shouldMarkPushTokenInactive: blockers.length === 0 && invalidToken,
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "PushToken", "AuditLog", "IdempotencyKey"],
    requiredControls: [
      "Persist Expo receipt id before mutating delivery state to prevent replay.",
      "Update NotificationDelivery from Expo receipt status exactly once.",
      "Mark push tokens inactive when Expo reports DeviceNotRegistered or invalid token errors.",
      "Store only masked token references and redacted receipt error summaries.",
      "Alert or retry worker failures without reusing processed receipt ids.",
    ],
    blockers,
  };
}

export function buildExpoPushTapRoutingPlan(input: ExpoPushTapRoutingPlanInput): ExpoPushTapRoutingPlan {
  const blockers: string[] = [];
  const routePath = input.deepLinkPath?.trim() ? input.deepLinkPath.trim() : null;

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before push tap routing.");
  if (!input.notificationId.trim()) blockers.push("Notification id is required before push tap routing.");
  if (!input.userId.trim()) blockers.push("User id is required before push tap routing.");
  if (!input.requestId.trim()) blockers.push("Request id is required for push tap traceability.");
  if (!input.pushOptIn) blockers.push("Push opt-in is required before honoring push tap routing.");
  if (!routePath) blockers.push("Push tap routing requires a deep-link path.");
  if (routePath && (!routePath.startsWith("/") || routePath.startsWith("//") || /^https?:\/\//i.test(routePath))) {
    blockers.push("Push deep-link path must be an internal relative route.");
  }
  if (routePath && /token=|signature=|secret=|https?:\/\//i.test(routePath)) {
    blockers.push("Push deep-link path must not contain private URLs, tokens, signatures, or secrets.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    tenantId: input.tenantId,
    notificationId: input.notificationId,
    userId: input.userId,
    routePath,
    idempotencyKey: `expo-push-tap:${input.tenantId}:${input.notificationId}:${input.requestId}`,
    requiredWrites: ["NotificationInteraction", "AuditLog", "IdempotencyKey"],
    requiredControls: [
      "Resolve tap routes only after tenant/user authorization checks.",
      "Allow only internal relative deep links.",
      "Never embed private file URLs, provider payloads, tokens, or signatures in push tap paths.",
      "Persist NotificationInteraction for tap analytics and troubleshooting.",
    ],
    blockers,
  };
}

function notificationPersistenceWriteModels(action: NotificationPersistenceAction): NotificationPersistenceWriteModel[] {
  switch (action) {
    case "create_thread":
      return ["MessageThread", "NotificationAuditLog", "IdempotencyKey"];
    case "append_message":
      return ["Message", "MessageThread", "NotificationAuditLog", "IdempotencyKey"];
    case "create_notification":
      return ["Notification", "NotificationAuditLog", "IdempotencyKey"];
    case "record_delivery":
      return ["NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"];
    case "update_delivery_status":
      return ["NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"];
    case "mark_thread_read":
      return ["NotificationReadState", "MessageThread", "NotificationAuditLog", "IdempotencyKey"];
  }
}

export function buildNotificationPersistencePlan(input: NotificationPersistencePlanInput): NotificationPersistencePlan {
  const blockers: string[] = [];

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.actorId?.trim()) blockers.push("Notification persistence requires an actor id for audit attribution.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for notification persistence mutation.");
  if ((input.action === "append_message" || input.action === "mark_thread_read") && !input.threadId?.trim()) blockers.push("Message thread id is required for this persistence mutation.");
  if (input.action === "append_message" && !input.messageId?.trim()) blockers.push("Message id is required before appending a message.");
  if ((input.action === "create_notification" || input.action === "record_delivery" || input.action === "update_delivery_status") && !input.notificationId?.trim()) blockers.push("Notification id is required for notification delivery persistence.");
  if ((input.action === "record_delivery" || input.action === "update_delivery_status") && !input.deliveryId?.trim()) blockers.push("Notification delivery id is required for delivery persistence.");
  if ((input.action === "record_delivery" || input.action === "update_delivery_status") && !input.channel) blockers.push("Notification delivery channel is required.");
  if ((input.action === "record_delivery" || input.action === "update_delivery_status") && !input.provider) blockers.push("Notification delivery provider is required.");
  if ((input.action === "record_delivery" || input.action === "update_delivery_status") && !input.status) blockers.push("Notification delivery status is required.");
  if (input.destination && !input.destinationRedacted) blockers.push("Notification destinations must be redacted or hashed before persistence.");
  if (input.bodyPreview && !input.bodyRedacted) blockers.push("Message body previews must be redacted before persistence.");

  const destinationHash = input.destination ? stableDestinationHash(input.destination) : null;
  const bodyPreview = input.bodyPreview ? compactText(input.bodyPreview).slice(0, 240) : null;
  const basePayload = {
    threadId: input.threadId ?? null,
    messageId: input.messageId ?? null,
    notificationId: input.notificationId ?? null,
    deliveryId: input.deliveryId ?? null,
    clientId: input.clientId ?? null,
    templateKey: input.templateKey ?? null,
    channel: input.channel ?? null,
    provider: input.provider ?? null,
    status: input.status ?? null,
    destinationHash,
    bodyPreview,
    actorId: input.actorId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  };
  const writes = notificationPersistenceWriteModels(input.action).map((model): NotificationPersistenceWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "NotificationAuditLog"
      ? {
          ...basePayload,
          action: input.action,
        }
      : model === "IdempotencyKey"
        ? {
            key: input.idempotencyKey ?? null,
            action: input.action,
            threadId: input.threadId ?? null,
            notificationId: input.notificationId ?? null,
            deliveryId: input.deliveryId ?? null,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    writes,
    requiredControls: [
      "Execute message and notification persistence in one tenant-scoped transaction.",
      "Claim idempotency key before creating or mutating threads, messages, notifications, or deliveries.",
      "Reject cross-tenant thread, message, notification, delivery, and client ids before writes.",
      "Persist NotificationAuditLog for every message, delivery status, and read/unread mutation.",
      "Store only redacted body previews and hashed or masked destinations.",
      "Update read/unread state per tenant user without exposing restricted message fields.",
    ],
    blockers,
  };
}

export type NotificationQueueStrategy = "none" | "database_polling" | "managed_queue";
export type NotificationSchedulerAction =
  | "schedule_sequence"
  | "cancel_scheduled_jobs"
  | "process_due_job"
  | "retry_failed_job"
  | "dead_letter_job";

export type NotificationSchedulerWriteModel =
  | "NotificationJob"
  | "NotificationDelivery"
  | "NotificationWorkerAuditLog"
  | "DeadLetterJob"
  | "IdempotencyKey";

export interface ScheduledNotificationJobPlan {
  templateKey: NotificationTemplateKey;
  scheduledAt: string;
  scheduledOffsetMinutes: number;
  recommendedChannels: readonly NotificationChannel[];
}

export interface NotificationSchedulerPlanInput {
  tenantId: string;
  action: NotificationSchedulerAction;
  now: string;
  queueStrategy: NotificationQueueStrategy;
  workerEnabled: boolean;
  idempotencyStoreAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  idempotencyKey?: string;
  actorId?: string;
  jobId?: string;
  appointmentId?: string;
  bookingRequestId?: string;
  appointmentStartsAt?: string;
  sequenceSteps?: readonly NotificationSequenceStep[];
  attempt?: number;
  maxAttempts?: number;
  providerReady?: boolean;
  cancellationReason?: string;
}

export interface NotificationSchedulerWrite {
  model: NotificationSchedulerWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface NotificationSchedulerPlan {
  status: "ready" | "blocked";
  action: NotificationSchedulerAction;
  queueStrategy: NotificationQueueStrategy;
  requiresTransaction: true;
  idempotencyKey: string | null;
  scheduledJobs: readonly ScheduledNotificationJobPlan[];
  retryDelaySeconds: number | null;
  writes: readonly NotificationSchedulerWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export type PreferenceMutationAction =
  | "issue_preference_token"
  | "update_email_preferences"
  | "unsubscribe_email"
  | "record_sms_stop"
  | "record_sms_start"
  | "update_tenant_channel_settings";

export type PreferenceWriteModel =
  | "PreferenceToken"
  | "ClientNotificationPreference"
  | "TenantNotificationSetting"
  | "SuppressionListEntry"
  | "NotificationAuditLog"
  | "IdempotencyKey";

export interface PreferenceMutationPlanInput {
  tenantId: string;
  action: PreferenceMutationAction;
  clientId?: string;
  actorId?: string;
  email?: string;
  phone?: string;
  token?: string;
  tokenHash?: string;
  tokenExpiresAt?: string;
  now: string;
  idempotencyKey?: string;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  pushOptIn?: boolean;
  marketingOptIn?: boolean;
  transactionalAllowed?: boolean;
  tenantChannelSettingsConfigured?: boolean;
  legalCopyApproved?: boolean;
}

export interface PreferenceMutationWrite {
  model: PreferenceWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export interface PreferenceMutationPlan {
  status: "ready" | "blocked";
  action: PreferenceMutationAction;
  idempotencyKey: string | null;
  tokenHash: string | null;
  writes: readonly PreferenceMutationWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export type MessagingPrivacyAction =
  | "redact_message"
  | "authorize_message_view"
  | "export_thread"
  | "delete_thread"
  | "apply_retention"
  | "moderate_message";

export type MessagingRole = "client" | "artist" | "assistant" | "studio_manager" | "admin";

export interface MessagingPrivacyPlanInput {
  tenantId: string;
  action: MessagingPrivacyAction;
  role: MessagingRole;
  actorId?: string;
  threadId?: string;
  messageId?: string;
  body?: string;
  bodyRedacted?: boolean;
  attachmentUrl?: string;
  attachmentPolicyApproved?: boolean;
  retentionDays?: number;
  exportIncludesProviderPayloads?: boolean;
  exportIncludesPrivateUrls?: boolean;
  deleteRequestedAt?: string;
  spamScore?: number;
  rateLimitAllowed?: boolean;
  idempotencyKey?: string;
}

export interface MessagingPrivacyPlan {
  status: "ready" | "blocked";
  action: MessagingPrivacyAction;
  role: MessagingRole;
  visibleFields: readonly string[];
  redactionFindings: readonly string[];
  requiredWrites: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

function notificationSchedulerWriteModels(action: NotificationSchedulerAction): NotificationSchedulerWriteModel[] {
  switch (action) {
    case "schedule_sequence":
      return ["NotificationJob", "NotificationWorkerAuditLog", "IdempotencyKey"];
    case "cancel_scheduled_jobs":
      return ["NotificationJob", "NotificationWorkerAuditLog", "IdempotencyKey"];
    case "process_due_job":
      return ["NotificationJob", "NotificationDelivery", "NotificationWorkerAuditLog", "IdempotencyKey"];
    case "retry_failed_job":
      return ["NotificationJob", "NotificationWorkerAuditLog", "IdempotencyKey"];
    case "dead_letter_job":
      return ["NotificationJob", "DeadLetterJob", "NotificationWorkerAuditLog", "IdempotencyKey"];
  }
}

function addMinutesToIso(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString();
}

function retryDelaySeconds(attempt: number): number {
  return Math.min(3600, Math.max(60, 60 * 2 ** Math.max(attempt - 1, 0)));
}

export function buildNotificationSchedulerPlan(input: NotificationSchedulerPlanInput): NotificationSchedulerPlan {
  const blockers: string[] = [];
  const attempt = input.attempt ?? 1;
  const maxAttempts = input.maxAttempts ?? 5;
  const steps = input.sequenceSteps ?? [];

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for notification scheduler operation.");
  if (input.queueStrategy === "none") blockers.push("Notification queue strategy must be selected before scheduling jobs.");
  if (!input.workerEnabled) blockers.push("Notification worker must be enabled before queue processing.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency store must be available before scheduling or processing jobs.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Notification worker audit-log persistence must be available.");
  if ((input.action === "cancel_scheduled_jobs" || input.action === "dead_letter_job") && !input.actorId?.trim()) blockers.push("Scheduler cancellation and dead-letter actions require an actor id.");
  if ((input.action === "process_due_job" || input.action === "retry_failed_job" || input.action === "dead_letter_job") && !input.jobId?.trim()) blockers.push("Scheduler job id is required for worker processing.");
  if (input.action === "process_due_job" && !input.providerReady) blockers.push("Provider send plan must be ready before processing due notification jobs.");
  if (input.action === "schedule_sequence" && steps.length === 0) blockers.push("Scheduling requires at least one automation sequence step.");
  if (input.action === "schedule_sequence" && steps.some((step) => step.status === "blocked")) blockers.push("Blocked automation sequence steps cannot be scheduled.");
  if (input.action === "schedule_sequence" && steps.some((step) => step.scheduledOffsetMinutes < 0) && !input.appointmentStartsAt?.trim()) blockers.push("Negative scheduled offsets require an appointment start timestamp.");
  if (input.action === "retry_failed_job" && attempt >= maxAttempts) blockers.push("Retry attempt has reached max attempts and must be dead-lettered.");
  if (input.action === "dead_letter_job" && !input.cancellationReason?.trim()) blockers.push("Dead-lettering requires a failure reason.");
  if (input.action === "cancel_scheduled_jobs" && !input.cancellationReason?.trim()) blockers.push("Cancelling scheduled jobs requires a cancellation reason.");

  const scheduledJobs = input.action === "schedule_sequence"
    ? steps
        .filter((step) => step.status !== "blocked")
        .map((step): ScheduledNotificationJobPlan => {
          const base = step.scheduledOffsetMinutes < 0 ? input.appointmentStartsAt ?? input.now : input.now;
          return {
            templateKey: step.templateKey,
            scheduledAt: addMinutesToIso(base, step.scheduledOffsetMinutes),
            scheduledOffsetMinutes: step.scheduledOffsetMinutes,
            recommendedChannels: step.recommendedChannels,
          };
        })
    : [];
  const retryDelay = input.action === "retry_failed_job" && attempt < maxAttempts ? retryDelaySeconds(attempt) : null;
  const basePayload = {
    action: input.action,
    jobId: input.jobId ?? null,
    appointmentId: input.appointmentId ?? null,
    bookingRequestId: input.bookingRequestId ?? null,
    actorId: input.actorId ?? null,
    attempt,
    maxAttempts,
    retryDelaySeconds: retryDelay,
    scheduledJobCount: scheduledJobs.length,
    cancellationReason: input.cancellationReason ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  };
  const writes = notificationSchedulerWriteModels(input.action).map((model): NotificationSchedulerWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "NotificationJob"
      ? {
          ...basePayload,
          scheduledJobs,
        }
      : model === "IdempotencyKey"
        ? {
            key: input.idempotencyKey ?? null,
            action: input.action,
            jobId: input.jobId ?? null,
            appointmentId: input.appointmentId ?? null,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    queueStrategy: input.queueStrategy,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    scheduledJobs,
    retryDelaySeconds: retryDelay,
    writes,
    requiredControls: [
      "Persist scheduled NotificationJob rows before provider delivery attempts.",
      "Claim idempotency keys for scheduling, cancellation, processing, retry, and dead-letter operations.",
      "Cancel future jobs when appointments are rescheduled, cancelled, or completed early.",
      "Use bounded exponential backoff and dead-letter jobs after max attempts.",
      "Persist NotificationWorkerAuditLog for queue decisions, retries, cancellations, and dead letters.",
      "Do not process due jobs until channel-specific provider send plans are ready.",
    ],
    blockers,
  };
}

export function buildPreferenceTokenHash(token: string): string {
  const normalized = token.trim();
  let hash = 5381;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) + hash + normalized.charCodeAt(index)) >>> 0;
  }
  return `preference_token_${hash.toString(16).padStart(8, "0")}`;
}

function preferenceWriteModels(action: PreferenceMutationAction): PreferenceWriteModel[] {
  switch (action) {
    case "issue_preference_token":
      return ["PreferenceToken", "NotificationAuditLog", "IdempotencyKey"];
    case "update_email_preferences":
      return ["ClientNotificationPreference", "NotificationAuditLog", "IdempotencyKey"];
    case "unsubscribe_email":
      return ["ClientNotificationPreference", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"];
    case "record_sms_stop":
      return ["ClientNotificationPreference", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"];
    case "record_sms_start":
      return ["ClientNotificationPreference", "NotificationAuditLog", "IdempotencyKey"];
    case "update_tenant_channel_settings":
      return ["TenantNotificationSetting", "NotificationAuditLog", "IdempotencyKey"];
  }
}

export function buildPreferenceMutationPlan(input: PreferenceMutationPlanInput): PreferenceMutationPlan {
  const blockers: string[] = [];
  const tokenHash = input.token?.trim() ? buildPreferenceTokenHash(input.token) : input.tokenHash?.trim() ? input.tokenHash : null;
  const tokenExpiresAtMs = input.tokenExpiresAt ? new Date(input.tokenExpiresAt).getTime() : NaN;
  const nowMs = new Date(input.now).getTime();
  const isClientScoped = input.action !== "update_tenant_channel_settings";

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for preference mutation.");
  if (isClientScoped && !input.clientId?.trim()) blockers.push("Client id is required for client preference mutations.");
  if (!input.actorId?.trim() && input.action === "update_tenant_channel_settings") blockers.push("Tenant channel settings require an actor id.");
  if (input.action === "issue_preference_token" && !input.token?.trim()) blockers.push("Preference token issuance requires a token value to hash.");
  if (isClientScoped && input.action !== "issue_preference_token" && !tokenHash) blockers.push("Preference mutation requires a stored preference token hash.");
  if (isClientScoped && input.action !== "issue_preference_token" && (!Number.isFinite(tokenExpiresAtMs) || tokenExpiresAtMs <= nowMs)) blockers.push("Preference token is expired or missing expiration.");
  if ((input.action === "unsubscribe_email" || input.action === "update_email_preferences") && !input.email?.trim()) blockers.push("Email preference mutation requires an email destination.");
  if ((input.action === "record_sms_stop" || input.action === "record_sms_start") && !input.phone?.trim()) blockers.push("SMS preference mutation requires a phone destination.");
  if (input.action === "record_sms_start" && input.legalCopyApproved !== true) blockers.push("SMS START requires legal-approved consent copy before re-enabling SMS.");
  if (input.action === "update_tenant_channel_settings" && !input.tenantChannelSettingsConfigured) blockers.push("Tenant channel settings payload must be configured before persistence.");
  if (input.action === "update_tenant_channel_settings" && input.legalCopyApproved !== true) blockers.push("Tenant channel settings require legal-approved preference and consent copy.");

  const basePayload = {
    action: input.action,
    clientId: input.clientId ?? null,
    actorId: input.actorId ?? null,
    emailHash: input.email ? stableDestinationHash(input.email) : null,
    phoneHash: input.phone ? stableDestinationHash(input.phone) : null,
    tokenHash,
    tokenExpiresAt: input.tokenExpiresAt ?? null,
    emailOptIn: input.emailOptIn ?? null,
    smsOptIn: input.smsOptIn ?? null,
    pushOptIn: input.pushOptIn ?? null,
    marketingOptIn: input.marketingOptIn ?? null,
    transactionalAllowed: input.transactionalAllowed ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  };
  const writes = preferenceWriteModels(input.action).map((model): PreferenceMutationWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "PreferenceToken"
      ? {
          tokenHash,
          clientId: input.clientId ?? null,
          expiresAt: input.tokenExpiresAt ?? null,
        }
      : model === "NotificationAuditLog"
        ? basePayload
        : model === "IdempotencyKey"
          ? {
              key: input.idempotencyKey ?? null,
              action: input.action,
              clientId: input.clientId ?? null,
            }
          : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    tokenHash,
    writes,
    requiredControls: [
      "Hash preference tokens before persistence and compare only hashed values.",
      "Expire preference tokens and reject forged, missing, or scope-mismatched tokens.",
      "Persist audit logs for unsubscribe, STOP, START, and tenant setting changes.",
      "Apply email unsubscribe and SMS STOP suppression before marketing or transactional sends as policy requires.",
      "Separate transactional permission from marketing opt-in and preserve required service-message rules.",
      "Require legal-approved consent copy before SMS START or tenant preference setting changes.",
    ],
    blockers,
  };
}

function messagingVisibleFields(role: MessagingRole): string[] {
  if (role === "admin") return ["subject", "bodyPreview", "clientContactMasked", "attachments", "auditTrail", "retentionState"];
  if (role === "studio_manager") return ["subject", "bodyPreview", "clientContactMasked", "attachments", "retentionState"];
  if (role === "artist") return ["subject", "bodyPreview", "clientContactMasked", "attachments"];
  if (role === "assistant") return ["subject", "bodyPreview", "clientContactMasked"];
  return ["subject", "bodyPreview", "attachments"];
}

function detectMessagingPrivacyFindings(body: string | undefined, attachmentUrl: string | undefined): string[] {
  const findings: string[] = [];
  const text = body ?? "";
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) findings.push("email");
  if (/\+?\d[\d\s().-]{8,}\d/.test(text)) findings.push("phone");
  if (/\b(card|cvv|ssn|social security|diagnosis|infection|medication|allergy)\b/i.test(text)) findings.push("sensitive_terms");
  if (/https?:\/\/\S*(token|signature|secret|private|storage)\S*/i.test(text)) findings.push("private_url");
  if (attachmentUrl && /https?:\/\/\S*(token|signature|secret|private|storage)\S*/i.test(attachmentUrl)) findings.push("private_attachment_url");
  return findings;
}

export function buildMessagingPrivacyPlan(input: MessagingPrivacyPlanInput): MessagingPrivacyPlan {
  const blockers: string[] = [];
  const findings = detectMessagingPrivacyFindings(input.body, input.attachmentUrl);
  const visibleFields = messagingVisibleFields(input.role);

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.actorId?.trim()) blockers.push("Messaging privacy action requires an actor id.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for messaging privacy action.");
  if ((input.action === "redact_message" || input.action === "authorize_message_view" || input.action === "moderate_message") && !input.messageId?.trim()) blockers.push("Message id is required for this privacy action.");
  if ((input.action === "export_thread" || input.action === "delete_thread" || input.action === "apply_retention") && !input.threadId?.trim()) blockers.push("Thread id is required for thread privacy workflows.");
  if (findings.length > 0 && !input.bodyRedacted) blockers.push("Message body contains sensitive data and must be redacted before persistence or export.");
  if (input.attachmentUrl && !input.attachmentPolicyApproved) blockers.push("Message attachments require approved private attachment policy before access or export.");
  if (input.action === "export_thread" && input.exportIncludesProviderPayloads) blockers.push("Message export must omit raw provider payloads.");
  if (input.action === "export_thread" && input.exportIncludesPrivateUrls) blockers.push("Message export must omit private file URLs and signed upload URLs.");
  if ((input.action === "delete_thread" || input.action === "apply_retention") && (!input.retentionDays || input.retentionDays <= 0)) blockers.push("Retention/delete workflow requires a positive retention period.");
  if (input.action === "delete_thread" && !input.deleteRequestedAt?.trim()) blockers.push("Delete workflow requires a deletion request timestamp.");
  if (input.action === "moderate_message" && (input.spamScore ?? 0) >= 80 && input.rateLimitAllowed !== false) blockers.push("High spam score must trigger moderation or rate-limit blocking.");
  if (input.role === "assistant" && visibleFields.includes("attachments")) blockers.push("Assistant role must not receive unrestricted attachment visibility.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    role: input.role,
    visibleFields,
    redactionFindings: findings,
    requiredWrites: ["MessagePrivacyEvent", "MessageAuditLog", "IdempotencyKey"],
    requiredControls: [
      "Redact PII, payment, medical, private URLs, and signed attachment URLs before persistence, logs, exports, or previews.",
      "Apply role-based field visibility before returning message records to dashboard or client views.",
      "Require secure attachment policy before exposing or exporting message attachments.",
      "Omit provider payloads, raw destinations, private URLs, and secrets from message exports.",
      "Persist retention/delete/export audit events with actor, tenant, thread, and idempotency key.",
      "Apply spam/rate-limit controls before storing or routing suspicious inbound messages.",
    ],
    blockers,
  };
}

export const providerBoundaryMatrix: Array<{ provider: NotificationProvider; channel: NotificationChannel; credentialEnvVars: string[]; productionRequirement: string; gapId: string }> = [
  { provider: "resend", channel: "email", credentialEnvVars: ["RESEND_API_KEY", "EMAIL_FROM"], productionRequirement: "Transactional email domain, sender verification, provider webhooks, unsubscribe footer, delivery logs.", gapId: "GAP-061" },
  { provider: "twilio", channel: "sms", credentialEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_MESSAGING_SERVICE_SID"], productionRequirement: "SMS consent capture, STOP/HELP handling, quiet hours, delivery callbacks, phone number compliance.", gapId: "GAP-062" },
  { provider: "expo", channel: "push", credentialEnvVars: ["EXPO_ACCESS_TOKEN", "EXPO_PROJECT_ID"], productionRequirement: "Push token registration, token refresh, delivery receipts, deep links, opt-out controls.", gapId: "GAP-063" },
  { provider: "in_app", channel: "in_app", credentialEnvVars: ["DATABASE_URL"], productionRequirement: "Tenant-scoped notification records, read/unread state, message thread linking, audit logs.", gapId: "GAP-064" },
];
