import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildEmailProviderArtifactReview,
  buildEmailProviderDecisionRequiredEvidence,
  buildEmailProviderEvidenceDecision,
  buildEmailProviderExecutionPlan,
  buildRedactedEmailProviderArtifact,
  emailProviderExternalCommands,
  emailProviderExecutionPolicy,
  emailProviderArtifactPaths,
  emailProviderLocalCommands,
  emailProviderRequiredExternalEvidence,
  emailProviderRuntimeCommands,
  emailProviderRuntimeMatrix,
  emailProviderRuntimeProofFiles,
  emailProviderRuntimeReadiness,
  emailProviderRuntimeReadinessRequiredControls,
  emailProviderRuntimeReadinessRequiredEvidence,
  emailProviderRequiredEvidence,
} from "../lib/emailProviderRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("email provider runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const providerSource = readRepoFile("apps/web/lib/emailProvider.ts");
  const routeSource = readRepoFile("apps/web/app/api/webhooks/email/route.ts");
  const staticTest = readRepoFile("apps/web/tests/email-provider-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-061 commands, matrix rows, and artifacts", () => {
    expect(emailProviderRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/email-provider-static.test.ts",
      "install/configure Resend SDK and sandbox API key",
      "prove verified sender/domain without exposing DNS secrets",
      "verify Resend/Svix signature against raw webhook bodies",
      "durable NotificationDelivery transaction tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable bounce/complaint/unsubscribe suppression tests",
      "Resend sandbox delivered event test",
      "Resend sandbox bounced event test",
      "Resend sandbox complained event test",
      "Resend unsubscribe suppression test",
      "invalid email webhook signature route test",
      "GitHub Actions email provider runtime job",
      "review email artifacts for API keys, signatures, raw payloads, destinations, and tenant data",
    ]);
    expect(emailProviderRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "static-contract",
      "resend-sdk-api-key",
      "verified-sender-domain",
      "raw-body-signature",
      "delivery-persistence",
      "provider-event-persistence",
      "suppression-persistence",
      "sandbox-delivered",
      "sandbox-bounced",
      "sandbox-complained",
      "unsubscribe-suppression",
      "invalid-signature-route",
      "ci-email-provider-job",
      "secret-safe-artifacts",
    ]);
    expect(emailProviderArtifactPaths).toContain("coverage/email-provider-runtime.json");
    expect(emailProviderArtifactPaths).toContain("test-results/email-provider-runtime");
  });

  it("pins current email provider proof files for GAP-061", () => {
    expect(emailProviderRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/web/lib/emailProvider.ts",
      "apps/web/lib/emailProviderRuntime.ts",
      "apps/web/app/api/webhooks/email/route.ts",
      "apps/web/tests/email-provider-static.test.ts",
      "apps/web/tests/email-provider-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      "ENVIRONMENT_VARIABLES.md",
      ".env.example",
      ".github/workflows/ci.yml",
    ]));
    for (const file of emailProviderRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helpers, provider contract, webhook route, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildEmailProviderSendPlan");
    expect(notificationsSource).toContain("buildEmailWebhookRuntimeReadinessPlan");
    expect(providerSource).toContain("executeEmailProviderSend");
    expect(providerSource).toContain("createInMemoryEmailProviderRepository");
    expect(providerSource).toContain("sanitizeEmailProviderSendResult");
    expect(providerSource).toContain("buildRedactedEmailWebhookPayload");
    expect(providerSource).toContain("persistWebhookReconciliation");
    expect(providerSource).toContain("buildEmailProviderReconciliation");
    expect(providerSource).toContain("verifyEmailWebhookSignature");
    expect(routeSource).toContain("buildEmailWebhookReadinessFromPayload");
    expect(routeSource).toContain("verifyEmailWebhookSignature");
    expect(routeSource).toContain("INVALID_EMAIL_PROVIDER_SIGNATURE");
    expect(routeSource).toContain("resend-signature");
    expect(routeSource).toContain("PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeSource).toContain("localEmailWebhookPersistenceDisabled");
    expect(staticTest).toContain("requires Resend send controls");
    expect(staticTest).toContain("sanitizes nested email provider send and webhook payloads");
    expect(staticTest).toContain("executes a local email provider repository contract");
    expect(staticTest).toContain("blocks local email sends when the destination is suppressed");
  });

  it("keeps Resend, signature, persistence, sandbox, CI, and artifact blockers explicit", () => {
    expect(emailProviderRuntimeReadiness.status).toBe("blocked");
    expect(emailProviderRuntimeReadiness.requiredCommands).toBe(emailProviderRuntimeCommands);
    expect(emailProviderRuntimeReadiness.requiredEvidence).toBe(emailProviderRuntimeReadinessRequiredEvidence);
    expect(emailProviderRuntimeReadiness.requiredControls).toBe(emailProviderRuntimeReadinessRequiredControls);
    expect(emailProviderRuntimeReadiness.blockers).toContain("Real Resend SDK/API key must be configured in a secret store before provider-backed sends.");
    expect(emailProviderRuntimeReadiness.blockers).toContain("Email webhook route signature verification and invalid-signature rejection evidence must be captured.");
    expect(emailProviderRuntimeReadiness.blockers).toContain("Delivered, bounced, complained, and unsubscribe provider events must be tested against the sandbox.");
  });

  it("pins the non-executing GAP-061 email provider execution policy", () => {
    const plan = buildEmailProviderExecutionPlan();

    expect(emailProviderExecutionPolicy).toEqual({
      codexMayClassifyStaticEmailProviderReadiness: true,
      localNotificationCommandsRequiredForClosure: true,
      resendSdkApiKeyRequiredForClosure: true,
      verifiedSenderDomainRequiredForClosure: true,
      rawBodySignatureRequiredForClosure: true,
      durablePersistenceRequiredForClosure: true,
      sandboxEventsRequiredForClosure: true,
      invalidSignatureRouteRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(emailProviderExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(emailProviderRequiredExternalEvidence);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.resendSdkExecutionAllowed).toBe(false);
    expect(plan.domainVerificationExecutionAllowed).toBe(false);
    expect(plan.signatureVerificationExecutionAllowed).toBe(false);
    expect(plan.durablePersistenceExecutionAllowed).toBe(false);
    expect(plan.sandboxEventExecutionAllowed).toBe(false);
    expect(plan.invalidSignatureExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(emailProviderLocalCommands);
    expect(plan.externalCommands).toBe(emailProviderExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(emailProviderRequiredExternalEvidence);
    expect(emailProviderRequiredExternalEvidence).toEqual([
      "actual email provider command output",
      "Resend SDK/API key readiness evidence",
      "verified sender/domain evidence",
      "raw-body Resend/Svix signature verification evidence",
      "durable NotificationDelivery persistence tests",
      "durable ProviderEvent replay/idempotency tests",
      "durable suppression persistence tests",
      "Resend sandbox delivered/bounced/complained event transcripts",
      "unsubscribe suppression evidence",
      "invalid email webhook signature route evidence",
      "CI email provider artifacts",
      "secret-safe email provider artifact review",
    ]);
  });

  it("pins recursive email provider artifact redaction and review", () => {
    const redacted = buildRedactedEmailProviderArtifact({
      resendApiKey: "provider-key",
      verifiedSenderDomain: "mail.example.test",
      destinationEmail: "client@example.test",
      rawWebhookPayload: "{\"private\":true}",
      publicSummary: "email provider evidence captured",
      nested: {
        svixSignature: "signature",
        publicStatus: "delivered",
      },
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "resendApiKey",
      "verifiedSenderDomain",
      "destinationEmail",
      "rawWebhookPayload",
      "nested.svixSignature",
    ]);
    expect(redacted.artifact).toEqual({
      resendApiKey: "[redacted]",
      verifiedSenderDomain: "[redacted]",
      destinationEmail: "[redacted]",
      rawWebhookPayload: "[redacted]",
      publicSummary: "email provider evidence captured",
      nested: {
        svixSignature: "[redacted]",
        publicStatus: "delivered",
      },
    });

    const review = buildEmailProviderArtifactReview({
      publicSummary: "safe email provider artifact",
      providerEventPayloadUrl: "https://private/provider-event.json",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["providerEventPayloadUrl"]);
    expect(review.requiredExternalEvidence).toBe(emailProviderRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toBe(emailProviderRequiredExternalEvidence);
  });

  it("classifies email provider evidence before GAP-061 can close", () => {
    const blockedDecision = buildEmailProviderEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      resendSdkApiKeyVerified: false,
      verifiedSenderDomainVerified: false,
      rawBodySignatureVerified: false,
      deliveryPersistenceVerified: false,
      providerEventPersistenceVerified: false,
      suppressionPersistenceVerified: false,
      sandboxDeliveredPassed: false,
      sandboxBouncedPassed: false,
      sandboxComplainedPassed: false,
      unsubscribeSuppressionPassed: false,
      invalidSignatureRoutePassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/email-provider-runtime.json",
        "coverage/email-provider-notifications-typecheck.txt",
        "coverage/email-provider-notifications-test.txt",
        "coverage/email-provider-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Resend SDK/API key evidence is missing.");
    expect(blockedDecision.blockers).toContain("Verified sender/domain evidence is missing.");
    expect(blockedDecision.blockers).toContain("Raw-body Resend/Svix signature evidence is missing.");
    expect(blockedDecision.blockers).toContain("ProviderEvent persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Resend sandbox complained-event evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe email provider artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/email-provider-resend-sdk.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/email-provider-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(emailProviderRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(
      buildEmailProviderDecisionRequiredEvidence(emailProviderRuntimeReadinessRequiredEvidence),
    );
    expect(blockedDecision.requiredEvidence).toBe(emailProviderRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 4,
      requiredArtifactCount: emailProviderArtifactPaths.length,
    });

    const completeDecision = buildEmailProviderEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      resendSdkApiKeyVerified: true,
      verifiedSenderDomainVerified: true,
      rawBodySignatureVerified: true,
      deliveryPersistenceVerified: true,
      providerEventPersistenceVerified: true,
      suppressionPersistenceVerified: true,
      sandboxDeliveredPassed: true,
      sandboxBouncedPassed: true,
      sandboxComplainedPassed: true,
      unsubscribeSuppressionPassed: true,
      invalidSignatureRoutePassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: emailProviderArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 email provider runtime contracts");
    expect(ciWorkflow).toContain("email-provider-runtime-static.test.ts");
    expect(ciWorkflow).toContain("email-provider-runtime-artifacts");
    expect(unitManifest).toContain("unit-email-provider-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/emailProviderRuntime.ts");
    expect(gapTracker).toContain("email provider evidence classifier");
    expect(gapTracker).toContain("emailProviderRuntimeReadinessRequiredControls");
    expect(gapTracker).toContain("emailProviderRequiredEvidence");
    expect(gapTracker).toContain("buildEmailProviderExecutionPlan");
    expect(gapTracker).toContain("emailProviderExecutionPolicy");
    expect(gapTracker).toContain("emailProviderRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedEmailProviderArtifact");
    expect(gapTracker).toContain("buildEmailProviderArtifactReview");
    expect(gapTracker).toContain("non-executing email provider execution policy");
    expect(gapTracker).toContain("local in-memory email provider repository contract");
    expect(gapTracker).toContain("email provider payload sanitizer");
    expect(gapTracker).toContain("GAP-061 is email-provider-runtime-matrix wired with email provider evidence classifier");
    expect(emailProviderArtifactPaths).toContain("coverage/email-provider-secret-safe-artifacts.json");
  });
});

