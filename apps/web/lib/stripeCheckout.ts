import {
  buildStripeCheckoutExecutionReadiness,
  buildStripeCheckoutRouteRuntimeReadinessPlan,
  buildStripeCheckoutSessionDraft,
  type CreateDepositSessionInput,
  type StripeCheckoutExecutionReadiness,
  type StripeCheckoutRouteRuntimeReadinessPlan,
} from "@inkroute/payments";
import Stripe from "stripe";

export type StripeSdkClient = InstanceType<typeof Stripe>;

export const STRIPE_CHECKOUT_API_VERSION = "2025-10-29.clover";

export interface StripeCheckoutSdkConfig {
  readonly sdkPackage: "stripe";
  readonly apiVersion: string;
  readonly secretConfigured: boolean;
  readonly idempotencyHeaderRequired: true;
  readonly blockers: readonly string[];
}

export function buildStripeCheckoutSdkConfig(input: { secretKey?: string | null }): StripeCheckoutSdkConfig {
  return {
    sdkPackage: "stripe",
    apiVersion: STRIPE_CHECKOUT_API_VERSION,
    secretConfigured: Boolean(input.secretKey?.trim()),
    idempotencyHeaderRequired: true,
    blockers: input.secretKey?.trim() ? [] : ["Stripe secret key must be configured before live Checkout calls."],
  };
}

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

export function createStripeCheckoutProviderAdapter(stripe: StripeSdkClient): StripeCheckoutProviderAdapter {
  return {
    async createCheckoutSession(input) {
      const session = await stripe.checkout.sessions.create(
        {
          mode: input.draft.mode,
          client_reference_id: input.draft.clientReferenceId,
          ...(input.draft.customerEmail ? { customer_email: input.draft.customerEmail } : {}),
          line_items: [
            {
              quantity: input.draft.lineItem.quantity,
              price_data: {
                currency: input.draft.lineItem.currency,
                unit_amount: input.draft.lineItem.amountCents,
                product_data: {
                  name: input.draft.lineItem.name,
                  description: input.draft.lineItem.description,
                },
              },
            },
          ],
          metadata: input.draft.metadata,
          success_url: input.draft.successUrl,
          cancel_url: input.draft.cancelUrl,
        },
        {
          idempotencyKey: input.idempotencyKey,
        },
      );
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      return {
        provider: "stripe",
        id: session.id,
        url: session.url ?? "",
        ...(paymentIntentId ? { paymentIntentId } : {}),
      };
    },
  };
}

export interface StripeCheckoutPersistenceAdapter {
  runTenantScopedCheckoutPersistenceTransaction<T>(
    input: {
      tenantId: string;
      bookingRequestId: string;
      phase: "before_provider_call" | "after_provider_call";
    },
    operation: () => Promise<T>,
  ): Promise<T>;
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

export interface StripeDepositAuthorizationToken {
  tokenId: string;
  tenantId: string;
  bookingRequestId: string;
  scope: "deposit_session:create";
  issuedAt: string;
  expiresAt: string;
  signatureVerified: boolean;
}

export interface StripeDepositAuthorizationDecision {
  status: "accepted_booking" | "valid_signed_token" | "missing_authorization" | "invalid_token" | "expired_token" | "scope_mismatch" | "booking_mismatch";
  canCreateCheckout: boolean;
  blockers: readonly string[];
  redactedSubject: string;
}

export interface StripeCheckoutRouteContract {
  readiness: StripeCheckoutExecutionReadiness;
  runtimeReadiness: StripeCheckoutRouteRuntimeReadinessPlan;
  safeBrowserResponse: {
    provider: "stripe";
    mode: "redirect";
    providerRedirectValidated: boolean;
    providerCheckoutUrlEchoed: false;
    providerSessionIdEchoed: false;
    idempotencyPersisted: boolean;
    rawIdempotencyKeyEchoed: false;
  };
  boundary: string;
}

export function isStripeHostedCheckoutUrl(value: string): boolean {
  try {
    const host = new URL(value).host.toLowerCase();
    return host === "checkout.stripe.com" || host.endsWith(".checkout.stripe.com");
  } catch {
    return false;
  }
}

export function buildStripeCheckoutSafeBrowserResponse(input: {
  readonly providerSession: StripeCheckoutProviderSession | null;
  readonly idempotencyKey: string;
}): StripeCheckoutRouteContract["safeBrowserResponse"] {
  if (!input.providerSession || !isStripeHostedCheckoutUrl(input.providerSession.url)) {
    return {
      provider: "stripe",
      mode: "redirect",
      providerRedirectValidated: false,
      providerCheckoutUrlEchoed: false,
      providerSessionIdEchoed: false,
      idempotencyPersisted: Boolean(input.idempotencyKey),
      rawIdempotencyKeyEchoed: false,
    };
  }

  return {
    provider: "stripe",
    mode: "redirect",
    providerRedirectValidated: true,
    providerCheckoutUrlEchoed: false,
    providerSessionIdEchoed: false,
    idempotencyPersisted: Boolean(input.idempotencyKey),
    rawIdempotencyKeyEchoed: false,
  };
}

export function verifyStripeDepositAuthorization(input: {
  tenantId: string;
  bookingRequestId: string;
  acceptedBooking: boolean;
  signedDepositToken?: StripeDepositAuthorizationToken;
  now: string;
}): StripeDepositAuthorizationDecision {
  if (input.acceptedBooking) {
    return {
      status: "accepted_booking",
      canCreateCheckout: true,
      blockers: [],
      redactedSubject: `${input.tenantId}:${input.bookingRequestId}`,
    };
  }

  const token = input.signedDepositToken;
  if (!token) {
    return {
      status: "missing_authorization",
      canCreateCheckout: false,
      blockers: ["Accepted booking or signed deposit token is required before creating Stripe Checkout."],
      redactedSubject: `${input.tenantId}:${input.bookingRequestId}`,
    };
  }

  if (!token.signatureVerified) {
    return {
      status: "invalid_token",
      canCreateCheckout: false,
      blockers: ["Signed deposit token signature must verify before creating Stripe Checkout."],
      redactedSubject: token.tokenId,
    };
  }

  if (new Date(token.expiresAt).getTime() <= new Date(input.now).getTime()) {
    return {
      status: "expired_token",
      canCreateCheckout: false,
      blockers: ["Signed deposit token is expired."],
      redactedSubject: token.tokenId,
    };
  }

  if (token.scope !== "deposit_session:create") {
    return {
      status: "scope_mismatch",
      canCreateCheckout: false,
      blockers: ["Signed deposit token scope does not allow deposit session creation."],
      redactedSubject: token.tokenId,
    };
  }

  if (token.tenantId !== input.tenantId || token.bookingRequestId !== input.bookingRequestId) {
    return {
      status: "booking_mismatch",
      canCreateCheckout: false,
      blockers: ["Signed deposit token tenant or booking does not match the Checkout request."],
      redactedSubject: token.tokenId,
    };
  }

  return {
    status: "valid_signed_token",
    canCreateCheckout: true,
    blockers: [],
    redactedSubject: token.tokenId,
  };
}

export function buildStripeCheckoutRouteContract(input: CreateDepositSessionInput): StripeCheckoutRouteContract {
  const readiness = buildStripeCheckoutExecutionReadiness({
    ...input,
    stripeSdkInstalled: true,
    stripeSecretConfigured: false,
    stripeApiVersionPinned: true,
    idempotencyStoreAvailable: true,
    persistenceAvailable: true,
    signedBookingTokenValid: false,
    allowedRedirectHosts: ["inkroute.test", "localhost"],
  });

  const runtimeReadiness = buildStripeCheckoutRouteRuntimeReadinessPlan({
    packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
    paymentsTestsPassed: false,
    paymentsTypecheckPassed: false,
    webPaymentRouteTestsPassed: false,
    webTypecheckPassed: false,
    stripeSdkInstalled: true,
    stripeSecretConfigured: false,
    stripeApiVersionPinned: true,
    checkoutRouteUsesStripeClient: true,
    acceptedBookingOrSignedTokenEnforced: true,
    idempotencyKeyPersistedBeforeProviderCall: true,
    providerSessionPersisted: true,
    paymentAuditLogPersisted: true,
    tenantScopedTransactionConfigured: true,
    allowedRedirectHostsEnforced: true,
    safeBrowserResponseVerified: true,
    invalidTokenRejectedTested: true,
    expiredTokenRejectedTested: true,
    webhookReconciliationVerified: false,
    stripeTestModeCheckoutVerified: false,
  });

  return {
    readiness,
    runtimeReadiness,
    safeBrowserResponse: {
      provider: "stripe",
      mode: "redirect",
      providerRedirectValidated: false,
      providerCheckoutUrlEchoed: false,
      providerSessionIdEchoed: false,
      idempotencyPersisted: Boolean(readiness.draft.idempotencyKey),
      rawIdempotencyKeyEchoed: false,
    },
    boundary:
      "Stripe Checkout now has an installed SDK, pinned API-version contract, explicit route adapter, tenant-scoped idempotency/persistence/audit transaction seam, redirect controls, and runtime-readiness contract; Stripe secrets, live provider calls, provider-backed DB execution, and provider transcripts remain gated.",
  };
}

export async function executeStripeCheckoutWithAdapters(input: {
  deposit: CreateDepositSessionInput;
  provider: StripeCheckoutProviderAdapter;
  persistence: StripeCheckoutPersistenceAdapter;
  authorization: {
    acceptedBooking: boolean;
    signedDepositToken?: StripeDepositAuthorizationToken;
    now: string;
  };
}): Promise<StripeCheckoutProviderSession> {
  const contract = buildStripeCheckoutRouteContract(input.deposit);
  const authorization = verifyStripeDepositAuthorization({
    tenantId: input.deposit.tenantId,
    bookingRequestId: input.deposit.bookingRequestId,
    ...input.authorization,
  });
  const idempotencyKey = contract.readiness.draft.idempotencyKey;

  if (!authorization.canCreateCheckout) {
    throw new Error(authorization.blockers.join(" "));
  }

  if (!contract.readiness.canCallStripe) {
    throw new Error(contract.readiness.blockers.join(" "));
  }

  await input.persistence.runTenantScopedCheckoutPersistenceTransaction(
    {
      tenantId: input.deposit.tenantId,
      bookingRequestId: input.deposit.bookingRequestId,
      phase: "before_provider_call",
    },
    async () => {
      await input.persistence.persistIdempotencyKey(idempotencyKey, input.deposit.tenantId, input.deposit.bookingRequestId);
      await input.persistence.persistPaymentAuditLog({
        tenantId: input.deposit.tenantId,
        bookingRequestId: input.deposit.bookingRequestId,
        action: "checkout_session_requested",
        idempotencyKey,
      });
    },
  );

  const providerSession = await input.provider.createCheckoutSession({
    draft: contract.readiness.draft,
    idempotencyKey,
  });

  await input.persistence.runTenantScopedCheckoutPersistenceTransaction(
    {
      tenantId: input.deposit.tenantId,
      bookingRequestId: input.deposit.bookingRequestId,
      phase: "after_provider_call",
    },
    async () => {
      await input.persistence.persistProviderSession(providerSession, input.deposit);
      await input.persistence.persistPaymentAuditLog({
        tenantId: input.deposit.tenantId,
        bookingRequestId: input.deposit.bookingRequestId,
        action: "checkout_session_created",
        idempotencyKey,
        providerSessionId: providerSession.id,
      });
    },
  );

  return providerSession;
}
