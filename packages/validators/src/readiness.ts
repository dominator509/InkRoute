export interface ValidatorRuntimeReadinessInput {
  packageScripts: readonly string[];
  packageTypecheckPassed: boolean;
  packageTestsPassed: boolean;
  bookingSchemasCovered: boolean;
  travelSchemasCovered: boolean;
  portfolioSchemasCovered: boolean;
  paymentSchemasCovered: boolean;
  peopleSchemasCovered: boolean;
  seoSchemasCovered: boolean;
  consentSchemasCovered: boolean;
  releaseSchemasCovered: boolean;
  messagingSchemasCovered: boolean;
  observabilitySchemasCovered: boolean;
  tenantAuthEdgeCasesCovered: boolean;
  formEdgeCasesCovered: boolean;
  apiRoutesUseSharedValidators: boolean;
  sensitiveFieldPoliciesAligned: boolean;
}

export interface ValidatorRuntimeReadinessPlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  blockers: readonly string[];
}

export interface ValidatorLaunchAdoptionEvidenceInput {
  packageScripts: readonly string[];
  validatorsTypecheckPassed: boolean;
  validatorsTestsPassed: boolean;
  bookingTravelPortfolioPaymentCovered: boolean;
  peopleConsentFormsSeoCovered: boolean;
  messagingObservabilityReleaseCovered: boolean;
  tenancyAuthEdgeCasesCovered: boolean;
  dynamicFormEdgeCasesCovered: boolean;
  publicRoutesUseSharedSchemas: boolean;
  dashboardRoutesUseSharedSchemas: boolean;
  webhookRoutesUseSharedSchemas: boolean;
  providerPayloadRoutesUseSharedSchemas: boolean;
  malformedPayloadRouteTestsPassed: boolean;
  tenantScopeRouteTestsPassed: boolean;
  sensitiveFieldsSecurityAligned: boolean;
  redactionEncryptionPolicyTestsPassed: boolean;
  ciEvidenceCaptured: boolean;
  secretSafeArtifactsCaptured: boolean;
}

export interface ValidatorLaunchAdoptionEvidencePlan {
  status: "ready" | "blocked";
  missingScripts: readonly string[];
  requiredCommands: readonly string[];
  requiredEvidence: readonly string[];
  requiredControls: readonly string[];
  blockers: readonly string[];
}

export function buildValidatorRuntimeReadinessPlan(input: ValidatorRuntimeReadinessInput): ValidatorRuntimeReadinessPlan {
  const requiredScripts = ["typecheck", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/validators ${script} script.`);
  if (!input.packageTypecheckPassed) blockers.push("Validator package typecheck must pass in an installed workspace.");
  if (!input.packageTestsPassed) blockers.push("Validator package Vitest suite must pass in an installed workspace.");
  if (!input.bookingSchemasCovered) blockers.push("Booking request, appointment, status, budget, and policy acceptance schemas need happy/error coverage.");
  if (!input.travelSchemasCovered) blockers.push("Travel city, schedule, availability, timezone, and date-window schemas need happy/error coverage.");
  if (!input.portfolioSchemasCovered) blockers.push("Portfolio item, image, file asset, style, alt text, and media schemas need happy/error coverage.");
  if (!input.paymentSchemasCovered) blockers.push("Deposit, payment, refund, no-show, Stripe webhook, amount, currency, and URL schemas need happy/error coverage.");
  if (!input.peopleSchemasCovered) blockers.push("Artist, studio, client, client profile, contact, and encrypted profile schemas need happy/error coverage.");
  if (!input.seoSchemasCovered) blockers.push("SEO city/style/review schemas need slug, canonical, title, and meta-description edge coverage.");
  if (!input.consentSchemasCovered) blockers.push("Consent form, signature, medical acknowledgment, and legal-copy length schemas need happy/error coverage.");
  if (!input.releaseSchemasCovered) blockers.push("Release, feature flag, channel normalization, and deployment mutation schemas need happy/error coverage.");
  if (!input.messagingSchemasCovered) blockers.push("Message, notification, consent, preview, and provider webhook schemas need happy/error coverage.");
  if (!input.observabilitySchemasCovered) blockers.push("Error report and filter schemas need source/runtime/environment/tag/metadata edge coverage.");
  if (!input.tenantAuthEdgeCasesCovered) blockers.push("Tenant, role, custom permission, auth mutation, and cross-tenant edge cases must be covered.");
  if (!input.formEdgeCasesCovered) blockers.push("Intake form/question/response schemas need required/options/answer-shape edge coverage.");
  if (!input.apiRoutesUseSharedValidators) blockers.push("Public, dashboard, webhook, release, privacy, upload, payment, notification, and observability routes must use shared validator schemas.");
  if (!input.sensitiveFieldPoliciesAligned) blockers.push("Validator accepted sensitive fields must align with security redaction/encryption policies.");

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/validators typecheck",
      "pnpm --filter @inkroute/validators test",
      "pnpm test:unit -- packages/validators/tests/schemas.test.ts",
      "route contract tests proving shared validators reject malformed public/dashboard/provider payloads",
      "security contract tests proving sensitive accepted fields are redacted or encryption-gated before persistence",
    ],
    requiredEvidence: [
      "Installed-workspace typecheck output for @inkroute/validators.",
      "Package-level Vitest output covering happy/error paths for every exported schema module.",
      "Route contract tests showing API handlers import and use shared schemas instead of ad-hoc parsing.",
      "Tenant/auth/form edge-case fixtures for missing tenant scope, unauthorized role, malformed permissions, and invalid dynamic form answers.",
      "Sensitive-field alignment evidence linking accepted medical, consent, contact, payment, webhook, and metadata fields to security policies.",
    ],
    blockers,
  };
}

export function buildValidatorLaunchAdoptionEvidencePlan(
  input: ValidatorLaunchAdoptionEvidenceInput,
): ValidatorLaunchAdoptionEvidencePlan {
  const requiredScripts = ["typecheck", "test"];
  const missingScripts = requiredScripts.filter((script) => !input.packageScripts.includes(script));
  const blockers: string[] = [];
  const requiredEvidence: string[] = [];

  for (const script of missingScripts) blockers.push(`Missing @inkroute/validators ${script} script.`);
  if (!input.validatorsTypecheckPassed) blockers.push("@inkroute/validators typecheck must pass before validator launch adoption is ready.");
  if (!input.validatorsTestsPassed) blockers.push("@inkroute/validators tests must pass before validator launch adoption is ready.");
  if (!input.bookingTravelPortfolioPaymentCovered) blockers.push("Booking, travel, portfolio, and payment schemas must have happy/error coverage.");
  if (!input.peopleConsentFormsSeoCovered) blockers.push("People, consent, form, and SEO schemas must have happy/error coverage.");
  if (!input.messagingObservabilityReleaseCovered) blockers.push("Messaging, observability, release, and deployment schemas must have happy/error coverage.");
  if (!input.tenancyAuthEdgeCasesCovered) blockers.push("Tenancy, auth, role, permission, and cross-tenant edge cases must be covered.");
  if (!input.dynamicFormEdgeCasesCovered) blockers.push("Dynamic intake form/question/answer edge cases must be covered.");
  if (!input.publicRoutesUseSharedSchemas) blockers.push("Public API routes must use shared validator schemas.");
  if (!input.dashboardRoutesUseSharedSchemas) blockers.push("Dashboard API routes must use shared validator schemas.");
  if (!input.webhookRoutesUseSharedSchemas) blockers.push("Webhook routes must use shared validator schemas before side effects.");
  if (!input.providerPayloadRoutesUseSharedSchemas) blockers.push("Provider payload routes must validate and normalize provider envelopes with shared schemas.");
  if (!input.malformedPayloadRouteTestsPassed) blockers.push("Route contract tests must prove malformed payloads are rejected consistently.");
  if (!input.tenantScopeRouteTestsPassed) blockers.push("Route contract tests must prove tenant/auth scope validation rejects unsafe requests.");
  if (!input.sensitiveFieldsSecurityAligned) blockers.push("Accepted sensitive fields must align with redaction and encryption-gate policy.");
  if (!input.redactionEncryptionPolicyTestsPassed) blockers.push("Security contract tests must prove accepted sensitive fields are redacted or encryption-gated before persistence.");
  if (!input.ciEvidenceCaptured) blockers.push("Validator launch CI evidence must be captured.");
  if (!input.secretSafeArtifactsCaptured) blockers.push("Validator test artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");

  if (!input.validatorsTypecheckPassed || !input.validatorsTestsPassed) {
    requiredEvidence.push("validator package typecheck and test command evidence");
  }
  if (!input.bookingTravelPortfolioPaymentCovered || !input.peopleConsentFormsSeoCovered || !input.messagingObservabilityReleaseCovered || !input.tenancyAuthEdgeCasesCovered || !input.dynamicFormEdgeCasesCovered) {
    requiredEvidence.push("schema-domain happy/error and tenant/auth/form edge-case coverage evidence");
  }
  if (!input.publicRoutesUseSharedSchemas || !input.dashboardRoutesUseSharedSchemas || !input.webhookRoutesUseSharedSchemas || !input.providerPayloadRoutesUseSharedSchemas) {
    requiredEvidence.push("public, dashboard, webhook, and provider route shared-schema adoption evidence");
  }
  if (!input.malformedPayloadRouteTestsPassed || !input.tenantScopeRouteTestsPassed) {
    requiredEvidence.push("malformed-payload and tenant-scope route contract evidence");
  }
  if (!input.sensitiveFieldsSecurityAligned || !input.redactionEncryptionPolicyTestsPassed) {
    requiredEvidence.push("sensitive-field redaction and encryption-gate security evidence");
  }
  if (!input.ciEvidenceCaptured || !input.secretSafeArtifactsCaptured) {
    requiredEvidence.push("CI validator launch evidence and secret-safe artifact proof");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingScripts,
    requiredCommands: [
      "pnpm --filter @inkroute/validators typecheck",
      "pnpm --filter @inkroute/validators test",
      "validator route adoption static scan",
      "public/dashboard malformed payload route tests",
      "webhook/provider payload normalization route tests",
      "tenant/auth scope validator route tests",
      "sensitive-field redaction/encryption contract tests",
      "GitHub Actions validator launch evidence job",
    ],
    requiredEvidence,
    requiredControls: [
      "Reject malformed public, dashboard, webhook, provider, and mobile payloads before side effects.",
      "Keep tenant, role, permission, and cross-tenant validation centralized in shared schemas.",
      "Align accepted medical, consent, contact, payment, provider, and metadata fields with redaction/encryption policy before persistence.",
      "Publish only redacted validator reports and route test artifacts.",
    ],
    blockers,
  };
}
