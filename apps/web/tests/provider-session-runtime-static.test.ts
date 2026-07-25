import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProviderSessionDecisionRequiredEvidence,
  buildProviderSessionExecutionPlan,
  buildProviderSessionRedactedEvidenceBundle,
  buildProviderSessionRunData,
  providerSessionExecutionPolicy,
  providerSessionRequiredEvidence,
  providerSessionRequiredExternalEvidence,
  providerSessionRuntimeArtifactPaths,
  providerSessionRuntimeCommands,
  providerSessionRuntimeControls,
  providerSessionRuntimeMatrix,
  providerSessionRuntimeProofFiles,
  providerSessionRuntimeReadiness,
  providerSessionSurfaceContract,
  providerSessionRunPersistenceContract,
  buildProviderSessionEvidenceDecision,
  persistProviderSessionRun,
} from "../lib/providerSessionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider session runtime contract", () => {
  const authPackageJson = readRepoFile("packages/auth/package.json");
  const authSource = readRepoFile("packages/auth/src/index.ts");
  const authTests = readRepoFile("packages/auth/tests/authorization.test.ts");
  const dashboardMiddleware = readRepoFile("apps/dashboard/middleware.ts");
  const dashboardMiddlewareTest = readRepoFile("apps/dashboard/tests/dashboard-auth-middleware-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const providerSessionMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609032700_add_provider_session_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins provider session commands, controls, matrix rows, and artifacts", () => {
    expect(providerSessionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "configure selected provider env and callbacks with redacted evidence",
      "provider-backed login callback test",
      "provider-backed logout callback test",
      "provider-backed session callback and TenantMember lookup test",
      "persist User, TenantMember, CustomRole, session, and revocation lookups",
      "verify secure dashboard cookies and mobile token storage/revocation",
      "write redacted AuditLog rows for auth lifecycle and denials with hashed provider/user/session/tenant selectors",
      "dashboard/API tenant isolation smoke tests",
      "mobile session storage/revocation smoke tests",
    ]);
    expect(providerSessionRuntimeControls).toContain("provider-callback-contract-map");
    expect(providerSessionRuntimeControls).toContain("server-side-tenant-member-lookup");
    expect(providerSessionRuntimeControls).toContain("cross-tenant-session-denial");
    expect(providerSessionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-package-typecheck",
      "auth-package-tests",
      "provider-selection-env",
      "login-callback",
      "logout-callback",
      "session-callback-tenant-lookup",
      "session-role-persistence",
      "cookie-mobile-security",
      "auth-audit-log",
      "tenant-isolation-smoke",
      "mobile-revocation-smoke",
      "redacted-evidence-bundle",
    ]);
    expect(providerSessionSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "provider-selection-env",
      "login-callback",
      "logout-callback",
      "session-callback-tenant-lookup",
      "session-role-persistence",
      "cookie-mobile-security",
      "auth-audit-log",
      "tenant-isolation-smoke",
      "mobile-revocation-smoke",
    ]);
    expect(providerSessionRuntimeArtifactPaths).toContain("coverage/provider-session-runtime.json");
    expect(providerSessionRuntimeArtifactPaths).toContain("coverage/provider-session-callback-contract.json");
    expect(providerSessionRuntimeArtifactPaths).toContain("test-results/provider-session-runtime");
    expect(providerSessionRuntimeArtifactPaths).toContain("coverage/provider-session-redacted-evidence-bundle.json");
  });

  it("pins the ProviderSessionRun persistence model and migration", () => {
    const runData = buildProviderSessionRunData({
      tenantId: "tenant_static",
      runId: "provider_session_static",
      commitSha: "ABC1234",
      status: "blocked",
      authPackageTypecheckPassed: true,
      authPackageTestsPassed: true,
      providerSelected: false,
      providerEnvConfigured: false,
      loginCallbackWired: false,
      logoutCallbackWired: false,
      sessionCallbackWired: false,
      userProvisioningConfigured: false,
      tenantMembershipLookupPersisted: false,
      customRoleLookupPersisted: false,
      databaseSessionStoreConfigured: false,
      sessionRevocationPersisted: false,
      secureDashboardCookiesConfigured: false,
      mobileTokenStorageConfigured: false,
      auditLogWritesConfigured: false,
      providerBackedTestsPassed: false,
      crossTenantSmokeTestsPassed: false,
      commandEvidenceCaptured: false,
      providerSessionRunPersisted: false,
      coveredControls: ["provider-identity-to-user-mapping", "cross-tenant-session-denial"],
      capturedArtifacts: [
        "coverage/provider-session-runtime.json",
        "coverage/provider-session-auth-typecheck.txt",
        "coverage/provider-session-auth-test.txt",
      ],
      completedCommands: ["pnpm --filter @inkroute/auth typecheck", "pnpm --filter @inkroute/auth test"],
      authTypecheckArtifactPath: "coverage/provider-session-auth-typecheck.txt",
      authTestArtifactPath: "coverage/provider-session-auth-test.txt",
      providerEnvArtifactPath: "C:\\Users\\domin\\secrets\\provider-env.json",
      loginCallbackArtifactPath: "../private/provider-session-login-callback.json",
      logoutCallbackArtifactPath: "https://example.invalid/provider-session-logout-callback.json",
      sessionCallbackArtifactPath: "coverage/provider-session-callback-tenant-lookup.json",
      tenantIsolationSmokeArtifactPath: "test-results/provider-session-runtime/tenant-isolation-smoke.json",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456?token=secret#logs",
      providerConfigurationManifest: [
        "provider subject oidc-sub-01HZYXZYXZYXZYXZYXZYXZYXZ loaded from https://example.invalid/callback",
      ],
      tenantIsolationManifest: [
        "denied tenant_01HZYXZYXZYXZYXZYXZYXZYXZ session_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ],
    });

    expect(providerSessionRunPersistenceContract.model).toBe("ProviderSessionRun");
    expect(providerSessionRunPersistenceContract.tenantRelation).toBe("providerSessionRuns");
    expect(providerSessionRunPersistenceContract.migration).toBe("20260609032700_add_provider_session_runs");
    expect(providerSessionRunPersistenceContract.intentionalRawPersistenceKeys).toEqual(["tenantId", "runId", "commitSha"]);
    expect(providerSessionRunPersistenceContract.sanitizedPersistenceFields).toContain("providerConfigurationManifest");
    expect(providerSessionRunPersistenceContract.sanitizedPersistenceFields).toContain("tenantIsolationManifest");
    expect(providerSessionRunPersistenceContract.sanitizedPersistenceFields).toContain("ciRunUrl");
    expect(providerSessionRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "controlManifest",
      "artifactManifest",
      "providerConfigurationManifest",
      "tenantIsolationManifest",
    ]);
    expect(providerSessionRunPersistenceContract.evidenceBooleans).toContain("providerSelected");
    expect(providerSessionRunPersistenceContract.evidenceBooleans).toContain("sessionRevocationPersisted");
    expect(providerSessionRunPersistenceContract.evidenceBooleans).toContain("crossTenantSmokeTestsPassed");
    expect(providerSessionRunPersistenceContract.artifactFields).toContain("tenantIsolationSmokeArtifactPath");
    expect(providerSessionRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("providerSessionRuns ProviderSessionRun[]");
    expect(prismaSchema).toContain("model ProviderSessionRun");
    expect(prismaSchema).toContain("providerConfigurationManifest");
    expect(prismaSchema).toContain("tenantMembershipLookupPersisted");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(providerSessionMigration).toContain('CREATE TABLE "ProviderSessionRun"');
    expect(providerSessionMigration).toContain('"providerConfigurationManifest" JSONB NOT NULL');
    expect(providerSessionMigration).toContain('"sessionRevocationPersisted" BOOLEAN NOT NULL DEFAULT false');
    expect(providerSessionMigration).toContain('CREATE UNIQUE INDEX "ProviderSessionRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "provider_session_static",
      commitSha: "abc1234",
      status: "blocked",
      authPackageTypecheckPassed: true,
      authPackageTestsPassed: true,
      providerSelected: false,
      providerEnvConfigured: false,
      authTypecheckArtifactPath: "coverage/provider-session-auth-typecheck.txt",
      authTestArtifactPath: "coverage/provider-session-auth-test.txt",
      providerEnvArtifactPath: null,
      loginCallbackArtifactPath: null,
      logoutCallbackArtifactPath: null,
      sessionCallbackArtifactPath: "coverage/provider-session-callback-tenant-lookup.json",
      tenantIsolationSmokeArtifactPath: "test-results/provider-session-runtime/tenant-isolation-smoke.json",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
    });
    expect(runData.providerConfigurationManifest).toEqual(["provider subject [REDACTED] loaded from [REDACTED]"]);
    expect(runData.tenantIsolationManifest).toEqual(["denied [REDACTED] [REDACTED]"]);
    expect(runData.commandMatrix).toEqual(providerSessionRuntimeMatrix);
    expect(runData.controlManifest).toEqual(["provider-identity-to-user-mapping", "cross-tenant-session-denial"]);
    expect(String(persistProviderSessionRun)).toContain("repository.providerSessionRun.upsert");
    expect(String(persistProviderSessionRun)).toContain("runId: data.runId");
    expect(() =>
      buildProviderSessionRunData({
        tenantId: "tenant_static",
        runId: "../private/provider-session-run",
        status: "blocked",
        authPackageTypecheckPassed: false,
        authPackageTestsPassed: false,
        providerSelected: false,
        providerEnvConfigured: false,
        loginCallbackWired: false,
        logoutCallbackWired: false,
        sessionCallbackWired: false,
        userProvisioningConfigured: false,
        tenantMembershipLookupPersisted: false,
        customRoleLookupPersisted: false,
        databaseSessionStoreConfigured: false,
        sessionRevocationPersisted: false,
        secureDashboardCookiesConfigured: false,
        mobileTokenStorageConfigured: false,
        auditLogWritesConfigured: false,
        providerBackedTestsPassed: false,
        crossTenantSmokeTestsPassed: false,
        commandEvidenceCaptured: false,
        providerSessionRunPersisted: false,
        coveredControls: [],
        capturedArtifacts: [],
        completedCommands: [],
      }),
    ).toThrow("ProviderSessionRun runId must be a short slug-like identifier before persistence.");
  });

  it("keeps auth helper, package tests, and dashboard middleware guardrails wired", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    expect(authSource).toContain("buildProviderSessionStoreReadinessPlan");
    expect(authSource).toContain("providerSessionCallbackContract");
    expect(authSource).toContain("auth.provider.session");
    expect(authSource).toContain("rawProviderTokenLoggingAllowed: false");
    expect(authTests).toContain("buildProviderSessionStoreReadinessPlan");
    expect(dashboardMiddleware).toContain("/login?next=");
    expect(dashboardMiddlewareTest).toContain('code: "CSRF_TOKEN_REQUIRED"');
  });

  it("keeps provider-backed auth blockers explicit until real provider evidence exists", () => {
    expect(providerSessionRuntimeReadiness.status).toBe("blocked");
    expect(providerSessionRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerSessionRuntimeReadiness.requiredCommands).toBe(providerSessionRuntimeCommands);
    expect(providerSessionRuntimeReadiness.requiredControls).toEqual([
      "Map provider login, logout, and session callbacks through the providerSessionCallbackContract before route authorization.",
      "Map provider identity to application User records without trusting client headers.",
      "Resolve TenantMember and CustomRole rows server-side for every guarded request.",
      "Persist active sessions and revocations before route authorization.",
      "Use secure dashboard cookies and secure mobile token storage with logout/revocation clearing.",
      "Write redacted AuditLog rows for auth lifecycle and authorization decisions using hashed provider/user/session/tenant selectors only.",
      "Deny cross-tenant provider sessions in dashboard, API, and mobile surfaces.",
    ]);
    expect(providerSessionRuntimeReadiness.requiredEvidence).toEqual([
      "provider selection, redacted environment/callback configuration, and login/logout/session callback evidence with raw provider subject/session selectors suppressed",
      "provider identity mapping plus persisted user, TenantMember, CustomRole, and session lookup evidence with hashed user/tenant/session selectors",
      "revocation, secure dashboard cookie, and mobile secure-token storage evidence",
      "audit-log, provider-backed auth test, cross-tenant smoke, and command-output evidence",
    ]);
    expect(providerSessionRuntimeReadiness.blockers).toContain(
      "Auth provider must be selected before provider-backed sessions can be claimed.",
    );
  });

  it("blocks provider session closure until provider, persistence, security, smoke, artifacts, controls, and commands are proven", () => {
    const executionPlan = buildProviderSessionExecutionPlan();

    expect(executionPlan.localCommands).toBe(providerSessionRuntimeCommands);
    expect(executionPlan.controls).toBe(providerSessionRuntimeControls);
    expect(executionPlan.callbackContract.map((entry) => entry.kind)).toEqual(["login", "logout", "session"]);
    expect(executionPlan.callbackContract.every((entry) => entry.rawProviderTokenLoggingAllowed === false)).toBe(true);
    expect(executionPlan.callbackContract.every((entry) => entry.rawProviderSubjectLoggingAllowed === false)).toBe(true);
    expect(executionPlan.callbackContract.every((entry) => entry.rawProviderSessionLoggingAllowed === false)).toBe(true);
    expect(executionPlan.callbackContract.every((entry) => entry.rawUserSelectorLoggingAllowed === false)).toBe(true);
    expect(executionPlan.callbackContract.every((entry) => entry.rawTenantSelectorLoggingAllowed === false)).toBe(true);
    expect(executionPlan.surfaceContract).toBe(providerSessionSurfaceContract);
    expect(executionPlan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "provider-selection-env",
          requiredControl: "provider-callback-contract-map",
          requiredCommand: "configure selected provider env and callbacks with redacted evidence",
          requiredArtifact: "coverage/provider-session-provider-env-redacted.json",
          sessionBoundary: "provider-config",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "session-role-persistence",
          requiredControl: "database-session-store",
          requiredCommand: "persist User, TenantMember, CustomRole, session, and revocation lookups",
          requiredArtifact: "coverage/provider-session-persistence.json",
          sessionBoundary: "session-store",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "tenant-isolation-smoke",
          requiredControl: "cross-tenant-session-denial",
          requiredCommand: "dashboard/API tenant isolation smoke tests",
          requiredArtifact: "coverage/provider-session-tenant-isolation-smoke.json",
          sessionBoundary: "tenant-isolation",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(executionPlan.artifactPaths).toBe(providerSessionRuntimeArtifactPaths);
    expect(executionPlan.proofFiles).toBe(providerSessionRuntimeProofFiles);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(providerSessionExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticProviderSessionReadiness: true,
      providerSelectionRequiredForClosure: true,
      providerCallbacksRequiredForClosure: true,
      persistedSessionStoreRequiredForClosure: true,
      auditLogEvidenceRequiredForClosure: true,
      tenantIsolationSmokeRequiredForClosure: true,
      mobileRevocationSmokeRequiredForClosure: true,
      providerPersistenceRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(providerSessionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Redacted provider auth/session evidence bundle captured without raw provider IDs, subjects, principals, access/refresh tokens, cookies, emails, URLs, tenant IDs, session IDs, user IDs, or actor identifiers.",
    );
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Redacted auth AuditLog rows with hashed provider/user/session/tenant selectors and tenant-isolation smoke evidence.",
    );
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed persistProviderSessionRun execution evidence.",
    );

    const decision = buildProviderSessionEvidenceDecision({
      authPackageTypecheckPassed: true,
      authPackageTestsPassed: true,
      providerSelected: false,
      providerEnvConfigured: false,
      loginCallbackWired: false,
      logoutCallbackWired: false,
      sessionCallbackWired: false,
      userProvisioningConfigured: false,
      tenantMembershipLookupPersisted: false,
      customRoleLookupPersisted: false,
      databaseSessionStoreConfigured: false,
      sessionRevocationPersisted: false,
      secureDashboardCookiesConfigured: false,
      mobileTokenStorageConfigured: false,
      auditLogWritesConfigured: false,
      providerBackedTestsPassed: false,
      crossTenantSmokeTestsPassed: false,
      commandEvidenceCaptured: false,
      providerSessionRunPersisted: false,
      coveredControls: [
        "provider-identity-to-user-mapping",
        "cross-tenant-session-denial",
      ],
      capturedArtifacts: [
        "coverage/provider-session-runtime.json",
        "coverage/provider-session-auth-typecheck.txt",
        "coverage/provider-session-auth-test.txt",
      ],
      completedCommands: [
        "pnpm --filter @inkroute/auth typecheck",
        "pnpm --filter @inkroute/auth test",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingControls).toEqual([
      "provider-callback-contract-map",
      "server-side-tenant-member-lookup",
      "server-side-custom-role-lookup",
      "database-session-store",
      "persisted-session-revocation",
      "secure-dashboard-cookies",
      "secure-mobile-token-storage",
      "auth-audit-log-writes",
    ]);
    expect(decision.missingArtifacts).toEqual([
      "coverage/provider-session-provider-env-redacted.json",
      "coverage/provider-session-callback-contract.json",
      "coverage/provider-session-login-callback.json",
      "coverage/provider-session-logout-callback.json",
      "coverage/provider-session-callback-tenant-lookup.json",
      "coverage/provider-session-persistence.json",
      "coverage/provider-session-security-controls.json",
      "coverage/provider-session-audit-log.json",
      "coverage/provider-session-tenant-isolation-smoke.json",
      "coverage/provider-session-mobile-revocation-smoke.json",
      "coverage/provider-session-redacted-evidence-bundle.json",
      "test-results/provider-session-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "configure selected provider env and callbacks with redacted evidence",
      "provider-backed login callback test",
      "provider-backed logout callback test",
      "provider-backed session callback and TenantMember lookup test",
      "persist User, TenantMember, CustomRole, session, and revocation lookups",
      "verify secure dashboard cookies and mobile token storage/revocation",
      "write redacted AuditLog rows for auth lifecycle and denials with hashed provider/user/session/tenant selectors",
      "dashboard/API tenant isolation smoke tests",
      "mobile session storage/revocation smoke tests",
    ]);
    expect(decision.requiredControls).toBe(providerSessionRuntimeControls);
    expect(decision.requiredArtifacts).toBe(providerSessionRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(providerSessionRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildProviderSessionDecisionRequiredEvidence(providerSessionRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(providerSessionRequiredEvidence);
    expect(decision.blockers).toContain("Auth provider must be selected before provider-backed sessions can be claimed.");
    expect(decision.blockers).toContain("ProviderSessionRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required provider session control must be covered.");
  });

  it("completes provider session closure when provider, persistence, security, smoke, artifacts, controls, and commands are proven", () => {
    const decision = buildProviderSessionEvidenceDecision({
      authPackageTypecheckPassed: true,
      authPackageTestsPassed: true,
      providerSelected: true,
      providerEnvConfigured: true,
      loginCallbackWired: true,
      logoutCallbackWired: true,
      sessionCallbackWired: true,
      userProvisioningConfigured: true,
      tenantMembershipLookupPersisted: true,
      customRoleLookupPersisted: true,
      databaseSessionStoreConfigured: true,
      sessionRevocationPersisted: true,
      secureDashboardCookiesConfigured: true,
      mobileTokenStorageConfigured: true,
      auditLogWritesConfigured: true,
      providerBackedTestsPassed: true,
      crossTenantSmokeTestsPassed: true,
      commandEvidenceCaptured: true,
      providerSessionRunPersisted: true,
      coveredControls: providerSessionRuntimeControls,
      capturedArtifacts: providerSessionRuntimeArtifactPaths,
      completedCommands: providerSessionRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider sessions are configured", () => {
    expect(ciWorkflow).toContain("Run Phase 1 provider session runtime contracts");
    expect(ciWorkflow).toContain("provider-session-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-session-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-provider-session-runtime-static");
    expect(unitManifest).toContain("ProviderSessionRun Prisma model and app row contract");
    expect(gapTracker).toContain("ProviderSessionRun");
    expect(gapTracker).toContain("apps/web/lib/providerSessionRuntime.ts");
    expect(gapTracker).toContain("persistProviderSessionRun upsert seam");
    expect(gapTracker).toContain("buildProviderSessionExecutionPlan");
    expect(gapTracker).toContain("buildProviderSessionDecisionRequiredEvidence");
    expect(gapTracker).toContain("providerSessionRequiredEvidence");
    expect(gapTracker).toContain("providerSessionExecutionPolicy");
    expect(gapTracker).toContain("Provider session runtime identity assertions pin exported commands, controls, artifacts, proof files, required external evidence, redacted bundle helper, and decision evidence helpers");
    expect(gapTracker).toContain("providerSessionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildProviderSessionRedactedEvidenceBundle");
    expect(gapTracker).toContain("providerSessionSurfaceContract");
    expect(gapTracker).toContain(
      "live provider selection/env/callbacks, persisted session store, revocation, audit logs, provider-backed tests, tenant-isolation smoke tests, provider-backed persistProviderSessionRun execution, command evidence, and redacted provider/session artifact evidence remain gated",
    );
    expect(gapTracker).toContain("GAP-003 is provider-session-runtime-matrix wired with evidence classifier");
  });

  it("pins current provider session runtime proof files for GAP-003", () => {
    expect(providerSessionRuntimeProofFiles).toEqual(
      expect.arrayContaining([
        "apps/web/lib/providerSessionRuntime.ts",
        "apps/web/tests/provider-session-runtime-static.test.ts",
        "packages/auth/package.json",
        "packages/auth/src/index.ts",
        "packages/auth/tests/authorization.test.ts",
        "packages/db/prisma/migrations/20260609032700_add_provider_session_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of providerSessionRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("builds a redacted provider session evidence bundle for handoff use", () => {
    const artifact = {
      providerUserId: "auth0|user_123",
      providerSubject: "oidc-sub-01HZYXZYXZYXZYXZYXZYXZYXZ",
      principalRef: "principal_01HZYXZYXZYXZYXZYXZYXZYXZ",
      oauthAccessToken: "access_01HZYXZYXZYXZYXZYXZYXZYXZ",
      refreshToken: "refresh_01HZYXZYXZYXZYXZYXZYXZYXZ",
      bearerProof: "Bearer bearer_01HZYXZYXZYXZYXZYXZYXZYXZ",
      sessionToken: "github_pat_1234567890ABCDEFGHIJKLMNOP",
      cookieHeader: "session=secret",
      tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      actorEmail: "owner@example.com",
      auditLog: "login by owner@example.com",
      callbackUrl: "https://example.invalid/callback",
      loginCallbackPayload: {
        rawBody: "provider callback for provider-user-01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      persistedSessionStoreRow: {
        TenantMemberId: "member_01HZYXZYXZYXZYXZYXZYXZYXZ",
        CustomRoleId: "role_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      revocationLookup: {
        sessionId: "session_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      mobileTokenEvidence: {
        deviceId: "device_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      tenantIsolationSmokeOutput: "denied cross-tenant access for tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciArtifactPath: "test-results/provider-session-runtime/provider-session.log",
      safeSummary: "provider session proof captured",
      neutralProviderTrace: "provider_session_01HZYXZYXZYXZYXZYXZYXZYXZ mapped auth_lookup_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralSubjectTrace: "sub_01HZYXZYXZYXZYXZYXZYXZYXZ mapped principal_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactLocation: "coverage/provider-session/private-callback.json",
      neutralDatabaseLocation: "postgresql://tenant_demo:secret@db.example.com/inkroute",
    };

    const bundle = buildProviderSessionRedactedEvidenceBundle(artifact);

    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/provider-session-redacted-evidence-bundle.json");
    expect(bundle.requiredArtifacts).toBe(providerSessionRuntimeArtifactPaths);
    expect(bundle.requiredExternalEvidence).toBe(providerSessionRequiredExternalEvidence);
    expect(bundle.providerExecutionAllowed).toBe(false);
    expect(bundle.databaseExecutionAllowed).toBe(false);
    expect(bundle.redactions).toEqual(
      expect.arrayContaining([
        "provider",
        "token",
        "cookie",
        "session",
        "tenant",
        "email",
        "audit",
        "url",
        "subject",
        "principal",
        "oauth",
        "refresh",
        "bearer",
        "callback",
        "sessionStore",
        "revocation",
        "mobile",
        "isolation",
        "artifact",
      ]),
    );
    expect(bundle.redactedArtifact).toMatchObject({
      providerUserId: "[REDACTED]",
      providerSubject: "[REDACTED]",
      principalRef: "[REDACTED]",
      oauthAccessToken: "[REDACTED]",
      refreshToken: "[REDACTED]",
      bearerProof: "[REDACTED]",
      sessionToken: "[REDACTED]",
      cookieHeader: "[REDACTED]",
      tenantId: "[REDACTED]",
      actorEmail: "[REDACTED]",
      auditLog: "[REDACTED]",
      callbackUrl: "[REDACTED]",
      loginCallbackPayload: "[REDACTED]",
      persistedSessionStoreRow: "[REDACTED]",
      revocationLookup: "[REDACTED]",
      mobileTokenEvidence: "[REDACTED]",
      tenantIsolationSmokeOutput: "[REDACTED]",
      ciArtifactPath: "[REDACTED]",
      safeSummary: "provider session proof captured",
      neutralProviderTrace: "[REDACTED]",
      neutralSubjectTrace: "[REDACTED]",
      neutralArtifactLocation: "[REDACTED]",
      neutralDatabaseLocation: "[REDACTED]",
    });
  });
});



