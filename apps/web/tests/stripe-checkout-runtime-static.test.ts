import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  stripeCheckoutArtifactPaths,
  stripeCheckoutRuntimeCommands,
  stripeCheckoutRuntimeMatrix,
  stripeCheckoutRuntimeReadiness,
} from "../lib/stripeCheckoutRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe Checkout runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const checkoutSource = readWorkspaceFile("apps/web/lib/stripeCheckout.ts");
  const checkoutStaticTest = readWorkspaceFile("apps/web/tests/stripe-checkout-static.test.ts");
  const depositRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts");
  const paymentRoutesTest = readWorkspaceFile("apps/web/tests/payment-routes.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-049 commands, matrix rows, and artifacts", () => {
    expect(stripeCheckoutRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm test:unit -- apps/web/tests/payment-routes.test.ts",
      "stripe checkout session create test-mode smoke",
      "stripe trigger checkout.session.completed",
    ]);
    expect(stripeCheckoutRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-tests",
      "web-typecheck",
      "payment-route-tests",
      "stripe-sdk-config",
      "secret-store-config",
      "signed-token-auth",
      "idempotency-before-provider",
      "provider-session-persistence",
      "payment-audit-log",
      "tenant-transaction",
      "redirect-allowlist",
      "safe-browser-response",
      "invalid-expired-token-tests",
      "webhook-reconciliation",
      "test-mode-provider-smoke",
      "ci-secret-safe-evidence",
    ]);
    expect(stripeCheckoutArtifactPaths).toContain("coverage/stripe-checkout-runtime.json");
    expect(stripeCheckoutArtifactPaths).toContain("test-results/stripe-checkout-runtime");
  });

  it("keeps package helper, route adapter seams, idempotency, audit, and route surfacing wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(paymentsSource).toContain("buildStripeCheckoutSessionDraft");
    expect(paymentsTests).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(checkoutSource).toContain("StripeCheckoutProviderAdapter");
    expect(checkoutSource).toContain("persistIdempotencyKey");
    expect(checkoutSource).toContain("persistPaymentAuditLog");
    expect(checkoutSource).toContain("safeBrowserResponse");
    expect(checkoutStaticTest).toContain("persists idempotency and audit before provider session creation");
    expect(depositRoute).toContain("checkoutContract");
    expect(depositRoute).toContain("runtimeReadiness");
    expect(paymentRoutesTest).toContain("deposit");
  });

  it("keeps Stripe SDK, auth, persistence, webhook, provider, and CI blockers explicit", () => {
    expect(stripeCheckoutRuntimeReadiness.status).toBe("blocked");
    expect(stripeCheckoutRuntimeReadiness.missingScripts).toEqual([]);
    expect(stripeCheckoutRuntimeReadiness.requiredCommands).toEqual([...stripeCheckoutRuntimeCommands]);
    expect(stripeCheckoutRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Stripe Checkout client route wiring with secret-backed test-mode configuration",
      "accepted-booking or signed-token authorization tests for valid, invalid, and expired deposit access",
      "tenant-scoped transaction evidence for Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes",
      "Stripe test-mode Checkout and verified webhook reconciliation transcript",
    ]));
    expect(stripeCheckoutRuntimeReadiness.blockers).toContain("Stripe SDK must be installed in the web/runtime dependency graph.");
    expect(stripeCheckoutRuntimeReadiness.blockers).toContain("Idempotency key must be persisted before calling Stripe Checkout.");
    expect(stripeCheckoutRuntimeReadiness.blockers).toContain("Stripe test-mode Checkout session creation must be verified with provider evidence.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live Stripe readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 Stripe Checkout runtime contracts");
    expect(ciWorkflow).toContain("stripe-checkout-runtime-static.test.ts");
    expect(ciWorkflow).toContain("stripe-checkout-runtime-artifacts");
    expect(unitManifest).toContain("unit-stripe-checkout-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/stripeCheckoutRuntime.ts");
    expect(gapTracker).toContain("GAP-049 is stripe-checkout-runtime-matrix wired");
    expect(stripeCheckoutArtifactPaths).toContain("coverage/stripe-checkout-secret-safe-artifacts.json");
  });
});
