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

export const providerStorageUploadRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
  "object storage provider upload/download integration tests",
  "malware scan and derivative worker integration tests",
  "private-original public-read denial test",
  "GitHub Actions storage/upload evidence job",
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
