import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/releases/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/releases/page.tsx"), "utf8");
const demoSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/releaseDemo.ts"), "utf8");
const actionPanelSource = readFileSync(join(process.cwd(), "apps/dashboard/components/ReleaseActionPanel.tsx"), "utf8");

describe("dashboard release route contract", () => {
  it("guards release reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("releaseTenantQuerySchema.safeParse");
    expect(routeSource).toContain("Release query failed validation.");
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });

  it("uses tenant-scoped ReleaseRecord reads with read audit logging", () => {
    expect(routeSource).toContain("tx.releaseRecord.findMany");
    expect(routeSource).toContain("where: { tenantId }");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "release:read:list"');
    expect(routeSource).toContain('entityType: "ReleaseRecord"');
    expect(routeSource).toContain("auditId: result.audit.id");
  });

  it("keeps write and provider automation boundaries explicit", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:write")');
    expect(routeSource).toContain("releaseCreateInputSchema.safeParse");
    expect(routeSource).toContain("releaseRollbackInputSchema.safeParse");
    expect(routeSource).toContain("tx.idempotencyKey.upsert");
    expect(routeSource).toContain("tx.idempotencyKey.update");
    expect(routeSource).toContain("idempotencyKeyId");
    expect(routeSource).toContain('dashboardMutationAction: "rollback_release"');
    expect(routeSource).toContain("dashboard-release-rollback");
    expect(routeSource).toContain('action: "release:rollback:intent"');
    expect(routeSource).toContain("providerRollbackExecuted: false");
    expect(routeSource).toContain("deploymentJobTriggered: false");
    expect(routeSource).toContain("protectedEnvironmentTouched: false");
    expect(routeSource).toContain("PROVIDER_RELEASE_ROLLBACK_NOT_CONFIGURED");
    expect(routeSource).toContain("RELEASE_UNIQUENESS_CONFLICT");
    expect(routeSource).toContain("PROVIDER_RELEASE_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("localReleaseFallbackDisabled");
    expect(routeSource).toContain("localReleaseRollbackFallbackDisabled");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("{ status: 201, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 409, headers: noStoreHeaders }");
    expect(routeSource).toContain("{ status: 503, headers: noStoreHeaders }");
    expect(pageSource).toContain("coded control-plane contract");
    expect(pageSource).not.toContain("coded control-plane scaffold");
    expect(pageSource).not.toContain('label="scaffolded"');
    expect(demoSource).toContain('status: "control-plane"');
    expect(demoSource).toContain("dashboard actions expose gated route contracts");
    expect(demoSource).not.toContain('status: "scaffolded"');
    expect(demoSource).not.toContain("Dashboard actions still return 501");
    expect(pageSource).toContain("ReleaseActionPanel");
    expect(pageSource).not.toContain("Release actions");
    expect(actionPanelSource).toContain('fetch("/api/releases"');
    expect(actionPanelSource).toContain('"x-release-expected-version"');
    expect(actionPanelSource).toContain('"x-release-approval-state"');
    expect(actionPanelSource).toContain("Create release draft");
    expect(actionPanelSource).toContain("protected environments, deploy jobs, EAS, and provider proof remain gated");
  });
});
