import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDashboardAuthGuardArtifactReview,
  buildDashboardAuthGuardEvidenceDecision,
  buildDashboardAuthGuardExecutionPlan,
  buildRedactedDashboardAuthGuardArtifact,
  dashboardAuthGuardArtifactPaths,
  dashboardAuthGuardEvidenceFlags,
  dashboardAuthGuardExternalCommands,
  dashboardAuthGuardExecutionPolicy,
  dashboardAuthGuardLocalCommands,
  dashboardAuthGuardReadinessAreas,
  dashboardAuthGuardRequiredExternalEvidence,
  dashboardAuthGuardRuntimeCommands,
  dashboardAuthGuardRuntimeMatrix,
  dashboardAuthGuardRuntimeProofFiles,
  dashboardAuthGuardRuntimeReadiness,
  dashboardAuthGuardRuntimeRequiredControls,
} from "../lib/dashboardAuthGuardRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard auth guard runtime contract", () => {
  const authPackageJson = readRepoFile("packages/auth/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const dashboardLayout = readRepoFile("apps/dashboard/app/layout.tsx");
  const dashboardAuthApi = readRepoFile("apps/dashboard/app/api/dashboardAuth.ts");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-036 commands, readiness areas, matrix rows, and artifacts", () => {
    expect(dashboardAuthGuardRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard middleware auth guard tests",
      "dashboard protected layout auth guard tests",
      "dashboard API auth guard tests",
      "browser dashboard login/logout smoke",
      "browser dashboard tenant-switch smoke",
      "browser dashboard cross-tenant denial smoke",
      "auth AuditLog persistence tests",
      "GitHub Actions dashboard auth guard evidence job",
    ]);
    expect(dashboardAuthGuardReadinessAreas).toContain("dashboard-middleware-guard");
    expect(dashboardAuthGuardReadinessAreas).toContain("dashboard-api-helper-guard");
    expect(dashboardAuthGuardReadinessAreas).toContain("browser-cross-tenant-denial");
    expect(dashboardAuthGuardRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-typecheck",
      "auth-tests",
      "dashboard-typecheck-build",
      "middleware-guard",
      "protected-layout-guard",
      "api-helper-guard",
      "provider-session",
      "tenantmember-customrole-db",
      "unauthorized-states-audit",
      "browser-denial-smokes",
      "ci-secret-safe-evidence",
    ]);
    expect(dashboardAuthGuardArtifactPaths).toContain("coverage/dashboard-auth-guard-runtime.json");
    expect(dashboardAuthGuardArtifactPaths).toContain("test-results/dashboard-auth-guard-runtime");
  });

  it("pins current GAP-036 proof files", () => {
    expect(dashboardAuthGuardRuntimeProofFiles).toContain("packages/auth/package.json");
    expect(dashboardAuthGuardRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(dashboardAuthGuardRuntimeProofFiles).toContain("apps/dashboard/tests/dashboard-auth-guard-runtime-static.test.ts");
    for (const file of dashboardAuthGuardRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps shared auth helper, layout guard, middleware guard, and API helper guard wired", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    expect(authSource).toContain("buildDashboardAuthGuardEvidencePlan");
    expect(authSource).toContain("evaluateDashboardRouteGuard");
    expect(authTests).toContain("buildDashboardAuthGuardEvidencePlan");
    expect(dashboardLayout).toContain("noStore()");
    expect(dashboardLayout).toContain("evaluateDashboardRouteGuard");
    expect(dashboardMiddleware).toContain("evaluateDashboardRouteGuard");
    expect(dashboardMiddleware).toContain("Cache-Control");
    expect(dashboardMiddleware).toContain("x-inkroute-dashboard-auth-guard");
    expect(dashboardAuthApi).toContain("evaluateDashboardApiGuard");
    expect(dashboardAuthApi).toContain("dashboardApiGuardFailureResponse");
    expect(dashboardAuthApi).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(dashboardAuthApi).toContain("headers: noStoreHeaders");
    expect(dashboardAuthApi).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(dashboardAuthApi).toContain("function normalizeHeaderValue(value: string | null): string | null");
    expect(dashboardAuthApi).toContain("const fallbackRole = \"assistant\";");
    expect(dashboardAuthApi).toContain("role: fallbackRole");
    expect(dashboardAuthApi).toContain("actorUserId,");
    expect(dashboardAuthApi).toContain('const normalizedRole = normalizeHeaderValue(value)?.toLowerCase()');
  });

  it("keeps evidence blockers explicit until provider sessions, DB roles, browser denial, CI, and safe artifacts exist", () => {
    expect(dashboardAuthGuardRuntimeReadiness.status).toBe("blocked");
    expect(dashboardAuthGuardRuntimeReadiness.missingScripts).toEqual([]);
    expect(dashboardAuthGuardRuntimeReadiness.requiredCommands).toEqual(dashboardAuthGuardRuntimeCommands);
    expect(dashboardAuthGuardRuntimeReadiness.requiredControls).toEqual(dashboardAuthGuardRuntimeRequiredControls);
    expect(dashboardAuthGuardRuntimeReadiness.requiredEvidence).toContain(
      "provider-backed session plus TenantMember/CustomRole database lookup evidence",
    );
    expect(dashboardAuthGuardRuntimeReadiness.requiredEvidence).toContain(
      "unauthorized state, redacted AuditLog, and no-store cache evidence",
    );
    expect(dashboardAuthGuardRuntimeReadiness.requiredEvidence).toContain(
      "browser login/logout, tenant-switch, and cross-tenant denial evidence",
    );
    expect(dashboardAuthGuardRuntimeReadiness.requiredEvidence).toContain(
      "dashboard typecheck/build, CI, and secret-safe artifact evidence",
    );
    expect(dashboardAuthGuardRuntimeReadiness.blockers).toContain(
      "Real auth provider sessions must be configured for dashboard guard tests.",
    );
    expect(dashboardAuthGuardRuntimeReadiness.blockers).toContain(
      "Browser cross-tenant denial evidence must prove private tenant data is not exposed.",
    );
  });

  it("blocks dashboard auth guard completion when provider, DB role, browser, audit, CI, or safe evidence is missing", () => {
    const decision = buildDashboardAuthGuardEvidenceDecision({
      commands: ["pnpm --filter @inkroute/auth typecheck"],
      artifacts: ["coverage/dashboard-auth-auth-typecheck.txt"],
      readinessAreas: ["dashboard-middleware-guard"],
      evidence: {
        authTypecheckPassed: true,
        dashboardMiddlewareEnforcesGuard: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("browser dashboard cross-tenant denial smoke");
    expect(decision.missingArtifacts).toContain("coverage/dashboard-auth-secret-safe-artifacts.json");
    expect(decision.missingReadinessAreas).toContain("provider-backed-dashboard-session");
    expect(decision.missingEvidence).toContain("authProviderSessionsConfigured");
    expect(decision.missingEvidence).toContain("browserCrossTenantDenialPassed");
    expect(decision.blockers).toContain("Real auth provider sessions must be configured for dashboard guard tests.");
    expect(decision.blockers).toContain(
      "Browser cross-tenant denial evidence must prove private tenant data is not exposed.",
    );
  });

  it("completes dashboard auth guard readiness only when every command, artifact, readiness area, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(dashboardAuthGuardEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDashboardAuthGuardEvidenceDecision({
      commands: dashboardAuthGuardRuntimeCommands,
      artifacts: dashboardAuthGuardArtifactPaths,
      readinessAreas: dashboardAuthGuardReadinessAreas,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(dashboardAuthGuardEvidenceFlags);
  });

  it("separates static dashboard auth review from provider execution and redacts private artifacts", () => {
    const executionPlan = buildDashboardAuthGuardExecutionPlan();
    const artifactReview = buildDashboardAuthGuardArtifactReview({
      tenantDomain: "tenant.example.com",
      providerSessionToken: "session_private",
      clientEmail: "client@example.com",
      authorizationHeader: "authorization: bearer provider-token",
      nested: {
        crossTenantDenialPayload: "private-tenant payload",
        publicSummary: "dashboard auth guard evidence captured",
      },
    });
    const directRedaction = buildRedactedDashboardAuthGuardArtifact({
      publicSummary: "safe dashboard auth evidence",
      tenantMemberRole: "owner",
    });

    expect(executionPlan.localCommands).toBe(dashboardAuthGuardLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "static dashboard middleware guard review",
      "static protected layout guard review",
      "static dashboard API helper no-store review",
    ]);
    expect(executionPlan.externalCommands).toBe(dashboardAuthGuardExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/dashboard build",
      "dashboard middleware auth guard tests",
      "dashboard protected layout auth guard tests",
      "dashboard API auth guard tests",
      "browser dashboard login/logout smoke",
      "browser dashboard tenant-switch smoke",
      "browser dashboard cross-tenant denial smoke",
      "auth AuditLog persistence tests",
      "GitHub Actions dashboard auth guard evidence job",
    ]);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.authProviderExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.auditPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(dashboardAuthGuardExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticAuthGuardReadiness: true,
      providerSessionRequiredForClosure: true,
      persistedTenantMemberAndCustomRoleRequiredForClosure: true,
      browserLoginTenantSwitchAndDenialRequiredForClosure: true,
      authAuditLogPersistenceRequiredForClosure: true,
      noStorePolicyRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(dashboardAuthGuardRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("provider-backed dashboard session evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("browser dashboard cross-tenant denial smoke");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe dashboard auth artifact review");
    expect(
      buildDashboardAuthGuardEvidenceDecision({
        commands: dashboardAuthGuardRuntimeCommands,
        artifacts: dashboardAuthGuardArtifactPaths,
        readinessAreas: dashboardAuthGuardReadinessAreas,
        evidence: {
          authTestsPassed: true,
          authTypecheckPassed: true,
          dashboardTypecheckPassed: true,
          dashboardBuildPassed: true,
          authProviderSessionsConfigured: true,
          dashboardMiddlewareEnforcesGuard: true,
          protectedLayoutEnforcesGuard: true,
          dashboardApiHelpersEnforceGuard: true,
          tenantMembershipDbLookupConfigured: true,
          customRoleDbLookupConfigured: true,
          authAuditLogsPersisted: true,
          browserLoginLogoutPassed: true,
          browserTenantSwitchPassed: true,
          browserCrossTenantDenialPassed: true,
          noStoreCacheVerified: true,
          ciEvidenceCaptured: true,
          secretSafeArtifactsCaptured: true,
        },
      }).blockers,
    ).toContain("Unauthorized, login, tenant-switch, and forbidden denial state evidence must be captured before auth guard readiness.");
    expect(artifactReview.requiredExternalEvidence).toBe(dashboardAuthGuardRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "providerSessionToken",
      "clientEmail",
      "authorizationHeader",
      "nested.crossTenantDenialPayload",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("session_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).toContain("dashboard auth guard evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["tenantMemberRole"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe dashboard auth evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider-backed auth readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 5 dashboard auth guard runtime contracts");
    expect(ciWorkflow).toContain("dashboard-auth-guard-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dashboard-auth-guard-runtime-artifacts");
    expect(unitManifest).toContain("unit-dashboard-auth-guard-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/dashboardAuthGuardRuntime.ts");
    expect(gapTracker).toContain("buildDashboardAuthGuardExecutionPlan");
    expect(gapTracker).toContain("dashboardAuthGuardLocalCommands/dashboardAuthGuardExternalCommands");
    expect(gapTracker).toContain("buildRedactedDashboardAuthGuardArtifact");
    expect(gapTracker).toContain("buildDashboardAuthGuardArtifactReview");
    expect(gapTracker).toContain("dashboardAuthGuardExecutionPolicy");
    expect(gapTracker).toContain("dashboardAuthGuardRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-036 is dashboard-auth-guard-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-036 is dashboard-auth-guard-runtime-matrix");
    expect(dashboardAuthGuardArtifactPaths).toContain("coverage/dashboard-auth-secret-safe-artifacts.json");
  });
});


