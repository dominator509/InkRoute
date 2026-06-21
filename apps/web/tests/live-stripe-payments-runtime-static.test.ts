import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildLiveStripePaymentsDecisionRequiredEvidence,
  buildLiveStripePaymentsEvidenceDecision,
  buildLiveStripePaymentsRuntimeArtifactReview,
  buildLiveStripePaymentsRuntimeExecutionPlan,
  buildLiveStripePaymentsRunData,
  buildRedactedLiveStripePaymentsArtifact,
  liveStripePaymentsArtifactPaths,
  liveStripePaymentsExecutionPolicy,
  liveStripePaymentsReadinessAreas,
  liveStripePaymentsRequiredEvidence,
  liveStripePaymentsRequiredExternalEvidence,
  liveStripePaymentsRuntimeExternalArtifacts,
  liveStripePaymentsRuntimeExternalCommands,
  liveStripePaymentsRuntimeLocalArtifacts,
  liveStripePaymentsRuntimeLocalCommands,
  liveStripePaymentsRunPersistenceContract,
  liveStripePaymentsRuntimeCommands,
  liveStripePaymentsRuntimeMatrix,
  liveStripePaymentsRuntimeReadiness,
  liveStripePaymentsRuntimeProofFiles,
  persistLiveStripePaymentsRun,
} from "../lib/liveStripePaymentsRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("live Stripe payments runtime contract", () => {
  const paymentsPackageJson = readRepoFile("packages/payments/package.json");
  const pnpmLock = readRepoFile("pnpm-lock.yaml");
  const paymentsSource = readRepoFile("packages/payments/src/index.ts");
  const paymentsTests = readRepoFile("packages/payments/tests/deposit-policy.test.ts");
  const configSource = readRepoFile("packages/config/src/index.ts");
  const stripeCheckoutSource = readRepoFile("apps/web/lib/stripeCheckout.ts");
  const paymentRoutesTest = readRepoFile("apps/web/tests/payment-routes.test.ts");
  const publicHomePage = readRepoFile("apps/web/app/page.tsx");
  const stripeWebhookRoute = readRepoFile("apps/web/app/api/webhooks/stripe/route.ts");
  const dashboardPaymentReadTest = readRepoFile("apps/dashboard/tests/payment-read-route-static.test.ts");
  const dashboardPaymentsPage = readRepoFile("apps/dashboard/app/payments/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const liveStripePaymentsMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032800_add_live_stripe_payments_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins live Stripe commands, readiness areas, matrix rows, and artifacts", () => {
    expect(liveStripePaymentsRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      "capture installed Stripe SDK/API-version source contract and redacted Stripe secret/webhook evidence",
      "create real Stripe Checkout sessions in provider-backed mode",
      "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
      "payment DB reconciliation integration tests",
      "authorized refund execution and dispute workflow tests",
      "Playwright booking-to-paid E2E flow",
      "GitHub Actions payment evidence job",
      "capture redacted payment artifacts without Stripe secrets or client-private data",
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
    expect(dashboardPaymentsPage).toContain("Local verifier wired; endpoint-secret proof pending");
    expect(dashboardPaymentsPage).not.toContain("Signature verification not wired");
    expect(configSource).toContain("local webhook interpretation and signature-verification boundaries are wired");
    expect(configSource).toContain("Stripe provider proof gated");
    expect(configSource).not.toContain("Stripe Checkout/Payment Intents, webhooks, refunds, no-show policy enforcement, and receipt delivery are not wired");
    expect(configSource).not.toContain("Stripe not connected");
    expect(publicHomePage).toContain("Deposits stay disabled until Stripe provider proof is captured.");
    expect(publicHomePage).not.toContain("until Stripe is wired and tested");
  });

  it("pins the LiveStripePaymentsRun persistence model and migration", () => {
    const runData = buildLiveStripePaymentsRunData({
      tenantId: "tenant_static",
      runId: "stripe_static",
      commitSha: "abc123",
      status: "blocked",
      paymentsPackageTypecheckPassed: true,
      paymentsPackageTestsPassed: true,
      paymentRoutesTestsPassed: true,
      stripeSdkInstalled: true,
      stripeSecretConfigured: false,
      stripeWebhookSecretConfigured: false,
      stripeApiVersionPinned: true,
      checkoutProviderCallImplemented: false,
      paymentIntentLifecycleHandled: false,
      providerIdempotencyStoreBackedByDb: false,
      checkoutSessionPersisted: false,
      webhookRawBodyVerificationConfigured: true,
      webhookReplayProtectionPersisted: false,
      dbReconciliationTransactional: false,
      refundExecutionImplemented: false,
      disputeWorkflowImplemented: false,
      stripeCliLifecycleVerified: false,
      bookingToPaidE2eVerified: false,
      crossTenantPaymentIsolationVerified: false,
      ciPaymentEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
      liveStripePaymentsRunPersisted: false,
      coveredReadinessAreas: ["raw-body-webhook-signature-verification"],
      capturedArtifacts: [
        "coverage/live-stripe-payments-runtime.json",
        "coverage/live-stripe-payments-typecheck.txt",
        "coverage/live-stripe-payments-test.txt",
        "coverage/live-stripe-payment-routes-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/payments typecheck",
        "pnpm --filter @inkroute/payments test",
        "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      ],
      paymentsTypecheckArtifactPath: "coverage/live-stripe-payments-typecheck.txt",
      paymentsTestArtifactPath: "coverage/live-stripe-payments-test.txt",
      paymentRoutesTestArtifactPath: "coverage/live-stripe-payment-routes-test.txt",
    });

    expect(liveStripePaymentsRunPersistenceContract.model).toBe("LiveStripePaymentsRun");
    expect(liveStripePaymentsRunPersistenceContract.tenantRelation).toBe("liveStripePaymentsRuns");
    expect(liveStripePaymentsRunPersistenceContract.migration).toBe("20260609032800_add_live_stripe_payments_runs");
    expect(liveStripePaymentsRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "stripeConfigurationManifest",
      "lifecycleEvidenceManifest",
    ]);
    expect(liveStripePaymentsRunPersistenceContract.evidenceBooleans).toContain("stripeSdkInstalled");
    expect(liveStripePaymentsRunPersistenceContract.evidenceBooleans).toContain("webhookReplayProtectionPersisted");
    expect(liveStripePaymentsRunPersistenceContract.evidenceBooleans).toContain("secretSafeArtifactsCaptured");
    expect(liveStripePaymentsRunPersistenceContract.artifactFields).toContain("bookingToPaidE2eArtifactPath");
    expect(liveStripePaymentsRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("liveStripePaymentsRuns LiveStripePaymentsRun[]");
    expect(prismaSchema).toContain("model LiveStripePaymentsRun");
    expect(prismaSchema).toContain("stripeConfigurationManifest");
    expect(prismaSchema).toContain("providerIdempotencyStoreBackedByDb");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(liveStripePaymentsMigration).toContain('CREATE TABLE "LiveStripePaymentsRun"');
    expect(liveStripePaymentsMigration).toContain('"stripeConfigurationManifest" JSONB NOT NULL');
    expect(liveStripePaymentsMigration).toContain('"secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(liveStripePaymentsMigration).toContain('CREATE UNIQUE INDEX "LiveStripePaymentsRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "stripe_static",
      commitSha: "abc123",
      status: "blocked",
      paymentsPackageTypecheckPassed: true,
      paymentsPackageTestsPassed: true,
      paymentRoutesTestsPassed: true,
      stripeSdkInstalled: true,
      webhookRawBodyVerificationConfigured: true,
      paymentsTypecheckArtifactPath: "coverage/live-stripe-payments-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(liveStripePaymentsRuntimeMatrix);
    expect(runData.readinessAreaManifest).toEqual(["raw-body-webhook-signature-verification"]);
    expect(String(persistLiveStripePaymentsRun)).toContain("repository.liveStripePaymentsRun.upsert");
  });

  it("keeps package scripts, helper tests, route tests, webhook verification, and read redaction wired", () => {
    expect(paymentsPackageJson).toContain('"typecheck"');
    expect(paymentsPackageJson).toContain('"test"');
    expect(paymentsPackageJson).toContain('"stripe"');
    expect(pnpmLock).toContain("stripe:");
    expect(pnpmLock).toContain("specifier: ^22.2.1");
    expect(stripeCheckoutSource).toContain('import Stripe from "stripe"');
    expect(stripeCheckoutSource).toContain("STRIPE_CHECKOUT_API_VERSION");
    expect(stripeCheckoutSource).toContain("buildStripeCheckoutSdkConfig");
    expect(stripeCheckoutSource).toContain("idempotencyHeaderRequired");
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
    expect(liveStripePaymentsRuntimeReadiness.requiredCommands).toBe(liveStripePaymentsRuntimeCommands);
    expect(liveStripePaymentsRuntimeReadiness.requiredEvidence).toBe(liveStripePaymentsRequiredEvidence);
    expect(liveStripePaymentsRuntimeReadiness.blockers).not.toContain(
      "Stripe SDK must be installed and pinned before live provider payment readiness can close.",
    );
    expect(liveStripePaymentsRuntimeReadiness.blockers).toContain(
      "Stripe secret key must be configured through the secret store.",
    );
    expect(liveStripePaymentsRuntimeReadiness.blockers).toContain(
      "Stripe webhook secret must be configured through the secret store.",
    );
    expect(liveStripePaymentsRuntimeReadiness.blockers).toContain(
      "Booking-to-paid browser E2E flow must be verified with Stripe test mode.",
    );
  });

  it("blocks live Stripe closure until provider config, lifecycle, E2E, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildLiveStripePaymentsEvidenceDecision({
      paymentsPackageTypecheckPassed: true,
      paymentsPackageTestsPassed: true,
      paymentRoutesTestsPassed: true,
      stripeSdkInstalled: true,
      stripeSecretConfigured: false,
      stripeWebhookSecretConfigured: false,
      stripeApiVersionPinned: true,
      checkoutProviderCallImplemented: false,
      paymentIntentLifecycleHandled: false,
      providerIdempotencyStoreBackedByDb: false,
      checkoutSessionPersisted: false,
      webhookRawBodyVerificationConfigured: true,
      webhookReplayProtectionPersisted: false,
      dbReconciliationTransactional: false,
      refundExecutionImplemented: false,
      disputeWorkflowImplemented: false,
      stripeCliLifecycleVerified: false,
      bookingToPaidE2eVerified: false,
      crossTenantPaymentIsolationVerified: false,
      ciPaymentEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
      liveStripePaymentsRunPersisted: false,
      coveredReadinessAreas: [
        "raw-body-webhook-signature-verification",
      ],
      capturedArtifacts: [
        "coverage/live-stripe-payments-runtime.json",
        "coverage/live-stripe-payments-typecheck.txt",
        "coverage/live-stripe-payments-test.txt",
        "coverage/live-stripe-payment-routes-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/payments typecheck",
        "pnpm --filter @inkroute/payments test",
        "pnpm vitest run apps/web/tests/payment-routes.test.ts",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReadinessAreas).toEqual([
      "stripe-sdk-pin",
      "stripe-secret-store",
      "stripe-webhook-secret-store",
      "stripe-api-version-pin",
      "real-checkout-session-create",
      "payment-intent-lifecycle",
      "provider-idempotency-db-store",
      "checkout-payment-deposit-audit-persistence",
      "webhook-replay-protection",
      "tenant-scoped-db-reconciliation",
      "refund-execution",
      "dispute-workflow",
      "stripe-cli-lifecycle",
      "booking-to-paid-e2e",
      "cross-tenant-payment-isolation",
      "ci-payment-evidence",
      "secret-safe-artifacts",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/live-stripe-sdk-config-redacted.json",
      "coverage/live-stripe-checkout-provider-call.json",
      "coverage/live-stripe-webhook-lifecycle.json",
      "coverage/live-stripe-db-reconciliation.json",
      "coverage/live-stripe-refund-dispute-workflows.json",
      "coverage/live-stripe-cli-lifecycle.json",
      "coverage/live-stripe-booking-to-paid-e2e.json",
      "coverage/live-stripe-ci-payment-evidence.json",
      "coverage/live-stripe-secret-safe-artifacts.json",
      "test-results/live-stripe-payments-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "capture installed Stripe SDK/API-version source contract and redacted Stripe secret/webhook evidence",
      "create real Stripe Checkout sessions in provider-backed mode",
      "Stripe CLI checkout/payment/refund/dispute/replay lifecycle tests",
      "payment DB reconciliation integration tests",
      "authorized refund execution and dispute workflow tests",
      "Playwright booking-to-paid E2E flow",
      "GitHub Actions payment evidence job",
      "capture redacted payment artifacts without Stripe secrets or client-private data",
    ]);
    expect(decision.requiredReadinessAreas).toBe(liveStripePaymentsReadinessAreas);
    expect(decision.requiredArtifacts).toBe(liveStripePaymentsArtifactPaths);
    expect(decision.requiredCommands).toBe(liveStripePaymentsRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildLiveStripePaymentsDecisionRequiredEvidence(liveStripePaymentsRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(liveStripePaymentsRequiredEvidence);
    expect(decision.blockers).not.toContain("Stripe SDK must be installed and pinned before live provider payment readiness can close.");
    expect(decision.blockers).toContain("Stripe secret key must be configured through the secret store.");
    expect(decision.blockers).toContain("Stripe webhook secret must be configured through the secret store.");
    expect(decision.blockers).toContain("LiveStripePaymentsRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required live Stripe readiness area must be covered.");
  });

  it("completes live Stripe closure when provider config, lifecycle, E2E, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildLiveStripePaymentsEvidenceDecision({
      paymentsPackageTypecheckPassed: true,
      paymentsPackageTestsPassed: true,
      paymentRoutesTestsPassed: true,
      stripeSdkInstalled: true,
      stripeSecretConfigured: true,
      stripeWebhookSecretConfigured: true,
      stripeApiVersionPinned: true,
      checkoutProviderCallImplemented: true,
      paymentIntentLifecycleHandled: true,
      providerIdempotencyStoreBackedByDb: true,
      checkoutSessionPersisted: true,
      webhookRawBodyVerificationConfigured: true,
      webhookReplayProtectionPersisted: true,
      dbReconciliationTransactional: true,
      refundExecutionImplemented: true,
      disputeWorkflowImplemented: true,
      stripeCliLifecycleVerified: true,
      bookingToPaidE2eVerified: true,
      crossTenantPaymentIsolationVerified: true,
      ciPaymentEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      liveStripePaymentsRunPersisted: true,
      coveredReadinessAreas: liveStripePaymentsReadinessAreas,
      capturedArtifacts: liveStripePaymentsArtifactPaths,
      completedCommands: liveStripePaymentsRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live Stripe readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 7 live Stripe payments runtime contracts");
    expect(ciWorkflow).toContain("live-stripe-payments-runtime-static.test.ts");
    expect(ciWorkflow).toContain("live-stripe-payments-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-live-stripe-payments-runtime-static");
    expect(unitManifest).toContain("LiveStripePaymentsRun Prisma model and app row contract");
    expect(gapTracker).toContain("LiveStripePaymentsRun");
    expect(gapTracker).toContain("apps/web/lib/liveStripePaymentsRuntime.ts");
    expect(gapTracker).toContain("buildLiveStripePaymentsDecisionRequiredEvidence");
    expect(gapTracker).toContain("liveStripePaymentsRequiredEvidence");
    expect(gapTracker).toContain("liveStripePaymentsRuntimeLocalArtifacts");
    expect(gapTracker).toContain("liveStripePaymentsRuntimeExternalArtifacts");
    expect(gapTracker).toContain("persistLiveStripePaymentsRun upsert seam");
    expect(gapTracker).toContain("Stripe secret/webhook configuration, real Checkout writes, provider idempotency persistence, lifecycle reconciliation, refunds/disputes, Stripe CLI, booking-to-paid E2E, CI evidence, provider-backed persistLiveStripePaymentsRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-004 is live-stripe-payments-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current live Stripe proof files for GAP-004", () => {
    expect(liveStripePaymentsRuntimeProofFiles).toContain("packages/payments/package.json");
    expect(liveStripePaymentsRuntimeProofFiles).toContain("pnpm-lock.yaml");
    expect(liveStripePaymentsRuntimeProofFiles).toContain("apps/web/lib/stripeCheckout.ts");
    expect(liveStripePaymentsRuntimeProofFiles).toContain("apps/web/lib/liveStripePaymentsRuntime.ts");
    expect(liveStripePaymentsRuntimeProofFiles).toContain("apps/web/tests/live-stripe-payments-runtime-static.test.ts");
    for (const proofFile of liveStripePaymentsRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-004 execution policy non-executing while separating live Stripe provider proof", () => {
    const plan = buildLiveStripePaymentsRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(liveStripePaymentsRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(liveStripePaymentsRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(liveStripePaymentsRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(liveStripePaymentsRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/live-stripe-payment-routes-test.txt");
    expect(plan.externalArtifacts).toContain("coverage/live-stripe-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/live-stripe-payments-runtime");
    expect(plan.executionPolicy).toBe(liveStripePaymentsExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(liveStripePaymentsRequiredExternalEvidence);
    expect(plan).toMatchObject({
      paymentsPackageTypecheckExecutionAllowed: false,
      paymentsPackageTestExecutionAllowed: false,
      paymentRoutesTestExecutionAllowed: false,
      stripeConfigCaptureAllowed: false,
      checkoutProviderCallAllowed: false,
      stripeCliLifecycleExecutionAllowed: false,
      dbReconciliationExecutionAllowed: false,
      refundDisputeExecutionAllowed: false,
      bookingToPaidE2eExecutionAllowed: false,
      ciPaymentEvidenceExecutionAllowed: false,
      secretSafeArtifactCaptureAllowed: false,
      persistenceExecutionAllowed: false,
      executionPolicy: {
        codexMayClassifyStaticStripeReadiness: true,
        stripeProviderEvidenceRequiredForClosure: true,
        secretStoreConfigurationRequiredForClosure: true,
        providerBackedPersistenceRequiredForClosure: true,
        bookingToPaidE2eRequiredForClosure: true,
        secretSafeArtifactsRequiredForClosure: true,
      },
    });
    expect(plan.requiredExternalEvidence).toContain("Booking-to-paid E2E evidence captured against Stripe test mode.");
    expect(plan.requiredExternalEvidence).toContain(
      "Secret-safe artifact bundle with no Stripe secrets, client-private data, payment card data, or raw provider identifiers.",
    );
  });

  it("redacts live Stripe payment artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "live_stripe_01HZYXZYXZYXZYXZYXZYXZYXZ",
      stripeSecretKey: "sk_test_1234567890ABCDEFGHIJKLMNOP",
      webhookSecret: "whsec_1234567890ABCDEFGHIJKLMNOP",
      checkoutSessionId: "cs_test_1234567890ABCDEFGHIJKLMNOP",
      paymentIntentId: "pi_1234567890ABCDEFGHIJKLMNOP",
      clientEmail: "artist@example.com",
      clientPhone: "+1 (555) 867-5309",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
    };

    expect(buildRedactedLiveStripePaymentsArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      stripeSecretKey: "[REDACTED]",
      webhookSecret: "[REDACTED]",
      checkoutSessionId: "[REDACTED]",
      paymentIntentId: "[REDACTED]",
      clientEmail: "[REDACTED]",
      clientPhone: "[REDACTED]",
      ciRunUrl: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
    });

    const review = buildLiveStripePaymentsRuntimeArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(liveStripePaymentsRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "stripeSecretKey",
        "webhookSecret",
        "checkoutSessionId",
        "paymentIntentId",
        "clientEmail",
        "clientPhone",
        "ciRunUrl",
        "persistence.tenantId",
        "persistence.databaseUrl",
      ]),
    );
    expect(review.requiredExternalEvidence).toContain(
      "Provider-backed LiveStripePaymentsRun persistence row captured from the target database.",
    );
  });
});



