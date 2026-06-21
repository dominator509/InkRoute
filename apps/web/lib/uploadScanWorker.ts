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

export const uploadScanWorkerProofFiles = [
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

export const uploadScanWorkerLocalCommands = uploadScanWorkerCommands.slice(0, 2);
export const uploadScanWorkerExternalCommands = uploadScanWorkerCommands.slice(2);

export const uploadScanWorkerRequiredExternalEvidence = [
  "object-storage byte inspection integration proof",
  "malware scanner provider verdict proof",
  "FileAsset scan-status and derivative persistence proof",
  "storage quarantine/rejection proof",
  "private-original/public-derivative access proof",
] as const;

export type UploadScanWorkerArtifact = (typeof uploadScanWorkerArtifactPaths)[number];

export const uploadScanWorkerLocalArtifacts = [
  "coverage/upload-scan-worker-plan.json",
  "coverage/upload-magic-byte-verification.json",
  "coverage/upload-exif-gps-strip.json",
  "coverage/upload-normalized-derivative.json",
  "coverage/upload-quarantine-rejection.json",
  "test-results/upload-scan-worker",
] as const satisfies readonly UploadScanWorkerArtifact[];

export const uploadScanWorkerExternalArtifacts = [
  "coverage/upload-malware-scan-redacted.json",
  "coverage/upload-fileasset-scan-persistence.json",
] as const satisfies readonly UploadScanWorkerArtifact[];

export type UploadScanWorkerCommand = (typeof uploadScanWorkerCommands)[number];

export type UploadScanWorkerEvidenceInput = {
  packageScanHelpersPassed: boolean;
  routeScanBlockersCaptured: boolean;
  objectStorageByteInspectionCaptured: boolean;
  malwareScannerVerdictCaptured: boolean;
  metadataStrippingCaptured: boolean;
  fileAssetPersistenceCaptured: boolean;
  quarantineRejectionCaptured: boolean;
  privateOriginalPublicDerivativeCaptured: boolean;
  requiredCommandsRun: readonly UploadScanWorkerCommand[];
  capturedArtifacts: readonly UploadScanWorkerArtifact[];
};

export type UploadScanWorkerEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: UploadScanWorkerArtifact[];
  requiredCommands: typeof uploadScanWorkerCommands;
  requiredEvidence: typeof uploadScanWorkerArtifactPaths;
  storagePolicy: {
    privateOriginalsRemainPrivate: true;
    publicDerivativesRequireCleanScan: true;
    rawScannerPayloadsRedacted: true;
  };
};

export type UploadScanWorkerExecutionPlan = {
  status: "local-plan-ready";
  objectStorageExecutionAllowed: false;
  malwareScannerExecutionAllowed: false;
  fileAssetPersistenceExecutionAllowed: false;
  storageQuarantineExecutionAllowed: false;
  privatePublicAccessExecutionAllowed: false;
  policy: UploadScanWorkerExecutionPolicy;
  localCommands: typeof uploadScanWorkerLocalCommands;
  externalCommands: typeof uploadScanWorkerExternalCommands;
  localArtifacts: typeof uploadScanWorkerLocalArtifacts;
  externalArtifacts: typeof uploadScanWorkerExternalArtifacts;
  requiredExternalEvidence: typeof uploadScanWorkerRequiredExternalEvidence;
  disabledReasons: readonly string[];
};

export type UploadScanWorkerExecutionPolicy = {
  objectStorageExecutionAllowed: false;
  malwareScannerExecutionAllowed: false;
  fileAssetPersistenceExecutionAllowed: false;
  storageQuarantineExecutionAllowed: false;
  privatePublicAccessExecutionAllowed: false;
  metadataDerivativeWorkerExecutionAllowed: false;
};

export type UploadScanWorkerArtifactReview = {
  status: "redacted-review-ready";
  redactedArtifact: unknown;
  requiredArtifacts: typeof uploadScanWorkerArtifactPaths;
  retainedExternalGates: readonly string[];
};

const uploadScanWorkerSecretPatterns = [
  /(scanner[_-]?api[_-]?key['":=\s]+)[^"',\s}]+/gi,
  /(storage[_-]?(?:secret|token|key)['":=\s]+)[^"',\s}]+/gi,
  /(signed[_-]?url['":=\s]+)[^"',\s}]+/gi,
  /(authorization:\s*bearer\s+)[A-Za-z0-9._-]+/gi,
  /(secret['":=\s]+)[^"',\s}]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  /\+?\d[\d\s().-]{7,}\d/g,
] as const;

export function buildRedactedUploadScanWorkerArtifact(value: unknown): unknown {
  if (typeof value === "string") {
    return uploadScanWorkerSecretPatterns.reduce(
      (redacted, pattern) => redacted.replace(pattern, (_match, prefix: string | undefined) => `${prefix ?? ""}[REDACTED]`),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => buildRedactedUploadScanWorkerArtifact(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        /token|secret|authorization|credential|password|signedUrl|scannerPayload|rawBody|stack|objectKey|sourceObjectKey/i.test(key)
          ? "[REDACTED]"
          : buildRedactedUploadScanWorkerArtifact(entry),
      ]),
    );
  }

  return value;
}

export const uploadScanWorkerExecutionPolicy: UploadScanWorkerExecutionPolicy = {
  objectStorageExecutionAllowed: false,
  malwareScannerExecutionAllowed: false,
  fileAssetPersistenceExecutionAllowed: false,
  storageQuarantineExecutionAllowed: false,
  privatePublicAccessExecutionAllowed: false,
  metadataDerivativeWorkerExecutionAllowed: false,
};

export function buildUploadScanWorkerExecutionPlan(): UploadScanWorkerExecutionPlan {
  return {
    status: "local-plan-ready",
    objectStorageExecutionAllowed: false,
    malwareScannerExecutionAllowed: false,
    fileAssetPersistenceExecutionAllowed: false,
    storageQuarantineExecutionAllowed: false,
    privatePublicAccessExecutionAllowed: false,
    policy: uploadScanWorkerExecutionPolicy,
    localCommands: uploadScanWorkerLocalCommands,
    externalCommands: uploadScanWorkerExternalCommands,
    localArtifacts: uploadScanWorkerLocalArtifacts,
    externalArtifacts: uploadScanWorkerExternalArtifacts,
    requiredExternalEvidence: uploadScanWorkerRequiredExternalEvidence,
    disabledReasons: [
      "Object-storage byte inspection requires live storage object reads.",
      "Malware scanner verdict proof requires a configured scanner provider.",
      "FileAsset scan-status persistence proof requires migrated database execution.",
      "Storage quarantine/rejection proof requires live private object mutation.",
      "Private-original/public-derivative proof requires integration storage access checks.",
    ],
  };
}

export function buildUploadScanWorkerArtifactReview(rawArtifact: unknown): UploadScanWorkerArtifactReview {
  return {
    status: "redacted-review-ready",
    redactedArtifact: buildRedactedUploadScanWorkerArtifact(rawArtifact),
    requiredArtifacts: uploadScanWorkerArtifactPaths,
    retainedExternalGates: [
      "Object-storage byte inspection integration proof",
      "Malware scanner provider verdict proof",
      "FileAsset scan-status persistence proof",
      "Storage quarantine/rejection proof",
      "Private-original/public-derivative access proof",
    ],
  };
}

export function buildUploadScanWorkerEvidenceDecision(
  input: UploadScanWorkerEvidenceInput,
): UploadScanWorkerEvidenceDecision {
  const blockers = [
    !input.packageScanHelpersPassed && "Run package upload scan helper tests.",
    !input.routeScanBlockersCaptured && "Capture secure upload intent route scan blockers.",
    !input.objectStorageByteInspectionCaptured && "Capture object-storage byte inspection proof.",
    !input.malwareScannerVerdictCaptured && "Capture malware scanner provider verdict proof.",
    !input.metadataStrippingCaptured && "Capture EXIF/GPS stripping and derivative metadata proof.",
    !input.fileAssetPersistenceCaptured && "Capture FileAsset scan-status and derivative persistence proof.",
    !input.quarantineRejectionCaptured && "Capture spoofed MIME, malware, and unscanned quarantine/rejection proof.",
    !input.privateOriginalPublicDerivativeCaptured && "Capture private-original and public-derivative access proof.",
  ].filter(Boolean) as string[];

  const missingArtifacts = uploadScanWorkerArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = uploadScanWorkerCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: uploadScanWorkerCommands,
    requiredEvidence: uploadScanWorkerArtifactPaths,
    storagePolicy: {
      privateOriginalsRemainPrivate: true,
      publicDerivativesRequireCleanScan: true,
      rawScannerPayloadsRedacted: true,
    },
  };
}

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
