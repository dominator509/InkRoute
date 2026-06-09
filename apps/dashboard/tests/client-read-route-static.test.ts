import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/clients/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/clients/[clientId]/route.ts"), "utf8");
const listPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/clients/page.tsx"), "utf8");
const detailPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/clients/[clientId]/page.tsx"), "utf8");

describe("dashboard client read route contract", () => {
  it("guards client list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "client:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }
  });

  it("uses Prisma repository reads with dashboard projection redaction and sensitive-read audit logs", () => {
    expect(listRouteSource).toContain("tx.client.findMany");
    expect(detailRouteSource).toContain("tx.client.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('collection: "clients"');
      expect(source).toContain('"email"');
      expect(source).toContain('"phone"');
      expect(source).toContain('"medicalNotes"');
      expect(source).toContain('"privateNotes"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain("includesSensitiveProfileFlags");
    }
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedClients");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents the client read API seam from client list and detail pages", () => {
    expect(listPageSource).toContain("tenant-scoped redacted client read routes");
    expect(detailPageSource).toContain("GET /api/clients/${client.id}");
    expect(detailPageSource).toContain("access logging");
  });
});
