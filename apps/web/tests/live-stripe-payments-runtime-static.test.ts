import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  liveStripePaymentsArtifactPaths,
  liveStripePaymentsReadinessAreas,
  liveStripePaymentsRuntimeCommands,
  liveStripePaymentsRuntimeMatrix,
  liveStripePaymentsRuntimeReadiness,
} from "../lib/liveStripePaymentsRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("live Stripe payments runtime contract", () => {
  const paymentsPackageJson = readRepoFile("packages/payments/package.json");
  const paymentsSource = readRepoFile("packages/payments/src/index.ts");
  const paymentsTests = readRepoFile("packages/payments/tests/deposit-policy.test.ts");
  const paymentRoutesTest = readRepoFile("apps/web/tests/payment-routes.test.ts");
  const stripeWebhookRoute = readRepoFile("apps/web/app/api/webhooks/stripe/route.ts");
  const dashboardPaymentReadTest = readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins live Stripe commands, readiness areas, matrix rows, and artifacts", () => {
    expect(liveStripePaymentsRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
      "payment DB reconciliation integration tests",
      "Playwright booking-to-paid E2E flow",
      "GitHub Actions payment evidence job",
    ]);
    expect(liveStripePaymentsReadinessAreas).toContain("raw-body-webhook-signature-verification");
    expect(liveStripePaymentsReadinessAreas).toContain("booking-to-paid-e2e");
    expect(liveStripePaymentsRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-package-typecheck",
      "payments-package-tests",
      "payment-routes-tests",
      "stripe-sdk-secret-api-version",
      "checkout-provider-call",
      "webhook-lifecycle-replay",
      "db-reconciliation-idempotency",
      "refund-dispute-workflows",
      "booking-to-paid-e2e",
      "ci-payment-evidence",
      "secret-safe-artifacts",
    ]);
    expect(liveStripePaymentsArtifactPaths).toContain("coverage/live-stripe-payments-runtime.json");
    expect(liveStripePaymentsArtifactPaths).toContain("test-results/live-stripe-payments-runtime");
  });

  it("keeps package scripts, helper tests, route tests, webhook verification, and read redaction wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildLiveStripePaymentsReadinessPlan");
    expect(paymentsSource).toContain("verifyStripeWebhookSignature");
    expect(paymentsTests).toContain("buildLiveStripePaymentsReadinessPlan");
    expect(paymentRoutesTest).toContain("Stripe-Signature");
    expect(stripeWebhookRoute).toContain("verifyStripeWebhookSignature");
    expect(dashboardPaymentReadTest).toContain("PaymentAuditLog");
  });

  it("keeps live provider blockers explicit until real Stripe evidence exists", () => {
    expect(liveStripePaymentsRuntimeReadiness.status).toBe("blocked");
    expect(liveStripePaymentsRuntimeReadiness.missingScripts).toEqual([]);
    expect(liveStripePaymentsRuntimeReadiness.requiredCommands).toEqual([...liveStripePaymentsRuntimeCommands]);
    expect(liveStripePaymentsRuntimeReadiness.requiredEvidence).toContain(
      "Stripe SDK pin plus redacted secret/webhook/API-version configuration evidence.",
    );
    expect(liveStripePaymentsRuntimeReadiness.requiredEvidence).toContain(
      "Stripe CLI, booking-to-paid E2E, CI, and secret-safe artifact evidence.",
    );
    expect(liveStripePaymentsRuntimeReadiness.blockers).toContain(
      "Stripe SDK must be installed and pinned before live provider payment readiness can close.",
    );
    expect(liveStripePaymentsRuntimeReadiness.blockers).toContain(
      "Booking-to-paid browser E2E flow must be verified with Stripe test mode.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live Stripe readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 live Stripe payments runtime contracts");
    expect(ciWorkflow).toContain("live-stripe-payments-runtime-static.test.ts");
    expect(ciWorkflow).toContain("live-stripe-payments-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-live-stripe-payments-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/liveStripePaymentsRuntime.ts");
    expect(gapTracker).toContain("live Stripe SDK/secret/API configuration, real Checkout writes, provider idempotency persistence, lifecycle reconciliation, refunds/disputes, Stripe CLI, booking-to-paid E2E, CI evidence, and secret-safe artifacts remain open");
  });
});
