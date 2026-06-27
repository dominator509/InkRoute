#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/quality/manifests/documentation-inventory-contract.json");
const outputPath = join(root, "docs/quality/manifests/documentation-inventory-audit.json");
const ignoredDirs = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage", ".claude", ".serena"]);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function listWorkspaceMembers(folderName) {
  const folder = join(root, folderName);
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .map((name) => join(folder, name))
    .filter((absolute) => statSync(absolute).isDirectory())
    .map(toRepoPath)
    .sort();
}

function walkMarkdown(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name)) continue;
    const absolute = join(dir, name);
    const stat = statSync(absolute);
    if (stat.isDirectory()) entries.push(...walkMarkdown(absolute));
    if (stat.isFile() && absolute.endsWith(".md")) entries.push(absolute);
  }
  return entries;
}

function extractWorkspaceRootReferences(markdown) {
  const references = [];
  const regex = /`((?:apps|packages)\/[^`/\s]+)(?:\/[^`\s]*)?`/g;
  for (const match of markdown.matchAll(regex)) {
    const reference = match[1] ?? "";
    if (contract.documentationRules?.ignoredExamples?.includes(reference)) continue;
    references.push(reference);
  }
  return references;
}

const actualApps = listWorkspaceMembers("apps");
const actualPackages = listWorkspaceMembers("packages");
const contractApps = [...(contract.apps ?? [])].sort();
const contractPackages = [...(contract.packages ?? [])].sort();
const validMembers = new Set([...contractApps, ...contractPackages]);
const findings = [];

for (const app of contractApps) {
  if (!actualApps.includes(app)) {
    findings.push({ status: "fail", rule: "contract-app-missing", path: app, message: `Contract app is not present in apps/: ${app}.` });
  }
}

for (const app of actualApps) {
  if (!contractApps.includes(app)) {
    findings.push({ status: "fail", rule: "actual-app-undocumented", path: app, message: `Actual app is missing from documentation inventory contract: ${app}.` });
  }
}

for (const packagePath of contractPackages) {
  if (!actualPackages.includes(packagePath)) {
    findings.push({ status: "fail", rule: "contract-package-missing", path: packagePath, message: `Contract package is not present in packages/: ${packagePath}.` });
  }
}

for (const packagePath of actualPackages) {
  if (!contractPackages.includes(packagePath)) {
    findings.push({ status: "fail", rule: "actual-package-undocumented", path: packagePath, message: `Actual package is missing from documentation inventory contract: ${packagePath}.` });
  }
}

const documentedWorkspaceRootsChecked = [];
for (const markdownFile of walkMarkdown(root)) {
  const sourcePath = toRepoPath(markdownFile);
  const text = readFileSync(markdownFile, "utf8");
  for (const reference of extractWorkspaceRootReferences(text)) {
    documentedWorkspaceRootsChecked.push({ sourcePath, reference });
    if (!validMembers.has(reference)) {
      findings.push({ status: "fail", rule: "documented-workspace-root", sourcePath, reference, message: `Documented workspace root is not declared in the app/package inventory: ${reference}.` });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
  findings,
  contractApps,
  actualApps,
  contractPackages,
  actualPackages,
  documentedWorkspaceRootsChecked
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Documentation inventory audit status: ${report.status}`);
console.log(`Apps: ${actualApps.length}; packages: ${actualPackages.length}; documented roots checked: ${documentedWorkspaceRootsChecked.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
