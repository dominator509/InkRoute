import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildStripeCheckoutSafeBrowserResponse, verifyStripeDepositAuthorization } from "../lib/stripeCheckout";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe Checkout route static contract", () => {
  const checkoutSource = readWorkspaceFile("apps/web/lib/stripeCheckout.ts");
  const routeSource = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts");

  it("wraps payment package Checkout readiness gates", () => {
    expect(checkoutSource).toContain("buildStripeCheckoutExecutionReadiness");
    expect(checkoutSource).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(checkoutSource).toContain("buildStripeCheckoutRouteContract");
  });

  it("defines provider and persistence adapter seams before live Stripe calls", () => {
    expect(checkoutSource).toContain("StripeCheckoutProviderAdapter");
    expect(checkoutSource).toContain("createStripeCheckoutProviderAdapter");
    expect(checkoutSource).toContain("stripe.checkout.sessions.create");
    expect(checkoutSource).toContain("idempotencyKey: input.idempotencyKey");
    expect(checkoutSource).toContain("createCheckoutSession");
    expect(checkoutSource).toContain("runTenantScopedCheckoutPersistenceTransaction");
    expect(checkoutSource).toContain('phase: "before_provider_call"');
    expect(checkoutSource).toContain('phase: "after_provider_call"');
    expect(checkoutSource).toContain("persistIdempotencyKey");
    expect(checkoutSource).toContain("persistProviderSession");
    expect(checkoutSource).toContain("persistPaymentAuditLog");
  });

  it("persists idempotency and audit before provider session creation", () => {
    expect(checkoutSource).toContain("verifyStripeDepositAuthorization");
    expect(checkoutSource).toContain("authorization.canCreateCheckout");
    expect(checkoutSource.indexOf("verifyStripeDepositAuthorization")).toBeLessThan(checkoutSource.indexOf("persistIdempotencyKey"));
    expect(checkoutSource.indexOf('phase: "before_provider_call"')).toBeLessThan(checkoutSource.indexOf("persistIdempotencyKey"));
    expect(checkoutSource.indexOf("persistIdempotencyKey")).toBeLessThan(checkoutSource.indexOf("createCheckoutSession"));
    expect(checkoutSource.indexOf('action: "checkout_session_requested"')).toBeLessThan(checkoutSource.indexOf("createCheckoutSession"));
    expect(checkoutSource.indexOf('phase: "after_provider_call"')).toBeGreaterThan(checkoutSource.indexOf("createCheckoutSession"));
    expect(checkoutSource.indexOf("persistProviderSession")).toBeGreaterThan(checkoutSource.indexOf("createCheckoutSession"));
  });

  it("allowlists public deposit idempotency replay fields before responding", () => {
    expect(routeSource).toContain("isRecord(idempotency.result)");
    expect(routeSource).toContain("tx.deposit.findFirst");
    expect(routeSource).toContain("tx.payment.findFirst");
    expect(routeSource).toContain("buildSafeSessionDraftResponse");
    expect(routeSource).toContain("buildSafeLocalSessionResponse");
    expect(routeSource).toContain("buildSafeDepositDraftDatabaseResponse");
    expect(routeSource).toContain("depositPersisted: true");
    expect(routeSource).toContain("paymentPersisted: true");
    expect(routeSource).toContain("paymentAuditPersisted: true");
    expect(routeSource).toContain("bookingStateEventPersisted: true");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).toContain("idempotencyPersisted: true");
    expect(routeSource).toContain("checkoutUrlsPersisted: false");
    expect(routeSource).toContain("bookingRequestMatched: true");
    expect(routeSource).toContain("rawIdempotencyResultEchoed: false");
    expect(routeSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(routeSource).toContain("rawProviderSessionIdEchoed: false");
    expect(routeSource).toContain("mockCheckoutUrlEchoed: false");
    expect(routeSource).not.toContain("url: null");
    expect(routeSource).toContain("clientReferenceIdEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("bookingRequestIdEchoed: false");
    expect(routeSource).toContain("localDepositSessionIdEchoed: false");
    expect(routeSource).not.toContain("idempotency.result.depositId");
    expect(routeSource).not.toContain("idempotency.result.paymentId");
    expect(routeSource).not.toContain("auditId: audit.id");
    expect(routeSource).not.toContain("idempotency: { key: sessionDraft.idempotencyKey");
    expect(routeSource).not.toContain("idempotencyKey: sessionDraft.idempotencyKey");
    expect(routeSource).not.toContain("clientReferenceId: draft.clientReferenceId");
    expect(routeSource).not.toContain("successUrl,\n              cancelUrl");
    expect(routeSource).not.toContain("bookingRequestId: booking.id,\n              idempotencyKey");
    expect(routeSource).not.toContain("depositId: deposit.id,\n              paymentId: payment.id");
  });

  it("allowlists public deposit response fields", () => {
    expect(routeSource).toContain("depositResponseAllowlisted: true");
    expect(routeSource).toContain("depositIdEchoed: false");
    expect(routeSource).toContain("paymentIdEchoed: false");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("buildSafeLocalStoredSessionResponse");
    expect(routeSource).toContain("persisted: true");
    expect(routeSource).toContain("amountCents: result.deposit.amountCents");
    expect(routeSource).toContain("currency: result.deposit.currency");
    expect(routeSource).toContain("status: result.deposit.status");
    expect(routeSource).not.toContain("id: result.deposit.id");
    expect(routeSource).not.toContain("payment: result.payment");
    expect(routeSource).not.toContain("auditId: result.audit.id");
    expect(routeSource).not.toContain("...result.deposit");
    expect(routeSource).not.toContain("storedSession,");
    expect(routeSource).not.toContain("bookingId: existingBooking.request.id");
  });

  it("defines accepted-booking or signed-token authorization before live Checkout", () => {
    expect(checkoutSource).toContain("StripeDepositAuthorizationToken");
    expect(checkoutSource).toContain('scope: "deposit_session:create"');
    expect(checkoutSource).toContain("signatureVerified");
    expect(checkoutSource).toContain('status: "accepted_booking"');
    expect(checkoutSource).toContain('status: "valid_signed_token"');
    expect(checkoutSource).toContain('status: "expired_token"');
    expect(checkoutSource).toContain('status: "scope_mismatch"');
    expect(checkoutSource).toContain('status: "booking_mismatch"');
    expect(checkoutSource).toContain("Accepted booking or signed deposit token is required before creating Stripe Checkout.");
  });

  it("rejects invalid and expired signed deposit tokens before live Checkout", () => {
    const baseToken = {
      tokenId: "token_static",
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      scope: "deposit_session:create" as const,
      issuedAt: "2026-06-18T00:00:00.000Z",
      expiresAt: "2026-06-18T01:00:00.000Z",
      signatureVerified: true,
    };

    expect(
      verifyStripeDepositAuthorization({
        tenantId: "tenant_demo",
        bookingRequestId: "booking_demo",
        acceptedBooking: false,
        signedDepositToken: { ...baseToken, signatureVerified: false },
        now: "2026-06-18T00:30:00.000Z",
      }),
    ).toMatchObject({
      status: "invalid_token",
      canCreateCheckout: false,
    });

    expect(
      verifyStripeDepositAuthorization({
        tenantId: "tenant_demo",
        bookingRequestId: "booking_demo",
        acceptedBooking: false,
        signedDepositToken: baseToken,
        now: "2026-06-18T01:00:00.000Z",
      }),
    ).toMatchObject({
      status: "expired_token",
      canCreateCheckout: false,
    });
  });

  it("keeps safe browser response free of secrets and provider payloads", () => {
    expect(checkoutSource).toContain("safeBrowserResponse");
    expect(checkoutSource).toContain("buildStripeCheckoutSafeBrowserResponse");
    expect(checkoutSource).toContain("isStripeHostedCheckoutUrl");
    expect(checkoutSource).toContain("providerRedirectValidated");
    expect(checkoutSource).toContain("providerCheckoutUrlEchoed: false");
    expect(checkoutSource).toContain("providerSessionIdEchoed: false");
    expect(checkoutSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(checkoutSource).not.toContain("checkoutUrl: input.providerSession.url");
    expect(checkoutSource).not.toContain("providerSessionId: input.providerSession.id");
    expect(checkoutSource).not.toContain("STRIPE_SECRET_KEY");
    expect(checkoutSource).not.toContain("client_secret");
  });

  it("serializes only Stripe-hosted Checkout redirect proof to the browser", () => {
    expect(
      buildStripeCheckoutSafeBrowserResponse({
        providerSession: {
          provider: "stripe",
          id: "cs_test_123",
          url: "https://checkout.stripe.com/c/pay/cs_test_123",
          paymentIntentId: "pi_secret_should_not_serialize",
        },
        idempotencyKey: "deposit:tenant_demo:booking_demo:15000:usd",
      }),
    ).toEqual({
      provider: "stripe",
      mode: "redirect",
      providerRedirectValidated: true,
      providerCheckoutUrlEchoed: false,
      providerSessionIdEchoed: false,
      idempotencyPersisted: true,
      rawIdempotencyKeyEchoed: false,
    });

    expect(
      buildStripeCheckoutSafeBrowserResponse({
        providerSession: {
          provider: "stripe",
          id: "cs_test_bad",
          url: "https://evil.example/checkout/cs_test_bad",
          paymentIntentId: "pi_secret_should_not_serialize",
        },
        idempotencyKey: "deposit:tenant_demo:booking_demo:15000:usd",
      }),
    ).toEqual({
      provider: "stripe",
      mode: "redirect",
      providerRedirectValidated: false,
      providerCheckoutUrlEchoed: false,
      providerSessionIdEchoed: false,
      idempotencyPersisted: true,
      rawIdempotencyKeyEchoed: false,
    });
  });

  it("surfaces the Checkout contract from the deposit session route", () => {
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("buildStripeCheckoutRouteContract");
    expect(routeSource).toContain("checkoutContract");
    expect(routeSource).toContain("safeBrowserResponse");
    expect(routeSource).toContain("runtimeReadiness");
  });
});
