export type MobileScreenId =
  | "auth"
  | "home"
  | "bookings"
  | "appointments"
  | "clients"
  | "travel"
  | "portfolio"
  | "notifications"
  | "offline"
  | "system";

export interface MobileScreenDefinition {
  id: MobileScreenId;
  label: string;
  shortLabel: string;
  summary: string;
  phase6Status: "implemented-static" | "local-contract-boundary" | "provider-gated" | "runtime-gated";
}

export const mobileScreenRegistry: readonly MobileScreenDefinition[] = [
  {
    id: "auth",
    label: "Secure login",
    shortLabel: "Auth",
    summary: "Mock login posture with biometric and session boundaries called out for provider implementation.",
    phase6Status: "local-contract-boundary",
  },
  {
    id: "home",
    label: "Artist command center",
    shortLabel: "Home",
    summary: "Daily mobile overview for bookings, deposits, travel, and system state using demo data.",
    phase6Status: "implemented-static",
  },
  {
    id: "bookings",
    label: "Booking requests",
    shortLabel: "Requests",
    summary: "Mobile review queue with readiness score and package-backed local lifecycle action boundaries.",
    phase6Status: "local-contract-boundary",
  },
  {
    id: "appointments",
    label: "Appointments",
    shortLabel: "Calendar",
    summary: "Travel-aware appointment list with buffers and timezone context; provider sync remains gated.",
    phase6Status: "implemented-static",
  },
  {
    id: "clients",
    label: "Client profiles",
    shortLabel: "Clients",
    summary: "Mobile-safe client timeline preview with PII/medical privacy boundaries visible.",
    phase6Status: "implemented-static",
  },
  {
    id: "travel",
    label: "Nomad updates",
    shortLabel: "Travel",
    summary: "Artist-facing tool with package-backed travel publish contract for city status, waitlists, guest spot updates, notification fanout, and SEO revalidation.",
    phase6Status: "local-contract-boundary",
  },
  {
    id: "portfolio",
    label: "Portfolio upload",
    shortLabel: "Portfolio",
    summary: "Portfolio metadata and upload-intent contract for style tags, placement, freshness, city, alt text, and object-key boundaries.",
    phase6Status: "local-contract-boundary",
  },
  {
    id: "notifications",
    label: "Notifications",
    shortLabel: "Notify",
    summary: "Push/email/SMS message templates and delivery-state posture; providers remain credential-gated.",
    phase6Status: "provider-gated",
  },
  {
    id: "offline",
    label: "Offline notes",
    shortLabel: "Offline",
    summary: "Offline-first queue model with shared repository, retry, idempotency, and redacted audit contracts; encrypted device persistence remains gated.",
    phase6Status: "local-contract-boundary",
  },
  {
    id: "system",
    label: "Crash and updates",
    shortLabel: "System",
    summary: "Crash reporting, release channel, OTA update, and privacy redaction boundaries.",
    phase6Status: "runtime-gated",
  },
];

export type MobileSessionStatus = "signed_out" | "mock_owner" | "expired" | "biometric_locked";

export interface MobileSessionPreview {
  status: MobileSessionStatus;
  tenantSlug?: string;
  userLabel?: string;
  roleLabel?: string;
  biometricAvailable: boolean;
  sessionBoundary: string;
}

export interface MobileSecureSessionContractInput {
  tenantId: string;
  userId: string;
  role: "owner" | "artist" | "manager" | "assistant" | "viewer";
  accessTokenPreview: string;
  refreshTokenStored: boolean;
  secureStoreAvailable: boolean;
  biometricRequired: boolean;
  biometricUnlocked: boolean;
  expiresAt: string;
  now: string;
}

export interface MobileSecureSessionContract {
  status: "ready" | "blocked";
  tenantScoped: boolean;
  secureStoreRequired: boolean;
  biometricGateRequired: boolean;
  providerLoginRuntimeGated: true;
  tokenMaterialRedacted: true;
  blockers: readonly string[];
  requiredEvidence: readonly string[];
}

export interface MobileCrashCaptureContractInput {
  fallbackReporterConfigured: boolean;
  offlineBufferConfigured: boolean;
  beforeSendRedactionConfigured: boolean;
  sourceMapsUploaded: boolean;
  debugSymbolsUploaded: boolean;
  forcedCrashProofCaptured: boolean;
  providerPayloadNoPiiVerified: boolean;
}

export interface MobileCrashCaptureContract {
  status: "ready" | "blocked";
  localFallbackReady: boolean;
  providerCaptureRuntimeGated: true;
  deviceProofRuntimeGated: boolean;
  redactionRequired: true;
  blockers: readonly string[];
  requiredEvidence: readonly string[];
}

export interface MobileOtaRollbackContractInput {
  runtimeVersion: string;
  channel: "preview" | "production";
  currentUpdateId?: string;
  previousCompatibleUpdateId?: string;
  redactedDeviceReceipts: number;
  failedReceipts: number;
  rollbackRepublishCommandRecorded: boolean;
  easProjectConfigured: boolean;
}

export interface MobileOtaRollbackContract {
  status: "ready" | "blocked";
  runtimeVersion: string;
  channel: "preview" | "production";
  rollbackCommand: "eas update --channel preview --message rollback-republish-drill --non-interactive";
  providerExecutionGated: true;
  redactedAdoptionOnly: true;
  rollbackTargetUpdateId: string | null;
  blockers: readonly string[];
  requiredEvidence: readonly string[];
}

export interface MobilePushLocalContractInput {
  permissionRuntimeImplemented: boolean;
  tokenRegistrationRuntimeImplemented: boolean;
  optOutPersistenceContract: boolean;
  receiptIdempotencyContract: boolean;
  invalidTokenSuppressionContract: boolean;
  safeTapRoutingContract: boolean;
  auditLogContract: boolean;
  expoCredentialsConfigured: boolean;
  foregroundBackgroundDeviceQaPassed: boolean;
}

export interface MobilePushLocalContract {
  status: "ready" | "blocked";
  localContractReady: boolean;
  providerExecutionGated: true;
  deviceQaGated: boolean;
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export function buildMobileSecureSessionContract(input: MobileSecureSessionContractInput): MobileSecureSessionContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];
  if (!input.tenantId) blockers.push("Tenant scope is required before mobile session access.");
  if (!input.userId) blockers.push("User id is required before mobile session access.");
  if (!input.accessTokenPreview || !input.accessTokenPreview.includes("***")) blockers.push("Mobile access token material must be redacted in local contracts.");
  if (!input.refreshTokenStored) blockers.push("Refresh token storage must be available before mobile session recovery.");
  if (!input.secureStoreAvailable) blockers.push("Expo SecureStore or equivalent encrypted storage must be available before production session use.");
  if (input.biometricRequired && !input.biometricUnlocked) blockers.push("Biometric unlock is required before this mobile session can access tenant data.");
  if (new Date(input.expiresAt).getTime() <= new Date(input.now).getTime()) blockers.push("Mobile session is expired and must refresh or sign in again.");

  if (!input.secureStoreAvailable) requiredEvidence.push("secure token storage proof");
  if (input.biometricRequired && !input.biometricUnlocked) requiredEvidence.push("biometric unlock proof");
  if (!input.refreshTokenStored) requiredEvidence.push("refresh token recovery proof");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    tenantScoped: Boolean(input.tenantId && input.userId),
    secureStoreRequired: true,
    biometricGateRequired: input.biometricRequired,
    providerLoginRuntimeGated: true,
    tokenMaterialRedacted: true,
    blockers,
    requiredEvidence,
  };
}

export function buildMobilePushLocalContract(input: MobilePushLocalContractInput): MobilePushLocalContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];
  if (!input.permissionRuntimeImplemented) blockers.push("Push permission runtime contract input is required before the local mobile push contract is ready.");
  if (!input.tokenRegistrationRuntimeImplemented) blockers.push("Push token registration contract input is required before the local mobile push contract is ready.");
  if (!input.optOutPersistenceContract) blockers.push("Push opt-out persistence contract input is required before the local mobile push contract is ready.");
  if (!input.receiptIdempotencyContract) blockers.push("Expo receipt idempotency contract input is required before the local mobile push contract is ready.");
  if (!input.invalidTokenSuppressionContract) blockers.push("Invalid-token suppression contract input is required before the local mobile push contract is ready.");
  if (!input.safeTapRoutingContract) blockers.push("Safe internal tap-routing contract input is required before the local mobile push contract is ready.");
  if (!input.auditLogContract) blockers.push("Push audit-log contract input is required before the local mobile push contract is ready.");
  if (!input.expoCredentialsConfigured) blockers.push("Expo project/access token and APNs/FCM credentials remain provider-gated.");
  if (!input.foregroundBackgroundDeviceQaPassed) blockers.push("Foreground/background/tap push QA must pass on device before closure.");

  if (!input.expoCredentialsConfigured) requiredEvidence.push("Expo push credential proof");
  if (!input.foregroundBackgroundDeviceQaPassed) requiredEvidence.push("foreground/background/tap device QA proof");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    localContractReady:
      input.permissionRuntimeImplemented &&
      input.tokenRegistrationRuntimeImplemented &&
      input.optOutPersistenceContract &&
      input.receiptIdempotencyContract &&
      input.invalidTokenSuppressionContract &&
      input.safeTapRoutingContract &&
      input.auditLogContract,
    providerExecutionGated: true,
    deviceQaGated: !input.foregroundBackgroundDeviceQaPassed,
    requiredEvidence,
    blockers,
  };
}

export function buildMobileOtaRollbackContract(input: MobileOtaRollbackContractInput): MobileOtaRollbackContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];
  if (!input.runtimeVersion) blockers.push("Runtime version is required before OTA rollback can be evaluated.");
  if (!input.easProjectConfigured) blockers.push("Expo/EAS project configuration is required before OTA rollback proof is meaningful.");
  if (!input.currentUpdateId) blockers.push("Current preview update id must be recorded before OTA adoption can be evaluated.");
  if (input.redactedDeviceReceipts <= 0) blockers.push("Redacted device receipt counts are required before OTA promotion or rollback.");
  if (input.failedReceipts > 0 && !input.previousCompatibleUpdateId) blockers.push("Previous compatible update id is required before rollback republish.");
  if (!input.rollbackRepublishCommandRecorded) blockers.push("Rollback republish command evidence must be captured with the pinned non-interactive command.");

  if (!input.easProjectConfigured || !input.currentUpdateId) requiredEvidence.push("EAS project/update id proof");
  if (input.redactedDeviceReceipts <= 0 || input.failedReceipts > 0) requiredEvidence.push("redacted OTA adoption and failure proof");
  if (!input.rollbackRepublishCommandRecorded || (input.failedReceipts > 0 && !input.previousCompatibleUpdateId)) {
    requiredEvidence.push("rollback republish proof");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    runtimeVersion: input.runtimeVersion,
    channel: input.channel,
    rollbackCommand: "eas update --channel preview --message rollback-republish-drill --non-interactive",
    providerExecutionGated: true,
    redactedAdoptionOnly: true,
    rollbackTargetUpdateId: input.previousCompatibleUpdateId ?? null,
    blockers,
    requiredEvidence,
  };
}

export function buildMobileCrashCaptureContract(input: MobileCrashCaptureContractInput): MobileCrashCaptureContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];
  if (!input.fallbackReporterConfigured) blockers.push("Fallback mobile crash reporter must persist sanitized reports.");
  if (!input.offlineBufferConfigured) blockers.push("Offline mobile crash buffer must retain sanitized reports for reconnect.");
  if (!input.beforeSendRedactionConfigured) blockers.push("Mobile crash capture must redact before provider submission or fallback persistence.");
  if (!input.sourceMapsUploaded) blockers.push("Expo source maps must upload before provider crash resolution is production-ready.");
  if (!input.debugSymbolsUploaded) blockers.push("React Native debug symbols must upload before provider crash resolution is production-ready.");
  if (!input.forcedCrashProofCaptured) blockers.push("Forced simulator/device crash proof must be captured before closure.");
  if (!input.providerPayloadNoPiiVerified) blockers.push("Provider payloads must be proven free of PII, medical, payment, token, and private URL values.");

  if (!input.sourceMapsUploaded || !input.debugSymbolsUploaded) requiredEvidence.push("source-map and debug-symbol upload proof");
  if (!input.forcedCrashProofCaptured) requiredEvidence.push("forced simulator/device crash proof");
  if (!input.providerPayloadNoPiiVerified) requiredEvidence.push("no-PII provider payload proof");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    localFallbackReady: input.fallbackReporterConfigured && input.offlineBufferConfigured && input.beforeSendRedactionConfigured,
    providerCaptureRuntimeGated: true,
    deviceProofRuntimeGated: !input.forcedCrashProofCaptured,
    redactionRequired: true,
    blockers,
    requiredEvidence,
  };
}

export interface MobileIntegrationBoundary {
  id: string;
  label: string;
  status: "mocked" | "local-contract" | "scaffolded" | "credential-gated" | "deployment-gated" | "externally-dependent";
  blocksProduction: boolean;
  detail: string;
}

export const phase6MobileBoundaries: readonly MobileIntegrationBoundary[] = [
  {
    id: "mobile-auth",
    label: "Auth and biometric unlock",
    status: "local-contract",
    blocksProduction: true,
    detail: "Secure-session, redacted token preview, biometric gate, refresh/logout, tenant-scope, and audit contracts are wired locally; provider login, device SecureStore proof, revocation, and biometric device QA remain gated.",
  },
  {
    id: "mobile-api",
    label: "Tenant-scoped API client",
    status: "local-contract",
    blocksProduction: true,
    detail: "Static demo data remains, but the typed tenant API client and screen sync contract are wired; provider auth, seeded API smoke, offline replay, and Postgres mutation proof remain gated.",
  },
  {
    id: "mobile-push",
    label: "Push notifications",
    status: "local-contract",
    blocksProduction: true,
    detail: "Expo push registration, opt-out, receipt idempotency, invalid-token suppression, tap-routing, and audit contracts are wired locally; provider credentials, device tokens, delivery worker proof, and foreground/background QA remain gated.",
  },
  {
    id: "mobile-offline-store",
    label: "Offline-first storage",
    status: "local-contract",
    blocksProduction: true,
    detail: "Offline queue, repository, redacted audit, retry, idempotency, and sync-worker contracts are wired locally; encrypted SQLite/AsyncStorage persistence, device restart proof, conflict integration, and reconnect QA remain gated.",
  },
  {
    id: "mobile-crash",
    label: "Crash reporting",
    status: "credential-gated",
    blocksProduction: true,
    detail: "The package-backed sanitized fallback/offline-buffer crash reporter contract is wired; Sentry credentials, Expo runtime capture, no-PII provider payload proof, source maps/debug symbols, and simulator/device proof remain gated.",
  },
  {
    id: "mobile-updates",
    label: "OTA/release updates",
    status: "deployment-gated",
    blocksProduction: false,
    detail: "EAS channels and runtimeVersion policy are wired with deployment-gated project/update placeholders; real project, credentials, preview publish, adoption monitoring, and rollback proof remain gated.",
  },
];

export type OfflineQueueItemKind = "booking_note" | "client_note" | "travel_update" | "portfolio_metadata" | "aftercare_checkin";
export type OfflineQueueItemStatus = "queued" | "syncing" | "failed" | "synced";

export interface OfflineQueueItem {
  id: string;
  kind: OfflineQueueItemKind;
  label: string;
  status: OfflineQueueItemStatus;
  createdAt: string;
  lastAttemptAt?: string;
  retryCount: number;
  sensitive: boolean;
  tenantId?: string;
  entityId?: string;
  localVersion?: number;
  remoteVersion?: number;
}

export interface OfflineQueueSummary {
  total: number;
  queued: number;
  failed: number;
  sensitive: number;
  productionReady: boolean;
  warning: string;
}

export function summarizeOfflineQueue(items: readonly OfflineQueueItem[]): OfflineQueueSummary {
  const queued = items.filter((item) => item.status === "queued" || item.status === "syncing").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const sensitive = items.filter((item) => item.sensitive).length;

  return {
    total: items.length,
    queued,
    failed,
    sensitive,
    productionReady: false,
    warning: "Offline queue planning and the app-side adapter/worker contract are wired; encrypted device persistence, conflict integration, and reconnect proof remain gated.",
  };
}

export type OfflineSyncDecisionStatus = "ready_to_sync" | "retry_later" | "conflict" | "blocked_unencrypted" | "already_synced";

export interface OfflineSyncDecision {
  itemId: string;
  status: OfflineSyncDecisionStatus;
  idempotencyKey: string;
  requiresEncryption: boolean;
  nextAttemptAt: string | null;
  reason: string;
}

export interface OfflineSyncPlan {
  generatedAt: string;
  decisions: readonly OfflineSyncDecision[];
  readyCount: number;
  conflictCount: number;
  blockedCount: number;
  productionReady: boolean;
  warning: string;
}

export interface OfflineQueueRepositoryContract {
  adapter: "memory-contract" | "encrypted-sqlite" | "expo-secure-store";
  encryptedAtRest: boolean;
  restartPersistence: boolean;
  auditTrailPersistence: boolean;
  idempotentReplay: boolean;
  syncWorker: boolean;
  productionReady: boolean;
  requiredEvidence: readonly OfflineRuntimeRequiredEvidence[];
}

export interface OfflineSyncAuditEvent {
  itemId: string;
  decision: OfflineSyncDecisionStatus | "transport_failed";
  idempotencyKey: string;
  sensitive: boolean;
  occurredAt: string;
  redactedDetail: string;
}

export interface OfflineRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  mobileSupportTestsPassed: boolean;
  mobileSupportTypecheckPassed: boolean;
  mobileTypecheckPassed: boolean;
  mobileDeviceTestsPassed: boolean;
  storageAdapterSelected: boolean;
  encryptedStoreConfigured: boolean;
  sensitiveItemsEncryptedAtRest: boolean;
  deviceRestartPersistenceTested: boolean;
  syncWorkerConfigured: boolean;
  retryBackoffWorkerTested: boolean;
  conflictResolutionConfigured: boolean;
  serverConflictTestsPassed: boolean;
  idempotencyPersistenceConfigured: boolean;
  alreadySyncedReplayTested: boolean;
  auditTrailPersistenceConfigured: boolean;
  offlineReconnectDeviceTested: boolean;
}

export interface OfflineRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof offlineRuntimeRequiredCommands;
  requiredEvidence: readonly OfflineRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

export function buildOfflineIdempotencyKey(item: OfflineQueueItem): string {
  const tenant = item.tenantId ?? "unknown-tenant";
  const entity = item.entityId ?? item.id;
  return `${tenant}:${item.kind}:${entity}:${item.createdAt}`;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function calculateOfflineRetryDelayMinutes(retryCount: number): number {
  if (retryCount <= 0) return 0;
  return Math.min(60, 2 ** Math.min(retryCount, 5));
}

export const offlineRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo offline restart persistence smoke test",
  "Expo airplane-mode reconnect sync smoke test",
] as const;

export const offlineRuntimeRequiredEvidence = [
  "encrypted offline storage adapter and at-rest encryption proof",
  "device restart and airplane-mode reconnect evidence",
  "runtime sync worker retry and idempotent replay test output",
  "server conflict-resolution test output",
  "offline sync audit trail persistence evidence",
] as const;

export type OfflineRuntimeRequiredEvidence = (typeof offlineRuntimeRequiredEvidence)[number];

export function buildOfflineQueueRepositoryContract(input: {
  adapter: OfflineQueueRepositoryContract["adapter"];
  encryptedAtRest: boolean;
  restartPersistence: boolean;
  auditTrailPersistence: boolean;
  idempotentReplay: boolean;
  syncWorker: boolean;
}): OfflineQueueRepositoryContract {
  const requiredEvidence: OfflineRuntimeRequiredEvidence[] = [];
  if (!input.encryptedAtRest) requiredEvidence.push(offlineRuntimeRequiredEvidence[0]);
  if (!input.restartPersistence) requiredEvidence.push(offlineRuntimeRequiredEvidence[1]);
  if (!input.syncWorker || !input.idempotentReplay) requiredEvidence.push(offlineRuntimeRequiredEvidence[2]);
  if (!input.auditTrailPersistence) requiredEvidence.push(offlineRuntimeRequiredEvidence[4]);

  return {
    ...input,
    productionReady:
      input.encryptedAtRest &&
      input.restartPersistence &&
      input.auditTrailPersistence &&
      input.idempotentReplay &&
      input.syncWorker,
    requiredEvidence,
  };
}

export function buildOfflineSyncAuditEvent(
  item: OfflineQueueItem,
  decision: OfflineSyncDecision,
  occurredAt: string,
): OfflineSyncAuditEvent {
  return {
    itemId: item.id,
    decision: decision.status,
    idempotencyKey: decision.idempotencyKey,
    sensitive: item.sensitive,
    occurredAt,
    redactedDetail: item.sensitive ? "Sensitive offline payload redacted." : "Offline sync decision recorded.",
  };
}

export function planOfflineSync(input: {
  items: readonly OfflineQueueItem[];
  generatedAt: string;
  encryptedStoreAvailable: boolean;
}): OfflineSyncPlan {
  const decisions = input.items.map<OfflineSyncDecision>((item) => {
    const idempotencyKey = buildOfflineIdempotencyKey(item);
    const requiresEncryption = item.sensitive;

    if (item.status === "synced") {
      return {
        itemId: item.id,
        status: "already_synced",
        idempotencyKey,
        requiresEncryption,
        nextAttemptAt: null,
        reason: "Item is already marked synced.",
      };
    }

    if (requiresEncryption && !input.encryptedStoreAvailable) {
      return {
        itemId: item.id,
        status: "blocked_unencrypted",
        idempotencyKey,
        requiresEncryption,
        nextAttemptAt: null,
        reason: "Sensitive offline item cannot sync until encrypted local persistence is available.",
      };
    }

    if (item.localVersion !== undefined && item.remoteVersion !== undefined && item.localVersion < item.remoteVersion) {
      return {
        itemId: item.id,
        status: "conflict",
        idempotencyKey,
        requiresEncryption,
        nextAttemptAt: null,
        reason: "Remote version is newer than the local offline mutation.",
      };
    }

    if (item.status === "failed") {
      return {
        itemId: item.id,
        status: "retry_later",
        idempotencyKey,
        requiresEncryption,
        nextAttemptAt: addMinutes(input.generatedAt, calculateOfflineRetryDelayMinutes(item.retryCount)),
        reason: "Failed item should retry with bounded exponential backoff.",
      };
    }

    return {
      itemId: item.id,
      status: "ready_to_sync",
      idempotencyKey,
      requiresEncryption,
      nextAttemptAt: input.generatedAt,
      reason: "Queued item can be sent through the authenticated sync worker.",
    };
  });

  const conflictCount = decisions.filter((decision) => decision.status === "conflict").length;
  const blockedCount = decisions.filter((decision) => decision.status === "blocked_unencrypted").length;
  return {
    generatedAt: input.generatedAt,
    decisions,
    readyCount: decisions.filter((decision) => decision.status === "ready_to_sync").length,
    conflictCount,
    blockedCount,
    productionReady: false,
    warning: "Offline sync planning and app-side worker contract are wired; encrypted device persistence, server conflict integration, and reconnect proof remain runtime-gated.",
  };
}

export function buildOfflineRuntimeReadinessPlan(input: OfflineRuntimeReadinessInput): OfflineRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: OfflineRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/mobile-support package script is missing ${script}.`);
  if (!input.mobileSupportTestsPassed) blockers.push("@inkroute/mobile-support offline tests must pass.");
  if (!input.mobileSupportTypecheckPassed) blockers.push("@inkroute/mobile-support typecheck must pass.");
  if (!input.mobileTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with offline store/sync wiring.");
  if (!input.mobileDeviceTestsPassed) blockers.push("Expo mobile offline device tests must pass.");
  if (!input.storageAdapterSelected) blockers.push("Offline storage adapter must be selected before runtime readiness.");
  if (!input.encryptedStoreConfigured) blockers.push("Encrypted offline store must be configured for sensitive queue items.");
  if (!input.sensitiveItemsEncryptedAtRest) blockers.push("Sensitive offline queue items must be proven encrypted at rest.");
  if (!input.deviceRestartPersistenceTested) blockers.push("Offline queue persistence must survive device/app restart.");
  if (!input.syncWorkerConfigured) blockers.push("Runtime offline sync worker must be configured.");
  if (!input.retryBackoffWorkerTested) blockers.push("Retry worker must prove bounded backoff behavior.");
  if (!input.conflictResolutionConfigured) blockers.push("Conflict resolution policy must be configured for stale offline mutations.");
  if (!input.serverConflictTestsPassed) blockers.push("Server-side conflict tests must reject stale offline mutations safely.");
  if (!input.idempotencyPersistenceConfigured) blockers.push("Offline idempotency keys must persist through replay and restart.");
  if (!input.alreadySyncedReplayTested) blockers.push("Already-synced offline mutations must not replay duplicate writes.");
  if (!input.auditTrailPersistenceConfigured) blockers.push("Offline sync attempts, conflicts, retries, and drops must persist audit events.");
  if (!input.offlineReconnectDeviceTested) blockers.push("Airplane-mode queue and reconnect sync must be verified on device or simulator.");

  if (!input.storageAdapterSelected || !input.encryptedStoreConfigured || !input.sensitiveItemsEncryptedAtRest) {
    requiredEvidence.push(offlineRuntimeRequiredEvidence[0]);
  }
  if (!input.deviceRestartPersistenceTested || !input.offlineReconnectDeviceTested) {
    requiredEvidence.push(offlineRuntimeRequiredEvidence[1]);
  }
  if (!input.syncWorkerConfigured || !input.retryBackoffWorkerTested || !input.alreadySyncedReplayTested) {
    requiredEvidence.push(offlineRuntimeRequiredEvidence[2]);
  }
  if (!input.conflictResolutionConfigured || !input.serverConflictTestsPassed) {
    requiredEvidence.push(offlineRuntimeRequiredEvidence[3]);
  }
  if (!input.auditTrailPersistenceConfigured) requiredEvidence.push(offlineRuntimeRequiredEvidence[4]);

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: offlineRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === offlineRuntimeRequiredEvidence.length
        ? offlineRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export type MobileApiDomain =
  | "bookings"
  | "appointments"
  | "clients"
  | "travel"
  | "portfolio"
  | "notifications"
  | "releases";

export type MobileApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type MobileApiRequestStatus =
  | "ready"
  | "blocked_missing_auth"
  | "blocked_missing_tenant"
  | "blocked_missing_base_url"
  | "blocked_missing_request_id"
  | "offline_queue_required";

export interface MobileApiRequestPlanInput {
  baseUrl: string;
  tenantId: string;
  accessToken?: string | null;
  requestId?: string | null;
  domain: MobileApiDomain;
  method: MobileApiMethod;
  path: string;
  online: boolean;
  idempotencyKey?: string | null;
}

export interface MobileApiRequestPlan {
  status: MobileApiRequestStatus;
  domain: MobileApiDomain;
  method: MobileApiMethod;
  url: string | null;
  headers: Record<string, string>;
  retryable: boolean;
  safeErrorPolicy: "redact-body";
  offlineQueueRequired: boolean;
  blockers: string[];
}

export interface MobileScreenSyncRequirement {
  screenId: MobileScreenId;
  domain: MobileApiDomain;
  requiredEndpoints: string[];
  mutationMethods: MobileApiMethod[];
  requiresAuth: boolean;
  requiresTenantScope: boolean;
  supportsOfflineQueue: boolean;
  gapIds: string[];
}

export type MobileBookingLifecycleAction = "accept" | "decline" | "reschedule" | "waitlist";

export interface MobileBookingLifecycleActionContractInput {
  tenantId: string;
  bookingId: string;
  requestId: string;
  idempotencyKey: string;
  action: MobileBookingLifecycleAction;
  authenticatedApiReady: boolean;
  stateEventContractReady: boolean;
  calendarConflictCheckReady: boolean;
  notificationHandoffReady: boolean;
  auditLogContractReady: boolean;
  providerExecutionVerified: boolean;
}

export interface MobileBookingLifecycleActionContract {
  status: "ready" | "blocked";
  localContractReady: boolean;
  providerExecutionGated: true;
  endpoint: "/api/mobile/bookings/:id/actions";
  method: "POST";
  action: MobileBookingLifecycleAction;
  requiredHeaders: readonly ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"];
  metadata: {
    tenantId: string;
    bookingId: string;
    requestId: string;
    idempotencyKey: string;
  };
  blockers: readonly string[];
  requiredEvidence: readonly string[];
}

export interface MobileTravelPublishContractInput {
  tenantId: string;
  travelScheduleId: string;
  citySlug: string;
  requestId: string;
  idempotencyKey: string;
  authenticatedApiReady: boolean;
  auditLogContractReady: boolean;
  publicCacheRevalidationContractReady: boolean;
  notificationFanoutContractReady: boolean;
  seoRevalidationContractReady: boolean;
  providerExecutionVerified: boolean;
}

export interface MobileTravelPublishContract {
  status: "ready" | "blocked";
  localContractReady: boolean;
  providerExecutionGated: true;
  endpoint: "/api/mobile/travel-stops/:id/publish";
  method: "POST";
  requiredHeaders: readonly ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"];
  metadata: {
    tenantId: string;
    travelScheduleId: string;
    citySlug: string;
    requestId: string;
    idempotencyKey: string;
  };
  blockers: readonly string[];
  requiredEvidence: readonly string[];
}

export interface MobileApiRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  mobileSupportTestsPassed: boolean;
  mobileSupportTypecheckPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileAppTestsPassed: boolean;
  apiClientImplemented: boolean;
  authHeadersWired: boolean;
  requestIdMiddlewareConfigured: boolean;
  tenantScopeHeaderConfigured: boolean;
  responseEnvelopeValidationConfigured: boolean;
  safeErrorRedactionConfigured: boolean;
  offlineRetryQueueConfigured: boolean;
  idempotencyPersistenceConfigured: boolean;
  seededApiSmokePassed: boolean;
  expiredAuthFailsSafelyTested: boolean;
  crossTenantDenialTested: boolean;
  offlineReplayTested: boolean;
  screensUsingApiClient: readonly MobileApiDomain[];
}

export interface MobileApiRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  missingScreenDomains: readonly MobileApiDomain[];
  requiredCommands: typeof mobileApiRuntimeRequiredCommands;
  requiredEvidence: readonly MobileApiRuntimeRequiredEvidence[];
  blockers: readonly string[];
}

function joinMobileApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function buildMobileApiRequestPlan(input: MobileApiRequestPlanInput): MobileApiRequestPlan {
  const blockers: string[] = [];
  if (!input.baseUrl.trim()) blockers.push("Mobile API base URL is required.");
  if (!input.tenantId.trim()) blockers.push("Tenant scope is required for mobile API requests.");
  if (!input.accessToken?.trim()) blockers.push("Bearer access token is required for mobile API requests.");
  if (!input.requestId?.trim()) blockers.push("Request id is required for mobile API traceability.");

  const offlineQueueRequired = !input.online && input.method !== "GET";
  if (offlineQueueRequired) {
    blockers.push("Offline mobile mutations must be queued with idempotency before sync.");
  }

  const status: MobileApiRequestStatus =
    blockers.find((blocker) => blocker.includes("base URL"))
      ? "blocked_missing_base_url"
      : blockers.find((blocker) => blocker.includes("Tenant scope"))
        ? "blocked_missing_tenant"
        : blockers.find((blocker) => blocker.includes("Bearer access token"))
          ? "blocked_missing_auth"
          : blockers.find((blocker) => blocker.includes("Request id"))
            ? "blocked_missing_request_id"
            : offlineQueueRequired
              ? "offline_queue_required"
              : "ready";

  const headers: Record<string, string> = {};
  if (input.accessToken?.trim()) headers.Authorization = `Bearer ${input.accessToken}`;
  if (input.tenantId.trim()) headers["X-InkRoute-Tenant"] = input.tenantId;
  if (input.requestId?.trim()) headers["X-Request-Id"] = input.requestId;
  if (input.idempotencyKey?.trim()) headers["Idempotency-Key"] = input.idempotencyKey;

  return {
    status,
    domain: input.domain,
    method: input.method,
    url: input.baseUrl.trim() ? joinMobileApiUrl(input.baseUrl, input.path) : null,
    headers,
    retryable: input.method === "GET" || Boolean(input.idempotencyKey?.trim()),
    safeErrorPolicy: "redact-body",
    offlineQueueRequired,
    blockers,
  };
}

export function buildMobileBookingLifecycleActionContract(
  input: MobileBookingLifecycleActionContractInput,
): MobileBookingLifecycleActionContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required for booking lifecycle action.");
  if (!input.bookingId.trim()) blockers.push("Booking id is required for booking lifecycle action.");
  if (!input.requestId.trim()) blockers.push("Request id is required for booking lifecycle auditability.");
  if (!input.idempotencyKey.trim()) blockers.push("Idempotency key is required for booking lifecycle replay safety.");
  if (!input.authenticatedApiReady) {
    blockers.push("Authenticated booking lifecycle API contract input is required before the local action contract is ready.");
    requiredEvidence.push("authenticated booking lifecycle API contract");
  }
  if (!input.stateEventContractReady) {
    blockers.push("Booking state event contract input is required before the local action contract is ready.");
    requiredEvidence.push("booking state event contract");
  }
  if (!input.calendarConflictCheckReady) {
    blockers.push("Calendar conflict check contract input is required before the local action contract is ready.");
    requiredEvidence.push("calendar conflict check contract");
  }
  if (!input.notificationHandoffReady) {
    blockers.push("Notification handoff contract input is required before the local action contract is ready.");
    requiredEvidence.push("booking notification handoff contract");
  }
  if (!input.auditLogContractReady) {
    blockers.push("Booking lifecycle audit log contract input is required before the local action contract is ready.");
    requiredEvidence.push("booking lifecycle audit log contract");
  }
  if (!input.providerExecutionVerified) {
    blockers.push("Provider-backed booking lifecycle execution proof remains required.");
    requiredEvidence.push("provider-backed booking lifecycle execution proof");
  }

  const localContractReady =
    input.tenantId.trim().length > 0 &&
    input.bookingId.trim().length > 0 &&
    input.requestId.trim().length > 0 &&
    input.idempotencyKey.trim().length > 0 &&
    input.authenticatedApiReady &&
    input.stateEventContractReady &&
    input.calendarConflictCheckReady &&
    input.notificationHandoffReady &&
    input.auditLogContractReady;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    localContractReady,
    providerExecutionGated: true,
    endpoint: "/api/mobile/bookings/:id/actions",
    method: "POST",
    action: input.action,
    requiredHeaders: ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"],
    metadata: {
      tenantId: input.tenantId,
      bookingId: input.bookingId,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
    },
    blockers,
    requiredEvidence,
  };
}

export function buildMobileTravelPublishContract(input: MobileTravelPublishContractInput): MobileTravelPublishContract {
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];
  const citySlugSafe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.citySlug);

  if (!input.tenantId.trim()) blockers.push("Tenant scope is required for travel publish.");
  if (!input.travelScheduleId.trim()) blockers.push("Travel schedule id is required for travel publish.");
  if (!citySlugSafe) blockers.push("Travel city slug must be normalized before publish.");
  if (!input.requestId.trim()) blockers.push("Request id is required for travel publish auditability.");
  if (!input.idempotencyKey.trim()) blockers.push("Idempotency key is required for travel publish replay safety.");
  if (!input.authenticatedApiReady) {
    blockers.push("Authenticated mobile travel API contract input is required before the local publish contract is ready.");
    requiredEvidence.push("authenticated mobile travel API contract");
  }
  if (!input.auditLogContractReady) {
    blockers.push("Travel publish audit log contract input is required before the local publish contract is ready.");
    requiredEvidence.push("travel publish audit log contract");
  }
  if (!input.publicCacheRevalidationContractReady) {
    blockers.push("Public travel cache revalidation contract input is required before the local publish contract is ready.");
    requiredEvidence.push("public travel cache revalidation contract");
  }
  if (!input.notificationFanoutContractReady) {
    blockers.push("Travel waitlist notification fanout contract input is required before the local publish contract is ready.");
    requiredEvidence.push("travel notification fanout contract");
  }
  if (!input.seoRevalidationContractReady) {
    blockers.push("Travel SEO revalidation contract input is required before the local publish contract is ready.");
    requiredEvidence.push("travel SEO revalidation contract");
  }
  if (!input.providerExecutionVerified) {
    blockers.push("Provider-backed travel publish execution proof remains required.");
    requiredEvidence.push("provider-backed travel publish execution proof");
  }

  const localContractReady =
    input.tenantId.trim().length > 0 &&
    input.travelScheduleId.trim().length > 0 &&
    citySlugSafe &&
    input.requestId.trim().length > 0 &&
    input.idempotencyKey.trim().length > 0 &&
    input.authenticatedApiReady &&
    input.auditLogContractReady &&
    input.publicCacheRevalidationContractReady &&
    input.notificationFanoutContractReady &&
    input.seoRevalidationContractReady;

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    localContractReady,
    providerExecutionGated: true,
    endpoint: "/api/mobile/travel-stops/:id/publish",
    method: "POST",
    requiredHeaders: ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"],
    metadata: {
      tenantId: input.tenantId,
      travelScheduleId: input.travelScheduleId,
      citySlug: input.citySlug,
      requestId: input.requestId,
      idempotencyKey: input.idempotencyKey,
    },
    blockers,
    requiredEvidence,
  };
}

export function buildMobileScreenSyncRequirements(): MobileScreenSyncRequirement[] {
  return [
    {
      screenId: "bookings",
      domain: "bookings",
      requiredEndpoints: ["/api/mobile/bookings", "/api/mobile/bookings/:id/actions"],
      mutationMethods: ["POST", "PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: true,
      gapIds: ["GAP-043", "GAP-045"],
    },
    {
      screenId: "appointments",
      domain: "appointments",
      requiredEndpoints: ["/api/mobile/appointments", "/api/mobile/availability"],
      mutationMethods: ["POST", "PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: true,
      gapIds: ["GAP-043", "GAP-056"],
    },
    {
      screenId: "clients",
      domain: "clients",
      requiredEndpoints: ["/api/mobile/clients", "/api/mobile/clients/:id/timeline"],
      mutationMethods: ["PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: false,
      gapIds: ["GAP-040", "GAP-043"],
    },
    {
      screenId: "travel",
      domain: "travel",
      requiredEndpoints: ["/api/mobile/travel-stops"],
      mutationMethods: ["POST", "PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: true,
      gapIds: ["GAP-043", "GAP-056"],
    },
    {
      screenId: "portfolio",
      domain: "portfolio",
      requiredEndpoints: ["/api/mobile/portfolio", "/api/mobile/portfolio/upload-intents"],
      mutationMethods: ["POST", "PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: true,
      gapIds: ["GAP-005", "GAP-043"],
    },
    {
      screenId: "notifications",
      domain: "notifications",
      requiredEndpoints: ["/api/mobile/notifications", "/api/mobile/messages"],
      mutationMethods: ["POST", "PATCH"],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: false,
      gapIds: ["GAP-043", "GAP-064"],
    },
    {
      screenId: "system",
      domain: "releases",
      requiredEndpoints: ["/api/mobile/release-health"],
      mutationMethods: [],
      requiresAuth: true,
      requiresTenantScope: true,
      supportsOfflineQueue: false,
      gapIds: ["GAP-043", "GAP-047"],
    },
  ];
}

export const mobileApiRuntimeRequiredCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "Expo iOS/Android mobile API smoke tests",
  "offline reconnect/replay mobile test",
] as const;

export const mobileApiRuntimeRequiredEvidence = [
  "mobile screen API-client wiring matrix for bookings, appointments, clients, travel, portfolio, notifications, and releases",
  "seeded mobile API smoke output",
  "expired-auth and cross-tenant denial test output",
  "offline idempotent replay test output",
] as const;

export type MobileApiRuntimeRequiredEvidence = (typeof mobileApiRuntimeRequiredEvidence)[number];

export function buildMobileApiRuntimeReadinessPlan(input: MobileApiRuntimeReadinessInput): MobileApiRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck"];
  const requiredDomains: MobileApiDomain[] = ["bookings", "appointments", "clients", "travel", "portfolio", "notifications", "releases"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const missingScreenDomains = requiredDomains.filter((domain) => !input.screensUsingApiClient.includes(domain));
  const blockers: string[] = [];
  const requiredEvidence: MobileApiRuntimeRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/mobile-support package script is missing ${script}.`);
  if (!input.mobileSupportTestsPassed) blockers.push("@inkroute/mobile-support API/sync tests must pass.");
  if (!input.mobileSupportTypecheckPassed) blockers.push("@inkroute/mobile-support typecheck must pass in an installed workspace.");
  if (!input.mobileAppTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with API client wiring.");
  if (!input.mobileAppTestsPassed) blockers.push("@inkroute/mobile app tests must pass with API-backed screen loaders/actions.");
  if (!input.apiClientImplemented) blockers.push("Typed Expo API client must be implemented before replacing static mobile data.");
  if (!input.authHeadersWired) blockers.push("Mobile API client must attach provider-backed bearer auth headers.");
  if (!input.requestIdMiddlewareConfigured) blockers.push("Mobile API client must attach request ids for traceability.");
  if (!input.tenantScopeHeaderConfigured) blockers.push("Mobile API client must attach tenant scope on every request.");
  if (!input.responseEnvelopeValidationConfigured) blockers.push("Mobile API client must validate response envelopes before screen state updates.");
  if (!input.safeErrorRedactionConfigured) blockers.push("Mobile API errors must redact response bodies and sensitive request metadata.");
  if (!input.offlineRetryQueueConfigured) blockers.push("Offline-aware retry queue must handle mobile mutations.");
  if (!input.idempotencyPersistenceConfigured) blockers.push("Mobile mutation idempotency keys must persist until replay succeeds or is abandoned.");
  if (!input.seededApiSmokePassed) blockers.push("Seeded mobile API smoke tests must prove screens can load backend data.");
  if (!input.expiredAuthFailsSafelyTested) blockers.push("Expired/invalid mobile auth must fail safely without leaking cached tenant data.");
  if (!input.crossTenantDenialTested) blockers.push("Mobile API tests must reject cross-tenant reads and writes.");
  if (!input.offlineReplayTested) blockers.push("Offline mutations must replay idempotently after reconnect.");
  if (missingScreenDomains.length > 0) blockers.push(`Mobile screens still need API client wiring for domains: ${missingScreenDomains.join(", ")}.`);

  if (!input.apiClientImplemented || missingScreenDomains.length > 0) {
    requiredEvidence.push(mobileApiRuntimeRequiredEvidence[0]);
  }
  if (!input.seededApiSmokePassed) requiredEvidence.push(mobileApiRuntimeRequiredEvidence[1]);
  if (!input.expiredAuthFailsSafelyTested || !input.crossTenantDenialTested) {
    requiredEvidence.push(mobileApiRuntimeRequiredEvidence[2]);
  }
  if (!input.offlineRetryQueueConfigured || !input.idempotencyPersistenceConfigured || !input.offlineReplayTested) {
    requiredEvidence.push(mobileApiRuntimeRequiredEvidence[3]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    missingScreenDomains,
    requiredCommands: mobileApiRuntimeRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === mobileApiRuntimeRequiredEvidence.length
        ? mobileApiRuntimeRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export type MobileQaArea =
  | "screen_smoke"
  | "auth_biometric"
  | "api_sync"
  | "offline_sync"
  | "push_notifications"
  | "crash_reporting"
  | "ota_updates"
  | "accessibility";

export type MobileQaPlatform = "ios_simulator" | "android_emulator" | "physical_device" | "ci_static";

export interface MobileDeviceQaItem {
  id: string;
  area: MobileQaArea;
  platform: MobileQaPlatform;
  command: string;
  evidenceRequired: string;
  status: "planned" | "runtime_gated" | "provider_gated" | "manual_required" | "passed";
  gapIds: string[];
}

export interface MobileDeviceQaSummary {
  itemCount: number;
  missingAreas: MobileQaArea[];
  blockingItemIds: string[];
  productionReady: boolean;
}

export interface MobileTestingExecutionReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  mobileSupportTestsPassed: boolean;
  mobileSupportTypecheckPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileStaticTestsPassed: boolean;
  expoDependenciesInstalled: boolean;
  expoRuntimeStarted: boolean;
  iosSimulatorSmokePassed: boolean;
  androidEmulatorSmokePassed: boolean;
  physicalDeviceChecklistCompleted: boolean;
  biometricLockQaPassed: boolean;
  tenantApiSyncQaPassed: boolean;
  offlineReconnectQaPassed: boolean;
  pushTokenDeliveryQaPassed: boolean;
  crashCaptureQaPassed: boolean;
  easPreviewBuildPassed: boolean;
  easUpdateRollbackPassed: boolean;
  accessibilityQaPassed: boolean;
  qaChecklistManifestSynced: boolean;
  artifactsCaptured: boolean;
  ciMobileChecksPassed: boolean;
}

export const mobileTestingExecutionReadinessRequiredCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
] as const;

export const mobileTestingExecutionReadinessRequiredEvidence = [
  "Expo dependency install, runtime start, mobile typecheck, and static/security test output",
  "iOS simulator, Android emulator, and physical device screen-smoke evidence",
  "biometric, tenant API sync, offline reconnect, and push QA transcripts",
  "crash capture, EAS preview/update rollback, and accessibility QA evidence",
  "synced mobile QA checklist, retained artifacts, and CI/mobile check evidence",
] as const;

export type MobileTestingExecutionReadinessRequiredEvidence = (typeof mobileTestingExecutionReadinessRequiredEvidence)[number];

export interface MobileTestingExecutionReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof mobileTestingExecutionReadinessRequiredCommands;
  requiredEvidence: readonly MobileTestingExecutionReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export type MobileUploadIntentKind = "portfolio_public" | "reference_private";

export interface MobileUploadIntentContractInput {
  tenantId: string;
  requestId: string;
  idempotencyKey: string;
  kind: MobileUploadIntentKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  city?: string;
  altText?: string;
  styleTags?: readonly string[];
}

export interface MobileUploadIntentContract {
  status: "ready" | "blocked";
  endpoint: "/api/mobile/portfolio/upload-intents";
  method: "POST";
  objectKey: string | null;
  providerSignedUploadRequired: true;
  providerStorageRuntimeGated: true;
  metadataReady: boolean;
  blockers: readonly string[];
  requiredHeaders: readonly ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"];
}

export function buildMobileUploadObjectKey(input: Pick<MobileUploadIntentContractInput, "tenantId" | "kind" | "filename" | "requestId">): string {
  const safeFilename = input.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "") || "upload";
  return `${input.tenantId}/mobile/${input.kind}/${input.requestId}/${safeFilename}`;
}

export function buildMobileUploadIntentContract(input: MobileUploadIntentContractInput): MobileUploadIntentContract {
  const blockers: string[] = [];
  if (!input.tenantId) blockers.push("Tenant scope is required before mobile upload intents can be requested.");
  if (!input.requestId) blockers.push("Request id is required for mobile upload traceability.");
  if (!input.idempotencyKey) blockers.push("Idempotency key is required before mobile upload intents can be retried safely.");
  if (!input.filename) blockers.push("Filename is required before creating a mobile upload intent.");
  if (!input.mimeType.startsWith("image/")) blockers.push("Mobile uploads must be image MIME types before provider signing.");
  if (input.sizeBytes <= 0) blockers.push("Mobile upload size must be positive.");
  if (input.kind === "portfolio_public" && !input.altText) blockers.push("Public portfolio uploads require alt text before publication.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    endpoint: "/api/mobile/portfolio/upload-intents",
    method: "POST",
    objectKey: blockers.length === 0 ? buildMobileUploadObjectKey(input) : null,
    providerSignedUploadRequired: true,
    providerStorageRuntimeGated: true,
    metadataReady: blockers.length === 0,
    blockers,
    requiredHeaders: ["Authorization", "X-InkRoute-Tenant", "X-Request-Id", "Idempotency-Key"],
  };
}

export function buildMobileTestingExecutionReadinessPlan(
  input: MobileTestingExecutionReadinessInput,
): MobileTestingExecutionReadinessPlan {
  const requiredScripts = ["test", "typecheck", "ios", "android"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: MobileTestingExecutionReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/mobile package script is missing ${script}.`);
  if (!input.mobileSupportTestsPassed) blockers.push("@inkroute/mobile-support tests must pass before mobile testing can close.");
  if (!input.mobileSupportTypecheckPassed) blockers.push("@inkroute/mobile-support typecheck must pass before mobile testing can close.");
  if (!input.mobileAppTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass with the Phase 14 mobile test contract.");
  if (!input.mobileStaticTestsPassed) blockers.push("Mobile static/security tests must pass for screen registry and SystemStatus security surfaces.");
  if (!input.expoDependenciesInstalled) blockers.push("Expo dependencies must install before simulator or device QA evidence is meaningful.");
  if (!input.expoRuntimeStarted) blockers.push("Expo runtime must start locally or in a preview build before device QA evidence is meaningful.");
  if (!input.iosSimulatorSmokePassed) blockers.push("iOS simulator screen smoke must pass.");
  if (!input.androidEmulatorSmokePassed) blockers.push("Android emulator screen smoke must pass.");
  if (!input.physicalDeviceChecklistCompleted) blockers.push("Physical device QA checklist must be completed for iOS and Android coverage.");
  if (!input.biometricLockQaPassed) blockers.push("Biometric lock QA must prove secure session lock/unlock behavior.");
  if (!input.tenantApiSyncQaPassed) blockers.push("Tenant API sync QA must prove auth headers, tenant scope, request ids, and safe errors.");
  if (!input.offlineReconnectQaPassed) blockers.push("Offline reconnect QA must prove encrypted queue persistence, idempotent replay, retry, and conflict handling.");
  if (!input.pushTokenDeliveryQaPassed) blockers.push("Push QA must prove package-backed permission, token registration, opt-out, receipt idempotency, invalid-token suppression, audit, and tap-routing contracts on device.");
  if (!input.crashCaptureQaPassed) blockers.push("Crash QA must prove sanitized crash capture without PII, medical, payment, or token data.");
  if (!input.easPreviewBuildPassed) blockers.push("EAS preview build must pass before OTA/update QA is production-significant.");
  if (!input.easUpdateRollbackPassed) blockers.push("EAS update rollback QA must prove preview adoption and rollback republish on the same runtime.");
  if (!input.accessibilityQaPassed) blockers.push("Mobile accessibility QA must pass for VoiceOver/TalkBack, text scaling, contrast, and touch targets.");
  if (!input.qaChecklistManifestSynced) blockers.push("Mobile device QA checklist manifest must match generated checklist items.");
  if (!input.artifactsCaptured) blockers.push("Mobile QA artifacts must include simulator logs, screenshots/videos, provider transcripts, crash event, OTA evidence, and accessibility notes.");
  if (!input.ciMobileChecksPassed) blockers.push("CI/mobile checks must pass or publish mobile QA artifact placeholders for manual/device evidence.");

  if (!input.expoDependenciesInstalled || !input.expoRuntimeStarted || !input.mobileAppTypecheckPassed || !input.mobileStaticTestsPassed) {
    requiredEvidence.push(mobileTestingExecutionReadinessRequiredEvidence[0]);
  }
  if (!input.iosSimulatorSmokePassed || !input.androidEmulatorSmokePassed || !input.physicalDeviceChecklistCompleted) {
    requiredEvidence.push(mobileTestingExecutionReadinessRequiredEvidence[1]);
  }
  if (!input.biometricLockQaPassed || !input.tenantApiSyncQaPassed || !input.offlineReconnectQaPassed || !input.pushTokenDeliveryQaPassed) {
    requiredEvidence.push(mobileTestingExecutionReadinessRequiredEvidence[2]);
  }
  if (!input.crashCaptureQaPassed || !input.easPreviewBuildPassed || !input.easUpdateRollbackPassed || !input.accessibilityQaPassed) {
    requiredEvidence.push(mobileTestingExecutionReadinessRequiredEvidence[3]);
  }
  if (!input.qaChecklistManifestSynced || !input.artifactsCaptured || !input.ciMobileChecksPassed) {
    requiredEvidence.push(mobileTestingExecutionReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobileTestingExecutionReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === mobileTestingExecutionReadinessRequiredEvidence.length
        ? mobileTestingExecutionReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface MobileRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  appJsonProjectId?: string;
  appJsonUpdatesUrl?: string;
  typecheckVerified: boolean;
  expoRuntimeVerified: boolean;
  iosSmokeVerified: boolean;
  androidSmokeVerified: boolean;
  easPreviewBuildVerified: boolean;
  authProviderConfigured: boolean;
  biometricGateConfigured: boolean;
  apiClientConfigured: boolean;
  pushProviderConfigured: boolean;
  encryptedOfflineStoreConfigured: boolean;
  crashReportingConfigured: boolean;
  otaUpdatesConfigured: boolean;
  deviceQaSummary?: MobileDeviceQaSummary;
}

export const mobileRuntimeReadinessRequiredCommands = [
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "pnpm --filter @inkroute/mobile test",
  "eas build --profile preview --platform all",
] as const;

export const mobileRuntimeReadinessRequiredControls = [
  "Use provider-backed auth/session exchange before any tenant data loads.",
  "Require biometric unlock and secure storage for cached refresh/session tokens when enabled.",
  "Send tenant, request-id, idempotency, and bearer auth headers through the mobile API client.",
  "Encrypt sensitive offline queue items and replay mutations idempotently after reconnect.",
  "Register push tokens only after consent and persist delivery receipts tenant-safely.",
  "Capture sanitized crash reports without PII, medical notes, payment data, or tokens.",
  "Verify EAS preview builds, OTA update adoption, and rollback on real devices before launch.",
] as const;

export interface MobileRuntimeReadinessPlan {
  status: "ready" | "blocked";
  requiredCommands: typeof mobileRuntimeReadinessRequiredCommands;
  requiredControls: typeof mobileRuntimeReadinessRequiredControls;
  missingScripts: readonly string[];
  blockingQaItemIds: readonly string[];
  blockers: readonly string[];
}

export interface MobileDeviceQaRuntimeReadinessInput {
  packageScripts: Readonly<Record<string, string>>;
  mobileSupportTestsPassed: boolean;
  mobileSupportTypecheckPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileStaticTestsPassed: boolean;
  expoComponentRenderTestsPassed: boolean;
  iosSimulatorSmokePassed: boolean;
  androidEmulatorSmokePassed: boolean;
  physicalDeviceSmokePassed: boolean;
  accessibilityChecksPassed: boolean;
  offlineQaPassed: boolean;
  pushQaPassed: boolean;
  crashQaPassed: boolean;
  otaRollbackQaPassed: boolean;
  qaManifestSynced: boolean;
  ciHooksConfigured: boolean;
  qaArtifactsAttached: boolean;
}

export const mobileDeviceQaRuntimeReadinessRequiredCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
] as const;

export const mobileDeviceQaRuntimeReadinessRequiredEvidence = [
  "Expo app component/render and static test output for every registered screen",
  "iOS, Android, and physical device smoke screenshots or videos",
  "VoiceOver/TalkBack, text scaling, contrast, and touch-target QA notes",
  "offline, push, crash, and OTA rollback runtime QA transcripts",
  "CI job links and retained mobile QA artifacts",
] as const;

export type MobileDeviceQaRuntimeReadinessRequiredEvidence = (typeof mobileDeviceQaRuntimeReadinessRequiredEvidence)[number];

export interface MobileDeviceQaRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof mobileDeviceQaRuntimeReadinessRequiredCommands;
  requiredEvidence: readonly MobileDeviceQaRuntimeReadinessRequiredEvidence[];
  blockers: readonly string[];
}

export function buildMobileDeviceQaChecklist(): MobileDeviceQaItem[] {
  return [
    {
      id: "mobile-static-screen-registry",
      area: "screen_smoke",
      platform: "ci_static",
      command: "pnpm --filter @inkroute/mobile-support test",
      evidenceRequired: "Package test output proving the Phase 6 screen registry is complete.",
      status: "passed",
      gapIds: ["GAP-048", "GAP-108"],
    },
    {
      id: "ios-screen-smoke",
      area: "screen_smoke",
      platform: "ios_simulator",
      command: "pnpm --filter @inkroute/mobile ios",
      evidenceRequired: "iOS simulator screenshots or video covering every registered screen.",
      status: "runtime_gated",
      gapIds: ["GAP-048", "GAP-108"],
    },
    {
      id: "android-screen-smoke",
      area: "screen_smoke",
      platform: "android_emulator",
      command: "pnpm --filter @inkroute/mobile android",
      evidenceRequired: "Android emulator screenshots or video covering every registered screen.",
      status: "runtime_gated",
      gapIds: ["GAP-048", "GAP-108"],
    },
    {
      id: "biometric-lock-unlock",
      area: "auth_biometric",
      platform: "physical_device",
      command: "manual device QA with Expo LocalAuthentication",
      evidenceRequired: "Device transcript proving lock, unlock, logout, and expired-session behavior.",
      status: "provider_gated",
      gapIds: ["GAP-042", "GAP-048", "GAP-108"],
    },
    {
      id: "tenant-api-sync",
      area: "api_sync",
      platform: "physical_device",
      command: "manual device QA against preview API",
      evidenceRequired: "Seeded preview API transcript proving auth headers, tenant scope, request ids, and safe errors.",
      status: "provider_gated",
      gapIds: ["GAP-043", "GAP-048", "GAP-108"],
    },
    {
      id: "offline-reconnect-sync",
      area: "offline_sync",
      platform: "physical_device",
      command: "manual airplane-mode queue/reconnect QA",
      evidenceRequired: "Device logs proving encrypted queue persistence, idempotent replay, retry, and conflict handling.",
      status: "provider_gated",
      gapIds: ["GAP-045", "GAP-048", "GAP-108"],
    },
    {
      id: "push-token-delivery",
      area: "push_notifications",
      platform: "physical_device",
      command: "Expo push token registration and test push",
      evidenceRequired: "Push token registration proof, opt-out blocking proof, delivery receipt, and tap deep-link screenshot.",
      status: "provider_gated",
      gapIds: ["GAP-044", "GAP-048", "GAP-108"],
    },
    {
      id: "mobile-crash-capture",
      area: "crash_reporting",
      platform: "physical_device",
      command: "forced safe mobile crash in preview build",
      evidenceRequired: "Sanitized crash event in Sentry/fallback report with no PII, medical, payment, or token data.",
      status: "provider_gated",
      gapIds: ["GAP-046", "GAP-048", "GAP-108"],
    },
    {
      id: "ota-preview-rollback",
      area: "ota_updates",
      platform: "physical_device",
      command: "eas update --channel preview --message rollback-republish-drill --non-interactive",
      evidenceRequired: "Preview update adoption screenshot and rollback republish proof on the same runtime.",
      status: "provider_gated",
      gapIds: ["GAP-047", "GAP-048", "GAP-108"],
    },
    {
      id: "mobile-accessibility-pass",
      area: "accessibility",
      platform: "physical_device",
      command: "manual VoiceOver/TalkBack and touch-target QA",
      evidenceRequired: "VoiceOver/TalkBack notes, text scaling screenshots, contrast/touch target findings.",
      status: "manual_required",
      gapIds: ["GAP-048", "GAP-109"],
    },
  ];
}

export function summarizeMobileDeviceQa(items: readonly MobileDeviceQaItem[] = buildMobileDeviceQaChecklist()): MobileDeviceQaSummary {
  const requiredAreas: MobileQaArea[] = [
    "screen_smoke",
    "auth_biometric",
    "api_sync",
    "offline_sync",
    "push_notifications",
    "crash_reporting",
    "ota_updates",
    "accessibility",
  ];
  const coveredAreas = new Set(items.map((item) => item.area));
  const missingAreas = requiredAreas.filter((area) => !coveredAreas.has(area));
  const blockingItemIds = items.filter((item) => item.status !== "passed").map((item) => item.id);

  return {
    itemCount: items.length,
    missingAreas,
    blockingItemIds,
    productionReady: missingAreas.length === 0 && blockingItemIds.length === 0,
  };
}

export function buildMobileDeviceQaRuntimeReadinessPlan(
  input: MobileDeviceQaRuntimeReadinessInput,
): MobileDeviceQaRuntimeReadinessPlan {
  const requiredScripts = ["test", "typecheck", "ios", "android"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: MobileDeviceQaRuntimeReadinessRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/mobile package script is missing ${script}.`);
  if (!input.mobileSupportTestsPassed) blockers.push("@inkroute/mobile-support device QA tests must pass.");
  if (!input.mobileSupportTypecheckPassed) blockers.push("@inkroute/mobile-support typecheck must pass.");
  if (!input.mobileAppTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass.");
  if (!input.mobileStaticTestsPassed) blockers.push("@inkroute/mobile static tests must pass.");
  if (!input.expoComponentRenderTestsPassed) blockers.push("Expo app component/render tests must cover registered screens.");
  if (!input.iosSimulatorSmokePassed) blockers.push("iOS simulator screen smoke must pass.");
  if (!input.androidEmulatorSmokePassed) blockers.push("Android emulator screen smoke must pass.");
  if (!input.physicalDeviceSmokePassed) blockers.push("Physical device smoke must cover auth, API sync, offline, push, crash, and OTA flows.");
  if (!input.accessibilityChecksPassed) blockers.push("Mobile accessibility checks must pass for VoiceOver/TalkBack, text scaling, contrast, and touch targets.");
  if (!input.offlineQaPassed) blockers.push("Offline reconnect QA must prove encrypted persistence, retry, idempotency, and conflict handling.");
  if (!input.pushQaPassed) blockers.push("Push notification QA must prove permission, token registration, opt-out, receipt, and tap routing.");
  if (!input.crashQaPassed) blockers.push("Crash QA must prove sanitized crash capture without PII, medical, payment, or token data.");
  if (!input.otaRollbackQaPassed) blockers.push("OTA rollback QA must prove preview update adoption and rollback republish on the same runtime.");
  if (!input.qaManifestSynced) blockers.push("Mobile device QA manifest must match generated checklist items.");
  if (!input.ciHooksConfigured) blockers.push("Mobile QA CI hooks must run package static tests and preserve runtime artifact placeholders.");
  if (!input.qaArtifactsAttached) blockers.push("Mobile QA artifacts must include simulator screenshots/logs, accessibility notes, provider/device transcripts, and release evidence.");

  if (!input.expoComponentRenderTestsPassed || !input.mobileStaticTestsPassed) {
    requiredEvidence.push(mobileDeviceQaRuntimeReadinessRequiredEvidence[0]);
  }
  if (!input.iosSimulatorSmokePassed || !input.androidEmulatorSmokePassed || !input.physicalDeviceSmokePassed) {
    requiredEvidence.push(mobileDeviceQaRuntimeReadinessRequiredEvidence[1]);
  }
  if (!input.accessibilityChecksPassed) {
    requiredEvidence.push(mobileDeviceQaRuntimeReadinessRequiredEvidence[2]);
  }
  if (!input.offlineQaPassed || !input.pushQaPassed || !input.crashQaPassed || !input.otaRollbackQaPassed) {
    requiredEvidence.push(mobileDeviceQaRuntimeReadinessRequiredEvidence[3]);
  }
  if (!input.ciHooksConfigured || !input.qaArtifactsAttached) {
    requiredEvidence.push(mobileDeviceQaRuntimeReadinessRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobileDeviceQaRuntimeReadinessRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === mobileDeviceQaRuntimeReadinessRequiredEvidence.length
        ? mobileDeviceQaRuntimeReadinessRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export function buildMobileRuntimeReadinessPlan(input: MobileRuntimeReadinessInput): MobileRuntimeReadinessPlan {
  const blockers: string[] = [];
  const requiredScripts = ["typecheck", "build", "test", "ios", "android"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const qa = input.deviceQaSummary ?? summarizeMobileDeviceQa();
  const projectId = input.appJsonProjectId?.trim() ?? "";
  const updatesUrl = input.appJsonUpdatesUrl?.trim() ?? "";

  if (missingScripts.length > 0) blockers.push("@inkroute/mobile package scripts are missing required runtime commands.");
  if (!input.typecheckVerified) blockers.push("Mobile typecheck has not been verified in the installed workspace.");
  if (!input.expoRuntimeVerified) blockers.push("Expo runtime has not been launched locally for this mobile contract.");
  if (!input.iosSmokeVerified) blockers.push("iOS simulator/device screen smoke has not been verified.");
  if (!input.androidSmokeVerified) blockers.push("Android emulator/device screen smoke has not been verified.");
  if (!input.easPreviewBuildVerified) blockers.push("EAS preview build has not been verified.");
  if (!input.authProviderConfigured) blockers.push("Mobile auth provider/session exchange is not configured.");
  if (!input.biometricGateConfigured) blockers.push("Mobile biometric gate is not configured for secure session unlock.");
  if (!input.apiClientConfigured) blockers.push("Tenant-scoped mobile API client is not configured.");
  if (!input.pushProviderConfigured) blockers.push("Expo push token registration and delivery provider are not configured.");
  if (!input.encryptedOfflineStoreConfigured) blockers.push("Encrypted offline storage and sync worker are not configured.");
  if (!input.crashReportingConfigured) blockers.push("Mobile crash reporting is not configured.");
  if (!input.otaUpdatesConfigured) blockers.push("OTA update channels and rollback workflow are not configured.");
  if (!projectId || projectId.includes("deployment-gated")) blockers.push("Expo/EAS project id is still deployment-gated.");
  if (!updatesUrl || updatesUrl.includes("deployment-gated")) blockers.push("Expo updates URL is still deployment-gated.");
  if (!qa.productionReady) blockers.push("Mobile device QA checklist still has blocking runtime/provider/manual items.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    requiredCommands: mobileRuntimeReadinessRequiredCommands,
    requiredControls: mobileRuntimeReadinessRequiredControls,
    missingScripts,
    blockingQaItemIds: qa.blockingItemIds,
    blockers,
  };
}

export interface MobileLaunchEvidenceInput {
  packageScripts: Readonly<Record<string, string>>;
  mobileSupportTypecheckPassed: boolean;
  mobileSupportTestsPassed: boolean;
  mobileAppTypecheckPassed: boolean;
  mobileAppTestsPassed: boolean;
  expoRuntimeStarted: boolean;
  iosSimulatorSmokePassed: boolean;
  androidEmulatorSmokePassed: boolean;
  easPreviewBuildPassed: boolean;
  authSessionBiometricQaPassed: boolean;
  tenantApiClientQaPassed: boolean;
  pushNotificationQaPassed: boolean;
  encryptedOfflineStoreQaPassed: boolean;
  uploadFlowQaPassed: boolean;
  crashReportingQaPassed: boolean;
  otaUpdateRollbackQaPassed: boolean;
  physicalDeviceQaCompleted: boolean;
  accessibilityQaPassed: boolean;
  appJsonProjectConfigured: boolean;
  easChannelsConfigured: boolean;
  ciEvidenceCaptured: boolean;
  launchArtifactsSecretSafe: boolean;
}

export const mobileLaunchEvidenceRequiredCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "manual physical-device QA for auth/api/offline/push/upload/crash/OTA/accessibility",
  "GitHub Actions mobile launch evidence job",
] as const;

export const mobileLaunchEvidenceRequiredEvidence = [
  "mobile-support and mobile app typecheck/test output",
  "Expo runtime, iOS simulator, Android emulator, and EAS preview build evidence",
  "auth/biometric, tenant API, push, and encrypted offline QA evidence",
  "upload, crash, OTA rollback, physical device, and accessibility QA evidence",
  "Expo project/channel configuration, CI, and secret-safe artifact evidence",
] as const;

export type MobileLaunchEvidenceRequiredEvidence = (typeof mobileLaunchEvidenceRequiredEvidence)[number];

export interface MobileLaunchEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: typeof mobileLaunchEvidenceRequiredCommands;
  requiredEvidence: readonly MobileLaunchEvidenceRequiredEvidence[];
  blockers: readonly string[];
}

export function buildMobileLaunchEvidencePlan(input: MobileLaunchEvidenceInput): MobileLaunchEvidencePlan {
  const requiredScripts = ["typecheck", "test", "ios", "android"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts[script]);
  const blockers: string[] = [];
  const requiredEvidence: MobileLaunchEvidenceRequiredEvidence[] = [];

  for (const script of missingScripts) blockers.push(`@inkroute/mobile package script is missing ${script}.`);
  if (!input.mobileSupportTypecheckPassed) blockers.push("@inkroute/mobile-support typecheck must pass.");
  if (!input.mobileSupportTestsPassed) blockers.push("@inkroute/mobile-support tests must pass.");
  if (!input.mobileAppTypecheckPassed) blockers.push("@inkroute/mobile typecheck must pass.");
  if (!input.mobileAppTestsPassed) blockers.push("@inkroute/mobile tests must pass.");
  if (!input.expoRuntimeStarted) blockers.push("Expo runtime must start locally or from a preview build.");
  if (!input.iosSimulatorSmokePassed) blockers.push("iOS simulator smoke tests must pass across registered screens.");
  if (!input.androidEmulatorSmokePassed) blockers.push("Android emulator smoke tests must pass across registered screens.");
  if (!input.easPreviewBuildPassed) blockers.push("EAS preview build must pass for iOS and Android.");
  if (!input.authSessionBiometricQaPassed) blockers.push("Auth/session/biometric QA must pass on simulator or physical device.");
  if (!input.tenantApiClientQaPassed) blockers.push("Tenant-scoped mobile API client QA must pass against preview APIs.");
  if (!input.pushNotificationQaPassed) blockers.push("Push notification QA must pass with package-backed permission, token, opt-out, receipt idempotency, invalid-token suppression, audit, and tap-routing contracts.");
  if (!input.encryptedOfflineStoreQaPassed) blockers.push("Encrypted offline storage and reconnect sync QA must pass.");
  if (!input.uploadFlowQaPassed) blockers.push("Mobile upload/portfolio flow QA must pass with shared upload-intent object-key boundaries and signed provider storage gates.");
  if (!input.crashReportingQaPassed) blockers.push("Mobile crash reporting QA must capture package-backed sanitized fallback/offline-buffer crash events plus provider/device proof.");
  if (!input.otaUpdateRollbackQaPassed) blockers.push("OTA update and rollback QA must pass with package-backed rollback command/adoption contracts on the same runtime version.");
  if (!input.physicalDeviceQaCompleted) blockers.push("Physical device QA checklist must be completed.");
  if (!input.accessibilityQaPassed) blockers.push("Mobile accessibility QA must pass for VoiceOver/TalkBack, text scaling, contrast, and touch targets.");
  if (!input.appJsonProjectConfigured) blockers.push("app.json must contain real Expo/EAS project configuration.");
  if (!input.easChannelsConfigured) blockers.push("EAS preview/update channels and runtimeVersion policy must be configured.");
  if (!input.ciEvidenceCaptured) blockers.push("CI/mobile evidence must be captured.");
  if (!input.launchArtifactsSecretSafe) blockers.push("Mobile launch artifacts must be redacted and free of secrets, tokens, PII, medical, or payment data.");

  if (!input.mobileSupportTypecheckPassed || !input.mobileSupportTestsPassed || !input.mobileAppTypecheckPassed || !input.mobileAppTestsPassed) {
    requiredEvidence.push(mobileLaunchEvidenceRequiredEvidence[0]);
  }
  if (!input.expoRuntimeStarted || !input.iosSimulatorSmokePassed || !input.androidEmulatorSmokePassed || !input.easPreviewBuildPassed) {
    requiredEvidence.push(mobileLaunchEvidenceRequiredEvidence[1]);
  }
  if (!input.authSessionBiometricQaPassed || !input.tenantApiClientQaPassed || !input.pushNotificationQaPassed || !input.encryptedOfflineStoreQaPassed) {
    requiredEvidence.push(mobileLaunchEvidenceRequiredEvidence[2]);
  }
  if (!input.uploadFlowQaPassed || !input.crashReportingQaPassed || !input.otaUpdateRollbackQaPassed || !input.physicalDeviceQaCompleted || !input.accessibilityQaPassed) {
    requiredEvidence.push(mobileLaunchEvidenceRequiredEvidence[3]);
  }
  if (!input.appJsonProjectConfigured || !input.easChannelsConfigured || !input.ciEvidenceCaptured || !input.launchArtifactsSecretSafe) {
    requiredEvidence.push(mobileLaunchEvidenceRequiredEvidence[4]);
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: mobileLaunchEvidenceRequiredCommands,
    requiredEvidence:
      requiredEvidence.length === mobileLaunchEvidenceRequiredEvidence.length
        ? mobileLaunchEvidenceRequiredEvidence
        : requiredEvidence,
    blockers,
  };
}

export interface MobileHealthCheck {
  id: string;
  label: string;
  state: "healthy-demo" | "blocked" | "not-configured" | "needs-runtime-test";
  detail: string;
}

export const phase6HealthChecks: readonly MobileHealthCheck[] = [
  {
    id: "expo-runtime",
    label: "Expo runtime",
    state: "needs-runtime-test",
    detail: "Requires dependency install and Expo simulator/device smoke test.",
  },
  {
    id: "api-connectivity",
    label: "API connectivity",
    state: "not-configured",
    detail: "No mobile API base URL, auth token exchange, or retry client is configured.",
  },
  {
    id: "push-token",
    label: "Push token registration",
    state: "not-configured",
    detail: "Expo push registration and token persistence contracts are wired; real Expo project, permissions, persisted tokens, and device delivery proof remain gated.",
  },
  {
    id: "crash-capture",
    label: "Crash capture",
    state: "not-configured",
    detail: "Sanitized fallback crash capture contract is wired; Sentry Expo capture and device proof remain gated.",
  },
  {
    id: "ota-updates",
    label: "OTA update channel",
    state: "not-configured",
    detail: "EAS channel and runtimeVersion placeholders are wired; real project, update URL, credentials, and rollback proof remain gated.",
  },
];

export function getMobileScreen(id: MobileScreenId): MobileScreenDefinition {
  const screen = mobileScreenRegistry.find((entry) => entry.id === id);
  if (!screen) {
    throw new Error(`Unknown mobile screen: ${id}`);
  }
  return screen;
}
export {
  mobileTestingExecutionArtifactPaths,
  mobileTestingExecutionChecklistIds,
  mobileTestingExecutionCommands,
  mobileTestingExecutionMatrix,
  mobileTestingExecutionReadiness,
} from "./mobile-testing-execution";
export type { MobileTestingExecutionMatrixEntry, MobileTestingExecutionStatus } from "./mobile-testing-execution";
