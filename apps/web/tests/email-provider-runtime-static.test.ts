import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildEmailProviderEvidenceDecision,
  emailProviderArtifactPaths,
  emailProviderRuntimeCommands,
  emailProviderRuntimeMatrix,
  emailProviderRuntimeProofFiles,
  emailProviderRuntimeReadiness,
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
      "Resend sandbox delivered event test",
      "Resend sandbox bounced event test",
      "Resend sandbox complained event test",
      "Resend unsubscribe suppression test",
      "invalid email webhook signature route test",
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
    expect(providerSource).toContain("persistWebhookReconciliation");
    expect(providerSource).toContain("buildEmailProviderReconciliation");
    expect(routeSource).toContain("buildEmailWebhookReadinessFromPayload");
    expect(routeSource).toContain("resend-signature");
    expect(staticTest).toContain("requires Resend send controls");
  });

  it("keeps Resend, signature, persistence, sandbox, CI, and artifact blockers explicit", () => {
    expect(emailProviderRuntimeReadiness.status).toBe("blocked");
    expect(emailProviderRuntimeReadiness.requiredCommands).toEqual([...emailProviderRuntimeCommands]);
    expect(emailProviderRuntimeReadiness.requiredEvidence).toContain("Resend SDK/API key and verified sender/domain evidence");
    expect(emailProviderRuntimeReadiness.requiredEvidence).toContain("raw-body Resend/Svix signature verification and invalid-signature route evidence");
    expect(emailProviderRuntimeReadiness.blockers).toContain("Real Resend SDK/API key must be configured in a secret store before provider-backed sends.");
    expect(emailProviderRuntimeReadiness.blockers).toContain("Email webhook route must verify Resend/Svix signatures cryptographically against raw bodies.");
    expect(emailProviderRuntimeReadiness.blockers).toContain("Delivered, bounced, complained, and unsubscribe provider events must be tested against the sandbox.");
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
    expect(blockedDecision.requiredCommands).toEqual([...emailProviderRuntimeCommands]);
    expect(blockedDecision.requiredEvidence).toContain("secret-safe review of retained email provider artifacts");
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
    expect(gapTracker).toContain("GAP-061 is email-provider-runtime-matrix wired with evidence classifier");
    expect(emailProviderArtifactPaths).toContain("coverage/email-provider-secret-safe-artifacts.json");
  });
});
