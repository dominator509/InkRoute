import { NextResponse } from "next/server";
import { buildPublicSeoEnginePreview } from "../../../../../lib/seoEngine";

export async function GET(_request: Request, { params }: { params: { tenantSlug: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const preview = buildPublicSeoEnginePreview(baseUrl);
  return NextResponse.json({
    ok: true,
    status: "static_demo_not_database_backed",
    tenantSlug: params.tenantSlug,
    preview,
    productionGaps: ["GAP-071", "GAP-072", "GAP-073", "GAP-074", "GAP-075", "GAP-076"],
  });
}
