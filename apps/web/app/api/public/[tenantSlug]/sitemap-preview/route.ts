import { NextResponse } from "next/server";
import { buildPublicSeoEnginePreview } from "../../../../lib/seoEngine";

export async function GET(_request: Request, { params }: { params: { tenantSlug: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { sitemap } = buildPublicSeoEnginePreview(baseUrl);
  return NextResponse.json({
    ok: true,
    status: "static_demo_not_database_backed",
    tenantSlug: params.tenantSlug,
    sitemap,
    productionBoundary: "Production sitemap generation must read tenant SEO rows, enforce noindex/draft/archive filters, and revalidate after publish.",
  });
}
