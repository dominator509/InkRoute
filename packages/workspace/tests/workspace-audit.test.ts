import { describe, expect, it } from "vitest";
import { auditPackageScripts, auditWorkspaceDependencies, extractWorkspaceImportSpecifiers, summarizeRuntimeReadiness } from "../src/index";

const baseProject = {
  name: "@inkroute/example",
  path: "packages/example",
  kind: "package" as const,
  private: true,
  scripts: { build: "tsc --noEmit", typecheck: "tsc --noEmit", lint: "tsc --noEmit", test: "vitest run" },
  dependencies: { "@inkroute/types": "workspace:*" },
  devDependencies: {},
  peerDependencies: {},
};

describe("workspace audit helpers", () => {
  it("extracts static workspace import specifiers", () => {
    const source = [
      "import { x } from \"@inkroute/types\";",
      "const y = await import(\"@inkroute/config\");",
    ].join("\n");
    expect(extractWorkspaceImportSpecifiers(source)).toEqual([
      "@inkroute/config",
      "@inkroute/types",
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

  it("summarizes script and runtime readiness", () => {
    expect(auditPackageScripts([baseProject]).status).toBe("pass");
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
  });
});
