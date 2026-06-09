import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  securityAppRuntimeArtifactPaths,
  securityAppRuntimeCommands,
  securityAppRuntimeTargets,
  securityAppRuntimeVerificationPlan,
} from "../lib/securityAppRuntimeVerification";

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("GAP-104 security app runtime verification contract", () => {
  it("maps web, dashboard, mobile, API, middleware, browser, and device runtime targets", () => {
    expect(securityAppRuntimeTargets.map((target) => target.id)).toEqual(
      expect.arrayContaining([
        "web-typecheck",
        "web-build",
        "dashboard-typecheck",
        "dashboard-build",
        "mobile-typecheck",
        "next-config-static",
        "mobile-security-static",
        "web-security-routes",
        "dashboard-security-routes",
        "middleware-runtime",
        "browser-runtime",
        "mobile-device",
      ]),
    );
    expect(securityAppRuntimeCommands).toContain("pnpm --filter @inkroute/web build");
    expect(securityAppRuntimeCommands).toContain("pnpm --filter @inkroute/dashboard build");
    expect(securityAppRuntimeCommands).toContain("mobile SystemStatus device/emulator smoke tests");
    expect(securityAppRuntimeArtifactPaths).toContain("coverage/security-mobile-device-smoke.json");
  });

  it("keeps Next shared package transpilation and mobile SystemStatus security surfaces pinned", () => {
    const webConfig = readWorkspaceFile("apps/web/next.config.mjs");
    const dashboardConfig = readWorkspaceFile("apps/dashboard/next.config.mjs");
    const nextConfigTest = readWorkspaceFile("apps/web/tests/security-next-config-static.test.ts");
    const mobileStatic = readWorkspaceFile("apps/mobile/tests/mobile-security-static.test.ts");
    const systemStatus = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
    const mobileDemo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");

    expect(webConfig).toContain("@inkroute/security");
    expect(dashboardConfig).toContain("@inkroute/security");
    expect(nextConfigTest).toContain("@inkroute/security");
    expect(mobileStatic).toContain("SystemStatusScreen");
    expect(systemStatus).toContain("Security posture");
    expect(mobileDemo).toContain("mobileSecuritySummary");
    expect(mobileDemo).toContain("mobileUploadValidationPreview");
  });

  it("keeps runtime readiness blocked until app builds, route smoke, middleware smoke, browser smoke, and device proof execute", () => {
    expect(securityAppRuntimeVerificationPlan.status).toBe("blocked");
    expect(securityAppRuntimeVerificationPlan.blockers).toEqual(
      expect.arrayContaining([
        "Web app typecheck must pass with shared security package imports.",
        "Web app build must pass with security middleware and route imports.",
        "Dashboard app build must pass with security middleware and trust routes.",
        "Mobile app typecheck must pass with SystemStatus security, tenant-isolation, privacy, and upload preview surfaces.",
        "Web route smoke tests must exercise trust, privacy, legal, consent, and secure-upload surfaces.",
        "Mobile SystemStatus screen smoke must prove security posture, privacy, tenant isolation, and upload preview render under app dependencies.",
      ]),
    );
    expect(securityAppRuntimeVerificationPlan.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web/dashboard/mobile typecheck and build command output",
        "web/dashboard route smoke and middleware runtime smoke transcripts",
        "browser runtime, mobile device/emulator, and CI artifact evidence",
      ]),
    );
  });

  it("pins CI, manifest, and tracker references for GAP-104", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");
    const manifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
    const tracker = readWorkspaceFile("GAP_TRACKER.md");

    expect(ci).toContain("Run Phase 13 security app runtime verification contracts");
    expect(ci).toContain("apps/web/tests/security-app-runtime-verification-static.test.ts");
    expect(ci).toContain("security-app-runtime-verification-artifacts");
    expect(manifest).toContain("unit-web-security-app-runtime-verification-static");
    expect(tracker).toContain("apps/web/lib/securityAppRuntimeVerification.ts");
    expect(tracker).toContain("live app runtime/build/device proof remains open");
  });
});
