import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedStripeWebhookArtifact,
  buildStripeWebhookEvidenceDecision,
  buildStripeWebhookExecutionPlan,
  buildStripeWebhookArtifactReview,
  stripeWebhookExternalCommands,
  stripeWebhookExecutionPolicy,
  stripeWebhookArtifactPaths,
  stripeWebhookEvidenceFlags,
  stripeWebhookLocalCommands,
  stripeWebhookRequiredExternalEvidence,
  stripeWebhookRuntimeRequiredEvidence,
  stripeWebhookRuntimeProofFiles,
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
  const pnpmLock = readWorkspaceFile("pnpm-lock.yaml");
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
      "capture Stripe SDK raw-body constructEvent adapter and redacted STRIPE_WEBHOOK_SECRET evidence",
      "reject invalid and stale Stripe signatures before trusted parsing",
      "persist Stripe provider event ids for replay protection",
      "cover checkout completed/expired, payment succeeded/failed, refund, and dispute events",
      "fetch or verify Stripe provider objects before reconciliation",
      "resolve tenant from trusted provider metadata or persisted provider ids",
      "reconcile Deposit, Payment, and Refund records",
      "persist PaymentAuditLog for accepted and rejected Stripe events",
      "persist BookingStateEvent for payment lifecycle changes",
      "run webhook reconciliation writes in one tenant-scoped transaction",
      "reject amount and currency mismatches before reconciliation",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "stripe trigger checkout.session.completed",
      "stripe trigger payment_intent.payment_failed",
      "stripe trigger charge.refunded",
      "Stripe CLI replay for supported events, invalid signature, and replay denial",
      "GitHub Actions Stripe webhook evidence job",
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
    expect(paymentsPackageJson).toContain('"stripe"');
    expect(pnpmLock).toContain("stripe:");
    expect(pnpmLock).toContain("specifier: ^22.2.1");
    expect(paymentsSource).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(paymentsSource).toContain("buildStripeWebhookReconciliationPlan");
    expect(paymentsSource).toContain("verifyStripeWebhookSignature");
    expect(paymentsTests).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(webhookSource).toContain("StripeWebhookReplayStore");
    expect(webhookSource).toContain('import Stripe from "stripe"');
    expect(webhookSource).toContain("constructStripeWebhookEventWithRawBody");
    expect(webhookSource).toContain("constructEvent(input.rawBody");
    expect(webhookSource).toContain("persistProcessedEvent");
    expect(webhookSource).toContain("persistPaymentAuditLog");
    expect(webhookSource).toContain("verifyStripeWebhookMoneyMatch");
    expect(webhookSource).toContain("moneyMatch.canReconcileMoney");
    expect(webhookSource).toContain("amount_mismatch");
    expect(webhookSource).toContain("currency_mismatch");
    expect(webhookSource).toContain("shouldRunTransaction");
    expect(webhookStaticTest).toContain("persists audit logs, replay ids, and transaction reconciliation in order");
    expect(webhookStaticTest).toContain("rejects amount and currency mismatches");
    expect(webhookRoute).toContain("webhookContract");
    expect(webhookRoute).toContain("runtimeReadiness");
    expect(webhookRoute).toContain("buildSafeStripeWebhookPersistenceResponse");
    expect(webhookRoute).toContain("buildSafeStripeWebhookInterpretationResponse");
    expect(webhookRoute).toContain("buildSafeStripeWebhookContractResponse");
    expect(webhookRoute).toContain("buildSafeLocalStripeWebhookReceipt");
    expect(webhookRoute).toContain("stripePersistenceResponseAllowlisted: true");
    expect(webhookRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(webhookRoute).toContain("rawProviderObjectEchoed: false");
    expect(webhookRoute).toContain("rawPayloadEchoed: false");
    expect(webhookRoute).toContain("eventIdEchoed: false");
    expect(webhookRoute).toContain("webhookIdEchoed: false");
    expect(webhookRoute).toContain("rawProviderEventIdEchoed: false");
    expect(webhookRoute).toContain("rawInterpretationEchoed: false");
    expect(webhookRoute).toContain("rawWebhookContractEchoed: false");
    expect(webhookRoute).toContain("rawProviderPayloadEchoed: false");
    expect(webhookRoute).not.toContain("persisted,");
    expect(webhookRoute).toContain("PROVIDER_STRIPE_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(webhookRoute).toContain("localStripeWebhookPersistenceDisabled");
    expect(webhookRoute).toContain("requiresDurableReplayProtection");
    expect(paymentRoutesTest).toContain("fail-closes production Stripe webhooks instead of persisting local runtime reconciliation");
    expect(paymentRoutesTest).toContain("PROVIDER_STRIPE_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(paymentRoutesTest).toContain("webhook");
    expect(prismaSchema).toContain("PaymentAuditLog");
  });

  it("keeps SDK constructEvent, replay, reconciliation, transaction, CLI, and provider blockers explicit", () => {
    expect(stripeWebhookRuntimeReadiness.status).toBe("blocked");
    expect(stripeWebhookRuntimeReadiness.missingScripts).toEqual([]);
    expect(stripeWebhookRuntimeReadiness.missingSupportedEvents).toEqual([]);
    expect(stripeWebhookRuntimeReadiness.requiredCommands).toBe(stripeWebhookRuntimeCommands);
    expect(stripeWebhookRuntimeReadiness.requiredEvidence).toBe(stripeWebhookRuntimeRequiredEvidence);
    expect(stripeWebhookRuntimeReadiness.requiredEvidence).toContain(
      "supported event reconciliation tests for success, failure, expiration, refund, dispute, and mismatch cases",
    );
    expect(stripeWebhookRuntimeReadiness.requiredEvidence).not.toContain(
      "persistent event-id replay protection and tenant-scoped transaction evidence",
    );
    expect(stripeWebhookRuntimeReadiness.blockers).not.toContain("Stripe SDK must be installed before production webhook verification.");
    expect(stripeWebhookRuntimeReadiness.blockers).not.toContain("Webhook route must use Stripe constructEvent with the raw request body.");
    expect(stripeWebhookRuntimeReadiness.blockers).toContain("STRIPE_WEBHOOK_SECRET must be configured in the secret store.");
    expect(stripeWebhookRuntimeReadiness.blockers).not.toContain("Stripe event replay protection must persist provider event ids.");
    expect(stripeWebhookRuntimeReadiness.blockers).not.toContain(
      "Webhook reconciliation writes must run in one tenant-scoped transaction.",
    );
    expect(stripeWebhookRuntimeReadiness.blockers).toContain(
      "Supported payment/refund/dispute events must fetch or verify provider objects before reconciliation.",
    );
    expect(stripeWebhookRuntimeReadiness.blockers).toContain("Stripe CLI replay tests must verify success, failure, expiration, refund, dispute, invalid signature, and replay behavior.");
  });

  it("classifies GAP-050 as blocked until Stripe webhook evidence is complete", () => {
    const decision = buildStripeWebhookEvidenceDecision({
      commands: ["pnpm --filter @inkroute/payments typecheck"],
      artifacts: ["coverage/stripe-webhook-runtime.json"],
      evidence: { paymentsTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("stripe trigger charge.refunded");
    expect(decision.missingArtifacts).toContain("coverage/stripe-webhook-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned Stripe webhook commands must be run and captured.");
  });

  it("classifies GAP-050 as complete when all Stripe webhook commands, artifacts, and evidence are present", () => {
    const decision = buildStripeWebhookEvidenceDecision({
      commands: stripeWebhookRuntimeCommands,
      artifacts: stripeWebhookArtifactPaths,
      evidence: Object.fromEntries(stripeWebhookEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-050 execution policy non-executing and external evidence explicit", () => {
    const plan = buildStripeWebhookExecutionPlan();

    expect(plan.policy).toBe(stripeWebhookExecutionPolicy);
    expect(plan.policy.codexMayClassifyStaticStripeWebhookReadiness).toBe(true);
    expect(plan.policy.webhookSecretRequiredForClosure).toBe(true);
    expect(plan.policy.replayPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.providerObjectVerificationRequiredForClosure).toBe(true);
    expect(plan.policy.dbReconciliationRequiredForClosure).toBe(true);
    expect(plan.policy.stripeCliReplayRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.webhookSecretExecutionAllowed).toBe(false);
    expect(plan.replayStoreExecutionAllowed).toBe(false);
    expect(plan.providerObjectExecutionAllowed).toBe(false);
    expect(plan.databaseReconciliationExecutionAllowed).toBe(false);
    expect(plan.stripeCliExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(stripeWebhookLocalCommands);
    expect(plan.externalCommands).toBe(stripeWebhookExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(stripeWebhookRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe Stripe webhook artifact review");
  });

  it("redacts GAP-050 Stripe webhook artifacts before secret-safe review", () => {
    const artifact = {
      stripeWebhookSecret: "whsec_private",
      stripeSignature: "t=1,v1=private",
      providerEventId: "evt_private",
      replayPayload: "event_private",
      nested: {
        paymentCustomerEmail: "client@example.test",
        publicSummary: "Stripe webhook evidence captured",
      },
    };

    const redacted = buildRedactedStripeWebhookArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "stripeWebhookSecret",
      "stripeSignature",
      "providerEventId",
      "replayPayload",
      "nested.paymentCustomerEmail",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      stripeWebhookSecret: "[REDACTED]",
      stripeSignature: "[REDACTED]",
      providerEventId: "[REDACTED]",
      replayPayload: "[REDACTED]",
      nested: {
        paymentCustomerEmail: "[REDACTED]",
        publicSummary: "Stripe webhook evidence captured",
      },
    });

    const review = buildStripeWebhookArtifactReview({
      publicSummary: "safe Stripe webhook evidence",
      webhookPayload: "payload_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["webhookPayload"]);
    expect(review.requiredExternalEvidence).toBe(stripeWebhookRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("Stripe CLI replay transcript");
  });

  it("pins current Stripe webhook proof files for GAP-050", () => {
    expect(stripeWebhookRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/web/package.json",
      "apps/web/app/api/webhooks/stripe/route.ts",
      "apps/web/lib/stripeWebhook.ts",
      "apps/web/lib/stripeWebhookRuntime.ts",
      "apps/web/tests/payment-routes.test.ts",
      "apps/web/tests/stripe-webhook-static.test.ts",
      "apps/web/tests/stripe-webhook-runtime-static.test.ts",
      "packages/payments/package.json",
      "pnpm-lock.yaml",
      "packages/payments/src/index.ts",
      "packages/payments/tests/deposit-policy.test.ts",
      "packages/db/prisma/schema.prisma",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of stripeWebhookRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/DB/CLI readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 Stripe webhook runtime contracts");
    expect(ciWorkflow).toContain("stripe-webhook-runtime-static.test.ts");
    expect(ciWorkflow).toContain("stripe-webhook-runtime-artifacts");
    expect(unitManifest).toContain("unit-stripe-webhook-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/stripeWebhookRuntime.ts");
    expect(gapTracker).toContain("GAP-050 is stripe-webhook-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildStripeWebhookExecutionPlan");
    expect(gapTracker).toContain("stripeWebhookExecutionPolicy");
    expect(gapTracker).toContain("stripeWebhookRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedStripeWebhookArtifact");
    expect(gapTracker).toContain("buildStripeWebhookArtifactReview");
    expect(stripeWebhookArtifactPaths).toContain("coverage/stripe-webhook-secret-safe-artifacts.json");
  });
});

