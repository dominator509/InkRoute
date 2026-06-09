import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dependencyInstallArtifactPaths,
  dependencyInstallReadiness,
  dependencyInstallRuntimeCommands,
  dependencyInstallRuntimeMatrix,
  dependencyInstallSourceFiles,
} from "../lib/dependencyInstallRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dependency install runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const pnpmWorkspace = readRepoFile("pnpm-workspace.yaml");
  const pnpmLockfile = readRepoFile("pnpm-lock.yaml");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const runtimeEvidence = readRepoFile("docs/workspace/manifests/runtime-evidence.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins dependency commands, source files, matrix rows, and artifact paths", () => {
    expect(dependencyInstallRuntimeCommands).toEqual([
      "corepack enable",
      "pnpm install",
      "pnpm install --frozen-lockfile",
      "pnpm workspace:all",
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test:unit",
      "GitHub Actions CI quality job",
    ]);
    expect(dependencyInstallSourceFiles).toEqual([
      "package.json",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
    ]);
    expect(dependencyInstallRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "package-manager-corepack",
      "dependency-install",
      "frozen-lockfile-install",
      "workspace-audit-after-install",
      "typecheck-after-install",
      "lint-after-install",
      "unit-tests-after-install",
      "ci-quality-job",
      "production-blocker-visibility",
    ]);
    expect(dependencyInstallArtifactPaths).toContain("coverage/dependency-install-runtime.json");
    expect(dependencyInstallArtifactPaths).toContain("test-results/dependency-install-runtime");
  });

  it("keeps dependency source files, package manager pin, lockfile, and helper tests wired", () => {
    expect(rootPackageJson).toContain('"packageManager"');
    expect(rootPackageJson).toContain("pnpm");
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain('"test:unit"');
    expect(pnpmWorkspace).toContain("apps/*");
    expect(pnpmWorkspace).toContain("packages/*");
    expect(pnpmLockfile).toContain("lockfileVersion");
    expect(workspaceTests).toContain("buildDependencyInstallReadinessPlan");
    expect(runtimeEvidence).toContain("pnpm install");
  });

  it("keeps source readiness complete while install and quality evidence remain gated", () => {
    expect(dependencyInstallReadiness.status).toBe("blocked");
    expect(dependencyInstallReadiness.missingSourceFiles).toEqual([]);
    expect(dependencyInstallReadiness.requiredCommands).toEqual([...dependencyInstallRuntimeCommands]);
    expect(dependencyInstallReadiness.requiredEvidence).toEqual([
      "package.json, pnpm-workspace.yaml, and pnpm-lock.yaml are present and committed.",
      "Package manager pin and lockfile are used for a deterministic pnpm install.",
      "Local or clean-checkout install output plus frozen-lockfile CI output.",
      "typecheck, lint, unit test, and workspace audit output after install.",
      "CI evidence showing the same install/tooling gates passed.",
      "GAP_TRACKER.md continues to show unresolved provider/runtime/legal blockers separately.",
    ]);
    expect(dependencyInstallReadiness.blockers).toEqual([
      "pnpm install must pass in the working environment.",
      "pnpm install --frozen-lockfile must pass in CI or a clean checkout.",
      "pnpm typecheck must pass after dependency install.",
      "pnpm lint must pass after dependency install.",
      "pnpm test:unit must pass after dependency install.",
      "pnpm workspace:all must pass after dependency install.",
      "CI evidence for install, typecheck, lint, tests, and workspace audits must be captured.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming install evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 1 dependency install runtime contracts");
    expect(ciWorkflow).toContain("dependency-install-runtime-static.test.ts");
    expect(ciWorkflow).toContain("dependency-install-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-dependency-install-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/dependencyInstallRuntime.ts");
    expect(gapTracker).toContain("live install, frozen-lockfile install, typecheck, lint, unit-test, workspace audit, and CI evidence remain open");
  });
});
