#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const gapPath = join(root, "GAP_TRACKER.md");
const outputPath = join(root, "docs/handoff/manifests/gap-audit-report.json");
const text = readFileSync(gapPath, "utf8");

function splitRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/<br\s*\/?>(\s*)/gi, " ").replace(/\s+/g, " "));
}

const rows = text.split(/\r?\n/).filter((line) => /^\| GAP-\d{3,}/.test(line.trim()));
const records = rows.map((row) => {
  const cells = splitRow(row);
  return {
    gapId: cells[0] ?? "GAP-UNKNOWN",
    phase: cells[1] ?? "Unknown phase",
    area: cells[2] ?? "Unknown area",
    description: cells[3] ?? "",
    severity: cells[4] ?? "Unknown",
    blocksProduction: cells[5] ?? "Unknown",
    normalizedBlocksProduction: (cells[5] ?? "").startsWith("Yes") ? "Yes" : (cells[5] ?? "").startsWith("No") ? "No" : "Unknown",
    currentStatus: cells[6] ?? "",
    filesAffected: cells[7] ?? "",
    remainingWork: cells[8] ?? "",
    target: cells[9] ?? "",
    suggestedPrompt: cells[10] ?? "",
    verificationNeeded: cells[11] ?? "",
    columnCount: cells.length,
  };
});

const findings = [];
const seen = new Set();
let previous = 0;
const allowedSeverities = new Set(["Critical", "High", "Medium", "Low"]);
for (const record of records) {
  const numeric = Number(record.gapId.replace("GAP-", ""));
  if (record.columnCount !== 12) {
    findings.push({ status: "fail", gapId: record.gapId, message: `Expected 12 columns, found ${record.columnCount}.` });
  }
  if (!Number.isFinite(numeric)) {
    findings.push({ status: "fail", gapId: record.gapId, message: "Gap ID is not numeric." });
  }
  if (seen.has(record.gapId)) {
    findings.push({ status: "fail", gapId: record.gapId, message: "Duplicate gap ID." });
  }
  seen.add(record.gapId);
  if (Number.isFinite(numeric) && numeric !== previous + 1) {
    findings.push({ status: "warn", gapId: record.gapId, message: `Expected sequential GAP-${String(previous + 1).padStart(3, "0")}.` });
  }
  previous = Number.isFinite(numeric) ? numeric : previous;
  if (!allowedSeverities.has(record.severity)) {
    findings.push({ status: "fail", gapId: record.gapId, message: `Unsupported severity ${record.severity}.` });
  }
  if (record.normalizedBlocksProduction === "Unknown") {
    findings.push({ status: "fail", gapId: record.gapId, message: `Blocks production should begin with Yes or No, found ${record.blocksProduction}.` });
  } else if (record.blocksProduction !== record.normalizedBlocksProduction) {
    findings.push({ status: "warn", gapId: record.gapId, message: `Blocks production uses qualified value: ${record.blocksProduction}.` });
  }
  if (record.normalizedBlocksProduction === "Yes" && record.verificationNeeded.length < 12) {
    findings.push({ status: "fail", gapId: record.gapId, message: "Production-blocking gap lacks verification/test detail." });
  }
  if (record.suggestedPrompt.length < 20) {
    findings.push({ status: "warn", gapId: record.gapId, message: "Suggested handoff prompt is very short." });
  }
}

const bySeverity = records.reduce((acc, record) => {
  acc[record.severity] = (acc[record.severity] ?? 0) + 1;
  return acc;
}, {});
const byPhase = records.reduce((acc, record) => {
  acc[record.phase] = (acc[record.phase] ?? 0) + 1;
  return acc;
}, {});
const report = {
  generatedAt: new Date().toISOString(),
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  totalGaps: records.length,
  blockingGaps: records.filter((record) => record.normalizedBlocksProduction === "Yes").length,
  criticalBlockingGapIds: records.filter((record) => record.severity === "Critical" && record.normalizedBlocksProduction === "Yes").map((record) => record.gapId),
  bySeverity,
  byPhase,
  findings,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Gap audit status: ${report.status}`);
console.log(`Gaps: ${report.totalGaps}; blocking: ${report.blockingGaps}; critical blockers: ${report.criticalBlockingGapIds.length}`);
console.log(`Report: ${outputPath.replace(`${root}/`, "")}`);
if (report.status === "fail") {
  process.exitCode = 1;
}
