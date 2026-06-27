import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedExpoPushPayload,
  createInMemoryExpoPushProviderRepository,
  mobilePushContractPreview,
  processExpoPushReceipt,
} from "../src/lib/mobilePush";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile push static contract", () => {
  const pushSource = readWorkspaceFile("apps/mobile/src/lib/mobilePush.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/NotificationsScreen.tsx");

  it("uses notification package Expo push planning primitives", () => {
    expect(pushSource).toContain("buildExpoPushRegistrationPlan");
    expect(pushSource).toContain("buildMobilePushLocalContract");
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
    expect(pushSource).toContain("PrismaExpoPushProviderRepositoryClient");
    expect(pushSource).toContain("createPrismaExpoPushProviderRepository");
    expect(pushSource).toContain("persistPushToken");
    expect(pushSource).toContain("persistPushOptOut");
    expect(pushSource).toContain("claimReceiptIdempotency");
    expect(pushSource).toContain("suppressInvalidToken");
    expect(pushSource).toContain("persistAuditLog");
    expect(pushSource).toContain("pushToken.upsert");
    expect(pushSource).toContain("notificationInteraction.create");
    expect(pushSource).toContain("notificationSuppression.upsert");
    expect(pushSource).toContain("providerEvent.upsert");
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

  it("redacts nested Expo push provider payloads before persistence", () => {
    const payload = buildRedactedExpoPushPayload({
      status: "error",
      expoPushToken: "ExponentPushToken[secret]",
      nested: {
        accessToken: "expo_access_secret",
        receiptRawPayload: { deviceToken: "native_device_secret" },
      },
    });

    expect(payload).toEqual({
      status: "error",
      expoPushToken: "[redacted]",
      nested: {
        accessToken: "[redacted]",
        receiptRawPayload: "[redacted]",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("ExponentPushToken[secret]");
    expect(JSON.stringify(payload)).not.toContain("expo_access_secret");
    expect(JSON.stringify(payload)).not.toContain("native_device_secret");
  });

  it("executes a local Expo push repository contract for receipt idempotency, invalid-token suppression, tap interaction, opt-out, and audit persistence", async () => {
    const repository = createInMemoryExpoPushProviderRepository();

    await repository.persistPushToken(mobilePushContractPreview.registration);
    await repository.persistPushOptOut({
      tenantId: mobilePushContractPreview.registration.tenantId,
      userId: mobilePushContractPreview.registration.userId,
      deviceId: mobilePushContractPreview.registration.deviceId,
      optedOut: false,
    });
    await repository.persistDelivery(mobilePushContractPreview.delivery);
    await repository.persistTapInteraction(mobilePushContractPreview.tap);

    const first = await processExpoPushReceipt(repository, {
      tenantId: mobilePushContractPreview.receipt.tenantId,
      receipt: mobilePushContractPreview.receipt,
      redactedPayload: {
        status: "error",
        expoPushToken: "ExponentPushToken[secret]",
        nested: { deviceToken: "native_device_secret" },
      },
    });
    const duplicate = await processExpoPushReceipt(repository, {
      tenantId: mobilePushContractPreview.receipt.tenantId,
      receipt: mobilePushContractPreview.receipt,
      redactedPayload: { status: "duplicate" },
    });

    expect(first.status).toBe("processed");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.pushTokens).toHaveLength(1);
    expect(repository.state.optOuts).toHaveLength(1);
    expect(repository.state.deliveries).toHaveLength(1);
    expect(repository.state.providerEvents).toHaveLength(1);
    expect(repository.state.invalidTokenSuppressions).toHaveLength(1);
    expect(repository.state.tapInteractions).toHaveLength(1);
    expect(repository.state.auditLogs).toHaveLength(1);
    expect(JSON.stringify(repository.state.providerEvents[0])).not.toContain("ExponentPushToken[secret]");
    expect(JSON.stringify(repository.state.providerEvents[0])).not.toContain("native_device_secret");
  });

  it("surfaces the push provider contract in the mobile notification screen", () => {
    expect(screenSource).toContain("mobilePushContractPreview");
    expect(screenSource).toContain("mobilePushContractPreview.localContract.localContractReady");
    expect(screenSource).toContain("Push runtime contract");
    expect(screenSource).toContain("invalid token suppression");
    expect(screenSource).toContain("provider ${mobilePushContractPreview.provider.runtimeReadiness.status}");
    expect(screenSource).toContain("tap route");
  });
});
