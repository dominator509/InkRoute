import { buildReferenceUploadProviderEvidencePlan } from "@inkroute/security";

export type ReferenceUploadProviderRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "scan-gated"
  | "persistence-gated"
  | "access-gated"
  | "ci-gated";

export interface ReferenceUploadProviderRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ReferenceUploadProviderRuntimeStatus;
}

export const referenceUploadProviderRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
  "reference image provider-signed upload integration test",
  "reference image magic-byte and malware scan integration test",
  "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
  "private reference anonymous and cross-tenant fetch-denial tests",
  "GitHub Actions reference upload provider evidence job",
] as const;

export const referenceUploadProviderReadinessAreas = [
  "signed-upload-intent-route-wiring",
  "provider-signed-upload-url-issuance",
  "server-owned-private-object-keys",
  "declared-byte-upload-verification",
  "magic-byte-validation",
  "malware-scan-provider",
  "quarantine-failure-flow",
  "private-bucket-acl",
  "fileasset-persistence",
  "booking-reference-image-persistence",
  "auditlog-persistence",
  "anonymous-private-fetch-denial",
  "cross-tenant-private-fetch-denial",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const referenceUploadProviderArtifactPaths = [
  "coverage/reference-upload-provider-runtime.json",
  "coverage/reference-upload-security-typecheck.txt",
  "coverage/reference-upload-security-test.txt",
  "coverage/reference-upload-web-typecheck.txt",
  "coverage/reference-upload-route-test.txt",
  "coverage/reference-upload-provider-signed-url-redacted.json",
  "coverage/reference-upload-byte-verification.json",
  "coverage/reference-upload-magic-byte-validation.json",
  "coverage/reference-upload-malware-scan-quarantine.json",
  "coverage/reference-upload-fileasset-persistence.json",
  "coverage/reference-upload-booking-reference-image-persistence.json",
  "coverage/reference-upload-auditlog-persistence.json",
  "coverage/reference-upload-private-acl.json",
  "coverage/reference-upload-private-fetch-denial.json",
  "coverage/reference-upload-cross-tenant-denial.json",
  "coverage/reference-upload-ci-evidence.json",
  "coverage/reference-upload-secret-safe-artifacts.json",
  "test-results/reference-upload-provider-runtime",
] as const;

export const referenceUploadProviderRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
  "apps/web/tests/secure-upload-intents-route.test.ts",
  "apps/web/lib/referenceUploadProviderRuntime.ts",
  "apps/web/tests/reference-upload-provider-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export const referenceUploadProviderRuntimeMatrix = [
  {
    id: "security-typecheck",
    command: "pnpm --filter @inkroute/security typecheck",
    artifact: "coverage/reference-upload-security-typecheck.txt",
    status: "wired",
  },
  {
    id: "security-upload-tests",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/reference-upload-security-test.txt",
    status: "wired",
  },
  {
    id: "web-upload-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/reference-upload-web-typecheck.txt",
    status: "wired",
  },
  {
    id: "secure-upload-route-tests",
    command: "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
    artifact: "coverage/reference-upload-route-test.txt",
    status: "wired",
  },
  {
    id: "signed-upload-intent-route",
    command: "assert secure-upload-intents route returns signed intent, private access, persistence, and GAP-033 evidence plans",
    artifact: "coverage/reference-upload-provider-runtime.json",
    status: "wired",
  },
  {
    id: "provider-signed-upload-url",
    command: "reference image provider-signed upload integration test",
    artifact: "coverage/reference-upload-provider-signed-url-redacted.json",
    status: "provider-gated",
  },
  {
    id: "byte-upload-verification",
    command: "verify uploaded bytes against declared size, checksum, tenant, subject, and signed intent",
    artifact: "coverage/reference-upload-byte-verification.json",
    status: "provider-gated",
  },
  {
    id: "magic-byte-validation",
    command: "reference image magic-byte validation integration test",
    artifact: "coverage/reference-upload-magic-byte-validation.json",
    status: "scan-gated",
  },
  {
    id: "malware-scan-quarantine",
    command: "reference image malware scan and quarantine integration test",
    artifact: "coverage/reference-upload-malware-scan-quarantine.json",
    status: "scan-gated",
  },
  {
    id: "fileasset-booking-reference-auditlog-persistence",
    command: "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
    artifact: "coverage/reference-upload-fileasset-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "private-acl-fetch-denial",
    command: "private reference anonymous fetch-denial test",
    artifact: "coverage/reference-upload-private-fetch-denial.json",
    status: "access-gated",
  },
  {
    id: "cross-tenant-fetch-denial",
    command: "private reference cross-tenant fetch-denial test",
    artifact: "coverage/reference-upload-cross-tenant-denial.json",
    status: "access-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions reference upload provider evidence job",
    artifact: "coverage/reference-upload-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly ReferenceUploadProviderRuntimeMatrixEntry[];

export const referenceUploadProviderRuntimeReadiness = buildReferenceUploadProviderEvidencePlan({
  packageScripts: ["typecheck", "test"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  webUploadRouteTestsPassed: false,
  webTypecheckPassed: false,
  uploadIntentRouteUsesSignedPlan: true,
  providerSignedUploadUrlIssued: false,
  byteUploadVerified: false,
  magicByteValidationPassed: false,
  malwareScanConfigured: false,
  quarantineFlowVerified: false,
  privateBucketAclVerified: false,
  fileAssetRowsPersisted: false,
  bookingReferenceImageRowsPersisted: false,
  auditLogRowsPersisted: false,
  privateFetchDenied: false,
  crossTenantFetchDenied: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});

export const referenceUploadProviderEvidenceFlags = [
  "securityTestsPassed",
  "securityTypecheckPassed",
  "webUploadRouteTestsPassed",
  "webTypecheckPassed",
  "uploadIntentRouteUsesSignedPlan",
  "providerSignedUploadUrlIssued",
  "byteUploadVerified",
  "magicByteValidationPassed",
  "malwareScanConfigured",
  "quarantineFlowVerified",
  "privateBucketAclVerified",
  "fileAssetRowsPersisted",
  "bookingReferenceImageRowsPersisted",
  "auditLogRowsPersisted",
  "privateFetchDenied",
  "crossTenantFetchDenied",
  "ciEvidenceCaptured",
  "secretSafeArtifactsCaptured",
] as const;

export type ReferenceUploadProviderEvidenceFlag = (typeof referenceUploadProviderEvidenceFlags)[number];

export interface ReferenceUploadProviderEvidenceInput {
  readonly commands?: readonly string[];
  readonly artifacts?: readonly string[];
  readonly readinessAreas?: readonly string[];
  readonly evidence?: Partial<Record<ReferenceUploadProviderEvidenceFlag, boolean>>;
}

export interface ReferenceUploadProviderEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingCommands: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly missingReadinessAreas: readonly string[];
  readonly missingEvidence: readonly ReferenceUploadProviderEvidenceFlag[];
  readonly requiredCommands: typeof referenceUploadProviderRuntimeCommands;
  readonly requiredArtifacts: typeof referenceUploadProviderArtifactPaths;
  readonly requiredReadinessAreas: readonly string[];
  readonly requiredEvidence: typeof referenceUploadProviderEvidenceFlags;
  readonly blockers: readonly string[];
}

const referenceUploadProviderEvidenceBlockers: Record<ReferenceUploadProviderEvidenceFlag, string> = {
  securityTestsPassed: "Security package upload-policy tests must pass.",
  securityTypecheckPassed: "Security package typecheck must pass.",
  webUploadRouteTestsPassed: "Secure upload intent route tests must pass.",
  webTypecheckPassed: "Web typecheck must pass.",
  uploadIntentRouteUsesSignedPlan: "Secure upload intent route must return signed reference upload evidence plans.",
  providerSignedUploadUrlIssued: "Provider-signed upload URL must be issued for reference_private uploads.",
  byteUploadVerified: "Uploaded bytes must be verified against declared size, checksum, tenant, subject, and signed intent.",
  magicByteValidationPassed: "Magic-byte validation must pass for uploaded reference images.",
  malwareScanConfigured: "Malware scan provider must be configured for reference uploads.",
  quarantineFlowVerified: "Quarantine failure flow must be verified.",
  privateBucketAclVerified: "Private bucket ACL proof is required.",
  fileAssetRowsPersisted: "FileAsset persistence evidence is required.",
  bookingReferenceImageRowsPersisted: "BookingReferenceImage persistence evidence is required.",
  auditLogRowsPersisted: "AuditLog persistence evidence is required.",
  privateFetchDenied: "Private reference fetch-denial tests must prove anonymous public reads fail.",
  crossTenantFetchDenied: "Private reference fetch-denial tests must prove cross-tenant reads fail.",
  ciEvidenceCaptured: "CI reference upload provider evidence must be captured.",
  secretSafeArtifactsCaptured:
    "Reference upload artifacts must be redacted and free of secrets, provider tokens, private object keys, raw PII, medical, and payment data.",
};

const missingFrom = (actual: readonly string[] | undefined, required: readonly string[]) =>
  required.filter((item) => !(actual ?? []).includes(item));

export const buildReferenceUploadProviderEvidenceDecision = (
  input: ReferenceUploadProviderEvidenceInput,
): ReferenceUploadProviderEvidenceDecision => {
  const missingCommands = missingFrom(input.commands, referenceUploadProviderRuntimeCommands);
  const missingArtifacts = missingFrom(input.artifacts, referenceUploadProviderArtifactPaths);
  const missingReadinessAreas = missingFrom(input.readinessAreas, referenceUploadProviderReadinessAreas);
  const missingEvidence = referenceUploadProviderEvidenceFlags.filter((flag) => input.evidence?.[flag] !== true);
  const blockers = missingEvidence.map((flag) => referenceUploadProviderEvidenceBlockers[flag]);

  return {
    status:
      missingCommands.length === 0 &&
      missingArtifacts.length === 0 &&
      missingReadinessAreas.length === 0 &&
      missingEvidence.length === 0
        ? "complete"
        : "blocked",
    missingCommands,
    missingArtifacts,
    missingReadinessAreas,
    missingEvidence,
    requiredCommands: referenceUploadProviderRuntimeCommands,
    requiredArtifacts: referenceUploadProviderArtifactPaths,
    requiredReadinessAreas: referenceUploadProviderReadinessAreas,
    requiredEvidence: referenceUploadProviderEvidenceFlags,
    blockers,
  };
};

export interface ReferenceUploadProviderExecutionPolicy {
  readonly codexMayClassifyStaticUploadRouteReadiness: true;
  readonly providerSignedUrlRequiredForClosure: true;
  readonly byteAndMagicValidationRequiredForClosure: true;
  readonly malwareScanAndQuarantineRequiredForClosure: true;
  readonly transactionalPersistenceRequiredForClosure: true;
  readonly privateAclAndFetchDenialRequiredForClosure: true;
  readonly secretSafeArtifactsRequiredForClosure: true;
}

export interface ReferenceUploadProviderExecutionPlan {
  readonly localCommands: typeof referenceUploadProviderLocalCommands;
  readonly externalCommands: typeof referenceUploadProviderExternalCommands;
  readonly requiredExternalEvidence: typeof referenceUploadProviderRequiredExternalEvidence;
  readonly commandExecutionAllowed: false;
  readonly providerStorageExecutionAllowed: false;
  readonly malwareScanExecutionAllowed: false;
  readonly databaseExecutionAllowed: false;
  readonly privateFetchExecutionAllowed: false;
  readonly ciExecutionAllowed: false;
  readonly executionPolicy: typeof referenceUploadProviderExecutionPolicy;
}

export interface ReferenceUploadProviderArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof referenceUploadProviderRequiredExternalEvidence;
  readonly secretSafe: boolean;
}

export const referenceUploadProviderLocalCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
  "static secure-upload-intents route evidence-plan review",
] as const;

export const referenceUploadProviderExternalCommands = [
  "reference image provider-signed upload integration test",
  "reference image magic-byte and malware scan integration test",
  "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
  "private reference anonymous and cross-tenant fetch-denial tests",
  "GitHub Actions reference upload provider evidence job",
] as const;

export const referenceUploadProviderRequiredExternalEvidence = [
  "provider-signed reference_private upload URL transcript",
  "uploaded-byte verification evidence",
  "magic-byte validation evidence",
  "malware scan and quarantine transcript",
  "transactional FileAsset BookingReferenceImage AuditLog persistence evidence",
  "private storage ACL proof",
  "anonymous private fetch-denial proof",
  "cross-tenant private fetch-denial proof",
  "fresh CI reference upload provider evidence",
  "secret-safe reference upload artifact review",
] as const;

export const referenceUploadProviderExecutionPolicy: ReferenceUploadProviderExecutionPolicy = {
  codexMayClassifyStaticUploadRouteReadiness: true,
  providerSignedUrlRequiredForClosure: true,
  byteAndMagicValidationRequiredForClosure: true,
  malwareScanAndQuarantineRequiredForClosure: true,
  transactionalPersistenceRequiredForClosure: true,
  privateAclAndFetchDenialRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
};

export const buildReferenceUploadProviderExecutionPlan = (): ReferenceUploadProviderExecutionPlan => ({
  localCommands: referenceUploadProviderLocalCommands,
  externalCommands: referenceUploadProviderExternalCommands,
  requiredExternalEvidence: referenceUploadProviderRequiredExternalEvidence,
  commandExecutionAllowed: false,
  providerStorageExecutionAllowed: false,
  malwareScanExecutionAllowed: false,
  databaseExecutionAllowed: false,
  privateFetchExecutionAllowed: false,
  ciExecutionAllowed: false,
  executionPolicy: referenceUploadProviderExecutionPolicy,
});

const referenceUploadProviderSensitiveArtifactKeyPattern =
  /(secret|token|password|private|client|tenant|domain|database|db|url|uri|file|provider|storage|bucket|object|key|signed|signature|checksum|medical|payment|email|phone|upload|reference|booking|audit|acl|malware|scan|quarantine)/i;

export const buildRedactedReferenceUploadProviderArtifact = (
  artifact: unknown,
): Pick<ReferenceUploadProviderArtifactReview, "artifact" | "redactions"> => {
  const redactions: string[] = [];

  const redact = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) {
      return value.map((item, index) => redact(item, `${path}[${index}]`));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
          const entryPath = path ? `${path}.${key}` : key;

          if (referenceUploadProviderSensitiveArtifactKeyPattern.test(key)) {
            redactions.push(entryPath);
            return [key, "[REDACTED_REFERENCE_UPLOAD_PRIVATE_VALUE]"];
          }

          return [key, redact(entry, entryPath)];
        }),
      );
    }

    return value;
  };

  return {
    artifact: redact(artifact, ""),
    redactions,
  };
};

export const buildReferenceUploadProviderArtifactReview = (
  artifact: unknown,
): ReferenceUploadProviderArtifactReview => {
  const redacted = buildRedactedReferenceUploadProviderArtifact(artifact);
  const serialized = JSON.stringify(redacted.artifact);
  const leakedPrivateMarkers = [
    "https://storage.example.com",
    "s3://",
    "client@example.com",
    "tenant.example.com",
    "sk_",
    "private-object",
    "medical:",
    "provider-token",
  ].some((marker) => serialized.includes(marker));

  return {
    ...redacted,
    requiredExternalEvidence: referenceUploadProviderRequiredExternalEvidence,
    secretSafe: !leakedPrivateMarkers,
  };
};



