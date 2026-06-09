import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile push static contract", () => {
  const pushSource = readWorkspaceFile("apps/mobile/src/lib/mobilePush.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/NotificationsScreen.tsx");

  it("uses notification package Expo push planning primitives", () => {
    expect(pushSource).toContain("buildExpoPushRegistrationPlan");
    expect(pushSource).toContain("buildExpoPushDeliveryPlan");
    expect(pushSource).toContain("buildExpoPushReceiptProcessingPlan");
    expect(pushSource).toContain("buildExpoPushTapRoutingPlan");
    expect(pushSource).toContain("buildExpoPushProviderRuntimeReadinessPlan");
  });

  it("keeps token registration tenant/user/device scoped with opt-out gates", () => {
    expect(pushSource).toContain("tenantId: context.tenantId");
    expect(pushSource).toContain("userId: context.userId");
    expect(pushSource).toContain("deviceId: context.deviceId");
    expect(pushSource).toContain("permissionStatus: context.permissionStatus");
    expect(pushSource).toContain("pushOptIn: context.pushOptIn");
  });

  it("requires provider repository hooks for receipts, invalid-token suppression, opt-outs, and audit logs", () => {
    expect(pushSource).toContain("ExpoPushProviderRepository");
    expect(pushSource).toContain("persistPushToken");
    expect(pushSource).toContain("persistPushOptOut");
    expect(pushSource).toContain("claimReceiptIdempotency");
    expect(pushSource).toContain("suppressInvalidToken");
    expect(pushSource).toContain("persistAuditLog");
  });

  it("persists only ready delivery, receipt, and tap plans through an adapter", () => {
    expect(pushSource).toContain("MobilePushPersistenceAdapter");
    expect(pushSource).toContain('preview.delivery.status === "ready"');
    expect(pushSource).toContain('preview.receipt.status === "ready"');
    expect(pushSource).toContain('preview.tap.status === "ready"');
  });

  it("models invalid-token receipt suppression, replay protection, and safe internal tap routing", () => {
    expect(pushSource).toContain("DeviceNotRegistered");
    expect(pushSource).toContain("buildProviderEventReconciliationPlan");
    expect(pushSource).toContain("processExpoPushReceipt");
    expect(pushSource).toContain("shouldMarkPushTokenInactive");
    expect(pushSource).toContain("/bookings/booking_req_1001");
    expect(pushSource).not.toContain("https://");
    expect(pushSource).not.toContain("token=");
  });

  it("surfaces the push provider contract in the mobile notification screen", () => {
    expect(screenSource).toContain("mobilePushContractPreview");
    expect(screenSource).toContain("Push runtime contract");
    expect(screenSource).toContain("invalid token suppression");
    expect(screenSource).toContain("provider ${mobilePushContractPreview.provider.runtimeReadiness.status}");
    expect(screenSource).toContain("tap route");
  });
});
