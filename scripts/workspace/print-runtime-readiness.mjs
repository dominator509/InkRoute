#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/workspace/manifests/runtime-readiness.json");
const importAuditPath = join(root, "docs/workspace/manifests/workspace-import-audit.json");
const scriptAuditPath = join(root, "docs/workspace/manifests/package-script-audit.json");
const gapTrackerPath = join(root, "GAP_TRACKER.md");

function toRepoPath(path) {
  return relative(root, path).split("\\").join("/");
}

function readJsonIfExists(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function extractGapRows(markdown) {
  return markdown.split(/\r?\n/).filter((line) => /^\| GAP-\d{3,}/.test(line.trim()));
}

function isBlockingGap(row) {
  const cells = row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
  return String(cells[5] ?? "").startsWith("Yes");
}

const importAudit = readJsonIfExists(importAuditPath);
const scriptAudit = readJsonIfExists(scriptAuditPath);
const gapRows = existsSync(gapTrackerPath) ? extractGapRows(readFileSync(gapTrackerPath, "utf8")) : [];
const blockingGapCount = gapRows.filter(isBlockingGap).length;
const checks = [
  {
    id: "workspace-imports",
    title: "Workspace import declarations",
    status: importAudit?.status ?? "fail",
    evidence: importAudit ? `Import audit exists with ${importAudit.findings.length} findings.` : "Import audit manifest is missing.",
    gapIds: ["GAP-001", "GAP-130"],
  },
  {
    id: "package-scripts",
    title: "Package script contract",
    status: scriptAudit?.status ?? "fail",
    evidence: scriptAudit ? `Package script audit exists with ${scriptAudit.findings.length} findings.` : "Package script audit manifest is missing.",
    gapIds: ["GAP-130", "GAP-132"],
  },
  {
    id: "pnpm-lockfile",
    title: "pnpm lockfile",
    status: existsSync(join(root, "pnpm-lock.yaml")) ? "pass" : "fail",
    evidence: existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm-lock.yaml exists." : "pnpm-lock.yaml does not exist in the artifact.",
    gapIds: ["GAP-001"],
  },
  {
    id: "env-example",
    title: "Environment template",
    status: existsSync(join(root, ".env.example")) ? "pass" : "fail",
    evidence: existsSync(join(root, ".env.example")) ? ".env.example exists." : ".env.example is missing.",
    gapIds: ["GAP-115"],
  },
  {
    id: "production-blockers",
    title: "Open production blockers",
    status: blockingGapCount > 0 ? "fail" : "pass",
    evidence: `${blockingGapCount} production-blocking gaps remain across ${gapRows.length} gap rows.`,
    gapIds: ["GAP-001", "GAP-002", "GAP-003", "GAP-014"],
  },
];
const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 18 workspace runtime readiness",
  status,
  level: status === "pass" ? "ready-for-local-install" : existsSync(join(root, "pnpm-lock.yaml")) ? "needs-attention" : "blocked",
  checks,
  firstExternalCommands: [
    "corepack enable",
    "pnpm install",
    "pnpm workspace:all",
    "pnpm handoff:all",
    "pnpm quality:all",
    "pnpm typecheck",
    "pnpm test:unit",
    "pnpm --filter @inkroute/web build",
    "pnpm --filter @inkroute/dashboard build",
  ],
  notes: [
    "This readiness report is static and pre-install only.",
    "Production remains blocked until install/build/test/provider/deployment evidence is recorded in GAP_TRACKER.md.",
  ],
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Runtime readiness status: ${report.status}; level: ${report.level}`);
for (const check of report.checks) console.log(`- ${check.id}: ${check.status} — ${check.evidence}`);
console.log(`Report: ${toRepoPath(outputPath)}`);
