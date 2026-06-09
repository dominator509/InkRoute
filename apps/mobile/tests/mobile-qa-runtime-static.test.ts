import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobileQaArtifactPaths,
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
    expect(qaSource).toContain("mobileScreenRenderContracts");
    expect(qaSource).toContain("Push registration/delivery/tap contract render smoke.");
    expect(qaStaticTest).toContain("maps every registered screen");
    expect(appSource).toContain("mobileQaExecutionPreview");
    expect(qaManifest).toContain("ios-screen-smoke");
    expect(qaManifest).toContain("ota-preview-rollback");
  });

  it("keeps simulator, physical-device, accessibility, provider, CI, and artifact blockers explicit", () => {
    expect(mobileQaRuntimeReadiness.status).toBe("blocked");
    expect(mobileQaRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileQaRuntimeReadiness.requiredCommands).toEqual([...mobileQaRuntimeCommands]);
    expect(mobileQaRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Expo app component/render and static test output for every registered screen",
      "iOS, Android, and physical device smoke screenshots or videos",
      "VoiceOver/TalkBack, text scaling, contrast, and touch-target QA notes",
      "offline, push, crash, and OTA rollback runtime QA transcripts",
      "CI job links and retained mobile QA artifacts",
    ]));
    expect(mobileQaRuntimeReadiness.blockers).toContain("Expo app component/render tests must cover registered screens.");
    expect(mobileQaRuntimeReadiness.blockers).toContain("Physical device smoke must cover auth, API sync, offline, push, crash, and OTA flows.");
    expect(mobileQaRuntimeReadiness.blockers).toContain("Mobile QA artifacts must include simulator screenshots/logs, accessibility notes, provider/device transcripts, and release evidence.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming simulator/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile QA runtime contracts");
    expect(ciWorkflow).toContain("mobile-qa-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-qa-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-qa-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileQaRuntime.ts");
    expect(gapTracker).toContain("GAP-048 is mobile-qa-runtime-matrix wired");
    expect(mobileQaArtifactPaths).toContain("coverage/mobile-qa-secret-safe-artifacts.json");
  });
});
