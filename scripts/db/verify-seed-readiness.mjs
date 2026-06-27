#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "packages/db/prisma/seed-readiness.json");
const seedPath = join(root, "packages/db/prisma/seed.ts");
const rootPackagePath = join(root, "package.json");
const dbPackagePath = join(root, "packages/db/package.json");
const outputPath = join(root, "docs/db/manifests/seed-readiness-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const seedText = readFileSync(seedPath, "utf8");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8"));
const dbPackage = JSON.parse(readFileSync(dbPackagePath, "utf8"));

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

const findings = [];
const rootScripts = rootPackage.scripts ?? {};
const dbScripts = dbPackage.scripts ?? {};

for (const scriptName of contract.requiredRootScripts ?? []) {
  if (!rootScripts[scriptName]) {
    findings.push({ status: "fail", rule: "root-script", term: scriptName, message: `Root package script is missing: ${scriptName}.` });
  }
}

for (const scriptName of contract.requiredPackageScripts ?? []) {
  if (!dbScripts[scriptName]) {
    findings.push({ status: "fail", rule: "package-script", term: scriptName, message: `@inkroute/db package script is missing: ${scriptName}.` });
  }
}

for (const marker of contract.requiredSeedMarkers ?? []) {
  if (!seedText.includes(marker)) {
    findings.push({ status: "fail", rule: "seed-marker", term: marker, message: `Seed file is missing required demo/safety marker: ${marker}.` });
  }
}

for (const modelName of contract.requiredModelWrites ?? []) {
  const token = `prisma.${modelName}.`;
  if (!seedText.includes(token)) {
    findings.push({ status: "fail", rule: "model-write", term: modelName, message: `Seed file does not write expected model via ${token}.` });
  }
}

for (const pattern of contract.forbiddenProductionPatterns ?? []) {
  if (seedText.includes(pattern)) {
    findings.push({ status: "fail", rule: "forbidden-pattern", term: pattern, message: `Seed file contains forbidden production-looking pattern: ${pattern}.` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  findings,
  rootScriptsChecked: (contract.requiredRootScripts ?? []).length,
  packageScriptsChecked: (contract.requiredPackageScripts ?? []).length,
  seedMarkersChecked: (contract.requiredSeedMarkers ?? []).length,
  modelWritesChecked: (contract.requiredModelWrites ?? []).length,
  forbiddenPatternsChecked: (contract.forbiddenProductionPatterns ?? []).length,
  requiredExecutionEvidence: contract.requiredExecutionEvidence ?? []
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Seed readiness audit status: ${report.status}`);
console.log(`Scripts: ${report.rootScriptsChecked + report.packageScriptsChecked}; markers: ${report.seedMarkersChecked}; model writes: ${report.modelWritesChecked}; forbidden patterns: ${report.forbiddenPatternsChecked}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
