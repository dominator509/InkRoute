import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";

import {
  buildEmailProviderReconciliation,
  buildEmailWebhookReadinessFromPayload,
  buildRedactedEmailWebhookPayload,
  createInMemoryEmailProviderRepository,
  emailProviderContract,
  executeEmailProviderSend,
  sampleEmailConsent,
  sampleEmailContext,
  sanitizeEmailProviderSendResult,
  verifyEmailWebhookSignature,
} from "../lib/emailProvider";

const repoRoot = resolve(__dirname, "../../..");

describe("email provider contract", () => {
  it("requires Resend send controls for domain verification, suppression, idempotency, delivery logs, and redaction", () => {
    expect(emailProviderContract.sendPlan.provider).toBe("resend");
    expect(emailProviderContract.sendPlan.requiredWrites).toContain("NotificationDelivery");
    expect(emailProviderContract.sendPlan.requiredWrites).toContain("ProviderEvent");
    expect(emailProviderContract.sendPlan.requiredWrites).toContain("SuppressionCheck");
    expect(emailProviderContract.sendPlan.requiredControls.join("\n")).toContain("Check bounce, complaint, unsubscribe");
    expect(emailProviderContract.sendPlan.blockers).toContain("Email provider API key must be configured in a secret store before sending.");
    expect(emailProviderContract.sendPlan.blockers).toContain("Email sender domain must be verified before sending.");
  });

  it("requires repository hooks for provider sends and webhook reconciliation", () => {
    expect(emailProviderContract.requiredRepositoryMethods).toEqual([
      "assertTenantEmailDeliveryAllowed",
      "isDestinationSuppressed",
      "claimIdempotencyKey",
      "persistQueuedDelivery",
      "persistProviderSendResult",
      "persistWebhookReconciliation",
    ]);
  });

  it("sanitizes nested email provider send and webhook payloads before persistence", () => {
    const sendResult = sanitizeEmailProviderSendResult({
      providerMessageId: "resend_message_demo",
      redactedPayload: {
        status: "queued",
        apiKey: "re_secret",
        recipientEmail: "client@example.test",
        nested: { signature: "svix_secret", clientName: "Riley" },
      },
    });
    const webhookPayload = buildRedactedEmailWebhookPayload({
      event: "email.bounced",
      rawBody: "{\"email\":\"client@example.test\"}",
      destination: "client@example.test",
      nested: { authorization: "Bearer secret" },
    });

    expect(sendResult?.redactedPayload).toEqual({
      status: "queued",
      apiKey: "[redacted]",
      recipientEmail: "[redacted]",
      nested: { signature: "[redacted]", clientName: "[redacted]" },
    });
    expect(sendResult?.providerMessageId).toBe("[redacted-provider-message-id]");
    expect(sendResult?.providerMessageIdHash).toHaveLength(64);
    expect(sendResult?.rawProviderMessageIdEchoed).toBe(false);
    expect(JSON.stringify(sendResult)).not.toContain("resend_message_demo");
    expect(JSON.stringify(sendResult)).not.toContain("re_secret");
    expect(JSON.stringify(sendResult)).not.toContain("client@example.test");
    expect(JSON.stringify(webhookPayload)).not.toContain("Bearer secret");
  });

  it("executes a local email provider repository contract for authorization, suppression, idempotency, queueing, and redacted provider results", async () => {
    const repository = createInMemoryEmailProviderRepository();
    repository.state.allowedDeliveryKeys.add("tenant_demo:notification_demo:delivery_demo");

    const input = {
      tenantId: "tenant_demo",
      notificationId: "notification_demo",
      deliveryId: "delivery_demo",
      templateKey: "booking_request_received" as const,
      context: sampleEmailContext,
      consent: sampleEmailConsent,
      requestId: "request_demo",
      providerRequestId: "provider-request-1",
      providerSdkInstalled: true,
      providerApiKeyConfigured: true,
      senderDomainVerified: true,
      unsubscribeFooterPresent: true,
      deliveryLogPersistenceAvailable: true,
    };

    const first = await executeEmailProviderSend(input, repository, async () => ({
      providerMessageId: "resend_message_demo",
      redactedPayload: { status: "queued", recipientEmail: "riley@example.test" },
    }));
    const duplicate = await executeEmailProviderSend(input, repository);

    expect(first.status).toBe("ready");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.queuedDeliveries).toHaveLength(1);
    expect(repository.state.providerSendResults).toHaveLength(1);
    expect(JSON.stringify(repository.state.providerSendResults[0])).not.toContain("resend_message_demo");
    expect(repository.state.providerSendResults[0]?.result.rawProviderMessageIdEchoed).toBe(false);
    expect(JSON.stringify(repository.state.providerSendResults[0])).not.toContain("riley@example.test");

    await expect(
      executeEmailProviderSend(
        {
          ...input,
          tenantId: "other_tenant",
          providerRequestId: "provider-request-2",
        },
        repository,
      ),
    ).rejects.toThrow("EMAIL_PROVIDER_DELIVERY_ACCESS_DENIED");
  });

  it("blocks local email sends when the destination is suppressed", async () => {
    const repository = createInMemoryEmailProviderRepository();
    repository.state.allowedDeliveryKeys.add("tenant_demo:notification_demo:delivery_demo");
    repository.state.suppressedDestinationHashes.add("tenant_demo:riley@example.test");

    const result = await executeEmailProviderSend(
      {
        tenantId: "tenant_demo",
        notificationId: "notification_demo",
        deliveryId: "delivery_demo",
        templateKey: "booking_request_received",
        context: sampleEmailContext,
        consent: sampleEmailConsent,
        requestId: "request_demo",
        providerRequestId: "provider-request-3",
        providerSdkInstalled: true,
        providerApiKeyConfigured: true,
        senderDomainVerified: true,
        unsubscribeFooterPresent: true,
        deliveryLogPersistenceAvailable: true,
      },
      repository,
    );

    expect(result.status).toBe("blocked");
    expect(repository.state.queuedDeliveries).toHaveLength(0);
  });

  it("blocks webhook reconciliation without cryptographic verification and durable stores", () => {
    const readiness = buildEmailWebhookReadinessFromPayload({
      tenantId: "tenant_demo",
      eventId: "evt_demo",
      eventType: "email.bounced",
      providerMessageId: "resend_message_demo",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.requiredWrites).toContain("SuppressionListEntry");
    expect(readiness.blockers).toContain("Resend/Svix webhook verifier must be configured before trusting webhook payloads.");
    expect(readiness.blockers).toContain("Email webhook secret must be configured in a secret store.");
    expect(readiness.blockers).toContain("NotificationDelivery persistence must be available before webhook reconciliation.");
  });

  it("verifies Resend/Svix webhook signatures from raw bodies without trusting header presence alone", () => {
    const rawBody = "{\"type\":\"email.delivered\"}";
    const svixId = "msg_demo";
    const svixTimestamp = "1780000000";
    const secret = Buffer.from("email-webhook-secret").toString("base64");
    const signature = createHmac("sha256", Buffer.from(secret, "base64"))
      .update(`${svixId}.${svixTimestamp}.${rawBody}`)
      .digest("base64");

    const verified = verifyEmailWebhookSignature({
      rawBody,
      signatureHeader: `v1,${signature}`,
      svixId,
      svixTimestamp,
      secret: `whsec_${secret}`,
      nowMs: 1780000000 * 1000,
    });
    const mismatched = verifyEmailWebhookSignature({
      rawBody,
      signatureHeader: "v1,invalid",
      svixId,
      svixTimestamp,
      secret: `whsec_${secret}`,
      nowMs: 1780000000 * 1000,
    });

    expect(verified).toMatchObject({
      verifierConfigured: true,
      webhookSecretConfigured: true,
      timestampWithinTolerance: true,
      verified: true,
      reason: "verified",
    });
    expect(mismatched).toMatchObject({
      verified: false,
      reason: "signature-mismatch",
    });
  });

  it("normalizes bounce/complaint/unsubscribe events into suppression reconciliation", () => {
    const reconciliation = buildEmailProviderReconciliation({
      eventId: "evt_demo",
      eventType: "email.complained",
      providerMessageId: "resend_message_demo",
    });

    expect(reconciliation.provider).toBe("resend");
    expect(reconciliation.shouldSuppressDestination).toBe(true);
    expect(reconciliation.requiredChecks.join("\n")).toContain("Persist provider event id for replay protection");
  });

  it("wires the email webhook route through the provider readiness boundary", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/web/app/api/webhooks/email/route.ts"), "utf8");

    expect(routeSource).toContain("buildEmailWebhookReadinessFromPayload");
    expect(routeSource).toContain("verifyEmailWebhookSignature");
    expect(routeSource).toContain("INVALID_EMAIL_PROVIDER_SIGNATURE");
    expect(routeSource).toContain("emailProviderContract");
    expect(routeSource).toContain("productionBoundary");
    expect(routeSource).toContain("PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeSource).toContain("localEmailWebhookPersistenceDisabled");
    expect(routeSource).toContain("requiresDurableProviderEventPersistence");
    expect(routeSource).toContain("requiredWrites");
  });
});
