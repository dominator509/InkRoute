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

export interface InMemoryExpoPushProviderRepositoryState {
  readonly pushTokens: ExpoPushRegistrationPlan[];
  readonly optOuts: { readonly tenantId: string; readonly userId: string; readonly deviceId: string; readonly optedOut: boolean }[];
  readonly receiptIdempotencyKeys: Map<string, { readonly tenantId: string; readonly requestId: string }>;
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
  delivery: ExpoPushDeliveryPlan;
  receipt: ExpoPushReceiptProcessingPlan;
  tap: ExpoPushTapRoutingPlan;
  localContract: ReturnType<typeof buildMobilePushLocalContract>;
  provider: ExpoPushProviderContract;
  boundary: string;
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
  return `${input.tenantId}:${input.receiptId}`;
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
        state.receiptIdempotencyKeys.set(key, { tenantId: input.tenantId, requestId: input.requestId });
        return "claimed";
      }

      if (existing.requestId === input.requestId) {
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
      pushTokenPersistenceAvailable: false,
      optOutPersistenceAvailable: false,
      deliveryWorkerConfigured: false,
      deliveryLogPersistenceAvailable: false,
      auditLogPersistenceAvailable: false,
      expoSendSmokePassed: false,
      receiptWorkerConfigured: false,
      receiptReplayProtectionAvailable: true,
      invalidTokenSuppressionPersistenceAvailable: false,
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
    redactedMetadata: { receiptId: input.receipt.receiptId, status: input.receipt.receiptStatus, errorCode: input.receipt.errorCode ?? null },
  });

  return { status: "processed", reconciliation };
}

export const expoPushProviderContract = buildExpoPushProviderContract();

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
  registration: buildMobilePushRegistrationPlan({
    tenantId: inkrouteDemoTenant.id,
    userId: "user_mara_demo",
    deviceId: "device_mobile_demo",
    requestId: "push_registration_demo",
    permissionStatus: "granted",
    expoPushToken: mobileNotificationConsent.pushToken,
    pushOptIn: mobileNotificationConsent.pushOptIn,
    registeredAt: "2026-06-09T00:00:00.000Z",
  }),
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
