import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidencePath = join(root, "deployment/manifests/launch-operations-evidence.json");
const allowedStatuses = new Set(["not_configured", "not_run", "configured_redacted", "passed_redacted", "blocked_redacted"]);
const requiredCheckIds = [
  "on-call-coverage",
  "alert-routing",
  "support-escalation",
  "privacy-request-drill",
  "incident-drill",
  "rollback-drill",
  "production-monitoring",
  "communications-templates"
];
const forbiddenPatterns = [
  /https:\/\/hooks\.slack\.com\/services\//i,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\d{3}[-.) ]?\d{3}[-. ]?\d{4}\b/,
  /\b\d{3}-\d{2}-\d{4}\b/
];

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const evidence = readJson(evidencePath);
const checks = Array.isArray(evidence.operationChecks) ? evidence.operationChecks : [];
const failures = [];

for (const id of requiredCheckIds) {
  const check = checks.find((item) => item.id === id);
  if (!check) {
    failures.push(`Missing launch operations check ${id}.`);
    continue;
  }
  if (!allowedStatuses.has(check.status)) failures.push(`${id} has invalid status ${check.status}.`);
  if (check.requiredBeforeProduction !== true) failures.push(`${id} must be required before production.`);
  if (!check.sla || String(check.sla).length < 12) failures.push(`${id} must declare an SLA.`);
  if (!Array.isArray(check.requiredEvidence) || check.requiredEvidence.length < 2) failures.push(`${id} must list at least two evidence requirements.`);
}

const ownerModel = evidence.ownerModel ?? {};
for (const ownerField of ["incidentCommander", "privacyOwner", "supportOwner", "releaseOwner", "securityOwner"]) {
  if (typeof ownerModel[ownerField] !== "string") failures.push(`ownerModel.${ownerField} must be present.`);
}
if (ownerModel.requiresNamedPrimaryAndBackup !== true) failures.push("Launch operations must require named primary and backup owners before production.");
if (evidence.approvalStatus !== "blocked" && checks.some((check) => !["configured_redacted", "passed_redacted"].includes(check.status))) {
  failures.push("Launch operations approval must remain blocked until all operation checks are configured or passed with redacted evidence.");
}

const serialized = JSON.stringify(evidence);
for (const pattern of forbiddenPatterns) {
  if (pattern.test(serialized)) failures.push(`Launch operations evidence appears to contain forbidden sensitive/contact material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  approvalStatus: evidence.approvalStatus,
  operationCheckCount: checks.length,
  status: evidence.status
}, null, 2));
