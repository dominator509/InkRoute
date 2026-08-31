export type AgentTarget = "Codex" | "Jules" | "Claude Code" | "Local terminal" | "Provider console" | "Legal reviewer" | "CI provider";
export type HandoffPriority = "critical" | "high" | "medium" | "low";
export type GapSeverity = "Critical" | "High" | "Medium" | "Low";
export type GapBlocker = "Yes" | "No";
export type GapAuditStatus = "pass" | "warn" | "fail";

export interface GapTrackerRecord {
  readonly gapId: string;
  readonly phase: string;
  readonly area: string;
  readonly description: string;
  readonly severity: GapSeverity;
  readonly blocksProduction: GapBlocker;
  readonly currentStatus: string;
  readonly filesAffected: string;
  readonly remainingWork: string;
  readonly target: string;
  readonly suggestedPrompt: string;
  readonly verificationNeeded: string;
}

export interface GapAuditFinding {
  readonly status: GapAuditStatus;
  readonly gapId?: string;
  readonly message: string;
}

export interface GapAuditSummary {
  readonly total: number;
  readonly blocking: number;
  readonly bySeverity: Record<GapSeverity, number>;
  readonly byPhase: Record<string, number>;
  readonly firstOpenCriticalGapIds: readonly string[];
  readonly findings: readonly GapAuditFinding[];
}

export interface AgentExecutionTask {
  readonly id: string;
  readonly title: string;
  readonly target: AgentTarget;
  readonly priority: HandoffPriority;
  readonly phase: string;
  readonly files: readonly string[];
  readonly gapIds: readonly string[];
  readonly commandPlan: readonly string[];
  readonly acceptanceEvidence: readonly string[];
  readonly prompt: string;
}

export interface AgentExecutionQueueSummary {
  readonly total: number;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly productionBlockingGapIds: readonly string[];
  readonly firstTaskTitle: string;
}

export const gapTrackerColumnNames = [
  "Gap ID",
  "Phase",
  "Area",
  "Description",
  "Severity",
  "Blocks production",
  "Current status",
  "Files affected",
  "What still needs to be done",
  "Best target tool/platform",
  "Suggested handoff prompt",
  "Verification/test needed",
] as const;

const severityRank: Record<HandoffPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalizeCell(cell: string): string {
  return cell.trim().replace(/<br\s*\/?>(\s*)/gi, " ").replace(/\s+/g, " ");
}

function splitMarkdownTableRow(row: string): readonly string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => normalizeCell(cell));
}

function toSeverity(value: string): GapSeverity {
  if (value === "Critical" || value === "High" || value === "Medium" || value === "Low") {
    return value;
  }
  return "Medium";
}

function toBlocker(value: string): GapBlocker {
  if (value.startsWith("Yes")) {
    return "Yes";
  }
  return "No";
}

export function extractGapRecords(markdown: string): readonly GapTrackerRecord[] {
  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => /^\| GAP-\d{3,}/.test(line.trim()));

  return rows.map((row) => {
    const cells = splitMarkdownTableRow(row);
    return {
      gapId: cells[0] ?? "GAP-UNKNOWN",
      phase: cells[1] ?? "Unknown phase",
      area: cells[2] ?? "Unknown area",
      description: cells[3] ?? "",
      severity: toSeverity(cells[4] ?? "Medium"),
      blocksProduction: toBlocker(cells[5] ?? "No"),
      currentStatus: cells[6] ?? "",
      filesAffected: cells[7] ?? "",
      remainingWork: cells[8] ?? "",
      target: cells[9] ?? "",
      suggestedPrompt: cells[10] ?? "",
      verificationNeeded: cells[11] ?? "",
    } satisfies GapTrackerRecord;
  });
}

export function auditGapRecords(records: readonly GapTrackerRecord[]): GapAuditSummary {
  const findings: GapAuditFinding[] = [];
  const seen = new Set<string>();
  let previousNumber = 0;

  for (const record of records) {
    const numericId = Number(record.gapId.replace("GAP-", ""));
    if (!Number.isFinite(numericId)) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Gap ID is not numeric." });
    }
    if (seen.has(record.gapId)) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Duplicate gap ID." });
    }
    seen.add(record.gapId);
    if (numericId !== previousNumber + 1) {
      findings.push({ status: "warn", gapId: record.gapId, message: `Gap IDs are not strictly sequential at expected ${previousNumber + 1}.` });
    }
    previousNumber = Number.isFinite(numericId) ? numericId : previousNumber;
    if (record.blocksProduction === "Yes" && record.verificationNeeded.length < 12) {
      findings.push({ status: "fail", gapId: record.gapId, message: "Production-blocking gap lacks verification detail." });
    }
    if (record.suggestedPrompt.length < 20) {
      findings.push({ status: "warn", gapId: record.gapId, message: "Suggested handoff prompt is short." });
    }
    if (record.filesAffected.length < 3) {
      findings.push({ status: "warn", gapId: record.gapId, message: "Files affected field is sparse." });
    }
  }

  const bySeverity = records.reduce<Record<GapSeverity, number>>(
    (acc, record) => {
      acc[record.severity] += 1;
      return acc;
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 },
  );

  const byPhase = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.phase] = (acc[record.phase] ?? 0) + 1;
    return acc;
  }, {});

  const firstOpenCriticalGapIds = records
    .filter((record) => record.severity === "Critical" && record.blocksProduction === "Yes")
    .slice(0, 12)
    .map((record) => record.gapId);

  return {
    total: records.length,
    blocking: records.filter((record) => record.blocksProduction === "Yes").length,
    bySeverity,
    byPhase,
    firstOpenCriticalGapIds,
    findings,
  };
}

export const phase16AgentExecutionTasks: readonly AgentExecutionTask[] = [
  {
    id: "codex-runtime-verification-001",
    title: "Install dependencies and produce first runtime evidence",
    target: "Codex",
    priority: "critical",
    phase: "Post-Phase 15",
    files: ["package.json", "pnpm-workspace.yaml", "GAP_TRACKER.md", "TESTING_PLAN.md", "docs/phases/PHASE_15_DEPLOYMENT_HANDOFF.md"],
    gapIds: ["GAP-001", "GAP-105", "GAP-113", "GAP-121"],
    commandPlan: [
      "corepack enable",
      "pnpm install",
      "pnpm handoff:verify-docs",
      "pnpm handoff:audit",
      "pnpm typecheck",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
    ],
    acceptanceEvidence: [
      "Committed pnpm-lock.yaml",
      "Exact command output for install/typecheck/test/build",
      "Updated GAP_TRACKER rows for every failing command",
      "No production-ready claim",
    ],
    prompt:
      "Run the first real-runtime verification pass for InkRoute Suite. Install dependencies, commit pnpm-lock.yaml, run handoff audit scripts, typecheck, unit tests, and web/dashboard builds. Fix real dependency/build failures only, preserve architecture, and update GAP_TRACKER.md with exact evidence.",
  },
  {
    id: "codex-quality-gate-enforcement-001",
    title: "Verify and enforce Phase 17 quality gates",
    target: "Codex",
    priority: "critical",
    phase: "Phase 17",
    files: ["package.json", ".github/workflows/ci.yml", "scripts/quality/audit-doc-links.mjs", "scripts/quality/audit-gap-evidence.mjs", "docs/quality/QUALITY_GATE_PROTOCOL.md", "GAP_TRACKER.md"],
    gapIds: ["GAP-122", "GAP-124", "GAP-126", "GAP-127", "GAP-129"],
    commandPlan: ["pnpm quality:all", "pnpm handoff:all", "pnpm --filter @inkroute/quality typecheck", "pnpm --filter @inkroute/quality test"],
    acceptanceEvidence: [
      "Quality gate command output",
      "Updated quality manifests",
      "CI run evidence or exact blocker if CI cannot run",
      "Gap tracker rows updated without production-ready claims",
    ],
    prompt:
      "Verify Phase 17 quality gates in a real installed repo. Run quality and handoff scripts, fix real quality failures, add PR diff-aware gap closure enforcement if feasible, and update GAP_TRACKER.md with exact evidence. Do not close production gaps without runtime/provider proof.",
  },
  {
    id: "jules-database-auth-foundation-001",
    title: "Provision non-production database/auth/storage foundation",
    target: "Jules",
    priority: "critical",
    phase: "Post-Phase 15",
    files: ["packages/db/prisma/schema.prisma", "packages/db/prisma/seed.ts", "packages/auth/src/index.ts", "packages/security/src/index.ts", "deployment/DATABASE_MIGRATION_GUIDE.md", "GAP_TRACKER.md"],
    gapIds: ["GAP-002", "GAP-003", "GAP-005", "GAP-095", "GAP-117"],
    commandPlan: ["pnpm db:generate", "pnpm db:migrate", "pnpm db:seed", "pnpm test:unit"],
    acceptanceEvidence: [
      "Prisma validate/generate output",
      "Migration artifacts reviewed",
      "Seed execution output",
      "Tenant isolation test evidence",
      "Private storage access proof when storage is selected",
    ],
    prompt:
      "Provision a non-production Postgres/auth/storage foundation for InkRoute Suite. Validate Prisma, generate migrations, run seed data, implement the first tenant-scoped protected dashboard/API access pattern, add cross-tenant denial tests, and update GAP_TRACKER.md with exact evidence.",
  },
  {
    id: "claude-provider-contract-001",
    title: "Implement one provider sandbox end to end",
    target: "Claude Code",
    priority: "high",
    phase: "Post-Phase 15",
    files: ["apps/web/app/api/public", "apps/web/app/api/webhooks", "API_CONTRACTS.md", "ENVIRONMENT_VARIABLES.md", "GAP_TRACKER.md"],
    gapIds: ["GAP-004", "GAP-049", "GAP-050", "GAP-061", "GAP-062", "GAP-063", "GAP-080", "GAP-110"],
    commandPlan: ["pnpm test:unit", "pnpm test:manifest", "pnpm --filter @inkroute/web build"],
    acceptanceEvidence: [
      "Provider sandbox credentials stored outside git",
      "Webhook signature verification test",
      "Idempotency/replay test evidence",
      "Provider-specific docs updated",
    ],
    prompt:
      "Pick one credential-gated provider boundary and implement it in sandbox mode end to end. Add env validation, webhook signature verification when applicable, idempotency checks, persistence hooks or explicit 501 boundaries, tests, and docs. Update GAP_TRACKER.md with exact evidence.",
  },
  {
    id: "local-launch-readiness-001",
    title: "Run launch checklist and collect evidence bundle",
    target: "Local terminal",
    priority: "high",
    phase: "Post-Phase 15",
    files: ["deployment/PRODUCTION_LAUNCH_CHECKLIST.md", "deployment/manifests/production-launch-checklist.json", "docs/handoff/AGENT_EXECUTION_QUEUE.md", "GAP_TRACKER.md"],
    gapIds: ["GAP-113", "GAP-118", "GAP-120", "GAP-121", "GAP-122"],
    commandPlan: ["pnpm deploy:check-env", "pnpm deploy:checklist", "pnpm deploy:gaps", "pnpm handoff:audit", "pnpm handoff:next"],
    acceptanceEvidence: ["Redacted environment readiness report", "Launch checklist output", "Gap audit report", "Named owners for launch operations"],
    prompt:
      "Run the Phase 15 and Phase 16 readiness scripts in a real local terminal, collect redacted evidence, assign owners, and update GAP_TRACKER.md and deployment runbooks without changing production status prematurely.",
  },
];

export function summarizeAgentExecutionQueue(tasks: readonly AgentExecutionTask[] = phase16AgentExecutionTasks): AgentExecutionQueueSummary {
  const byPriority = tasks.reduce<Record<HandoffPriority, number>>(
    (acc, task) => {
      acc[task.priority] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
  const productionBlockingGapIds = Array.from(new Set(tasks.flatMap((task) => task.gapIds))).sort();

  return {
    total: tasks.length,
    critical: byPriority.critical,
    high: byPriority.high,
    medium: byPriority.medium,
    low: byPriority.low,
    productionBlockingGapIds,
    firstTaskTitle: [...tasks].sort((a, b) => severityRank[a.priority] - severityRank[b.priority])[0]?.title ?? "No tasks defined",
  };
}

export function getTasksForAgent(agent: AgentTarget, tasks: readonly AgentExecutionTask[] = phase16AgentExecutionTasks): readonly AgentExecutionTask[] {
  return tasks
    .filter((task) => task.target === agent)
    .sort((a, b) => severityRank[a.priority] - severityRank[b.priority] || a.id.localeCompare(b.id));
}

export function renderAgentPrompt(task: AgentExecutionTask): string {
  return [
    `# ${task.title}`,
    "",
    `Target: ${task.target}`,
    `Priority: ${task.priority}`,
    `Phase: ${task.phase}`,
    `Gap IDs: ${task.gapIds.join(", ")}`,
    "",
    "## Prompt",
    task.prompt,
    "",
    "## Files to inspect first",
    ...task.files.map((file) => `- ${file}`),
    "",
    "## Command plan",
    ...task.commandPlan.map((command) => `- \`${command}\``),
    "",
    "## Acceptance evidence",
    ...task.acceptanceEvidence.map((evidence) => `- ${evidence}`),
  ].join("\n");
}

export type AgentExecutionStatus = "not_executed" | "in_progress_redacted" | "completed_redacted" | "blocked_redacted";
export type AgentExecutionSecretSafety = "no_evidence_recorded" | "redacted_review_pending" | "secret_safe_redacted";

export interface AgentExecutionLedgerEntry {
  readonly taskId: string;
  readonly status: AgentExecutionStatus;
  readonly assignedAgent: AgentTarget;
  readonly commandsRun: readonly string[];
  readonly filesChanged: readonly string[];
  readonly evidenceArtifacts: readonly string[];
  readonly remainingGaps: readonly string[];
  readonly secretSafety: AgentExecutionSecretSafety;
}

export interface AgentExecutionLedgerReadinessInput {
  readonly queueTasks: readonly AgentExecutionTask[];
  readonly executions: readonly AgentExecutionLedgerEntry[];
  readonly verifierPassed: boolean;
  readonly handoffAuditPassed: boolean;
  readonly gapTrackerUpdated: boolean;
  readonly externalAgentResultsImported: boolean;
}

export interface AgentExecutionLedgerReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingExecutionTaskIds: readonly string[];
  readonly unknownExecutionTaskIds: readonly string[];
  readonly duplicateExecutionTaskIds: readonly string[];
  readonly incompleteExecutionTaskIds: readonly string[];
  readonly unsafeEvidenceFields: readonly string[];
  readonly requiredCommands: typeof agentExecutionLedgerRequiredCommands;
  readonly requiredEvidence: typeof agentExecutionLedgerRequiredEvidence;
  readonly blockers: readonly string[];
}

const unsafeAgentExecutionEvidencePatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /vercel_[A-Za-z0-9_]{20,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

function containsUnsafeAgentExecutionEvidence(value: string): boolean {
  return unsafeAgentExecutionEvidencePatterns.some((pattern) => pattern.test(value));
}

export const agentExecutionLedgerRequiredCommands = [
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

export const agentExecutionLedgerRequiredEvidence = [
  "Completed redacted ledger entry for every Phase 16 queue task.",
  "Commands run, changed files, evidence artifacts, remaining gaps, and risks for each agent execution.",
  "Secret-safe review status for every completed execution.",
  "Updated GAP_TRACKER rows with exact evidence and unresolved blockers.",
  "Handoff audit output and imported external agent result labels.",
] as const;

export function buildAgentExecutionLedgerReadinessPlan(
  input: AgentExecutionLedgerReadinessInput,
): AgentExecutionLedgerReadinessPlan {
  const queueTaskIds = new Set(input.queueTasks.map((task) => task.id));
  const seenExecutionIds = new Set<string>();
  const duplicateExecutionTaskIds: string[] = [];
  const executionsByTaskId = new Map<string, AgentExecutionLedgerEntry>();

  for (const execution of input.executions) {
    if (seenExecutionIds.has(execution.taskId)) {
      duplicateExecutionTaskIds.push(execution.taskId);
    }
    seenExecutionIds.add(execution.taskId);
    executionsByTaskId.set(execution.taskId, execution);
  }

  const missingExecutionTaskIds = input.queueTasks
    .filter((task) => !executionsByTaskId.has(task.id))
    .map((task) => task.id);
  const unknownExecutionTaskIds = input.executions
    .filter((execution) => !queueTaskIds.has(execution.taskId))
    .map((execution) => execution.taskId);
  const incompleteExecutionTaskIds: string[] = [];
  const unsafeEvidenceFields: string[] = [];

  for (const task of input.queueTasks) {
    const execution = executionsByTaskId.get(task.id);
    if (!execution) continue;

    if (execution.assignedAgent !== task.target) {
      incompleteExecutionTaskIds.push(`${task.id}:assignedAgent`);
    }
    if (execution.status !== "completed_redacted") {
      incompleteExecutionTaskIds.push(task.id);
    }
    if (execution.status === "completed_redacted" && execution.commandsRun.length === 0) {
      incompleteExecutionTaskIds.push(`${task.id}:commandsRun`);
    }
    if (execution.status === "completed_redacted" && execution.evidenceArtifacts.length === 0) {
      incompleteExecutionTaskIds.push(`${task.id}:evidenceArtifacts`);
    }
    if (execution.status === "completed_redacted" && execution.secretSafety !== "secret_safe_redacted") {
      incompleteExecutionTaskIds.push(`${task.id}:secretSafety`);
    }
    for (const gapId of task.gapIds) {
      if (execution.status !== "completed_redacted" && !execution.remainingGaps.includes(gapId)) {
        incompleteExecutionTaskIds.push(`${task.id}:${gapId}`);
      }
    }

    const evidenceFields: Array<readonly [string, string]> = [
      ["taskId", execution.taskId],
      ["assignedAgent", execution.assignedAgent],
      ...execution.commandsRun.map((value, index) => ["commandsRun:" + index, value] as const),
      ...execution.filesChanged.map((value, index) => ["filesChanged:" + index, value] as const),
      ...execution.evidenceArtifacts.map((value, index) => ["evidenceArtifacts:" + index, value] as const),
      ...execution.remainingGaps.map((value, index) => ["remainingGaps:" + index, value] as const),
      ["secretSafety", execution.secretSafety],
    ];
    evidenceFields.forEach(([field, value]) => {
      if (containsUnsafeAgentExecutionEvidence(value)) {
        unsafeEvidenceFields.push(task.id + ":" + field);
      }
    });
  }

  const blockers: string[] = [];
  if (missingExecutionTaskIds.length > 0) {
    blockers.push("Every Phase 16 queue task must have an execution ledger entry.");
  }
  if (unknownExecutionTaskIds.length > 0) {
    blockers.push("Execution ledger must not contain tasks outside the Phase 16 queue.");
  }
  if (duplicateExecutionTaskIds.length > 0) {
    blockers.push("Execution ledger task ids must be unique.");
  }
  if (incompleteExecutionTaskIds.length > 0) {
    blockers.push("Every handoff execution must be completed_redacted with commands, evidence artifacts, matching agent, and secret-safe review.");
  }
  if (unsafeEvidenceFields.length > 0) {
    blockers.push("Agent execution ledger must not contain secrets, database URLs, private keys, PII, or payment payloads.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm handoff:verify-ledger must pass.");
  }
  if (!input.handoffAuditPassed) {
    blockers.push("Handoff audit scripts must pass after importing execution results.");
  }
  if (!input.gapTrackerUpdated) {
    blockers.push("GAP_TRACKER.md must be updated with exact execution evidence and remaining blockers.");
  }
  if (!input.externalAgentResultsImported) {
    blockers.push("External Codex/Jules/Claude/local execution results must be imported into the redacted ledger.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingExecutionTaskIds,
    unknownExecutionTaskIds,
    duplicateExecutionTaskIds,
    incompleteExecutionTaskIds,
    unsafeEvidenceFields,
    requiredCommands: agentExecutionLedgerRequiredCommands,
    requiredEvidence: agentExecutionLedgerRequiredEvidence,
    blockers,
  };
}

export interface HandoffToolingRuntimeReadinessInput {
  readonly requiredRootScripts: readonly string[];
  readonly rootScripts: Readonly<Record<string, string>>;
  readonly requiredReports: readonly string[];
  readonly existingReports: readonly string[];
  readonly requiredScriptFiles: readonly string[];
  readonly existingScriptFiles: readonly string[];
  readonly requiredDocs: readonly string[];
  readonly existingDocs: readonly string[];
  readonly requiredCiEvidence: readonly string[];
  readonly ciWorkflowText: string;
  readonly handoffPackageScripts: Readonly<Record<string, string>>;
  readonly queueTaskCount: number;
  readonly ledgerExecutionCount: number;
  readonly dependenciesInstalled: boolean;
  readonly packageTypecheckPassed: boolean;
  readonly packageTestsPassed: boolean;
  readonly handoffScriptsExecuted: boolean;
  readonly verifierPassed: boolean;
  readonly ciRunCaptured: boolean;
  readonly reportArtifactsCaptured: boolean;
}

export interface HandoffToolingRuntimeReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingRootScripts: readonly string[];
  readonly missingReports: readonly string[];
  readonly missingScriptFiles: readonly string[];
  readonly missingDocs: readonly string[];
  readonly missingCiEvidence: readonly string[];
  readonly missingPackageScripts: readonly string[];
  readonly requiredCommands: typeof handoffToolingRuntimeRequiredCommands;
  readonly requiredEvidence: typeof handoffToolingRuntimeRequiredEvidence;
  readonly blockers: readonly string[];
}

export const handoffToolingRuntimeRequiredCommands = [
  "pnpm install",
  "pnpm --filter @inkroute/handoff typecheck",
  "pnpm --filter @inkroute/handoff test",
  "pnpm handoff:verify-docs",
  "pnpm handoff:audit",
  "pnpm handoff:next",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:verify-tooling",
  "pnpm handoff:verify-task-sync",
  "pnpm handoff:all",
] as const;

export const handoffToolingRuntimeRequiredEvidence = [
  "Dependency install output and @inkroute/handoff typecheck/test output.",
  "Handoff docs audit, gap audit, next-task queue, ledger verification, tooling verification, and aggregate handoff output.",
  "Existing handoff docs, scripts, manifests, queue, and ledger artifacts.",
  "CI workflow evidence naming Phase 16 handoff manifest/tooling checks.",
  "Report artifacts or explicit documented blocker if CI artifact capture is unavailable.",
] as const;

export function buildHandoffToolingRuntimeReadinessPlan(
  input: HandoffToolingRuntimeReadinessInput,
): HandoffToolingRuntimeReadinessPlan {
  const existingReports = new Set(input.existingReports);
  const existingScriptFiles = new Set(input.existingScriptFiles);
  const existingDocs = new Set(input.existingDocs);
  const missingRootScripts = input.requiredRootScripts.filter((script) => !input.rootScripts[script]);
  const missingReports = input.requiredReports.filter((report) => !existingReports.has(report));
  const missingScriptFiles = input.requiredScriptFiles.filter((file) => !existingScriptFiles.has(file));
  const missingDocs = input.requiredDocs.filter((doc) => !existingDocs.has(doc));
  const missingCiEvidence = input.requiredCiEvidence.filter((needle) => !input.ciWorkflowText.includes(needle));
  const missingPackageScripts = ["typecheck", "test"].filter((script) => !input.handoffPackageScripts[script]);
  const blockers: string[] = [];

  if (missingRootScripts.length > 0) {
    blockers.push(`Root handoff scripts missing from package.json: ${missingRootScripts.join(", ")}.`);
  }
  if (!String(input.rootScripts["handoff:all"] ?? "").includes("handoff:verify-tooling")) {
    blockers.push("handoff:all must include handoff:verify-tooling.");
  }
  if (missingReports.length > 0) {
    blockers.push("Handoff reports/manifests must exist for docs audit, gap audit, execution queue, and execution ledger.");
  }
  if (missingScriptFiles.length > 0) {
    blockers.push("Handoff verifier and reporting scripts must exist.");
  }
  if (missingDocs.length > 0) {
    blockers.push("Handoff docs and agent handoff files must exist.");
  }
  if (missingCiEvidence.length > 0) {
    blockers.push("CI workflow must run and name the Phase 16 handoff tooling checks.");
  }
  if (missingPackageScripts.length > 0) {
    blockers.push("@inkroute/handoff package must expose typecheck and test scripts.");
  }
  if (input.queueTaskCount <= 0) {
    blockers.push("Agent execution queue must contain tasks.");
  }
  if (input.ledgerExecutionCount !== input.queueTaskCount) {
    blockers.push("Agent execution ledger must contain one execution entry per queue task.");
  }
  if (!input.dependenciesInstalled) {
    blockers.push("Workspace dependencies must install before handoff tooling verification is meaningful.");
  }
  if (!input.packageTypecheckPassed) {
    blockers.push("@inkroute/handoff typecheck must pass.");
  }
  if (!input.packageTestsPassed) {
    blockers.push("@inkroute/handoff tests must pass.");
  }
  if (!input.handoffScriptsExecuted) {
    blockers.push("Handoff verify-docs, audit, next, verify-ledger, verify-tooling, and all scripts must execute.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm handoff:verify-tooling must pass.");
  }
  if (!input.ciRunCaptured) {
    blockers.push("GitHub Actions CI run must capture Phase 16 handoff tooling evidence.");
  }
  if (!input.reportArtifactsCaptured) {
    blockers.push("Handoff report artifacts must be captured or explicitly documented as unavailable.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingRootScripts,
    missingReports,
    missingScriptFiles,
    missingDocs,
    missingCiEvidence,
    missingPackageScripts,
    requiredCommands: handoffToolingRuntimeRequiredCommands,
    requiredEvidence: handoffToolingRuntimeRequiredEvidence,
    blockers,
  };
}

export type AgentTaskTrackingStatus = "not_created" | "created_redacted" | "linked_redacted" | "closed_redacted";

export interface AgentTaskTrackingIssue {
  readonly taskId: string;
  readonly status: AgentTaskTrackingStatus;
  readonly issueTitle: string;
  readonly assigneeRole: AgentTarget;
  readonly labels: readonly string[];
  readonly gapIds: readonly string[];
  readonly issueUrl: string;
  readonly projectItemUrl: string;
  readonly acceptanceEvidenceFields: readonly string[];
}

export interface AgentTaskTrackingReadinessInput {
  readonly queueTasks: readonly AgentExecutionTask[];
  readonly plannedIssues: readonly AgentTaskTrackingIssue[];
  readonly defaultLabels: readonly string[];
  readonly verifierPassed: boolean;
  readonly githubIssuesCreated: boolean;
  readonly githubProjectItemsLinked: boolean;
  readonly handoffDocsLinked: boolean;
  readonly gapTrackerLinked: boolean;
  readonly statusUpdatesTraceable: boolean;
}

export interface AgentTaskTrackingReadinessPlan {
  readonly status: "ready" | "blocked";
  readonly missingIssueTaskIds: readonly string[];
  readonly unknownIssueTaskIds: readonly string[];
  readonly incompleteIssueTaskIds: readonly string[];
  readonly unsafeTrackingFields: readonly string[];
  readonly requiredCommands: typeof agentTaskTrackingRequiredCommands;
  readonly requiredEvidence: typeof agentTaskTrackingRequiredEvidence;
  readonly blockers: readonly string[];
}

const unsafeAgentTaskTrackingPatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /\b\d{3}-\d{2}-\d{4}\b/,
];

function containsUnsafeAgentTaskTrackingField(value: string): boolean {
  return unsafeAgentTaskTrackingPatterns.some((pattern) => pattern.test(value));
}

export const agentTaskTrackingRequiredCommands = [
  "pnpm handoff:verify-task-sync",
  "gh issue create or GitHub issue automation",
  "GitHub Project item sync",
  "link redacted issue/project labels from handoff docs",
  "link tracking evidence from GAP_TRACKER rows",
  "trace status updates between queue, issues/projects, ledger, and gap tracker",
  "pnpm handoff:verify-ledger",
  "pnpm handoff:audit",
  "capture CI agent task tracking artifacts",
] as const;

export const agentTaskTrackingRequiredEvidence = [
  "One redacted issue label or URL for every queued agent task.",
  "Project item labels or documented blocker for every tracked task.",
  "Labels for agent-task, gap-tracked, verification-required, target, and priority.",
  "Gap IDs and acceptance evidence fields on every issue.",
  "Handoff docs and GAP_TRACKER.md links to tracking evidence.",
  "Traceable status updates from issue/project state into the execution ledger.",
] as const;

export function buildAgentTaskTrackingReadinessPlan(
  input: AgentTaskTrackingReadinessInput,
): AgentTaskTrackingReadinessPlan {
  const queueTaskIds = new Set(input.queueTasks.map((task) => task.id));
  const issueByTaskId = new Map(input.plannedIssues.map((issue) => [issue.taskId, issue]));
  const missingIssueTaskIds = input.queueTasks.filter((task) => !issueByTaskId.has(task.id)).map((task) => task.id);
  const unknownIssueTaskIds = input.plannedIssues.filter((issue) => !queueTaskIds.has(issue.taskId)).map((issue) => issue.taskId);
  const incompleteIssueTaskIds: string[] = [];
  const unsafeTrackingFields: string[] = [];

  for (const task of input.queueTasks) {
    const issue = issueByTaskId.get(task.id);
    if (!issue) continue;

    if (issue.assigneeRole !== task.target) {
      incompleteIssueTaskIds.push(`${task.id}:assigneeRole`);
    }
    if (!issue.issueTitle.includes(task.title)) {
      incompleteIssueTaskIds.push(`${task.id}:issueTitle`);
    }
    for (const gapId of task.gapIds) {
      if (!issue.gapIds.includes(gapId)) {
        incompleteIssueTaskIds.push(`${task.id}:${gapId}`);
      }
    }
    for (const label of input.defaultLabels) {
      if (!issue.labels.includes(label)) {
        incompleteIssueTaskIds.push(`${task.id}:label:${label}`);
      }
    }
    if (!issue.labels.some((label) => label.startsWith("priority:"))) {
      incompleteIssueTaskIds.push(`${task.id}:priorityLabel`);
    }
    if (!issue.labels.some((label) => label.startsWith("target:"))) {
      incompleteIssueTaskIds.push(`${task.id}:targetLabel`);
    }
    if (issue.acceptanceEvidenceFields.length < 4) {
      incompleteIssueTaskIds.push(`${task.id}:acceptanceEvidenceFields`);
    }
    if (issue.status === "not_created" && (issue.issueUrl || issue.projectItemUrl)) {
      incompleteIssueTaskIds.push(`${task.id}:prematureUrl`);
    }
    if (issue.status !== "not_created" && !issue.issueUrl) {
      incompleteIssueTaskIds.push(`${task.id}:issueUrl`);
    }
    if ((issue.status === "linked_redacted" || issue.status === "closed_redacted") && !issue.projectItemUrl) {
      incompleteIssueTaskIds.push(`${task.id}:projectItemUrl`);
    }

    const trackingFields: Array<readonly [string, string]> = [
      ["taskId", issue.taskId],
      ["issueTitle", issue.issueTitle],
      ["assigneeRole", issue.assigneeRole],
      ...issue.labels.map((value, index) => ["labels:" + index, value] as const),
      ...issue.gapIds.map((value, index) => ["gapIds:" + index, value] as const),
      ["issueUrl", issue.issueUrl],
      ["projectItemUrl", issue.projectItemUrl],
      ...issue.acceptanceEvidenceFields.map((value, index) => ["acceptanceEvidenceFields:" + index, value] as const),
    ];
    trackingFields.forEach(([field, value]) => {
      if (containsUnsafeAgentTaskTrackingField(value)) {
        unsafeTrackingFields.push(task.id + ":" + field);
      }
    });
  }

  const blockers: string[] = [];
  if (missingIssueTaskIds.length > 0) {
    blockers.push("Every queued agent task must have a planned GitHub issue/project tracking item.");
  }
  if (unknownIssueTaskIds.length > 0) {
    blockers.push("Agent task tracking sync must not include issues for tasks outside the queue.");
  }
  if (input.plannedIssues.length !== input.queueTasks.length) {
    blockers.push("Planned issue count must match agent execution queue task count.");
  }
  if (incompleteIssueTaskIds.length > 0) {
    blockers.push("Planned issues must match queue task title, target, gap IDs, labels, URL state, and acceptance evidence fields.");
  }
  if (unsafeTrackingFields.length > 0) {
    blockers.push("Agent task tracking sync must not contain private project URLs, secrets, database URLs, PII, medical notes, or payment payloads.");
  }
  if (!input.verifierPassed) {
    blockers.push("pnpm handoff:verify-task-sync must pass.");
  }
  if (!input.githubIssuesCreated) {
    blockers.push("GitHub issues must be created for every queued agent task.");
  }
  if (!input.githubProjectItemsLinked) {
    blockers.push("GitHub Project items must be linked or explicitly documented as unavailable for every task.");
  }
  if (!input.handoffDocsLinked) {
    blockers.push("Handoff docs must link to the redacted issue/project tracking labels.");
  }
  if (!input.gapTrackerLinked) {
    blockers.push("GAP_TRACKER.md must reference the task tracking evidence where relevant.");
  }
  if (!input.statusUpdatesTraceable) {
    blockers.push("Task status updates must be traceable between queue, issues/projects, ledger, and gap tracker.");
  }

  return {
    status: blockers.length === 0 ? "ready" : "blocked",
    missingIssueTaskIds,
    unknownIssueTaskIds,
    incompleteIssueTaskIds,
    unsafeTrackingFields,
    requiredCommands: agentTaskTrackingRequiredCommands,
    requiredEvidence: agentTaskTrackingRequiredEvidence,
    blockers,
  };
}
