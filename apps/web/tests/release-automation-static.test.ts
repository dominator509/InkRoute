import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Phase 12 release automation static coverage", () => {
  it("keeps dashboard release API routes covered for fallback, auth, validation, and persistence contracts", () => {
    const releasesRoute = readWorkspaceFile("apps/dashboard/app/api/releases/route.ts");
    const flagsRoute = readWorkspaceFile("apps/dashboard/app/api/feature-flags/route.ts");

    expect(releasesRoute).toContain("export async function GET");
    expect(releasesRoute).toContain("export async function POST");
    expect(releasesRoute).toContain('assertPermission(actor, "release:read")');
    expect(releasesRoute).toContain('assertPermission(actor, "release:write")');
    expect(releasesRoute).toContain("releaseCreateInputSchema.safeParse");
    expect(releasesRoute).toContain("TENANT_MISMATCH");
    expect(releasesRoute).toContain("RELEASE_UNIQUENESS_CONFLICT");
    expect(releasesRoute).toContain("persistence: \"database\"");
    expect(releasesRoute).toContain("persistence: \"local-fallback\"");
    expect(releasesRoute).toContain("buildReleaseHealthChecks");

    expect(flagsRoute).toContain("export async function GET");
    expect(flagsRoute).toContain("export async function POST");
    expect(flagsRoute).toContain('assertPermission(actor, "release:read")');
    expect(flagsRoute).toContain('assertPermission(actor, "settings:write")');
    expect(flagsRoute).toContain("featureFlagPatchInputSchema.safeParse");
    expect(flagsRoute).toContain("PROVIDER_CREDENTIALS_REQUIRED");
    expect(flagsRoute).toContain("feature_flag:update");
    expect(flagsRoute).toContain("cacheKey");
  });

  it("keeps dashboard release page wired to release gates, flags, rollback, workflow, and gated actions", () => {
    const releasesPage = readWorkspaceFile("apps/dashboard/app/releases/page.tsx");
    const releaseActionPanel = readWorkspaceFile("apps/dashboard/components/ReleaseActionPanel.tsx");
    const releaseDemo = readWorkspaceFile("apps/dashboard/lib/releaseDemo.ts");

    expect(releasesPage).toContain("Release gates");
    expect(releasesPage).toContain("Feature flag decisions");
    expect(releasesPage).toContain("EAS Update preview");
    expect(releasesPage).toContain("Rollback draft");
    expect(releasesPage).toContain("CI/CD guardrail plan");
    expect(releasesPage).toContain("ReleaseActionPanel");
    expect(releaseActionPanel).toContain('fetch("/api/releases"');
    expect(releaseActionPanel).toContain("Create release draft");
    expect(releaseActionPanel).toContain("provider proof remain gated");
    expect(releaseDemo).toContain("releaseWorkflowPlan");
    expect(releaseDemo).toContain("providerRuntimeGatePreview");
    expect(releaseDemo).toContain("releaseAuditDrafts");
  });

  it("keeps mobile release smoke evidence on the system status surface", () => {
    const mobileDemo = readWorkspaceFile("apps/mobile/src/lib/mobileDemo.ts");
    const systemScreen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");

    expect(mobileDemo).toContain("mobileOtaUpdatePlan");
    expect(mobileDemo).toContain("mobileEasOtaReadinessPlan");
    expect(systemScreen).toContain("Release candidate");
    expect(systemScreen).toContain("mobileReleaseCandidate.version");
    expect(systemScreen).toContain("OTA update plan");
    expect(systemScreen).toContain("mobileOtaUpdatePlan.compatibility");
    expect(systemScreen).toContain("EAS OTA readiness");
    expect(systemScreen).toContain("rollbackRequirement");
  });

  it("keeps release governance workflow dispatchable with Prisma, production, and mobile gates", () => {
    const workflow = readWorkspaceFile(".github/workflows/release-governance.yml");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("release_version:");
    expect(workflow).toContain("release_channel:");
    expect(workflow).toContain("Prisma migration compatibility dry run");
    expect(workflow).toContain("prisma validate --schema packages/db/prisma/schema.prisma");
    expect(workflow).toContain("prisma migrate diff");
    expect(workflow).toContain("Deployment-gated preview release");
    expect(workflow).toContain("Deployment-gated production release");
    expect(workflow).toContain("EAS preview update");
    expect(workflow).toContain("protected production deploy");
    expect(workflow).not.toMatch(/sk_live_|ghp_|gho_|vercel_[A-Za-z0-9]/);
  });
});
