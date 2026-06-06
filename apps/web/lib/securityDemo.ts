import {
  buildPrivacyRequestDraft,
  buildSecurityHeaderPlan,
  buildTrustCenterChecklist,
  legalDocumentPlaceholders,
  rateLimitRules,
  sensitiveFieldPolicies,
  summarizeSecurityPosture,
  uploadPolicies,
} from "@inkroute/security";

export const publicTrustControls = buildTrustCenterChecklist();
export const publicTrustSummary = summarizeSecurityPosture(publicTrustControls);
export const publicLegalDocuments = legalDocumentPlaceholders;
export const publicSensitiveFieldPolicies = sensitiveFieldPolicies;
export const publicUploadPolicies = uploadPolicies;
export const publicRateLimitRules = rateLimitRules.filter((rule) => rule.routePattern.includes("/api/public"));
export const publicSecurityHeaderDrafts = buildSecurityHeaderPlan();
export const publicPrivacyRequestDrafts = [buildPrivacyRequestDraft("access"), buildPrivacyRequestDraft("export"), buildPrivacyRequestDraft("deletion")];
