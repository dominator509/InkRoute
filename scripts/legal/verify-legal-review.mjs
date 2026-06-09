#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const contractPath = join(root, "docs/legal/manifests/legal-review-contract.json");
const evidencePath = join(root, "docs/legal/manifests/legal-review-evidence.json");
const outputPath = join(root, "docs/legal/manifests/legal-review-audit.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

function toRepoPath(absolutePath) {
  return relative(root, absolutePath).split("\\").join("/");
}

const allowedStatuses = new Set(contract.allowedStatuses ?? []);
const evidenceById = new Map((evidence.items ?? []).map((item) => [item.id, item]));
const findings = [];
const approvedItems = [];
const missingOrUnapprovedItems = [];

for (const item of contract.requiredReviewItems ?? []) {
  for (const artifact of item.requiredArtifacts ?? []) {
    if (!existsSync(join(root, artifact))) {
      findings.push({ status: "fail", id: item.id, artifact, message: `Required legal review artifact is missing: ${artifact}.` });
    }
  }

  const record = evidenceById.get(item.id);
  if (!record) {
    findings.push({ status: "fail", id: item.id, message: `Legal review evidence record is missing for ${item.id}.` });
    missingOrUnapprovedItems.push(item.id);
    continue;
  }

  if (!allowedStatuses.has(record.status)) {
    findings.push({ status: "fail", id: item.id, message: `Unsupported legal review status: ${record.status}.` });
    missingOrUnapprovedItems.push(item.id);
    continue;
  }

  if (record.status !== contract.productionReadyStatus) {
    findings.push({ status: "fail", id: item.id, message: `Legal review item ${item.id} is ${record.status}, not ${contract.productionReadyStatus}.` });
    missingOrUnapprovedItems.push(item.id);
    continue;
  }

  if (!record.evidenceLabel || String(record.evidenceLabel).length < 10) {
    findings.push({ status: "warn", id: item.id, message: `Approved legal review item ${item.id} lacks a useful redacted evidence label.` });
  }
  approvedItems.push(item.id);
}

const report = {
  generatedAt: new Date().toISOString(),
  source: contract.source,
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  itemsChecked: (contract.requiredReviewItems ?? []).length,
  approvedItems,
  missingOrUnapprovedItems,
  findings
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Legal review audit status: ${report.status}`);
console.log(`Items: ${report.itemsChecked}; approved: ${report.approvedItems.length}; missing/unapproved: ${report.missingOrUnapprovedItems.length}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
if (report.status === "fail") process.exitCode = 1;
