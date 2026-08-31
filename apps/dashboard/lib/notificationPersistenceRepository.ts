import { createHash } from "node:crypto";

export const notificationPersistenceRepositoryMethods = [
  "createMessageThreadInTransaction",
  "appendMessageInTransaction",
  "createNotificationRecord",
  "createNotificationDeliveryRecord",
  "createNotificationDeliveryStatusTransition",
  "createNotificationProviderHandoff",
  "upsertNotificationReadState",
  "writeNotificationAuditLog",
  "claimMessageIdempotencyKey",
] as const;

export type NotificationPersistenceRepositoryMethod = (typeof notificationPersistenceRepositoryMethods)[number];

export interface NotificationPersistenceRepositoryContract {
  readonly tenantScopedFiltersRequired: true;
  readonly transactionRequired: true;
  readonly rawBodyStorageForbidden: true;
  readonly requiredModels: readonly string[];
  readonly requiredMethods: readonly NotificationPersistenceRepositoryMethod[];
  readonly sanitizedProviderHandoffPayloadFields: readonly string[];
}

export const notificationPersistenceRepositoryContract: NotificationPersistenceRepositoryContract = {
  tenantScopedFiltersRequired: true,
  transactionRequired: true,
  rawBodyStorageForbidden: true,
  requiredModels: [
    "MessageThread",
    "Message",
    "Notification",
    "NotificationDelivery",
    "NotificationDeliveryStatusTransition",
    "NotificationProviderHandoff",
    "NotificationReadState",
    "AuditLog",
    "IdempotencyKey",
  ],
  requiredMethods: notificationPersistenceRepositoryMethods,
  sanitizedProviderHandoffPayloadFields: [
    "action",
    "source",
    "threadId",
    "messageId",
    "notificationId",
    "deliveryId",
    "redactedBodyPreview",
    "redactedFields",
  ],
};

export function assertNotificationPersistenceRepositoryContract(
  contract: NotificationPersistenceRepositoryContract,
): NotificationPersistenceRepositoryContract {
  if (!contract.tenantScopedFiltersRequired) throw new Error("Notification persistence repositories must require tenant-scoped filters.");
  if (!contract.transactionRequired) throw new Error("Notification persistence repositories must write through a transaction boundary.");
  if (!contract.rawBodyStorageForbidden) throw new Error("Notification provider handoff payloads must not store raw message bodies.");
  if (!contract.requiredMethods.includes("createNotificationProviderHandoff")) {
    throw new Error("Notification persistence repositories must expose createNotificationProviderHandoff.");
  }
  return contract;
}

export interface InMemoryNotificationPersistenceRepositoryState {
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly requestId: string; readonly redactedCommittedResult?: Record<string, unknown> }>;
  readonly transactions: { readonly tenantId: string; readonly model: string; readonly redactedPayload: Record<string, unknown> }[];
  readonly readStates: Map<string, { readonly tenantId: string; readonly threadId: string; readonly userId: string; readonly readAt: string }>;
  readonly statusTransitions: { readonly tenantId: string; readonly deliveryId: string; readonly status: string; readonly occurredAt: string }[];
  readonly providerHandoffs: { readonly tenantId: string; readonly deliveryId: string; readonly sanitizedPayload: Record<string, unknown> }[];
  readonly auditLogs: { readonly tenantId: string; readonly action: string; readonly redactedMetadata: Record<string, unknown> }[];
}

const notificationPersistencePrivatePayloadKeys = new Set([
  "body",
  "rawBody",
  "destination",
  "email",
  "phone",
  "providerMessageId",
  "clientName",
  "providerSecret",
]);

function redactNotificationPersistencePayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactNotificationPersistencePayloadValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        notificationPersistencePrivatePayloadKeys.has(key)
          ? "[redacted]"
          : redactNotificationPersistencePayloadValue(entry),
      ]),
    );
  }

  return value;
}

export function buildRedactedNotificationPersistencePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return redactNotificationPersistencePayloadValue(payload) as Record<string, unknown>;
}

function buildIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `notification-persistence-idempotency:${createHash("sha256").update(JSON.stringify([input.tenantId, input.key])).digest("hex")}`;
}

function buildReadStateKey(input: { readonly tenantId: string; readonly threadId: string; readonly userId: string }): string {
  return `notification-read-state:${createHash("sha256").update(JSON.stringify([input.tenantId, input.threadId, input.userId])).digest("hex")}`;
}

export function createInMemoryNotificationPersistenceRepository(
  state: InMemoryNotificationPersistenceRepositoryState = {
    idempotencyKeys: new Map(),
    transactions: [],
    readStates: new Map(),
    statusTransitions: [],
    providerHandoffs: [],
    auditLogs: [],
  },
): {
  readonly state: InMemoryNotificationPersistenceRepositoryState;
  readonly claimMessageIdempotencyKey: (input: {
    readonly tenantId: string;
    readonly key: string;
    readonly requestId: string;
    readonly redactedCommittedResult?: Record<string, unknown>;
  }) => "claimed" | "duplicate";
  readonly createMessageThreadInTransaction: (input: { readonly tenantId: string; readonly payload: Record<string, unknown> }) => void;
  readonly appendMessageInTransaction: (input: { readonly tenantId: string; readonly payload: Record<string, unknown> }) => void;
  readonly createNotificationDeliveryStatusTransition: (input: { readonly tenantId: string; readonly deliveryId: string; readonly status: string; readonly occurredAt: string }) => void;
  readonly createNotificationProviderHandoff: (input: { readonly tenantId: string; readonly deliveryId: string; readonly payload: Record<string, unknown> }) => void;
  readonly upsertNotificationReadState: (input: { readonly tenantId: string; readonly threadId: string; readonly userId: string; readonly readAt: string }) => void;
  readonly writeNotificationAuditLog: (input: { readonly tenantId: string; readonly action: string; readonly metadata: Record<string, unknown> }) => void;
} {
  return {
    state,
    claimMessageIdempotencyKey(input) {
      const key = buildIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, {
          tenantId: input.tenantId,
          requestId: input.requestId,
          ...(input.redactedCommittedResult
            ? { redactedCommittedResult: buildRedactedNotificationPersistencePayload(input.redactedCommittedResult) }
            : {}),
        });
        return "claimed";
      }

      if (existing.requestId === input.requestId) {
        return "duplicate";
      }

      throw new Error("NOTIFICATION_PERSISTENCE_IDEMPOTENCY_KEY_CONFLICT");
    },
    createMessageThreadInTransaction(input) {
      state.transactions.push({
        tenantId: input.tenantId,
        model: "MessageThread",
        redactedPayload: buildRedactedNotificationPersistencePayload(input.payload),
      });
    },
    appendMessageInTransaction(input) {
      state.transactions.push({
        tenantId: input.tenantId,
        model: "Message",
        redactedPayload: buildRedactedNotificationPersistencePayload(input.payload),
      });
    },
    createNotificationDeliveryStatusTransition(input) {
      state.statusTransitions.push(input);
    },
    createNotificationProviderHandoff(input) {
      state.providerHandoffs.push({
        tenantId: input.tenantId,
        deliveryId: input.deliveryId,
        sanitizedPayload: buildRedactedNotificationPersistencePayload(input.payload),
      });
    },
    upsertNotificationReadState(input) {
      state.readStates.set(buildReadStateKey(input), input);
    },
    writeNotificationAuditLog(input) {
      state.auditLogs.push({
        tenantId: input.tenantId,
        action: input.action,
        redactedMetadata: buildRedactedNotificationPersistencePayload(input.metadata),
      });
    },
  };
}
