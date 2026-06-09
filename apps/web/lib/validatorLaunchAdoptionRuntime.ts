import { buildValidatorLaunchAdoptionEvidencePlan } from "@inkroute/validators";

export type ValidatorLaunchAdoptionRuntimeStatus =
  | "wired"
  | "schema-gated"
  | "route-gated"
  | "security-gated"
  | "ci-gated";

export interface ValidatorLaunchAdoptionRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ValidatorLaunchAdoptionRuntimeStatus;
}


export interface ValidatorLaunchAdoptionRunPersistenceContract {
  readonly prismaModel: "ValidatorLaunchAdoptionRun";
  readonly tenantRelation: "validatorLaunchAdoptionRuns";
  readonly migration: "20260609034300_add_validator_launch_adoption_runs";
  readonly storesRunId: true;
  readonly storesCommitSha: true;
  readonly storesReadinessStatus: true;
  readonly storesCommandMatrix: true;
  readonly storesArtifactManifest: true;
  readonly storesSchemaDomainEvidence: true;
  readonly storesRouteAdoptionEvidence: true;
  readonly storesMalformedPayloadEvidence: true;
  readonly storesTenantScopeEvidence: true;
  readonly storesSensitiveFieldEvidence: true;
  readonly storesCiEvidence: true;
  readonly storesSecretSafeArtifacts: true;
}

export const validatorLaunchAdoptionRunPersistenceContract = {
  prismaModel: "ValidatorLaunchAdoptionRun",
  tenantRelation: "validatorLaunchAdoptionRuns",
  migration: "20260609034300_add_validator_launch_adoption_runs",
  storesRunId: true,
  storesCommitSha: true,
  storesReadinessStatus: true,
  storesCommandMatrix: true,
  storesArtifactManifest: true,
  storesSchemaDomainEvidence: true,
  storesRouteAdoptionEvidence: true,
  storesMalformedPayloadEvidence: true,
  storesTenantScopeEvidence: true,
  storesSensitiveFieldEvidence: true,
  storesCiEvidence: true,
  storesSecretSafeArtifacts: true,
} as const satisfies ValidatorLaunchAdoptionRunPersistenceContract;

export const validatorLaunchAdoptionRuntimeCommands = [
  "pnpm --filter @inkroute/validators typecheck",
  "pnpm --filter @inkroute/validators test",
  "validator route adoption static scan",
  "public/dashboard malformed payload route tests",
  "webhook/provider payload normalization route tests",
  "tenant/auth scope validator route tests",
  "sensitive-field redaction/encryption contract tests",
  "GitHub Actions validator launch evidence job",
] as const;

export const validatorLaunchAdoptionArtifactPaths = [
  "coverage/validator-launch-adoption-runtime.json",
  "coverage/validator-package-typecheck.txt",
  "coverage/validator-package-test.txt",
  "coverage/validator-booking-travel-portfolio-payment.json",
  "coverage/validator-people-consent-forms-seo.json",
  "coverage/validator-messaging-observability-release.json",
  "coverage/validator-tenancy-auth-edge-cases.json",
  "coverage/validator-dynamic-form-edge-cases.json",
  "coverage/validator-public-route-adoption.json",
  "coverage/validator-dashboard-route-adoption.json",
  "coverage/validator-webhook-route-adoption.json",
  "coverage/validator-provider-payload-adoption.json",
  "coverage/validator-malformed-payload-routes.json",
  "coverage/validator-tenant-scope-routes.json",
  "coverage/validator-sensitive-field-policy.json",
  "coverage/validator-redaction-encryption-contracts.json",
  "coverage/validator-ci-evidence.json",
  "coverage/validator-secret-safe-artifacts.json",
  "test-results/validator-launch-adoption-runtime",
] as const;

export const validatorLaunchAdoptionRuntimeMatrix = [
  {
    id: "validator-package-gates",
    command: "pnpm --filter @inkroute/validators typecheck && pnpm --filter @inkroute/validators test",
    artifact: "coverage/validator-package-test.txt",
    status: "wired",
  },
  {
    id: "core-domain-schema-coverage",
    command: "booking/travel/portfolio/payment and people/consent/forms/SEO schema happy/error tests",
    artifact: "coverage/validator-booking-travel-portfolio-payment.json",
    status: "schema-gated",
  },
  {
    id: "messaging-observability-release-tenancy-form-coverage",
    command: "messaging/observability/release, tenancy/auth, and dynamic form edge-case tests",
    artifact: "coverage/validator-messaging-observability-release.json",
    status: "schema-gated",
  },
  {
    id: "route-shared-schema-adoption",
    command: "validator route adoption static scan",
    artifact: "coverage/validator-public-route-adoption.json",
    status: "route-gated",
  },
  {
    id: "malformed-payload-and-tenant-scope-routes",
    command: "public/dashboard malformed payload route tests && tenant/auth scope validator route tests",
    artifact: "coverage/validator-malformed-payload-routes.json",
    status: "route-gated",
  },
  {
    id: "webhook-provider-payload-normalization",
    command: "webhook/provider payload normalization route tests",
    artifact: "coverage/validator-provider-payload-adoption.json",
    status: "route-gated",
  },
  {
    id: "sensitive-field-redaction-encryption",
    command: "sensitive-field redaction/encryption contract tests",
    artifact: "coverage/validator-redaction-encryption-contracts.json",
    status: "security-gated",
  },
  {
    id: "ci-secret-safe-artifacts",
    command: "GitHub Actions validator launch evidence job",
    artifact: "coverage/validator-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly ValidatorLaunchAdoptionRuntimeMatrixEntry[];

export const validatorLaunchAdoptionRuntimeReadiness = buildValidatorLaunchAdoptionEvidencePlan({
  packageScripts: ["typecheck", "test"],
  validatorsTypecheckPassed: false,
  validatorsTestsPassed: false,
  bookingTravelPortfolioPaymentCovered: false,
  peopleConsentFormsSeoCovered: false,
  messagingObservabilityReleaseCovered: false,
  tenancyAuthEdgeCasesCovered: false,
  dynamicFormEdgeCasesCovered: false,
  publicRoutesUseSharedSchemas: false,
  dashboardRoutesUseSharedSchemas: false,
  webhookRoutesUseSharedSchemas: false,
  providerPayloadRoutesUseSharedSchemas: false,
  malformedPayloadRouteTestsPassed: false,
  tenantScopeRouteTestsPassed: false,
  sensitiveFieldsSecurityAligned: false,
  redactionEncryptionPolicyTestsPassed: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
