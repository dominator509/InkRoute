import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentExecutionLedgerRuntimeArtifactPaths,
  agentExecutionLedgerRuntimeCommands,
  agentExecutionLedgerRuntimeMatrix,
  agentExecutionLedgerRuntimeReadiness,
  agentExecutionLedgerTargets,
  agentExecutionLedgerTaskIds,
} from "../lib/agentExecutionLedgerRuntime";

const repoRoot = join(__dirname, "../../..");
const readRepoFile = (path: string) => readFileSync(join(repoRoot, path), "utf8");

describe("agent execution ledger runtime contract", () => {
  const packageJson = readRepoFile("package.json");
  const queueManifest = readRepoFile("docs/handoff/manifests/agent-execution-queue.json");
  const ledgerManifest = readRepoFile("docs/handoff/manifests/agent-execution-ledger.json");
  const verifierScript = readRepoFile("scripts/handoff/verify-agent-execution-ledger.mjs");
  const handoffPackageTests = readRepoFile("packages/handoff/tests/handoff-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins the runtime matrix commands, tasks, targets, and redacted artifact paths", () => {
    expect(agentExecutionLedgerRuntimeCommands).toEqual([
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "pnpm handoff:verify-docs",
      "pnpm handoff:next",
      "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
      "external Codex/Jules/Claude/local execution result import",
    ]);
    expect(agentExecutionLedgerTaskIds).toEqual([
      "codex-workspace-runtime-readiness-001",
      "codex-runtime-verification-001",
      "codex-quality-gate-enforcement-001",
      "jules-database-auth-foundation-001",
      "claude-provider-contract-001",
      "local-launch-readiness-001",
    ]);
    expect(agentExecutionLedgerTargets).toEqual([
      "Codex",
      "Codex",
      "Codex",
      "Jules",
      "Claude Code",
      "Local terminal",
    ]);
    expect(agentExecutionLedgerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "ledger-verifier",
      "handoff-audit",
      "queue-ledger-parity",
      "agent-command-execution",
      "diff-artifact-evidence",
      "secret-safe-result-import",
      "gap-tracker-updates",
      "ci-ledger-artifacts",
    ]);
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("coverage/agent-execution-external-results-imported.json");
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("test-results/agent-execution-ledger-runtime");
  });

  it("keeps the queue, redacted ledger, verifier, package scripts, and package tests aligned", () => {
    for (const taskId of agentExecutionLedgerTaskIds) {
      expect(queueManifest).toContain(taskId);
      expect(ledgerManifest).toContain(taskId);
    }
    expect(queueManifest).toContain('"target": "Codex"');
    expect(queueManifest).toContain('"target": "Jules"');
    expect(queueManifest).toContain('"target": "Claude Code"');
    expect(queueManifest).toContain('"target": "Local terminal"');
    expect(ledgerManifest).toContain('"status": "not_executed"');
    expect(ledgerManifest).toContain('"remainingGaps"');
    expect(ledgerManifest).toContain('"secretSafety": "no_evidence_recorded"');
    expect(verifierScript).toContain("forbiddenPatterns");
    expect(verifierScript).toContain("completed_redacted");
    expect(verifierScript).toContain("secret_safe_redacted");
    expect(packageJson).toContain('"handoff:verify-ledger"');
    expect(handoffPackageTests).toContain("buildAgentExecutionLedgerReadinessPlan");
  });

  it("reports GAP-119 as blocked until completed redacted agent results are imported", () => {
    expect(agentExecutionLedgerRuntimeReadiness.status).toBe("blocked");
    expect(agentExecutionLedgerRuntimeReadiness.missingTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.unknownTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.duplicateTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.incompleteTaskIds).toEqual([...agentExecutionLedgerTaskIds]);
    expect(agentExecutionLedgerRuntimeReadiness.requiredCommands).toEqual([
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "pnpm handoff:verify-docs",
      "pnpm handoff:next",
      "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
    ]);
    expect(agentExecutionLedgerRuntimeReadiness.requiredEvidence).toEqual([
      "Completed redacted ledger entry for every Phase 16 queue task.",
      "Commands run, changed files, evidence artifacts, remaining gaps, and risks for each agent execution.",
      "Secret-safe review status for every completed execution.",
      "Updated GAP_TRACKER rows with exact evidence and unresolved blockers.",
      "Handoff audit output and imported external agent result labels.",
    ]);
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "Every handoff execution must be completed_redacted with commands, evidence artifacts, matching agent, and secret-safe review.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain("pnpm handoff:verify-ledger must pass.");
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "Handoff audit scripts must pass after importing execution results.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "GAP_TRACKER.md must be updated with exact execution evidence and remaining blockers.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "External Codex/Jules/Claude/local execution results must be imported into the redacted ledger.",
    );
  });

  it("keeps CI, manifest, and tracker coverage wired without claiming external execution is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 agent execution ledger runtime contracts");
    expect(ciWorkflow).toContain("agent-execution-ledger-runtime-static.test.ts");
    expect(ciWorkflow).toContain("agent-execution-ledger-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-agent-execution-ledger-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/agentExecutionLedgerRuntime.ts");
    expect(gapTracker).toContain("live external agent execution proof remains open");
  });
});
