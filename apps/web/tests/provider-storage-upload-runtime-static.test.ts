import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProviderStorageUploadArtifactReview,
  buildProviderStorageUploadDecisionRequiredEvidence,
  buildProviderStorageUploadExecutionPlan,
  buildProviderStorageUploadRunData,
  buildRedactedProviderStorageUploadArtifact,
  providerStorageUploadArtifactPaths,
  providerStorageUploadExecutionPolicy,
  providerStorageUploadReadinessAreas,
  providerStorageUploadRunPersistenceContract,
  providerStorageUploadRequiredEvidence,
  providerStorageUploadRequiredExternalEvidence,
  providerStorageUploadRuntimeExternalArtifacts,
  providerStorageUploadRuntimeExternalCommands,
  providerStorageUploadRuntimeLocalArtifacts,
  providerStorageUploadRuntimeLocalCommands,
  providerStorageUploadRuntimeCommands,
  providerStorageUploadRuntimeMatrix,
  providerStorageUploadRuntimeReadiness,
  providerStorageUploadRuntimeProofFiles,
  buildProviderStorageUploadEvidenceDecision,
  persistProviderStorageUploadRun,
} from "../lib/providerStorageUploadRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider storage upload runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const uploadRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
  const uploadPolicyRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts");
  const dashboardSignedUploadRoute = readRepoFile("apps/dashboard/app/api/files/signed-upload/route.ts");
  const portfolioImageRoute = readRepoFile("apps/dashboard/app/api/portfolio/[portfolioId]/images/route.ts");
  const uploadRouteTest = readRepoFile("apps/web/tests/secure-upload-intents-route.test.ts");
  const portfolioReadTest = readRepoFile("apps/dashboard/tests/portfolio-read-route-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const providerStorageUploadMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032900_add_provider_storage_upload_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins provider storage commands, readiness areas, matrix rows, and artifacts", () => {
    expect(providerStorageUploadRuntimeCommands).toEqual([
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
    ]);
    expect(providerStorageUploadReadinessAreas).toContain("private-original-bucket-acl");
    expect(providerStorageUploadReadinessAreas).toContain("transactional-fileasset-link-audit-persistence");
    expect(providerStorageUploadRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-typecheck",
      "security-upload-tests",
      "web-upload-typecheck",
      "secure-upload-route-tests",
      "provider-config-secrets",
      "bucket-acl-derivative-policy",
      "signed-upload-download-urls",
      "fileasset-link-audit-persistence",
      "scan-derivative-worker",
      "private-original-denial",
      "tenant-isolation-retention",
      "ci-secret-safe-evidence",
    ]);
    expect(providerStorageUploadArtifactPaths).toContain("coverage/provider-storage-upload-runtime.json");
    expect(providerStorageUploadArtifactPaths).toContain("test-results/provider-storage-upload-runtime");
  });

  it("pins the ProviderStorageUploadRun persistence model and migration", () => {
    const runData = buildProviderStorageUploadRunData({
      tenantId: "tenant_static",
      runId: "storage_static",
      commitSha: "abc123",
      status: "blocked",
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: true,
      storageProviderSelected: false,
      storageProviderConfigured: false,
      storageSecretsConfigured: false,
      privateBucketAclVerified: false,
      derivativeBucketPolicyVerified: false,
      signedUploadUrlsProviderBacked: false,
      signedDownloadUrlsProviderBacked: false,
      serverOwnedObjectKeysEnforced: true,
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
      providerStorageUploadRunPersisted: false,
      coveredReadinessAreas: ["server-owned-tenant-scoped-object-keys"],
      capturedArtifacts: [
        "coverage/provider-storage-upload-runtime.json",
        "coverage/provider-storage-security-typecheck.txt",
        "coverage/provider-storage-security-test.txt",
        "coverage/provider-storage-web-typecheck.txt",
        "coverage/provider-storage-upload-route-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/security typecheck",
        "pnpm --filter @inkroute/security test",
        "pnpm --filter @inkroute/web typecheck",
        "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
      ],
      securityTypecheckArtifactPath: "coverage/provider-storage-security-typecheck.txt",
      securityTestArtifactPath: "coverage/provider-storage-security-test.txt",
      webTypecheckArtifactPath: "coverage/provider-storage-web-typecheck.txt",
      uploadRouteTestArtifactPath: "coverage/provider-storage-upload-route-test.txt",
    });

    expect(providerStorageUploadRunPersistenceContract.model).toBe("ProviderStorageUploadRun");
    expect(providerStorageUploadRunPersistenceContract.tenantRelation).toBe("providerStorageUploadRuns");
    expect(providerStorageUploadRunPersistenceContract.migration).toBe(
      "20260609032900_add_provider_storage_upload_runs",
    );
    expect(providerStorageUploadRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "readinessAreaManifest",
      "artifactManifest",
      "providerConfigurationManifest",
      "bucketPolicyManifest",
      "scanDerivativeManifest",
    ]);
    expect(providerStorageUploadRunPersistenceContract.evidenceBooleans).toContain("storageProviderSelected");
    expect(providerStorageUploadRunPersistenceContract.evidenceBooleans).toContain("signedUrlGrantPersistenceConfigured");
    expect(providerStorageUploadRunPersistenceContract.evidenceBooleans).toContain("secretSafeArtifactsCaptured");
    expect(providerStorageUploadRunPersistenceContract.artifactFields).toContain("privateOriginalDenialArtifactPath");
    expect(providerStorageUploadRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("providerStorageUploadRuns ProviderStorageUploadRun[]");
    expect(prismaSchema).toContain("model ProviderStorageUploadRun");
    expect(prismaSchema).toContain("bucketPolicyManifest");
    expect(prismaSchema).toContain("signedDownloadUrlsProviderBacked");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(providerStorageUploadMigration).toContain('CREATE TABLE "ProviderStorageUploadRun"');
    expect(providerStorageUploadMigration).toContain('"providerConfigurationManifest" JSONB NOT NULL');
    expect(providerStorageUploadMigration).toContain('"secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(providerStorageUploadMigration).toContain('CREATE UNIQUE INDEX "ProviderStorageUploadRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "storage_static",
      commitSha: "abc123",
      status: "blocked",
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: true,
      serverOwnedObjectKeysEnforced: true,
      storageProviderSelected: false,
      uploadRouteTestArtifactPath: "coverage/provider-storage-upload-route-test.txt",
    });
    expect(runData.commandMatrix).toBe(providerStorageUploadRuntimeMatrix);
    expect(runData.readinessAreaManifest).toEqual(["server-owned-tenant-scoped-object-keys"]);
    expect(runData.providerConfigurationManifest.redactionBoundary).toBe("secret-safe-artifacts-only");
    expect(String(persistProviderStorageUploadRun)).toContain("repository.providerStorageUploadRun.upsert");
  });

  it("keeps helper, tests, upload route, and dashboard portfolio redaction wired", () => {
    expect(securityPackageJson).toContain('"typecheck"');
    expect(securityPackageJson).toContain('"test"');
    expect(securitySource).toContain("buildProviderStorageUploadReadinessPlan");
    expect(securityTests).toContain("buildProviderStorageUploadReadinessPlan");
    expect(uploadRoute).toContain("fileAssetPersistencePlan");
    expect(uploadRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(uploadRoute).toContain('{ ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) }');
    expect(dashboardSignedUploadRoute).toContain('export const runtime = "nodejs"');
    expect(dashboardSignedUploadRoute).toContain("dashboard-signed-upload-intent");
    expect(dashboardSignedUploadRoute).toContain("tx.idempotencyKey.upsert");
    expect(dashboardSignedUploadRoute).toContain("idempotency.status === \"completed\"");
    expect(dashboardSignedUploadRoute).toContain("tx.fileAsset.findFirst");
    expect(dashboardSignedUploadRoute).toContain("tx.fileAsset.create");
    expect(dashboardSignedUploadRoute).toContain("bucket: input.bucket");
    expect(dashboardSignedUploadRoute).toContain("objectKey: input.objectKey");
    expect(dashboardSignedUploadRoute).toContain("kind: input.kind");
    expect(dashboardSignedUploadRoute).toContain("buildSafeSignedUploadResponse");
    expect(dashboardSignedUploadRoute).toContain("buildSignedUploadResponseProjection");
    expect(dashboardSignedUploadRoute).toContain("rawStorageFieldsEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("bucketEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("objectKeyEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("signedUploadUrlEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("signedUrlHashEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("rawPlanObjectsEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(dashboardSignedUploadRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(dashboardSignedUploadRoute).not.toContain("...result.fileAsset");
    expect(dashboardSignedUploadRoute).not.toContain("...result.grant");
    expect(dashboardSignedUploadRoute).toContain("signedUploadIntentPlan,");
    expect(dashboardSignedUploadRoute).toContain("privateStorageAccessPlan,");
    expect(dashboardSignedUploadRoute).not.toContain("function resultFileAssetId");
    expect(dashboardSignedUploadRoute).not.toContain("fileAssetId: fileAsset.id,\n            signedUrlGrantId: grant.id,\n            auditId: audit.id");
    expect(dashboardSignedUploadRoute).not.toContain("auditId: result.status");
    expect(dashboardSignedUploadRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(dashboardSignedUploadRoute).toContain("tx.signedUrlGrant.create");
    expect(portfolioImageRoute).toContain("buildSafePortfolioImageAttachResponse");
    expect(portfolioImageRoute).toContain("buildPortfolioImageAttachResponseProjection");
    expect(portfolioImageRoute).toContain("imageUrlEchoed: false");
    expect(portfolioImageRoute).toContain("fileAssetIdEchoed: false");
    expect(portfolioImageRoute).toContain("rawImageUrlEchoed: false");
    expect(portfolioImageRoute).toContain("rawIdempotencyKeyEchoed: false");
    expect(portfolioImageRoute).toContain("internalPersistenceIdsEchoed: false");
    expect(portfolioImageRoute).not.toContain("imageUrl: result.image.imageUrl");
    expect(portfolioImageRoute).not.toContain("fileAssetId: result.image.fileAssetId");
    expect(portfolioImageRoute).not.toContain("idempotencyKeyId: result.idempotency.id");
    expect(dashboardSignedUploadRoute).toContain("tx.auditLog.create");
    expect(dashboardSignedUploadRoute).toContain("tx.idempotencyKey.update");
    expect(dashboardSignedUploadRoute).toContain("providerUrlMinted: false");
    expect(dashboardSignedUploadRoute).toContain("buildSignedUploadIntentPlan");
    expect(dashboardSignedUploadRoute).toContain("buildPrivateStorageAccessPlan");
    expect(dashboardSignedUploadRoute).toContain("signedUploadHandoffPlanned");
    expect(dashboardSignedUploadRoute).toContain("privateStorageAccessStatus");
    expect(dashboardSignedUploadRoute).toContain("malwareScanExecuted: false");
    expect(dashboardSignedUploadRoute).toContain("bucketAclVerified: false");
    expect(dashboardSignedUploadRoute).toContain("fileAssetPersisted: true");
    expect(dashboardSignedUploadRoute).toContain("signedUrlGrantPersisted: true");
    expect(dashboardSignedUploadRoute).toContain("auditLogged: true");
    expect(dashboardSignedUploadRoute).toContain("internalPersistenceIdsStored: false");
    expect(dashboardSignedUploadRoute).toContain("idempotencyPersisted: true");
    expect(dashboardSignedUploadRoute).toContain("idempotencyReplay");
    expect(uploadPolicyRoute).toContain("PROVIDER_STORAGE_POLICY_NOT_CONFIGURED");
    expect(uploadPolicyRoute).toContain("local policy preview is disabled until provider proof is captured");
    expect(uploadPolicyRoute).toContain('status: "local-preview"');
    expect(uploadPolicyRoute).toContain("local-preview response publishes validation, scan-pipeline, private-access, rate-limit, and security-header controls");
    expect(uploadPolicyRoute).not.toContain("Upload policy preview only");
    expect(uploadPolicyRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(uploadPolicyRoute).toContain("{ headers: noStoreHeaders }");
    expect(uploadPolicyRoute).toContain("localUploadPolicyPreviewDisabled");
    expect(uploadRoute).toContain("local signed-upload validation rules");
    expect(uploadRoute).toContain("buildSafeUploadDatabaseResponse");
    expect(uploadRoute).toContain("buildSafeUploadLocalResponse");
    expect(uploadRoute).toContain("bucketEchoed: false");
    expect(uploadRoute).toContain("objectKeyEchoed: false");
    expect(uploadRoute).toContain("signedUploadUrlEchoed: false");
    expect(uploadRoute).toContain("rawPlanObjectsEchoed: false");
    expect(uploadRoute).toContain("localDraftEchoed: false");
    expect(uploadRouteTest).toContain("secure-upload-intents");
    expect(uploadRouteTest).toContain('response.headers.get("Cache-Control")).toBe("no-store")');
    expect(portfolioReadTest).toContain("storage-key redaction");
  });

  it("keeps provider storage blockers explicit until object storage evidence exists", () => {
    expect(providerStorageUploadRuntimeReadiness.status).toBe("blocked");
    expect(providerStorageUploadRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerStorageUploadRuntimeReadiness.requiredCommands).toBe(providerStorageUploadRuntimeCommands);
    expect(providerStorageUploadRuntimeReadiness.requiredEvidence).toBe(providerStorageUploadRequiredEvidence);
    expect(providerStorageUploadRuntimeReadiness.blockers).toContain(
      "Supabase Storage, S3, or equivalent object storage provider must be selected.",
    );
    expect(providerStorageUploadRuntimeReadiness.blockers).toContain(
      "Provider integration tests must prove private originals cannot be publicly fetched.",
    );
  });

  it("blocks provider storage closure until provider, signed URL, persistence, scan, integration, CI, artifacts, areas, and commands are proven", () => {
    const decision = buildProviderStorageUploadEvidenceDecision({
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: true,
      storageProviderSelected: false,
      storageProviderConfigured: false,
      storageSecretsConfigured: false,
      privateBucketAclVerified: false,
      derivativeBucketPolicyVerified: false,
      signedUploadUrlsProviderBacked: false,
      signedDownloadUrlsProviderBacked: false,
      serverOwnedObjectKeysEnforced: true,
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
      providerStorageUploadRunPersisted: false,
      coveredReadinessAreas: ["server-owned-tenant-scoped-object-keys"],
      capturedArtifacts: [
        "coverage/provider-storage-upload-runtime.json",
        "coverage/provider-storage-security-typecheck.txt",
        "coverage/provider-storage-security-test.txt",
        "coverage/provider-storage-web-typecheck.txt",
        "coverage/provider-storage-upload-route-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/security typecheck",
        "pnpm --filter @inkroute/security test",
        "pnpm --filter @inkroute/web typecheck",
        "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingReadinessAreas).toEqual([
      "storage-provider-selection",
      "redacted-provider-configuration",
      "secret-store-credentials",
      "private-original-bucket-acl",
      "approved-derivative-public-policy",
      "provider-backed-signed-upload-urls",
      "provider-backed-signed-download-urls",
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
    ]);
    expect(decision.missingArtifacts).toEqual([
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
    ]);
    expect(decision.missingCommands).toEqual([
      "select object storage provider and configure redacted provider secrets",
      "verify private original ACL and approved derivative public policy",
      "object storage provider upload/download integration tests",
      "persist FileAsset, link rows, SignedUrlGrant, and AuditLog transactionally",
      "malware scan and derivative worker integration tests",
      "private-original public-read denial test",
      "cross-tenant denial and privacy retention provider tests",
      "GitHub Actions storage/upload evidence job",
      "capture redacted storage artifacts without provider secrets or client-private files",
    ]);
    expect(decision.requiredReadinessAreas).toBe(providerStorageUploadReadinessAreas);
    expect(decision.requiredArtifacts).toBe(providerStorageUploadArtifactPaths);
    expect(decision.requiredCommands).toBe(providerStorageUploadRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildProviderStorageUploadDecisionRequiredEvidence(providerStorageUploadRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(providerStorageUploadRequiredEvidence);
    expect(decision.blockers).toContain("Supabase Storage, S3, or equivalent object storage provider must be selected.");
    expect(decision.blockers).toContain("ProviderStorageUploadRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required provider storage readiness area must be covered.");
  });

  it("completes provider storage closure when provider, signed URL, persistence, scan, integration, CI, artifacts, areas, and commands are proven", () => {
    const decision = buildProviderStorageUploadEvidenceDecision({
      securityTestsPassed: true,
      securityTypecheckPassed: true,
      webUploadRouteTestsPassed: true,
      webTypecheckPassed: true,
      storageProviderSelected: true,
      storageProviderConfigured: true,
      storageSecretsConfigured: true,
      privateBucketAclVerified: true,
      derivativeBucketPolicyVerified: true,
      signedUploadUrlsProviderBacked: true,
      signedDownloadUrlsProviderBacked: true,
      serverOwnedObjectKeysEnforced: true,
      fileAssetPersistenceTransactional: true,
      auditLogPersistenceConfigured: true,
      linkTablePersistenceConfigured: true,
      signedUrlGrantPersistenceConfigured: true,
      malwareScanProviderConfigured: true,
      scanVerdictPersistenceConfigured: true,
      metadataStrippingWorkerConfigured: true,
      publicDerivativeGenerationConfigured: true,
      privateOriginalPublicReadDenied: true,
      approvedDerivativePublicReadVerified: true,
      tenantScopedProviderIntegrationTestsPassed: true,
      privacyRetentionEnforced: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      providerStorageUploadRunPersisted: true,
      coveredReadinessAreas: providerStorageUploadReadinessAreas,
      capturedArtifacts: providerStorageUploadArtifactPaths,
      completedCommands: providerStorageUploadRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider storage readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 1 provider storage upload runtime contracts");
    expect(ciWorkflow).toContain("provider-storage-upload-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-storage-upload-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-provider-storage-upload-runtime-static");
    expect(unitManifest).toContain("ProviderStorageUploadRun Prisma model and app row contract");
    expect(gapTracker).toContain("ProviderStorageUploadRun");
    expect(gapTracker).toContain("apps/web/lib/providerStorageUploadRuntime.ts");
    expect(gapTracker).toContain("persistProviderStorageUploadRun upsert seam");
    expect(gapTracker).toContain("buildProviderStorageUploadDecisionRequiredEvidence");
    expect(gapTracker).toContain("providerStorageUploadRequiredEvidence");
    expect(gapTracker).toContain("providerStorageUploadRuntimeLocalArtifacts");
    expect(gapTracker).toContain("providerStorageUploadRuntimeExternalArtifacts");
    expect(gapTracker).toContain("live storage provider selection/config/secrets, provider signed URLs, FileAsset/link/audit persistence, scan/derivative worker, provider integration tests, CI evidence, provider-backed persistProviderStorageUploadRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-005 is provider-storage-upload-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current provider storage proof files for GAP-005", () => {
    expect(providerStorageUploadRuntimeProofFiles).toContain("packages/security/package.json");
    expect(providerStorageUploadRuntimeProofFiles).toContain("apps/web/package.json");
    expect(providerStorageUploadRuntimeProofFiles).toContain("apps/web/lib/providerStorageUploadRuntime.ts");
    expect(providerStorageUploadRuntimeProofFiles).toContain("apps/dashboard/app/api/files/signed-upload/route.ts");
    expect(dashboardSignedUploadRoute.length).toBeGreaterThan(0);
    expect(providerStorageUploadRuntimeProofFiles).toContain("apps/web/tests/provider-storage-upload-runtime-static.test.ts");
    for (const proofFile of providerStorageUploadRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-005 execution policy non-executing while separating provider storage proof", () => {
    const plan = buildProviderStorageUploadExecutionPlan();

    expect(plan.localCommands).toBe(providerStorageUploadRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(providerStorageUploadRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(providerStorageUploadRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(providerStorageUploadRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toContain("coverage/provider-storage-upload-route-test.txt");
    expect(plan.externalArtifacts).toContain("coverage/provider-storage-secret-safe-artifacts.json");
    expect(plan.externalArtifacts).toContain("test-results/provider-storage-upload-runtime");
    expect(plan.executionPolicy).toBe(providerStorageUploadExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(providerStorageUploadRequiredExternalEvidence);
    expect(plan).toMatchObject({
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
      executionPolicy: {
        codexMayClassifyStaticStorageReadiness: true,
        providerStorageEvidenceRequiredForClosure: true,
        secretStoreConfigurationRequiredForClosure: true,
        providerBackedPersistenceRequiredForClosure: true,
        integrationTestsRequiredForClosure: true,
        secretSafeArtifactsRequiredForClosure: true,
      },
    });
    expect(plan.requiredExternalEvidence).toContain("Provider-backed signed upload/download URL integration evidence.");
    expect(plan.requiredExternalEvidence).toContain(
      "Secret-safe artifact bundle with no provider secrets, raw object keys, client-private files, or PII.",
    );
  });

  it("redacts provider storage upload artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "provider_storage_01HZYXZYXZYXZYXZYXZYXZYXZ",
      providerSecretKey: "AKIA1234567890ABCDEF",
      signedUploadUrl: "https://storage.example.com/private/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ/original.jpg?token=secret",
      objectKey: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ/client@example.com/original.jpg",
      fileAssetId: "fileasset_01HZYXZYXZYXZYXZYXZYXZYXZ",
      clientPhone: "+1 (555) 867-5309",
      providerTranscript: "S3 PUT s3://inkroute-private/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ/private/original.jpg",
      scanResult: "malware_scan_01HZYXZYXZYXZYXZYXZYXZYXZ cleared fileasset_01HZYXZYXZYXZYXZYXZYXZYXZ",
      accessProof: "anonymous fetch denied for private/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ/original.jpg",
      derivativeTrace: "published derivative_01HZYXZYXZYXZYXZYXZYXZYXZ at public/derivatives/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ.jpg",
      commandOutput: "workflow run ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ passed storage:test",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_provider_storage_upload",
      reviewerHandle: "reviewer_storage_owner",
      codeownerSelector: "CODEOWNER:storage-platform-team",
    };

    expect(buildRedactedProviderStorageUploadArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      providerSecretKey: "[REDACTED]",
      signedUploadUrl: "[REDACTED]",
      objectKey: "[REDACTED]",
      fileAssetId: "[REDACTED]",
      clientPhone: "[REDACTED]",
      providerTranscript: "S3 PUT [REDACTED]",
      scanResult: "[REDACTED] cleared [REDACTED]",
      accessProof: "anonymous fetch denied for [REDACTED]",
      derivativeTrace: "published [REDACTED] at [REDACTED]",
      commandOutput: "[REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
      repositorySelector: "[REDACTED]",
      pullRequestSelector: "[REDACTED]",
      reviewerHandle: "[REDACTED]",
      codeownerSelector: "[REDACTED]",
    });

    const review = buildProviderStorageUploadArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(providerStorageUploadRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "providerSecretKey",
        "signedUploadUrl",
        "objectKey",
        "fileAssetId",
        "clientPhone",
        "providerTranscript",
        "scanResult",
        "accessProof",
        "derivativeTrace",
        "commandOutput",
        "persistence.tenantId",
        "persistence.databaseUrl",
        "repositorySelector",
        "pullRequestSelector",
        "reviewerHandle",
        "codeownerSelector",
      ]),
    );
    expect(JSON.stringify(review.artifact)).not.toContain("s3://inkroute-private");
    expect(JSON.stringify(review.artifact)).not.toContain("malware_scan_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("private/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(JSON.stringify(review.artifact)).not.toContain("repo:dominator509/InkRoute");
    expect(JSON.stringify(review.artifact)).not.toContain("pr_provider_storage_upload");
    expect(JSON.stringify(review.artifact)).not.toContain("reviewer_storage_owner");
    expect(JSON.stringify(review.artifact)).not.toContain("CODEOWNER:storage-platform-team");
    expect(review.requiredExternalEvidence).toContain(
      "Provider-backed ProviderStorageUploadRun persistence row captured from the target database.",
    );
  });
});



