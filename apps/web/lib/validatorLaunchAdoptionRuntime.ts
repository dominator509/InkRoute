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

export interface ValidatorLaunchAdoptionRunRecordInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: ValidatorLaunchAdoptionEvidenceDecision["status"];
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly schemaDomainEvidenceCaptured: boolean;
  readonly routeAdoptionEvidenceCaptured: boolean;
  readonly malformedPayloadEvidenceCaptured: boolean;
  readonly tenantScopeEvidenceCaptured: boolean;
  readonly sensitiveFieldEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeAdoptionReportPath?: string | null;
  readonly sensitiveFieldReportPath?: string | null;
}

export interface ValidatorLaunchAdoptionRunData {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha: string;
  readonly status: ValidatorLaunchAdoptionEvidenceDecision["status"];
  readonly commandMatrix: readonly string[];
  readonly artifactManifest: readonly string[];
  readonly schemaDomainEvidenceCaptured: boolean;
  readonly routeAdoptionEvidenceCaptured: boolean;
  readonly malformedPayloadEvidenceCaptured: boolean;
  readonly tenantScopeEvidenceCaptured: boolean;
  readonly sensitiveFieldEvidenceCaptured: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly routeAdoptionReportPath: string | null;
  readonly sensitiveFieldReportPath: string | null;
}

export interface ValidatorLaunchAdoptionRunRepository {
  readonly validatorLaunchAdoptionRun: {
    readonly upsert: (args: {
      readonly where: { readonly tenantId_runId: { readonly tenantId: string; readonly runId: string } };
      readonly create: ValidatorLaunchAdoptionRunData;
      readonly update: Omit<ValidatorLaunchAdoptionRunData, "tenantId" | "runId">;
    }) => Promise<unknown>;
  };
}

export function buildValidatorLaunchAdoptionRunData(
  input: ValidatorLaunchAdoptionRunRecordInput,
): ValidatorLaunchAdoptionRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha,
    status: input.status,
    commandMatrix: input.commands ?? validatorLaunchAdoptionRuntimeCommands,
    artifactManifest: input.artifacts ?? validatorLaunchAdoptionArtifactPaths,
    schemaDomainEvidenceCaptured: input.schemaDomainEvidenceCaptured,
    routeAdoptionEvidenceCaptured: input.routeAdoptionEvidenceCaptured,
    malformedPayloadEvidenceCaptured: input.malformedPayloadEvidenceCaptured,
    tenantScopeEvidenceCaptured: input.tenantScopeEvidenceCaptured,
    sensitiveFieldEvidenceCaptured: input.sensitiveFieldEvidenceCaptured,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    routeAdoptionReportPath: input.routeAdoptionReportPath ?? null,
    sensitiveFieldReportPath: input.sensitiveFieldReportPath ?? null,
  };
}

export async function persistValidatorLaunchAdoptionRun(
  repository: ValidatorLaunchAdoptionRunRepository,
  input: ValidatorLaunchAdoptionRunRecordInput,
): Promise<unknown> {
  const data = buildValidatorLaunchAdoptionRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.validatorLaunchAdoptionRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const validatorLaunchAdoptionRuntimeCommands = [
  "pnpm --filter @inkroute/validators typecheck",
  "pnpm --filter @inkroute/validators test",
  "booking/travel/portfolio/payment and people/consent/forms/SEO schema happy/error tests",
  "messaging/observability/release, tenancy/auth, and dynamic form edge-case tests",
  "validator route adoption static scan",
  "public/dashboard malformed payload route tests",
  "webhook/provider payload normalization route tests",
  "tenant/auth scope validator route tests",
  "sensitive-field redaction/encryption contract tests",
  "GitHub Actions validator launch evidence job",
  "secret-safe validator artifact review",
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

export const validatorLaunchAdoptionRuntimeProofFiles = [
  "packages/validators/package.json",
  "packages/validators/src/index.ts",
  "packages/validators/src/readiness.ts",
  "packages/validators/tests/schemas.test.ts",
  "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
  "apps/web/app/api/webhooks/stripe/route.ts",
  "apps/dashboard/app/api/releases/route.ts",
  "apps/web/lib/validatorLaunchAdoptionRuntime.ts",
  "apps/web/tests/validator-launch-adoption-runtime-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609034300_add_validator_launch_adoption_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
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

export const validatorLaunchAdoptionRuntimeControls = [
  "reject-malformed-public-dashboard-webhook-provider-mobile-payloads-before-side-effects",
  "centralize-tenant-role-permission-cross-tenant-validation-in-shared-schemas",
  "align-sensitive-fields-with-redaction-encryption-before-persistence",
  "publish-redacted-validator-reports-and-route-test-artifacts-only",
] as const;

export const validatorLaunchAdoptionEvidenceFlags = [
  "validatorsTypecheckPassed",
  "validatorsTestsPassed",
  "bookingTravelPortfolioPaymentCovered",
  "peopleConsentFormsSeoCovered",
  "messagingObservabilityReleaseCovered",
  "tenancyAuthEdgeCasesCovered",
  "dynamicFormEdgeCasesCovered",
  "publicRoutesUseSharedSchemas",
  "dashboardRoutesUseSharedSchemas",
  "webhookRoutesUseSharedSchemas",
  "providerPayloadRoutesUseSharedSchemas",
  "malformedPayloadRouteTestsPassed",
  "tenantScopeRouteTestsPassed",
  "sensitiveFieldsSecurityAligned",
  "redactionEncryptionPolicyTestsPassed",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type ValidatorLaunchAdoptionEvidenceFlag = (typeof validatorLaunchAdoptionEvidenceFlags)[number];

export interface ValidatorLaunchAdoptionEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly controls?: readonly string[];
  readonly evidence?: Partial<Record<ValidatorLaunchAdoptionEvidenceFlag, boolean>>;
}

export interface ValidatorLaunchAdoptionEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingControls: readonly string[];
  readonly missingEvidence: readonly ValidatorLaunchAdoptionEvidenceFlag[];
  readonly requiredCommands: typeof validatorLaunchAdoptionRuntimeCommands;
  readonly requiredArtifacts: typeof validatorLaunchAdoptionArtifactPaths;
  readonly requiredControls: typeof validatorLaunchAdoptionRuntimeControls;
  readonly requiredEvidence: typeof validatorLaunchAdoptionEvidenceFlags;
  readonly blockers: readonly string[];
}

export interface ValidatorLaunchAdoptionExecutionPlan {
  readonly localCommands: typeof validatorLaunchAdoptionLocalCommands;
  readonly externalCommands: typeof validatorLaunchAdoptionExternalCommands;
  readonly localArtifacts: typeof validatorLaunchAdoptionLocalArtifacts;
  readonly externalArtifacts: typeof validatorLaunchAdoptionExternalArtifacts;
  readonly commandExecutionAllowed: false;
  readonly routeWideExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly providerPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof validatorLaunchAdoptionExecutionPolicy;
  readonly requiredExternalEvidence: typeof validatorLaunchAdoptionRequiredExternalEvidence;
}

export interface ValidatorLaunchAdoptionArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof validatorLaunchAdoptionRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

const validatorLaunchAdoptionEvidenceBlockers: Record<ValidatorLaunchAdoptionEvidenceFlag, string> = {
  validatorsTypecheckPassed: "Validator package typecheck must pass.",
  validatorsTestsPassed: "Validator package tests must pass.",
  bookingTravelPortfolioPaymentCovered: "Booking, travel, portfolio, and payment schema coverage must be proven.",
  peopleConsentFormsSeoCovered: "People, consent, forms, and SEO schema coverage must be proven.",
  messagingObservabilityReleaseCovered: "Messaging, observability, release, and deployment schema coverage must be proven.",
  tenancyAuthEdgeCasesCovered: "Tenancy, auth, role, permission, and cross-tenant edge cases must be covered.",
  dynamicFormEdgeCasesCovered: "Dynamic form edge cases must be covered.",
  publicRoutesUseSharedSchemas: "Public API routes must use shared validator schemas.",
  dashboardRoutesUseSharedSchemas: "Dashboard API routes must use shared validator schemas.",
  webhookRoutesUseSharedSchemas: "Webhook routes must use shared validator schemas before side effects.",
  providerPayloadRoutesUseSharedSchemas: "Provider payload routes must use shared schemas before side effects.",
  malformedPayloadRouteTestsPassed: "Malformed-payload route contract tests must pass.",
  tenantScopeRouteTestsPassed: "Tenant/auth scope validator route tests must pass.",
  sensitiveFieldsSecurityAligned: "Accepted sensitive fields must align with redaction/encryption policy before persistence.",
  redactionEncryptionPolicyTestsPassed: "Security contract tests must prove accepted sensitive fields are redacted or encryption-gated before persistence.",
  ciEvidenceCaptured: "CI validator launch evidence must be captured.",
  secretSafeArtifactsCaptured: "Validator artifacts must be redacted and free of secrets, tokens, raw PII, medical, or payment data.",
};

export const validatorLaunchAdoptionExecutionPolicy = {
  codexMayClassifyStaticValidatorLaunchReadiness: true,
  routeWideProofRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
  sensitiveFieldSecurityProofRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const validatorLaunchAdoptionLocalCommands = [
  "pnpm --filter @inkroute/validators typecheck",
  "pnpm --filter @inkroute/validators test",
  "booking/travel/portfolio/payment and people/consent/forms/SEO schema happy/error tests",
  "messaging/observability/release, tenancy/auth, and dynamic form edge-case tests",
  "validator route adoption static scan",
] as const;

export const validatorLaunchAdoptionExternalCommands = [
  "public/dashboard malformed payload route tests",
  "webhook/provider payload normalization route tests",
  "tenant/auth scope validator route tests",
  "sensitive-field redaction/encryption contract tests",
  "GitHub Actions validator launch evidence job",
  "secret-safe validator artifact review",
  "provider-backed persistValidatorLaunchAdoptionRun execution proof",
] as const;

export const validatorLaunchAdoptionLocalArtifacts = [
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
] as const;

export const validatorLaunchAdoptionExternalArtifacts = [
  "coverage/validator-malformed-payload-routes.json",
  "coverage/validator-tenant-scope-routes.json",
  "coverage/validator-sensitive-field-policy.json",
  "coverage/validator-redaction-encryption-contracts.json",
  "coverage/validator-ci-evidence.json",
  "coverage/validator-secret-safe-artifacts.json",
  "test-results/validator-launch-adoption-runtime",
  "provider-backed ValidatorLaunchAdoptionRun persistence proof",
] as const;

export const validatorLaunchAdoptionRequiredExternalEvidence = [
  "Installed-workspace validator typecheck and test output.",
  "Route-wide shared-schema adoption proof across public, dashboard, webhook, provider, and mobile payload surfaces.",
  "Malformed-payload and tenant/auth scope route contract test evidence.",
  "Sensitive-field redaction and encryption-gate security evidence before persistence.",
  "CI validator launch evidence and secret-safe artifact review.",
  "Provider-backed ValidatorLaunchAdoptionRun persistence row captured through persistValidatorLaunchAdoptionRun.",
] as const;

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

const sensitiveValidatorLaunchAdoptionKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|name|address|medical|payment|card|consent|tenant|user|client|provider|webhook|database|url|uri|dsn|key|id|payload|artifact|metadata)/iu;
const sensitiveValidatorLaunchAdoptionValuePattern =
  /(https?:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|[A-Za-z0-9_-]{24,})/giu;

const buildRedactedValidatorLaunchAdoptionValue = (value: unknown, path: string, redactions: string[]): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry, index) => buildRedactedValidatorLaunchAdoptionValue(entry, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveValidatorLaunchAdoptionKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedValidatorLaunchAdoptionValue(entry, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redacted = value.replace(sensitiveValidatorLaunchAdoptionValuePattern, "[REDACTED]");
    if (redacted !== value) {
      redactions.push(path || "$");
    }
    return redacted;
  }

  return value;
};

export function buildValidatorLaunchAdoptionExecutionPlan(): ValidatorLaunchAdoptionExecutionPlan {
  return {
    localCommands: validatorLaunchAdoptionLocalCommands,
    externalCommands: validatorLaunchAdoptionExternalCommands,
    localArtifacts: validatorLaunchAdoptionLocalArtifacts,
    externalArtifacts: validatorLaunchAdoptionExternalArtifacts,
    commandExecutionAllowed: false,
    routeWideExecutionAllowed: false,
    ciExecutionAllowed: false,
    providerPersistenceExecutionAllowed: false,
    executionPolicy: validatorLaunchAdoptionExecutionPolicy,
    requiredExternalEvidence: validatorLaunchAdoptionRequiredExternalEvidence,
  };
}

export function buildRedactedValidatorLaunchAdoptionArtifact(artifact: unknown): unknown {
  return buildRedactedValidatorLaunchAdoptionValue(artifact, "", []);
}

export function buildValidatorLaunchAdoptionArtifactReview(artifact: unknown): ValidatorLaunchAdoptionArtifactReview {
  const redactions: string[] = [];
  return {
    artifact: buildRedactedValidatorLaunchAdoptionValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: validatorLaunchAdoptionRequiredExternalEvidence,
    safeForTracker: true,
  };
}

export const buildValidatorLaunchAdoptionEvidenceDecision = (
  input: ValidatorLaunchAdoptionEvidenceInput,
): ValidatorLaunchAdoptionEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, validatorLaunchAdoptionRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, validatorLaunchAdoptionArtifactPaths);
  const missingControls = missingFrom(input.controls, validatorLaunchAdoptionRuntimeControls);
  const missingEvidence = validatorLaunchAdoptionEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => validatorLaunchAdoptionEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingControls.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingControls,
    missingEvidence,
    requiredCommands: validatorLaunchAdoptionRuntimeCommands,
    requiredArtifacts: validatorLaunchAdoptionArtifactPaths,
    requiredControls: validatorLaunchAdoptionRuntimeControls,
    requiredEvidence: validatorLaunchAdoptionEvidenceFlags,
    blockers,
  };
};

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



