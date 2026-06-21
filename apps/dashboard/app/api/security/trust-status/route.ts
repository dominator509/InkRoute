import { NextResponse, type NextRequest } from "next/server";
import {
  buildSecurityHeaderPlan,
  buildTenantIsolationFixtures,
  buildTrustCenterChecklist,
  csrfControlPlans,
  rateLimitRules,
  summarizeSecurityPosture,
  uploadPolicies,
} from "@inkroute/security";

const demoTenantId = "demo-studio-alpha";
const allowedReadRoles = new Set(["owner", "studio_manager", "admin", "artist"]);
const fallbackRole = "viewer";
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function normalizeHeaderValue(value: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function resolveDashboardReader(request: NextRequest): { tenantId: string; role: string; userId: string } | { error: { status: number; code: string; message: string } } {
  const tenantId = normalizeHeaderValue(request.headers.get("x-tenant-id"));
  const role = normalizeHeaderValue(request.headers.get("x-user-role")) ?? fallbackRole;
  const userId = normalizeHeaderValue(request.headers.get("x-user-id")) ?? "demo-dashboard-reader";

  if (tenantId !== demoTenantId) {
    return {
      error: {
        status: 403,
        code: "TENANT_SCOPE_REQUIRED",
        message: "Dashboard security posture requires an authenticated tenant scope.",
      },
    };
  }

  const normalizedRole = role.toLowerCase();

  if (!allowedReadRoles.has(normalizedRole)) {
    return {
      error: {
        status: 403,
        code: "ROLE_NOT_AUTHORIZED",
        message: "Dashboard security posture requires an operator role.",
      },
    };
  }

  return { tenantId, role: normalizedRole, userId };
}

export async function GET(request: NextRequest) {
  const reader = resolveDashboardReader(request);
  if ("error" in reader) {
    return NextResponse.json(
      { ok: false, error: { code: reader.error.code, message: reader.error.message, gapIds: ["GAP-095", "GAP-103"] } },
      { status: reader.error.status, headers: noStoreHeaders },
    );
  }

  const controls = buildTrustCenterChecklist();
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DASHBOARD_TRUST_STATUS_PROVIDER_AUTH_NOT_CONFIGURED",
          message:
            "Production dashboard trust status requires provider-backed session, persisted tenant membership, audit-ready route evidence, and current security runtime artifacts; header-only trust previews are disabled until provider-backed session evidence is captured.",
          gapIds: ["GAP-040", "GAP-095", "GAP-103", "GAP-104"],
        },
        tenantId: reader.tenantId,
        actor: {
          userId: reader.userId,
          role: reader.role,
        },
        summary: summarizeSecurityPosture(controls),
        productionBoundary: {
          scaffoldedTrustPreviewDisabled: true,
          requiresProviderBackedSession: true,
          requiresPersistedTenantMembership: true,
          requiresSecurityRuntimeEvidence: true,
          gapIds: ["GAP-040", "GAP-095", "GAP-103", "GAP-104"],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      status: "local-preview",
      tenantId: reader.tenantId,
      actor: {
        userId: reader.userId,
        role: reader.role,
      },
      summary: summarizeSecurityPosture(controls),
      controls,
      tenantIsolationFixtures: buildTenantIsolationFixtures(),
      uploadPolicies,
      rateLimitRules,
      csrfControlPlans,
      securityHeaders: buildSecurityHeaderPlan(),
      boundary: "Read-only security posture preview. Production requires auth, RBAC, tenant-scoped data loaders, rate limit store, upload provider, legal review, audit logs, and tests.",
      gapIds: ["GAP-095", "GAP-096", "GAP-097", "GAP-098", "GAP-099", "GAP-100", "GAP-101", "GAP-102", "GAP-103"],
    },
    { headers: noStoreHeaders },
  );
}
