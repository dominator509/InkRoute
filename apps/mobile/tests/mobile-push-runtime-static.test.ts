import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobilePushArtifactReview,
  buildMobilePushEvidenceDecision,
  buildMobilePushExecutionPlan,
  buildRedactedMobilePushArtifact,
  mobilePushArtifactPaths,
  mobilePushDecisionRequiredEvidence,
  mobilePushExecutionPolicy,
  mobilePushExternalCommands,
  mobilePushLocalCommands,
  mobilePushRequiredExternalEvidence,
  mobilePushRuntimeProofFiles,
  mobilePushRuntimeCommands,
  mobilePushRuntimeMatrix,
  mobilePushRuntimeReadiness,
} from "../src/lib/mobilePushRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile push runtime contract", () => {
  const notificationsPackageJson = readWorkspaceFile("packages/notifications/package.json");
  const notificationsSource = readWorkspaceFile("packages/notifications/src/index.ts");
  const notificationsTests = readWorkspaceFile("packages/notifications/tests/delivery-plan.test.ts");
  const pushSource = readWorkspaceFile("apps/mobile/src/lib/mobilePush.ts");
  const pushStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-push-static.test.ts");
  const notificationScreen = readWorkspaceFile("apps/mobile/src/screens/NotificationsScreen.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-063 commands, matrix rows, and artifacts", () => {
    expect(mobilePushRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/mobile typecheck",
      "configure Expo project id, access token, APNs, and FCM credentials",
      "persist tenant/user/device push tokens and opt-out state",
      "Expo push send smoke test against a real device token",
      "persist Expo ProviderEvent receipt reconciliation records",
      "persist NotificationInteraction tap/open records",
      "persist mobile push audit log records",
      "Expo receipt polling smoke test",
      "mobile push tap deep-link routing smoke",
      "iOS foreground/background/tap push QA",
      "Android foreground/background/tap push QA",
      "GitHub Actions mobile push evidence job",
    ]);
    expect(mobilePushRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "mobile-typecheck",
      "expo-project-credentials",
      "token-optout-persistence",
      "delivery-worker-log",
      "provider-event-persistence",
      "notification-interaction-persistence",
      "audit-log-persistence",
      "receipt-worker-invalid-token",
      "safe-tap-routing",
      "ios-device-qa",
      "android-device-qa",
      "ci-secret-safe-evidence",
    ]);
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-runtime.json");
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-provider-event-persistence.json");
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-notification-interaction.json");
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-audit-log.json");
    expect(mobilePushArtifactPaths).toContain("test-results/mobile-push-runtime");
  });

  it("keeps package helper, app push contracts, receipt suppression, and notification screen wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildExpoPushProviderRuntimeReadinessPlan");
    expect(notificationsTests).toContain("buildExpoPushProviderRuntimeReadinessPlan");
    expect(pushSource).toContain("buildExpoPushRegistrationPlan");
    expect(pushSource).toContain("buildMobilePushLocalContract");
    expect(pushSource).toContain("ExpoPushProviderRepository");
    expect(pushSource).toContain("createInMemoryExpoPushProviderRepository");
    expect(pushSource).toContain("buildRedactedExpoPushPayload");
    expect(pushSource).toContain("processExpoPushReceipt");
    expect(pushSource).toContain("suppressInvalidToken");
    expect(notificationsSource).toContain("Mobile push opt-out UI contract and persistence proof must be captured before provider delivery readiness.");
    expect(notificationsSource).not.toContain("Mobile push opt-out UI must be implemented and persisted.");
    expect(notificationsSource).toContain("Mobile push tap deep-link routing evidence must be captured before provider/device readiness.");
    expect(notificationsSource).not.toContain("Mobile push tap deep-link handler must be implemented.");
    expect(pushStaticTest).toContain("models invalid-token receipt suppression");
    expect(pushStaticTest).toContain("redacts nested Expo push provider payloads before persistence");
    expect(pushStaticTest).toContain("executes a local Expo push repository contract");
    expect(notificationScreen).toContain("Push runtime contract");
    expect(notificationScreen).toContain("mobilePushContractPreview.localContract.localContractReady");
    expect(notificationScreen).toContain("tap route");
  });

  it("keeps Expo credential, persistence, worker, invalid-token, and device blockers explicit", () => {
    expect(mobilePushRuntimeReadiness.status).toBe("blocked");
    expect(mobilePushRuntimeReadiness.provider).toBe("expo");
    expect(mobilePushRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobilePushRuntimeReadiness.requiredCommands).toBe(mobilePushRuntimeCommands);
    expect(mobilePushRuntimeReadiness.requiredEvidence).toBe(mobilePushDecisionRequiredEvidence);
    expect(mobilePushRuntimeReadiness.requiredEvidence).toEqual(mobilePushDecisionRequiredEvidence);
    expect(mobilePushRuntimeReadiness.blockers).toContain("Expo project id must be configured before push delivery.");
    expect(mobilePushRuntimeReadiness.blockers).toContain("Tenant/user/device-scoped push token persistence must be available.");
    expect(mobilePushRuntimeReadiness.blockers).toContain("Push tap navigation must pass iOS/Android device QA.");
  });

  it("classifies mobile push evidence before GAP-063 can close", () => {
    const blockedDecision = buildMobilePushEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      mobileTypecheckPassed: true,
      expoProjectCredentialsVerified: false,
      nativeCredentialsVerified: false,
      pushTokenPersistenceVerified: false,
      optOutPersistenceVerified: false,
      deliveryWorkerVerified: false,
      deliveryLogPersistenceVerified: false,
      providerEventPersistenceVerified: false,
      notificationInteractionVerified: false,
      auditLogPersistenceVerified: false,
      receiptWorkerVerified: false,
      invalidTokenSuppressionVerified: false,
      tapRoutingVerified: true,
      iosDeviceQaPassed: false,
      androidDeviceQaPassed: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/mobile-push-runtime.json",
        "coverage/mobile-push-notifications-typecheck.txt",
        "coverage/mobile-push-notifications-test.txt",
        "coverage/mobile-push-app-typecheck.txt",
        "coverage/mobile-push-tap-routing.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Expo project/access token evidence is missing.");
    expect(blockedDecision.blockers).toContain("PushToken persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Expo receipt polling worker evidence is missing.");
    expect(blockedDecision.blockers).toContain("Invalid-token suppression persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("iOS foreground/background/tap device QA evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe mobile push artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/mobile-push-expo-project-redacted.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/mobile-push-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(mobilePushRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(mobilePushDecisionRequiredEvidence);
    expect(blockedDecision.requiredEvidence).toEqual(mobilePushDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: mobilePushArtifactPaths.length,
    });

    const completeDecision = buildMobilePushEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      mobileTypecheckPassed: true,
      expoProjectCredentialsVerified: true,
      nativeCredentialsVerified: true,
      pushTokenPersistenceVerified: true,
      optOutPersistenceVerified: true,
      deliveryWorkerVerified: true,
      deliveryLogPersistenceVerified: true,
      providerEventPersistenceVerified: true,
      notificationInteractionVerified: true,
      auditLogPersistenceVerified: true,
      receiptWorkerVerified: true,
      invalidTokenSuppressionVerified: true,
      tapRoutingVerified: true,
      iosDeviceQaPassed: true,
      androidDeviceQaPassed: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: mobilePushArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toBe(mobilePushDecisionRequiredEvidence);
  });

  it("keeps GAP-063 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobilePushExecutionPlan();

    expect(plan.policy).toBe(mobilePushExecutionPolicy);
    expect(plan.localCommands).toBe(mobilePushLocalCommands);
    expect(plan.externalCommands).toBe(mobilePushExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(mobilePushRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobilePushReadiness).toBe(true);
    expect(plan.policy.expoCredentialsRequiredForClosure).toBe(true);
    expect(plan.policy.tokenPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.receiptWorkerRequiredForClosure).toBe(true);
    expect(plan.policy.invalidTokenSuppressionRequiredForClosure).toBe(true);
    expect(plan.policy.devicePushSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.expoCredentialExecutionAllowed).toBe(false);
    expect(plan.nativeCredentialExecutionAllowed).toBe(false);
    expect(plan.pushDeliveryExecutionAllowed).toBe(false);
    expect(plan.receiptWorkerExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.deviceExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toContain("pnpm --filter @inkroute/notifications typecheck");
    expect(plan.externalCommands).toContain("Expo receipt polling smoke test");
    expect(plan.requiredExternalEvidence).toBe(mobilePushRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile push artifact review");
  });

  it("redacts GAP-063 mobile push artifacts before secret-safe review", () => {
    const artifact = {
      tenantId: "tenant_private",
      expoAccessToken: "expo_private",
      apnsCredential: "apns_private",
      fcmCredential: "fcm_private",
      pushToken: "ExponentPushToken[private]",
      nested: {
        receiptId: "receipt_private",
        publicSummary: "mobile push evidence captured",
      },
    };

    const redacted = buildRedactedMobilePushArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "expoAccessToken",
      "apnsCredential",
      "fcmCredential",
      "pushToken",
      "nested.receiptId",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantId: "[REDACTED]",
      expoAccessToken: "[REDACTED]",
      apnsCredential: "[REDACTED]",
      fcmCredential: "[REDACTED]",
      pushToken: "[REDACTED]",
      nested: {
        receiptId: "[REDACTED]",
        publicSummary: "mobile push evidence captured",
      },
    });

    const review = buildMobilePushArtifactReview({
      publicSummary: "safe mobile push evidence",
      notificationInteractionToken: "tap_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["notificationInteractionToken"]);
    expect(review.requiredExternalEvidence).toBe(mobilePushRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("invalid-token suppression persistence proof");
  });

  it("pins current mobile push proof files for GAP-063", () => {
    expect(mobilePushRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "packages/mobile/package.json",
      "apps/mobile/src/lib/mobilePush.ts",
      "apps/mobile/src/lib/mobilePushRuntime.ts",
      "apps/mobile/src/lib/mobileDemo.ts",
      "apps/mobile/src/screens/NotificationsScreen.tsx",
      "apps/mobile/tests/mobile-push-static.test.ts",
      "apps/mobile/tests/mobile-push-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".env.example",
      ".github/workflows/ci.yml",
    ]));
    for (const file of mobilePushRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Expo/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 mobile push runtime contracts");
    expect(ciWorkflow).toContain("mobile-push-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-push-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-push-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobilePushRuntime.ts");
    expect(gapTracker).toContain("mobile push evidence classifier");
    expect(gapTracker).toContain("local in-memory Expo push repository contract");
    expect(gapTracker).toContain("Expo push payload sanitizer");
    expect(gapTracker).toContain("GAP-044 is mobile-push-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobilePushExecutionPlan");
    expect(gapTracker).toContain("mobilePushExecutionPolicy");
    expect(gapTracker).toContain("mobilePushLocalCommands/mobilePushExternalCommands");
    expect(gapTracker).toContain("mobilePushRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedMobilePushArtifact");
    expect(gapTracker).toContain("buildMobilePushArtifactReview");
    expect(gapTracker).toContain("non-executing mobile push execution policy");
    expect(gapTracker).toContain("GAP-063 is mobile-push-runtime-matrix wired with mobile push evidence classifier");
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-secret-safe-artifacts.json");
  });
});
