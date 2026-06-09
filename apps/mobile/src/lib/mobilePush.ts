import {
  buildExpoPushDeliveryPlan,
  buildExpoPushReceiptProcessingPlan,
  buildExpoPushRegistrationPlan,
  buildExpoPushTapRoutingPlan,
  type ClientConsentSnapshot,
  type ExpoPushDeliveryPlan,
  type ExpoPushReceiptProcessingPlan,
  type ExpoPushRegistrationPlan,
  type ExpoPushTapRoutingPlan,
  type NotificationTemplateContext,
  type NotificationTemplateKey,
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

export interface MobilePushContractPreview {
  registration: ExpoPushRegistrationPlan;
  delivery: ExpoPushDeliveryPlan;
  receipt: ExpoPushReceiptProcessingPlan;
  tap: ExpoPushTapRoutingPlan;
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

export async function persistMobilePushContracts(
  adapter: MobilePushPersistenceAdapter,
  preview: MobilePushContractPreview,
): Promise<void> {
  await adapter.persistRegistration(preview.registration);
  if (preview.delivery.status === "ready") await adapter.persistDelivery(preview.delivery);
  if (preview.receipt.status === "ready") await adapter.persistReceipt(preview.receipt);
  if (preview.tap.status === "ready") await adapter.persistTap(preview.tap);
}

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
  receipt: buildMobilePushReceiptContract({
    tenantId: inkrouteDemoTenant.id,
    deliveryId: "delivery_mobile_demo",
    receiptId: "receipt_mobile_demo",
    receiptStatus: "error",
    requestId: "push_receipt_demo",
    errorCode: "DeviceNotRegistered",
    errorMessage: "Expo token is no longer registered.",
  }),
  tap: buildMobilePushTapContract({
    tenantId: inkrouteDemoTenant.id,
    notificationId: "notification_mobile_demo",
    userId: "user_mara_demo",
    deepLinkPath: "/bookings/booking_req_1001",
    pushOptIn: mobileNotificationConsent.pushOptIn,
    requestId: "push_tap_demo",
  }),
  boundary:
    "Mobile push now has app-side registration, delivery, receipt, opt-out, and safe tap-routing contracts; Expo credentials and foreground/background device proof remain runtime-gated.",
};
