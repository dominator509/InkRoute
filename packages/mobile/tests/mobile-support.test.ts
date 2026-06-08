import { describe, expect, it } from "vitest";
import {
  getMobileScreen,
  mobileScreenRegistry,
  phase6HealthChecks,
  phase6MobileBoundaries,
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
