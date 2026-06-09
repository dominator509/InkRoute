import {
  buildOfflineIdempotencyKey,
  planOfflineSync,
  type OfflineQueueItem,
  type OfflineSyncDecision,
  type OfflineSyncPlan,
} from "@inkroute/mobile-support";
import { mobileApiFetch, type MobileApiSession } from "./mobileApiClient";
import { offlineQueueItems } from "./mobileDemo";

export interface OfflineStoreAdapter {
  name: "expo-secure-store" | "encrypted-sqlite" | "memory-test";
  encryptedAtRest: boolean;
  loadQueue(): Promise<OfflineQueueItem[]>;
  saveQueue(items: readonly OfflineQueueItem[]): Promise<void>;
  appendAudit(event: OfflineSyncAuditEvent): Promise<void>;
}

export interface OfflineSyncAuditEvent {
  itemId: string;
  decision: OfflineSyncDecision["status"];
  idempotencyKey: string;
  sensitive: boolean;
  occurredAt: string;
  redactedDetail: string;
}

export interface OfflineSyncRunResult {
  plan: OfflineSyncPlan;
  auditEvents: readonly OfflineSyncAuditEvent[];
  syncedItemIds: readonly string[];
  blockedItemIds: readonly string[];
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
}): Promise<OfflineSyncRunResult> {
  const items = await input.store.loadQueue();
  const plan = planOfflineSync({
    items,
    generatedAt: input.generatedAt,
    encryptedStoreAvailable: input.store.encryptedAtRest,
  });
  const auditEvents: OfflineSyncAuditEvent[] = [];
  const syncedItemIds: string[] = [];
  const blockedItemIds: string[] = [];

  const nextItems = await Promise.all(items.map(async (item) => {
    const decision = plan.decisions.find((entry) => entry.itemId === item.id);
    if (!decision) return item;

    const auditEvent = buildOfflineSyncAuditEvent(item, decision, input.generatedAt);
    auditEvents.push(auditEvent);
    await input.store.appendAudit(auditEvent);

    if (decision.status !== "ready_to_sync") {
      if (decision.status !== "already_synced") blockedItemIds.push(item.id);
      return item;
    }

    await mobileApiFetch(input.session, {
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

    syncedItemIds.push(item.id);
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
    syncedItemIds,
    blockedItemIds,
  };
}

export const offlineSyncPreview = {
  adapter: "encrypted-store-required",
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
    "Offline sync now has an app-side adapter/worker contract with redacted audit events; encrypted device storage and reconnect smoke evidence remain runtime-gated.",
};
