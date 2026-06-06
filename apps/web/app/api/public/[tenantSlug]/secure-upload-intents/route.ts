import { NextResponse, type NextRequest } from "next/server";
import { validateUploadDraft, type UploadAssetKind } from "@inkroute/security";

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

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "SIGNED_UPLOAD_NOT_IMPLEMENTED",
        message: "Upload metadata was evaluated, but Phase 13 does not create signed URLs or persist FileAsset records.",
      },
      data: {
        tenantSlug,
        validation,
        requiredNextWork: [
          "Resolve tenant by trusted domain/slug before issuing upload URLs.",
          "Require authenticated dashboard/mobile user or short-lived public booking upload token.",
          "Generate server-side object keys and signed private upload URLs.",
          "Verify magic bytes, strip EXIF/GPS metadata, scan/quarantine files, and create public derivatives only when approved.",
          "Persist tenant-scoped FileAsset and AuditLog records after upload completion.",
        ],
        gapIds: ["GAP-005", "GAP-033", "GAP-096", "GAP-097"],
      },
    },
    { status: 501 },
  );
}
