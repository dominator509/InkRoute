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

export const offlineSyncRuntimeProofFiles = [
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
] as const;

export const offlineSyncEvidenceFlags = [
  "mobileSupportTypecheckPassed",
  "mobileSupportTestsPassed",
  "mobileTypecheckPassed",
  "mobileTestsPassed",
  "encryptedStoreAdapterVerified",
  "sensitiveAtRestEncryptionVerified",
  "deviceRestartPersistenceTested",
  "reconnectSyncWorkerScheduled",
  "retryBackoffTested",
  "serverConflictResolutionTested",
  "idempotencyPersistenceVerified",
  "auditPersistenceVerified",
  "airplaneModeReconnectTested",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type OfflineSyncEvidenceFlag = (typeof offlineSyncEvidenceFlags)[number];

export interface OfflineSyncExecutionPolicy {
  readonly codexMayClassifyStaticOfflineSyncReadiness: true;
  readonly encryptedStoreRequiredForClosure: true;
  readonly restartPersistenceRequiredForClosure: true;
  readonly reconnectWorkerRequiredForClosure: true;
  readonly serverConflictTestsRequiredForClosure: true;
  readonly auditPersistenceRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface OfflineSyncExecutionPlan {
  readonly policy: typeof offlineSyncExecutionPolicy;
  readonly commandExecutionAllowed: false;
  readonly encryptedStoreExecutionAllowed: false;
  readonly deviceRestartExecutionAllowed: false;
  readonly reconnectWorkerExecutionAllowed: false;
  readonly serverConflictExecutionAllowed: false;
  readonly auditPersistenceExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly localCommands: typeof offlineSyncLocalCommands;
  readonly externalCommands: typeof offlineSyncExternalCommands;
  readonly requiredExternalEvidence: typeof offlineSyncRequiredExternalEvidence;
}

export interface OfflineSyncArtifactReview {
  readonly artifact: unknown;
  readonly redactedArtifact: unknown;
  readonly redactedPaths: readonly string[];
  readonly secretSafe: boolean;
  readonly requiredExternalEvidence: typeof offlineSyncRequiredExternalEvidence;
}

export interface OfflineSyncEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly evidence?: Partial<Record<OfflineSyncEvidenceFlag, boolean>>;
}

export interface OfflineSyncEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly requiredCommands: typeof offlineSyncRuntimeCommands;
  readonly missingCommands: readonly string[];
  readonly requiredArtifacts: typeof offlineSyncArtifactPaths;
  readonly missingArtifacts: readonly string[];
  readonly requiredEvidence: typeof offlineSyncEvidenceFlags;
  readonly missingEvidence: readonly OfflineSyncEvidenceFlag[];
  readonly blockers: readonly string[];
}

export const offlineSyncExecutionPolicy = {
  codexMayClassifyStaticOfflineSyncReadiness: true,
  encryptedStoreRequiredForClosure: true,
  restartPersistenceRequiredForClosure: true,
  reconnectWorkerRequiredForClosure: true,
  serverConflictTestsRequiredForClosure: true,
  auditPersistenceRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const satisfies OfflineSyncExecutionPolicy;

export const offlineSyncRequiredExternalEvidence = [
  "real Expo SecureStore/encrypted SQLite adapter proof",
  "encrypted at-rest offline queue proof",
  "device restart persistence proof",
  "reconnect worker scheduling proof",
  "server stale-mutation conflict test output",
  "idempotency persistence proof",
  "offline sync audit persistence proof",
  "airplane-mode reconnect evidence",
  "mobile typecheck/test output",
  "CI offline sync evidence",
  "secret-safe offline sync artifact review",
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

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) => {
  const actualSet = new Set(actual ?? []);
  return required.filter((entry) => !actualSet.has(entry));
};

const sensitiveOfflineSyncArtifactKey = /(secret|token|password|private|client|tenant|domain|database|db|url|uri|provider|session|refresh|securestore|sqlite|encrypted|device|queue|payload|idempotency|offline|sync|audit|conflict|email|phone|medical|payment)/i;

const redactOfflineSyncArtifactValue = (
  value: unknown,
  path: string,
  redactedPaths: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => redactOfflineSyncArtifactValue(entry, `${path}.${index}`, redactedPaths));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveOfflineSyncArtifactKey.test(key)) {
          redactedPaths.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, redactOfflineSyncArtifactValue(entry, nextPath, redactedPaths)];
      }),
    );
  }

  return value;
};

export const offlineSyncLocalCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "static offline sync adapter and worker contract review",
  "static offline sync audit redaction review",
] as const;

export const offlineSyncExternalCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo SecureStore/encrypted SQLite adapter proof",
  "encrypted at-rest offline queue proof",
  "Expo offline restart persistence smoke test",
  "Expo airplane-mode reconnect sync smoke test",
  "server stale-mutation conflict tests",
  "offline sync audit persistence proof",
  "GitHub Actions mobile offline sync evidence job",
] as const;

export const buildOfflineSyncExecutionPlan = (): OfflineSyncExecutionPlan => ({
  policy: offlineSyncExecutionPolicy,
  commandExecutionAllowed: false,
  encryptedStoreExecutionAllowed: false,
  deviceRestartExecutionAllowed: false,
  reconnectWorkerExecutionAllowed: false,
  serverConflictExecutionAllowed: false,
  auditPersistenceExecutionAllowed: false,
  ciExecutionAllowed: false,
  localCommands: offlineSyncLocalCommands,
  externalCommands: offlineSyncExternalCommands,
  requiredExternalEvidence: offlineSyncRequiredExternalEvidence,
});

export const buildRedactedOfflineSyncArtifact = (artifact: unknown): Pick<OfflineSyncArtifactReview, "redactedArtifact" | "redactedPaths"> => {
  const redactedPaths: string[] = [];
  return {
    redactedArtifact: redactOfflineSyncArtifactValue(artifact, "", redactedPaths),
    redactedPaths,
  };
};

export const buildOfflineSyncArtifactReview = (artifact: unknown): OfflineSyncArtifactReview => {
  const redacted = buildRedactedOfflineSyncArtifact(artifact);
  return {
    artifact,
    redactedArtifact: redacted.redactedArtifact,
    redactedPaths: redacted.redactedPaths,
    secretSafe: redacted.redactedPaths.length > 0,
    requiredExternalEvidence: offlineSyncRequiredExternalEvidence,
  };
};

export const buildOfflineSyncEvidenceDecision = (
  input: OfflineSyncEvidenceInput = {},
): OfflineSyncEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, offlineSyncRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, offlineSyncArtifactPaths);
  const missingEvidence = offlineSyncEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = [
    missingCommands.length > 0 ? "Pinned offline sync commands must be run and captured." : "",
    missingArtifacts.length > 0
      ? "Offline sync artifacts must be retained with encrypted-store, reconnect, conflict, audit, CI, and secret-safe evidence."
      : "",
    missingEvidence.length > 0
      ? "Encrypted at-rest storage, restart persistence, reconnect worker, retry/idempotency, conflict, audit, CI, and secret-safe evidence must pass."
      : "",
  ].filter(Boolean);

  return {
    status: blockers.length === 0 ? "complete" : "blocked",
    requiredCommands: offlineSyncRuntimeCommands,
    missingCommands,
    requiredArtifacts: offlineSyncArtifactPaths,
    missingArtifacts,
    requiredEvidence: offlineSyncEvidenceFlags,
    missingEvidence,
    blockers,
  };
};



