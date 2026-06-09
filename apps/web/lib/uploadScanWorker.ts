import {
  buildUploadScanPipelinePlan,
  detectMimeTypeFromSignature,
  type MalwareScanVerdict,
  type UploadAssetKind,
  type UploadScanPipelinePlan,
} from "@inkroute/security";

export type UploadScanWorkerAction =
  | "read-object-bytes"
  | "verify-magic-bytes"
  | "call-malware-scanner"
  | "strip-exif-gps"
  | "generate-normalized-derivative"
  | "persist-fileasset-scan-status"
  | "write-upload-scan-audit-log"
  | "quarantine-or-reject-object";

export interface UploadScanWorkerInput {
  tenantId: string;
  fileAssetId: string;
  objectKey: string;
  kind: UploadAssetKind;
  filename: string;
  declaredMimeType: string;
  sizeBytes: number;
  fileSignatureHex: string;
  malwareVerdict: MalwareScanVerdict;
  exifMetadataPresent: boolean;
  normalizedDerivativeGenerated: boolean;
  scanProviderConfigured: boolean;
  declaredByAuthenticatedUser: boolean;
}

export interface UploadScanWorkerPlan {
  gapIds: readonly ["GAP-096", "GAP-097"];
  tenantId: string;
  fileAssetId: string;
  objectKey: string;
  detectedMimeType: string | null;
  status: UploadScanPipelinePlan["status"];
  quarantineRequired: boolean;
  publicDerivativeAllowed: boolean;
  derivativeMetadata: ReturnType<typeof buildUploadDerivativeMetadataPlan>;
  actions: readonly UploadScanWorkerAction[];
  requiredWrites: readonly string[];
  artifactPaths: readonly string[];
  plan: UploadScanPipelinePlan;
}

export function buildUploadDerivativeMetadataPlan(input: {
  tenantId: string;
  fileAssetId: string;
  sourceObjectKey: string;
  detectedMimeType: string | null;
  exifMetadataPresent: boolean;
  normalizedDerivativeGenerated: boolean;
  publicDerivativeAllowed: boolean;
}) {
  const extension = input.detectedMimeType === "image/png" ? "png" : "webp";
  const derivativeObjectKey = `public/${input.tenantId}/derivatives/${input.fileAssetId}.${extension}`;
  return {
    sourceObjectKey: input.sourceObjectKey,
    derivativeObjectKey,
    detectedMimeType: input.detectedMimeType,
    strippedMetadata: {
      exifRemoved: input.exifMetadataPresent,
      gpsRemoved: input.exifMetadataPresent,
      privateFieldsRetained: false,
    },
    normalizedDerivativeGenerated: input.normalizedDerivativeGenerated,
    storageVisibility: input.publicDerivativeAllowed ? "public_derivative" : "system_private",
    cacheControl: input.publicDerivativeAllowed ? "public, max-age=31536000, immutable" : "no-store",
    fileAssetFields: ["derivativeObjectKey", "derivativeMimeType", "metadataStripped", "storageVisibility"],
    artifact: "coverage/upload-normalized-derivative.json",
  };
}

export const uploadScanWorkerArtifactPaths = [
  "coverage/upload-scan-worker-plan.json",
  "coverage/upload-magic-byte-verification.json",
  "coverage/upload-malware-scan-redacted.json",
  "coverage/upload-exif-gps-strip.json",
  "coverage/upload-normalized-derivative.json",
  "coverage/upload-fileasset-scan-persistence.json",
  "coverage/upload-quarantine-rejection.json",
  "test-results/upload-scan-worker",
] as const;

export const uploadScanWorkerCommands = [
  "pnpm --filter @inkroute/security test",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts apps/web/tests/upload-scan-worker-static.test.ts",
  "object-storage byte inspection integration test",
  "malware scan provider integration test",
  "metadata stripping and derivative worker test",
  "FileAsset scan-status persistence test",
  "private-original and public-derivative access test",
] as const;

export function buildUploadScanWorkerPlan(input: UploadScanWorkerInput): UploadScanWorkerPlan {
  const plan = buildUploadScanPipelinePlan({
    kind: input.kind,
    filename: input.filename,
    mimeType: input.declaredMimeType,
    sizeBytes: input.sizeBytes,
    declaredByAuthenticatedUser: input.declaredByAuthenticatedUser,
    fileSignatureHex: input.fileSignatureHex,
    malwareVerdict: input.malwareVerdict,
    exifMetadataPresent: input.exifMetadataPresent,
    normalizedDerivativeGenerated: input.normalizedDerivativeGenerated,
    scanProviderConfigured: input.scanProviderConfigured,
  });
  const actions: UploadScanWorkerAction[] = [
    "read-object-bytes",
    "verify-magic-bytes",
    "call-malware-scanner",
    "strip-exif-gps",
    "generate-normalized-derivative",
    "persist-fileasset-scan-status",
    "write-upload-scan-audit-log",
  ];

  if (plan.quarantineRequired || plan.status === "rejected") {
    actions.push("quarantine-or-reject-object");
  }
  const detectedMimeType = detectMimeTypeFromSignature(input.fileSignatureHex);
  const derivativeMetadata = buildUploadDerivativeMetadataPlan({
    tenantId: input.tenantId,
    fileAssetId: input.fileAssetId,
    sourceObjectKey: input.objectKey,
    detectedMimeType,
    exifMetadataPresent: input.exifMetadataPresent,
    normalizedDerivativeGenerated: input.normalizedDerivativeGenerated,
    publicDerivativeAllowed: plan.publicDerivativeAllowed,
  });

  return {
    gapIds: ["GAP-096", "GAP-097"],
    tenantId: input.tenantId,
    fileAssetId: input.fileAssetId,
    objectKey: input.objectKey,
    detectedMimeType,
    status: plan.status,
    quarantineRequired: plan.quarantineRequired,
    publicDerivativeAllowed: plan.publicDerivativeAllowed,
    derivativeMetadata,
    actions,
    requiredWrites: ["FileAsset.scanStatus", "FileAsset.detectedMimeType", "FileAsset.derivativeObjectKey", "FileAsset.metadataStripped", "AuditLog.uploadScanVerdict"],
    artifactPaths: uploadScanWorkerArtifactPaths,
    plan,
  };
}

export const uploadScanWorkerPreview = buildUploadScanWorkerPlan({
  tenantId: "tenant_demo",
  fileAssetId: "fileasset_demo",
  objectKey: "private/tenant_demo/reference/fileasset_demo.jpg",
  kind: "reference_private",
  filename: "reference.jpg",
  declaredMimeType: "image/jpeg",
  sizeBytes: 512000,
  fileSignatureHex: "ffd8ffe00010",
  malwareVerdict: "not_run",
  exifMetadataPresent: true,
  normalizedDerivativeGenerated: false,
  scanProviderConfigured: false,
  declaredByAuthenticatedUser: true,
});
