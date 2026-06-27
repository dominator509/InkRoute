import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedStripeCheckoutArtifact,
  buildStripeCheckoutArtifactReview,
  buildStripeCheckoutEvidenceDecision,
  buildStripeCheckoutExecutionPlan,
  stripeCheckoutArtifactPaths,
  stripeCheckoutEvidenceFlags,
  stripeCheckoutExternalCommands,
  stripeCheckoutExecutionPolicy,
  stripeCheckoutLocalCommands,
  stripeCheckoutRequiredExternalEvidence,
  stripeCheckoutRouteRuntimeRequiredEvidence,
  stripeCheckoutRuntimeProofFiles,
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
  const pnpmLock = readWorkspaceFile("pnpm-lock.yaml");
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
      "capture installed Stripe SDK/API-version source contract and redacted secret evidence",
      "configure STRIPE_SECRET_KEY in secret store",
      "enforce accepted booking or short-lived signed deposit token",
      "persist idempotency key before calling Stripe Checkout",
      "persist Stripe Checkout session id and redirect URL after provider creation",
      "persist PaymentAuditLog for Checkout attempts and outcomes",
      "wrap Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes in one tenant-scoped transaction",
      "enforce success/cancel redirect host allowlist at route boundary",
      "return only Stripe-hosted redirect URL and redacted local ids to browser",
      "test invalid and expired signed deposit token rejection",
      "stripe checkout session create test-mode smoke",
      "stripe trigger checkout.session.completed",
      "GitHub Actions Stripe Checkout evidence job",
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
    expect(paymentsPackageJson).toContain('"stripe"');
    expect(pnpmLock).toContain("stripe:");
    expect(pnpmLock).toContain("specifier: ^22.2.1");
    expect(checkoutSource).toContain('import Stripe from "stripe"');
    expect(checkoutSource).toContain("STRIPE_CHECKOUT_API_VERSION");
    expect(checkoutSource).toContain("buildStripeCheckoutSdkConfig");
    expect(checkoutSource).toContain("idempotencyHeaderRequired");
    expect(paymentsSource).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(paymentsSource).toContain("buildStripeCheckoutSessionDraft");
    expect(paymentsTests).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(checkoutSource).toContain("StripeCheckoutProviderAdapter");
    expect(checkoutSource).toContain("StripeDepositAuthorizationToken");
    expect(checkoutSource).toContain("verifyStripeDepositAuthorization");
    expect(checkoutSource).toContain("authorization.canCreateCheckout");
    expect(checkoutSource).toContain("persistIdempotencyKey");
    expect(checkoutSource).toContain("persistPaymentAuditLog");
    expect(checkoutSource).toContain("safeBrowserResponse");
    expect(checkoutStaticTest).toContain("persists idempotency and audit before provider session creation");
    expect(checkoutStaticTest).toContain("signed-token authorization before live Checkout");
    expect(depositRoute).toContain("checkoutContract");
    expect(depositRoute).toContain("runtimeReadiness");
    expect(depositRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(depositRoute).toContain('{ ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) }');
    expect(paymentRoutesTest).toContain('response.headers.get("Cache-Control")).toBe("no-store")');
    expect(paymentRoutesTest).toContain("deposit");
  });

  it("keeps Stripe SDK, auth, persistence, webhook, provider, and CI blockers explicit", () => {
    expect(stripeCheckoutRuntimeReadiness.status).toBe("blocked");
    expect(stripeCheckoutRuntimeReadiness.missingScripts).toEqual([]);
    expect(stripeCheckoutRuntimeReadiness.requiredCommands).toBe(stripeCheckoutRuntimeCommands);
    expect(stripeCheckoutRuntimeReadiness.requiredEvidence).toBe(stripeCheckoutRouteRuntimeRequiredEvidence);
    expect(stripeCheckoutRuntimeReadiness.requiredEvidence).not.toContain(
      "accepted-booking or signed-token authorization tests for valid, invalid, and expired deposit access",
    );
    expect(stripeCheckoutRuntimeReadiness.requiredEvidence).not.toContain(
      "tenant-scoped transaction evidence for Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes",
    );
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Stripe SDK must be installed in the web/runtime dependency graph.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Stripe API version must be pinned for Checkout session creation.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Idempotency key must be persisted before calling Stripe Checkout.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Stripe provider session id and redirect URL must be persisted after Checkout creation.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("PaymentAuditLog must be persisted for Checkout session creation attempts and outcomes.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Deposit, Payment, PaymentAuditLog, and IdempotencyKey writes must run in one tenant-scoped transaction.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Invalid signed deposit token rejection must be tested.");
    expect(stripeCheckoutRuntimeReadiness.blockers).not.toContain("Expired signed deposit token rejection must be tested.");
    expect(stripeCheckoutRuntimeReadiness.blockers).toContain("STRIPE_SECRET_KEY must be configured in the secret store.");
    expect(stripeCheckoutRuntimeReadiness.blockers).toContain("Stripe test-mode Checkout session creation must be verified with provider evidence.");
  });

  it("classifies GAP-049 as blocked until Stripe Checkout evidence is complete", () => {
    const decision = buildStripeCheckoutEvidenceDecision({
      commands: ["pnpm --filter @inkroute/payments typecheck"],
      artifacts: ["coverage/stripe-checkout-runtime.json"],
      evidence: { paymentsTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("stripe trigger checkout.session.completed");
    expect(decision.missingArtifacts).toContain("coverage/stripe-checkout-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned Stripe Checkout commands must be run and captured.");
  });

  it("classifies GAP-049 as complete when all Stripe Checkout commands, artifacts, and evidence are present", () => {
    const decision = buildStripeCheckoutEvidenceDecision({
      commands: stripeCheckoutRuntimeCommands,
      artifacts: stripeCheckoutArtifactPaths,
      evidence: Object.fromEntries(stripeCheckoutEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-049 execution policy non-executing and external evidence explicit", () => {
    const plan = buildStripeCheckoutExecutionPlan();

    expect(plan.policy).toBe(stripeCheckoutExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(stripeCheckoutRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticStripeCheckoutReadiness).toBe(true);
    expect(plan.policy.stripeSecretRequiredForClosure).toBe(true);
    expect(plan.policy.providerCheckoutRequiredForClosure).toBe(true);
    expect(plan.policy.providerBackedTransactionRequiredForClosure).toBe(true);
    expect(plan.policy.webhookReconciliationRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.stripeProviderExecutionAllowed).toBe(false);
    expect(plan.secretStoreExecutionAllowed).toBe(false);
    expect(plan.databaseTransactionExecutionAllowed).toBe(false);
    expect(plan.webhookExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(stripeCheckoutLocalCommands);
    expect(plan.externalCommands).toBe(stripeCheckoutExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(stripeCheckoutRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe Stripe Checkout artifact review");
  });

  it("redacts GAP-049 Stripe Checkout artifacts before secret-safe review", () => {
    const artifact = {
      stripeSecretKey: "sk_test_private",
      checkoutSessionId: "cs_test_private",
      tenantDomain: "tenant.example.test",
      paymentCustomerEmail: "client@example.test",
      nested: {
        webhookPayload: "provider_private",
        publicSummary: "Stripe Checkout evidence captured",
      },
    };

    const redacted = buildRedactedStripeCheckoutArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "stripeSecretKey",
      "checkoutSessionId",
      "tenantDomain",
      "paymentCustomerEmail",
      "nested.webhookPayload",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      stripeSecretKey: "[REDACTED]",
      checkoutSessionId: "[REDACTED]",
      tenantDomain: "[REDACTED]",
      paymentCustomerEmail: "[REDACTED]",
      nested: {
        webhookPayload: "[REDACTED]",
        publicSummary: "Stripe Checkout evidence captured",
      },
    });

    const review = buildStripeCheckoutArtifactReview({
      publicSummary: "safe Stripe Checkout evidence",
      redirectUrl: "https://checkout.stripe.com/private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["redirectUrl"]);
    expect(review.requiredExternalEvidence).toBe(stripeCheckoutRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("webhook reconciliation proof");
  });

  it("pins current Stripe Checkout proof files for GAP-049", () => {
    expect(stripeCheckoutRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/payments/package.json",
      "pnpm-lock.yaml",
      "packages/payments/src/index.ts",
      "packages/payments/tests/deposit-policy.test.ts",
      "apps/web/lib/stripeCheckout.ts",
      "apps/web/lib/stripeCheckoutRuntime.ts",
      "apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts",
      "apps/web/tests/payment-routes.test.ts",
      "apps/web/tests/stripe-checkout-static.test.ts",
      "apps/web/tests/stripe-checkout-runtime-static.test.ts",
      "apps/web/package.json",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of stripeCheckoutRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live Stripe readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 Stripe Checkout runtime contracts");
    expect(ciWorkflow).toContain("stripe-checkout-runtime-static.test.ts");
    expect(ciWorkflow).toContain("stripe-checkout-runtime-artifacts");
    expect(unitManifest).toContain("unit-stripe-checkout-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/stripeCheckoutRuntime.ts");
    expect(gapTracker).toContain("GAP-049 is stripe-checkout-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildStripeCheckoutExecutionPlan");
    expect(gapTracker).toContain("stripeCheckoutExecutionPolicy");
    expect(gapTracker).toContain("stripeCheckoutRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedStripeCheckoutArtifact");
    expect(gapTracker).toContain("buildStripeCheckoutArtifactReview");
    expect(stripeCheckoutArtifactPaths).toContain("coverage/stripe-checkout-secret-safe-artifacts.json");
  });
});

