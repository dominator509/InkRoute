import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("provider webhook contract coverage", () => {
  it("keeps the provider test plan explicit about credential-gated sandbox proof", () => {
    const plan = JSON.parse(readWorkspaceFile("testing/manifests/provider-test-plan.json")) as {
      status: string;
      providers: Array<{ name: string; commands: string[]; evidenceRequired: string; gaps: string[] }>;
      suites?: Array<{ id: string; file: string; verifies: string[]; blockedBy: string[] }>;
    };

    expect(plan.status).toBe("credential_gated");
    expect(plan.providers.map((provider) => provider.name)).toEqual(["Stripe", "Google Calendar", "Email/SMS/Push", "Sentry"]);
    expect(plan.providers.flatMap((provider) => provider.commands).join("\n")).toContain("stripe trigger checkout.session.completed");
    expect(plan.providers.map((provider) => provider.evidenceRequired).join("\n")).toContain("Verified signature");
    expect(plan.providers.map((provider) => provider.evidenceRequired).join("\n")).toContain("idempotency proof");
    expect(plan.suites?.some((suite) => suite.file === "apps/web/tests/provider-webhook-contracts.test.ts")).toBe(true);
  });

  it("requires Stripe webhook routes to preserve raw-body, signature, tenant, and idempotent audit boundaries", () => {
    const source = readWorkspaceFile("apps/web/app/api/webhooks/stripe/route.ts");

    expect(source).toContain('request.headers.get("stripe-signature")');
    expect(source).toContain("MISSING_STRIPE_SIGNATURE");
    expect(source).toContain("const rawBody = await request.text()");
    expect(source).toContain("interpretStripeWebhook");
    expect(source).toContain("persistWebhookEvent");
    expect(source).toContain("signatureHeader: \"present\"");
    expect(source).toContain("Reconcile tenant, booking, deposit, payment, amount, and currency idempotently");
    expect(source).toContain("Persist PaymentAuditLog records with redacted metadata");
  });

  it("requires email webhook routes to keep signature and delivery-log replay boundaries visible", () => {
    const source = readWorkspaceFile("apps/web/app/api/webhooks/email/route.ts");

    expect(source).toContain('request.headers.get("resend-signature")');
    expect(source).toContain('request.headers.get("svix-signature")');
    expect(source).toContain("MISSING_EMAIL_PROVIDER_SIGNATURE");
    expect(source).toContain("interpretEmailWebhook");
    expect(source).toContain("persistWebhookEvent");
    expect(source).toContain("Track idempotency from provider event IDs");
    expect(source).toContain("Apply suppression state transitions");
  });

  it("requires SMS webhook routes to keep Twilio signatures, STOP handling, and replay boundaries visible", () => {
    const source = readWorkspaceFile("apps/web/app/api/webhooks/sms/route.ts");

    expect(source).toContain('request.headers.get("x-twilio-signature")');
    expect(source).toContain("MISSING_SMS_PROVIDER_SIGNATURE");
    expect(source).toContain("interpretSmsWebhook");
    expect(source).toContain("persistWebhookEvent");
    expect(source).toContain("Handle inbound STOP by muting the sender destination immediately");
    expect(source).toContain("apply replay/idempotency checks");
  });

  it("requires Sentry webhook routes to verify signatures and expose provider delivery idempotency", () => {
    const source = readWorkspaceFile("apps/web/app/api/webhooks/sentry/route.ts");

    expect(source).toContain('request.headers.get("sentry-hook-signature")');
    expect(source).toContain('request.headers.get("x-sentry-signature")');
    expect(source).toContain("SENTRY_WEBHOOK_SECRET");
    expect(source).toContain("createHmac");
    expect(source).toContain("timingSafeEqual");
    expect(source).toContain("providerDeliveryId");
    expect(source).toContain("idempotencyKey");
    expect(source).toContain("Persist webhook deliveries idempotently");
  });
});
