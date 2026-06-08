import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidencePath = join(root, "deployment/manifests/database-operations-evidence.json");
const dbPackagePath = join(root, "packages/db/package.json");
const allowedStatuses = new Set(["not_run", "configured_redacted", "passed_redacted", "blocked_redacted"]);
const requiredCheckIds = [
  "staging-branch-provisioned",
  "migration-dry-run",
  "destructive-change-scan",
  "staging-migration-apply",
  "seed-policy",
  "backup-restore-drill",
  "tenant-isolation-smoke",
  "branch-promotion"
];
const forbiddenSecretPatterns = [
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /DATABASE_URL\s*[:=]\s*["'][^"']+["']/i,
  /DIRECT_URL\s*[:=]\s*["'][^"']+["']/i,
  /password\s*[:=]\s*["'][^"']+["']/i
];

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const evidence = readJson(evidencePath);
const dbPackage = readJson(dbPackagePath);
const failures = [];
const operationChecks = Array.isArray(evidence.operationChecks) ? evidence.operationChecks : [];
const requiredCommands = Array.isArray(evidence.requiredCommands) ? evidence.requiredCommands : [];

for (const command of ["pnpm db:generate", "pnpm --filter @inkroute/db db:validate", "pnpm db:migrate", "pnpm db:seed"]) {
  if (!requiredCommands.includes(command)) failures.push(`Database operations contract must list required command: ${command}.`);
}

for (const [scriptName, expectedFragment] of Object.entries({
  "db:validate": "prisma validate",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts"
})) {
  if (!String(dbPackage.scripts?.[scriptName] ?? "").includes(expectedFragment)) {
    failures.push(`@inkroute/db script ${scriptName} must include ${expectedFragment}.`);
  }
}

for (const checkId of requiredCheckIds) {
  const check = operationChecks.find((item) => item.id === checkId);
  if (!check) {
    failures.push(`Missing database operation check ${checkId}.`);
    continue;
  }
  if (!allowedStatuses.has(check.status)) failures.push(`${checkId} has invalid status ${check.status}.`);
  if (check.requiredBeforeProduction !== true) failures.push(`${checkId} must be required before production.`);
  if (!Array.isArray(check.evidenceRequired) || check.evidenceRequired.length < 2) failures.push(`${checkId} must list at least two evidence requirements.`);
}

const destructiveScan = operationChecks.find((item) => item.id === "destructive-change-scan");
for (const blockedPattern of ["DROP TABLE", "DROP COLUMN", "ALTER TABLE DROP", "TRUNCATE"]) {
  if (!destructiveScan?.blockedSqlPatterns?.includes(blockedPattern)) failures.push(`Destructive change scan must include ${blockedPattern}.`);
}

const serialized = JSON.stringify(evidence);
for (const pattern of forbiddenSecretPatterns) {
  if (pattern.test(serialized)) failures.push(`Database operations evidence appears to contain forbidden secret-like material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  providerStatus: evidence.providerStatus,
  operationCheckCount: operationChecks.length,
  requiredCommands
}, null, 2));
