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

export interface AgentExecutionLedgerRunPersistenceContract {
  readonly prismaModel: "AgentExecutionLedgerRun";
  readonly tenantRelation: "agentExecutionLedgerRuns";
  readonly uniqueKey: readonly ["tenantId", "runId"];
  readonly jsonFields: readonly [
    "queueTaskMatrix",
    "ledgerExecutionMatrix",
    "changedFilesMatrix",
    "evidenceArtifactManifest"
  ];
  readonly requiredBooleanProofs: readonly [
    "verifierPassed",
    "handoffAuditPassed",
    "handoffDocsVerified",
    "handoffNextComputed",
    "queueLedgerParityVerified",
    "agentCommandPlansRecorded",
    "redactedCommandTranscriptsCaptured",
    "changedFilesRecorded",
    "providerEvidenceCaptured",
    "remainingGapsRecorded",
    "secretSafetyReviewed",
    "gapTrackerUpdated",
    "externalAgentResultsImported",
    "ciLedgerArtifactsCaptured"
  ];
  readonly redactedArtifactFields: readonly [
    "commandTranscriptArtifactPath",
    "diffSummaryArtifactPath",
    "providerEvidenceArtifactPath",
    "secretSafetyArtifactPath",
    "gapTrackerUpdateArtifactPath",
    "externalResultsImportArtifactPath"
  ];
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
  "coverage/agent-execution-redacted-evidence-bundle.json",
  "test-results/agent-execution-ledger-runtime",
] as const;

export const agentExecutionLedgerRuntimeProofFiles = [
  "apps/web/lib/agentExecutionLedgerRuntime.ts",
  "apps/web/tests/agent-execution-ledger-runtime-static.test.ts",
  "HANDOFF_TO_CODEX.md",
  "HANDOFF_TO_JULES.md",
  "HANDOFF_TO_CLAUDE_CODE.md",
  "docs/handoff/README.md",
  "docs/handoff/AGENT_EXECUTION_QUEUE.md",
  "docs/handoff/manifests/agent-execution-queue.json",
  "docs/handoff/manifests/agent-execution-ledger.json",
  "scripts/handoff/verify-agent-execution-ledger.mjs",
  "packages/handoff/src/index.ts",
  "packages/handoff/tests/handoff-plan.test.ts",
  ".github/workflows/ci.yml",
  "packages/db/prisma/schema.prisma",
  "packages/db/prisma/migrations/20260609023000_add_agent_execution_ledger_runs/migration.sql",
  "testing/manifests/unit-test-manifest.json",
] as const;

export const agentExecutionLedgerRuntimeCommands = [
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
  "pnpm handoff:verify-docs",
  "pnpm handoff:next",
  "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
  "capture redacted agent command transcripts",
  "record agent changed-files matrix",
  "capture provider evidence labels",
  "record remaining gaps and risks",
  "complete agent execution secret-safety review",
  "update GAP_TRACKER rows with execution evidence",
  "external Codex/Jules/Claude/local execution result import",
  "capture CI agent execution ledger artifacts",
] as const;

export const agentExecutionLedgerRuntimeLocalCommands = [
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
  "pnpm handoff:verify-docs",
  "pnpm handoff:next",
  "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
  "record remaining gaps and risks",
] as const;

const agentExecutionLedgerRuntimeLocalCommandSet = new Set<string>(agentExecutionLedgerRuntimeLocalCommands);

export const agentExecutionLedgerRuntimeExternalCommands = agentExecutionLedgerRuntimeCommands.filter(
  (command) => !agentExecutionLedgerRuntimeLocalCommandSet.has(command),
);

export const agentExecutionLedgerRuntimeRequiredExternalEvidence = [
  "External Codex, Jules, Claude Code, and local-terminal execution results must be imported only after completion with redacted transcripts.",
  "Command transcripts, diffs, changed-file matrices, and provider evidence must redact secrets, environment values, URLs, customer data, and provider IDs.",
  "Secret-safety review must be recorded before any external execution result updates GAP_TRACKER rows.",
  "CI ledger artifacts must be retained with run URLs, provider labels, and raw logs redacted.",
  "Redacted agent execution ledger evidence bundle captured without raw transcripts, diffs, provider IDs, URLs, environment values, customer data, or actor identifiers.",
] as const;

export type AgentExecutionLedgerRuntimeExecutionPolicy = {
  readonly codexMayClassifyLedgerAndQueue: true;
  readonly externalResultsMustBeImportedAfterAgentCompletion: true;
  readonly commandTranscriptsMustBeRedacted: true;
  readonly secretSafetyReviewRequired: true;
  readonly providerEvidenceLabelsOnly: true;
  readonly ciProviderRequiredForLedgerArtifacts: true;
};

export const agentExecutionLedgerRuntimeExecutionPolicy: AgentExecutionLedgerRuntimeExecutionPolicy = {
  codexMayClassifyLedgerAndQueue: true,
  externalResultsMustBeImportedAfterAgentCompletion: true,
  commandTranscriptsMustBeRedacted: true,
  secretSafetyReviewRequired: true,
  providerEvidenceLabelsOnly: true,
  ciProviderRequiredForLedgerArtifacts: true,
};

export type AgentExecutionLedgerRuntimeArtifact = (typeof agentExecutionLedgerRuntimeArtifactPaths)[number];

export type AgentExecutionLedgerRuntimeCommand = (typeof agentExecutionLedgerRuntimeCommands)[number];

export const agentExecutionLedgerRuntimeLocalArtifacts = [
  "coverage/agent-execution-ledger-runtime.json",
  "coverage/agent-execution-ledger-verifier.json",
  "coverage/agent-execution-handoff-audit.json",
  "coverage/agent-execution-queue-parity.json",
  "test-results/agent-execution-ledger-runtime",
] as const satisfies readonly AgentExecutionLedgerRuntimeArtifact[];

export const agentExecutionLedgerRuntimeExternalArtifacts = agentExecutionLedgerRuntimeArtifactPaths.filter(
  (artifact) =>
    artifact !== "coverage/agent-execution-ledger-runtime.json" &&
    artifact !== "coverage/agent-execution-ledger-verifier.json" &&
    artifact !== "coverage/agent-execution-handoff-audit.json" &&
    artifact !== "coverage/agent-execution-queue-parity.json" &&
    artifact !== "test-results/agent-execution-ledger-runtime",
);

export type AgentExecutionLedgerRuntimeEvidenceInput = {
  verifierPassed: boolean;
  handoffAuditPassed: boolean;
  handoffDocsVerified: boolean;
  handoffNextComputed: boolean;
  queueLedgerParityVerified: boolean;
  agentCommandPlansRecorded: boolean;
  redactedCommandTranscriptsCaptured: boolean;
  changedFilesRecorded: boolean;
  providerEvidenceCaptured: boolean;
  remainingGapsRecorded: boolean;
  secretSafetyReviewed: boolean;
  gapTrackerUpdated: boolean;
  externalAgentResultsImported: boolean;
  ciLedgerArtifactsCaptured: boolean;
  requiredCommandsRun: readonly AgentExecutionLedgerRuntimeCommand[];
  capturedArtifacts: readonly AgentExecutionLedgerRuntimeArtifact[];
};

export type AgentExecutionLedgerRuntimeEvidenceDecision = {
  status: "complete" | "blocked";
  blockers: string[];
  missingArtifacts: AgentExecutionLedgerRuntimeArtifact[];
  requiredCommands: typeof agentExecutionLedgerRuntimeCommands;
  requiredEvidence: typeof agentExecutionLedgerRuntimeArtifactPaths;
  handoffPolicy: {
    externalResultsMustBeImported: true;
    commandTranscriptsMustBeRedacted: true;
    secretSafetyReviewRequired: true;
  };
};

export interface AgentExecutionLedgerRuntimeExecutionPlan {
  readonly localCommands: typeof agentExecutionLedgerRuntimeLocalCommands;
  readonly externalCommands: typeof agentExecutionLedgerRuntimeExternalCommands;
  readonly localArtifacts: typeof agentExecutionLedgerRuntimeLocalArtifacts;
  readonly externalArtifacts: typeof agentExecutionLedgerRuntimeExternalArtifacts;
  readonly verifierExecutionAllowed: false;
  readonly handoffAuditExecutionAllowed: false;
  readonly docsVerificationExecutionAllowed: false;
  readonly nextTaskExecutionAllowed: false;
  readonly queueParityExecutionAllowed: false;
  readonly externalAgentExecutionAllowed: false;
  readonly transcriptImportExecutionAllowed: false;
  readonly providerEvidenceImportAllowed: false;
  readonly gapTrackerEvidenceUpdateAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
  readonly executionPolicy: typeof agentExecutionLedgerRuntimeExecutionPolicy;
  readonly externalEvidenceRequired: typeof agentExecutionLedgerRuntimeRequiredExternalEvidence;
}

export interface AgentExecutionLedgerRuntimeRedactedEvidenceBundle {
  readonly status: "redacted-evidence-bundle-ready";
  readonly artifactPath: "coverage/agent-execution-redacted-evidence-bundle.json";
  readonly review: AgentExecutionLedgerRuntimeArtifactReview;
  readonly requiredArtifacts: typeof agentExecutionLedgerRuntimeArtifactPaths;
  readonly externalEvidenceRequired: typeof agentExecutionLedgerRuntimeRequiredExternalEvidence;
  readonly externalAgentExecutionAllowed: false;
  readonly transcriptImportExecutionAllowed: false;
  readonly ciArtifactExecutionAllowed: false;
}

export interface AgentExecutionLedgerRuntimeArtifactReview {
  readonly artifactPath: AgentExecutionLedgerRuntimeArtifact | string;
  readonly redactedArtifact: unknown;
  readonly redactions: readonly string[];
  readonly containsUnredactedSensitiveValues: false;
  readonly externalEvidenceRequired: typeof agentExecutionLedgerRuntimeRequiredExternalEvidence;
}

const sensitiveAgentExecutionKeyPattern =
  /(token|secret|password|authorization|cookie|env|provider|projectId|resourceId|transcript|command|stdout|stderr|diff|patch|evidence|artifactUrl|ciRunUrl|tenantId|userId|runId|email|phone|apiKey)/i;

const sensitiveAgentExecutionStringPatterns: readonly [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED_TOKEN]"],
  [/https?:\/\/[^\s"'<>]+/gi, "[REDACTED_URL]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]"],
  [/\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}/g, "[REDACTED_PHONE]"],
  [/\b(?:sk|pk|rk|ghp|gho|ghu|ghs|whsec)_[A-Za-z0-9_]+\b/g, "[REDACTED_PROVIDER_TOKEN]"],
  [/\b(?:tenant|user|project|provider|artifact|run|task)_[A-Za-z0-9_-]+\b/g, "[REDACTED_ID]"],
];

export function buildAgentExecutionLedgerRuntimeEvidenceDecision(
  input: AgentExecutionLedgerRuntimeEvidenceInput,
): AgentExecutionLedgerRuntimeEvidenceDecision {
  const blockers = [
    !input.verifierPassed && "Run agent execution ledger verifier.",
    !input.handoffAuditPassed && "Run handoff audit.",
    !input.handoffDocsVerified && "Run handoff docs verification.",
    !input.handoffNextComputed && "Run handoff next computation.",
    !input.queueLedgerParityVerified && "Verify queue and ledger parity.",
    !input.agentCommandPlansRecorded && "Record agent command plans.",
    !input.redactedCommandTranscriptsCaptured && "Capture redacted command transcripts.",
    !input.changedFilesRecorded && "Record changed files matrix.",
    !input.providerEvidenceCaptured && "Capture provider evidence labels.",
    !input.remainingGapsRecorded && "Record remaining gaps and risks.",
    !input.secretSafetyReviewed && "Complete secret-safety review.",
    !input.gapTrackerUpdated && "Update GAP_TRACKER rows with exact evidence and blockers.",
    !input.externalAgentResultsImported && "Import external Codex/Jules/Claude/local execution results.",
    !input.ciLedgerArtifactsCaptured && "Capture CI ledger artifacts.",
  ].filter(Boolean) as string[];

  const missingArtifacts = agentExecutionLedgerRuntimeArtifactPaths.filter(
    (artifact) => !input.capturedArtifacts.includes(artifact),
  );
  const missingCommands = agentExecutionLedgerRuntimeCommands.filter(
    (command) => !input.requiredCommandsRun.includes(command),
  );

  return {
    status: blockers.length === 0 && missingArtifacts.length === 0 && missingCommands.length === 0 ? "complete" : "blocked",
    blockers: [
      ...blockers,
      ...missingCommands.map((command) => `Required command not recorded: ${command}`),
    ],
    missingArtifacts,
    requiredCommands: agentExecutionLedgerRuntimeCommands,
    requiredEvidence: agentExecutionLedgerRuntimeArtifactPaths,
    handoffPolicy: {
      externalResultsMustBeImported: true,
      commandTranscriptsMustBeRedacted: true,
      secretSafetyReviewRequired: true,
    },
  };
}

export function buildAgentExecutionLedgerRuntimeExecutionPlan(): AgentExecutionLedgerRuntimeExecutionPlan {
  return {
    localCommands: agentExecutionLedgerRuntimeLocalCommands,
    externalCommands: agentExecutionLedgerRuntimeExternalCommands,
    localArtifacts: agentExecutionLedgerRuntimeLocalArtifacts,
    externalArtifacts: agentExecutionLedgerRuntimeExternalArtifacts,
    verifierExecutionAllowed: false,
    handoffAuditExecutionAllowed: false,
    docsVerificationExecutionAllowed: false,
    nextTaskExecutionAllowed: false,
    queueParityExecutionAllowed: false,
    externalAgentExecutionAllowed: false,
    transcriptImportExecutionAllowed: false,
    providerEvidenceImportAllowed: false,
    gapTrackerEvidenceUpdateAllowed: false,
    ciArtifactExecutionAllowed: false,
    executionPolicy: agentExecutionLedgerRuntimeExecutionPolicy,
    externalEvidenceRequired: agentExecutionLedgerRuntimeRequiredExternalEvidence,
  };
}

function redactAgentExecutionString(value: string, redactions: Set<string>): string {
  return sensitiveAgentExecutionStringPatterns.reduce((current, [pattern, replacement]) => {
    pattern.lastIndex = 0;
    if (pattern.test(current)) {
      redactions.add(replacement);
    }
    pattern.lastIndex = 0;
    return current.replace(pattern, replacement);
  }, value);
}

function redactAgentExecutionValue(value: unknown, redactions: Set<string>, key?: string): unknown {
  if (key && sensitiveAgentExecutionKeyPattern.test(key)) {
    redactions.add(key);
    return `[REDACTED_${key.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}]`;
  }

  if (typeof value === "string") {
    return redactAgentExecutionString(value, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactAgentExecutionValue(entry, redactions));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactAgentExecutionValue(entryValue, redactions, entryKey),
      ]),
    );
  }

  return value;
}

export function buildRedactedAgentExecutionLedgerArtifact(artifact: unknown): unknown {
  return redactAgentExecutionValue(artifact, new Set<string>());
}

export function buildAgentExecutionLedgerRuntimeArtifactReview(
  artifactPath: AgentExecutionLedgerRuntimeArtifact | string,
  artifact: unknown,
): AgentExecutionLedgerRuntimeArtifactReview {
  const redactions = new Set<string>();
  const redactedArtifact = redactAgentExecutionValue(artifact, redactions);

  return {
    artifactPath,
    redactedArtifact,
    redactions: [...redactions].sort(),
    containsUnredactedSensitiveValues: false,
    externalEvidenceRequired: agentExecutionLedgerRuntimeRequiredExternalEvidence,
  };
}

export function buildAgentExecutionLedgerRuntimeRedactedEvidenceBundle(
  artifactPath: AgentExecutionLedgerRuntimeArtifact | string,
  artifact: unknown,
): AgentExecutionLedgerRuntimeRedactedEvidenceBundle {
  return {
    status: "redacted-evidence-bundle-ready",
    artifactPath: "coverage/agent-execution-redacted-evidence-bundle.json",
    review: buildAgentExecutionLedgerRuntimeArtifactReview(artifactPath, artifact),
    requiredArtifacts: agentExecutionLedgerRuntimeArtifactPaths,
    externalEvidenceRequired: agentExecutionLedgerRuntimeRequiredExternalEvidence,
    externalAgentExecutionAllowed: false,
    transcriptImportExecutionAllowed: false,
    ciArtifactExecutionAllowed: false,
  };
}

export const agentExecutionLedgerRuntimeMatrix = [
  {
    id: "ledger-verifier",
    command: "pnpm handoff:verify-ledger",
    artifact: "coverage/agent-execution-ledger-verifier.json",
    status: "wired",
  },
  {
    id: "handoff-audit",
    command: "pnpm handoff:audit",
    artifact: "coverage/agent-execution-handoff-audit.json",
    status: "audit-gated",
  },
  {
    id: "handoff-docs-verification",
    command: "pnpm handoff:verify-docs",
    artifact: "coverage/agent-execution-handoff-audit.json",
    status: "audit-gated",
  },
  {
    id: "handoff-next-computation",
    command: "pnpm handoff:next",
    artifact: "coverage/agent-execution-queue-summary.json",
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
    command: "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
    artifact: "coverage/agent-execution-command-transcripts-redacted.json",
    status: "agent-gated",
  },
  {
    id: "command-transcripts",
    command: "capture redacted agent command transcripts",
    artifact: "coverage/agent-execution-command-transcripts-redacted.json",
    status: "agent-gated",
  },
  {
    id: "changed-files-matrix",
    command: "record agent changed-files matrix",
    artifact: "coverage/agent-execution-diff-summary-redacted.json",
    status: "agent-gated",
  },
  {
    id: "provider-evidence-labels",
    command: "capture provider evidence labels",
    artifact: "coverage/agent-execution-provider-evidence-redacted.json",
    status: "agent-gated",
  },
  {
    id: "remaining-gaps-risks",
    command: "record remaining gaps and risks",
    artifact: "coverage/agent-execution-diff-summary-redacted.json",
    status: "agent-gated",
  },
  {
    id: "secret-safety-review",
    command: "complete agent execution secret-safety review",
    artifact: "coverage/agent-execution-secret-safety-review.json",
    status: "agent-gated",
  },
  {
    id: "secret-safe-result-import",
    command: "external Codex/Jules/Claude/local execution result import",
    artifact: "coverage/agent-execution-external-results-imported.json",
    status: "agent-gated",
  },
  {
    id: "gap-tracker-updates",
    command: "update GAP_TRACKER rows with execution evidence",
    artifact: "coverage/agent-execution-gap-tracker-updates.json",
    status: "agent-gated",
  },
  {
    id: "ci-ledger-artifacts",
    command: "capture CI agent execution ledger artifacts",
    artifact: "coverage/agent-execution-ci-run-redacted.json",
    status: "ci-gated",
  },
  {
    id: "redacted-evidence-bundle",
    command: "retain redacted agent execution ledger evidence bundle",
    artifact: "coverage/agent-execution-redacted-evidence-bundle.json",
    status: "ci-gated",
  },
] as const satisfies readonly AgentExecutionLedgerRuntimeMatrixEntry[];

export const agentExecutionLedgerRunPersistenceContract: AgentExecutionLedgerRunPersistenceContract = {
  prismaModel: "AgentExecutionLedgerRun",
  tenantRelation: "agentExecutionLedgerRuns",
  uniqueKey: ["tenantId", "runId"],
  jsonFields: [
    "queueTaskMatrix",
    "ledgerExecutionMatrix",
    "changedFilesMatrix",
    "evidenceArtifactManifest",
  ],
  requiredBooleanProofs: [
    "verifierPassed",
    "handoffAuditPassed",
    "handoffDocsVerified",
    "handoffNextComputed",
    "queueLedgerParityVerified",
    "agentCommandPlansRecorded",
    "redactedCommandTranscriptsCaptured",
    "changedFilesRecorded",
    "providerEvidenceCaptured",
    "remainingGapsRecorded",
    "secretSafetyReviewed",
    "gapTrackerUpdated",
    "externalAgentResultsImported",
    "ciLedgerArtifactsCaptured",
  ],
  redactedArtifactFields: [
    "commandTranscriptArtifactPath",
    "diffSummaryArtifactPath",
    "providerEvidenceArtifactPath",
    "secretSafetyArtifactPath",
    "gapTrackerUpdateArtifactPath",
    "externalResultsImportArtifactPath",
  ],
};

export const agentExecutionLedgerRuntimeReadiness = buildAgentExecutionLedgerReadinessPlan({
  queueTasks: agentExecutionLedgerTaskIds.map((id, index) => {
    const target = agentExecutionLedgerTargets[index] ?? "Local terminal";
    return {
      id,
      title: id,
      target,
      priority: index < 3 ? "critical" : "high",
      phase: "Phase 16",
      files: ["GAP_TRACKER.md"],
      gapIds: ["GAP-119"],
      commandPlan: ["pnpm handoff:verify-ledger"],
      acceptanceEvidence: ["redacted execution evidence"],
      prompt: "Import redacted agent execution result.",
    };
  }),
  executions: agentExecutionLedgerTaskIds.map((id, index) => {
    const assignedAgent = agentExecutionLedgerTargets[index] ?? "Local terminal";
    return {
      taskId: id,
      status: "not_executed",
      assignedAgent,
      commandsRun: [],
      filesChanged: [],
      evidenceArtifacts: [],
      remainingGaps: ["GAP-119"],
      secretSafety: "no_evidence_recorded",
    };
  }),
  verifierPassed: false,
  handoffAuditPassed: false,
  gapTrackerUpdated: false,
  externalAgentResultsImported: false,
});

