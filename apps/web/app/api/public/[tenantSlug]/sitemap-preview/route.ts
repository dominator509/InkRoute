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
        tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: tenantSlug },
        productionBoundary: {
          staticDemoPreviewDisabled: true,
          gapIds: ["GAP-006", "GAP-071", "GAP-072", "GAP-073"],
          requiredBeforeEnablement: [
            "tenant-scoped SEO persistence",
            "noindex, draft, and archive filters",
            "publish-time sitemap revalidation",
          ],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { sitemap } = buildPublicSeoEnginePreview(baseUrl);
  return NextResponse.json(
    {
      ok: true,
      status: "static_demo_not_database_backed",
      tenantScope: { routeTenantSlugReceived: true, tenantSlugEchoed: tenantSlug },
      sitemap,
      productionBoundary: "Production sitemap generation must read tenant SEO rows, enforce noindex/draft/archive filters, and revalidate after publish.",
    },
    { headers: noStoreHeaders },
  );
}
