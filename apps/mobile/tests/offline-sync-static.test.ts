import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile offline sync static contract", () => {
  const offlineSource = readWorkspaceFile("apps/mobile/src/lib/offlineSync.ts");
  const mobileSupportSource = readWorkspaceFile("packages/mobile/src/index.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/OfflineNotesScreen.tsx");

  it("defines an encrypted-store adapter boundary and queue persistence calls", () => {
    expect(offlineSource).toContain("OfflineStoreAdapter");
    expect(offlineSource).toContain("OfflineSecureStoreDriver");
    expect(offlineSource).toContain("OfflineEncryptedSqliteAuditDriver");
    expect(offlineSource).toContain("createPersistentOfflineStore");
    expect(offlineSource).toContain("secureStore.getItemAsync");
    expect(offlineSource).toContain("secureStore.setItemAsync");
    expect(offlineSource).toContain("encryptedAtRest");
    expect(offlineSource).toContain("loadQueue()");
    expect(offlineSource).toContain("saveQueue");
    expect(offlineSource).toContain("appendAudit");
  });

  it("uses shared offline sync planning and blocks sensitive items without encryption", () => {
    expect(offlineSource).toContain("planOfflineSync");
    expect(offlineSource).toContain("encryptedStoreAvailable: input.store.encryptedAtRest");
    expect(offlineSource).toContain('decision.status !== "ready_to_sync"');
    expect(offlineSource).toContain("blockedItemIdHashes.push");
    expect(offlineSource).toContain("rawItemIdsEchoed: false");
  });

  it("replays ready items through the mobile API client with idempotency keys", () => {
    expect(offlineSource).toContain("mobileApiFetch");
    expect(offlineSource).toContain("transport?: OfflineSyncTransport");
    expect(offlineSource).toContain("OfflineConnectivityAdapter");
    expect(offlineSource).toContain("createOfflineReconnectSyncController");
    expect(offlineSource).toContain("reconnectWorkerConfigured: true");
    expect(offlineSource).toContain("void scheduleSync()");
    expect(offlineSource).toContain("buildOfflineIdempotencyKey(item)");
    expect(offlineSource).toContain('method: "PATCH"');
    expect(offlineSource).toContain("/api/mobile/offline/");
  });

  it("records redacted audit events instead of leaking sensitive offline payloads", () => {
    expect(offlineSource).toContain("buildOfflineSyncAuditEvent");
    expect(offlineSource).toContain("buildOfflineSyncTransportFailureAuditEvent");
    expect(offlineSource).toContain("idempotencyKeyHash");
    expect(offlineSource).toContain("rawIdempotencyKeyEchoed: false");
    expect(offlineSource).toContain("Sensitive offline payload redacted.");
    expect(offlineSource).toContain("Offline sync transport failed. Payload, response body, and credentials redacted.");
    expect(offlineSource).not.toContain("label: item.label");
  });

  it("persists retry state when a replay transport call fails", () => {
    expect(offlineSource).toContain("failedItemIdHashes");
    expect(offlineSource).toContain('decision: "transport_failed"');
    expect(offlineSource).toContain('status: "failed" as const');
    expect(offlineSource).toContain("retryCount: item.retryCount + 1");
    expect(offlineSource).toContain("await input.store.saveQueue(nextItems)");
  });

  it("surfaces the runtime gate in the offline screen", () => {
    expect(screenSource).toContain("offlineSyncPreview");
    expect(screenSource).toContain("Sync worker contract");
    expect(screenSource).toContain("Offline queue contract");
    expect(screenSource).toContain("app-side adapter, offline-to-online reconnect scheduler, sync worker, idempotent replay, retry state, and redacted audit events are wired");
    expect(screenSource).toContain("encrypted device storage");
    expect(screenSource).toContain("reconnect smoke");
    expect(offlineSource).toContain("persistent encrypted-store factory");
    expect(offlineSource).toContain("native encrypted device storage binding and reconnect smoke evidence remain runtime-gated");
    expect(screenSource).not.toContain("Static queue model");
    expect(screenSource).not.toContain("not implemented yet");
  });

  it("keeps mobile support offline summary aligned with app-side worker wiring", () => {
    expect(mobileSupportSource).toContain("Offline queue planning and the app-side adapter/worker contract are wired");
    expect(mobileSupportSource).toContain("encrypted device persistence, conflict integration, and reconnect proof remain gated");
    expect(mobileSupportSource).not.toContain(
      "Offline queue is a Phase 6 model only; encrypted persistence and sync conflict handling are not implemented",
    );
  });
});
