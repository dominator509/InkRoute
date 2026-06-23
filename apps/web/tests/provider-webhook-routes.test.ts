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
          data: { email_id: "email_msg_001", email: "client@example.test" },
        }),
      }),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        interpretation: { provider: string; eventType: string; normalizedStatus: string; requiresSignatureVerification: boolean };
        durablePersistence: string;
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
    expect(payload.data.durablePersistence).toMatch(/database-|duplicate-provider-event/);
    expect(payload.data.productionBoundary.gapIds).toEqual(["GAP-061", "GAP-064", "GAP-066"]);
    expect(payload.data.productionBoundary.requiredBeforeEnablement.join(" ")).toContain("suppression");
  });

  it("fail-closes production email webhooks before parsing or local runtime persistence when the webhook secret is missing", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await receiveEmailWebhook(
        new NextRequest("https://local.test/api/webhooks/email", {
          method: "POST",
          headers: { "svix-signature": "sig_test" },
          body: JSON.stringify({
            type: "email.bounced",
            tenantSlug: "inkroute-demo",
            id: "evt_email_prod_blocked",
          }),
        }),
      );
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string };
        productionBoundary: {
          localEmailWebhookPersistenceDisabled: boolean;
          requiresCryptographicSignatureSecret: boolean;
          durablePersistence: string;
        };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("EMAIL_PROVIDER_WEBHOOK_SECRET_NOT_CONFIGURED");
      expect(payload.productionBoundary.localEmailWebhookPersistenceDisabled).toBe(true);
      expect(payload.productionBoundary.requiresCryptographicSignatureSecret).toBe(true);
      expect(payload.productionBoundary.durablePersistence).toBe("not-attempted-production-secret-gated");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
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
          From: "+15555550199",
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
      data: { durablePersistence: string; interpretation: { requiresInboundMessageHandling: boolean; shouldUpdateDeliveryLog: boolean; notes: string[] }; inboundBodyProvided: boolean };
    };
    const helpPayload = (await help.json()) as {
      data: { interpretation: { requiresInboundMessageHandling: boolean; shouldUpdateDeliveryLog: boolean; notes: string[] }; inboundBodyProvided: boolean };
    };

    expect(stop.status).toBe(200);
    expect(stopPayload.data.durablePersistence).toMatch(/database-|duplicate-provider-event/);
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

  it("fail-closes production SMS webhooks before parsing or local runtime persistence when the auth token is missing", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const response = await receiveSmsWebhook(
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
      const payload = (await response.json()) as {
        ok: boolean;
        error: { code: string };
        productionBoundary: {
          localSmsWebhookPersistenceDisabled: boolean;
          requiresCryptographicSignatureSecret: boolean;
          durablePersistence: string;
        };
      };

      expect(response.status).toBe(503);
      expect(payload.ok).toBe(false);
      expect(payload.error.code).toBe("SMS_PROVIDER_WEBHOOK_AUTH_TOKEN_NOT_CONFIGURED");
      expect(payload.productionBoundary.localSmsWebhookPersistenceDisabled).toBe(true);
      expect(payload.productionBoundary.requiresCryptographicSignatureSecret).toBe(true);
      expect(payload.productionBoundary.durablePersistence).toBe("not-attempted-production-secret-gated");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});
