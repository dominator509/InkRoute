import { describe, expect, it } from "vitest";
import {
  assertTenantScopedData,
  assertTenantScopedWhere,
  buildTenantIsolationIntegrationReadinessPlan,
  tenantOwnedModelNames,
  withTenantData,
  withTenantWhere,
} from "../src/index";

describe("tenant scope helpers", () => {
  it("adds tenantId to query where clauses and rejects empty scopes", () => {
    const scoped = withTenantWhere({ tenantId: "tenant_a" }, { status: "active" });

    expect(scoped.where).toEqual({ status: "active", tenantId: "tenant_a" });
    expect(() => withTenantWhere({ tenantId: " " }, {})).toThrow("tenantId");
  });

  it("adds tenantId to mutation data and asserts expected tenant scope", () => {
    const scoped = withTenantData({ tenantId: "tenant_a", actorUserId: "user_1" }, { status: "open" });

    expect(scoped.data).toEqual({ status: "open", tenantId: "tenant_a" });
    expect(() => assertTenantScopedWhere(scoped, "tenant_b")).toThrow("tenantId scope");
    expect(() => assertTenantScopedData(scoped, "tenant_b")).toThrow("tenantId scope");
    expect(() => assertTenantScopedWhere(scoped, "tenant_a")).not.toThrow();
    expect(() => assertTenantScopedData(scoped, "tenant_a")).not.toThrow();
  });

  it("pins tenant-owned model names for future integration coverage", () => {
    expect(tenantOwnedModelNames).toEqual(
      expect.arrayContaining([
        "BookingRequest",
        "Payment",
        "FileAsset",
        "MessageThread",
        "Notification",
        "SeoCityPage",
        "ReleaseRecord",
        "AuditLog",
      ]),
    );
  });

  it("summarizes tenant isolation integration readiness for live Postgres proof", () => {
    const plan = buildTenantIsolationIntegrationReadinessPlan({
      packageScripts: ["test", "db:validate", "db:generate"],
      prismaClientGenerated: true,
      databaseUrlConfigured: false,
      migrationsApplied: false,
      seedDataLoaded: false,
      multiTenantFixturesLoaded: false,
      repositoryLayerUsesHelpers: true,
      crossTenantReadTestsPassed: false,
      crossTenantWriteTestsPassed: false,
      auditRowsIncludeTenantAndActor: false,
      allTenantOwnedModelsCovered: false,
      destructiveFixtureCleanupVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["db:migrate", "db:seed"]);
    expect(plan.requiredCommands).toContain("pnpm --filter @inkroute/db db:migrate");
    expect(plan.requiredEvidence).toContain("Cross-tenant read denial output for every tenant-owned model.");
    expect(plan.blockers).toContain("Non-production DATABASE_URL must be configured for tenant isolation integration tests.");
    expect(plan.blockers).toContain("Integration tests must cover every tenant-owned model in tenantOwnedModelNames.");
  });
});
