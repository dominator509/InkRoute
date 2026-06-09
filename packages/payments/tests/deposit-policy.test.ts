import { describe, expect, it } from "vitest";
import {
  buildPaymentLifecyclePersistencePlan,
  buildPaymentAutomatedTestReadinessPlan,
  buildLiveStripePaymentsReadinessPlan,
  buildPaymentOperationsWorkflowPlan,
  buildPaymentOperationsRuntimeReadinessPlan,
  buildPaymentPersistenceRuntimeReadinessPlan,
  buildStripeCheckoutExecutionReadiness,
  buildStripeCheckoutRouteRuntimeReadinessPlan,
  buildStripeCheckoutSessionDraft,
  buildStripeWebhookReconciliationPlan,
  buildStripeWebhookRuntimeReadinessPlan,
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

  it("blocks deposit-session route runtime readiness until Stripe, signed access, persistence, safe redirects, and webhook evidence exist", () => {
    const plan = buildStripeCheckoutRouteRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      paymentsTestsPassed: true,
      paymentsTypecheckPassed: false,
      webPaymentRouteTestsPassed: true,
      webTypecheckPassed: false,
      stripeSdkInstalled: false,
      stripeSecretConfigured: false,
      stripeApiVersionPinned: false,
      checkoutRouteUsesStripeClient: false,
      acceptedBookingOrSignedTokenEnforced: false,
      idempotencyKeyPersistedBeforeProviderCall: false,
      providerSessionPersisted: false,
      paymentAuditLogPersisted: false,
      tenantScopedTransactionConfigured: false,
      allowedRedirectHostsEnforced: false,
      safeBrowserResponseVerified: false,
      invalidTokenRejectedTested: false,
      expiredTokenRejectedTested: false,
      webhookReconciliationVerified: false,
      stripeTestModeCheckoutVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
      "stripe trigger checkout.session.completed",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "Stripe Checkout client route wiring with secret-backed test-mode configuration",
      "accepted-booking or signed-token authorization tests for valid, invalid, and expired deposit access",
      "tenant-scoped transaction evidence for Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes",
      "safe redirect allowlist and browser response redaction test output",
      "Stripe test-mode Checkout and verified webhook reconciliation transcript",
    ]));
    expect(plan.blockers).toContain("Deposit-session route must call the Stripe Checkout client instead of returning only a local preview.");
    expect(plan.blockers).toContain("Browser response must expose only the hosted Checkout URL and redacted local ids.");
    expect(plan.blockers).toContain("Stripe test-mode Checkout session creation must be verified with provider evidence.");
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

  it("blocks Stripe webhook runtime readiness until raw-body SDK verification, replay protection, provider checks, and DB reconciliation are proven", () => {
    const plan = buildStripeWebhookRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      paymentsTestsPassed: true,
      paymentsTypecheckPassed: false,
      webWebhookRouteTestsPassed: true,
      webTypecheckPassed: false,
      stripeSdkInstalled: false,
      constructEventUsesRawBody: false,
      webhookSecretConfigured: false,
      invalidSignatureRejected: true,
      timestampToleranceEnforced: true,
      replayProtectionPersisted: false,
      supportedEventsCovered: ["checkout.session.completed", "payment_intent.succeeded", "payment_intent.payment_failed"],
      providerObjectFetchConfigured: false,
      tenantResolutionFromTrustedMetadata: true,
      depositPaymentRefundPersistenceConfigured: false,
      paymentAuditLogPersistenceConfigured: false,
      bookingStateEventPersistenceConfigured: false,
      tenantScopedTransactionConfigured: false,
      amountCurrencyMismatchRejected: true,
      unknownEventsLoggedAndIgnored: true,
      stripeCliReplayVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingSupportedEvents).toEqual(["checkout.session.expired", "charge.refunded", "charge.dispute.created"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "stripe trigger checkout.session.completed",
      "stripe trigger charge.refunded",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "Stripe SDK constructEvent raw-body verification evidence with STRIPE_WEBHOOK_SECRET",
      "persistent event-id replay protection and tenant-scoped transaction evidence",
      "supported event reconciliation tests for success, failure, expiration, refund, dispute, and mismatch cases",
      "Deposit, Payment, Refund, BookingStateEvent, and PaymentAuditLog persistence evidence",
      "Stripe CLI replay transcript for supported events, invalid signature, and replay denial",
    ]));
    expect(plan.blockers).toContain("Webhook route must use Stripe constructEvent with the raw request body.");
    expect(plan.blockers).toContain("Stripe event replay protection must persist provider event ids.");
    expect(plan.blockers).toContain("Stripe CLI replay tests must verify success, failure, expiration, refund, dispute, invalid signature, and replay behavior.");
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

  it("blocks payment persistence runtime readiness until repositories, transactions, audit logs, tenant isolation, and seeded Postgres evidence exist", () => {
    const plan = buildPaymentPersistenceRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      paymentsTestsPassed: true,
      paymentsTypecheckPassed: false,
      dbSchemaIncludesPaymentModels: false,
      repositoriesImplemented: false,
      tenantScopedQueriesEnforced: false,
      transactionalMutationsImplemented: false,
      idempotencyStoreImplemented: false,
      depositCreationPersisted: false,
      providerSessionPersisted: false,
      paidTransitionPersisted: false,
      failedTransitionPersisted: false,
      refundTransitionPersisted: false,
      disputeTransitionPersisted: false,
      paymentAuditLogPersistedForEveryMutation: false,
      bookingStateEventPersistedForLifecycleChanges: false,
      crossTenantIsolationTestsPassed: false,
      replayIdempotencyTestsPassed: false,
      seededPostgresIntegrationTestsPassed: false,
      dashboardPaymentReadsUseRepository: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/db prisma validate",
      "payment persistence seeded Postgres integration tests",
      "dashboard payment repository route/action tests",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "Prisma models and tenant-scoped payment repository/service implementation",
      "deposit, provider-session, paid, and failed transition persistence test output",
      "refund and dispute persistence test output",
      "PaymentAuditLog and BookingStateEvent persistence evidence for every lifecycle mutation",
      "seeded Postgres integration tests for tenant isolation and idempotent replay",
    ]));
    expect(plan.blockers).toContain("Tenant-scoped payment repositories/services must be implemented.");
    expect(plan.blockers).toContain("Every payment lifecycle mutation must persist a PaymentAuditLog row.");
    expect(plan.blockers).toContain("Seeded Postgres integration tests must pass for payment persistence lifecycle.");
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

  it("blocks payment operations runtime readiness until refund, no-show, dispute, receipt, export, review, and E2E evidence exist", () => {
    const plan = buildPaymentOperationsRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      paymentsTestsPassed: true,
      paymentsTypecheckPassed: false,
      dashboardPaymentActionsImplemented: false,
      refundActionAuthorized: false,
      stripeRefundsTestModeVerified: false,
      refundPersistenceConfigured: false,
      noShowForfeitureActionImplemented: false,
      noShowAuditPersistenceConfigured: false,
      disputeEvidenceWorkflowImplemented: false,
      disputeProviderSyncVerified: false,
      receiptGenerationImplemented: false,
      receiptDeliveryProviderConfigured: false,
      receiptDeliveryTested: false,
      accountingExportImplemented: false,
      exportRedactionVerified: false,
      taxAccountingReviewApproved: false,
      idempotencyConfiguredForOperations: false,
      paymentAuditLogPersistedForOperations: false,
      tenantAuthorizationTestsPassed: false,
      dashboardE2eEvidenceAttached: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/dashboard typecheck",
      "stripe refunds.create test-mode smoke",
      "dashboard payment operations E2E smoke",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "authorized dashboard/server actions with cross-tenant denial tests",
      "Stripe test-mode refund transcript and persisted Refund/PaymentAuditLog records",
      "no-show forfeiture action evidence with BookingStateEvent and PaymentAuditLog rows",
      "dispute evidence files and Stripe test-mode dispute sync transcript",
      "generated and delivered receipt evidence with redacted client/payment data",
      "accounting export file, redaction proof, and tax/accounting review approval",
      "idempotency, audit-log, and dashboard E2E evidence for all payment operations",
    ]));
    expect(plan.blockers).toContain("Stripe test-mode refund execution must be verified.");
    expect(plan.blockers).toContain("Tax/accounting review must approve export fields and retention policy.");
    expect(plan.blockers).toContain("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");
  });

  it("blocks payment automated test readiness until helper, route, Stripe CLI, DB, E2E, CI, and artifact evidence exists", () => {
    const plan = buildPaymentAutomatedTestReadinessPlan({
      packageScripts: { test: "vitest run" },
      paymentsUnitTestsPassed: true,
      paymentRouteTestsPassed: true,
      stripeSdkSignatureTestsPassed: false,
      stripeCliLifecycleTestsPassed: false,
      dbReconciliationTestsPassed: false,
      bookingToPaidE2ePassed: false,
      refundNoShowDisputeTestsPassed: false,
      receiptExportTestsPassed: false,
      crossTenantPaymentTestsPassed: false,
      replayIdempotencyTestsPassed: false,
      ciPaymentTestJobConfigured: false,
      artifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/payments test",
      "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      "payment DB reconciliation integration tests",
      "Stripe CLI payment lifecycle tests",
      "Playwright booking-to-paid payment E2E flow",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "payment helper, route-boundary, and Stripe signature test output",
      "Stripe CLI lifecycle transcript for checkout success/failure/expiration/refund/dispute/replay",
      "seeded DB reconciliation, tenant isolation, and idempotent replay test output",
      "Playwright/dashboard E2E evidence for booking-to-paid, refund/no-show/dispute, receipt, and export flows",
      "CI payment test job configuration and retained artifacts",
    ]));
    expect(plan.blockers).toContain("Stripe CLI lifecycle tests must cover checkout completed, failed payment, expired checkout, refund, dispute, invalid signature, and replay.");
    expect(plan.blockers).toContain("Booking-to-paid Playwright/E2E flow must pass.");
    expect(plan.blockers).toContain("Payment test artifacts must capture Stripe CLI logs, DB reconciliation output, and E2E screenshots/traces.");
  });

  it("blocks live Stripe payments readiness until provider checkout, webhooks, DB reconciliation, refunds, E2E, CI, and artifacts are proven", () => {
    const plan = buildLiveStripePaymentsReadinessPlan({
      packageScripts: { test: "vitest run" },
      stripeSdkInstalled: false,
      stripeSecretConfigured: false,
      stripeWebhookSecretConfigured: true,
      stripeApiVersionPinned: false,
      checkoutProviderCallImplemented: false,
      paymentIntentLifecycleHandled: false,
      providerIdempotencyStoreBackedByDb: false,
      checkoutSessionPersisted: false,
      webhookRawBodyVerificationConfigured: true,
      webhookReplayProtectionPersisted: false,
      dbReconciliationTransactional: false,
      refundExecutionImplemented: false,
      disputeWorkflowImplemented: false,
      stripeCliLifecycleVerified: false,
      bookingToPaidE2eVerified: false,
      crossTenantPaymentIsolationVerified: false,
      ciPaymentEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "Stripe SDK pin plus redacted secret/webhook/API-version configuration evidence.",
      "Real Checkout session creation with persisted provider session and DB-backed idempotency evidence.",
      "Raw-body webhook verification, replay protection, and supported lifecycle event evidence.",
      "Tenant-scoped transactional reconciliation and cross-tenant denial evidence.",
      "Refund execution and dispute workflow evidence or explicit blocked-operation audit evidence.",
      "Stripe CLI, booking-to-paid E2E, CI, and secret-safe artifact evidence.",
    ]));
    expect(plan.blockers).toContain("Deposit session route must create real Stripe Checkout sessions in provider-backed mode.");
    expect(plan.blockers).toContain("Payment/refund/dispute reconciliation must run in tenant-scoped database transactions.");
    expect(plan.blockers).toContain("Payment artifacts must be redacted and free of Stripe secrets or client-private data.");
  });

  it("marks live Stripe payments readiness ready when provider, persistence, webhook, refund, E2E, CI, and artifact evidence align", () => {
    const plan = buildLiveStripePaymentsReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit" },
      stripeSdkInstalled: true,
      stripeSecretConfigured: true,
      stripeWebhookSecretConfigured: true,
      stripeApiVersionPinned: true,
      checkoutProviderCallImplemented: true,
      paymentIntentLifecycleHandled: true,
      providerIdempotencyStoreBackedByDb: true,
      checkoutSessionPersisted: true,
      webhookRawBodyVerificationConfigured: true,
      webhookReplayProtectionPersisted: true,
      dbReconciliationTransactional: true,
      refundExecutionImplemented: true,
      disputeWorkflowImplemented: true,
      stripeCliLifecycleVerified: true,
      bookingToPaidE2eVerified: true,
      crossTenantPaymentIsolationVerified: true,
      ciPaymentEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
