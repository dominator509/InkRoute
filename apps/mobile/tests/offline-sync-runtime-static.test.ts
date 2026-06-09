import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  offlineSyncArtifactPaths,
  offlineSyncRuntimeCommands,
  offlineSyncRuntimeMatrix,
  offlineSyncRuntimeReadiness,
} from "../src/lib/offlineSyncRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile offline sync runtime contract", () => {
  const mobileSupportPackageJson = readWorkspaceFile("packages/mobile/package.json");
  const mobileSupportSource = readWorkspaceFile("packages/mobile/src/index.ts");
  const mobileSupportTests = readWorkspaceFile("packages/mobile/tests/mobile-support.test.ts");
  const offlineSyncSource = readWorkspaceFile("apps/mobile/src/lib/offlineSync.ts");
  const offlineStaticTest = readWorkspaceFile("apps/mobile/tests/offline-sync-static.test.ts");
  const offlineScreen = readWorkspaceFile("apps/mobile/src/screens/OfflineNotesScreen.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-045 commands, matrix rows, and artifacts", () => {
    expect(offlineSyncRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "Expo offline restart persistence smoke test",
      "Expo airplane-mode reconnect sync smoke test",
    ]);
    expect(offlineSyncRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "mobile-support-typecheck",
      "mobile-support-tests",
      "mobile-app-typecheck",
      "mobile-app-tests",
      "encrypted-store-adapter",
      "sensitive-at-rest-proof",
      "device-restart-persistence",
      "reconnect-sync-worker",
      "retry-backoff-worker",
      "server-conflict-resolution",
      "idempotency-persistence",
      "audit-persistence",
      "airplane-mode-reconnect",
      "ci-secret-safe-evidence",
    ]);
    expect(offlineSyncArtifactPaths).toContain("coverage/mobile-offline-sync-runtime.json");
    expect(offlineSyncArtifactPaths).toContain("test-results/mobile-offline-sync-runtime");
  });

  it("keeps package helper, app worker contract, replay, and screen surfacing wired", () => {
    expect(mobileSupportPackageJson).toContain('"typecheck"');
    expect(mobileSupportPackageJson).toContain('"test"');
    expect(mobileSupportSource).toContain("buildOfflineRuntimeReadinessPlan");
    expect(mobileSupportSource).toContain("planOfflineSync");
    expect(mobileSupportTests).toContain("buildOfflineRuntimeReadinessPlan");
    expect(offlineSyncSource).toContain("OfflineStoreAdapter");
    expect(offlineSyncSource).toContain("encryptedAtRest");
    expect(offlineSyncSource).toContain("runOfflineSyncOnce");
    expect(offlineSyncSource).toContain("mobileApiFetch");
    expect(offlineStaticTest).toContain("redacted offline sync audit events");
    expect(offlineScreen).toContain("Sync worker contract");
    expect(offlineScreen).toContain("encrypted-storage");
  });

  it("keeps encrypted persistence, worker, conflict, audit, and reconnect blockers explicit", () => {
    expect(offlineSyncRuntimeReadiness.status).toBe("blocked");
    expect(offlineSyncRuntimeReadiness.missingScripts).toEqual([]);
    expect(offlineSyncRuntimeReadiness.requiredCommands).toEqual([...offlineSyncRuntimeCommands]);
    expect(offlineSyncRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "encrypted offline storage adapter and at-rest encryption proof",
      "device restart and airplane-mode reconnect evidence",
      "runtime sync worker retry and idempotent replay test output",
      "server conflict-resolution test output",
      "offline sync audit trail persistence evidence",
    ]));
    expect(offlineSyncRuntimeReadiness.blockers).toContain("Encrypted offline store must be configured for sensitive queue items.");
    expect(offlineSyncRuntimeReadiness.blockers).toContain("Runtime offline sync worker must be configured.");
    expect(offlineSyncRuntimeReadiness.blockers).toContain("Airplane-mode queue and reconnect sync must be verified on device or simulator.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming encrypted/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile offline sync runtime contracts");
    expect(ciWorkflow).toContain("offline-sync-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-offline-sync-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-offline-sync-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/offlineSyncRuntime.ts");
    expect(gapTracker).toContain("GAP-045 is mobile-offline-sync-runtime-matrix wired");
    expect(offlineSyncArtifactPaths).toContain("coverage/mobile-offline-sync-secret-safe-artifacts.json");
  });
});
