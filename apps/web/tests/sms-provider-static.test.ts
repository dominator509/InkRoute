import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildSmsProviderReconciliation,
  buildSmsWebhookReadinessFromPayload,
  smsProviderContract,
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
    expect(routeSource).toContain("buildSmsProviderReconciliation");
    expect(routeSource).toContain("smsProviderContract");
    expect(routeSource).toContain("requiredWrites");
  });
});
