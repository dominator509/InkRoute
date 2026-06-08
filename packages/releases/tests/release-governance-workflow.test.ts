import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildGithubReleaseWorkflowPlan } from "../src/index";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("release governance workflow scaffold", () => {
  it("keeps release governance dispatchable but deployment jobs safely disabled until secrets exist", () => {
    const workflow = readWorkspaceFile(".github/workflows/release-governance.yml");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("release_version:");
    expect(workflow).toContain("release_channel:");
    expect(workflow).toContain("environment: preview");
    expect(workflow).toContain("environment: production");
    expect(workflow).toContain("if: ${{ false }}");
    expect(workflow).toContain("Deployment-gated preview release");
    expect(workflow).toContain("Deployment-gated production release");
  });

  it("documents required deployment gates without exposing secrets in workflow source", () => {
    const workflow = readWorkspaceFile(".github/workflows/release-governance.yml");
    const plan = buildGithubReleaseWorkflowPlan();

    expect(plan.requiredSecrets).toEqual(expect.arrayContaining(["VERCEL_TOKEN", "EXPO_TOKEN", "DATABASE_URL"]));
    expect(plan.deploymentGatedSteps).toEqual(
      expect.arrayContaining([
        "Vercel preview/prod deploy",
        "Prisma migrate deploy",
        "EAS Update publish",
        "Sentry release/source-map upload",
        "Search Console sitemap submission",
      ]),
    );
    expect(workflow).not.toMatch(/sk_live_|ghp_|gho_|vercel_[A-Za-z0-9]/);
    expect(workflow).toContain("Prisma migration dry run");
    expect(workflow).toContain("Prisma migration compatibility dry run");
    expect(workflow).toContain("DATABASE_URL");
    expect(workflow).toContain("prisma validate --schema packages/db/prisma/schema.prisma");
    expect(workflow).toContain("prisma migrate diff");
    expect(workflow).toContain("DROP COLUMN");
    expect(workflow).toContain("Sentry release artifacts");
  });

  it("keeps CI quality gates wired before release automation is trusted", () => {
    const ci = readWorkspaceFile(".github/workflows/ci.yml");

    expect(ci).toContain("pnpm install --frozen-lockfile");
    expect(ci).toContain("pnpm quality:all");
    expect(ci).toContain("pnpm quality:pr-gaps");
    expect(ci).toContain("pnpm typecheck");
    expect(ci).toContain("pnpm lint");
    expect(ci).toContain("pnpm test:unit");
    expect(ci).toContain("pnpm test:e2e");
  });
});
