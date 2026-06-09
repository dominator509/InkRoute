import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const contractSource = readFileSync(join(process.cwd(), "apps/web/lib/providerWebhookReconciliation.ts"), "utf8");
const emailRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/email/route.ts"), "utf8");
const smsRouteSource = readFileSync(join(process.cwd(), "apps/web/app/api/webhooks/sms/route.ts"), "utf8");

describe("provider webhook reconciliation contract", () => {
  it("uses cross-provider readiness and provider-event reconciliation contracts", () => {
    expect(contractSource).toContain("buildProviderWebhookRuntimeReadinessPlan");
    expect(contractSource).toContain("ProviderEventReconciliationPlan");
    expect(contractSource).toContain("providerWebhookContract");
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

  it("redacts provider payload summaries and enumerates required writes before side effects", () => {
    expect(contractSource).toContain("redactedWebhookPayloadSummary");
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
      expect(source).toContain("buildProviderWebhookRouteBoundary");
      expect(source).toContain("providerWebhookContract");
      expect(source).toContain("providerWebhookBoundary");
      expect(source).toContain("crossProviderReadiness");
      expect(source).toContain("crossProviderRequiredMethods");
    }
  });
});
