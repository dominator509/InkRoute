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
    command: "node scripts/quality/audit-doc-links.mjs && node scripts/quality/verify-documentation-consistency.mjs && node scripts/quality/verify-documentation-inventory.mjs",
    blocksGapIds: ["GAP-124", "GAP-128"],
    acceptanceEvidence: ["Audit output", "markdown-link-audit.json", "documentation-consistency-audit.json", "documentation-inventory-audit.json", "No missing relative links, missing referenced repo paths, unsupported production claims, unresolved API routes, unqualified provider/legal readiness claims, or stale app/package roots"],
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
    id: "repository-governance",
    title: "Repository governance prerequisite audit",
    priority: "critical",
    command: "node scripts/quality/verify-repository-governance.mjs",
    blocksGapIds: ["GAP-125", "GAP-129", "GAP-133"],
    acceptanceEvidence: ["repository-governance-audit.json", "CODEOWNERS covers governance and sensitive surfaces", "PR/issue templates request evidence", "CI includes quality, handoff, workspace, and secret-management gates"],
  },
  {
    id: "required-quality-checks",
    title: "Required quality checks contract audit",
    priority: "critical",
    command: "node scripts/quality/verify-required-checks.mjs",
    blocksGapIds: ["GAP-129", "GAP-111", "GAP-133"],
    acceptanceEvidence: ["required-checks-audit.json", "Package scripts for required checks exist", "CI workflow contains required quality, handoff, workspace, workspace enforcement, typecheck, lint, unit, and e2e gates", "Branch protection check names are documented for external repository settings"],
  },
  {
    id: "workspace-required-checks",
    title: "Workspace required checks contract audit",
    priority: "critical",
    command: "node scripts/workspace/verify-workspace-required-checks.mjs",
    blocksGapIds: ["GAP-133", "GAP-130", "GAP-132"],
    acceptanceEvidence: ["workspace-required-checks-audit.json", "workspace:all chains import/script/readiness/enforcement/toolchain checks", "CI includes workspace checks", "PR gap-diff and required-check enforcement terms are present"],
  },
  {
    id: "workspace-toolchain-readiness",
    title: "Workspace toolchain readiness audit",
    priority: "high",
    command: "node scripts/workspace/verify-workspace-toolchain.mjs",
    blocksGapIds: ["GAP-130", "GAP-132"],
    acceptanceEvidence: ["workspace-toolchain-readiness-audit.json", "Workspace helper package, scripts, manifests, root scripts, and CI terms are aligned", "Runtime/provider proof remains separately blocked until install/build/test evidence exists"],
  },
  {
    id: "runtime-evidence",
    title: "Runtime evidence audit",
    priority: "critical",
    command: "node scripts/workspace/verify-runtime-evidence.mjs",
    blocksGapIds: ["GAP-132", "GAP-001", "GAP-012"],
    acceptanceEvidence: ["runtime-evidence-audit.json", "Required install/workspace/handoff/quality/typecheck/test/build command evidence is recorded as passed before runtime readiness is claimed", "Missing evidence remains explicit and secret-safe"],
  },
  {
    id: "legal-review",
    title: "Legal review evidence audit",
    priority: "critical",
    command: "node scripts/legal/verify-legal-review.mjs",
    blocksGapIds: ["GAP-013", "GAP-120"],
    acceptanceEvidence: ["legal-review-audit.json", "All required legal review items are approved with redacted evidence labels", "No privileged attorney communications, secrets, or client data appear in evidence"],
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
