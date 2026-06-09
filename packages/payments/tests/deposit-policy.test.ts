import { describe, expect, it } from "vitest";
import {
  buildPaymentLifecyclePersistencePlan,
  buildPaymentOperationsWorkflowPlan,
  buildStripeCheckoutExecutionReadiness,
  buildStripeCheckoutSessionDraft,
  buildStripeWebhookReconciliationPlan,
  calculateDepositPolicy,
  evaluateNoShowPolicy,
  evaluateRefundPolicy,
  generateReceiptNumber,
  interpretStripeWebhook,
  verifyStripeWebhookSignature,
} from "../src/index";
import { createHmac } from "node:crypto";

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

  it("blocks live Stripe Checkout until SDK, secrets, persistence, token, and redirects are safe", () => {
    const readiness = buildStripeCheckoutExecutionReadiness({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      amountCents: 15000,
      currency: "usd",
      successUrl: "https://evil.example/success",
      cancelUrl: "not-a-url",
      clientEmail: "client@example.com",
      artistDisplayName: "Mara Vale",
      stripeSdkInstalled: false,
      stripeSecretConfigured: false,
      stripeApiVersionPinned: false,
      idempotencyStoreAvailable: false,
      persistenceAvailable: false,
      signedBookingTokenValid: false,
      allowedRedirectHosts: ["inkroute.test"],
    });

    expect(readiness).toMatchObject({
      status: "blocked",
      canCallStripe: false,
      requiredWrites: ["Deposit", "Payment", "PaymentAuditLog", "IdempotencyKey"],
    });
    expect(readiness.blockers).toEqual([
      "Stripe SDK must be installed before live Checkout execution.",
      "Stripe secret key must be configured in a secret store before live Checkout execution.",
      "Stripe API version must be pinned before live Checkout execution.",
      "Idempotency store must be available before live Checkout execution.",
      "Deposit, Payment, and PaymentAuditLog persistence must be available before live Checkout execution.",
      "Signed booking/deposit token must be valid before creating a Checkout session.",
      "Success redirect host is not in the allowed redirect host list.",
      "Cancel redirect host is not in the allowed redirect host list.",
    ]);
  });

  it("allows live Stripe Checkout only when provider and persistence gates pass", () => {
    const readiness = buildStripeCheckoutExecutionReadiness({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      amountCents: 15000,
      currency: "usd",
      successUrl: "https://inkroute.test/deposit/success",
      cancelUrl: "https://inkroute.test/deposit/cancel",
      clientEmail: "client@example.com",
      artistDisplayName: "Mara Vale",
      stripeSdkInstalled: true,
      stripeSecretConfigured: true,
      stripeApiVersionPinned: true,
      idempotencyStoreAvailable: true,
      persistenceAvailable: true,
      signedBookingTokenValid: true,
      allowedRedirectHosts: ["inkroute.test"],
    });

    expect(readiness.status).toBe("ready");
    expect(readiness.canCallStripe).toBe(true);
    expect(readiness.draft.idempotencyKey).toBe("deposit:tenant_demo:booking_demo:15000:usd");
    expect(readiness.requiredControls).toContain("Return only Stripe-hosted checkout URL to the browser; never return secret keys or raw provider payloads.");
    expect(readiness.blockers).toEqual([]);
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

  it("verifies Stripe webhook signatures against the raw body and timestamp tolerance", () => {
    const rawBody = JSON.stringify({ id: "evt_001", type: "checkout.session.completed" });
    const timestamp = 1780966800;
    const secret = "whsec_test_secret";
    const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");

    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        endpointSecret: secret,
        nowEpochSeconds: timestamp + 60,
      }),
    ).toMatchObject({
      verified: true,
      status: "verified",
      timestamp,
    });

    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=${timestamp},v1=deadbeef`,
        endpointSecret: secret,
        nowEpochSeconds: timestamp + 60,
      }).status,
    ).toBe("signature_mismatch");

    expect(
      verifyStripeWebhookSignature({
        rawBody,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        endpointSecret: secret,
        nowEpochSeconds: timestamp + 600,
      }).status,
    ).toBe("timestamp_outside_tolerance");
  });

  it("plans tenant-scoped provider session persistence with audit and idempotency writes", () => {
    const plan = buildPaymentLifecyclePersistencePlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      action: "record_checkout_session",
      amountCents: 15000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-06T10:00:00.000Z",
      providerSessionId: "cs_test_001",
      idempotencyKey: "deposit:tenant_demo:booking_demo:15000:usd",
    });

    expect(plan).toMatchObject({
      status: "ready",
      targetStatus: "pending",
      auditAction: "checkout_session_created",
      requiresTransaction: true,
      idempotencyKey: "deposit:tenant_demo:booking_demo:15000:usd",
    });
    expect(plan.writes.map((write) => write.model)).toEqual(["Deposit", "Payment", "PaymentAuditLog", "IdempotencyKey"]);
    expect(plan.writes.every((write) => write.tenantId === "tenant_demo")).toBe(true);
    expect(plan.writes.find((write) => write.model === "PaymentAuditLog")?.payload).toMatchObject({
      action: "checkout_session_created",
      providerSessionId: "cs_test_001",
      bookingRequestId: "booking_demo",
    });
    expect(plan.requiredControls).toContain("Execute all writes in one tenant-scoped database transaction.");
    expect(plan.blockers).toEqual([]);
  });

  it("plans paid, refunded, and disputed lifecycle writes through the audit transaction", () => {
    const paid = buildPaymentLifecyclePersistencePlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      action: "mark_paid",
      amountCents: 15000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-06T10:05:00.000Z",
      providerPaymentIntentId: "pi_001",
      idempotencyKey: "stripe-webhook:evt_paid_001",
    });
    const refunded = buildPaymentLifecyclePersistencePlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      action: "mark_refunded",
      amountCents: 15000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-07T10:05:00.000Z",
      providerChargeId: "ch_001",
      idempotencyKey: "stripe-webhook:evt_refund_001",
    });
    const disputed = buildPaymentLifecyclePersistencePlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      action: "mark_disputed",
      amountCents: 15000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-08T10:05:00.000Z",
      providerChargeId: "ch_001",
      idempotencyKey: "stripe-webhook:evt_dispute_001",
    });

    expect(paid.targetStatus).toBe("paid");
    expect(paid.auditAction).toBe("deposit_paid");
    expect(paid.writes.map((write) => write.model)).toEqual(["Payment", "Deposit", "BookingStateEvent", "PaymentAuditLog", "IdempotencyKey"]);
    expect(refunded.targetStatus).toBe("refunded");
    expect(refunded.writes.map((write) => write.model)).toEqual(["Refund", "Payment", "PaymentAuditLog", "IdempotencyKey"]);
    expect(disputed.targetStatus).toBe("disputed");
    expect(disputed.auditAction).toBe("webhook_received");
  });

  it("blocks lifecycle persistence plans missing scope, idempotency, amount, or provider ids", () => {
    const plan = buildPaymentLifecyclePersistencePlan({
      tenantId: " ",
      bookingRequestId: "",
      action: "mark_paid",
      amountCents: 0,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-06T10:05:00.000Z",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockers).toEqual([
      "Missing tenant scope.",
      "Missing booking request id.",
      "Payment amount must be positive.",
      "Missing idempotency key for lifecycle mutation.",
      "Provider payment intent id is required before finalizing paid or failed state.",
    ]);
  });

  it("plans authorized Stripe refund execution with provider, audit, and idempotency controls", () => {
    const plan = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "execute_refund",
      amountCents: 20000,
      refundAmountCents: 12500,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:00:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "refund:tenant_demo:payment_demo:12500",
      providerChargeId: "ch_001",
      stripeRefundsEnabled: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      action: "execute_refund",
      providerCall: "stripe.refunds.create",
      requiresTransaction: true,
      idempotencyKey: "refund:tenant_demo:payment_demo:12500",
    });
    expect(plan.writes.map((write) => write.model)).toEqual(["Refund", "Payment", "PaymentAuditLog", "IdempotencyKey"]);
    expect(plan.writes.every((write) => write.tenantId === "tenant_demo")).toBe(true);
    expect(plan.writes.find((write) => write.model === "PaymentAuditLog")?.payload).toMatchObject({
      action: "execute_refund",
      providerCall: "stripe.refunds.create",
      refundAmountCents: 12500,
      actorId: "artist_001",
    });
    expect(plan.blockers).toEqual([]);
  });

  it("plans no-show forfeiture, dispute evidence, receipt delivery, and accounting export writes", () => {
    const forfeiture = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "record_no_show_forfeiture",
      amountCents: 20000,
      currency: "usd",
      provider: "manual",
      occurredAt: "2026-06-09T10:15:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "no-show:tenant_demo:payment_demo",
      noShowDecision: "forfeit_deposit",
    });
    const dispute = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "prepare_dispute_evidence",
      amountCents: 20000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:20:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "dispute:tenant_demo:payment_demo",
      providerChargeId: "ch_001",
      evidenceFileIds: ["file_policy", "file_messages"],
    });
    const receipt = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "generate_receipt",
      amountCents: 20000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:25:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "receipt:tenant_demo:payment_demo",
      clientEmail: "client@example.com",
      receiptNumber: "MARA-2026-00001",
      receiptDeliveryConfigured: true,
    });
    const accountingExport = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "create_accounting_export",
      amountCents: 20000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:30:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "export:tenant_demo:2026-06",
      exportReviewerId: "reviewer_001",
      taxReviewApproved: true,
    });

    expect(forfeiture.writes.map((write) => write.model)).toEqual(["Payment", "BookingStateEvent", "PaymentAuditLog", "IdempotencyKey"]);
    expect(dispute.providerCall).toBe("stripe.disputes.update");
    expect(dispute.writes.map((write) => write.model)).toEqual(["DisputeEvidence", "PaymentAuditLog", "IdempotencyKey"]);
    expect(receipt.providerCall).toBe("receipt.delivery.send");
    expect(receipt.writes.map((write) => write.model)).toEqual(["Receipt", "PaymentAuditLog", "IdempotencyKey"]);
    expect(accountingExport.providerCall).toBe("accounting.export.write");
    expect(accountingExport.writes.map((write) => write.model)).toEqual(["AccountingExport", "PaymentAuditLog", "IdempotencyKey"]);
  });

  it("blocks payment operations that lack authorization, provider readiness, receipts, or accounting review", () => {
    const refund = buildPaymentOperationsWorkflowPlan({
      tenantId: "",
      bookingRequestId: "",
      paymentId: "",
      action: "execute_refund",
      amountCents: 10000,
      refundAmountCents: 20000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:00:00.000Z",
    });
    const receipt = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "generate_receipt",
      amountCents: 10000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:00:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "receipt:tenant_demo:payment_demo",
    });
    const accountingExport = buildPaymentOperationsWorkflowPlan({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      paymentId: "payment_demo",
      action: "create_accounting_export",
      amountCents: 10000,
      currency: "usd",
      provider: "stripe",
      occurredAt: "2026-06-09T10:00:00.000Z",
      actorId: "artist_001",
      idempotencyKey: "export:tenant_demo:2026-06",
    });

    expect(refund.status).toBe("blocked");
    expect(refund.blockers).toEqual([
      "Missing tenant scope.",
      "Missing booking request id.",
      "Missing payment id.",
      "Payment operations require an actor id for authorization and audit attribution.",
      "Missing idempotency key for payment operation.",
      "Stripe refunds must be enabled before executing provider refunds.",
      "Stripe refund requires a provider charge or payment intent id.",
      "Refund amount must be positive and no greater than the captured payment amount.",
    ]);
    expect(receipt.blockers).toEqual([
      "Receipt generation requires a receipt number.",
      "Receipt delivery requires a client email address.",
      "Receipt delivery provider must be configured before sending receipts.",
    ]);
    expect(accountingExport.blockers).toEqual([
      "Accounting export requires tax/accounting review approval.",
      "Accounting export requires a reviewer id.",
    ]);
  });
});
