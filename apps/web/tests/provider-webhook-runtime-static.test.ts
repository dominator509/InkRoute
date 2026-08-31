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
    expect(contractSource).toContain("tenantResolved: Boolean(input.tenantId)");
    expect(contractSource).toContain("providerEventIdPresent: Boolean(input.eventId)");
    expect(contractSource).toContain("rawProviderEventIdEchoed: false");
    expect(contractSource).toContain("rawProviderMessageIdEchoed: false");
    expect(emailRouteSource).toContain("persistProviderNotificationWebhookEvent");
    expect(smsRouteSource).toContain("persistProviderNotificationWebhookEvent");
    expect(emailRouteSource).toContain("suppressionDestination");
    expect(smsRouteSource).toContain("suppressionDestination");
    expect(contractSource).toContain("executeProviderWebhookReconciliation");
    expect(readRepoFile("apps/web/lib/providerNotificationWebhookPersistence.ts")).toContain("tx.notificationSuppression.upsert");
    expect(readRepoFile("apps/web/lib/providerNotificationWebhookPersistence.ts")).toContain("inboundThreadBoundary");
    expect(emailRouteSource).toContain("not-attempted-production-signature-gated");
    expect(smsRouteSource).toContain("not-attempted-production-signature-gated");
    expect(emailRouteSource).toContain("verifyEmailWebhookSignature");
    expect(smsRouteSource).toContain("verifySmsWebhookSignature");
    expect(emailRouteSource).toContain("EMAIL_PROVIDER_WEBHOOK_SECRET_NOT_CONFIGURED");
    expect(smsRouteSource).toContain("SMS_PROVIDER_WEBHOOK_AUTH_TOKEN_NOT_CONFIGURED");
    expect(emailRouteSource).toContain("not-attempted-production-secret-gated");
    expect(smsRouteSource).toContain("not-attempted-production-secret-gated");
    expect(emailRouteSource).toContain("providerWebhookBoundary");
    expect(smsRouteSource).toContain("providerWebhookBoundary");
    expect(emailRouteSource).toContain("buildSafeLocalProviderWebhookReceipt");
    expect(smsRouteSource).toContain("buildSafeLocalProviderWebhookReceipt");
    expect(emailRouteSource).toContain("webhookIdEchoed: false");
    expect(smsRouteSource).toContain("webhookIdEchoed: false");
    expect(emailRouteSource).toContain("rawProviderSignatureEchoed: false");
    expect(emailRouteSource).toContain("rawProviderSignaturePersisted: false");
    expect(emailRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(emailRouteSource).toContain("tenantSlugEchoed: false");
    expect(emailRouteSource).toContain("rawProviderEventIdEchoed: false");
    expect(emailRouteSource).toContain("rawProviderMessageIdEchoed: false");
    expect(emailRouteSource).toContain("providerEventIdEchoed: false");
    expect(emailRouteSource).toContain("auditLogIdEchoed: false");
    expect(emailRouteSource).toContain("deliveryIdEchoed: false");
    expect(emailRouteSource).toContain("suppressionIdEchoed: false");
    expect(emailRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(emailRouteSource).toContain("providerEventPersisted: persistenceResult.providerEventPersisted");
    expect(emailRouteSource).toContain("auditLogged: persistenceResult.auditLogged");
    expect(emailRouteSource).toContain("deliveryMatched: persistenceResult.deliveryMatched");
    expect(emailRouteSource).toContain("suppressionPersisted: persistenceResult.suppressionPersisted");
    expect(emailRouteSource).not.toContain("providerEventId: persistenceResult.providerEventId");
    expect(emailRouteSource).not.toContain("Boolean(persistenceResult.providerEventId)");
    expect(emailRouteSource).not.toContain("Boolean(persistenceResult.auditLogId)");
    expect(emailRouteSource).not.toContain("Boolean(persistenceResult.deliveryId)");
    expect(emailRouteSource).not.toContain("Boolean(persistenceResult.suppressionId)");
    expect(emailRouteSource).not.toContain("tenantSlug,\n        storedWebhook");
    expect(emailRouteSource).not.toContain("storedWebhook,");
    expect(emailRouteSource).not.toContain("tenantSlug,\n          eventId");
    expect(emailRouteSource).not.toContain("auditLogId: persistenceResult.auditLogId");
    expect(emailRouteSource).not.toContain("deliveryId: persistenceResult.deliveryId");
    expect(emailRouteSource).not.toContain("suppressionId: persistenceResult.suppressionId");
    expect(smsRouteSource).toContain("rawProviderSignatureEchoed: false");
    expect(smsRouteSource).toContain("rawProviderSignaturePersisted: false");
    expect(smsRouteSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(smsRouteSource).toContain("tenantSlugEchoed: false");
    expect(smsRouteSource).toContain("rawProviderEventIdEchoed: false");
    expect(smsRouteSource).toContain("rawProviderMessageIdEchoed: false");
    expect(smsRouteSource).toContain("providerEventIdEchoed: false");
    expect(smsRouteSource).toContain("auditLogIdEchoed: false");
    expect(smsRouteSource).toContain("deliveryIdEchoed: false");
    expect(smsRouteSource).toContain("suppressionIdEchoed: false");
    expect(smsRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(smsRouteSource).toContain("providerEventPersisted: persistenceResult.providerEventPersisted");
    expect(smsRouteSource).toContain("auditLogged: persistenceResult.auditLogged");
    expect(smsRouteSource).toContain("deliveryMatched: persistenceResult.deliveryMatched");
    expect(smsRouteSource).toContain("suppressionPersisted: persistenceResult.suppressionPersisted");
    expect(smsRouteSource).not.toContain("providerEventId: persistenceResult.providerEventId");
    expect(smsRouteSource).not.toContain("Boolean(persistenceResult.providerEventId)");
    expect(smsRouteSource).not.toContain("Boolean(persistenceResult.auditLogId)");
    expect(smsRouteSource).not.toContain("Boolean(persistenceResult.deliveryId)");
    expect(smsRouteSource).not.toContain("Boolean(persistenceResult.suppressionId)");
    expect(smsRouteSource).not.toContain("tenantSlug,\n        storedWebhook");
    expect(smsRouteSource).not.toContain("storedWebhook,");
    expect(smsRouteSource).not.toContain("tenantSlug,\n          eventId");
    expect(smsRouteSource).not.toContain("auditLogId: persistenceResult.auditLogId");
    expect(smsRouteSource).not.toContain("deliveryId: persistenceResult.deliveryId");
    expect(smsRouteSource).not.toContain("suppressionId: persistenceResult.suppressionId");
    const persistenceSource = readRepoFile("apps/web/lib/providerNotificationWebhookPersistence.ts");
    expect(persistenceSource).toContain("internalPersistenceIdsStored: false");
    expect(persistenceSource).toContain("rawIdempotencyKeyStored: false");
    expect(persistenceSource).toContain("providerEventPersisted: true");
    expect(persistenceSource).toContain("internalPersistenceIdsEchoed: false");
    expect(persistenceSource).toContain("idempotencyKeyEchoed: false");
    expect(persistenceSource).toContain("deliveryMatched: Boolean(delivery)");
    expect(persistenceSource).toContain("suppressionPersisted: Boolean(suppression)");
    expect(persistenceSource).not.toContain("providerEventId: providerEvent.id,\n            deliveryId");
    expect(persistenceSource).not.toContain("idempotencyKey,\n            deliveryId");
    expect(persistenceSource).not.toContain("suppressionId: suppression?.id ?? null,\n            suppressionWritten");
    expect(smsRouteSource).toContain("function omitRawProviderWebhookIdentifiers");
    expect(smsRouteSource).toContain("rawInboundBodyEchoed: false");
    expect(smsRouteSource).toContain("readiness: responseReadiness");
    expect(smsRouteSource).toContain("reconciliation: responseReconciliation");
    expect(routeTest).toContain("rejects email provider webhooks without signature-like headers");
    expect(routeTest).toContain("fail-closes production email webhooks before parsing or local runtime persistence when the webhook secret is missing");
    expect(routeTest).toContain("fail-closes production SMS webhooks before parsing or local runtime persistence when the auth token is missing");
    expect(routeTest).toContain("EMAIL_PROVIDER_WEBHOOK_SECRET_NOT_CONFIGURED");
    expect(routeTest).toContain("SMS_PROVIDER_WEBHOOK_AUTH_TOKEN_NOT_CONFIGURED");
    expect(staticTest).toContain("exactly-once reconciliation");
    expect(staticTest).toContain("redacts nested cross-provider webhook payloads");
    expect(staticTest).toContain("executes local provider webhook reconciliation");
  });

  it("keeps signature, persistence, reconciliation, sandbox, concurrency, alerting, CI, and artifact blockers explicit", () => {
    expect(providerWebhookRuntimeReadiness.status).toBe("blocked");
    expect(providerWebhookRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerWebhookRuntimeReadiness.requiredEvidence).toBe(providerWebhookDecisionRequiredEvidence);
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("Email provider cryptographic signature verification evidence must be captured before webhook readiness.");
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("SMS provider cryptographic signature verification evidence must be captured before webhook readiness.");
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("Email provider cryptographic signature verification must be implemented.");
    expect(providerWebhookRuntimeReadiness.blockers).not.toContain("SMS provider cryptographic signature verification must be implemented.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Provider webhook secrets must be configured in a secret store.");
    expect(providerWebhookRuntimeReadiness.blockers).toContain("Route-level invalid-signature rejection tests must pass.");
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
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_provider_webhook",
      reviewerHandle: "reviewer_provider_webhook_owner",
      codeownerSelector: "CODEOWNER:notifications-platform-team",
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
      "repositorySelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.pushReceiptToken",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      webhookSignature: "[redacted]",
      rawProviderPayload: "[redacted]",
      destinationEmail: "[redacted]",
      publicSummary: "provider webhook evidence captured",
      repositorySelector: "[redacted]",
      pullRequestSelector: "[redacted]",
      reviewerHandle: "[redacted]",
      codeownerSelector: "[redacted]",
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

