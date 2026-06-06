import {
  buildPrivacyRequestDraft,
  buildSecurityHeaderPlan,
  buildTenantIsolationFixtures,
  buildTrustCenterChecklist,
  csrfControlPlans,
  legalDocumentPlaceholders,
  rateLimitRules,
  redactRecord,
  sensitiveFieldPolicies,
  summarizeSecurityPosture,
  validateUploadDraft,
} from "@inkroute/security";

export const dashboardSecurityControls = buildTrustCenterChecklist();
export const dashboardSecuritySummary = summarizeSecurityPosture(dashboardSecurityControls);
export const dashboardSensitiveFieldPolicies = sensitiveFieldPolicies;
export const dashboardUploadChecks = [
  validateUploadDraft({ kind: "reference_private", filename: "client-rib-reference.jpg", mimeType: "image/jpeg", sizeBytes: 842_000, declaredByAuthenticatedUser: false }),
  validateUploadDraft({ kind: "consent_signature", filename: "signature.png", mimeType: "image/png", sizeBytes: 180_000, declaredByAuthenticatedUser: true }),
  validateUploadDraft({ kind: "portfolio_public", filename: "flash-drop.jpg.php", mimeType: "image/jpeg", sizeBytes: 540_000, declaredByAuthenticatedUser: true }),
];
export const dashboardTenantIsolationFixtures = buildTenantIsolationFixtures();
export const dashboardRateLimitRules = rateLimitRules;
export const dashboardCsrfPlans = csrfControlPlans;
export const dashboardSecurityHeaders = buildSecurityHeaderPlan(["https://*.ingest.sentry.io", "https://api.stripe.com"]);
export const dashboardLegalDocuments = legalDocumentPlaceholders;
export const dashboardPrivacyDrafts = [
  buildPrivacyRequestDraft("access"),
  buildPrivacyRequestDraft("export"),
  buildPrivacyRequestDraft("deletion"),
];
export const dashboardRedactionPreview = redactRecord({
  clientName: "Ari Mendez",
  clientEmail: "ari.mendez@example.com",
  phone: "+1 (503) 555-0199",
  medicalNotesEncrypted: "allergy and skin notes",
  referenceImageUrl: "https://storage.example/private/ref.jpg?signature=secret",
  stripePaymentIntentId: "pi_3O_fake_secret_reference",
  route: "/booking",
});
