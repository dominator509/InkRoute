import { buildAgentTaskTrackingReadinessPlan } from "@inkroute/handoff";
import type { AgentTarget } from "@inkroute/handoff";

export type AgentTaskTrackingRuntimeStatus =
  | "wired"
  | "github-gated"
  | "project-gated"
  | "traceability-gated";

export interface AgentTaskTrackingRuntimeMatrixEntry {
  readonly id: string;
  readonly command: string;
  readonly artifact: string;
  readonly status: AgentTaskTrackingRuntimeStatus;
}

export interface AgentTaskTrackingRunPersistenceContract {
  readonly prismaModel: "AgentTaskTrackingRun";
  readonly tenantRelation: "agentTaskTrackingRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly ["queueTaskMatrix", "plannedIssueMatrix", "trackingLinkMatrix", "artifactManifest"];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "queueIssueParityVerified",
    "defaultLabelsApplied",
    "targetPriorityLabelsApplied",
    "gapIdsLinked",
    "acceptanceEvidenceFieldsLinked",
    "githubIssuesCreated",
    "githubProjectItemsLinked",
    "redactedTrackingUrlsRecorded",
    "handoffDocsLinked",
    "gapTrackerLinked",
    "statusUpdatesTraceable",
    "ciTaskTrackingArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "issueCreateArtifactPath",
    "projectSyncArtifactPath",
    "docLinksArtifactPath",
    "gapLinksArtifactPath",
    "statusTraceabilityArtifactPath"
  ];
}

export const agentTaskTrackingTaskIds = [
  "codex-workspace-runtime-readiness-001",
  "codex-runtime-verification-001",
  "codex-quality-gate-enforcement-001",
  "jules-database-auth-foundation-001",
  "claude-provider-contract-001",
  "local-launch-readiness-001",
] as const;

export const agentTaskTrackingTargets = [
  "Codex",
  "Codex",
  "Codex",
  "Jules",
  "Claude Code",
  "Local terminal",
] as const satisfies readonly AgentTarget[];

export const agentTaskTrackingPriorities = [
  "critical",
  "critical",
  "critical",
  "high",
  "high",
  "high",
] as const;

export const agentTaskTrackingGapIds = [
  ["GAP-001", "GAP-130", "GAP-131", "GAP-132", "GAP-133"],
  ["GAP-001", "GAP-105", "GAP-113", "GAP-121"],
  ["GAP-122", "GAP-124", "GAP-126", "GAP-127", "GAP-129"],
  ["GAP-002", "GAP-003", "GAP-005", "GAP-095", "GAP-117"],
  ["GAP-004", "GAP-049", "GAP-050", "GAP-061", "GAP-062", "GAP-063", "GAP-080", "GAP-110"],
  ["GAP-113", "GAP-118", "GAP-120", "GAP-121", "GAP-122"],
] as const;

export const agentTaskTrackingDefaultLabels = [
  "agent-task",
  "gap-tracked",
  "verification-required",
] as const;

export const agentTaskTrackingRuntimeCommands = [
  "pnpm handoff:verify-task-sync",
  "gh issue create or GitHub issue automation",
  "GitHub Project item sync",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
] as const;

export const agentTaskTrackingRuntimeArtifactPaths = [
  "coverage/agent-task-tracking-runtime.json",
  "coverage/agent-task-tracking-sync-verifier.json",
  "coverage/agent-task-tracking-issue-create-redacted.json",
  "coverage/agent-task-tracking-project-sync-redacted.json",
  "coverage/agent-task-tracking-doc-links.json",
  "coverage/agent-task-tracking-gap-links.json",
  "coverage/agent-task-tracking-status-traceability.json",
  "coverage/agent-task-tracking-ci-run-redacted.json",
  "test-results/agent-task-tracking-runtime",
] as const;

export const agentTaskTrackingRuntimeMatrix = [
  {
    id: "task-sync-verifier",
    command: "pnpm handoff:verify-task-sync",
    artifact: "coverage/agent-task-tracking-sync-verifier.json",
    status: "wired",
  },
  {
    id: "github-issue-create",
    command: "gh issue create or GitHub issue automation",
    artifact: "coverage/agent-task-tracking-issue-create-redacted.json",
    status: "github-gated",
  },
  {
    id: "github-project-sync",
    command: "GitHub Project item sync",
    artifact: "coverage/agent-task-tracking-project-sync-redacted.json",
    status: "project-gated",
  },
  {
    id: "handoff-doc-links",
    command: "link redacted issue/project labels from handoff docs",
    artifact: "coverage/agent-task-tracking-doc-links.json",
    status: "traceability-gated",
  },
  {
    id: "gap-tracker-links",
    command: "link tracking evidence from GAP_TRACKER rows",
    artifact: "coverage/agent-task-tracking-gap-links.json",
    status: "traceability-gated",
  },
  {
    id: "status-traceability",
    command: "trace status updates between queue, issues/projects, ledger, and gap tracker",
    artifact: "coverage/agent-task-tracking-status-traceability.json",
    status: "traceability-gated",
  },
] as const satisfies readonly AgentTaskTrackingRuntimeMatrixEntry[];

export const agentTaskTrackingRunPersistenceContract: AgentTaskTrackingRunPersistenceContract = {
  prismaModel: "AgentTaskTrackingRun",
  tenantRelation: "agentTaskTrackingRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: ["queueTaskMatrix", "plannedIssueMatrix", "trackingLinkMatrix", "artifactManifest"],
  requiredBooleanProofs: [
    "verifierPassed",
    "queueIssueParityVerified",
    "defaultLabelsApplied",
    "targetPriorityLabelsApplied",
    "gapIdsLinked",
    "acceptanceEvidenceFieldsLinked",
    "githubIssuesCreated",
    "githubProjectItemsLinked",
    "redactedTrackingUrlsRecorded",
    "handoffDocsLinked",
    "gapTrackerLinked",
    "statusUpdatesTraceable",
    "ciTaskTrackingArtifactsCaptured",
  ],
  redactedArtifactFields: [
    "issueCreateArtifactPath",
    "projectSyncArtifactPath",
    "docLinksArtifactPath",
    "gapLinksArtifactPath",
    "statusTraceabilityArtifactPath",
  ],
};

const queueTasks = agentTaskTrackingTaskIds.map((id, index) => ({
  id,
  title: id,
  target: agentTaskTrackingTargets[index],
  priority: agentTaskTrackingPriorities[index],
  phase: "Phase 16",
  files: ["docs/handoff/manifests/agent-execution-queue.json"],
  gapIds: [...agentTaskTrackingGapIds[index]],
  commandPlan: ["pnpm handoff:verify-task-sync"],
  acceptanceEvidence: ["redacted issue label", "project item label", "gap evidence fields", "status traceability"],
  prompt: "Create or sync redacted tracking evidence for the queued agent task.",
}));

const plannedIssues = queueTasks.map((task, index) => ({
  taskId: task.id,
  status: "not_created" as const,
  issueTitle: `Agent execution tracking: ${task.title}`,
  assigneeRole: task.target,
  labels: [
    ...agentTaskTrackingDefaultLabels,
    `priority:${agentTaskTrackingPriorities[index]}`,
    `target:${agentTaskTrackingTargets[index]}`,
  ],
  gapIds: [...task.gapIds],
  issueUrl: "",
  projectItemUrl: "",
  acceptanceEvidenceFields: [
    "commands run",
    "changed files",
    "redacted evidence artifacts",
    "remaining gaps and risks",
  ],
}));

export const agentTaskTrackingRuntimeReadiness = buildAgentTaskTrackingReadinessPlan({
  queueTasks,
  plannedIssues,
  defaultLabels: [...agentTaskTrackingDefaultLabels],
  verifierPassed: false,
  githubIssuesCreated: false,
  githubProjectItemsLinked: false,
  handoffDocsLinked: false,
  gapTrackerLinked: false,
  statusUpdatesTraceable: false,
});
