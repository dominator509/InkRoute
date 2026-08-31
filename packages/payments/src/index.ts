import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ISODateString, PaymentStatus } from "@inkroute/types";

function buildHashedPaymentIdempotencyKey(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

export type CurrencyCode = "usd";
export type AppointmentPaymentType = "consultation" | "flash" | "custom" | "large_scale" | "touch_up" | "guest_spot";
export type TravelRiskTier = "local" | "standard_travel" | "high_demand_guest_spot";
export type DepositDecision = "not_required" | "recommended" | "required" | "manual_review";
export type RefundDecision = "eligible" | "partial" | "not_eligible" | "manual_review";
export type NoShowDecision = "mark_no_show" | "forfeit_deposit" | "manual_review" | "waive_fee";
export type PaymentAuditAction =
  | "deposit_policy_calculated"
  | "deposit_requested"
  | "checkout_session_requested"
  | "checkout_session_created"
  | "checkout_completed"
  | "payment_failed"
  | "deposit_paid"
  | "refund_requested"
  | "refund_succeeded"
  | "refund_failed"
  | "manual_payment_recorded"
  | "no_show_reviewed"
  | "deposit_forfeited"
  | "webhook_received"
  | "webhook_rejected";

export type StripeWebhookEventType =
  | "checkout.session.completed"
  | "checkout.session.expired"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "charge.refunded"
  | "charge.dispute.created"
  | "unknown";

export interface DepositPolicyRules {
  policyVersion: string;
  minimumDepositCents: number;
  hourlyDepositRateCents: number;
  highDemandCityPremiumCents: number;
  guestSpotPremiumCents: number;
  lateCancellationPremiumCents: number;
  noShowPremiumCents: number;
  largeScaleMinimumCents: number;
  flashMinimumCents: number;
  touchUpMinimumCents: number;
  cityDemandPremiumPerPointCents: number;
  depositDueWithinHours: number;
  nonRefundableWindowHours: number;
  maxDepositCents: number;
}

export interface DepositPolicyInput {
  estimatedSessionHours: number;
  city?: string;
  clientHasNoShowHistory?: boolean;
  clientCompletedAppointments?: number;
  clientLateCancellationCount?: number;
  clientNoShowCount?: number;
  minimumDepositCents?: number;
  appointmentType?: AppointmentPaymentType;
  travelRiskTier?: TravelRiskTier;
  cityDemandScore?: number;
  budgetRange?: string;
  sessionStartsAt?: ISODateString;
  rules?: Partial<DepositPolicyRules>;
}

export interface DepositPolicyBreakdownLine {
  label: string;
  amountCents: number;
  note: string;
}

export interface DepositPolicyResult {
  depositRequired: boolean;
  depositAmountCents: number;
  reason: string;
  decision: DepositDecision;
  currency: CurrencyCode;
  policyVersion: string;
  riskScore: number;
  dueWithinHours: number;
  nonRefundableWindowHours: number;
  breakdown: DepositPolicyBreakdownLine[];
  recommendedNextAction: string;
}

export interface CreateDepositSessionInput {
  tenantId: string;
  bookingRequestId: string;
  amountCents: number;
  currency: CurrencyCode;
  successUrl: string;
  cancelUrl: string;
  clientEmail?: string;
  clientName?: string;
  artistDisplayName?: string;
  description?: string;
  policyVersion?: string;
}

export interface CreateDepositSessionResult {
  provider: "stripe";
  checkoutUrl: string;
  providerSessionId: string;
}

export interface StripeCheckoutSessionDraft {
  mode: "payment";
  clientReferenceId: string;
  customerEmail?: string;
  lineItem: {
    name: string;
    description: string;
    amountCents: number;
    currency: CurrencyCode;
    quantity: 1;
  };
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface StripeCheckoutExecutionReadinessInput extends CreateDepositSessionInput {
  stripeSdkInstalled: boolean;
  stripeSecretConfigured: boolean;
  stripeApiVersionPinned: boolean;
  idempotencyStoreAvailable: boolean;
  persistenceAvailable: boolean;
  signedBookingTokenValid: boolean;
  allowedRedirectHosts: readonly string[];
}

export interface StripeCheckoutExecutionReadiness {
  status: "ready" | "blocked";
  canCallStripe: boolean;
  draft: StripeCheckoutSessionDraft;
  requiredWrites: readonly string[];
  requiredControls: typeof stripeCheckoutExecutionRequiredControls;
  blockers: readonly string[];
}

export interface StripeCheckoutRouteRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  paymentsTestsPassed: boolean;
  paymentsTypecheckPassed: boolean;
  webPaymentRouteTestsPassed: boolean;
  webTypecheckPassed: boolean;
  stripeSdkInstalled: boolean;
  stripeSecretConfigured: boolean;
  stripeApiVersionPinned: boolean;
  checkoutRouteUsesStripeClient: boolean;
  acceptedBookingOrSignedTokenEnforced: boolean;
  idempotencyKeyPersistedBeforeProviderCall: boolean;
  providerSessionPersisted: boolean;
  paymentAuditLogPersisted: boolean;
  tenantScopedTransactionConfigured: boolean;
  allowedRedirectHostsEnforced: boolean;
  safeBrowserResponseVerified: boolean;
  invalidTokenRejectedTested: boolean;
  expiredTokenRejectedTested: boolean;
  webhookReconciliationVerified: boolean;
  stripeTestModeCheckoutVerified: boolean;
}

export const stripeCheckoutExecutionRequiredControls = [
  "Create Checkout Session only for accepted bookings or valid signed deposit tokens.",
  "Persist idempotency key before provider call and reuse it for Stripe request options.",
  "Persist provider session id and redirect URL after Stripe returns.",
  "Return only Stripe-hosted checkout URL to the browser; never return secret keys or raw provider payloads.",
  "Reconcile final payment state only through verified Stripe webhooks.",
] as const;

export const stripeCheckoutRouteRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "capture installed Stripe SDK/API-version source contract and redacted secret evidence",
  "configure STRIPE_SECRET_KEY in secret store",
  "enforce accepted booking or short-lived signed deposit token",
  "persist idempotency key before calling Stripe Checkout",
  "persist Stripe Checkout session id and redirect URL after provider creation",
  "persist PaymentAuditLog for Checkout attempts and outcomes",
  "wrap Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes in one tenant-scoped transaction",
  "enforce success/cancel redirect host allowlist at route boundary",
  "return only Stripe-hosted redirect URL and redacted local ids to browser",
  "test invalid and expired signed deposit token rejection",
  "stripe checkout session create test-mode smoke",
  "stripe trigger checkout.session.completed",
  "GitHub Actions Stripe Checkout evidence job",
] as const;

export interface StripeCheckoutRouteRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof stripeCheckoutRouteRuntimeRequiredCommands;
  requiredEvidence: readonly StripeCheckoutRouteRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const stripeCheckoutRouteRuntimeRequiredEvidence = [
  "Stripe Checkout client route wiring with secret-backed test-mode configuration",
  "accepted-booking or signed-token authorization tests for valid, invalid, and expired deposit access",
  "tenant-scoped transaction evidence for Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes",
  "safe redirect allowlist and browser response redaction test output",
  "Stripe test-mode Checkout and verified webhook reconciliation transcript",
] as const;

export type StripeCheckoutRouteRuntimeRequiredEvidence =
  (typeof stripeCheckoutRouteRuntimeRequiredEvidence)[number];

export interface RefundPolicyInput {
  amountPaidCents: number;
  requestedRefundCents?: number;
  cancellationRequestedAt: ISODateString;
  appointmentStartsAt: ISODateString;
  nonRefundableWindowHours?: number;
  clientNoShowCount?: number;
  artistCancelled?: boolean;
  forceMajeure?: boolean;
  policyAllowsManualReview?: boolean;
}

export interface RefundPolicyResult {
  decision: RefundDecision;
  refundableAmountCents: number;
  retainedAmountCents: number;
  reason: string;
  hoursBeforeAppointment: number;
  requiresManualReview: boolean;
}

export interface NoShowPolicyInput {
  depositAmountCents: number;
  appointmentStartsAt: ISODateString;
  markedAt: ISODateString;
  clientArrivedMinutesLate?: number;
  clientContactedArtist?: boolean;
  artistWaivedFee?: boolean;
  emergencyClaimed?: boolean;
}

export interface NoShowPolicyResult {
  decision: NoShowDecision;
  forfeitedAmountCents: number;
  reason: string;
  requiresAudit: boolean;
  recommendedBookingStatus: "no_show" | "cancelled" | "reschedule_requested" | "scheduled";
}

export interface StripeWebhookInterpretation {
  eventType: StripeWebhookEventType;
  action: PaymentAuditAction;
  targetStatus: PaymentStatus;
  requiresProviderFetch: boolean;
  safeToAutoReconcile: boolean;
  note: string;
}

export interface StripeWebhookReconciliationInput {
  eventId: string;
  eventType: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  amountCents?: number;
  currency?: CurrencyCode;
  expectedAmountCents?: number;
  expectedCurrency?: CurrencyCode;
  alreadyProcessedEventIds?: readonly string[];
}

export interface StripeWebhookReconciliationPlan {
  eventId: string;
  interpretation: StripeWebhookInterpretation;
  action: PaymentAuditAction;
  targetStatus: PaymentStatus;
  idempotencyKey: string;
  shouldPersistAuditLog: boolean;
  shouldReconcile: boolean;
  blockers: readonly string[];
  requiredChecks: readonly string[];
}

export interface StripeWebhookSignatureVerificationInput {
  rawBody: string;
  signatureHeader: string | null;
  endpointSecret: string | null | undefined;
  nowEpochSeconds: number;
  toleranceSeconds?: number;
}

export interface StripeWebhookSignatureVerificationResult {
  verified: boolean;
  status: "verified" | "missing_header" | "missing_secret" | "malformed_header" | "timestamp_outside_tolerance" | "signature_mismatch";
  timestamp?: number;
  toleranceSeconds: number;
  signedPayloadPreview: string;
  reason: string;
}

export interface StripeWebhookRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  paymentsTestsPassed: boolean;
  paymentsTypecheckPassed: boolean;
  webWebhookRouteTestsPassed: boolean;
  webTypecheckPassed: boolean;
  stripeSdkInstalled: boolean;
  constructEventUsesRawBody: boolean;
  webhookSecretConfigured: boolean;
  invalidSignatureRejected: boolean;
  timestampToleranceEnforced: boolean;
  replayProtectionPersisted: boolean;
  supportedEventsCovered: readonly StripeWebhookEventType[];
  providerObjectFetchConfigured: boolean;
  tenantResolutionFromTrustedMetadata: boolean;
  depositPaymentRefundPersistenceConfigured: boolean;
  paymentAuditLogPersistenceConfigured: boolean;
  bookingStateEventPersistenceConfigured: boolean;
  tenantScopedTransactionConfigured: boolean;
  amountCurrencyMismatchRejected: boolean;
  unknownEventsLoggedAndIgnored: boolean;
  stripeCliReplayVerified: boolean;
}

export const stripeWebhookRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
  "use Stripe SDK constructEvent with raw request body and STRIPE_WEBHOOK_SECRET",
  "reject invalid and stale Stripe signatures before trusted parsing",
  "persist Stripe provider event ids for replay protection",
  "cover checkout completed/expired, payment succeeded/failed, refund, and dispute events",
  "fetch or verify Stripe provider objects before reconciliation",
  "resolve tenant from trusted provider metadata or persisted provider ids",
  "reconcile Deposit, Payment, and Refund records",
  "persist PaymentAuditLog for accepted and rejected Stripe events",
  "persist BookingStateEvent for payment lifecycle changes",
  "run webhook reconciliation writes in one tenant-scoped transaction",
  "reject amount and currency mismatches before reconciliation",
  "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
  "stripe trigger checkout.session.completed",
  "stripe trigger payment_intent.payment_failed",
  "stripe trigger charge.refunded",
  "Stripe CLI replay for supported events, invalid signature, and replay denial",
  "GitHub Actions Stripe webhook evidence job",
] as const;

export interface StripeWebhookRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingSupportedEvents: readonly StripeWebhookEventType[];
  requiredCommands: typeof stripeWebhookRuntimeRequiredCommands;
  requiredEvidence: readonly StripeWebhookRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const stripeWebhookRuntimeRequiredEvidence = [
  "Stripe SDK constructEvent raw-body verification evidence with STRIPE_WEBHOOK_SECRET",
  "persistent event-id replay protection and tenant-scoped transaction evidence",
  "supported event reconciliation tests for success, failure, expiration, refund, dispute, and mismatch cases",
  "Deposit, Payment, Refund, BookingStateEvent, and PaymentAuditLog persistence evidence",
  "Stripe CLI replay transcript for supported events, invalid signature, and replay denial",
] as const;

export type StripeWebhookRuntimeRequiredEvidence =
  (typeof stripeWebhookRuntimeRequiredEvidence)[number];

export type PaymentLifecycleAction =
  | "create_deposit"
  | "record_checkout_session"
  | "mark_paid"
  | "mark_failed"
  | "mark_refunded"
  | "mark_disputed";

export type PaymentLifecycleWriteModel =
  | "Deposit"
  | "Payment"
  | "Refund"
  | "PaymentAuditLog"
  | "BookingStateEvent"
  | "IdempotencyKey";

export interface PaymentLifecyclePlanInput {
  tenantId: string;
  bookingRequestId: string;
  action: PaymentLifecycleAction;
  amountCents: number;
  currency: CurrencyCode;
  provider: "stripe" | "manual";
  occurredAt: ISODateString;
  paymentId?: string;
  depositId?: string;
  providerSessionId?: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  actorId?: string;
  idempotencyKey?: string;
}

export interface PaymentLifecycleWrite {
  model: PaymentLifecycleWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export const paymentLifecyclePersistenceRequiredControls = [
  "Execute all writes in one tenant-scoped database transaction.",
  "Insert or claim the idempotency key before mutating payment state.",
  "Reject cross-tenant deposit, payment, refund, and booking ids before applying writes.",
  "Write PaymentAuditLog for every lifecycle mutation, including failed and disputed outcomes.",
  "Treat provider webhook ids as replay protection inputs and never as tenant authorization.",
] as const;

export interface PaymentLifecyclePersistencePlan {
  status: "ready" | "blocked";
  action: PaymentLifecycleAction;
  targetStatus: PaymentStatus;
  auditAction: PaymentAuditAction;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly PaymentLifecycleWrite[];
  requiredControls: typeof paymentLifecyclePersistenceRequiredControls;
  blockers: readonly string[];
}

export interface PaymentPersistenceRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  paymentsTestsPassed: boolean;
  paymentsTypecheckPassed: boolean;
  dbSchemaIncludesPaymentModels: boolean;
  repositoriesImplemented: boolean;
  tenantScopedQueriesEnforced: boolean;
  transactionalMutationsImplemented: boolean;
  idempotencyStoreImplemented: boolean;
  depositCreationPersisted: boolean;
  providerSessionPersisted: boolean;
  paidTransitionPersisted: boolean;
  failedTransitionPersisted: boolean;
  refundTransitionPersisted: boolean;
  disputeTransitionPersisted: boolean;
  paymentAuditLogPersistedForEveryMutation: boolean;
  bookingStateEventPersistedForLifecycleChanges: boolean;
  crossTenantIsolationTestsPassed: boolean;
  replayIdempotencyTestsPassed: boolean;
  seededPostgresIntegrationTestsPassed: boolean;
  dashboardPaymentReadsUseRepository: boolean;
}

export const paymentPersistenceRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/db prisma validate",
  "payment persistence seeded Postgres integration tests",
  "dashboard payment repository route/action tests",
] as const;

export interface PaymentPersistenceRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof paymentPersistenceRuntimeRequiredCommands;
  requiredEvidence: readonly PaymentPersistenceRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const paymentPersistenceRuntimeRequiredEvidence = [
  "Prisma models and tenant-scoped payment repository/service implementation",
  "deposit, provider-session, paid, and failed transition persistence test output",
  "refund and dispute persistence test output",
  "PaymentAuditLog and BookingStateEvent persistence evidence for every lifecycle mutation",
  "seeded Postgres integration tests for tenant isolation and idempotent replay",
] as const;

export type PaymentPersistenceRuntimeRequiredEvidence =
  (typeof paymentPersistenceRuntimeRequiredEvidence)[number];

export type PaymentOperationsWorkflowAction =
  | "execute_refund"
  | "record_no_show_forfeiture"
  | "prepare_dispute_evidence"
  | "generate_receipt"
  | "create_accounting_export";

export type PaymentOperationsWriteModel =
  | "Payment"
  | "Refund"
  | "PaymentAuditLog"
  | "BookingStateEvent"
  | "DisputeEvidence"
  | "Receipt"
  | "AccountingExport"
  | "IdempotencyKey";

export interface PaymentOperationsWorkflowPlanInput {
  tenantId: string;
  bookingRequestId: string;
  paymentId: string;
  action: PaymentOperationsWorkflowAction;
  amountCents: number;
  currency: CurrencyCode;
  provider: "stripe" | "manual";
  occurredAt: ISODateString;
  actorId?: string;
  idempotencyKey?: string;
  providerPaymentIntentId?: string;
  providerChargeId?: string;
  refundAmountCents?: number;
  noShowDecision?: NoShowDecision;
  evidenceFileIds?: readonly string[];
  clientEmail?: string;
  receiptNumber?: string;
  stripeRefundsEnabled?: boolean;
  receiptDeliveryConfigured?: boolean;
  exportReviewerId?: string;
  taxReviewApproved?: boolean;
}

export interface PaymentOperationsWrite {
  model: PaymentOperationsWriteModel;
  tenantId: string;
  payload: Record<string, unknown>;
}

export const paymentOperationsWorkflowRequiredControls = [
  "Authorize the actor against the tenant and payment before provider calls or local writes.",
  "Claim the idempotency key before executing Stripe refunds, receipt delivery, or export creation.",
  "Persist PaymentAuditLog and operation result in the same transaction as local state changes.",
  "Store redacted provider references only; never persist secret keys or raw unredacted provider payloads.",
  "Require accounting/tax review before enabling export files for production bookkeeping.",
] as const;

export interface PaymentOperationsWorkflowPlan {
  status: "ready" | "blocked";
  action: PaymentOperationsWorkflowAction;
  providerCall: string | null;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly PaymentOperationsWrite[];
  requiredControls: typeof paymentOperationsWorkflowRequiredControls;
  blockers: readonly string[];
}

export interface PaymentOperationsRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  paymentsTestsPassed: boolean;
  paymentsTypecheckPassed: boolean;
  dashboardPaymentActionsImplemented: boolean;
  refundActionAuthorized: boolean;
  stripeRefundsTestModeVerified: boolean;
  refundPersistenceConfigured: boolean;
  noShowForfeitureActionImplemented: boolean;
  noShowAuditPersistenceConfigured: boolean;
  disputeEvidenceWorkflowImplemented: boolean;
  disputeProviderSyncVerified: boolean;
  receiptGenerationImplemented: boolean;
  receiptDeliveryProviderConfigured: boolean;
  receiptDeliveryTested: boolean;
  accountingExportImplemented: boolean;
  exportRedactionVerified: boolean;
  taxAccountingReviewApproved: boolean;
  idempotencyConfiguredForOperations: boolean;
  paymentAuditLogPersistedForOperations: boolean;
  tenantAuthorizationTestsPassed: boolean;
  dashboardE2eEvidenceAttached: boolean;
}

export const paymentOperationsRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm --filter @inkroute/dashboard typecheck",
  "pnpm test:unit -- apps/dashboard tests for payment operations",
  "stripe refunds.create test-mode smoke",
  "dashboard payment operations E2E smoke",
] as const;

export interface PaymentOperationsRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof paymentOperationsRuntimeRequiredCommands;
  requiredEvidence: readonly PaymentOperationsRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export const paymentOperationsRuntimeRequiredEvidence = [
  "authorized dashboard/server actions with cross-tenant denial tests",
  "Stripe test-mode refund transcript and persisted Refund/PaymentAuditLog records",
  "no-show forfeiture action evidence with BookingStateEvent and PaymentAuditLog rows",
  "dispute evidence files and Stripe test-mode dispute sync transcript",
  "generated and delivered receipt evidence with redacted client/payment data",
  "accounting export file, redaction proof, and tax/accounting review approval",
  "idempotency, audit-log, and dashboard E2E evidence for all payment operations",
] as const;

export type PaymentOperationsRuntimeRequiredEvidence =
  (typeof paymentOperationsRuntimeRequiredEvidence)[number];

export interface PaymentAutomatedTestReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  paymentsUnitTestsPassed: boolean;
  paymentRouteTestsPassed: boolean;
  stripeSdkSignatureTestsPassed: boolean;
  stripeCliLifecycleTestsPassed: boolean;
  dbReconciliationTestsPassed: boolean;
  bookingToPaidE2ePassed: boolean;
  refundNoShowDisputeTestsPassed: boolean;
  receiptExportTestsPassed: boolean;
  crossTenantPaymentTestsPassed: boolean;
  replayIdempotencyTestsPassed: boolean;
  ciPaymentTestJobConfigured: boolean;
  artifactsCaptured: boolean;
}

export const paymentAutomatedTestReadinessRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
  "payment DB reconciliation integration tests",
  "Stripe CLI payment lifecycle tests",
  "Playwright booking-to-paid payment E2E flow",
] as const;

export interface PaymentAutomatedTestReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof paymentAutomatedTestReadinessRequiredCommands;
  requiredEvidence: readonly PaymentAutomatedTestReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export const paymentAutomatedTestReadinessRequiredEvidence = [
  "payment helper, route-boundary, and Stripe signature test output",
  "Stripe CLI lifecycle transcript for checkout success/failure/expiration/refund/dispute/replay",
  "seeded DB reconciliation, tenant isolation, and idempotent replay test output",
  "Playwright/dashboard E2E evidence for booking-to-paid, refund/no-show/dispute, receipt, and export flows",
  "CI payment test job configuration and retained artifacts",
] as const;

export type PaymentAutomatedTestReadinessRequiredEvidence =
  (typeof paymentAutomatedTestReadinessRequiredEvidence)[number];

export interface LiveStripePaymentsReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  stripeSdkInstalled: boolean;
  stripeSecretConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  stripeApiVersionPinned: boolean;
  checkoutProviderCallImplemented: boolean;
  paymentIntentLifecycleHandled: boolean;
  providerIdempotencyStoreBackedByDb: boolean;
  checkoutSessionPersisted: boolean;
  webhookRawBodyVerificationConfigured: boolean;
  webhookReplayProtectionPersisted: boolean;
  dbReconciliationTransactional: boolean;
  refundExecutionImplemented: boolean;
  disputeWorkflowImplemented: boolean;
  stripeCliLifecycleVerified: boolean;
  bookingToPaidE2eVerified: boolean;
  crossTenantPaymentIsolationVerified: boolean;
  ciPaymentEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface LiveStripePaymentsReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof liveStripePaymentsReadinessRequiredCommands;
  requiredEvidence: readonly LiveStripePaymentsReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export const liveStripePaymentsReadinessRequiredCommands = [
  "pnpm --filter @inkroute/payments typecheck",
  "pnpm --filter @inkroute/payments test",
  "pnpm vitest run apps/web/tests/payment-routes.test.ts",
  "pin Stripe SDK and configure redacted Stripe secret/webhook/API-version evidence",
  "create real Stripe Checkout sessions in provider-backed mode",
  "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
  "payment DB reconciliation integration tests",
  "authorized refund execution and dispute workflow tests",
  "Playwright booking-to-paid E2E flow",
  "GitHub Actions payment evidence job",
  "capture redacted payment artifacts without Stripe secrets or client-private data",
] as const;

export const liveStripePaymentsReadinessRequiredEvidence = [
  "Stripe SDK pin plus redacted secret/webhook/API-version configuration evidence.",
  "Real Checkout session creation with persisted provider session and DB-backed idempotency evidence.",
  "Raw-body webhook verification, replay protection, and supported lifecycle event evidence.",
  "Tenant-scoped transactional reconciliation and cross-tenant denial evidence.",
  "Refund execution and dispute workflow evidence or explicit blocked-operation audit evidence.",
  "Stripe CLI, booking-to-paid E2E, CI, and secret-safe artifact evidence.",
] as const;

export type LiveStripePaymentsReadinessRequiredEvidence =
  (typeof liveStripePaymentsReadinessRequiredEvidence)[number];

export interface PaymentReceiptExportRow {
  receiptNumber: string;
  tenantId: string;
  clientName: string;
  bookingRequestId: string;
  paymentId: string;
  provider: "stripe" | "manual" | "other";
  amountCents: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  paidAt?: ISODateString;
  description: string;
}

export const defaultDepositPolicyRules: DepositPolicyRules = {
  policyVersion: "phase7-demo-v1",
  minimumDepositCents: 10000,
  hourlyDepositRateCents: 5000,
  highDemandCityPremiumCents: 5000,
  guestSpotPremiumCents: 3500,
  lateCancellationPremiumCents: 3000,
  noShowPremiumCents: 7500,
  largeScaleMinimumCents: 25000,
  flashMinimumCents: 7500,
  touchUpMinimumCents: 0,
  cityDemandPremiumPerPointCents: 1000,
  depositDueWithinHours: 48,
  nonRefundableWindowHours: 72,
  maxDepositCents: 100000,
};

function mergeRules(overrides: Partial<DepositPolicyRules> | undefined, minimumDepositCents?: number): DepositPolicyRules {
  return {
    ...defaultDepositPolicyRules,
    ...overrides,
    minimumDepositCents: minimumDepositCents ?? overrides?.minimumDepositCents ?? defaultDepositPolicyRules.minimumDepositCents,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToNearestFiveDollars(cents: number): number {
  return Math.round(cents / 500) * 500;
}

function safeHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}

function riskTierScore(tier: TravelRiskTier | undefined): number {
  if (tier === "high_demand_guest_spot") return 35;
  if (tier === "standard_travel") return 18;
  return 5;
}

function appointmentMinimum(type: AppointmentPaymentType | undefined, rules: DepositPolicyRules): number {
  if (type === "large_scale") return rules.largeScaleMinimumCents;
  if (type === "flash") return rules.flashMinimumCents;
  if (type === "touch_up") return rules.touchUpMinimumCents;
  return rules.minimumDepositCents;
}

export function calculateDepositPolicy(input: DepositPolicyInput): DepositPolicyResult {
  const rules = mergeRules(input.rules, input.minimumDepositCents);
  const sessionHours = safeHours(input.estimatedSessionHours);
  const cityDemandScore = clamp(input.cityDemandScore ?? 2, 0, 5);
  const noShowCount = input.clientNoShowCount ?? (input.clientHasNoShowHistory ? 1 : 0);
  const lateCancelCount = input.clientLateCancellationCount ?? 0;
  const appointmentType = input.appointmentType ?? "custom";

  const baseAmount = Math.max(appointmentMinimum(appointmentType, rules), roundToNearestFiveDollars(sessionHours * rules.hourlyDepositRateCents));
  const cityDemandPremium = cityDemandScore > 3 ? (cityDemandScore - 3) * rules.cityDemandPremiumPerPointCents : 0;
  const travelPremium = input.travelRiskTier === "high_demand_guest_spot" ? rules.highDemandCityPremiumCents : 0;
  const guestSpotPremium = appointmentType === "guest_spot" ? rules.guestSpotPremiumCents : 0;
  const lateCancelPremium = lateCancelCount * rules.lateCancellationPremiumCents;
  const noShowPremium = noShowCount * rules.noShowPremiumCents;
  const rawAmount = baseAmount + cityDemandPremium + travelPremium + guestSpotPremium + lateCancelPremium + noShowPremium;
  const depositAmountCents = clamp(roundToNearestFiveDollars(rawAmount), 0, rules.maxDepositCents);

  const riskScore = clamp(
    Math.round(sessionHours * 7 + cityDemandScore * 6 + riskTierScore(input.travelRiskTier) + lateCancelCount * 12 + noShowCount * 28),
    0,
    100,
  );
  const returningClient = (input.clientCompletedAppointments ?? 0) >= 2 && noShowCount === 0 && lateCancelCount === 0;
  const depositRequired = depositAmountCents > 0 && !(appointmentType === "touch_up" && returningClient);
  const decision: DepositDecision = noShowCount > 1 || riskScore >= 85 ? "manual_review" : depositRequired ? "required" : "not_required";

  const breakdown: DepositPolicyBreakdownLine[] = [
    { label: "Session estimate", amountCents: baseAmount, note: `${sessionHours} hour estimate using policy minimums.` },
  ];
  if (cityDemandPremium > 0) breakdown.push({ label: "City demand", amountCents: cityDemandPremium, note: `${input.city ?? "Selected city"} demand score premium.` });
  if (travelPremium > 0) breakdown.push({ label: "High-demand travel", amountCents: travelPremium, note: "Guest-spot/travel scarcity premium." });
  if (guestSpotPremium > 0) breakdown.push({ label: "Guest spot", amountCents: guestSpotPremium, note: "Guest spot coordination premium." });
  if (lateCancelPremium > 0) breakdown.push({ label: "Late cancellation history", amountCents: lateCancelPremium, note: `${lateCancelCount} prior late cancellation record(s).` });
  if (noShowPremium > 0) breakdown.push({ label: "No-show history", amountCents: noShowPremium, note: `${noShowCount} prior no-show record(s).` });

  const reason = decision === "manual_review"
    ? "Manual review recommended because the payment risk score is high."
    : noShowCount > 0
      ? "Deposit increased because client has a no-show history."
      : appointmentType === "touch_up" && !depositRequired
        ? "Deposit not required for a trusted returning touch-up appointment."
        : "Standard deposit based on estimated session length.";

  return {
    depositRequired,
    depositAmountCents,
    reason,
    decision,
    currency: "usd",
    policyVersion: rules.policyVersion,
    riskScore,
    dueWithinHours: rules.depositDueWithinHours,
    nonRefundableWindowHours: rules.nonRefundableWindowHours,
    breakdown,
    recommendedNextAction: decision === "manual_review" ? "Artist or studio manager should review before sending a payment link." : depositRequired ? "Send a Stripe Checkout deposit link after booking acceptance." : "Do not send a deposit link unless artist policy changes.",
  };
}

export function buildStripeCheckoutSessionDraft(input: CreateDepositSessionInput): StripeCheckoutSessionDraft {
  const idempotencyKey = buildHashedPaymentIdempotencyKey("deposit", [input.tenantId, input.bookingRequestId, String(input.amountCents), input.currency]);
  const description = input.description ?? "Tattoo appointment deposit";
  const lineItemName = input.artistDisplayName ? `${input.artistDisplayName} tattoo deposit` : "Tattoo deposit";
  const customerEmail = input.clientEmail && input.clientEmail.includes("@") ? input.clientEmail : undefined;

  const draft: StripeCheckoutSessionDraft = {
    mode: "payment",
    clientReferenceId: input.bookingRequestId,
    lineItem: {
      name: lineItemName,
      description,
      amountCents: input.amountCents,
      currency: input.currency,
      quantity: 1,
    },
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    metadata: {
      tenantScopePersisted: "true",
      bookingRequestPersisted: "true",
      rawTenantIdStored: "false",
      rawBookingRequestIdStored: "false",
      internalPersistenceIdsStored: "false",
      policyVersion: input.policyVersion ?? defaultDepositPolicyRules.policyVersion,
      product: "inkroute_suite",
    },
    idempotencyKey,
  };

  if (customerEmail) {
    draft.customerEmail = customerEmail;
  }

  return draft;
}

function getUrlHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function buildStripeCheckoutExecutionReadiness(input: StripeCheckoutExecutionReadinessInput): StripeCheckoutExecutionReadiness {
  const draft = buildStripeCheckoutSessionDraft(input);
  const blockers: string[] = [];
  const successHost = getUrlHost(input.successUrl);
  const cancelHost = getUrlHost(input.cancelUrl);
  const hostAllowed = (host: string | null) => Boolean(host && input.allowedRedirectHosts.includes(host));

  if (!input.stripeSdkInstalled) blockers.push("Stripe SDK must be installed before live Checkout execution.");
  if (!input.stripeSecretConfigured) blockers.push("Stripe secret key must be configured in a secret store before live Checkout execution.");
  if (!input.stripeApiVersionPinned) blockers.push("Stripe API version must be pinned before live Checkout execution.");
  if (!input.idempotencyStoreAvailable) blockers.push("Idempotency store must be available before live Checkout execution.");
  if (!input.persistenceAvailable) blockers.push("Deposit, Payment, and PaymentAuditLog persistence must be available before live Checkout execution.");
  if (!input.signedBookingTokenValid) blockers.push("Signed booking/deposit token must be valid before creating a Checkout session.");
  if (!hostAllowed(successHost)) blockers.push("Success redirect host is not in the allowed redirect host list.");
  if (!hostAllowed(cancelHost)) blockers.push("Cancel redirect host is not in the allowed redirect host list.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    canCallStripe: blockers.length === 0,
    draft,
    requiredWrites: ["Deposit", "Payment", "PaymentAuditLog", "IdempotencyKey"],
    requiredControls: stripeCheckoutExecutionRequiredControls,
    blockers,
  };
}

export function buildStripeCheckoutRouteRuntimeReadinessPlan(
  input: StripeCheckoutRouteRuntimeReadinessInput,
): StripeCheckoutRouteRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: StripeCheckoutRouteRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.paymentsTestsPassed) blockers.push("@inkroute/payments tests must pass.");
  if (!input.paymentsTypecheckPassed) blockers.push("@inkroute/payments typecheck must pass.");
  if (!input.webPaymentRouteTestsPassed) blockers.push("Web payment route tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with Stripe route wiring.");
  if (!input.stripeSdkInstalled) blockers.push("Stripe SDK must be installed in the web/runtime dependency graph.");
  if (!input.stripeSecretConfigured) blockers.push("STRIPE_SECRET_KEY must be configured in the secret store.");
  if (!input.stripeApiVersionPinned) blockers.push("Stripe API version must be pinned for Checkout session creation.");
  if (!input.checkoutRouteUsesStripeClient) blockers.push("Deposit-session route must call the Stripe Checkout client instead of returning only a local preview.");
  if (!input.acceptedBookingOrSignedTokenEnforced) blockers.push("Deposit-session route must require an accepted booking or short-lived signed deposit token.");
  if (!input.idempotencyKeyPersistedBeforeProviderCall) blockers.push("Idempotency key must be persisted before calling Stripe Checkout.");
  if (!input.providerSessionPersisted) blockers.push("Stripe provider session id and redirect URL must be persisted after Checkout creation.");
  if (!input.paymentAuditLogPersisted) blockers.push("PaymentAuditLog must be persisted for Checkout session creation attempts and outcomes.");
  if (!input.tenantScopedTransactionConfigured) blockers.push("Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes must run in one tenant-scoped transaction.");
  if (!input.allowedRedirectHostsEnforced) blockers.push("Success and cancel redirect hosts must be allowlisted at the route boundary.");
  if (!input.safeBrowserResponseVerified) blockers.push("Browser response must expose only the hosted Checkout URL and redacted local ids.");
  if (!input.invalidTokenRejectedTested) blockers.push("Invalid signed deposit token rejection must be tested.");
  if (!input.expiredTokenRejectedTested) blockers.push("Expired signed deposit token rejection must be tested.");
  if (!input.webhookReconciliationVerified) blockers.push("Verified Stripe webhook reconciliation must prove final payment state.");
  if (!input.stripeTestModeCheckoutVerified) blockers.push("Stripe test-mode Checkout session creation must be verified with provider evidence.");

  if (!input.checkoutRouteUsesStripeClient || !input.stripeSdkInstalled || !input.stripeSecretConfigured) {
    requiredEvidence.push("Stripe Checkout client route wiring with secret-backed test-mode configuration");
  }
  if (!input.acceptedBookingOrSignedTokenEnforced || !input.invalidTokenRejectedTested || !input.expiredTokenRejectedTested) {
    requiredEvidence.push("accepted-booking or signed-token authorization tests for valid, invalid, and expired deposit access");
  }
  if (!input.idempotencyKeyPersistedBeforeProviderCall || !input.providerSessionPersisted || !input.paymentAuditLogPersisted || !input.tenantScopedTransactionConfigured) {
    requiredEvidence.push("tenant-scoped transaction evidence for Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes");
  }
  if (!input.safeBrowserResponseVerified || !input.allowedRedirectHostsEnforced) {
    requiredEvidence.push("safe redirect allowlist and browser response redaction test output");
  }
  if (!input.webhookReconciliationVerified || !input.stripeTestModeCheckoutVerified) {
    requiredEvidence.push("Stripe test-mode Checkout and verified webhook reconciliation transcript");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: stripeCheckoutRouteRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === stripeCheckoutRouteRuntimeRequiredEvidence.length
        ? stripeCheckoutRouteRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export async function createDepositSession(_input: CreateDepositSessionInput): Promise<CreateDepositSessionResult> {
  const draft = buildStripeCheckoutSessionDraft(_input);
  const idempotencyFingerprint = createHash("sha256").update(draft.idempotencyKey).digest("hex").slice(0, 24);
  const providerSessionId = `cs_mock_${idempotencyFingerprint}`;

  return {
    provider: "stripe",
    checkoutUrl: `https://mock-inkroute.local/checkout/${idempotencyFingerprint}`,
    providerSessionId,
  };
}

function hoursBetween(startIso: ISODateString, endIso: ISODateString): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return (end - start) / (1000 * 60 * 60);
}

export function evaluateRefundPolicy(input: RefundPolicyInput): RefundPolicyResult {
  const windowHours = input.nonRefundableWindowHours ?? defaultDepositPolicyRules.nonRefundableWindowHours;
  const hoursBeforeAppointment = hoursBetween(input.cancellationRequestedAt, input.appointmentStartsAt);
  const requestedRefundCents = clamp(input.requestedRefundCents ?? input.amountPaidCents, 0, input.amountPaidCents);

  if (input.artistCancelled || input.forceMajeure) {
    return {
      decision: "eligible",
      refundableAmountCents: requestedRefundCents,
      retainedAmountCents: input.amountPaidCents - requestedRefundCents,
      reason: input.artistCancelled ? "Artist/studio cancellation should generally return the deposit." : "Force-majeure claim should be handled compassionately and documented.",
      hoursBeforeAppointment,
      requiresManualReview: Boolean(input.forceMajeure),
    };
  }

  if (hoursBeforeAppointment >= windowHours) {
    return {
      decision: "eligible",
      refundableAmountCents: requestedRefundCents,
      retainedAmountCents: input.amountPaidCents - requestedRefundCents,
      reason: `Cancellation is outside the ${windowHours}-hour non-refundable window.`,
      hoursBeforeAppointment,
      requiresManualReview: false,
    };
  }

  if (hoursBeforeAppointment >= 24 && input.policyAllowsManualReview) {
    const partial = Math.round(requestedRefundCents / 2);
    return {
      decision: "partial",
      refundableAmountCents: partial,
      retainedAmountCents: input.amountPaidCents - partial,
      reason: "Cancellation is inside the non-refundable window but eligible for partial manual review.",
      hoursBeforeAppointment,
      requiresManualReview: true,
    };
  }

  return {
    decision: input.policyAllowsManualReview ? "manual_review" : "not_eligible",
    refundableAmountCents: 0,
    retainedAmountCents: input.amountPaidCents,
    reason: `Cancellation is inside the ${windowHours}-hour non-refundable window.`,
    hoursBeforeAppointment,
    requiresManualReview: Boolean(input.policyAllowsManualReview),
  };
}

export function evaluateNoShowPolicy(input: NoShowPolicyInput): NoShowPolicyResult {
  const minutesLate = input.clientArrivedMinutesLate ?? 0;

  if (input.artistWaivedFee) {
    return {
      decision: "waive_fee",
      forfeitedAmountCents: 0,
      reason: "Artist/studio manually waived the no-show fee.",
      requiresAudit: true,
      recommendedBookingStatus: "scheduled",
    };
  }

  if (input.emergencyClaimed || input.clientContactedArtist) {
    return {
      decision: "manual_review",
      forfeitedAmountCents: 0,
      reason: "Client contacted the artist or claimed an emergency; review before forfeiting deposit.",
      requiresAudit: true,
      recommendedBookingStatus: "reschedule_requested",
    };
  }

  if (minutesLate >= 30) {
    return {
      decision: "forfeit_deposit",
      forfeitedAmountCents: input.depositAmountCents,
      reason: "Client exceeded the late-arrival threshold without prior coordination.",
      requiresAudit: true,
      recommendedBookingStatus: "no_show",
    };
  }

  return {
    decision: "mark_no_show",
    forfeitedAmountCents: input.depositAmountCents,
    reason: "Client missed the appointment without documented contact.",
    requiresAudit: true,
    recommendedBookingStatus: "no_show",
  };
}

export function interpretStripeWebhook(eventType: string): StripeWebhookInterpretation {
  switch (eventType as StripeWebhookEventType) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      return {
        eventType: eventType as StripeWebhookEventType,
        action: "deposit_paid",
        targetStatus: "paid",
        requiresProviderFetch: true,
        safeToAutoReconcile: true,
        note: "Mark payment/deposit paid only after validating tenant, booking, amount, currency, and provider IDs.",
      };
    case "payment_intent.payment_failed":
      return {
        eventType: "payment_intent.payment_failed",
        action: "payment_failed",
        targetStatus: "failed",
        requiresProviderFetch: true,
        safeToAutoReconcile: true,
        note: "Record failed attempt and notify artist/client if retry is allowed.",
      };
    case "checkout.session.expired":
      return {
        eventType: "checkout.session.expired",
        action: "webhook_received",
        targetStatus: "pending",
        requiresProviderFetch: false,
        safeToAutoReconcile: false,
        note: "Keep deposit pending or expire it according to tenant policy after artist review.",
      };
    case "charge.refunded":
      return {
        eventType: "charge.refunded",
        action: "refund_succeeded",
        targetStatus: "refunded",
        requiresProviderFetch: true,
        safeToAutoReconcile: false,
        note: "Refund reconciliation must compare amount and existing refund records before changing deposit status.",
      };
    case "charge.dispute.created":
      return {
        eventType: "charge.dispute.created",
        action: "webhook_received",
        targetStatus: "disputed",
        requiresProviderFetch: true,
        safeToAutoReconcile: false,
        note: "Disputes require manual review and evidence workflow before production launch.",
      };
    default:
      return {
        eventType: "unknown",
        action: "webhook_received",
        targetStatus: "pending",
        requiresProviderFetch: false,
        safeToAutoReconcile: false,
        note: "Unknown Stripe event should be logged with redaction and ignored unless explicitly supported.",
      };
  }
}

function parseStripeSignatureHeader(header: string): { timestamp?: number; signatures: readonly string[] } {
  const parts = header.split(",");
  const signatures: string[] = [];
  let timestamp: number | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t" && value) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) timestamp = parsed;
    }
    if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  return timestamp === undefined ? { signatures } : { timestamp, signatures };
}

function safeSignatureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStripeWebhookSignature(input: StripeWebhookSignatureVerificationInput): StripeWebhookSignatureVerificationResult {
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const signedPayloadPreview = input.rawBody.length > 32 ? `${input.rawBody.slice(0, 32)}...` : input.rawBody;

  if (!input.signatureHeader) {
    return {
      verified: false,
      status: "missing_header",
      toleranceSeconds,
      signedPayloadPreview,
      reason: "Stripe-Signature header is required before webhook payloads can be trusted.",
    };
  }

  if (!input.endpointSecret) {
    return {
      verified: false,
      status: "missing_secret",
      toleranceSeconds,
      signedPayloadPreview,
      reason: "Stripe webhook endpoint secret must be configured before signature verification can run.",
    };
  }

  const parsed = parseStripeSignatureHeader(input.signatureHeader);
  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return {
      verified: false,
      status: "malformed_header",
      toleranceSeconds,
      signedPayloadPreview,
      reason: "Stripe-Signature header must include a timestamp and at least one v1 signature.",
    };
  }

  if (Math.abs(input.nowEpochSeconds - parsed.timestamp) > toleranceSeconds) {
    return {
      verified: false,
      status: "timestamp_outside_tolerance",
      timestamp: parsed.timestamp,
      toleranceSeconds,
      signedPayloadPreview,
      reason: "Stripe webhook timestamp is outside the configured replay tolerance.",
    };
  }

  const signedPayload = `${parsed.timestamp}.${input.rawBody}`;
  const expectedSignature = createHmac("sha256", input.endpointSecret).update(signedPayload, "utf8").digest("hex");
  const verified = parsed.signatures.some((signature) => safeSignatureEquals(signature, expectedSignature));

  return {
    verified,
    status: verified ? "verified" : "signature_mismatch",
    timestamp: parsed.timestamp,
    toleranceSeconds,
    signedPayloadPreview,
    reason: verified ? "Stripe webhook signature matched the raw request body." : "Stripe webhook signature did not match the raw request body.",
  };
}

export function buildStripeWebhookReconciliationPlan(input: StripeWebhookReconciliationInput): StripeWebhookReconciliationPlan {
  const interpretation = interpretStripeWebhook(input.eventType);
  const blockers: string[] = [];
  const requiredChecks = [
    "Verify Stripe-Signature with STRIPE_WEBHOOK_SECRET before calling this reconciliation plan.",
    "Resolve tenant and booking/deposit records from trusted provider metadata or persisted provider IDs.",
    "Persist PaymentAuditLog with provider event receipt proof and redacted payload summary while avoiding raw provider event ids in audit metadata.",
  ];
  const idempotencyKey = buildHashedPaymentIdempotencyKey("stripe-webhook", [input.eventId]);

  if (!input.eventId.trim()) {
    blockers.push("Missing Stripe event id.");
  }
  if (input.alreadyProcessedEventIds?.includes(input.eventId)) {
    blockers.push("Stripe event id was already processed.");
  }
  if (interpretation.eventType === "unknown") {
    blockers.push("Unsupported Stripe event type.");
  }
  if (interpretation.requiresProviderFetch && !input.providerPaymentIntentId && !input.providerChargeId) {
    blockers.push("Supported event requires a provider payment intent or charge id for reconciliation.");
  }
  if (input.expectedAmountCents !== undefined && input.amountCents !== undefined && input.amountCents !== input.expectedAmountCents) {
    blockers.push("Provider amount does not match expected payment amount.");
  }
  if (input.expectedCurrency !== undefined && input.currency !== undefined && input.currency !== input.expectedCurrency) {
    blockers.push("Provider currency does not match expected payment currency.");
  }

  const shouldReconcile = blockers.length === 0 && interpretation.safeToAutoReconcile;
  return {
    eventId: input.eventId,
    interpretation,
    action: shouldReconcile ? interpretation.action : "webhook_received",
    targetStatus: shouldReconcile ? interpretation.targetStatus : "pending",
    idempotencyKey,
    shouldPersistAuditLog: true,
    shouldReconcile,
    blockers,
    requiredChecks,
  };
}

export function buildStripeWebhookRuntimeReadinessPlan(input: StripeWebhookRuntimeReadinessInput): StripeWebhookRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const requiredEvents: StripeWebhookEventType[] = [
    "checkout.session.completed",
    "checkout.session.expired",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.refunded",
    "charge.dispute.created",
  ];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const missingSupportedEvents = requiredEvents.filter((eventType) => !input.supportedEventsCovered.includes(eventType));
  const blockers: string[] = [];
  const requiredEvidence: StripeWebhookRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.paymentsTestsPassed) blockers.push("@inkroute/payments webhook tests must pass.");
  if (!input.paymentsTypecheckPassed) blockers.push("@inkroute/payments typecheck must pass.");
  if (!input.webWebhookRouteTestsPassed) blockers.push("Web Stripe webhook route tests must pass.");
  if (!input.webTypecheckPassed) blockers.push("@inkroute/web typecheck must pass with webhook route wiring.");
  if (!input.stripeSdkInstalled) blockers.push("Stripe SDK must be installed before production webhook verification.");
  if (!input.constructEventUsesRawBody) blockers.push("Webhook route must use Stripe constructEvent with the raw request body.");
  if (!input.webhookSecretConfigured) blockers.push("STRIPE_WEBHOOK_SECRET must be configured in the secret store.");
  if (!input.invalidSignatureRejected) blockers.push("Invalid Stripe signatures must be rejected before parsing trusted events.");
  if (!input.timestampToleranceEnforced) blockers.push("Stripe webhook timestamp tolerance must reject stale replay attempts.");
  if (!input.replayProtectionPersisted) blockers.push("Stripe event replay protection must persist provider event ids.");
  if (missingSupportedEvents.length > 0) blockers.push(`Stripe webhook coverage is missing event types: ${missingSupportedEvents.join(", ")}.`);
  if (!input.providerObjectFetchConfigured) blockers.push("Supported payment/refund/dispute events must fetch or verify provider objects before reconciliation.");
  if (!input.tenantResolutionFromTrustedMetadata) blockers.push("Tenant resolution must use trusted provider metadata or persisted provider ids.");
  if (!input.depositPaymentRefundPersistenceConfigured) blockers.push("Deposit, Payment, and Refund persistence must be configured for webhook reconciliation.");
  if (!input.paymentAuditLogPersistenceConfigured) blockers.push("PaymentAuditLog persistence must be configured for every accepted and rejected Stripe event.");
  if (!input.bookingStateEventPersistenceConfigured) blockers.push("BookingStateEvent persistence must be configured for payment success/failure lifecycle changes.");
  if (!input.tenantScopedTransactionConfigured) blockers.push("Webhook reconciliation writes must run in one tenant-scoped transaction.");
  if (!input.amountCurrencyMismatchRejected) blockers.push("Amount and currency mismatches must block reconciliation.");
  if (!input.unknownEventsLoggedAndIgnored) blockers.push("Unknown Stripe events must be logged with redaction and ignored safely.");
  if (!input.stripeCliReplayVerified) blockers.push("Stripe CLI replay tests must verify success, failure, expiration, refund, dispute, invalid signature, and replay behavior.");

  if (!input.stripeSdkInstalled || !input.constructEventUsesRawBody || !input.webhookSecretConfigured || !input.invalidSignatureRejected) {
    requiredEvidence.push("Stripe SDK constructEvent raw-body verification evidence with STRIPE_WEBHOOK_SECRET");
  }
  if (!input.replayProtectionPersisted || !input.tenantScopedTransactionConfigured) {
    requiredEvidence.push("persistent event-id replay protection and tenant-scoped transaction evidence");
  }
  if (missingSupportedEvents.length > 0 || !input.providerObjectFetchConfigured || !input.amountCurrencyMismatchRejected) {
    requiredEvidence.push("supported event reconciliation tests for success, failure, expiration, refund, dispute, and mismatch cases");
  }
  if (!input.depositPaymentRefundPersistenceConfigured || !input.paymentAuditLogPersistenceConfigured || !input.bookingStateEventPersistenceConfigured) {
    requiredEvidence.push("Deposit, Payment, Refund, BookingStateEvent, and PaymentAuditLog persistence evidence");
  }
  if (!input.stripeCliReplayVerified) requiredEvidence.push("Stripe CLI replay transcript for supported events, invalid signature, and replay denial");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingSupportedEvents,
    requiredCommands: stripeWebhookRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === stripeWebhookRuntimeRequiredEvidence.length
        ? stripeWebhookRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

function paymentLifecycleTargetStatus(action: PaymentLifecycleAction): PaymentStatus {
  switch (action) {
    case "mark_paid":
      return "paid";
    case "mark_failed":
      return "failed";
    case "mark_refunded":
      return "refunded";
    case "mark_disputed":
      return "disputed";
    case "create_deposit":
    case "record_checkout_session":
      return "pending";
  }
}

function paymentLifecycleAuditAction(action: PaymentLifecycleAction): PaymentAuditAction {
  switch (action) {
    case "create_deposit":
      return "deposit_requested";
    case "record_checkout_session":
      return "checkout_session_created";
    case "mark_paid":
      return "deposit_paid";
    case "mark_failed":
      return "payment_failed";
    case "mark_refunded":
      return "refund_succeeded";
    case "mark_disputed":
      return "webhook_received";
  }
}

function paymentLifecycleWriteModels(action: PaymentLifecycleAction): PaymentLifecycleWriteModel[] {
  switch (action) {
    case "create_deposit":
      return ["Deposit", "PaymentAuditLog", "IdempotencyKey"];
    case "record_checkout_session":
      return ["Deposit", "Payment", "PaymentAuditLog", "IdempotencyKey"];
    case "mark_paid":
      return ["Payment", "Deposit", "BookingStateEvent", "PaymentAuditLog", "IdempotencyKey"];
    case "mark_failed":
      return ["Payment", "PaymentAuditLog", "IdempotencyKey"];
    case "mark_refunded":
      return ["Refund", "Payment", "PaymentAuditLog", "IdempotencyKey"];
    case "mark_disputed":
      return ["Payment", "PaymentAuditLog", "IdempotencyKey"];
  }
}

function providerIdentifierFingerprint(value: string | null | undefined): string | null {
  return value?.trim() ? createHash("sha256").update(value).digest("hex") : null;
}

function buildPaymentAuditProviderProof(input: {
  providerSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  providerChargeId?: string | null;
}): Record<string, unknown> {
  return {
    providerSessionIdHash: providerIdentifierFingerprint(input.providerSessionId),
    providerPaymentIntentIdHash: providerIdentifierFingerprint(input.providerPaymentIntentId),
    providerChargeIdHash: providerIdentifierFingerprint(input.providerChargeId),
    rawProviderSessionIdStored: false,
    rawProviderPaymentIntentIdStored: false,
    rawProviderChargeIdStored: false,
  };
}

export function buildPaymentLifecyclePersistencePlan(input: PaymentLifecyclePlanInput): PaymentLifecyclePersistencePlan {
  const blockers: string[] = [];
  const targetStatus = paymentLifecycleTargetStatus(input.action);
  const auditAction = paymentLifecycleAuditAction(input.action);

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.bookingRequestId.trim()) blockers.push("Missing booking request id.");
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) blockers.push("Payment amount must be positive.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for lifecycle mutation.");
  if (input.action === "record_checkout_session" && !input.providerSessionId?.trim()) blockers.push("Provider session id is required before recording checkout session state.");
  if ((input.action === "mark_paid" || input.action === "mark_failed") && !input.providerPaymentIntentId?.trim()) blockers.push("Provider payment intent id is required before finalizing paid or failed state.");
  if ((input.action === "mark_refunded" || input.action === "mark_disputed") && !input.providerChargeId?.trim() && !input.providerPaymentIntentId?.trim()) {
    blockers.push("Provider charge or payment intent id is required before recording refund or dispute state.");
  }
  if (input.provider === "manual" && !input.actorId?.trim()) blockers.push("Manual payment mutations require an actor id for audit attribution.");

  const basePayload = {
    bookingRequestId: input.bookingRequestId,
    depositId: input.depositId ?? null,
    paymentId: input.paymentId ?? null,
    amountCents: input.amountCents,
    currency: input.currency,
    provider: input.provider,
    providerSessionId: input.providerSessionId ?? null,
    providerPaymentIntentId: input.providerPaymentIntentId ?? null,
    providerChargeId: input.providerChargeId ?? null,
    targetStatus,
    occurredAt: input.occurredAt,
  };
  const writes = paymentLifecycleWriteModels(input.action).map((model): PaymentLifecycleWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "PaymentAuditLog"
      ? {
          bookingRequestId: basePayload.bookingRequestId,
          depositId: basePayload.depositId,
          paymentId: basePayload.paymentId,
          amountCents: basePayload.amountCents,
          currency: basePayload.currency,
          provider: basePayload.provider,
          targetStatus: basePayload.targetStatus,
          occurredAt: basePayload.occurredAt,
          ...buildPaymentAuditProviderProof(basePayload),
          action: auditAction,
          actorId: input.actorId ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        }
      : model === "IdempotencyKey"
        ? {
            key: input.idempotencyKey ?? null,
            action: input.action,
            bookingRequestId: input.bookingRequestId,
            occurredAt: input.occurredAt,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    targetStatus,
    auditAction,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    writes,
    requiredControls: paymentLifecyclePersistenceRequiredControls,
    blockers,
  };
}

export function buildPaymentPersistenceRuntimeReadinessPlan(
  input: PaymentPersistenceRuntimeReadinessInput,
): PaymentPersistenceRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: PaymentPersistenceRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.paymentsTestsPassed) blockers.push("@inkroute/payments lifecycle tests must pass.");
  if (!input.paymentsTypecheckPassed) blockers.push("@inkroute/payments typecheck must pass.");
  if (!input.dbSchemaIncludesPaymentModels) blockers.push("Prisma schema must include Deposit, Payment, Refund, PaymentAuditLog, and IdempotencyKey models.");
  if (!input.repositoriesImplemented) blockers.push("Tenant-scoped payment repository/service evidence must be captured before payment persistence readiness.");
  if (!input.tenantScopedQueriesEnforced) blockers.push("Payment repositories must enforce tenant scope on every read and write.");
  if (!input.transactionalMutationsImplemented) blockers.push("Payment lifecycle mutations must run in database transactions.");
  if (!input.idempotencyStoreImplemented) blockers.push("Idempotency store must be implemented for provider sessions, webhooks, refunds, and retries.");
  if (!input.depositCreationPersisted) blockers.push("Deposit creation must persist Deposit and initial PaymentAuditLog records.");
  if (!input.providerSessionPersisted) blockers.push("Provider Checkout session ids and redirect URLs must persist after Stripe creation.");
  if (!input.paidTransitionPersisted) blockers.push("Paid transition must persist Payment, Deposit, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
  if (!input.failedTransitionPersisted) blockers.push("Failed payment transition must persist PaymentAuditLog and safe retry state.");
  if (!input.refundTransitionPersisted) blockers.push("Refund transition must persist Refund, Payment, PaymentAuditLog, and IdempotencyKey writes.");
  if (!input.disputeTransitionPersisted) blockers.push("Dispute transition must persist disputed Payment state and PaymentAuditLog evidence.");
  if (!input.paymentAuditLogPersistedForEveryMutation) blockers.push("Every payment lifecycle mutation must persist a PaymentAuditLog row.");
  if (!input.bookingStateEventPersistedForLifecycleChanges) blockers.push("BookingStateEvent rows must be persisted for payment lifecycle changes that affect booking state.");
  if (!input.crossTenantIsolationTestsPassed) blockers.push("Cross-tenant payment repository reads and mutations must be denied by tests.");
  if (!input.replayIdempotencyTestsPassed) blockers.push("Replay idempotency tests must prove duplicate provider events do not duplicate writes.");
  if (!input.seededPostgresIntegrationTestsPassed) blockers.push("Seeded Postgres integration tests must pass for payment persistence lifecycle.");
  if (!input.dashboardPaymentReadsUseRepository) blockers.push("Dashboard payment reads must use the tenant-scoped repository/service layer.");

  if (!input.dbSchemaIncludesPaymentModels || !input.repositoriesImplemented || !input.transactionalMutationsImplemented) {
    requiredEvidence.push("Prisma models and tenant-scoped payment repository/service implementation");
  }
  if (!input.depositCreationPersisted || !input.providerSessionPersisted || !input.paidTransitionPersisted || !input.failedTransitionPersisted) {
    requiredEvidence.push("deposit, provider-session, paid, and failed transition persistence test output");
  }
  if (!input.refundTransitionPersisted || !input.disputeTransitionPersisted) {
    requiredEvidence.push("refund and dispute persistence test output");
  }
  if (!input.paymentAuditLogPersistedForEveryMutation || !input.bookingStateEventPersistedForLifecycleChanges) {
    requiredEvidence.push("PaymentAuditLog and BookingStateEvent persistence evidence for every lifecycle mutation");
  }
  if (!input.crossTenantIsolationTestsPassed || !input.replayIdempotencyTestsPassed || !input.seededPostgresIntegrationTestsPassed) {
    requiredEvidence.push("seeded Postgres integration tests for tenant isolation and idempotent replay");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: paymentPersistenceRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === paymentPersistenceRuntimeRequiredEvidence.length
        ? paymentPersistenceRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

function paymentOperationsWriteModels(action: PaymentOperationsWorkflowAction): PaymentOperationsWriteModel[] {
  switch (action) {
    case "execute_refund":
      return ["Refund", "Payment", "PaymentAuditLog", "IdempotencyKey"];
    case "record_no_show_forfeiture":
      return ["Payment", "BookingStateEvent", "PaymentAuditLog", "IdempotencyKey"];
    case "prepare_dispute_evidence":
      return ["DisputeEvidence", "PaymentAuditLog", "IdempotencyKey"];
    case "generate_receipt":
      return ["Receipt", "PaymentAuditLog", "IdempotencyKey"];
    case "create_accounting_export":
      return ["AccountingExport", "PaymentAuditLog", "IdempotencyKey"];
  }
}

function paymentOperationsProviderCall(input: PaymentOperationsWorkflowPlanInput): string | null {
  if (input.action === "execute_refund" && input.provider === "stripe") return "stripe.refunds.create";
  if (input.action === "prepare_dispute_evidence" && input.provider === "stripe") return "stripe.disputes.update";
  if (input.action === "generate_receipt") return "receipt.delivery.send";
  if (input.action === "create_accounting_export") return "accounting.export.write";
  return null;
}

export function buildPaymentOperationsWorkflowPlan(input: PaymentOperationsWorkflowPlanInput): PaymentOperationsWorkflowPlan {
  const blockers: string[] = [];

  if (!input.tenantId.trim()) blockers.push("Missing tenant scope.");
  if (!input.bookingRequestId.trim()) blockers.push("Missing booking request id.");
  if (!input.paymentId.trim()) blockers.push("Missing payment id.");
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) blockers.push("Payment amount must be positive.");
  if (!input.actorId?.trim()) blockers.push("Payment operations require an actor id for authorization and audit attribution.");
  if (!input.idempotencyKey?.trim()) blockers.push("Missing idempotency key for payment operation.");

  if (input.action === "execute_refund") {
    const refundAmount = input.refundAmountCents ?? 0;
    if (input.provider === "stripe" && !input.stripeRefundsEnabled) blockers.push("Stripe refunds must be enabled before executing provider refunds.");
    if (input.provider === "stripe" && !input.providerChargeId?.trim() && !input.providerPaymentIntentId?.trim()) blockers.push("Stripe refund requires a provider charge or payment intent id.");
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > input.amountCents) blockers.push("Refund amount must be positive and no greater than the captured payment amount.");
  }

  if (input.action === "record_no_show_forfeiture" && input.noShowDecision !== "forfeit_deposit") {
    blockers.push("No-show forfeiture requires a forfeit_deposit policy decision.");
  }

  if (input.action === "prepare_dispute_evidence") {
    if (!input.providerChargeId?.trim()) blockers.push("Dispute evidence requires a provider charge id.");
    if ((input.evidenceFileIds ?? []).length === 0) blockers.push("Dispute evidence requires at least one evidence file id.");
  }

  if (input.action === "generate_receipt") {
    if (!input.receiptNumber?.trim()) blockers.push("Receipt generation requires a receipt number.");
    if (!input.clientEmail?.includes("@")) blockers.push("Receipt delivery requires a client email address.");
    if (!input.receiptDeliveryConfigured) blockers.push("Receipt delivery provider must be configured before sending receipts.");
  }

  if (input.action === "create_accounting_export") {
    if (!input.taxReviewApproved) blockers.push("Accounting export requires tax/accounting review approval.");
    if (!input.exportReviewerId?.trim()) blockers.push("Accounting export requires a reviewer id.");
  }

  const providerCall = paymentOperationsProviderCall(input);
  const basePayload = {
    bookingRequestId: input.bookingRequestId,
    paymentId: input.paymentId,
    amountCents: input.amountCents,
    currency: input.currency,
    provider: input.provider,
    providerPaymentIntentId: input.providerPaymentIntentId ?? null,
    providerChargeId: input.providerChargeId ?? null,
    refundAmountCents: input.refundAmountCents ?? null,
    noShowDecision: input.noShowDecision ?? null,
    evidenceFileIds: input.evidenceFileIds ?? [],
    receiptNumber: input.receiptNumber ?? null,
    exportReviewerId: input.exportReviewerId ?? null,
    actorId: input.actorId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    occurredAt: input.occurredAt,
  };
  const writes = paymentOperationsWriteModels(input.action).map((model): PaymentOperationsWrite => ({
    model,
    tenantId: input.tenantId,
    payload: model === "IdempotencyKey"
      ? {
          key: input.idempotencyKey ?? null,
          action: input.action,
          bookingRequestId: input.bookingRequestId,
          paymentId: input.paymentId,
          occurredAt: input.occurredAt,
        }
      : model === "PaymentAuditLog"
        ? {
            bookingRequestId: basePayload.bookingRequestId,
            paymentId: basePayload.paymentId,
            amountCents: basePayload.amountCents,
            currency: basePayload.currency,
            provider: basePayload.provider,
            refundAmountCents: basePayload.refundAmountCents,
            noShowDecision: basePayload.noShowDecision,
            evidenceFileIds: basePayload.evidenceFileIds,
            receiptNumber: basePayload.receiptNumber,
            exportReviewerId: basePayload.exportReviewerId,
            actorId: basePayload.actorId,
            idempotencyKey: basePayload.idempotencyKey,
            occurredAt: basePayload.occurredAt,
            ...buildPaymentAuditProviderProof(basePayload),
            action: input.action,
            providerCall,
          }
        : basePayload,
  }));

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    action: input.action,
    providerCall,
    requiresTransaction: true,
    idempotencyKey: input.idempotencyKey?.trim() ? input.idempotencyKey : null,
    writes,
    requiredControls: paymentOperationsWorkflowRequiredControls,
    blockers,
  };
}

export function buildPaymentOperationsRuntimeReadinessPlan(
  input: PaymentOperationsRuntimeReadinessInput,
): PaymentOperationsRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: PaymentOperationsRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.paymentsTestsPassed) blockers.push("@inkroute/payments operation tests must pass.");
  if (!input.paymentsTypecheckPassed) blockers.push("@inkroute/payments typecheck must pass.");
  if (!input.dashboardPaymentActionsImplemented) blockers.push("Dashboard/server payment operation action evidence must be captured before payment operations readiness.");
  if (!input.refundActionAuthorized) blockers.push("Refund action must enforce tenant authorization and payment ownership.");
  if (!input.stripeRefundsTestModeVerified) blockers.push("Stripe test-mode refund execution must be verified.");
  if (!input.refundPersistenceConfigured) blockers.push("Refund execution must persist Refund, Payment, PaymentAuditLog, and IdempotencyKey writes.");
  if (!input.noShowForfeitureActionImplemented) blockers.push("No-show forfeiture action evidence must be captured before payment operations readiness.");
  if (!input.noShowAuditPersistenceConfigured) blockers.push("No-show forfeiture must persist BookingStateEvent and PaymentAuditLog records.");
  if (!input.disputeEvidenceWorkflowImplemented) blockers.push("Dispute evidence workflow must collect and persist evidence files.");
  if (!input.disputeProviderSyncVerified) blockers.push("Stripe dispute evidence sync must be verified in test mode.");
  if (!input.receiptGenerationImplemented) blockers.push("Receipt generation must be implemented with stable receipt numbers.");
  if (!input.receiptDeliveryProviderConfigured) blockers.push("Receipt delivery provider must be configured before sending receipts.");
  if (!input.receiptDeliveryTested) blockers.push("Receipt delivery must be tested with redacted client/payment data.");
  if (!input.accountingExportImplemented) blockers.push("Accounting export workflow evidence must be captured before payment operations readiness.");
  if (!input.exportRedactionVerified) blockers.push("Accounting export must redact non-accounting PII, medical notes, and provider secrets.");
  if (!input.taxAccountingReviewApproved) blockers.push("Tax/accounting review must approve export fields and retention policy.");
  if (!input.idempotencyConfiguredForOperations) blockers.push("Refund, no-show, dispute, receipt, and export operations must claim idempotency keys.");
  if (!input.paymentAuditLogPersistedForOperations) blockers.push("Every payment operation must persist PaymentAuditLog evidence.");
  if (!input.tenantAuthorizationTestsPassed) blockers.push("Tenant authorization tests must deny cross-tenant payment operations.");
  if (!input.dashboardE2eEvidenceAttached) blockers.push("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");

  if (!input.dashboardPaymentActionsImplemented || !input.tenantAuthorizationTestsPassed) {
    requiredEvidence.push("authorized dashboard/server actions with cross-tenant denial tests");
  }
  if (!input.stripeRefundsTestModeVerified || !input.refundPersistenceConfigured) {
    requiredEvidence.push("Stripe test-mode refund transcript and persisted Refund/PaymentAuditLog records");
  }
  if (!input.noShowForfeitureActionImplemented || !input.noShowAuditPersistenceConfigured) {
    requiredEvidence.push("no-show forfeiture action evidence with BookingStateEvent and PaymentAuditLog rows");
  }
  if (!input.disputeEvidenceWorkflowImplemented || !input.disputeProviderSyncVerified) {
    requiredEvidence.push("dispute evidence files and Stripe test-mode dispute sync transcript");
  }
  if (!input.receiptGenerationImplemented || !input.receiptDeliveryProviderConfigured || !input.receiptDeliveryTested) {
    requiredEvidence.push("generated and delivered receipt evidence with redacted client/payment data");
  }
  if (!input.accountingExportImplemented || !input.exportRedactionVerified || !input.taxAccountingReviewApproved) {
    requiredEvidence.push("accounting export file, redaction proof, and tax/accounting review approval");
  }
  if (!input.idempotencyConfiguredForOperations || !input.paymentAuditLogPersistedForOperations || !input.dashboardE2eEvidenceAttached) {
    requiredEvidence.push("idempotency, audit-log, and dashboard E2E evidence for all payment operations");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: paymentOperationsRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === paymentOperationsRuntimeRequiredEvidence.length
        ? paymentOperationsRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export function buildPaymentAutomatedTestReadinessPlan(
  input: PaymentAutomatedTestReadinessInput,
): PaymentAutomatedTestReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: PaymentAutomatedTestReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.paymentsUnitTestsPassed) blockers.push("@inkroute/payments unit tests must pass.");
  if (!input.paymentRouteTestsPassed) blockers.push("Web payment route boundary tests must pass.");
  if (!input.stripeSdkSignatureTestsPassed) blockers.push("Stripe SDK signature verification tests must pass.");
  if (!input.stripeCliLifecycleTestsPassed) blockers.push("Stripe CLI lifecycle tests must cover checkout completed, failed payment, expired checkout, refund, dispute, invalid signature, and replay.");
  if (!input.dbReconciliationTestsPassed) blockers.push("DB reconciliation tests must prove Deposit, Payment, Refund, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
  if (!input.bookingToPaidE2ePassed) blockers.push("Booking-to-paid Playwright/E2E flow must pass.");
  if (!input.refundNoShowDisputeTestsPassed) blockers.push("Refund, no-show forfeiture, and dispute workflow tests must pass.");
  if (!input.receiptExportTestsPassed) blockers.push("Receipt generation/delivery and accounting export tests must pass.");
  if (!input.crossTenantPaymentTestsPassed) blockers.push("Cross-tenant payment access and mutation denial tests must pass.");
  if (!input.replayIdempotencyTestsPassed) blockers.push("Replay/idempotency tests must prove duplicate provider events and operation retries do not duplicate writes.");
  if (!input.ciPaymentTestJobConfigured) blockers.push("CI must run payment unit, route, DB reconciliation, Stripe lifecycle, and E2E payment tests.");
  if (!input.artifactsCaptured) blockers.push("Payment test artifacts must capture Stripe CLI logs, DB reconciliation output, and E2E screenshots/traces.");

  if (!input.paymentsUnitTestsPassed || !input.paymentRouteTestsPassed || !input.stripeSdkSignatureTestsPassed) {
    requiredEvidence.push("payment helper, route-boundary, and Stripe signature test output");
  }
  if (!input.stripeCliLifecycleTestsPassed) {
    requiredEvidence.push("Stripe CLI lifecycle transcript for checkout success/failure/expiration/refund/dispute/replay");
  }
  if (!input.dbReconciliationTestsPassed || !input.crossTenantPaymentTestsPassed || !input.replayIdempotencyTestsPassed) {
    requiredEvidence.push("seeded DB reconciliation, tenant isolation, and idempotent replay test output");
  }
  if (!input.bookingToPaidE2ePassed || !input.refundNoShowDisputeTestsPassed || !input.receiptExportTestsPassed) {
    requiredEvidence.push("Playwright/dashboard E2E evidence for booking-to-paid, refund/no-show/dispute, receipt, and export flows");
  }
  if (!input.ciPaymentTestJobConfigured || !input.artifactsCaptured) {
    requiredEvidence.push("CI payment test job configuration and retained artifacts");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: paymentAutomatedTestReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === paymentAutomatedTestReadinessRequiredEvidence.length
        ? paymentAutomatedTestReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export function buildLiveStripePaymentsReadinessPlan(
  input: LiveStripePaymentsReadinessInput,
): LiveStripePaymentsReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: LiveStripePaymentsReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/payments package script is missing ${script}.`);
  if (!input.stripeSdkInstalled) blockers.push("Stripe SDK must be installed and pinned before live provider payment readiness can close.");
  if (!input.stripeSecretConfigured) blockers.push("Stripe secret key must be configured through the secret store.");
  if (!input.stripeWebhookSecretConfigured) blockers.push("Stripe webhook secret must be configured through the secret store.");
  if (!input.stripeApiVersionPinned) blockers.push("Stripe API version must be pinned.");
  if (!input.checkoutProviderCallImplemented) blockers.push("Deposit session route must create real Stripe Checkout sessions in provider-backed mode.");
  if (!input.paymentIntentLifecycleHandled) blockers.push("PaymentIntent success, failure, expiration, refund, and dispute lifecycle must be handled.");
  if (!input.providerIdempotencyStoreBackedByDb) blockers.push("Provider idempotency keys and webhook event ids must be backed by database writes.");
  if (!input.checkoutSessionPersisted) blockers.push("Checkout session ids, redirect URLs, Payment, Deposit, and audit rows must persist transactionally.");
  if (!input.webhookRawBodyVerificationConfigured) blockers.push("Webhook route must verify Stripe signatures from the raw request body.");
  if (!input.webhookReplayProtectionPersisted) blockers.push("Webhook replay protection must persist processed Stripe event ids.");
  if (!input.dbReconciliationTransactional) blockers.push("Payment/refund/dispute reconciliation must run in tenant-scoped database transactions.");
  if (!input.refundExecutionImplemented) blockers.push("Stripe refund execution must be implemented and authorized.");
  if (!input.disputeWorkflowImplemented) blockers.push("Stripe dispute workflow must be implemented or explicitly blocked with audit evidence.");
  if (!input.stripeCliLifecycleVerified) blockers.push("Stripe CLI lifecycle tests must verify checkout success/failure/expiration/refund/dispute/replay.");
  if (!input.bookingToPaidE2eVerified) blockers.push("Booking-to-paid browser E2E flow must be verified with Stripe test mode.");
  if (!input.crossTenantPaymentIsolationVerified) blockers.push("Cross-tenant payment access and mutation isolation must be verified.");
  if (!input.ciPaymentEvidenceCaptured) blockers.push("CI payment evidence must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Payment artifacts must be redacted and free of Stripe secrets or client-private data.");

  if (!input.stripeSdkInstalled || !input.stripeSecretConfigured || !input.stripeWebhookSecretConfigured || !input.stripeApiVersionPinned) {
    requiredEvidence.push("Stripe SDK pin plus redacted secret/webhook/API-version configuration evidence.");
  }
  if (!input.checkoutProviderCallImplemented || !input.checkoutSessionPersisted || !input.providerIdempotencyStoreBackedByDb) {
    requiredEvidence.push("Real Checkout session creation with persisted provider session and DB-backed idempotency evidence.");
  }
  if (!input.webhookRawBodyVerificationConfigured || !input.webhookReplayProtectionPersisted || !input.paymentIntentLifecycleHandled) {
    requiredEvidence.push("Raw-body webhook verification, replay protection, and supported lifecycle event evidence.");
  }
  if (!input.dbReconciliationTransactional || !input.crossTenantPaymentIsolationVerified) {
    requiredEvidence.push("Tenant-scoped transactional reconciliation and cross-tenant denial evidence.");
  }
  if (!input.refundExecutionImplemented || !input.disputeWorkflowImplemented) {
    requiredEvidence.push("Refund execution and dispute workflow evidence or explicit blocked-operation audit evidence.");
  }
  if (!input.stripeCliLifecycleVerified || !input.bookingToPaidE2eVerified || !input.ciPaymentEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push("Stripe CLI, booking-to-paid E2E, CI, and secret-safe artifact evidence.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: liveStripePaymentsReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === liveStripePaymentsReadinessRequiredEvidence.length
        ? liveStripePaymentsReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export function generateReceiptNumber(tenantSlug: string, paidAt: ISODateString, sequence: number): string {
  const safeTenant = tenantSlug
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 10) || "TENANT";
  const date = new Date(paidAt);
  const year = Number.isFinite(date.getTime()) ? date.getUTCFullYear() : new Date().getUTCFullYear();
  return `${safeTenant}-${year}-${String(sequence).padStart(5, "0")}`;
}

export function createReceiptExportRow(input: PaymentReceiptExportRow): PaymentReceiptExportRow {
  return {
    ...input,
    description: input.description.trim().slice(0, 240),
  };
}
