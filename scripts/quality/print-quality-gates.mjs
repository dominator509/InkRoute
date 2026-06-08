#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const outputPath = join(root, "docs/quality/manifests/quality-gates.json");
const gates = [
  {
    id: "quality-doc-links",
    title: "Markdown link, path, and claim audit",
    priority: "high",
    command: "node scripts/quality/audit-doc-links.mjs",
    blocksGapIds: ["GAP-124", "GAP-128"],
    acceptanceEvidence: ["Audit output", "markdown-link-audit.json", "No missing relative links, missing referenced repo paths, or unsupported production claims"],
  },
  {
    id: "quality-gap-evidence",
    title: "Gap tracker evidence audit",
    priority: "critical",
    command: "node scripts/quality/audit-gap-evidence.mjs && node scripts/quality/verify-pr-gap-diff-fixtures.mjs",
    blocksGapIds: ["GAP-122", "GAP-119"],
    acceptanceEvidence: ["Audit output", "gap-evidence-audit.json", "Positive and negative PR gap-diff fixtures pass", "No fail findings before closing blockers"],
  },
  {
    id: "phase-docs",
    title: "Phase documentation audit",
    priority: "high",
    command: "node scripts/handoff/verify-phase-docs.mjs",
    blocksGapIds: ["GAP-124"],
    acceptanceEvidence: ["phase-documentation-audit.json", "All required phase docs present"],
  },
  {
    id: "deployment-readiness",
    title: "Deployment manifest dry-run",
    priority: "high",
    command: "node deployment/scripts/check-env.mjs && node deployment/scripts/final-gap-summary.mjs",
    blocksGapIds: ["GAP-113", "GAP-115"],
    acceptanceEvidence: ["Redacted env report", "Final gap summary", "No secret values printed"],
  },
  {
    id: "testing-manifest",
    title: "Testing manifest verification",
    priority: "high",
    command: "node testing/scripts/phase14-static-check.mjs && node testing/scripts/verify-test-manifest.mjs",
    blocksGapIds: ["GAP-105", "GAP-111"],
    acceptanceEvidence: ["Static check output", "Manifest verification output"],
  },
];
const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
gates.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.id.localeCompare(b.id));
const report = {
  generatedAt: new Date().toISOString(),
  source: "Phase 17 quality gate hardening",
  status: "scaffolded-not-ci-enforced",
  totalGates: gates.length,
  commands: gates.map((gate) => gate.command),
  referencedGapIds: [...new Set(gates.flatMap((gate) => gate.blocksGapIds))].sort(),
  gates,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("# InkRoute Quality Gates");
console.log(`Generated: ${report.generatedAt}`);
console.log(`Gates: ${report.totalGates}`);
for (const gate of gates) {
  console.log(`\n## ${gate.title}`);
  console.log(`Priority: ${gate.priority}`);
  console.log(`Command: ${gate.command}`);
  console.log(`Gaps: ${gate.blocksGapIds.join(", ")}`);
}
console.log(`\nReport: docs/quality/manifests/quality-gates.json`);
