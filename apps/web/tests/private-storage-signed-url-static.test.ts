import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedPrivateStorageSignedUrlArtifact,
  buildPrivateStorageSignedUrlArtifactReview,
  buildPrivateStorageSignedUrlEvidenceDecision,
  buildPrivateStorageSignedUrlContract,
  buildPrivateStorageSignedUrlExecutionPlan,
  buildPrivateStorageSignedUrlGrantPersistenceContract,
  privateStorageProviderEnvNames,
  privateStorageSignedUrlArtifactPaths,
  privateStorageSignedUrlCommands,
  privateStorageSignedUrlExternalArtifacts,
  privateStorageSignedUrlExternalCommands,
  privateStorageSignedUrlExecutionPolicy,
  privateStorageSignedUrlLocalArtifacts,
  privateStorageSignedUrlLocalCommands,
  privateStorageSignedUrlProofFiles,
  privateStorageSignedUrlRequiredExternalEvidence,
  privateStorageSignedUrlGrantPersistencePreview,
  privateStorageSignedUrlPreview,
  privateStorageSignedUrlRuntimeContract,
  persistPrivateStorageSignedUrlGrant,
} from "../lib/privateStorageSignedUrls";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-097 private storage signed URL contract", () => {
  it("builds signed upload grants with provider, tenant scope, server object key, persistence, and audit gates", () => {
    const source = readWorkspaceFile("apps/web/lib/privateStorageSignedUrls.ts");

    expect(source).toContain("buildPrivateStorageAccessPlan");
    expect(source).toContain("buildPrivateStorageRuntimeReadinessPlan");
    expect(source).toContain("resolve-provider-bucket");
    expect(source).toContain("derive-server-owned-object-key");
    expect(source).toContain("verify-tenant-subject-scope");
    expect(source).toContain("persist-signed-url-grant");
    expect(source).toContain("write-private-storage-audit-log");
    expect(source).toContain("PrivateStorageSignedUrlPersistenceClient");
    expect(source).toContain("PrivateStorageProviderSigner");
    expect(source).toContain("createPrivateStorageProviderSigner");
    expect(source).toContain("rawSignedUrlStored: false");
    expect(source).toContain("persistPrivateStorageSignedUrlGrant");
    expect(source).toContain("rawSignedUrlStored: false");
    expect(source).toContain("where: {");
    expect(privateStorageSignedUrlPreview.plan.status).toBe("provider_gated");
    expect(privateStorageSignedUrlPreview.requiredWrites).toEqual(["FileAsset", "AuditLog", "SignedUrlGrant"]);
  });

  it("pins durable SignedUrlGrant persistence rows, revocation lookup, and redacted audit actions", () => {
    const schema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const contract = buildPrivateStorageSignedUrlGrantPersistenceContract({
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
      revokedAt: "2026-06-09T00:05:00.000Z",
      revokeReason: "manual_revocation",
    });

    expect(schema).toContain("model SignedUrlGrant");
    expect(schema).toContain("signedUrlHash");
    expect(schema).toContain("@@index([tenantId, objectKey])");
    expect(contract.transactionWrites).toEqual(["FileAsset", "SignedUrlGrant", "AuditLog"]);
    expect(contract.auditActions).toContain("private_storage.signed_url.revoked");
    expect(contract.redactedFields).toContain("signedUrlHash");
    expect(contract.revocationCheck).toBe("tenant_id_file_asset_object_key_revoked_at");
    expect(privateStorageSignedUrlGrantPersistencePreview.modelName).toBe("SignedUrlGrant");
  });

  it("rejects revoked, expired, unscanned, and unsafe derivative access while preserving public derivative separation", () => {
    const revoked = buildPrivateStorageSignedUrlContract({
      kind: "reference_private",
      operation: "download",
      tenantId: "tenant_demo",
      subjectId: "booking_demo",
      requestedByUserId: "user_demo",
      objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
      storageVisibility: "tenant_private",
      expiresInSeconds: 900,
      now: "2026-06-09T00:00:00.000Z",
      revokedAt: "2026-06-08T00:00:00.000Z",
      scanApproved: true,
      providerConfigured: true,
    });
    const unscanned = buildPrivateStorageSignedUrlContract({
      kind: "reference_private",
      operation: "download",
      tenantId: "tenant_demo",
      subjectId: "booking_demo",
      requestedByUserId: "user_demo",
      objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
      storageVisibility: "tenant_private",
      expiresInSeconds: 900,
      now: "2026-06-09T00:00:00.000Z",
      scanApproved: false,
      providerConfigured: true,
    });
    const derivative = buildPrivateStorageSignedUrlContract({
      kind: "portfolio_public",
      operation: "download",
      tenantId: "tenant_demo",
      subjectId: "portfolio_demo",
      requestedByUserId: "user_demo",
      objectKey: "private/tenant_demo/portfolio/original.jpg",
      storageVisibility: "public_derivative",
      publicDerivativeObjectKey: "public/tenant_demo/portfolio/derivative.webp",
      expiresInSeconds: 900,
      now: "2026-06-09T00:00:00.000Z",
      scanApproved: true,
      providerConfigured: true,
    });

    expect(revoked.plan.status).toBe("revoked");
    expect(unscanned.plan.status).toBe("rejected");
    expect(unscanned.plan.reasons).toContain("Private downloads require approved scan status.");
    expect(derivative.plan.publicReadAllowed).toBe(true);
    expect(derivative.actions).toContain("serve-public-derivative-only");
  });

  it("pins provider env names, route previews, and readiness blockers without exposing secrets", () => {
    const envExample = readWorkspaceFile(".env.example");
    const envDocs = readWorkspaceFile("ENVIRONMENT_VARIABLES.md");
    const uploadPolicyRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts");
    const secureIntentRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");

    expect(privateStorageProviderEnvNames).toEqual(
      expect.arrayContaining(["S3_BUCKET", "S3_SECRET_ACCESS_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]),
    );
    expect(envExample).toContain("S3_BUCKET=");
    expect(envDocs).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(uploadPolicyRoute).toContain("privateStorageAccessPreview");
    expect(uploadPolicyRoute).toContain('status: "local-preview"');
    expect(uploadPolicyRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(uploadPolicyRoute).toContain("{ headers: noStoreHeaders }");
    expect(secureIntentRoute).toContain("buildPrivateStorageAccessPlan");
    expect(secureIntentRoute).toContain("local signed-upload validation rules");
    expect(secureIntentRoute).toContain("publicDerivativeObjectKey");
    expect(privateStorageSignedUrlRuntimeContract.status).toBe("blocked");
    expect(privateStorageSignedUrlRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "S3 or Supabase private object storage provider must be configured.",
        "Storage provider environment variables must be configured without exposing secrets.",
      ]),
    );
    expect(privateStorageSignedUrlRuntimeContract.blockers).not.toContain(
      "Provider signed upload URLs must be implemented with tenant-scoped object keys.",
    );
    expect(privateStorageSignedUrlRuntimeContract.blockers).not.toContain(
      "Provider signed download URLs must be implemented with scan/revocation gates.",
    );
    expect(privateStorageSignedUrlRuntimeContract.blockers).not.toContain(
      "SignedUrlGrant persistence must record issuer, recipient, object key, scope, expiry, and use status.",
    );
    expect(privateStorageSignedUrlRuntimeContract.blockers).not.toContain(
      "AuditLog persistence must record signed URL creation and revocation without raw URLs.",
    );
  });

  it("pins CI, manifest, tracker, commands, and artifact paths for GAP-097", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(privateStorageSignedUrlCommands).toContain("S3/Supabase private bucket ACL denial test");
    expect(privateStorageSignedUrlCommands).toContain("SignedUrlGrant expiry and revocation persistence test");
    expect(privateStorageSignedUrlArtifactPaths).toContain("coverage/private-storage-fileasset-grant-persistence.json");
    expect(manifest).toContain("SignedUrlGrant Prisma model and app row contract are wired");
    expect(ci).toContain("Run Phase 13 private storage signed URL contracts");
    expect(ci).toContain("apps/web/tests/private-storage-signed-url-static.test.ts");
    expect(ci).toContain("private-storage-signed-url-artifacts");
    expect(manifest).toContain("unit-web-private-storage-signed-url-static");
    expect(tracker).toContain("apps/web/lib/privateStorageSignedUrls.ts");
    expect(tracker).toContain("Private storage signed URL evidence classifier wired and provider signing proof gated");
    expect(tracker).toContain("privateStorageSignedUrlLocalArtifacts");
    expect(tracker).toContain("privateStorageSignedUrlExternalArtifacts");
  });

  it("pins current private storage signed URL proof files for GAP-097", () => {
    expect(privateStorageSignedUrlProofFiles).toEqual(
      expect.arrayContaining([
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
      ]),
    );
    for (const file of privateStorageSignedUrlProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-097 evidence as blocked until provider signing and ACL proof is captured", () => {
    const blockedDecision = buildPrivateStorageSignedUrlEvidenceDecision({
      packagePrivateStorageTestsPassed: true,
      providerEnvGateCaptured: true,
      privateBucketAclDenialCaptured: false,
      signedUploadUrlCaptured: false,
      signedDownloadUrlCaptured: false,
      signedUrlRevocationCaptured: true,
      fileAssetGrantPersistenceCaptured: true,
      publicDerivativeAccessCaptured: false,
      requiredCommandsRun: privateStorageSignedUrlCommands.filter(
        (command) =>
          command !== "S3/Supabase private bucket ACL denial test" &&
          command !== "provider signed upload URL integration test" &&
          command !== "provider signed download URL integration test",
      ),
      capturedArtifacts: [
        "coverage/private-storage-signed-url-plan.json",
        "coverage/private-storage-provider-env-redacted.json",
        "coverage/private-storage-signed-url-revocation.json",
        "coverage/private-storage-fileasset-grant-persistence.json",
        "test-results/private-storage-signed-urls",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture private bucket ACL public-read denial proof.",
        "Capture provider signed upload URL proof.",
        "Capture provider signed download URL proof.",
        "Capture approved public derivative access without private-original exposure.",
        "Required command not recorded: S3/Supabase private bucket ACL denial test",
        "Required command not recorded: provider signed upload URL integration test",
        "Required command not recorded: provider signed download URL integration test",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/private-storage-private-acl-denial.json",
        "coverage/private-storage-signed-upload-url.json",
        "coverage/private-storage-signed-download-url.json",
        "coverage/private-storage-public-derivative-access.json",
      ]),
    );
    expect(blockedDecision.redactionPolicy).toEqual({
      signedUrlsStoredRaw: false,
      signedUrlHashesRedacted: true,
      providerSecretsRedacted: true,
    });

    const completeDecision = buildPrivateStorageSignedUrlEvidenceDecision({
      packagePrivateStorageTestsPassed: true,
      providerEnvGateCaptured: true,
      privateBucketAclDenialCaptured: true,
      signedUploadUrlCaptured: true,
      signedDownloadUrlCaptured: true,
      signedUrlRevocationCaptured: true,
      fileAssetGrantPersistenceCaptured: true,
      publicDerivativeAccessCaptured: true,
      requiredCommandsRun: privateStorageSignedUrlCommands,
      capturedArtifacts: privateStorageSignedUrlArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(privateStorageSignedUrlCommands);
    expect(completeDecision.requiredEvidence).toBe(privateStorageSignedUrlArtifactPaths);
  });

  it("keeps GAP-097 provider storage signing disabled in the local plan", () => {
    const plan = buildPrivateStorageSignedUrlExecutionPlan();

    expect(plan.bucketAclExecutionAllowed).toBe(false);
    expect(plan.transactionalPersistenceContractAvailable).toBe(true);
    expect(plan.signedUploadExecutionAllowed).toBe(false);
    expect(plan.signedDownloadExecutionAllowed).toBe(false);
    expect(plan.transactionalPersistenceExecutionAllowed).toBe(false);
    expect(plan.publicDerivativeExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(privateStorageSignedUrlExecutionPolicy);
    expect(plan.policy).toEqual({
      transactionalPersistenceContractAvailable: true,
      bucketAclExecutionAllowed: false,
      signedUploadExecutionAllowed: false,
      signedDownloadExecutionAllowed: false,
      transactionalPersistenceExecutionAllowed: false,
      publicDerivativeExecutionAllowed: false,
      tenantScopedAccessExecutionAllowed: false,
    });
    expect(plan.localCommands).toBe(privateStorageSignedUrlLocalCommands);
    expect(plan.externalCommands).toBe(privateStorageSignedUrlExternalCommands);
    expect(plan.localArtifacts).toBe(privateStorageSignedUrlLocalArtifacts);
    expect(plan.externalArtifacts).toBe(privateStorageSignedUrlExternalArtifacts);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/private-storage-private-acl-denial.json",
      "coverage/private-storage-signed-upload-url.json",
      "coverage/private-storage-signed-download-url.json",
      "coverage/private-storage-public-derivative-access.json",
    ]));
    expect(plan.requiredExternalEvidence).toBe(privateStorageSignedUrlRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "S3/Supabase private bucket ACL denial proof",
      "provider signed upload URL proof",
      "provider signed download URL proof",
      "SignedUrlGrant expiry and revocation persistence proof",
      "approved derivative public-read integration proof",
    ]);
    expect(plan.disabledReasons.join(" ")).toContain("Private bucket ACL denial proof requires live S3/Supabase bucket access.");
    expect(plan.disabledReasons.join(" ")).toContain("SignedUrlGrant transactional persistence contract is wired");
  });

  it("persists signed URL grant metadata without storing raw signed URLs", async () => {
    const writes: unknown[] = [];
    const result = await persistPrivateStorageSignedUrlGrant(
      {
        fileAsset: {
          async updateMany(input) {
            writes.push(input);
            return { count: 1 };
          },
        },
        signedUrlGrant: {
          async create(input) {
            writes.push(input);
            return {};
          },
        },
        auditLog: {
          async create(input) {
            writes.push(input);
            return {};
          },
        },
      },
      {
        grant: {
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
        },
      },
    );

    const serialized = JSON.stringify(writes);
    expect(result).toMatchObject({
      persisted: true,
      fileAssetUpdated: true,
      grantPersisted: true,
      auditAction: "private_storage.signed_url.created",
      rawSignedUrlStored: false,
    });
    expect(serialized).toContain('"tenantId":"tenant_demo"');
    expect(serialized).toContain('"entityType":"SignedUrlGrant"');
    expect(serialized).toContain('"action":"private_storage.signed_url.created"');
    expect(serialized).not.toContain("private/tenant_demo/reference/fileasset_demo.jpg");
    expect(serialized).not.toContain("https://");
  });

  it("redacts GAP-097 signed URL and provider artifacts before review", () => {
    const rawArtifact = {
      s3_secret_key: "s3-secret-key",
      supabase_service_role_key: "supabase-secret",
      signedUrl: "https://storage.example/private/file.jpg?signature=abc123",
      signedUrlHash: "sha256:private-hash",
      bucket: "inkroute-private",
      objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
      providerPayload: { rawBody: "{\"email\":\"client@example.com\",\"phone\":\"+1 555 777 8888\"}" },
      headers: ["Authorization: Bearer signed-url-token"],
      stack: "Error: provider failed",
    };

    const redacted = buildRedactedPrivateStorageSignedUrlArtifact(rawArtifact);
    const review = buildPrivateStorageSignedUrlArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("s3-secret-key");
    expect(serialized).not.toContain("supabase-secret");
    expect(serialized).not.toContain("signature=abc123");
    expect(serialized).not.toContain("sha256:private-hash");
    expect(serialized).not.toContain("inkroute-private");
    expect(serialized).not.toContain("private/tenant_demo/reference/fileasset_demo.jpg");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 777 8888");
    expect(serialized).not.toContain("signed-url-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(privateStorageSignedUrlArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "S3/Supabase private bucket ACL denial proof",
      "Provider signed upload URL proof",
      "Approved derivative public-read proof",
    ]));
  });
});

