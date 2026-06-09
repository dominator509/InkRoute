import { NextResponse, type NextRequest } from "next/server";
import {
  buildFileAssetPersistencePlan,
  buildPrivateStorageAccessPlan,
  buildReferenceUploadProviderEvidencePlan,
  buildSignedUploadIntentPlan,
  validateUploadDraft,
  type UploadAssetKind,
} from "@inkroute/security";
import { checkRateLimit, getClientIp, persistUploadIntent, resolveTenant } from "../../../../../lib/localRuntimeState";

const uploadKinds: UploadAssetKind[] = ["portfolio_public", "reference_private", "consent_signature", "healed_follow_up", "document_private"];

function isUploadKind(value: unknown): value is UploadAssetKind {
  return typeof value === "string" && uploadKinds.includes(value as UploadAssetKind);
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Upload intent body must be valid JSON." } }, { status: 400 });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  if (!isUploadKind(input.kind) || typeof input.filename !== "string" || typeof input.mimeType !== "string" || typeof input.sizeBytes !== "number") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Expected kind, filename, mimeType, and sizeBytes." } }, { status: 400 });
  }

  const validation = validateUploadDraft({
    kind: input.kind,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    declaredByAuthenticatedUser: Boolean(input.declaredByAuthenticatedUser),
  });
  const resolvedTenant = resolveTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Upload intents are available for local demo tenant slug only." } },
      { status: 404 },
    );
  }

  if (!validation.accepted) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPLOAD_VALIDATION_FAILED",
          message: "Upload metadata did not pass scaffolded validation rules.",
          reasons: validation.reasons,
        },
      },
      { status: 400 },
    );
  }

  const rateLimit = checkRateLimit("public-upload-intent", tenantSlug, `${getClientIp(Object.fromEntries(request.headers.entries()))}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          details: { gapIds: ["GAP-005", "GAP-096", "GAP-097"], remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const draft = persistUploadIntent(tenantSlug, {
    kind: input.kind,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    visibility: validation.storageVisibility,
  });
  const signedIntentPlan = buildSignedUploadIntentPlan({
    kind: input.kind,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    declaredByAuthenticatedUser: Boolean(input.declaredByAuthenticatedUser),
    tenantId: resolvedTenant.tenantId,
    subjectId: draft.id,
    expiresInSeconds: 20 * 60,
  });
  const privateStoragePlan = buildPrivateStorageAccessPlan({
    kind: input.kind,
    operation: "upload",
    tenantId: resolvedTenant.tenantId,
    subjectId: draft.id,
    objectKey: signedIntentPlan.objectKey ?? draft.objectKey,
    storageVisibility: validation.storageVisibility,
    expiresInSeconds: signedIntentPlan.expiresInSeconds,
    now: draft.createdAt,
    expiresAt: draft.expiresAt,
    scanApproved: false,
    providerConfigured: false,
  });
  const fileAssetPersistencePlan = buildFileAssetPersistencePlan({
    kind: input.kind,
    tenantId: resolvedTenant.tenantId,
    subjectId: draft.id,
    objectKey: signedIntentPlan.objectKey ?? draft.objectKey,
    originalFilename: draft.filename,
    mimeType: draft.mimeType,
    sizeBytes: draft.sizeBytes,
    storageVisibility: validation.storageVisibility,
    scanStatus: "pending",
    providerConfigured: false,
    auditLogConfigured: false,
    fileAssetStoreConfigured: false,
  });
  const referenceUploadProviderEvidencePlan = input.kind === "reference_private"
    ? buildReferenceUploadProviderEvidencePlan({
      packageScripts: ["typecheck", "test"],
      securityTestsPassed: false,
      securityTypecheckPassed: false,
      webUploadRouteTestsPassed: false,
      webTypecheckPassed: false,
      uploadIntentRouteUsesSignedPlan: signedIntentPlan.accepted && signedIntentPlan.status === "provider_gated",
      providerSignedUploadUrlIssued: Boolean(draft.signedUploadUrl),
      byteUploadVerified: false,
      magicByteValidationPassed: false,
      malwareScanConfigured: false,
      quarantineFlowVerified: false,
      privateBucketAclVerified: privateStoragePlan.bucketAcl === "private" && privateStoragePlan.publicReadAllowed === false,
      fileAssetRowsPersisted: false,
      bookingReferenceImageRowsPersisted: false,
      auditLogRowsPersisted: false,
      privateFetchDenied: false,
      crossTenantFetchDenied: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    })
    : null;

  return NextResponse.json(
    {
      ok: true,
      data: {
        tenantSlug,
        tenantId: resolvedTenant.tenantId,
        validation,
        draft,
        signedIntentPlan,
        privateStoragePlan,
        fileAssetPersistencePlan,
        referenceUploadProviderEvidencePlan,
        nextWork: [
          "Persist FileAsset record and link to booking/message context.",
          "Use provider-signed upload URL and verify multipart boundaries.",
          "Scan and strip metadata from media before status transitions.",
          "Generate public derivative only after private visibility checks.",
        ],
        localRuntime: {
          status: "queued",
          gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
        },
      },
    },
    { status: 201 },
  );
}
