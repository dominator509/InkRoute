import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentExecutionLedgerRuntimeArtifactPaths,
  agentExecutionLedgerRuntimeCommands,
  agentExecutionLedgerRuntimeMatrix,
  agentExecutionLedgerRuntimeReadiness
} from "../lib/agentExecutionLedgerRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const rootPackage = read("package.json");
const queueManifest = read("docs/handoff/manifests/agent-execution-queue.json");
const ledgerManifest = read("docs/handoff/manifests/agent-execution-ledger.json");
const ledgerVerifier = read("scripts/handoff/verify-agent-execution-ledger.mjs");
const handoffTests = read("packages/handoff/tests/handoff-plan.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-119 agent execution ledger runtime wiring", () => {
  it("pins handoff ledger commands, matrix entries, and redacted artifacts", () => {
    expect(agentExecutionLedgerRuntimeCommands).toEqual([
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "pnpm handoff:verify-docs",
      "pnpm handoff:next",
      "agent task command plans from docs/handoff/manifests/agent-execution-queue.json"
    ]);
    expect(agentExecutionLedgerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "queue-ledger-verifier",
      "handoff-audit-docs-next",
      "codex-execution-import",
      "external-agent-import",
      "local-terminal-import",
      "gap-tracker-secret-safety",
      "ci-agent-ledger-artifacts"
    ]);
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("coverage/agent-execution-secret-safety-review.json");
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("test-results/agent-execution-ledger-runtime");
  });

  it("keeps queue, ledger, verifier, root scripts, and package tests aligned", () => {
    for (const script of ["handoff:verify-ledger", "handoff:audit", "handoff:verify-docs", "handoff:next"]) {
      expect(rootPackage).toContain(`"${script}"`);
    }
    for (const taskId of [
      "codex-workspace-runtime-readiness-001",
      "codex-runtime-verification-001",
      "jules-database-auth-foundation-001",
      "claude-provider-contract-001",
      "local-launch-readiness-001"
    ]) {
      expect(queueManifest).toContain(taskId);
      expect(ledgerManifest).toContain(taskId);
    }
    expect(ledgerManifest).toContain("forbiddenInLedger");
    expect(ledgerManifest).toContain("secretSafety");
    expect(ledgerVerifier).toContain("agent-execution-queue.json");
    expect(ledgerVerifier).toContain("agent-execution-ledger.json");
    expect(handoffTests).toContain("buildAgentExecutionLedgerReadinessPlan");
  });

  it("keeps readiness blocked until executions are completed, imported, secret-safe, and tracker rows are updated", () => {
    expect(agentExecutionLedgerRuntimeReadiness.status).toBe("blocked");
    expect(agentExecutionLedgerRuntimeReadiness.missingExecutionTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.unknownExecutionTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.incompleteExecutionTaskIds).toEqual(
      expect.arrayContaining([
        "codex-workspace-runtime-readiness-001",
        "codex-runtime-verification-001",
        "jules-database-auth-foundation-001",
        "claude-provider-contract-001",
        "local-launch-readiness-001"
      ])
    );
    expect(agentExecutionLedgerRuntimeReadiness.requiredCommands).toEqual(agentExecutionLedgerRuntimeCommands);
    expect(agentExecutionLedgerRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Completed redacted ledger entry for every Phase 16 queue task.",
        "Commands run, changed files, evidence artifacts, remaining gaps, and risks for each agent execution.",
        "Secret-safe review status for every completed execution.",
        "Updated GAP_TRACKER rows with exact evidence and unresolved blockers.",
        "Handoff audit output and imported external agent result labels."
      ])
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Every handoff execution must be completed_redacted with commands, evidence artifacts, matching agent, and secret-safe review.",
        "pnpm handoff:verify-ledger must pass.",
        "Handoff audit scripts must pass after importing execution results.",
        "External Codex/Jules/Claude/local execution results must be imported into the redacted ledger."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 16 agent execution ledger runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/agent-execution-ledger-runtime-static.test.ts");
    expect(ciWorkflow).toContain("agent-execution-ledger-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/agent-execution-ledger-runtime.json");
    expect(ciWorkflow).toContain("test-results/agent-execution-ledger-runtime");
    expect(unitManifest).toContain("unit-web-agent-execution-ledger-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/agentExecutionLedgerRuntime.ts");
    expect(gapTracker).toContain("live external agent execution proof remains open");
  });
});
