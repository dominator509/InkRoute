import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/releases/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/releases/page.tsx"), "utf8");

describe("dashboard release route contract", () => {
  it("guards release reads with RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "release:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
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
    expect(routeSource).toContain("RELEASE_UNIQUENESS_CONFLICT");
    expect(pageSource).toContain("GET /api/releases");
    expect(pageSource).toContain("tenant mismatch denial");
    expect(pageSource).toContain("protected environments and provider credentials");
  });
});
