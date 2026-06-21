import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDomainAuthorizationArtifactReview,
  buildDomainAuthorizationEvidenceDecision,
  buildDomainAuthorizationExecutionPlan,
  buildDomainAuthorizationRunData,
  buildRedactedDomainAuthorizationArtifact,
  persistDomainAuthorizationRun,
  domainAuthorizationArtifactPaths,
  domainAuthorizationEvidenceFlags,
  domainAuthorizationExternalArtifacts,
  domainAuthorizationExternalCommands,
  domainAuthorizationExecutionPolicy,
  domainAuthorizationLocalArtifacts,
  domainAuthorizationLocalCommands,
  domainAuthorizationRequiredExternalEvidence,
  domainAuthorizationRuntimeCommands,
  domainAuthorizationRuntimeControls,
  domainAuthorizationRuntimeMatrix,
  domainAuthorizationRuntimeProofFiles,
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

  it("pins domain authorization runtime control helper identity", () => {
    const decision = buildDomainAuthorizationEvidenceDecision({
      commands: domainAuthorizationRuntimeCommands,
      artifacts: domainAuthorizationArtifactPaths,
      controls: domainAuthorizationRuntimeControls,
      evidence: Object.fromEntries(domainAuthorizationEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof domainAuthorizationEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(domainAuthorizationRuntimeControls);
    expect(gapTracker).toContain("domainAuthorizationRuntimeControls");
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
    expect(domainAuthorizationRuntimeReadiness.requiredCommands).toBe(domainAuthorizationRuntimeCommands);
    expect(domainAuthorizationRuntimeReadiness.requiredControls).toBe(domainAuthorizationRuntimeControls);
    expect(domainAuthorizationRuntimeReadiness.requiredEvidence).toBe(domainAuthorizationEvidenceFlags);
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
    const runData = buildDomainAuthorizationRunData({
      tenantId: "tenant_static",
      runId: "domain_authorization_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["dashboard middleware route-guard contract tests"],
      artifacts: ["coverage/domain-authorization-dashboard-middleware.json"],
      providerSessionEvidenceCaptured: true,
      customRoleEvidenceCaptured: false,
      routeGuardEvidenceCaptured: false,
      roleMatrixEvidenceCaptured: false,
      fieldRedactionEvidenceCaptured: false,
      auditLogEvidenceCaptured: false,
      csrfRevocationEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      routeGuardReportPath: "coverage/domain-authorization-api-route-guards.json",
      auditLogReportPath: "coverage/domain-authorization-audit-rows-redacted.json",
    });

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
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "domain_authorization_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["dashboard middleware route-guard contract tests"],
      artifactManifest: ["coverage/domain-authorization-dashboard-middleware.json"],
      providerSessionEvidenceCaptured: true,
      customRoleEvidenceCaptured: false,
      routeGuardEvidenceCaptured: false,
      auditLogEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      routeGuardReportPath: "coverage/domain-authorization-api-route-guards.json",
      auditLogReportPath: "coverage/domain-authorization-audit-rows-redacted.json",
    });
    expect(String(persistDomainAuthorizationRun)).toContain("repository.domainAuthorizationRun.upsert");
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

  it("blocks domain authorization completion when session, guard, audit, CSRF, or safe-artifact evidence is missing", () => {
    const decision = buildDomainAuthorizationEvidenceDecision({
      commands: ["pnpm --filter @inkroute/auth typecheck"],
      artifacts: ["coverage/domain-authorization-auth-typecheck.txt"],
      controls: ["resolve-provider-session-tenant-member-custom-role-server-side-before-authorization"],
      evidence: {
        authTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("session revocation route tests");
    expect(decision.missingArtifacts).toContain("coverage/domain-authorization-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("apply-route-guards-before-dashboard-api-server-action-side-effects");
    expect(decision.missingEvidence).toContain("customRolesLoadedFromDatabase");
    expect(decision.missingEvidence).toContain("crossTenantDenialTestsPassed");
    expect(decision.blockers).toContain(
      "CustomRole rows must be loaded from tenant-scoped database storage in guarded route tests.",
    );
    expect(decision.blockers).toContain("Cross-tenant dashboard/API/server-action denial tests must pass.");
  });

  it("completes domain authorization only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(domainAuthorizationEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDomainAuthorizationEvidenceDecision({
      commands: domainAuthorizationRuntimeCommands,
      artifacts: domainAuthorizationArtifactPaths,
      controls: domainAuthorizationRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(domainAuthorizationEvidenceFlags);
  });

  it("keeps domain authorization execution classified, redacted, and provider/database-gated", () => {
    const executionPlan = buildDomainAuthorizationExecutionPlan();
    expect(executionPlan.localCommands).toBe(domainAuthorizationLocalCommands);
    expect(executionPlan.externalCommands).toBe(domainAuthorizationExternalCommands);
    expect(executionPlan.localArtifacts).toBe(domainAuthorizationLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(domainAuthorizationExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/domain-authorization-dashboard-middleware.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/domain-authorization-provider-session-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("provider-backed DomainAuthorizationRun persistence proof");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerSessionExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.routeWideExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(domainAuthorizationExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticDomainAuthorizationReadiness: true,
      providerSessionEvidenceRequiredForClosure: true,
      databaseRoleEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(domainAuthorizationRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed DomainAuthorizationRun persistence row captured through persistDomainAuthorizationRun.",
    );

    const artifact = {
      sessionToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      tenantMemberId: "tenant_member_1234567890abcdefghijklmnopqrstuvwxyz",
      customRoleId: "role_1234567890abcdefghijklmnopqrstuvwxyz",
      actorEmail: "admin@example.com",
      csrfToken: "csrf_1234567890abcdefghijklmnopqrstuvwxyz",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        auditLogId: "audit_1234567890abcdefghijklmnopqrstuvwxyz",
        publicSummary: "domain authorization evidence captured",
      },
    };
    const redactedOnly = buildRedactedDomainAuthorizationArtifact(artifact);
    const review = buildDomainAuthorizationArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("tenant_member_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("role_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("admin@example.com");
    expect(serialized).not.toContain("csrf_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("audit_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(review.redactions).toEqual([
      "sessionToken",
      "tenantMemberId",
      "customRoleId",
      "actorEmail",
      "csrfToken",
      "nested.databaseUrl",
      "nested.auditLogId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(domainAuthorizationRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming route enforcement readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 domain authorization runtime contracts");
    expect(ciWorkflow).toContain("domain-authorization-runtime-static.test.ts");
    expect(ciWorkflow).toContain("domain-authorization-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/domain-authorization-runtime.json");
    expect(unitManifest).toContain("unit-web-domain-authorization-runtime-static");
    expect(unitManifest).toContain("DomainAuthorizationRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/domainAuthorizationRuntime.ts");
    expect(gapTracker).toContain("persistDomainAuthorizationRun upsert seam");
    expect(gapTracker).toContain("GAP-023 is domain-authorization-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live provider-backed sessions, DB-loaded CustomRole rows, provider-backed persistDomainAuthorizationRun execution, dashboard/API/server-action route-guard adoption, role-matrix route tests, custom-role route tests, cross-tenant denial tests, field-redaction serialization, AuditLog persistence, CSRF binding, session revocation, CI evidence, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildDomainAuthorizationExecutionPlan");
    expect(gapTracker).toContain("domainAuthorizationExecutionPolicy");
    expect(gapTracker).toContain("domainAuthorizationRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedDomainAuthorizationArtifact");
    expect(gapTracker).toContain("buildDomainAuthorizationArtifactReview");
  });

  it("pins current domain authorization proof files for GAP-023", () => {
    expect(domainAuthorizationRuntimeProofFiles).toContain("packages/auth/package.json");
    expect(domainAuthorizationRuntimeProofFiles).toContain("apps/web/lib/domainAuthorizationRuntime.ts");
    expect(domainAuthorizationRuntimeProofFiles).toContain("apps/web/tests/domain-authorization-runtime-static.test.ts");
    for (const proofFile of domainAuthorizationRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


