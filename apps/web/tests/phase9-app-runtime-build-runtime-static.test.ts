import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPhase9AppRuntimeBuildExecutionPlan,
  buildPhase9AppRuntimeBuildEvidenceDecision,
  buildPhase9AppRuntimeBuildRunEvidencePacket,
  buildPhase9RuntimeArtifactReview,
  buildRedactedPhase9RuntimeArtifact,
  phase9AppRuntimeBuildDecisionRequiredEvidence,
  phase9AppRuntimeBuildExternalCommands,
  phase9AppRuntimeBuildExecutionPolicy,
  phase9AppRuntimeBuildLocalCommands,
  phase9AppRuntimeBuildRequiredExternalEvidence,
  phase9AppRuntimeBuildRuntimeArtifactPaths,
  phase9AppRuntimeBuildRuntimeCommands,
  phase9AppRuntimeBuildRuntimeMatrix,
  phase9AppRuntimeBuildRuntimeProofFiles,
  phase9AppRuntimeBuildRuntimeReadiness,
  phase9AppRuntimeBuildSurfaceContract,
  phase9AppRuntimeBuildSurfaceIds,
  phase9RuntimeRequiredArtifacts,
} from "../lib/phase9AppRuntimeBuildRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 9 app runtime/build runtime contract", () => {
  const testingSource = readRepoFile("packages/testing/src/index.ts");
  const phase9Source = readRepoFile("apps/web/lib/phase9AppRuntimeBuild.ts");
  const staticTest = readRepoFile("apps/web/tests/phase9-app-runtime-build-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-070 runtime/build commands, surface ids, matrix rows, and artifacts", () => {
    expect(phase9AppRuntimeBuildRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm vitest run apps/web/tests/phase9-app-runtime-build-static.test.ts",
      "Playwright dashboard templates/messages smoke tests",
      "Expo simulator notification screen smoke test",
      "Expo device notification screen smoke test",
      "booking-to-notification runtime smoke with provider sends disabled",
    ]);
    expect(phase9AppRuntimeBuildSurfaceIds).toContain("booking-to-notification-runtime-smoke");
    expect(phase9AppRuntimeBuildSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "web-build",
      "dashboard-build",
      "mobile-typecheck",
      "notification-routes",
      "dashboard-playwright-smoke",
      "expo-device-notification",
      "booking-to-notification-runtime",
      "provider-disabled-proof",
      "ci-phase9-gate",
      "secret-safe-artifacts",
    ]);
    expect(phase9AppRuntimeBuildRuntimeMatrix.map((entry) => entry.id)).toContain("provider-disabled-proof");
    expect(phase9AppRuntimeBuildRuntimeMatrix.map((entry) => entry.id)).toContain("run-evidence-packet");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("coverage/phase9-app-runtime-build-runtime.json");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("coverage/phase9-app-runtime-build-run-evidence-packet.json");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("test-results/phase9-app-runtime-build");
  });

  it("keeps package helper, cross-app surface matrix, provider-disabled policy, and static guard wired", () => {
    expect(testingSource).toContain("buildPhase9AppRuntimeBuildReadinessPlan");
    expect(phase9Source).toContain("phase9AppRuntimeSurfaces");
    expect(phase9Source).toContain("buildPhase9RuntimeExecutionPlan");
    expect(phase9Source).toContain("buildPhase9RuntimeArtifactReview");
    expect(phase9Source).toContain("providerPolicy: \"disabled-or-sandboxed\"");
    expect(phase9Source).toContain("ciRequiresPhase9AppRuntimeGate: true");
    expect(staticTest).toContain("enumerates the full cross-app runtime/build surface");
  });

  it("keeps build, route, Playwright, mobile, provider-disabled, CI, and artifact blockers explicit", () => {
    expect(phase9AppRuntimeBuildRuntimeReadiness.status).toBe("blocked");
    expect(phase9AppRuntimeBuildRuntimeReadiness.requiredEvidence).toBe(phase9AppRuntimeBuildDecisionRequiredEvidence);
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("@inkroute/web build must pass with Phase 9 notification and messaging routes.");
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("Dashboard provider-disabled states must be verified before runtime promotion.");
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("Booking-to-notification runtime smoke must pass with provider sends disabled.");
  });

  it("pins the non-executing GAP-070 Phase 9 runtime/build execution policy", () => {
    const plan = buildPhase9AppRuntimeBuildExecutionPlan();

    expect(phase9AppRuntimeBuildExecutionPolicy).toEqual({
      codexMayClassifyStaticPhase9RuntimeBuildReadiness: true,
      localTestingAndRouteEvidenceRequiredForClosure: true,
      webDashboardBuildsRequiredForClosure: true,
      mobileTypecheckRequiredForClosure: true,
      dashboardPlaywrightRequiredForClosure: true,
      providerDisabledRuntimeRequiredForClosure: true,
      expoSimulatorDeviceRequiredForClosure: true,
      bookingToNotificationRuntimeRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(phase9AppRuntimeBuildExecutionPolicy);
    expect(plan.surfaceContract).toBe(phase9AppRuntimeBuildSurfaceContract);
    expect(plan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "web-build",
          requiredCommand: "pnpm --filter @inkroute/web build",
          requiredArtifact: "coverage/phase9-web-build.log",
          runtimeBoundary: "web-build",
          providerSendsDisabledRequired: false,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "booking-to-notification-runtime",
          requiredCommand: "booking-to-notification runtime smoke with provider sends disabled",
          requiredArtifact: "coverage/phase9-booking-to-notification-runtime-redacted.json",
          runtimeBoundary: "booking-notification",
          providerSendsDisabledRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "provider-disabled-proof",
          requiredCommand: "prove provider sends disabled or sandboxed during runtime smoke",
          requiredArtifact: "coverage/phase9-provider-disabled-runtime-proof.json",
          runtimeBoundary: "provider-disabled",
          providerSendsDisabledRequired: true,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.buildExecutionAllowed).toBe(false);
    expect(plan.routeExecutionAllowed).toBe(false);
    expect(plan.playwrightExecutionAllowed).toBe(false);
    expect(plan.mobileExecutionAllowed).toBe(false);
    expect(plan.providerDisabledExecutionAllowed).toBe(false);
    expect(plan.expoExecutionAllowed).toBe(false);
    expect(plan.runtimeSmokeExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(phase9AppRuntimeBuildLocalCommands);
    expect(plan.externalCommands).toBe(phase9AppRuntimeBuildExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(phase9AppRuntimeBuildRequiredExternalEvidence);
    expect(plan.runtimePlan.browserOrDeviceSurfaces).toContain("expo-device-notification-smoke");
    expect(plan.runtimePlan.requiredArtifacts).toBe(phase9RuntimeRequiredArtifacts);
    expect(plan.runtimePlan.requiredArtifacts).toContain("coverage/phase9-booking-to-notification-runtime.json");
    expect(phase9AppRuntimeBuildRequiredExternalEvidence).toEqual([
      "actual Phase 9 runtime/build command output",
      "web build output",
      "dashboard build output",
      "mobile typecheck output",
      "notification/provider route contract output",
      "booking/deposit runtime smoke output",
      "dashboard Playwright templates/messages smoke artifacts",
      "provider-disabled runtime proof",
      "Expo simulator/device notification smoke artifacts",
      "booking-to-notification runtime smoke output",
      "CI Phase 9 app runtime/build artifacts",
      "Phase 9 app runtime/build run evidence packet",
      "secret-safe Phase 9 runtime/build artifact review",
    ]);
  });

  it("keeps the GAP-070 run evidence packet non-executing and provider-disabled proof gated", () => {
    const packet = buildPhase9AppRuntimeBuildRunEvidencePacket();

    expect(packet.packetId).toBe("gap-070-phase9-app-runtime-build-run-evidence");
    expect(packet.requiredArtifact).toBe("coverage/phase9-app-runtime-build-run-evidence-packet.json");
    expect(packet.localRunPersistenceExecutionAllowed).toBe(false);
    expect(packet.providerDisabledEvidenceRequired).toBe(true);
    expect(packet.browserOrDeviceEvidenceRequired).toBe(true);
    expect(packet.bookingToNotificationRuntimeEvidenceRequired).toBe(true);
    expect(packet.ciEvidenceRequired).toBe(true);
    expect(packet.redactionRequired).toBe(true);
    expect(packet.requiredExternalEvidence).toBe(phase9AppRuntimeBuildRequiredExternalEvidence);
    expect(packet.surfaceContract).toBe(phase9AppRuntimeBuildSurfaceContract);
  });

  it("pins Phase 9 runtime/build artifact redaction and review through the runtime", () => {
    const redacted = buildRedactedPhase9RuntimeArtifact({
      providerPayload: "ari@example.test",
      expoPushToken: "expo_push_token_private",
      routeUrl: "https://tenant.example.test/api/public/tenant-a/booking-requests",
      renderedHtml: "<main>private notification body</main>",
      commandOutput: "pnpm build failed with private env context",
      ciArtifactUrl: "https://github.example.test/actions/runs/123/artifacts/456",
      bookingRequestId: "booking_private_123",
      depositSessionId: "deposit_private_123",
      tenantId: "tenant_private_123",
      clientId: "client_private_123",
      messageBody: "private booking-to-notification content",
      publicSummary: "Phase 9 runtime evidence captured",
      nested: {
        devicePhone: "+1 206 555 0100",
        stackTrace: "Error: private stack",
        publicStatus: "provider-disabled",
      },
    });

    expect(redacted).toEqual({
      providerPayload: "[redacted]",
      expoPushToken: "[redacted]",
      routeUrl: "[redacted]",
      renderedHtml: "[redacted]",
      commandOutput: "[redacted]",
      ciArtifactUrl: "[redacted]",
      bookingRequestId: "[redacted]",
      depositSessionId: "[redacted]",
      tenantId: "[redacted]",
      clientId: "[redacted]",
      messageBody: "[redacted]",
      publicSummary: "Phase 9 runtime evidence captured",
      nested: {
        devicePhone: "[redacted]",
        stackTrace: "[redacted]",
        publicStatus: "provider-disabled",
      },
    });

    const review = buildPhase9RuntimeArtifactReview({
      artifacts: [
        {
          artifactPath: "coverage/phase9-app-runtime-build-secret-safe-artifacts.json",
          providerToken: "expo_push_token_private",
          publicSummary: "safe Phase 9 runtime artifact",
        },
      ],
      expectedArtifactPaths: ["coverage/phase9-app-runtime-build-secret-safe-artifacts.json"],
    });

    expect(review.status).toBe("passed");
    expect(review.blockers).toEqual([]);
    expect(review.redactedArtifacts[0]).toMatchObject({
      artifactPath: "coverage/phase9-app-runtime-build-secret-safe-artifacts.json",
      providerToken: "[redacted]",
      publicSummary: "safe Phase 9 runtime artifact",
    });
  });

  it("classifies Phase 9 app runtime/build evidence before GAP-070 can close", () => {
    const blockedDecision = buildPhase9AppRuntimeBuildEvidenceDecision({
      testingTypecheckPassed: true,
      testingTestsPassed: true,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      staticContractPassed: true,
      notificationRoutesPassed: false,
      providerWebhookRoutesPassed: false,
      bookingRouteRuntimeSmokePassed: false,
      depositRouteRuntimeSmokePassed: false,
      dashboardTemplateSmokePassed: false,
      dashboardMessageSmokePassed: false,
      dashboardProviderDisabledPassed: false,
      mobileNotificationScreenPassed: false,
      expoSimulatorSmokePassed: false,
      expoDeviceSmokePassed: false,
      bookingToNotificationRuntimePassed: false,
      providerDisabledRuntimeProofCaptured: false,
      ciEvidenceCaptured: false,
      runEvidencePacketCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/phase9-app-runtime-build-runtime.json",
        "coverage/phase9-testing-package-typecheck.txt",
        "coverage/phase9-testing-package-test.txt",
        "coverage/phase9-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Web build evidence is missing.");
    expect(blockedDecision.blockers).toContain("Dashboard build evidence is missing.");
    expect(blockedDecision.blockers).toContain("Dashboard provider-disabled runtime evidence is missing.");
    expect(blockedDecision.blockers).toContain("Expo device notification smoke evidence is missing.");
    expect(blockedDecision.blockers).toContain("Provider-disabled runtime proof is missing.");
    expect(blockedDecision.blockers).toContain("Phase 9 app runtime/build run evidence packet is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe Phase 9 runtime/build artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/phase9-web-build.log");
    expect(blockedDecision.missingArtifacts).toContain("coverage/phase9-app-runtime-build-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toBe(phase9AppRuntimeBuildRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(phase9AppRuntimeBuildDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 4,
      requiredArtifactCount: phase9AppRuntimeBuildRuntimeArtifactPaths.length,
    });

    const completeDecision = buildPhase9AppRuntimeBuildEvidenceDecision({
      testingTypecheckPassed: true,
      testingTestsPassed: true,
      webBuildPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      staticContractPassed: true,
      notificationRoutesPassed: true,
      providerWebhookRoutesPassed: true,
      bookingRouteRuntimeSmokePassed: true,
      depositRouteRuntimeSmokePassed: true,
      dashboardTemplateSmokePassed: true,
      dashboardMessageSmokePassed: true,
      dashboardProviderDisabledPassed: true,
      mobileNotificationScreenPassed: true,
      expoSimulatorSmokePassed: true,
      expoDeviceSmokePassed: true,
      bookingToNotificationRuntimePassed: true,
      providerDisabledRuntimeProofCaptured: true,
      ciEvidenceCaptured: true,
      runEvidencePacketCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: phase9AppRuntimeBuildRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live browser/device/runtime proof", () => {
    expect(ciWorkflow).toContain("Run Phase 9 app runtime/build runtime contracts");
    expect(ciWorkflow).toContain("phase9-app-runtime-build-runtime-static.test.ts");
    expect(ciWorkflow).toContain("phase9-app-runtime-build-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-phase9-app-runtime-build-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/phase9AppRuntimeBuildRuntime.ts");
    expect(gapTracker).toContain("Phase 9 app runtime/build evidence classifier");
    expect(gapTracker).toContain("phase9AppRuntimeBuildDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildPhase9AppRuntimeBuildExecutionPlan");
    expect(gapTracker).toContain("phase9AppRuntimeBuildExecutionPolicy");
    expect(gapTracker).toContain("phase9AppRuntimeBuildRequiredExternalEvidence");
    expect(gapTracker).toContain("phase9AppRuntimeBuildSurfaceContract");
    expect(gapTracker).toContain("buildPhase9AppRuntimeBuildRunEvidencePacket");
    expect(gapTracker).toContain("buildRedactedPhase9RuntimeArtifact");
    expect(gapTracker).toContain("buildPhase9RuntimeArtifactReview");
    expect(gapTracker).toContain("non-executing Phase 9 runtime/build execution policy");
    expect(gapTracker).toContain("local Phase 9 runtime/build execution plan");
    expect(gapTracker).toContain("GAP-070 is phase9-app-runtime-build-runtime-matrix wired");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("coverage/phase9-app-runtime-build-secret-safe-artifacts.json");
  });

  it("pins current Phase 9 app runtime/build proof files for GAP-070", () => {
    expect(phase9AppRuntimeBuildRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "apps/mobile/package.json",
      "apps/web/package.json",
      "packages/testing/package.json",
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
      "apps/web/lib/phase9AppRuntimeBuild.ts",
      "apps/web/lib/phase9AppRuntimeBuildRuntime.ts",
      "apps/web/tests/phase9-app-runtime-build-static.test.ts",
      "apps/web/tests/phase9-app-runtime-build-runtime-static.test.ts",
      "apps/web/tests/notification-messaging-routes.test.ts",
      "apps/web/tests/provider-webhook-routes.test.ts",
      "apps/web/tests/provider-webhook-contracts.test.ts",
      "apps/web/tests/booking-requests-contract.test.ts",
      "apps/web/tests/payment-routes.test.ts",
      "apps/dashboard/tests/template-read-route-static.test.ts",
      "apps/dashboard/tests/message-read-route-static.test.ts",
      "apps/dashboard/tests/messaging-privacy-static.test.ts",
      "apps/mobile/tests/mobile-push-static.test.ts",
      ".github/workflows/ci.yml",
      "testing/manifests/unit-test-manifest.json",
    ]));
    for (const file of phase9AppRuntimeBuildRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});

