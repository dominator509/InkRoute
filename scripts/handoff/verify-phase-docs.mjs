#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const requiredRootDocs = [
  "README.md",
  "ROADMAP.md",
  "ARCHITECTURE.md",
  "AGENTS.md",
  "GAP_TRACKER.md",
  "HANDOFF_TO_CODEX.md",
  "HANDOFF_TO_JULES.md",
  "HANDOFF_TO_CLAUDE_CODE.md",
  "TESTING_PLAN.md",
  "ENVIRONMENT_VARIABLES.md",
  "SECURITY.md",
  "DEPLOYMENT.md",
  "SEO_PLAN.md",
  "PRODUCT_REQUIREMENTS.md",
  "DATABASE_SCHEMA.md",
  "API_CONTRACTS.md",
  "RELEASE_AND_AUTO_UPDATE_PLAN.md",
  "BUG_CRASH_REPORTING_PLAN.md",
];
const phaseDocs = [
  "docs/phases/PHASE_0_PRODUCT_DEFINITION.md",
  "docs/phases/PHASE_1_MONOREPO_ARCHITECTURE.md",
  "docs/phases/PHASE_2_DATABASE_DOMAIN_MODEL.md",
  "docs/phases/PHASE_3_PUBLIC_WEBSITE.md",
  "docs/phases/PHASE_4_BOOKING_FLOW.md",
  "docs/phases/PHASE_5_DASHBOARD.md",
  "docs/phases/PHASE_6_MOBILE_APP.md",
  "docs/phases/PHASE_7_PAYMENTS_DEPOSITS.md",
  "docs/phases/PHASE_8_CALENDAR_TRAVEL.md",
  "docs/phases/PHASE_9_NOTIFICATIONS_MESSAGING.md",
  "docs/phases/PHASE_10_SEO_ENGINE.md",
  "docs/phases/PHASE_11_BUG_CRASH_REPORTING.md",
  "docs/phases/PHASE_12_RELEASE_AUTO_UPDATE.md",
  "docs/phases/PHASE_13_SECURITY_PRIVACY_TRUST.md",
  "docs/phases/PHASE_14_TESTING_QA.md",
  "docs/phases/PHASE_15_DEPLOYMENT_HANDOFF.md",
  "docs/phases/PHASE_16_AGENT_EXECUTION_READINESS.md",
  "docs/phases/PHASE_17_QUALITY_GATES.md",
];

const docs = [...requiredRootDocs, ...phaseDocs];
const results = docs.map((relativePath) => {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    return { path: relativePath, status: "fail", lineCount: 0, hasStatus: false, message: "Missing required doc." };
  }
  const text = readFileSync(absolutePath, "utf8");
  const lineCount = text.split(/\r?\n/).length;
  const hasStatus = /Status|Current status|Phase|Implemented|Scaffolded/i.test(text);
  return { path: relativePath, status: hasStatus ? "pass" : "warn", lineCount, hasStatus, message: hasStatus ? "Present." : "Present but lacks status keywords." };
});
const report = {
  generatedAt: new Date().toISOString(),
  status: results.some((result) => result.status === "fail") ? "fail" : results.some((result) => result.status === "warn") ? "warn" : "pass",
  docsChecked: results.length,
  missing: results.filter((result) => result.status === "fail").map((result) => result.path),
  warnings: results.filter((result) => result.status === "warn").map((result) => result.path),
  results,
};
const outputPath = join(root, "docs/handoff/manifests/phase-documentation-audit.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase docs audit status: ${report.status}`);
console.log(`Docs checked: ${report.docsChecked}`);
console.log(`Report: ${outputPath.replace(`${root}/`, "")}`);
if (report.status === "fail") {
  process.exitCode = 1;
}
