import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  handoffToolingRequiredCiEvidence,
  handoffToolingRequiredDocs,
  handoffToolingRequiredReports,
  handoffToolingRequiredRootScripts,
  handoffToolingRequiredScriptFiles,
  handoffToolingRuntimeArtifactPaths,
  handoffToolingRuntimeCommands,
  handoffToolingRuntimeMatrix,
  handoffToolingRuntimeReadiness,
} from "../lib/handoffToolingRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("handoff tooling runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const handoffPackageJson = readRepoFile("packages/handoff/package.json");
  const toolingManifest = readRepoFile("docs/handoff/manifests/handoff-tooling-readiness.json");
  const toolingVerifier = readRepoFile("scripts/handoff/verify-handoff-tooling.mjs");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins every GAP-121 command, report, script, doc, CI label, and artifact path", () => {
    expect(handoffToolingRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm --filter @inkroute/handoff typecheck",
      "pnpm --filter @inkroute/handoff test",
      "pnpm handoff:verify-docs",
      "pnpm handoff:audit",
      "pnpm handoff:next",
      "pnpm handoff:verify-ledger",
      "pnpm handoff:verify-tooling",
      "pnpm handoff:all",
    ]);
    expect(handoffToolingRequiredRootScripts).toContain("handoff:all");
    expect(handoffToolingRequiredReports).toContain("docs/handoff/manifests/handoff-tooling-readiness.json");
    expect(handoffToolingRequiredScriptFiles).toContain("scripts/handoff/verify-handoff-tooling.mjs");
    expect(handoffToolingRequiredDocs).toContain("docs/handoff/AGENT_EXECUTION_QUEUE.md");
    expect(handoffToolingRequiredCiEvidence).toContain("handoff-tooling-runtime-artifacts");
    expect(handoffToolingRuntimeArtifactPaths).toContain("coverage/handoff-tooling-runtime.json");
    expect(handoffToolingRuntimeArtifactPaths).toContain("test-results/handoff-tooling-runtime");
  });

  it("keeps root scripts, package scripts, tooling manifest, and verifier aligned", () => {
    for (const scriptName of handoffToolingRequiredRootScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("handoff:verify-tooling");
    expect(handoffPackageJson).toContain('"typecheck"');
    expect(handoffPackageJson).toContain('"test"');
    expect(toolingManifest).toContain("handoff-tooling-readiness");
    expect(toolingManifest).toContain("handoff:verify-tooling");
    expect(toolingVerifier).toContain("buildHandoffToolingRuntimeReadinessPlan");
    expect(toolingVerifier).toContain("reportArtifactsCaptured");
  });

  it("keeps readiness blocked only on runtime execution, CI capture, and artifact evidence", () => {
    expect(handoffToolingRuntimeReadiness.status).toBe("blocked");
    expect(handoffToolingRuntimeReadiness.missingRootScripts).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingReports).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingScriptFiles).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingDocs).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingCiEvidence).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(handoffToolingRuntimeReadiness.requiredCommands).toEqual([...handoffToolingRuntimeCommands]);
    expect(handoffToolingRuntimeReadiness.blockers).toEqual([
      "Workspace dependencies must install before handoff tooling verification is meaningful.",
      "@inkroute/handoff typecheck must pass.",
      "@inkroute/handoff tests must pass.",
      "Handoff verify-docs, audit, next, verify-ledger, verify-tooling, and all scripts must execute.",
      "pnpm handoff:verify-tooling must pass.",
      "GitHub Actions CI run must capture Phase 16 handoff tooling evidence.",
      "Handoff report artifacts must be captured or explicitly documented as unavailable.",
    ]);
  });

  it("wires CI, manifest, tracker, and matrix rows without claiming runtime evidence is complete", () => {
    expect(handoffToolingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "package-typecheck",
      "package-tests",
      "handoff-script-suite",
      "ci-evidence",
      "report-artifacts",
    ]);
    expect(ciWorkflow).toContain("Run Phase 16 handoff tooling runtime contracts");
    expect(ciWorkflow).toContain("handoff-tooling-runtime-static.test.ts");
    expect(ciWorkflow).toContain("handoff-tooling-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-handoff-tooling-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/handoffToolingRuntime.ts");
    expect(gapTracker).toContain("live install, script execution, CI run, and artifact proof remain open");
  });
});
