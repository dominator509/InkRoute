import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidencePath = join(root, "deployment/manifests/production-launch-evidence.json");
const checklistPath = join(root, "deployment/manifests/production-launch-checklist.json");
const allowedStatuses = new Set(["missing", "partial_redacted", "verified_redacted", "blocked_redacted"]);
const requiredBundleIds = [
  "ci-build-test",
  "database-ops",
  "provider-and-secret-readiness",
  "security-privacy-trust",
  "accessibility-seo-performance",
  "mobile-release",
  "legal-approval",
  "rollback-and-operations"
];
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

const evidence = readJson(evidencePath);
const checklist = readJson(checklistPath);
const failures = [];
const bundles = Array.isArray(evidence.requiredBundles) ? evidence.requiredBundles : [];
const checklistBlockers = checklist.filter((item) => item.blocksProduction);

if (evidence.approvalStatus !== "blocked" && bundles.some((bundle) => bundle.status !== "verified_redacted")) {
  failures.push("Production launch approval must remain blocked until every evidence bundle is verified.");
}

for (const id of requiredBundleIds) {
  const bundle = bundles.find((item) => item.id === id);
  if (!bundle) {
    failures.push(`Missing production launch evidence bundle ${id}.`);
    continue;
  }
  if (!allowedStatuses.has(bundle.status)) failures.push(`${id} has invalid status ${bundle.status}.`);
  if (!Array.isArray(bundle.requiredEvidence) || bundle.requiredEvidence.length < 3) failures.push(`${id} must list at least three required evidence items.`);
  if (!Array.isArray(bundle.sourceArtifacts) || bundle.sourceArtifacts.length < 1) failures.push(`${id} must list source artifacts.`);
  if (!Array.isArray(bundle.gapIds) || bundle.gapIds.length < 1) failures.push(`${id} must list related gap ids.`);
}

if (checklistBlockers.length < 8) failures.push("Production launch checklist should retain all production-blocking launch categories.");
for (const checklistItem of checklistBlockers) {
  const covered = bundles.some((bundle) => bundle.area === checklistItem.area || bundle.requiredEvidence.join(" ").toLowerCase().includes(String(checklistItem.area).toLowerCase()));
  if (!covered) failures.push(`Launch checklist blocker ${checklistItem.id} is not covered by the evidence bundle manifest.`);
}

const serialized = JSON.stringify(evidence);
for (const pattern of forbiddenPatterns) {
  if (pattern.test(serialized)) failures.push(`Production launch evidence manifest appears to contain forbidden sensitive material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  approvalStatus: evidence.approvalStatus,
  bundleCount: bundles.length,
  productionChecklistBlockers: checklistBlockers.length,
  status: evidence.status
}, null, 2));
