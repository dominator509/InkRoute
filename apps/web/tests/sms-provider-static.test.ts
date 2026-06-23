import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { resolve } from "node:path";

import {
  buildSmsProviderReconciliation,
  buildSmsWebhookReadinessFromPayload,
  buildRedactedSmsWebhookPayload,
  createInMemorySmsProviderRepository,
  executeSmsProviderSend,
  sampleSmsConsent,
  sampleSmsContext,
  sanitizeSmsProviderSendResult,
  smsProviderContract,
  verifySmsWebhookSignature,
} from "../lib/smsProvider";

const repoRoot = resolve(__dirname, "../../..");

describe("sms provider contract", () => {
  it("requires Twilio send controls for credentials, consent proof, quiet hours, suppression, idempotency, and redaction", () => {
    expect(smsProviderContract.sendPlan.provider).toBe("twilio");
    expect(smsProviderContract.sendPlan.requiredWrites).toContain("NotificationDelivery");
    expect(smsProviderContract.sendPlan.requiredWrites).toContain("ProviderEvent");
    expect(smsProviderContract.sendPlan.requiredWrites).toContain("ConsentSnapshot");
    expect(smsProviderContract.sendPlan.requiredControls.join("\n")).toContain("Check STOP, unsubscribe, consent proof");
    expect(smsProviderContract.sendPlan.blockers).toContain("SMS provider SDK must be installed before sending.");
    expect(smsProviderContract.sendPlan.blockers).toContain("Twilio auth token must be configured in a secret store before sending.");
    expect(smsProviderContract.sendPlan.blockers).toContain("SMS consent and compliance copy must be legal-approved before sending.");
  });

  it("requires repository hooks for SMS provider sends, STOP/HELP reconciliation, and inbound thread persistence", () => {
    expect(smsProviderContract.requiredRepositoryMethods).toEqual([
      "assertTenantSmsDeliveryAllowed",
      "hasStoredConsentProof",
      "isDestinationSuppressed",
      "claimIdempotencyKey",
      "persistQueuedDelivery",
      "persistProviderSendResult",
      "persistWebhookReconciliation",
      "persistInboundThread",
    ]);
  });

  it("sanitizes nested SMS provider send and webhook payloads before persistence", () => {
    const sendResult = sanitizeSmsProviderSendResult({
      providerMessageId: "SMdemo",
      redactedPayload: {
        status: "queued",
        accountSid: "ACsecret",
        to: "+12065550142",
        nested: { body: "private sms body", signature: "twilio_signature" },
      },
    });
    const webhookPayload = buildRedactedSmsWebhookPayload({
      event: "inbound",
      rawBody: "From=%2B12065550142&Body=HELP",
      from: "+12065550142",
      nested: { authorization: "Bearer secret" },
    });

    expect(sendResult?.redactedPayload).toEqual({
      status: "queued",
      accountSid: "[redacted]",
      to: "[redacted]",
      nested: { body: "[redacted]", signature: "[redacted]" },
    });
    expect(JSON.stringify(sendResult)).not.toContain("ACsecret");
    expect(JSON.stringify(sendResult)).not.toContain("+12065550142");
    expect(JSON.stringify(sendResult)).not.toContain("private sms body");
    expect(JSON.stringify(webhookPayload)).not.toContain("Bearer secret");
  });

  it("executes a local SMS provider repository contract for authorization, consent proof, idempotency, queueing, and redacted provider results", async () => {
    const repository = createInMemorySmsProviderRepository();
    repository.state.allowedDeliveryKeys.add("tenant_demo:notification_demo:delivery_sms_demo");
    repository.state.consentProofDestinationHashes.add("tenant_demo:+12065550142");

    const input = {
      tenantId: "tenant_demo",
      notificationId: "notification_demo",
      deliveryId: "delivery_sms_demo",
      templateKey: "appointment_confirmed" as const,
      context: sampleSmsContext,
      consent: sampleSmsConsent,
      requestId: "request_sms_demo",
      providerRequestId: "provider-request-1",
      providerSdkInstalled: true,
      accountSidConfigured: true,
      authTokenConfigured: true,
      messagingServiceConfigured: true,
      legalConsentCopyApproved: true,
      consentProofAvailable: true,
      quietHoursPolicyConfigured: true,
      deliveryLogPersistenceAvailable: true,
    };

    const first = await executeSmsProviderSend(input, repository, async () => ({
      providerMessageId: "SMdemo",
      redactedPayload: { status: "queued", to: "+12065550142", body: "private sms body" },
    }));
    const duplicate = await executeSmsProviderSend(input, repository);

    expect(first.status).toBe("ready");
    expect(duplicate.status).toBe("duplicate");
    expect(repository.state.queuedDeliveries).toHaveLength(1);
    expect(repository.state.providerSendResults).toHaveLength(1);
    expect(JSON.stringify(repository.state.providerSendResults[0])).not.toContain("+12065550142");
    expect(JSON.stringify(repository.state.providerSendResults[0])).not.toContain("private sms body");

    await expect(
      executeSmsProviderSend(
        {
          ...input,
          tenantId: "other_tenant",
          providerRequestId: "provider-request-2",
        },
        repository,
      ),
    ).rejects.toThrow("SMS_PROVIDER_DELIVERY_ACCESS_DENIED");
  });

  it("blocks local SMS sends when consent proof is missing or destination is suppressed", async () => {
    const repository = createInMemorySmsProviderRepository();
    repository.state.allowedDeliveryKeys.add("tenant_demo:notification_demo:delivery_sms_demo");
    repository.state.suppressedDestinationHashes.add("tenant_demo:+12065550142");

    const result = await executeSmsProviderSend(
      {
        tenantId: "tenant_demo",
        notificationId: "notification_demo",
        deliveryId: "delivery_sms_demo",
        templateKey: "appointment_confirmed",
        context: sampleSmsContext,
        consent: sampleSmsConsent,
        requestId: "request_sms_demo",
        providerRequestId: "provider-request-3",
        providerSdkInstalled: true,
        accountSidConfigured: true,
        authTokenConfigured: true,
        messagingServiceConfigured: true,
        legalConsentCopyApproved: true,
        consentProofAvailable: true,
        quietHoursPolicyConfigured: true,
        deliveryLogPersistenceAvailable: true,
      },
      repository,
    );

    expect(result.status).toBe("blocked");
    expect(repository.state.queuedDeliveries).toHaveLength(0);
  });

  it("blocks STOP webhook reconciliation without Twilio verification and durable suppression stores", () => {
    const readiness = buildSmsWebhookReadinessFromPayload({
      tenantId: "tenant_demo",
      eventId: "evt_stop_demo",
      eventType: "inbound",
      inboundBody: "STOP",
      rawBodyCaptured: true,
      signatureHeaderPresent: true,
    });

    expect(readiness.status).toBe("blocked");
    expect(readiness.requiredWrites).toContain("SuppressionListEntry");
    expect(readiness.requiredWrites).toContain("ClientNotificationPreference");
    expect(readiness.blockers).toContain("Twilio webhook verifier must be configured before trusting callback payloads.");
    expect(readiness.blockers).toContain("Twilio auth token must be configured in a secret store for webhook verification.");
    expect(readiness.blockers).toContain("ProviderEvent persistence must be available for SMS callback replay protection.");
  });

  it("verifies Twilio webhook signatures from request URL and form body parameters", () => {
    const requestUrl = "https://example.test/api/webhooks/sms";
    const rawBody = "Body=STOP&From=%2B12065550142&MessageSid=SMdemo";
    const authToken = "twilio-auth-token";
    const baseString = `${requestUrl}BodySTOPFrom+12065550142MessageSidSMdemo`;
    const signature = createHmac("sha1", authToken).update(baseString).digest("base64");

    const verified = verifySmsWebhookSignature({
      requestUrl,
      rawBody,
      signatureHeader: signature,
      authToken,
      contentType: "application/x-www-form-urlencoded",
    });
    const mismatched = verifySmsWebhookSignature({
      requestUrl,
      rawBody,
      signatureHeader: "invalid",
      authToken,
      contentType: "application/x-www-form-urlencoded",
    });

    expect(verified).toMatchObject({
      verifierConfigured: true,
      twilioAuthTokenConfigured: true,
      requestUrlValidated: true,
      verified: true,
      reason: "verified",
    });
    expect(mismatched).toMatchObject({
      verified: false,
      reason: "signature-mismatch",
    });
  });

  it("routes HELP and client replies into inbound thread reconciliation instead of suppression", () => {
    const reconciliation = buildSmsProviderReconciliation({
      eventId: "evt_help_demo",
      eventType: "inbound",
      providerMessageId: "SMdemo",
      inboundBody: "HELP",
    });

    expect(reconciliation.provider).toBe("twilio");
    expect(reconciliation.shouldSuppressDestination).toBe(false);
    expect(reconciliation.shouldCreateInboundThread).toBe(true);
    expect(reconciliation.requiredChecks.join("\n")).toContain("Store only redacted destinations and body previews");
  });

  it("wires the SMS webhook route through the provider readiness boundary", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/web/app/api/webhooks/sms/route.ts"), "utf8");

    expect(routeSource).toContain("buildSmsWebhookReadinessFromPayload");
    expect(routeSource).toContain("verifySmsWebhookSignature");
    expect(routeSource).toContain("INVALID_SMS_PROVIDER_SIGNATURE");
    expect(routeSource).toContain("buildSmsProviderReconciliation");
    expect(routeSource).toContain("smsProviderContract");
    expect(routeSource).toContain("PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(routeSource).toContain("localSmsWebhookPersistenceDisabled");
    expect(routeSource).toContain("requiresDurableProviderEventPersistence");
    expect(routeSource).toContain("requiredWrites");
  });
});

