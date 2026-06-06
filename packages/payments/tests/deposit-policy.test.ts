import { describe, expect, it } from "vitest";
import { buildStripeCheckoutSessionDraft, calculateDepositPolicy, evaluateNoShowPolicy, evaluateRefundPolicy, generateReceiptNumber } from "../src/index";

describe("payment policy engine", () => {
  it("raises risk for high-demand travel and client no-show history", () => {
    const policy = calculateDepositPolicy({
      estimatedSessionHours: 5,
      city: "Seattle",
      appointmentType: "guest_spot",
      travelRiskTier: "high_demand_guest_spot",
      cityDemandScore: 5,
      clientNoShowCount: 1
    });

    expect(policy.depositRequired).toBe(true);
    expect(policy.depositAmountCents).toBeGreaterThan(25000);
    expect(policy.riskScore).toBeGreaterThan(70);
    expect(policy.breakdown.some((line) => line.label === "No-show history")).toBe(true);
  });

  it("builds a deterministic Stripe checkout session draft without calling Stripe", () => {
    const draft = buildStripeCheckoutSessionDraft({
      tenantId: "tenant_demo",
      bookingRequestId: "booking_demo",
      amountCents: 15000,
      currency: "usd",
      successUrl: "https://example.test/success",
      cancelUrl: "https://example.test/cancel",
      clientEmail: "client@example.com",
      artistDisplayName: "Mara Vale"
    });

    expect(draft.mode).toBe("payment");
    expect(draft.customerEmail).toBe("client@example.com");
    expect(draft.idempotencyKey).toContain("tenant_demo:booking_demo:15000:usd");
  });

  it("evaluates refund and no-show decisions with audit-friendly outcomes", () => {
    const refund = evaluateRefundPolicy({
      amountPaidCents: 20000,
      cancellationRequestedAt: "2026-06-01T10:00:00.000Z",
      appointmentStartsAt: "2026-06-06T10:00:00.000Z"
    });
    const noShow = evaluateNoShowPolicy({
      depositAmountCents: 20000,
      appointmentStartsAt: "2026-06-06T10:00:00.000Z",
      markedAt: "2026-06-06T10:45:00.000Z",
      clientArrivedMinutesLate: 45
    });

    expect(refund.decision).toBe("eligible");
    expect(noShow.decision).toBe("forfeit_deposit");
    expect(noShow.requiresAudit).toBe(true);
    expect(generateReceiptNumber("mara-vale", "2026-06-06T10:45:00.000Z", 12)).toContain("MARA-VALE");
  });
});
