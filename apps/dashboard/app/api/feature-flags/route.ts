import { NextResponse } from "next/server";
import { defaultFeatureFlags, evaluateFeatureFlags } from "@inkroute/releases";
import { inkrouteDemoTenant } from "@inkroute/config";

export async function GET() {
  return NextResponse.json({
    status: "scaffolded",
    definitions: defaultFeatureFlags,
    previewDecisions: evaluateFeatureFlags(defaultFeatureFlags, {
      tenantId: inkrouteDemoTenant.id,
      role: "owner",
      environment: "preview",
      stableIdentifier: `${inkrouteDemoTenant.id}:owner`,
    }),
    productionDecisions: evaluateFeatureFlags(defaultFeatureFlags, {
      tenantId: inkrouteDemoTenant.id,
      role: "owner",
      environment: "production",
      stableIdentifier: `${inkrouteDemoTenant.id}:owner`,
    }),
    boundary: "Read-only feature flag preview. Production requires authenticated mutations, ReleaseRecord linkage, audit logs, and tenant isolation tests.",
  });
}

export async function POST() {
  return NextResponse.json({
    error: "FEATURE_FLAG_MUTATION_NOT_IMPLEMENTED",
    message: "Feature flag changes are disabled until RBAC, Prisma persistence, audit logs, kill-switch safety, and rollout tests are implemented.",
  }, { status: 501 });
}
