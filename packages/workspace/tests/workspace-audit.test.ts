import { describe, expect, it } from "vitest";
import {
  auditPackageScripts,
  auditPackageEntrypoints,
  auditRuntimeEvidence,
  auditWorkspaceRequiredChecks,
  auditWorkspaceToolchainReadiness,
  auditWorkspaceDependencies,
  buildWorkspaceRuntimeToolchainReadinessPlan,
  classifyWorkspacePath,
  extractImportSpecifiers,
  extractWorkspaceImportSpecifiers,
  getExternalPackageNameFromSpecifier,
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
    expect(getExternalPackageNameFromSpecifier("@sentry/nextjs/server")).toBe("@sentry/nextjs");
    expect(getExternalPackageNameFromSpecifier("zod/v4")).toBe("zod");
    expect(getExternalPackageNameFromSpecifier("node:fs")).toBeNull();
  });

  it("extracts static import specifiers", () => {
    const source = [
      "import { x } from \"@inkroute/types\";",
      "import { z } from \"zod\";",
      "const y = await import(\"@inkroute/config\");",
      "const z = require(\"@inkroute/workspace/testing\");",
    ].join("\n");
    expect(extractImportSpecifiers(source)).toContain("zod");
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

  it("flags undeclared external package imports", () => {
    const summary = auditWorkspaceDependencies({
      projects: [baseProject],
      imports: [],
      externalImports: [
        {
          sourcePath: "packages/example/src/index.ts",
          ownerPackageName: "@inkroute/example",
          importedPackageName: "zod",
          importSpecifier: "zod/v4",
        },
      ],
      tsconfigPathAliases: ["@inkroute/example"],
      builtInPackages: new Set(["node:fs"]),
    });

    expect(summary.status).toBe("fail");
    expect(summary.findings.some((finding) => finding.message.includes("Uses external package zod without declaring it"))).toBe(true);
  });

  it("allows shared root dev dependency tooling for external test imports", () => {
    const summary = auditWorkspaceDependencies({
      projects: [baseProject],
      imports: [],
      externalImports: [
        {
          sourcePath: "packages/example/tests/example.test.ts",
          ownerPackageName: "@inkroute/example",
          importedPackageName: "vitest",
          importSpecifier: "vitest",
        },
      ],
      tsconfigPathAliases: ["@inkroute/example"],
      rootDevDependencies: new Set(["vitest"]),
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

  it("audits runtime evidence requirements", () => {
    const requirements = [
      { id: "install", command: "pnpm install", gapIds: ["GAP-001"], requiredForProduction: true },
      { id: "typecheck", command: "pnpm typecheck", gapIds: ["GAP-132"], requiredForProduction: true },
      { id: "storybook", command: "pnpm storybook", gapIds: ["GAP-016"], requiredForProduction: false },
    ];
    const audit = auditRuntimeEvidence(requirements, [
      { id: "install", status: "passed", evidence: "local run 2026-06-08 passed" },
      { id: "typecheck", status: "planned" },
    ]);

    expect(audit.status).toBe("fail");
    expect(audit.requirementsChecked).toBe(3);
    expect(audit.missingRequiredEvidence).toContain("typecheck");
    expect(audit.findings.some((finding) => finding.id === "storybook" && finding.status === "warn")).toBe(true);
  });

  it("audits workspace required check wiring", () => {
    const contract = {
      requiredRootScripts: ["workspace:imports", "workspace:scripts", "workspace:readiness", "workspace:all"],
      requiredWorkspaceAllChain: ["workspace:imports", "workspace:scripts", "workspace:readiness"],
      requiredCiTerms: ["pnpm workspace:imports", "pnpm workspace:scripts", "pnpm workspace:readiness"],
      requiredPrEnforcementTerms: ["pnpm quality:pr-gaps"],
      requiredBranchProtectionChecks: ["CI / quality", "Verify Phase 18 workspace runtime readiness"],
      externalSettingsStillRequired: ["branch protection"],
    };

    const passing = auditWorkspaceRequiredChecks(contract, {
      rootScripts: {
        "workspace:imports": "node scripts/workspace/audit-workspace-imports.mjs",
        "workspace:scripts": "node scripts/workspace/audit-package-scripts.mjs",
        "workspace:readiness": "node scripts/workspace/print-runtime-readiness.mjs",
        "workspace:all": "pnpm workspace:imports && pnpm workspace:scripts && pnpm workspace:readiness",
        "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
      },
      ciWorkflow: "run: pnpm workspace:imports && pnpm workspace:scripts && pnpm workspace:readiness\nrun: pnpm quality:pr-gaps",
    });
    expect(passing.status).toBe("pass");
    expect(passing.requiredBranchProtectionChecks).toContain("Verify Phase 18 workspace runtime readiness");

    const failing = auditWorkspaceRequiredChecks(contract, {
      rootScripts: { "workspace:all": "pnpm workspace:imports" },
      ciWorkflow: "run: pnpm workspace:imports",
    });
    expect(failing.status).toBe("fail");
    expect(failing.findings.some((finding) => finding.rule === "root-script")).toBe(true);
    expect(failing.findings.some((finding) => finding.rule === "workspace-all-chain")).toBe(true);
    expect(failing.findings.some((finding) => finding.rule === "pr-enforcement-term")).toBe(true);
  });

  it("audits workspace toolchain readiness", () => {
    const contract = {
      requiredFiles: ["packages/workspace/src/index.ts", "scripts/workspace/audit-workspace-imports.mjs"],
      requiredRootScripts: ["workspace:imports", "workspace:toolchain", "workspace:all"],
      requiredWorkspaceAllChain: ["workspace:imports", "workspace:toolchain"],
      requiredWorkspacePackageScripts: ["typecheck", "test"],
      requiredCiTerms: ["pnpm workspace:imports", "pnpm workspace:toolchain"],
      requiredGeneratedReports: ["docs/workspace/manifests/workspace-import-audit.json"],
    };
    const passing = auditWorkspaceToolchainReadiness(contract, {
      existingPaths: new Set(["packages/workspace/src/index.ts", "scripts/workspace/audit-workspace-imports.mjs", "docs/workspace/manifests/workspace-import-audit.json"]),
      rootScripts: {
        "workspace:imports": "node scripts/workspace/audit-workspace-imports.mjs",
        "workspace:toolchain": "node scripts/workspace/verify-workspace-toolchain.mjs",
        "workspace:all": "pnpm workspace:imports && pnpm workspace:toolchain",
      },
      workspacePackageScripts: { typecheck: "tsc --noEmit", test: "vitest run" },
      ciWorkflow: "run: pnpm workspace:imports && pnpm workspace:toolchain",
    });
    expect(passing.status).toBe("pass");

    const failing = auditWorkspaceToolchainReadiness(contract, {
      existingPaths: new Set(["packages/workspace/src/index.ts"]),
      rootScripts: { "workspace:all": "pnpm workspace:imports" },
      workspacePackageScripts: { test: "vitest run" },
      ciWorkflow: "run: pnpm workspace:imports",
    });
    expect(failing.status).toBe("fail");
    expect(failing.findings.some((finding) => finding.rule === "required-file")).toBe(true);
    expect(failing.findings.some((finding) => finding.rule === "root-script")).toBe(true);
    expect(failing.findings.some((finding) => finding.rule === "workspace-package-script")).toBe(true);
    expect(failing.findings.some((finding) => finding.rule === "ci-term")).toBe(true);
  });

  it("blocks workspace runtime toolchain readiness until package, workspace, reports, CI, install, builds, and blockers are proven", () => {
    const plan = buildWorkspaceRuntimeToolchainReadinessPlan({
      toolchainAuditStatus: "warn",
      packageTypecheckPassed: false,
      packageTestsPassed: true,
      workspaceToolchainPassed: false,
      workspaceAllPassed: false,
      generatedReports: ["docs/workspace/manifests/workspace-import-audit.json"],
      requiredGeneratedReports: [
        "docs/workspace/manifests/workspace-import-audit.json",
        "docs/workspace/manifests/package-script-audit.json",
        "docs/workspace/manifests/runtime-evidence-audit.json",
      ],
      ciWorkspaceJobPassed: false,
      ciEvidenceCaptured: false,
      dependencyInstallEvidenceCaptured: false,
      appBuildEvidenceCaptured: false,
      productionBlockersVisible: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingGeneratedReports).toEqual([
      "docs/workspace/manifests/package-script-audit.json",
      "docs/workspace/manifests/runtime-evidence-audit.json",
    ]);
    expect(plan.requiredCommands).toContain("pnpm workspace:all");
    expect(plan.requiredEvidence).toContain("Runtime readiness report showing production blockers remain visible.");
    expect(plan.blockers).toContain("@inkroute/workspace typecheck must pass.");
    expect(plan.blockers).toContain("Dependency install evidence must be captured before runtime readiness is more than static pre-install signal.");
    expect(plan.blockers).toContain("Runtime readiness reports must keep production blockers visible.");
  });

  it("marks workspace runtime toolchain readiness ready when package, workspace, reports, CI, install, builds, and blockers are proven", () => {
    const reports = [
      "docs/workspace/manifests/workspace-import-audit.json",
      "docs/workspace/manifests/package-script-audit.json",
      "docs/workspace/manifests/runtime-evidence-audit.json",
      "docs/workspace/manifests/runtime-readiness.json",
      "docs/workspace/manifests/workspace-required-checks-audit.json",
      "docs/workspace/manifests/workspace-toolchain-readiness-audit.json",
    ];
    const plan = buildWorkspaceRuntimeToolchainReadinessPlan({
      toolchainAuditStatus: "pass",
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      workspaceToolchainPassed: true,
      workspaceAllPassed: true,
      generatedReports: reports,
      requiredGeneratedReports: reports,
      ciWorkspaceJobPassed: true,
      ciEvidenceCaptured: true,
      dependencyInstallEvidenceCaptured: true,
      appBuildEvidenceCaptured: true,
      productionBlockersVisible: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingGeneratedReports).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
