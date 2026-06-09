import {
  buildStripeWebhookReconciliationPlan,
  buildStripeWebhookRuntimeReadinessPlan,
  type StripeWebhookReconciliationPlan,
  type StripeWebhookRuntimeReadinessPlan,
} from "@inkroute/payments";

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
  shouldPersistReplay: boolean;
  shouldRunTransaction: boolean;
  boundary: string;
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

export function buildStripeWebhookRouteContract(input: {
  payload: Record<string, unknown>;
  eventType: string;
  eventId: string;
  alreadyProcessedEventIds?: readonly string[];
}): StripeWebhookRouteContract {
  const reconciliation = buildStripeWebhookReconciliationPlan({
    eventId: input.eventId,
    eventType: input.eventType,
    providerPaymentIntentId: extractProviderId(input.payload, "payment_intent"),
    providerChargeId: extractProviderId(input.payload, "charge"),
    amountCents: extractAmount(input.payload),
    currency: extractCurrency(input.payload),
    alreadyProcessedEventIds: input.alreadyProcessedEventIds,
  });

  const runtimeReadiness = buildStripeWebhookRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    paymentsTestsPassed: false,
    paymentsTypecheckPassed: false,
    webWebhookRouteTestsPassed: false,
    webTypecheckPassed: false,
    stripeSdkInstalled: false,
    constructEventUsesRawBody: false,
    webhookSecretConfigured: false,
    invalidSignatureRejected: true,
    timestampToleranceEnforced: true,
    replayProtectionPersisted: false,
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
    tenantScopedTransactionConfigured: false,
    amountCurrencyMismatchRejected: false,
    unknownEventsLoggedAndIgnored: true,
    stripeCliReplayVerified: false,
  });

  return {
    reconciliation,
    runtimeReadiness,
    shouldPersistReplay: reconciliation.blockers.length === 0,
    shouldRunTransaction: reconciliation.shouldReconcile,
    boundary:
      "Stripe webhook now has explicit replay, audit, transaction, provider-object, and runtime-readiness contracts; Stripe SDK constructEvent, DB reconciliation, and Stripe CLI replay proof remain gated.",
  };
}

export async function reconcileStripeWebhookWithAdapters(input: {
  tenantSlug: string;
  payload: Record<string, unknown>;
  eventType: string;
  eventId: string;
  rawBodyBytes: number;
  replayStore: StripeWebhookReplayStore;
  adapter: StripeWebhookReconciliationAdapter;
}): Promise<StripeWebhookReconciliationPlan> {
  const alreadyProcessed = await input.replayStore.hasProcessed(input.eventId);
  const contract = buildStripeWebhookRouteContract({
    payload: input.payload,
    eventType: input.eventType,
    eventId: input.eventId,
    alreadyProcessedEventIds: alreadyProcessed ? [input.eventId] : [],
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
