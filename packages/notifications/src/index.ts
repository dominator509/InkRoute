import type { MessageChannel, MessageDirection, MessageStatus, NotificationChannel, NotificationStatus } from "@inkroute/types";
import { createHash } from "node:crypto";

function buildHashedIdempotencyKey(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function buildHashedSelector(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

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
  providerMessageIdHash?: string | undefined;
  providerStatus?: string | undefined;
  rawProviderMessageIdEchoed: false;
  redactionSummary: string;
  shouldWriteAuditLog: boolean;
}

export interface MessageThreadDraft {
  subject: string;
  channel: MessageChannel;
  direction: MessageDirection;
  status: MessageStatus;
  bodyPreview: string;
  relatedBookingRequestIdHash?: string | undefined;
  relatedAppointmentIdHash?: string | undefined;
  rawRelatedBookingRequestIdEchoed: false;
  rawRelatedAppointmentIdEchoed: false;
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
  requiredControls: typeof emailProviderSendRequiredControls;
  requiredCommands: typeof emailProviderSendRequiredCommands;
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
  requiredControls: typeof smsProviderSendRequiredControls;
  requiredCommands: typeof smsProviderSendRequiredCommands;
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

export interface EmailWebhookRuntimeReadinessInput {
  tenantId?: string;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  rawBodyCaptured: boolean;
  signatureHeaderPresent: boolean;
  signatureVerifierConfigured: boolean;
  webhookSecretConfigured: boolean;
  signatureTimestampWithinTolerance: boolean;
  tenantResolved: boolean;
  deliveryLogPersistenceAvailable: boolean;
  providerEventPersistenceAvailable: boolean;
  suppressionPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  payloadRedacted: boolean;
  alreadyProcessedEventIds?: readonly string[];
}

export interface EmailWebhookRuntimeReadinessPlan {
  status: "ready" | "blocked";
  provider: "resend";
  tenantId: string | null;
  eventId: string;
  eventType: string;
  normalizedStatus: NotificationStatus;
  idempotencyKey: string;
  shouldUpdateDeliveryLog: boolean;
  shouldSuppressDestination: boolean;
  requiredWrites: readonly string[];
  requiredControls: typeof emailWebhookRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface SmsWebhookRuntimeReadinessInput {
  tenantId?: string;
  eventId: string;
  eventType: string;
  providerMessageId?: string;
  inboundBody?: string;
  rawBodyCaptured: boolean;
  signatureHeaderPresent: boolean;
  signatureVerifierConfigured: boolean;
  twilioAuthTokenConfigured: boolean;
  requestUrlValidated: boolean;
  tenantResolved: boolean;
  consentProofAvailable: boolean;
  quietHoursPolicyConfigured: boolean;
  deliveryLogPersistenceAvailable: boolean;
  providerEventPersistenceAvailable: boolean;
  suppressionPersistenceAvailable: boolean;
  inboundThreadPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  payloadRedacted: boolean;
  alreadyProcessedEventIds?: readonly string[];
}

export interface SmsWebhookRuntimeReadinessPlan {
  status: "ready" | "blocked";
  provider: "twilio";
  tenantId: string | null;
  eventId: string;
  eventType: string;
  normalizedStatus: NotificationStatus;
  idempotencyKey: string;
  shouldUpdateDeliveryLog: boolean;
  shouldSuppressDestination: boolean;
  shouldCreateInboundThread: boolean;
  requiredWrites: readonly string[];
  requiredControls: typeof smsWebhookRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface ExpoPushProviderRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  mobileTypecheckPassed: boolean;
  expoProjectIdConfigured: boolean;
  expoAccessTokenConfigured: boolean;
  nativePushCredentialsConfigured: boolean;
  permissionRuntimeImplemented: boolean;
  tokenRegistrationRuntimeImplemented: boolean;
  pushTokenPersistenceAvailable: boolean;
  optOutPersistenceAvailable: boolean;
  deliveryWorkerConfigured: boolean;
  deliveryLogPersistenceAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  expoSendSmokePassed: boolean;
  receiptWorkerConfigured: boolean;
  receiptReplayProtectionAvailable: boolean;
  invalidTokenSuppressionPersistenceAvailable: boolean;
  deepLinkHandlerImplemented: boolean;
  foregroundDeviceQaPassed: boolean;
  backgroundDeviceQaPassed: boolean;
  tapNavigationDeviceQaPassed: boolean;
}

export interface ExpoPushProviderRuntimeReadinessPlan {
  status: "ready" | "blocked";
  provider: "expo";
  missingScripts: readonly string[];
  requiredCommands: typeof expoPushProviderRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly ExpoPushProviderRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof expoPushProviderRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface NotificationPersistenceRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  prismaModelsMigrated: boolean;
  repositoriesImplemented: boolean;
  tenantScopedQueriesEnforced: boolean;
  transactionalWritesConfigured: boolean;
  messageThreadPersistenceAvailable: boolean;
  messagePersistenceAvailable: boolean;
  notificationPersistenceAvailable: boolean;
  deliveryPersistenceAvailable: boolean;
  deliveryStatusTransitionPersistenceAvailable: boolean;
  providerHandoffPersistenceAvailable: boolean;
  readStatePersistenceAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  destinationHashingEnforced: boolean;
  bodyPreviewRedactionEnforced: boolean;
  rbacIntegrationEnforced: boolean;
  postgresIntegrationTestsPassed: boolean;
  crossTenantIsolationTestsPassed: boolean;
}

export interface NotificationPersistenceRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof notificationPersistenceRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly NotificationPersistenceRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof notificationPersistenceRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export type NotificationProviderHandoffWorkerAction =
  | "claim_due_handoff"
  | "mark_delivered"
  | "mark_failed"
  | "dead_letter";

export interface NotificationProviderHandoffWorkerInput {
  tenantId: string;
  handoffId?: string;
  deliveryId?: string;
  provider: string;
  action: NotificationProviderHandoffWorkerAction;
  currentState: "queued" | "processing" | "delivered" | "failed" | "dead_lettered";
  attempts: number;
  maxAttempts: number;
  providerReady: boolean;
  sanitizedPayloadAvailable: boolean;
  destinationHashAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  deliveryStatusTransitionPersistenceAvailable: boolean;
  now: string;
}

export interface NotificationProviderHandoffWorkerPlan {
  status: "ready" | "blocked";
  action: NotificationProviderHandoffWorkerAction;
  provider: string;
  idempotencyKey: string;
  nextState: "processing" | "delivered" | "failed" | "dead_lettered";
  requiredWrites: readonly string[];
  requiredControls: typeof notificationProviderHandoffWorkerRequiredControls;
  blockers: readonly string[];
}

export type NotificationPreferenceSuppressionAction =
  | "update_channel_preference"
  | "record_unsubscribe"
  | "record_sms_stop"
  | "record_bounce_complaint"
  | "evaluate_quiet_hours_rate_limit";

export interface NotificationPreferenceSuppressionInput {
  tenantId: string;
  subjectType: "client" | "user" | "anonymous_destination";
  subjectId: string;
  channel: NotificationChannel;
  action: NotificationPreferenceSuppressionAction;
  destinationHash?: string;
  provider?: string;
  providerEventId?: string;
  quietHoursConfigured: boolean;
  rateLimitConfigured: boolean;
  preferencePersistenceAvailable: boolean;
  suppressionPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  auditLogPersistenceAvailable: boolean;
  payloadRedacted: boolean;
}

export interface NotificationPreferenceSuppressionPlan {
  status: "ready" | "blocked";
  action: NotificationPreferenceSuppressionAction;
  channel: NotificationChannel;
  requiredWrites: readonly string[];
  requiredControls: typeof notificationPreferenceSuppressionRequiredControls;
  blockers: readonly string[];
}

export interface NotificationSchedulerRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  queueStrategySelected: boolean;
  queueBackendConfigured: boolean;
  schedulerProcessConfigured: boolean;
  workerProcessConfigured: boolean;
  notificationJobPersistenceAvailable: boolean;
  appointmentRelativeSchedulingImplemented: boolean;
  aftercareSequenceSchedulingImplemented: boolean;
  marketingSequenceSchedulingImplemented: boolean;
  cancellationOnAppointmentChangeImplemented: boolean;
  dueJobClaimingTransactional: boolean;
  providerReadyGateEnforced: boolean;
  idempotencyStoreAvailable: boolean;
  retryBackoffExecutorConfigured: boolean;
  deadLetterPersistenceAvailable: boolean;
  workerAuditLogPersistenceAvailable: boolean;
  clockSkewPolicyConfigured: boolean;
  postgresQueueIntegrationTestsPassed: boolean;
  retryDeadLetterIntegrationTestsPassed: boolean;
  cancellationIntegrationTestsPassed: boolean;
}

export interface NotificationSchedulerRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof notificationSchedulerRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly NotificationSchedulerRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof notificationSchedulerRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface ProviderWebhookRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  webRouteTestsPassed: boolean;
  emailSignatureVerificationImplemented: boolean;
  smsSignatureVerificationImplemented: boolean;
  pushReceiptTrustedSourceVerified: boolean;
  rawBodyPreservedForVerification: boolean;
  webhookSecretsConfigured: boolean;
  replayProtectionPersistenceAvailable: boolean;
  providerEventPersistenceAvailable: boolean;
  deliveryLogPersistenceAvailable: boolean;
  exactlyOnceDeliveryUpdatesEnforced: boolean;
  suppressionPersistenceAvailable: boolean;
  inboundRoutingPersistenceAvailable: boolean;
  invalidPushTokenPersistenceAvailable: boolean;
  tenantResolutionEnforced: boolean;
  payloadRedactionEnforced: boolean;
  failedWebhookAlertingConfigured: boolean;
  providerSandboxWebhookTestsPassed: boolean;
  routeInvalidSignatureTestsPassed: boolean;
}

export interface ProviderWebhookRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof providerWebhookRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly ProviderWebhookRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof providerWebhookRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface PreferenceCenterRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  webRouteTestsPassed: boolean;
  dashboardTestsPassed: boolean;
  preferenceCenterPageImplemented: boolean;
  unsubscribePageImplemented: boolean;
  preferenceApiImplemented: boolean;
  signedPreferenceTokensIssued: boolean;
  preferenceTokenHashPersistenceAvailable: boolean;
  tokenExpiryEnforced: boolean;
  forgedTokenRejectionTested: boolean;
  listUnsubscribeHeadersConfigured: boolean;
  emailUnsubscribePersistenceAvailable: boolean;
  smsStopPersistenceAvailable: boolean;
  smsStartPersistenceAvailable: boolean;
  tenantChannelSettingsUiImplemented: boolean;
  tenantChannelSettingsPersistenceAvailable: boolean;
  transactionalVsMarketingControlsEnforced: boolean;
  suppressionAppliedBeforeSend: boolean;
  auditLogPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  legalApprovedPreferenceCopyAvailable: boolean;
  routeApiTestsPassed: boolean;
}

export interface PreferenceCenterRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof preferenceCenterRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly PreferenceCenterRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof preferenceCenterRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface MessagingPrivacyRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  dashboardTestsPassed: boolean;
  messagingApiTestsPassed: boolean;
  redactionServiceImplemented: boolean;
  piiDetectionConfigured: boolean;
  medicalPaymentPrivateUrlDetectionConfigured: boolean;
  bodyPreviewRedactionEnforced: boolean;
  roleGatedMessageUiImplemented: boolean;
  roleGatedApiAuthorizationEnforced: boolean;
  unauthorizedRoleDenialTestsPassed: boolean;
  secureAttachmentAuthorizationImplemented: boolean;
  attachmentPolicyTestsPassed: boolean;
  exportWorkflowPersistenceAvailable: boolean;
  deleteWorkflowPersistenceAvailable: boolean;
  retentionWorkflowPersistenceAvailable: boolean;
  retentionJobConfigured: boolean;
  providerPayloadExportOmissionEnforced: boolean;
  privateUrlExportOmissionEnforced: boolean;
  moderationRateLimitIntegrationConfigured: boolean;
  spamModerationTestsPassed: boolean;
  secretSafeArtifactsReviewed: boolean;
  auditLogPersistenceAvailable: boolean;
  idempotencyStoreAvailable: boolean;
  postgresRetentionIntegrationTestsPassed: boolean;
}

export interface MessagingPrivacyRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof messagingPrivacyRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly MessagingPrivacyRuntimeReadinessRequiredEvidence[];
  requiredControls: typeof messagingPrivacyRuntimeReadinessRequiredControls;
  blockers: readonly string[];
}

export interface NotificationAutomatedTestReadinessInput {
  packageScripts: readonly string[];
  notificationUnitTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  publicRouteContractTestsPassed: boolean;
  providerWebhookRouteTestsPassed: boolean;
  queueIntegrationTestsPassed: boolean;
  dashboardTemplateSmokeTestsPassed: boolean;
  dashboardMessageSmokeTestsPassed: boolean;
  mobileNotificationSmokeTestsPassed: boolean;
  expoPushDeviceQaPassed: boolean;
  providerSandboxEmailTestsPassed: boolean;
  providerSandboxSmsTestsPassed: boolean;
  providerSandboxPushReceiptTestsPassed: boolean;
  preferenceOptOutPersistenceTestsPassed: boolean;
  smsStopPersistenceTestsPassed: boolean;
  bookingToAftercareE2ePassed: boolean;
  bookingToDepositNotificationE2ePassed: boolean;
  travelWaitlistNotificationE2ePassed: boolean;
  retentionExportDeleteIntegrationTestsPassed: boolean;
  ciPhase9NotificationJobConfigured: boolean;
  testArtifactsPublished: boolean;
}

export interface NotificationAutomatedTestReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof notificationAutomatedTestReadinessRequiredCommands;
  requiredEvidence: readonly NotificationAutomatedTestReadinessRequiredEvidence[];
  requiredSuites: readonly string[];
  blockers: readonly string[];
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
  return `masked_${createHash("sha256").update(destination).digest("hex")}`;
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
    idempotencyKey: buildHashedIdempotencyKey("delivery-log", [
      params.tenantId,
      params.clientId ?? "unknown_client",
      params.notificationType,
      params.channel,
    ]),
    notificationType: params.notificationType,
    channel: params.channel,
    provider,
    status: params.status ?? "queued",
    destinationHash: stableDestinationHash(params.destination),
    ...(params.providerMessageId ? { providerMessageIdHash: buildHashedSelector("provider-message", [params.providerMessageId]) } : {}),
    providerStatus: params.providerStatus,
    rawProviderMessageIdEchoed: false,
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
    disabledReason: "Provider SDK credentials and live worker execution remain gated; queue, delivery-log, suppression, and opt-out contracts are wired for runtime evidence.",
  };
}

export const emailProviderSendRequiredControls = [
      "Persist queued NotificationDelivery before provider send and final provider status after send.",
      "Use provider idempotency/request metadata to prevent duplicate sends.",
      "Check bounce, complaint, unsubscribe, and tenant suppression lists immediately before send.",
      "Include unsubscribe or preference-center footer on every email.",
      "Store only masked destination and redacted body preview in logs.",
      "Verify provider webhook signatures before reconciling delivered, bounced, or complained events.",
    ] as const;

export const emailProviderSendRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/email-provider-static.test.ts",
      "install/configure Resend SDK, API key, and verified sender domain",
      "prove Resend sender/domain verification",
      "legal-approved unsubscribe footer and preference-center copy review",
      "durable NotificationDelivery transaction tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable unsubscribe and suppression persistence tests",
      "Resend sandbox sent event test",
      "Resend sandbox delivered event test",
      "Resend sandbox bounced event test",
      "Resend unsubscribe suppression test",
      "invalid email webhook signature route test",
      "GitHub Actions email provider runtime job",
      "review email artifacts for Resend secrets, signatures, raw payloads, email addresses, and tenant data",
    ] as const;

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
    idempotencyKey: buildHashedIdempotencyKey("email-send", [input.tenantId, input.deliveryId, input.requestId]),
    payloadPreview: {
      subject: delivery.template.subject,
      bodyPreview: compactText(delivery.template.body).slice(0, 180),
      containsSensitiveContent: delivery.template.containsSensitiveContent,
      unsubscribeFooterPresent: input.unsubscribeFooterPresent,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "AuditLog", "IdempotencyKey"],
    requiredControls: emailProviderSendRequiredControls,
    requiredCommands: emailProviderSendRequiredCommands,
    blockers,
  };
}

export const smsProviderSendRequiredControls = [
      "Persist queued NotificationDelivery before provider send and final Twilio status after send.",
      "Use request idempotency metadata to prevent duplicate SMS sends.",
      "Check STOP, unsubscribe, consent proof, and tenant suppression state immediately before send.",
      "Apply tenant quiet-hours policy before Twilio API calls.",
      "Store only masked phone numbers and redacted SMS body previews in logs.",
      "Verify Twilio webhook signatures before reconciling delivered, failed, STOP, START, or HELP events.",
    ] as const;

export const smsProviderSendRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/sms-provider-static.test.ts",
      "install/configure Twilio SDK, Account SID, and auth token",
      "prove Twilio messaging service configuration",
      "legal-approved SMS consent and STOP/HELP copy review",
      "stored SMS consent proof tests",
      "quiet-hours policy tests",
      "verify Twilio signature against raw bodies",
      "validate Twilio request URL in webhook signature base string",
      "durable NotificationDelivery transaction tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable STOP suppression persistence tests",
      "durable HELP/client reply inbound-thread persistence tests",
      "Twilio sandbox sent event test",
      "Twilio sandbox delivered event test",
      "Twilio sandbox failed event test",
      "Twilio STOP suppression test",
      "Twilio HELP inbound-thread test",
      "invalid SMS webhook signature route test",
      "GitHub Actions SMS provider runtime job",
      "review SMS artifacts for Twilio secrets, signatures, raw payloads, phone numbers, and tenant data",
    ] as const;

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
    idempotencyKey: buildHashedIdempotencyKey("sms-send", [input.tenantId, input.deliveryId, input.requestId]),
    payloadPreview: {
      bodyPreview: smsLimit(delivery.template.smsBody),
      purpose: delivery.template.purpose,
      requiresHumanReview: delivery.template.requiresHumanReview,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "SuppressionCheck", "ConsentSnapshot", "AuditLog", "IdempotencyKey"],
    requiredControls: smsProviderSendRequiredControls,
    requiredCommands: smsProviderSendRequiredCommands,
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
    ...(params.relatedBookingRequestId
      ? { relatedBookingRequestIdHash: buildHashedSelector("message-related-booking", [params.relatedBookingRequestId]) }
      : {}),
    ...(params.relatedAppointmentId
      ? { relatedAppointmentIdHash: buildHashedSelector("message-related-appointment", [params.relatedAppointmentId]) }
      : {}),
    rawRelatedBookingRequestIdEchoed: false,
    rawRelatedAppointmentIdEchoed: false,
    piiRedactionNote: "Thread previews should exclude medical notes, payment details, file URLs, and full client contact data from logs.",
  };
}

export function interpretEmailWebhook(eventType: string): ProviderWebhookInterpretation {
  const normalized = eventType.toLowerCase();
  const status: NotificationStatus = normalized.includes("delivered") ? "delivered" : normalized.includes("bounce") || normalized.includes("complain") || normalized.includes("failed") ? "failed" : normalized.includes("sent") ? "sent" : "queued";
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
    (input.provider === "resend" && /bounce|complain|unsubscribe/i.test(input.eventType));
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
    idempotencyKey: buildHashedIdempotencyKey("notification-provider-event", [input.provider, input.eventId]),
    interpretation,
    shouldUpdateDeliveryLog: blockers.length === 0 && interpretation.shouldUpdateDeliveryLog,
    shouldSuppressDestination,
    shouldCreateInboundThread: blockers.length === 0 && interpretation.requiresInboundMessageHandling && !shouldSuppressDestination,
    shouldMarkPushTokenInactive,
    blockers,
    requiredChecks,
  };
}

export const emailWebhookRuntimeReadinessRequiredControls = [
      "Verify Resend/Svix signatures against the exact raw request body before JSON parsing is trusted.",
      "Reject missing signatures, stale timestamps, replayed provider event ids, and tenantless payloads before delivery updates.",
      "Persist ProviderEvent idempotency before mutating NotificationDelivery state.",
      "Persist bounce, complaint, and unsubscribe events to suppression state before future email sends.",
      "Store only redacted webhook payload summaries and destination hashes in audit logs.",
    ] as const;

export function buildEmailWebhookRuntimeReadinessPlan(input: EmailWebhookRuntimeReadinessInput): EmailWebhookRuntimeReadinessPlan {
  const reconciliation = buildProviderEventReconciliationPlan({
    provider: "resend",
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });
  const blockers: string[] = [...reconciliation.blockers];

  if (!input.tenantId?.trim()) blockers.unshift("Tenant scope is required before email webhook reconciliation.");
  if (!input.rawBodyCaptured) blockers.push("Raw email webhook body must be captured before signature verification.");
  if (!input.signatureHeaderPresent) blockers.push("Email provider signature header is required.");
  if (!input.signatureVerifierConfigured) blockers.push("Resend/Svix webhook verifier must be configured before trusting webhook payloads.");
  if (!input.webhookSecretConfigured) blockers.push("Email webhook secret must be configured in a secret store.");
  if (!input.signatureTimestampWithinTolerance) blockers.push("Email webhook signature timestamp must be inside replay tolerance.");
  if (!input.tenantResolved) blockers.push("Webhook payload must resolve to a tenant before delivery mutation.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available before webhook reconciliation.");
  if (!input.providerEventPersistenceAvailable) blockers.push("ProviderEvent persistence must be available for webhook replay protection.");
  if (reconciliation.shouldSuppressDestination && !input.suppressionPersistenceAvailable) blockers.push("Suppression persistence must be available for bounce, complaint, or unsubscribe events.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency store must be available before applying email webhook side effects.");
  if (!input.payloadRedacted) blockers.push("Email webhook payload must be redacted before audit logging or previews.");

  const requiredWrites = reconciliation.shouldSuppressDestination
    ? ["ProviderEvent", "NotificationDelivery", "SuppressionListEntry", "NotificationAuditLog", "IdempotencyKey"]
    : ["ProviderEvent", "NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"];

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "resend",
    tenantId: input.tenantId?.trim() ? input.tenantId : null,
    eventId: input.eventId,
    eventType: input.eventType,
    normalizedStatus: reconciliation.interpretation.normalizedStatus,
    idempotencyKey: reconciliation.idempotencyKey,
    shouldUpdateDeliveryLog: blockers.length === 0 && reconciliation.shouldUpdateDeliveryLog,
    shouldSuppressDestination: blockers.length === 0 && reconciliation.shouldSuppressDestination,
    requiredWrites,
    requiredControls: emailWebhookRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const smsWebhookRuntimeReadinessRequiredControls = [
      "Verify Twilio signatures against the exact raw request body, request URL, and auth token before trusting callback fields.",
      "Reject missing signatures, replayed MessageSid/EventSid values, tenantless payloads, and callbacks without stored consent proof.",
      "Persist ProviderEvent idempotency before mutating delivery, suppression, or inbound thread state.",
      "Apply STOP and unsubscribe callbacks to suppression state before future SMS sends.",
      "Route HELP and client replies into tenant-scoped message threads with redacted previews.",
      "Store only redacted phone numbers, message previews, and provider payload summaries in audit logs.",
    ] as const;

export function buildSmsWebhookRuntimeReadinessPlan(input: SmsWebhookRuntimeReadinessInput): SmsWebhookRuntimeReadinessPlan {
  const reconciliation = buildProviderEventReconciliationPlan({
    provider: "twilio",
    eventId: input.eventId,
    eventType: input.eventType,
    ...(input.inboundBody ? { inboundBody: input.inboundBody } : {}),
    ...(input.providerMessageId ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });
  const blockers: string[] = [...reconciliation.blockers];

  if (!input.tenantId?.trim()) blockers.unshift("Tenant scope is required before SMS webhook reconciliation.");
  if (!input.rawBodyCaptured) blockers.push("Raw SMS webhook body must be captured before signature verification.");
  if (!input.signatureHeaderPresent) blockers.push("Twilio signature header is required.");
  if (!input.signatureVerifierConfigured) blockers.push("Twilio webhook verifier must be configured before trusting callback payloads.");
  if (!input.twilioAuthTokenConfigured) blockers.push("Twilio auth token must be configured in a secret store for webhook verification.");
  if (!input.requestUrlValidated) blockers.push("Twilio webhook request URL must be validated as part of signature verification.");
  if (!input.tenantResolved) blockers.push("SMS webhook payload must resolve to a tenant before delivery or suppression mutation.");
  if (!input.consentProofAvailable) blockers.push("Stored SMS consent proof must be available before applying inbound SMS state changes.");
  if (!input.quietHoursPolicyConfigured) blockers.push("Quiet-hours policy must be configured before SMS callback processing is promoted.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available before SMS callback reconciliation.");
  if (!input.providerEventPersistenceAvailable) blockers.push("ProviderEvent persistence must be available for SMS callback replay protection.");
  if (reconciliation.shouldSuppressDestination && !input.suppressionPersistenceAvailable) blockers.push("Suppression persistence must be available for STOP or unsubscribe SMS events.");
  if (interpretation.requiresInboundMessageHandling && !reconciliation.shouldSuppressDestination && !input.inboundThreadPersistenceAvailable) blockers.push("Inbound message thread persistence must be available for HELP or client replies.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency store must be available before applying SMS callback side effects.");
  if (!input.payloadRedacted) blockers.push("SMS webhook payload must be redacted before audit logging or previews.");

  const requiredWrites = reconciliation.shouldSuppressDestination
    ? ["ProviderEvent", "SuppressionListEntry", "ClientNotificationPreference", "NotificationAuditLog", "IdempotencyKey"]
    : reconciliation.shouldCreateInboundThread
      ? ["ProviderEvent", "MessageThread", "Message", "NotificationAuditLog", "IdempotencyKey"]
      : ["ProviderEvent", "NotificationDelivery", "NotificationAuditLog", "IdempotencyKey"];

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "twilio",
    tenantId: input.tenantId?.trim() ? input.tenantId : null,
    eventId: input.eventId,
    eventType: input.eventType,
    normalizedStatus: reconciliation.interpretation.normalizedStatus,
    idempotencyKey: reconciliation.idempotencyKey,
    shouldUpdateDeliveryLog: blockers.length === 0 && reconciliation.shouldUpdateDeliveryLog,
    shouldSuppressDestination: blockers.length === 0 && reconciliation.shouldSuppressDestination,
    shouldCreateInboundThread: blockers.length === 0 && reconciliation.shouldCreateInboundThread,
    requiredWrites,
    requiredControls: smsWebhookRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const expoPushProviderRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/mobile typecheck",
      "configure Expo project id, access token, APNs, and FCM credentials",
      "persist tenant/user/device push tokens and opt-out state",
      "Expo push send smoke test against a real device token",
      "persist Expo ProviderEvent receipt reconciliation records",
      "persist NotificationInteraction tap/open records",
      "persist mobile push audit log records",
      "Expo receipt polling smoke test",
      "mobile push tap deep-link routing smoke",
      "iOS foreground/background/tap push QA",
      "Android foreground/background/tap push QA",
      "GitHub Actions mobile push evidence job",
    ] as const;

export const expoPushProviderRuntimeReadinessRequiredControls = [
      "Register Expo push tokens only after permission is granted and opt-out state is checked.",
      "Persist push tokens by tenant, user, device, app build, and platform without logging raw tokens.",
      "Resolve consent and push opt-out state immediately before each provider send.",
      "Persist NotificationDelivery, ProviderEvent, PushToken, NotificationInteraction, and audit records transactionally.",
      "Poll Expo receipts, apply replay protection, and suppress DeviceNotRegistered or invalid tokens before future sends.",
      "Allow only safe internal deep links for push tap routing.",
      "Collect foreground, background, and tap-navigation QA evidence on iOS and Android.",
    ] as const;

export const expoPushProviderRuntimeReadinessRequiredEvidence = [
      "Expo project, secret, APNs, and FCM configuration evidence",
      "tenant/user/device push token and opt-out persistence evidence",
      "Expo delivery worker, receipt polling, and invalid-token suppression evidence",
      "foreground/background/tap-navigation iOS and Android device QA evidence",
    ] as const;

export type ExpoPushProviderRuntimeReadinessRequiredEvidence = typeof expoPushProviderRuntimeReadinessRequiredEvidence[number];

export function buildExpoPushProviderRuntimeReadinessPlan(input: ExpoPushProviderRuntimeReadinessInput): ExpoPushProviderRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ExpoPushProviderRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications push provider tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with push runtime wiring.");
  if (!input.expoProjectIdConfigured) blockers.push("Expo project id must be configured before push delivery.");
  if (!input.expoAccessTokenConfigured) blockers.push("Expo access token must be configured in a secret store.");
  if (!input.nativePushCredentialsConfigured) blockers.push("iOS APNs and Android FCM credentials must be configured before device delivery.");
  if (!input.permissionRuntimeImplemented) blockers.push("Mobile runtime must request and persist push permission state.");
  if (!input.tokenRegistrationRuntimeImplemented) blockers.push("Mobile runtime must register Expo push tokens after permission is granted.");
  if (!input.pushTokenPersistenceAvailable) blockers.push("Tenant/user/device-scoped push token persistence must be available.");
  if (!input.optOutPersistenceAvailable) blockers.push("Push opt-out persistence must be available before sending.");
  if (!input.deliveryWorkerConfigured) blockers.push("Expo push delivery worker must be configured.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available for push sends.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Audit-log persistence must be available for push registration, sends, receipts, and taps.");
  if (!input.expoSendSmokePassed) blockers.push("Expo push send smoke test must pass against a real Expo token.");
  if (!input.receiptWorkerConfigured) blockers.push("Expo receipt polling worker must be configured.");
  if (!input.receiptReplayProtectionAvailable) blockers.push("Expo receipt processing must have replay/idempotency protection.");
  if (!input.invalidTokenSuppressionPersistenceAvailable) blockers.push("Invalid-token suppression persistence must be available for Expo receipt failures.");
  if (!input.deepLinkHandlerImplemented) blockers.push("Mobile push tap deep-link routing evidence must be captured before provider/device readiness.");
  if (!input.foregroundDeviceQaPassed) blockers.push("Foreground push delivery must pass iOS/Android device QA.");
  if (!input.backgroundDeviceQaPassed) blockers.push("Background push delivery must pass iOS/Android device QA.");
  if (!input.tapNavigationDeviceQaPassed) blockers.push("Push tap navigation must pass iOS/Android device QA.");

  if (!input.expoProjectIdConfigured || !input.expoAccessTokenConfigured || !input.nativePushCredentialsConfigured) {
    requiredEvidence.push(expoPushProviderRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.pushTokenPersistenceAvailable || !input.optOutPersistenceAvailable) {
    requiredEvidence.push(expoPushProviderRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.deliveryWorkerConfigured || !input.receiptWorkerConfigured || !input.invalidTokenSuppressionPersistenceAvailable) {
    requiredEvidence.push(expoPushProviderRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.foregroundDeviceQaPassed || !input.backgroundDeviceQaPassed || !input.tapNavigationDeviceQaPassed) {
    requiredEvidence.push(expoPushProviderRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    provider: "expo",
    missingScripts,
    requiredCommands: expoPushProviderRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === expoPushProviderRuntimeReadinessRequiredEvidence.length
        ? expoPushProviderRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: expoPushProviderRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const notificationPersistenceRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification repository Postgres integration tests",
      "cross-tenant notification/message isolation tests",
      "delivery status transition and read/unread state integration tests",
    ] as const;

export const notificationPersistenceRuntimeReadinessRequiredControls = [
      "Wrap notification, delivery, provider handoff, message, audit, read-state, and idempotency writes in tenant-scoped transactions.",
      "Require tenant id in every repository filter and reject unscoped reads or writes.",
      "Persist NotificationAuditLog rows for message append, delivery record, status update, read-state, redaction, export, and delete actions.",
      "Hash destinations and store only redacted body previews before writing provider or message records.",
      "Apply RBAC before dashboard, artist, assistant, or client message reads.",
      "Use idempotency keys for provider callbacks, queue jobs, read-state mutations, and preference-linked writes.",
      "Prove status transitions, provider handoff source rows, read/unread state, and tenant isolation against Postgres repositories.",
    ] as const;

export const notificationPersistenceRuntimeReadinessRequiredEvidence = [
      "Prisma migration and repository implementation evidence",
      "transactional audit/idempotency write evidence",
      "redacted destination and body-preview persistence evidence",
      "Postgres tenant-isolation and persistence integration test evidence",
    ] as const;

export type NotificationPersistenceRuntimeReadinessRequiredEvidence = typeof notificationPersistenceRuntimeReadinessRequiredEvidence[number];

export function buildNotificationPersistenceRuntimeReadinessPlan(input: NotificationPersistenceRuntimeReadinessInput): NotificationPersistenceRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: NotificationPersistenceRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications persistence tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.prismaModelsMigrated) blockers.push("Notification/message Prisma models must be migrated before runtime persistence.");
  if (!input.repositoriesImplemented) blockers.push("Notification/message repositories must be implemented before runtime persistence.");
  if (!input.tenantScopedQueriesEnforced) blockers.push("All notification/message repository queries must enforce tenant scope.");
  if (!input.transactionalWritesConfigured) blockers.push("Notification/message mutations must be committed in database transactions.");
  if (!input.messageThreadPersistenceAvailable) blockers.push("MessageThread persistence must be available.");
  if (!input.messagePersistenceAvailable) blockers.push("Message persistence must be available.");
  if (!input.notificationPersistenceAvailable) blockers.push("Notification persistence must be available.");
  if (!input.deliveryPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available.");
  if (!input.deliveryStatusTransitionPersistenceAvailable) blockers.push("Delivery status transition persistence must be available.");
  if (!input.providerHandoffPersistenceAvailable) blockers.push("NotificationProviderHandoff persistence must be available.");
  if (!input.readStatePersistenceAvailable) blockers.push("NotificationReadState persistence must be available.");
  if (!input.auditLogPersistenceAvailable) blockers.push("NotificationAuditLog persistence must be available.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency store must be available for persistence mutations.");
  if (!input.destinationHashingEnforced) blockers.push("Notification destinations must be hashed or redacted before persistence.");
  if (!input.bodyPreviewRedactionEnforced) blockers.push("Message and notification body previews must be redacted before persistence.");
  if (!input.rbacIntegrationEnforced) blockers.push("Notification/message reads and writes must enforce dashboard/client RBAC.");
  if (!input.postgresIntegrationTestsPassed) blockers.push("Postgres integration tests must pass for notification/message repositories.");
  if (!input.crossTenantIsolationTestsPassed) blockers.push("Cross-tenant notification/message isolation tests must pass.");

  if (!input.prismaModelsMigrated || !input.repositoriesImplemented) {
    requiredEvidence.push(notificationPersistenceRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.transactionalWritesConfigured || !input.idempotencyStoreAvailable || !input.auditLogPersistenceAvailable) {
    requiredEvidence.push(notificationPersistenceRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.destinationHashingEnforced || !input.bodyPreviewRedactionEnforced) {
    requiredEvidence.push(notificationPersistenceRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.postgresIntegrationTestsPassed || !input.crossTenantIsolationTestsPassed) {
    requiredEvidence.push(notificationPersistenceRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: notificationPersistenceRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === notificationPersistenceRuntimeReadinessRequiredEvidence.length
        ? notificationPersistenceRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: notificationPersistenceRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const notificationProviderHandoffWorkerRequiredControls = [
      "Claim queued NotificationProviderHandoff rows by tenant, state, provider, and availableAt before provider execution.",
      "Never load raw message bodies or raw destinations from provider handoff payloads.",
      "Use idempotency keys for claim, delivered, failed, and dead-letter state changes.",
      "Persist NotificationDeliveryStatusTransition rows for every provider worker state mutation.",
      "Write AuditLog metadata with handoff, delivery, provider, state, and redacted field labels only.",
      "Move exhausted handoff rows to dead_lettered without retrying provider sends.",
    ] as const;

export function buildNotificationProviderHandoffWorkerPlan(input: NotificationProviderHandoffWorkerInput): NotificationProviderHandoffWorkerPlan {
  const blockers: string[] = [];
  const provider = input.provider.trim() || "unknown";
  const handoffId = input.handoffId?.trim() || "unclaimed";
  const deliveryId = input.deliveryId?.trim() || "unknown-delivery";

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before provider handoff worker processing.");
  if (input.action !== "claim_due_handoff" && !input.handoffId?.trim()) blockers.push("Provider handoff id is required before mutating a handoff row.");
  if (!provider || provider === "unknown") blockers.push("Provider name is required before provider handoff worker processing.");
  if (!input.providerReady && input.action !== "dead_letter") blockers.push("Provider readiness gate must pass before processing provider handoff rows.");
  if (!input.sanitizedPayloadAvailable) blockers.push("Provider handoff worker requires sanitized payloads and must not read raw message bodies.");
  if (!input.destinationHashAvailable) blockers.push("Provider handoff worker requires destination hashes instead of raw destinations.");
  if (!input.idempotencyStoreAvailable) blockers.push("Provider handoff worker requires idempotency storage before state changes.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Provider handoff worker requires audit-log persistence.");
  if (!input.deliveryStatusTransitionPersistenceAvailable) blockers.push("Provider handoff worker requires delivery status transition persistence.");
  if (input.attempts < 0) blockers.push("Provider handoff attempts cannot be negative.");
  if (input.maxAttempts < 1) blockers.push("Provider handoff max attempts must be at least one.");
  if (input.action === "claim_due_handoff" && input.currentState !== "queued") blockers.push("Only queued provider handoff rows can be claimed.");
  if (input.action === "mark_delivered" && input.currentState !== "processing") blockers.push("Only processing provider handoff rows can be marked delivered.");
  if (input.action === "mark_failed" && input.currentState !== "processing") blockers.push("Only processing provider handoff rows can be marked failed.");
  if (input.action === "dead_letter" && input.attempts < input.maxAttempts) blockers.push("Provider handoff rows can be dead-lettered only after max attempts are reached.");

  const nextState = input.action === "claim_due_handoff"
    ? "processing"
    : input.action === "mark_delivered"
      ? "delivered"
      : input.action === "mark_failed"
        ? "failed"
        : "dead_lettered";

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    provider,
    idempotencyKey: buildHashedIdempotencyKey("notification-provider-handoff", [input.tenantId, provider, handoffId, deliveryId, input.action, input.now]),
    nextState,
    requiredWrites: [
      "NotificationProviderHandoff",
      "NotificationDelivery",
      "NotificationDeliveryStatusTransition",
      "AuditLog",
      "IdempotencyKey",
    ],
    requiredControls: notificationProviderHandoffWorkerRequiredControls,
    blockers,
  };
}

export const notificationPreferenceSuppressionRequiredControls = [
      "Persist tenant-scoped NotificationChannelPreference rows for channel opt-in, quiet-hours, and rate-limit policy.",
      "Persist tenant-scoped NotificationSuppression rows for unsubscribe, STOP, bounce, complaint, and invalid-token events.",
      "Store destination hashes and redacted metadata instead of raw destinations or raw provider payloads.",
      "Use idempotency keys before mutating preference or suppression rows.",
      "Write audit metadata for preference source, suppression reason, provider event, and redacted fields.",
      "Evaluate quiet-hours and rate-limit policy before provider handoff worker execution.",
    ] as const;

export function buildNotificationPreferenceSuppressionPlan(
  input: NotificationPreferenceSuppressionInput,
): NotificationPreferenceSuppressionPlan {
  const blockers: string[] = [];
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required before notification preference or suppression processing.");
  if (!input.subjectId.trim()) blockers.push("Subject id is required before notification preference or suppression processing.");
  if ((input.action === "record_unsubscribe" || input.action === "record_sms_stop" || input.action === "record_bounce_complaint") && !input.destinationHash?.trim()) {
    blockers.push("Destination hash is required before recording provider suppression.");
  }
  if (!input.preferencePersistenceAvailable) blockers.push("NotificationChannelPreference persistence must be available.");
  if (!input.suppressionPersistenceAvailable) blockers.push("NotificationSuppression persistence must be available.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency storage is required for preference and suppression mutations.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Audit-log persistence is required for preference and suppression mutations.");
  if (!input.payloadRedacted) blockers.push("Preference and suppression payloads must be redacted before persistence.");
  if (input.action === "evaluate_quiet_hours_rate_limit" && !input.quietHoursConfigured) blockers.push("Quiet-hours policy must be configured before evaluation.");
  if (input.action === "evaluate_quiet_hours_rate_limit" && !input.rateLimitConfigured) blockers.push("Rate-limit policy must be configured before evaluation.");
  if (input.action === "record_sms_stop" && input.channel !== "sms") blockers.push("SMS STOP suppressions must target the sms channel.");
  if (input.action === "record_unsubscribe" && input.channel !== "email") blockers.push("Email unsubscribe suppressions must target the email channel.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    channel: input.channel,
    requiredWrites: [
      "NotificationChannelPreference",
      "NotificationSuppression",
      "AuditLog",
      "IdempotencyKey",
    ],
    requiredControls: notificationPreferenceSuppressionRequiredControls,
    blockers,
  };
}

export const notificationSchedulerRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification scheduler Postgres queue integration tests",
      "notification retry/backoff and dead-letter integration tests",
      "appointment reschedule/cancel scheduled-job cancellation integration tests",
      "idempotent due-job worker concurrency test",
    ] as const;

export const notificationSchedulerRuntimeReadinessRequiredControls = [
      "Persist NotificationJob rows with tenant, trigger, template, scheduledAt, appointment/client references, and idempotency key.",
      "Claim due jobs transactionally so concurrent workers cannot dispatch duplicate provider sends.",
      "Require provider send-plan readiness immediately before job dispatch.",
      "Cancel or reschedule future jobs when appointments are rescheduled, cancelled, completed, or deleted.",
      "Apply bounded retry/backoff and persist exhausted jobs to DeadLetterJob with worker audit details.",
      "Persist NotificationWorkerAuditLog rows for schedule, process, retry, cancel, and dead-letter actions.",
      "Define scheduler clock-skew/timezone policy before appointment-relative automations run in production.",
    ] as const;

export const notificationSchedulerRuntimeReadinessRequiredEvidence = [
      "queue backend and NotificationJob persistence evidence",
      "scheduler/worker process and transactional due-job claiming evidence",
      "retry, dead-letter, and worker audit persistence evidence",
      "queue, retry/dead-letter, and appointment cancellation integration test evidence",
    ] as const;

export type NotificationSchedulerRuntimeReadinessRequiredEvidence = typeof notificationSchedulerRuntimeReadinessRequiredEvidence[number];

export function buildNotificationSchedulerRuntimeReadinessPlan(input: NotificationSchedulerRuntimeReadinessInput): NotificationSchedulerRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: NotificationSchedulerRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications scheduler tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.queueStrategySelected) blockers.push("Notification queue strategy must be selected.");
  if (!input.queueBackendConfigured) blockers.push("Notification queue backend must be configured before scheduler promotion.");
  if (!input.schedulerProcessConfigured) blockers.push("Notification scheduler process must be configured.");
  if (!input.workerProcessConfigured) blockers.push("Notification worker process must be configured.");
  if (!input.notificationJobPersistenceAvailable) blockers.push("NotificationJob persistence must be available.");
  if (!input.appointmentRelativeSchedulingImplemented) blockers.push("Appointment-relative notification scheduling evidence must be captured before scheduler readiness.");
  if (!input.aftercareSequenceSchedulingImplemented) blockers.push("Aftercare sequence scheduling evidence must be captured before scheduler readiness.");
  if (!input.marketingSequenceSchedulingImplemented) blockers.push("Waitlist, flash-drop, healed-photo, and review sequence scheduling evidence must be captured before scheduler readiness.");
  if (!input.cancellationOnAppointmentChangeImplemented) blockers.push("Scheduled jobs must cancel or reschedule when appointments change.");
  if (!input.dueJobClaimingTransactional) blockers.push("Due-job claiming must be transactional to prevent duplicate sends.");
  if (!input.providerReadyGateEnforced) blockers.push("Scheduler worker must require a ready provider send plan before dispatch.");
  if (!input.idempotencyStoreAvailable) blockers.push("Scheduler and worker idempotency store must be available.");
  if (!input.retryBackoffExecutorConfigured) blockers.push("Retry/backoff executor must be configured.");
  if (!input.deadLetterPersistenceAvailable) blockers.push("DeadLetterJob persistence must be available.");
  if (!input.workerAuditLogPersistenceAvailable) blockers.push("NotificationWorkerAuditLog persistence must be available.");
  if (!input.clockSkewPolicyConfigured) blockers.push("Scheduler clock-skew and timezone policy must be configured.");
  if (!input.postgresQueueIntegrationTestsPassed) blockers.push("Postgres queue integration tests must pass.");
  if (!input.retryDeadLetterIntegrationTestsPassed) blockers.push("Retry/backoff and dead-letter integration tests must pass.");
  if (!input.cancellationIntegrationTestsPassed) blockers.push("Persisted appointment reschedule/cancel integration tests must pass.");

  if (!input.queueStrategySelected || !input.queueBackendConfigured || !input.notificationJobPersistenceAvailable) {
    requiredEvidence.push(notificationSchedulerRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.schedulerProcessConfigured || !input.workerProcessConfigured || !input.dueJobClaimingTransactional) {
    requiredEvidence.push(notificationSchedulerRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.retryBackoffExecutorConfigured || !input.deadLetterPersistenceAvailable || !input.workerAuditLogPersistenceAvailable) {
    requiredEvidence.push(notificationSchedulerRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.postgresQueueIntegrationTestsPassed || !input.retryDeadLetterIntegrationTestsPassed || !input.cancellationIntegrationTestsPassed) {
    requiredEvidence.push(notificationSchedulerRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: notificationSchedulerRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === notificationSchedulerRuntimeReadinessRequiredEvidence.length
        ? notificationSchedulerRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: notificationSchedulerRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const providerWebhookRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
      "email provider sandbox webhook replay and invalid-signature tests",
      "Twilio sandbox callback replay and invalid-signature tests",
      "Expo receipt polling invalid-token integration test",
      "concurrent provider callback exactly-once delivery-log test",
    ] as const;

export const providerWebhookRuntimeReadinessRequiredControls = [
      "Verify provider signatures against raw request bodies before parsing payloads for trusted side effects.",
      "Persist ProviderEvent ids transactionally before delivery, suppression, inbound, or push-token mutations.",
      "Apply exactly-once delivery status updates under replayed and concurrent provider callbacks.",
      "Persist bounce, complaint, unsubscribe, STOP, HELP, inbound reply, and invalid push-token outcomes in tenant scope.",
      "Resolve tenant scope before any provider webhook mutation and reject tenantless payloads.",
      "Redact provider payloads, destinations, message bodies, and tokens before audit logs or previews.",
      "Alert on failed signature verification, replay attempts, reconciliation failures, and dead-lettered webhook events.",
    ] as const;

export const providerWebhookRuntimeReadinessRequiredEvidence = [
      "provider signature verification and raw-body route evidence",
      "durable replay protection and exactly-once ProviderEvent evidence",
      "delivery, suppression, inbound routing, and invalid-token persistence evidence",
      "provider sandbox, invalid-signature, and failed-webhook alerting evidence",
    ] as const;

export type ProviderWebhookRuntimeReadinessRequiredEvidence = typeof providerWebhookRuntimeReadinessRequiredEvidence[number];

export function buildProviderWebhookRuntimeReadinessPlan(input: ProviderWebhookRuntimeReadinessInput): ProviderWebhookRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: ProviderWebhookRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications provider webhook tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.webRouteTestsPassed) blockers.push("Provider webhook route contract tests must pass.");
  if (!input.emailSignatureVerificationImplemented) blockers.push("Email provider cryptographic signature verification evidence must be captured before webhook readiness.");
  if (!input.smsSignatureVerificationImplemented) blockers.push("SMS provider cryptographic signature verification evidence must be captured before webhook readiness.");
  if (!input.pushReceiptTrustedSourceVerified) blockers.push("Push receipt processing must verify trusted Expo receipt source.");
  if (!input.rawBodyPreservedForVerification) blockers.push("Webhook routes must preserve raw request bodies for signature verification.");
  if (!input.webhookSecretsConfigured) blockers.push("Provider webhook secrets must be configured in a secret store.");
  if (!input.replayProtectionPersistenceAvailable) blockers.push("Durable replay protection must persist provider event ids before side effects.");
  if (!input.providerEventPersistenceAvailable) blockers.push("ProviderEvent persistence must be available.");
  if (!input.deliveryLogPersistenceAvailable) blockers.push("NotificationDelivery persistence must be available for reconciliation.");
  if (!input.exactlyOnceDeliveryUpdatesEnforced) blockers.push("Delivery-log updates must be exactly-once under replay and concurrent callbacks.");
  if (!input.suppressionPersistenceAvailable) blockers.push("Suppression persistence must be available for bounces, complaints, unsubscribes, and STOP events.");
  if (!input.inboundRoutingPersistenceAvailable) blockers.push("Inbound thread/message persistence must be available for HELP and client replies.");
  if (!input.invalidPushTokenPersistenceAvailable) blockers.push("Invalid push-token persistence must be available for Expo receipt failures.");
  if (!input.tenantResolutionEnforced) blockers.push("Provider webhook payloads must resolve tenant scope before mutation.");
  if (!input.payloadRedactionEnforced) blockers.push("Provider webhook payloads must be redacted before audit logging.");
  if (!input.failedWebhookAlertingConfigured) blockers.push("Failed webhook verification or reconciliation must emit alerting.");
  if (!input.providerSandboxWebhookTestsPassed) blockers.push("Provider sandbox webhook and receipt tests must pass.");
  if (!input.routeInvalidSignatureTestsPassed) blockers.push("Route-level invalid-signature rejection tests must pass.");

  if (!input.emailSignatureVerificationImplemented || !input.smsSignatureVerificationImplemented || !input.rawBodyPreservedForVerification || !input.webhookSecretsConfigured) {
    requiredEvidence.push(providerWebhookRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.replayProtectionPersistenceAvailable || !input.exactlyOnceDeliveryUpdatesEnforced || !input.providerEventPersistenceAvailable) {
    requiredEvidence.push(providerWebhookRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.deliveryLogPersistenceAvailable || !input.suppressionPersistenceAvailable || !input.inboundRoutingPersistenceAvailable || !input.invalidPushTokenPersistenceAvailable) {
    requiredEvidence.push(providerWebhookRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.providerSandboxWebhookTestsPassed || !input.routeInvalidSignatureTestsPassed || !input.failedWebhookAlertingConfigured) {
    requiredEvidence.push(providerWebhookRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: providerWebhookRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === providerWebhookRuntimeReadinessRequiredEvidence.length
        ? providerWebhookRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: providerWebhookRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const preferenceCenterRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "preference center and unsubscribe route/API tests",
      "tenant notification settings dashboard tests",
      "signed preference token forgery and expiry tests",
      "pre-send suppression integration tests",
    ] as const;

export const preferenceCenterRuntimeReadinessRequiredControls = [
      "Issue scoped signed preference links and persist only hashed token values.",
      "Reject expired, forged, reused, or tenant/client-mismatched preference tokens before mutation.",
      "Separate transactional notification permission from marketing opt-in and preserve required service-message behavior.",
      "Persist email unsubscribe, SMS STOP, SMS START, and tenant setting changes with audit logs and idempotency keys.",
      "Apply email unsubscribe and SMS STOP suppression immediately before provider send planning.",
      "Include List-Unsubscribe headers or equivalent provider metadata where applicable.",
      "Use legal-approved preference, unsubscribe, STOP, START, and tenant-settings copy before production launch.",
    ] as const;

export const preferenceCenterRuntimeReadinessRequiredEvidence = [
      "client preference center, unsubscribe page, preference API, and tenant settings UI evidence",
      "signed preference token issuance, hash persistence, expiry, and forgery rejection evidence",
      "email unsubscribe, SMS STOP/START, and pre-send suppression persistence evidence",
      "audit, idempotency, legal copy, and route/API test evidence",
    ] as const;

export type PreferenceCenterRuntimeReadinessRequiredEvidence = typeof preferenceCenterRuntimeReadinessRequiredEvidence[number];

export function buildPreferenceCenterRuntimeReadinessPlan(input: PreferenceCenterRuntimeReadinessInput): PreferenceCenterRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: PreferenceCenterRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications preference tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.webRouteTestsPassed) blockers.push("Preference/unsubscribe web route tests must pass.");
  if (!input.dashboardTestsPassed) blockers.push("Tenant notification settings dashboard tests must pass.");
  if (!input.preferenceCenterPageImplemented) blockers.push("Client preference center page evidence must be captured before preference readiness.");
  if (!input.unsubscribePageImplemented) blockers.push("One-click email unsubscribe page evidence must be captured before preference readiness.");
  if (!input.preferenceApiImplemented) blockers.push("Preference mutation API route evidence must be captured before preference readiness.");
  if (!input.signedPreferenceTokensIssued) blockers.push("Signed preference tokens must be issued for client preference links.");
  if (!input.preferenceTokenHashPersistenceAvailable) blockers.push("Preference token hashes must be persisted instead of raw tokens.");
  if (!input.tokenExpiryEnforced) blockers.push("Preference token expiration must be enforced.");
  if (!input.forgedTokenRejectionTested) blockers.push("Forged, expired, tenant-mismatched, and reused preference tokens must be rejected by tests.");
  if (!input.listUnsubscribeHeadersConfigured) blockers.push("Transactional email provider sends must include configured List-Unsubscribe headers where applicable.");
  if (!input.emailUnsubscribePersistenceAvailable) blockers.push("Email unsubscribe persistence must be available.");
  if (!input.smsStopPersistenceAvailable) blockers.push("SMS STOP suppression persistence must be available.");
  if (!input.smsStartPersistenceAvailable) blockers.push("SMS START re-consent persistence must be available.");
  if (!input.tenantChannelSettingsUiImplemented) blockers.push("Tenant channel settings dashboard UI evidence must be captured before preference readiness.");
  if (!input.tenantChannelSettingsPersistenceAvailable) blockers.push("Tenant channel settings persistence must be available.");
  if (!input.transactionalVsMarketingControlsEnforced) blockers.push("Transactional notification permission must be separated from marketing opt-in.");
  if (!input.suppressionAppliedBeforeSend) blockers.push("Email unsubscribe and SMS STOP suppression must be applied immediately before provider sends.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Preference mutation audit-log persistence must be available.");
  if (!input.idempotencyStoreAvailable) blockers.push("Preference mutation idempotency store must be available.");
  if (!input.legalApprovedPreferenceCopyAvailable) blockers.push("Preference, unsubscribe, SMS STOP/START, and tenant settings copy must be legal-approved.");
  if (!input.routeApiTestsPassed) blockers.push("Preference center, unsubscribe, STOP/START, and tenant settings route/API tests must pass.");

  if (!input.preferenceCenterPageImplemented || !input.unsubscribePageImplemented || !input.preferenceApiImplemented || !input.tenantChannelSettingsUiImplemented) {
    requiredEvidence.push(preferenceCenterRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.signedPreferenceTokensIssued || !input.preferenceTokenHashPersistenceAvailable || !input.tokenExpiryEnforced || !input.forgedTokenRejectionTested) {
    requiredEvidence.push(preferenceCenterRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.emailUnsubscribePersistenceAvailable || !input.smsStopPersistenceAvailable || !input.smsStartPersistenceAvailable || !input.suppressionAppliedBeforeSend) {
    requiredEvidence.push(preferenceCenterRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.auditLogPersistenceAvailable || !input.idempotencyStoreAvailable || !input.legalApprovedPreferenceCopyAvailable || !input.routeApiTestsPassed) {
    requiredEvidence.push(preferenceCenterRuntimeReadinessRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: preferenceCenterRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === preferenceCenterRuntimeReadinessRequiredEvidence.length
        ? preferenceCenterRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: preferenceCenterRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const messagingPrivacyRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "dashboard messaging role-visibility tests",
      "messaging privacy API authorization tests",
      "secure attachment authorization tests",
      "message export/delete/retention Postgres integration tests",
      "messaging spam moderation and rate-limit tests",
    ] as const;

export const messagingPrivacyRuntimeReadinessRequiredControls = [
      "Redact PII, phone, email, payment, medical, private URL, and signed attachment URL content before persistence, previews, logs, or exports.",
      "Enforce role-based field visibility in both dashboard UI and messaging APIs.",
      "Authorize message attachments through a secure attachment policy before display or export.",
      "Persist export, delete, retention, moderation, redaction, and attachment-access audit events with idempotency keys.",
      "Omit raw provider payloads, private URLs, signed URLs, and secrets from message exports.",
      "Run retention jobs against persisted messages and preserve audit evidence for deletes and exports.",
      "Apply spam moderation and rate limits before storing or routing suspicious inbound messages.",
    ] as const;

export const messagingPrivacyRuntimeReadinessRequiredEvidence = [
      "role-gated messaging UI/API and unauthorized-role denial evidence",
      "secure attachment authorization and policy test evidence",
      "persistence-backed export, delete, retention job, and Postgres integration evidence",
      "provider payload/private URL omission evidence",
      "moderation/rate-limit, audit, idempotency, and spam test evidence",
      "secret-safe review of retained messaging privacy artifacts",
    ] as const;

export type MessagingPrivacyRuntimeReadinessRequiredEvidence = typeof messagingPrivacyRuntimeReadinessRequiredEvidence[number];

export function buildMessagingPrivacyRuntimeReadinessPlan(input: MessagingPrivacyRuntimeReadinessInput): MessagingPrivacyRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: MessagingPrivacyRuntimeReadinessRequiredEvidence[] = [];
  const addRequiredEvidence = (entry: MessagingPrivacyRuntimeReadinessRequiredEvidence): void => {
    if (!requiredEvidence.includes(entry)) requiredEvidence.push(entry);
  };

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications messaging privacy tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.dashboardTestsPassed) blockers.push("Dashboard messaging privacy and role-visibility tests must pass.");
  if (!input.messagingApiTestsPassed) blockers.push("Messaging privacy API tests must pass.");
  if (!input.redactionServiceImplemented) blockers.push("Production message redaction service evidence must be captured before messaging privacy readiness.");
  if (!input.piiDetectionConfigured) blockers.push("PII detection must be configured for message bodies and previews.");
  if (!input.medicalPaymentPrivateUrlDetectionConfigured) blockers.push("Medical, payment, and private URL detection must be configured.");
  if (!input.bodyPreviewRedactionEnforced) blockers.push("Message body previews must be redacted before persistence and display.");
  if (!input.roleGatedMessageUiImplemented) blockers.push("Dashboard message UI must enforce role-based field visibility.");
  if (!input.roleGatedApiAuthorizationEnforced) blockers.push("Messaging APIs must enforce role-based authorization before returning fields.");
  if (!input.unauthorizedRoleDenialTestsPassed) blockers.push("Unauthorized role denial tests must pass for messaging UI/API.");
  if (!input.secureAttachmentAuthorizationImplemented) blockers.push("Secure message attachment authorization service evidence must be captured before messaging privacy readiness.");
  if (!input.attachmentPolicyTestsPassed) blockers.push("Secure attachment policy tests must pass.");
  if (!input.exportWorkflowPersistenceAvailable) blockers.push("Message export workflow persistence must be available.");
  if (!input.deleteWorkflowPersistenceAvailable) blockers.push("Message delete workflow persistence must be available.");
  if (!input.retentionWorkflowPersistenceAvailable) blockers.push("Message retention workflow persistence must be available.");
  if (!input.retentionJobConfigured) blockers.push("Message retention job must be configured.");
  if (!input.providerPayloadExportOmissionEnforced) blockers.push("Message exports must omit raw provider payloads.");
  if (!input.privateUrlExportOmissionEnforced) blockers.push("Message exports must omit private URLs and signed attachment URLs.");
  if (!input.moderationRateLimitIntegrationConfigured) blockers.push("Messaging spam moderation and rate-limit integration must be configured.");
  if (!input.spamModerationTestsPassed) blockers.push("Messaging spam moderation and rate-limit tests must pass.");
  if (!input.auditLogPersistenceAvailable) blockers.push("Messaging privacy audit-log persistence must be available.");
  if (!input.idempotencyStoreAvailable) blockers.push("Messaging privacy idempotency store must be available.");
  if (!input.secretSafeArtifactsReviewed) blockers.push("Secret-safe messaging privacy artifact review evidence must be captured.");
  if (!input.postgresRetentionIntegrationTestsPassed) blockers.push("Postgres retention/delete/export integration tests must pass.");

  if (!input.roleGatedMessageUiImplemented || !input.roleGatedApiAuthorizationEnforced || !input.unauthorizedRoleDenialTestsPassed) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.secureAttachmentAuthorizationImplemented || !input.attachmentPolicyTestsPassed) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.exportWorkflowPersistenceAvailable || !input.deleteWorkflowPersistenceAvailable || !input.retentionWorkflowPersistenceAvailable || !input.retentionJobConfigured || !input.postgresRetentionIntegrationTestsPassed) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.providerPayloadExportOmissionEnforced || !input.privateUrlExportOmissionEnforced) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.moderationRateLimitIntegrationConfigured || !input.spamModerationTestsPassed || !input.auditLogPersistenceAvailable || !input.idempotencyStoreAvailable) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[4]);
  }
  if (!input.secretSafeArtifactsReviewed) {
    addRequiredEvidence(messagingPrivacyRuntimeReadinessRequiredEvidence[5]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: messagingPrivacyRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === messagingPrivacyRuntimeReadinessRequiredEvidence.length
        ? messagingPrivacyRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    requiredControls: messagingPrivacyRuntimeReadinessRequiredControls,
    blockers,
  };
}

export const notificationAutomatedTestReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
      "notification queue integration test command",
      "Playwright dashboard templates/messages smoke tests",
      "Expo iOS/Android push device QA",
      "provider sandbox email/SMS/push receipt tests",
      "booking-to-deposit/aftercare/travel notification E2E tests",
    ] as const;

export const notificationAutomatedTestReadinessRequiredEvidence = [
      "queue, opt-out, STOP, and retention/export/delete integration test evidence",
      "dashboard/mobile smoke and Expo device QA evidence",
      "email, SMS, and push provider sandbox evidence",
      "booking, deposit, aftercare, and travel notification E2E evidence",
      "CI Phase 9 notification job and published artifact evidence",
    ] as const;

export type NotificationAutomatedTestReadinessRequiredEvidence = typeof notificationAutomatedTestReadinessRequiredEvidence[number];

export function buildNotificationAutomatedTestReadinessPlan(input: NotificationAutomatedTestReadinessInput): NotificationAutomatedTestReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: NotificationAutomatedTestReadinessRequiredEvidence[] = [];
  const requiredSuites = [
    "@inkroute/notifications unit tests",
    "@inkroute/notifications typecheck",
    "public notification preview and messaging route contract tests",
    "provider webhook route contract tests",
    "notification queue integration tests",
    "dashboard template and message Playwright smoke tests",
    "mobile notification and Expo push device QA",
    "provider sandbox email/SMS/push receipt tests",
    "preference opt-out and SMS STOP persistence tests",
    "booking-to-deposit, booking-to-aftercare, and travel waitlist notification E2E flows",
    "message retention/export/delete integration tests",
    "CI Phase 9 notification job with published artifacts",
  ];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationUnitTestsPassed) blockers.push("@inkroute/notifications unit tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.publicRouteContractTestsPassed) blockers.push("Public notification preview and messaging route contract tests must pass.");
  if (!input.providerWebhookRouteTestsPassed) blockers.push("Provider webhook route contract tests must pass.");
  if (!input.queueIntegrationTestsPassed) blockers.push("Notification queue integration tests must pass.");
  if (!input.dashboardTemplateSmokeTestsPassed) blockers.push("Dashboard template smoke tests must pass.");
  if (!input.dashboardMessageSmokeTestsPassed) blockers.push("Dashboard message smoke tests must pass.");
  if (!input.mobileNotificationSmokeTestsPassed) blockers.push("Mobile notification smoke tests must pass.");
  if (!input.expoPushDeviceQaPassed) blockers.push("Expo push iOS/Android device QA must pass.");
  if (!input.providerSandboxEmailTestsPassed) blockers.push("Email provider sandbox tests must pass.");
  if (!input.providerSandboxSmsTestsPassed) blockers.push("SMS provider sandbox tests must pass.");
  if (!input.providerSandboxPushReceiptTestsPassed) blockers.push("Expo push receipt sandbox tests must pass.");
  if (!input.preferenceOptOutPersistenceTestsPassed) blockers.push("Preference opt-out persistence tests must pass.");
  if (!input.smsStopPersistenceTestsPassed) blockers.push("SMS STOP persistence tests must pass.");
  if (!input.bookingToAftercareE2ePassed) blockers.push("Booking-to-aftercare notification E2E flow must pass.");
  if (!input.bookingToDepositNotificationE2ePassed) blockers.push("Booking-to-deposit notification E2E flow must pass.");
  if (!input.travelWaitlistNotificationE2ePassed) blockers.push("Travel waitlist notification E2E flow must pass.");
  if (!input.retentionExportDeleteIntegrationTestsPassed) blockers.push("Message retention/export/delete integration tests must pass.");
  if (!input.ciPhase9NotificationJobConfigured) blockers.push("CI must include a Phase 9 notification/messaging test job.");
  if (!input.testArtifactsPublished) blockers.push("Phase 9 notification/messaging test artifacts must be published.");

  if (!input.queueIntegrationTestsPassed || !input.preferenceOptOutPersistenceTestsPassed || !input.smsStopPersistenceTestsPassed || !input.retentionExportDeleteIntegrationTestsPassed) {
    requiredEvidence.push(notificationAutomatedTestReadinessRequiredEvidence[0]);
  }
  if (!input.dashboardTemplateSmokeTestsPassed || !input.dashboardMessageSmokeTestsPassed || !input.mobileNotificationSmokeTestsPassed || !input.expoPushDeviceQaPassed) {
    requiredEvidence.push(notificationAutomatedTestReadinessRequiredEvidence[1]);
  }
  if (!input.providerSandboxEmailTestsPassed || !input.providerSandboxSmsTestsPassed || !input.providerSandboxPushReceiptTestsPassed) {
    requiredEvidence.push(notificationAutomatedTestReadinessRequiredEvidence[2]);
  }
  if (!input.bookingToAftercareE2ePassed || !input.bookingToDepositNotificationE2ePassed || !input.travelWaitlistNotificationE2ePassed) {
    requiredEvidence.push(notificationAutomatedTestReadinessRequiredEvidence[3]);
  }
  if (!input.ciPhase9NotificationJobConfigured || !input.testArtifactsPublished) {
    requiredEvidence.push(notificationAutomatedTestReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: notificationAutomatedTestReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === notificationAutomatedTestReadinessRequiredEvidence.length
        ? notificationAutomatedTestReadinessRequiredEvidence
        : requiredEvidence,
    requiredSuites,
    blockers,
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
  requiredControls: typeof expoPushRegistrationRequiredControls;
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
  requiredControls: typeof expoPushDeliveryRequiredControls;
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
  requiredControls: typeof expoPushReceiptProcessingRequiredControls;
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
  requiredControls: typeof expoPushTapRoutingRequiredControls;
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
  requiredControls: typeof notificationPersistenceRequiredControls;
  blockers: readonly string[];
}

export const expoPushRegistrationRequiredControls = [
      "Persist Expo tokens tenant/user/device scoped.",
      "Store only masked token previews in logs.",
      "Respect push opt-out before delivery.",
      "Mark invalid tokens inactive from Expo receipt reconciliation.",
    ] as const;

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
    requiredControls: expoPushRegistrationRequiredControls,
    blockers: input.pushOptIn ? blockers : [...blockers, "Push opt-in is required before token registration."],
  };
}

export const expoPushDeliveryRequiredControls = [
      "Do not log full Expo push tokens.",
      "Persist delivery log before provider send.",
      "Attach deep-link target for tap routing without embedding private file URLs.",
      "Process Expo receipts for delivery state and invalid-token suppression.",
    ] as const;

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
    idempotencyKey: buildHashedIdempotencyKey("expo-push", [input.tenantId, input.notificationId, input.requestId]),
    payloadPreview: {
      title: template.pushTitle,
      body: template.pushBody,
      deepLinkPath: input.deepLinkPath ?? null,
      containsSensitiveContent: template.containsSensitiveContent,
    },
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "AuditLog"],
    requiredControls: expoPushDeliveryRequiredControls,
    blockers,
  };
}

export const expoPushReceiptProcessingRequiredControls = [
      "Persist Expo receipt id before mutating delivery state to prevent replay.",
      "Update NotificationDelivery from Expo receipt status exactly once.",
      "Mark push tokens inactive when Expo reports DeviceNotRegistered or invalid token errors.",
      "Store only masked token references and redacted receipt error summaries.",
      "Alert or retry worker failures without reusing processed receipt ids.",
    ] as const;

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
    idempotencyKey: buildHashedIdempotencyKey("expo-receipt", [input.tenantId, input.receiptId, input.requestId]),
    shouldUpdateDeliveryLog: blockers.length === 0,
    shouldMarkPushTokenInactive: blockers.length === 0 && invalidToken,
    requiredWrites: ["NotificationDelivery", "ProviderEvent", "PushToken", "AuditLog", "IdempotencyKey"],
    requiredControls: expoPushReceiptProcessingRequiredControls,
    blockers,
  };
}

export const expoPushTapRoutingRequiredControls = [
      "Resolve tap routes only after tenant/user authorization checks.",
      "Allow only internal relative deep links.",
      "Never embed private file URLs, provider payloads, tokens, or signatures in push tap paths.",
      "Persist NotificationInteraction for tap analytics and troubleshooting.",
    ] as const;

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
    idempotencyKey: buildHashedIdempotencyKey("expo-push-tap", [input.tenantId, input.notificationId, input.requestId]),
    requiredWrites: ["NotificationInteraction", "AuditLog", "IdempotencyKey"],
    requiredControls: expoPushTapRoutingRequiredControls,
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

export const notificationPersistenceRequiredControls = [
      "Execute message and notification persistence in one tenant-scoped transaction.",
      "Claim idempotency key before creating or mutating threads, messages, notifications, or deliveries.",
      "Reject cross-tenant thread, message, notification, delivery, and client ids before writes.",
      "Persist NotificationAuditLog for every message, delivery status, and read/unread mutation.",
      "Store only redacted body previews and hashed or masked destinations.",
      "Update read/unread state per tenant user without exposing restricted message fields.",
    ] as const;

function notificationAuditProofHash(value: string | null | undefined): string | null {
  return value?.trim() ? createHash("sha256").update(value).digest("hex") : null;
}

function buildNotificationPersistenceAuditProof(input: {
  threadId?: string | null;
  messageId?: string | null;
  notificationId?: string | null;
  deliveryId?: string | null;
  clientId?: string | null;
  actorId?: string | null;
  destinationHash?: string | null;
  idempotencyKey?: string | null;
}): Record<string, unknown> {
  return {
    threadIdHash: notificationAuditProofHash(input.threadId),
    messageIdHash: notificationAuditProofHash(input.messageId),
    notificationIdHash: notificationAuditProofHash(input.notificationId),
    deliveryIdHash: notificationAuditProofHash(input.deliveryId),
    clientIdHash: notificationAuditProofHash(input.clientId),
    actorIdHash: notificationAuditProofHash(input.actorId),
    destinationHashPresent: Boolean(input.destinationHash),
    destinationHashHash: notificationAuditProofHash(input.destinationHash),
    idempotencyKeyHash: notificationAuditProofHash(input.idempotencyKey),
    rawThreadIdStored: false,
    rawMessageIdStored: false,
    rawNotificationIdStored: false,
    rawDeliveryIdStored: false,
    rawClientIdStored: false,
    rawActorIdStored: false,
    rawDestinationHashStored: false,
    rawIdempotencyKeyStored: false,
  };
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
          action: input.action,
          templateKey: basePayload.templateKey,
          channel: basePayload.channel,
          provider: basePayload.provider,
          status: basePayload.status,
          bodyPreview: basePayload.bodyPreview,
          ...buildNotificationPersistenceAuditProof(basePayload),
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
    requiredControls: notificationPersistenceRequiredControls,
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
  requiredControls: typeof notificationSchedulerRequiredControls;
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
  requiredControls: typeof preferenceMutationRequiredControls;
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
  tenantId: string;
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
  visibleFields: readonly string[];
  redactionFindings: readonly string[];
  requiredWrites: readonly string[];
  requiredControls: typeof messagingPrivacyRequiredControls;
  blockers: readonly string[];
}

export type NotificationRuntimeReadinessStatus = "ready" | "blocked";

export interface NotificationRuntimeReadinessInput {
  packageScripts: readonly string[];
  packageTestsPassed: boolean;
  packageTypecheckPassed: boolean;
  providerCredentialsConfigured: boolean;
  providerSandboxSmokeVerified: boolean;
  queueWorkerConfigured: boolean;
  deliveryLogPersistenceConfigured: boolean;
  messageThreadPersistenceConfigured: boolean;
  consentStoreConfigured: boolean;
  unsubscribeStopConfigured: boolean;
  webhookSignatureVerificationConfigured: boolean;
  webhookReplayProtectionConfigured: boolean;
  pushTokenStoreConfigured: boolean;
  expoPushConfigured: boolean;
  retryBackoffConfigured: boolean;
  deadLetterQueueConfigured: boolean;
  tenantIsolationVerified: boolean;
  templateLegalReviewApproved: boolean;
}

export interface NotificationRuntimeReadinessPlan {
  status: NotificationRuntimeReadinessStatus;
  missingScripts: readonly string[];
  requiredCommands: typeof notificationRuntimeReadinessRequiredCommands;
  requiredControls: typeof notificationRuntimeReadinessRequiredControls;
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

export const notificationSchedulerRequiredControls = [
      "Persist scheduled NotificationJob rows before provider delivery attempts.",
      "Claim idempotency keys for scheduling, cancellation, processing, retry, and dead-letter operations.",
      "Cancel future jobs when appointments are rescheduled, cancelled, or completed early.",
      "Use bounded exponential backoff and dead-letter jobs after max attempts.",
      "Persist NotificationWorkerAuditLog for queue decisions, retries, cancellations, and dead letters.",
      "Do not process due jobs until channel-specific provider send plans are ready.",
    ] as const;

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
    requiredControls: notificationSchedulerRequiredControls,
    blockers,
  };
}

export function buildPreferenceTokenHash(token: string): string {
  const normalized = token.trim();
  return `preference_token:${createHash("sha256").update(normalized).digest("hex")}`;
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

export const preferenceMutationRequiredControls = [
      "Hash preference tokens before persistence and compare only hashed values.",
      "Expire preference tokens and reject forged, missing, or scope-mismatched tokens.",
      "Persist audit logs for unsubscribe, STOP, START, and tenant setting changes.",
      "Apply email unsubscribe and SMS STOP suppression before marketing or transactional sends as policy requires.",
      "Separate transactional permission from marketing opt-in and preserve required service-message rules.",
      "Require legal-approved consent copy before SMS START or tenant preference setting changes.",
    ] as const;

function preferenceProofHash(value: string | null | undefined): string | null {
  return value?.trim() ? createHash("sha256").update(value).digest("hex") : null;
}

function buildPreferenceAuditProof(input: {
  emailHash?: string | null;
  phoneHash?: string | null;
  tokenHash?: string | null;
  idempotencyKey?: string | null;
}): Record<string, unknown> {
  return {
    emailHashPresent: Boolean(input.emailHash),
    emailHashHash: preferenceProofHash(input.emailHash),
    phoneHashPresent: Boolean(input.phoneHash),
    phoneHashHash: preferenceProofHash(input.phoneHash),
    tokenHashPresent: Boolean(input.tokenHash),
    tokenHashHash: preferenceProofHash(input.tokenHash),
    idempotencyKeyHash: preferenceProofHash(input.idempotencyKey),
    rawEmailHashStored: false,
    rawPhoneHashStored: false,
    rawTokenHashStored: false,
    rawIdempotencyKeyStored: false,
  };
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
        ? {
            action: basePayload.action,
            clientId: basePayload.clientId,
            actorId: basePayload.actorId,
            tokenExpiresAt: basePayload.tokenExpiresAt,
            emailOptIn: basePayload.emailOptIn,
            smsOptIn: basePayload.smsOptIn,
            pushOptIn: basePayload.pushOptIn,
            marketingOptIn: basePayload.marketingOptIn,
            transactionalAllowed: basePayload.transactionalAllowed,
            ...buildPreferenceAuditProof(basePayload),
          }
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
    requiredControls: preferenceMutationRequiredControls,
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

export const messagingPrivacyRequiredControls = [
      "Redact PII, payment, medical, private URLs, and signed attachment URLs before persistence, logs, exports, or previews.",
      "Apply role-based field visibility before returning message records to dashboard or client views.",
      "Require secure attachment policy before exposing or exporting message attachments.",
      "Omit provider payloads, raw destinations, private URLs, and secrets from message exports.",
      "Persist retention/delete/export audit events with actor, tenant, thread, and idempotency key.",
      "Apply spam/rate-limit controls before storing or routing suspicious inbound messages.",
    ] as const;

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
    tenantId: input.tenantId,
    actorId: input.actorId,
    threadId: input.threadId,
    messageId: input.messageId,
    body: input.body,
    bodyRedacted: input.bodyRedacted,
    attachmentUrl: input.attachmentUrl,
    attachmentPolicyApproved: input.attachmentPolicyApproved,
    retentionDays: input.retentionDays,
    exportIncludesProviderPayloads: input.exportIncludesProviderPayloads,
    exportIncludesPrivateUrls: input.exportIncludesPrivateUrls,
    deleteRequestedAt: input.deleteRequestedAt,
    spamScore: input.spamScore,
    rateLimitAllowed: input.rateLimitAllowed,
    idempotencyKey: input.idempotencyKey,
    action: input.action,
    role: input.role,
    visibleFields,
    redactionFindings: findings,
    requiredWrites: ["MessagePrivacyEvent", "MessageAuditLog", "IdempotencyKey"],
    requiredControls: messagingPrivacyRequiredControls,
    blockers,
  };
}

export const notificationRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "provider sandbox email/SMS/push smoke",
      "webhook signature, replay, and idempotency tests",
      "tenant delivery-log and message-thread isolation integration tests",
    ] as const;

export const notificationRuntimeReadinessRequiredControls = [
      "Resolve channel delivery through consent and suppression state immediately before send.",
      "Persist tenant-scoped NotificationDelivery, ProviderEvent, MessageThread, Message, suppression, and audit records transactionally.",
      "Verify Resend, Twilio, and Expo webhook signatures before reconciliation.",
      "Apply replay protection and idempotency keys to provider events, queue jobs, and preference mutations.",
      "Process SMS STOP/HELP, email unsubscribe, bounce/complaint, and invalid push token suppression before future sends.",
      "Use queue retries with bounded exponential backoff and dead-letter audit trails.",
      "Keep raw destinations, provider payloads, private URLs, and sensitive message bodies out of logs and exports.",
    ] as const;

export function buildNotificationRuntimeReadinessPlan(input: NotificationRuntimeReadinessInput): NotificationRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.packageTestsPassed) blockers.push("Notification package tests must pass before runtime promotion.");
  if (!input.packageTypecheckPassed) blockers.push("Notification package typecheck must pass before runtime promotion.");
  if (!input.providerCredentialsConfigured) blockers.push("Resend, Twilio, and Expo provider credentials must be configured in a secret store.");
  if (!input.providerSandboxSmokeVerified) blockers.push("Provider sandbox email, SMS, and push smoke tests must pass.");
  if (!input.queueWorkerConfigured) blockers.push("Notification queue worker must be configured before provider-backed automation.");
  if (!input.deliveryLogPersistenceConfigured) blockers.push("Tenant-scoped NotificationDelivery persistence must be configured.");
  if (!input.messageThreadPersistenceConfigured) blockers.push("Tenant-scoped message thread persistence must be configured.");
  if (!input.consentStoreConfigured) blockers.push("Consent/preference store must be configured before non-transactional delivery.");
  if (!input.unsubscribeStopConfigured) blockers.push("Email unsubscribe, SMS STOP/HELP, and suppression controls must be configured.");
  if (!input.webhookSignatureVerificationConfigured) blockers.push("Provider webhook signature verification must be configured.");
  if (!input.webhookReplayProtectionConfigured) blockers.push("Provider webhook replay/idempotency protection must be configured.");
  if (!input.pushTokenStoreConfigured) blockers.push("Push token registration and revocation store must be configured.");
  if (!input.expoPushConfigured) blockers.push("Expo push delivery and receipt processing must be configured.");
  if (!input.retryBackoffConfigured) blockers.push("Retry backoff policy must be configured before worker retries.");
  if (!input.deadLetterQueueConfigured) blockers.push("Dead-letter queue handling must be configured before production retries.");
  if (!input.tenantIsolationVerified) blockers.push("Notification/message tenant isolation must be verified with integration tests.");
  if (!input.templateLegalReviewApproved) blockers.push("Notification templates, consent copy, STOP/HELP copy, and policy language need legal/product approval.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: notificationRuntimeReadinessRequiredCommands,
    requiredControls: notificationRuntimeReadinessRequiredControls,
    blockers,
  };
}

export interface MobilePushRuntimeReadinessInput {
  packageScripts: readonly string[];
  notificationTestsPassed: boolean;
  notificationTypecheckPassed: boolean;
  mobileTypecheckPassed: boolean;
  mobileDeviceTestsPassed: boolean;
  expoProjectConfigured: boolean;
  expoAccessTokenConfigured: boolean;
  permissionPromptImplemented: boolean;
  deviceTokenRegistrationImplemented: boolean;
  pushTokenStoreConfigured: boolean;
  pushOptOutUiImplemented: boolean;
  deliveryLogPersistenceConfigured: boolean;
  auditLogPersistenceConfigured: boolean;
  receiptWorkerConfigured: boolean;
  invalidTokenSuppressionTested: boolean;
  tapRoutingImplemented: boolean;
  foregroundDeliveryTested: boolean;
  backgroundDeliveryTested: boolean;
  deepLinkRoutingTested: boolean;
}

export interface MobilePushRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof mobilePushRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly MobilePushRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export const mobilePushRuntimeReadinessRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/mobile typecheck",
      "configure Expo project id, access token, APNs, and FCM credentials",
      "persist tenant/user/device push tokens and opt-out state",
      "Expo push send smoke test against a real device token",
      "persist Expo ProviderEvent receipt reconciliation records",
      "persist NotificationInteraction tap/open records",
      "persist mobile push audit log records",
      "Expo receipt polling smoke test",
      "mobile push tap deep-link routing smoke",
      "Expo foreground push smoke test",
      "Expo background push smoke test",
      "Expo push tap deep-link smoke test",
      "iOS foreground/background/tap push QA",
      "Android foreground/background/tap push QA",
      "GitHub Actions mobile push evidence job",
    ] as const;

export const mobilePushRuntimeReadinessRequiredEvidence = [
      "Expo project and secret configuration evidence",
      "tenant/user/device push-token persistence evidence",
      "Expo receipt reconciliation and invalid-token suppression test output",
      "foreground/background push and tap-routing device evidence",
    ] as const;

export type MobilePushRuntimeReadinessRequiredEvidence = typeof mobilePushRuntimeReadinessRequiredEvidence[number];

export function buildMobilePushRuntimeReadinessPlan(input: MobilePushRuntimeReadinessInput): MobilePushRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: MobilePushRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationTestsPassed) blockers.push("@inkroute/notifications Expo push tests must pass.");
  if (!input.notificationTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with push registration and tap routing wired.");
  if (!input.mobileDeviceTestsPassed) blockers.push("Expo mobile foreground/background push device tests must pass.");
  if (!input.expoProjectConfigured) blockers.push("Expo project id must be configured before push runtime promotion.");
  if (!input.expoAccessTokenConfigured) blockers.push("Expo access token must be configured in a secret store.");
  if (!input.permissionPromptImplemented) blockers.push("Mobile push permission prompt evidence must be captured before push runtime readiness.");
  if (!input.deviceTokenRegistrationImplemented) blockers.push("Device token registration flow evidence must be captured before push runtime readiness.");
  if (!input.pushTokenStoreConfigured) blockers.push("Tenant/user/device-scoped push token store must be configured.");
  if (!input.pushOptOutUiImplemented) blockers.push("Mobile push opt-out UI contract and persistence proof must be captured before provider delivery readiness.");
  if (!input.deliveryLogPersistenceConfigured) blockers.push("Push delivery logs must persist NotificationDelivery and ProviderEvent rows.");
  if (!input.auditLogPersistenceConfigured) blockers.push("Push registration, opt-out, delivery, receipt, and tap actions must write audit logs.");
  if (!input.receiptWorkerConfigured) blockers.push("Expo receipt worker must reconcile delivery state.");
  if (!input.invalidTokenSuppressionTested) blockers.push("Invalid Expo token receipts must suppress or deactivate tokens.");
  if (!input.tapRoutingImplemented) blockers.push("Notification tap routing must be implemented with safe internal deep links.");
  if (!input.foregroundDeliveryTested) blockers.push("Foreground push delivery must be tested on device/simulator.");
  if (!input.backgroundDeliveryTested) blockers.push("Background push delivery must be tested on device/simulator.");
  if (!input.deepLinkRoutingTested) blockers.push("Push tap deep-link routing must be tested for booking/message contexts.");

  if (!input.expoProjectConfigured || !input.expoAccessTokenConfigured) requiredEvidence.push(mobilePushRuntimeReadinessRequiredEvidence[0]);
  if (!input.deviceTokenRegistrationImplemented || !input.pushTokenStoreConfigured) requiredEvidence.push(mobilePushRuntimeReadinessRequiredEvidence[1]);
  if (!input.deliveryLogPersistenceConfigured || !input.receiptWorkerConfigured || !input.invalidTokenSuppressionTested) {
    requiredEvidence.push(mobilePushRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.foregroundDeliveryTested || !input.backgroundDeliveryTested || !input.deepLinkRoutingTested) {
    requiredEvidence.push(mobilePushRuntimeReadinessRequiredEvidence[3]);
  }
  const requiredEvidenceResult =
    requiredEvidence.length === mobilePushRuntimeReadinessRequiredEvidence.length
      ? mobilePushRuntimeReadinessRequiredEvidence
      : requiredEvidence;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobilePushRuntimeReadinessRequiredCommands,
    requiredEvidence: requiredEvidenceResult,
    blockers,
  };
}

export interface NotificationLaunchEvidenceInput {
  packageScripts: readonly string[];
  notificationsTypecheckPassed: boolean;
  notificationsTestsPassed: boolean;
  providerSdksConfigured: boolean;
  resendSandboxSendPassed: boolean;
  twilioSandboxSendPassed: boolean;
  expoPushDeviceSendPassed: boolean;
  queueWorkerImplemented: boolean;
  deliveryPersistenceConfigured: boolean;
  providerEventPersistenceConfigured: boolean;
  messageThreadPersistenceConfigured: boolean;
  preferenceCenterImplemented: boolean;
  unsubscribeStopSuppressionTested: boolean;
  quietHoursRateLimitTested: boolean;
  signedWebhookVerificationPassed: boolean;
  retryDeadLetterFlowTested: boolean;
  tenantIsolationTestsPassed: boolean;
  redactionPrivacyReviewPassed: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface NotificationLaunchEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof notificationLaunchEvidenceRequiredCommands;
  requiredEvidence: readonly NotificationLaunchEvidenceRequiredEvidence[];
  requiredControls: typeof notificationLaunchEvidenceRequiredControls;
  blockers: readonly string[];
}

export const notificationLaunchEvidenceRequiredCommands = [
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification provider sandbox tests",
      "notification queue worker integration tests",
      "provider webhook signature/replay tests",
      "message thread/preference suppression integration tests",
      "Expo push device smoke",
      "GitHub Actions notification launch evidence job",
    ] as const;

export const notificationLaunchEvidenceRequiredControls = [
      "Resolve consent, preference, suppression, quiet-hours, and rate-limit state immediately before every send.",
      "Persist NotificationDelivery, ProviderEvent, MessageThread, Message, audit, and idempotency records with tenant scope.",
      "Verify provider signatures against raw webhook bodies and reject replayed events before side effects.",
      "Process unsubscribe, STOP/HELP, bounce/complaint, invalid push token, retry, and dead-letter flows before future delivery attempts.",
      "Redact raw destinations, provider payloads, message bodies, private URLs, and secrets from CI artifacts and logs.",
    ] as const;

export const notificationLaunchEvidenceRequiredEvidence = [
      "Resend, Twilio, and Expo provider sandbox/device send evidence",
      "queue worker retry, idempotency, and dead-letter evidence",
      "tenant-scoped NotificationDelivery, ProviderEvent, and MessageThread persistence evidence",
      "preference center, unsubscribe, STOP, quiet-hours, and rate-limit evidence",
      "signed webhook verification and replay rejection evidence",
      "redacted artifact and privacy review evidence",
      "GitHub Actions notification launch evidence",
    ] as const;

export type NotificationLaunchEvidenceRequiredEvidence = typeof notificationLaunchEvidenceRequiredEvidence[number];

export function buildNotificationLaunchEvidencePlan(input: NotificationLaunchEvidenceInput): NotificationLaunchEvidencePlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: NotificationLaunchEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/notifications ${script} script.`);
  if (!input.notificationsTypecheckPassed) blockers.push("@inkroute/notifications typecheck must pass before notification launch.");
  if (!input.notificationsTestsPassed) blockers.push("@inkroute/notifications tests must pass before notification launch.");
  if (!input.providerSdksConfigured) blockers.push("Resend, Twilio, and Expo provider SDK runtimes must be configured.");
  if (!input.resendSandboxSendPassed) blockers.push("Resend sandbox email send must pass with redacted evidence.");
  if (!input.twilioSandboxSendPassed) blockers.push("Twilio sandbox SMS send must pass with STOP/HELP controls.");
  if (!input.expoPushDeviceSendPassed) blockers.push("Expo push device send must pass on a real device or simulator evidence run.");
  if (!input.queueWorkerImplemented) blockers.push("Notification queue worker source-contract and execution evidence must be captured before provider-backed delivery.");
  if (!input.deliveryPersistenceConfigured) blockers.push("Tenant-scoped NotificationDelivery persistence must be configured.");
  if (!input.providerEventPersistenceConfigured) blockers.push("Tenant-scoped ProviderEvent persistence must be configured.");
  if (!input.messageThreadPersistenceConfigured) blockers.push("Tenant-scoped MessageThread persistence must be configured.");
  if (!input.preferenceCenterImplemented) blockers.push("Preference center and tenant channel settings must be implemented.");
  if (!input.unsubscribeStopSuppressionTested) blockers.push("Email unsubscribe and SMS STOP suppression must be tested before launch.");
  if (!input.quietHoursRateLimitTested) blockers.push("SMS quiet-hours and notification rate-limit behavior must be tested.");
  if (!input.signedWebhookVerificationPassed) blockers.push("Provider webhook signature and replay verification tests must pass.");
  if (!input.retryDeadLetterFlowTested) blockers.push("Notification retry and dead-letter flows must be tested.");
  if (!input.tenantIsolationTestsPassed) blockers.push("Notification delivery, provider event, and message thread tenant isolation tests must pass.");
  if (!input.redactionPrivacyReviewPassed) blockers.push("Notification payload redaction and privacy review must pass.");
  if (!input.ciEvidenceCaptured) blockers.push("Notification launch CI evidence must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Launch artifacts must prove secrets and raw destinations are redacted.");

  if (!input.providerSdksConfigured || !input.resendSandboxSendPassed || !input.twilioSandboxSendPassed || !input.expoPushDeviceSendPassed) {
    requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[0]);
  }
  if (!input.queueWorkerImplemented || !input.retryDeadLetterFlowTested) {
    requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[1]);
  }
  if (!input.deliveryPersistenceConfigured || !input.providerEventPersistenceConfigured || !input.messageThreadPersistenceConfigured || !input.tenantIsolationTestsPassed) {
    requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[2]);
  }
  if (!input.preferenceCenterImplemented || !input.unsubscribeStopSuppressionTested || !input.quietHoursRateLimitTested) {
    requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[3]);
  }
  if (!input.signedWebhookVerificationPassed) requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[4]);
  if (!input.redactionPrivacyReviewPassed || !input.secretSafeArtifactsCaptured) requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[5]);
  if (!input.ciEvidenceCaptured) requiredEvidence.push(notificationLaunchEvidenceRequiredEvidence[6]);

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: notificationLaunchEvidenceRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === notificationLaunchEvidenceRequiredEvidence.length
        ? notificationLaunchEvidenceRequiredEvidence
        : requiredEvidence,
    requiredControls: notificationLaunchEvidenceRequiredControls,
    blockers,
  };
}

export const providerBoundaryMatrix: Array<{ provider: NotificationProvider; channel: NotificationChannel; credentialEnvVars: string[]; productionRequirement: string; gapId: string }> = [
  { provider: "resend", channel: "email", credentialEnvVars: ["RESEND_API_KEY", "EMAIL_FROM"], productionRequirement: "Transactional email domain, sender verification, provider webhooks, unsubscribe footer, delivery logs.", gapId: "GAP-061" },
  { provider: "twilio", channel: "sms", credentialEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_MESSAGING_SERVICE_SID"], productionRequirement: "SMS consent capture, STOP/HELP handling, quiet hours, delivery callbacks, phone number compliance.", gapId: "GAP-062" },
  { provider: "expo", channel: "push", credentialEnvVars: ["EXPO_ACCESS_TOKEN", "EXPO_PROJECT_ID"], productionRequirement: "Push token registration, token refresh, delivery receipts, deep links, opt-out controls.", gapId: "GAP-063" },
  { provider: "in_app", channel: "in_app", credentialEnvVars: ["DATABASE_URL"], productionRequirement: "Tenant-scoped notification records, read/unread state, message thread linking, audit logs.", gapId: "GAP-064" },
];
