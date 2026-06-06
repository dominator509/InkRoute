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
