import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildOfflineSyncArtifactReview,
  buildOfflineSyncEvidenceDecision,
  buildOfflineSyncExecutionPlan,
  buildRedactedOfflineSyncArtifact,
  offlineSyncArtifactPaths,
  offlineSyncEvidenceFlags,
  offlineSyncExternalCommands,
  offlineSyncExecutionPolicy,
  offlineSyncLocalCommands,
  offlineSyncRequiredExternalEvidence,
  offlineSyncRuntimeProofFiles,
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
    expect(offlineSyncRuntimeMatrix.find((entry) => entry.id === "encrypted-store-adapter")?.command).toBe(
      "wire persistent encrypted-store adapter factory for Expo SecureStore/encrypted SQLite",
    );
    expect(offlineSyncRuntimeMatrix.find((entry) => entry.id === "encrypted-store-adapter")?.status).toBe("wired");
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
    expect(offlineSyncSource).toContain("OfflineSecureStoreDriver");
    expect(offlineSyncSource).toContain("OfflineEncryptedSqliteAuditDriver");
    expect(offlineSyncSource).toContain("PersistentOfflineStoreOptions");
    expect(offlineSyncSource).toContain("createPersistentOfflineStore");
    expect(offlineSyncSource).toContain("persistent encrypted-store factory");
    expect(offlineSyncSource).toContain("encryptedAtRest");
    expect(offlineSyncSource).toContain("runOfflineSyncOnce");
    expect(offlineSyncSource).toContain("OfflineConnectivityAdapter");
    expect(offlineSyncSource).toContain("createOfflineReconnectSyncController");
    expect(offlineSyncSource).toContain("reconnectWorkerConfigured: true");
    expect(offlineSyncSource).toContain("void scheduleSync()");
    expect(offlineSyncSource).toContain("mobileApiFetch");
    expect(offlineSyncSource).toContain("OfflineSyncTransport");
    expect(offlineSyncSource).toContain("failedItemIdHashes");
    expect(offlineSyncSource).toContain("rawItemIdsEchoed: false");
    expect(offlineSyncSource).toContain("buildOfflineSyncTransportFailureAuditEvent");
    expect(offlineSyncSource).toContain("retryCount: item.retryCount + 1");
    expect(offlineStaticTest).toContain("redacted offline sync audit events");
    expect(offlineScreen).toContain("Sync worker contract");
    expect(offlineScreen).toContain("encrypted device storage");
  });

  it("keeps encrypted persistence, worker, conflict, audit, and reconnect blockers explicit", () => {
    expect(offlineSyncRuntimeReadiness.status).toBe("blocked");
    expect(offlineSyncRuntimeReadiness.missingScripts).toEqual([]);
    expect(offlineSyncRuntimeReadiness.requiredCommands).toBe(offlineSyncRuntimeCommands);
    expect(offlineSyncRuntimeReadiness.requiredEvidence).toBe(offlineSyncEvidenceFlags);
    expect(offlineSyncRuntimeReadiness.blockers).not.toContain("Offline storage adapter must be selected before runtime readiness.");
    expect(offlineSyncRuntimeReadiness.blockers).toContain("Encrypted offline store must be configured for sensitive queue items.");
    expect(offlineSyncRuntimeReadiness.blockers).not.toContain("Runtime offline sync worker must be configured.");
    expect(offlineSyncRuntimeReadiness.blockers).toContain("Airplane-mode queue and reconnect sync must be verified on device or simulator.");
  });

  it("classifies GAP-045 as blocked until encrypted offline sync evidence is complete", () => {
    const decision = buildOfflineSyncEvidenceDecision({
      commands: ["pnpm --filter @inkroute/mobile-support typecheck"],
      artifacts: ["coverage/mobile-offline-sync-runtime.json"],
      evidence: { mobileSupportTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Expo airplane-mode reconnect sync smoke test");
    expect(decision.missingArtifacts).toContain("coverage/mobile-offline-sync-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned offline sync commands must be run and captured.");
  });

  it("classifies GAP-045 as complete when all offline sync commands, artifacts, and evidence are present", () => {
    const decision = buildOfflineSyncEvidenceDecision({
      commands: offlineSyncRuntimeCommands,
      artifacts: offlineSyncArtifactPaths,
      evidence: Object.fromEntries(offlineSyncEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-045 execution policy non-executing and external evidence explicit", () => {
    const plan = buildOfflineSyncExecutionPlan();

    expect(plan.policy).toBe(offlineSyncExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(offlineSyncRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticOfflineSyncReadiness).toBe(true);
    expect(plan.policy.encryptedStoreRequiredForClosure).toBe(true);
    expect(plan.policy.restartPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.reconnectWorkerSchedulingContractRequiredForClosure).toBe(true);
    expect(plan.policy.reconnectDeviceSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.serverConflictTestsRequiredForClosure).toBe(true);
    expect(plan.policy.auditPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.encryptedStoreExecutionAllowed).toBe(false);
    expect(plan.deviceRestartExecutionAllowed).toBe(false);
    expect(plan.reconnectWorkerSchedulingContractAvailable).toBe(true);
    expect(plan.reconnectDeviceSmokeExecutionAllowed).toBe(false);
    expect(plan.serverConflictExecutionAllowed).toBe(false);
    expect(plan.auditPersistenceExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(offlineSyncLocalCommands);
    expect(plan.externalCommands).toBe(offlineSyncExternalCommands);
    expect(plan.reconnectSchedulingContract).toBe("createOfflineReconnectSyncController");
    expect(plan.requiredExternalEvidence).toBe(offlineSyncRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe offline sync artifact review");
  });

  it("redacts GAP-045 offline sync artifacts before secret-safe review", () => {
    const artifact = {
      tenantId: "tenant_private",
      secureStoreKey: "secure_private",
      sqliteDatabasePath: "/private/offline.db",
      offlineQueuePayload: "payload_private",
      nested: {
        idempotencyKey: "idem_private",
        publicSummary: "offline sync evidence captured",
      },
      safeNote:
        "evidence_mobile_offline_sync_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/offline-sync/private-proof.json",
      safeQueuePath: "test-results/offline-sync-runtime/private-queue.json",
      safeReconnectRun: "offline_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedOfflineSyncArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "secureStoreKey",
      "sqliteDatabasePath",
      "offlineQueuePayload",
      "nested.idempotencyKey",
      "safeNote",
      "safeQueuePath",
      "safeReconnectRun",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantId: "[REDACTED]",
      secureStoreKey: "[REDACTED]",
      sqliteDatabasePath: "[REDACTED]",
      offlineQueuePayload: "[REDACTED]",
      nested: {
        idempotencyKey: "[REDACTED]",
        publicSummary: "offline sync evidence captured",
      },
      safeQueuePath: "[REDACTED]",
      safeReconnectRun: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_mobile_offline_sync_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/offline-sync/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/offline-sync-runtime/private-queue.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "offline_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildOfflineSyncArtifactReview({
      publicSummary: "safe offline sync evidence",
      auditPayload: "audit_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["auditPayload"]);
    expect(review.requiredExternalEvidence).toBe(offlineSyncRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("offline-to-online reconnect scheduling contract proof");
    expect(review.requiredExternalEvidence).toContain("airplane-mode reconnect device smoke evidence");
  });

  it("pins current offline sync proof files for GAP-045", () => {
    expect(offlineSyncRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/mobile/package.json",
      "packages/mobile/src/index.ts",
      "packages/mobile/tests/mobile-support.test.ts",
      "apps/mobile/src/lib/offlineSync.ts",
      "apps/mobile/src/lib/offlineSyncRuntime.ts",
      "apps/mobile/src/lib/mobileApiClient.ts",
      "apps/mobile/src/screens/OfflineNotesScreen.tsx",
      "apps/mobile/tests/offline-sync-static.test.ts",
      "apps/mobile/tests/offline-sync-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of offlineSyncRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming encrypted/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile offline sync runtime contracts");
    expect(ciWorkflow).toContain("offline-sync-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-offline-sync-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-offline-sync-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/offlineSyncRuntime.ts");
    expect(gapTracker).toContain("GAP-045 is mobile-offline-sync-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildOfflineSyncExecutionPlan");
    expect(gapTracker).toContain("createOfflineReconnectSyncController");
    expect(gapTracker).toContain("offlineSyncExecutionPolicy");
    expect(gapTracker).toContain("offlineSyncRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedOfflineSyncArtifact");
    expect(gapTracker).toContain("buildOfflineSyncArtifactReview");
    expect(offlineSyncArtifactPaths).toContain("coverage/mobile-offline-sync-secret-safe-artifacts.json");
  });
});

