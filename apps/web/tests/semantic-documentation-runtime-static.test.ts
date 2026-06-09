import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  semanticDocumentationChecks,
  semanticDocumentationRuntimeArtifactPaths,
  semanticDocumentationRuntimeCommands,
  semanticDocumentationRuntimeMatrix,
  semanticDocumentationRuntimeReadiness,
} from "../lib/semanticDocumentationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("semantic documentation runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const qualityProtocol = readRepoFile("docs/quality/QUALITY_GATE_PROTOCOL.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins semantic documentation commands, checks, matrix rows, and artifacts", () => {
    expect(semanticDocumentationRuntimeCommands).toEqual([
      "pnpm quality:docs",
      "node scripts/quality/audit-doc-links.mjs",
      "node scripts/quality/verify-documentation-consistency.mjs",
      "node scripts/quality/verify-documentation-inventory.mjs",
      "GitHub Actions CI quality job",
    ]);
    expect(semanticDocumentationChecks).toEqual([
      "structural-links",
      "concrete-repo-paths",
      "production-readiness-claims",
      "api-route-references",
      "provider-readiness-language",
      "legal-readiness-language",
      "app-package-inventory",
      "documentation-inventory-contract",
    ]);
    expect(semanticDocumentationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "structural-links-and-paths",
      "semantic-consistency",
      "workspace-inventory",
      "quality-docs-aggregate",
      "ci-quality-docs",
      "runtime-proof-boundary",
      "provider-proof-boundary",
      "legal-review-boundary",
    ]);
    expect(semanticDocumentationRuntimeArtifactPaths).toContain("coverage/semantic-documentation-runtime.json");
    expect(semanticDocumentationRuntimeArtifactPaths).toContain("test-results/semantic-documentation-runtime");
  });

  it("keeps quality docs scripts and helper tests wired", () => {
    expect(rootPackageJson).toContain('"quality:docs"');
    expect(rootPackageJson).toContain("audit-doc-links.mjs");
    expect(rootPackageJson).toContain("verify-documentation-consistency.mjs");
    expect(rootPackageJson).toContain("verify-documentation-inventory.mjs");
    expect(qualityTests).toContain("buildSemanticDocumentationRuntimeReadinessPlan");
    expect(qualityProtocol).toContain("runtime");
    expect(qualityProtocol).toContain("provider");
    expect(qualityProtocol).toContain("legal");
  });

  it("keeps semantic checks wired while CI evidence remains gated", () => {
    expect(semanticDocumentationRuntimeReadiness.status).toBe("blocked");
    expect(semanticDocumentationRuntimeReadiness.failedSemanticChecks).toEqual([]);
    expect(semanticDocumentationRuntimeReadiness.requiredCommands).toEqual([...semanticDocumentationRuntimeCommands]);
    expect(semanticDocumentationRuntimeReadiness.requiredEvidence).toEqual([
      "Markdown link/path audit output with no broken relative links or missing concrete repo paths.",
      "Documentation consistency audit output for production-readiness claims, API route references, provider language, and legal language.",
      "Documentation inventory audit output proving documented apps/packages match workspace members.",
      "CI evidence for quality:docs.",
      "Explicit notes that runtime build proof, provider proof, and legal review remain separate evidence gates.",
    ]);
    expect(semanticDocumentationRuntimeReadiness.blockers).toEqual([
      "CI evidence for semantic documentation audits must be captured.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifacts while keeping runtime/provider/legal proof separate", () => {
    expect(ciWorkflow).toContain("Run Phase 17 semantic documentation runtime contracts");
    expect(ciWorkflow).toContain("semantic-documentation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("semantic-documentation-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-semantic-documentation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/semanticDocumentationRuntime.ts");
    expect(gapTracker).toContain("live CI quality-docs evidence remains open while runtime, provider, and legal proof remain separate gates");
  });
});
