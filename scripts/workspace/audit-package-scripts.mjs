#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/workspace/manifests/package-script-audit.json");
const requiredRootScripts = ["typecheck", "test:unit", "test:manifest", "deploy:check-env", "handoff:all", "quality:all", "workspace:all"];
const requiredProjectScripts = ["build", "typecheck", "lint", "test"];

function toRepoPath(path) {
  return relative(root, path).split("\\").join("/");
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
      packageManager: data.packageManager ?? null,
      engines: data.engines ?? {},
      scripts: data.scripts ?? {},
    };
  });
}

const projects = listProjectManifests();
const findings = [];
const names = new Set();
for (const project of projects) {
  if (names.has(project.name)) {
    findings.push({ status: "fail", packageName: project.name, message: "Duplicate package name in workspace." });
  }
  names.add(project.name);
  const requiredScripts = project.kind === "root" ? requiredRootScripts : requiredProjectScripts;
  for (const script of requiredScripts) {
    if (!project.scripts[script]) {
      findings.push({ status: project.kind === "root" ? "fail" : "warn", packageName: project.name, message: `Missing ${script} script.` });
    }
  }
  if (project.kind === "root") {
    if (!String(project.packageManager ?? "").startsWith("pnpm@")) {
      findings.push({ status: "fail", packageName: project.name, message: "Root packageManager must pin pnpm." });
    }
    if (!String(project.engines?.node ?? "").includes(">=20")) {
      findings.push({ status: "warn", packageName: project.name, message: "Root Node engine should require Node 20 or newer." });
    }
  }
  if (/not configured/i.test(project.scripts.lint ?? "")) {
    findings.push({ status: "warn", packageName: project.name, message: "Lint script is an informational placeholder." });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 18 workspace runtime readiness",
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  projectsChecked: projects.length,
  requiredRootScripts,
  requiredProjectScripts,
  projects,
  findings,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Package script audit status: ${report.status}`);
console.log(`Projects: ${report.projectsChecked}; findings: ${report.findings.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
