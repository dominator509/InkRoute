import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDashboardPaymentOperationsReadiness,
  dashboardPaymentOperationsContract,
} from "../lib/paymentOperations";

const repoRoot = resolve(__dirname, "../../..");

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

    expect(controls.join("\n")).toContain("Authorize the actor against the tenant and payment");
    expect(controls.join("\n")).toContain("Claim the idempotency key");
    expect(controls.join("\n")).toContain("Persist PaymentAuditLog");
    expect(controls.join("\n")).toContain("Store redacted provider references only");
  });

  it("keeps external runtime evidence blocked until Stripe, receipt, tax, auth, and E2E proof exist", () => {
    const readiness = buildDashboardPaymentOperationsReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("Stripe test-mode refund execution must be verified.");
    expect(readiness.blockers).toContain("Receipt delivery provider must be configured before sending receipts.");
    expect(readiness.blockers).toContain("Tax/accounting review must approve export fields and retention policy.");
    expect(readiness.blockers).toContain("Tenant authorization tests must deny cross-tenant payment operations.");
    expect(readiness.blockers).toContain("Dashboard E2E evidence must cover refund, no-show, dispute, receipt, and export flows.");
  });

  it("surfaces the operation contract on the dashboard payments page", () => {
    const pageSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/payments/page.tsx"), "utf8");

    expect(pageSource).toContain("dashboardPaymentOperationsContract");
    expect(pageSource).toContain("Payment operation write contract");
    expect(pageSource).toContain("execute_refund");
    expect(pageSource).toContain("create_accounting_export");
  });
});
