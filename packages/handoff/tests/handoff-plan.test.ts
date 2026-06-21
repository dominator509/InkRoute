import { describe, expect, it } from "vitest";
import {
  agentExecutionLedgerRequiredCommands,
  agentExecutionLedgerRequiredEvidence,
  agentTaskTrackingRequiredCommands,
  agentTaskTrackingRequiredEvidence,
  auditGapRecords,
  buildAgentExecutionLedgerReadinessPlan,
  buildAgentTaskTrackingReadinessPlan,
  buildHandoffToolingRuntimeReadinessPlan,
  extractGapRecords,
  getTasksForAgent,
  handoffToolingRuntimeRequiredCommands,
  handoffToolingRuntimeRequiredEvidence,
  phase16AgentExecutionTasks,
  renderAgentPrompt,
  summarizeAgentExecutionQueue,
  type AgentExecutionTask,
} from "../src/index";

describe("Phase 16 handoff plan", () => {
  it("builds a prioritized queue", () => {
    const summary = summarizeAgentExecutionQueue();

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.critical).toBeGreaterThan(0);
    expect(summary.high).toBeGreaterThan(0);
    expect(summary.productionBlockingGapIds).toContain("GAP-001");
    expect(summary.firstTaskTitle).toBe("Install dependencies and produce first runtime evidence");
  });

  it("renders executable prompts", () => {
    const [task] = getTasksForAgent("Codex");

    expect(task).toBeDefined();
    const prompt = renderAgentPrompt(task!);

    expect(prompt).toContain("## Files to inspect first");
    expect(prompt).toContain("## Command plan");
    expect(prompt).toContain("## Acceptance evidence");
    expect(prompt).toContain(`\`${task!.commandPlan[0]}\``);
  });

  it("extracts markdown gap rows", () => {
    const records = extractGapRecords("| GAP-001 | Phase 1 | Tooling | Missing deps | High | Yes | Open | package.json | Install deps | Codex | Run install | pnpm install passes |\n");

    expect(records).toHaveLength(1);
    expect(records[0]?.severity).toBe("High");
  });

  it("audits malformed or weak gap records", () => {
    const records = extractGapRecords(
      [
        "| GAP-001 | Phase 1 | Tooling | Missing deps | Critical | Yes | Open | x | Do it | Codex | Short | no |",
        "| GAP-001 | Phase 1 | Tooling | Duplicate | High | Yes | Open | package.json | Install dependencies with evidence | Codex | Run install and record output | `pnpm install` passes |",
        "| GAP-003 | Phase 1 | Auth | Missing auth | High | Yes | Open | auth.ts | Implement auth tests | Codex | Implement auth guard tests | Auth tests pass |",
      ].join("\n"),
    );
    const audit = auditGapRecords(records);

    expect(audit.total).toBe(3);
    expect(audit.blocking).toBe(3);
    expect(audit.findings.some((finding) => finding.message === "Duplicate gap ID.")).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("not strictly sequential"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message === "Production-blocking gap lacks verification detail.")).toBe(true);
  });

  it("keeps tasks tied to gaps", () => {
    expect(phase16AgentExecutionTasks.every((task) => task.gapIds.length > 0)).toBe(true);
    expect(phase16AgentExecutionTasks.every((task) => task.commandPlan.length > 0)).toBe(true);
    expect(phase16AgentExecutionTasks.every((task) => task.acceptanceEvidence.length > 0)).toBe(true);
  });

  it("sorts agent-specific tasks by priority and id", () => {
    const tasks: AgentExecutionTask[] = [
      {
        id: "task-low",
        title: "Low task",
        target: "Codex",
        priority: "low",
        phase: "Test",
        files: ["a"],
        gapIds: ["GAP-001"],
        commandPlan: ["pnpm test"],
        acceptanceEvidence: ["test output"],
        prompt: "Do low task.",
      },
      {
        id: "task-critical-b",
        title: "Critical B",
        target: "Codex",
        priority: "critical",
        phase: "Test",
        files: ["b"],
        gapIds: ["GAP-002"],
        commandPlan: ["pnpm test"],
        acceptanceEvidence: ["test output"],
        prompt: "Do critical task.",
      },
      {
        id: "task-critical-a",
        title: "Critical A",
        target: "Codex",
        priority: "critical",
        phase: "Test",
        files: ["c"],
        gapIds: ["GAP-003"],
        commandPlan: ["pnpm test"],
        acceptanceEvidence: ["test output"],
        prompt: "Do critical task.",
      },
    ];

    expect(getTasksForAgent("Codex", tasks).map((task) => task.id)).toEqual(["task-critical-a", "task-critical-b", "task-low"]);
  });

  it("blocks agent execution ledger readiness when executions are missing, unsafe, or not completed", () => {
    const tasks: AgentExecutionTask[] = [
      {
        id: "task-a",
        title: "Task A",
        target: "Codex",
        priority: "critical",
        phase: "Phase 16",
        files: ["GAP_TRACKER.md"],
        gapIds: ["GAP-119"],
        commandPlan: ["pnpm handoff:verify-ledger"],
        acceptanceEvidence: ["ledger output"],
        prompt: "Execute task A.",
      },
      {
        id: "task-b",
        title: "Task B",
        target: "Jules",
        priority: "high",
        phase: "Phase 16",
        files: ["packages/db"],
        gapIds: ["GAP-117"],
        commandPlan: ["pnpm db:generate"],
        acceptanceEvidence: ["db output"],
        prompt: "Execute task B.",
      },
    ];

    const plan = buildAgentExecutionLedgerReadinessPlan({
      queueTasks: tasks,
      executions: [
        {
          taskId: "task-a",
          status: "in_progress_redacted",
          assignedAgent: "Claude Code",
          commandsRun: ["pnpm handoff:verify-ledger"],
          filesChanged: ["GAP_TRACKER.md"],
          evidenceArtifacts: ["postgresql://user:password@db.example/inkroute"],
          remainingGaps: [],
          secretSafety: "redacted_review_pending",
        },
        {
          taskId: "unknown-task",
          status: "completed_redacted",
          assignedAgent: "Codex",
          commandsRun: ["pnpm test"],
          filesChanged: ["x"],
          evidenceArtifacts: ["artifact"],
          remainingGaps: [],
          secretSafety: "secret_safe_redacted",
        },
      ],
      verifierPassed: false,
      handoffAuditPassed: false,
      gapTrackerUpdated: false,
      externalAgentResultsImported: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingExecutionTaskIds).toEqual(["task-b"]);
    expect(plan.unknownExecutionTaskIds).toEqual(["unknown-task"]);
    expect(plan.incompleteExecutionTaskIds).toEqual(expect.arrayContaining(["task-a:assignedAgent", "task-a", "task-a:GAP-119"]));
    expect(plan.unsafeEvidenceFields).toContain("task-a:5");
    expect(plan.requiredCommands).toBe(agentExecutionLedgerRequiredCommands);
    expect(plan.requiredEvidence).toBe(agentExecutionLedgerRequiredEvidence);
    expect(plan.blockers).toContain("Every Phase 16 queue task must have an execution ledger entry.");
    expect(plan.blockers).toContain("Agent execution ledger must not contain secrets, database URLs, private keys, PII, or payment payloads.");
  });

  it("marks agent execution ledger readiness ready when every queued task has completed redacted evidence", () => {
    const tasks = phase16AgentExecutionTasks.slice(0, 2);
    const executions = tasks.map((task) => ({
      taskId: task.id,
      status: "completed_redacted" as const,
      assignedAgent: task.target,
      commandsRun: task.commandPlan,
      filesChanged: task.files,
      evidenceArtifacts: [`${task.id} redacted log artifact`],
      remainingGaps: [],
      secretSafety: "secret_safe_redacted" as const,
    }));

    const plan = buildAgentExecutionLedgerReadinessPlan({
      queueTasks: tasks,
      executions,
      verifierPassed: true,
      handoffAuditPassed: true,
      gapTrackerUpdated: true,
      externalAgentResultsImported: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingExecutionTaskIds).toEqual([]);
    expect(plan.unknownExecutionTaskIds).toEqual([]);
    expect(plan.duplicateExecutionTaskIds).toEqual([]);
    expect(plan.incompleteExecutionTaskIds).toEqual([]);
    expect(plan.unsafeEvidenceFields).toEqual([]);
    expect(plan.requiredCommands).toBe(agentExecutionLedgerRequiredCommands);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks handoff tooling readiness until scripts, reports, docs, CI, package checks, and artifacts are proven", () => {
    const plan = buildHandoffToolingRuntimeReadinessPlan({
      requiredRootScripts: ["handoff:verify-docs", "handoff:audit", "handoff:verify-tooling", "handoff:all"],
      rootScripts: {
        "handoff:verify-docs": "node scripts/handoff/verify-phase-docs.mjs",
        "handoff:all": "pnpm handoff:verify-docs",
      },
      requiredReports: ["docs/handoff/manifests/phase-documentation-audit.json", "docs/handoff/manifests/agent-execution-ledger.json"],
      existingReports: ["docs/handoff/manifests/phase-documentation-audit.json"],
      requiredScriptFiles: ["scripts/handoff/verify-phase-docs.mjs", "scripts/handoff/verify-handoff-tooling.mjs"],
      existingScriptFiles: ["scripts/handoff/verify-phase-docs.mjs"],
      requiredDocs: ["docs/handoff/README.md", "HANDOFF_TO_CODEX.md"],
      existingDocs: ["docs/handoff/README.md"],
      requiredCiEvidence: ["Verify Phase 16 handoff manifests", "pnpm handoff:verify-tooling"],
      ciWorkflowText: "Verify Phase 16 handoff manifests",
      handoffPackageScripts: { test: "vitest run" },
      queueTaskCount: 2,
      ledgerExecutionCount: 1,
      dependenciesInstalled: false,
      packageTypecheckPassed: false,
      packageTestsPassed: true,
      handoffScriptsExecuted: false,
      verifierPassed: false,
      ciRunCaptured: false,
      reportArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingRootScripts).toEqual(["handoff:audit", "handoff:verify-tooling"]);
    expect(plan.missingReports).toEqual(["docs/handoff/manifests/agent-execution-ledger.json"]);
    expect(plan.missingScriptFiles).toEqual(["scripts/handoff/verify-handoff-tooling.mjs"]);
    expect(plan.missingDocs).toEqual(["HANDOFF_TO_CODEX.md"]);
    expect(plan.missingCiEvidence).toEqual(["pnpm handoff:verify-tooling"]);
    expect(plan.missingPackageScripts).toEqual(["typecheck"]);
    expect(plan.requiredCommands).toBe(handoffToolingRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(handoffToolingRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Root handoff scripts missing from package.json: handoff:audit, handoff:verify-tooling.");
    expect(plan.blockers).not.toContain("Root handoff scripts must be wired in package.json.");
    expect(plan.blockers).toContain("handoff:all must include handoff:verify-tooling.");
    expect(plan.blockers).toContain("Agent execution ledger must contain one execution entry per queue task.");
  });

  it("marks handoff tooling readiness ready when package, scripts, manifests, CI, and reports are verified", () => {
    const requiredRootScripts = [
      "handoff:verify-docs",
      "handoff:audit",
      "handoff:next",
      "handoff:verify-ledger",
      "handoff:verify-tooling",
      "handoff:verify-task-sync",
      "handoff:all",
    ];
    const requiredReports = [
      "docs/handoff/manifests/phase-documentation-audit.json",
      "docs/handoff/manifests/gap-audit-report.json",
      "docs/handoff/manifests/agent-execution-queue.json",
      "docs/handoff/manifests/agent-execution-ledger.json",
    ];
    const requiredScriptFiles = [
      "scripts/handoff/verify-phase-docs.mjs",
      "scripts/handoff/audit-gap-tracker.mjs",
      "scripts/handoff/print-next-agent-tasks.mjs",
      "scripts/handoff/verify-agent-execution-ledger.mjs",
      "scripts/handoff/verify-handoff-tooling.mjs",
      "scripts/handoff/verify-agent-task-sync.mjs",
    ];
    const requiredDocs = [
      "docs/handoff/README.md",
      "docs/handoff/AGENT_EXECUTION_QUEUE.md",
      "docs/handoff/GAP_CLOSURE_PROTOCOL.md",
      "HANDOFF_TO_CODEX.md",
      "HANDOFF_TO_JULES.md",
      "HANDOFF_TO_CLAUDE_CODE.md",
    ];
    const requiredCiEvidence = [
      "Verify Phase 16 handoff manifests",
      "pnpm handoff:verify-docs",
      "pnpm handoff:audit",
      "pnpm handoff:next",
      "pnpm handoff:verify-ledger",
      "pnpm handoff:verify-tooling",
      "pnpm handoff:verify-task-sync",
    ];
    const rootScripts = Object.fromEntries(requiredRootScripts.map((script) => [script, `pnpm ${script}`]));
    rootScripts["handoff:all"] =
      "pnpm handoff:verify-docs && pnpm handoff:audit && pnpm handoff:next && pnpm handoff:verify-ledger && pnpm handoff:verify-tooling && pnpm handoff:verify-task-sync";

    const plan = buildHandoffToolingRuntimeReadinessPlan({
      requiredRootScripts,
      rootScripts,
      requiredReports,
      existingReports: requiredReports,
      requiredScriptFiles,
      existingScriptFiles: requiredScriptFiles,
      requiredDocs,
      existingDocs: requiredDocs,
      requiredCiEvidence,
      ciWorkflowText: requiredCiEvidence.join("\n"),
      handoffPackageScripts: { typecheck: "tsc --noEmit", test: "vitest run" },
      queueTaskCount: 6,
      ledgerExecutionCount: 6,
      dependenciesInstalled: true,
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      handoffScriptsExecuted: true,
      verifierPassed: true,
      ciRunCaptured: true,
      reportArtifactsCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingRootScripts).toEqual([]);
    expect(plan.missingReports).toEqual([]);
    expect(plan.missingScriptFiles).toEqual([]);
    expect(plan.missingDocs).toEqual([]);
    expect(plan.missingCiEvidence).toEqual([]);
    expect(plan.missingPackageScripts).toEqual([]);
    expect(plan.requiredCommands).toBe(handoffToolingRuntimeRequiredCommands);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks agent task tracking readiness until queue tasks are synced to safe GitHub issues and project items", () => {
    const tasks = phase16AgentExecutionTasks.slice(0, 2);
    const plan = buildAgentTaskTrackingReadinessPlan({
      queueTasks: tasks,
      defaultLabels: ["agent-task", "gap-tracked", "verification-required"],
      plannedIssues: [
        {
          taskId: tasks[0]!.id,
          status: "created_redacted",
          issueTitle: "Agent task: wrong title",
          assigneeRole: "Jules",
          labels: ["agent-task", "priority:critical"],
          gapIds: ["GAP-999"],
          issueUrl: "",
          projectItemUrl: "postgresql://user:password@db.example/inkroute",
          acceptanceEvidenceFields: ["commands run"],
        },
        {
          taskId: "unknown-task",
          status: "not_created",
          issueTitle: "Unknown task",
          assigneeRole: "Codex",
          labels: ["agent-task", "gap-tracked", "verification-required", "target:codex", "priority:low"],
          gapIds: ["GAP-001"],
          issueUrl: "",
          projectItemUrl: "",
          acceptanceEvidenceFields: ["commands run", "files changed", "output", "secret redaction"],
        },
      ],
      verifierPassed: false,
      githubIssuesCreated: false,
      githubProjectItemsLinked: false,
      handoffDocsLinked: false,
      gapTrackerLinked: false,
      statusUpdatesTraceable: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingIssueTaskIds).toEqual([tasks[1]!.id]);
    expect(plan.unknownIssueTaskIds).toEqual(["unknown-task"]);
    expect(plan.incompleteIssueTaskIds).toEqual(
      expect.arrayContaining([
        `${tasks[0]!.id}:assigneeRole`,
        `${tasks[0]!.id}:issueTitle`,
        `${tasks[0]!.id}:${tasks[0]!.gapIds[0]}`,
        `${tasks[0]!.id}:label:gap-tracked`,
        `${tasks[0]!.id}:targetLabel`,
        `${tasks[0]!.id}:acceptanceEvidenceFields`,
        `${tasks[0]!.id}:issueUrl`,
      ]),
    );
    expect(plan.unsafeTrackingFields).toContain(`${tasks[0]!.id}:10`);
    expect(plan.requiredCommands).toBe(agentTaskTrackingRequiredCommands);
    expect(plan.requiredEvidence).toBe(agentTaskTrackingRequiredEvidence);
    expect(plan.blockers).toContain("GitHub issues must be created for every queued agent task.");
    expect(plan.blockers).toContain("Task status updates must be traceable between queue, issues/projects, ledger, and gap tracker.");
  });

  it("marks agent task tracking readiness ready when every queued task has redacted issue and project tracking", () => {
    const tasks = phase16AgentExecutionTasks.slice(0, 2);
    const plannedIssues = tasks.map((task) => ({
      taskId: task.id,
      status: "linked_redacted" as const,
      issueTitle: `Agent task: ${task.title}`,
      assigneeRole: task.target,
      labels: ["agent-task", "gap-tracked", "verification-required", `target:${task.target.toLowerCase().replace(/\s+/g, "-")}`, `priority:${task.priority}`],
      gapIds: task.gapIds,
      issueUrl: `${task.id} issue label`,
      projectItemUrl: `${task.id} project item label`,
      acceptanceEvidenceFields: ["commands run", "files changed", "test/build output", "gap rows updated", "secret redaction confirmed"],
    }));

    const plan = buildAgentTaskTrackingReadinessPlan({
      queueTasks: tasks,
      plannedIssues,
      defaultLabels: ["agent-task", "gap-tracked", "verification-required"],
      verifierPassed: true,
      githubIssuesCreated: true,
      githubProjectItemsLinked: true,
      handoffDocsLinked: true,
      gapTrackerLinked: true,
      statusUpdatesTraceable: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingIssueTaskIds).toEqual([]);
    expect(plan.unknownIssueTaskIds).toEqual([]);
    expect(plan.incompleteIssueTaskIds).toEqual([]);
    expect(plan.unsafeTrackingFields).toEqual([]);
    expect(plan.requiredCommands).toBe(agentTaskTrackingRequiredCommands);
    expect(plan.blockers).toEqual([]);
  });
});
