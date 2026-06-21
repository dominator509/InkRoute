import { describe, expect, it } from "vitest";
import {
  assertTenantScopedData,
  assertTenantScopedWhere,
  buildTenantIsolationIntegrationReadinessPlan,
  buildTenantIsolationRepositoryEvidencePlan,
  tenantIsolationIntegrationRequiredCommands,
  tenantIsolationIntegrationRequiredEvidence,
  tenantOwnedModelNames,
  tenantIsolationRepositoryRequiredCommands,
  tenantIsolationRepositoryRequiredControls,
  tenantIsolationRepositoryRequiredEvidence,
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
    expect(plan.requiredCommands).toBe(tenantIsolationIntegrationRequiredCommands);
    expect(plan.requiredEvidence).toBe(tenantIsolationIntegrationRequiredEvidence);
    expect(plan.blockers).toContain("Non-production DATABASE_URL must be configured for tenant isolation integration tests.");
    expect(plan.blockers).toContain("Integration tests must cover every tenant-owned model in tenantOwnedModelNames.");
  });

  it("blocks tenant isolation repository evidence until repositories, seeded fixtures, denial tests, audits, cleanup, CI, and redacted artifacts exist", () => {
    const plan = buildTenantIsolationRepositoryEvidencePlan({
      packageScripts: ["test", "db:validate", "db:generate"],
      dbTypecheckPassed: false,
      dbTestsPassed: true,
      prismaClientGenerated: true,
      migrationsApplied: false,
      seededMultiTenantFixturesLoaded: false,
      repositoryLayerImplemented: false,
      repositoryLayerUsesTenantHelpers: false,
      allTenantOwnedModelsCovered: false,
      crossTenantReadDenialPassed: false,
      crossTenantWriteDenialPassed: false,
      missingTenantWriteRejectionPassed: false,
      tenantScopedAuditRowsVerified: false,
      fixtureCleanupTenantScoped: false,
      databaseEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["typecheck", "db:migrate", "db:seed"]);
    expect(plan.requiredEvidence).toBe(tenantIsolationRepositoryRequiredEvidence);
    expect(plan.requiredCommands).toBe(tenantIsolationRepositoryRequiredCommands);
    expect(plan.requiredControls).toBe(tenantIsolationRepositoryRequiredControls);
    expect(plan.blockers).toContain("Tenant-scoped repository/service adoption evidence must be captured before tenant isolation readiness.");
    expect(plan.blockers).not.toContain("Tenant-scoped repository/service layer must be implemented.");
    expect(plan.blockers).toContain("Cross-tenant write denial tests must pass for tenant-owned mutations.");
    expect(plan.blockers).toContain("Tenant isolation artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.");
  });

  it("marks tenant isolation repository evidence ready when repositories, model coverage, denials, audits, cleanup, CI, and redacted artifacts align", () => {
    const plan = buildTenantIsolationRepositoryEvidencePlan({
      packageScripts: ["test", "typecheck", "db:validate", "db:generate", "db:migrate", "db:seed"],
      dbTypecheckPassed: true,
      dbTestsPassed: true,
      prismaClientGenerated: true,
      migrationsApplied: true,
      seededMultiTenantFixturesLoaded: true,
      repositoryLayerImplemented: true,
      repositoryLayerUsesTenantHelpers: true,
      allTenantOwnedModelsCovered: true,
      crossTenantReadDenialPassed: true,
      crossTenantWriteDenialPassed: true,
      missingTenantWriteRejectionPassed: true,
      tenantScopedAuditRowsVerified: true,
      fixtureCleanupTenantScoped: true,
      databaseEvidenceCaptured: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
    });

    expect(plan).toMatchObject({
      status: "ready",
      missingScripts: [],
      requiredEvidence: [],
      blockers: [],
    });
    expect(plan.requiredCommands).toBe(tenantIsolationRepositoryRequiredCommands);
    expect(plan.requiredControls).toBe(tenantIsolationRepositoryRequiredControls);
  });
});
