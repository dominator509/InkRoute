import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  staticDependencyAuditArtifactPaths,
  staticDependencyAuditCommands,
  staticDependencyAuditCoverageAreas,
  staticDependencyAuditReadiness,
  staticDependencyAuditRuntimeMatrix,
} from "../lib/staticDependencyAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("static dependency audit runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const workspacePackageJson = readRepoFile("packages/workspace/package.json");
  const workspaceImportAudit = readRepoFile("scripts/workspace/audit-workspace-imports.mjs");
  const workspaceTests = readRepoFile("packages/workspace/tests/workspace-audit.test.ts");
  const workspaceProtocol = readRepoFile("docs/workspace/WORKSPACE_AUDIT_PROTOCOL.md");
  const workspaceImportManifest = readRepoFile("docs/workspace/manifests/workspace-import-audit.json");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins static dependency commands, coverage areas, matrix rows, and artifact paths", () => {
    expect(staticDependencyAuditCommands).toEqual([
      "node scripts/workspace/audit-workspace-imports.mjs",
      "pnpm --filter @inkroute/workspace test",
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm install",
      "pnpm typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
    ]);
    expect(staticDependencyAuditCoverageAreas).toEqual([
      "declared-workspace-dependencies",
      "workspace-source-imports",
      "tsconfig-path-aliases",
      "package-source-entrypoints",
      "manifest-main-types-export-targets",
      "bare-third-party-imports",
      "root-devdependency-test-tooling",
      "runtime-resolution-boundary",
      "peer-version-boundary",
    ]);
    expect(staticDependencyAuditRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "workspace-import-audit",
      "workspace-package-tests",
      "workspace-package-typecheck",
      "dependency-install-resolution",
      "workspace-typecheck-resolution",
      "web-build-resolution",
      "dashboard-build-resolution",
      "ci-workspace-resolution",
      "peer-version-review",
    ]);
    expect(staticDependencyAuditArtifactPaths).toContain("coverage/static-dependency-audit-runtime.json");
    expect(staticDependencyAuditArtifactPaths).toContain("test-results/static-dependency-audit-runtime");
  });

  it("keeps workspace import audit script, package tests, protocol, and manifest aligned", () => {
    expect(rootPackageJson).toContain("audit-workspace-imports.mjs");
    expect(workspacePackageJson).toContain('"typecheck"');
    expect(workspacePackageJson).toContain('"test"');
    expect(workspaceImportAudit).toContain("workspace imports");
    expect(workspaceImportAudit).toContain("external imports");
    expect(workspaceTests).toContain("external package-name normalization");
    expect(workspaceProtocol).toContain("workspace import");
    expect(workspaceImportManifest).toContain("workspace-import-audit");
  });

  it("preserves the verified static audit result while runtime resolution remains gated", () => {
    expect(staticDependencyAuditReadiness.status).toBe("blocked");
    expect(staticDependencyAuditReadiness.locallyVerifiedAudit).toEqual({
      command: "node scripts/workspace/audit-workspace-imports.mjs",
      projects: 25,
      sourceFiles: 809,
      workspaceImports: 139,
      externalImports: 174,
      entrypointFindings: 0,
    });
    expect(staticDependencyAuditReadiness.requiredCommands).toEqual([...staticDependencyAuditCommands]);
    expect(staticDependencyAuditReadiness.requiredEvidence).toContain(
      "Dependency install, workspace typecheck, web build, and dashboard build output proving runtime package resolution.",
    );
    expect(staticDependencyAuditReadiness.blockers).toContain(
      "pnpm install, pnpm typecheck, and app builds must prove runtime dependency resolution.",
    );
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runtime resolution is proven", () => {
    expect(ciWorkflow).toContain("Run Phase 18 static dependency audit runtime contracts");
    expect(ciWorkflow).toContain("static-dependency-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("static-dependency-audit-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-static-dependency-audit-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/staticDependencyAuditRuntime.ts");
    expect(gapTracker).toContain("live package test/typecheck, install/typecheck/build, CI, peer/version, and runtime resolution proof remain open");
  });
});
