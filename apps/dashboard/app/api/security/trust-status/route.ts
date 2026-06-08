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

function resolveDashboardReader(request: NextRequest): { tenantId: string; role: string; userId: string } | { error: { status: number; code: string; message: string } } {
  const tenantId = request.headers.get("x-tenant-id");
  const role = request.headers.get("x-user-role") ?? "viewer";
  const userId = request.headers.get("x-user-id") ?? "demo-dashboard-reader";

  if (tenantId !== demoTenantId) {
    return {
      error: {
        status: 403,
        code: "TENANT_SCOPE_REQUIRED",
        message: "Dashboard security posture requires an authenticated tenant scope.",
      },
    };
  }

  if (!allowedReadRoles.has(role)) {
    return {
      error: {
        status: 403,
        code: "ROLE_NOT_AUTHORIZED",
        message: "Dashboard security posture requires an operator role.",
      },
    };
  }

  return { tenantId, role, userId };
}

export async function GET(request: NextRequest) {
  const reader = resolveDashboardReader(request);
  if ("error" in reader) {
    return NextResponse.json(
      { ok: false, error: { code: reader.error.code, message: reader.error.message, gapIds: ["GAP-095", "GAP-103"] } },
      { status: reader.error.status },
    );
  }

  const controls = buildTrustCenterChecklist();
  return NextResponse.json({
    ok: true,
    status: "scaffolded",
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
  });
}
