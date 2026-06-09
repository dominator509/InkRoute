import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  requiredChecksBranchProtectionChecks,
  requiredChecksPackageScripts,
  requiredChecksRepositorySettings,
  requiredChecksRuntimeArtifactPaths,
  requiredChecksRuntimeCommands,
  requiredChecksRuntimeMatrix,
  requiredChecksRuntimeReadiness,
  requiredChecksWorkflowTerms,
} from "../lib/requiredChecksRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("required checks runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const requiredChecksContract = readRepoFile("docs/quality/manifests/required-checks-contract.json");
  const requiredChecksVerifier = readRepoFile("scripts/quality/verify-required-checks.mjs");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins package scripts, workflow terms, branch checks, repository settings, commands, and artifacts", () => {
    expect(requiredChecksPackageScripts).toEqual([
      "quality:required-checks",
      "quality:all",
      "handoff:all",
      "workspace:all",
      "typecheck",
      "lint",
      "test:unit",
      "test:e2e",
    ]);
    expect(requiredChecksWorkflowTerms).toContain("playwright");
    expect(requiredChecksBranchProtectionChecks).toContain("CI / quality");
    expect(requiredChecksRepositorySettings).toContain("secret-scanning");
    expect(requiredChecksRuntimeCommands).toEqual([
      "pnpm quality:required-checks",
      "pnpm quality:all",
      "GitHub branch protection required-check audit",
      "GitHub repository settings audit",
      "failing quality-gate PR merge-block proof",
    ]);
    expect(requiredChecksRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "required-checks-audit",
      "quality-all-chain",
      "branch-protection-required-checks",
      "repository-settings-audit",
      "failing-quality-pr-block",
      "codeowners-review-active",
    ]);
    expect(requiredChecksRuntimeArtifactPaths).toContain("coverage/required-checks-runtime.json");
    expect(requiredChecksRuntimeArtifactPaths).toContain("test-results/required-checks-runtime");
  });

  it("keeps local required-check source contracts wired", () => {
    for (const scriptName of requiredChecksPackageScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("quality:required-checks");
    expect(rootPackageJson).toContain("quality:all");
    expect(ciWorkflow).toContain("quality:required-checks");
    expect(ciWorkflow).toContain("quality:all");
    expect(requiredChecksContract).toContain("branchProtection");
    expect(requiredChecksContract).toContain("repositorySettings");
    expect(requiredChecksVerifier).toContain("buildRequiredChecksRuntimeReadinessPlan");
    expect(qualityTests).toContain("buildRequiredChecksRuntimeReadinessPlan");
  });

  it("keeps local wiring complete while branch protection and merge-block proof remain gated", () => {
    expect(requiredChecksRuntimeReadiness.status).toBe("blocked");
    expect(requiredChecksRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(requiredChecksRuntimeReadiness.missingWorkflowTerms).toEqual([]);
    expect(requiredChecksRuntimeReadiness.missingBranchProtectionChecks).toEqual([...requiredChecksBranchProtectionChecks]);
    expect(requiredChecksRuntimeReadiness.missingRepositorySettings).toEqual([...requiredChecksRepositorySettings]);
    expect(requiredChecksRuntimeReadiness.requiredCommands).toEqual([...requiredChecksRuntimeCommands]);
    expect(requiredChecksRuntimeReadiness.requiredEvidence).toEqual([
      "Required checks audit output proving package scripts and CI workflow terms are present.",
      "Branch protection settings showing every documented required check is enforced.",
      "Repository settings showing pull request, up-to-date branch, CODEOWNERS review, conversation resolution, force-push/deletion restrictions, and secret scanning controls.",
      "A failing quality-gate PR that cannot merge.",
      "CODEOWNERS review enforcement proof.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming branch protection is enforced", () => {
    expect(ciWorkflow).toContain("Run Phase 17 required checks runtime contracts");
    expect(ciWorkflow).toContain("required-checks-runtime-static.test.ts");
    expect(ciWorkflow).toContain("required-checks-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-required-checks-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/requiredChecksRuntime.ts");
    expect(gapTracker).toContain("live branch-protection required-check, repository-settings, failing-PR merge-block, and CODEOWNERS review proof remain open");
  });
});
