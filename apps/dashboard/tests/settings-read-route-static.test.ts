import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/settings/route.ts"), "utf8");
const settingsPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/settings/page.tsx"), "utf8");

describe("dashboard settings read route contract", () => {
  it("guards settings reads with tenant RBAC, tenant scope, and no-store cache policy", () => {
    expect(routeSource).toContain('assertPermission(actor, "tenant:read")');
    expect(routeSource).toContain('code: "FORBIDDEN"');
    expect(routeSource).toContain("tenantId !== actor.tenantId");
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("loads tenant settings without secret-bearing fields and writes audit logs", () => {
    expect(routeSource).toContain("tx.tenant.findUnique");
    expect(routeSource).toContain("domains:");
    expect(routeSource).toContain("members:");
    expect(routeSource).toContain("customRoles:");
    expect(routeSource).toContain("studios:");
    expect(routeSource).toContain("flags:");
    expect(routeSource).toContain("tx.auditLog.create");
    expect(routeSource).toContain('action: "settings:read"');
    expect(routeSource).toContain('entityType: "Tenant"');
  });

  it("redacts member emails and avoids domain verification/provider secret leakage", () => {
    expect(routeSource).toContain("redactEmail");
    expect(routeSource).toContain('"verificationTokenHash"');
    expect(routeSource).not.toContain("verificationTokenHash: true");
    expect(routeSource).toContain('"studio.address"');
    expect(routeSource).not.toContain("addressLine1: true");
    expect(routeSource).not.toContain("addressLine2: true");
  });

  it("keeps local fallback and database outage states explicit", () => {
    expect(routeSource).toContain("dashboardShellContext.tenant");
    expect(routeSource).toContain("dashboardFeatureFlags");
    expect(routeSource).toContain('persistence: "local-fallback"');
    expect(routeSource).toContain('code: "DATABASE_UNAVAILABLE"');
  });

  it("documents that settings reads are wired while writes/provider secrets remain gated", () => {
    expect(settingsPageSource).toContain("Tenant-scoped redacted settings read API now exists");
    expect(settingsPageSource).toContain("Settings reads now use a credential-safe tenant API");
    expect(settingsPageSource).toContain("provider secret handling");
  });
});
