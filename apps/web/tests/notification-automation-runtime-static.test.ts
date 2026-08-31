import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationAutomationArtifactReview,
  notificationAutomationDecisionRequiredEvidence,
  buildNotificationAutomationEvidenceDecision,
  buildNotificationAutomationExecutionPlan,
  buildRedactedNotificationAutomationArtifact,
  notificationAutomationExternalCommands,
  notificationAutomationExecutionPolicy,
  notificationAutomationArtifactPaths,
  notificationAutomationLocalCommands,
  notificationAutomationRequiredExternalEvidence,
  notificationAutomationRuntimeCommands,
  notificationAutomationRuntimeMatrix,
  notificationAutomationRuntimeProofFiles,
  notificationAutomationRuntimeReadiness,
  notificationAutomationRuntimeSuiteIds,
  notificationAutomatedTestRequiredArtifacts,
} from "../lib/notificationAutomatedTestsRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("notification automated test runtime contract", () => {
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const automationSource = readRepoFile("apps/web/lib/notificationAutomatedTests.ts");
  const automationStaticTest = readRepoFile("apps/web/tests/notification-automation-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-069 commands, suite ids, matrix rows, and artifacts", () => {
    expect(notificationAutomationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/notification-messaging-routes.test.ts",
      "pnpm vitest run apps/web/tests/provider-webhook-routes.test.ts apps/web/tests/provider-webhook-contracts.test.ts",
      "notification queue integration test command",
      "Playwright dashboard templates/messages smoke tests",
      "Expo iOS/Android push device QA",
      "provider sandbox email/SMS/push receipt tests",
      "booking-to-deposit/aftercare/travel notification E2E tests",
    ]);
    expect(notificationAutomationRuntimeSuiteIds).toContain("booking-deposit-aftercare-travel-e2e");
    expect(notificationAutomationRuntimeMatrix.map((entry) => entry.id)).toContain("travel-waitlist-e2e");
    expect(notificationAutomationArtifactPaths).toContain("coverage/notification-automation-runtime.json");
    expect(notificationAutomationArtifactPaths).toContain("test-results/notification-automation-runtime");
  });

  it("keeps package helper, suite matrix, CI artifact paths, and static guard wired", () => {
    expect(notificationsSource).toContain("buildNotificationAutomatedTestReadinessPlan");
    expect(automationSource).toContain("notificationAutomatedTestSuites");
    expect(automationSource).toContain("buildNotificationAutomatedTestExecutionPlan");
    expect(automationSource).toContain("buildNotificationAutomationArtifactReview");
    expect(automationSource).toContain("booking-deposit-aftercare-travel-e2e");
    expect(automationSource).toContain("notificationCiArtifactPaths");
    expect(automationStaticTest).toContain("enumerates every required Phase 9 notification and messaging suite");
  });

  it("keeps queue, provider, Playwright, mobile, persistence, E2E, CI, and artifact blockers explicit", () => {
    expect(notificationAutomationRuntimeReadiness.ready).toBe(false);
    expect(notificationAutomationRuntimeReadiness.requiredEvidence).toBe(notificationAutomationDecisionRequiredEvidence);
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Notification queue integration tests must pass.");
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Email provider sandbox tests must pass.");
    expect(notificationAutomationRuntimeReadiness.blockers).toContain("Travel waitlist notification E2E flow must pass.");
  });

  it("pins the non-executing GAP-069 notification automation execution policy", () => {
    const plan = buildNotificationAutomationExecutionPlan();

    expect(notificationAutomationExecutionPolicy).toEqual({
      codexMayClassifyStaticNotificationAutomationReadiness: true,
      localPackageAndRouteEvidenceRequiredForClosure: true,
      queueIntegrationRequiredForClosure: true,
      dashboardPlaywrightRequiredForClosure: true,
      mobileDeviceQaRequiredForClosure: true,
      providerSandboxRequiredForClosure: true,
      preferenceStopRetentionRequiredForClosure: true,
      bookingDepositAftercareTravelE2eRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(notificationAutomationExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.queueExecutionAllowed).toBe(false);
    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.mobileDeviceExecutionAllowed).toBe(false);
    expect(plan.providerSandboxExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.e2eExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(notificationAutomationLocalCommands);
    expect(plan.externalCommands).toBe(notificationAutomationExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(notificationAutomationRequiredExternalEvidence);
    expect(plan.suitePlan.blockedExternalSuites).toContain("provider-sandbox-email");
    expect(plan.suitePlan.requiredArtifacts).toBe(notificationAutomatedTestRequiredArtifacts);
    expect(plan.suitePlan.requiredArtifacts).toContain("coverage/playwright-notification-e2e-results.json");
    expect(notificationAutomationRequiredExternalEvidence).toEqual([
      "actual notification automation command output",
      "notification queue integration test evidence",
      "dashboard Playwright templates/messages smoke evidence",
      "mobile notification smoke evidence",
      "Expo iOS/Android push device QA evidence",
      "provider sandbox email/SMS/push receipt evidence",
      "preference opt-out and SMS STOP persistence evidence",
      "retention/export/delete integration evidence",
      "booking/deposit/aftercare/travel notification E2E evidence",
      "CI Phase 9 notification automation artifacts",
      "secret-safe notification automation artifact review",
    ]);
  });

  it("pins notification automation artifact redaction and review through the runtime", () => {
    const redacted = buildRedactedNotificationAutomationArtifact({
      providerEmailPayload: "ari@example.test",
      expoPushToken: "expo_push_token_private",
      routeUrl: "https://tenant.example.test/api/public/tenant-a/messages",
      renderedHtml: "<main>private notification body</main>",
      commandOutput: "pnpm notification smoke failed with private env context",
      ciArtifactUrl: "https://github.example.test/actions/runs/123/artifacts/456",
      tenantId: "tenant_private_123",
      clientId: "client_private_123",
      bookingRequestId: "booking_private_123",
      depositId: "deposit_private_123",
      messageBody: "private lifecycle message body",
      queueJobId: "queue_private_123",
      deliveryId: "delivery_private_123",
      webhookPayload: { providerMessageId: "provider_private_123" },
      publicSummary: "notification automation evidence captured",
      nested: {
        smsPhone: "+1 206 555 0100",
        stackTrace: "Error: private stack",
        publicStatus: "queued",
      },
    });

    expect(redacted).toEqual({
      providerEmailPayload: "[redacted]",
      expoPushToken: "[redacted]",
      routeUrl: "[redacted]",
      renderedHtml: "[redacted]",
      commandOutput: "[redacted]",
      ciArtifactUrl: "[redacted]",
      tenantId: "[redacted]",
      clientId: "[redacted]",
      bookingRequestId: "[redacted]",
      depositId: "[redacted]",
      messageBody: "[redacted]",
      queueJobId: "[redacted]",
      deliveryId: "[redacted]",
      webhookPayload: "[redacted]",
      publicSummary: "notification automation evidence captured",
      nested: {
        smsPhone: "[redacted]",
        stackTrace: "[redacted]",
        publicStatus: "queued",
      },
    });

    const review = buildNotificationAutomationArtifactReview({
      artifacts: [
        {
          artifactPath: "coverage/notification-automation-secret-safe-artifacts.json",
          providerToken: "expo_push_token_private",
          publicSummary: "safe notification automation artifact",
        },
      ],
      expectedArtifactPaths: ["coverage/notification-automation-secret-safe-artifacts.json"],
    });

    expect(review.status).toBe("passed");
    expect(review.blockers).toEqual([]);
    expect(review.redactedArtifacts[0]).toMatchObject({
      artifactPath: "coverage/notification-automation-secret-safe-artifacts.json",
      providerToken: "[redacted]",
      publicSummary: "safe notification automation artifact",
    });
  });

  it("classifies notification automation evidence before GAP-069 can close", () => {
    const blockedDecision = buildNotificationAutomationEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      publicRoutesPassed: true,
      providerWebhookRoutesPassed: true,
      queueIntegrationPassed: false,
      dashboardTemplateSmokePassed: false,
      dashboardMessageSmokePassed: false,
      mobileNotificationSmokePassed: false,
      expoDeviceQaPassed: false,
      providerEmailSandboxPassed: false,
      providerSmsSandboxPassed: false,
      providerPushReceiptSandboxPassed: false,
      preferenceOptOutPersistencePassed: false,
      smsStopPersistencePassed: false,
      retentionExportDeletePassed: false,
      bookingDepositE2ePassed: false,
      aftercareE2ePassed: false,
      travelWaitlistE2ePassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/notification-automation-runtime.json",
        "coverage/notification-automation-notifications-typecheck.txt",
        "coverage/notification-automation-notifications-test.txt",
        "coverage/notification-automation-public-routes.json",
        "coverage/notification-automation-provider-webhook-routes.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Notification queue integration evidence is missing.");
    expect(blockedDecision.blockers).toContain("Dashboard template Playwright smoke evidence is missing.");
    expect(blockedDecision.blockers).toContain("Expo iOS/Android push device QA evidence is missing.");
    expect(blockedDecision.blockers).toContain("Email provider sandbox evidence is missing.");
    expect(blockedDecision.blockers).toContain("Travel waitlist notification E2E evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe notification automation artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-automation-queue-integration.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-automation-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(notificationAutomationRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(notificationAutomationDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: notificationAutomationArtifactPaths.length,
    });

    const completeDecision = buildNotificationAutomationEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      publicRoutesPassed: true,
      providerWebhookRoutesPassed: true,
      queueIntegrationPassed: true,
      dashboardTemplateSmokePassed: true,
      dashboardMessageSmokePassed: true,
      mobileNotificationSmokePassed: true,
      expoDeviceQaPassed: true,
      providerEmailSandboxPassed: true,
      providerSmsSandboxPassed: true,
      providerPushReceiptSandboxPassed: true,
      preferenceOptOutPersistencePassed: true,
      smsStopPersistencePassed: true,
      retentionExportDeletePassed: true,
      bookingDepositE2ePassed: true,
      aftercareE2ePassed: true,
      travelWaitlistE2ePassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: notificationAutomationArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming executed provider/device/E2E proof", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification automation runtime contracts");
    expect(ciWorkflow).toContain("notification-automation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-automation-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-automation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/notificationAutomatedTestsRuntime.ts");
    expect(gapTracker).toContain("notification automation evidence classifier");
    expect(gapTracker).toContain("notificationAutomationDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildNotificationAutomationExecutionPlan");
    expect(gapTracker).toContain("notificationAutomationExecutionPolicy");
    expect(gapTracker).toContain("notificationAutomationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedNotificationAutomationArtifact");
    expect(gapTracker).toContain("buildNotificationAutomationArtifactReview");
    expect(gapTracker).toContain("non-executing notification automation execution policy");
    expect(gapTracker).toContain("local notification automation execution plan");
    expect(gapTracker).toContain("GAP-069 is notification-automation-runtime-matrix wired with notification automation evidence classifier");
    expect(notificationAutomationArtifactPaths).toContain("coverage/notification-automation-secret-safe-artifacts.json");
  });

  it("pins current notification automation proof files for GAP-069", () => {
    expect(notificationAutomationRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/web/lib/notificationAutomatedTests.ts",
      "apps/web/lib/notificationAutomatedTestsRuntime.ts",
      "apps/web/tests/notification-automation-static.test.ts",
      "apps/web/tests/notification-automation-runtime-static.test.ts",
      "apps/web/tests/notification-messaging-routes.test.ts",
      "apps/web/tests/provider-webhook-routes.test.ts",
      "apps/web/tests/provider-webhook-contracts.test.ts",
      "apps/web/tests/preference-center-static.test.ts",
      "apps/dashboard/tests/notification-scheduler-static.test.ts",
      "apps/dashboard/tests/notification-persistence-static.test.ts",
      "apps/dashboard/tests/messaging-privacy-static.test.ts",
      "apps/mobile/tests/mobile-push-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of notificationAutomationRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});

