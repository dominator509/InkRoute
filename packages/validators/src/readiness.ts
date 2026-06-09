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
