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

export interface PrivateStorageSignedUrlGrantPersistenceInput {
  tenantId: string;
  fileAssetId: string;
  issuedByUserId: string;
  recipientUserId?: string;
  operation: StorageAccessOperation;
  scope: "upload" | "download" | "public_derivative";
  bucket: string;
  objectKey: string;
  signedUrlHash?: string;
  expiresAt: string;
  revokedAt?: string;
  revokeReason?: string;
}

export interface PrivateStorageSignedUrlGrantPersistenceContract {
  modelName: "SignedUrlGrant";
  row: PrivateStorageSignedUrlGrantPersistenceInput;
  transactionWrites: readonly ["FileAsset", "SignedUrlGrant", "AuditLog"];
  auditActions: readonly ["private_storage.signed_url.created", "private_storage.signed_url.revoked"];
  redactedFields: readonly ["signedUrl", "signedUrlHash"];
  revocationCheck: "tenant_id_file_asset_object_key_revoked_at";
}

export interface PrivateStorageSignedUrlPersistenceClient {
  readonly fileAsset: {
    updateMany(input: {
      where: { id: string; tenantId: string; objectKey: string };
      data: { signedUrlExpiresAt: Date; metadata: Record<string, unknown> };
    }): Promise<{ count: number }>;
  };
  readonly signedUrlGrant: {
    create(input: {
      data: {
        tenantId: string;
        fileAssetId: string;
        issuedByUserId: string;
        recipientUserId?: string;
        operation: string;
        scope: string;
        bucket: string;
        objectKey: string;
        signedUrlHash?: string;
        expiresAt: Date;
        revokedAt?: Date;
        revokeReason?: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
  readonly auditLog: {
    create(input: {
      data: {
        tenantId: string;
        actorUserId: string;
        action: "private_storage.signed_url.created" | "private_storage.signed_url.revoked";
        entityType: "SignedUrlGrant";
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
}

export interface PrivateStorageSignedUrlPersistenceResult {
  readonly persisted: boolean;
  readonly fileAssetUpdated: boolean;
  readonly grantPersisted: true;
  readonly auditAction: "private_storage.signed_url.created" | "private_storage.signed_url.revoked";
  readonly rawSignedUrlStored: false;
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

export const privateStorageSignedUrlProofFiles = [
  "packages/security/package.json",
  "packages/security/src/index.ts",
  "packages/security/tests/upload-policy.test.ts",
  "apps/web/lib/privateStorageSignedUrls.ts",
  "apps/web/tests/private-storage-signed-url-static.test.ts",
  "apps/web/tests/secure-upload-intents-route.test.ts",
  "apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts",
  "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
  ".env.example",
  "ENVIRONMENT_VARIABLES.md",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609000000_add_signed_url_grants/migration.sql",
  ".github/workflows/ci.yml",
  "testing/manifests/unit-test-manifest.json",
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

export const privateStorageSignedUrlLocalCommands = privateStorageSignedUrlCommands.slice(0, 2);
export const privateStorageSignedUrlExternalCommands = privateStorageSignedUrlCommands.slice(2);

export const privateStorageSignedUrlRequiredExternalEvidence = [
  "S3/Supabase private bucket ACL denial proof",
  "provider signed upload URL proof",
  "provider signed download URL proof",
  "SignedUrlGrant expiry and revocation persistence proof",
  "approved derivative public-read integration proof",
] as const;

export type PrivateStorageSignedUrlArtifact = (typeof privateStorageSignedUrlArtifactPaths)[number];

export type PrivateStorageSignedUrlCommand = (typeof privateStorageSignedUrlCommands)[number];

export const privateStorageSignedUrlLocalArtifacts = [
  "coverage/private-storage-signed-url-plan.json",
  "coverage/private-storage-provider-env-redacted.json",
  "coverage/private-storage-signed-url-revocation.json",
  "coverage/private-storage-fileasset-grant-persistence.json",
  "test-results/private-storage-signed-urls",
] as const satisfies readonly PrivateStorageSignedUrlArtifact[];

export const privateStorageSignedUrlExternalArtifacts = [
  "coverage/private-storage-private-acl-denial.json",
  "coverage/private-storage-signed-upload-url.json",
  "coverage/private-storage-signed-download-url.json",
  "coverage/private-storage-public-derivative-access.json",
] as const satisfies readonly PrivateStorageSignedUrlArtifact[];

export type PrivateStorageSignedUrlEvidenceInput = {
  packagePrivateStorageTestsPassed: boolean;
  providerEnvGateCaptured: boolean;
  privateBucketAclDenialCaptured: boolean;
  signedUploadUrlCaptured: boolean;
  signedDownloadUrlCaptured: boolean;
  signedUrlRevocationCaptured: boolean;
  fileAssetGrantPersistenceCaptured: boolean;
  publicDerivativeAccessCaptured: boolean;
  requiredCommandsRun: readonly PrivateStorageSignedUrlCommand[];
  capturedArtifacts: readonly PrivateStorageSignedUrlArtifact[];
};

export type PrivateStorageSignedUrlEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: PrivateStorageSignedUrlArtifact[];
  requiredCommands: typeof privateStorageSignedUrlCommands;
  requiredEvidence: typeof privateStorageSignedUrlArtifactPaths;
  redactionPolicy: {
    signedUrlsStoredRaw: false;
    signedUrlHashesRedacted: true;
    providerSecretsRedacted: true;
  };
};

export type PrivateStorageSignedUrlExecutionPlan = {
  status: "local-plan-ready";
  transactionalPersistenceContractAvailable: true;
  bucketAclExecutionAllowed: false;
  signedUploadExecutionAllowed: false;
  signedDownloadExecutionAllowed: false;
  transactionalPersistenceExecutionAllowed: false;
  publicDerivativeExecutionAllowed: false;
  policy: PrivateStorageSignedUrlExecutionPolicy;
  localCommands: typeof privateStorageSignedUrlLocalCommands;
  externalCommands: typeof privateStorageSignedUrlExternalCommands;
  localArtifacts: typeof privateStorageSignedUrlLocalArtifacts;
  externalArtifacts: typeof privateStorageSignedUrlExternalArtifacts;
  requiredExternalEvidence: typeof privateStorageSignedUrlRequiredExternalEvidence;
  disabledReasons: readonly string[];
};

export type PrivateStorageSignedUrlExecutionPolicy = {
  transactionalPersistenceContractAvailable: true;
  bucketAclExecutionAllowed: false;
  signedUploadExecutionAllowed: false;
  signedDownloadExecutionAllowed: false;
  transactionalPersistenceExecutionAllowed: false;
  publicDerivativeExecutionAllowed: false;
  tenantScopedAccessExecutionAllowed: false;
};

export type PrivateStorageSignedUrlArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof privateStorageSignedUrlArtifactPaths;
  retainedExternalGates: readonly string[];
};

const privateStorageSignedUrlSecretPatterns = [
  /(s3[_-]?(?:secret|access)?[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(supabase[_-]?(?:service[_-]?role[_-]?key|url)['":=\s]+)[^"',\s}]+/gi,
  /(signed[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(signed[_-]?url[_-]?hash['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedPrivateStorageSignedUrlArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return privateStorageSignedUrlSecretPatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedPrivateStorageSignedUrlArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /token|secret|authorization|credential|password|signedUrl|signedUrlHash|providerPayload|rawBody|stack|objectKey|bucket/i.test(key)
          ? "[REDACTED]"
          : buildRedactedPrivateStorageSignedUrlArtifact(entry),
      ]),
    );
  }

  return value;
}

export const privateStorageSignedUrlExecutionPolicy: PrivateStorageSignedUrlExecutionPolicy = {
  transactionalPersistenceContractAvailable: true,
  bucketAclExecutionAllowed: false,
  signedUploadExecutionAllowed: false,
  signedDownloadExecutionAllowed: false,
  transactionalPersistenceExecutionAllowed: false,
  publicDerivativeExecutionAllowed: false,
  tenantScopedAccessExecutionAllowed: false,
};

export function buildPrivateStorageSignedUrlExecutionPlan(): PrivateStorageSignedUrlExecutionPlan {
  return {
    status: "local-plan-ready",
    transactionalPersistenceContractAvailable: true,
    bucketAclExecutionAllowed: false,
    signedUploadExecutionAllowed: false,
    signedDownloadExecutionAllowed: false,
    transactionalPersistenceExecutionAllowed: false,
    publicDerivativeExecutionAllowed: false,
    policy: privateStorageSignedUrlExecutionPolicy,
    localCommands: privateStorageSignedUrlLocalCommands,
    externalCommands: privateStorageSignedUrlExternalCommands,
    localArtifacts: privateStorageSignedUrlLocalArtifacts,
    externalArtifacts: privateStorageSignedUrlExternalArtifacts,
    requiredExternalEvidence: privateStorageSignedUrlRequiredExternalEvidence,
    disabledReasons: [
      "Private bucket ACL denial proof requires live S3/Supabase bucket access.",
      "Provider signed upload URL proof requires configured storage secrets.",
      "Provider signed download URL proof requires configured storage secrets and scan-approved objects.",
      "SignedUrlGrant transactional persistence contract is wired, but proof still requires provider-backed storage/database execution.",
      "Approved derivative public-read proof requires live public/private storage access checks.",
    ],
  };
}

export function buildPrivateStorageSignedUrlArtifactReview(rawArtifact: unknown): PrivateStorageSignedUrlArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedPrivateStorageSignedUrlArtifact(rawArtifact),
    requiredArtifacts: privateStorageSignedUrlArtifactPaths,
    retainedExternalGates: [
      "S3/Supabase private bucket ACL denial proof",
      "Provider signed upload URL proof",
      "Provider signed download URL proof",
      "SignedUrlGrant expiry and revocation persistence proof",
      "Approved derivative public-read proof",
    ],
  };
}

export function buildPrivateStorageSignedUrlEvidenceDecision(
  input: PrivateStorageSignedUrlEvidenceInput,
): PrivateStorageSignedUrlEvidenceDecision {
  const blockers = [
    !input.packagePrivateStorageTestsPassed && "Run package private storage planner tests.",
    !input.providerEnvGateCaptured && "Capture provider environment gate proof with redacted secrets.",
    !input.privateBucketAclDenialCaptured && "Capture private bucket ACL public-read denial proof.",
    !input.signedUploadUrlCaptured && "Capture provider signed upload URL proof.",
    !input.signedDownloadUrlCaptured && "Capture provider signed download URL proof.",
    !input.signedUrlRevocationCaptured && "Capture SignedUrlGrant expiry and revocation persistence proof.",
    !input.fileAssetGrantPersistenceCaptured && "Capture FileAsset, SignedUrlGrant, and AuditLog transactional persistence proof.",
    !input.publicDerivativeAccessCaptured && "Capture approved public derivative access without private-original exposure.",
  ].filter(Boolean) as string[];

  const missingArtifacts = privateStorageSignedUrlArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = privateStorageSignedUrlCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: privateStorageSignedUrlCommands,
    requiredEvidence: privateStorageSignedUrlArtifactPaths,
    redactionPolicy: {
      signedUrlsStoredRaw: false,
      signedUrlHashesRedacted: true,
      providerSecretsRedacted: true,
    },
  };
}

export function buildPrivateStorageSignedUrlGrantPersistenceContract(
  input: PrivateStorageSignedUrlGrantPersistenceInput,
): PrivateStorageSignedUrlGrantPersistenceContract {
  return {
    modelName: "SignedUrlGrant",
    row: input,
    transactionWrites: ["FileAsset", "SignedUrlGrant", "AuditLog"],
    auditActions: ["private_storage.signed_url.created", "private_storage.signed_url.revoked"],
    redactedFields: ["signedUrl", "signedUrlHash"],
    revocationCheck: "tenant_id_file_asset_object_key_revoked_at",
  };
}

export async function persistPrivateStorageSignedUrlGrant(
  client: PrivateStorageSignedUrlPersistenceClient,
  input: { grant: PrivateStorageSignedUrlGrantPersistenceInput; signedUrlHash?: string },
): Promise<PrivateStorageSignedUrlPersistenceResult> {
  const signedUrlHash = input.signedUrlHash ?? input.grant.signedUrlHash;
  const expiresAt = new Date(input.grant.expiresAt);
  const revokedAt = input.grant.revokedAt ? new Date(input.grant.revokedAt) : undefined;
  const auditAction = revokedAt ? "private_storage.signed_url.revoked" : "private_storage.signed_url.created";
  const metadata = buildRedactedPrivateStorageSignedUrlArtifact({
    operation: input.grant.operation,
    scope: input.grant.scope,
    bucket: input.grant.bucket,
    objectKey: input.grant.objectKey,
    signedUrlHash,
    expiresAt: input.grant.expiresAt,
    revokedAt: input.grant.revokedAt,
    revokeReason: input.grant.revokeReason,
    rawSignedUrlStored: false,
  }) as Record<string, unknown>;

  const updated = await client.fileAsset.updateMany({
    where: {
      id: input.grant.fileAssetId,
      tenantId: input.grant.tenantId,
      objectKey: input.grant.objectKey,
    },
    data: {
      signedUrlExpiresAt: expiresAt,
      metadata,
    },
  });

  await client.signedUrlGrant.create({
    data: {
      tenantId: input.grant.tenantId,
      fileAssetId: input.grant.fileAssetId,
      issuedByUserId: input.grant.issuedByUserId,
      ...(input.grant.recipientUserId ? { recipientUserId: input.grant.recipientUserId } : {}),
      operation: input.grant.operation,
      scope: input.grant.scope,
      bucket: input.grant.bucket,
      objectKey: input.grant.objectKey,
      ...(signedUrlHash ? { signedUrlHash } : {}),
      expiresAt,
      ...(revokedAt ? { revokedAt } : {}),
      ...(input.grant.revokeReason ? { revokeReason: input.grant.revokeReason } : {}),
      metadata,
    },
  });

  await client.auditLog.create({
    data: {
      tenantId: input.grant.tenantId,
      actorUserId: input.grant.issuedByUserId,
      action: auditAction,
      entityType: "SignedUrlGrant",
      entityId: input.grant.fileAssetId,
      metadata,
    },
  });

  return {
    persisted: updated.count === 1,
    fileAssetUpdated: updated.count === 1,
    grantPersisted: true,
    auditAction,
    rawSignedUrlStored: false,
  };
}

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
  fileAssetPersistenceConfigured: true,
  signedUrlGrantPersistenceConfigured: true,
  signedUrlRevocationPersistenceConfigured: true,
  auditLogPersistenceConfigured: true,
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

export const privateStorageSignedUrlGrantPersistencePreview = buildPrivateStorageSignedUrlGrantPersistenceContract({
  tenantId: "tenant_demo",
  fileAssetId: "fileasset_demo",
  issuedByUserId: "user_demo",
  recipientUserId: "client_demo",
  operation: "download",
  scope: "download",
  bucket: "inkroute-private",
  objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
  signedUrlHash: "sha256:redacted",
  expiresAt: "2026-06-09T00:15:00.000Z",
});
