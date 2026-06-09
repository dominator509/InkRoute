import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runtimeEvidenceArtifactPaths,
  runtimeEvidenceCommands,
  runtimeEvidenceMatrix,
  runtimeEvidenceReadiness,
  runtimeEvidenceRequirementIds,
} from "../lib/runtimeEvidenceMatrix";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("runtime evidence matrix contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const runtimeEvidenceContract = readRepoFile("docs/workspace/manifests/runtime-evidence-contract.json");
  const runtimeEvidenceManifest = readRepoFile("docs/workspace/manifests/runtime-evidence.json");
  const runtimeEvidenceVerifier = readRepoFile("scripts/workspace/verify-runtime-evidence.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins required runtime commands, requirement ids, matrix rows, and artifact paths", () => {
    expect(runtimeEvidenceCommands).toEqual([
      "pnpm install",
      "pnpm workspace:runtime-evidence",
      "pnpm workspace:all",
      "pnpm handoff:all",
      "pnpm quality:all",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
    ]);
    expect(runtimeEvidenceRequirementIds).toEqual([
      "dependency-install",
      "workspace-runtime-evidence",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
    ]);
    expect(runtimeEvidenceMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "workspace-runtime-evidence",
      "workspace-all",
      "handoff-all",
      "quality-all",
      "typecheck",
      "unit-tests",
      "web-build",
      "dashboard-build",
      "ci-runtime-readiness",
      "production-blockers-visible",
    ]);
    expect(runtimeEvidenceArtifactPaths).toContain("coverage/runtime-evidence-matrix.json");
    expect(runtimeEvidenceArtifactPaths).toContain("test-results/runtime-evidence-matrix");
  });

  it("keeps runtime evidence scripts, manifests, verifier, and helper tests aligned", () => {
    expect(rootPackageJson).toContain('"workspace:runtime-evidence"');
    expect(rootPackageJson).toContain('"workspace:all"');
    expect(rootPackageJson).toContain("workspace:runtime-evidence");
    expect(runtimeEvidenceContract).toContain("pnpm install");
    expect(runtimeEvidenceContract).toContain("pnpm quality:all");
    expect(runtimeEvidenceManifest).toContain("runtime-evidence");
    expect(runtimeEvidenceVerifier).toContain("buildRuntimeEvidenceReadinessPlan");
    expect(workspaceTests).toContain("buildRuntimeEvidenceReadinessPlan");
  });

  it("keeps missing runtime proof explicit until redacted command evidence exists", () => {
    expect(runtimeEvidenceReadiness.status).toBe("blocked");
    expect(runtimeEvidenceReadiness.missingEvidenceIds).toEqual([...runtimeEvidenceRequirementIds]);
    expect(runtimeEvidenceReadiness.nonPassingEvidenceIds).toEqual([]);
    expect(runtimeEvidenceReadiness.requiredCommands).toEqual([
      "pnpm install",
      "pnpm workspace:runtime-evidence",
      "pnpm workspace:all",
      "pnpm handoff:all",
      "pnpm quality:all",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm workspace:runtime-evidence",
      "pnpm workspace:all",
      "GitHub Actions Phase 18 workspace runtime readiness job",
    ]);
    expect(runtimeEvidenceReadiness.requiredEvidence).toEqual([
      "Each required runtime command has a passed record with a redacted evidence label.",
      "runtime-evidence-audit.json reports pass.",
      "workspace:runtime-evidence and workspace:all command output are captured.",
      "GitHub Actions evidence is captured without secrets or private customer data.",
      "Production blockers remain visible in readiness evidence until resolved.",
    ]);
    expect(runtimeEvidenceReadiness.blockers).toContain("Runtime evidence is missing for pnpm install.");
    expect(runtimeEvidenceReadiness.blockers).toContain("Runtime evidence audit must pass before runtime readiness can be claimed.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming command evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 18 runtime evidence matrix contracts");
    expect(ciWorkflow).toContain("runtime-evidence-matrix-static.test.ts");
    expect(ciWorkflow).toContain("runtime-evidence-matrix-artifacts");
    expect(unitManifest).toContain("unit-web-runtime-evidence-matrix-static");
    expect(gapTracker).toContain("apps/web/lib/runtimeEvidenceMatrix.ts");
    expect(gapTracker).toContain("live install, workspace, handoff, quality, typecheck, unit, build, CI, and redacted evidence proof remain open");
  });
});
