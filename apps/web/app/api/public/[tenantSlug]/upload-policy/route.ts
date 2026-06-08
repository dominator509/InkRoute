import { NextResponse } from "next/server";
import { buildPrivateStorageAccessPlan, buildSecurityHeaderPlan, buildUploadScanPipelinePlan, rateLimitRules, uploadPolicies } from "@inkroute/security";

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  return NextResponse.json({
    status: "scaffolded",
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
    boundary: "Upload policy preview only. Signed upload URLs, file scanning, metadata stripping, private object storage, tenant-scoped FileAsset records, and audit logs are not implemented.",
    gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
  });
}
