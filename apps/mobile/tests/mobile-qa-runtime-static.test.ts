import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileQaArtifactReview,
  buildMobileQaEvidenceDecision,
  buildMobileQaExecutionPlan,
  buildRedactedMobileQaArtifact,
  mobileQaArtifactPaths,
  mobileQaEvidenceFlags,
  mobileQaExecutionPolicy,
  mobileQaExternalCommands,
  mobileQaLocalCommands,
  mobileQaRequiredExternalEvidence,
  mobileQaRuntimeProofFiles,
  mobileQaRuntimeCommands,
  mobileQaRuntimeMatrix,
  mobileQaRuntimeReadiness,
} from "../src/lib/mobileQaRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile QA runtime contract", () => {
  const mobileSupportPackageJson = readWorkspaceFile("packages/mobile/package.json");
  const mobileSupportSource = readWorkspaceFile("packages/mobile/src/index.ts");
  const mobileSupportTests = readWorkspaceFile("packages/mobile/tests/mobile-support.test.ts");
  const qaSource = readWorkspaceFile("apps/mobile/src/lib/mobileQa.ts");
  const qaStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-qa-static.test.ts");
  const appSource = readWorkspaceFile("apps/mobile/App.tsx");
  const qaManifest = readWorkspaceFile("testing/manifests/mobile-device-qa-checklist.json");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-048 commands, matrix rows, and artifacts", () => {
    expect(mobileQaRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "pnpm --filter @inkroute/mobile ios",
      "pnpm --filter @inkroute/mobile android",
      "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
    ]);
    expect(mobileQaRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "mobile-support-typecheck",
      "mobile-support-tests",
      "mobile-app-typecheck",
      "mobile-static-tests",
      "expo-component-render",
      "ios-screen-smoke",
      "android-screen-smoke",
      "physical-device-smoke",
      "accessibility-pass",
      "offline-reconnect-sync",
      "push-token-delivery",
      "mobile-crash-capture",
      "ota-preview-rollback",
      "manifest-sync",
      "ci-hooks",
      "artifact-retention",
      "secret-safe-artifacts",
    ]);
    expect(mobileQaArtifactPaths).toContain("coverage/mobile-qa-runtime.json");
    expect(mobileQaArtifactPaths).toContain("test-results/mobile-qa-runtime");
  });

  it("keeps package helper, app QA execution mapping, manifest, and App switch wired", () => {
    expect(mobileSupportPackageJson).toContain('"typecheck"');
    expect(mobileSupportPackageJson).toContain('"test"');
    expect(mobileSupportSource).toContain("buildMobileDeviceQaRuntimeReadinessPlan");
    expect(mobileSupportSource).toContain("buildMobileDeviceQaChecklist");
    expect(mobileSupportTests).toContain("buildMobileDeviceQaRuntimeReadinessPlan");
    expect(qaSource).toContain("buildMobileQaExecutionContract");
    expect(qaSource).toContain("buildMobileQaArtifactBundles");
    expect(qaSource).toContain("MobileQaArtifactBundle");
    expect(qaSource).toContain("coverage/mobile-qa-artifacts/${checklistId}.redacted.json");
    expect(qaSource).toContain("mobileScreenRenderContracts");
    expect(qaSource).toContain("Push registration/delivery/tap contract render smoke.");
    expect(qaSource).toContain("provider-receipt");
    expect(qaStaticTest).toContain("maps every registered screen");
    expect(qaStaticTest).toContain("Retain each checklist bundle");
    expect(appSource).toContain("mobileQaExecutionPreview");
    expect(qaManifest).toContain("ios-screen-smoke");
    expect(qaManifest).toContain("ota-preview-rollback");
  });

  it("keeps simulator, physical-device, accessibility, provider, CI, and artifact blockers explicit", () => {
    expect(mobileQaRuntimeReadiness.status).toBe("blocked");
    expect(mobileQaRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileQaRuntimeReadiness.requiredCommands).toBe(mobileQaRuntimeCommands);
    expect(mobileQaRuntimeReadiness.requiredEvidence).toBe(mobileQaEvidenceFlags);
    expect(mobileQaRuntimeReadiness.blockers).toContain("Expo app component/render tests must cover registered screens.");
    expect(mobileQaRuntimeReadiness.blockers).toContain("Physical device smoke must cover auth, API sync, offline, push, crash, and OTA flows.");
    expect(mobileQaRuntimeReadiness.blockers).toContain("Mobile QA artifacts must include simulator screenshots/logs, accessibility notes, provider/device transcripts, and release evidence.");
  });

  it("classifies GAP-048 as blocked until mobile QA device evidence is complete", () => {
    const decision = buildMobileQaEvidenceDecision({
      commands: ["pnpm --filter @inkroute/mobile-support typecheck"],
      artifacts: ["coverage/mobile-qa-runtime.json"],
      evidence: { mobileSupportTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility");
    expect(decision.missingArtifacts).toContain("coverage/mobile-qa-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned mobile QA commands must be run and captured.");
  });

  it("classifies GAP-048 as complete when all mobile QA commands, artifacts, and evidence are present", () => {
    const decision = buildMobileQaEvidenceDecision({
      commands: mobileQaRuntimeCommands,
      artifacts: mobileQaArtifactPaths,
      evidence: Object.fromEntries(mobileQaEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-048 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobileQaExecutionPlan();

    expect(plan.policy).toBe(mobileQaExecutionPolicy);
    expect(plan.localCommands).toBe(mobileQaLocalCommands);
    expect(plan.externalCommands).toBe(mobileQaExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(mobileQaRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobileQaReadiness).toBe(true);
    expect(plan.policy.componentRenderRequiredForClosure).toBe(true);
    expect(plan.policy.simulatorSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.physicalDeviceRequiredForClosure).toBe(true);
    expect(plan.policy.accessibilityRequiredForClosure).toBe(true);
    expect(plan.policy.providerQaRequiredForClosure).toBe(true);
    expect(plan.policy.artifactRetentionRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.expoRenderExecutionAllowed).toBe(false);
    expect(plan.simulatorExecutionAllowed).toBe(false);
    expect(plan.physicalDeviceExecutionAllowed).toBe(false);
    expect(plan.accessibilityExecutionAllowed).toBe(false);
    expect(plan.providerQaExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toContain("pnpm --filter @inkroute/mobile-support typecheck");
    expect(plan.externalCommands).toContain("manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility");
    expect(plan.requiredExternalEvidence).toBe(mobileQaRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile QA artifact review");
  });

  it("redacts GAP-048 mobile QA artifacts before secret-safe review", () => {
    const artifact = {
      deviceId: "device_private",
      simulatorScreenshotUrl: "https://private/screenshot.png",
      providerTranscriptToken: "provider_private",
      clientPhone: "555-0100",
      nested: {
        otaReceiptId: "receipt_private",
        publicSummary: "mobile QA evidence captured",
      },
      safeNote:
        "evidence_mobile_qa_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/mobile-qa/private-proof.json",
      safeQaPath: "test-results/mobile-qa-runtime/private-device-qa.json",
      safeDeviceRun: "device_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedMobileQaArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "deviceId",
      "simulatorScreenshotUrl",
      "providerTranscriptToken",
      "clientPhone",
      "nested.otaReceiptId",
      "safeNote",
      "safeQaPath",
      "safeDeviceRun",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      deviceId: "[REDACTED]",
      simulatorScreenshotUrl: "[REDACTED]",
      providerTranscriptToken: "[REDACTED]",
      clientPhone: "[REDACTED]",
      nested: {
        otaReceiptId: "[REDACTED]",
        publicSummary: "mobile QA evidence captured",
      },
      safeQaPath: "[REDACTED]",
      safeDeviceRun: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_mobile_qa_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/mobile-qa/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/mobile-qa-runtime/private-device-qa.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "device_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildMobileQaArtifactReview({
      publicSummary: "safe mobile QA evidence",
      accessibilityVideoUrl: "https://private/video.mov",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["accessibilityVideoUrl"]);
    expect(review.requiredExternalEvidence).toBe(mobileQaRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("retained artifact links by checklist id");
  });

  it("pins current mobile QA proof files for GAP-048", () => {
    expect(mobileQaRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/mobile/package.json",
      "packages/mobile/src/index.ts",
      "packages/mobile/tests/mobile-support.test.ts",
      "apps/mobile/src/lib/mobileQa.ts",
      "apps/mobile/src/lib/mobileQaRuntime.ts",
      "apps/mobile/tests/mobile-render-contract.test.ts",
      "apps/mobile/tests/mobile-qa-static.test.ts",
      "apps/mobile/tests/mobile-qa-runtime-static.test.ts",
      "apps/mobile/App.tsx",
      "testing/manifests/mobile-device-qa-checklist.json",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of mobileQaRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming simulator/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile QA runtime contracts");
    expect(ciWorkflow).toContain("mobile-qa-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-qa-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-qa-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileQaRuntime.ts");
    expect(gapTracker).toContain("apps/mobile/tests/mobile-render-contract.test.ts");
    expect(gapTracker).toContain("GAP-048 is mobile-qa-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobileQaExecutionPlan");
    expect(gapTracker).toContain("mobileQaExecutionPolicy");
    expect(gapTracker).toContain("mobileQaLocalCommands/mobileQaExternalCommands");
    expect(gapTracker).toContain("mobileQaRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedMobileQaArtifact");
    expect(gapTracker).toContain("buildMobileQaArtifactReview");
    expect(mobileQaArtifactPaths).toContain("coverage/mobile-qa-secret-safe-artifacts.json");
  });
});

