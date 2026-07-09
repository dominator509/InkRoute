import { buildProviderStorageUploadReadinessPlan } from "@inkroute/security";

export type ProviderStorageUploadRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "persistence-gated"
  | "scan-gated"
  | "integration-gated"
  | "ci-gated";

export interface ProviderStorageUploadRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ProviderStorageUploadRuntimeStatus;
}

export interface ProviderStorageUploadRunPersistenceContract {
  readonly model: "ProviderStorageUploadRun";
  readonly tenantRelation: "providerStorageUploadRuns";
  readonly migration: "20260609032900_add_provider_storage_upload_runs";
  readonly jsonFields: readonly [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "providerConfigurationManifest",
    "bucketPolicyManifest",
    "scanDerivativeManifest",
  ];
  readonly evidenceBooleans: readonly [
    "securityTestsPassed",
    "securityTypecheckPassed",
    "webUploadRouteTestsPassed",
    "webTypecheckPassed",
    "storageProviderSelected",
    "storageProviderConfigured",
    "storageSecretsConfigured",
    "privateBucketAclVerified",
    "derivativeBucketPolicyVerified",
    "signedUploadUrlsProviderBacked",
    "signedDownloadUrlsProviderBacked",
    "serverOwnedObjectKeysEnforced",
    "fileAssetPersistenceTransactional",
    "auditLogPersistenceConfigured",
    "linkTablePersistenceConfigured",
    "signedUrlGrantPersistenceConfigured",
    "malwareScanProviderConfigured",
    "scanVerdictPersistenceConfigured",
    "metadataStrippingWorkerConfigured",
    "publicDerivativeGenerationConfigured",
    "privateOriginalPublicReadDenied",
    "approvedDerivativePublicReadVerified",
    "tenantScopedProviderIntegrationTestsPassed",
    "privacyRetentionEnforced",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ];
  readonly artifactFields: readonly [
    "securityTypecheckArtifactPath",
    "securityTestArtifactPath",
    "webTypecheckArtifactPath",
    "uploadRouteTestArtifactPath",
    "providerConfigArtifactPath",
    "bucketPolicyArtifactPath",
    "signedUrlProviderArtifactPath",
    "fileAssetPersistenceArtifactPath",
    "scanDerivativeWorkerArtifactPath",
    "privateOriginalDenialArtifactPath",
    "tenantIsolationArtifactPath",
    "retentionArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ];
}

export const providerStorageUploadRunPersistenceContract: ProviderStorageUploadRunPersistenceContract = {
  model: "ProviderStorageUploadRun",
  tenantRelation: "providerStorageUploadRuns",
  migration: "20260609032900_add_provider_storage_upload_runs",
  jsonFields: [
    "commandMatrix",
    "readinessAreaManifest",
    "artifactManifest",
    "providerConfigurationManifest",
    "bucketPolicyManifest",
    "scanDerivativeManifest",
  ],
  evidenceBooleans: [
    "securityTestsPassed",
    "securityTypecheckPassed",
    "webUploadRouteTestsPassed",
    "webTypecheckPassed",
    "storageProviderSelected",
    "storageProviderConfigured",
    "storageSecretsConfigured",
    "privateBucketAclVerified",
    "derivativeBucketPolicyVerified",
    "signedUploadUrlsProviderBacked",
    "signedDownloadUrlsProviderBacked",
    "serverOwnedObjectKeysEnforced",
    "fileAssetPersistenceTransactional",
    "auditLogPersistenceConfigured",
    "linkTablePersistenceConfigured",
    "signedUrlGrantPersistenceConfigured",
    "malwareScanProviderConfigured",
    "scanVerdictPersistenceConfigured",
    "metadataStrippingWorkerConfigured",
    "publicDerivativeGenerationConfigured",
    "privateOriginalPublicReadDenied",
    "approvedDerivativePublicReadVerified",
    "tenantScopedProviderIntegrationTestsPassed",
    "privacyRetentionEnforced",
    "ciEvidenceCaptured",
    "secretSafeArtifactsCaptured",
  ],
  artifactFields: [
    "securityTypecheckArtifactPath",
    "securityTestArtifactPath",
    "webTypecheckArtifactPath",
    "uploadRouteTestArtifactPath",
    "providerConfigArtifactPath",
    "bucketPolicyArtifactPath",
    "signedUrlProviderArtifactPath",
    "fileAssetPersistenceArtifactPath",
    "scanDerivativeWorkerArtifactPath",
    "privateOriginalDenialArtifactPath",
    "tenantIsolationArtifactPath",
    "retentionArtifactPath",
    "ciEvidenceArtifactPath",
    "secretSafeArtifactsPath",
    "ciRunUrl",
  ],
};

export const providerStorageUploadRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
  "select object storage provider and configure redacted provider secrets",
  "verify private original ACL and approved derivative public policy",
  "object storage provider upload/download integration tests",
  "persist FileAsset, link rows, SignedUrlGrant, and AuditLog transactionally",
  "malware scan and derivative worker integration tests",
  "private-original public-read denial test",
  "cross-tenant denial and privacy retention provider tests",
  "GitHub Actions storage/upload evidence job",
  "capture redacted storage artifacts without provider secrets or client-private files",
] as const;

export const providerStorageUploadReadinessAreas = [
  "storage-provider-selection",
  "redacted-provider-configuration",
  "secret-store-credentials",
  "private-original-bucket-acl",
  "approved-derivative-public-policy",
  "provider-backed-signed-upload-urls",
  "provider-backed-signed-download-urls",
  "server-owned-tenant-scoped-object-keys",
  "transactional-fileasset-link-audit-persistence",
  "signed-url-grant-expiry-revocation",
  "malware-scan-provider",
  "scan-verdict-mime-metadata-derivative-persistence",
  "metadata-stripping-worker",
  "public-derivative-generation",
  "private-original-public-read-denial",
  "approved-derivative-public-read",
  "cross-tenant-provider-denial",
  "privacy-retention",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const providerStorageUploadArtifactPaths = [
  "coverage/provider-storage-upload-runtime.json",
  "coverage/provider-storage-security-typecheck.txt",
  "coverage/provider-storage-security-test.txt",
  "coverage/provider-storage-web-typecheck.txt",
  "coverage/provider-storage-upload-route-test.txt",
  "coverage/provider-storage-config-redacted.json",
  "coverage/provider-storage-bucket-policy.json",
  "coverage/provider-storage-signed-url-provider.json",
  "coverage/provider-storage-fileasset-persistence.json",
  "coverage/provider-storage-scan-derivative-worker.json",
  "coverage/provider-storage-private-original-denial.json",
  "coverage/provider-storage-tenant-isolation.json",
  "coverage/provider-storage-retention.json",
  "coverage/provider-storage-ci-evidence.json",
  "coverage/provider-storage-secret-safe-artifacts.json",
  "test-results/provider-storage-upload-runtime",
] as const;

export const providerStorageUploadRuntimeProofFiles = [
  "apps/web/package.json",
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/providerStorageUploadRuntime.ts",
  "apps/web/tests/provider-storage-upload-runtime-static.test.ts",
  "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
  "apps/web/tests/secure-upload-intents-route.test.ts",
  "apps/dashboard/app/api/files/signed-upload/route.ts",
  "apps/dashboard/tests/portfolio-read-route-static.test.ts",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609032900_add_provider_storage_upload_runs/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
  "GAP_TRACKER.md",
] as const;

export type ProviderStorageUploadRuntimeCommand = (typeof providerStorageUploadRuntimeCommands)[number];
export type ProviderStorageUploadReadinessArea = (typeof providerStorageUploadReadinessAreas)[number];
export type ProviderStorageUploadArtifact = (typeof providerStorageUploadArtifactPaths)[number];

export const providerStorageUploadRuntimeLocalArtifacts = [
  "coverage/provider-storage-upload-runtime.json",
  "coverage/provider-storage-security-typecheck.txt",
  "coverage/provider-storage-security-test.txt",
  "coverage/provider-storage-web-typecheck.txt",
  "coverage/provider-storage-upload-route-test.txt",
] as const satisfies readonly ProviderStorageUploadArtifact[];

export const providerStorageUploadRuntimeExternalArtifacts = [
  "coverage/provider-storage-config-redacted.json",
  "coverage/provider-storage-bucket-policy.json",
  "coverage/provider-storage-signed-url-provider.json",
  "coverage/provider-storage-fileasset-persistence.json",
  "coverage/provider-storage-scan-derivative-worker.json",
  "coverage/provider-storage-private-original-denial.json",
  "coverage/provider-storage-tenant-isolation.json",
  "coverage/provider-storage-retention.json",
  "coverage/provider-storage-ci-evidence.json",
  "coverage/provider-storage-secret-safe-artifacts.json",
  "test-results/provider-storage-upload-runtime",
] as const satisfies readonly ProviderStorageUploadArtifact[];

export interface ProviderStorageUploadEvidenceInput {
  readonly securityTestsPassed: boolean;
  readonly securityTypecheckPassed: boolean;
  readonly webUploadRouteTestsPassed: boolean;
  readonly webTypecheckPassed: boolean;
  readonly storageProviderSelected: boolean;
  readonly storageProviderConfigured: boolean;
  readonly storageSecretsConfigured: boolean;
  readonly privateBucketAclVerified: boolean;
  readonly derivativeBucketPolicyVerified: boolean;
  readonly signedUploadUrlsProviderBacked: boolean;
  readonly signedDownloadUrlsProviderBacked: boolean;
  readonly serverOwnedObjectKeysEnforced: boolean;
  readonly fileAssetPersistenceTransactional: boolean;
  readonly auditLogPersistenceConfigured: boolean;
  readonly linkTablePersistenceConfigured: boolean;
  readonly signedUrlGrantPersistenceConfigured: boolean;
  readonly malwareScanProviderConfigured: boolean;
  readonly scanVerdictPersistenceConfigured: boolean;
  readonly metadataStrippingWorkerConfigured: boolean;
  readonly publicDerivativeGenerationConfigured: boolean;
  readonly privateOriginalPublicReadDenied: boolean;
  readonly approvedDerivativePublicReadVerified: boolean;
  readonly tenantScopedProviderIntegrationTestsPassed: boolean;
  readonly privacyRetentionEnforced: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly secretSafeArtifactsCaptured: boolean;
  readonly providerStorageUploadRunPersisted: boolean;
  readonly coveredReadinessAreas: readonly ProviderStorageUploadReadinessArea[];
  readonly capturedArtifacts: readonly ProviderStorageUploadArtifact[];
  readonly completedCommands: readonly ProviderStorageUploadRuntimeCommand[];
}

export interface ProviderStorageUploadRunRecordInput extends ProviderStorageUploadEvidenceInput {
  readonly tenantId: string;
  readonly runId: string;
  readonly commitSha?: string | null;
  readonly status: "complete" | "blocked";
  readonly securityTypecheckArtifactPath?: string | null;
  readonly securityTestArtifactPath?: string | null;
  readonly webTypecheckArtifactPath?: string | null;
  readonly uploadRouteTestArtifactPath?: string | null;
  readonly providerConfigArtifactPath?: string | null;
  readonly bucketPolicyArtifactPath?: string | null;
  readonly signedUrlProviderArtifactPath?: string | null;
  readonly fileAssetPersistenceArtifactPath?: string | null;
  readonly scanDerivativeWorkerArtifactPath?: string | null;
  readonly privateOriginalDenialArtifactPath?: string | null;
  readonly tenantIsolationArtifactPath?: string | null;
  readonly retentionArtifactPath?: string | null;
  readonly ciEvidenceArtifactPath?: string | null;
  readonly secretSafeArtifactsPath?: string | null;
  readonly ciRunUrl?: string | null;
}

export interface ProviderStorageUploadRunData
  extends Omit<
    ProviderStorageUploadRunRecordInput,
    "coveredReadinessAreas" | "capturedArtifacts" | "completedCommands" | "providerStorageUploadRunPersisted"
  > {
  readonly commandMatrix: typeof providerStorageUploadRuntimeMatrix;
  readonly readinessAreaManifest: readonly ProviderStorageUploadReadinessArea[];
  readonly artifactManifest: readonly ProviderStorageUploadArtifact[];
  readonly providerConfigurationManifest: {
    readonly providerSelected: boolean;
    readonly providerConfigured: boolean;
    readonly secretsConfigured: boolean;
    readonly redactionBoundary: "secret-safe-artifacts-only";
  };
  readonly bucketPolicyManifest: {
    readonly privateBucketAclVerified: boolean;
    readonly derivativeBucketPolicyVerified: boolean;
    readonly privateOriginalPublicReadDenied: boolean;
    readonly approvedDerivativePublicReadVerified: boolean;
  };
  readonly scanDerivativeManifest: {
    readonly malwareScanProviderConfigured: boolean;
    readonly scanVerdictPersistenceConfigured: boolean;
    readonly metadataStrippingWorkerConfigured: boolean;
    readonly publicDerivativeGenerationConfigured: boolean;
  };
}

export interface ProviderStorageUploadRunRepository {
  readonly providerStorageUploadRun: {
    upsert(args: {
      where: { tenantId_runId: { tenantId: string; runId: string } };
      create: ProviderStorageUploadRunData;
      update: Omit<ProviderStorageUploadRunData, "tenantId" | "runId">;
    }): Promise<unknown>;
  };
}

export interface ProviderStorageUploadEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingReadinessAreas: readonly ProviderStorageUploadReadinessArea[];
  readonly missingArtifacts: readonly ProviderStorageUploadArtifact[];
  readonly missingCommands: readonly ProviderStorageUploadRuntimeCommand[];
  readonly requiredReadinessAreas: readonly ProviderStorageUploadReadinessArea[];
  readonly requiredArtifacts: typeof providerStorageUploadArtifactPaths;
  readonly requiredCommands: typeof providerStorageUploadRuntimeCommands;
  readonly requiredEvidence: typeof providerStorageUploadRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface ProviderStorageUploadExecutionPlan {
  readonly localCommands: typeof providerStorageUploadRuntimeLocalCommands;
  readonly externalCommands: typeof providerStorageUploadRuntimeExternalCommands;
  readonly localArtifacts: typeof providerStorageUploadRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof providerStorageUploadRuntimeExternalArtifacts;
  readonly securityTypecheckExecutionAllowed: false;
  readonly securityTestExecutionAllowed: false;
  readonly webTypecheckExecutionAllowed: false;
  readonly uploadRouteTestExecutionAllowed: false;
  readonly providerConfigCaptureAllowed: false;
  readonly bucketPolicyVerificationAllowed: false;
  readonly signedUrlProviderTestAllowed: false;
  readonly persistenceIntegrationExecutionAllowed: false;
  readonly scanDerivativeWorkerExecutionAllowed: false;
  readonly privateOriginalDenialExecutionAllowed: false;
  readonly tenantIsolationRetentionExecutionAllowed: false;
  readonly ciStorageEvidenceExecutionAllowed: false;
  readonly secretSafeArtifactCaptureAllowed: false;
  readonly providerBackedPersistenceExecutionAllowed: false;
  readonly executionPolicy: typeof providerStorageUploadExecutionPolicy;
  readonly requiredExternalEvidence: typeof providerStorageUploadRequiredExternalEvidence;
}

export interface ProviderStorageUploadArtifactReview {
  readonly artifact: unknown;
  readonly redactions: readonly string[];
  readonly requiredExternalEvidence: typeof providerStorageUploadRequiredExternalEvidence;
  readonly safeForTracker: boolean;
}

export const providerStorageUploadRuntimeLocalCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
] as const satisfies readonly ProviderStorageUploadRuntimeCommand[];

export const providerStorageUploadRuntimeExternalCommands = [
  "select object storage provider and configure redacted provider secrets",
  "verify private original ACL and approved derivative public policy",
  "object storage provider upload/download integration tests",
  "persist FileAsset, link rows, SignedUrlGrant, and AuditLog transactionally",
  "malware scan and derivative worker integration tests",
  "private-original public-read denial test",
  "cross-tenant denial and privacy retention provider tests",
  "GitHub Actions storage/upload evidence job",
  "capture redacted storage artifacts without provider secrets or client-private files",
] as const satisfies readonly ProviderStorageUploadRuntimeCommand[];

export function buildProviderStorageUploadRunData(input: ProviderStorageUploadRunRecordInput): ProviderStorageUploadRunData {
  return {
    tenantId: input.tenantId,
    runId: input.runId,
    commitSha: input.commitSha ?? null,
    status: input.status,
    commandMatrix: providerStorageUploadRuntimeMatrix,
    readinessAreaManifest: input.coveredReadinessAreas,
    artifactManifest: input.capturedArtifacts,
    providerConfigurationManifest: {
      providerSelected: input.storageProviderSelected,
      providerConfigured: input.storageProviderConfigured,
      secretsConfigured: input.storageSecretsConfigured,
      redactionBoundary: "secret-safe-artifacts-only",
    },
    bucketPolicyManifest: {
      privateBucketAclVerified: input.privateBucketAclVerified,
      derivativeBucketPolicyVerified: input.derivativeBucketPolicyVerified,
      privateOriginalPublicReadDenied: input.privateOriginalPublicReadDenied,
      approvedDerivativePublicReadVerified: input.approvedDerivativePublicReadVerified,
    },
    scanDerivativeManifest: {
      malwareScanProviderConfigured: input.malwareScanProviderConfigured,
      scanVerdictPersistenceConfigured: input.scanVerdictPersistenceConfigured,
      metadataStrippingWorkerConfigured: input.metadataStrippingWorkerConfigured,
      publicDerivativeGenerationConfigured: input.publicDerivativeGenerationConfigured,
    },
    securityTestsPassed: input.securityTestsPassed,
    securityTypecheckPassed: input.securityTypecheckPassed,
    webUploadRouteTestsPassed: input.webUploadRouteTestsPassed,
    webTypecheckPassed: input.webTypecheckPassed,
    storageProviderSelected: input.storageProviderSelected,
    storageProviderConfigured: input.storageProviderConfigured,
    storageSecretsConfigured: input.storageSecretsConfigured,
    privateBucketAclVerified: input.privateBucketAclVerified,
    derivativeBucketPolicyVerified: input.derivativeBucketPolicyVerified,
    signedUploadUrlsProviderBacked: input.signedUploadUrlsProviderBacked,
    signedDownloadUrlsProviderBacked: input.signedDownloadUrlsProviderBacked,
    serverOwnedObjectKeysEnforced: input.serverOwnedObjectKeysEnforced,
    fileAssetPersistenceTransactional: input.fileAssetPersistenceTransactional,
    auditLogPersistenceConfigured: input.auditLogPersistenceConfigured,
    linkTablePersistenceConfigured: input.linkTablePersistenceConfigured,
    signedUrlGrantPersistenceConfigured: input.signedUrlGrantPersistenceConfigured,
    malwareScanProviderConfigured: input.malwareScanProviderConfigured,
    scanVerdictPersistenceConfigured: input.scanVerdictPersistenceConfigured,
    metadataStrippingWorkerConfigured: input.metadataStrippingWorkerConfigured,
    publicDerivativeGenerationConfigured: input.publicDerivativeGenerationConfigured,
    privateOriginalPublicReadDenied: input.privateOriginalPublicReadDenied,
    approvedDerivativePublicReadVerified: input.approvedDerivativePublicReadVerified,
    tenantScopedProviderIntegrationTestsPassed: input.tenantScopedProviderIntegrationTestsPassed,
    privacyRetentionEnforced: input.privacyRetentionEnforced,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
    securityTypecheckArtifactPath: input.securityTypecheckArtifactPath ?? null,
    securityTestArtifactPath: input.securityTestArtifactPath ?? null,
    webTypecheckArtifactPath: input.webTypecheckArtifactPath ?? null,
    uploadRouteTestArtifactPath: input.uploadRouteTestArtifactPath ?? null,
    providerConfigArtifactPath: input.providerConfigArtifactPath ?? null,
    bucketPolicyArtifactPath: input.bucketPolicyArtifactPath ?? null,
    signedUrlProviderArtifactPath: input.signedUrlProviderArtifactPath ?? null,
    fileAssetPersistenceArtifactPath: input.fileAssetPersistenceArtifactPath ?? null,
    scanDerivativeWorkerArtifactPath: input.scanDerivativeWorkerArtifactPath ?? null,
    privateOriginalDenialArtifactPath: input.privateOriginalDenialArtifactPath ?? null,
    tenantIsolationArtifactPath: input.tenantIsolationArtifactPath ?? null,
    retentionArtifactPath: input.retentionArtifactPath ?? null,
    ciEvidenceArtifactPath: input.ciEvidenceArtifactPath ?? null,
    secretSafeArtifactsPath: input.secretSafeArtifactsPath ?? null,
    ciRunUrl: input.ciRunUrl ?? null,
  };
}

export async function persistProviderStorageUploadRun(
  repository: ProviderStorageUploadRunRepository,
  input: ProviderStorageUploadRunRecordInput,
): Promise<unknown> {
  const data = buildProviderStorageUploadRunData(input);
  const { tenantId: _tenantId, runId: _runId, ...update } = data;

  return repository.providerStorageUploadRun.upsert({
    where: { tenantId_runId: { tenantId: data.tenantId, runId: data.runId } },
    create: data,
    update,
  });
}

export const providerStorageUploadRuntimeMatrix = [
  {
    id: "security-typecheck",
    command: "pnpm --filter @inkroute/security typecheck",
    artifact: "coverage/provider-storage-security-typecheck.txt",
    status: "wired",
  },
  {
    id: "security-upload-tests",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/provider-storage-security-test.txt",
    status: "wired",
  },
  {
    id: "web-upload-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/provider-storage-web-typecheck.txt",
    status: "wired",
  },
  {
    id: "secure-upload-route-tests",
    command: "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
    artifact: "coverage/provider-storage-upload-route-test.txt",
    status: "wired",
  },
  {
    id: "provider-config-secrets",
    command: "select object storage provider and configure redacted provider secrets",
    artifact: "coverage/provider-storage-config-redacted.json",
    status: "provider-gated",
  },
  {
    id: "bucket-acl-derivative-policy",
    command: "verify private original ACL and approved derivative public policy",
    artifact: "coverage/provider-storage-bucket-policy.json",
    status: "provider-gated",
  },
  {
    id: "signed-upload-download-urls",
    command: "object storage provider upload/download integration tests",
    artifact: "coverage/provider-storage-signed-url-provider.json",
    status: "integration-gated",
  },
  {
    id: "fileasset-link-audit-persistence",
    command: "persist FileAsset, link rows, SignedUrlGrant, and AuditLog transactionally",
    artifact: "coverage/provider-storage-fileasset-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "scan-derivative-worker",
    command: "malware scan and derivative worker integration tests",
    artifact: "coverage/provider-storage-scan-derivative-worker.json",
    status: "scan-gated",
  },
  {
    id: "private-original-denial",
    command: "private-original public-read denial test",
    artifact: "coverage/provider-storage-private-original-denial.json",
    status: "integration-gated",
  },
  {
    id: "tenant-isolation-retention",
    command: "cross-tenant denial and privacy retention provider tests",
    artifact: "coverage/provider-storage-tenant-isolation.json",
    status: "integration-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions storage/upload evidence job",
    artifact: "coverage/provider-storage-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly ProviderStorageUploadRuntimeMatrixEntry[];

export const providerStorageUploadRuntimeReadiness = buildProviderStorageUploadReadinessPlan({
  packageScripts: ["typecheck", "test"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  webUploadRouteTestsPassed: false,
  webTypecheckPassed: false,
  storageProviderSelected: false,
  storageProviderConfigured: false,
  storageSecretsConfigured: false,
  privateBucketAclVerified: false,
  derivativeBucketPolicyVerified: false,
  signedUploadUrlsProviderBacked: false,
  signedDownloadUrlsProviderBacked: false,
  serverOwnedObjectKeysEnforced: false,
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

export function buildProviderStorageUploadDecisionRequiredEvidence(
  readinessEvidence: typeof providerStorageUploadRuntimeReadiness.requiredEvidence,
): ProviderStorageUploadRequiredEvidence {
  return [
    ...readinessEvidence,
    "ProviderStorageUploadRun row with command, readiness area, artifact, provider configuration, bucket policy, and scan/derivative matrices.",
    "Artifact bundle proving provider config, private bucket ACL, derivative policy, signed URLs, transactional persistence, scan/derivative worker, private-original denial, tenant isolation, retention, CI evidence, and secret-safe artifacts.",
  ];
}

export type ProviderStorageUploadRequiredEvidence = readonly [
  ...typeof providerStorageUploadRuntimeReadiness.requiredEvidence,
  "ProviderStorageUploadRun row with command, readiness area, artifact, provider configuration, bucket policy, and scan/derivative matrices.",
  "Artifact bundle proving provider config, private bucket ACL, derivative policy, signed URLs, transactional persistence, scan/derivative worker, private-original denial, tenant isolation, retention, CI evidence, and secret-safe artifacts.",
];

export const providerStorageUploadRequiredEvidence = buildProviderStorageUploadDecisionRequiredEvidence(
  providerStorageUploadRuntimeReadiness.requiredEvidence,
);

export function buildProviderStorageUploadEvidenceDecision(
  input: ProviderStorageUploadEvidenceInput,
): ProviderStorageUploadEvidenceDecision {
  const coveredReadinessAreas = new Set(input.coveredReadinessAreas);
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingReadinessAreas = providerStorageUploadReadinessAreas.filter((area) => !coveredReadinessAreas.has(area));
  const missingArtifacts = providerStorageUploadArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = providerStorageUploadRuntimeCommands.filter((command) => !completedCommands.has(command));
  const readinessPlan = buildProviderStorageUploadReadinessPlan({
    packageScripts: ["typecheck", "test"],
    securityTestsPassed: input.securityTestsPassed,
    securityTypecheckPassed: input.securityTypecheckPassed,
    webUploadRouteTestsPassed: input.webUploadRouteTestsPassed,
    webTypecheckPassed: input.webTypecheckPassed,
    storageProviderSelected: input.storageProviderSelected,
    storageProviderConfigured: input.storageProviderConfigured,
    storageSecretsConfigured: input.storageSecretsConfigured,
    privateBucketAclVerified: input.privateBucketAclVerified,
    derivativeBucketPolicyVerified: input.derivativeBucketPolicyVerified,
    signedUploadUrlsProviderBacked: input.signedUploadUrlsProviderBacked,
    signedDownloadUrlsProviderBacked: input.signedDownloadUrlsProviderBacked,
    serverOwnedObjectKeysEnforced: input.serverOwnedObjectKeysEnforced,
    fileAssetPersistenceTransactional: input.fileAssetPersistenceTransactional,
    auditLogPersistenceConfigured: input.auditLogPersistenceConfigured,
    linkTablePersistenceConfigured: input.linkTablePersistenceConfigured,
    signedUrlGrantPersistenceConfigured: input.signedUrlGrantPersistenceConfigured,
    malwareScanProviderConfigured: input.malwareScanProviderConfigured,
    scanVerdictPersistenceConfigured: input.scanVerdictPersistenceConfigured,
    metadataStrippingWorkerConfigured: input.metadataStrippingWorkerConfigured,
    publicDerivativeGenerationConfigured: input.publicDerivativeGenerationConfigured,
    privateOriginalPublicReadDenied: input.privateOriginalPublicReadDenied,
    approvedDerivativePublicReadVerified: input.approvedDerivativePublicReadVerified,
    tenantScopedProviderIntegrationTestsPassed: input.tenantScopedProviderIntegrationTestsPassed,
    privacyRetentionEnforced: input.privacyRetentionEnforced,
    ciEvidenceCaptured: input.ciEvidenceCaptured,
    secretSafeArtifactsCaptured: input.secretSafeArtifactsCaptured,
  });
  const blockers = [...readinessPlan.blockers];

  if (!input.providerStorageUploadRunPersisted) {
    blockers.push("ProviderStorageUploadRun persistence row must be captured for durable auditability.");
  }
  if (missingReadinessAreas.length > 0) {
    blockers.push("Every required provider storage readiness area must be covered.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required provider storage artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required provider storage command must be completed.");
  }

  return {
    status:
      blockers.length === 0 && missingReadinessAreas.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0
        ? "complete"
        : "blocked",
    missingReadinessAreas,
    missingArtifacts,
    missingCommands,
    requiredReadinessAreas: providerStorageUploadReadinessAreas,
    requiredArtifacts: providerStorageUploadArtifactPaths,
    requiredCommands: providerStorageUploadRuntimeCommands,
    requiredEvidence: providerStorageUploadRequiredEvidence,
    blockers,
  };
}

const sensitiveProviderStorageKeyPattern =
  /(token|secret|password|authorization|cookie|email|phone|tenant|user|account|database|url|uri|dsn|key|id|bucket|object|storage|provider|client|file|asset|grant|request|response|payload|body|signature|raw|signed|scan|malware|quarantine|derivative|acl|access|denial|audit|artifact|path|command|typecheck|build|test|output|stdout|stderr|log|ci|workflow|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner)$/iu;
const sensitiveProviderStorageValuePattern =
  /(https?:\/\/[^\s"']+|s3:\/\/[^\s"']+|postgres(?:ql)?:\/\/[^\s"']+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d .()-]{8,}\d|(?:gh[psuor]_|github_pat_)[A-Za-z0-9_]+|(?:AKIA|ASIA)[A-Z0-9]{16}|(?:tenant|client|booking|fileasset|signedurlgrant|referenceimage|portfolioimage|audit|bucket|object|storage|scan|malware|quarantine|derivative|workflow|ci|run|commit|repository|repo|branch|pull|pr|reviewer|codeowner)[-_:/]?[A-Za-z0-9_.-]{6,}|(?:private|public|derivative|quarantine)\/[A-Za-z0-9_./-]{6,}|[A-Za-z0-9_-]{24,})/giu;

const redactProviderStorageString = (value: string): string =>
  value.replace(sensitiveProviderStorageValuePattern, "[REDACTED]");

export const providerStorageUploadExecutionPolicy = {
  codexMayClassifyStaticStorageReadiness: true,
  providerStorageEvidenceRequiredForClosure: true,
  secretStoreConfigurationRequiredForClosure: true,
  providerBackedPersistenceRequiredForClosure: true,
  integrationTestsRequiredForClosure: true,
  secretSafeArtifactsRequiredForClosure: true,
} as const;

export const providerStorageUploadRequiredExternalEvidence = [
  "Redacted storage provider selection, bucket policy, credentials, and signed URL configuration evidence.",
  "Provider-backed signed upload/download URL integration evidence.",
  "Transactional FileAsset, link row, SignedUrlGrant, and AuditLog persistence evidence.",
  "Malware scan, metadata stripping, derivative generation, private-original denial, approved-derivative public-read, tenant-isolation, and retention evidence.",
  "GitHub Actions storage/upload evidence job URL and conclusion.",
  "Provider-backed ProviderStorageUploadRun persistence row captured from the target database.",
  "Secret-safe artifact bundle with no provider secrets, raw object keys, client-private files, or PII.",
] as const;

const buildRedactedProviderStorageValue = (
  value: unknown,
  path: string,
  redactions: string[],
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item, index) => buildRedactedProviderStorageValue(item, `${path}[${index}]`, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        if (sensitiveProviderStorageKeyPattern.test(key)) {
          redactions.push(nextPath);
          return [key, "[REDACTED]"];
        }
        return [key, buildRedactedProviderStorageValue(nestedValue, nextPath, redactions)];
      }),
    );
  }

  if (typeof value === "string") {
    const redactedValue = redactProviderStorageString(value);
    if (redactedValue !== value) {
      redactions.push(path || "value");
    }
    return redactedValue;
  }

  return value;
};

export function buildProviderStorageUploadExecutionPlan(): ProviderStorageUploadExecutionPlan {
  return {
    localCommands: providerStorageUploadRuntimeLocalCommands,
    externalCommands: providerStorageUploadRuntimeExternalCommands,
    localArtifacts: providerStorageUploadRuntimeLocalArtifacts,
    externalArtifacts: providerStorageUploadRuntimeExternalArtifacts,
    securityTypecheckExecutionAllowed: false,
    securityTestExecutionAllowed: false,
    webTypecheckExecutionAllowed: false,
    uploadRouteTestExecutionAllowed: false,
    providerConfigCaptureAllowed: false,
    bucketPolicyVerificationAllowed: false,
    signedUrlProviderTestAllowed: false,
    persistenceIntegrationExecutionAllowed: false,
    scanDerivativeWorkerExecutionAllowed: false,
    privateOriginalDenialExecutionAllowed: false,
    tenantIsolationRetentionExecutionAllowed: false,
    ciStorageEvidenceExecutionAllowed: false,
    secretSafeArtifactCaptureAllowed: false,
    providerBackedPersistenceExecutionAllowed: false,
    executionPolicy: providerStorageUploadExecutionPolicy,
    requiredExternalEvidence: providerStorageUploadRequiredExternalEvidence,
  };
}

export function buildRedactedProviderStorageUploadArtifact(artifact: unknown): unknown {
  return buildRedactedProviderStorageValue(artifact, "", []);
}

export function buildProviderStorageUploadArtifactReview(
  artifact: unknown,
): ProviderStorageUploadArtifactReview {
  const redactions: string[] = [];

  return {
    artifact: buildRedactedProviderStorageValue(artifact, "", redactions),
    redactions,
    requiredExternalEvidence: providerStorageUploadRequiredExternalEvidence,
    safeForTracker: true,
  };
}

