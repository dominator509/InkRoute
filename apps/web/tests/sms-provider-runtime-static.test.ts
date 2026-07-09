import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedSmsProviderArtifact,
  buildSmsProviderArtifactReview,
  buildSmsProviderDecisionRequiredEvidence,
  buildSmsProviderEvidenceDecision,
  buildSmsProviderExecutionPlan,
  smsProviderExternalCommands,
  smsProviderExecutionPolicy,
  smsProviderArtifactPaths,
  smsProviderLocalCommands,
  smsProviderRequiredExternalEvidence,
  smsProviderRuntimeCommands,
  smsProviderRuntimeMatrix,
  smsProviderRuntimeProofFiles,
  smsProviderRuntimeReadiness,
  smsProviderRuntimeReadinessRequiredControls,
  smsProviderRuntimeReadinessRequiredEvidence,
  smsProviderRequiredEvidence,
} from "../lib/smsProviderRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("SMS provider runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const providerSource = readRepoFile("apps/web/lib/smsProvider.ts");
  const routeSource = readRepoFile("apps/web/app/api/webhooks/sms/route.ts");
  const staticTest = readRepoFile("apps/web/tests/sms-provider-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-062 commands, matrix rows, and artifacts", () => {
    expect(smsProviderRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/sms-provider-static.test.ts",
      "install/configure Twilio SDK, Account SID, and auth token",
      "prove Twilio messaging service configuration",
      "legal-approved SMS consent and STOP/HELP copy review",
      "stored SMS consent proof tests",
      "quiet-hours policy tests",
      "verify Twilio signature against raw bodies",
      "validate Twilio request URL in webhook signature base string",
      "durable NotificationDelivery transaction tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable STOP suppression persistence tests",
      "durable HELP/client reply inbound-thread persistence tests",
      "Twilio sandbox sent event test",
      "Twilio sandbox delivered event test",
      "Twilio sandbox failed event test",
      "Twilio STOP suppression test",
      "Twilio HELP inbound-thread test",
      "invalid SMS webhook signature route test",
      "GitHub Actions SMS provider runtime job",
      "review SMS artifacts for Twilio secrets, signatures, raw payloads, phone numbers, and tenant data",
    ]);
    expect(smsProviderRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "static-contract",
      "twilio-sdk-credentials",
      "messaging-service",
      "legal-consent-copy",
      "consent-proof",
      "quiet-hours",
      "raw-body-signature",
      "request-url-validation",
      "delivery-persistence",
      "provider-event-persistence",
      "suppression-persistence",
      "inbound-thread-persistence",
      "sandbox-sent",
      "sandbox-delivered",
      "sandbox-failed",
      "stop-suppression",
      "help-inbound-thread",
      "invalid-signature-route",
      "ci-sms-provider-job",
      "secret-safe-artifacts",
    ]);
    expect(smsProviderArtifactPaths).toContain("coverage/sms-provider-runtime.json");
    expect(smsProviderArtifactPaths).toContain("test-results/sms-provider-runtime");
  });

  it("pins current SMS provider proof files for GAP-062", () => {
    expect(smsProviderRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/web/lib/smsProvider.ts",
      "apps/web/lib/smsProviderRuntime.ts",
      "apps/web/app/api/webhooks/sms/route.ts",
      "apps/web/tests/sms-provider-static.test.ts",
      "apps/web/tests/sms-provider-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      "SECURITY.md",
      "ENVIRONMENT_VARIABLES.md",
      ".env.example",
      ".github/workflows/ci.yml",
    ]));
    for (const file of smsProviderRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helpers, provider contract, webhook route, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildSmsProviderSendPlan");
    expect(notificationsSource).toContain("buildSmsWebhookRuntimeReadinessPlan");
    expect(providerSource).toContain("executeSmsProviderSend");
    expect(providerSource).toContain("createInMemorySmsProviderRepository");
    expect(providerSource).toContain("sanitizeSmsProviderSendResult");
    expect(providerSource).toContain("buildRedactedSmsWebhookPayload");
    expect(providerSource).toContain("persistInboundThread");
    expect(providerSource).toContain("buildSmsProviderReconciliation");
    expect(providerSource).toContain("verifySmsWebhookSignature");
    expect(routeSource).toContain("buildSmsWebhookReadinessFromPayload");
    expect(routeSource).toContain("verifySmsWebhookSignature");
    expect(routeSource).toContain("INVALID_SMS_PROVIDER_SIGNATURE");
    expect(routeSource).toContain("x-twilio-signature");
    expect(routeSource).toContain("PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeSource).toContain("localSmsWebhookPersistenceDisabled");
    expect(staticTest).toContain("requires Twilio send controls");
    expect(staticTest).toContain("sanitizes nested SMS provider send and webhook payloads");
    expect(staticTest).toContain("executes a local SMS provider repository contract");
    expect(staticTest).toContain("blocks local SMS sends when consent proof is missing or destination is suppressed");
  });

  it("keeps Twilio, compliance, signature, persistence, sandbox, CI, and artifact blockers explicit", () => {
    expect(smsProviderRuntimeReadiness.status).toBe("blocked");
    expect(smsProviderRuntimeReadiness.requiredCommands).toBe(smsProviderRuntimeCommands);
    expect(smsProviderRuntimeReadiness.requiredEvidence).toBe(smsProviderRuntimeReadinessRequiredEvidence);
    expect(smsProviderRuntimeReadiness.requiredControls).toBe(smsProviderRuntimeReadinessRequiredControls);
    expect(smsProviderRuntimeReadiness.blockers).toContain("Real Twilio SDK credentials and messaging service must be configured in a secret store.");
    expect(smsProviderRuntimeReadiness.blockers).toContain("SMS webhook route signature verification, request URL validation, and invalid-signature rejection evidence must be captured.");
    expect(smsProviderRuntimeReadiness.blockers).toContain("Sent, delivered, failed, STOP, and HELP provider flows must be tested against the sandbox.");
  });

  it("pins the non-executing GAP-062 SMS provider execution policy", () => {
    const plan = buildSmsProviderExecutionPlan();

    expect(smsProviderExecutionPolicy).toEqual({
      codexMayClassifyStaticSmsProviderReadiness: true,
      localNotificationCommandsRequiredForClosure: true,
      twilioSdkCredentialsRequiredForClosure: true,
      messagingServiceRequiredForClosure: true,
      legalConsentCopyRequiredForClosure: true,
      consentProofRequiredForClosure: true,
      quietHoursRequiredForClosure: true,
      rawBodySignatureRequiredForClosure: true,
      requestUrlValidationRequiredForClosure: true,
      durablePersistenceRequiredForClosure: true,
      sandboxStopHelpRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(smsProviderExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(smsProviderRequiredExternalEvidence);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.twilioSdkExecutionAllowed).toBe(false);
    expect(plan.messagingServiceExecutionAllowed).toBe(false);
    expect(plan.legalApprovalExecutionAllowed).toBe(false);
    expect(plan.signatureVerificationExecutionAllowed).toBe(false);
    expect(plan.durablePersistenceExecutionAllowed).toBe(false);
    expect(plan.sandboxEventExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(smsProviderLocalCommands);
    expect(plan.externalCommands).toBe(smsProviderExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(smsProviderRequiredExternalEvidence);
    expect(smsProviderRequiredExternalEvidence).toEqual([
      "actual SMS provider command output",
      "Twilio SDK credentials and messaging service evidence",
      "legal-approved SMS consent and STOP/HELP copy",
      "stored SMS consent proof tests",
      "quiet-hours policy tests",
      "raw-body Twilio signature verification evidence",
      "Twilio request URL validation evidence",
      "durable NotificationDelivery persistence tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable STOP suppression persistence tests",
      "durable HELP/client reply inbound-thread persistence tests",
      "Twilio sandbox sent/delivered/failed/STOP/HELP transcripts",
      "invalid SMS webhook signature route evidence",
      "CI SMS provider artifacts",
      "secret-safe SMS provider artifact review",
    ]);
  });

  it("pins recursive SMS provider artifact redaction and review", () => {
    const redacted = buildRedactedSmsProviderArtifact({
      twilioAuthToken: "twilio-secret",
      destinationPhone: "+15555550100",
      smsConsentSnapshot: "private consent",
      rawWebhookPayload: "From=%2B15555550100",
      publicSummary: "SMS provider evidence captured",
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_sms_provider",
      reviewerHandle: "reviewer_sms_owner",
      codeownerSelector: "CODEOWNER:notifications-platform-team",
      nested: {
        helpInboundThreadUrl: "https://private/thread",
        publicStatus: "help-handled",
      },
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "twilioAuthToken",
      "destinationPhone",
      "smsConsentSnapshot",
      "rawWebhookPayload",
      "repositorySelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.helpInboundThreadUrl",
    ]);
    expect(redacted.artifact).toEqual({
      twilioAuthToken: "[redacted]",
      destinationPhone: "[redacted]",
      smsConsentSnapshot: "[redacted]",
      rawWebhookPayload: "[redacted]",
      publicSummary: "SMS provider evidence captured",
      repositorySelector: "[redacted]",
      pullRequestSelector: "[redacted]",
      reviewerHandle: "[redacted]",
      codeownerSelector: "[redacted]",
      nested: {
        helpInboundThreadUrl: "[redacted]",
        publicStatus: "help-handled",
      },
    });

    const review = buildSmsProviderArtifactReview({
      publicSummary: "safe SMS provider artifact",
      stopSuppressionPhoneNumber: "+15555550100",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["stopSuppressionPhoneNumber"]);
    expect(review.requiredExternalEvidence).toBe(smsProviderRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toBe(smsProviderRequiredExternalEvidence);
  });

  it("classifies SMS provider evidence before GAP-062 can close", () => {
    const blockedDecision = buildSmsProviderEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      twilioSdkCredentialsVerified: false,
      messagingServiceVerified: false,
      legalConsentCopyApproved: false,
      consentProofVerified: false,
      quietHoursVerified: false,
      rawBodySignatureVerified: false,
      requestUrlValidationVerified: false,
      deliveryPersistenceVerified: false,
      providerEventPersistenceVerified: false,
      suppressionPersistenceVerified: false,
      inboundThreadPersistenceVerified: false,
      sandboxSentPassed: false,
      sandboxDeliveredPassed: false,
      sandboxFailedPassed: false,
      stopSuppressionPassed: false,
      helpInboundThreadPassed: false,
      invalidSignatureRoutePassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/sms-provider-runtime.json",
        "coverage/sms-provider-notifications-typecheck.txt",
        "coverage/sms-provider-notifications-test.txt",
        "coverage/sms-provider-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Twilio SDK credential evidence is missing.");
    expect(blockedDecision.blockers).toContain("Legal-approved SMS consent/STOP/HELP copy evidence is missing.");
    expect(blockedDecision.blockers).toContain("Raw-body Twilio signature evidence is missing.");
    expect(blockedDecision.blockers).toContain("STOP suppression persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Twilio HELP inbound-thread evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe SMS provider artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/sms-provider-twilio-sdk.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/sms-provider-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(smsProviderRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(
      buildSmsProviderDecisionRequiredEvidence(smsProviderRuntimeReadinessRequiredEvidence),
    );
    expect(blockedDecision.requiredEvidence).toBe(smsProviderRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 4,
      requiredArtifactCount: smsProviderArtifactPaths.length,
    });

    const completeDecision = buildSmsProviderEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      twilioSdkCredentialsVerified: true,
      messagingServiceVerified: true,
      legalConsentCopyApproved: true,
      consentProofVerified: true,
      quietHoursVerified: true,
      rawBodySignatureVerified: true,
      requestUrlValidationVerified: true,
      deliveryPersistenceVerified: true,
      providerEventPersistenceVerified: true,
      suppressionPersistenceVerified: true,
      inboundThreadPersistenceVerified: true,
      sandboxSentPassed: true,
      sandboxDeliveredPassed: true,
      sandboxFailedPassed: true,
      stopSuppressionPassed: true,
      helpInboundThreadPassed: true,
      invalidSignatureRoutePassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: smsProviderArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 SMS provider runtime contracts");
    expect(ciWorkflow).toContain("sms-provider-runtime-static.test.ts");
    expect(ciWorkflow).toContain("sms-provider-runtime-artifacts");
    expect(unitManifest).toContain("unit-sms-provider-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/smsProviderRuntime.ts");
    expect(gapTracker).toContain("SMS provider evidence classifier");
    expect(gapTracker).toContain("smsProviderRuntimeReadinessRequiredControls");
    expect(gapTracker).toContain("smsProviderRequiredEvidence");
    expect(gapTracker).toContain("buildSmsProviderExecutionPlan");
    expect(gapTracker).toContain("smsProviderExecutionPolicy");
    expect(gapTracker).toContain("smsProviderRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedSmsProviderArtifact");
    expect(gapTracker).toContain("buildSmsProviderArtifactReview");
    expect(gapTracker).toContain("non-executing SMS provider execution policy");
    expect(gapTracker).toContain("local in-memory SMS provider repository contract");
    expect(gapTracker).toContain("verifySmsWebhookSignature");
    expect(gapTracker).toContain("SMS provider payload sanitizer");
    expect(gapTracker).toContain("GAP-062 is sms-provider-runtime-matrix wired with SMS provider evidence classifier");
    expect(smsProviderArtifactPaths).toContain("coverage/sms-provider-secret-safe-artifacts.json");
  });
});

