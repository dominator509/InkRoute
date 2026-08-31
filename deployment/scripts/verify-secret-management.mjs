import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const auditPath = join(root, "deployment/manifests/secret-management-audit.json");
const envContractPath = join(root, "deployment/manifests/environment-contract.json");
const envExamplePath = join(root, ".env.example");
const allowedStatuses = new Set(["not_configured", "configured_redacted", "rotated_redacted", "incident_rotated_redacted"]);
const forbiddenSecretPatterns = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /rk_live_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/(?!USER:PASSWORD@HOST)[^"<>\s]+/i,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /vercel_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/
];

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const audit = readJson(auditPath);
const envContract = readJson(envContractPath);
const envExample = existsSync(envExamplePath) ? readFileSync(envExamplePath, "utf8") : "";
const failures = [];
const forbiddenEvidenceExamples = audit.redactionPolicy?.forbiddenEvidenceExamples;
const productionSecrets = envContract.filter((item) => item.requiredForProduction && item.secret).map((item) => item.name);
const auditSecrets = Array.isArray(audit.secrets) ? audit.secrets : [];
const auditSecretNames = new Set(auditSecrets.map((item) => item.name));

for (const name of productionSecrets) {
  if (!auditSecretNames.has(name)) failures.push(`Production secret ${name} is missing from secret-management audit contract.`);
}

for (const item of auditSecrets) {
  if (!item.name || !item.group) failures.push("Each secret audit item must declare name and group.");
  if (!allowedStatuses.has(item.status)) failures.push(`${item.name} has invalid status ${item.status}.`);
  if (!Array.isArray(item.destinations) || item.destinations.length === 0) failures.push(`${item.name} must declare secret-store destinations.`);
  if (!Array.isArray(item.requiredEvidence) || item.requiredEvidence.length < 2) failures.push(`${item.name} must declare at least two redacted evidence requirements.`);
  if (!Number.isFinite(item.rotationCadenceDays) || item.rotationCadenceDays <= 0 || item.rotationCadenceDays > 365) failures.push(`${item.name} must declare a rotation cadence between 1 and 365 days.`);
}

if (audit.redactionPolicy?.secretValuesAllowedInGit !== false) failures.push("Secret audit redaction policy must forbid secret values in git.");
if (!Array.isArray(forbiddenEvidenceExamples) || forbiddenEvidenceExamples.length === 0) failures.push("Secret audit redaction policy must declare forbidden evidence examples.");
if (!audit.rotationPolicy?.requiresMaskedCiLogProof) failures.push("Secret audit rotation policy must require masked CI log proof.");
if (!audit.rotationPolicy?.requiresProviderAuditLogReference) failures.push("Secret audit rotation policy must require provider audit-log references.");

const serializedAudit = JSON.stringify(audit);
for (const pattern of forbiddenSecretPatterns) {
  if (pattern.test(serializedAudit)) failures.push(`Secret audit manifest appears to contain forbidden secret-like material: ${pattern}`);
  if (pattern.test(envExample)) failures.push(`.env.example appears to contain forbidden live secret-like material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  productionSecretCount: productionSecrets.length,
  auditedSecretCount: auditSecrets.length,
  status: audit.status,
  rotationPolicy: audit.rotationPolicy
}, null, 2));
