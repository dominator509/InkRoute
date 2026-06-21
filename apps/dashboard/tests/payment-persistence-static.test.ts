import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInMemoryTenantPaymentRepository, decidePaymentLifecycleTransition } from "../lib/paymentPersistence";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("dashboard payment persistence static contract", () => {
  const persistenceSource = readWorkspaceFile("apps/dashboard/lib/paymentPersistence.ts");
  const pageSource = readWorkspaceFile("apps/dashboard/app/payments/page.tsx");
  const actionPanelSource = readWorkspaceFile("apps/dashboard/components/PaymentActionPanel.tsx");

  it("wraps payment package lifecycle and runtime readiness helpers", () => {
    expect(persistenceSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(persistenceSource).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("buildPaymentPersistenceContract");
    expect(persistenceSource).toContain("createInMemoryTenantPaymentRepository");
  });

  it("covers every required payment lifecycle action", () => {
    for (const action of ["create_deposit", "record_checkout_session", "mark_paid", "mark_failed", "mark_refunded", "mark_disputed"]) {
      expect(persistenceSource).toContain(`action: "${action}"`);
    }
  });

  it("requires tenant scope, idempotency, transaction, and audit controls", () => {
    expect(persistenceSource).toContain("assertTenantScope");
    expect(persistenceSource).toContain("claimIdempotencyKey");
    expect(persistenceSource).toContain("decidePaymentLifecycleTransition");
    expect(persistenceSource).toContain("PaymentLifecycleTransitionDecision");
    expect(persistenceSource).toContain("runLifecycleTransaction");
    expect(persistenceSource).toContain("Persist PaymentAuditLog for every mutation");
  });

  it("guards invalid lifecycle transitions and idempotent replays before writes", () => {
    expect(persistenceSource).toContain("paymentLifecycleTargetStatus");
    expect(persistenceSource).toContain("allowedPreviousStatuses");
    expect(persistenceSource).toContain('status: "idempotent_replay"');
    expect(persistenceSource).toContain('status: "invalid_transition"');
    expect(persistenceSource).toContain("duplicate transaction writes are suppressed");
    expect(persistenceSource).toContain("transition.status === \"idempotent_replay\"");
    expect(persistenceSource).toContain("!transition.shouldWriteTransaction");
  });

  it("classifies idempotent replay and invalid lifecycle transitions without transaction writes", () => {
    expect(
      decidePaymentLifecycleTransition({
        action: "mark_paid",
        currentStatus: "checkout_session_recorded",
        idempotencyState: "replayed",
      }),
    ).toMatchObject({
      status: "idempotent_replay",
      shouldWriteTransaction: false,
      shouldPersistAuditLog: true,
    });

    expect(
      decidePaymentLifecycleTransition({
        action: "mark_paid",
        currentStatus: "refunded",
        idempotencyState: "claimed",
      }),
    ).toMatchObject({
      status: "invalid_transition",
      shouldWriteTransaction: false,
      shouldPersistAuditLog: true,
    });
  });

  it("provides a local tenant payment repository for idempotency, transaction, and dashboard read contracts", async () => {
    const repository = createInMemoryTenantPaymentRepository();
    const plan = {
      status: "ready" as const,
      action: "mark_paid" as const,
      paymentId: "payment_demo",
      targetStatus: "paid" as const,
      auditAction: "deposit_paid" as const,
      requiresTransaction: true as const,
      idempotencyKey: "payment:mark_paid:demo",
      writes: [],
      requiredControls: [],
      blockers: [],
    };

    await expect(
      repository.assertTenantScope({
        tenantId: "tenant_demo",
        action: "mark_paid",
        currentStatus: "checkout_session_recorded",
        paymentId: "payment_demo",
      }),
    ).resolves.toBeUndefined();
    await expect(repository.claimIdempotencyKey("payment:mark_paid:demo", "tenant_demo", "mark_paid")).resolves.toBe("claimed");
    await expect(repository.claimIdempotencyKey("payment:mark_paid:demo", "tenant_demo", "mark_paid")).resolves.toBe("replayed");
    await expect(repository.claimIdempotencyKey("payment:mark_paid:demo", "other_tenant", "mark_paid")).rejects.toThrow(
      "Idempotency key replay crossed tenant or action scope.",
    );

    await repository.runLifecycleTransaction(plan);
    repository.state.dashboardRows.set("tenant_demo", [{ id: "payment_demo" }, { id: "payment_other" }]);

    expect(repository.state.transactions).toEqual([plan]);
    await expect(repository.findDashboardPayments("tenant_demo", 1)).resolves.toEqual([{ id: "payment_demo" }]);
    await expect(repository.findDashboardPayments("other_tenant", 10)).resolves.toEqual([]);
  });

  it("keeps real Prisma transaction evidence gated", () => {
    expect(persistenceSource).toContain("transactionalMutationsImplemented: false");
    expect(persistenceSource).toContain("seededPostgresIntegrationTestsPassed: false");
    expect(persistenceSource).toContain("crossTenantIsolationTestsPassed: false");
  });

  it("surfaces payment persistence readiness on the dashboard page", () => {
    expect(pageSource).toContain("dashboardPaymentPersistenceContract");
    expect(pageSource).toContain("Payment persistence contract");
    expect(pageSource).toContain("repository/service contract");
    expect(pageSource).toContain("PaymentActionPanel");
    expect(actionPanelSource).toContain('fetch(`/api/bookings/${bookingId}/state`');
    expect(actionPanelSource).toContain('action: "request_deposit"');
  });
});
