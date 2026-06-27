#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/workspace/manifests/workspace-toolchain-readiness-contract.json");
const outputPath = join(root, "docs/workspace/manifests/workspace-toolchain-readiness-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const workspacePackage = JSON.parse(readFileSync(join(root, "packages/workspace/package.json"), "utf8"));
const ciWorkflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function includesTerm(value, term) {
  return value.toLowerCase().includes(term.toLowerCase());
}

const findings = [];
const rootScripts = rootPackage.scripts ?? {};
const workspacePackageScripts = workspacePackage.scripts ?? {};

for (const term of contract.requiredFiles ?? []) {
  if (!existsSync(join(root, term))) {
    findings.push({ status: "fail", rule: "required-file", term, message: `Required workspace toolchain file is missing: ${term}.` });
  }
}

for (const term of contract.requiredRootScripts ?? []) {
  if (!rootScripts[term]) {
    findings.push({ status: "fail", rule: "root-script", term, message: `Required root workspace script is missing: ${term}.` });
  }
}

const workspaceAll = rootScripts["workspace:all"] ?? "";
for (const term of contract.requiredWorkspaceAllChain ?? []) {
  if (!workspaceAll.includes(`pnpm ${term}`)) {
    findings.push({ status: "fail", rule: "workspace-all-chain", term, message: `workspace:all does not chain ${term}.` });
  }
}

for (const term of contract.requiredWorkspacePackageScripts ?? []) {
  if (!workspacePackageScripts[term]) {
    findings.push({ status: "fail", rule: "workspace-package-script", term, message: `@inkroute/workspace package script is missing: ${term}.` });
  }
}

for (const term of contract.requiredCiTerms ?? []) {
  if (!includesTerm(ciWorkflow, term)) {
    findings.push({ status: "fail", rule: "ci-term", term, message: `CI workflow is missing workspace toolchain term: ${term}.` });
  }
}

for (const term of contract.requiredGeneratedReports ?? []) {
  if (!existsSync(join(root, term))) {
    findings.push({ status: "warn", rule: "generated-report", term, message: `Workspace generated report is not present yet: ${term}.` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  findings,
  filesChecked: (contract.requiredFiles ?? []).length,
  rootScriptsChecked: (contract.requiredRootScripts ?? []).length,
  workspaceAllTermsChecked: (contract.requiredWorkspaceAllChain ?? []).length,
  workspacePackageScriptsChecked: (contract.requiredWorkspacePackageScripts ?? []).length,
  ciTermsChecked: (contract.requiredCiTerms ?? []).length,
  generatedReportsChecked: (contract.requiredGeneratedReports ?? []).length
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Workspace toolchain readiness audit status: ${report.status}`);
console.log(`Files: ${report.filesChecked}; root scripts: ${report.rootScriptsChecked}; workspace package scripts: ${report.workspacePackageScriptsChecked}; CI terms: ${report.ciTermsChecked}; reports: ${report.generatedReportsChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
