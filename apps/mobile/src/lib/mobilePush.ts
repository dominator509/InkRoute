import {
  buildExpoPushDeliveryPlan,
  buildExpoPushProviderRuntimeReadinessPlan,
  buildExpoPushReceiptProcessingPlan,
  buildExpoPushRegistrationPlan,
  buildExpoPushTapRoutingPlan,
  buildProviderEventReconciliationPlan,
  type ClientConsentSnapshot,
  type ExpoPushDeliveryPlan,
  type ExpoPushProviderRuntimeReadinessPlan,
  type ExpoPushReceiptProcessingPlan,
  type ExpoPushRegistrationPlan,
  type ExpoPushTapRoutingPlan,
  type NotificationTemplateContext,
  type NotificationTemplateKey,
  type ProviderEventReconciliationPlan,
} from "@inkroute/notifications";
import { buildMobilePushLocalContract } from "@inkroute/mobile-support";
import { inkrouteDemoTenant } from "@inkroute/config";
import { createHash } from "node:crypto";
import { mobileNotificationConsent } from "./mobileDemo";

export interface MobilePushRuntimeContext {
  tenantId: string;
  userId: string;
  deviceId: string;
  requestId: string;
  permissionStatus: "undetermined" | "denied" | "granted";
  expoPushToken?: string | null;
  pushOptIn: boolean;
  registeredAt: string;
}

export interface MobilePushPersistenceAdapter {
  persistRegistration(plan: ExpoPushRegistrationPlan): Promise<void>;
  persistDelivery(plan: ExpoPushDeliveryPlan): Promise<void>;
  persistReceipt(plan: ExpoPushReceiptProcessingPlan): Promise<void>;
  persistTap(plan: ExpoPushTapRoutingPlan): Promise<void>;
}

export interface ExpoPushProviderRepository {
  persistPushToken(plan: ExpoPushRegistrationPlan): Promise<void>;
  persistPushOptOut(input: { tenantId: string; userId: string; deviceId: string; optedOut: boolean }): Promise<void>;
  claimReceiptIdempotency(input: { tenantId: string; receiptId: string; requestId: string }): Promise<"claimed" | "duplicate">;
  persistDelivery(plan: ExpoPushDeliveryPlan): Promise<void>;
  persistProviderEvent(input: { tenantId: string; reconciliation: ProviderEventReconciliationPlan; redactedPayload: Record<string, unknown> }): Promise<void>;
  suppressInvalidToken(input: { tenantId: string; tokenHash: string; receiptId: string }): Promise<void>;
  persistTapInteraction(plan: ExpoPushTapRoutingPlan): Promise<void>;
  persistAuditLog(input: { tenantId: string; action: string; redactedMetadata: Record<string, unknown> }): Promise<void>;
}

export interface PrismaExpoPushProviderRepositoryClient {
  pushToken: {
    upsert(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<unknown>;
  };
  notificationSuppression: {
    upsert(args: unknown): Promise<unknown>;
  };
  idempotencyKey: {
    findUnique(args: unknown): Promise<{ metadata?: unknown } | null>;
    create(args: unknown): Promise<unknown>;
  };
  notificationDelivery: {
    create(args: unknown): Promise<unknown>;
    updateMany(args: unknown): Promise<unknown>;
  };
  providerEvent: {
    upsert(args: unknown): Promise<unknown>;
  };
  notificationInteraction: {
    create(args: unknown): Promise<unknown>;
  };
  auditLog: {
    create(args: unknown): Promise<unknown>;
  };
}

export interface InMemoryExpoPushProviderRepositoryState {
  readonly pushTokens: ExpoPushRegistrationPlan[];
  readonly optOuts: { readonly tenantId: string; readonly userId: string; readonly deviceId: string; readonly optedOut: boolean }[];
  readonly receiptIdempotencyKeys: Map<string, { readonly tenantId: string; readonly requestIdHash: string }>;
  readonly deliveries: ExpoPushDeliveryPlan[];
  readonly providerEvents: { readonly tenantId: string; readonly reconciliation: ProviderEventReconciliationPlan; readonly redactedPayload: Record<string, unknown> }[];
  readonly invalidTokenSuppressions: { readonly tenantId: string; readonly tokenHash: string; readonly receiptId: string }[];
  readonly tapInteractions: ExpoPushTapRoutingPlan[];
  readonly auditLogs: { readonly tenantId: string; readonly action: string; readonly redactedMetadata: Record<string, unknown> }[];
}

export interface ExpoPushProviderContract {
  runtimeReadiness: ExpoPushProviderRuntimeReadinessPlan;
  invalidTokenReceipt: ExpoPushReceiptProcessingPlan;
  receiptReconciliation: ProviderEventReconciliationPlan;
  requiredRepositoryMethods: readonly (keyof ExpoPushProviderRepository)[];
}

export interface MobilePushContractPreview {
  registration: ExpoPushRegistrationPlan;
  registrationReceipt: MobilePushRegistrationReceipt;
  delivery: ExpoPushDeliveryPlan;
  receipt: ExpoPushReceiptProcessingPlan;
  tap: ExpoPushTapRoutingPlan;
  localContract: ReturnType<typeof buildMobilePushLocalContract>;
  provider: ExpoPushProviderContract;
  boundary: string;
}

export interface MobilePushRegistrationReceipt {
  status: ExpoPushRegistrationPlan["status"];
  provider: ExpoPushRegistrationPlan["provider"];
  tokenPersistenceRequired: boolean;
  tokenMaskedAvailable: boolean;
  optOutPersistenceRequired: boolean;
  responseProjection: {
    rawExpoPushTokenEchoed: false;
    rawNativeDeviceTokenEchoed: false;
    rawAccessTokenEchoed: false;
    tenantIdEchoed: false;
    userIdEchoed: false;
    deviceIdEchoed: false;
    internalPersistenceIdsEchoed: false;
  };
}

const expoPushPrivatePayloadKeys = new Set([
  "expoPushToken",
  "pushToken",
  "accessToken",
  "authorization",
  "deviceToken",
  "receiptRawPayload",
  "clientName",
  "tenantSecret",
]);

function redactExpoPushPayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactExpoPushPayloadValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        expoPushPrivatePayloadKeys.has(key) ? "[redacted]" : redactExpoPushPayloadValue(entry),
      ]),
    );
  }

  return value;
}

export function buildRedactedExpoPushPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return redactExpoPushPayloadValue(payload) as Record<string, unknown>;
}

function buildReceiptIdempotencyKey(input: { readonly tenantId: string; readonly receiptId: string }): string {
  return `expo-receipt:${createHash("sha256").update(JSON.stringify([input.tenantId, input.receiptId])).digest("hex")}`;
}

function buildMobilePushSelectorHash(scope: string, parts: readonly string[]): string {
  return `${scope}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

function toJsonValue(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function idempotencyMetadataRequestIdHash(metadata: unknown): string | null {
  return metadata && typeof metadata === "object" && "requestIdHash" in metadata && typeof metadata.requestIdHash === "string"
    ? metadata.requestIdHash
    : null;
}

export function createPrismaExpoPushProviderRepository(
  client: PrismaExpoPushProviderRepositoryClient,
): ExpoPushProviderRepository {
  return {
    async persistPushToken(plan) {
      if (!plan.shouldPersistToken) return;
      const now = new Date();
      await client.pushToken.upsert({
        where: { tenantId_provider_deviceId: { tenantId: plan.tenantId, provider: plan.provider, deviceId: plan.deviceId } },
        create: {
          tenantId: plan.tenantId,
          userId: plan.userId,
          deviceId: plan.deviceId,
          provider: plan.provider,
          tokenHash: plan.tokenMasked ?? buildMobilePushSelectorHash("masked-token", [plan.tenantId, plan.deviceId]),
          tokenMasked: plan.tokenMasked,
          active: true,
          permissionStatus: "granted",
          optIn: true,
          registeredAt: now,
          lastSeenAt: now,
          metadata: toJsonValue({
            source: "mobile_push_registration",
            requiredWrites: plan.requiredWrites,
            gapIds: ["GAP-063"],
          }),
        },
        update: {
          userId: plan.userId,
          tokenHash: plan.tokenMasked ?? buildMobilePushSelectorHash("masked-token", [plan.tenantId, plan.deviceId]),
          tokenMasked: plan.tokenMasked,
          active: true,
          permissionStatus: "granted",
          optIn: true,
          disabledAt: null,
          lastSeenAt: now,
          metadata: toJsonValue({
            source: "mobile_push_registration",
            requiredWrites: plan.requiredWrites,
            gapIds: ["GAP-063"],
          }),
        },
      });
    },
    async persistPushOptOut(input) {
      await client.pushToken.updateMany({
        where: { tenantId: input.tenantId, userId: input.userId, deviceId: input.deviceId, provider: "expo" },
        data: {
          active: !input.optedOut,
          optIn: !input.optedOut,
          disabledAt: input.optedOut ? new Date() : null,
        },
      });
      await client.notificationSuppression.upsert({
        where: {
          tenantId_channel_destinationHash_reason: {
            tenantId: input.tenantId,
            channel: "push",
            destinationHash: buildMobilePushSelectorHash("push-opt-out-device", [input.tenantId, input.deviceId]),
            reason: "mobile_push_opt_out",
          },
        },
        create: {
          tenantId: input.tenantId,
          channel: "push",
          provider: "expo",
          destinationHash: buildMobilePushSelectorHash("push-opt-out-device", [input.tenantId, input.deviceId]),
          reason: "mobile_push_opt_out",
          source: "mobile",
          active: input.optedOut,
          rawPayloadStored: false,
          metadata: toJsonValue({
            userIdHash: buildMobilePushSelectorHash("push-opt-out-user", [input.tenantId, input.userId]),
            deviceIdHash: buildMobilePushSelectorHash("push-opt-out-device", [input.tenantId, input.deviceId]),
            rawUserIdStored: false,
            rawDeviceIdStored: false,
            gapIds: ["GAP-063"],
          }),
        },
        update: {
          active: input.optedOut,
          metadata: toJsonValue({
            userIdHash: buildMobilePushSelectorHash("push-opt-out-user", [input.tenantId, input.userId]),
            deviceIdHash: buildMobilePushSelectorHash("push-opt-out-device", [input.tenantId, input.deviceId]),
            rawUserIdStored: false,
            rawDeviceIdStored: false,
            gapIds: ["GAP-063"],
          }),
        },
      });
    },
    async claimReceiptIdempotency(input) {
      const existing = await client.idempotencyKey.findUnique({
        where: { tenantId_scope_key: { tenantId: input.tenantId, scope: "expo_push_receipt", key: buildReceiptIdempotencyKey(input) } },
        select: { metadata: true },
      });

      if (existing) {
        if (idempotencyMetadataRequestIdHash(existing.metadata) === buildMobilePushSelectorHash("expo-receipt-request", [input.requestId])) return "duplicate";
        throw new Error("EXPO_PUSH_RECEIPT_IDEMPOTENCY_KEY_CONFLICT");
      }

      await client.idempotencyKey.create({
        data: {
          tenantId: input.tenantId,
          scope: "expo_push_receipt",
          key: buildReceiptIdempotencyKey(input),
          status: "claimed",
          metadata: toJsonValue({
            requestIdHash: buildMobilePushSelectorHash("expo-receipt-request", [input.requestId]),
            rawRequestIdStored: false,
            gapIds: ["GAP-063"],
          }),
        },
      });
      return "claimed";
    },
    async persistDelivery(plan) {
      if (plan.status !== "ready") return;
      await client.notificationDelivery.create({
        data: {
          tenantId: plan.tenantId,
          notificationId: plan.notificationId,
          channel: "push",
          status: "queued",
          destinationHash: plan.toMasked,
          provider: plan.provider,
        },
      });
    },
    async persistProviderEvent(input) {
      const payload = buildRedactedExpoPushPayload(input.redactedPayload);
      const processedAt = new Date();
      await client.providerEvent.upsert({
        where: { tenantId_provider_eventId: { tenantId: input.tenantId, provider: input.reconciliation.provider, eventId: input.reconciliation.eventId } },
        create: {
          tenantId: input.tenantId,
          provider: input.reconciliation.provider,
          eventId: input.reconciliation.eventId,
          eventType: input.reconciliation.interpretation.eventType,
          normalizedStatus: input.reconciliation.interpretation.normalizedStatus,
          idempotencyKey: input.reconciliation.idempotencyKey,
          payloadSummary: toJsonValue(payload),
          replayDetected: false,
          rawPayloadStored: false,
          processedAt,
        },
        update: {
          replayDetected: true,
          payloadSummary: toJsonValue(payload),
          rawPayloadStored: false,
          processedAt,
        },
      });
      if (input.reconciliation.shouldUpdateDeliveryLog) {
        await client.notificationDelivery.updateMany({
          where: { tenantId: input.tenantId, provider: input.reconciliation.provider, providerMessageId: input.reconciliation.eventId },
          data: { status: input.reconciliation.interpretation.normalizedStatus, attemptedAt: processedAt },
        });
      }
    },
    async suppressInvalidToken(input) {
      await client.pushToken.updateMany({
        where: { tenantId: input.tenantId, provider: "expo", tokenHash: input.tokenHash },
        data: { active: false, optIn: false, disabledAt: new Date() },
      });
      await client.notificationSuppression.upsert({
        where: {
          tenantId_channel_destinationHash_reason: {
            tenantId: input.tenantId,
            channel: "push",
            destinationHash: input.tokenHash,
            reason: "expo_invalid_token",
          },
        },
        create: {
          tenantId: input.tenantId,
          channel: "push",
          provider: "expo",
          destinationHash: input.tokenHash,
          reason: "expo_invalid_token",
          source: "expo_receipt",
          active: true,
          providerEventId: input.receiptId,
          rawPayloadStored: false,
          metadata: toJsonValue({
            receiptIdHash: buildMobilePushSelectorHash("expo-invalid-token-receipt", [input.receiptId]),
            rawReceiptIdStored: false,
            gapIds: ["GAP-063"],
          }),
        },
        update: {
          active: true,
          providerEventId: input.receiptId,
          metadata: toJsonValue({
            receiptIdHash: buildMobilePushSelectorHash("expo-invalid-token-receipt", [input.receiptId]),
            rawReceiptIdStored: false,
            gapIds: ["GAP-063"],
          }),
        },
      });
    },
    async persistTapInteraction(plan) {
      if (plan.status !== "ready") return;
      await client.notificationInteraction.create({
        data: {
          tenantId: plan.tenantId,
          notificationId: plan.notificationId,
          userId: plan.userId,
          channel: "push",
          interactionType: "tap",
          routePath: plan.routePath,
          idempotencyKey: plan.idempotencyKey,
          metadata: toJsonValue({ requiredWrites: plan.requiredWrites, gapIds: ["GAP-063"] }),
        },
      });
    },
    async persistAuditLog(input) {
      await client.auditLog.create({
        data: {
          tenantId: input.tenantId,
          action: input.action,
          entityType: "MobilePush",
          metadata: toJsonValue(buildRedactedExpoPushPayload(input.redactedMetadata)),
        },
      });
    },
  };
}

export function createInMemoryExpoPushProviderRepository(
  state: InMemoryExpoPushProviderRepositoryState = {
    pushTokens: [],
    optOuts: [],
    receiptIdempotencyKeys: new Map(),
    deliveries: [],
    providerEvents: [],
    invalidTokenSuppressions: [],
    tapInteractions: [],
    auditLogs: [],
  },
): ExpoPushProviderRepository & { readonly state: InMemoryExpoPushProviderRepositoryState } {
  return {
    state,
    async persistPushToken(plan) {
      state.pushTokens.push(plan);
    },
    async persistPushOptOut(input) {
      state.optOuts.push(input);
    },
    async claimReceiptIdempotency(input) {
      const key = buildReceiptIdempotencyKey(input);
      const existing = state.receiptIdempotencyKeys.get(key);

      if (!existing) {
        state.receiptIdempotencyKeys.set(key, {
          tenantId: input.tenantId,
          requestIdHash: buildMobilePushSelectorHash("expo-receipt-request", [input.requestId]),
        });
        return "claimed";
      }

      if (existing.requestIdHash === buildMobilePushSelectorHash("expo-receipt-request", [input.requestId])) {
        return "duplicate";
      }

      throw new Error("EXPO_PUSH_RECEIPT_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistDelivery(plan) {
      state.deliveries.push(plan);
    },
    async persistProviderEvent(input) {
      state.providerEvents.push({
        ...input,
        redactedPayload: buildRedactedExpoPushPayload(input.redactedPayload),
      });
    },
    async suppressInvalidToken(input) {
      state.invalidTokenSuppressions.push(input);
    },
    async persistTapInteraction(plan) {
      state.tapInteractions.push(plan);
    },
    async persistAuditLog(input) {
      state.auditLogs.push({
        ...input,
        redactedMetadata: buildRedactedExpoPushPayload(input.redactedMetadata),
      });
    },
  };
}

export function buildMobilePushRegistrationPlan(context: MobilePushRuntimeContext): ExpoPushRegistrationPlan {
  return buildExpoPushRegistrationPlan({
    tenantId: context.tenantId,
    userId: context.userId,
    deviceId: context.deviceId,
    permissionStatus: context.permissionStatus,
    expoPushToken: context.expoPushToken,
    pushOptIn: context.pushOptIn,
    registeredAt: context.registeredAt,
  });
}

export function buildMobilePushRegistrationReceipt(plan: ExpoPushRegistrationPlan): MobilePushRegistrationReceipt {
  return {
    status: plan.status,
    provider: plan.provider,
    tokenPersistenceRequired: plan.shouldPersistToken,
    tokenMaskedAvailable: Boolean(plan.tokenMasked),
    optOutPersistenceRequired: plan.shouldPersistOptOut,
    responseProjection: {
      rawExpoPushTokenEchoed: false,
      rawNativeDeviceTokenEchoed: false,
      rawAccessTokenEchoed: false,
      tenantIdEchoed: false,
      userIdEchoed: false,
      deviceIdEchoed: false,
      internalPersistenceIdsEchoed: false,
    },
  };
}

export function buildMobilePushDeliveryContract(input: {
  tenantId: string;
  notificationId: string;
  templateKey: NotificationTemplateKey;
  context: NotificationTemplateContext;
  consent: ClientConsentSnapshot;
  requestId: string;
  deepLinkPath: string;
}): ExpoPushDeliveryPlan {
  return buildExpoPushDeliveryPlan(input);
}

export function buildMobilePushReceiptContract(input: {
  tenantId: string;
  deliveryId: string;
  receiptId: string;
  receiptStatus: "ok" | "error";
  requestId: string;
  alreadyProcessedReceiptIds?: readonly string[];
  errorCode?: string;
  errorMessage?: string;
}): ExpoPushReceiptProcessingPlan {
  return buildExpoPushReceiptProcessingPlan(input);
}

export function buildMobilePushTapContract(input: {
  tenantId: string;
  notificationId: string;
  userId: string;
  deepLinkPath: string;
  pushOptIn: boolean;
  requestId: string;
}): ExpoPushTapRoutingPlan {
  return buildExpoPushTapRoutingPlan(input);
}

export function buildExpoPushProviderContract(): ExpoPushProviderContract {
  const invalidTokenReceipt = buildMobilePushReceiptContract({
    tenantId: inkrouteDemoTenant.id,
    deliveryId: "delivery_mobile_demo",
    receiptId: "receipt_mobile_demo",
    receiptStatus: "error",
    requestId: "push_receipt_demo",
    errorCode: "DeviceNotRegistered",
    errorMessage: "Expo token is no longer registered.",
  });

  return {
    runtimeReadiness: buildExpoPushProviderRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      mobileTypecheckPassed: false,
      expoProjectIdConfigured: false,
      expoAccessTokenConfigured: false,
      nativePushCredentialsConfigured: false,
      permissionRuntimeImplemented: true,
      tokenRegistrationRuntimeImplemented: true,
      pushTokenPersistenceAvailable: true,
      optOutPersistenceAvailable: true,
      deliveryWorkerConfigured: false,
      deliveryLogPersistenceAvailable: true,
      auditLogPersistenceAvailable: true,
      expoSendSmokePassed: false,
      receiptWorkerConfigured: false,
      receiptReplayProtectionAvailable: true,
      invalidTokenSuppressionPersistenceAvailable: true,
      deepLinkHandlerImplemented: true,
      foregroundDeviceQaPassed: false,
      backgroundDeviceQaPassed: false,
      tapNavigationDeviceQaPassed: false,
    }),
    invalidTokenReceipt,
    receiptReconciliation: buildProviderEventReconciliationPlan({
      provider: "expo",
      eventId: invalidTokenReceipt.receiptId,
      eventType: invalidTokenReceipt.errorCode ?? invalidTokenReceipt.receiptStatus,
      providerMessageId: invalidTokenReceipt.deliveryId,
    }),
    requiredRepositoryMethods: [
      "persistPushToken",
      "persistPushOptOut",
      "claimReceiptIdempotency",
      "persistDelivery",
      "persistProviderEvent",
      "suppressInvalidToken",
      "persistTapInteraction",
      "persistAuditLog",
    ],
  };
}

export async function persistMobilePushContracts(
  adapter: MobilePushPersistenceAdapter,
  preview: MobilePushContractPreview,
): Promise<void> {
  await adapter.persistRegistration(preview.registration);
  if (preview.delivery.status === "ready") await adapter.persistDelivery(preview.delivery);
  if (preview.receipt.status === "ready") await adapter.persistReceipt(preview.receipt);
  if (preview.tap.status === "ready") await adapter.persistTap(preview.tap);
}

export async function processExpoPushReceipt(
  repository: ExpoPushProviderRepository,
  input: {
    tenantId: string;
    receipt: ExpoPushReceiptProcessingPlan;
    redactedPayload: Record<string, unknown>;
  },
): Promise<{ status: "processed" | "duplicate" | "blocked"; reconciliation: ProviderEventReconciliationPlan }> {
  const reconciliation = buildProviderEventReconciliationPlan({
    provider: "expo",
    eventId: input.receipt.receiptId,
    eventType: input.receipt.errorCode ?? input.receipt.receiptStatus,
    providerMessageId: input.receipt.deliveryId,
  });

  if (input.receipt.status === "blocked" || reconciliation.blockers.length > 0) {
    return { status: "blocked", reconciliation };
  }

  const claim = await repository.claimReceiptIdempotency({
    tenantId: input.tenantId,
    receiptId: input.receipt.receiptId,
    requestId: input.receipt.idempotencyKey,
  });
  if (claim === "duplicate") {
    return { status: "duplicate", reconciliation };
  }

  await repository.persistProviderEvent({
    tenantId: input.tenantId,
    reconciliation,
    redactedPayload: buildRedactedExpoPushPayload(input.redactedPayload),
  });
  if (reconciliation.shouldMarkPushTokenInactive) {
    await repository.suppressInvalidToken({
      tenantId: input.tenantId,
      tokenHash: input.receipt.deliveryId,
      receiptId: input.receipt.receiptId,
    });
  }
  await repository.persistAuditLog({
    tenantId: input.tenantId,
    action: "expo_push_receipt_processed",
    redactedMetadata: {
      receiptIdHash: buildMobilePushSelectorHash("expo-receipt-audit", [input.receipt.receiptId]),
      rawReceiptIdStored: false,
      status: input.receipt.receiptStatus,
      errorCode: input.receipt.errorCode ?? null,
    },
  });

  return { status: "processed", reconciliation };
}

export const expoPushProviderContract = buildExpoPushProviderContract();

const mobilePushRegistrationPreview = buildMobilePushRegistrationPlan({
  tenantId: inkrouteDemoTenant.id,
  userId: "user_mara_demo",
  deviceId: "device_mobile_demo",
  requestId: "push_registration_demo",
  permissionStatus: "granted",
  expoPushToken: mobileNotificationConsent.pushToken,
  pushOptIn: mobileNotificationConsent.pushOptIn,
  registeredAt: "2026-06-09T00:00:00.000Z",
});

export const mobilePushContractPreview: MobilePushContractPreview = {
  localContract: buildMobilePushLocalContract({
    permissionRuntimeImplemented: true,
    tokenRegistrationRuntimeImplemented: true,
    optOutPersistenceContract: true,
    receiptIdempotencyContract: true,
    invalidTokenSuppressionContract: true,
    safeTapRoutingContract: true,
    auditLogContract: true,
    expoCredentialsConfigured: false,
    foregroundBackgroundDeviceQaPassed: false,
  }),
  registration: mobilePushRegistrationPreview,
  registrationReceipt: buildMobilePushRegistrationReceipt(mobilePushRegistrationPreview),
  delivery: buildMobilePushDeliveryContract({
    tenantId: inkrouteDemoTenant.id,
    notificationId: "notification_mobile_demo",
    templateKey: "appointment_prep_24h",
    context: {
      artistName: "Mara Vale",
      clientName: "Ari",
      appointmentDate: "Jul 11, 2026",
    },
    consent: mobileNotificationConsent,
    requestId: "push_delivery_demo",
    deepLinkPath: "/bookings/booking_req_1001",
  }),
  receipt: expoPushProviderContract.invalidTokenReceipt,
  tap: buildMobilePushTapContract({
    tenantId: inkrouteDemoTenant.id,
    notificationId: "notification_mobile_demo",
    userId: "user_mara_demo",
    deepLinkPath: "/bookings/booking_req_1001",
    pushOptIn: mobileNotificationConsent.pushOptIn,
    requestId: "push_tap_demo",
  }),
  provider: expoPushProviderContract,
  boundary:
    "Mobile push now has a package-backed local contract for registration, opt-out, receipt idempotency, invalid-token suppression, audit logging, delivery, and safe tap-routing; Expo credentials, delivery worker proof, and foreground/background device proof remain runtime-gated.",
};
