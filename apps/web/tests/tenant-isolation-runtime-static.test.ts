import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  tenantIsolationArtifactPaths,
  tenantIsolationModelCoverage,
  tenantIsolationRuntimeCommands,
  tenantIsolationRuntimeMatrix,
  tenantIsolationRuntimeReadiness,
} from "../lib/tenantIsolationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("tenant isolation runtime contract", () => {
  const dbPackageJson = readRepoFile("packages/db/package.json");
  const tenantScopeSource = readRepoFile("packages/db/src/tenant-scope.ts");
  const tenantScopeTests = readRepoFile("packages/db/tests/tenant-scope.test.ts");
  const tenantIsolationContract = readRepoFile("packages/db/prisma/tenant-isolation-contract.json");
  const tenantIsolationDocs = readRepoFile("docs/db/TENANT_ISOLATION.md");
  const dbManifest = readRepoFile("testing/manifests/db-integration-test-manifest.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins tenant isolation commands, model coverage, matrix rows, and artifacts", () => {
    expect(tenantIsolationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/db typecheck",
      "pnpm --filter @inkroute/db test",
      "pnpm --filter @inkroute/db db:generate",
      "pnpm --filter @inkroute/db db:migrate",
      "pnpm --filter @inkroute/db db:seed",
      "tenant isolation repository integration suite",
      "cross-tenant read/write denial matrix",
      "tenant-scoped fixture cleanup proof",
      "GitHub Actions tenant isolation evidence job",
    ]);
    expect(tenantIsolationModelCoverage).toEqual(
      expect.arrayContaining(["TenantMember", "BookingRequest", "Payment", "FileAsset", "MessageThread", "Notification", "ReleaseRecord", "AuditLog"]),
    );
    expect(tenantIsolationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "db-package-gates",
      "prisma-generate-migrate-seed",
      "seeded-multi-tenant-fixtures",
      "repository-helper-adoption",
      "tenant-owned-model-coverage",
      "cross-tenant-denial-matrix",
      "missing-tenant-write-rejection",
      "audit-rows-and-fixture-cleanup",
      "ci-secret-safe-artifacts",
    ]);
    expect(tenantIsolationArtifactPaths).toContain("coverage/tenant-isolation-runtime.json");
    expect(tenantIsolationArtifactPaths).toContain("coverage/tenant-isolation-secret-safe-artifacts.json");
    expect(tenantIsolationArtifactPaths).toContain("test-results/tenant-isolation-runtime");
  });

  it("keeps tenant scope helpers, contract, docs, package scripts, and DB manifest wired", () => {
    for (const scriptName of ["typecheck", "test", "db:validate", "db:generate", "db:migrate", "db:seed"]) {
      expect(dbPackageJson).toContain(`"${scriptName}"`);
    }
    for (const helper of ["withTenantWhere", "withTenantData", "assertTenantScopedWhere", "assertTenantScopedData", "tenantOwnedModelNames", "buildTenantIsolationRepositoryEvidencePlan"]) {
      expect(tenantScopeSource).toContain(helper);
      expect(tenantScopeTests).toContain(helper);
    }
    expect(tenantIsolationContract).toContain("tenantOwnedModels");
    expect(tenantIsolationContract).toContain("cross-tenant reads return no rows");
    expect(tenantIsolationDocs).toContain("Tenant Isolation Contract");
    expect(dbManifest).toContain("tenant");
  });

  it("keeps repository evidence blocked until database, repository, denial, audit, cleanup, CI, and safe artifacts exist", () => {
    expect(tenantIsolationRuntimeReadiness.status).toBe("blocked");
    expect(tenantIsolationRuntimeReadiness.missingScripts).toEqual([]);
    expect(tenantIsolationRuntimeReadiness.requiredCommands).toEqual([...tenantIsolationRuntimeCommands]);
    expect(tenantIsolationRuntimeReadiness.requiredControls).toEqual([
      "Use tenant scope helpers for every tenant-owned read and write path.",
      "Reject missing or mismatched tenantId before database mutation side effects.",
      "Persist audit rows with tenant and actor metadata for sensitive tenant-owned operations.",
      "Run fixture cleanup only against seeded test tenants and redact database URLs in artifacts.",
    ]);
    expect(tenantIsolationRuntimeReadiness.requiredEvidence).toEqual([
      "db typecheck/test, Prisma generate, migration, and seeded multi-tenant fixture evidence",
      "tenant-scoped repository helper adoption and model coverage matrix evidence",
      "cross-tenant read/write denial and missing-tenant rejection evidence",
      "tenant-scoped audit-row and fixture cleanup evidence",
      "redacted database, CI, and secret-safe artifact evidence",
    ]);
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Tenant-scoped repository/service layer must be implemented.",
    );
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Cross-tenant write denial tests must pass for tenant-owned mutations.",
    );
    expect(tenantIsolationRuntimeReadiness.blockers).toContain(
      "Tenant isolation artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live tenant isolation proof", () => {
    expect(ciWorkflow).toContain("Run Phase 2 tenant isolation runtime contracts");
    expect(ciWorkflow).toContain("tenant-isolation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("tenant-isolation-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/tenant-isolation-runtime.json");
    expect(unitManifest).toContain("unit-web-tenant-isolation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/tenantIsolationRuntime.ts");
    expect(gapTracker).toContain("live Prisma generate/migrate/seed, seeded multi-tenant fixtures, repository helper adoption, tenant-owned model coverage, cross-tenant denial tests, missing-tenant write rejection, audit-row integration, fixture cleanup, database evidence, CI evidence, and secret-safe artifacts remain open");
  });
});
