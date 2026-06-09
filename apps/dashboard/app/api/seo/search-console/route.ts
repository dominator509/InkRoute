import { prisma } from "@inkroute/db";
import type { SearchConsoleOperation } from "@inkroute/seo";
import { NextRequest, NextResponse } from "next/server";
import {
  buildTenantSearchConsoleOperation,
  searchConsoleArtifactPaths,
  searchConsoleCredentialsConfigured,
  searchConsoleDashboardStatus,
  searchConsoleRequiredEnv,
  searchConsoleRuntimeContract,
  searchConsoleSiteUrl,
} from "../../../../lib/searchConsoleRuntime";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";

const allowedOperations = new Set<SearchConsoleOperation>(["verify_property", "submit_sitemap", "import_query_pages", "monitor_indexing"]);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function operationValue(value: unknown): SearchConsoleOperation {
  return allowedOperations.has(value as SearchConsoleOperation) ? (value as SearchConsoleOperation) : "monitor_indexing";
}

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "seo:read");
  } catch {
    return json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read Search Console status." } }, 403);
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot read Search Console status for another tenant." } }, 403);
  }

  const credentialsConfigured = searchConsoleCredentialsConfigured();
  const propertyOwnerTenantId = params.get("propertyOwnerTenantId") ?? tenantId;
  const status = searchConsoleDashboardStatus({ credentialsConfigured, propertyOwnerTenantId, tenantId });

  return json({
    ok: true,
    tenantId,
    status,
    siteUrl: searchConsoleSiteUrl(),
    credentialsConfigured,
    requiredEnv: searchConsoleRequiredEnv,
    runtime: searchConsoleRuntimeContract,
    artifactPaths: searchConsoleArtifactPaths,
    gapIds: ["GAP-075"],
    boundary: "Dashboard Search Console status is tenant-scoped and credential-gated; provider calls require configured Google Search Console credentials.",
  });
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "seo:write");
  } catch {
    return json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to run Search Console operations." } }, 403);
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tenantId = stringValue(body.tenantId) ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot run Search Console operations for another tenant." } }, 403);
  }

  const operation = operationValue(body.operation);
  const idempotencyKey = request.headers.get("idempotency-key") ?? stringValue(body.idempotencyKey) ?? `search-console:${tenantId}:${operation}`;
  const plan = buildTenantSearchConsoleOperation({
    operation,
    tenantId,
    tenantSlug: stringValue(body.tenantSlug),
    siteUrl: stringValue(body.siteUrl),
    sitemapUrl: stringValue(body.sitemapUrl),
    dateRangeDays: numberValue(body.dateRangeDays, 28),
    propertyOwnerTenantId: stringValue(body.propertyOwnerTenantId) ?? tenantId,
  });

  let auditId: string | null = null;
  if (actor.source !== "local-fallback") {
    try {
      const audit = await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.actorUserId,
          action: `seo.searchConsole.${operation}`,
          entityType: "SearchConsoleOperation",
          metadata: {
            idempotencyKey,
            status: plan.status,
            dashboardStatus: plan.dashboardStatus,
            providerEndpoint: plan.steps[0]?.providerEndpoint,
            requiredEnv: plan.requiredEnv,
            canExecuteProviderCall: plan.canExecuteProviderCall,
            shouldStoreImportedRows: plan.shouldStoreImportedRows,
          },
        },
        select: { id: true },
      });
      auditId = audit.id;
    } catch (error) {
      if (!isDatabaseUnavailable(error)) throw error;
    }
  }

  return json(
    {
      ok: plan.canExecuteProviderCall,
      status: plan.dashboardStatus,
      plan,
      idempotencyKey,
      auditId,
      gapIds: ["GAP-075"],
      boundary: "Search Console operation is planned and audited when DB-backed; live provider execution remains credential-gated.",
    },
    plan.canExecuteProviderCall ? 202 : 409,
  );
}
