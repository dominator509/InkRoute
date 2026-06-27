import { NextResponse, type NextRequest } from "next/server";
import { inkrouteDemoTenant } from "@inkroute/config";
import {
  buildSecurityHeaderPlan,
  buildTenantIsolationFixtures,
  buildTrustCenterChecklist,
  csrfControlPlans,
  rateLimitRules,
  summarizeSecurityPosture,
  uploadPolicies,
} from "@inkroute/security";
import { assertPermission, dashboardApiGuardFailureResponse, resolveDashboardActor } from "../../dashboardAuth";

const allowedReadRoles = new Set(["owner", "studio_manager", "admin", "artist"]);
const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  let actor;
  try {
    actor = resolveDashboardActor(request);
    assertPermission(actor, "tenant:read");
  } catch (error) {
    return dashboardApiGuardFailureResponse(error, "/api/security/trust-status") ?? NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Dashboard security posture requires an authenticated tenant scope.", gapIds: ["GAP-095", "GAP-103"] } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  if (!allowedReadRoles.has(actor.role)) {
    return NextResponse.json(
      { ok: false, error: { code: "ROLE_NOT_AUTHORIZED", message: "Dashboard security posture requires an operator role.", gapIds: ["GAP-095", "GAP-103"] } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  if (actor.tenantId !== inkrouteDemoTenant.id) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_SCOPE_REQUIRED", message: "Dashboard security posture preview is limited to the configured local tenant until persisted membership evidence exists.", gapIds: ["GAP-095", "GAP-103"] } },
      { status: 403, headers: noStoreHeaders },
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
        tenantId: actor.tenantId,
        actor: {
          userId: actor.actorUserId,
          role: actor.role,
        },
        summary: summarizeSecurityPosture(controls),
        productionBoundary: {
          headerOnlyTrustPreviewDisabled: true,
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
      tenantId: actor.tenantId,
      actor: {
        userId: actor.actorUserId,
        role: actor.role,
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
