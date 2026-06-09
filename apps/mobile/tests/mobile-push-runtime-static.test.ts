import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobilePushArtifactPaths,
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

  it("pins GAP-044 commands, matrix rows, and artifacts", () => {
    expect(mobilePushRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/mobile typecheck",
      "Expo push send smoke test against a real device token",
      "Expo receipt polling smoke test",
      "iOS foreground/background/tap push QA",
      "Android foreground/background/tap push QA",
    ]);
    expect(mobilePushRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "mobile-typecheck",
      "expo-project-credentials",
      "token-optout-persistence",
      "delivery-worker-log",
      "receipt-worker-invalid-token",
      "safe-tap-routing",
      "ios-device-qa",
      "android-device-qa",
      "ci-secret-safe-evidence",
    ]);
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-runtime.json");
    expect(mobilePushArtifactPaths).toContain("test-results/mobile-push-runtime");
  });

  it("keeps package helper, app push contracts, receipt suppression, and notification screen wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildExpoPushProviderRuntimeReadinessPlan");
    expect(notificationsTests).toContain("buildExpoPushProviderRuntimeReadinessPlan");
    expect(pushSource).toContain("buildExpoPushRegistrationPlan");
    expect(pushSource).toContain("ExpoPushProviderRepository");
    expect(pushSource).toContain("processExpoPushReceipt");
    expect(pushSource).toContain("suppressInvalidToken");
    expect(pushStaticTest).toContain("models invalid-token receipt suppression");
    expect(notificationScreen).toContain("Push runtime contract");
    expect(notificationScreen).toContain("tap route");
  });

  it("keeps Expo credential, persistence, worker, invalid-token, and device blockers explicit", () => {
    expect(mobilePushRuntimeReadiness.status).toBe("blocked");
    expect(mobilePushRuntimeReadiness.provider).toBe("expo");
    expect(mobilePushRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobilePushRuntimeReadiness.requiredCommands).toEqual([...mobilePushRuntimeCommands]);
    expect(mobilePushRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "Expo project, secret, APNs, and FCM configuration evidence",
      "tenant/user/device push token and opt-out persistence evidence",
      "Expo delivery worker, receipt polling, and invalid-token suppression evidence",
      "foreground/background/tap-navigation iOS and Android device QA evidence",
    ]));
    expect(mobilePushRuntimeReadiness.blockers).toContain("Expo project id must be configured before push delivery.");
    expect(mobilePushRuntimeReadiness.blockers).toContain("Tenant/user/device-scoped push token persistence must be available.");
    expect(mobilePushRuntimeReadiness.blockers).toContain("Push tap navigation must pass iOS/Android device QA.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Expo/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 mobile push runtime contracts");
    expect(ciWorkflow).toContain("mobile-push-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-push-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-push-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobilePushRuntime.ts");
    expect(gapTracker).toContain("GAP-044 is mobile-push-runtime-matrix wired");
    expect(mobilePushArtifactPaths).toContain("coverage/mobile-push-secret-safe-artifacts.json");
  });
});
