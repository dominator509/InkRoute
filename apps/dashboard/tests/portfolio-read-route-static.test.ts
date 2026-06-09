import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/[portfolioId]/route.ts"), "utf8");
const portfolioPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/portfolio/page.tsx"), "utf8");

describe("dashboard portfolio read route contract", () => {
  it("guards portfolio list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "portfolio:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
    }
  });

  it("uses Prisma portfolio reads with projection redaction and sensitive asset audit logs", () => {
    expect(listRouteSource).toContain("tx.portfolioItem.findMany");
    expect(detailRouteSource).toContain("tx.portfolioItem.findFirst");

    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("buildTenantDashboardView");
      expect(source).toContain('collection: "portfolio"');
      expect(source).toContain('"attributionKey"');
      expect(source).toContain('"objectKey"');
      expect(source).toContain('"bucket"');
      expect(source).toContain('"checksumSha256"');
      expect(source).toContain('"signedUrlExpiresAt"');
      expect(source).toContain("tx.auditLog.create");
      expect(source).toContain('redaction: "buildTenantDashboardView"');
      expect(source).toContain("redactsAssetKeys");
    }
  });

  it("redacts private file URLs and asset metadata while allowing public image URLs", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("redactAssetMetadata");
      expect(source).toContain('visibility === "public" ? image.imageUrl : "[redacted-dashboard-field]"');
      expect(source).toContain("/key|bucket|checksum|signed|url|token|client|private/i");
    }
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedPortfolio");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that portfolio reads are wired while storage writes remain provider-gated", () => {
    expect(portfolioPageSource).toContain("Tenant-scoped redacted portfolio read APIs now exist");
    expect(portfolioPageSource).toContain("Portfolio reads now redact storage keys");
    expect(portfolioPageSource).toContain("signed storage");
  });
});
