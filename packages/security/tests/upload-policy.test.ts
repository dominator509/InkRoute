import { describe, expect, it } from "vitest";
import { buildPrivacyLifecyclePlan, buildTenantIsolationFixtures, evaluateRateLimitDraft, redactRecord, validateUploadDraft } from "../src/index";

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

  it("blocks privacy lifecycle plans until requester identity is verified", () => {
    const plan = buildPrivacyLifecyclePlan({
      requestType: "export",
      requesterVerified: false,
      categories: ["client_profile", "medical_note"],
    });

    expect(plan).toMatchObject({
      status: "blocked_identity",
      canExecute: false,
      steps: [],
    });
    expect(plan.productionBlockers[0]).toContain("Requester identity");
  });

  it("plans exports with audit requirements and blocks non-exportable audit logs", () => {
    const plan = buildPrivacyLifecyclePlan({
      requestType: "export",
      requesterVerified: true,
      legalReviewApproved: true,
      categories: ["client_profile", "payment_record", "audit_log"],
    });

    expect(plan.canExecute).toBe(false);
    expect(plan.steps.map((step) => [step.category, step.action, step.blocked])).toEqual([
      ["client_profile", "export", false],
      ["payment_record", "export", false],
      ["audit_log", "export", true],
    ]);
    expect(plan.requiredAudits).toContain("export:payment_record:export");
  });

  it("uses legal holds or anonymization for deletion-sensitive categories", () => {
    const plan = buildPrivacyLifecyclePlan({
      requestType: "deletion",
      requesterVerified: true,
      categories: ["client_profile", "consent_signature", "payment_record"],
    });

    expect(plan.canExecute).toBe(false);
    expect(plan.steps.map((step) => [step.category, step.action, step.blocked])).toEqual([
      ["client_profile", "anonymize", false],
      ["consent_signature", "retain_legal_hold", true],
      ["payment_record", "anonymize", true],
    ]);
    expect(plan.productionBlockers).toContain("Attorney-approved retention schedule is required before executing production export/delete workers.");
  });

  it("allows reviewed deletion plans for deletable private data while preserving audit steps", () => {
    const plan = buildPrivacyLifecyclePlan({
      requestType: "deletion",
      requesterVerified: true,
      legalReviewApproved: true,
      categories: ["client_profile", "reference_file", "message", "error_report"],
    });

    expect(plan).toMatchObject({
      status: "ready",
      canExecute: true,
    });
    expect(plan.steps.map((step) => step.action)).toEqual(["anonymize", "delete", "anonymize", "anonymize"]);
    expect(plan.requiredAudits).toEqual([
      "deletion:client_profile:anonymize",
      "deletion:reference_file:delete",
      "deletion:message:anonymize",
      "deletion:error_report:anonymize",
    ]);
  });
});
