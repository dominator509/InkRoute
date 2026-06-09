import {
  buildStripeCheckoutExecutionReadiness,
  buildStripeCheckoutRouteRuntimeReadinessPlan,
  buildStripeCheckoutSessionDraft,
  type CreateDepositSessionInput,
  type StripeCheckoutExecutionReadiness,
  type StripeCheckoutRouteRuntimeReadinessPlan,
} from "@inkroute/payments";

export interface StripeCheckoutProviderSession {
  provider: "stripe";
  id: string;
  url: string;
  paymentIntentId?: string;
}

export interface StripeCheckoutProviderAdapter {
  createCheckoutSession(input: {
    draft: ReturnType<typeof buildStripeCheckoutSessionDraft>;
    idempotencyKey: string;
  }): Promise<StripeCheckoutProviderSession>;
}

export interface StripeCheckoutPersistenceAdapter {
  persistIdempotencyKey(key: string, tenantId: string, bookingRequestId: string): Promise<void>;
  persistProviderSession(session: StripeCheckoutProviderSession, input: CreateDepositSessionInput): Promise<void>;
  persistPaymentAuditLog(input: {
    tenantId: string;
    bookingRequestId: string;
    action: "checkout_session_requested" | "checkout_session_created";
    idempotencyKey: string;
    providerSessionId?: string;
  }): Promise<void>;
}

export interface StripeCheckoutRouteContract {
  readiness: StripeCheckoutExecutionReadiness;
  runtimeReadiness: StripeCheckoutRouteRuntimeReadinessPlan;
  safeBrowserResponse: {
    provider: "stripe";
    mode: "redirect";
    checkoutUrl: string | null;
    providerSessionId: string | null;
    idempotencyKey: string;
  };
  boundary: string;
}

export function buildStripeCheckoutRouteContract(input: CreateDepositSessionInput): StripeCheckoutRouteContract {
  const readiness = buildStripeCheckoutExecutionReadiness({
    ...input,
    stripeSdkInstalled: false,
    stripeSecretConfigured: false,
    stripeApiVersionPinned: false,
    idempotencyStoreAvailable: false,
    persistenceAvailable: false,
    signedBookingTokenValid: false,
    allowedRedirectHosts: ["inkroute.test", "localhost"],
  });

  const runtimeReadiness = buildStripeCheckoutRouteRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    paymentsTestsPassed: false,
    paymentsTypecheckPassed: false,
    webPaymentRouteTestsPassed: false,
    webTypecheckPassed: false,
    stripeSdkInstalled: false,
    stripeSecretConfigured: false,
    stripeApiVersionPinned: false,
    checkoutRouteUsesStripeClient: false,
    acceptedBookingOrSignedTokenEnforced: true,
    idempotencyKeyPersistedBeforeProviderCall: false,
    providerSessionPersisted: false,
    paymentAuditLogPersisted: false,
    tenantScopedTransactionConfigured: false,
    allowedRedirectHostsEnforced: true,
    safeBrowserResponseVerified: true,
    invalidTokenRejectedTested: false,
    expiredTokenRejectedTested: false,
    webhookReconciliationVerified: false,
    stripeTestModeCheckoutVerified: false,
  });

  return {
    readiness,
    runtimeReadiness,
    safeBrowserResponse: {
      provider: "stripe",
      mode: "redirect",
      checkoutUrl: readiness.canCallStripe ? readiness.draft.successUrl : null,
      providerSessionId: null,
      idempotencyKey: readiness.draft.idempotencyKey,
    },
    boundary:
      "Stripe Checkout now has an explicit route adapter, idempotency, persistence, audit, redirect, and runtime-readiness contract; live Stripe SDK calls and provider transcripts remain gated.",
  };
}

export async function executeStripeCheckoutWithAdapters(input: {
  deposit: CreateDepositSessionInput;
  provider: StripeCheckoutProviderAdapter;
  persistence: StripeCheckoutPersistenceAdapter;
}): Promise<StripeCheckoutProviderSession> {
  const contract = buildStripeCheckoutRouteContract(input.deposit);
  const idempotencyKey = contract.readiness.draft.idempotencyKey;

  if (!contract.readiness.canCallStripe) {
    throw new Error(contract.readiness.blockers.join(" "));
  }

  await input.persistence.persistIdempotencyKey(idempotencyKey, input.deposit.tenantId, input.deposit.bookingRequestId);
  await input.persistence.persistPaymentAuditLog({
    tenantId: input.deposit.tenantId,
    bookingRequestId: input.deposit.bookingRequestId,
    action: "checkout_session_requested",
    idempotencyKey,
  });

  const providerSession = await input.provider.createCheckoutSession({
    draft: contract.readiness.draft,
    idempotencyKey,
  });

  await input.persistence.persistProviderSession(providerSession, input.deposit);
  await input.persistence.persistPaymentAuditLog({
    tenantId: input.deposit.tenantId,
    bookingRequestId: input.deposit.bookingRequestId,
    action: "checkout_session_created",
    idempotencyKey,
    providerSessionId: providerSession.id,
  });

  return providerSession;
}
