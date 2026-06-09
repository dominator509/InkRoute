import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  workspaceRequiredBranchProtectionChecks,
  workspaceRequiredChecksArtifactPaths,
  workspaceRequiredChecksCommands,
  workspaceRequiredChecksReadiness,
  workspaceRequiredChecksRuntimeMatrix,
} from "../lib/workspaceRequiredChecksRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("workspace required checks runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const requiredChecksContract = readRepoFile("docs/workspace/manifests/workspace-required-checks-contract.json");
  const requiredChecksVerifier = readRepoFile("scripts/workspace/verify-workspace-required-checks.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const qualityRequiredChecksContract = readRepoFile("docs/quality/manifests/required-checks-contract.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins required commands, branch-protection checks, matrix rows, and artifact paths", () => {
    expect(workspaceRequiredChecksCommands).toEqual([
      "pnpm workspace:required-checks",
      "pnpm workspace:all",
      "pnpm quality:required-checks",
      "GitHub Actions CI / quality",
      "GitHub branch protection required-check review",
      "Failing workspace-audit PR merge-block proof",
      "PR GAP tracker diff evidence merge-block proof",
    ]);
    expect(workspaceRequiredBranchProtectionChecks).toContain("CI / workspace required checks");
    expect(workspaceRequiredBranchProtectionChecks).toContain("CI / PR GAP tracker diff evidence");
    expect(workspaceRequiredChecksRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "workspace-required-checks-audit",
      "workspace-all-required-checks-chain",
      "quality-required-checks",
      "ci-quality-job",
      "branch-protection-required-checks",
      "failing-workspace-audit-pr",
      "failing-pr-gap-diff-pr",
      "redacted-evidence-logs",
    ]);
    expect(workspaceRequiredChecksArtifactPaths).toContain("coverage/workspace-required-checks-runtime.json");
    expect(workspaceRequiredChecksArtifactPaths).toContain("test-results/workspace-required-checks-runtime");
  });

  it("keeps workspace and quality required-check contracts wired", () => {
    expect(rootPackageJson).toContain('"workspace:required-checks"');
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain('"quality:required-checks"');
    expect(requiredChecksContract).toContain("workspace:required-checks");
    expect(requiredChecksContract).toContain("branchProtection");
    expect(requiredChecksVerifier).toContain("buildWorkspaceRequiredChecksReadinessPlan");
    expect(workspaceTests).toContain("buildWorkspaceRequiredChecksReadinessPlan");
    expect(qualityRequiredChecksContract).toContain("required-checks");
  });

  it("keeps branch protection and merge-block evidence explicit until GitHub proof exists", () => {
    expect(workspaceRequiredChecksReadiness.status).toBe("blocked");
    expect(workspaceRequiredChecksReadiness.missingBranchProtectionChecks).toEqual([...workspaceRequiredBranchProtectionChecks]);
    expect(workspaceRequiredChecksReadiness.requiredCommands).toEqual([...workspaceRequiredChecksCommands]);
    expect(workspaceRequiredChecksReadiness.requiredEvidence).toEqual([
      "workspace:required-checks, workspace:all, and quality:required-checks command output.",
      "GitHub Actions CI / quality job output showing workspace and PR gap-diff checks.",
      "Branch protection settings showing every required workspace and PR gap-diff check is required before merge.",
      "A failing workspace-audit PR cannot merge.",
      "A failing PR GAP tracker diff evidence check cannot merge.",
      "Evidence logs are redacted and contain no secrets.",
    ]);
    expect(workspaceRequiredChecksReadiness.blockers).toContain("Workspace required-check contract audit must pass.");
    expect(workspaceRequiredChecksReadiness.blockers).toContain("GitHub branch protection must require every workspace and PR gap-diff check before merge.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming merge-block enforcement is live", () => {
    expect(ciWorkflow).toContain("Run Phase 18 workspace required checks runtime contracts");
    expect(ciWorkflow).toContain("workspace-required-checks-runtime-static.test.ts");
    expect(ciWorkflow).toContain("workspace-required-checks-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-workspace-required-checks-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/workspaceRequiredChecksRuntime.ts");
    expect(gapTracker).toContain("live command, CI, branch-protection, failing-PR merge-block, PR gap-diff merge-block, and redacted-log evidence remain open");
  });
});
