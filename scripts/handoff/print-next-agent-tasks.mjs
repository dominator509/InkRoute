#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const queuePath = join(root, "docs/handoff/manifests/agent-execution-queue.json");
const queue = JSON.parse(readFileSync(queuePath, "utf8"));
const rank = { critical: 0, high: 1, medium: 2, low: 3 };
const tasks = [...queue.tasks].sort((a, b) => rank[a.priority] - rank[b.priority] || a.id.localeCompare(b.id));
console.log(`# InkRoute Agent Execution Queue`);
console.log(`Generated: ${queue.generatedAt}`);
console.log(`Tasks: ${tasks.length}`);
for (const task of tasks) {
  console.log(`\n## ${task.title}`);
  console.log(`Target: ${task.target}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Gaps: ${task.gapIds.join(", ")}`);
  console.log(`Prompt: ${task.prompt}`);
  console.log(`Commands:`);
  for (const command of task.commandPlan) {
    console.log(`- ${command}`);
  }
}
