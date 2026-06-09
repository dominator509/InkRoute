import { describe, expect, it } from "vitest";
import {
  buildDashboardPrivacyRuntimeReadinessPlan,
  buildPrivacyLifecyclePlan,
  buildPrivacyCaseWorkflowPlan,
  buildPrivacyRetentionDryRunEvidencePlan,
  buildPrivacyRequestRuntimeReadinessPlan,
  buildPrivacyRetentionRuntimeReadinessPlan,
  buildRetentionEnforcementRuntimeReadinessPlan,
  buildRetentionEnforcementDryRun,
  buildLegalReviewPacketPlan,
  buildLegalDocumentProductionReadinessPlan,
  buildPaymentPolicyLegalReviewRuntimeReadinessPlan,
  buildAbuseControlPlan,
  buildAbuseControlRuntimeReadinessPlan,
  buildFileAssetPersistencePlan,
  buildSignedUploadIntentPlan,
  buildPrivateStorageAccessPlan,
  buildPrivateStorageRuntimeReadinessPlan,
  buildProviderStorageUploadReadinessPlan,
  buildSecurityAppRuntimeVerificationPlan,
  buildSecurityAutomatedCoverageReadinessPlan,
  buildSecurityMiddlewareRuntimeReadinessPlan,
  buildSecurityRuntimeEnforcementPlan,
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

  it("plans FileAsset persistence with scan, derivative, privacy, and audit blockers", () => {
    const privateReference = buildFileAssetPersistencePlan({
      kind: "reference_private",
      tenantId: "tenant_001",
      subjectId: "booking_001",
      objectKey: "private/tenant_001/reference_private/booking_001/ref.jpg",
      originalFilename: "ref.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      storageVisibility: "client_private",
      scanStatus: "approved",
      providerConfigured: true,
      auditLogConfigured: true,
      fileAssetStoreConfigured: true,
    });
    const blockedPublic = buildFileAssetPersistencePlan({
      kind: "portfolio_public",
      tenantId: "tenant_001",
      subjectId: "portfolio_001",
      objectKey: "private/tenant_001/portfolio_public/original.jpg",
      originalFilename: "flash.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 400000,
      storageVisibility: "public_derivative",
      scanStatus: "pending",
      providerConfigured: false,
      auditLogConfigured: false,
      fileAssetStoreConfigured: false,
    });

    expect(privateReference).toMatchObject({
      status: "ready",
      accessLevel: "client_private",
      publicReadAllowed: false,
      requiredWrites: ["FileAsset", "AuditLog", "BookingReferenceImage"],
      blockers: [],
    });
    expect(privateReference.requiredControls).toContain("Apply privacy retention rules to private reference, consent, document, and healed follow-up files.");
    expect(blockedPublic.status).toBe("blocked");
    expect(blockedPublic.publicReadAllowed).toBe(false);
    expect(blockedPublic.blockers).toEqual(expect.arrayContaining([
      "Object storage provider must be configured before FileAsset persistence is production-ready.",
      "FileAsset cannot be exposed or finalized before upload scan approval.",
      "Public portfolio assets require a separate scanned derivative object key.",
    ]));
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

  it("blocks private storage runtime readiness until provider signing, persistence, ACLs, and access tests are proven", () => {
    const plan = buildPrivateStorageRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      storageProviderConfigured: false,
      storageEnvVarsConfigured: false,
      privateBucketAclVerified: false,
      serverOwnedObjectKeysEnforced: true,
      signedUploadUrlsImplemented: false,
      signedDownloadUrlsImplemented: false,
      fileAssetPersistenceConfigured: false,
      signedUrlGrantPersistenceConfigured: false,
      signedUrlRevocationPersistenceConfigured: false,
      auditLogPersistenceConfigured: false,
      scanApprovalGateEnforced: true,
      publicDerivativeSeparationEnforced: true,
      privateOriginalPublicReadDenied: false,
      approvedDerivativePublicReadVerified: false,
      tenantScopedAccessIntegrationTestsPassed: false,
      providerSandboxIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Run and pass @inkroute/security typecheck before marking private storage ready.",
      "S3 or Supabase private object storage provider must be configured.",
      "Provider signed upload URLs must be implemented with operation, object key, content type, and expiry scope.",
      "SignedUrlGrant persistence must record issuer, recipient, object key, scope, expiry, and use status.",
      "Integration tests must prove private originals cannot be read publicly.",
      "Tenant-scoped storage access integration tests must deny cross-tenant object keys and grants.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "configured S3/Supabase private bucket, signing environment, and ACL denial transcript",
      "persisted FileAsset, SignedUrlGrant, revocation, and AuditLog rows for signed storage flows",
      "private/public object access integration tests against provider sandbox or emulator",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/storage/verify-private-bucket-acl.mjs");
  });

  it("marks private storage runtime ready only after signed URL, persistence, ACL, and private/public proofs exist", () => {
    const plan = buildPrivateStorageRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      storageProviderConfigured: true,
      storageEnvVarsConfigured: true,
      privateBucketAclVerified: true,
      serverOwnedObjectKeysEnforced: true,
      signedUploadUrlsImplemented: true,
      signedDownloadUrlsImplemented: true,
      fileAssetPersistenceConfigured: true,
      signedUrlGrantPersistenceConfigured: true,
      signedUrlRevocationPersistenceConfigured: true,
      auditLogPersistenceConfigured: true,
      scanApprovalGateEnforced: true,
      publicDerivativeSeparationEnforced: true,
      privateOriginalPublicReadDenied: true,
      approvedDerivativePublicReadVerified: true,
      tenantScopedAccessIntegrationTestsPassed: true,
      providerSandboxIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("redacts PII, payment fields, medical notes, and nested privacy details", () => {
    const redacted = redactRecord({
      email: "avery@example.com",
      stripePaymentIntentId: "pi_123",
      medicalNotes: "allergy details",
      details: { phone: "555-0100", nested: [{ email: "client@example.test" }] },
    });

    expect(redacted.email).not.toBe("avery@example.com");
    expect(redacted.stripePaymentIntentId).toBe("[redacted-payment]");
    expect(redacted.medicalNotes).toBe("[redacted-medical]");
    expect((redacted.details as { phone: string }).phone).not.toBe("555-0100");
    expect((redacted.details as { nested: { email: string }[] }).nested[0]?.email).not.toBe("client@example.test");
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

  it("blocks dashboard privacy runtime readiness until routes, legal review, workflows, storage, and log redaction are proven", () => {
    const plan = buildDashboardPrivacyRuntimeReadinessPlan({
      packageScripts: { test: "vitest run" },
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      surfacesUsingProjection: ["client_profile", "booking_request", "payment"],
      surfacesWithRouteTests: ["client_profile"],
      legalReviewApproved: false,
      persistedPrivacyWorkflowsConfigured: false,
      exportWorkflowTested: false,
      deletionWorkflowTested: false,
      privateFileStorageDeletionTested: false,
      auditLogPersistenceConfigured: false,
      logAndErrorRedactionVerified: false,
      consentLanguageApproved: false,
      medicalLanguageApproved: false,
      paymentLanguageApproved: true,
      smsLanguageApproved: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.missingProjectionSurfaces).toEqual(["consent_form", "message", "file_asset"]);
    expect(plan.missingRouteTestSurfaces).toContain("payment");
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/dashboard test -- dashboard-privacy");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "dashboard route/API privacy projection matrix for client, booking, consent, payment, message, and file surfaces",
      "persisted export/delete/anonymization workflow test output for tenant dashboard data",
      "AuditLog persistence and sanitized log/error evidence for dashboard privacy actions",
    ]));
    expect(plan.blockers).toContain("Dashboard logs and error reports must be verified to redact PII, medical notes, payment identifiers, file keys, and message bodies.");
  });

  it("provides tenant isolation and rate-limit fixtures for future integration tests", () => {
    expect(buildTenantIsolationFixtures().some((fixture) => fixture.expectedDecision === "deny")).toBe(true);
    expect(evaluateRateLimitDraft({ ruleId: "public-booking-submit", observedRequests: 12, windowSeconds: 60 }).status).toBe("throttle");
  });

  it("plans tenant-aware abuse throttling with privacy-safe logs and alert blockers", () => {
    const plan = buildAbuseControlPlan({
      ruleId: "public-booking-submit",
      routePath: "/api/public/inkroute-demo/booking-requests",
      tenantId: "Tenant Demo",
      ipHash: "ip_test_hash",
      userAgent: "",
      observedRequests: 22,
      windowSeconds: 3600,
      providerWebhook: false,
      redisConfigured: false,
      botChallengeConfigured: false,
      alertingConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.action).toBe("throttle");
    expect(plan.retryAfterSeconds).toBe(3600);
    expect(plan.signals).toEqual(expect.arrayContaining(["high_request_count", "missing_user_agent", "known_test_fixture"]));
    expect(plan.privacySafeLog).toMatchObject({
      routePath: "/api/public/inkroute-demo/booking-requests",
      tenantId: "tenant-demo",
      ipHash: "ip_test_hash",
      action: "throttle",
    });
    expect(JSON.stringify(plan.privacySafeLog)).not.toContain("127.0.0.1");
    expect(plan.alert).toMatchObject({ shouldAlert: true });
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Distributed Redis/edge rate limiter must be configured before production abuse controls are ready.",
        "Bot challenge provider or proof-of-work strategy must be configured for suspicious public traffic.",
        "Abuse alerting must be configured before throttling incidents can page or notify operators.",
      ]),
    );
  });

  it("challenges suspicious public traffic without leaking raw IPs or payloads", () => {
    const plan = buildAbuseControlPlan({
      ruleId: "public-upload-intent",
      routePath: "/api/public/inkroute-demo/secure-upload-intents/../admin",
      tenantId: "tenant_001",
      ipHash: "hash_abc123",
      userAgent: "Vitest bot fixture",
      observedRequests: 3,
      windowSeconds: 3600,
      providerWebhook: false,
      redisConfigured: true,
      botChallengeConfigured: true,
      alertingConfigured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.action).toBe("challenge");
    expect(plan.signals).toEqual(expect.arrayContaining(["suspicious_path", "known_test_fixture"]));
    expect(plan.alert.shouldAlert).toBe(true);
    expect(plan.key).toBe("public-upload-intent:tenant_001:hash_abc123");
  });

  it("allows valid provider webhooks to bypass public bot challenges while blocking invalid signatures", () => {
    const valid = buildAbuseControlPlan({
      ruleId: "provider-webhook",
      routePath: "/api/webhooks/stripe",
      tenantId: "tenant_provider",
      ipHash: "provider_hash",
      userAgent: "Stripe/1.0",
      observedRequests: 500,
      windowSeconds: 60,
      providerWebhook: true,
      providerSignatureValid: true,
      redisConfigured: true,
      botChallengeConfigured: true,
      alertingConfigured: true,
    });
    const invalid = buildAbuseControlPlan({
      ruleId: "provider-webhook",
      routePath: "/api/webhooks/stripe",
      tenantId: "tenant_provider",
      ipHash: "provider_hash",
      userAgent: "unknown",
      observedRequests: 1,
      windowSeconds: 60,
      providerWebhook: true,
      providerSignatureValid: false,
      redisConfigured: true,
      botChallengeConfigured: true,
      alertingConfigured: true,
    });

    expect(valid.action).toBe("provider_bypass");
    expect(valid.providerBypassAllowed).toBe(true);
    expect(valid.signals).toContain("provider_signature_valid");
    expect(invalid.action).toBe("challenge");
    expect(invalid.signals).toContain("provider_signature_missing");
    expect(invalid.alert.shouldAlert).toBe(true);
  });

  it("blocks abuse-control runtime readiness until distributed limiter, middleware, challenge, logs, alerts, and route tests exist", () => {
    const plan = buildAbuseControlRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      distributedLimiterConfigured: false,
      limiterEnvVarsConfigured: false,
      edgeOrMiddlewareWired: false,
      routeFamilyPoliciesApplied: false,
      tenantSafeKeysVerified: false,
      botChallengeProviderConfigured: false,
      botChallengeRouteTestsPassed: false,
      providerWebhookSignatureBypassVerified: false,
      invalidWebhookSignatureChallengeVerified: false,
      privacySafeAbuseLogPersistenceConfigured: false,
      abuseLogRedactionVerified: false,
      alertDeliveryConfigured: false,
      throttlingAlertSmokePassed: false,
      failClosedBehaviorVerified: false,
      publicRouteIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Distributed Redis/Upstash or edge rate limiter must be configured for production routes.",
      "Web/dashboard edge middleware or route middleware must enforce abuse controls before handlers run.",
      "Signed provider webhooks must bypass public bot challenges while retaining signature and replay validation.",
      "Privacy-safe AbuseEvent persistence must record hashed actor keys, tenant, route family, action, and reason.",
      "Alert smoke tests must prove throttling and invalid-signature events reach the configured alert channel.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "live distributed limiter configuration and middleware route-family enforcement proof",
      "privacy-safe hashed abuse keys and redacted AbuseEvent persistence evidence",
      "provider webhook bypass, invalid signature challenge, replay validation, and fail-closed behavior tests",
      "abuse alert delivery smoke and public-route limiter integration tests",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/security/verify-abuse-rate-limits.mjs");
  });

  it("marks abuse-control runtime ready only after limiter, middleware, webhook, logging, alert, and route proofs exist", () => {
    const plan = buildAbuseControlRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      distributedLimiterConfigured: true,
      limiterEnvVarsConfigured: true,
      edgeOrMiddlewareWired: true,
      routeFamilyPoliciesApplied: true,
      tenantSafeKeysVerified: true,
      botChallengeProviderConfigured: true,
      botChallengeRouteTestsPassed: true,
      providerWebhookSignatureBypassVerified: true,
      invalidWebhookSignatureChallengeVerified: true,
      privacySafeAbuseLogPersistenceConfigured: true,
      abuseLogRedactionVerified: true,
      alertDeliveryConfigured: true,
      throttlingAlertSmokePassed: true,
      failClosedBehaviorVerified: true,
      publicRouteIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("enforces security headers with production-only HSTS and provider CSP connect sources", () => {
    const production = buildSecurityRuntimeEnforcementPlan({
      environment: "production",
      httpsEnabled: true,
      appSurface: "web",
      extraConnectSources: ["https://sentry.io", "https://api.stripe.com"],
      cookieAuthenticatedMutation: false,
      method: "GET",
      csrfTokenPresent: false,
      csrfTokenValid: false,
      sameSiteCookie: "lax",
    });
    const preview = buildSecurityRuntimeEnforcementPlan({
      environment: "preview",
      httpsEnabled: false,
      appSurface: "dashboard",
      cookieAuthenticatedMutation: false,
      method: "GET",
      csrfTokenPresent: false,
      csrfTokenValid: false,
      sameSiteCookie: "lax",
    });

    expect(production.status).toBe("ready");
    expect(production.hstsEnabled).toBe(true);
    expect(production.headers.map((header) => header.name)).toContain("Strict-Transport-Security");
    expect(production.headers.find((header) => header.name === "Content-Security-Policy")?.value).toContain("connect-src 'self' https://sentry.io https://api.stripe.com");
    expect(production.testExpectations.join(" ")).toContain("production-only HSTS");
    expect(preview.hstsEnabled).toBe(false);
    expect(preview.headers.map((header) => header.name)).not.toContain("Strict-Transport-Security");
  });

  it("blocks production header enforcement when HTTPS or CSP invariants are not ready", () => {
    const plan = buildSecurityRuntimeEnforcementPlan({
      environment: "production",
      httpsEnabled: false,
      appSurface: "web",
      cookieAuthenticatedMutation: false,
      method: "GET",
      csrfTokenPresent: false,
      csrfTokenValid: false,
      sameSiteCookie: "lax",
    });

    expect(plan.status).toBe("blocked");
    expect(plan.hstsEnabled).toBe(false);
    expect(plan.blockers).toContain("Production HSTS requires HTTPS to be confirmed before enabling preload policy.");
  });

  it("fails CSRF attack simulations for cookie-authenticated mutations", () => {
    const attack = buildSecurityRuntimeEnforcementPlan({
      environment: "production",
      httpsEnabled: true,
      appSurface: "dashboard",
      cookieAuthenticatedMutation: true,
      method: "POST",
      csrfTokenPresent: false,
      csrfTokenValid: false,
      sameSiteCookie: "none",
    });
    const valid = buildSecurityRuntimeEnforcementPlan({
      environment: "production",
      httpsEnabled: true,
      appSurface: "dashboard",
      cookieAuthenticatedMutation: true,
      method: "PATCH",
      csrfTokenPresent: true,
      csrfTokenValid: true,
      sameSiteCookie: "strict",
    });

    expect(attack.status).toBe("blocked");
    expect(attack.csrf).toMatchObject({ required: true, allowed: false });
    expect(attack.blockers).toEqual(
      expect.arrayContaining([
        "Cookie-authenticated mutations require a valid CSRF token and SameSite lax/strict cookie policy.",
        "Cookie-authenticated mutation cookies must not use SameSite=None without a separate explicit review.",
      ]),
    );
    expect(valid.status).toBe("ready");
    expect(valid.csrf).toMatchObject({ required: true, allowed: true });
  });

  it("blocks security middleware runtime readiness until web/dashboard wiring, browser headers, CSP, SameSite, and CSRF route proof exist", () => {
    const plan = buildSecurityMiddlewareRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      webMiddlewareWired: false,
      dashboardMiddlewareWired: false,
      webHeaderBrowserSmokePassed: false,
      dashboardHeaderBrowserSmokePassed: false,
      productionHstsDeploymentVerified: false,
      previewLocalHstsSuppressionVerified: false,
      cspProviderConnectSourcesVerified: false,
      cspFrameBaseFormInvariantsVerified: false,
      csrfCookieMutationAttackTestsPassed: false,
      csrfValidTokenAllowTestsPassed: false,
      sameSiteCookieBehaviorVerified: false,
      csrfSessionBindingVerified: false,
      providerWebhookCsrfBypassReviewed: false,
      routeRuntimeIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Web app middleware or config must apply shared security headers and CSRF enforcement to runtime routes.",
      "Dashboard middleware or config must apply shared security headers and CSRF enforcement to runtime routes.",
      "CSP connect-src must be verified against live Sentry, Stripe, storage, analytics, and API providers.",
      "Cookie-authenticated POST/PATCH/DELETE attack simulations must be rejected without valid CSRF tokens.",
      "Provider webhook CSRF bypass rules must be reviewed so signed callbacks bypass CSRF without weakening public mutations.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "web/dashboard middleware wiring plus runtime route integration tests",
      "browser header smoke tests with production HSTS and preview/local HSTS suppression proof",
      "runtime CSP provider connect-src and frame/base/form invariant verification",
      "CSRF attack/allow simulations, SameSite session behavior, token binding, and signed webhook bypass review",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/security/verify-runtime-security-headers.mjs");
  });

  it("marks security middleware runtime ready only after headers, CSP, HSTS, SameSite, CSRF, and route proofs exist", () => {
    const plan = buildSecurityMiddlewareRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webMiddlewareWired: true,
      dashboardMiddlewareWired: true,
      webHeaderBrowserSmokePassed: true,
      dashboardHeaderBrowserSmokePassed: true,
      productionHstsDeploymentVerified: true,
      previewLocalHstsSuppressionVerified: true,
      cspProviderConnectSourcesVerified: true,
      cspFrameBaseFormInvariantsVerified: true,
      csrfCookieMutationAttackTestsPassed: true,
      csrfValidTokenAllowTestsPassed: true,
      sameSiteCookieBehaviorVerified: true,
      csrfSessionBindingVerified: true,
      providerWebhookCsrfBypassReviewed: true,
      routeRuntimeIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks security automated coverage readiness until package, route, middleware, E2E, CI, DB, and storage suites execute", () => {
    const plan = buildSecurityAutomatedCoverageReadinessPlan({
      packageScripts: ["test"],
      securityPackageTestsPassed: true,
      securityPackageTypecheckPassed: false,
      routeVitestSuitePassed: false,
      middlewareRuntimeSuitePassed: false,
      middlewareStaticSuitePassed: false,
      webE2eSecuritySuitePassed: false,
      dashboardE2eSecuritySuitePassed: false,
      fullUnitSuitePassed: false,
      ciSecurityChecksPassed: false,
      testManifestIncludesSecuritySuites: true,
      dbBackedTenantIsolationTestsPassed: false,
      storageProviderNegativeTestsPassed: false,
      privacyWorkflowIntegrationTestsPassed: false,
      authenticatedRoleBoundaryTestsPassed: false,
      coverageArtifactsCollected: false,
      failureModeFixturesDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "@inkroute/security typecheck must execute and pass.",
      "Security route Vitest suite must pass for secure uploads, privacy requests, dashboard privacy, and trust-status tenant/role denial.",
      "Web Playwright security smoke must pass for headers and cookie-authenticated CSRF rejection.",
      "DB-backed authenticated tenant-isolation tests must pass for privacy, trust, upload, and dashboard boundaries.",
      "Storage provider or emulator negative tests must pass for unsafe upload, private original public denial, signed URL revocation, and derivative exposure.",
      "Coverage, Playwright, CI, and provider/emulator artifacts must be collected for audit handoff.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "executed package typecheck/tests, full unit suite, and CI security check transcript",
      "route, runtime middleware, static wiring, and manifest verification test output",
      "web and dashboard Playwright security smoke artifacts",
      "authenticated DB-backed tenant isolation, role-boundary, and privacy workflow integration output",
      "storage provider negative-test artifacts, coverage bundle, and documented security failure fixtures",
    ]));
    expect(plan.requiredCommands).toContain("pnpm test:unit");
  });

  it("marks security automated coverage ready only after all scaffold, E2E, DB, provider, CI, and artifact evidence exists", () => {
    const plan = buildSecurityAutomatedCoverageReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityPackageTestsPassed: true,
      securityPackageTypecheckPassed: true,
      routeVitestSuitePassed: true,
      middlewareRuntimeSuitePassed: true,
      middlewareStaticSuitePassed: true,
      webE2eSecuritySuitePassed: true,
      dashboardE2eSecuritySuitePassed: true,
      fullUnitSuitePassed: true,
      ciSecurityChecksPassed: true,
      testManifestIncludesSecuritySuites: true,
      dbBackedTenantIsolationTestsPassed: true,
      storageProviderNegativeTestsPassed: true,
      privacyWorkflowIntegrationTestsPassed: true,
      authenticatedRoleBoundaryTestsPassed: true,
      coverageArtifactsCollected: true,
      failureModeFixturesDocumented: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks security app runtime verification until web, dashboard, mobile, route, middleware, browser, and device proof exists", () => {
    const plan = buildSecurityAppRuntimeVerificationPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      webTypecheckPassed: false,
      webBuildPassed: false,
      dashboardTypecheckPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      nextConfigStaticTestsPassed: true,
      mobileSecurityStaticTestsPassed: true,
      webSecurityRoutesSmokePassed: false,
      dashboardSecurityRoutesSmokePassed: false,
      webMiddlewareRuntimeSmokePassed: false,
      dashboardMiddlewareRuntimeSmokePassed: false,
      mobileSystemStatusScreenSmokePassed: false,
      browserRuntimeSmokePassed: false,
      deviceRuntimeSmokePassed: false,
      ciRuntimeEvidenceCollected: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "@inkroute/security typecheck must pass before app runtime verification can close.",
      "Web app typecheck must pass with Phase 13 security imports, routes, pages, and middleware.",
      "Dashboard app build must pass under real Next dependencies with security pages, API routes, and middleware.",
      "Mobile app typecheck must pass with SystemStatus security, tenant-isolation, privacy, and upload preview surfaces.",
      "Browser runtime smoke must prove web/dashboard Phase 13 surfaces load with headers and without integration errors.",
      "Device or emulator smoke must prove mobile Phase 13 security surfaces load without dependency/runtime errors.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "web/dashboard/mobile typecheck and build command output",
      "web/dashboard route and middleware runtime smoke transcripts",
      "browser, mobile device/emulator, and CI runtime artifact bundle",
    ]));
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/mobile typecheck");
  });

  it("marks security app runtime verification ready only after all app dependency, route, middleware, browser, and mobile evidence exists", () => {
    const plan = buildSecurityAppRuntimeVerificationPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webTypecheckPassed: true,
      webBuildPassed: true,
      dashboardTypecheckPassed: true,
      dashboardBuildPassed: true,
      mobileTypecheckPassed: true,
      nextConfigStaticTestsPassed: true,
      mobileSecurityStaticTestsPassed: true,
      webSecurityRoutesSmokePassed: true,
      dashboardSecurityRoutesSmokePassed: true,
      webMiddlewareRuntimeSmokePassed: true,
      dashboardMiddlewareRuntimeSmokePassed: true,
      mobileSystemStatusScreenSmokePassed: true,
      browserRuntimeSmokePassed: true,
      deviceRuntimeSmokePassed: true,
      ciRuntimeEvidenceCollected: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
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

  it("dry-runs retention enforcement across sensitive categories and blocks without workers and backup policy", () => {
    const plan = buildRetentionEnforcementDryRun({
      records: [
        { id: "client_old", category: "client_profile", ageDays: 10000 },
        { id: "reference_due", category: "reference_file", ageDays: 10000 },
        { id: "consent_hold", category: "consent_signature", ageDays: 2000 },
        { id: "payment_due", category: "payment_record", ageDays: 3000 },
        { id: "audit_indefinite", category: "audit_log", ageDays: 3000 },
      ],
      legalReviewApproved: false,
      databaseWorkerConfigured: false,
      storageWorkerConfigured: false,
      auditLogConfigured: false,
      backupPolicyDocumented: false,
      restorePolicyDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.canExecute).toBe(false);
    expect(plan.blockers).toEqual(
      expect.arrayContaining([
        "Attorney-approved retention schedule is required before automated retention enforcement.",
        "Database retention worker must be configured before deleting/anonymizing records.",
        "Storage retention worker must be configured before deleting private files.",
        "Backup retention implications must be documented before destructive enforcement.",
        "Restore policy must document how deleted/anonymized records remain deleted after backup restore.",
      ]),
    );
    expect(plan.steps.map((step) => [step.recordId, step.action, step.blocked])).toEqual([
      ["client_old", "anonymize", true],
      ["reference_due", "delete", true],
      ["consent_hold", "retain_legal_hold", false],
      ["payment_due", "retain_legal_hold", false],
      ["audit_indefinite", "retain_legal_hold", false],
    ]);
    expect(plan.backupRestorePolicy.implication).toContain("tombstones");
  });

  it("allows reviewed retention dry-runs and emits audit events for due deletion/anonymization steps", () => {
    const plan = buildRetentionEnforcementDryRun({
      records: [
        { id: "message_due", category: "message", ageDays: 1200 },
        { id: "error_recent", category: "error_report", ageDays: 10 },
        { id: "notification_due", category: "message", ageDays: 1400 },
      ],
      legalReviewApproved: true,
      databaseWorkerConfigured: true,
      storageWorkerConfigured: true,
      auditLogConfigured: true,
      backupPolicyDocumented: true,
      restorePolicyDocumented: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.canExecute).toBe(true);
    expect(plan.steps.map((step) => [step.recordId, step.action, step.due])).toEqual([
      ["message_due", "anonymize", true],
      ["error_recent", "retain_until_due", false],
      ["notification_due", "anonymize", true],
    ]);
    expect(plan.requiredAuditEvents).toEqual([
      "retention:message:anonymize:message_due",
      "retention:message:anonymize:notification_due",
    ]);
    expect(plan.requiredWorkers).toContain("backup-restore-reconciliation");
  });

  it("blocks privacy request runtime readiness until identity, tenant proofing, workers, notifications, and audit evidence exist", () => {
    const plan = buildPrivacyRequestRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      publicRouteTestsPassed: true,
      dashboardRouteTestsPassed: false,
      privacyCasePersistenceConfigured: false,
      identityProofingConfigured: false,
      tenantRelationshipProofingConfigured: false,
      requesterMismatchDenied: false,
      exportWorkerConfigured: false,
      deleteAnonymizeRectifyWorkersConfigured: false,
      storageExportDeleteConfigured: false,
      thirdPartyRedactionConfigured: false,
      legalHoldHandlingConfigured: false,
      notificationProviderConfigured: false,
      notificationTemplatesApproved: false,
      auditLogPersistenceConfigured: false,
      statusTransitionPersistenceConfigured: false,
      tenantIsolationIntegrationTestsPassed: false,
      postgresStorageIntegrationTestsPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Run and pass @inkroute/security typecheck before marking privacy requests ready.",
      "Dashboard privacy request route tests must pass for tenant scope, role denial, redaction, and persistence.",
      "PrivacyRequest case persistence must store requester, tenant, type, status, identity proof, due dates, and fulfillment metadata.",
      "Requester identity and tenant mismatch denial tests must pass before production execution.",
      "Exports must redact third-party artist/client/payment/provider data before delivery.",
      "Tenant-isolation integration tests must deny cross-tenant privacy exports and deletions.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "persisted PrivacyRequest status transitions and AuditLog records",
      "identity, tenant relationship, requester mismatch, and cross-tenant denial proof",
      "Postgres and object-storage export/delete/anonymize worker integration output",
      "approved notification templates and provider delivery transcript",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/privacy/verify-privacy-request-workers.mjs");
  });

  it("marks privacy request runtime ready only after workflow, worker, notification, and integration proofs exist", () => {
    const plan = buildPrivacyRequestRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      publicRouteTestsPassed: true,
      dashboardRouteTestsPassed: true,
      privacyCasePersistenceConfigured: true,
      identityProofingConfigured: true,
      tenantRelationshipProofingConfigured: true,
      requesterMismatchDenied: true,
      exportWorkerConfigured: true,
      deleteAnonymizeRectifyWorkersConfigured: true,
      storageExportDeleteConfigured: true,
      thirdPartyRedactionConfigured: true,
      legalHoldHandlingConfigured: true,
      notificationProviderConfigured: true,
      notificationTemplatesApproved: true,
      auditLogPersistenceConfigured: true,
      statusTransitionPersistenceConfigured: true,
      tenantIsolationIntegrationTestsPassed: true,
      postgresStorageIntegrationTestsPassed: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks retention enforcement runtime readiness until scheduled workers, tombstones, restore replay, and DB/storage execution are proven", () => {
    const plan = buildRetentionEnforcementRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      attorneyRetentionScheduleApproved: false,
      scheduledWorkerConfigured: false,
      workerIdempotencyConfigured: false,
      postgresRetentionExecutionVerified: false,
      objectStorageRetentionExecutionVerified: false,
      exportArtifactGenerationVerified: false,
      deletionTombstonePersistenceConfigured: false,
      anonymizationTombstonePersistenceConfigured: false,
      restoreTombstoneReplayVerified: false,
      backupRetentionPolicyDocumented: false,
      legalHoldEnforcementVerified: false,
      auditLogPersistenceConfigured: false,
      tenantIsolationIntegrationTestsPassed: false,
      dryRunToExecutionReconciliationVerified: false,
      destructiveActionRollbackDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Attorney-approved retention, deletion, anonymization, export, and legal-hold schedule must be recorded.",
      "Scheduled retention worker must execute due DB and storage actions on an approved cadence.",
      "Deletion tombstones must persist tenant, record, category, action, reason, timestamp, and worker run identifiers.",
      "Restore jobs must replay deletion and anonymization tombstones before restored data becomes queryable.",
      "Tenant-isolation integration tests must deny cross-tenant retention, export, deletion, and restore actions.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "attorney-approved retention schedule and legal-hold enforcement transcript",
      "scheduled idempotent worker run with dry-run-to-execution reconciliation",
      "deletion/anonymization tombstone persistence plus backup restore replay drill",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/privacy/execute-retention-workers.mjs");
  });

  it("marks retention enforcement runtime ready only after destructive-action, tombstone, export, and restore proofs exist", () => {
    const plan = buildRetentionEnforcementRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      attorneyRetentionScheduleApproved: true,
      scheduledWorkerConfigured: true,
      workerIdempotencyConfigured: true,
      postgresRetentionExecutionVerified: true,
      objectStorageRetentionExecutionVerified: true,
      exportArtifactGenerationVerified: true,
      deletionTombstonePersistenceConfigured: true,
      anonymizationTombstonePersistenceConfigured: true,
      restoreTombstoneReplayVerified: true,
      backupRetentionPolicyDocumented: true,
      legalHoldEnforcementVerified: true,
      auditLogPersistenceConfigured: true,
      tenantIsolationIntegrationTestsPassed: true,
      dryRunToExecutionReconciliationVerified: true,
      destructiveActionRollbackDocumented: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks privacy retention runtime readiness without legal, worker, storage, and backup evidence", () => {
    const plan = buildPrivacyRetentionRuntimeReadinessPlan({
      packageScripts: ["test"],
      packageTestsPassed: true,
      packageTypecheckPassed: false,
      attorneyApprovalRecorded: false,
      privacyCaseStoreConfigured: false,
      auditLogPersistenceConfigured: false,
      identityVerificationWorkerConfigured: true,
      exportWorkerConfigured: false,
      deleteAnonymizeWorkerConfigured: false,
      storageDeletionConfigured: false,
      retentionScheduleApproved: false,
      prismaExecutionVerified: false,
      objectStorageExecutionVerified: false,
      legalHoldWorkflowConfigured: false,
      backupRestorePolicyDocumented: false,
      restoreTombstoneReplayVerified: false,
      tenantIsolationVerified: false,
      notificationCopyApproved: false,
      dryRunEvidenceCollected: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/security test -- privacy-workers");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "attorney-approved privacy retention and deletion schedule",
      "Prisma and object-storage export/delete/anonymization dry-run output",
      "backup/restore tombstone replay policy and drill evidence",
    ]));
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Object storage deletion must be configured for private reference, consent, document, and follow-up files.",
      "Restore jobs must replay deletion/anonymization tombstones before restored data becomes queryable.",
      "Privacy workers must verify tenant isolation for cross-tenant export/delete attempts.",
    ]));
  });

  it("blocks privacy retention dry-run evidence until workers, legal approval, storage, tombstones, CI, and redaction are proven", () => {
    const plan = buildPrivacyRetentionDryRunEvidencePlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      attorneyApprovalCaptured: false,
      identityVerificationWorkerIntegrated: true,
      exportWorkerPersisted: false,
      deleteAnonymizeWorkerPersisted: false,
      caseAuditPersistenceConfigured: false,
      prismaDryRunPassed: false,
      objectStorageDryRunPassed: false,
      tenantIsolationDryRunPassed: false,
      legalHoldEnforced: false,
      notificationTemplatesApproved: false,
      backupRestoreTombstoneReplayPassed: false,
      retentionReportCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "privacy request worker integration tests",
      "Prisma privacy delete/anonymize dry run",
      "object storage deletion dry run",
      "backup/restore tombstone replay drill",
    ]));
    expect(plan.requiredControls).toContain("Keep all evidence artifacts redacted, secret-safe, and free of client PII or medical details.");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "attorney approval packet for retention schedule, legal holds, destructive actions, and notification templates",
      "persisted identity, export, delete/anonymize, PrivacyRequest/PrivacyCase, tombstone, and AuditLog worker output",
      "Prisma, object-storage, tenant-isolation, and legal-hold privacy dry-run transcripts",
      "backup/restore tombstone replay drill output",
      "redacted CI artifact bundle with retention report and no secrets or client PII",
    ]));
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Delete/anonymize worker dry-runs must persist tombstones, skipped legal holds, and audit events.",
      "Tenant-isolation privacy dry-run must deny cross-tenant export/delete attempts.",
      "Privacy retention artifacts must be redacted and free of secrets, client PII, medical notes, and provider tokens.",
    ]));
  });

  it("marks privacy retention dry-run evidence ready when legal, workers, storage, tombstones, CI, and redaction align", () => {
    const plan = buildPrivacyRetentionDryRunEvidencePlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      attorneyApprovalCaptured: true,
      identityVerificationWorkerIntegrated: true,
      exportWorkerPersisted: true,
      deleteAnonymizeWorkerPersisted: true,
      caseAuditPersistenceConfigured: true,
      prismaDryRunPassed: true,
      objectStorageDryRunPassed: true,
      tenantIsolationDryRunPassed: true,
      legalHoldEnforced: true,
      notificationTemplatesApproved: true,
      backupRestoreTombstoneReplayPassed: true,
      retentionReportCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks legal review packets until every topic has attorney approval, versions, and acceptance audits", () => {
    const plan = buildLegalReviewPacketPlan({
      approvals: [
        { topic: "privacy_policy", approved: true, reviewedBy: "Counsel", reviewedAt: "2026-06-08", documentVersion: "privacy-v1" },
        { topic: "terms_of_service", approved: false },
      ],
      jurisdiction: "US-WA",
      noindexProtectionEnabled: true,
      acceptanceAuditConfigured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredTopics).toContain("tattoo_consent");
    expect(plan.missingTopics).toEqual(expect.arrayContaining(["terms_of_service", "tattoo_consent", "sms_opt_in_stop_help", "jurisdiction_studio_policy"]));
    expect(plan.productionBlockedActions).toContain("Collect consent signatures");
    expect(plan.pageProtections).toEqual({ noindexRequired: true, placeholdersMustRemain: true });
    expect(plan.acceptanceAudit.requiredFields).toContain("documentVersion");
  });

  it("approves legal review packets only after all required topics and consent audit tracking are versioned", () => {
    const approvals = [
      "privacy_policy",
      "terms_of_service",
      "tattoo_consent",
      "medical_safety_acknowledgment",
      "sms_opt_in_stop_help",
      "aftercare",
      "deposits_no_shows_refunds",
      "taxes",
      "liability",
      "saas_terms",
      "jurisdiction_studio_policy",
    ].map((topic) => ({
      topic: topic as Parameters<typeof buildLegalReviewPacketPlan>[0]["approvals"][number]["topic"],
      approved: true,
      reviewedBy: "Counsel",
      reviewedAt: "2026-06-08",
      documentVersion: `${topic}-v1`,
    }));
    const plan = buildLegalReviewPacketPlan({
      approvals,
      jurisdiction: "US-WA",
      studioPolicyVersion: "studio-us-wa-v1",
      consentVersion: "consent-us-wa-v1",
      noindexProtectionEnabled: false,
      acceptanceAuditConfigured: true,
    });

    expect(plan.status).toBe("approved");
    expect(plan.missingTopics).toEqual([]);
    expect(plan.productionBlockedActions).toEqual([]);
    expect(plan.pageProtections.noindexRequired).toBe(false);
    expect(plan.acceptanceAudit).toMatchObject({ configured: true, consentVersion: "consent-us-wa-v1" });
    expect(plan.approvedVersions.privacy_policy).toBe("privacy_policy-v1");
  });

  it("blocks legal document production readiness until counsel approval, reviewed copy, versioning, audits, and noindex proof exist", () => {
    const plan = buildLegalDocumentProductionReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      attorneyApprovalsRecorded: false,
      allRequiredTopicsApproved: false,
      jurisdictionPoliciesApproved: false,
      reviewedPublicPageCopyCommitted: false,
      placeholderCopyRemoved: false,
      noindexRemovedAfterApproval: false,
      consentVersionPersistenceConfigured: false,
      studioPolicyVersionPersistenceConfigured: false,
      acceptanceAuditPersistenceConfigured: false,
      dashboardAcceptanceUiWired: false,
      publicPageRouteSmokePassed: false,
      consentAcceptanceRouteTestsPassed: false,
      rollbackPlanDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.blockers).toEqual(expect.arrayContaining([
      "Qualified attorney approval metadata must be recorded for every production legal document.",
      "Placeholder and non-attorney-reviewed copy must be removed from public pages before launch.",
      "Noindex must stay in place until attorney approval and reviewed copy are committed, then removal must be verified.",
      "Acceptance audit persistence must record user, tenant, document, version, IP hash, user agent, timestamp, and source surface.",
      "Consent acceptance route tests must prove versioned persistence and audit-log writes.",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "attorney approval records for all required legal topics and jurisdiction policies",
      "reviewed public legal pages with placeholder removal and approved indexing smoke evidence",
      "versioned consent/studio policy persistence plus acceptance audit route tests",
      "dashboard acceptance UI proof and legal-copy rollback plan",
    ]));
    expect(plan.requiredCommands).toContain("node scripts/legal/verify-approved-legal-pages.mjs");
  });

  it("marks legal documents production-ready only after reviewed copy, approvals, audits, routes, and rollback proof exist", () => {
    const plan = buildLegalDocumentProductionReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      attorneyApprovalsRecorded: true,
      allRequiredTopicsApproved: true,
      jurisdictionPoliciesApproved: true,
      reviewedPublicPageCopyCommitted: true,
      placeholderCopyRemoved: true,
      noindexRemovedAfterApproval: true,
      consentVersionPersistenceConfigured: true,
      studioPolicyVersionPersistenceConfigured: true,
      acceptanceAuditPersistenceConfigured: true,
      dashboardAcceptanceUiWired: true,
      publicPageRouteSmokePassed: true,
      consentAcceptanceRouteTestsPassed: true,
      rollbackPlanDocumented: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
  });

  it("blocks payment policy legal readiness until attorney, tax, approved copy, audit, and E2E evidence exist", () => {
    const plan = buildPaymentPolicyLegalReviewRuntimeReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      webTypecheckPassed: false,
      dashboardTypecheckPassed: false,
      attorneyApprovalRecorded: false,
      taxAccountingApprovalRecorded: false,
      reviewedPaymentCopyCommitted: true,
      reviewedCancellationCopyCommitted: false,
      reviewedNoShowCopyCommitted: false,
      reviewedRefundCopyCommitted: false,
      reviewedSmsConsentCopyCommitted: false,
      reviewedReceiptCopyCommitted: false,
      reviewedTaxDisclosureCopyCommitted: false,
      termsPrivacyConsentUpdated: false,
      placeholdersRemovedFromPaymentFlows: false,
      acceptanceAuditConfigured: false,
      policyVersioningConfigured: false,
      e2eApprovedLanguageVerified: false,
      rollbackCopyPlanDocumented: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toEqual(expect.arrayContaining([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/dashboard typecheck",
      "payment policy approved-copy E2E sweep",
      "legal/tax approval packet review",
    ]));
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "signed attorney and tax/accounting approval records for payment policy language",
      "committed reviewed copy for deposits, cancellation, no-show, refund, SMS, receipts, and tax disclosures",
      "versioned Terms/Privacy/Consent/studio policy updates plus acceptance audit evidence",
      "E2E screenshots or test output proving approved copy appears in booking, dashboard payment, receipt, and SMS flows",
      "documented policy-copy correction and rollback plan",
    ]));
    expect(plan.blockers).toContain("Attorney approval must be recorded for payment, cancellation, no-show, refund, SMS, receipt, and liability language.");
    expect(plan.blockers).toContain("Tax/accounting approval must be recorded for receipt and accounting export language.");
    expect(plan.blockers).toContain("Demo/planning placeholders must be removed from payment-facing flows before launch.");
  });

  it("blocks provider storage upload readiness until buckets, signed URLs, scans, derivatives, persistence, CI, and artifacts are proven", () => {
    const plan = buildProviderStorageUploadReadinessPlan({
      packageScripts: ["test"],
      securityTestsPassed: true,
      securityTypecheckPassed: false,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: false,
      storageProviderSelected: false,
      storageProviderConfigured: false,
      storageSecretsConfigured: false,
      privateBucketAclVerified: false,
      derivativeBucketPolicyVerified: false,
      signedUploadUrlsProviderBacked: false,
      signedDownloadUrlsProviderBacked: false,
      serverOwnedObjectKeysEnforced: true,
      fileAssetPersistenceTransactional: false,
      auditLogPersistenceConfigured: false,
      linkTablePersistenceConfigured: false,
      signedUrlGrantPersistenceConfigured: false,
      malwareScanProviderConfigured: false,
      scanVerdictPersistenceConfigured: false,
      metadataStrippingWorkerConfigured: false,
      publicDerivativeGenerationConfigured: false,
      privateOriginalPublicReadDenied: false,
      approvedDerivativePublicReadVerified: false,
      tenantScopedProviderIntegrationTestsPassed: false,
      privacyRetentionEnforced: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toContain("object storage provider upload/download integration tests");
    expect(plan.requiredEvidence).toEqual(expect.arrayContaining([
      "storage provider selection plus redacted provider configuration evidence",
      "private bucket ACL and derivative-publication policy proof",
      "provider-backed signed upload/download URL evidence with persisted grant expiry and revocation",
      "transactional FileAsset, AuditLog, and related link-row persistence evidence",
      "malware scan, MIME verification, metadata stripping, and derivative generation evidence",
      "tenant-isolated provider integration, retention, CI, and secret-safe artifact evidence",
    ]));
    expect(plan.blockers).toContain("Supabase Storage, S3, or equivalent object storage provider must be selected.");
    expect(plan.blockers).toContain("Provider integration tests must prove private originals cannot be publicly fetched.");
    expect(plan.blockers).toContain("Storage artifacts must be redacted and free of provider secrets or client-private files.");
  });

  it("marks provider storage upload readiness ready when provider, scans, persistence, derivatives, tests, CI, and artifacts align", () => {
    const plan = buildProviderStorageUploadReadinessPlan({
      packageScripts: ["test", "typecheck"],
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: true,
      storageProviderSelected: true,
      storageProviderConfigured: true,
      storageSecretsConfigured: true,
      privateBucketAclVerified: true,
      derivativeBucketPolicyVerified: true,
      signedUploadUrlsProviderBacked: true,
      signedDownloadUrlsProviderBacked: true,
      serverOwnedObjectKeysEnforced: true,
      fileAssetPersistenceTransactional: true,
      auditLogPersistenceConfigured: true,
      linkTablePersistenceConfigured: true,
      signedUrlGrantPersistenceConfigured: true,
      malwareScanProviderConfigured: true,
      scanVerdictPersistenceConfigured: true,
      metadataStrippingWorkerConfigured: true,
      publicDerivativeGenerationConfigured: true,
      privateOriginalPublicReadDenied: true,
      approvedDerivativePublicReadVerified: true,
      tenantScopedProviderIntegrationTestsPassed: true,
      privacyRetentionEnforced: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.requiredEvidence).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
