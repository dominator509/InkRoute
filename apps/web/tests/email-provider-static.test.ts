import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildEmailProviderReconciliation,
  buildEmailWebhookReadinessFromPayload,
  emailProviderContract,
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
    expect(routeSource).toContain("emailProviderContract");
    expect(routeSource).toContain("productionBoundary");
    expect(routeSource).toContain("requiredWrites");
  });
});
