#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/workspace/manifests/workspace-required-checks-contract.json");
const outputPath = join(root, "docs/workspace/manifests/workspace-required-checks-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const ciWorkflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

function includesTerm(value, term) {
  return value.toLowerCase().includes(term.toLowerCase());
}

const rootScripts = packageJson.scripts ?? {};
const findings = [];

for (const term of contract.requiredRootScripts ?? []) {
  if (!rootScripts[term]) {
    findings.push({ status: "fail", rule: "root-script", term, message: `Required root workspace enforcement script is missing: ${term}.` });
  }
}

const workspaceAll = rootScripts["workspace:all"] ?? "";
for (const term of contract.requiredWorkspaceAllChain ?? []) {
  if (!workspaceAll.includes(`pnpm ${term}`)) {
    findings.push({ status: "fail", rule: "workspace-all-chain", term, message: `workspace:all does not chain ${term}.` });
  }
}

for (const term of contract.requiredCiTerms ?? []) {
  if (!includesTerm(ciWorkflow, term)) {
    findings.push({ status: "fail", rule: "ci-term", term, message: `CI workflow is missing workspace required term: ${term}.` });
  }
}

for (const term of contract.requiredPrEnforcementTerms ?? []) {
  const inCi = includesTerm(ciWorkflow, term);
  const inScripts = Object.values(rootScripts).some((script) => includesTerm(String(script), term));
  if (!inCi && !inScripts) {
    findings.push({ status: "fail", rule: "pr-enforcement-term", term, message: `Workspace PR enforcement term is missing from CI/package scripts: ${term}.` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : "pass",
  findings,
  rootScriptsChecked: (contract.requiredRootScripts ?? []).length,
  workspaceAllTermsChecked: (contract.requiredWorkspaceAllChain ?? []).length,
  ciTermsChecked: (contract.requiredCiTerms ?? []).length,
  prEnforcementTermsChecked: (contract.requiredPrEnforcementTerms ?? []).length,
  requiredBranchProtectionChecks: contract.requiredBranchProtectionChecks ?? [],
  externalSettingsStillRequired: contract.externalSettingsStillRequired ?? []
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Workspace required checks audit status: ${report.status}`);
console.log(`Root scripts: ${report.rootScriptsChecked}; workspace:all terms: ${report.workspaceAllTermsChecked}; CI terms: ${report.ciTermsChecked}; PR enforcement terms: ${report.prEnforcementTermsChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
