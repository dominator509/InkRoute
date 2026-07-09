import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile auth static contract", () => {
  const authSource = readWorkspaceFile("apps/mobile/src/lib/mobileAuth.ts");
  const screenSource = readWorkspaceFile("apps/mobile/src/screens/AuthScreen.tsx");

  it("wraps shared mobile session gate and readiness helpers", () => {
    expect(authSource).toContain("evaluateMobileSessionGate");
    expect(authSource).toContain("buildMobileAuthRuntimeReadinessPlan");
    expect(authSource).toContain("evaluateMobileAuthSession");
  });

  it("defines secure store and biometric adapter boundaries", () => {
    expect(authSource).toContain("MobileSecureSessionStore");
    expect(authSource).toContain("secureStoreAvailable");
    expect(authSource).toContain("clearSession");
    expect(authSource).toContain("MobileBiometricAdapter");
    expect(authSource).toContain('unlock("Unlock InkRoute Artist")');
  });

  it("handles logout, expired refresh, and tenant mismatch clearing", () => {
    expect(authSource).toContain('decision.action === "logout"');
    expect(authSource).toContain('decision.status === "refresh_token_missing"');
    expect(authSource).toContain('decision.status === "tenant_mismatch"');
    expect(authSource).toContain("clearSession");
  });

  it("records redacted audit decisions without exposing token material", () => {
    expect(authSource).toContain("buildMobileAuthAuditEvent");
    expect(authSource).toContain("tenantIdHash");
    expect(authSource).toContain("rawTenantIdEchoed: false");
    expect(authSource).toContain("rawUserIdEchoed: false");
    expect(authSource).toContain("token material and provider payloads redacted");
    expect(authSource).not.toContain("refreshToken:");
    expect(authSource).not.toContain("accessToken:");
  });

  it("surfaces the auth session contract in the Auth screen", () => {
    expect(screenSource).toContain("mobileAuthSessionPreview");
    expect(screenSource).toContain("mobileSecureSessionContract");
    expect(screenSource).toContain("Session gate contract");
    expect(screenSource).toContain("secure session");
    expect(screenSource).toContain("provider login gated");
    expect(screenSource).toContain("Owner session contract");
    expect(screenSource).toContain("Local contract");
    expect(screenSource).not.toContain('eyebrow="Scaffolded"');
  });
});
