import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildUploadDerivativeMetadataPlan,
  buildRedactedUploadScanWorkerArtifact,
  buildUploadScanWorkerArtifactReview,
  buildUploadScanWorkerEvidenceDecision,
  buildUploadScanWorkerExecutionPlan,
  buildUploadScanWorkerPlan,
  persistUploadScanWorkerOutcome,
  uploadScanWorkerArtifactPaths,
  uploadScanWorkerCommands,
  uploadScanWorkerExternalArtifacts,
  uploadScanWorkerExternalCommands,
  uploadScanWorkerExecutionPolicy,
  uploadScanWorkerLocalArtifacts,
  uploadScanWorkerLocalCommands,
  uploadScanWorkerProofFiles,
  uploadScanWorkerPreview,
  uploadScanWorkerRequiredExternalEvidence,
} from "../lib/uploadScanWorker";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-096 upload scan worker static contract", () => {
  it("pins FileAsset scan-status and derivative persistence fields", () => {
    const prismaSchema = readWorkspaceFile("packages/db/prisma/schema.prisma");
    const migration = readWorkspaceFile("packages/db/prisma/migrations/20260613000700_add_file_asset_scan_fields/migration.sql");

    expect(prismaSchema).toContain('scanStatus       String          @default("pending")');
    expect(prismaSchema).toContain("detectedMimeType String?");
    expect(prismaSchema).toContain("malwareVerdict   String?");
    expect(prismaSchema).toContain("scanProvider     String?");
    expect(prismaSchema).toContain("scanCheckedAt    DateTime?");
    expect(prismaSchema).toContain("quarantineReason String?");
    expect(prismaSchema).toContain("derivativeObjectKey String?");
    expect(prismaSchema).toContain("derivativeMimeType String?");
    expect(prismaSchema).toContain("metadataStripped Boolean");
    expect(prismaSchema).toContain("storageVisibility String?");
    expect(migration).toContain('ADD COLUMN "scanStatus" TEXT NOT NULL DEFAULT');
    expect(migration).toContain('ADD COLUMN "derivativeObjectKey" TEXT');
    expect(migration).toContain('"FileAsset_tenantId_scanStatus_idx"');
    expect(migration).toContain('"FileAsset_tenantId_derivativeObjectKey_idx"');
  });

  it("builds a post-upload worker plan from object bytes, magic-byte detection, scanner verdict, metadata stripping, and persistence gates", () => {
    const worker = readWorkspaceFile("apps/web/lib/uploadScanWorker.ts");

    expect(worker).toContain("buildUploadScanPipelinePlan");
    expect(worker).toContain("detectMimeTypeFromSignature");
    expect(worker).toContain("read-object-bytes");
    expect(worker).toContain("verify-magic-bytes");
    expect(worker).toContain("call-malware-scanner");
    expect(worker).toContain("strip-exif-gps");
    expect(worker).toContain("generate-normalized-derivative");
    expect(worker).toContain("persist-fileasset-scan-status");
    expect(worker).toContain("write-upload-scan-audit-log");
    expect(worker).toContain("UploadScanWorkerPersistenceClient");
    expect(worker).toContain("persistUploadScanWorkerOutcome");
    expect(worker).toContain('action: "upload.scan_verdict"');
    expect(worker).toContain("where: { id: input.plan.fileAssetId, tenantId: input.plan.tenantId }");
  });

  it("quarantines unscanned uploads and rejects spoofed or malware inputs through package scan rules", () => {
    expect(uploadScanWorkerPreview.status).toBe("quarantined");
    expect(uploadScanWorkerPreview.quarantineRequired).toBe(true);
    expect(uploadScanWorkerPreview.actions).toContain("quarantine-or-reject-object");
    expect(uploadScanWorkerPreview.requiredWrites).toEqual(
      expect.arrayContaining(["FileAsset.scanStatus", "FileAsset.detectedMimeType", "FileAsset.metadataStripped", "AuditLog.uploadScanVerdict"]),
    );
    expect(uploadScanWorkerPreview.derivativeMetadata).toMatchObject({
      sourceObjectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
      storageVisibility: "system_private",
      cacheControl: "no-store",
      artifact: "coverage/upload-normalized-derivative.json",
    });

    const spoofed = buildUploadScanWorkerPlan({
      tenantId: "tenant_demo",
      fileAssetId: "fileasset_spoofed",
      objectKey: "private/tenant_demo/reference/fileasset_spoofed.jpg",
      kind: "reference_private",
      filename: "reference.jpg",
      declaredMimeType: "image/jpeg",
      sizeBytes: 512000,
      fileSignatureHex: "89504e470d0a1a0a",
      malwareVerdict: "clean",
      exifMetadataPresent: false,
      normalizedDerivativeGenerated: true,
      scanProviderConfigured: true,
      declaredByAuthenticatedUser: true,
    });

    expect(spoofed.status).toBe("quarantined");
    expect(spoofed.plan.reasons.join(" ")).toContain("does not match declared MIME");

    const malware = buildUploadScanWorkerPlan({
      tenantId: "tenant_demo",
      fileAssetId: "fileasset_malware",
      objectKey: "private/tenant_demo/reference/fileasset_malware.jpg",
      kind: "reference_private",
      filename: "reference.jpg",
      declaredMimeType: "image/jpeg",
      sizeBytes: 512000,
      fileSignatureHex: "ffd8ffe00010",
      malwareVerdict: "malware",
      exifMetadataPresent: false,
      normalizedDerivativeGenerated: true,
      scanProviderConfigured: true,
      declaredByAuthenticatedUser: true,
    });

    expect(malware.status).toBe("rejected");
    expect(malware.publicDerivativeAllowed).toBe(false);
  });

  it("builds derivative metadata that strips EXIF/GPS and separates public derivatives from private originals", () => {
    const derivative = buildUploadDerivativeMetadataPlan({
      tenantId: "tenant_demo",
      fileAssetId: "fileasset_public",
      sourceObjectKey: "private/tenant_demo/portfolio/fileasset_public.jpg",
      detectedMimeType: "image/jpeg",
      exifMetadataPresent: true,
      normalizedDerivativeGenerated: true,
      publicDerivativeAllowed: true,
    });

    expect(derivative).toMatchObject({
      derivativeObjectKey: "public/tenant_demo/derivatives/fileasset_public.webp",
      storageVisibility: "public_derivative",
      cacheControl: "public, max-age=31536000, immutable",
      strippedMetadata: {
        exifRemoved: true,
        gpsRemoved: true,
        privateFieldsRetained: false,
      },
    });
    expect(derivative.fileAssetFields).toEqual(expect.arrayContaining(["derivativeObjectKey", "metadataStripped", "storageVisibility"]));
  });

  it("keeps upload policy and secure intent routes wired to scan and private derivative blockers", () => {
    const uploadPolicyRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts");
    const secureIntentRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
    const secureIntentTest = readWorkspaceFile("apps/web/tests/secure-upload-intents-route.test.ts");

    expect(uploadPolicyRoute).toContain("buildUploadScanPipelinePlan");
    expect(uploadPolicyRoute).toContain("scanPipelinePreview");
    expect(uploadPolicyRoute).toContain("malwareVerdict: \"not_run\"");
    expect(uploadPolicyRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(uploadPolicyRoute).toContain("{ headers: noStoreHeaders }");
    expect(secureIntentRoute).toContain("scanApproved: false");
    expect(secureIntentRoute).toContain("scanStatus: \"pending\"");
    expect(secureIntentTest).toContain("FileAsset cannot be exposed or finalized before upload scan approval.");
    expect(secureIntentTest).toContain("Generate public derivative only after private visibility checks.");
  });

  it("pins commands, artifact paths, CI, manifest, and tracker references for GAP-096", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(uploadScanWorkerCommands).toContain("object-storage byte inspection integration test");
    expect(uploadScanWorkerCommands).toContain("malware scan provider integration test");
    expect(uploadScanWorkerCommands).toContain("metadata stripping and derivative worker test");
    expect(uploadScanWorkerArtifactPaths).toContain("coverage/upload-fileasset-scan-persistence.json");
    expect(ci).toContain("Run Phase 13 upload scan worker contracts");
    expect(ci).toContain("apps/web/tests/upload-scan-worker-static.test.ts");
    expect(ci).toContain("upload-scan-worker-artifacts");
    expect(manifest).toContain("unit-web-upload-scan-worker-static");
    expect(tracker).toContain("apps/web/lib/uploadScanWorker.ts");
    expect(tracker).toContain("Upload scan worker evidence classifier wired and scanner/storage proof gated");
    expect(tracker).toContain("uploadScanWorkerLocalArtifacts");
    expect(tracker).toContain("uploadScanWorkerExternalArtifacts");
  });

  it("pins current upload scan worker proof files for GAP-096", () => {
    expect(uploadScanWorkerProofFiles).toEqual(
      expect.arrayContaining([
        "packages/security/package.json",
        "packages/security/src/index.ts",
        "packages/security/tests/upload-policy.test.ts",
        "packages/db/prisma/schema.prisma",
        "packages/db/prisma/migrations/20260613000700_add_file_asset_scan_fields/migration.sql",
        "apps/web/lib/uploadScanWorker.ts",
        "apps/web/tests/upload-scan-worker-static.test.ts",
        "apps/web/tests/secure-upload-intents-route.test.ts",
        "apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts",
        "apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts",
        ".github/workflows/ci.yml",
        "testing/manifests/unit-test-manifest.json",
      ]),
    );
    for (const file of uploadScanWorkerProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("classifies GAP-096 evidence as blocked until scanner/storage integration proof is captured", () => {
    const blockedDecision = buildUploadScanWorkerEvidenceDecision({
      packageScanHelpersPassed: true,
      routeScanBlockersCaptured: true,
      objectStorageByteInspectionCaptured: false,
      malwareScannerVerdictCaptured: false,
      metadataStrippingCaptured: true,
      fileAssetPersistenceCaptured: false,
      quarantineRejectionCaptured: true,
      privateOriginalPublicDerivativeCaptured: false,
      requiredCommandsRun: uploadScanWorkerCommands.filter(
        (command) =>
          command !== "object-storage byte inspection integration test" &&
          command !== "malware scan provider integration test" &&
          command !== "FileAsset scan-status persistence test",
      ),
      capturedArtifacts: [
        "coverage/upload-scan-worker-plan.json",
        "coverage/upload-magic-byte-verification.json",
        "coverage/upload-exif-gps-strip.json",
        "coverage/upload-normalized-derivative.json",
        "coverage/upload-quarantine-rejection.json",
        "test-results/upload-scan-worker",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Capture object-storage byte inspection proof.",
        "Capture malware scanner provider verdict proof.",
        "Capture provider-backed FileAsset scan-status and derivative persistence proof.",
        "Capture private-original and public-derivative access proof.",
        "Required command not recorded: object-storage byte inspection integration test",
        "Required command not recorded: malware scan provider integration test",
        "Required command not recorded: FileAsset scan-status persistence test",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining(["coverage/upload-malware-scan-redacted.json", "coverage/upload-fileasset-scan-persistence.json"]),
    );
    expect(blockedDecision.storagePolicy).toEqual({
      privateOriginalsRemainPrivate: true,
      publicDerivativesRequireCleanScan: true,
      rawScannerPayloadsRedacted: true,
    });

    const completeDecision = buildUploadScanWorkerEvidenceDecision({
      packageScanHelpersPassed: true,
      routeScanBlockersCaptured: true,
      objectStorageByteInspectionCaptured: true,
      malwareScannerVerdictCaptured: true,
      metadataStrippingCaptured: true,
      fileAssetPersistenceCaptured: true,
      quarantineRejectionCaptured: true,
      privateOriginalPublicDerivativeCaptured: true,
      requiredCommandsRun: uploadScanWorkerCommands,
      capturedArtifacts: uploadScanWorkerArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(uploadScanWorkerCommands);
    expect(completeDecision.requiredEvidence).toBe(uploadScanWorkerArtifactPaths);
  });

  it("keeps GAP-096 scanner and storage execution disabled in the local plan", () => {
    const plan = buildUploadScanWorkerExecutionPlan();

    expect(plan.objectStorageExecutionAllowed).toBe(false);
    expect(plan.fileAssetPersistenceContractAvailable).toBe(true);
    expect(plan.malwareScannerExecutionAllowed).toBe(false);
    expect(plan.fileAssetPersistenceExecutionAllowed).toBe(false);
    expect(plan.storageQuarantineExecutionAllowed).toBe(false);
    expect(plan.privatePublicAccessExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(uploadScanWorkerExecutionPolicy);
    expect(plan.policy).toEqual({
      fileAssetPersistenceContractAvailable: true,
      objectStorageExecutionAllowed: false,
      malwareScannerExecutionAllowed: false,
      fileAssetPersistenceExecutionAllowed: false,
      storageQuarantineExecutionAllowed: false,
      privatePublicAccessExecutionAllowed: false,
      metadataDerivativeWorkerExecutionAllowed: false,
    });
    expect(plan.localCommands).toBe(uploadScanWorkerLocalCommands);
    expect(plan.externalCommands).toBe(uploadScanWorkerExternalCommands);
    expect(plan.localArtifacts).toBe(uploadScanWorkerLocalArtifacts);
    expect(plan.externalArtifacts).toBe(uploadScanWorkerExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/upload-scan-worker-plan.json",
      "coverage/upload-magic-byte-verification.json",
      "coverage/upload-exif-gps-strip.json",
      "coverage/upload-normalized-derivative.json",
      "coverage/upload-quarantine-rejection.json",
      "test-results/upload-scan-worker",
    ]);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/upload-malware-scan-redacted.json",
      "coverage/upload-fileasset-scan-persistence.json",
    ]));
    expect(plan.requiredExternalEvidence).toBe(uploadScanWorkerRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toEqual([
      "object-storage byte inspection integration proof",
      "malware scanner provider verdict proof",
      "provider-backed FileAsset scan-status and derivative persistence proof",
      "storage quarantine/rejection proof",
      "private-original/public-derivative access proof",
    ]);
    expect(plan.disabledReasons.join(" ")).toContain("Object-storage byte inspection requires live storage object reads.");
    expect(plan.disabledReasons.join(" ")).toContain("FileAsset scan-status persistence contract is wired");
  });

  it("persists scan outcomes through a tenant-scoped FileAsset update and redacted AuditLog write contract", async () => {
    const writes: unknown[] = [];
    const plan = buildUploadScanWorkerPlan({
      tenantId: "tenant_demo",
      fileAssetId: "fileasset_clean",
      objectKey: "private/tenant_demo/portfolio/fileasset_clean.jpg",
      kind: "portfolio_public",
      filename: "portfolio.jpg",
      declaredMimeType: "image/jpeg",
      sizeBytes: 512000,
      fileSignatureHex: "ffd8ffe00010",
      malwareVerdict: "clean",
      exifMetadataPresent: true,
      normalizedDerivativeGenerated: true,
      scanProviderConfigured: true,
      declaredByAuthenticatedUser: true,
    });

    const result = await persistUploadScanWorkerOutcome(
      {
        fileAsset: {
          async updateMany(input) {
            writes.push(input);
            return { count: 1 };
          },
        },
        auditLog: {
          async create(input) {
            writes.push(input);
            return {};
          },
        },
      },
      { plan, scanProvider: "scanner-test", now: new Date("2026-06-22T19:20:00.000Z") },
    );

    expect(result).toMatchObject({
      persisted: true,
      scanStatus: "approved",
      auditAction: "upload.scan_verdict",
      fileAssetUpdated: true,
      quarantineRequired: false,
      publicDerivativeAllowed: true,
    });
    expect(JSON.stringify(writes)).toContain('"tenantId":"tenant_demo"');
    expect(JSON.stringify(writes)).toContain('"entityType":"FileAsset"');
    expect(JSON.stringify(writes)).toContain('"action":"upload.scan_verdict"');
    expect(JSON.stringify(writes)).not.toContain("private/tenant_demo/portfolio/fileasset_clean.jpg");
  });

  it("redacts GAP-096 scanner and storage artifacts before review", () => {
    const rawArtifact = {
      scanner_api_key: "scanner-secret-key",
      storageToken: "storage-secret-token",
      signedUrl: "https://storage.example/private?signature=abc123",
      objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
      scannerPayload: { rawBody: "{\"email\":\"artist@example.com\",\"phone\":\"+1 555 123 4567\"}" },
      nested: ["Authorization: Bearer upload-secret-token", "owner artist@example.com"],
      stack: "Error: scanner failed",
    };

    const redacted = buildRedactedUploadScanWorkerArtifact(rawArtifact);
    const review = buildUploadScanWorkerArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("scanner-secret-key");
    expect(serialized).not.toContain("storage-secret-token");
    expect(serialized).not.toContain("signature=abc123");
    expect(serialized).not.toContain("private/tenant_demo/reference/fileasset_demo.jpg");
    expect(serialized).not.toContain("artist@example.com");
    expect(serialized).not.toContain("+1 555 123 4567");
    expect(serialized).not.toContain("upload-secret-token");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(uploadScanWorkerArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Object-storage byte inspection integration proof",
      "Malware scanner provider verdict proof",
      "Private-original/public-derivative access proof",
    ]));
  });
});


