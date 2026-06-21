import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProviderWebhookArtifactReview,
  buildProviderWebhookEvidenceDecision,
  buildProviderWebhookExecutionPlan,
  buildRedactedProviderWebhookArtifact,
  providerWebhookDecisionRequiredEvidence,
  providerWebhookExternalCommands,
  providerWebhookExecutionPolicy,
  providerWebhookArtifactPaths,
  providerWebhookLocalCommands,
  providerWebhookRequiredExternalEvidence,
  providerWebhookRuntimeCommands,
  providerWebhookRuntimeMatrix,
  providerWebhookRuntimeProofFiles,
  providerWebhookRuntimeReadiness,
} from "../lib/providerWebhookRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider webhook runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const contractSource = readRepoFile("apps/web/lib/providerWebhookReconciliation.ts");
  const emailRouteSource = readRepoFile("apps/web/app/api/webhooks/email/route.ts");
  const smsRouteSource = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const routeTest = readRepoFile("apps/web/tests/provider-webhook-routes.test.ts");
  const staticTest = readRepoFile("apps/web/tests/provider-webhook-contracts.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-066 commands, matrix rows, and artifacts", () => {
    expect(providerWebhookRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
      "email provider sandbox webhook replay and invalid-signature tests",
      "Twilio sandbox callback replay and invalid-signature tests",
      "Expo receipt polling invalid-token integration test",
      "concurrent provider callback exactly-once delivery-log test",
    ]);
    expect(providerWebhookRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "route-tests",
      "contract-tests",
      "email-signature",
      "sms-signature",
      "push-receipt-source",
      "provider-event-persistence",
      "exactly-once-delivery",
      "suppression-persistence",
      "inbound-routing",
      "invalid-push-token",
      "failed-alerting",
      "sandbox-replay",
      "concurrent-callbacks",
      "ci-provider-webhook-job",
      "secret-safe-artifacts",
    ]);
    expect(providerWebhookArtifactPaths).toContain("coverage/provider-webhook-runtime.json");
    expect(providerWebhookArtifactPaths).toContain("test-results/provider-webhook-runtime");
  });

  it("keeps package helper, shared contract, email/SMS routes, and route tests wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildProviderWebhookRuntimeReadinessPlan");
    expect(contractSource).toContain("ProviderWebhookPersistenceRepository");
    expect(contractSource).toContain("createInMemoryProviderWebhookPersistenceRepository");
    expect(contractSource).toContain("buildRedactedProviderWebhookPayload");
    expect(contractSource).toContain("buildProviderWebhookRouteBoundary");
    expect(contractSource).toContain("executeProviderWebhookReconciliation");
    expect(contractSource).toContain("alertFailedWebhook");
    expect(emailRouteSource).toContain("providerWebhookBoundary");
    expect(smsRouteSource).toContain("providerWebhookBoundary");
    expect(routeTest).toContain("rejects email provider webhooks without signature-like headers");
    expect(routeTest).toContain("fail-closes production email webhooks before local runtime persistence");
    expect(routeTest).toContain("fail-closes production SMS webhooks before local runtime persistence");
    expect(routeTest).toContain("PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeTest).toContain("PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(staticTest).toContain("exactly-once reconciliation");
    expect(staticTest).toContain("redacts nested cross-provider webhook payloads");
    expect(staticTest).toContain("executes local provider webhook reconciliation");
  });

  it("keeps signature, persistence, reconciliation, sandbox, concurrency, alerting, CI, and artifact blockers explicit", () => {
    expect(providerWebhookRuntimeReadiness.status).toBe("blocked");
    expect(providerWebhookRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerWebhookRuntimeReadiness.requiredEvidence).toBe(providerWebhookDecisionRequiredEvidence);
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Email provider cryptographic signature verification evidence must be captured before webhook readiness.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("SMS provider cryptographic signature verification evidence must be captured before webhook readiness.");
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("Email provider cryptographic signature verification must be implemented.");
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("SMS provider cryptographic signature verification must be implemented.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Delivery-log updates must be exactly-once under replay and concurrent callbacks.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Failed webhook verification or reconciliation must emit alerting.");
  });

  it("pins the non-executing GAP-066 provider webhook execution policy", () => {
    const plan = buildProviderWebhookExecutionPlan();

    expect(providerWebhookExecutionPolicy).toEqual({
      codexMayClassifyStaticProviderWebhookReadiness: true,
      localRouteContractEvidenceRequiredForClosure: true,
      cryptographicSignatureRequiredForClosure: true,
      trustedPushReceiptSourceRequiredForClosure: true,
      durableProviderEventPersistenceRequiredForClosure: true,
      exactlyOnceDeliveryRequiredForClosure: true,
      suppressionInboundInvalidTokenPersistenceRequiredForClosure: true,
      failedWebhookAlertingRequiredForClosure: true,
      providerSandboxReplayRequiredForClosure: true,
      concurrentCallbackRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(providerWebhookExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.signatureVerificationExecutionAllowed).toBe(false);
    expect(plan.pushReceiptExecutionAllowed).toBe(false);
    expect(plan.durablePersistenceExecutionAllowed).toBe(false);
    expect(plan.exactlyOnceExecutionAllowed).toBe(false);
    expect(plan.alertingExecutionAllowed).toBe(false);
    expect(plan.sandboxReplayExecutionAllowed).toBe(false);
    expect(plan.concurrentCallbackExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(providerWebhookLocalCommands);
    expect(plan.externalCommands).toBe(providerWebhookExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(providerWebhookRequiredExternalEvidence);
    expect(providerWebhookRequiredExternalEvidence).toEqual([
      "actual provider webhook command output",
      "cryptographic email signature verification evidence",
      "cryptographic SMS signature verification evidence",
      "trusted push receipt source evidence",
      "durable ProviderEvent/idempotency persistence tests",
      "exactly-once delivery-log reconciliation tests",
      "suppression/inbound/invalid push token persistence tests",
      "failed-webhook alerting evidence",
      "provider sandbox replay and invalid-signature tests",
      "concurrent provider callback exactly-once tests",
      "CI provider webhook artifacts",
      "secret-safe provider webhook artifact review",
    ]);
  });

  it("pins recursive provider webhook artifact redaction and review", () => {
    const redacted = buildRedactedProviderWebhookArtifact({
      tenantId: "tenant_private",
      webhookSignature: "signature_private",
      rawProviderPayload: "private payload",
      destinationEmail: "client@example.test",
      publicSummary: "provider webhook evidence captured",
      nested: {
        pushReceiptToken: "push_private",
        publicStatus: "reconciled",
      },
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "webhookSignature",
      "rawProviderPayload",
      "destinationEmail",
      "nested.pushReceiptToken",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      webhookSignature: "[redacted]",
      rawProviderPayload: "[redacted]",
      destinationEmail: "[redacted]",
      publicSummary: "provider webhook evidence captured",
      nested: {
        pushReceiptToken: "[redacted]",
        publicStatus: "reconciled",
      },
    });

    const review = buildProviderWebhookArtifactReview({
      publicSummary: "safe provider webhook artifact",
      failedWebhookAlertUrl: "https://private/alert",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["failedWebhookAlertUrl"]);
    expect(review.requiredExternalEvidence).toBe(providerWebhookRequiredExternalEvidence);
  });

  it("classifies provider webhook evidence before GAP-066 can close", () => {
    const blockedDecision = buildProviderWebhookEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      routeTestsPassed: true,
      contractTestsPassed: true,
      emailSignatureVerified: false,
      smsSignatureVerified: false,
      pushReceiptSourceVerified: false,
      providerEventPersistenceVerified: false,
      exactlyOnceDeliveryVerified: false,
      suppressionPersistenceVerified: false,
      inboundRoutingVerified: false,
      invalidPushTokenVerified: false,
      failedAlertingVerified: false,
      sandboxReplayVerified: false,
      concurrentCallbacksVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/provider-webhook-runtime.json",
        "coverage/provider-webhook-notifications-typecheck.txt",
        "coverage/provider-webhook-notifications-test.txt",
        "coverage/provider-webhook-route-tests.json",
        "coverage/provider-webhook-contract-tests.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Email provider cryptographic signature evidence is missing.");
    expect(blockedDecision.blockers).toContain("ProviderEvent/idempotency persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Exactly-once delivery-log reconciliation evidence is missing.");
    expect(blockedDecision.blockers).toContain("Failed-webhook alerting evidence is missing.");
    expect(blockedDecision.blockers).toContain("Concurrent callback exactly-once evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe provider webhook artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/provider-webhook-email-signature.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/provider-webhook-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(providerWebhookRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(providerWebhookDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: providerWebhookArtifactPaths.length,
    });

    const completeDecision = buildProviderWebhookEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      routeTestsPassed: true,
      contractTestsPassed: true,
      emailSignatureVerified: true,
      smsSignatureVerified: true,
      pushReceiptSourceVerified: true,
      providerEventPersistenceVerified: true,
      exactlyOnceDeliveryVerified: true,
      suppressionPersistenceVerified: true,
      inboundRoutingVerified: true,
      invalidPushTokenVerified: true,
      failedAlertingVerified: true,
      sandboxReplayVerified: true,
      concurrentCallbacksVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: providerWebhookArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider sandbox readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 provider webhook runtime contracts");
    expect(ciWorkflow).toContain("provider-webhook-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-webhook-runtime-artifacts");
    expect(unitManifest).toContain("unit-provider-webhook-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerWebhookRuntime.ts");
    expect(gapTracker).toContain("provider webhook evidence classifier");
    expect(gapTracker).toContain("providerWebhookDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildProviderWebhookExecutionPlan");
    expect(gapTracker).toContain("providerWebhookExecutionPolicy");
    expect(gapTracker).toContain("providerWebhookRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedProviderWebhookArtifact");
    expect(gapTracker).toContain("buildProviderWebhookArtifactReview");
    expect(gapTracker).toContain("non-executing provider webhook execution policy");
    expect(gapTracker).toContain("local in-memory provider webhook repository contract");
    expect(gapTracker).toContain("provider webhook payload sanitizer");
    expect(gapTracker).toContain("GAP-066 is provider-webhook-runtime-matrix wired with provider webhook evidence classifier");
    expect(providerWebhookArtifactPaths).toContain("coverage/provider-webhook-secret-safe-artifacts.json");
  });

  it("pins current provider webhook proof files for GAP-066", () => {
    expect(providerWebhookRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/web/lib/providerWebhookReconciliation.ts",
      "apps/web/lib/providerWebhookRuntime.ts",
      "apps/web/app/api/webhooks/email/route.ts",
      "apps/web/app/api/webhooks/sms/route.ts",
      "apps/web/tests/provider-webhook-contracts.test.ts",
      "apps/web/tests/provider-webhook-routes.test.ts",
      "apps/web/tests/provider-webhook-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of providerWebhookRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});

