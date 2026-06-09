#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/workspace/manifests/runtime-evidence-contract.json");
const evidencePath = join(root, "docs/workspace/manifests/runtime-evidence.json");
const outputPath = join(root, "docs/workspace/manifests/runtime-evidence-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

const findings = [];
const recordsById = new Map((evidence.records ?? []).map((record) => [record.id, record]));
const missingRequiredEvidence = [];

for (const requirement of contract.requirements ?? []) {
  const record = recordsById.get(requirement.id);
  if (!record) {
    const status = requirement.requiredForProduction ? "fail" : "warn";
    findings.push({ status, id: requirement.id, message: `Runtime evidence is missing for ${requirement.command}.` });
    if (requirement.requiredForProduction) missingRequiredEvidence.push(requirement.id);
    continue;
  }

  if (record.status !== "passed") {
    const status = requirement.requiredForProduction ? "fail" : "warn";
    findings.push({ status, id: requirement.id, message: `Runtime evidence for ${requirement.command} is ${record.status}.` });
    if (requirement.requiredForProduction) missingRequiredEvidence.push(requirement.id);
    continue;
  }

  if (!record.evidence || String(record.evidence).length < 10) {
    findings.push({ status: "warn", id: requirement.id, message: `Runtime evidence for ${requirement.command} lacks a useful evidence label.` });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  requirementsChecked: (contract.requirements ?? []).length,
  missingRequiredEvidence,
  findings
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Runtime evidence audit status: ${report.status}`);
console.log(`Requirements: ${report.requirementsChecked}; missing required evidence: ${report.missingRequiredEvidence.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
