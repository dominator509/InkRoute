import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildMobileLaunchArtifactReview,
  buildMobileLaunchDecisionRequiredEvidence,
  buildMobileLaunchEvidenceDecision,
  buildMobileLaunchExecutionPlan,
  buildMobileLaunchRunData,
  buildRedactedMobileLaunchArtifact,
  mobileLaunchArtifactPaths,
  mobileLaunchExecutionPolicy,
  mobileLaunchReadinessAreas,
  mobileLaunchRunPersistenceContract,
  mobileLaunchRequiredEvidence,
  mobileLaunchRequiredExternalEvidence,
  mobileLaunchRuntimeExternalArtifacts,
  mobileLaunchRuntimeExternalCommands,
  mobileLaunchRuntimeLocalArtifacts,
  mobileLaunchRuntimeLocalCommands,
  mobileLaunchRuntimeCommands,
  mobileLaunchRuntimeMatrix,
  mobileLaunchRuntimeReadiness,
  mobileLaunchRuntimeProofFiles,
  persistMobileLaunchRun,
} from "../lib/mobileLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile launch runtime contract", () => {
  const mobilePackageJson = readRepoFile("apps/mobile/package.json");
  const appJson = readRepoFile("apps/mobile/app.json");
  const easJson = readRepoFile("apps/mobile/eas.json");
  const mobileSource = readRepoFile("packages/mobile/src/index.ts");
  const mobileTests = readRepoFile("packages/mobile/tests/mobile-support.test.ts");
  const qaChecklist = readRepoFile("testing/manifests/mobile-device-qa-checklist.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const mobileLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033200_add_mobile_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins mobile launch commands, readiness areas, matrix rows, and artifacts", () => {
    expect(mobileLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
      "GitHub Actions mobile launch evidence job",
    ]);
    expect(mobileLaunchReadinessAreas).toContain("encrypted-offline-store-qa");
    expect(mobileLaunchReadinessAreas).toContain("secret-safe-artifacts");
    expect(mobileLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "mobile-support-typecheck",
      "mobile-support-tests",
      "mobile-app-typecheck",
      "mobile-app-tests",
      "expo-runtime",
      "ios-android-smoke",
      "eas-preview-build-update",
      "auth-api-push-offline-qa",
      "upload-crash-ota-qa",
      "physical-device-accessibility-qa",
      "ci-secret-safe-artifacts",
    ]);
    expect(mobileLaunchArtifactPaths).toContain("coverage/mobile-launch-runtime.json");
    expect(mobileLaunchArtifactPaths).toContain("test-results/mobile-launch-runtime");
  });

  it("pins the MobileLaunchRun persistence model and migration", () => {
    const runData = buildMobileLaunchRunData({
      tenantId: "tenant_static",
      runId: "mobile_static",
      commitSha: "abc123",
      status: "blocked",
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: false,
      mobileAppTestsPassed: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      easPreviewBuildPassed: false,
      easPreviewUpdatePassed: false,
      authSessionBiometricQaPassed: false,
      tenantApiClientQaPassed: false,
      pushNotificationQaPassed: false,
      encryptedOfflineStoreQaPassed: false,
      uploadFlowQaPassed: false,
      crashReportingQaPassed: false,
      otaUpdateRollbackQaPassed: false,
      physicalDeviceQaCompleted: false,
      accessibilityQaPassed: false,
      appJsonProjectConfigured: true,
      easChannelsConfigured: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
      mobileLaunchRunPersisted: false,
      coveredReadinessAreas: ["mobile-support-typecheck-test", "app-json-project-config"],
      capturedArtifacts: [
        "coverage/mobile-launch-runtime.json",
        "coverage/mobile-support-typecheck.txt",
        "coverage/mobile-support-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/mobile-support typecheck",
        "pnpm --filter @inkroute/mobile-support test",
      ],
      mobileSupportTypecheckArtifactPath: "coverage/mobile-support-typecheck.txt",
      mobileSupportTestArtifactPath: "coverage/mobile-support-test.txt",
    });

    expect(mobileLaunchRunPersistenceContract.model).toBe("MobileLaunchRun");
    expect(mobileLaunchRunPersistenceContract.tenantRelation).toBe("mobileLaunchRuns");
    expect(mobileLaunchRunPersistenceContract.migration).toBe("20260609033200_add_mobile_launch_runs");
    expect(mobileLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "deviceQaManifest",
      "providerQaManifest",
      "easRuntimeManifest",
    ]);
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("expoRuntimeStarted");
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("physicalDeviceQaCompleted");
    expect(mobileLaunchRunPersistenceContract.evidenceBooleans).toContain("launchArtifactsSecretSafe");
    expect(mobileLaunchRunPersistenceContract.artifactFields).toContain("easPreviewBuildArtifactPath");
    expect(mobileLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("mobileLaunchRuns MobileLaunchRun[]");
    expect(prismaSchema).toContain("model MobileLaunchRun");
    expect(prismaSchema).toContain("deviceQaManifest");
    expect(prismaSchema).toContain("encryptedOfflineStoreQaPassed");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(mobileLaunchMigration).toContain('CREATE TABLE "MobileLaunchRun"');
    expect(mobileLaunchMigration).toContain('"deviceQaManifest" JSONB NOT NULL');
    expect(mobileLaunchMigration).toContain('"launchArtifactsSecretSafe" BOOLEAN NOT NULL DEFAULT false');
    expect(mobileLaunchMigration).toContain('CREATE UNIQUE INDEX "MobileLaunchRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "mobile_static",
      commitSha: "abc123",
      status: "blocked",
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: false,
      appJsonProjectConfigured: true,
      mobileSupportTypecheckArtifactPath: "coverage/mobile-support-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(mobileLaunchRuntimeMatrix);
    expect(runData.readinessAreaManifest).toEqual(["mobile-support-typecheck-test", "app-json-project-config"]);
    expect(runData.easRuntimeManifest.appJsonProjectConfigured).toBe(true);
    expect(String(persistMobileLaunchRun)).toContain("repository.mobileLaunchRun.upsert");
  });

  it("keeps mobile package scripts, Expo config, EAS config, helper tests, and QA checklist wired", () => {
    expect(mobilePackageJson).toContain('"typecheck"');
    expect(mobilePackageJson).toContain('"test"');
    expect(mobilePackageJson).toContain('"ios"');
    expect(mobilePackageJson).toContain('"android"');
    expect(appJson).toContain("expo");
    expect(easJson).toContain("preview");
    expect(mobileSource).toContain("buildMobileLaunchEvidencePlan");
    expect(mobileTests).toContain("buildMobileLaunchEvidencePlan");
    expect(qaChecklist).toContain("physical");
  });

  it("keeps mobile launch blockers explicit until Expo/device/provider evidence exists", () => {
    expect(mobileLaunchRuntimeReadiness.status).toBe("blocked");
    expect(mobileLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileLaunchRuntimeReadiness.requiredCommands).toBe(mobileLaunchRuntimeCommands);
    expect(mobileLaunchRuntimeReadiness.requiredEvidence).toBe(mobileLaunchRequiredEvidence);
    expect(mobileLaunchRuntimeReadiness.blockers).toContain("Expo runtime must start locally or from a preview build.");
    expect(mobileLaunchRuntimeReadiness.blockers).toContain("Physical device QA checklist must be completed.");
  });

  it("blocks mobile launch closure until Expo, device, EAS, provider QA, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildMobileLaunchEvidenceDecision({
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: false,
      mobileAppTestsPassed: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      easPreviewBuildPassed: false,
      easPreviewUpdatePassed: false,
      authSessionBiometricQaPassed: false,
      tenantApiClientQaPassed: false,
      pushNotificationQaPassed: false,
      encryptedOfflineStoreQaPassed: false,
      uploadFlowQaPassed: false,
      crashReportingQaPassed: false,
      otaUpdateRollbackQaPassed: false,
      physicalDeviceQaCompleted: false,
      accessibilityQaPassed: false,
      appJsonProjectConfigured: true,
      easChannelsConfigured: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
      mobileLaunchRunPersisted: false,
      coveredReadinessAreas: ["mobile-support-typecheck-test", "app-json-project-config"],
      capturedArtifacts: [
        "coverage/mobile-launch-runtime.json",
        "coverage/mobile-support-typecheck.txt",
        "coverage/mobile-support-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/mobile-support typecheck",
        "pnpm --filter @inkroute/mobile-support test",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReadinessAreas).toEqual([
      "mobile-app-typecheck-test",
      "expo-runtime-start",
      "ios-simulator-smoke",
      "android-emulator-smoke",
      "eas-preview-build",
      "auth-session-biometric-qa",
      "tenant-api-client-qa",
      "push-notification-qa",
      "encrypted-offline-store-qa",
      "upload-flow-qa",
      "crash-reporting-qa",
      "ota-update-rollback-qa",
      "physical-device-qa",
      "accessibility-qa",
      "eas-channels-runtime-policy",
      "ci-evidence",
      "secret-safe-artifacts",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/mobile-app-typecheck.txt",
      "coverage/mobile-app-test.txt",
      "coverage/mobile-expo-runtime.json",
      "coverage/mobile-ios-simulator-smoke.json",
      "coverage/mobile-android-emulator-smoke.json",
      "coverage/mobile-eas-preview-build.json",
      "coverage/mobile-eas-preview-update.json",
      "coverage/mobile-auth-api-push-offline-qa.json",
      "coverage/mobile-upload-crash-ota-qa.json",
      "coverage/mobile-physical-device-qa.json",
      "coverage/mobile-accessibility-qa.json",
      "coverage/mobile-ci-evidence.json",
      "coverage/mobile-secret-safe-artifacts.json",
      "test-results/mobile-launch-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
      "GitHub Actions mobile launch evidence job",
    ]);
    expect(decision.requiredReadinessAreas).toBe(mobileLaunchReadinessAreas);
    expect(decision.requiredArtifacts).toBe(mobileLaunchArtifactPaths);
    expect(decision.requiredCommands).toBe(mobileLaunchRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildMobileLaunchDecisionRequiredEvidence(mobileLaunchRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(mobileLaunchRequiredEvidence);
    expect(decision.blockers).toContain("Expo runtime must start locally or from a preview build.");
    expect(decision.blockers).toContain("MobileLaunchRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required mobile launch readiness area must be covered.");
  });

  it("completes mobile launch closure when Expo, device, EAS, provider QA, CI, persistence, artifacts, areas, and commands are proven", () => {
    const decision = buildMobileLaunchEvidenceDecision({
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: true,
      mobileAppTestsPassed: true,
      expoRuntimeStarted: true,
      iosSimulatorSmokePassed: true,
      androidEmulatorSmokePassed: true,
      easPreviewBuildPassed: true,
      easPreviewUpdatePassed: true,
      authSessionBiometricQaPassed: true,
      tenantApiClientQaPassed: true,
      pushNotificationQaPassed: true,
      encryptedOfflineStoreQaPassed: true,
      uploadFlowQaPassed: true,
      crashReportingQaPassed: true,
      otaUpdateRollbackQaPassed: true,
      physicalDeviceQaCompleted: true,
      accessibilityQaPassed: true,
      appJsonProjectConfigured: true,
      easChannelsConfigured: true,
      ciEvidenceCaptured: true,
      launchArtifactsSecretSafe: true,
      mobileLaunchRunPersisted: true,
      coveredReadinessAreas: mobileLaunchReadinessAreas,
      capturedArtifacts: mobileLaunchArtifactPaths,
      completedCommands: mobileLaunchRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming mobile launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile launch runtime contracts");
    expect(ciWorkflow).toContain("mobile-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-mobile-launch-runtime-static");
    expect(unitManifest).toContain("MobileLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("MobileLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/mobileLaunchRuntime.ts");
    expect(gapTracker).toContain("buildMobileLaunchDecisionRequiredEvidence");
    expect(gapTracker).toContain("mobileLaunchRequiredEvidence");
    expect(gapTracker).toContain("mobileLaunchRuntimeLocalArtifacts");
    expect(gapTracker).toContain("mobileLaunchRuntimeExternalArtifacts");
    expect(gapTracker).toContain("persistMobileLaunchRun upsert seam");
    expect(gapTracker).toContain("live mobile-support/app typecheck/tests, Expo runtime, iOS/Android smoke, EAS preview/update, auth/API/push/offline/upload/crash/OTA/accessibility QA, physical-device QA, CI evidence, provider-backed persistMobileLaunchRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-008 is mobile-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current mobile launch proof files for GAP-008", () => {
    expect(mobileLaunchRuntimeProofFiles).toContain("apps/mobile/package.json");
    expect(mobileLaunchRuntimeProofFiles).toContain("apps/web/lib/mobileLaunchRuntime.ts");
    expect(mobileLaunchRuntimeProofFiles).toContain("apps/web/tests/mobile-launch-runtime-static.test.ts");
    for (const proofFile of mobileLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-008 execution policy non-executing while separating mobile device and EAS proof", () => {
    const plan = buildMobileLaunchExecutionPlan();

    expect(plan.localCommands).toBe(mobileLaunchRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(mobileLaunchRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(mobileLaunchRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(mobileLaunchRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/mobile-support-test.txt");
    expect(plan.externalArtifacts).toContain("coverage/mobile-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/mobile-launch-runtime");
    expect(plan.executionPolicy).toBe(mobileLaunchExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(mobileLaunchRequiredExternalEvidence);
    expect(plan).toMatchObject({
      mobileSupportTypecheckExecutionAllowed: false,
      mobileSupportTestExecutionAllowed: false,
      mobileAppTypecheckExecutionAllowed: false,
      mobileAppTestExecutionAllowed: false,
      expoRuntimeExecutionAllowed: false,
      iosSmokeExecutionAllowed: false,
      androidSmokeExecutionAllowed: false,
      easPreviewBuildExecutionAllowed: false,
      easPreviewUpdateExecutionAllowed: false,
      manualDeviceQaExecutionAllowed: false,
      ciMobileEvidenceExecutionAllowed: false,
      providerBackedPersistenceExecutionAllowed: false,
      executionPolicy: {
        codexMayClassifyStaticMobileReadiness: true,
        expoRuntimeEvidenceRequiredForClosure: true,
        deviceQaEvidenceRequiredForClosure: true,
        easEvidenceRequiredForClosure: true,
        providerQaEvidenceRequiredForClosure: true,
        providerDatabaseRequiredForPersistence: true,
        secretSafeArtifactsRequiredForClosure: true,
      },
    });
    expect(plan.requiredExternalEvidence).toContain(
      "EAS preview build, EAS preview update, runtimeVersion/channel policy, and OTA rollback evidence.",
    );
    expect(plan.requiredExternalEvidence).toContain(
      "Secret-safe mobile launch artifacts with no credentials, push tokens, device identifiers, client-private data, or raw tenant identifiers.",
    );
  });

  it("redacts mobile launch artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "mobile_launch_01HZYXZYXZYXZYXZYXZYXZYXZ",
      expoPushToken: "ExpoPushToken[1234567890abcdefghijklmnop]",
      deviceId: "device_01HZYXZYXZYXZYXZYXZYXZYXZ",
      sessionToken: "github_pat_1234567890ABCDEFGHIJKLMNOP",
      qaLog: "client@example.com tested on +1 (555) 867-5309",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      screenshotPath: "artifacts/mobile/private-screenshot.png",
      videoPath: "artifacts/mobile/private-video.mp4",
      otaRollbackLog: "rollback private_update_123",
      apiTranscript: "tenant_private_123 synced private client payload",
      easBuildTranscript: "EAS build eas_build_01HZYXZYXZYXZYXZYXZYXZYXZ installed on device_01HZYXZYXZYXZYXZYXZYXZYXZ",
      otaUpdateTranscript: "OTA update ota_update_01HZYXZYXZYXZYXZYXZYXZYXZ rolled back for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      routeQaTranscript: "GET /api/mobile/bookings returned booking_01HZYXZYXZYXZYXZYXZYXZYXZ for client_01HZYXZYXZYXZYXZYXZYXZYXZ",
      commandOutput: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ passed mobile:e2e",
      offlineSyncPayload: { sessionId: "session_private_123" },
      crashPayload: { nativeStack: "private native stack" },
      accessibilityNotes: "screen reader captured private client name",
      repository: "repo:dominator509/InkRoute",
      branch: "branch:production/mobile-launch",
      pullRequest: "pr_mobile_launch",
      reviewer: "reviewer_mobile_owner",
      codeowner: "CODEOWNER:mobile-platform-team",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
    };

    expect(buildRedactedMobileLaunchArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      expoPushToken: "[REDACTED]",
      deviceId: "[REDACTED]",
      sessionToken: "[REDACTED]",
      qaLog: "[REDACTED] tested on [REDACTED]",
      ciRunUrl: "[REDACTED]",
      screenshotPath: "[REDACTED]",
      videoPath: "[REDACTED]",
      otaRollbackLog: "[REDACTED]",
      apiTranscript: "[REDACTED]",
      easBuildTranscript: "EAS build [REDACTED] installed on [REDACTED]",
      otaUpdateTranscript: "OTA update [REDACTED] rolled back for [REDACTED]",
      routeQaTranscript: "GET /api/mobile/bookings returned [REDACTED] for [REDACTED]",
      commandOutput: "workflow [REDACTED] passed mobile:e2e",
      offlineSyncPayload: "[REDACTED]",
      crashPayload: "[REDACTED]",
      accessibilityNotes: "[REDACTED]",
      repository: "[REDACTED]",
      branch: "[REDACTED]",
      pullRequest: "[REDACTED]",
      reviewer: "[REDACTED]",
      codeowner: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
    });

    const review = buildMobileLaunchArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(mobileLaunchRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "expoPushToken",
        "deviceId",
        "sessionToken",
        "qaLog",
        "ciRunUrl",
        "screenshotPath",
        "videoPath",
        "otaRollbackLog",
        "apiTranscript",
        "easBuildTranscript",
        "otaUpdateTranscript",
        "routeQaTranscript",
        "commandOutput",
        "offlineSyncPayload",
        "crashPayload",
        "accessibilityNotes",
        "repository",
        "branch",
        "pullRequest",
        "reviewer",
        "codeowner",
        "persistence.tenantId",
        "persistence.databaseUrl",
      ]),
    );
    expect(JSON.stringify(review.artifact)).not.toContain("repo:dominator509/InkRoute");
    expect(JSON.stringify(review.artifact)).not.toContain("pr_mobile_launch");
    expect(JSON.stringify(review.artifact)).not.toContain("CODEOWNER:mobile-platform-team");
    expect(JSON.stringify(review.artifact)).not.toContain("eas_build_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("ota_update_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("booking_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(review.requiredExternalEvidence).toContain(
      "Provider-backed MobileLaunchRun persistence row captured from the target database.",
    );
  });
});



