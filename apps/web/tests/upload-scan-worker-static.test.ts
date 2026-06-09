import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildUploadScanWorkerPlan,
  uploadScanWorkerArtifactPaths,
  uploadScanWorkerCommands,
  uploadScanWorkerPreview,
} from "../lib/uploadScanWorker";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-096 upload scan worker static contract", () => {
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
  });

  it("quarantines unscanned uploads and rejects spoofed or malware inputs through package scan rules", () => {
    expect(uploadScanWorkerPreview.status).toBe("quarantined");
    expect(uploadScanWorkerPreview.quarantineRequired).toBe(true);
    expect(uploadScanWorkerPreview.actions).toContain("quarantine-or-reject-object");
    expect(uploadScanWorkerPreview.requiredWrites).toEqual(
      expect.arrayContaining(["FileAsset.scanStatus", "FileAsset.detectedMimeType", "AuditLog.uploadScanVerdict"]),
    );

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

  it("keeps upload policy and secure intent routes wired to scan and private derivative blockers", () => {
    const uploadPolicyRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/upload-policy/route.ts");
    const secureIntentRoute = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/secure-upload-intents/route.ts");
    const secureIntentTest = readWorkspaceFile("apps/web/tests/secure-upload-intents-route.test.ts");

    expect(uploadPolicyRoute).toContain("buildUploadScanPipelinePlan");
    expect(uploadPolicyRoute).toContain("scanPipelinePreview");
    expect(uploadPolicyRoute).toContain("malwareVerdict: \"not_run\"");
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
    expect(tracker).toContain("live scanner/storage worker proof remains open");
  });
});
