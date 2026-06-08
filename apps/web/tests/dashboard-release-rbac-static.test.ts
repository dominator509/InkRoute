import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("dashboard release RBAC and persistence contracts", () => {
  it("keeps release routes gated by permissions, tenant scope, persistence, and audit logs", () => {
    const source = readWorkspaceFile("apps/dashboard/app/api/releases/route.ts");

    expect(source).toContain('assertPermission(actor, "release:read")');
    expect(source).toContain('assertPermission(actor, "release:write")');
    expect(source).toContain("TENANT_MISMATCH");
    expect(source).toContain("prisma.$transaction");
    expect(source).toContain("tx.releaseRecord.create");
    expect(source).toContain("tx.auditLog.create");
    expect(source).toContain('action: "release:create"');
    expect(source).toContain("releasedByUserId: actor.actorUserId");
    expect(source).toContain("RELEASE_UNIQUENESS_CONFLICT");
  });

  it("keeps feature-flag routes gated by read/write permissions, provider credentials, and audited upserts", () => {
    const source = readWorkspaceFile("apps/dashboard/app/api/feature-flags/route.ts");

    expect(source).toContain('assertPermission(actor, "release:read")');
    expect(source).toContain('assertPermission(actor, "settings:write")');
    expect(source).toContain("TENANT_MISMATCH");
    expect(source).toContain("PROVIDER_CREDENTIALS_REQUIRED");
    expect(source).toContain("tx.featureFlag.findUnique");
    expect(source).toContain("tx.featureFlag.upsert");
    expect(source).toContain("tx.auditLog.create");
    expect(source).toContain('action: "feature_flag:update"');
    expect(source).toContain("previousEnabled");
    expect(source).toContain("previousScope");
  });

  it("keeps dashboard actor resolution header-scoped outside local fallback", () => {
    const source = readWorkspaceFile("apps/dashboard/app/api/dashboardAuth.ts");

    expect(source).toContain('request.headers.get("x-tenant-id")');
    expect(source).toContain('request.headers.get("x-user-id")');
    expect(source).toContain('request.headers.get("x-user-role")');
    expect(source).toContain("AUTH_REQUIRED");
    expect(source).toContain("hasPermission(context.role, permission)");
  });
});
