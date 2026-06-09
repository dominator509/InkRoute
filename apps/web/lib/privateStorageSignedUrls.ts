import {
  buildPrivateStorageAccessPlan,
  buildPrivateStorageRuntimeReadinessPlan,
  type PrivateStorageAccessPlan,
  type StorageAccessOperation,
  type UploadAssetKind,
} from "@inkroute/security";

export type PrivateStorageGrantAction =
  | "resolve-provider-bucket"
  | "derive-server-owned-object-key"
  | "verify-tenant-subject-scope"
  | "require-approved-scan-for-download"
  | "issue-scoped-signed-url"
  | "persist-signed-url-grant"
  | "check-signed-url-revocation"
  | "write-private-storage-audit-log"
  | "deny-private-original-public-read"
  | "serve-public-derivative-only";

export interface PrivateStorageSignedUrlInput {
  tenantId: string;
  subjectId: string;
  requestedByUserId: string;
  kind: UploadAssetKind;
  operation: StorageAccessOperation;
  objectKey: string;
  storageVisibility: Parameters<typeof buildPrivateStorageAccessPlan>[0]["storageVisibility"];
  expiresInSeconds: number;
  now: string;
  expiresAt?: string;
  revokedAt?: string;
  scanApproved: boolean;
  providerConfigured: boolean;
  publicDerivativeObjectKey?: string;
}

export const privateStorageProviderEnvNames = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export const privateStorageSignedUrlArtifactPaths = [
  "coverage/private-storage-signed-url-plan.json",
  "coverage/private-storage-provider-env-redacted.json",
  "coverage/private-storage-private-acl-denial.json",
  "coverage/private-storage-signed-upload-url.json",
  "coverage/private-storage-signed-download-url.json",
  "coverage/private-storage-signed-url-revocation.json",
  "coverage/private-storage-fileasset-grant-persistence.json",
  "coverage/private-storage-public-derivative-access.json",
  "test-results/private-storage-signed-urls",
] as const;

export const privateStorageSignedUrlCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/private-storage-signed-url-static.test.ts",
  "S3/Supabase private bucket ACL denial test",
  "provider signed upload URL integration test",
  "provider signed download URL integration test",
  "SignedUrlGrant expiry and revocation persistence test",
  "approved derivative public-read integration test",
] as const;

export function buildPrivateStorageSignedUrlContract(input: Omit<Parameters<typeof buildPrivateStorageAccessPlan>[0], "requestedByUserId"> & { requestedByUserId: string }) {
  const plan = buildPrivateStorageAccessPlan(input);
  const actions: PrivateStorageGrantAction[] = [
    "resolve-provider-bucket",
    "derive-server-owned-object-key",
    "verify-tenant-subject-scope",
    "issue-scoped-signed-url",
    "persist-signed-url-grant",
    "check-signed-url-revocation",
    "write-private-storage-audit-log",
    "deny-private-original-public-read",
  ];

  if (input.operation === "download") actions.push("require-approved-scan-for-download");
  if (input.storageVisibility === "public_derivative") actions.push("serve-public-derivative-only");

  return {
    gapIds: ["GAP-097"] as const,
    plan,
    actions,
    requiredWrites: plan.requiredWrites,
    providerEnvNames: privateStorageProviderEnvNames,
    artifactPaths: privateStorageSignedUrlArtifactPaths,
  };
}

export const privateStorageSignedUrlRuntimeContract = buildPrivateStorageRuntimeReadinessPlan({
  packageScripts: ["test", "typecheck"],
  securityTestsPassed: false,
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

export const privateStorageSignedUrlPreview = buildPrivateStorageSignedUrlContract({
  kind: "reference_private",
  operation: "upload",
  tenantId: "tenant_demo",
  subjectId: "booking_demo",
  requestedByUserId: "user_demo",
  objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
  storageVisibility: "tenant_private",
  expiresInSeconds: 900,
  now: "2026-06-09T00:00:00.000Z",
  scanApproved: false,
  providerConfigured: false,
});
