import { createHash, randomUUID } from "crypto";
import { prisma } from "@inkroute/db";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildFileAssetPersistencePlan,
  buildPrivateStorageAccessPlan,
  buildReferenceUploadProviderEvidencePlan,
  buildSignedUploadIntentPlan,
  validateUploadDraft,
  type UploadAssetKind,
} from "@inkroute/security";
import { checkRateLimit, getClientIpFromHeaders, persistUploadIntent, resolveTenant } from "../../../../../lib/localRuntimeState";

const uploadKinds: UploadAssetKind[] = ["portfolio_public", "reference_private", "consent_signature", "healed_follow_up", "document_private"];
const noStoreHeaders = { "Cache-Control": "no-store" } as const;
type TenantResolution = { tenantId: string; source: "database" | "local-fallback" };

function isUploadKind(value: unknown): value is UploadAssetKind {
  return typeof value === "string" && uploadKinds.includes(value as UploadAssetKind);
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!process.env.DATABASE_URL) return true;

  if (!(error instanceof Error)) return false;
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && ["P1000", "P1001", "P1002", "P1003", "P1008"].includes(code)) return true;

  const message = error.message.toLowerCase();
  return message.includes("connect") && message.includes("database");
}

async function resolveUploadTenant(tenantSlug: string): Promise<TenantResolution | null> {
  const normalizedSlug = decodeURIComponent(tenantSlug).toLowerCase().trim();
  try {
    const prismaRuntime = prisma as unknown as {
      tenant: {
        findUnique: (options: { where: { slug: string }; select: { id: true } }) => Promise<{ id: string } | null>;
      };
    };
    const tenant = await prismaRuntime.tenant.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    if (tenant?.id) return { tenantId: tenant.id, source: "database" };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
  }

  const local = resolveTenant(normalizedSlug);
  if (!local) return null;
  return { tenantId: local.tenantId, source: "local-fallback" };
}

function fileAssetKindForUpload(kind: UploadAssetKind) {
  if (kind === "portfolio_public") return "portfolio_original";
  if (kind === "reference_private") return "reference_image";
  if (kind === "document_private") return "document";
  return kind;
}

function hashGrant(input: { tenantId: string; bucket: string; objectKey: string; operation: string; expiresAt: Date }) {
  return createHash("sha256").update(`${input.tenantId}:${input.bucket}:${input.objectKey}:${input.operation}:${input.expiresAt.toISOString()}`).digest("hex");
}

function buildUploadIntentResponseProjection() {
  return {
    rawStorageFieldsEchoed: false,
    bucketEchoed: false,
    objectKeyEchoed: false,
    uploadUrlEchoed: false,
    signedUploadUrlEchoed: false,
    signedUrlHashEchoed: false,
    rawPlanObjectsEchoed: false,
    localDraftEchoed: false,
    tenantIdEchoed: false,
    fileAssetIdEchoed: false,
    signedUrlGrantIdEchoed: false,
    referenceImageIdEchoed: false,
    auditIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSafeUploadDatabaseResponse(result: {
  fileAsset: { kind: string; visibility: string; scanStatus: string; createdAt: Date };
  grant: { operation: string; scope: string; expiresAt: Date; createdAt: Date };
  referenceImagePersisted: boolean;
  auditLogged: boolean;
}) {
  return {
    uploadIntent: {
      kind: result.fileAsset.kind,
      visibility: result.fileAsset.visibility,
      scanStatus: result.fileAsset.scanStatus,
      providerUrlMinted: false,
      uploadUrlEchoed: false,
      requiredNextStep: "provider-backed signed upload URL minting",
      createdAt: result.fileAsset.createdAt.toISOString(),
    },
    signedUrlGrant: {
      operation: result.grant.operation,
      scope: result.grant.scope,
      expiresAt: result.grant.expiresAt.toISOString(),
      createdAt: result.grant.createdAt.toISOString(),
    },
    persistenceReceipt: {
      fileAssetPersisted: true,
      signedUrlGrantPersisted: true,
      referenceImagePersisted: result.referenceImagePersisted,
      auditPersisted: result.auditLogged,
    },
    responseProjection: buildUploadIntentResponseProjection(),
  };
}

function buildSafeUploadLocalResponse(input: {
  kind: UploadAssetKind;
  visibility: string;
  createdAt: string;
  expiresAt: string;
  providerEvidenceStatus: string;
}) {
  return {
    uploadIntent: {
      kind: input.kind,
      visibility: input.visibility,
      providerUrlMinted: false,
      uploadUrlEchoed: false,
      createdAt: input.createdAt,
      expiresAt: input.expiresAt,
    },
    evidenceReceipt: {
      signedIntentStatus: "provider_gated",
      privateStorageStatus: "provider_gated",
      fileAssetPersistenceStatus: "blocked",
      referenceUploadProviderStatus: input.providerEvidenceStatus,
    },
    responseProjection: buildUploadIntentResponseProjection(),
  };
}

export async function POST(request: NextRequest, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Upload intent body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const input = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  if (!isUploadKind(input.kind) || typeof input.filename !== "string" || typeof input.mimeType !== "string" || typeof input.sizeBytes !== "number") {
    return NextResponse.json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Expected kind, filename, mimeType, and sizeBytes." } }, { status: 400, headers: noStoreHeaders });
  }

  const validation = validateUploadDraft({
    kind: input.kind,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    declaredByAuthenticatedUser: Boolean(input.declaredByAuthenticatedUser),
  });
  const resolvedTenant = await resolveUploadTenant(tenantSlug);
  if (!resolvedTenant) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_NOT_FOUND", message: "Upload intents are available for local demo tenant slug only." } },
      { status: 404, headers: noStoreHeaders },
    );
  }

  if (!validation.accepted) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPLOAD_VALIDATION_FAILED",
          message: "Upload metadata did not pass local signed-upload validation rules.",
          reasons: validation.reasons,
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const rateLimit = checkRateLimit("public-upload-intent", tenantSlug, `${getClientIpFromHeaders(request.headers)}:${resolvedTenant.tenantId}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          details: { gapIds: ["GAP-005", "GAP-096", "GAP-097"], remaining: rateLimit.remaining, retryAfterSeconds: rateLimit.retryAfterSeconds },
        },
      },
      { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const bookingRequestId = typeof input.bookingRequestId === "string" && input.bookingRequestId.trim().length > 0 ? input.bookingRequestId.trim() : null;
  if (resolvedTenant.source === "database") {
    if (!bookingRequestId) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "PUBLIC_UPLOAD_BOOKING_CONTEXT_REQUIRED",
              message: "Production public upload intents require an existing booking request or short-lived authenticated upload token before persistence.",
            },
            data: {
              productionBoundary: {
                gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
                anonymousUploadIntentDisabled: true,
                requiredBeforeEnablement: ["booking-scoped upload token", "authenticated client identity", "provider-backed signed URL minting"],
              },
            },
          },
          { status: 422, headers: noStoreHeaders },
        );
      }
    } else {
      try {
        const now = new Date();
        const subjectId = randomUUID();
        const signedIntentPlan = buildSignedUploadIntentPlan({
          kind: input.kind,
          filename: input.filename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          declaredByAuthenticatedUser: Boolean(input.declaredByAuthenticatedUser),
          tenantId: resolvedTenant.tenantId,
          subjectId,
          expiresInSeconds: 20 * 60,
        });
        const objectKey = signedIntentPlan.objectKey ?? `private/${resolvedTenant.tenantId}/${input.kind}/${subjectId}`;
        const bucket = validation.storageVisibility === "public" ? "inkroute-public-uploads" : "inkroute-private-uploads";
        const expiresAt = new Date(now.getTime() + signedIntentPlan.expiresInSeconds * 1000);

        const result = await prisma.$transaction(async (tx) => {
          const booking = await tx.bookingRequest.findFirst({
            where: { id: bookingRequestId, tenantId: resolvedTenant.tenantId },
            select: { id: true, clientId: true, assignedToUserId: true },
          });
          if (!booking?.clientId) return { status: "booking_context_missing" as const };

          const issuer = booking.assignedToUserId
            ? { userId: booking.assignedToUserId }
            : await tx.tenantMember.findFirst({ where: { tenantId: resolvedTenant.tenantId }, select: { userId: true } });
          if (!issuer?.userId) return { status: "issuer_missing" as const };

          const fileAsset = await tx.fileAsset.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              uploadedByUserId: issuer.userId,
              clientId: booking.clientId,
              kind: fileAssetKindForUpload(input.kind),
              visibility: validation.storageVisibility,
              bucket,
              objectKey,
              originalFilename: input.filename,
              mimeType: input.mimeType,
              sizeBytes: input.sizeBytes,
              signedUrlExpiresAt: expiresAt,
              storageVisibility: validation.storageVisibility,
              metadata: toJsonValue({
                source: "public-secure-upload-intent",
                bookingRequestId: booking.id,
                providerUrlMinted: false,
                scanStatus: "pending",
                rawPayloadStored: false,
              }),
            },
            select: { id: true, kind: true, visibility: true, scanStatus: true, createdAt: true },
          });

          const grant = await tx.signedUrlGrant.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              fileAssetId: fileAsset.id,
              issuedByUserId: issuer.userId,
              operation: "upload",
              scope: input.kind,
              bucket,
              objectKey,
              signedUrlHash: hashGrant({ tenantId: resolvedTenant.tenantId, bucket, objectKey, operation: "upload", expiresAt }),
              expiresAt,
              metadata: toJsonValue({
                providerUrlMinted: false,
                publicRoute: true,
                requiredNextStep: "provider-backed signed upload URL minting",
              }),
            },
            select: { id: true, operation: true, scope: true, expiresAt: true, createdAt: true },
          });

          const referenceImage = input.kind === "reference_private"
            ? await tx.referenceImage.create({
              data: {
                tenantId: resolvedTenant.tenantId,
                bookingRequestId: booking.id,
                clientId: booking.clientId,
                fileAssetId: fileAsset.id,
                label: "Public booking reference",
                notes: "Created from public secure-upload intent; provider upload and scan pending.",
              },
              select: { id: true },
            })
            : null;

          const audit = await tx.auditLog.create({
            data: {
              tenantId: resolvedTenant.tenantId,
              actorUserId: issuer.userId,
              action: "file.public_signed_upload.intent",
              entityType: "FileAsset",
              entityId: fileAsset.id,
              metadata: toJsonValue({
                route: "/api/public/[tenantSlug]/secure-upload-intents",
                bookingRequestId: booking.id,
                clientId: booking.clientId,
                grantId: grant.id,
                referenceImageId: referenceImage?.id ?? null,
                providerUrlMinted: false,
                scanApproved: false,
                redactedFields: ["filename", "objectKey"],
                gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
              }),
            },
            select: { id: true },
          });

          return { status: "created" as const, fileAsset, grant, referenceImagePersisted: Boolean(referenceImage?.id), auditLogged: Boolean(audit.id) };
        });

        if (result.status === "created") {
          return NextResponse.json(
            {
              ok: true,
              data: {
                tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
                persistence: "database",
                validation,
                ...buildSafeUploadDatabaseResponse(result),
                localRuntime: { status: "not-used", gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"] },
                nextWork: [
                  "Mint provider signed upload URLs after storage credentials are configured.",
                  "Verify uploaded bytes, magic bytes, malware scan, and metadata stripping before exposing derivatives.",
                  "Add tenant-isolated DB/provider tests for public reference uploads.",
                ],
              },
            },
            { status: 201, headers: noStoreHeaders },
          );
        }

        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: result.status === "issuer_missing" ? "PUBLIC_UPLOAD_ISSUER_NOT_CONFIGURED" : "PUBLIC_UPLOAD_BOOKING_CONTEXT_NOT_FOUND",
                message: "Production public upload intents require tenant-scoped booking, client, and issuer context before persistence.",
              },
              data: { productionBoundary: { localUploadIntentDisabled: true, gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"] } },
            },
            { status: result.status === "issuer_missing" ? 503 : 404, headers: noStoreHeaders },
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "production" || !isDatabaseUnavailable(error)) {
          return NextResponse.json(
            { ok: false, error: { code: "PUBLIC_UPLOAD_INTENT_PERSISTENCE_FAILED", message: "Public upload intent could not be persisted after validation." } },
            { status: isDatabaseUnavailable(error) ? 503 : 500, headers: noStoreHeaders },
          );
        }
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PROVIDER_STORAGE_NOT_CONFIGURED",
          message: "Production upload intents require provider-backed signed URLs and database-backed booking/upload-token persistence; local upload intent previews are disabled.",
        },
        data: {
          productionBoundary: {
            gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
            localUploadIntentDisabled: true,
            requiredBeforeEnablement: [
              "Object storage provider selected and configured",
              "Private bucket ACL and approved-derivative public policy verified",
              "Provider-backed signed upload/download URLs wired",
              "FileAsset, link, AuditLog, and SignedUrlGrant rows persisted transactionally",
              "Malware scan, metadata stripping, private-original denial, and cross-tenant denial verified",
            ],
          },
        },
      },
      { status: 503, headers: noStoreHeaders },
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
    auditLogConfigured: resolvedTenant.source === "database",
    fileAssetStoreConfigured: resolvedTenant.source === "database",
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
      fileAssetRowsPersisted: resolvedTenant.source === "database",
      bookingReferenceImageRowsPersisted: resolvedTenant.source === "database" && input.kind === "reference_private",
      auditLogRowsPersisted: resolvedTenant.source === "database",
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
        tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: false },
        validation,
        ...buildSafeUploadLocalResponse({
          kind: input.kind,
          visibility: validation.storageVisibility,
          createdAt: draft.createdAt,
          expiresAt: draft.expiresAt,
          providerEvidenceStatus: referenceUploadProviderEvidencePlan?.status ?? "not_applicable",
        }),
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
    { status: 201, headers: noStoreHeaders },
  );
}
