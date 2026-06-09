import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  stripeWebhookArtifactPaths,
  stripeWebhookRuntimeCommands,
  stripeWebhookRuntimeMatrix,
  stripeWebhookRuntimeReadiness,
} from "../lib/stripeWebhookRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe webhook runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const webhookSource = readWorkspaceFile("apps/web/lib/stripeWebhook.ts");
  const webhookStaticTest = readWorkspaceFile("apps/web/tests/stripe-webhook-static.test.ts");
  const webhookRoute = readWorkspaceFile("apps/web/app/api/webhooks/stripe/route.ts");
  const paymentRoutesTest = readWorkspaceFile("apps/web/tests/payment-routes.test.ts");
  const prismaSchema = readWorkspaceFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-050 commands, matrix rows, and artifacts", () => {
    expect(stripeWebhookRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "stripe trigger checkout.session.completed",
      "stripe trigger payment_intent.payment_failed",
      "stripe trigger charge.refunded",
    ]);
    expect(stripeWebhookRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-tests",
      "web-typecheck",
      "webhook-route-tests",
      "construct-event-raw-body",
      "invalid-stale-signatures",
      "replay-protection",
      "supported-events",
      "provider-object-fetch",
      "trusted-tenant-resolution",
      "payment-persistence",
      "payment-audit-log",
      "booking-state-event",
      "tenant-transaction",
      "amount-currency-mismatch",
      "stripe-cli-replay",
      "ci-secret-safe-evidence",
    ]);
    expect(stripeWebhookArtifactPaths).toContain("coverage/stripe-webhook-runtime.json");
    expect(stripeWebhookArtifactPaths).toContain("test-results/stripe-webhook-runtime");
  });

  it("keeps package helper, route adapter seams, replay, audit, transaction, and route surfacing wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(paymentsSource).toContain("buildStripeWebhookReconciliationPlan");
    expect(paymentsSource).toContain("verifyStripeWebhookSignature");
    expect(paymentsTests).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(webhookSource).toContain("StripeWebhookReplayStore");
    expect(webhookSource).toContain("persistProcessedEvent");
    expect(webhookSource).toContain("persistPaymentAuditLog");
    expect(webhookSource).toContain("shouldRunTransaction");
    expect(webhookStaticTest).toContain("persists audit logs, replay ids, and transaction reconciliation in order");
    expect(webhookRoute).toContain("webhookContract");
    expect(webhookRoute).toContain("runtimeReadiness");
    expect(paymentRoutesTest).toContain("webhook");
    expect(prismaSchema).toContain("PaymentAuditLog");
  });

  it("keeps SDK constructEvent, replay, reconciliation, transaction, CLI, and provider blockers explicit", () => {
    expect(stripeWebhookRuntimeReadiness.status).toBe("blocked");
    expect(stripeWebhookRuntimeReadiness.missingScripts).toEqual([]);
    expect(stripeWebhookRuntimeReadiness.missingSupportedEvents).toEqual([]);
    expect(stripeWebhookRuntimeReadiness.requiredCommands).toEqual([...stripeWebhookRuntimeCommands]);
    expect(stripeWebhookRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Stripe SDK constructEvent raw-body verification evidence with STRIPE_WEBHOOK_SECRET",
      "persistent event-id replay protection and tenant-scoped transaction evidence",
      "supported event reconciliation tests for success, failure, expiration, refund, dispute, and mismatch cases",
      "Deposit, Payment, Refund, BookingStateEvent, and PaymentAuditLog persistence evidence",
      "Stripe CLI replay transcript for supported events, invalid signature, and replay denial",
    ]));
    expect(stripeWebhookRuntimeReadiness.blockers).toContain("Webhook route must use Stripe constructEvent with the raw request body.");
    expect(stripeWebhookRuntimeReadiness.blockers).toContain("Stripe event replay protection must persist provider event ids.");
    expect(stripeWebhookRuntimeReadiness.blockers).toContain("Stripe CLI replay tests must verify success, failure, expiration, refund, dispute, invalid signature, and replay behavior.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/DB/CLI readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 Stripe webhook runtime contracts");
    expect(ciWorkflow).toContain("stripe-webhook-runtime-static.test.ts");
    expect(ciWorkflow).toContain("stripe-webhook-runtime-artifacts");
    expect(unitManifest).toContain("unit-stripe-webhook-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/stripeWebhookRuntime.ts");
    expect(gapTracker).toContain("GAP-050 is stripe-webhook-runtime-matrix wired");
    expect(stripeWebhookArtifactPaths).toContain("coverage/stripe-webhook-secret-safe-artifacts.json");
  });
});
