import {
  buildOfflineIdempotencyKey,
  buildOfflineSyncAuditEvent,
  planOfflineSync,
  type OfflineQueueItem,
  type OfflineSyncAuditEvent,
  type OfflineSyncPlan,
} from "@inkroute/mobile-support";
import { createHash } from "node:crypto";
import { mobileApiFetch, type MobileApiClientRequest, type MobileApiResponseEnvelope, type MobileApiSession } from "./mobileApiClient";
import { offlineQueueItems } from "./mobileDemo";

export interface OfflineStoreAdapter {
  name: "expo-secure-store" | "encrypted-sqlite" | "memory-test";
  encryptedAtRest: boolean;
  loadQueue(): Promise<OfflineQueueItem[]>;
  saveQueue(items: readonly OfflineQueueItem[]): Promise<void>;
  appendAudit(event: OfflineSyncAuditEvent): Promise<void>;
}

export interface OfflineSecureStoreDriver {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync?(key: string): Promise<void>;
}

export interface OfflineEncryptedSqliteAuditDriver {
  appendAuditEvent(event: OfflineSyncAuditEvent): Promise<void>;
}

export interface PersistentOfflineStoreOptions {
  secureStore: OfflineSecureStoreDriver;
  queueKey: string;
  auditKey: string;
  name?: "expo-secure-store" | "encrypted-sqlite";
  auditStore?: OfflineEncryptedSqliteAuditDriver;
  seed?: readonly OfflineQueueItem[];
}

export type OfflineSyncTransport = (
  session: MobileApiSession,
  request: MobileApiClientRequest,
) => Promise<MobileApiResponseEnvelope<unknown>>;

export interface OfflineConnectivityAdapter {
  readonly name: "expo-network" | "react-native-netinfo" | "manual-test";
  isOnline(): Promise<boolean>;
  subscribe(listener: (online: boolean) => void): () => void;
}

export interface OfflineSyncRunResult {
  plan: OfflineSyncPlan;
  auditEvents: readonly OfflineSyncAuditEvent[];
  syncedItemIdHashes: readonly string[];
  failedItemIdHashes: readonly string[];
  blockedItemIdHashes: readonly string[];
  rawItemIdsEchoed: false;
}

export interface OfflineReconnectSyncController {
  readonly reconnectWorkerConfigured: true;
  start(): Promise<void>;
  stop(): void;
}

export function createMemoryOfflineStore(seed: readonly OfflineQueueItem[] = offlineQueueItems): OfflineStoreAdapter {
  let items = seed.map((item) => ({ ...item }));
  const auditEvents: OfflineSyncAuditEvent[] = [];

  return {
    name: "memory-test",
    encryptedAtRest: false,
    async loadQueue() {
      return items.map((item) => ({ ...item }));
    },
    async saveQueue(nextItems) {
      items = nextItems.map((item) => ({ ...item }));
    },
    async appendAudit(event) {
      auditEvents.push(event);
    },
  };
}

export function createPersistentOfflineStore(options: PersistentOfflineStoreOptions): OfflineStoreAdapter {
  const name = options.name ?? "expo-secure-store";
  const seed = options.seed?.map((item) => ({ ...item })) ?? [];

  const readJsonArray = async <T>(key: string): Promise<T[]> => {
    const stored = await options.secureStore.getItemAsync(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  };

  return {
    name,
    encryptedAtRest: true,
    async loadQueue() {
      const items = await readJsonArray<OfflineQueueItem>(options.queueKey);
      if (items.length > 0 || seed.length === 0) {
        return items.map((item) => ({ ...item }));
      }
      await options.secureStore.setItemAsync(options.queueKey, JSON.stringify(seed));
      return seed.map((item) => ({ ...item }));
    },
    async saveQueue(nextItems) {
      await options.secureStore.setItemAsync(options.queueKey, JSON.stringify(nextItems));
    },
    async appendAudit(event) {
      await options.auditStore?.appendAuditEvent(event);
      const events = await readJsonArray<OfflineSyncAuditEvent>(options.auditKey);
      events.push(event);
      await options.secureStore.setItemAsync(options.auditKey, JSON.stringify(events));
    },
  };
}

export function buildOfflineSyncTransportFailureAuditEvent(
  item: OfflineQueueItem,
  idempotencyKey: string,
  occurredAt: string,
): OfflineSyncAuditEvent {
  return {
    itemIdHash: buildOfflineResultItemHash(item),
    rawItemIdEchoed: false,
    decision: "transport_failed",
    idempotencyKeyHash: buildOfflineResultIdempotencyHash(idempotencyKey),
    rawIdempotencyKeyEchoed: false,
    sensitive: item.sensitive,
    occurredAt,
    redactedDetail: "Offline sync transport failed. Payload, response body, and credentials redacted.",
  };
}

function buildOfflineResultItemHash(item: OfflineQueueItem): string {
  return `offline-item:${createHash("sha256").update(JSON.stringify([item.tenantId ?? "unknown-tenant", item.kind, item.id])).digest("hex")}`;
}

function buildOfflineResultIdempotencyHash(idempotencyKey: string): string {
  return `offline-idempotency:${createHash("sha256").update(idempotencyKey).digest("hex")}`;
}

export function createOfflineReconnectSyncController(input: {
  connectivity: OfflineConnectivityAdapter;
  store: OfflineStoreAdapter;
  session: MobileApiSession;
  now: () => string;
  transport?: OfflineSyncTransport;
}): OfflineReconnectSyncController {
  let unsubscribe: (() => void) | null = null;
  let lastOnline = false;
  let syncInFlight: Promise<OfflineSyncRunResult> | null = null;

  const scheduleSync = () => {
    if (!syncInFlight) {
      syncInFlight = runOfflineSyncOnce({
        store: input.store,
        session: input.session,
        generatedAt: input.now(),
        ...(input.transport ? { transport: input.transport } : {}),
      }).finally(() => {
        syncInFlight = null;
      });
    }
    return syncInFlight;
  };

  const handleConnectivity = (online: boolean) => {
    const reconnected = online && !lastOnline;
    lastOnline = online;
    if (reconnected) {
      void scheduleSync();
    }
  };

  return {
    reconnectWorkerConfigured: true,
    async start() {
      lastOnline = await input.connectivity.isOnline();
      unsubscribe = input.connectivity.subscribe(handleConnectivity);
      if (lastOnline) {
        await scheduleSync();
      }
    },
    stop() {
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}

function mobileDomainForOfflineItem(item: OfflineQueueItem) {
  if (item.kind === "booking_note") return "bookings";
  if (item.kind === "client_note") return "clients";
  if (item.kind === "travel_update") return "travel";
  if (item.kind === "portfolio_metadata") return "portfolio";
  return "notifications";
}

export async function runOfflineSyncOnce(input: {
  store: OfflineStoreAdapter;
  session: MobileApiSession;
  generatedAt: string;
  transport?: OfflineSyncTransport;
}): Promise<OfflineSyncRunResult> {
  const items = await input.store.loadQueue();
  const transport = input.transport ?? mobileApiFetch<unknown>;
  const plan = planOfflineSync({
    items,
    generatedAt: input.generatedAt,
    encryptedStoreAvailable: input.store.encryptedAtRest,
  });
  const auditEvents: OfflineSyncAuditEvent[] = [];
  const syncedItemIdHashes: string[] = [];
  const failedItemIdHashes: string[] = [];
  const blockedItemIdHashes: string[] = [];

  const nextItems = await Promise.all(items.map(async (item) => {
    const decision = plan.decisions.find((entry) => entry.itemId === item.id);
    if (!decision) return item;

    const auditEvent = buildOfflineSyncAuditEvent(item, decision, input.generatedAt);
    auditEvents.push(auditEvent);
    await input.store.appendAudit(auditEvent);

    if (decision.status !== "ready_to_sync") {
      if (decision.status !== "already_synced") blockedItemIdHashes.push(buildOfflineResultItemHash(item));
      return item;
    }

    try {
      await transport(input.session, {
        domain: mobileDomainForOfflineItem(item),
        method: "PATCH",
        path: `/api/mobile/offline/${encodeURIComponent(item.kind)}/${encodeURIComponent(item.entityId ?? item.id)}`,
        requestId: `offline-${item.id}`,
        idempotencyKey: buildOfflineIdempotencyKey(item),
        body: {
          itemId: item.id,
          kind: item.kind,
          entityId: item.entityId,
          localVersion: item.localVersion,
          createdAt: item.createdAt,
        },
      });
    } catch {
      const failureAuditEvent = buildOfflineSyncTransportFailureAuditEvent(item, decision.idempotencyKey, input.generatedAt);
      auditEvents.push(failureAuditEvent);
      await input.store.appendAudit(failureAuditEvent);
      failedItemIdHashes.push(buildOfflineResultItemHash(item));
      return {
        ...item,
        status: "failed" as const,
        lastAttemptAt: input.generatedAt,
        retryCount: item.retryCount + 1,
      };
    }

    syncedItemIdHashes.push(buildOfflineResultItemHash(item));
    return {
      ...item,
      status: "synced" as const,
      lastAttemptAt: input.generatedAt,
      retryCount: item.retryCount,
    };
  }));

  await input.store.saveQueue(nextItems);

  return {
    plan,
    auditEvents,
    syncedItemIdHashes,
    failedItemIdHashes,
    blockedItemIdHashes,
    rawItemIdsEchoed: false,
  };
}

export const offlineSyncPreview = {
  adapter: "persistent-encrypted-store-factory-wired",
  reconnectWorker: "offline-to-online scheduler contract wired",
  idempotencyExample: buildOfflineIdempotencyKey({
    id: "offline_preview",
    kind: "booking_note",
    label: "Preview booking note",
    status: "queued",
    createdAt: "2026-06-09T00:00:00.000Z",
    retryCount: 0,
    sensitive: true,
    tenantId: "tenant_preview",
    entityId: "booking_preview",
  }),
  boundary:
    "Offline sync now has an app-side persistent encrypted-store factory, offline-to-online reconnect scheduler, and worker contract with redacted audit events; native encrypted device storage binding and reconnect smoke evidence remain runtime-gated.",
};
