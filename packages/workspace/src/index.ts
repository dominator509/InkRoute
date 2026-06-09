export type WorkspaceAuditStatus = "pass" | "warn" | "fail";
export type WorkspaceProjectKind = "app" | "package" | "root";
export type RuntimeReadinessLevel = "ready-for-local-install" | "blocked" | "needs-attention";

export interface WorkspaceProjectManifest {
  readonly name: string;
  readonly path: string;
  readonly kind: WorkspaceProjectKind;
  readonly private: boolean;
  readonly main?: string;
  readonly types?: string;
  readonly exports?: unknown;
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

export interface ExternalImportRecord {
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

export interface PackageEntrypointFinding {
  readonly status: WorkspaceAuditStatus;
  readonly packageName: string;
  readonly message: string;
}

export interface PackageEntrypointAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly packagesChecked: number;
  readonly findings: readonly PackageEntrypointFinding[];
}

export interface WorkspaceDependencyAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly projectsChecked: number;
  readonly workspacePackages: readonly string[];
  readonly importRecords: readonly WorkspaceImportRecord[];
  readonly externalImportRecords?: readonly ExternalImportRecord[];
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

export interface RuntimeEvidenceRequirement {
  readonly id: string;
  readonly command: string;
  readonly gapIds: readonly string[];
  readonly requiredForProduction: boolean;
}

export interface RuntimeEvidenceRecord {
  readonly id: string;
  readonly status: "missing" | "planned" | "passed" | "failed" | "blocked";
  readonly evidence?: string;
}

export interface RuntimeEvidenceFinding {
  readonly status: WorkspaceAuditStatus;
  readonly id: string;
  readonly message: string;
}

export interface RuntimeEvidenceAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly requirementsChecked: number;
  readonly missingRequiredEvidence: readonly string[];
  readonly findings: readonly RuntimeEvidenceFinding[];
}

export interface WorkspaceRequiredChecksContract {
  readonly requiredRootScripts: readonly string[];
  readonly requiredWorkspaceAllChain: readonly string[];
  readonly requiredCiTerms: readonly string[];
  readonly requiredPrEnforcementTerms: readonly string[];
  readonly requiredBranchProtectionChecks: readonly string[];
  readonly externalSettingsStillRequired: readonly string[];
}

export interface WorkspaceRequiredChecksInput {
  readonly rootScripts: Readonly<Record<string, string>>;
  readonly ciWorkflow: string;
}

export interface WorkspaceRequiredChecksFinding {
  readonly status: WorkspaceAuditStatus;
  readonly rule: "root-script" | "workspace-all-chain" | "ci-term" | "pr-enforcement-term";
  readonly term: string;
  readonly message: string;
}

export interface WorkspaceRequiredChecksAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly findings: readonly WorkspaceRequiredChecksFinding[];
  readonly rootScriptsChecked: number;
  readonly workspaceAllTermsChecked: number;
  readonly ciTermsChecked: number;
  readonly prEnforcementTermsChecked: number;
  readonly requiredBranchProtectionChecks: readonly string[];
  readonly externalSettingsStillRequired: readonly string[];
}

export interface WorkspaceToolchainContract {
  readonly requiredFiles: readonly string[];
  readonly requiredRootScripts: readonly string[];
  readonly requiredWorkspaceAllChain: readonly string[];
  readonly requiredWorkspacePackageScripts: readonly string[];
  readonly requiredCiTerms: readonly string[];
  readonly requiredGeneratedReports: readonly string[];
}

export interface WorkspaceToolchainInput {
  readonly existingPaths: ReadonlySet<string>;
  readonly rootScripts: Readonly<Record<string, string>>;
  readonly workspacePackageScripts: Readonly<Record<string, string>>;
  readonly ciWorkflow: string;
}

export interface WorkspaceToolchainFinding {
  readonly status: WorkspaceAuditStatus;
  readonly rule: "required-file" | "root-script" | "workspace-all-chain" | "workspace-package-script" | "ci-term" | "generated-report";
  readonly term: string;
  readonly message: string;
}

export interface WorkspaceToolchainAuditSummary {
  readonly status: WorkspaceAuditStatus;
  readonly findings: readonly WorkspaceToolchainFinding[];
  readonly filesChecked: number;
  readonly rootScriptsChecked: number;
  readonly workspaceAllTermsChecked: number;
  readonly workspacePackageScriptsChecked: number;
  readonly ciTermsChecked: number;
  readonly generatedReportsChecked: number;
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

export function getExternalPackageNameFromSpecifier(specifier: string): string | null {
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("#") ||
    specifier.startsWith("@inkroute/") ||
    /^[a-z]+:/.test(specifier)
  ) {
    return null;
  }
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return parts[0] ?? null;
}

export function extractImportSpecifiers(sourceText: string): readonly string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of sourceText.matchAll(pattern)) {
      const value = match[1];
      if (value) specifiers.add(value);
    }
  }

  return [...specifiers].sort();
}

export function extractWorkspaceImportSpecifiers(sourceText: string): readonly string[] {
  return extractImportSpecifiers(sourceText).filter((specifier) => specifier.startsWith("@inkroute/"));
}

export function auditWorkspaceDependencies(input: {
  readonly projects: readonly WorkspaceProjectManifest[];
  readonly imports: readonly WorkspaceImportRecord[];
  readonly externalImports?: readonly ExternalImportRecord[];
  readonly tsconfigPathAliases: readonly string[];
  readonly builtInPackages?: ReadonlySet<string>;
  readonly rootDevDependencies?: ReadonlySet<string>;
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

  for (const record of input.externalImports ?? []) {
    if (input.builtInPackages?.has(record.importedPackageName)) {
      continue;
    }
    const owner = projectByName.get(record.ownerPackageName);
    if (!owner) {
      findings.push({ status: "warn", packageName: record.ownerPackageName, sourcePath: record.sourcePath, message: "External import owner is not represented by a package manifest." });
      continue;
    }
    const declared = normalizeDependencyMaps(owner);
    if (!declared.has(record.importedPackageName) && !input.rootDevDependencies?.has(record.importedPackageName)) {
      findings.push({ status: "fail", packageName: owner.name, sourcePath: record.sourcePath, message: `Uses external package ${record.importedPackageName} without declaring it in package.json.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    projectsChecked: input.projects.length,
    workspacePackages: packageNames.sort(),
    importRecords: input.imports,
    externalImportRecords: input.externalImports,
    findings,
  };
}

function normalizeManifestPath(value: string): string {
  return value.replace(/^\.\//, "").replace(/\\/g, "/");
}

function manifestTargetPath(project: WorkspaceProjectManifest, value: string): string {
  return `${project.path}/${normalizeManifestPath(value)}`.replace(/\/+/g, "/");
}

function collectExportTargets(exportsField: unknown): readonly string[] {
  const targets: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") {
      targets.push(value);
      return;
    }
    if (value && typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        visit(nested);
      }
    }
  };
  visit(exportsField);
  return targets;
}

export function auditPackageEntrypoints(projects: readonly WorkspaceProjectManifest[], existingRepoPaths: ReadonlySet<string>): PackageEntrypointAuditSummary {
  const findings: PackageEntrypointFinding[] = [];
  const packages = projects.filter((project) => project.kind === "package" && workspacePackagePattern.test(project.name));

  for (const project of packages) {
    const sourceIndex = `${project.path}/src/index.ts`;
    if (!existingRepoPaths.has(sourceIndex)) {
      findings.push({ status: "fail", packageName: project.name, message: `Missing source entrypoint ${sourceIndex}.` });
    }

    for (const field of ["main", "types"] as const) {
      const value = project[field];
      if (!value) {
        findings.push({ status: "warn", packageName: project.name, message: `Package manifest is missing ${field}.` });
        continue;
      }
      const target = manifestTargetPath(project, value);
      if (!existingRepoPaths.has(target)) {
        findings.push({ status: "fail", packageName: project.name, message: `Package ${field} target does not exist: ${target}.` });
      }
    }

    for (const targetValue of collectExportTargets(project.exports)) {
      const target = manifestTargetPath(project, targetValue);
      if (!existingRepoPaths.has(target)) {
        findings.push({ status: "fail", packageName: project.name, message: `Package exports target does not exist: ${target}.` });
      }
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    packagesChecked: packages.length,
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

export function auditRuntimeEvidence(
  requirements: readonly RuntimeEvidenceRequirement[],
  records: readonly RuntimeEvidenceRecord[],
): RuntimeEvidenceAuditSummary {
  const findings: RuntimeEvidenceFinding[] = [];
  const byId = new Map(records.map((record) => [record.id, record]));
  const missingRequiredEvidence: string[] = [];

  for (const requirement of requirements) {
    const record = byId.get(requirement.id);
    if (!record) {
      const message = `Runtime evidence is missing for ${requirement.command}.`;
      findings.push({ status: requirement.requiredForProduction ? "fail" : "warn", id: requirement.id, message });
      if (requirement.requiredForProduction) missingRequiredEvidence.push(requirement.id);
      continue;
    }

    if (record.status !== "passed") {
      const message = `Runtime evidence for ${requirement.command} is ${record.status}.`;
      findings.push({ status: requirement.requiredForProduction ? "fail" : "warn", id: requirement.id, message });
      if (requirement.requiredForProduction) missingRequiredEvidence.push(requirement.id);
      continue;
    }

    if (!record.evidence || record.evidence.length < 10) {
      findings.push({ status: "warn", id: requirement.id, message: `Runtime evidence for ${requirement.command} lacks a useful evidence label.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    requirementsChecked: requirements.length,
    missingRequiredEvidence,
    findings,
  };
}

function includesTerm(value: string, term: string): boolean {
  return value.toLowerCase().includes(term.toLowerCase());
}

export function auditWorkspaceRequiredChecks(
  contract: WorkspaceRequiredChecksContract,
  input: WorkspaceRequiredChecksInput,
): WorkspaceRequiredChecksAuditSummary {
  const findings: WorkspaceRequiredChecksFinding[] = [];

  for (const term of contract.requiredRootScripts) {
    if (!input.rootScripts[term]) {
      findings.push({ status: "fail", rule: "root-script", term, message: `Required root workspace script is missing: ${term}.` });
    }
  }

  const workspaceAll = input.rootScripts["workspace:all"] ?? "";
  for (const term of contract.requiredWorkspaceAllChain) {
    if (!workspaceAll.includes(`pnpm ${term}`)) {
      findings.push({ status: "fail", rule: "workspace-all-chain", term, message: `workspace:all does not chain ${term}.` });
    }
  }

  for (const term of contract.requiredCiTerms) {
    if (!includesTerm(input.ciWorkflow, term)) {
      findings.push({ status: "fail", rule: "ci-term", term, message: `CI workflow is missing workspace required term: ${term}.` });
    }
  }

  for (const term of contract.requiredPrEnforcementTerms) {
    if (!includesTerm(input.ciWorkflow, term) && !Object.values(input.rootScripts).some((script) => includesTerm(script, term))) {
      findings.push({ status: "fail", rule: "pr-enforcement-term", term, message: `Workspace PR enforcement term is missing from CI/package scripts: ${term}.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    findings,
    rootScriptsChecked: contract.requiredRootScripts.length,
    workspaceAllTermsChecked: contract.requiredWorkspaceAllChain.length,
    ciTermsChecked: contract.requiredCiTerms.length,
    prEnforcementTermsChecked: contract.requiredPrEnforcementTerms.length,
    requiredBranchProtectionChecks: contract.requiredBranchProtectionChecks,
    externalSettingsStillRequired: contract.externalSettingsStillRequired,
  };
}

export function auditWorkspaceToolchainReadiness(
  contract: WorkspaceToolchainContract,
  input: WorkspaceToolchainInput,
): WorkspaceToolchainAuditSummary {
  const findings: WorkspaceToolchainFinding[] = [];

  for (const term of contract.requiredFiles) {
    if (!input.existingPaths.has(term)) {
      findings.push({ status: "fail", rule: "required-file", term, message: `Required workspace toolchain file is missing: ${term}.` });
    }
  }

  for (const term of contract.requiredRootScripts) {
    if (!input.rootScripts[term]) {
      findings.push({ status: "fail", rule: "root-script", term, message: `Required root workspace script is missing: ${term}.` });
    }
  }

  const workspaceAll = input.rootScripts["workspace:all"] ?? "";
  for (const term of contract.requiredWorkspaceAllChain) {
    if (!workspaceAll.includes(`pnpm ${term}`)) {
      findings.push({ status: "fail", rule: "workspace-all-chain", term, message: `workspace:all does not chain ${term}.` });
    }
  }

  for (const term of contract.requiredWorkspacePackageScripts) {
    if (!input.workspacePackageScripts[term]) {
      findings.push({ status: "fail", rule: "workspace-package-script", term, message: `@inkroute/workspace package script is missing: ${term}.` });
    }
  }

  for (const term of contract.requiredCiTerms) {
    if (!includesTerm(input.ciWorkflow, term)) {
      findings.push({ status: "fail", rule: "ci-term", term, message: `CI workflow is missing workspace toolchain term: ${term}.` });
    }
  }

  for (const term of contract.requiredGeneratedReports) {
    if (!input.existingPaths.has(term)) {
      findings.push({ status: "warn", rule: "generated-report", term, message: `Workspace generated report is not present yet: ${term}.` });
    }
  }

  const status = findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass";
  return {
    status,
    findings,
    filesChecked: contract.requiredFiles.length,
    rootScriptsChecked: contract.requiredRootScripts.length,
    workspaceAllTermsChecked: contract.requiredWorkspaceAllChain.length,
    workspacePackageScriptsChecked: contract.requiredWorkspacePackageScripts.length,
    ciTermsChecked: contract.requiredCiTerms.length,
    generatedReportsChecked: contract.requiredGeneratedReports.length,
  };
}

export interface WorkspaceRuntimeToolchainReadinessInput {
  readonly toolchainAuditStatus: WorkspaceAuditStatus;
  readonly packageTypecheckPassed: boolean;
  readonly packageTestsPassed: boolean;
  readonly workspaceToolchainPassed: boolean;
  readonly workspaceAllPassed: boolean;
  readonly generatedReports: readonly string[];
  readonly requiredGeneratedReports: readonly string[];
  readonly ciWorkspaceJobPassed: boolean;
  readonly ciEvidenceCaptured: boolean;
  readonly dependencyInstallEvidenceCaptured: boolean;
  readonly appBuildEvidenceCaptured: boolean;
  readonly productionBlockersVisible: boolean;
}

export interface WorkspaceRuntimeToolchainReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingGeneratedReports: readonly string[];
  readonly requiredCommands: readonly string[];
  readonly requiredEvidence: readonly string[];
  readonly blockers: readonly string[];
}

export function buildWorkspaceRuntimeToolchainReadinessPlan(
  input: WorkspaceRuntimeToolchainReadinessInput,
): WorkspaceRuntimeToolchainReadinessPlan {
  const generatedReportSet = new Set(input.generatedReports);
  const missingGeneratedReports = input.requiredGeneratedReports.filter((report) => !generatedReportSet.has(report));
  const blockers: string[] = [];

  if (input.toolchainAuditStatus !== "pass") {
    blockers.push("Workspace toolchain audit must pass before runtime readiness can be claimed.");
  }
  if (!input.packageTypecheckPassed) {
    blockers.push("@inkroute/workspace typecheck must pass.");
  }
  if (!input.packageTestsPassed) {
    blockers.push("@inkroute/workspace tests must pass.");
  }
  if (!input.workspaceToolchainPassed) {
    blockers.push("pnpm workspace:toolchain must pass.");
  }
  if (!input.workspaceAllPassed) {
    blockers.push("pnpm workspace:all must pass.");
  }
  if (missingGeneratedReports.length > 0) {
    blockers.push("Workspace generated reports must be present for imports, scripts, runtime evidence, runtime readiness, required checks, and toolchain readiness.");
  }
  if (!input.ciWorkspaceJobPassed) {
    blockers.push("GitHub Actions Phase 18 workspace runtime readiness job must pass.");
  }
  if (!input.ciEvidenceCaptured) {
    blockers.push("CI evidence for workspace runtime readiness must be captured.");
  }
  if (!input.dependencyInstallEvidenceCaptured) {
    blockers.push("Dependency install evidence must be captured before runtime readiness is more than static pre-install signal.");
  }
  if (!input.appBuildEvidenceCaptured) {
    blockers.push("Web and dashboard app build evidence must be captured before runtime readiness can support launch readiness.");
  }
  if (!input.productionBlockersVisible) {
    blockers.push("Runtime readiness reports must keep production blockers visible.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingGeneratedReports,
    requiredCommands: [
      "pnpm --filter @inkroute/workspace typecheck",
      "pnpm --filter @inkroute/workspace test",
      "pnpm workspace:toolchain",
      "pnpm workspace:all",
      "pnpm install",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "GitHub Actions Phase 18 workspace runtime readiness job",
    ],
    requiredEvidence: [
      "@inkroute/workspace package typecheck and test output.",
      "workspace:toolchain and workspace:all output.",
      "Generated workspace import, package-script, runtime-evidence, runtime-readiness, required-checks, and toolchain-readiness reports.",
      "Dependency install evidence and CI workspace job evidence.",
      "Web/dashboard build evidence before launch readiness claims.",
      "Runtime readiness report showing production blockers remain visible.",
    ],
    blockers,
  };
}
