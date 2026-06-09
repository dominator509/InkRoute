import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("dashboard payment persistence static contract", () => {
  const persistenceSource = readWorkspaceFile("apps/dashboard/lib/paymentPersistence.ts");
  const pageSource = readWorkspaceFile("apps/dashboard/app/payments/page.tsx");

  it("wraps payment package lifecycle and runtime readiness helpers", () => {
    expect(persistenceSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(persistenceSource).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("buildPaymentPersistenceContract");
  });

  it("covers every required payment lifecycle action", () => {
    for (const action of ["create_deposit", "record_checkout_session", "mark_paid", "mark_failed", "mark_refunded", "mark_disputed"]) {
      expect(persistenceSource).toContain(`action: "${action}"`);
    }
  });

  it("requires tenant scope, idempotency, transaction, and audit controls", () => {
    expect(persistenceSource).toContain("assertTenantScope");
    expect(persistenceSource).toContain("claimIdempotencyKey");
    expect(persistenceSource).toContain("runLifecycleTransaction");
    expect(persistenceSource).toContain("Persist PaymentAuditLog for every mutation");
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
  });
});
