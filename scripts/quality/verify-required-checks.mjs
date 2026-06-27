#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/quality/manifests/required-checks-contract.json");
const outputPath = join(root, "docs/quality/manifests/required-checks-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const ciWorkflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function includesTerm(text, term) {
  return text.toLowerCase().includes(term.toLowerCase());
}

const findings = [];
const scripts = packageJson.scripts ?? {};
const packageScriptsChecked = [];
for (const scriptName of contract.requiredPackageScripts ?? []) {
  const present = typeof scripts[scriptName] === "string" && scripts[scriptName].length > 0;
  packageScriptsChecked.push({ scriptName, present, command: scripts[scriptName] ?? null });
  if (!present) {
    findings.push({ status: "fail", rule: "package-script", scriptName, message: `Required package script is missing: ${scriptName}.` });
  }
}

const workflowTermsChecked = [];
for (const term of contract.requiredWorkflowTerms ?? []) {
  const present = includesTerm(ciWorkflow, term);
  workflowTermsChecked.push({ term, present });
  if (!present) {
    findings.push({ status: "fail", rule: "workflow-term", term, message: `CI workflow is missing required check term: ${term}.` });
  }
}

const qualityAll = scripts["quality:all"] ?? "";
for (const scriptName of ["quality:docs", "quality:gaps", "quality:pr-gap-fixtures", "quality:governance", "quality:gates"]) {
  if (!qualityAll.includes(`pnpm ${scriptName}`)) {
    findings.push({ status: "fail", rule: "quality-all-chain", scriptName, message: `quality:all does not chain ${scriptName}.` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
  branch: contract.branch,
  findings,
  packageScriptsChecked,
  workflowTermsChecked,
  requiredBranchProtectionChecks: contract.requiredBranchProtectionChecks ?? [],
  requiredRepositorySettings: contract.requiredRepositorySettings ?? []
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Required checks audit status: ${report.status}`);
console.log(`Package scripts: ${packageScriptsChecked.length}; workflow terms: ${workflowTermsChecked.length}; branch protection checks: ${report.requiredBranchProtectionChecks.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
