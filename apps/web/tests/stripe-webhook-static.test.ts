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

  it("keeps production fail-closed Stripe webhook responses tenant-scope proof only", () => {
    expect(routeSource).toContain("tenantResolved: input.tenantSlug !== \"unknown\"");
    expect(routeSource).toContain("tenantSlugEchoed: false");
    expect(routeSource).not.toContain(["tenantSlugEchoed", "true"].join(": "));
    expect(routeSource).not.toContain("tenantSlug: input.tenantSlug");
  });

  it("defines replay and reconciliation adapter seams", () => {
    expect(webhookSource).toContain("StripeWebhookReplayStore");
    expect(webhookSource).toContain("hasProcessed");
    expect(webhookSource).toContain("persistProcessedEvent");
    expect(webhookSource).toContain("StripeWebhookReconciliationAdapter");
    expect(webhookSource).toContain("persistPaymentAuditLog");
  });

  it("persists audit logs, replay ids, and transaction reconciliation in order", () => {
    const reconciliationSource = webhookSource.slice(
      webhookSource.indexOf("export async function reconcileStripeWebhookWithAdapters"),
    );
    expect(webhookSource).toContain("verifyStripeWebhookMoneyMatch");
    expect(webhookSource).toContain("moneyMatch.canReconcileMoney");
    expect(reconciliationSource.indexOf("persistPaymentAuditLog")).toBeLessThan(reconciliationSource.indexOf("persistProcessedEvent"));
    expect(reconciliationSource.indexOf("persistProcessedEvent")).toBeLessThan(reconciliationSource.indexOf("adapter.reconcile"));
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
    expect(routeSource).toContain("eventIdReceived: Boolean(input.eventId)");
    expect(routeSource).toContain("rawProviderEventIdStored: false");
    expect(routeSource).toContain("tenantResolved: true");
    expect(routeSource).toContain("bookingMetadataPresent: Boolean(bookingRequestId)");
    expect(routeSource).toContain("paymentMatched: Boolean(payment)");
    expect(routeSource).toContain("depositMatched: Boolean(deposit)");
    expect(routeSource).toContain("internalPersistenceIdsStored: false");
    expect(routeSource).toContain("stripeWebhookDeliveryRecorded: true");
    expect(routeSource).toContain("providerWebhookDeliveryRecorded: true");
    expect(routeSource).toContain("providerWebhookDeliveryIdEchoed: false");
    expect(routeSource).toContain("auditLogged: true");
    expect(routeSource).toContain("auditIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain("tenantScope: { tenantResolved: true, tenantIdEchoed: false }");
    expect(routeSource).toContain("paymentMutationApplied: Boolean(persisted.paymentMutation)");
    expect(routeSource).toContain("paymentIdEchoed: false");
    expect(routeSource).toContain("depositMutationApplied: Boolean(persisted.depositMutation)");
    expect(routeSource).toContain("depositIdEchoed: false");
    expect(routeSource).toContain("tenantId: tenantResolution.tenantId");
    expect(routeSource).not.toContain("providerWebhookDeliveryId: persisted.replay.id");
    expect(routeSource).not.toContain("providerWebhookDeliveryId: persisted.delivery.id");
    expect(routeSource).not.toContain("auditId: persisted.audit.id");
    expect(routeSource).not.toContain("stripeWebhookDeliveryId: delivery.id");
    expect(routeSource).not.toContain("providerWebhookDeliveryId: delivery.id");
    expect(routeSource).not.toContain("paymentMutation: persisted.paymentMutation");
    expect(routeSource).not.toContain("depositMutation: persisted.depositMutation");
    expect(routeSource).not.toContain("tenantId: input.tenantId,\n          bookingRequestId");
    expect(routeSource).not.toContain("paymentId: payment?.id ?? paymentId");
    expect(routeSource).not.toContain("depositId: deposit?.id ?? depositId");
    expect(routeSource).toContain("Production Stripe webhooks require STRIPE_WEBHOOK_SECRET");
    expect(routeSource).toContain("buildSafeStripeWebhookInterpretationResponse");
    expect(routeSource).toContain("buildSafeStripeWebhookContractResponse");
    expect(routeSource).toContain("buildSafeLocalStripeWebhookReceipt");
    expect(routeSource).toContain("eventIdEchoed: false");
    expect(routeSource).toContain("webhookIdEchoed: false");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("rawProviderEventIdEchoed: false");
    expect(routeSource).toContain("rawInterpretationEchoed: false");
    expect(routeSource).toContain("rawWebhookContractEchoed: false");
    expect(routeSource).toContain("rawProviderPayloadEchoed: false");
    expect(routeSource).not.toContain("eventId: input.eventId");
    expect(routeSource).not.toContain("interpretation: input.interpretation");
    expect(routeSource).not.toContain("eventId: webhookContract.reconciliation.eventId");
    expect(routeSource).not.toContain("storedWebhook,");
  });
});
