import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as receiveEmailWebhook } from "../app/api/webhooks/email/route";
import { POST as receiveSmsWebhook } from "../app/api/webhooks/sms/route";

describe("provider webhook route boundaries", () => {
  it("rejects email provider webhooks without signature-like headers or valid JSON", async () => {
    const missingSignature = await receiveEmailWebhook(
      new NextRequest("https://local.test/api/webhooks/email", {
        method: "POST",
        body: JSON.stringify({ type: "email.delivered" }),
      }),
    );
    const invalidJson = await receiveEmailWebhook(
      new NextRequest("https://local.test/api/webhooks/email", {
        method: "POST",
        headers: { "resend-signature": "sig_test" },
        body: "{",
      }),
    );

    expect(missingSignature.status).toBe(400);
    await expect(missingSignature.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_EMAIL_PROVIDER_SIGNATURE" },
    });
    expect(invalidJson.status).toBe(400);
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_WEBHOOK_JSON" },
    });
  });

  it("accepts local email webhook events and surfaces bounce suppression boundaries", async () => {
    const response = await receiveEmailWebhook(
      new NextRequest("https://local.test/api/webhooks/email", {
        method: "POST",
        headers: { "svix-signature": "sig_test" },
        body: JSON.stringify({
          type: "email.bounced",
          tenantSlug: "inkroute-demo",
          data: { email_id: "email_msg_001" },
        }),
      }),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        interpretation: { provider: string; eventType: string; normalizedStatus: string; requiresSignatureVerification: boolean };
        productionBoundary: { gapIds: string[]; requiredBeforeEnablement: string[] };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.interpretation).toMatchObject({
      provider: "resend",
      eventType: "email.bounced",
      normalizedStatus: "failed",
      requiresSignatureVerification: true,
    });
    expect(payload.data.productionBoundary.gapIds).toEqual(["GAP-061", "GAP-064", "GAP-066"]);
    expect(payload.data.productionBoundary.requiredBeforeEnablement.join(" ")).toContain("suppression");
  });

  it("rejects SMS webhooks without signature-like headers or valid JSON", async () => {
    const missingSignature = await receiveSmsWebhook(
      new NextRequest("https://local.test/api/webhooks/sms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ MessageStatus: "delivered" }),
      }),
    );
    const invalidJson = await receiveSmsWebhook(
      new NextRequest("https://local.test/api/webhooks/sms", {
        method: "POST",
        headers: { "content-type": "application/json", "x-twilio-signature": "sig_test" },
        body: "{",
      }),
    );

    expect(missingSignature.status).toBe(400);
    await expect(missingSignature.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_SMS_PROVIDER_SIGNATURE" },
    });
    expect(invalidJson.status).toBe(400);
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_WEBHOOK_JSON" },
    });
  });

  it("accepts local SMS STOP and HELP webhook payloads with reconciliation hints", async () => {
    const stop = await receiveSmsWebhook(
      new NextRequest("https://local.test/api/webhooks/sms", {
        method: "POST",
        headers: { "content-type": "application/json", "x-twilio-signature": "sig_test" },
        body: JSON.stringify({
          MessageStatus: "message.received",
          Body: "STOP",
          tenantSlug: "inkroute-demo",
        }),
      }),
    );
    const help = await receiveSmsWebhook(
      new NextRequest("https://local.test/api/webhooks/sms", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": "sig_test" },
        body: new URLSearchParams({
          MessageStatus: "message.received",
          Body: "HELP",
          tenantSlug: "inkroute-demo",
        }),
      }),
    );
    const stopPayload = (await stop.json()) as {
      data: { interpretation: { requiresInboundMessageHandling: boolean; shouldUpdateDeliveryLog: boolean; notes: string[] }; inboundBodyProvided: boolean };
    };
    const helpPayload = (await help.json()) as {
      data: { interpretation: { requiresInboundMessageHandling: boolean; shouldUpdateDeliveryLog: boolean; notes: string[] }; inboundBodyProvided: boolean };
    };

    expect(stop.status).toBe(200);
    expect(stopPayload.data.inboundBodyProvided).toBe(true);
    expect(stopPayload.data.interpretation).toMatchObject({
      requiresInboundMessageHandling: true,
      shouldUpdateDeliveryLog: false,
    });
    expect(stopPayload.data.interpretation.notes.join(" ")).toContain("STOP");

    expect(help.status).toBe(200);
    expect(helpPayload.data.inboundBodyProvided).toBe(true);
    expect(helpPayload.data.interpretation).toMatchObject({
      requiresInboundMessageHandling: true,
      shouldUpdateDeliveryLog: true,
    });
    expect(helpPayload.data.interpretation.notes.join(" ")).toContain("Inbound SMS should create");
  });
});
