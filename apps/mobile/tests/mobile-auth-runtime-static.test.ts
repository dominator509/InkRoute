import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobileAuthArtifactPaths,
  mobileAuthRuntimeCommands,
  mobileAuthRuntimeMatrix,
  mobileAuthRuntimeReadiness,
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
      "biometric-unlock",
      "refresh-logout-revocation-clearing",
      "tenant-role-cross-tenant-denial",
      "audit-persistence",
      "ios-android-device-smoke",
    ]);
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-runtime.json");
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

  it("keeps provider, SecureStore, biometric, tenant, audit, and device blockers explicit", () => {
    expect(mobileAuthRuntimeReadiness.status).toBe("blocked");
    expect(mobileAuthRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileAuthRuntimeReadiness.requiredCommands).toEqual([...mobileAuthRuntimeCommands]);
    expect(mobileAuthRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "provider-backed mobile login/logout test output",
      "Expo SecureStore token persistence/clearing evidence with no plaintext token storage",
      "biometric unlock simulator/device evidence",
      "refresh, logout, and revoked-session clearing test output",
      "tenant membership, role resolution, and cross-tenant denial test output",
    ]));
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Mobile auth provider must be selected and configured before login/logout is production-ready.");
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Secure token storage must be verified to avoid plaintext token persistence.");
    expect(mobileAuthRuntimeReadiness.blockers).toContain("Mobile login, refresh, logout, denial, revocation, and tenant-switch decisions must persist audit logs.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile auth runtime contracts");
    expect(ciWorkflow).toContain("mobile-auth-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-auth-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-auth-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileAuthRuntime.ts");
    expect(gapTracker).toContain("GAP-042 is mobile-auth-runtime-matrix wired");
    expect(mobileAuthArtifactPaths).toContain("coverage/mobile-auth-secret-safe-artifacts.json");
  });
});
