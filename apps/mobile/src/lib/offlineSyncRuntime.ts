import { buildOfflineRuntimeReadinessPlan } from "@inkroute/mobile-support";

export type OfflineSyncRuntimeStatus =
  | "wired"
  | "storage-gated"
  | "worker-gated"
  | "conflict-gated"
  | "audit-gated"
  | "device-gated"
  | "ci-gated";

export interface OfflineSyncRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: OfflineSyncRuntimeStatus;
}

export const offlineSyncRuntimeCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo offline restart persistence smoke test",
  "Expo airplane-mode reconnect sync smoke test",
] as const;

export const offlineSyncArtifactPaths = [
  "coverage/mobile-offline-sync-runtime.json",
  "coverage/mobile-offline-sync-support-typecheck.txt",
  "coverage/mobile-offline-sync-support-test.txt",
  "coverage/mobile-offline-sync-app-typecheck.txt",
  "coverage/mobile-offline-sync-app-test.txt",
  "coverage/mobile-offline-sync-adapter-contract.json",
  "coverage/mobile-offline-sync-encrypted-store-redacted.json",
  "coverage/mobile-offline-sync-at-rest-proof-redacted.json",
  "coverage/mobile-offline-sync-device-restart.json",
  "coverage/mobile-offline-sync-reconnect-worker.json",
  "coverage/mobile-offline-sync-retry-backoff.json",
  "coverage/mobile-offline-sync-conflict-resolution.json",
  "coverage/mobile-offline-sync-server-conflict-tests.json",
  "coverage/mobile-offline-sync-idempotency-persistence.json",
  "coverage/mobile-offline-sync-audit-persistence.json",
  "coverage/mobile-offline-sync-airplane-mode-redacted.json",
  "coverage/mobile-offline-sync-secret-safe-artifacts.json",
  "test-results/mobile-offline-sync-runtime",
] as const;

export const offlineSyncRuntimeMatrix = [
  {
    id: "mobile-support-typecheck",
    command: "pnpm --filter @inkroute/mobile-support typecheck",
    artifact: "coverage/mobile-offline-sync-support-typecheck.txt",
    status: "wired",
  },
  {
    id: "mobile-support-tests",
    command: "pnpm --filter @inkroute/mobile-support test",
    artifact: "coverage/mobile-offline-sync-support-test.txt",
    status: "wired",
  },
  {
    id: "mobile-app-typecheck",
    command: "pnpm --filter @inkroute/mobile typecheck",
    artifact: "coverage/mobile-offline-sync-app-typecheck.txt",
    status: "ci-gated",
  },
  {
    id: "mobile-app-tests",
    command: "pnpm --filter @inkroute/mobile test",
    artifact: "coverage/mobile-offline-sync-app-test.txt",
    status: "ci-gated",
  },
  {
    id: "encrypted-store-adapter",
    command: "replace memory adapter with Expo SecureStore/encrypted SQLite adapter",
    artifact: "coverage/mobile-offline-sync-encrypted-store-redacted.json",
    status: "storage-gated",
  },
  {
    id: "sensitive-at-rest-proof",
    command: "prove sensitive offline queue payloads are encrypted at rest",
    artifact: "coverage/mobile-offline-sync-at-rest-proof-redacted.json",
    status: "storage-gated",
  },
  {
    id: "device-restart-persistence",
    command: "Expo offline restart persistence smoke test",
    artifact: "coverage/mobile-offline-sync-device-restart.json",
    status: "device-gated",
  },
  {
    id: "reconnect-sync-worker",
    command: "schedule runOfflineSyncOnce on reconnect",
    artifact: "coverage/mobile-offline-sync-reconnect-worker.json",
    status: "worker-gated",
  },
  {
    id: "retry-backoff-worker",
    command: "prove bounded retry backoff in the runtime worker",
    artifact: "coverage/mobile-offline-sync-retry-backoff.json",
    status: "worker-gated",
  },
  {
    id: "server-conflict-resolution",
    command: "add server stale-mutation conflict resolution tests",
    artifact: "coverage/mobile-offline-sync-server-conflict-tests.json",
    status: "conflict-gated",
  },
  {
    id: "idempotency-persistence",
    command: "persist offline idempotency keys through replay and restart",
    artifact: "coverage/mobile-offline-sync-idempotency-persistence.json",
    status: "storage-gated",
  },
  {
    id: "audit-persistence",
    command: "persist offline sync attempts, conflicts, retries, and drops",
    artifact: "coverage/mobile-offline-sync-audit-persistence.json",
    status: "audit-gated",
  },
  {
    id: "airplane-mode-reconnect",
    command: "Expo airplane-mode reconnect sync smoke test",
    artifact: "coverage/mobile-offline-sync-airplane-mode-redacted.json",
    status: "device-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions mobile offline sync evidence job",
    artifact: "coverage/mobile-offline-sync-secret-safe-artifacts.json",
    status: "ci-gated",
  },
] as const satisfies readonly OfflineSyncRuntimeMatrixEntry[];

export const offlineSyncRuntimeReadiness = buildOfflineRuntimeReadinessPlan({
  packageScripts: {
    test: "vitest run packages/mobile/tests/mobile-support.test.ts",
    typecheck: "tsc -p tsconfig.json --noEmit",
  },
  mobileSupportTestsPassed: false,
  mobileSupportTypecheckPassed: false,
  mobileTypecheckPassed: false,
  mobileDeviceTestsPassed: false,
  storageAdapterSelected: false,
  encryptedStoreConfigured: false,
  sensitiveItemsEncryptedAtRest: false,
  deviceRestartPersistenceTested: false,
  syncWorkerConfigured: false,
  retryBackoffWorkerTested: false,
  conflictResolutionConfigured: false,
  serverConflictTestsPassed: false,
  idempotencyPersistenceConfigured: false,
  alreadySyncedReplayTested: false,
  auditTrailPersistenceConfigured: false,
  offlineReconnectDeviceTested: false,
});
