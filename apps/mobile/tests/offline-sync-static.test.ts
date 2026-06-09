import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile offline sync static contract", () => {
  const offlineSource = readWorkspaceFile("apps/mobile/src/lib/offlineSync.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/OfflineNotesScreen.tsx");

  it("defines an encrypted-store adapter boundary and queue persistence calls", () => {
    expect(offlineSource).toContain("OfflineStoreAdapter");
    expect(offlineSource).toContain("encryptedAtRest");
    expect(offlineSource).toContain("loadQueue()");
    expect(offlineSource).toContain("saveQueue");
    expect(offlineSource).toContain("appendAudit");
  });

  it("uses shared offline sync planning and blocks sensitive items without encryption", () => {
    expect(offlineSource).toContain("planOfflineSync");
    expect(offlineSource).toContain("encryptedStoreAvailable: input.store.encryptedAtRest");
    expect(offlineSource).toContain('decision.status !== "ready_to_sync"');
    expect(offlineSource).toContain("blockedItemIds.push");
  });

  it("replays ready items through the mobile API client with idempotency keys", () => {
    expect(offlineSource).toContain("mobileApiFetch");
    expect(offlineSource).toContain("buildOfflineIdempotencyKey(item)");
    expect(offlineSource).toContain('method: "PATCH"');
    expect(offlineSource).toContain("/api/mobile/offline/");
  });

  it("records redacted audit events instead of leaking sensitive offline payloads", () => {
    expect(offlineSource).toContain("buildOfflineSyncAuditEvent");
    expect(offlineSource).toContain("Sensitive offline payload redacted.");
    expect(offlineSource).not.toContain("label: item.label");
  });

  it("surfaces the runtime gate in the offline screen", () => {
    expect(screenSource).toContain("offlineSyncPreview");
    expect(screenSource).toContain("Sync worker contract");
    expect(screenSource).toContain("encrypted device storage");
    expect(screenSource).toContain("reconnect smoke");
  });
});
