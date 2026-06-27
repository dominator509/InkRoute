import {
  buildStripeWebhookReconciliationPlan,
  buildStripeWebhookRuntimeReadinessPlan,
  type StripeWebhookReconciliationPlan,
  type StripeWebhookRuntimeReadinessPlan,
} from "@inkroute/payments";
import Stripe from "stripe";

export type StripeWebhookConstructEventClient = InstanceType<typeof Stripe>["webhooks"];

export function constructStripeWebhookEventWithRawBody(input: {
  readonly stripe: StripeWebhookConstructEventClient;
  readonly rawBody: string | Buffer;
  readonly signatureHeader: string;
  readonly webhookSecret: string;
}): ReturnType<StripeWebhookConstructEventClient["constructEvent"]> {
  return input.stripe.constructEvent(input.rawBody, input.signatureHeader, input.webhookSecret);
}

export interface StripeWebhookReplayStore {
  hasProcessed(eventId: string): Promise<boolean>;
  persistProcessedEvent(eventId: string, idempotencyKey: string): Promise<void>;
}

export interface StripeWebhookReconciliationAdapter {
  reconcile(input: {
    tenantSlug: string;
    plan: StripeWebhookReconciliationPlan;
    rawBodyBytes: number;
  }): Promise<void>;
  persistPaymentAuditLog(input: {
    tenantSlug: string;
    eventId: string;
    action: StripeWebhookReconciliationPlan["action"];
    idempotencyKey: string;
    redactedSummary: string;
  }): Promise<void>;
}

export interface StripeWebhookRouteContract {
  reconciliation: StripeWebhookReconciliationPlan;
  runtimeReadiness: StripeWebhookRuntimeReadinessPlan;
  moneyMatch: StripeWebhookMoneyMatchDecision;
  shouldPersistReplay: boolean;
  shouldRunTransaction: boolean;
  boundary: string;
}

export interface StripeWebhookExpectedMoney {
  amountCents: number;
  currency: "usd";
}

export interface StripeWebhookMoneyMatchDecision {
  status: "matched" | "missing_provider_money" | "missing_local_expectation" | "amount_mismatch" | "currency_mismatch";
  canReconcileMoney: boolean;
  blockers: readonly string[];
  redactedSummary: string;
}

function extractProviderId(payload: Record<string, unknown>, key: "payment_intent" | "charge"): string | undefined {
  const data = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const object = data.object && typeof data.object === "object" ? data.object as Record<string, unknown> : {};
  const value = object[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function extractAmount(payload: Record<string, unknown>): number | undefined {
  const data = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const object = data.object && typeof data.object === "object" ? data.object as Record<string, unknown> : {};
  return typeof object.amount_total === "number"
    ? object.amount_total
    : typeof object.amount === "number"
      ? object.amount
      : undefined;
}

function extractCurrency(payload: Record<string, unknown>): "usd" | undefined {
  const data = payload.data && typeof payload.data === "object" ? payload.data as Record<string, unknown> : {};
  const object = data.object && typeof data.object === "object" ? data.object as Record<string, unknown> : {};
  return object.currency === "usd" ? "usd" : undefined;
}

export function verifyStripeWebhookMoneyMatch(input: {
  providerAmountCents?: number;
  providerCurrency?: "usd";
  expected?: StripeWebhookExpectedMoney;
}): StripeWebhookMoneyMatchDecision {
  if (!input.expected) {
    return {
      status: "missing_local_expectation",
      canReconcileMoney: false,
      blockers: ["Trusted local amount and currency expectation is required before Stripe webhook reconciliation."],
      redactedSummary: "No local money expectation was available; provider payload details redacted.",
    };
  }

  if (input.providerAmountCents === undefined || input.providerCurrency === undefined) {
    return {
      status: "missing_provider_money",
      canReconcileMoney: false,
      blockers: ["Stripe webhook payload must include provider amount and currency before reconciliation."],
      redactedSummary: "Provider money fields missing; payload details redacted.",
    };
  }

  if (input.providerAmountCents !== input.expected.amountCents) {
    return {
      status: "amount_mismatch",
      canReconcileMoney: false,
      blockers: ["Stripe webhook amount does not match the trusted local deposit expectation."],
      redactedSummary: "Amount mismatch detected; provider and local values redacted from browser/API response.",
    };
  }

  if (input.providerCurrency !== input.expected.currency) {
    return {
      status: "currency_mismatch",
      canReconcileMoney: false,
      blockers: ["Stripe webhook currency does not match the trusted local deposit expectation."],
      redactedSummary: "Currency mismatch detected; provider and local values redacted from browser/API response.",
    };
  }

  return {
    status: "matched",
    canReconcileMoney: true,
    blockers: [],
    redactedSummary: "Stripe webhook amount and currency match trusted local expectation.",
  };
}

export function buildStripeWebhookRouteContract(input: {
  payload: Record<string, unknown>;
  eventType: string;
  eventId: string;
  alreadyProcessedEventIds?: readonly string[];
  expectedMoney?: StripeWebhookExpectedMoney;
}): StripeWebhookRouteContract {
  const providerAmountCents = extractAmount(input.payload);
  const providerCurrency = extractCurrency(input.payload);
  const moneyMatch = verifyStripeWebhookMoneyMatch({
    ...(providerAmountCents !== undefined ? { providerAmountCents } : {}),
    ...(providerCurrency ? { providerCurrency } : {}),
    ...(input.expectedMoney ? { expected: input.expectedMoney } : {}),
  });
  const providerPaymentIntentId = extractProviderId(input.payload, "payment_intent");
  const providerChargeId = extractProviderId(input.payload, "charge");
  const reconciliation = buildStripeWebhookReconciliationPlan({
    eventId: input.eventId,
    eventType: input.eventType,
    ...(providerPaymentIntentId ? { providerPaymentIntentId } : {}),
    ...(providerChargeId ? { providerChargeId } : {}),
    ...(providerAmountCents !== undefined ? { amountCents: providerAmountCents } : {}),
    ...(providerCurrency ? { currency: providerCurrency } : {}),
    ...(input.alreadyProcessedEventIds ? { alreadyProcessedEventIds: input.alreadyProcessedEventIds } : {}),
  });

  const runtimeReadiness = buildStripeWebhookRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    paymentsTestsPassed: false,
    paymentsTypecheckPassed: false,
    webWebhookRouteTestsPassed: false,
    webTypecheckPassed: false,
    stripeSdkInstalled: true,
    constructEventUsesRawBody: true,
    webhookSecretConfigured: false,
    invalidSignatureRejected: true,
    timestampToleranceEnforced: true,
    replayProtectionPersisted: true,
    supportedEventsCovered: [
      "checkout.session.completed",
      "checkout.session.expired",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
    ],
    providerObjectFetchConfigured: false,
    tenantResolutionFromTrustedMetadata: true,
    depositPaymentRefundPersistenceConfigured: false,
    paymentAuditLogPersistenceConfigured: false,
    bookingStateEventPersistenceConfigured: false,
    tenantScopedTransactionConfigured: true,
    amountCurrencyMismatchRejected: true,
    unknownEventsLoggedAndIgnored: true,
    stripeCliReplayVerified: false,
  });

  return {
    reconciliation,
    runtimeReadiness,
    moneyMatch,
    shouldPersistReplay: reconciliation.blockers.length === 0 && moneyMatch.canReconcileMoney,
    shouldRunTransaction: reconciliation.shouldReconcile && moneyMatch.canReconcileMoney,
    boundary:
      "Stripe webhook now has explicit Stripe SDK raw-body constructEvent adapter, replay, audit, transaction, provider-object, amount/currency match, and runtime-readiness contracts; webhook secret evidence, DB reconciliation, and Stripe CLI replay proof remain gated.",
  };
}

export async function reconcileStripeWebhookWithAdapters(input: {
  tenantSlug: string;
  payload: Record<string, unknown>;
  eventType: string;
  eventId: string;
  rawBodyBytes: number;
  expectedMoney?: StripeWebhookExpectedMoney;
  replayStore: StripeWebhookReplayStore;
  adapter: StripeWebhookReconciliationAdapter;
}): Promise<StripeWebhookReconciliationPlan> {
  const alreadyProcessed = await input.replayStore.hasProcessed(input.eventId);
  const contract = buildStripeWebhookRouteContract({
    payload: input.payload,
    eventType: input.eventType,
    eventId: input.eventId,
    alreadyProcessedEventIds: alreadyProcessed ? [input.eventId] : [],
    ...(input.expectedMoney ? { expectedMoney: input.expectedMoney } : {}),
  });

  await input.adapter.persistPaymentAuditLog({
    tenantSlug: input.tenantSlug,
    eventId: input.eventId,
    action: contract.reconciliation.action,
    idempotencyKey: contract.reconciliation.idempotencyKey,
    redactedSummary: contract.reconciliation.interpretation.note,
  });

  if (contract.shouldPersistReplay) {
    await input.replayStore.persistProcessedEvent(input.eventId, contract.reconciliation.idempotencyKey);
  }

  if (contract.shouldRunTransaction) {
    await input.adapter.reconcile({
      tenantSlug: input.tenantSlug,
      plan: contract.reconciliation,
      rawBodyBytes: input.rawBodyBytes,
    });
  }

  return contract.reconciliation;
}
