import { describe, expect, it } from "vitest";
import {
  getMobileScreen,
  buildOfflineIdempotencyKey,
  calculateOfflineRetryDelayMinutes,
  mobileScreenRegistry,
  phase6HealthChecks,
  phase6MobileBoundaries,
  planOfflineSync,
  summarizeOfflineQueue,
  type OfflineQueueItem,
} from "../src/index";

describe("mobile support helpers", () => {
  it("registers every expected Phase 6 mobile screen once", () => {
    const ids = mobileScreenRegistry.map((screen) => screen.id);

    expect(ids).toEqual([
      "auth",
      "home",
      "bookings",
      "appointments",
      "clients",
      "travel",
      "portfolio",
      "notifications",
      "offline",
      "system",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("returns screen metadata and rejects unknown ids", () => {
    expect(getMobileScreen("offline")).toMatchObject({
      id: "offline",
      phase6Status: "scaffolded-boundary",
    });

    expect(() => getMobileScreen("unknown" as never)).toThrow("Unknown mobile screen: unknown");
  });

  it("summarizes offline queue risk without claiming production readiness", () => {
    const items: OfflineQueueItem[] = [
      {
        id: "note_1",
        kind: "booking_note",
        label: "Booking note",
        status: "queued",
        createdAt: "2026-06-08T00:00:00.000Z",
        retryCount: 0,
        sensitive: true,
      },
      {
        id: "travel_1",
        kind: "travel_update",
        label: "Travel update",
        status: "syncing",
        createdAt: "2026-06-08T00:01:00.000Z",
        retryCount: 1,
        sensitive: false,
      },
      {
        id: "portfolio_1",
        kind: "portfolio_metadata",
        label: "Portfolio metadata",
        status: "failed",
        createdAt: "2026-06-08T00:02:00.000Z",
        retryCount: 3,
        sensitive: false,
      },
    ];

    expect(summarizeOfflineQueue(items)).toMatchObject({
      total: 3,
      queued: 2,
      failed: 1,
      sensitive: 1,
      productionReady: false,
    });
  });

  it("plans offline sync with idempotency, encryption, retry, and conflict decisions", () => {
    const items: OfflineQueueItem[] = [
      {
        id: "sensitive_1",
        kind: "client_note",
        label: "Sensitive client note",
        status: "queued",
        createdAt: "2026-06-08T00:00:00.000Z",
        retryCount: 0,
        sensitive: true,
        tenantId: "tenant_001",
        entityId: "client_001",
      },
      {
        id: "conflict_1",
        kind: "travel_update",
        label: "Travel update",
        status: "queued",
        createdAt: "2026-06-08T00:01:00.000Z",
        retryCount: 0,
        sensitive: false,
        tenantId: "tenant_001",
        entityId: "stop_001",
        localVersion: 2,
        remoteVersion: 3,
      },
      {
        id: "failed_1",
        kind: "portfolio_metadata",
        label: "Portfolio metadata",
        status: "failed",
        createdAt: "2026-06-08T00:02:00.000Z",
        retryCount: 3,
        sensitive: false,
        tenantId: "tenant_001",
      },
      {
        id: "synced_1",
        kind: "aftercare_checkin",
        label: "Aftercare check-in",
        status: "synced",
        createdAt: "2026-06-08T00:03:00.000Z",
        retryCount: 0,
        sensitive: false,
      },
    ];

    const blocked = planOfflineSync({
      items,
      generatedAt: "2026-06-08T01:00:00.000Z",
      encryptedStoreAvailable: false,
    });

    expect(buildOfflineIdempotencyKey(items[0]!)).toBe("tenant_001:client_note:client_001:2026-06-08T00:00:00.000Z");
    expect(calculateOfflineRetryDelayMinutes(3)).toBe(8);
    expect(blocked.productionReady).toBe(false);
    expect(blocked.blockedCount).toBe(1);
    expect(blocked.conflictCount).toBe(1);
    expect(blocked.decisions.find((decision) => decision.itemId === "sensitive_1")).toMatchObject({
      status: "blocked_unencrypted",
      requiresEncryption: true,
    });
    expect(blocked.decisions.find((decision) => decision.itemId === "conflict_1")?.status).toBe("conflict");
    expect(blocked.decisions.find((decision) => decision.itemId === "failed_1")).toMatchObject({
      status: "retry_later",
      nextAttemptAt: "2026-06-08T01:08:00.000Z",
    });
    expect(blocked.decisions.find((decision) => decision.itemId === "synced_1")?.status).toBe("already_synced");

    const encrypted = planOfflineSync({
      items: [items[0]!],
      generatedAt: "2026-06-08T01:00:00.000Z",
      encryptedStoreAvailable: true,
    });
    expect(encrypted.readyCount).toBe(1);
    expect(encrypted.decisions[0]?.status).toBe("ready_to_sync");
  });

  it("keeps production-blocking integration boundaries visible", () => {
    expect(phase6MobileBoundaries.filter((boundary) => boundary.blocksProduction).map((boundary) => boundary.id)).toEqual([
      "mobile-auth",
      "mobile-api",
      "mobile-push",
      "mobile-offline-store",
      "mobile-crash",
    ]);
  });

  it("keeps runtime health checks marked as unverified or not configured", () => {
    expect(phase6HealthChecks.map((check) => check.state)).toEqual([
      "needs-runtime-test",
      "not-configured",
      "not-configured",
      "not-configured",
      "not-configured",
    ]);
  });
});
