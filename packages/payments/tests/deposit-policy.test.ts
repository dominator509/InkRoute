import { describe, expect, it } from "vitest";
import {
  buildStripeCheckoutSessionDraft,
  buildStripeWebhookReconciliationPlan,
  calculateDepositPolicy,
  evaluateNoShowPolicy,
  evaluateRefundPolicy,
  generateReceiptNumber,
  interpretStripeWebhook,
} from "../src/index";

describe("payment policy engine", () => {
  it("raises risk for high-demand travel and client no-show history", () => {
    const policy = calculateDepositPolicy({
      estimatedSessionHours: 5,
      city: "Seattle",
      appointmentType: "guest_spot",
      travelRiskTier: "high_demand_guest_spot",
      cityDemandScore: 5,
      clientNoShowCount: 1
    });

    expect(policy.depositRequired).toBe(true);
    expect(policy.depositAmountCents).toBeGreaterThan(25000);
    expect(policy.riskScore).toBeGreaterThan(70);
    expect(policy.breakdown.some((line) => line.label === "No-show history")).toBe(true);
  });

  it("builds a deterministic Stripe checkout session draft without calling Stripe", () => {
    const draft = buildStripeCheckoutSessionDraft({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      amountCents: 15000,
      currency: "usd",
      successUrl: "https://example.test/success",
      cancelUrl: "https://example.test/cancel",
      clientEmail: "client@example.com",
      artistDisplayName: "Mara Vale"
    });

    expect(draft.mode).toBe("payment");
    expect(draft.customerEmail).toBe("client@example.com");
    expect(draft.idempotencyKey).toContain("tenant_demo:booking_demo:15000:usd");
  });

  it("evaluates refund and no-show decisions with audit-friendly outcomes", () => {
    const refund = evaluateRefundPolicy({
      amountPaidCents: 20000,
      cancellationRequestedAt: "2026-06-01T10:00:00.000Z",
      appointmentStartsAt: "2026-06-06T10:00:00.000Z"
    });
    const noShow = evaluateNoShowPolicy({
      depositAmountCents: 20000,
      appointmentStartsAt: "2026-06-06T10:00:00.000Z",
      markedAt: "2026-06-06T10:45:00.000Z",
      clientArrivedMinutesLate: 45
    });

    expect(refund.decision).toBe("eligible");
    expect(noShow.decision).toBe("forfeit_deposit");
    expect(noShow.requiresAudit).toBe(true);
    expect(generateReceiptNumber("mara-vale", "2026-06-06T10:45:00.000Z", 12)).toContain("MARA-VALE");
  });

  it("plans Stripe webhook reconciliation with idempotency and amount checks", () => {
    const paid = buildStripeWebhookReconciliationPlan({
      eventId: "evt_paid_001",
      eventType: "checkout.session.completed",
      providerPaymentIntentId: "pi_001",
      amountCents: 15000,
      currency: "usd",
      expectedAmountCents: 15000,
      expectedCurrency: "usd",
    });

    expect(paid.shouldReconcile).toBe(true);
    expect(paid.action).toBe("deposit_paid");
    expect(paid.targetStatus).toBe("paid");
    expect(paid.idempotencyKey).toBe("stripe-webhook:evt_paid_001");
    expect(paid.requiredChecks.some((check) => check.includes("Stripe-Signature"))).toBe(true);

    const replay = buildStripeWebhookReconciliationPlan({
      eventId: "evt_paid_001",
      eventType: "payment_intent.succeeded",
      providerPaymentIntentId: "pi_001",
      alreadyProcessedEventIds: ["evt_paid_001"],
    });
    expect(replay.shouldReconcile).toBe(false);
    expect(replay.blockers).toContain("Stripe event id was already processed.");

    const mismatch = buildStripeWebhookReconciliationPlan({
      eventId: "evt_mismatch_001",
      eventType: "payment_intent.succeeded",
      providerPaymentIntentId: "pi_002",
      amountCents: 10000,
      currency: "usd",
      expectedAmountCents: 15000,
      expectedCurrency: "usd",
    });
    expect(mismatch.shouldReconcile).toBe(false);
    expect(mismatch.action).toBe("webhook_received");
    expect(mismatch.blockers).toContain("Provider amount does not match expected payment amount.");
  });

  it("keeps refund, dispute, and unknown Stripe events gated for manual review", () => {
    expect(interpretStripeWebhook("charge.refunded")).toMatchObject({
      action: "refund_succeeded",
      targetStatus: "refunded",
      safeToAutoReconcile: false,
    });
    expect(interpretStripeWebhook("charge.dispute.created")).toMatchObject({
      targetStatus: "disputed",
      safeToAutoReconcile: false,
    });

    const unknown = buildStripeWebhookReconciliationPlan({
      eventId: "evt_unknown_001",
      eventType: "customer.created",
    });

    expect(unknown.shouldReconcile).toBe(false);
    expect(unknown.blockers).toContain("Unsupported Stripe event type.");
    expect(unknown.shouldPersistAuditLog).toBe(true);
  });
});
