import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile Phase 13 security runtime surface", () => {
  it("surfaces security posture, tenant isolation, privacy, and upload boundaries on SystemStatusScreen", () => {
    const screen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
    const demo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");

    expect(screen).toContain("Security posture");
    expect(screen).toContain("Phase 13 controls");
    expect(screen).toContain("local runtime contracts");
    expect(screen).toContain("Privacy and upload preview");
    expect(screen).toContain("Tenant isolation tests");
    expect(screen).toContain("mobileSecuritySummary");
    expect(screen).toContain("mobileTenantIsolationFixtures");
    expect(screen).toContain("mobilePrivacyDraft");
    expect(screen).toContain("mobileUploadValidationPreview");
    expect(demo).toContain("mobileSecuritySummary");
    expect(demo).toContain("mobileTenantIsolationFixtures");
    expect(demo).toContain("mobilePrivacyDraft");
    expect(demo).toContain("mobileUploadValidationPreview");
    expect(screen).not.toContain("Phase 13 scaffold");
    expect(screen).not.toContain("local-control contracts");
  });

  it("keeps mobile security status explicitly non-production until provider-backed verification runs", () => {
    const demo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");

    expect(demo).toContain("productionReady: mobileSecuritySummary.blockers === 0");
    expect(demo).toContain("buildTenantIsolationFixtures");
    expect(demo).toContain("buildPrivacyRequestDraft");
    expect(demo).toContain("validateUploadDraft");
  });
});
