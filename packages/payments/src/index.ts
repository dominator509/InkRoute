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
