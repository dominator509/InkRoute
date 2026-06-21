import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedMobileTestingArtifact,
  buildMobileTestingArtifactReview,
  buildMobileTestingExecutionEvidenceDecision,
  buildMobileTestingExecutionPlan,
  buildMobileTestingRunData,
  buildMobileTestingRunPersistenceContract,
  mobileTestingExecutionArtifactPaths,
  mobileTestingExecutionChecklistIds,
  mobileTestingExecutionCommands,
  mobileTestingExecutionExternalArtifacts,
  mobileTestingExecutionExternalCommands,
  mobileTestingExecutionLocalArtifacts,
  mobileTestingExecutionLocalCommands,
  mobileTestingExecutionMatrix,
  mobileTestingExecutionPolicy,
  mobileTestingExecutionProofFiles,
  mobileTestingExecutionReadiness,
  mobileTestingExecutionRequiredExternalEvidence,
  mobileTestingRunPersistencePreview,
  persistMobileTestingRun
} from "../src/mobile-testing-execution";

const root = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const mobilePackage = read("apps/mobile/package.json");
const mobileSupportPackage = read("packages/mobile/package.json");
const qaChecklist = read("testing/manifests/mobile-device-qa-checklist.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-108 mobile testing execution wiring", () => {
  it("pins mobile execution commands, checklist ids, matrix entries, and artifact paths", () => {
    expect(mobileTestingExecutionCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "eas build --profile preview --platform all",
      "eas update --channel preview",
      "eas update --channel preview --message rollback-republish-drill --non-interactive",
      "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
      "GitHub Actions mobile testing execution job"
    ]);
    expect(mobileTestingExecutionChecklistIds).toEqual([
      "mobile-static-screen-registry",
      "ios-screen-smoke",
      "android-screen-smoke",
      "biometric-lock-unlock",
      "tenant-api-sync",
      "offline-reconnect-sync",
      "push-token-delivery",
      "mobile-crash-capture",
      "ota-preview-rollback",
      "mobile-accessibility-pass"
    ]);
    expect(mobileTestingExecutionMatrix.map((entry) => entry.id)).toEqual([
      "support-package-static",
      "mobile-app-static",
      "expo-runtime",
      "ios-simulator-smoke",
      "android-emulator-smoke",
      "physical-device-checklist",
      "provider-device-qa",
      "eas-preview-update-rollback",
      "ci-mobile-artifacts"
    ]);
    expect(mobileTestingExecutionArtifactPaths).toContain("coverage/mobile-eas-update-rollback-redacted.json");
    expect(mobileTestingExecutionArtifactPaths).toContain("test-results/mobile-testing-execution");
  });

  it("keeps package scripts and manifest verifier wired for mobile support and app tests", () => {
    for (const script of ["typecheck", "test"]) {
      expect(mobileSupportPackage).toContain(`"${script}"`);
    }
    for (const script of ["typecheck", "test", "ios", "android"]) {
      expect(mobilePackage).toContain(`"${script}"`);
    }
    expect(manifestVerifier).toContain("testing/manifests/mobile-device-qa-checklist.json");
    expect(manifestVerifier).toContain("apps/mobile/tests/mobile-static.test.ts");
    expect(manifestVerifier).toContain("apps/mobile/tests/mobile-security-static.test.ts");
    expect(manifestVerifier).toContain("packages/mobile/tests/mobile-support.test.ts");
  });

  it("keeps the generated mobile device QA checklist aligned to GAP-108 execution requirements", () => {
    for (const checklistId of mobileTestingExecutionChecklistIds) {
      expect(qaChecklist).toContain(checklistId);
    }
    expect(qaChecklist).toContain("GAP-108");
    expect(qaChecklist).toContain("pnpm --filter @inkroute/mobile ios");
    expect(qaChecklist).toContain("pnpm --filter @inkroute/mobile android");
    expect(qaChecklist).toContain("manual airplane-mode queue/reconnect QA");
    expect(qaChecklist).toContain("eas update --channel preview --message rollback-republish-drill --non-interactive");
  });

  it("keeps execution readiness blocked until real Expo, device, provider, OTA, artifact, and CI evidence exists", () => {
    expect(mobileTestingExecutionReadiness.status).toBe("blocked");
    expect(mobileTestingExecutionReadiness.missingScripts).toEqual([]);
    expect(mobileTestingExecutionReadiness.requiredCommands).toBe(mobileTestingExecutionCommands);
    expect(mobileTestingExecutionReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Expo dependency install, runtime start, mobile typecheck, and static/security test output",
        "iOS simulator, Android emulator, and physical device screen-smoke evidence",
        "biometric, tenant API sync, offline reconnect, and push QA transcripts",
        "crash capture, EAS preview/update rollback, and accessibility QA evidence",
        "synced mobile QA checklist, retained artifacts, and CI/mobile check evidence"
      ])
    );
    expect(mobileTestingExecutionReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Expo dependencies must install before mobile runtime testing.",
        "Expo runtime must start for simulator and device QA.",
        "Offline reconnect QA must prove encrypted queue persistence, idempotent replay, retry, and conflict handling.",
        "EAS update rollback QA must prove preview adoption and rollback republish on the same runtime."
      ])
    );
  });

  it("pins current mobile testing execution proof files for GAP-108", () => {
    expect(mobileTestingExecutionProofFiles).toEqual(
      expect.arrayContaining([
        "packages/mobile/src/mobile-testing-execution.ts",
        "packages/mobile/tests/mobile-testing-execution-static.test.ts",
        "apps/mobile/package.json",
        "testing/manifests/mobile-device-qa-checklist.json",
        "packages/db/prisma/migrations/20260609011000_add_mobile_testing_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of mobileTestingExecutionProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable MobileTestingRun rows, checklist ids, device/provider QA flags, EAS rollback, artifacts, and CI evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildMobileTestingRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "mobile-testing-demo",
      commitSha: "abc1234",
      status: "device_gated",
      executionMatrix: mobileTestingExecutionMatrix,
      checklistIds: mobileTestingExecutionChecklistIds,
      artifactManifest: mobileTestingExecutionArtifactPaths,
      mobileSupportTypecheckPassed: false,
      mobileSupportTestsPassed: false,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: false,
      expoDependenciesInstalled: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceChecklistCompleted: false,
      biometricQaPassed: false,
      tenantApiSyncQaPassed: false,
      offlineReconnectQaPassed: false,
      pushDeliveryQaPassed: false,
      crashCaptureQaPassed: false,
      easPreviewBuildPassed: false,
      easUpdateRollbackPassed: false,
      accessibilityQaPassed: false,
      ciMobileChecksPassed: false,
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model MobileTestingRun");
    expect(schema).toContain("executionMatrix");
    expect(schema).toContain("easUpdateRollbackPassed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["MobileTestingRun", "AuditLog"]);
    expect(contract.requiredMobileFlags).toContain("offlineReconnectQaPassed");
    expect(contract.artifactFields).toContain("checklistIds");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(mobileTestingRunPersistencePreview.modelName).toBe("MobileTestingRun");
    const runData = buildMobileTestingRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "mobile-testing-demo",
      status: "device_gated",
      offlineReconnectQaPassed: false,
      easUpdateRollbackPassed: false,
    });
    expect(persistMobileTestingRun).toBeTypeOf("function");
    expect(String(persistMobileTestingRun)).toContain("repository.mobileTestingRun.upsert");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 mobile testing execution contracts");
    expect(ciWorkflow).toContain("packages/mobile/tests/mobile-testing-execution-static.test.ts");
    expect(ciWorkflow).toContain("mobile-testing-execution-artifacts");
    expect(ciWorkflow).toContain("coverage/mobile-testing-execution.json");
    expect(ciWorkflow).toContain("test-results/mobile-testing-execution");
    expect(unitManifest).toContain("unit-mobile-testing-execution-static");
    expect(unitManifest).toContain("MobileTestingRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("packages/mobile/src/mobile-testing-execution.ts");
    expect(gapTracker).toContain("Mobile testing evidence classifier wired and Expo/device proof gated");
    expect(gapTracker).toContain("GAP-108 is mobile-testing-execution-matrix wired with evidence classifier");
    expect(gapTracker).toContain("persistMobileTestingRun upsert seam");
  });

  it("classifies GAP-108 evidence as blocked until Expo, device, provider, OTA, accessibility, and CI proof is captured", () => {
    const blockedDecision = buildMobileTestingExecutionEvidenceDecision({
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: true,
      expoDependenciesInstalled: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceChecklistCompleted: false,
      biometricQaPassed: false,
      tenantApiSyncQaPassed: false,
      offlineReconnectQaPassed: false,
      pushDeliveryQaPassed: false,
      crashCaptureQaPassed: false,
      easPreviewBuildPassed: false,
      easUpdateRollbackPassed: false,
      accessibilityQaPassed: false,
      ciMobileChecksPassed: false,
      requiredCommandsRun: mobileTestingExecutionCommands.filter(
        (command) =>
          command !== "pnpm --filter @inkroute/mobile ios" &&
          command !== "pnpm --filter @inkroute/mobile android" &&
          command !== "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
      ),
      capturedArtifacts: [
        "coverage/mobile-testing-execution.json",
        "coverage/mobile-support-typecheck.log",
        "coverage/mobile-support-test-results.json",
        "coverage/mobile-static-test-results.json",
        "test-results/mobile-testing-execution"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run mobile app typecheck.",
        "Install Expo mobile dependencies.",
        "Start Expo runtime.",
        "Run iOS simulator smoke.",
        "Run Android emulator smoke.",
        "Complete physical-device QA checklist.",
        "Capture offline reconnect QA proof.",
        "Run EAS preview build.",
        "Capture EAS update rollback proof.",
        "Capture CI mobile checks proof.",
        "Required command not recorded: pnpm --filter @inkroute/mobile ios",
        "Required command not recorded: pnpm --filter @inkroute/mobile android",
        "Required command not recorded: manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/mobile-expo-install.log",
        "coverage/mobile-expo-runtime.log",
        "coverage/mobile-ios-simulator-smoke.json",
        "coverage/mobile-android-emulator-smoke.json",
        "coverage/mobile-eas-update-rollback-redacted.json",
        "coverage/mobile-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.mobilePolicy).toEqual({
      physicalDeviceQaRequired: true,
      providerTranscriptsRedacted: true,
      easRollbackProofRequired: true,
    });

    const completeDecision = buildMobileTestingExecutionEvidenceDecision({
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: true,
      mobileStaticTestsPassed: true,
      expoDependenciesInstalled: true,
      expoRuntimeStarted: true,
      iosSimulatorSmokePassed: true,
      androidEmulatorSmokePassed: true,
      physicalDeviceChecklistCompleted: true,
      biometricQaPassed: true,
      tenantApiSyncQaPassed: true,
      offlineReconnectQaPassed: true,
      pushDeliveryQaPassed: true,
      crashCaptureQaPassed: true,
      easPreviewBuildPassed: true,
      easUpdateRollbackPassed: true,
      accessibilityQaPassed: true,
      ciMobileChecksPassed: true,
      requiredCommandsRun: mobileTestingExecutionCommands,
      capturedArtifacts: mobileTestingExecutionArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(mobileTestingExecutionCommands);
    expect(completeDecision.requiredEvidence).toBe(mobileTestingExecutionArtifactPaths);
  });

  it("keeps GAP-108 Expo, device, provider, EAS, CI, and persistence execution disabled in the local plan", () => {
    const plan = buildMobileTestingExecutionPlan();

    expect(plan.expoRuntimeExecutionAllowed).toBe(false);
    expect(plan.simulatorExecutionAllowed).toBe(false);
    expect(plan.physicalDeviceExecutionAllowed).toBe(false);
    expect(plan.providerQaExecutionAllowed).toBe(false);
    expect(plan.easExecutionAllowed).toBe(false);
    expect(plan.ciMobileExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(mobileTestingExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(mobileTestingExecutionRequiredExternalEvidence);
    expect(mobileTestingExecutionPolicy.externalEvidenceRequired).toBe(mobileTestingExecutionRequiredExternalEvidence);
    expect(mobileTestingExecutionRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Expo dependency install and runtime startup proof",
      "iOS simulator and Android emulator smoke proof",
      "Physical-device QA checklist proof",
      "EAS preview build and rollback proof",
      "Provider-backed MobileTestingRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(mobileTestingExecutionLocalCommands);
    expect(plan.externalCommands).toBe(mobileTestingExecutionExternalCommands);
    expect(plan.localArtifacts).toBe(mobileTestingExecutionLocalArtifacts);
    expect(plan.externalArtifacts).toBe(mobileTestingExecutionExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/mobile-expo-install.log",
      "coverage/mobile-ios-simulator-smoke.json",
      "coverage/mobile-android-emulator-smoke.json",
      "coverage/mobile-physical-device-checklist.json",
      "coverage/mobile-eas-update-rollback-redacted.json",
      "coverage/mobile-ci-run-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("EAS preview build and rollback proof require Expo/EAS provider execution.");
  });

  it("redacts GAP-108 mobile device, provider, Expo, EAS, push, crash, and CI artifacts before review", () => {
    const rawArtifact = {
      runId: "mobile-testing-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      deviceId: "ios-device-secret",
      pushToken: "expo-push-token-secret",
      expoToken: "expo-secret-token",
      easToken: "eas-secret-token",
      apiTranscript: "synced client@example.com +1 555 303 4040",
      crashPayload: { rawBody: "{\"email\":\"client@example.com\",\"token\":\"crash-token\"}" },
      headers: ["Authorization: Bearer mobile-secret-token"],
      stack: "Error: mobile QA failed",
    };

    const redacted = buildRedactedMobileTestingArtifact(rawArtifact);
    const review = buildMobileTestingArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("mobile-testing-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("ios-device-secret");
    expect(serialized).not.toContain("expo-push-token-secret");
    expect(serialized).not.toContain("expo-secret-token");
    expect(serialized).not.toContain("eas-secret-token");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 303 4040");
    expect(serialized).not.toContain("mobile-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(mobileTestingExecutionArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Physical-device QA checklist proof",
      "EAS preview build and rollback proof",
      "Provider-backed MobileTestingRun persistence proof",
    ]));
  });
});


