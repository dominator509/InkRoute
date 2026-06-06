#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const gapPath = join(root, "GAP_TRACKER.md");
const outputPath = join(root, "docs/quality/manifests/gap-evidence-audit.json");
const text = readFileSync(gapPath, "utf8");
const expectedColumns = 12;
const allowedSeverities = new Set(["Critical", "High", "Medium", "Low"]);

function normalizeCell(cell) {
  return cell.trim().replace(/<br\s*\/?>(\s*)/gi, " ").replace(/\s+/g, " ");
}

function splitRow(row) {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(normalizeCell);
}

function normalizeBlocker(value) {
  if (value.startsWith("Yes")) return "Yes";
  if (value.startsWith("No")) return "No";
  return "Unknown";
}

function hasVerificationSpecificity(value) {
  const lower = value.toLowerCase();
  return value.length >= 20 && (/`[^`]+`/.test(value) || lower.includes("test") || lower.includes("evidence") || lower.includes("passes") || lower.includes("output") || lower.includes("proof"));
}

function hasActionSpecificity(value) {
  return value.length >= 20 && /\b(run|implement|configure|verify|test|provision|wire|add|create|document|validate|execute|review|update)\b/i.test(value);
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
    blocksProductionRaw: cells[5] ?? "Unknown",
    normalizedBlocksProduction: normalizeBlocker(cells[5] ?? "Unknown"),
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
for (const record of records) {
  const numeric = Number(record.gapId.replace("GAP-", ""));
  if (record.columnCount !== expectedColumns) {
    findings.push({ status: "fail", gapId: record.gapId, message: `Expected ${expectedColumns} columns, found ${record.columnCount}.` });
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
    findings.push({ status: "fail", gapId: record.gapId, message: `Unsupported severity: ${record.severity}.` });
  }
  if (record.normalizedBlocksProduction === "Unknown") {
    findings.push({ status: "fail", gapId: record.gapId, message: `Blocks production should begin with Yes or No, found ${record.blocksProductionRaw}.` });
  } else if (record.blocksProductionRaw !== record.normalizedBlocksProduction) {
    findings.push({ status: "warn", gapId: record.gapId, message: `Blocks production uses qualified value: ${record.blocksProductionRaw}.` });
  }
  if (!hasActionSpecificity(record.remainingWork)) {
    findings.push({ status: "warn", gapId: record.gapId, message: "Remaining work lacks an action verb and enough detail." });
  }
  if (!hasActionSpecificity(record.suggestedPrompt)) {
    findings.push({ status: "warn", gapId: record.gapId, message: "Suggested prompt lacks an action verb and enough detail." });
  }
  if (!hasVerificationSpecificity(record.verificationNeeded)) {
    findings.push({ status: "warn", gapId: record.gapId, message: "Verification/test field lacks concrete evidence detail." });
  }
  if (/\bclosed\b/i.test(record.currentStatus) && !/\b(evidence|command|provider|ci|test|screenshot|log|output)\b/i.test(record.currentStatus)) {
    findings.push({ status: "fail", gapId: record.gapId, message: "Closed status language lacks evidence wording." });
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
const blockerRecords = records.filter((record) => record.normalizedBlocksProduction === "Yes");
const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 17 quality gate hardening",
  status: findings.some((finding) => finding.status === "fail") ? "fail" : findings.some((finding) => finding.status === "warn") ? "warn" : "pass",
  totalGaps: records.length,
  blockingGaps: blockerRecords.length,
  criticalBlockingGapIds: blockerRecords.filter((record) => record.severity === "Critical").map((record) => record.gapId),
  bySeverity,
  byPhase,
  findings,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Gap evidence audit status: ${report.status}`);
console.log(`Gaps: ${report.totalGaps}; blocking: ${report.blockingGaps}; critical blockers: ${report.criticalBlockingGapIds.length}`);
console.log(`Report: ${outputPath.replace(`${root}/`, "")}`);
if (report.status === "fail") process.exitCode = 1;
