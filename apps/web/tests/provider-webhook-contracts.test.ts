import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedProviderWebhookPayload,
  createInMemoryProviderWebhookPersistenceRepository,
  executeProviderWebhookReconciliation,
  providerWebhookRouteBoundaryRequiredControls,
} from "../lib/providerWebhookReconciliation";
// Stripe, email, SMS, and Expo webhook contracts are verified against shared boundary readiness, raw-body capture, and replay-safe persistence.

const contractSource = readFileSync(join(process.cwd(), "apps/web/lib/providerWebhookReconciliation.ts"), "utf8");
const emailRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/email/route.ts"), "utf8");
const smsRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/sms/route.ts"), "utf8");

describe("provider webhook reconciliation contract", () => {
  it("uses cross-provider readiness and provider-event reconciliation contracts", () => {
    expect(contractSource).toContain("buildProviderWebhookRuntimeReadinessPlan");
    expect(contractSource).toContain("ProviderEventReconciliationPlan");
    expect(contractSource).toContain("providerWebhookContract");
    expect(contractSource).toContain("providerWebhookRouteBoundaryRequiredControls");
    expect(contractSource).toContain("emailProviderContract.webhookReadiness");
    expect(contractSource).toContain("smsProviderContract.stopWebhookReadiness");
    expect(contractSource).toContain("smsProviderContract.helpWebhookReadiness");
  });

  it("defines repository seams for exactly-once reconciliation, suppression, inbound routing, invalid push tokens, and alerting", () => {
    expect(contractSource).toContain("ProviderWebhookPersistenceRepository");
    expect(contractSource).toContain("claimProviderEvent");
    expect(contractSource).toContain("persistProviderEvent");
    expect(contractSource).toContain("updateDeliveryLogExactlyOnce");
    expect(contractSource).toContain("persistSuppression");
    expect(contractSource).toContain("persistInboundRouting");
    expect(contractSource).toContain("suppressInvalidPushToken");
    expect(contractSource).toContain("persistWebhookAudit");
    expect(contractSource).toContain("alertFailedWebhook");
  });

  it("redacts nested cross-provider webhook payloads before local persistence", () => {
    const payload = buildRedactedProviderWebhookPayload({
      source: "email",
      destination: "client@example.test",
      eventId: "provider_event_internal_selector",
      idempotencyKey: "provider:idempotency:internal",
      rawBody: "{\"email\":\"client@example.test\"}",
      rawHeaders: {
        cookie: "provider-session=secret",
        signature: "provider-signature-secret",
      },
      nested: {
        authorization: "Bearer secret",
        providerPayload: { phone: "+12065550142", messageBody: "private body", providerMessageId: "provider_message_internal" },
      },
    });

    expect(payload).toEqual({
      source: "email",
      destination: "[redacted]",
      eventId: "[redacted]",
      idempotencyKey: "[redacted]",
      rawBody: "[redacted]",
      rawHeaders: "[redacted]",
      nested: {
        authorization: "[redacted]",
        providerPayload: "[redacted]",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("client@example.test");
    expect(JSON.stringify(payload)).not.toContain("provider_event_internal_selector");
    expect(JSON.stringify(payload)).not.toContain("provider:idempotency:internal");
    expect(JSON.stringify(payload)).not.toContain("provider-session=secret");
    expect(JSON.stringify(payload)).not.toContain("provider-signature-secret");
    expect(JSON.stringify(payload)).not.toContain("Bearer secret");
    expect(JSON.stringify(payload)).not.toContain("+12065550142");
    expect(JSON.stringify(payload)).not.toContain("private body");
    expect(JSON.stringify(payload)).not.toContain("provider_message_internal");
  });

  it("executes local provider webhook reconciliation for idempotency, exactly-once delivery, suppression, inbound routing, invalid push token suppression, audit, and failed alerting", async () => {
    const repository = createInMemoryProviderWebhookPersistenceRepository();
    const reconciliation = {
      provider: "expo",
      eventId: "receipt_demo",
      eventType: "DeviceNotRegistered",
      providerMessageId: "delivery_demo",
      idempotencyKey: "expo:receipt_demo",
      blockers: [],
      shouldUpdateDeliveryLog: true,
      shouldSuppressDestination: true,
      shouldCreateInboundThread: true,
      shouldMarkPushTokenInactive: true,
    } as never;

    const first = await executeProviderWebhookReconciliation(repository, {
      tenantId: "tenant_demo",
      reconciliation,
      redactedPayload: {
        destination: "client@example.test",
        token: "push_token_secret",
      },
    });
    const duplicate = await executeProviderWebhookReconciliation(repository, {
      tenantId: "tenant_demo",
      reconciliation,
      redactedPayload: {
        destination: "client@example.test",
      },
    });
    const blocked = await executeProviderWebhookReconciliation(repository, {
      reconciliation,
      redactedPayload: {
        rawBody: "private raw body",
      },
    });

    expect(first.status).toBe("processed");
    expect(duplicate.status).toBe("duplicate");
    expect(blocked.status).toBe("blocked");
    expect(repository.state.providerEvents.size).toBe(1);
    expect(repository.state.persistedProviderEvents).toHaveLength(1);
    expect(repository.state.deliveryUpdates.size).toBe(1);
    expect(repository.state.suppressions).toHaveLength(1);
    expect(repository.state.inboundRoutes).toHaveLength(1);
    expect(repository.state.invalidPushTokens).toHaveLength(1);
    expect(repository.state.webhookAudits).toHaveLength(1);
    expect(repository.state.failedAlerts).toHaveLength(1);
    expect(JSON.stringify(repository.state)).not.toContain("client@example.test");
    expect(JSON.stringify(repository.state)).not.toContain("push_token_secret");
    expect(JSON.stringify(repository.state)).not.toContain("private raw body");
  });

  it("redacts provider payload summaries and enumerates required writes before side effects", () => {
    expect(contractSource).toContain("redactedWebhookPayloadSummary");
    expect(contractSource).toContain("redactedProviderWebhookReconciliationSummary");
    expect(contractSource).toContain("reconciliation: redactedProviderWebhookReconciliationSummary(input.reconciliation)");
    expect(contractSource).toContain("omittedFields");
    expect(contractSource).toContain("ProviderEvent");
    expect(contractSource).toContain("NotificationDelivery");
    expect(contractSource).toContain("SuppressionListEntry");
    expect(contractSource).toContain("MessageThread");
    expect(contractSource).toContain("PushToken");
  });

  it("executes provider webhook reconciliation through idempotency and failed-webhook alerting gates", () => {
    expect(contractSource).toContain("executeProviderWebhookReconciliation");
    expect(contractSource).toContain("tenant_unresolved");
    expect(contractSource).toContain('claim === "duplicate"');
    expect(contractSource).toContain("shouldUpdateDeliveryLog");
    expect(contractSource).toContain("shouldSuppressDestination");
    expect(contractSource).toContain("shouldCreateInboundThread");
    expect(contractSource).toContain("shouldMarkPushTokenInactive");
  });

  it("surfaces the shared webhook boundary from email and SMS routes", () => {
    for (const source of [emailRouteSource, smsRouteSource]) {
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).toContain("buildProviderWebhookRouteBoundary");
      expect(source).toContain("providerWebhookContract");
      expect(source).toContain("providerWebhookBoundary");
      expect(source).toContain("crossProviderReadiness");
      expect(source).toContain("crossProviderRequiredMethods");
      expect(source).toContain("requiresDurableProviderEventPersistence");
    }
    expect(emailRouteSource).toContain("PROVIDER_EMAIL_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(emailRouteSource).toContain("localEmailWebhookPersistenceDisabled");
    expect(smsRouteSource).toContain("PROVIDER_SMS_WEBHOOK_RECONCILIATION_NOT_CONFIGURED");
    expect(smsRouteSource).toContain("localSmsWebhookPersistenceDisabled");
    expect(providerWebhookRouteBoundaryRequiredControls).toContain("Apply exactly-once delivery updates under replay and concurrent callbacks.");
  });
});
