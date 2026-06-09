import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe webhook route static contract", () => {
  const webhookSource = readWorkspaceFile("apps/web/lib/stripeWebhook.ts");
  const routeSource = readWorkspaceFile("apps/web/app/api/webhooks/stripe/route.ts");

  it("wraps package reconciliation and runtime readiness helpers", () => {
    expect(webhookSource).toContain("buildStripeWebhookReconciliationPlan");
    expect(webhookSource).toContain("buildStripeWebhookRuntimeReadinessPlan");
    expect(webhookSource).toContain("buildStripeWebhookRouteContract");
  });

  it("defines replay and reconciliation adapter seams", () => {
    expect(webhookSource).toContain("StripeWebhookReplayStore");
    expect(webhookSource).toContain("hasProcessed");
    expect(webhookSource).toContain("persistProcessedEvent");
    expect(webhookSource).toContain("StripeWebhookReconciliationAdapter");
    expect(webhookSource).toContain("persistPaymentAuditLog");
  });

  it("persists audit logs, replay ids, and transaction reconciliation in order", () => {
    expect(webhookSource.indexOf("persistPaymentAuditLog")).toBeLessThan(webhookSource.indexOf("persistProcessedEvent"));
    expect(webhookSource.indexOf("persistProcessedEvent")).toBeLessThan(webhookSource.indexOf("adapter.reconcile"));
    expect(webhookSource).toContain("shouldRunTransaction");
  });

  it("keeps Stripe SDK and CLI proof gated", () => {
    expect(webhookSource).toContain("stripeSdkInstalled: false");
    expect(webhookSource).toContain("constructEventUsesRawBody: false");
    expect(webhookSource).toContain("stripeCliReplayVerified: false");
  });

  it("surfaces webhook reconciliation contract from the route", () => {
    expect(routeSource).toContain("buildStripeWebhookRouteContract");
    expect(routeSource).toContain("webhookContract");
    expect(routeSource).toContain("reconciliation");
    expect(routeSource).toContain("runtimeReadiness");
  });
});
