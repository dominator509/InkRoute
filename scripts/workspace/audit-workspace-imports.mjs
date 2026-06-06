#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/workspace/manifests/workspace-import-audit.json");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".expo"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const absolute = join(dir, name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) files.push(...walk(absolute));
    if (stat.isFile()) files.push(absolute);
  }
  return files;
}

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function listProjectManifests() {
  const manifestPaths = [join(root, "package.json")];
  for (const base of ["apps", "packages"]) {
    const basePath = join(root, base);
    if (!existsSync(basePath)) continue;
    for (const name of readdirSync(basePath)) {
      const manifestPath = join(basePath, name, "package.json");
      if (existsSync(manifestPath)) manifestPaths.push(manifestPath);
    }
  }
  return manifestPaths.map((manifestPath) => {
    const data = readJson(manifestPath);
    const repoPath = toRepoPath(dirname(manifestPath));
    return {
      name: data.name ?? repoPath,
      path: repoPath === "" ? "." : repoPath,
      kind: repoPath === "" ? "root" : repoPath.startsWith("apps/") ? "app" : "package",
      private: Boolean(data.private),
      scripts: data.scripts ?? {},
      dependencies: data.dependencies ?? {},
      devDependencies: data.devDependencies ?? {},
      peerDependencies: data.peerDependencies ?? {},
    };
  });
}

function extractImportSpecifiers(sourceText) {
  const specifiers = new Set();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^"'`]*?\s+from\s+)?["'](@inkroute\/[^"']+)["']/g,
    /import\(\s*["'](@inkroute\/[^"']+)["']\s*\)/g,
    /require\(\s*["'](@inkroute\/[^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of sourceText.matchAll(pattern)) {
      if (match[1]) specifiers.add(match[1]);
    }
  }
  return [...specifiers].sort();
}

function workspacePackageNameFromSpecifier(specifier) {
  const parts = specifier.split("/");
  if (parts[0] !== "@inkroute" || !parts[1]) return null;
  return `${parts[0]}/${parts[1]}`;
}

function ownerForFile(projects, absolutePath) {
  const repoPath = toRepoPath(absolutePath);
  const candidates = projects
    .filter((project) => project.kind !== "root" && repoPath.startsWith(`${project.path}/`))
    .sort((a, b) => b.path.length - a.path.length);
  return candidates[0] ?? null;
}

function declaredDependencies(project) {
  return new Set([
    ...Object.keys(project.dependencies),
    ...Object.keys(project.devDependencies),
    ...Object.keys(project.peerDependencies),
  ]);
}

function readTsconfigPathAliases() {
  const tsconfigPath = join(root, "tsconfig.base.json");
  if (!existsSync(tsconfigPath)) return [];
  const tsconfig = readJson(tsconfigPath);
  return Object.keys(tsconfig.compilerOptions?.paths ?? {}).filter((name) => name.startsWith("@inkroute/"));
}

const projects = listProjectManifests();
const workspacePackages = projects.map((project) => project.name).filter((name) => name.startsWith("@inkroute/"));
const aliasRequiredWorkspacePackages = projects
  .filter((project) => project.kind === "package" && project.name.startsWith("@inkroute/"))
  .map((project) => project.name);
const workspacePackageSet = new Set(workspacePackages);
const tsconfigAliases = readTsconfigPathAliases();
const tsconfigAliasSet = new Set(tsconfigAliases);
const findings = [];
const importRecords = [];

for (const workspacePackage of aliasRequiredWorkspacePackages) {
  if (!tsconfigAliasSet.has(workspacePackage)) {
    findings.push({ status: "warn", packageName: workspacePackage, message: "Workspace package is missing from tsconfig.base.json paths." });
  }
}

for (const project of projects) {
  for (const dependencyName of declaredDependencies(project)) {
    if (dependencyName.startsWith("@inkroute/") && !workspacePackageSet.has(dependencyName)) {
      findings.push({ status: "fail", packageName: project.name, message: `Declared workspace dependency ${dependencyName} does not exist.` });
    }
  }
}

const sourceFiles = walk(root).filter((file) => {
  const dotIndex = file.lastIndexOf(".");
  const extension = dotIndex >= 0 ? file.slice(dotIndex) : "";
  return sourceExtensions.has(extension);
});

for (const file of sourceFiles) {
  const owner = ownerForFile(projects, file);
  if (!owner) continue;
  const sourcePath = toRepoPath(file);
  const sourceText = readFileSync(file, "utf8");
  for (const importSpecifier of extractImportSpecifiers(sourceText)) {
    const importedPackageName = workspacePackageNameFromSpecifier(importSpecifier);
    if (!importedPackageName) continue;
    importRecords.push({ sourcePath, ownerPackageName: owner.name, importedPackageName, importSpecifier });
    if (!workspacePackageSet.has(importedPackageName)) {
      findings.push({ status: "fail", packageName: owner.name, sourcePath, message: `Imports missing workspace package ${importedPackageName}.` });
      continue;
    }
    if (importedPackageName === owner.name) continue;
    if (!declaredDependencies(owner).has(importedPackageName)) {
      findings.push({ status: "fail", packageName: owner.name, sourcePath, message: `Uses ${importedPackageName} without declaring it in package.json.` });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 18 workspace runtime readiness",
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  projectsChecked: projects.length,
  sourceFilesChecked: sourceFiles.length,
  workspacePackages: workspacePackages.sort(),
  tsconfigAliases: tsconfigAliases.sort(),
  importRecords,
  findings,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Workspace import audit status: ${report.status}`);
console.log(`Projects: ${report.projectsChecked}; source files: ${report.sourceFilesChecked}; imports: ${report.importRecords.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
