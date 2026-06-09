import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileApiRuntimeReadinessPlan,
  buildMobileApiRequestPlan,
  buildMobileDeviceQaChecklist,
  buildMobileRuntimeReadinessPlan,
  buildMobileScreenSyncRequirements,
  getMobileScreen,
  buildOfflineIdempotencyKey,
  buildOfflineRuntimeReadinessPlan,
  calculateOfflineRetryDelayMinutes,
  mobileScreenRegistry,
  phase6HealthChecks,
  phase6MobileBoundaries,
  planOfflineSync,
  summarizeMobileDeviceQa,
  summarizeOfflineQueue,
  type OfflineQueueItem,
} from "../src/index";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

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

  it("blocks offline runtime readiness until encrypted persistence, worker replay, conflicts, and audit evidence exist", () => {
    const plan = buildOfflineRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      mobileSupportTestsPassed: true,
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

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("Expo airplane-mode reconnect sync smoke test");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "encrypted offline storage adapter and at-rest encryption proof",
      "runtime sync worker retry and idempotent replay test output",
      "server conflict-resolution test output",
    ]));
    expect(plan.blockers).toContain("Offline idempotency keys must persist through replay and restart.");
    expect(plan.blockers).toContain("Offline sync attempts, conflicts, retries, and drops must persist audit events.");
  });

  it("plans tenant-scoped mobile API requests with auth, request ids, and idempotency", () => {
    const plan = buildMobileApiRequestPlan({
      baseUrl: "https://preview.inkroute.test/",
      tenantId: "tenant_001",
      accessToken: "access_token",
      requestId: "req_001",
      domain: "bookings",
      method: "PATCH",
      path: "/api/mobile/bookings/booking_001",
      online: true,
      idempotencyKey: "mobile_booking_patch_001",
    });

    expect(plan).toMatchObject({
      status: "ready",
      url: "https://preview.inkroute.test/api/mobile/bookings/booking_001",
      retryable: true,
      safeErrorPolicy: "redact-body",
      offlineQueueRequired: false,
      blockers: [],
    });
    expect(plan.headers).toEqual({
      Authorization: "Bearer access_token",
      "X-InkRoute-Tenant": "tenant_001",
      "X-Request-Id": "req_001",
      "Idempotency-Key": "mobile_booking_patch_001",
    });
  });

  it("blocks unsafe mobile API requests before fetch wiring", () => {
    expect(
      buildMobileApiRequestPlan({
        baseUrl: "",
        tenantId: "tenant_001",
        accessToken: "access_token",
        requestId: "req_001",
        domain: "clients",
        method: "GET",
        path: "/api/mobile/clients",
        online: true,
      }),
    ).toMatchObject({
      status: "blocked_missing_base_url",
      url: null,
    });

    expect(
      buildMobileApiRequestPlan({
        baseUrl: "https://preview.inkroute.test",
        tenantId: "",
        accessToken: null,
        requestId: "",
        domain: "clients",
        method: "GET",
        path: "/api/mobile/clients",
        online: true,
      }),
    ).toMatchObject({
      status: "blocked_missing_tenant",
      blockers: [
        "Tenant scope is required for mobile API requests.",
        "Bearer access token is required for mobile API requests.",
        "Request id is required for mobile API traceability.",
      ],
    });
  });

  it("requires offline queueing for offline mobile mutations", () => {
    const plan = buildMobileApiRequestPlan({
      baseUrl: "https://preview.inkroute.test",
      tenantId: "tenant_001",
      accessToken: "access_token",
      requestId: "req_001",
      domain: "travel",
      method: "PATCH",
      path: "/api/mobile/travel-stops/stop_001",
      online: false,
      idempotencyKey: "travel_patch_001",
    });

    expect(plan).toMatchObject({
      status: "offline_queue_required",
      retryable: true,
      offlineQueueRequired: true,
    });
    expect(plan.blockers).toEqual(["Offline mobile mutations must be queued with idempotency before sync."]);
  });

  it("maps mobile screens to authenticated tenant-scoped API sync requirements", () => {
    const requirements = buildMobileScreenSyncRequirements();

    expect(requirements.map((requirement) => requirement.domain)).toEqual([
      "bookings",
      "appointments",
      "clients",
      "travel",
      "portfolio",
      "notifications",
      "releases",
    ]);
    expect(requirements.every((requirement) => requirement.requiresAuth && requirement.requiresTenantScope)).toBe(true);
    expect(requirements.every((requirement) => requirement.gapIds.includes("GAP-043"))).toBe(true);
    expect(requirements.find((requirement) => requirement.screenId === "portfolio")?.requiredEndpoints).toContain(
      "/api/mobile/portfolio/upload-intents",
    );
  });

  it("blocks mobile API runtime readiness until typed clients, auth headers, screen wiring, and replay evidence exist", () => {
    const plan = buildMobileApiRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      mobileSupportTestsPassed: true,
      mobileSupportTypecheckPassed: false,
      mobileAppTypecheckPassed: false,
      mobileAppTestsPassed: false,
      apiClientImplemented: false,
      authHeadersWired: false,
      requestIdMiddlewareConfigured: true,
      tenantScopeHeaderConfigured: false,
      responseEnvelopeValidationConfigured: false,
      safeErrorRedactionConfigured: true,
      offlineRetryQueueConfigured: false,
      idempotencyPersistenceConfigured: false,
      seededApiSmokePassed: false,
      expiredAuthFailsSafelyTested: false,
      crossTenantDenialTested: false,
      offlineReplayTested: false,
      screensUsingApiClient: ["bookings", "clients"],
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingScreenDomains).toEqual(["appointments", "travel", "portfolio", "notifications", "releases"]);
    expect(plan.requiredCommands).toContain("offline reconnect/replay mobile test");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "mobile screen API-client wiring matrix for bookings, appointments, clients, travel, portfolio, notifications, and releases",
      "expired-auth and cross-tenant denial test output",
      "offline idempotent replay test output",
    ]));
    expect(plan.blockers).toContain("Typed Expo API client must be implemented before replacing static mobile data.");
  });

  it("tracks mobile device QA requirements without claiming runtime readiness", () => {
    const checklist = buildMobileDeviceQaChecklist();
    const summary = summarizeMobileDeviceQa(checklist);

    expect(summary.missingAreas).toEqual([]);
    expect(summary.productionReady).toBe(false);
    expect(summary.blockingItemIds).toEqual([
      "ios-screen-smoke",
      "android-screen-smoke",
      "biometric-lock-unlock",
      "tenant-api-sync",
      "offline-reconnect-sync",
      "push-token-delivery",
      "mobile-crash-capture",
      "ota-preview-rollback",
      "mobile-accessibility-pass",
    ]);
    expect(checklist.every((item) => item.gapIds.includes("GAP-048"))).toBe(true);
    expect(checklist.find((item) => item.area === "push_notifications")?.evidenceRequired).toContain("tap deep-link");
    expect(checklist.find((item) => item.area === "accessibility")?.platform).toBe("physical_device");
  });

  it("keeps the mobile device QA manifest aligned with generated checklist items", () => {
    const manifest = JSON.parse(readWorkspaceFile("testing/manifests/mobile-device-qa-checklist.json")) as {
      checks: Array<{ id: string; evidenceRequired: string; gaps: string[] }>;
    };
    const checklist = buildMobileDeviceQaChecklist();

    expect(manifest.checks.map((check) => check.id)).toEqual(checklist.map((item) => item.id));
    expect(manifest.checks.every((check) => check.evidenceRequired.length > 0)).toBe(true);
    expect(manifest.checks.filter((check) => check.gaps.includes("GAP-108")).length).toBeGreaterThanOrEqual(9);
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

  it("plans aggregate mobile runtime readiness without claiming Expo/provider/device proof", () => {
    const plan = buildMobileRuntimeReadinessPlan({
      packageScripts: {
        typecheck: "tsc --noEmit",
        build: "tsc --noEmit",
        test: "vitest run apps/mobile/tests/**/*.test.ts",
        ios: "expo start --ios",
        android: "expo start --android",
      },
      appJsonProjectId: "deployment-gated-see-GAP-008",
      appJsonUpdatesUrl: "https://u.expo.dev/deployment-gated-see-GAP-047",
      typecheckVerified: false,
      expoRuntimeVerified: false,
      iosSmokeVerified: false,
      androidSmokeVerified: false,
      easPreviewBuildVerified: false,
      authProviderConfigured: false,
      biometricGateConfigured: false,
      apiClientConfigured: false,
      pushProviderConfigured: false,
      encryptedOfflineStoreConfigured: false,
      crashReportingConfigured: false,
      otaUpdatesConfigured: false,
      deviceQaSummary: summarizeMobileDeviceQa(buildMobileDeviceQaChecklist()),
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredCommands).toContain("eas build --profile preview --platform all");
    expect(plan.requiredControls).toContain("Encrypt sensitive offline queue items and replay mutations idempotently after reconnect.");
    expect(plan.blockingQaItemIds).toContain("ios-screen-smoke");
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Expo runtime has not been launched locally for this scaffold.",
      "Mobile auth provider/session exchange is not configured.",
      "Tenant-scoped mobile API client is not configured.",
      "Expo/EAS project id is still deployment-gated.",
      "Mobile device QA checklist still has blocking runtime/provider/manual items.",
    ]));
  });
});
