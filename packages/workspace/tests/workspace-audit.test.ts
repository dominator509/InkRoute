import { describe, expect, it } from "vitest";
import {
  auditPackageScripts,
  auditPackageEntrypoints,
  auditWorkspaceDependencies,
  classifyWorkspacePath,
  extractWorkspaceImportSpecifiers,
  getWorkspacePackageNameFromSpecifier,
  summarizeRuntimeReadiness,
} from "../src/index";

const baseProject = {
  name: "@inkroute/example",
  path: "packages/example",
  kind: "package" as const,
  private: true,
  main: "./src/index.ts",
  types: "./src/index.ts",
  scripts: { build: "tsc --noEmit", typecheck: "tsc --noEmit", lint: "tsc --noEmit", test: "vitest run" },
  dependencies: { "@inkroute/types": "workspace:*" },
  devDependencies: {},
  peerDependencies: {},
};

describe("workspace audit helpers", () => {
  it("classifies workspace paths and package import specifiers", () => {
    expect(classifyWorkspacePath(".")).toBe("root");
    expect(classifyWorkspacePath("apps/web")).toBe("app");
    expect(classifyWorkspacePath("packages/db")).toBe("package");
    expect(getWorkspacePackageNameFromSpecifier("@inkroute/types/foo")).toBe("@inkroute/types");
    expect(getWorkspacePackageNameFromSpecifier("zod")).toBeNull();
  });

  it("extracts static workspace import specifiers", () => {
    const source = [
      "import { x } from \"@inkroute/types\";",
      "const y = await import(\"@inkroute/config\");",
      "const z = require(\"@inkroute/workspace/testing\");",
    ].join("\n");
    expect(extractWorkspaceImportSpecifiers(source)).toEqual([
      "@inkroute/config",
      "@inkroute/types",
      "@inkroute/workspace/testing",
    ]);
  });

  it("flags undeclared workspace imports", () => {
    const summary = auditWorkspaceDependencies({
      projects: [baseProject, { ...baseProject, name: "@inkroute/types", path: "packages/types", dependencies: {} }],
      imports: [
        {
          sourcePath: "packages/example/src/index.ts",
          ownerPackageName: "@inkroute/example",
          importedPackageName: "@inkroute/types",
          importSpecifier: "@inkroute/types",
        },
      ],
      tsconfigPathAliases: ["@inkroute/example", "@inkroute/types"],
    });
    expect(summary.status).toBe("pass");
  });

  it("flags missing declared workspace packages and undeclared imports", () => {
    const summary = auditWorkspaceDependencies({
      projects: [
        { ...baseProject, dependencies: { "@inkroute/missing": "workspace:*" } },
        { ...baseProject, name: "@inkroute/types", path: "packages/types", dependencies: {} },
      ],
      imports: [
        {
          sourcePath: "packages/example/src/index.ts",
          ownerPackageName: "@inkroute/example",
          importedPackageName: "@inkroute/types",
          importSpecifier: "@inkroute/types",
        },
        {
          sourcePath: "packages/example/src/other.ts",
          ownerPackageName: "@inkroute/example",
          importedPackageName: "@inkroute/ghost",
          importSpecifier: "@inkroute/ghost",
        },
      ],
      tsconfigPathAliases: ["@inkroute/example"],
    });

    expect(summary.status).toBe("fail");
    expect(summary.findings.some((finding) => finding.message.includes("Declared workspace dependency @inkroute/missing does not exist"))).toBe(true);
    expect(summary.findings.some((finding) => finding.message.includes("Imports missing workspace package @inkroute/ghost"))).toBe(true);
    expect(summary.findings.some((finding) => finding.message.includes("missing from tsconfig.base.json paths"))).toBe(true);
  });

  it("audits workspace package entrypoints and export targets", () => {
    const passing = auditPackageEntrypoints(
      [
        baseProject,
        {
          ...baseProject,
          name: "@inkroute/types",
          path: "packages/types",
          exports: { ".": "./src/index.ts", "./testing": { types: "./src/testing.ts", default: "./src/testing.ts" } },
        },
      ],
      new Set([
        "packages/example/src/index.ts",
        "packages/types/src/index.ts",
        "packages/types/src/testing.ts",
      ]),
    );
    expect(passing.status).toBe("pass");
    expect(passing.packagesChecked).toBe(2);

    const failing = auditPackageEntrypoints(
      [
        { ...baseProject, main: "./src/missing.ts" },
        { ...baseProject, name: "@inkroute/types", path: "packages/types", main: undefined, types: undefined, exports: { ".": "./src/missing.ts" } },
      ],
      new Set(["packages/example/src/index.ts"]),
    );

    expect(failing.status).toBe("fail");
    expect(failing.findings.some((finding) => finding.message.includes("Package main target does not exist"))).toBe(true);
    expect(failing.findings.some((finding) => finding.message.includes("Package manifest is missing types"))).toBe(true);
    expect(failing.findings.some((finding) => finding.message.includes("Package exports target does not exist"))).toBe(true);
  });

  it("audits package script contracts and duplicate names", () => {
    expect(auditPackageScripts([baseProject]).status).toBe("pass");
    const audit = auditPackageScripts([
      baseProject,
      { ...baseProject, scripts: { build: "tsc --noEmit", typecheck: "tsc --noEmit", lint: "echo not configured" } },
    ]);

    expect(audit.status).toBe("fail");
    expect(audit.findings.some((finding) => finding.message === "Duplicate package name in workspace.")).toBe(true);
    expect(audit.findings.some((finding) => finding.message === "Missing test script.")).toBe(true);
    expect(audit.findings.some((finding) => finding.message === "Lint script is an informational placeholder.")).toBe(true);
  });

  it("summarizes blocked and needs-attention runtime readiness", () => {
    expect(
      summarizeRuntimeReadiness({
        hasPnpmLockfile: false,
        dependencyAuditStatus: "pass",
        scriptAuditStatus: "pass",
        gapCount: 129,
        blockingGapCount: 42,
        hasEnvExample: true,
        hasCiWorkflow: true,
      }).level,
    ).toBe("blocked");

    const withLockfile = summarizeRuntimeReadiness({
      hasPnpmLockfile: true,
      dependencyAuditStatus: "warn",
      scriptAuditStatus: "pass",
      gapCount: 129,
      blockingGapCount: 2,
      hasEnvExample: true,
      hasCiWorkflow: true,
    });

    expect(withLockfile.level).toBe("needs-attention");
    expect(withLockfile.firstExternalCommands).toContain("pnpm workspace:all");
    expect(withLockfile.checks.some((check) => check.id === "production-blockers" && check.status === "fail")).toBe(true);
  });
});
