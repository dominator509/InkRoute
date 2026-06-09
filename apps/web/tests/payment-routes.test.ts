import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { POST as createDepositSession } from "../app/api/public/[tenantSlug]/deposit-sessions/route";
import { POST as receiveStripeWebhook } from "../app/api/webhooks/stripe/route";
import { persistBookingRequest } from "../lib/localRuntimeState";

function depositRequest(body: unknown, clientIp: string): NextRequest {
  return new NextRequest("https://local.test/api/public/inkroute-demo/deposit-sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-client-ip": clientIp,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("payment API route boundaries", () => {
  it("rejects deposit sessions for unknown tenants and malformed request bodies", async () => {
    const unknownTenant = await createDepositSession(depositRequest({}, "203.0.113.10"), {
      params: Promise.resolve({ tenantSlug: "unknown-studio" }),
    });
    const invalidJson = await createDepositSession(depositRequest("{", "203.0.113.11"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });
    const missingRequiredFields = await createDepositSession(depositRequest({ bookingRequestId: "booking_001" }, "203.0.113.12"), {
      params: Promise.resolve({ tenantSlug: "inkroute-demo" }),
    });

    await expect(unknownTenant.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "TENANT_NOT_FOUND" },
    });
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
    });
    await expect(missingRequiredFields.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_REQUIRED_FIELDS" },
    });
    expect(unknownTenant.status).toBe(404);
    expect(invalidJson.status).toBe(400);
    expect(missingRequiredFields.status).toBe(400);
  });

  it("requires a persisted booking before returning a local deposit session preview", async () => {
    const missingBooking = await createDepositSession(
      depositRequest(
        {
          bookingRequestId: "booking_missing",
          estimatedSessionHours: 3,
          successUrl: "https://inkroute.test/deposit/success",
          cancelUrl: "https://inkroute.test/deposit/cancel",
        },
        "203.0.113.20",
      ),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );

    expect(missingBooking.status).toBe(400);
    await expect(missingBooking.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "BOOKING_NOT_FOUND" },
    });
  });

  it("returns a local deposit session preview for a persisted demo booking", async () => {
    const booking = persistBookingRequest("inkroute-demo", {
      artistId: "cuid_000000000000000000000003",
      clientName: "Ink Demo",
      clientEmail: "demo+deposit@example.com",
      preferredCity: "seattle",
      style: "blackwork",
      placement: "forearm",
      sizeEstimate: "small",
      ideaSummary: "Deposit route contract test for a blackwork tattoo request.",
      policyAccepted: true,
    });
    const response = await createDepositSession(
      depositRequest(
        {
          bookingRequestId: booking.request.id,
          estimatedSessionHours: 4,
          successUrl: "https://inkroute.test/deposit/success",
          cancelUrl: "https://inkroute.test/deposit/cancel",
          clientEmail: "demo+deposit@example.com",
        },
        "203.0.113.21",
      ),
      { params: Promise.resolve({ tenantSlug: "inkroute-demo" }) },
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        sessionDraft: { metadata: Record<string, string>; idempotencyKey: string };
        storedSession: { bookingRequestId: string; status: string };
        productionBoundary: { gapIds: string[] };
        localRuntime: { bookingFound: boolean; bookingId: string };
      };
    };

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(payload.data.sessionDraft.metadata.bookingRequestId).toBe(booking.request.id);
    expect(payload.data.sessionDraft.idempotencyKey).toContain(booking.request.id);
    expect(payload.data.storedSession).toMatchObject({
      bookingRequestId: booking.request.id,
      status: "created",
    });
    expect(payload.data.localRuntime).toMatchObject({
      bookingFound: true,
      bookingId: booking.request.id,
    });
    expect(payload.data.productionBoundary.gapIds).toEqual(["GAP-004", "GAP-049", "GAP-050"]);
  });

  it("enforces Stripe webhook signature and JSON boundaries before local reconciliation", async () => {
    const missingSignature = await receiveStripeWebhook(
      new NextRequest("https://local.test/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ type: "checkout.session.completed" }),
      }),
    );
    const invalidJson = await receiveStripeWebhook(
      new NextRequest("https://local.test/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=test,v1=signature" },
        body: "{",
      }),
    );
    const acceptedLocalWebhook = await receiveStripeWebhook(
      new NextRequest("https://local.test/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=test,v1=signature" },
        body: JSON.stringify({
          type: "checkout.session.completed",
          data: { object: { metadata: { tenantId: "tenant_inkroute_demo" } } },
        }),
      }),
    );

    expect(missingSignature.status).toBe(400);
    await expect(missingSignature.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "MISSING_STRIPE_SIGNATURE" },
    });
    expect(invalidJson.status).toBe(400);
    await expect(invalidJson.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_WEBHOOK_JSON" },
    });

    const acceptedPayload = (await acceptedLocalWebhook.json()) as {
      ok: boolean;
      data: { interpretation: { action: string; targetStatus: string }; productionBoundary: { gapIds: string[] } };
    };
    expect(acceptedLocalWebhook.status).toBe(200);
    expect(acceptedPayload.ok).toBe(true);
    expect(acceptedPayload.data.interpretation).toMatchObject({
      action: "deposit_paid",
      targetStatus: "paid",
    });
    expect(acceptedPayload.data.productionBoundary.gapIds).toEqual(["GAP-004", "GAP-049", "GAP-050", "GAP-051"]);
  });

  it("rejects invalid Stripe webhook signatures when the endpoint secret is configured", async () => {
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_route_test";
    const body = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { metadata: { tenantId: "tenant_inkroute_demo" } } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const validSignature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.${body}`, "utf8").digest("hex");

    try {
      const invalid = await receiveStripeWebhook(
        new NextRequest("https://local.test/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": `t=${timestamp},v1=deadbeef` },
          body,
        }),
      );
      const valid = await receiveStripeWebhook(
        new NextRequest("https://local.test/api/webhooks/stripe", {
          method: "POST",
          headers: { "stripe-signature": `t=${timestamp},v1=${validSignature}` },
          body,
        }),
      );

      expect(invalid.status).toBe(400);
      await expect(invalid.json()).resolves.toMatchObject({
        ok: false,
        error: { code: "STRIPE_SIGNATURE_INVALID" },
        data: { verification: { status: "signature_mismatch" } },
      });
      expect(valid.status).toBe(200);
    } finally {
      if (originalSecret === undefined) {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      } else {
        process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      }
    }
  });
});
