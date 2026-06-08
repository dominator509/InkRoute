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
  phase6Status: "implemented-static" | "scaffolded-boundary" | "provider-gated" | "runtime-gated";
}

export const mobileScreenRegistry: readonly MobileScreenDefinition[] = [
  {
    id: "auth",
    label: "Secure login",
    shortLabel: "Auth",
    summary: "Mock login posture with biometric and session boundaries called out for provider implementation.",
    phase6Status: "scaffolded-boundary",
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
    summary: "Mobile review queue with readiness score, lifecycle status, and disabled action boundaries.",
    phase6Status: "implemented-static",
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
    summary: "Artist-facing tool for city status publishing, waitlist posture, and guest spot updates.",
    phase6Status: "implemented-static",
  },
  {
    id: "portfolio",
    label: "Portfolio upload",
    shortLabel: "Portfolio",
    summary: "Portfolio metadata capture preview for style tags, placement, freshness, city, and alt text.",
    phase6Status: "scaffolded-boundary",
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
    summary: "Offline-first queue model for weak travel connectivity; no durable local store wired yet.",
    phase6Status: "scaffolded-boundary",
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

export interface MobileIntegrationBoundary {
  id: string;
  label: string;
  status: "mocked" | "scaffolded" | "credential-gated" | "deployment-gated" | "externally-dependent";
  blocksProduction: boolean;
  detail: string;
}

export const phase6MobileBoundaries: readonly MobileIntegrationBoundary[] = [
  {
    id: "mobile-auth",
    label: "Auth and biometric unlock",
    status: "credential-gated",
    blocksProduction: true,
    detail: "Expo screens show secure-login posture only. Auth provider, refresh tokens, biometric gate, and tenant membership checks remain external implementation.",
  },
  {
    id: "mobile-api",
    label: "Tenant-scoped API client",
    status: "scaffolded",
    blocksProduction: true,
    detail: "The app uses static data. It does not call dashboard/mobile APIs or persist mutations to Postgres.",
  },
  {
    id: "mobile-push",
    label: "Push notifications",
    status: "credential-gated",
    blocksProduction: true,
    detail: "Expo push token registration, notification permissions, provider delivery logs, and opt-out compliance are not wired.",
  },
  {
    id: "mobile-offline-store",
    label: "Offline-first storage",
    status: "scaffolded",
    blocksProduction: true,
    detail: "Offline queue types exist, but no SQLite/AsyncStorage persistence, sync conflict resolution, encryption, or retry worker is implemented.",
  },
  {
    id: "mobile-crash",
    label: "Crash reporting",
    status: "credential-gated",
    blocksProduction: true,
    detail: "Sentry or fallback crash capture is documented but not wired into Expo runtime.",
  },
  {
    id: "mobile-updates",
    label: "OTA/release updates",
    status: "deployment-gated",
    blocksProduction: false,
    detail: "EAS Update strategy is documented as optional. No Expo project ID, channels, runtimeVersion policy, or rollback checks are configured for production.",
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
    warning: "Offline queue is a Phase 6 model only; encrypted persistence and sync conflict handling are not implemented.",
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
    warning: "Offline sync planning is dependency-light only; encrypted device persistence and runtime worker execution remain unimplemented.",
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
      command: "eas update --channel preview and rollback republish",
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
    detail: "No Expo push project, notification permission flow, or token persistence exists.",
  },
  {
    id: "crash-capture",
    label: "Crash capture",
    state: "not-configured",
    detail: "Sentry/mobile fallback capture is documented only.",
  },
  {
    id: "ota-updates",
    label: "OTA update channel",
    state: "not-configured",
    detail: "EAS Update project/channel/runtimeVersion policy is not connected.",
  },
];

export function getMobileScreen(id: MobileScreenId): MobileScreenDefinition {
  const screen = mobileScreenRegistry.find((entry) => entry.id === id);
  if (!screen) {
    throw new Error(`Unknown mobile screen: ${id}`);
  }
  return screen;
}
