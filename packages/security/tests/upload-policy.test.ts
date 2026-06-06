import { describe, expect, it } from "vitest";
import { buildTenantIsolationFixtures, evaluateRateLimitDraft, redactRecord, validateUploadDraft } from "../src/index";

describe("security and privacy helpers", () => {
  it("accepts reference image drafts only within private-upload policy limits", () => {
    const accepted = validateUploadDraft({ kind: "reference_private", filename: "rib-reference.jpg", mimeType: "image/jpeg", sizeBytes: 400000, declaredByAuthenticatedUser: false });
    const rejected = validateUploadDraft({ kind: "portfolio_public", filename: "flash.jpg.php", mimeType: "image/jpeg", sizeBytes: 400000, declaredByAuthenticatedUser: true });

    expect(accepted.accepted).toBe(true);
    expect(accepted.storageVisibility).toBe("client_private");
    expect(rejected.accepted).toBe(false);
    expect(rejected.reasons.join(" ")).toContain("allowlist");
  });

  it("redacts PII, payment fields, and medical notes", () => {
    const redacted = redactRecord({ email: "avery@example.com", stripePaymentIntentId: "pi_123", medicalNotes: "allergy details" });

    expect(redacted.email).not.toBe("avery@example.com");
    expect(redacted.stripePaymentIntentId).toBe("[redacted-payment]");
    expect(redacted.medicalNotes).toBe("[redacted-medical]");
  });

  it("provides tenant isolation and rate-limit fixtures for future integration tests", () => {
    expect(buildTenantIsolationFixtures().some((fixture) => fixture.expectedDecision === "deny")).toBe(true);
    expect(evaluateRateLimitDraft({ ruleId: "public-booking-submit", observedRequests: 12, windowSeconds: 60 }).status).toBe("throttle");
  });
});
