import { prisma } from "@inkroute/db";
import type { SearchConsoleOperation, SearchConsoleOperationPlan } from "@inkroute/seo";
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

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: noStoreHeaders });
}

function buildSafeSearchConsolePlanResponse(plan: SearchConsoleOperationPlan) {
  return {
    status: plan.status,
    operation: plan.operation,
    tenantSlug: plan.tenantSlug,
    propertyType: plan.propertyType,
    verificationMethod: plan.verificationMethod,
    canExecuteProviderCall: plan.canExecuteProviderCall,
    requiresCredential: plan.requiresCredential,
    requiresTenantOwnershipCheck: plan.requiresTenantOwnershipCheck,
    shouldStoreImportedRows: plan.shouldStoreImportedRows,
    dashboardStatus: plan.dashboardStatus,
    blockers: plan.blockers,
    requiredEnv: plan.requiredEnv,
    stepSummaries: plan.steps.map((step) => ({
      id: step.id,
      providerEndpoint: step.providerEndpoint,
      requiresCredential: step.requiresCredential,
      writesTenantData: step.writesTenantData,
      summaryEchoed: false,
    })),
    rawSiteUrlEchoed: false,
    rawSitemapUrlEchoed: false,
    rawStepSummaryEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawProviderPayloadEchoed: false,
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function buildSearchConsoleResponseProjection() {
  return {
    tenantIdEchoed: false,
    auditIdEchoed: false,
    rawSiteUrlEchoed: false,
    rawIdempotencyKeyEchoed: false,
    rawProviderPayloadEchoed: false,
    rawCredentialsEchoed: false,
    rawPrivateKeyEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
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
    tenantScope: { actorTenantMatched: true },
    status,
    siteUrlConfigured: Boolean(searchConsoleSiteUrl()),
    credentialsConfigured,
    responseProjection: buildSearchConsoleResponseProjection(),
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
    ...(stringValue(body.tenantSlug) ? { tenantSlug: stringValue(body.tenantSlug) } : {}),
    ...(stringValue(body.siteUrl) ? { siteUrl: stringValue(body.siteUrl) } : {}),
    ...(stringValue(body.sitemapUrl) ? { sitemapUrl: stringValue(body.sitemapUrl) } : {}),
    dateRangeDays: numberValue(body.dateRangeDays, 28),
    propertyOwnerTenantId: stringValue(body.propertyOwnerTenantId) ?? tenantId,
  });

  if (process.env.NODE_ENV === "production" && actor.source === "local-fallback") {
    return json(
      {
        ok: false,
        source: actor.source,
        tenantScope: { actorTenantMatched: true },
        responseProjection: buildSearchConsoleResponseProjection(),
        error: {
          code: "PROVIDER_SEARCH_CONSOLE_AUDIT_NOT_CONFIGURED",
          message: "Production Search Console operations require DB-backed actor resolution and auditable operation metadata; local fallback planning is disabled.",
          gapIds: ["GAP-075"],
        },
        productionBoundary: { localSearchConsolePlanFallbackDisabled: true },
      },
      503,
    );
  }

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
            idempotencyPersisted: true,
            rawIdempotencyKeyStored: false,
            internalPersistenceIdsStored: false,
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
      if (process.env.NODE_ENV === "production" && isDatabaseUnavailable(error)) {
        return json(
          {
            ok: false,
            source: actor.source,
            tenantScope: { actorTenantMatched: true },
            responseProjection: buildSearchConsoleResponseProjection(),
            error: {
              code: "PROVIDER_SEARCH_CONSOLE_AUDIT_NOT_CONFIGURED",
              message: "Production Search Console operations require dashboard database audit persistence; unaudited provider operation plans are disabled.",
              gapIds: ["GAP-075"],
            },
            productionBoundary: { localSearchConsolePlanFallbackDisabled: true },
          },
          503,
        );
      }
      if (!isDatabaseUnavailable(error)) throw error;
    }
  }

  return json(
    {
      ok: plan.canExecuteProviderCall,
      status: plan.dashboardStatus,
      tenantScope: { actorTenantMatched: true },
      plan: buildSafeSearchConsolePlanResponse(plan),
      idempotencyKeyPresent: Boolean(idempotencyKey),
      rawIdempotencyKeyEchoed: false,
      auditLogged: Boolean(auditId),
      responseProjection: buildSearchConsoleResponseProjection(),
      gapIds: ["GAP-075"],
      boundary: "Search Console operation is planned and audited when DB-backed; live provider execution remains credential-gated.",
    },
    plan.canExecuteProviderCall ? 202 : 409,
  );
}
