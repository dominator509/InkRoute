import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const queuePath = join(root, "docs/handoff/manifests/agent-execution-queue.json");
const syncPath = join(root, "docs/handoff/manifests/agent-task-tracking-sync.json");
const allowedStatuses = new Set(["not_created", "created_redacted", "linked_redacted", "closed_redacted"]);
const forbiddenPatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /\b\d{3}-\d{2}-\d{4}\b/
];

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const queue = readJson(queuePath);
const sync = readJson(syncPath);
const tasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const plannedIssues = Array.isArray(sync.plannedIssues) ? sync.plannedIssues : [];
const failures = [];

if (plannedIssues.length !== tasks.length) failures.push("Planned issue count must match agent execution queue task count.");

for (const task of tasks) {
  const issue = plannedIssues.find((item) => item.taskId === task.id);
  if (!issue) {
    failures.push(`Missing planned issue for task ${task.id}.`);
    continue;
  }
  if (!allowedStatuses.has(issue.status)) failures.push(`${task.id} has invalid tracking status ${issue.status}.`);
  if (issue.assigneeRole !== task.target) failures.push(`${task.id} assigneeRole must match queue target ${task.target}.`);
  if (!String(issue.issueTitle ?? "").includes(task.title)) failures.push(`${task.id} issueTitle must include task title.`);
  for (const gapId of task.gapIds ?? []) {
    if (!issue.gapIds?.includes(gapId)) failures.push(`${task.id} planned issue missing gap id ${gapId}.`);
  }
  for (const defaultLabel of sync.issueDefaults?.labels ?? []) {
    if (!issue.labels?.includes(defaultLabel)) failures.push(`${task.id} planned issue missing default label ${defaultLabel}.`);
  }
  if (!issue.labels?.some((label) => label.startsWith("priority:"))) failures.push(`${task.id} planned issue missing priority label.`);
  if (!issue.labels?.some((label) => label.startsWith("target:"))) failures.push(`${task.id} planned issue missing target label.`);
  if (!Array.isArray(issue.acceptanceEvidenceFields) || issue.acceptanceEvidenceFields.length < 4) failures.push(`${task.id} planned issue needs acceptance evidence fields.`);
  if (issue.status === "not_created" && (issue.issueUrl || issue.projectItemUrl)) failures.push(`${task.id} must not include issue/project URLs before creation.`);
  if (issue.status !== "not_created" && !issue.issueUrl) failures.push(`${task.id} created/linked task must include redacted issue URL or label.`);
}

const serialized = JSON.stringify(sync);
for (const pattern of forbiddenPatterns) {
  if (pattern.test(serialized)) failures.push(`Agent task tracking sync manifest appears to contain forbidden sensitive material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  queueTaskCount: tasks.length,
  plannedIssueCount: plannedIssues.length,
  status: sync.status
}, null, 2));
