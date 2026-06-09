import { buildReferenceUploadProviderEvidencePlan } from "@inkroute/security";

export type ReferenceUploadProviderRuntimeStatus =
  | "wired"
  | "provider-gated"
  | "scan-gated"
  | "persistence-gated"
  | "access-gated"
  | "ci-gated";

export interface ReferenceUploadProviderRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: ReferenceUploadProviderRuntimeStatus;
}

export const referenceUploadProviderRuntimeCommands = [
  "pnpm --filter @inkroute/security typecheck",
  "pnpm --filter @inkroute/security test",
  "pnpm --filter @inkroute/web typecheck",
  "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
  "reference image provider-signed upload integration test",
  "reference image magic-byte and malware scan integration test",
  "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
  "private reference anonymous and cross-tenant fetch-denial tests",
  "GitHub Actions reference upload provider evidence job",
] as const;

export const referenceUploadProviderReadinessAreas = [
  "signed-upload-intent-route-wiring",
  "provider-signed-upload-url-issuance",
  "server-owned-private-object-keys",
  "declared-byte-upload-verification",
  "magic-byte-validation",
  "malware-scan-provider",
  "quarantine-failure-flow",
  "private-bucket-acl",
  "fileasset-persistence",
  "booking-reference-image-persistence",
  "auditlog-persistence",
  "anonymous-private-fetch-denial",
  "cross-tenant-private-fetch-denial",
  "ci-evidence",
  "secret-safe-artifacts",
] as const;

export const referenceUploadProviderArtifactPaths = [
  "coverage/reference-upload-provider-runtime.json",
  "coverage/reference-upload-security-typecheck.txt",
  "coverage/reference-upload-security-test.txt",
  "coverage/reference-upload-web-typecheck.txt",
  "coverage/reference-upload-route-test.txt",
  "coverage/reference-upload-provider-signed-url-redacted.json",
  "coverage/reference-upload-byte-verification.json",
  "coverage/reference-upload-magic-byte-validation.json",
  "coverage/reference-upload-malware-scan-quarantine.json",
  "coverage/reference-upload-fileasset-persistence.json",
  "coverage/reference-upload-booking-reference-image-persistence.json",
  "coverage/reference-upload-auditlog-persistence.json",
  "coverage/reference-upload-private-acl.json",
  "coverage/reference-upload-private-fetch-denial.json",
  "coverage/reference-upload-cross-tenant-denial.json",
  "coverage/reference-upload-ci-evidence.json",
  "coverage/reference-upload-secret-safe-artifacts.json",
  "test-results/reference-upload-provider-runtime",
] as const;

export const referenceUploadProviderRuntimeMatrix = [
  {
    id: "security-typecheck",
    command: "pnpm --filter @inkroute/security typecheck",
    artifact: "coverage/reference-upload-security-typecheck.txt",
    status: "wired",
  },
  {
    id: "security-upload-tests",
    command: "pnpm --filter @inkroute/security test",
    artifact: "coverage/reference-upload-security-test.txt",
    status: "wired",
  },
  {
    id: "web-upload-typecheck",
    command: "pnpm --filter @inkroute/web typecheck",
    artifact: "coverage/reference-upload-web-typecheck.txt",
    status: "wired",
  },
  {
    id: "secure-upload-route-tests",
    command: "pnpm vitest run apps/web/tests/secure-upload-intents-route.test.ts",
    artifact: "coverage/reference-upload-route-test.txt",
    status: "wired",
  },
  {
    id: "signed-upload-intent-route",
    command: "assert secure-upload-intents route returns signed intent, private access, persistence, and GAP-033 evidence plans",
    artifact: "coverage/reference-upload-provider-runtime.json",
    status: "wired",
  },
  {
    id: "provider-signed-upload-url",
    command: "reference image provider-signed upload integration test",
    artifact: "coverage/reference-upload-provider-signed-url-redacted.json",
    status: "provider-gated",
  },
  {
    id: "byte-upload-verification",
    command: "verify uploaded bytes against declared size, checksum, tenant, subject, and signed intent",
    artifact: "coverage/reference-upload-byte-verification.json",
    status: "provider-gated",
  },
  {
    id: "magic-byte-validation",
    command: "reference image magic-byte validation integration test",
    artifact: "coverage/reference-upload-magic-byte-validation.json",
    status: "scan-gated",
  },
  {
    id: "malware-scan-quarantine",
    command: "reference image malware scan and quarantine integration test",
    artifact: "coverage/reference-upload-malware-scan-quarantine.json",
    status: "scan-gated",
  },
  {
    id: "fileasset-booking-reference-auditlog-persistence",
    command: "FileAsset/BookingReferenceImage/AuditLog persistence integration test",
    artifact: "coverage/reference-upload-fileasset-persistence.json",
    status: "persistence-gated",
  },
  {
    id: "private-acl-fetch-denial",
    command: "private reference anonymous fetch-denial test",
    artifact: "coverage/reference-upload-private-fetch-denial.json",
    status: "access-gated",
  },
  {
    id: "cross-tenant-fetch-denial",
    command: "private reference cross-tenant fetch-denial test",
    artifact: "coverage/reference-upload-cross-tenant-denial.json",
    status: "access-gated",
  },
  {
    id: "ci-secret-safe-evidence",
    command: "GitHub Actions reference upload provider evidence job",
    artifact: "coverage/reference-upload-ci-evidence.json",
    status: "ci-gated",
  },
] as const satisfies readonly ReferenceUploadProviderRuntimeMatrixEntry[];

export const referenceUploadProviderRuntimeReadiness = buildReferenceUploadProviderEvidencePlan({
  packageScripts: ["typecheck", "test"],
  securityTestsPassed: false,
  securityTypecheckPassed: false,
  webUploadRouteTestsPassed: false,
  webTypecheckPassed: false,
  uploadIntentRouteUsesSignedPlan: true,
  providerSignedUploadUrlIssued: false,
  byteUploadVerified: false,
  magicByteValidationPassed: false,
  malwareScanConfigured: false,
  quarantineFlowVerified: false,
  privateBucketAclVerified: false,
  fileAssetRowsPersisted: false,
  bookingReferenceImageRowsPersisted: false,
  auditLogRowsPersisted: false,
  privateFetchDenied: false,
  crossTenantFetchDenied: false,
  ciEvidenceCaptured: false,
  secretSafeArtifactsCaptured: false,
});
