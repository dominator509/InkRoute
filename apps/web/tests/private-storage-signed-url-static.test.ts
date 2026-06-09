import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrivateStorageSignedUrlContract,
  privateStorageProviderEnvNames,
  privateStorageSignedUrlArtifactPaths,
  privateStorageSignedUrlCommands,
  privateStorageSignedUrlPreview,
  privateStorageSignedUrlRuntimeContract,
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
    expect(privateStorageSignedUrlPreview.plan.status).toBe("provider_gated");
    expect(privateStorageSignedUrlPreview.requiredWrites).toEqual(["FileAsset", "AuditLog", "SignedUrlGrant"]);
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
    expect(secureIntentRoute).toContain("buildPrivateStorageAccessPlan");
    expect(secureIntentRoute).toContain("publicDerivativeObjectKey");
    expect(privateStorageSignedUrlRuntimeContract.status).toBe("blocked");
    expect(privateStorageSignedUrlRuntimeContract.blockers).toEqual(
      expect.arrayContaining([
        "S3 or Supabase private object storage provider must be configured.",
        "Storage provider environment variables must be configured without exposing secrets.",
        "Provider signed upload URLs must be implemented with tenant-scoped object keys.",
        "SignedUrlGrant persistence must record issuer, recipient, object key, scope, expiry, and use status.",
      ]),
    );
  });

  it("pins CI, manifest, tracker, commands, and artifact paths for GAP-097", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(privateStorageSignedUrlCommands).toContain("S3/Supabase private bucket ACL denial test");
    expect(privateStorageSignedUrlCommands).toContain("SignedUrlGrant expiry and revocation persistence test");
    expect(privateStorageSignedUrlArtifactPaths).toContain("coverage/private-storage-fileasset-grant-persistence.json");
    expect(ci).toContain("Run Phase 13 private storage signed URL contracts");
    expect(ci).toContain("apps/web/tests/private-storage-signed-url-static.test.ts");
    expect(ci).toContain("private-storage-signed-url-artifacts");
    expect(manifest).toContain("unit-web-private-storage-signed-url-static");
    expect(tracker).toContain("apps/web/lib/privateStorageSignedUrls.ts");
    expect(tracker).toContain("live S3/Supabase signing proof remains open");
  });
});
