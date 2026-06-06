import { describe, expect, it } from "vitest";
import { extractGapRecords, getTasksForAgent, phase16AgentExecutionTasks, renderAgentPrompt, summarizeAgentExecutionQueue } from "../src/index";

describe("Phase 16 handoff plan", () => {
  it("builds a prioritized queue", () => {
    const summary = summarizeAgentExecutionQueue();

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.critical).toBeGreaterThan(0);
    expect(summary.productionBlockingGapIds).toContain("GAP-001");
  });

  it("renders executable prompts", () => {
    const [task] = getTasksForAgent("Codex");

    expect(task).toBeDefined();
    expect(renderAgentPrompt(task!)).toContain("pnpm");
  });

  it("extracts markdown gap rows", () => {
    const records = extractGapRecords("| GAP-001 | Phase 1 | Tooling | Missing deps | High | Yes | Open | package.json | Install deps | Codex | Run install | pnpm install passes |\n");

    expect(records).toHaveLength(1);
    expect(records[0]?.severity).toBe("High");
  });

  it("keeps tasks tied to gaps", () => {
    expect(phase16AgentExecutionTasks.every((task) => task.gapIds.length > 0)).toBe(true);
  });
});
