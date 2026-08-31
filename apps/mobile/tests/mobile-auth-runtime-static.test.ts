import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileAuthArtifactReview,
  buildMobileAuthEvidenceDecision,
  buildMobileAuthExecutionPlan,
  buildMobileAuthPersistedRunPayload,
  buildRedactedMobileAuthArtifact,
  mobileAuthArtifactPaths,
  mobileAuthEvidenceFlags,
  mobileAuthExternalCommands,
  mobileAuthExecutionPolicy,
  mobileAuthLocalCommands,
  mobileAuthRequiredExternalEvidence,
  mobileAuthRuntimeProofFiles,
  mobileAuthRuntimeCommands,
  mobileAuthRuntimeMatrix,
  mobileAuthRuntimeReadiness,
  mobileAuthSecureSessionLifecycleContract,
  mobileAuthSurfaceContract,
} from "../src/lib/mobileAuthRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile auth runtime contract", () => {
  const authPackageJson = readWorkspaceFile("packages/auth/package.json");
  const authSource = readWorkspaceFile("packages/auth/src/index.ts");
  const authTests = readWorkspaceFile("packages/auth/tests/authorization.test.ts");
  const mobileAuthSource = readWorkspaceFile("apps/mobile/src/lib/mobileAuth.ts");
  const authScreenSource = readWorkspaceFile("apps/mobile/src/screens/AuthScreen.tsx");
  const mobileAuthStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-auth-static.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-042 commands, matrix rows, and artifacts", () => {
    expect(mobileAuthRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/auth typecheck",
      "pnpm --filter @inkroute/auth test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "Expo iOS/Android auth smoke tests",
      "Expo device biometric unlock test",
    ]);
    expect(mobileAuthRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "auth-typecheck",
      "auth-tests",
      "mobile-typecheck-test",
      "provider-login-logout",
      "securestore-token-storage",
      "secure-session-lifecycle",
      "biometric-unlock",
      "refresh-logout-revocation-clearing",
      "tenant-role-cross-tenant-denial",
      "audit-persistence",
      "ios-android-device-smoke",
      "persisted-run-payload",
    ]);
    expect(mobileAuthSurfaceContract.map((entry) => entry.surfaceId)).toEqual([
      "provider-login-logout",
      "securestore-token-storage",
      "secure-session-lifecycle",
      "biometric-unlock",
      "refresh-logout-revocation-clearing",
      "tenant-role-cross-tenant-denial",
      "audit-persistence",
      "ios-android-device-smoke",
      "ci-secret-safe-artifacts",
    ]);
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-runtime.json");
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-secure-session-lifecycle.json");
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-persisted-run-payload.json");
    expect(mobileAuthArtifactPaths).toContain("test-results/mobile-auth-runtime");
  });

  it("keeps package helper, app secure-session adapter, biometric boundary, and Auth screen surfaced", () => {
    expect(authPackageJson).toContain('"typecheck"');
    expect(authPackageJson).toContain('"test"');
    expect(authSource).toContain("evaluateMobileSessionGate");
    expect(authSource).toContain("buildMobileAuthRuntimeReadinessPlan");
    expect(authTests).toContain("buildMobileAuthRuntimeReadinessPlan");
    expect(mobileAuthSource).toContain("MobileSecureSessionStore");
    expect(mobileAuthSource).toContain("MobileBiometricAdapter");
    expect(mobileAuthSource).toContain("buildMobileAuthReadinessPreview");
    expect(mobileAuthSource).toContain('decision.status === "tenant_mismatch"');
    expect(mobileAuthStaticTest).toContain("records redacted audit decisions");
    expect(authScreenSource).toContain("Session gate contract");
    expect(authScreenSource).toContain("provider login gated");
  });

  it("pins current mobile auth proof files for GAP-042", () => {
    expect(mobileAuthRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/mobile/package.json",
      "apps/mobile/src/lib/mobileAuth.ts",
      "apps/mobile/src/lib/mobileAuthRuntime.ts",
      "apps/mobile/src/screens/AuthScreen.tsx",
      "apps/mobile/tests/mobile-auth-static.test.ts",
      "apps/mobile/tests/mobile-auth-runtime-static.test.ts",
      "packages/auth/package.json",
      "packages/auth/tests/authorization.test.ts",
    ]));
    for (const file of mobileAuthRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps provider, SecureStore, biometric, tenant, audit, and device blockers explicit", () => {
    expect(mobileAuthRuntimeReadiness.status).toBe("blocked");
    expect(mobileAuthRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileAuthRuntimeReadiness.requiredCommands).toBe(mobileAuthRuntimeCommands);
    expect(mobileAuthRuntimeReadiness.requiredEvidence).toBe(mobileAuthEvidenceFlags);
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Mobile auth provider must be selected and configured before login/logout is production-ready.");
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Secure token storage must be verified to avoid plaintext token persistence.");
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Mobile login, refresh, logout, denial, revocation, and tenant-switch decisions must persist audit logs.");
  });

  it("classifies GAP-042 as blocked until mobile auth provider and device evidence is complete", () => {
    const decision = buildMobileAuthEvidenceDecision({
      commands: ["pnpm --filter @inkroute/auth typecheck"],
      artifacts: ["coverage/mobile-auth-runtime.json"],
      evidence: { authTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Expo device biometric unlock test");
    expect(decision.missingArtifacts).toContain("coverage/mobile-auth-secure-session-lifecycle.json");
    expect(decision.missingArtifacts).toContain("coverage/mobile-auth-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secureSessionLifecycleCaptured");
    expect(decision.missingEvidence).toContain("persistedRunPayloadCaptured");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned mobile auth commands must be run and captured.");
  });

  it("classifies GAP-042 as complete when all mobile auth commands, artifacts, and evidence are present", () => {
    const decision = buildMobileAuthEvidenceDecision({
      commands: mobileAuthRuntimeCommands,
      artifacts: mobileAuthArtifactPaths,
      evidence: Object.fromEntries(mobileAuthEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-042 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobileAuthExecutionPlan();

    expect(plan.policy).toBe(mobileAuthExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(mobileAuthRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobileAuthReadiness).toBe(true);
    expect(plan.policy.providerLoginLogoutRequiredForClosure).toBe(true);
    expect(plan.policy.secureStorePersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.biometricDeviceSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.serverTenantMembershipRequiredForClosure).toBe(true);
    expect(plan.policy.auditPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.authProviderExecutionAllowed).toBe(false);
    expect(plan.secureStoreExecutionAllowed).toBe(false);
    expect(plan.biometricExecutionAllowed).toBe(false);
    expect(plan.deviceExecutionAllowed).toBe(false);
    expect(plan.serverTenantExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(mobileAuthLocalCommands);
    expect(plan.externalCommands).toBe(mobileAuthExternalCommands);
    expect(plan.surfaceContract).toBe(mobileAuthSurfaceContract);
    expect(plan.surfaceContract).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surfaceId: "provider-login-logout",
          proofBoundary: "provider-session",
          providerBackedEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
        expect.objectContaining({
          surfaceId: "secure-session-lifecycle",
          proofBoundary: "secure-session-lifecycle",
          providerBackedEvidenceRequired: false,
          deviceEvidenceRequired: false,
        }),
        expect.objectContaining({
          surfaceId: "ci-secret-safe-artifacts",
          proofBoundary: "ci-secret-safe",
          providerBackedEvidenceRequired: true,
          deviceEvidenceRequired: true,
          redactedArtifactRequired: true,
        }),
      ]),
    );
    expect(plan.secureSessionLifecycleContract).toBe(mobileAuthSecureSessionLifecycleContract);
    expect(mobileAuthSecureSessionLifecycleContract.clearingTransitions).toEqual([
      "logout",
      "revoked_session",
      "tenant_mismatch",
      "secure_store_unavailable",
    ]);
    expect(mobileAuthSecureSessionLifecycleContract.plaintextTokenStorageAllowed).toBe(false);
    expect(mobileAuthSecureSessionLifecycleContract.auditDecisionRequiredForEveryTransition).toBe(true);
    expect(plan.requiredExternalEvidence).toBe(mobileAuthRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("persisted MobileAuthRuntime run payload");
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile auth artifact review");
  });

  it("keeps the GAP-042 persisted run payload provider-backed and non-executing", () => {
    const payload = buildMobileAuthPersistedRunPayload();

    expect(payload.payloadId).toBe("gap-042-mobile-auth-persisted-run");
    expect(payload.requiredArtifact).toBe("coverage/mobile-auth-persisted-run-payload.json");
    expect(payload.providerBackedPersistenceRequired).toBe(true);
    expect(payload.localPersistenceExecutionAllowed).toBe(false);
    expect(payload.secureStoreDeviceEvidenceRequired).toBe(true);
    expect(payload.tenantDenialEvidenceRequired).toBe(true);
    expect(payload.auditPersistenceEvidenceRequired).toBe(true);
    expect(payload.redactionRequired).toBe(true);
    expect(payload.requiredExternalEvidence).toBe(mobileAuthRequiredExternalEvidence);
  });

  it("redacts GAP-042 mobile auth artifacts before secret-safe review", () => {
    const artifact = {
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      refreshToken: "refresh_private",
      secureStoreSnapshot: "session_private_plaintext",
      nested: {
        biometricDeviceId: "device-private-id",
        publicSummary: "mobile auth evidence captured",
      },
      safeNote:
        "evidence_mobile_auth_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/mobile-auth/private-proof.json",
      safeDevicePath: "test-results/mobile-auth-runtime/private-device-session.json",
      safeProviderRun: "provider_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    };

    const redacted = buildRedactedMobileAuthArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantDomain",
      "clientEmail",
      "refreshToken",
      "secureStoreSnapshot",
      "nested.biometricDeviceId",
      "safeNote",
      "safeDevicePath",
      "safeProviderRun",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantDomain: "[REDACTED]",
      clientEmail: "[REDACTED]",
      refreshToken: "[REDACTED]",
      secureStoreSnapshot: "[REDACTED]",
      nested: {
        biometricDeviceId: "[REDACTED]",
        publicSummary: "mobile auth evidence captured",
      },
      safeDevicePath: "[REDACTED]",
      safeProviderRun: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_mobile_auth_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/mobile-auth/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/mobile-auth-runtime/private-device-session.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "provider_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );

    const review = buildMobileAuthArtifactReview({
      publicSummary: "safe mobile auth evidence",
      auditSessionToken: "session_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["auditSessionToken"]);
    expect(review.requiredExternalEvidence).toBe(mobileAuthRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("mobile auth audit persistence evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile auth runtime contracts");
    expect(ciWorkflow).toContain("mobile-auth-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-auth-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-auth-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileAuthRuntime.ts");
    expect(gapTracker).toContain("GAP-042 is mobile-auth-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobileAuthExecutionPlan");
    expect(gapTracker).toContain("mobileAuthSurfaceContract");
    expect(gapTracker).toContain("mobileAuthSecureSessionLifecycleContract");
    expect(gapTracker).toContain("mobileAuthExecutionPolicy");
    expect(gapTracker).toContain("mobileAuthRequiredExternalEvidence");
    expect(gapTracker).toContain("buildMobileAuthPersistedRunPayload");
    expect(gapTracker).toContain("buildRedactedMobileAuthArtifact");
    expect(gapTracker).toContain("buildMobileAuthArtifactReview");
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-secret-safe-artifacts.json");
  });
});

