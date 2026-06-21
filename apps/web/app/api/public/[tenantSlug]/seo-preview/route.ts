import { NextResponse } from "next/server";
import { buildPublicSeoEnginePreview } from "../../../../../lib/seoEngine";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(_request: Request, context: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await context.params;
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "PROVIDER_PUBLIC_CONTENT_NOT_CONFIGURED" },
        tenantSlug,
        productionBoundary: {
          staticDemoPreviewDisabled: true,
          gapIds: ["GAP-006", "GAP-071", "GAP-072", "GAP-073", "GAP-074", "GAP-075", "GAP-076"],
          requiredBeforeEnablement: [
            "tenant-scoped SEO persistence",
            "provider-backed canonical and metadata verification",
            "publish-time public route validation",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preview = buildPublicSeoEnginePreview(baseUrl);
  return NextResponse.json(
    {
      ok: true,
      status: "static_demo_not_database_backed",
      tenantSlug,
      preview,
      productionGaps: ["GAP-071", "GAP-072", "GAP-073", "GAP-074", "GAP-075", "GAP-076"],
    },
    { headers: noStoreHeaders },
  );
}
