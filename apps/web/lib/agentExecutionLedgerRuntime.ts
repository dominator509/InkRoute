import { buildAgentExecutionLedgerReadinessPlan, phase16AgentExecutionTasks } from "@inkroute/handoff";

export type AgentExecutionLedgerRuntimeStatus =
  | "wired"
  | "execution-gated"
  | "external-agent-gated"
  | "evidence-gated"
  | "ci-gated";

export interface AgentExecutionLedgerRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AgentExecutionLedgerRuntimeStatus;
}

export const agentExecutionLedgerRuntimeArtifactPaths = [
  "coverage/agent-execution-ledger-runtime.json",
  "coverage/agent-execution-ledger-verifier.json",
  "coverage/agent-execution-handoff-audit.json",
  "coverage/agent-execution-queue-summary.json",
  "coverage/agent-execution-codex-results-redacted.json",
  "coverage/agent-execution-jules-results-redacted.json",
  "coverage/agent-execution-claude-results-redacted.json",
  "coverage/agent-execution-local-results-redacted.json",
  "coverage/agent-execution-command-artifacts-redacted.json",
  "coverage/agent-execution-gap-tracker-update.json",
  "coverage/agent-execution-secret-safety-review.json",
  "coverage/agent-execution-ci-run-redacted.json",
  "test-results/agent-execution-ledger-runtime"
] as const;

export const agentExecutionLedgerRuntimeCommands = [
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
  "pnpm handoff:verify-docs",
  "pnpm handoff:next",
  "agent task command plans from docs/handoff/manifests/agent-execution-queue.json"
] as const;

export const agentExecutionLedgerRuntimeMatrix: readonly AgentExecutionLedgerRuntimeMatrixEntry[] = [
  {
    id: "queue-ledger-verifier",
    command: "pnpm handoff:verify-ledger",
    artifact: "coverage/agent-execution-ledger-verifier.json",
    status: "wired"
  },
  {
    id: "handoff-audit-docs-next",
    command: "pnpm handoff:audit && pnpm handoff:verify-docs && pnpm handoff:next",
    artifact: "coverage/agent-execution-handoff-audit.json",
    status: "wired"
  },
  {
    id: "codex-execution-import",
    command: "import Codex execution results with commands, files, artifacts, gaps, and risks",
    artifact: "coverage/agent-execution-codex-results-redacted.json",
    status: "execution-gated"
  },
  {
    id: "external-agent-import",
    command: "import Jules and Claude Code execution results into the redacted ledger",
    artifact: "coverage/agent-execution-jules-results-redacted.json",
    status: "external-agent-gated"
  },
  {
    id: "local-terminal-import",
    command: "import Local terminal launch readiness execution results",
    artifact: "coverage/agent-execution-local-results-redacted.json",
    status: "execution-gated"
  },
  {
    id: "gap-tracker-secret-safety",
    command: "update GAP_TRACKER.md and perform secret-safe evidence review",
    artifact: "coverage/agent-execution-secret-safety-review.json",
    status: "evidence-gated"
  },
  {
    id: "ci-agent-ledger-artifacts",
    command: "GitHub Actions handoff ledger artifact capture",
    artifact: "coverage/agent-execution-ci-run-redacted.json",
    status: "ci-gated"
  }
];

export const agentExecutionLedgerRuntimeReadiness = buildAgentExecutionLedgerReadinessPlan({
  queueTasks: phase16AgentExecutionTasks,
  executions: phase16AgentExecutionTasks.map((task) => ({
    taskId: task.id,
    status: "not_executed",
    assignedAgent: task.target,
    commandsRun: [],
    filesChanged: [],
    evidenceArtifacts: [],
    remainingGaps: task.gapIds,
    secretSafety: "no_evidence_recorded"
  })),
  verifierPassed: false,
  handoffAuditPassed: false,
  gapTrackerUpdated: false,
  externalAgentResultsImported: false
});
