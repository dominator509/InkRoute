import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  domainAuthorizationArtifactPaths,
  domainAuthorizationRuntimeCommands,
  domainAuthorizationRuntimeMatrix,
  domainAuthorizationRuntimeReadiness,
  domainAuthorizationRunPersistenceContract,
} from "../lib/domainAuthorizationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("domain authorization route runtime contract", () => {
  const authPackageJson = readRepoFile("packages/auth/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const settingsRoute = readRepoFile("apps/dashboard/app/api/settings/route.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const domainAuthorizationRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034500_add_domain_authorization_runs/migration.sql");

  it("pins domain authorization commands, matrix rows, and artifact paths", () => {
    expect(domainAuthorizationRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "dashboard middleware route-guard contract tests",
      "dashboard/API/server-action role matrix tests",
      "CustomRole database loading route tests",
      "cross-tenant route denial tests",
      "field redaction route serialization tests",
      "authorization AuditLog persistence tests",
      "CSRF-bound mutating route tests",
      "session revocation route tests",
      "GitHub Actions domain authorization evidence job",
    ]);
    expect(domainAuthorizationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-package-gates",
      "provider-backed-session-context",
      "custom-role-db-loading",
      "dashboard-api-server-action-guards",
      "role-matrix-custom-role-cross-tenant",
      "field-redaction-audit-rows",
      "csrf-session-revocation",
      "ci-secret-safe-artifacts",
    ]);
    expect(domainAuthorizationArtifactPaths).toContain("coverage/domain-authorization-runtime.json");
    expect(domainAuthorizationArtifactPaths).toContain("coverage/domain-authorization-secret-safe-artifacts.json");
    expect(domainAuthorizationArtifactPaths).toContain("test-results/domain-authorization-runtime");
  });

  it("keeps auth package scripts, route guard helpers, DB role models, and current middleware boundary visible", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    for (const helper of ["evaluateDashboardRouteGuard", "evaluateApiRouteGuard", "evaluateFieldAuthorization", "resolveTenantPermissions", "buildDomainAuthorizationRouteEvidencePlan"]) {
      expect(authSource).toContain(helper);
      expect(authTests).toContain(helper);
    }
    expect(schema).toContain("model CustomRole");
    expect(schema).toContain("model TenantMember");
    expect(schema).toContain("model AuditLog");
    expect(dashboardMiddleware).toContain("CSRF_TOKEN_REQUIRED");
    expect(settingsRoute).toContain("settings:read");
  });

  it("keeps route evidence blocked until provider sessions, DB roles, route guards, audits, CSRF, revocation, CI, and safe artifacts exist", () => {
    expect(domainAuthorizationRuntimeReadiness.status).toBe("blocked");
    expect(domainAuthorizationRuntimeReadiness.missingScripts).toEqual([]);
    expect(domainAuthorizationRuntimeReadiness.requiredCommands).toEqual([...domainAuthorizationRuntimeCommands]);
    expect(domainAuthorizationRuntimeReadiness.requiredControls).toEqual([
      "Resolve provider-backed session, TenantMember, and CustomRole rows server-side before route authorization.",
      "Apply route guards before dashboard/API/server-action data loading or mutation side effects.",
      "Reject invalid permissions, inactive roles, cross-tenant roles, tenant mismatches, revoked sessions, and CSRF mismatches.",
      "Persist redacted AuditLog rows for allow and deny decisions.",
      "Apply field authorization before serializing private client, medical, payment, consent, and system data.",
    ]);
    expect(domainAuthorizationRuntimeReadiness.requiredEvidence).toEqual([
      "auth package test/typecheck and provider-backed session evidence",
      "database CustomRole loading and dashboard/API/server-action route-guard adoption evidence",
      "built-in role matrix, custom-role, and cross-tenant route denial evidence",
      "field redaction and authorization AuditLog persistence evidence",
      "CSRF session binding and session revocation route evidence",
      "CI domain authorization route evidence and secret-safe artifact proof",
    ]);
    expect(domainAuthorizationRuntimeReadiness.blockers).toContain(
      "CustomRole rows must be loaded from tenant-scoped database storage in guarded route tests.",
    );
    expect(domainAuthorizationRuntimeReadiness.blockers).toContain(
      "Cross-tenant dashboard/API/server-action denial tests must pass.",
    );
    expect(domainAuthorizationRuntimeReadiness.blockers).toContain(
      "Authorization route artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("pins the DomainAuthorizationRun persistence model and migration", () => {
    expect(domainAuthorizationRunPersistenceContract).toEqual({
      prismaModel: "DomainAuthorizationRun",
      tenantRelation: "domainAuthorizationRuns",
      migration: "20260609034500_add_domain_authorization_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesProviderSessionEvidence: true,
      storesCustomRoleEvidence: true,
      storesRouteGuardEvidence: true,
      storesRoleMatrixEvidence: true,
      storesFieldRedactionEvidence: true,
      storesAuditLogEvidence: true,
      storesCsrfRevocationEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model DomainAuthorizationRun");
    expect(prismaSchema).toContain("domainAuthorizationRuns DomainAuthorizationRun[]");
    expect(prismaSchema).toContain("providerSessionEvidenceCaptured");
    expect(prismaSchema).toContain("csrfRevocationEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(domainAuthorizationRunMigration).toContain('CREATE TABLE "DomainAuthorizationRun"');
    expect(domainAuthorizationRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(domainAuthorizationRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(domainAuthorizationRunMigration).toContain('"DomainAuthorizationRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming route enforcement readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 domain authorization runtime contracts");
    expect(ciWorkflow).toContain("domain-authorization-runtime-static.test.ts");
    expect(ciWorkflow).toContain("domain-authorization-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/domain-authorization-runtime.json");
    expect(unitManifest).toContain("unit-web-domain-authorization-runtime-static");
    expect(unitManifest).toContain("DomainAuthorizationRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/domainAuthorizationRuntime.ts");
    expect(gapTracker).toContain("DomainAuthorizationRun Prisma model and app row contract");
    expect(gapTracker).toContain("live provider-backed sessions, DB-loaded CustomRole rows, dashboard/API/server-action route-guard adoption, role-matrix route tests, custom-role route tests, cross-tenant denial tests, field-redaction serialization, AuditLog persistence, CSRF binding, session revocation, CI evidence, and secret-safe artifacts remain open");
  });
});
