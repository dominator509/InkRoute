import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { paymentAutomatedTestContract } from "../lib/paymentAutomatedTests";

const repoRoot = resolve(__dirname, "../../..");

describe("payment automated test contract", () => {
  it("enumerates the full Phase 7 payment lifecycle test matrix", () => {
    expect(paymentAutomatedTestContract.suites.map((suite) => suite.id)).toEqual([
      "payment-helper-unit",
      "payment-route-boundary",
      "stripe-signature",
      "stripe-cli-lifecycle",
      "payment-db-reconciliation",
      "booking-to-paid-e2e",
      "refund-no-show-dispute",
      "receipt-export",
      "cross-tenant-payment",
      "replay-idempotency",
    ]);
  });

  it("keeps artifacts secret-safe by contract", () => {
    expect(paymentAutomatedTestContract.suites.every((suite) => suite.secretPolicy === "redacted-only")).toBe(true);
    expect(paymentAutomatedTestContract.ciArtifactPaths).toContain("coverage/stripe-*-redacted.log");
    expect(paymentAutomatedTestContract.ciArtifactPaths).toContain("test-results/payments");
  });

  it("keeps runtime proof blocked until the lifecycle suites actually pass", () => {
    expect(paymentAutomatedTestContract.readiness.status).toBe("blocked");
    expect(paymentAutomatedTestContract.readiness.blockers).toContain("@inkroute/payments unit tests must pass.");
    expect(paymentAutomatedTestContract.readiness.blockers).toContain("Stripe CLI lifecycle tests must cover checkout completed, failed payment, expired checkout, refund, dispute, invalid signature, and replay.");
    expect(paymentAutomatedTestContract.readiness.blockers).toContain("DB reconciliation tests must prove Deposit, Payment, Refund, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
    expect(paymentAutomatedTestContract.readiness.blockers).toContain("Booking-to-paid Playwright/E2E flow must pass.");
  });

  it("wires a dedicated payment lifecycle CI step and retained artifacts", () => {
    const workflowSource = readFileSync(resolve(repoRoot, ".github/workflows/ci.yml"), "utf8");

    expect(workflowSource).toContain("Run Phase 7 payment lifecycle contracts");
    expect(workflowSource).toContain("pnpm --filter @inkroute/payments test");
    expect(workflowSource).toContain("pnpm vitest run apps/web/tests/payment-routes.test.ts");
    expect(workflowSource).toContain("Upload payment lifecycle artifacts");
    expect(workflowSource).toContain("coverage/payment-*.json");
    expect(workflowSource).toContain("test-results/payments");
  });
});
