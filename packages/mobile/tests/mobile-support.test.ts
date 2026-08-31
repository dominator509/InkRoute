import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileApiRuntimeReadinessPlan,
  buildMobileApiRequestPlan,
  buildMobileBookingLifecycleActionContract,
  buildMobileDeviceQaChecklist,
  buildMobileDeviceQaRuntimeReadinessPlan,
  buildMobileLaunchEvidencePlan,
  buildMobileRuntimeReadinessPlan,
  buildMobileScreenSyncRequirements,
  buildMobileCrashCaptureContract,
  buildMobileOtaRollbackContract,
  buildMobilePushLocalContract,
  buildMobileSecureSessionContract,
  buildMobileTestingExecutionReadinessPlan,
  buildMobileTravelPublishContract,
  buildMobileUploadIntentContract,
  buildMobileUploadObjectKey,
  buildOfflineQueueRepositoryContract,
  buildOfflineSyncAuditEvent,
  getMobileScreen,
  buildOfflineIdempotencyKey,
  buildOfflineRuntimeReadinessPlan,
  calculateOfflineRetryDelayMinutes,
  mobileApiRuntimeRequiredCommands,
  mobileApiRuntimeRequiredEvidence,
  mobileDeviceQaRuntimeReadinessRequiredCommands,
  mobileDeviceQaRuntimeReadinessRequiredEvidence,
  mobileLaunchEvidenceRequiredCommands,
  mobileLaunchEvidenceRequiredEvidence,
  mobileRuntimeReadinessRequiredCommands,
  mobileRuntimeReadinessRequiredControls,
  mobileScreenRegistry,
  mobileTestingExecutionReadinessRequiredCommands,
  mobileTestingExecutionReadinessRequiredEvidence,
  offlineRuntimeRequiredCommands,
  offlineRuntimeRequiredEvidence,
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
    expect(mobileScreenRegistry.find((screen) => screen.id === "bookings")?.phase6Status).toBe("local-contract-boundary");
    expect(mobileScreenRegistry.find((screen) => screen.id === "travel")?.summary).toContain("package-backed travel publish contract");
    expect(mobileScreenRegistry.find((screen) => screen.id === "portfolio")?.summary).toContain("upload-intent contract");
    expect(mobileScreenRegistry.find((screen) => screen.id === "offline")?.summary).toContain("shared repository");
    expect(mobileScreenRegistry.find((screen) => screen.id === "offline")?.summary).not.toContain("no durable local store wired yet");
  });

  it("returns screen metadata and rejects unknown ids", () => {
    expect(getMobileScreen("offline")).toMatchObject({
      id: "offline",
      phase6Status: "local-contract-boundary",
    });

    expect(() => getMobileScreen("unknown" as never)).toThrow("Unknown mobile screen: unknown");
  });

  it("builds a redacted local mobile secure-session contract without claiming provider login readiness", () => {
    const blocked = buildMobileSecureSessionContract({
      tenantId: "tenant_001",
      userId: "user_001",
      role: "owner",
      accessTokenPreview: "access_***",
      refreshTokenStored: true,
      secureStoreAvailable: true,
      biometricRequired: true,
      biometricUnlocked: false,
      expiresAt: "2026-06-09T23:59:59.000Z",
      now: "2026-06-09T00:00:00.000Z",
    });
    const unsafe = buildMobileSecureSessionContract({
      tenantId: "",
      userId: "",
      role: "viewer",
      accessTokenPreview: "raw-token",
      refreshTokenStored: false,
      secureStoreAvailable: false,
      biometricRequired: false,
      biometricUnlocked: false,
      expiresAt: "2026-06-08T00:00:00.000Z",
      now: "2026-06-09T00:00:00.000Z",
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      tenantScoped: true,
      secureStoreRequired: true,
      biometricGateRequired: true,
      providerLoginRuntimeGated: true,
      tokenMaterialRedacted: true,
      blockers: ["Biometric unlock is required before this mobile session can access tenant data."],
      requiredEvidence: ["biometric unlock proof"],
    });
    expect(unsafe.blockers).toEqual([
      "Tenant scope is required before mobile session access.",
      "User id is required before mobile session access.",
      "Mobile access token material must be redacted in local contracts.",
      "Refresh token storage must be available before mobile session recovery.",
      "Expo SecureStore or equivalent encrypted storage must be available before production session use.",
      "Mobile session is expired and must refresh or sign in again.",
    ]);
  });

  it("builds a local mobile crash capture contract without claiming Sentry or device proof", () => {
    const contract = buildMobileCrashCaptureContract({
      fallbackReporterConfigured: true,
      offlineBufferConfigured: true,
      beforeSendRedactionConfigured: true,
      sourceMapsUploaded: false,
      debugSymbolsUploaded: false,
      forcedCrashProofCaptured: false,
      providerPayloadNoPiiVerified: false,
    });

    expect(contract).toMatchObject({
      status: "blocked",
      localFallbackReady: true,
      providerCaptureRuntimeGated: true,
      deviceProofRuntimeGated: true,
      redactionRequired: true,
    });
    expect(contract.blockers).toEqual([
      "Expo source maps must upload before provider crash resolution is production-ready.",
      "React Native debug symbols must upload before provider crash resolution is production-ready.",
      "Forced simulator/device crash proof must be captured before closure.",
      "Provider payloads must be proven free of PII, medical, payment, token, and private URL values.",
    ]);
    expect(contract.requiredEvidence).toEqual([
      "source-map and debug-symbol upload proof",
      "forced simulator/device crash proof",
      "no-PII provider payload proof",
    ]);
  });

  it("builds a local OTA rollback contract without claiming EAS provider proof", () => {
    const blocked = buildMobileOtaRollbackContract({
      runtimeVersion: "1.0.0",
      channel: "preview",
      currentUpdateId: undefined,
      previousCompatibleUpdateId: undefined,
      redactedDeviceReceipts: 0,
      failedReceipts: 1,
      rollbackRepublishCommandRecorded: false,
      easProjectConfigured: false,
    });
    const readyLocalContract = buildMobileOtaRollbackContract({
      runtimeVersion: "1.0.0",
      channel: "preview",
      currentUpdateId: "update_preview_001",
      previousCompatibleUpdateId: "update_previous_001",
      redactedDeviceReceipts: 3,
      failedReceipts: 1,
      rollbackRepublishCommandRecorded: true,
      easProjectConfigured: true,
    });

    expect(blocked.rollbackCommand).toBe("eas update --channel preview --message rollback-republish-drill --non-interactive");
    expect(blocked).toMatchObject({
      status: "blocked",
      providerExecutionGated: true,
      redactedAdoptionOnly: true,
      rollbackTargetUpdateId: null,
    });
    expect(blocked.requiredEvidence).toEqual([
      "EAS project/update id proof",
      "redacted OTA adoption and failure proof",
      "rollback republish proof",
    ]);
    expect(readyLocalContract).toMatchObject({
      status: "ready",
      providerExecutionGated: true,
      redactedAdoptionOnly: true,
      rollbackTargetUpdateId: "update_previous_001",
      blockers: [],
      requiredEvidence: ["redacted OTA adoption and failure proof"],
    });
  });

  it("builds a local mobile push contract without claiming Expo credentials or device QA", () => {
    const contract = buildMobilePushLocalContract({
      permissionRuntimeImplemented: true,
      tokenRegistrationRuntimeImplemented: true,
      optOutPersistenceContract: true,
      receiptIdempotencyContract: true,
      invalidTokenSuppressionContract: true,
      safeTapRoutingContract: true,
      auditLogContract: true,
      expoCredentialsConfigured: false,
      foregroundBackgroundDeviceQaPassed: false,
    });

    expect(contract).toMatchObject({
      status: "blocked",
      localContractReady: true,
      providerExecutionGated: true,
      deviceQaGated: true,
      requiredEvidence: ["Expo push credential proof", "foreground/background/tap device QA proof"],
    });
    expect(contract.blockers).toEqual([
      "Expo project/access token and APNs/FCM credentials remain provider-gated.",
      "Foreground/background/tap push QA must pass on device before closure.",
    ]);

    const missingLocalInput = buildMobilePushLocalContract({
      permissionRuntimeImplemented: false,
      tokenRegistrationRuntimeImplemented: true,
      optOutPersistenceContract: true,
      receiptIdempotencyContract: true,
      invalidTokenSuppressionContract: true,
      safeTapRoutingContract: true,
      auditLogContract: true,
      expoCredentialsConfigured: false,
      foregroundBackgroundDeviceQaPassed: false,
    });

    expect(missingLocalInput.localContractReady).toBe(false);
    expect(missingLocalInput.blockers).toContain(
      "Push permission runtime contract input is required before the local mobile push contract is ready.",
    );
    expect(missingLocalInput.blockers).not.toContain("Push permission runtime contract must be wired before mobile push can close.");
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

    const idempotencyKey = buildOfflineIdempotencyKey(items[0]!);
    expect(idempotencyKey).toMatch(/^offline:[a-f0-9]{64}$/);
    expect(idempotencyKey).not.toContain("tenant_001");
    expect(calculateOfflineRetryDelayMinutes(3)).toBe(8);
    expect(blocked.productionReady).toBe(false);
    expect(blocked.warning).toBe(
      "Offline sync planning and app-side worker contract are wired; encrypted device persistence, server conflict integration, and reconnect proof remain runtime-gated.",
    );
    expect(blocked.warning).not.toContain("runtime worker execution remain unimplemented");
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

  it("defines a local offline repository and redacted audit contract without claiming device persistence", () => {
    const contract = buildOfflineQueueRepositoryContract({
      adapter: "memory-contract",
      encryptedAtRest: false,
      restartPersistence: false,
      auditTrailPersistence: true,
      idempotentReplay: true,
      syncWorker: true,
    });
    const item: OfflineQueueItem = {
      id: "offline_sensitive_1",
      kind: "client_note",
      label: "Sensitive client note",
      status: "queued",
      createdAt: "2026-06-08T01:00:00.000Z",
      retryCount: 0,
      sensitive: true,
      tenantId: "tenant_001",
      entityId: "client_001",
    };
    const [decision] = planOfflineSync({
      items: [item],
      generatedAt: "2026-06-08T01:05:00.000Z",
      encryptedStoreAvailable: false,
    }).decisions;

    expect(contract).toMatchObject({
      adapter: "memory-contract",
      productionReady: false,
      auditTrailPersistence: true,
      idempotentReplay: true,
      syncWorker: true,
    });
    expect(contract.requiredEvidence).toEqual([
      "encrypted offline storage adapter and at-rest encryption proof",
      "device restart and airplane-mode reconnect evidence",
    ]);
    expect(buildOfflineSyncAuditEvent(item, decision!, "2026-06-08T01:05:00.000Z")).toMatchObject({
      itemIdHash: expect.any(String),
      rawItemIdEchoed: false,
      decision: "blocked_unencrypted",
      idempotencyKeyHash: expect.any(String),
      rawIdempotencyKeyEchoed: false,
      sensitive: true,
      redactedDetail: "Sensitive offline payload redacted.",
    });
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
    expect(plan.requiredCommands).toBe(offlineRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(offlineRuntimeRequiredEvidence);
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
    expect(plan.headerProof).toMatchObject({
      authorizationHeaderAttached: true,
      tenantHeaderAttached: true,
      requestIdHeaderAttached: true,
      idempotencyHeaderAttached: true,
      rawAuthorizationHeaderEchoed: false,
      rawAccessTokenEchoed: false,
      rawTenantIdEchoed: false,
      rawRequestIdEchoed: false,
      rawIdempotencyKeyEchoed: false,
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

  it("builds a local mobile booking lifecycle action contract while keeping provider execution gated", () => {
    const contract = buildMobileBookingLifecycleActionContract({
      tenantId: "tenant_001",
      bookingId: "booking_001",
      requestId: "req_booking_001",
      idempotencyKey: "idem_booking_001",
      action: "accept",
      authenticatedApiReady: true,
      stateEventContractReady: true,
      calendarConflictCheckReady: true,
      notificationHandoffReady: true,
      auditLogContractReady: true,
      providerExecutionVerified: false,
    });

    expect(contract).toMatchObject({
      status: "blocked",
      localContractReady: true,
      providerExecutionGated: true,
      endpoint: "/api/mobile/bookings/:id/actions",
      method: "POST",
      action: "accept",
      blockers: ["Provider-backed booking lifecycle execution proof remains required."],
      requiredEvidence: ["provider-backed booking lifecycle execution proof"],
    });
    expect(contract.requiredHeaders).toEqual(["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"]);
    expect(contract.metadata).toMatchObject({
      tenantScopeRequired: true,
      bookingIdRequired: true,
      requestIdRequired: true,
      rawTenantIdEchoed: false,
      rawBookingIdEchoed: false,
      rawRequestIdEchoed: false,
      idempotencyKeyRequired: true,
      rawIdempotencyKeyEchoed: false,
    });
    expect(contract.metadata).not.toHaveProperty("tenantId");
    expect(contract.metadata).not.toHaveProperty("bookingId");
    expect(contract.metadata).not.toHaveProperty("requestId");
    expect(contract.metadata).not.toHaveProperty("idempotencyKey");

    const unsafe = buildMobileBookingLifecycleActionContract({
      tenantId: "",
      bookingId: "",
      requestId: "",
      idempotencyKey: "",
      action: "decline",
      authenticatedApiReady: false,
      stateEventContractReady: false,
      calendarConflictCheckReady: false,
      notificationHandoffReady: false,
      auditLogContractReady: false,
      providerExecutionVerified: false,
    });

    expect(unsafe.localContractReady).toBe(false);
    expect(unsafe.blockers).toContain("Booking id is required for booking lifecycle action.");
    expect(unsafe.blockers).toContain(
      "Authenticated booking lifecycle API contract input is required before the local action contract is ready.",
    );
    expect(unsafe.blockers).not.toContain("Authenticated booking lifecycle API contract must be wired before action execution.");
    expect(unsafe.requiredEvidence).toEqual([
      "authenticated booking lifecycle API contract",
      "booking state event contract",
      "calendar conflict check contract",
      "booking notification handoff contract",
      "booking lifecycle audit log contract",
      "provider-backed booking lifecycle execution proof",
    ]);
  });

  it("builds a local mobile travel publish contract while keeping provider execution gated", () => {
    const contract = buildMobileTravelPublishContract({
      tenantId: "tenant_001",
      travelScheduleId: "travel_001",
      citySlug: "oakland-ca",
      requestId: "req_travel_001",
      idempotencyKey: "idem_travel_001",
      authenticatedApiReady: true,
      auditLogContractReady: true,
      publicCacheRevalidationContractReady: true,
      notificationFanoutContractReady: true,
      seoRevalidationContractReady: true,
      providerExecutionVerified: false,
    });

    expect(contract).toMatchObject({
      status: "blocked",
      localContractReady: true,
      providerExecutionGated: true,
      endpoint: "/api/mobile/travel-stops/:id/publish",
      method: "POST",
      blockers: ["Provider-backed travel publish execution proof remains required."],
      requiredEvidence: ["provider-backed travel publish execution proof"],
    });
    expect(contract.requiredHeaders).toEqual(["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"]);
    expect(contract.metadata).toMatchObject({
      tenantScopeRequired: true,
      travelScheduleIdRequired: true,
      citySlugValidated: true,
      requestIdRequired: true,
      rawTenantIdEchoed: false,
      rawTravelScheduleIdEchoed: false,
      rawRequestIdEchoed: false,
      idempotencyKeyRequired: true,
      rawIdempotencyKeyEchoed: false,
    });
    expect(contract.metadata).not.toHaveProperty("tenantId");
    expect(contract.metadata).not.toHaveProperty("travelScheduleId");
    expect(contract.metadata).not.toHaveProperty("requestId");
    expect(contract.metadata).not.toHaveProperty("idempotencyKey");

    const unsafe = buildMobileTravelPublishContract({
      tenantId: "",
      travelScheduleId: "travel_001",
      citySlug: "../oakland",
      requestId: "",
      idempotencyKey: "",
      authenticatedApiReady: false,
      auditLogContractReady: false,
      publicCacheRevalidationContractReady: false,
      notificationFanoutContractReady: false,
      seoRevalidationContractReady: false,
      providerExecutionVerified: false,
    });

    expect(unsafe.localContractReady).toBe(false);
    expect(unsafe.blockers).toContain("Travel city slug must be normalized before publish.");
    expect(unsafe.blockers).toContain(
      "Authenticated mobile travel API contract input is required before the local publish contract is ready.",
    );
    expect(unsafe.blockers).not.toContain("Authenticated mobile travel API contract must be wired before publish.");
    expect(unsafe.requiredEvidence).toEqual([
      "authenticated mobile travel API contract",
      "travel publish audit log contract",
      "public travel cache revalidation contract",
      "travel notification fanout contract",
      "travel SEO revalidation contract",
      "provider-backed travel publish execution proof",
    ]);
  });

  it("builds tenant-scoped mobile upload intent contracts without claiming provider storage readiness", () => {
    const contract = buildMobileUploadIntentContract({
      tenantId: "tenant_001",
      requestId: "req_upload_001",
      idempotencyKey: "idem_upload_001",
      kind: "portfolio_public",
      filename: "Black Sun Flash.JPG",
      mimeType: "image/jpeg",
      sizeBytes: 950000,
      city: "Oakland",
      altText: "Blackwork sun flash tattoo concept",
      styleTags: ["blackwork", "flash"],
    });

    expect(contract).toMatchObject({
      status: "ready",
      endpoint: "/api/mobile/portfolio/upload-intents",
      method: "POST",
      providerSignedUploadRequired: true,
      providerStorageRuntimeGated: true,
      metadataReady: true,
      blockers: [],
    });
    expect(contract.requiredHeaders).toEqual(["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"]);
    expect(contract.objectKey).toMatch(/^mobile\/portfolio_public\/[a-f0-9]{64}\/black-sun-flash\.jpg$/);
    expect(contract.objectKey).not.toContain("tenant_001");
    expect(contract.objectKey).not.toContain("req_upload_001");
    const privateObjectKey = buildMobileUploadObjectKey({
      tenantId: "tenant_001",
      requestId: "req_upload_002",
      kind: "reference_private",
      filename: "../Client Reference HEIC",
    });
    expect(privateObjectKey).toMatch(/^mobile\/reference_private\/[a-f0-9]{64}\/client-reference-heic$/);
    expect(privateObjectKey).not.toContain("tenant_001");
    expect(privateObjectKey).not.toContain("req_upload_002");
  });

  it("blocks unsafe mobile upload intent contracts before provider signing", () => {
    const contract = buildMobileUploadIntentContract({
      tenantId: "",
      requestId: "",
      idempotencyKey: "",
      kind: "portfolio_public",
      filename: "",
      mimeType: "application/pdf",
      sizeBytes: 0,
    });

    expect(contract.status).toBe("blocked");
    expect(contract.objectKey).toBeNull();
    expect(contract.blockers).toEqual([
      "Tenant scope is required before mobile upload intents can be requested.",
      "Request id is required for mobile upload traceability.",
      "Idempotency key is required before mobile upload intents can be retried safely.",
      "Filename is required before creating a mobile upload intent.",
      "Mobile uploads must be image MIME types before provider signing.",
      "Mobile upload size must be positive.",
      "Public portfolio uploads require alt text before publication.",
    ]);
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
    expect(plan.requiredCommands).toBe(mobileApiRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(mobileApiRuntimeRequiredEvidence);
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

  it("blocks Phase 6 mobile device QA readiness until Expo app, simulator, accessibility, provider, and artifact evidence exists", () => {
    const plan = buildMobileDeviceQaRuntimeReadinessPlan({
      packageScripts: {
        test: "vitest run apps/mobile/tests/**/*.test.ts",
        ios: "expo start --ios",
      },
      mobileSupportTestsPassed: true,
      mobileSupportTypecheckPassed: false,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: true,
      expoComponentRenderTestsPassed: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceSmokePassed: false,
      accessibilityChecksPassed: false,
      offlineQaPassed: false,
      pushQaPassed: false,
      crashQaPassed: false,
      otaRollbackQaPassed: false,
      qaManifestSynced: true,
      ciHooksConfigured: false,
      qaArtifactsAttached: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck", "android"]);
    expect(plan.requiredCommands).toBe(mobileDeviceQaRuntimeReadinessRequiredCommands);
    expect(plan.requiredCommands).toEqual(
      expect.arrayContaining([
        "pnpm --filter @inkroute/mobile-support test",
        "pnpm --filter @inkroute/mobile typecheck",
        "pnpm --filter @inkroute/mobile ios",
        "pnpm --filter @inkroute/mobile android",
        "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
      ]),
    );
    expect(plan.requiredEvidence).toBe(mobileDeviceQaRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Expo app component/render tests must cover registered screens.");
    expect(plan.blockers).toContain("Mobile QA artifacts must include simulator screenshots/logs, accessibility notes, provider/device transcripts, and release evidence.");
  });

  it("keeps production-blocking integration boundaries visible", () => {
    expect(phase6MobileBoundaries.filter((boundary) => boundary.blocksProduction).map((boundary) => boundary.id)).toEqual([
      "mobile-auth",
      "mobile-api",
      "mobile-push",
      "mobile-offline-store",
      "mobile-crash",
    ]);
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-api")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-auth")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-push")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-offline-store")?.status).toBe("local-contract");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-crash")?.detail).toContain("package-backed sanitized fallback/offline-buffer crash reporter contract is wired");
    expect(phase6MobileBoundaries.find((boundary) => boundary.id === "mobile-offline-store")?.detail).toContain("encrypted SQLite/AsyncStorage persistence");
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
    expect(plan.requiredCommands).toBe(mobileRuntimeReadinessRequiredCommands);
    expect(plan.requiredControls).toBe(mobileRuntimeReadinessRequiredControls);
    expect(plan.blockingQaItemIds).toContain("ios-screen-smoke");
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Expo runtime has not been launched locally for this mobile contract.",
      "Mobile auth provider/session exchange is not configured.",
      "Tenant-scoped mobile API client is not configured.",
      "Expo/EAS project id is still deployment-gated.",
      "Mobile device QA checklist still has blocking runtime/provider/manual items.",
    ]));
    expect(plan.blockers).not.toContain("Expo runtime has not been launched locally for this scaffold.");
  });
  it("blocks mobile testing execution readiness until Expo, simulator, device, provider, OTA, accessibility, artifacts, and CI evidence exist", () => {
    const plan = buildMobileTestingExecutionReadinessPlan({
      packageScripts: { test: "vitest run" },
      mobileSupportTestsPassed: true,
      mobileSupportTypecheckPassed: false,
      mobileAppTypecheckPassed: false,
      mobileStaticTestsPassed: true,
      expoDependenciesInstalled: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      physicalDeviceChecklistCompleted: false,
      biometricLockQaPassed: false,
      tenantApiSyncQaPassed: false,
      offlineReconnectQaPassed: false,
      pushTokenDeliveryQaPassed: false,
      crashCaptureQaPassed: false,
      easPreviewBuildPassed: false,
      easUpdateRollbackPassed: false,
      accessibilityQaPassed: false,
      qaChecklistManifestSynced: true,
      artifactsCaptured: false,
      ciMobileChecksPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck", "ios", "android"]);
    expect(plan.requiredCommands).toBe(mobileTestingExecutionReadinessRequiredCommands);
    expect(plan.requiredEvidence).toBe(mobileTestingExecutionReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Offline reconnect QA must prove encrypted queue persistence, idempotent replay, retry, and conflict handling.");
    expect(plan.blockers).toContain("EAS update rollback QA must prove preview adoption and rollback republish on the same runtime.");
  });

  it("marks mobile testing execution ready only after Expo, simulator, device, provider, OTA, accessibility, artifact, and CI evidence exists", () => {
    const plan = buildMobileTestingExecutionReadinessPlan({
      packageScripts: { test: "vitest run", typecheck: "tsc --noEmit", ios: "expo start --ios", android: "expo start --android" },
      mobileSupportTestsPassed: true,
      mobileSupportTypecheckPassed: true,
      mobileAppTypecheckPassed: true,
      mobileStaticTestsPassed: true,
      expoDependenciesInstalled: true,
      expoRuntimeStarted: true,
      iosSimulatorSmokePassed: true,
      androidEmulatorSmokePassed: true,
      physicalDeviceChecklistCompleted: true,
      biometricLockQaPassed: true,
      tenantApiSyncQaPassed: true,
      offlineReconnectQaPassed: true,
      pushTokenDeliveryQaPassed: true,
      crashCaptureQaPassed: true,
      easPreviewBuildPassed: true,
      easUpdateRollbackPassed: true,
      accessibilityQaPassed: true,
      qaChecklistManifestSynced: true,
      artifactsCaptured: true,
      ciMobileChecksPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks mobile launch evidence until Expo, provider, device, OTA, accessibility, CI, and artifact proof exists", () => {
    const plan = buildMobileLaunchEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", test: "vitest run" },
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: false,
      mobileAppTestsPassed: false,
      expoRuntimeStarted: false,
      iosSimulatorSmokePassed: false,
      androidEmulatorSmokePassed: false,
      easPreviewBuildPassed: false,
      authSessionBiometricQaPassed: false,
      tenantApiClientQaPassed: false,
      pushNotificationQaPassed: false,
      encryptedOfflineStoreQaPassed: false,
      uploadFlowQaPassed: false,
      crashReportingQaPassed: false,
      otaUpdateRollbackQaPassed: false,
      physicalDeviceQaCompleted: false,
      accessibilityQaPassed: false,
      appJsonProjectConfigured: false,
      easChannelsConfigured: false,
      ciEvidenceCaptured: false,
      launchArtifactsSecretSafe: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["ios", "android"]);
    expect(plan.requiredCommands).toBe(mobileLaunchEvidenceRequiredCommands);
    expect(plan.requiredEvidence).toBe(mobileLaunchEvidenceRequiredEvidence);
    expect(plan.blockers).toContain("Tenant-scoped mobile API client QA must pass against preview APIs.");
    expect(plan.blockers).toContain("OTA update and rollback QA must pass with package-backed rollback command/adoption contracts on the same runtime version.");
    expect(plan.blockers).toContain("Mobile launch artifacts must be redacted and free of secrets, tokens, PII, medical, or payment data.");
  });

  it("marks mobile launch evidence ready when Expo, provider, device, OTA, accessibility, CI, and artifact proof align", () => {
    const plan = buildMobileLaunchEvidencePlan({
      packageScripts: { typecheck: "tsc --noEmit", test: "vitest run", ios: "expo start --ios", android: "expo start --android" },
      mobileSupportTypecheckPassed: true,
      mobileSupportTestsPassed: true,
      mobileAppTypecheckPassed: true,
      mobileAppTestsPassed: true,
      expoRuntimeStarted: true,
      iosSimulatorSmokePassed: true,
      androidEmulatorSmokePassed: true,
      easPreviewBuildPassed: true,
      authSessionBiometricQaPassed: true,
      tenantApiClientQaPassed: true,
      pushNotificationQaPassed: true,
      encryptedOfflineStoreQaPassed: true,
      uploadFlowQaPassed: true,
      crashReportingQaPassed: true,
      otaUpdateRollbackQaPassed: true,
      physicalDeviceQaCompleted: true,
      accessibilityQaPassed: true,
      appJsonProjectConfigured: true,
      easChannelsConfigured: true,
      ciEvidenceCaptured: true,
      launchArtifactsSecretSafe: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
