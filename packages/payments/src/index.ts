import { createHmac, timingSafeEqual } from "node:crypto";
import type { ISODateString, PaymentStatus } from "@inkroute/types";

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
  requiredControls: readonly string[];
  blockers: readonly string[];
}

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

export interface PaymentLifecyclePersistencePlan {
  status: "ready" | "blocked";
  action: PaymentLifecycleAction;
  targetStatus: PaymentStatus;
  auditAction: PaymentAuditAction;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly PaymentLifecycleWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

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

export interface PaymentOperationsWorkflowPlan {
  status: "ready" | "blocked";
  action: PaymentOperationsWorkflowAction;
  providerCall: string | null;
  requiresTransaction: true;
  idempotencyKey: string | null;
  writes: readonly PaymentOperationsWrite[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

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
  const idempotencyKey = `deposit:${input.tenantId}:${input.bookingRequestId}:${input.amountCents}:${input.currency}`;
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
      tenantId: input.tenantId,
      bookingRequestId: input.bookingRequestId,
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
    requiredControls: [
      "Create Checkout Session only for accepted bookings or valid signed deposit tokens.",
      "Persist idempotency key before provider call and reuse it for Stripe request options.",
      "Persist provider session id and redirect URL after Stripe returns.",
      "Return only Stripe-hosted checkout URL to the browser; never return secret keys or raw provider payloads.",
      "Reconcile final payment state only through verified Stripe webhooks.",
    ],
    blockers,
  };
}

export async function createDepositSession(_input: CreateDepositSessionInput): Promise<CreateDepositSessionResult> {
  const draft = buildStripeCheckoutSessionDraft(_input);
  const providerSessionId = `cs_mock_${draft.idempotencyKey}`;
  const checkoutTenant = encodeURIComponent(_input.tenantId);

  return {
    provider: "stripe",
    checkoutUrl: `/api/public/${checkoutTenant}/checkout/${providerSessionId}`,
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
    "Persist PaymentAuditLog with the raw provider event id and redacted payload summary.",
  ];
  const idempotencyKey = `stripe-webhook:${input.eventId}`;

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
          ...basePayload,
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
    requiredControls: [
      "Execute all writes in one tenant-scoped database transaction.",
      "Insert or claim the idempotency key before mutating payment state.",
      "Reject cross-tenant deposit, payment, refund, and booking ids before applying writes.",
      "Write PaymentAuditLog for every lifecycle mutation, including failed and disputed outcomes.",
      "Treat provider webhook ids as replay protection inputs and never as tenant authorization.",
    ],
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
            ...basePayload,
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
    requiredControls: [
      "Authorize the actor against the tenant and payment before provider calls or local writes.",
      "Claim the idempotency key before executing Stripe refunds, receipt delivery, or export creation.",
      "Persist PaymentAuditLog and operation result in the same transaction as local state changes.",
      "Store redacted provider references only; never persist secret keys or raw unredacted provider payloads.",
      "Require accounting/tax review before enabling export files for production bookkeeping.",
    ],
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
