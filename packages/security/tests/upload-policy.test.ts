import { describe, expect, it } from "vitest";
import {
  buildPrivacyLifecyclePlan,
  buildPrivacyCaseWorkflowPlan,
  buildSignedUploadIntentPlan,
  buildPrivateStorageAccessPlan,
  buildUploadScanPipelinePlan,
  detectMimeTypeFromSignature,
  buildTenantIsolationFixtures,
  evaluateDashboardPrivacyField,
  evaluateRateLimitDraft,
  projectDashboardPrivacyRecord,
  redactRecord,
  validateUploadDraft,
} from "../src/index";

describe("security and privacy helpers", () => {
  it("accepts reference image drafts only within private-upload policy limits", () => {
    const accepted = validateUploadDraft({ kind: "reference_private", filename: "rib-reference.jpg", mimeType: "image/jpeg", sizeBytes: 400000, declaredByAuthenticatedUser: false });
    const rejected = validateUploadDraft({ kind: "portfolio_public", filename: "flash.jpg.php", mimeType: "image/jpeg", sizeBytes: 400000, declaredByAuthenticatedUser: true });

    expect(accepted.accepted).toBe(true);
    expect(accepted.storageVisibility).toBe("client_private");
    expect(rejected.accepted).toBe(false);
    expect(rejected.reasons.join(" ")).toContain("allowlist");
  });

  it("plans signed private reference upload intents with scoped object keys", () => {
    const plan = buildSignedUploadIntentPlan({
      kind: "reference_private",
      filename: "Rib Reference.JPG",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      declaredByAuthenticatedUser: false,
      tenantId: "Tenant Demo Nomad",
      subjectId: "Reference 001",
      bookingRequestId: "Booking 001",
      expiresInSeconds: 9999,
    });

    expect(plan).toMatchObject({
      accepted: true,
      status: "provider_gated",
      storageVisibility: "client_private",
      signedUploadUrlRequired: true,
      publicReadAllowed: false,
      expiresInSeconds: 3600,
      requiredWrites: ["FileAsset", "BookingReferenceImage", "AuditLog"],
    });
    expect(plan.objectKey).toBe("private/tenant-demo-nomad/reference_private/booking-001/reference-001.jpg");
    expect(plan.requiredControls).toContain("Private upload objects must not be readable through public URLs before or after scan completion.");
  });

  it("rejects signed upload intents when metadata validation fails", () => {
    const plan = buildSignedUploadIntentPlan({
      kind: "reference_private",
      filename: "../reference.jpg.php",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      declaredByAuthenticatedUser: false,
      tenantId: "tenant_001",
      subjectId: "reference_001",
      expiresInSeconds: 10,
    });

    expect(plan.accepted).toBe(false);
    expect(plan.status).toBe("rejected");
    expect(plan.objectKey).toBeNull();
    expect(plan.expiresInSeconds).toBe(60);
    expect(plan.validation.reasons.join(" ")).toContain("allowlist");
    expect(plan.signedUploadUrlRequired).toBe(false);
  });

  it("detects known upload magic bytes before trusting declared MIME types", () => {
    expect(detectMimeTypeFromSignature("ff d8 ff e0 00 10")).toBe("image/jpeg");
    expect(detectMimeTypeFromSignature("89504E470D0A1A0A0000")).toBe("image/png");
    expect(detectMimeTypeFromSignature("255044462d312e37")).toBe("application/pdf");
    expect(detectMimeTypeFromSignature("4d5a9000")).toBeNull();
  });

  it("quarantines spoofed MIME uploads even when metadata validation passes", () => {
    const plan = buildUploadScanPipelinePlan({
      kind: "reference_private",
      filename: "reference.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      declaredByAuthenticatedUser: false,
      fileSignatureHex: "89504e470d0a1a0a0000",
      malwareVerdict: "clean",
      exifMetadataPresent: false,
      normalizedDerivativeGenerated: true,
      scanProviderConfigured: true,
    });

    expect(plan.validation.accepted).toBe(true);
    expect(plan.status).toBe("quarantined");
    expect(plan.detectedMimeType).toBe("image/png");
    expect(plan.signatureMatches).toBe(false);
    expect(plan.reasons.join(" ")).toContain("does not match declared MIME");
    expect(plan.scanStatusPersistence.fields).toContain("detectedMimeType");
  });

  it("rejects malware fixtures and blocks public derivatives until metadata is stripped", () => {
    const malware = buildUploadScanPipelinePlan({
      kind: "portfolio_public",
      filename: "flash.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      declaredByAuthenticatedUser: true,
      fileSignatureHex: "ffd8ffe00010",
      malwareVerdict: "malware",
      exifMetadataPresent: true,
      normalizedDerivativeGenerated: false,
      scanProviderConfigured: true,
    });
    const cleanDerivative = buildUploadScanPipelinePlan({
      kind: "portfolio_public",
      filename: "flash.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      declaredByAuthenticatedUser: true,
      fileSignatureHex: "ffd8ffe00010",
      malwareVerdict: "clean",
      exifMetadataPresent: true,
      normalizedDerivativeGenerated: true,
      scanProviderConfigured: true,
    });

    expect(malware.status).toBe("rejected");
    expect(malware.publicDerivativeAllowed).toBe(false);
    expect(malware.reasons.join(" ")).toContain("malware");
    expect(cleanDerivative.status).toBe("approved");
    expect(cleanDerivative.metadataStrippingRequired).toBe(true);
    expect(cleanDerivative.publicDerivativeAllowed).toBe(true);
    expect(cleanDerivative.requiredControls).toContain("Never expose original private uploads publicly; publish only safe derivatives when allowed.");
  });

  it("requires scoped signed URLs for private uploads and downloads", () => {
    const upload = buildPrivateStorageAccessPlan({
      kind: "reference_private",
      operation: "upload",
      tenantId: "tenant_001",
      subjectId: "booking_001",
      objectKey: "private/tenant_001/reference_private/booking_001/ref.jpg",
      storageVisibility: "client_private",
      expiresInSeconds: 9999,
      now: "2026-06-08T20:30:00.000Z",
      scanApproved: false,
      providerConfigured: true,
    });
    const download = buildPrivateStorageAccessPlan({
      kind: "reference_private",
      operation: "download",
      tenantId: "tenant_001",
      subjectId: "booking_001",
      objectKey: "private/tenant_001/reference_private/booking_001/ref.jpg",
      storageVisibility: "client_private",
      expiresInSeconds: 900,
      now: "2026-06-08T20:30:00.000Z",
      expiresAt: "2026-06-08T20:45:00.000Z",
      scanApproved: true,
      providerConfigured: true,
    });

    expect(upload).toMatchObject({
      status: "signed_url_ready",
      bucketAcl: "private",
      signedUrlRequired: true,
      publicReadAllowed: false,
      expiresInSeconds: 3600,
      requiredWrites: ["FileAsset", "AuditLog", "SignedUrlGrant"],
    });
    expect(download.status).toBe("signed_url_ready");
    expect(download.requiredControls).toContain("Check revocation and expiry before every private download grant.");
  });

  it("blocks revoked, expired, unscanned private downloads and unsafe public derivatives", () => {
    const revoked = buildPrivateStorageAccessPlan({
      kind: "consent_signature",
      operation: "download",
      tenantId: "tenant_001",
      subjectId: "consent_001",
      objectKey: "private/tenant_001/consent_signature/consent_001/signature.png",
      storageVisibility: "system_private",
      expiresInSeconds: 900,
      now: "2026-06-08T20:30:00.000Z",
      expiresAt: "2026-06-08T20:45:00.000Z",
      revokedAt: "2026-06-08T20:31:00.000Z",
      scanApproved: true,
      providerConfigured: true,
    });
    const unscanned = buildPrivateStorageAccessPlan({
      kind: "document_private",
      operation: "download",
      tenantId: "tenant_001",
      subjectId: "doc_001",
      objectKey: "private/tenant_001/document_private/doc_001/intake.pdf",
      storageVisibility: "tenant_private",
      expiresInSeconds: 900,
      now: "2026-06-08T20:30:00.000Z",
      expiresAt: "2026-06-08T20:45:00.000Z",
      scanApproved: false,
      providerConfigured: true,
    });
    const unsafeDerivative = buildPrivateStorageAccessPlan({
      kind: "portfolio_public",
      operation: "download",
      tenantId: "tenant_001",
      subjectId: "portfolio_001",
      objectKey: "private/tenant_001/portfolio_public/original.jpg",
      storageVisibility: "public_derivative",
      expiresInSeconds: 900,
      now: "2026-06-08T20:30:00.000Z",
      expiresAt: "2026-06-08T20:45:00.000Z",
      scanApproved: true,
      providerConfigured: true,
    });

    expect(revoked.status).toBe("revoked");
    expect(revoked.reasons).toContain("Signed URL grant has been revoked.");
    expect(unscanned.status).toBe("rejected");
    expect(unscanned.reasons).toContain("Private downloads require approved scan status.");
    expect(unsafeDerivative.status).toBe("rejected");
    expect(unsafeDerivative.publicReadAllowed).toBe(false);
    expect(unsafeDerivative.reasons).toContain("Public portfolio access must use a separate safe derivative object key.");
  });

  it("redacts PII, payment fields, and medical notes", () => {
    const redacted = redactRecord({ email: "avery@example.com", stripePaymentIntentId: "pi_123", medicalNotes: "allergy details" });

    expect(redacted.email).not.toBe("avery@example.com");
    expect(redacted.stripePaymentIntentId).toBe("[redacted-payment]");
    expect(redacted.medicalNotes).toBe("[redacted-medical]");
  });

  it("projects dashboard privacy records by role and field sensitivity", () => {
    const assistantView = projectDashboardPrivacyRecord({
      role: "assistant",
      surface: "booking_request",
      tenantScoped: true,
      record: {
        clientName: "Avery Client",
        clientEmail: "avery@example.com",
        medicalNotes: "allergy details",
        stripePaymentIntentId: "pi_123",
      },
    });

    expect(assistantView.fields).toMatchObject({
      clientName: "[redacted-pii]",
      clientEmail: "av***@e***",
      medicalNotes: "[redacted-medical]",
      stripePaymentIntentId: "[redacted-payment]",
    });
    expect(assistantView.redactedFields).toEqual(["clientName", "clientEmail", "medicalNotes", "stripePaymentIntentId"]);
    expect(assistantView.auditRequired).toBe(true);
    expect(assistantView.retentionWorkflowRequired).toBe(true);
  });

  it("denies dashboard privacy access without tenant scope", () => {
    const projection = projectDashboardPrivacyRecord({
      role: "owner",
      surface: "client_profile",
      tenantScoped: false,
      record: {
        clientName: "Avery Client",
        clientEmail: "avery@example.com",
      },
    });

    expect(projection.fields).toEqual({});
    expect(projection.deniedFields).toEqual(["clientName", "clientEmail"]);
    expect(projection.auditRequired).toBe(true);
  });

  it("requires verified break-glass context before platform admins can view sensitive tenant fields", () => {
    const unverified = evaluateDashboardPrivacyField({
      role: "admin",
      surface: "payment",
      fieldName: "stripePaymentIntentId",
      value: "pi_123",
      tenantScoped: true,
    });
    const verifiedOwner = evaluateDashboardPrivacyField({
      role: "owner",
      surface: "payment",
      fieldName: "stripePaymentIntentId",
      value: "pi_123",
      tenantScoped: true,
      requesterVerified: true,
    });

    expect(unverified).toMatchObject({
      decision: "redact",
      value: "[redacted-payment]",
      auditRequired: true,
    });
    expect(verifiedOwner).toMatchObject({
      decision: "allow",
      value: "pi_123",
      auditRequired: true,
    });
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

  it("blocks privacy cases until identity, tenant relationship, workers, notifications, and audits are configured", () => {
    const plan = buildPrivacyCaseWorkflowPlan({
      requestType: "export",
      categories: ["client_profile", "reference_file"],
      requesterVerified: false,
      tenantMembershipVerified: false,
      caseStoreConfigured: false,
      exportWorkerConfigured: false,
      deletionWorkerConfigured: false,
      notificationProviderConfigured: false,
      auditLogConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.caseStatus).toBe("awaiting_identity_verification");
    expect(plan.lifecycle.canExecute).toBe(false);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Requester identity must be verified before privacy case execution.",
        "Tenant/client relationship must be verified before privacy case execution.",
        "Tenant-scoped privacy case store must be configured before production intake.",
        "Export worker must be configured before access/export requests can execute.",
        "Notification provider must be configured for receipt, identity, completion, and denial updates.",
        "Audit logging must be configured for every privacy case state transition.",
      ]),
    );
    expect(plan.requiredCaseFields).toContain("identityVerificationStatus");
    expect(plan.requiredWorkers).toContain("privacy-export");
    expect(plan.auditEvents).toContain("privacy.case_closed");
  });

  it("marks verified privacy cases ready when lifecycle workers and legal review are configured", () => {
    const plan = buildPrivacyCaseWorkflowPlan({
      requestType: "deletion",
      categories: ["client_profile", "reference_file", "message"],
      requesterVerified: true,
      tenantMembershipVerified: true,
      caseStoreConfigured: true,
      exportWorkerConfigured: true,
      deletionWorkerConfigured: true,
      notificationProviderConfigured: true,
      auditLogConfigured: true,
      legalReviewApproved: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.caseStatus).toBe("ready_for_execution");
    expect(plan.lifecycle.canExecute).toBe(true);
    expect(plan.notificationSteps.join(" ")).toContain("attorney-reviewed copy");
  });
});
