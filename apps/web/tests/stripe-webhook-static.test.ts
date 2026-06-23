import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyStripeWebhookMoneyMatch } from "../lib/stripeWebhook";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe webhook route static contract", () => {
  const webhookSource = readWorkspaceFile("apps/web/lib/stripeWebhook.ts");
  const routeSource = readWorkspaceFile("apps/web/app/api/webhooks/stripe/route.ts");

  it("wraps package reconciliation and runtime readiness helpers", () => {
    expect(webhookSource).toContain("buildStripeWebhookReconciliationPlan");
    expect(webhookSource).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(webhookSource).toContain("buildStripeWebhookRouteContract");
  });

  it("defines replay and reconciliation adapter seams", () => {
    expect(webhookSource).toContain("StripeWebhookReplayStore");
    expect(webhookSource).toContain("hasProcessed");
    expect(webhookSource).toContain("persistProcessedEvent");
    expect(webhookSource).toContain("StripeWebhookReconciliationAdapter");
    expect(webhookSource).toContain("persistPaymentAuditLog");
  });

  it("persists audit logs, replay ids, and transaction reconciliation in order", () => {
    expect(webhookSource).toContain("verifyStripeWebhookMoneyMatch");
    expect(webhookSource).toContain("moneyMatch.canReconcileMoney");
    expect(webhookSource.indexOf("persistPaymentAuditLog")).toBeLessThan(webhookSource.indexOf("persistProcessedEvent"));
    expect(webhookSource.indexOf("persistProcessedEvent")).toBeLessThan(webhookSource.indexOf("adapter.reconcile"));
    expect(webhookSource).toContain("shouldRunTransaction");
  });

  it("rejects amount and currency mismatches before transaction reconciliation", () => {
    expect(webhookSource).toContain("StripeWebhookExpectedMoney");
    expect(webhookSource).toContain("StripeWebhookMoneyMatchDecision");
    expect(webhookSource).toContain('status: "amount_mismatch"');
    expect(webhookSource).toContain('status: "currency_mismatch"');
    expect(webhookSource).toContain("Stripe webhook amount does not match the trusted local deposit expectation.");
    expect(webhookSource).toContain("Stripe webhook currency does not match the trusted local deposit expectation.");
    expect(webhookSource).toContain("shouldRunTransaction: reconciliation.shouldReconcile && moneyMatch.canReconcileMoney");
    expect(webhookSource).toContain("shouldPersistReplay: reconciliation.blockers.length === 0 && moneyMatch.canReconcileMoney");
  });

  it("blocks webhook reconciliation on trusted amount or currency mismatches", () => {
    expect(
      verifyStripeWebhookMoneyMatch({
        providerAmountCents: 12500,
        providerCurrency: "usd",
        expected: {
          amountCents: 15000,
          currency: "usd",
        },
      }),
    ).toMatchObject({
      status: "amount_mismatch",
      canReconcileMoney: false,
    });

    expect(
      verifyStripeWebhookMoneyMatch({
        providerAmountCents: 15000,
        providerCurrency: "eur",
        expected: {
          amountCents: 15000,
          currency: "usd",
        },
      }),
    ).toMatchObject({
      status: "currency_mismatch",
      canReconcileMoney: false,
    });
  });

  it("keeps Stripe SDK and CLI proof gated", () => {
    expect(webhookSource).toContain('import Stripe from "stripe"');
    expect(webhookSource).toContain("constructStripeWebhookEventWithRawBody");
    expect(webhookSource).toContain("constructEvent(input.rawBody");
    expect(webhookSource).toContain("stripeSdkInstalled: true");
    expect(webhookSource).toContain("constructEventUsesRawBody: true");
    expect(webhookSource).toContain("webhookSecretConfigured: false");
    expect(webhookSource).toContain("stripeCliReplayVerified: false");
  });

  it("surfaces webhook reconciliation contract from the route", () => {
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("buildStripeWebhookRouteContract");
    expect(routeSource).toContain("webhookContract");
    expect(routeSource).toContain("reconciliation");
    expect(routeSource).toContain("runtimeReadiness");
  });

  it("pins durable Stripe webhook replay and payment audit persistence seams", () => {
    expect(routeSource).toContain("resolveStripeTenant");
    expect(routeSource).toContain("persistStripeWebhookEvent");
    expect(routeSource).toContain("txRuntime.providerWebhookDelivery.findFirst");
    expect(routeSource).toContain("txRuntime.providerWebhookDelivery.create");
    expect(routeSource).toContain("txRuntime.providerWebhookDelivery.update");
    expect(routeSource).toContain("txRuntime.paymentAuditLog.create");
    expect(routeSource).toContain("stripe.webhook.received");
    expect(routeSource).toContain("rawPayloadStored: false");
    expect(routeSource).toContain("Production Stripe webhooks require STRIPE_WEBHOOK_SECRET");
  });
});
