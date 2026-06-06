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
