import { NextResponse } from "next/server";
import { buildPrivateStorageAccessPlan, buildSecurityHeaderPlan, buildUploadScanPipelinePlan, rateLimitRules, uploadPolicies } from "@inkroute/security";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_STORAGE_POLICY_NOT_CONFIGURED",
          message: "Production upload policy requires configured object storage, scanner, private ACLs, and FileAsset persistence; local policy preview is disabled until provider proof is captured.",
          gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
        },
        productionBoundary: {
          scaffoldedUploadPolicyDisabled: true,
          requiredBeforeEnablement: [
            "object storage provider and private bucket configuration",
            "provider-backed signed upload/download URLs",
            "malware scan and metadata stripping worker",
            "FileAsset, SignedUrlGrant, and AuditLog persistence",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      status: "local-preview",
      tenantSlug,
      uploadPolicies,
      scanPipelinePreview: buildUploadScanPipelinePlan({
        kind: "portfolio_public",
        filename: "portfolio-preview.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 400000,
        declaredByAuthenticatedUser: true,
        fileSignatureHex: "ffd8ffe00010",
        malwareVerdict: "not_run",
        exifMetadataPresent: true,
        normalizedDerivativeGenerated: false,
        scanProviderConfigured: false,
      }),
      privateStorageAccessPreview: buildPrivateStorageAccessPlan({
        kind: "reference_private",
        operation: "download",
        tenantId: tenantSlug,
        subjectId: "booking-reference-preview",
        objectKey: `private/${tenantSlug}/reference_private/booking-reference-preview/reference.jpg`,
        storageVisibility: "client_private",
        expiresInSeconds: 900,
        now: "2026-06-08T00:00:00.000Z",
        scanApproved: false,
        providerConfigured: false,
      }),
      publicRateLimits: rateLimitRules.filter((rule) => rule.routePattern.includes("/api/public")),
      securityHeaders: buildSecurityHeaderPlan(),
      boundary:
        "Upload policy local-preview response publishes validation, scan-pipeline, private-access, rate-limit, and security-header controls. Provider-signed URLs, file scanning, metadata stripping, private object storage, tenant-scoped FileAsset records, and audit logs remain evidence-gated.",
      gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
    },
    { headers: noStoreHeaders },
  );
}
