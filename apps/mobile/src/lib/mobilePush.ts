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
  provider: ExpoPushProviderContract;
  boundary: string;
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

  await repository.persistProviderEvent({ tenantId: input.tenantId, reconciliation, redactedPayload: input.redactedPayload });
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
    "Mobile push now has app-side registration, provider runtime readiness, delivery, receipt idempotency, invalid-token suppression, opt-out, and safe tap-routing contracts; Expo credentials and foreground/background device proof remain runtime-gated.",
};
