import { buildAgentExecutionLedgerReadinessPlan } from "@inkroute/handoff";
import type { AgentTarget } from "@inkroute/handoff";

export type AgentExecutionLedgerRuntimeStatus =
  | "wired"
  | "agent-gated"
  | "audit-gated"
  | "ci-gated";

export interface AgentExecutionLedgerRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AgentExecutionLedgerRuntimeStatus;
}

export const agentExecutionLedgerTaskIds = [
  "codex-workspace-runtime-readiness-001",
  "codex-runtime-verification-001",
  "codex-quality-gate-enforcement-001",
  "jules-database-auth-foundation-001",
  "claude-provider-contract-001",
  "local-launch-readiness-001",
] as const;

export const agentExecutionLedgerTargets = [
  "Codex",
  "Codex",
  "Codex",
  "Jules",
  "Claude Code",
  "Local terminal",
] as const satisfies readonly AgentTarget[];

export const agentExecutionLedgerRuntimeArtifactPaths = [
  "coverage/agent-execution-ledger-runtime.json",
  "coverage/agent-execution-ledger-verifier.json",
  "coverage/agent-execution-handoff-audit.json",
  "coverage/agent-execution-queue-parity.json",
  "coverage/agent-execution-command-transcripts-redacted.json",
  "coverage/agent-execution-diff-summary-redacted.json",
  "coverage/agent-execution-provider-evidence-redacted.json",
  "coverage/agent-execution-secret-safety-review.json",
  "coverage/agent-execution-gap-tracker-updates.json",
  "coverage/agent-execution-external-results-imported.json",
  "coverage/agent-execution-ci-run-redacted.json",
  "test-results/agent-execution-ledger-runtime",
] as const;

export const agentExecutionLedgerRuntimeCommands = [
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
  "pnpm handoff:verify-docs",
  "pnpm handoff:next",
  "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
  "external Codex/Jules/Claude/local execution result import",
] as const;

export const agentExecutionLedgerRuntimeMatrix = [
  {
    id: "ledger-verifier",
    command: "pnpm handoff:verify-ledger",
    artifact: "coverage/agent-execution-ledger-verifier.json",
    status: "wired",
  },
  {
    id: "handoff-audit",
    command: "pnpm handoff:audit && pnpm handoff:verify-docs && pnpm handoff:next",
    artifact: "coverage/agent-execution-handoff-audit.json",
    status: "audit-gated",
  },
  {
    id: "queue-ledger-parity",
    command: "verify every queued task has one matching ledger entry",
    artifact: "coverage/agent-execution-queue-parity.json",
    status: "wired",
  },
  {
    id: "agent-command-execution",
    command: "run agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
    artifact: "coverage/agent-execution-command-transcripts-redacted.json",
    status: "agent-gated",
  },
  {
    id: "diff-artifact-evidence",
    command: "capture changed files, evidence artifacts, remaining gaps, and risks",
    artifact: "coverage/agent-execution-diff-summary-redacted.json",
    status: "agent-gated",
  },
  {
    id: "secret-safe-result-import",
    command: "import external Codex/Jules/Claude/local execution results after secret-safe review",
    artifact: "coverage/agent-execution-external-results-imported.json",
    status: "agent-gated",
  },
  {
    id: "gap-tracker-updates",
    command: "update GAP_TRACKER rows with exact execution evidence and unresolved blockers",
    artifact: "coverage/agent-execution-gap-tracker-updates.json",
    status: "agent-gated",
  },
  {
    id: "ci-ledger-artifacts",
    command: "GitHub Actions handoff ledger artifact capture",
    artifact: "coverage/agent-execution-ci-run-redacted.json",
    status: "ci-gated",
  },
] as const satisfies readonly AgentExecutionLedgerRuntimeMatrixEntry[];

export const agentExecutionLedgerRuntimeReadiness = buildAgentExecutionLedgerReadinessPlan({
  queueTasks: agentExecutionLedgerTaskIds.map((id, index) => ({
    id,
    title: id,
    target: agentExecutionLedgerTargets[index],
    priority: index < 3 ? "critical" : "high",
    phase: "Phase 16",
    files: ["GAP_TRACKER.md"],
    gapIds: ["GAP-119"],
    commandPlan: ["pnpm handoff:verify-ledger"],
    acceptanceEvidence: ["redacted execution evidence"],
    prompt: "Import redacted agent execution result.",
  })),
  executions: agentExecutionLedgerTaskIds.map((id, index) => ({
    taskId: id,
    status: "not_executed",
    assignedAgent: agentExecutionLedgerTargets[index],
    commandsRun: [],
    filesChanged: [],
    evidenceArtifacts: [],
    remainingGaps: ["GAP-119"],
    secretSafety: "no_evidence_recorded",
  })),
  verifierPassed: false,
  handoffAuditPassed: false,
  gapTrackerUpdated: false,
  externalAgentResultsImported: false,
});
