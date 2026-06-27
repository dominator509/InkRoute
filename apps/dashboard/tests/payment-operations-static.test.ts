import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  authorizePaymentOperationTenant,
  buildDashboardPaymentOperationsReadiness,
  buildPaymentOperationPreflightDecision,
  buildRedactedAccountingExportPayload,
  buildRedactedPaymentOperationProviderResult,
  buildRedactedReceiptDeliveryPayload,
  dashboardPaymentOperationsContract,
  executePaymentOperationMutation,
  sanitizePaymentOperationProviderResult,
} from "../lib/paymentOperations";

const repoRoot = resolve(__dirname, "../../..");
const operationSource = readFileSync(resolve(repoRoot, "apps/dashboard/lib/paymentOperations.ts"), "utf8");

describe("dashboard payment operation contract", () => {
  it("covers refund, no-show, dispute, receipt, and export actions", () => {
    expect(dashboardPaymentOperationsContract.supportedActions).toEqual([
      "execute_refund",
      "record_no_show_forfeiture",
      "prepare_dispute_evidence",
      "generate_receipt",
      "create_accounting_export",
    ]);
    expect(dashboardPaymentOperationsContract.samplePlans).toHaveLength(5);
    expect(dashboardPaymentOperationsContract.samplePlans.every((plan) => plan.requiresTransaction)).toBe(true);
  });

  it("requires authorization, idempotency, audit logging, and provider redaction controls", () => {
    const controls = dashboardPaymentOperationsContract.samplePlans.flatMap((plan) => plan.requiredControls);

    expect(operationSource).toContain("buildPaymentOperationPreflightDecision");
    expect(operationSource).toContain("PaymentOperationPreflightDecision");
    expect(operationSource).toContain("PaymentAuditLog persistence must be ready");
    expect(operationSource).toContain("Stripe refund execution must be enabled");
    expect(operationSource).toContain("Dispute evidence files are required");
    expect(operationSource).toContain("Receipt delivery provider must be configured");
    expect(operationSource).toContain("Accounting export redaction must be verified");
    expect(operationSource).toContain("Tax/accounting review must approve export fields");
    expect(controls.join("\n")).toContain("Authorize the actor against the tenant and payment");
    expect(controls.join("\n")).toContain("Claim the idempotency key");
    expect(controls.join("\n")).toContain("Persist PaymentAuditLog");
    expect(controls.join("\n")).toContain("Store redacted provider references only");
  });

  it("blocks unsafe operation preflight paths before provider or delivery calls", () => {
    expect(
      buildPaymentOperationPreflightDecision({
        action: "execute_refund",
        stripeRefundsEnabled: false,
        receiptDeliveryConfigured: true,
        taxReviewApproved: true,
        exportRedactionVerified: true,
        disputeEvidenceFileCount: 1,
        paymentAuditLogReady: true,
      }),
    ).toMatchObject({
      status: "blocked",
      requiresProviderCall: true,
      blockers: ["Stripe refund execution must be enabled before refund operations."],
    });

    expect(
      buildPaymentOperationPreflightDecision({
        action: "prepare_dispute_evidence",
        stripeRefundsEnabled: true,
        receiptDeliveryConfigured: true,
        taxReviewApproved: true,
        exportRedactionVerified: true,
        disputeEvidenceFileCount: 0,
        paymentAuditLogReady: true,
      }),
    ).toMatchObject({
      status: "blocked",
      requiresProviderCall: true,
      blockers: ["Dispute evidence files are required before provider dispute sync."],
    });

    expect(
      buildPaymentOperationPreflightDecision({
        action: "generate_receipt",
        stripeRefundsEnabled: true,
        receiptDeliveryConfigured: false,
        taxReviewApproved: true,
        exportRedactionVerified: true,
        disputeEvidenceFileCount: 1,
        paymentAuditLogReady: true,
      }),
    ).toMatchObject({
      status: "blocked",
      requiresReceiptDelivery: true,
      blockers: ["Receipt delivery provider must be configured before receipt operations."],
    });

    expect(
      buildPaymentOperationPreflightDecision({
        action: "create_accounting_export",
        stripeRefundsEnabled: true,
        receiptDeliveryConfigured: true,
        taxReviewApproved: false,
        exportRedactionVerified: false,
        disputeEvidenceFileCount: 1,
        paymentAuditLogReady: true,
      }),
    ).toMatchObject({
      status: "blocked",
      requiresExportReview: true,
      blockers: [
        "Accounting export redaction must be verified before export delivery.",
        "Tax/accounting review must approve export fields before export delivery.",
      ],
    });
  });

  it("denies cross-tenant, anonymous, and unauthorized payment operations", () => {
    expect(
      authorizePaymentOperationTenant({
        requestedTenantId: "tenant_demo",
        paymentTenantId: "other_tenant",
        actorId: "artist_demo",
        requestedAction: "execute_refund",
        allowedActions: ["execute_refund"],
      }),
    ).toMatchObject({
      status: "denied",
      canOperate: false,
      blockers: ["Payment operation tenant scope does not match payment tenant."],
    });

    expect(
      authorizePaymentOperationTenant({
        requestedTenantId: "tenant_demo",
        paymentTenantId: "tenant_demo",
        actorId: "",
        requestedAction: "execute_refund",
        allowedActions: ["execute_refund"],
      }),
    ).toMatchObject({
      status: "denied",
      canOperate: false,
      blockers: ["Authenticated dashboard actor is required for payment operations."],
    });

    expect(
      authorizePaymentOperationTenant({
        requestedTenantId: "tenant_demo",
        paymentTenantId: "tenant_demo",
        actorId: "artist_demo",
        requestedAction: "create_accounting_export",
        allowedActions: ["generate_receipt"],
      }),
    ).toMatchObject({
      status: "denied",
      canOperate: false,
      blockers: ["Payment operation action is not authorized for this actor."],
    });
  });

  it("checks tenant authorization before idempotency and provider execution", () => {
    expect(operationSource.indexOf("authorizePaymentOperationTenant")).toBeLessThan(operationSource.indexOf("claimIdempotencyKey"));
    expect(operationSource.indexOf("authorizePaymentOperationTenant")).toBeLessThan(operationSource.indexOf("executeProviderCall"));
    expect(operationSource).toContain("createStripePaymentOperationProvider");
    expect(operationSource).toContain("stripe.refunds.create");
    expect(operationSource).toContain("stripe.disputes.update");
    expect(operationSource).toContain("idempotencyKey: plan.idempotencyKey");
    expect(operationSource).toContain("buildRedactedPaymentOperationProviderResult");
    expect(operationSource).toContain("tenantAuthorization.blockers");
  });

  it("redacts provider operation payload secrets and client-private fields", () => {
    expect(
      buildRedactedPaymentOperationProviderResult({
        providerCall: "stripe.refunds.create",
        providerReference: "re_123",
        payload: {
          id: "re_123",
          client_secret: "seti_secret_123",
          apiKey: "sk_test_123",
          email: "client@example.com",
          amount: 2500,
        },
      }),
    ).toEqual({
      providerCall: "stripe.refunds.create",
      providerReference: "re_123",
      redactedPayload: {
        id: "re_123",
        client_secret: "[redacted]",
        apiKey: "[redacted]",
        email: "[redacted]",
        amount: 2500,
      },
    });
  });

  it("re-sanitizes provider callback results before persistence", () => {
    expect(
      sanitizePaymentOperationProviderResult({
        providerCall: "stripe.refunds.create",
        providerReference: "re_123",
        redactedPayload: {
          id: "re_123",
          secret: "should-not-persist",
          clientEmail: "client@example.com",
        },
      }),
    ).toEqual({
      providerCall: "stripe.refunds.create",
      providerReference: "re_123",
      redactedPayload: {
        id: "re_123",
        secret: "[redacted]",
        clientEmail: "[redacted]",
      },
    });
    expect(operationSource.indexOf("sanitizePaymentOperationProviderResult")).toBeLessThan(
      operationSource.indexOf("persistProviderOperationResult"),
    );
  });

  it("builds receipt delivery payloads without raw recipient or client-private data", () => {
    const payload = buildRedactedReceiptDeliveryPayload({
      tenantId: "tenant_demo",
      paymentId: "payment_demo",
      receiptNumber: "TENANT-2026-00001",
      recipientEmail: "client@example.com",
      clientName: "Private Client",
    });

    expect(payload).toEqual({
      provider: "receipt_provider",
      receiptNumber: "TENANT-2026-00001",
      paymentId: "payment_demo",
      tenantId: "tenant_demo",
      deliveryTarget: "configured_provider",
      redactedRecipient: "email-present",
      redactedSummary:
        "Receipt delivery payload excludes raw email, client name, payment method, provider secrets, and medical notes.",
    });
    expect(JSON.stringify(payload)).not.toContain("client@example.com");
    expect(JSON.stringify(payload)).not.toContain("Private Client");
  });

  it("builds accounting export payloads with client and provider-private fields redacted", () => {
    const payload = buildRedactedAccountingExportPayload({
      tenantId: "tenant_demo",
      exportId: "export_demo",
      reviewerId: "reviewer_demo",
      rows: [
        {
          receiptNumber: "TENANT-2026-00001",
          amountCents: 2500,
          clientName: "Private Client",
          clientEmail: "client@example.com",
          medicalNotes: "private medical context",
          providerSecret: "sk_test_123",
        },
      ],
    });

    expect(payload.rows).toEqual([
      {
        receiptNumber: "TENANT-2026-00001",
        amountCents: 2500,
        clientName: "[redacted]",
        clientEmail: "[redacted]",
        medicalNotes: "[redacted]",
        providerSecret: "[redacted]",
      },
    ]);
    expect(JSON.stringify(payload)).not.toContain("Private Client");
    expect(JSON.stringify(payload)).not.toContain("client@example.com");
    expect(JSON.stringify(payload)).not.toContain("private medical context");
    expect(JSON.stringify(payload)).not.toContain("sk_test_123");
  });

  it("executes operation mutation through auth, idempotency, sanitized provider persistence, and redacted return data", async () => {
    const persistedProviderResults: unknown[] = [];
    const repository = {
      async assertAuthorizedOperator() {
        return {
          tenantId: "tenant_demo",
          actorId: "artist_demo",
          paymentId: "payment_demo",
          allowedActions: ["execute_refund" as const],
        };
      },
      async claimIdempotencyKey() {
        return "claimed" as const;
      },
      async runOperationTransaction() {
        return undefined;
      },
      async persistProviderOperationResult(input: unknown) {
        persistedProviderResults.push(input);
      },
    } as Parameters<typeof executePaymentOperationMutation>[1];
    const mutationInput = {
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      currency: "USD",
      actorId: "artist_demo",
      paymentId: "payment_demo",
      action: "execute_refund",
      amountCents: 2500,
      refundAmountCents: 2500,
      provider: "stripe",
      occurredAt: "2026-06-09T12:00:00.000Z",
      idempotencyKey: "refund:tenant_demo:payment_demo:2500",
      requestId: "request_demo",
      providerChargeId: "ch_demo_refund",
      stripeRefundsEnabled: true,
      paymentAuditLogReady: true,
    } as Parameters<typeof executePaymentOperationMutation>[0];

    const result = await executePaymentOperationMutation(
      mutationInput,
      repository,
      async () => ({
        providerCall: "stripe.refunds.create",
        providerReference: "re_123",
        redactedPayload: {
          id: "re_123",
          secret: "should-not-persist",
          customerEmail: "client@example.com",
        },
      }),
    );

    expect(result.status).toBe("ready");
    expect(result.providerResult?.redactedPayload).toEqual({
      id: "re_123",
      secret: "[redacted]",
      customerEmail: "[redacted]",
    });
    expect(persistedProviderResults).toEqual([
      expect.objectContaining({
        result: expect.objectContaining({
          redactedPayload: {
            id: "re_123",
            secret: "[redacted]",
            customerEmail: "[redacted]",
          },
        }),
      }),
    ]);
  });

  it("keeps external runtime evidence blocked until Stripe, receipt, tax, auth, and E2E proof exist", () => {
    const readiness = buildDashboardPaymentOperationsReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("Stripe test-mode refund execution must be verified.");
    expect(readiness.blockers).toContain("Receipt delivery provider must be configured before sending receipts.");
    expect(readiness.blockers).toContain("Tax/accounting review must approve export fields and retention policy.");
    expect(readiness.blockers).not.toContain("Tenant authorization tests must deny cross-tenant payment operations.");
    expect(readiness.blockers).toContain("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");
  });

  it("surfaces the operation contract on the dashboard payments page", () => {
    const pageSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/payments/page.tsx"), "utf8");
    const actionPanelSource = readFileSync(resolve(repoRoot, "apps/dashboard/components/PaymentActionPanel.tsx"), "utf8");

    expect(pageSource).toContain("dashboardPaymentOperationsContract");
    expect(pageSource).toContain("Payment operation write contract");
    expect(pageSource).toContain("dashboardPaymentOperationsContract.supportedActions");
    expect(pageSource).toContain("dashboardPaymentOperationsContract");
    expect(pageSource).toContain("supportedActions.map");
    expect(pageSource).toContain("PaymentActionPanel");
    expect(pageSource).toContain("Local verifier wired; endpoint-secret proof pending");
    expect(pageSource).toContain("Stripe events mapped behind signature verification");
    expect(pageSource).not.toContain("Signature verification not wired");
    expect(actionPanelSource).toContain("create_deposit_session");
    expect(actionPanelSource).toContain("does not call Stripe");
  });
});
