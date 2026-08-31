import {
  agentTaskTrackingRequiredCommands,
  agentTaskTrackingRequiredEvidence as agentTaskTrackingPackageRequiredEvidence,
  buildAgentTaskTrackingReadinessPlan,
} from "@inkroute/handoff";
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

export const agentTaskTrackingRuntimeCommands = agentTaskTrackingRequiredCommands;

export const agentTaskTrackingRuntimeLocalCommands = [
  "pnpm handoff:verify-task-sync",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
] as const;

const agentTaskTrackingRuntimeLocalCommandSet = new Set<string>(agentTaskTrackingRuntimeLocalCommands);

export const agentTaskTrackingRuntimeExternalCommands = agentTaskTrackingRuntimeCommands.filter(
  (command) => !agentTaskTrackingRuntimeLocalCommandSet.has(command),
);

export const agentTaskTrackingRuntimeArtifactPaths = [
  "coverage/agent-task-tracking-runtime.json",
  "coverage/agent-task-tracking-sync-verifier.json",
  "coverage/agent-task-tracking-issue-create-redacted.json",
  "coverage/agent-task-tracking-project-sync-redacted.json",
  "coverage/agent-task-tracking-doc-links.json",
  "coverage/agent-task-tracking-gap-links.json",
  "coverage/agent-task-tracking-status-traceability.json",
  "coverage/agent-task-tracking-ci-run-redacted.json",
  "coverage/agent-task-tracking-redacted-evidence-bundle.json",
  "test-results/agent-task-tracking-runtime",
] as const;

export const agentTaskTrackingRuntimeProofFiles = [
  "docs/handoff/manifests/agent-execution-queue.json",
  "docs/handoff/manifests/agent-task-tracking-sync.json",
  "scripts/handoff/verify-agent-task-sync.mjs",
  "packages/handoff/src/index.ts",
  "packages/handoff/tests/handoff-plan.test.ts",
  "docs/handoff/AGENT_EXECUTION_QUEUE.md",
  "apps/web/lib/agentTaskTrackingRuntime.ts",
  "apps/web/tests/agent-task-tracking-runtime-static.test.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609025000_add_agent_task_tracking_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export type AgentTaskTrackingRuntimeCommand = (typeof agentTaskTrackingRuntimeCommands)[number];
export type AgentTaskTrackingRuntimeArtifact = (typeof agentTaskTrackingRuntimeArtifactPaths)[number];

export interface AgentTaskTrackingEvidenceInput {
  readonly verifierPassed: boolean;
  readonly queueIssueParityVerified: boolean;
  readonly defaultLabelsApplied: boolean;
  readonly targetPriorityLabelsApplied: boolean;
  readonly gapIdsLinked: boolean;
  readonly acceptanceEvidenceFieldsLinked: boolean;
  readonly githubIssuesCreated: boolean;
  readonly githubProjectItemsLinked: boolean;
  readonly redactedTrackingUrlsRecorded: boolean;
  readonly handoffDocsLinked: boolean;
  readonly gapTrackerLinked: boolean;
  readonly statusUpdatesTraceable: boolean;
  readonly ciTaskTrackingArtifactsCaptured: boolean;
  readonly agentTaskTrackingRunPersisted: boolean;
  readonly capturedArtifacts: readonly AgentTaskTrackingRuntimeArtifact[];
  readonly completedCommands: readonly AgentTaskTrackingRuntimeCommand[];
}

export interface AgentTaskTrackingEvidenceDecision {
  readonly status: "complete" | "blocked";
  readonly missingArtifacts: readonly AgentTaskTrackingRuntimeArtifact[];
  readonly missingCommands: readonly AgentTaskTrackingRuntimeCommand[];
  readonly requiredArtifacts: typeof agentTaskTrackingRuntimeArtifactPaths;
  readonly requiredCommands: typeof agentTaskTrackingRuntimeCommands;
  readonly requiredEvidence: typeof agentTaskTrackingRequiredEvidence;
  readonly blockers: readonly string[];
}

export interface AgentTaskTrackingRuntimeExecutionPlan {
  readonly localCommands: typeof agentTaskTrackingRuntimeLocalCommands;
  readonly externalCommands: typeof agentTaskTrackingRuntimeExternalCommands;
  readonly localArtifacts: typeof agentTaskTrackingRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof agentTaskTrackingRuntimeExternalArtifacts;
  readonly taskSyncVerifierExecutionAllowed: false;
  readonly githubIssueCreationAllowed: false;
  readonly githubProjectSyncAllowed: false;
  readonly handoffDocLinkExecutionAllowed: false;
  readonly gapTrackerLinkExecutionAllowed: false;
  readonly statusTraceabilityExecutionAllowed: false;
  readonly ledgerVerificationExecutionAllowed: false;
  readonly handoffAuditExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
  readonly executionPolicy: typeof agentTaskTrackingRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof agentTaskTrackingRuntimeRequiredExternalEvidence;
}

export interface AgentTaskTrackingRuntimeArtifactReview {
  readonly artifactPath: AgentTaskTrackingRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof agentTaskTrackingRuntimeRequiredExternalEvidence;
}

export interface AgentTaskTrackingRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly sourceArtifactPath: AgentTaskTrackingRuntimeArtifact | string;
  readonly artifactPath: "coverage/agent-task-tracking-redacted-evidence-bundle.json";
  readonly review: AgentTaskTrackingRuntimeArtifactReview;
  readonly requiredArtifacts: typeof agentTaskTrackingRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof agentTaskTrackingRuntimeRequiredExternalEvidence;
  readonly githubIssueCreationAllowed: false;
  readonly githubProjectSyncAllowed: false;
  readonly statusTraceabilityExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly persistenceExecutionAllowed: false;
}

export const agentTaskTrackingRuntimeRequiredExternalEvidence = [
  "GitHub issue creation and Project sync must be performed only in approved GitHub context with tracking URLs redacted.",
  "Handoff doc links, GAP_TRACKER links, and status traceability artifacts must redact issue URLs, project item URLs, actors, and private metadata.",
  "CI agent task tracking artifacts must redact run URLs, tokens, provider labels, and raw logs before retention.",
  "AgentTaskTrackingRun persistence must execute only against an approved provider-backed database.",
  "Redacted agent task tracking evidence bundle must omit raw issue URLs, project item URLs, tracking URLs, actors, provider labels, run URLs, and private metadata.",
] as const;

export const agentTaskTrackingRuntimeLocalArtifacts = [
  "coverage/agent-task-tracking-runtime.json",
  "coverage/agent-task-tracking-sync-verifier.json",
  "test-results/agent-task-tracking-runtime",
] as const satisfies readonly AgentTaskTrackingRuntimeArtifact[];

export const agentTaskTrackingRuntimeExternalArtifacts = agentTaskTrackingRuntimeArtifactPaths.filter(
  (artifact) =>
    artifact !== "coverage/agent-task-tracking-runtime.json" &&
    artifact !== "coverage/agent-task-tracking-sync-verifier.json" &&
    artifact !== "test-results/agent-task-tracking-runtime",
);

export const agentTaskTrackingReadinessRequiredEvidence = agentTaskTrackingPackageRequiredEvidence;

export type AgentTaskTrackingDecisionRequiredEvidence = readonly [
  ...typeof agentTaskTrackingReadinessRequiredEvidence,
  "AgentTaskTrackingRun row with queue, issue, tracking-link, and artifact matrices.",
  "CI artifact bundle proving task tracking sync, issue creation, project sync, docs links, gap links, and status traceability.",
];

export function buildAgentTaskTrackingDecisionRequiredEvidence(
  readinessEvidence: typeof agentTaskTrackingReadinessRequiredEvidence,
): AgentTaskTrackingDecisionRequiredEvidence {
  return [
    ...readinessEvidence,
    "AgentTaskTrackingRun row with queue, issue, tracking-link, and artifact matrices.",
    "CI artifact bundle proving task tracking sync, issue creation, project sync, docs links, gap links, and status traceability.",
  ];
}

export const agentTaskTrackingRequiredEvidence = buildAgentTaskTrackingDecisionRequiredEvidence(
  agentTaskTrackingReadinessRequiredEvidence,
);

export type AgentTaskTrackingRuntimeExecutionPolicy = {
  readonly codexMayClassifyQueueAndTrackingLabels: true;
  readonly githubIssueCreationRequiresApprovedGhContext: true;
  readonly githubProjectSyncRequiresApprovedGhContext: true;
  readonly redactedTrackingUrlsOnly: true;
  readonly statusTraceabilityRequiredForClosure: true;
  readonly providerDatabaseRequiredForPersistence: true;
};

export const agentTaskTrackingRuntimeExecutionPolicy: AgentTaskTrackingRuntimeExecutionPolicy = {
  codexMayClassifyQueueAndTrackingLabels: true,
  githubIssueCreationRequiresApprovedGhContext: true,
  githubProjectSyncRequiresApprovedGhContext: true,
  redactedTrackingUrlsOnly: true,
  statusTraceabilityRequiredForClosure: true,
  providerDatabaseRequiredForPersistence: true,
};

const sensitiveAgentTaskTrackingKeyPattern =
  /(token|secret|password|authorization|cookie|github|issue|issueUrl|project|projectItemUrl|tracking|trackingUrl|artifact|artifactUrl|ciRun|ciRunUrl|workflow|commit|repository|branch|pr|pullrequest|queue|task|handoff|gap|tracker|status|trace|ledger|audit|sync|assignee|actor|reviewer|codeowner|label|metadata|tenantId|userId|runId|email|phone|payload|raw|request|response|log|output|transcript|path|database|dsn|stack|error)/i;

const sensitiveAgentTaskTrackingStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:ghp|gho|ghu|ghs|sk|pk|rk|whsec)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/postgres(?:ql)?:\/\/[^\s"'<>]+/gi, "[REDACTED_DSN]"],
  [/\b(?:tenant|user|actor|reviewer|assignee|provider|project|issue|task|run|tracking|queue|handoff|gap|tracker|status|trace|ledger|audit|sync|workflow|ci|commit|repository|branch|pr|pullrequest|codeowner|github)_[A-Za-z0-9_.-]+\b/gi, "[REDACTED_ID]"],
  [/\b(?:coverage|artifacts|test-results|reports|docs|diffs)\/[A-Za-z0-9_./-]{6,}\b/gi, "[REDACTED_ARTIFACT_PATH]"],
];

export function buildAgentTaskTrackingRuntimeExecutionPlan(): AgentTaskTrackingRuntimeExecutionPlan {
  return {
    localCommands: agentTaskTrackingRuntimeLocalCommands,
    externalCommands: agentTaskTrackingRuntimeExternalCommands,
    localArtifacts: agentTaskTrackingRuntimeLocalArtifacts,
    externalArtifacts: agentTaskTrackingRuntimeExternalArtifacts,
    taskSyncVerifierExecutionAllowed: false,
    githubIssueCreationAllowed: false,
    githubProjectSyncAllowed: false,
    handoffDocLinkExecutionAllowed: false,
    gapTrackerLinkExecutionAllowed: false,
    statusTraceabilityExecutionAllowed: false,
    ledgerVerificationExecutionAllowed: false,
    handoffAuditExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
    executionPolicy: agentTaskTrackingRuntimeExecutionPolicy,
    externalEvidenceRequired: agentTaskTrackingRuntimeRequiredExternalEvidence,
  };
}

function redactAgentTaskTrackingString(value: string, redactions: Set<string>): string {
  return sensitiveAgentTaskTrackingStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactAgentTaskTrackingValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveAgentTaskTrackingKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactAgentTaskTrackingString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactAgentTaskTrackingValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactAgentTaskTrackingValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedAgentTaskTrackingArtifact(artifact: unknown): unknown {
  return redactAgentTaskTrackingValue(artifact, new Set<string>());
}

export function buildAgentTaskTrackingRuntimeArtifactReview(
  artifactPath: AgentTaskTrackingRuntimeArtifact | string,
  artifact: unknown,
): AgentTaskTrackingRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactAgentTaskTrackingValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: agentTaskTrackingRuntimeRequiredExternalEvidence,
  };
}

export function buildAgentTaskTrackingRuntimeRedactedEvidenceBundle(
  artifactPath: AgentTaskTrackingRuntimeArtifact | string,
  artifact: unknown,
): AgentTaskTrackingRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    sourceArtifactPath: artifactPath,
    artifactPath: "coverage/agent-task-tracking-redacted-evidence-bundle.json",
    review: buildAgentTaskTrackingRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: agentTaskTrackingRuntimeArtifactPaths,
    externalEvidenceRequired: agentTaskTrackingRuntimeRequiredExternalEvidence,
    githubIssueCreationAllowed: false,
    githubProjectSyncAllowed: false,
    statusTraceabilityExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
    persistenceExecutionAllowed: false,
  };
}

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
  {
    id: "ci-task-tracking-artifacts",
    command: "capture CI agent task tracking artifacts",
    artifact: "coverage/agent-task-tracking-ci-run-redacted.json",
    status: "traceability-gated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted agent task tracking evidence bundle",
    artifact: "coverage/agent-task-tracking-redacted-evidence-bundle.json",
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

const queueTasks = agentTaskTrackingTaskIds.map((id, index) => {
  const gapIds = agentTaskTrackingGapIds[index];
  const target = agentTaskTrackingTargets[index] ?? "Local terminal";
  return {
    id,
    title: id,
    target,
    priority: agentTaskTrackingPriorities[index] ?? "high",
    phase: "Phase 16",
    files: ["docs/handoff/manifests/agent-execution-queue.json"],
    gapIds: Array.isArray(gapIds) ? [...gapIds] : [],
    commandPlan: ["pnpm handoff:verify-task-sync"],
    acceptanceEvidence: ["redacted issue label", "project item label", "gap evidence fields", "status traceability"],
    prompt: "Create or sync redacted tracking evidence for the queued agent task.",
  };
});

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

export function buildAgentTaskTrackingEvidenceDecision(
  input: AgentTaskTrackingEvidenceInput,
): AgentTaskTrackingEvidenceDecision {
  const readinessPlan = buildAgentTaskTrackingReadinessPlan({
    queueTasks,
    plannedIssues,
    defaultLabels: [...agentTaskTrackingDefaultLabels],
    verifierPassed: input.verifierPassed,
    githubIssuesCreated: input.githubIssuesCreated,
    githubProjectItemsLinked: input.githubProjectItemsLinked,
    handoffDocsLinked: input.handoffDocsLinked,
    gapTrackerLinked: input.gapTrackerLinked,
    statusUpdatesTraceable: input.statusUpdatesTraceable,
  });
  const capturedArtifacts = new Set(input.capturedArtifacts);
  const completedCommands = new Set(input.completedCommands);
  const missingArtifacts = agentTaskTrackingRuntimeArtifactPaths.filter((artifact) => !capturedArtifacts.has(artifact));
  const missingCommands = agentTaskTrackingRuntimeCommands.filter((command) => !completedCommands.has(command));
  const blockers = [...readinessPlan.blockers];

  if (!input.queueIssueParityVerified) {
    blockers.push("Queue task parity with planned GitHub issues must be verified.");
  }
  if (!input.defaultLabelsApplied) {
    blockers.push("Default agent-task, gap-tracked, and verification-required labels must be applied.");
  }
  if (!input.targetPriorityLabelsApplied) {
    blockers.push("Target and priority labels must be applied to every tracked issue.");
  }
  if (!input.gapIdsLinked) {
    blockers.push("Gap IDs must be linked on every tracked issue.");
  }
  if (!input.acceptanceEvidenceFieldsLinked) {
    blockers.push("Acceptance evidence fields must be linked on every tracked issue.");
  }
  if (!input.redactedTrackingUrlsRecorded) {
    blockers.push("Redacted tracking labels or URLs must be recorded without secrets.");
  }
  if (!input.ciTaskTrackingArtifactsCaptured) {
    blockers.push("CI task-tracking artifacts must be captured.");
  }
  if (!input.agentTaskTrackingRunPersisted) {
    blockers.push("AgentTaskTrackingRun persistence row must be captured for durable traceability.");
  }
  if (missingArtifacts.length > 0) {
    blockers.push("Every required agent task tracking artifact must be captured.");
  }
  if (missingCommands.length > 0) {
    blockers.push("Every required agent task tracking command must be completed.");
  }

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    missingArtifacts,
    missingCommands,
    requiredArtifacts: agentTaskTrackingRuntimeArtifactPaths,
    requiredCommands: agentTaskTrackingRuntimeCommands,
    requiredEvidence: agentTaskTrackingRequiredEvidence,
    blockers,
  };
}

