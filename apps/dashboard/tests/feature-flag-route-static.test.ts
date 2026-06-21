import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/feature-flags/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/releases/page.tsx"), "utf8");

describe("dashboard feature-flag route contract", () => {
  it("guards feature-flag reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("loads DB and default flag definitions through audited tenant-scoped reads", () => {
    expect(routeSource).toContain("buildDefinitionsForTenant(tenantId)");
    expect(routeSource).toContain("prisma.$transaction");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "feature_flag:read:list"');
    expect(routeSource).toContain('entityType: "FeatureFlag"');
    expect(routeSource).toContain("auditId: result.audit.id");
    expect(routeSource).toContain("evaluateFeatureFlags(definitions, context)");
  });

  it("keeps feature-flag writes gated by settings permission, validation, provider credentials, and audit rows", () => {
    expect(routeSource).toContain('assertPermission(actor, "settings:write")');
    expect(routeSource).toContain("featureFlagPatchInputSchema.safeParse");
    expect(routeSource).toContain("PROVIDER_CREDENTIALS_REQUIRED");
    expect(routeSource).toContain("tx.featureFlag.upsert");
    expect(routeSource).toContain('action: "feature_flag:update"');
    expect(routeSource).toContain("previousEnabled");
    expect(routeSource).toContain("previousScope");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("{ status: 201, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 409, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 500, headers: noStoreHeaders }");
  });

  it("documents release and feature-flag read APIs on the dashboard page", () => {
    expect(pageSource).toContain("no-store tenant-scoped release/feature-flag APIs");
    expect(pageSource).toContain("GET /api/releases");
    expect(pageSource).toContain("GET /api/feature-flags");
    expect(pageSource).toContain("read audit logging");
  });
});
