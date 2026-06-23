import { createHash } from "crypto";
import { prisma } from "@inkroute/db";
import { fileAssetInputSchema } from "@inkroute/validators";
import { NextRequest, NextResponse } from "next/server";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function permissionForKind(kind: string) {
  if (kind.startsWith("portfolio_")) return "portfolio:write" as const;
  if (kind === "reference_image" || kind === "healed_follow_up") return "booking:write" as const;
  if (kind === "consent_signature" || kind === "document") return "client:write" as const;
  return "tenant:write" as const;
}

function hashGrant(input: { tenantId: string; bucket: string; objectKey: string; operation: string; expiresAt: Date }) {
  return createHash("sha256").update(`${input.tenantId}:${input.bucket}:${input.objectKey}:${input.operation}:${input.expiresAt.toISOString()}`).digest("hex");
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function resultFileAssetId(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("fileAssetId" in result)) {
    return null;
  }

  const value = (result as { fileAssetId?: unknown }).fileAssetId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  let actor;
  let body: unknown;
  try {
    actor = resolveDashboardActor(request);
    body = await request.json();
  } catch (error) {
    const status = error instanceof Error && error.message === "AUTH_REQUIRED" ? 401 : 400;
    const code = status === 401 ? "UNAUTHENTICATED" : "INVALID_JSON";
    return NextResponse.json(
      { ok: false, error: { code, message: status === 401 ? "Actor is not authenticated." : "Signed upload body must be valid JSON." } },
      { status, headers: noStoreHeaders },
    );
  }

  const parsed = fileAssetInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Signed upload payload failed validation.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const input = parsed.data;
  try {
    assertPermission(actor, permissionForKind(input.kind));
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to create this signed upload intent." } }, { status: 403, headers: noStoreHeaders });
  }

  const tenantId = new URL(request.url).searchParams.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create signed upload intents for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }
  const idempotencyKey =
    request.headers.get("idempotency-key") ??
    `signed-upload-intent:${tenantId}:${createHash("sha256").update(`${input.bucket}:${input.objectKey}:${input.kind}`).digest("hex")}`;

  if (actor.source === "local-fallback") {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          tenantId,
          error: {
            code: "PROVIDER_SIGNED_UPLOAD_NOT_CONFIGURED",
            message: "Production signed upload requests require DB-backed dashboard auth, provider storage configuration, FileAsset/SignedUrlGrant persistence, and provider URL minting; local fallback is disabled.",
            gapIds: ["GAP-005", "GAP-007", "GAP-038"],
          },
          productionBoundary: { localSignedUploadFallbackDisabled: true },
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        tenantId,
        error: {
          code: "DATABASE_REQUIRED",
          message: "Signed upload intents require database-backed dashboard auth so FileAsset, SignedUrlGrant, and AuditLog rows can be persisted.",
        },
        gapIds: ["GAP-005", "GAP-007", "GAP-038"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  try {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const result = await prisma.$transaction(async (tx) => {
      const idempotency = await tx.idempotencyKey.upsert({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-signed-upload-intent", key: idempotencyKey } },
        create: {
          tenantId,
          scope: "dashboard-signed-upload-intent",
          key: idempotencyKey,
          status: "claimed",
          metadata: toJsonValue({
            route: "/api/files/signed-upload",
            action: "create_signed_upload_intent",
            objectHash: createHash("sha256").update(`${input.bucket}:${input.objectKey}:${input.kind}`).digest("hex"),
            providerUrlMinted: false,
            malwareScanExecuted: false,
            bucketAclVerified: false,
          }),
        },
        update: {
          metadata: toJsonValue({
            route: "/api/files/signed-upload",
            action: "create_signed_upload_intent",
            replayObserved: true,
            objectHash: createHash("sha256").update(`${input.bucket}:${input.objectKey}:${input.kind}`).digest("hex"),
            providerUrlMinted: false,
            malwareScanExecuted: false,
            bucketAclVerified: false,
          }),
        },
        select: { id: true, status: true, result: true },
      });
      const replayFileAssetId = idempotency.status === "completed" ? resultFileAssetId(idempotency.result) : null;
      if (replayFileAssetId) {
        const fileAsset = await tx.fileAsset.findFirst({
          where: { id: replayFileAssetId, tenantId },
          select: { id: true, bucket: true, objectKey: true, kind: true, visibility: true, scanStatus: true, createdAt: true },
        });
        const grant = await tx.signedUrlGrant.findFirst({
          where: { tenantId, fileAssetId: replayFileAssetId, operation: "upload" },
          orderBy: { createdAt: "desc" },
          select: { id: true, operation: true, scope: true, expiresAt: true, createdAt: true },
        });

        if (fileAsset && grant) {
          return { status: "replayed" as const, fileAsset, grant, idempotency };
        }
      }

      if (input.clientId !== undefined) {
        const client = await tx.client.findFirst({ where: { id: input.clientId, tenantId }, select: { id: true } });
        if (!client) return { status: "client_not_found" as const };
      }

      const fileAsset = await tx.fileAsset.create({
        data: {
          tenantId,
          uploadedByUserId: input.uploadedByUserId ?? actor.actorUserId,
          ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
          kind: input.kind,
          visibility: input.visibility,
          bucket: input.bucket,
          objectKey: input.objectKey,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          ...(input.checksumSha256 !== undefined ? { checksumSha256: input.checksumSha256 } : {}),
          ...(input.publicUrl !== undefined ? { publicUrl: input.publicUrl } : {}),
          metadata: {
            ...(input.metadata ?? {}),
            providerUploadUrlMinted: false,
            providerExecution: "deferred",
          },
        },
        select: { id: true, bucket: true, objectKey: true, kind: true, visibility: true, scanStatus: true, createdAt: true },
      });

      const grant = await tx.signedUrlGrant.create({
        data: {
          tenantId,
          fileAssetId: fileAsset.id,
          issuedByUserId: actor.actorUserId,
          operation: "upload",
          scope: input.kind,
          bucket: input.bucket,
          objectKey: input.objectKey,
          signedUrlHash: hashGrant({ tenantId, bucket: input.bucket, objectKey: input.objectKey, operation: "upload", expiresAt }),
          expiresAt,
          metadata: {
            providerUrlMinted: false,
            requiredNextStep: "provider-backed signed upload URL minting",
          },
        },
        select: { id: true, operation: true, scope: true, expiresAt: true, createdAt: true },
      });

      const audit = await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: "file.signed_upload.intent",
          entityType: "FileAsset",
          entityId: fileAsset.id,
          metadata: {
            source: "dashboard-api",
            grantId: grant.id,
            providerUrlMinted: false,
            idempotencyKeyId: idempotency.id,
            boundary: "FileAsset and SignedUrlGrant intent only; provider signed URL minting, malware scan, metadata stripping, bucket ACL proof, and cross-tenant provider denial remain gated.",
          },
        },
        select: { id: true, createdAt: true },
      });

      await tx.idempotencyKey.update({
        where: { tenantId_scope_key: { tenantId, scope: "dashboard-signed-upload-intent", key: idempotencyKey } },
        data: {
          status: "completed",
          result: toJsonValue({
            fileAssetId: fileAsset.id,
            signedUrlGrantId: grant.id,
            auditId: audit.id,
            providerUrlMinted: false,
            malwareScanExecuted: false,
            bucketAclVerified: false,
          }),
        },
      });

      return { status: "created" as const, fileAsset, grant, audit, idempotency };
    });

    if (result.status === "client_not_found") {
      return NextResponse.json({ ok: false, error: { code: "CLIENT_NOT_FOUND", message: "Upload client was not found for this tenant." } }, { status: 404, headers: noStoreHeaders });
    }

    return NextResponse.json(
      {
        ok: true,
        source: actor.source,
        tenantId,
        persistence: "database",
        fileAsset: { ...result.fileAsset, createdAt: result.fileAsset.createdAt.toISOString() },
        signedUrlGrant: { ...result.grant, expiresAt: result.grant.expiresAt.toISOString(), createdAt: result.grant.createdAt.toISOString() },
        upload: { providerUrlMinted: false, uploadUrl: null, requiredNextStep: "provider-backed signed upload URL minting" },
        auditId: result.status === "created" ? result.audit.id : null,
        idempotencyKeyId: result.idempotency.id,
        idempotencyReplay: result.status === "replayed",
        gapIds: ["GAP-005", "GAP-007", "GAP-038"],
        boundary: "Signed-upload intent persistence is tenant-scoped, no-store, idempotency-backed, and audited; provider URL minting and storage/security evidence remain gated.",
      },
      { status: result.status === "created" ? 202 : 200, headers: noStoreHeaders },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { ok: false, source: actor.source, tenantId, error: { code: "DATABASE_UNAVAILABLE", message: "Signed upload intent requires the dashboard database connection." }, gapIds: ["GAP-005", "GAP-007", "GAP-038"] },
        { status: 503, headers: noStoreHeaders },
      );
    }
    if (error instanceof Error && /Unique constraint/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: { code: "FILE_ASSET_EXISTS", message: "A file asset with this bucket/object key already exists." } }, { status: 409, headers: noStoreHeaders });
    }
    return NextResponse.json({ ok: false, error: { code: "SIGNED_UPLOAD_INTENT_FAILED", message: "Signed upload intent could not be persisted." } }, { status: 500, headers: noStoreHeaders });
  }
}
