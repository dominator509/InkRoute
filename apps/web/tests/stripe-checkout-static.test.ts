import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Stripe Checkout route static contract", () => {
  const checkoutSource = readWorkspaceFile("apps/web/lib/stripeCheckout.ts");
  const routeSource = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/deposit-sessions/route.ts");

  it("wraps payment package Checkout readiness gates", () => {
    expect(checkoutSource).toContain("buildStripeCheckoutExecutionReadiness");
    expect(checkoutSource).toContain("buildStripeCheckoutRouteRuntimeReadinessPlan");
    expect(checkoutSource).toContain("buildStripeCheckoutRouteContract");
  });

  it("defines provider and persistence adapter seams before live Stripe calls", () => {
    expect(checkoutSource).toContain("StripeCheckoutProviderAdapter");
    expect(checkoutSource).toContain("createCheckoutSession");
    expect(checkoutSource).toContain("persistIdempotencyKey");
    expect(checkoutSource).toContain("persistProviderSession");
    expect(checkoutSource).toContain("persistPaymentAuditLog");
  });

  it("persists idempotency and audit before provider session creation", () => {
    expect(checkoutSource.indexOf("persistIdempotencyKey")).toBeLessThan(checkoutSource.indexOf("createCheckoutSession"));
    expect(checkoutSource.indexOf('action: "checkout_session_requested"')).toBeLessThan(checkoutSource.indexOf("createCheckoutSession"));
    expect(checkoutSource.indexOf("persistProviderSession")).toBeGreaterThan(checkoutSource.indexOf("createCheckoutSession"));
  });

  it("keeps safe browser response free of secrets and provider payloads", () => {
    expect(checkoutSource).toContain("safeBrowserResponse");
    expect(checkoutSource).toContain("checkoutUrl");
    expect(checkoutSource).toContain("providerSessionId");
    expect(checkoutSource).not.toContain("STRIPE_SECRET_KEY");
    expect(checkoutSource).not.toContain("client_secret");
  });

  it("surfaces the Checkout contract from the deposit session route", () => {
    expect(routeSource).toContain("buildStripeCheckoutRouteContract");
    expect(routeSource).toContain("checkoutContract");
    expect(routeSource).toContain("safeBrowserResponse");
    expect(routeSource).toContain("runtimeReadiness");
  });
});
