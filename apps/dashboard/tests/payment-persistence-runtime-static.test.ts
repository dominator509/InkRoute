import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPaymentPersistenceArtifactReview,
  buildPaymentPersistenceEvidenceDecision,
  buildPaymentPersistenceExecutionPlan,
  buildRedactedPaymentPersistenceArtifact,
  paymentPersistenceArtifactPaths,
  paymentPersistenceEvidenceFlags,
  paymentPersistenceExternalCommands,
  paymentPersistenceLocalCommands,
  paymentPersistenceRequiredExternalEvidence,
  paymentPersistenceRuntimeProofFiles,
  paymentPersistenceRuntimeCommands,
  paymentPersistenceRuntimeMatrix,
  paymentPersistenceRuntimeReadiness,
} from "../lib/paymentPersistenceRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("payment persistence runtime contract", () => {
  const paymentsPackageJson = readWorkspaceFile("packages/payments/package.json");
  const paymentsSource = readWorkspaceFile("packages/payments/src/index.ts");
  const paymentsTests = readWorkspaceFile("packages/payments/tests/deposit-policy.test.ts");
  const persistenceSource = readWorkspaceFile("apps/dashboard/lib/paymentPersistence.ts");
  const persistenceStaticTest = readWorkspaceFile("apps/dashboard/tests/payment-persistence-static.test.ts");
  const dashboardPage = readWorkspaceFile("apps/dashboard/app/payments/page.tsx");
  const paymentActionPanel = readWorkspaceFile("apps/dashboard/components/PaymentActionPanel.tsx");
  const paymentsRoute = readWorkspaceFile("apps/dashboard/app/api/payments/route.ts");
  const paymentDetailRoute = readWorkspaceFile("apps/dashboard/app/api/payments/[paymentId]/route.ts");
  const refundRoute = readWorkspaceFile("apps/dashboard/app/api/refunds/route.ts");
  const depositDraftRoute = readWorkspaceFile("apps/dashboard/app/api/payments/deposit-session/route.ts");
  const prismaSchema = readWorkspaceFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-051 commands, matrix rows, and artifacts", () => {
    expect(paymentPersistenceRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/db prisma validate",
      "payment persistence seeded Postgres integration tests",
      "dashboard payment repository route/action tests",
    ]);
    expect(paymentPersistenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "payments-typecheck",
      "payments-tests",
      "prisma-validate",
      "repository-contract",
      "tenant-scope",
      "lifecycle-transactions",
      "idempotency-store",
      "deposit-create",
      "provider-session",
      "paid-failed-transitions",
      "refund-dispute-transitions",
      "payment-audit-log",
      "booking-state-event",
      "cross-tenant-denial",
      "replay-idempotency",
      "seeded-postgres",
      "dashboard-repository-reads",
      "ci-secret-safe-evidence",
    ]);
    expect(paymentPersistenceArtifactPaths).toContain("coverage/payment-persistence-runtime.json");
    expect(paymentPersistenceArtifactPaths).toContain("test-results/payment-persistence-runtime");
  });

  it("keeps package helper, dashboard service contract, read routes, and schema models wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(paymentsSource).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(paymentsTests).toContain("buildPaymentPersistenceRuntimeReadinessPlan");
    expect(persistenceSource).toContain("TenantPaymentRepository");
    expect(persistenceSource).toContain("createInMemoryTenantPaymentRepository");
    expect(persistenceSource).toContain("createPrismaTenantPaymentRepository");
    expect(persistenceSource).toContain("applyPrismaPaymentLifecycleWrite");
    expect(persistenceSource).toContain("prisma.$transaction");
    expect(persistenceSource).toContain("executePaymentLifecycleMutation");
    expect(persistenceSource).toContain("claimIdempotencyKey");
    expect(persistenceSource).toContain("Idempotency key replay crossed tenant or action scope.");
    expect(persistenceSource).toContain("runLifecycleTransaction");
    expect(persistenceSource).toContain("findDashboardPayments");
    expect(persistenceSource).toContain("decidePaymentLifecycleTransition");
    expect(persistenceSource).toContain("PaymentLifecycleTransitionDecision");
    expect(persistenceSource).toContain("invalid_transition");
    expect(persistenceSource).toContain("idempotent_replay");
    expect(persistenceStaticTest).toContain("covers every required payment lifecycle action");
    expect(persistenceStaticTest).toContain("guards invalid lifecycle transitions");
    expect(persistenceStaticTest).toContain("provides a local tenant payment repository");
    expect(dashboardPage).toContain("Payment persistence contract");
    expect(dashboardPage).toContain("PaymentActionPanel");
    expect(paymentActionPanel).toContain('fetch(`/api/bookings/${bookingId}/state`');
    expect(paymentActionPanel).toContain('action: "request_deposit"');
    expect(paymentsRoute).toContain("PaymentAuditLog");
    expect(paymentDetailRoute).toContain("PaymentAuditLog");
    expect(refundRoute).toContain('export const runtime = "nodejs"');
    expect(refundRoute).toContain("dashboard-refund-create");
    expect(refundRoute).toContain("tx.idempotencyKey.upsert");
    expect(refundRoute).toContain("idempotency.status === \"completed\"");
    expect(refundRoute).toContain("tx.refund.findFirst");
    expect(refundRoute).toContain("tx.refund.create");
    expect(refundRoute).toContain("tx.paymentAuditLog.create");
    expect(refundRoute).toContain("tx.idempotencyKey.update");
    expect(refundRoute).toContain("rawReasonStoredInResult: false");
    expect(refundRoute).toContain("stripeRefundCreated: false");
    expect(refundRoute).toContain("webhookReconciled: false");
    expect(refundRoute).toContain("idempotencyKeyId");
    expect(refundRoute).toContain("idempotencyReplay");
    expect(depositDraftRoute).toContain('export const runtime = "nodejs"');
    expect(depositDraftRoute).toContain("dashboard-deposit-draft");
    expect(depositDraftRoute).toContain("tx.idempotencyKey.upsert");
    expect(depositDraftRoute).toContain("idempotency.status === \"completed\"");
    expect(depositDraftRoute).toContain("tx.deposit.findFirst");
    expect(depositDraftRoute).toContain("tx.deposit.create");
    expect(depositDraftRoute).toContain("tx.paymentAuditLog.create");
    expect(depositDraftRoute).toContain("tx.idempotencyKey.update");
    expect(depositDraftRoute).toContain("stripeCheckoutCreated: false");
    expect(depositDraftRoute).toContain("webhookReconciled: false");
    expect(depositDraftRoute).toContain("idempotencyKeyId");
    expect(depositDraftRoute).toContain("idempotencyReplay");
    expect(prismaSchema).toContain("model PaymentAuditLog");
  });

  it("keeps transaction, idempotency, lifecycle persistence, audit, isolation, and integration blockers explicit", () => {
    expect(paymentPersistenceRuntimeReadiness.status).toBe("blocked");
    expect(paymentPersistenceRuntimeReadiness.missingScripts).toEqual([]);
    expect(paymentPersistenceRuntimeReadiness.requiredCommands).toBe(paymentPersistenceRuntimeCommands);
    expect(paymentPersistenceRuntimeReadiness.requiredEvidence).toBe(paymentPersistenceEvidenceFlags);
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Payment lifecycle mutations must run in database transactions.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Deposit creation must persist Deposit and initial PaymentAuditLog records.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Provider Checkout session ids and redirect URLs must persist after Stripe creation.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Paid transition must persist Payment, Deposit, BookingStateEvent, PaymentAuditLog, and IdempotencyKey writes.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Failed payment transition must persist PaymentAuditLog and safe retry state.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Refund transition must persist Refund, Payment, PaymentAuditLog, and IdempotencyKey writes.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Dispute transition must persist disputed Payment state and PaymentAuditLog evidence.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("Every payment lifecycle mutation must persist a PaymentAuditLog row.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain("BookingStateEvent rows must be persisted for payment lifecycle changes that affect booking state.");
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain(
      "Idempotency store must be implemented for provider sessions, webhooks, refunds, and retries.",
    );
    expect(paymentPersistenceRuntimeReadiness.blockers).not.toContain(
      "Replay/idempotency tests must prove duplicate provider events and operation retries do not duplicate writes.",
    );
    expect(paymentPersistenceRuntimeReadiness.blockers).toContain("Seeded Postgres integration tests must pass for payment persistence lifecycle.");
  });

  it("classifies GAP-051 as blocked until payment persistence evidence is complete", () => {
    const decision = buildPaymentPersistenceEvidenceDecision({
      commands: ["pnpm --filter @inkroute/payments typecheck"],
      artifacts: ["coverage/payment-persistence-runtime.json"],
      evidence: { paymentsTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("payment persistence seeded Postgres integration tests");
    expect(decision.missingArtifacts).toContain("coverage/payment-persistence-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned payment persistence commands must be run and captured.");
  });

  it("classifies GAP-051 as complete when all payment persistence commands, artifacts, and evidence are present", () => {
    const decision = buildPaymentPersistenceEvidenceDecision({
      commands: paymentPersistenceRuntimeCommands,
      artifacts: paymentPersistenceArtifactPaths,
      evidence: Object.fromEntries(paymentPersistenceEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-051 execution policy non-executing and external evidence explicit", () => {
    const plan = buildPaymentPersistenceExecutionPlan();

    expect(plan.policy.codexMayClassifyStaticPaymentPersistenceReadiness).toBe(true);
    expect(plan.policy.prismaTransactionRequiredForClosure).toBe(true);
    expect(plan.policy.dbBackedIdempotencyRequiredForClosure).toBe(true);
    expect(plan.policy.lifecyclePersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.auditPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.seededPostgresRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.prismaExecutionAllowed).toBe(false);
    expect(plan.databaseTransactionExecutionAllowed).toBe(false);
    expect(plan.seededPostgresExecutionAllowed).toBe(false);
    expect(plan.crossTenantMutationExecutionAllowed).toBe(false);
    expect(plan.dashboardRouteExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(paymentPersistenceLocalCommands);
    expect(plan.externalCommands).toBe(paymentPersistenceExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(paymentPersistenceRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe payment persistence artifact review");
  });

  it("redacts GAP-051 payment persistence artifacts before secret-safe review", () => {
    const artifact = {
      tenantId: "tenant_private",
      databaseUrl: "postgres://private",
      paymentCustomerEmail: "client@example.test",
      idempotencyKey: "idem_private",
      nested: {
        bookingAuditPayload: "audit_private",
        publicSummary: "payment persistence evidence captured",
      },
    };

    const redacted = buildRedactedPaymentPersistenceArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "databaseUrl",
      "paymentCustomerEmail",
      "idempotencyKey",
      "nested.bookingAuditPayload",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantId: "[REDACTED]",
      databaseUrl: "[REDACTED]",
      paymentCustomerEmail: "[REDACTED]",
      idempotencyKey: "[REDACTED]",
      nested: {
        bookingAuditPayload: "[REDACTED]",
        publicSummary: "payment persistence evidence captured",
      },
    });

    const review = buildPaymentPersistenceArtifactReview({
      publicSummary: "safe payment persistence evidence",
      prismaTransactionLog: "transaction_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["prismaTransactionLog"]);
    expect(review.requiredExternalEvidence).toBe(paymentPersistenceRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("seeded Postgres integration tests");
  });

  it("pins current payment persistence proof files for GAP-051", () => {
    expect(paymentPersistenceRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/db/package.json",
      "packages/db/prisma/schema.prisma",
      "packages/payments/package.json",
      "packages/payments/src/index.ts",
      "packages/payments/tests/deposit-policy.test.ts",
      "apps/dashboard/lib/paymentPersistence.ts",
      "apps/dashboard/lib/paymentPersistenceRuntime.ts",
      "apps/dashboard/tests/payment-persistence-static.test.ts",
      "apps/dashboard/tests/payment-persistence-runtime-static.test.ts",
      "apps/dashboard/app/payments/page.tsx",
      "apps/dashboard/components/PaymentActionPanel.tsx",
      "apps/dashboard/app/api/payments/route.ts",
      "apps/dashboard/app/api/payments/[paymentId]/route.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of paymentPersistenceRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming database execution readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 payment persistence runtime contracts");
    expect(ciWorkflow).toContain("payment-persistence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("payment-persistence-runtime-artifacts");
    expect(unitManifest).toContain("unit-payment-persistence-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/paymentPersistenceRuntime.ts");
    expect(gapTracker).toContain("GAP-051 is payment-persistence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildPaymentPersistenceExecutionPlan");
    expect(gapTracker).toContain("paymentPersistenceExecutionPolicy");
    expect(gapTracker).toContain("paymentPersistenceRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPaymentPersistenceArtifact");
    expect(gapTracker).toContain("buildPaymentPersistenceArtifactReview");
    expect(paymentPersistenceArtifactPaths).toContain("coverage/payment-persistence-secret-safe-artifacts.json");
  });
});

