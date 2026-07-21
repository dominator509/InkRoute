import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const manifestPath = join(root, "docs/handoff/manifests/handoff-tooling-readiness.json");
const packagePath = join(root, "package.json");
const ciPath = join(root, ".github/workflows/ci.yml");
const handoffPackagePath = join(root, "packages/handoff/package.json");

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return readFileSync(path, "utf8");
}

const manifest = readJson(manifestPath);
const rootPackage = readJson(packagePath);
const handoffPackage = readJson(handoffPackagePath);
const ciText = readText(ciPath);
const failures = [];

for (const scriptName of manifest.requiredScripts ?? []) {
  if (!rootPackage.scripts?.[scriptName]) failures.push(`Root package.json missing ${scriptName}.`);
}

if (!String(rootPackage.scripts?.["handoff:all"] ?? "").includes("handoff:verify-tooling")) {
  failures.push("handoff:all must include handoff:verify-tooling.");
}

for (const relativePath of [...(manifest.requiredReports ?? []), ...(manifest.requiredScriptsFiles ?? []), ...(manifest.requiredDocs ?? [])]) {
  if (!existsSync(join(root, relativePath))) failures.push(`Missing handoff tooling artifact ${relativePath}.`);
}

for (const ciNeedle of manifest.requiredCiEvidence ?? []) {
  if (!ciText.includes(ciNeedle)) failures.push(`CI workflow missing handoff tooling evidence: ${ciNeedle}.`);
}

for (const packageScript of ["typecheck", "test"]) {
  if (!handoffPackage.scripts?.[packageScript]) failures.push(`@inkroute/handoff package missing ${packageScript} script.`);
}

const queue = readJson(join(root, "docs/handoff/manifests/agent-execution-queue.json"));
const ledger = readJson(join(root, "docs/handoff/manifests/agent-execution-ledger.json"));
if (!Array.isArray(queue.tasks) || queue.tasks.length === 0) failures.push("Agent execution queue must contain tasks.");
if (!Array.isArray(ledger.executions) || ledger.executions.length !== queue.tasks.length) failures.push("Agent execution ledger must contain one execution entry per queue task.");

const reportArtifactsCaptured = manifest.status === "verified_redacted";

if (manifest.status !== "tooling_contract_not_executed" && manifest.status !== "verified_redacted") {
  failures.push(`Unsupported handoff tooling readiness status ${manifest.status}.`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  requiredScriptCount: manifest.requiredScripts.length,
  requiredReportCount: manifest.requiredReports.length,
  queueTaskCount: queue.tasks.length,
  reportArtifactsCaptured,
  status: manifest.status
}, null, 2));
