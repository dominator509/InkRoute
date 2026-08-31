import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/route.ts"), "utf8");
const detailRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/[portfolioId]/route.ts"), "utf8");
const imageAttachRouteSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/portfolio/[portfolioId]/images/route.ts"), "utf8");
const portfolioPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/portfolio/page.tsx"), "utf8");
const trustPageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/trust/page.tsx"), "utf8");

describe("dashboard portfolio read route contract", () => {
  it("guards portfolio list and detail reads with RBAC, tenant scope, and no-store cache policy", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain('assertPermission(actor, "portfolio:read")');
      expect(source).toContain('code: "FORBIDDEN"');
      expect(source).toContain("tenantId !== actor.tenantId");
      expect(source).toContain('code: "TENANT_MISMATCH"');
      expect(source).toContain('"Cache-Control": "no-store"');
      expect(source).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
      expect(source).not.toContain('}, { status: 403 });');
      expect(source).not.toContain('}, { status: 500 });');
    }
    expect(detailRouteSource).not.toContain('}, { status: 404 });');
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
    expect(detailRouteSource).toContain("function buildPortfolioDetailResponseProjection");
    expect(detailRouteSource).toContain("function buildSafePortfolioDetailRecord");
    expect(detailRouteSource).toContain("auditIdEchoed: false");
    expect(detailRouteSource).toContain("internalPersistenceIdsEchoed: false");
    expect(detailRouteSource).toContain("portfolioItemIdEchoed: false");
    expect(detailRouteSource).toContain("tenantIdEchoed: false");
    expect(detailRouteSource).toContain("attributedBookingIdsEchoed: false");
    expect(detailRouteSource).toContain("portfolioImageIdsEchoed: false");
    expect(detailRouteSource).toContain("fileAssetIdsEchoed: false");
    expect(detailRouteSource).toContain("tenantScope: { actorTenantMatched: true");
    expect(detailRouteSource).toContain("portfolioTenantMatched: true");
    expect(listRouteSource).toContain("buildSafePortfolioListRecord");
    expect(listRouteSource).toContain("portfolioItemIdsEchoed: false");
    expect(listRouteSource).toContain("tenantIdEchoed: false");
    expect(listRouteSource).toContain("attributedBookingIdsEchoed: false");
    expect(listRouteSource).toContain("portfolioImageIdsEchoed: false");
    expect(listRouteSource).toContain("fileAssetIdsEchoed: false");
    expect(listRouteSource).toContain("tenantScope: { actorTenantMatched: true }");
    expect(listRouteSource).toContain("attributedBookingLinked: Boolean");
    expect(listRouteSource).toContain("fileAssetLinked: Boolean");
    expect(listRouteSource).not.toContain("id: row.id");
    expect(listRouteSource).not.toContain("tenantId: row.tenantId");
    expect(listRouteSource).not.toContain("id: image.id");
    expect(listRouteSource).not.toContain("fileAssetId: image.fileAsset?.id");
    expect(listRouteSource).not.toContain("tenantId,\n          error:");
    expect(detailRouteSource).not.toContain("auditId: result.audit.id");
    expect(detailRouteSource).not.toContain("id: result.row.id");
    expect(detailRouteSource).not.toContain("tenantId: result.row.tenantId");
    expect(detailRouteSource).not.toContain("id: booking.id");
    expect(detailRouteSource).not.toContain("id: image.id");
    expect(detailRouteSource).not.toContain("fileAssetId: image.fileAsset?.id");
    expect(detailRouteSource).not.toContain("tenantId,\n          portfolioId");
    expect(detailRouteSource).not.toContain("tenantId,\n        persistence");
    expect(detailRouteSource).toContain("fileAssetLinked: Boolean(image.fileAsset?.id)");
  });

  it("redacts private file URLs and asset metadata while allowing public image URLs", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("redactAssetMetadata");
      expect(source).toContain('visibility === "public" ? image.imageUrl : "[redacted-dashboard-field]"');
      expect(source).not.toContain("objectKey: true");
      expect(source).not.toContain("bucket: true");
      expect(source).not.toContain("checksumSha256: true");
      expect(source).not.toContain("signedUrlExpiresAt: true");
      expect(source).toContain('objectKey: "[redacted-dashboard-field]"');
      expect(source).toContain('bucket: "[redacted-dashboard-field]"');
      expect(source).toContain('checksumSha256: "[redacted-dashboard-field]"');
      expect(source).toContain('signedUrlExpiresAt: "[redacted-dashboard-field]"');
      expect(source).toContain("objectKeySelectedFromDatabase: false");
      expect(source).toContain("bucketSelectedFromDatabase: false");
      expect(source).toContain("checksumSelectedFromDatabase: false");
      expect(source).toContain("signedUrlExpirySelectedFromDatabase: false");
      expect(source).toContain("/key|bucket|checksum|signed|url|token|client|private/i");
    }
  });

  it("keeps local fallback projected and database outage states explicit", () => {
    for (const source of [listRouteSource, detailRouteSource]) {
      expect(source).toContain("dashboardProjectedPortfolio");
      expect(source).toContain("PROVIDER_DASHBOARD_READS_NOT_CONFIGURED");
      expect(source).toContain("localDashboardReadFallbackDisabled");
      expect(source).toContain('persistence: "local-fallback"');
      expect(source).toContain('code: "DATABASE_UNAVAILABLE"');
    }
  });

  it("documents that portfolio reads are wired while storage writes remain provider-gated", () => {
    expect(portfolioPageSource).toContain("Tenant-scoped redacted portfolio read APIs now exist");
    expect(portfolioPageSource).toContain("Portfolio reads now redact storage keys");
    expect(portfolioPageSource).toContain("signed storage");
    expect(trustPageSource).toContain("provider storage proof gated");
    expect(trustPageSource).not.toContain("signed storage not wired");
  });

  it("persists portfolio creation idempotency before audited metadata writes", () => {
    expect(listRouteSource).toContain('export const runtime = "nodejs"');
    expect(listRouteSource).toContain("dashboard-portfolio-create");
    expect(listRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(listRouteSource).toContain("idempotency.status === \"completed\"");
    expect(listRouteSource).toContain("portfolioItemModel.findFirst");
    expect(listRouteSource).toContain("portfolioItemModel.create");
    expect(listRouteSource).toContain("tx.auditLog.create");
    expect(listRouteSource).toContain("tx.idempotencyKey.update");
    expect(listRouteSource).toContain("imageUrlStoredInResult: false");
    expect(listRouteSource).toContain("providerUrlMinted: false");
    expect(listRouteSource).toContain("portfolioItemResponseAllowlisted: true");
    expect(listRouteSource).not.toContain("...result.item");
    expect(listRouteSource).toContain("idempotencyKeyId");
    expect(listRouteSource).toContain("idempotencyReplay");
    expect(listRouteSource).toContain("idempotency-backed");
  });

  it("persists portfolio image metadata idempotency before audited attachment writes", () => {
    expect(imageAttachRouteSource).toContain('export const runtime = "nodejs"');
    expect(imageAttachRouteSource).toContain("dashboard-portfolio-image-attach");
    expect(imageAttachRouteSource).toContain("tx.idempotencyKey.upsert");
    expect(imageAttachRouteSource).toContain("idempotency.status === \"completed\"");
    expect(imageAttachRouteSource).toContain("tx.portfolioImage.findFirst");
    expect(imageAttachRouteSource).toContain("tx.portfolioImage.create");
    expect(imageAttachRouteSource).toContain("tx.auditLog.create");
    expect(imageAttachRouteSource).toContain("tx.idempotencyKey.update");
    expect(imageAttachRouteSource).toContain("rawImageUrlStoredInResult: false");
    expect(imageAttachRouteSource).toContain("providerUrlMinted: false");
    expect(imageAttachRouteSource).toContain("malwareScanExecuted: false");
    expect(imageAttachRouteSource).toContain("derivativesGenerated: false");
    expect(imageAttachRouteSource).toContain("portfolioImageResponseAllowlisted: true");
    expect(imageAttachRouteSource).not.toContain("...result.image");
    expect(imageAttachRouteSource).toContain("idempotencyKeyId");
    expect(imageAttachRouteSource).toContain("idempotencyReplay");
    expect(imageAttachRouteSource).toContain("idempotency-backed");
  });
});
