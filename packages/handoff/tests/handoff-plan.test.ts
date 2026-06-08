import { describe, expect, it } from "vitest";
import {
  auditGapRecords,
  extractGapRecords,
  getTasksForAgent,
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
});
