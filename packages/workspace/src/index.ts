export type WorkspaceAuditStatus = "pass" | "warn" | "fail";
export type WorkspaceProjectKind = "app" | "package" | "root";
export type RuntimeReadinessLevel = "ready-for-local-install" | "blocked" | "needs-attention";

export interface WorkspaceProjectManifest {
  readonly name: string;
  readonly path: string;
  readonly kind: WorkspaceProjectKind;
  readonly private: boolean;
  readonly scripts: Readonly<Record<string, string>>;
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly peerDependencies: Readonly<Record<string, string>>;
}

export interface WorkspaceImportRecord {
  readonly sourcePath: string;
  readonly ownerPackageName: string;
  readonly importedPackageName: string;
  readonly importSpecifier: string;
}

export interface WorkspaceDependencyFinding {
  readonly status: WorkspaceAuditStatus;
  readonly packageName?: string;
  readonly sourcePath?: string;
  readonly message: string;
}

export interface WorkspaceDependencyAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly projectsChecked: number;
  readonly workspacePackages: readonly string[];
  readonly importRecords: readonly WorkspaceImportRecord[];
  readonly findings: readonly WorkspaceDependencyFinding[];
}

export interface PackageScriptFinding {
  readonly status: WorkspaceAuditStatus;
  readonly packageName: string;
  readonly message: string;
}

export interface PackageScriptAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly projectsChecked: number;
  readonly findings: readonly PackageScriptFinding[];
  readonly requiredRootScripts: readonly string[];
  readonly requiredProjectScripts: readonly string[];
}

export interface RuntimeReadinessCheck {
  readonly id: string;
  readonly title: string;
  readonly status: WorkspaceAuditStatus;
  readonly evidence: string;
  readonly gapIds: readonly string[];
}

export interface RuntimeReadinessSummary {
  readonly level: RuntimeReadinessLevel;
  readonly status: WorkspaceAuditStatus;
  readonly checks: readonly RuntimeReadinessCheck[];
  readonly firstExternalCommands: readonly string[];
  readonly notes: readonly string[];
}

export const requiredRootScripts = [
  "typecheck",
  "test:unit",
  "test:manifest",
  "deploy:check-env",
  "handoff:all",
  "quality:all",
] as const;

export const requiredProjectScripts = ["build", "typecheck", "lint", "test"] as const;

const workspacePackagePattern = /^@inkroute\/[a-z0-9-]+$/;

export function classifyWorkspacePath(path: string): WorkspaceProjectKind {
  if (path === "." || path === "") return "root";
  if (path.startsWith("apps/")) return "app";
  return "package";
}

export function normalizeDependencyMaps(project: WorkspaceProjectManifest): ReadonlySet<string> {
  return new Set([
    ...Object.keys(project.dependencies),
    ...Object.keys(project.devDependencies),
    ...Object.keys(project.peerDependencies),
  ]);
}

export function getWorkspacePackageNameFromSpecifier(specifier: string): string | null {
  const parts = specifier.split("/");
  if (parts[0] !== "@inkroute" || !parts[1]) return null;
  return `${parts[0]}/${parts[1]}`;
}

export function extractWorkspaceImportSpecifiers(sourceText: string): readonly string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'](@inkroute\/[^"']+)["']/g,
    /import\(\s*["'](@inkroute\/[^"']+)["']\s*\)/g,
    /require\(\s*["'](@inkroute\/[^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of sourceText.matchAll(pattern)) {
      const value = match[1];
      if (value) specifiers.add(value);
    }
  }

  return [...specifiers].sort();
}

export function auditWorkspaceDependencies(input: {
  readonly projects: readonly WorkspaceProjectManifest[];
  readonly imports: readonly WorkspaceImportRecord[];
  readonly tsconfigPathAliases: readonly string[];
}): WorkspaceDependencyAuditSummary {
  const findings: WorkspaceDependencyFinding[] = [];
  const packageNames = input.projects.map((project) => project.name).filter((name) => workspacePackagePattern.test(name));
  const aliasRequiredPackageNames = input.projects
    .filter((project) => project.kind === "package" && workspacePackagePattern.test(project.name))
    .map((project) => project.name);
  const packageNameSet = new Set(packageNames);
  const projectByName = new Map(input.projects.map((project) => [project.name, project]));
  const aliasSet = new Set(input.tsconfigPathAliases);

  for (const packageName of aliasRequiredPackageNames) {
    if (!aliasSet.has(packageName)) {
      findings.push({ status: "warn", packageName, message: "Workspace package is missing from tsconfig.base.json paths." });
    }
  }

  for (const project of input.projects) {
    const declared = normalizeDependencyMaps(project);
    for (const dependencyName of declared) {
      if (dependencyName.startsWith("@inkroute/") && !packageNameSet.has(dependencyName)) {
        findings.push({ status: "fail", packageName: project.name, message: `Declared workspace dependency ${dependencyName} does not exist.` });
      }
    }
  }

  for (const record of input.imports) {
    if (!packageNameSet.has(record.importedPackageName)) {
      findings.push({ status: "fail", packageName: record.ownerPackageName, sourcePath: record.sourcePath, message: `Imports missing workspace package ${record.importedPackageName}.` });
      continue;
    }
    if (record.importedPackageName === record.ownerPackageName) continue;
    const owner = projectByName.get(record.ownerPackageName);
    if (!owner) {
      findings.push({ status: "warn", packageName: record.ownerPackageName, sourcePath: record.sourcePath, message: "Import owner is not represented by a package manifest." });
      continue;
    }
    const declared = normalizeDependencyMaps(owner);
    if (!declared.has(record.importedPackageName)) {
      findings.push({ status: "fail", packageName: owner.name, sourcePath: record.sourcePath, message: `Uses ${record.importedPackageName} without declaring it in package.json.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    projectsChecked: input.projects.length,
    workspacePackages: packageNames.sort(),
    importRecords: input.imports,
    findings,
  };
}

export function auditPackageScripts(projects: readonly WorkspaceProjectManifest[]): PackageScriptAuditSummary {
  const findings: PackageScriptFinding[] = [];
  const names = new Set<string>();

  for (const project of projects) {
    if (names.has(project.name)) {
      findings.push({ status: "fail", packageName: project.name, message: "Duplicate package name in workspace." });
    }
    names.add(project.name);

    const required = project.kind === "root" ? requiredRootScripts : requiredProjectScripts;
    for (const script of required) {
      if (!project.scripts[script]) {
        findings.push({ status: project.kind === "root" ? "fail" : "warn", packageName: project.name, message: `Missing ${script} script.` });
      }
    }
    const lint = project.scripts.lint ?? "";
    if (/not configured/i.test(lint)) {
      findings.push({ status: "warn", packageName: project.name, message: "Lint script is an informational placeholder." });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    projectsChecked: projects.length,
    findings,
    requiredRootScripts,
    requiredProjectScripts,
  };
}

export function summarizeRuntimeReadiness(input: {
  readonly hasPnpmLockfile: boolean;
  readonly dependencyAuditStatus: WorkspaceAuditStatus;
  readonly scriptAuditStatus: WorkspaceAuditStatus;
  readonly gapCount: number;
  readonly blockingGapCount: number;
  readonly hasEnvExample: boolean;
  readonly hasCiWorkflow: boolean;
}): RuntimeReadinessSummary {
  const checks: RuntimeReadinessCheck[] = [
    {
      id: "workspace-dependencies",
      title: "Workspace dependency declarations",
      status: input.dependencyAuditStatus,
      evidence: `Static workspace dependency audit returned ${input.dependencyAuditStatus}.`,
      gapIds: ["GAP-001", "GAP-130"],
    },
    {
      id: "package-scripts",
      title: "Package script contract",
      status: input.scriptAuditStatus,
      evidence: `Package script audit returned ${input.scriptAuditStatus}.`,
      gapIds: ["GAP-130", "GAP-132"],
    },
    {
      id: "lockfile",
      title: "Dependency lockfile",
      status: input.hasPnpmLockfile ? "pass" : "fail",
      evidence: input.hasPnpmLockfile ? "pnpm-lock.yaml exists." : "pnpm-lock.yaml is absent in the ChatGPT artifact.",
      gapIds: ["GAP-001"],
    },
    {
      id: "env-template",
      title: "Environment template",
      status: input.hasEnvExample ? "pass" : "fail",
      evidence: input.hasEnvExample ? ".env.example exists." : ".env.example is missing.",
      gapIds: ["GAP-115"],
    },
    {
      id: "ci-workflow",
      title: "CI workflow scaffold",
      status: input.hasCiWorkflow ? "pass" : "warn",
      evidence: input.hasCiWorkflow ? ".github/workflows/ci.yml exists." : "CI workflow file is missing.",
      gapIds: ["GAP-111", "GAP-129"],
    },
    {
      id: "production-blockers",
      title: "Open production blockers",
      status: input.blockingGapCount > 0 ? "fail" : "pass",
      evidence: `${input.blockingGapCount} production-blocking gaps remain across ${input.gapCount} gap rows.`,
      gapIds: ["GAP-001", "GAP-002", "GAP-003", "GAP-014"],
    },
  ];
  const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
  const level: RuntimeReadinessLevel = status === "pass" ? "ready-for-local-install" : input.hasPnpmLockfile ? "needs-attention" : "blocked";

  return {
    level,
    status,
    checks,
    firstExternalCommands: [
      "corepack enable",
      "pnpm install",
      "pnpm workspace:all",
      "pnpm handoff:all",
      "pnpm quality:all",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
    ],
    notes: [
      "This summary is a static pre-install readiness signal, not runtime proof.",
      "Production remains blocked until dependency installation, app builds, provider configuration, database migrations, and legal review have evidence in GAP_TRACKER.md.",
    ],
  };
}
