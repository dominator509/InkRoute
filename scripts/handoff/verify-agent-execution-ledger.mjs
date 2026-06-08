import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const queuePath = join(root, "docs/handoff/manifests/agent-execution-queue.json");
const ledgerPath = join(root, "docs/handoff/manifests/agent-execution-ledger.json");
const allowedStatuses = new Set(["not_executed", "in_progress_redacted", "completed_redacted", "blocked_redacted"]);
const allowedSecretSafety = new Set(["no_evidence_recorded", "redacted_review_pending", "secret_safe_redacted"]);
const forbiddenPatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /vercel_[A-Za-z0-9_]{20,}/i,
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
const ledger = readJson(ledgerPath);
const queueTasks = Array.isArray(queue.tasks) ? queue.tasks : [];
const executions = Array.isArray(ledger.executions) ? ledger.executions : [];
const failures = [];
const executionIds = new Set(executions.map((execution) => execution.taskId));

for (const task of queueTasks) {
  const execution = executions.find((item) => item.taskId === task.id);
  if (!execution) {
    failures.push(`Missing execution ledger entry for task ${task.id}.`);
    continue;
  }
  if (execution.assignedAgent !== task.target) failures.push(`${task.id} assignedAgent must match queue target ${task.target}.`);
  if (!allowedStatuses.has(execution.status)) failures.push(`${task.id} has invalid execution status ${execution.status}.`);
  if (!allowedSecretSafety.has(execution.secretSafety)) failures.push(`${task.id} has invalid secretSafety value ${execution.secretSafety}.`);
  if (!Array.isArray(execution.commandsRun)) failures.push(`${task.id} commandsRun must be an array.`);
  if (!Array.isArray(execution.filesChanged)) failures.push(`${task.id} filesChanged must be an array.`);
  if (!Array.isArray(execution.evidenceArtifacts)) failures.push(`${task.id} evidenceArtifacts must be an array.`);
  if (!Array.isArray(execution.remainingGaps)) failures.push(`${task.id} remainingGaps must be an array.`);
  for (const gapId of task.gapIds ?? []) {
    if (execution.status !== "completed_redacted" && !execution.remainingGaps.includes(gapId)) {
      failures.push(`${task.id} must keep ${gapId} in remainingGaps until completed_redacted.`);
    }
  }
  if (execution.status === "completed_redacted") {
    if (execution.commandsRun.length === 0) failures.push(`${task.id} completed execution must list commandsRun.`);
    if (execution.evidenceArtifacts.length === 0) failures.push(`${task.id} completed execution must list evidenceArtifacts.`);
    if (execution.secretSafety !== "secret_safe_redacted") failures.push(`${task.id} completed execution must be secret_safe_redacted.`);
  }
}

for (const execution of executions) {
  if (!queueTasks.some((task) => task.id === execution.taskId)) failures.push(`Ledger contains execution for unknown task ${execution.taskId}.`);
}

if (executionIds.size !== executions.length) failures.push("Execution ledger contains duplicate task ids.");

const serialized = JSON.stringify(ledger);
for (const pattern of forbiddenPatterns) {
  if (pattern.test(serialized)) failures.push(`Agent execution ledger appears to contain forbidden sensitive material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  queueTaskCount: queueTasks.length,
  ledgerExecutionCount: executions.length,
  status: ledger.status
}, null, 2));
