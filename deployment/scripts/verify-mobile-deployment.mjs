import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const evidencePath = join(root, "deployment/manifests/mobile-deployment-evidence.json");
const easPath = join(root, "apps/mobile/eas.json");
const appPath = join(root, "apps/mobile/app.json");
const allowedStatuses = new Set(["not_built", "not_run", "configured_redacted", "built_redacted", "verified_redacted"]);
const requiredProfiles = ["development", "preview", "production"];
const requiredQaIds = ["device-qa", "push-token", "crash-capture", "ota-rollback"];
const forbiddenSecretPatterns = [
  /Expo[A-Za-z0-9_\-]{20,}/,
  /eas_[A-Za-z0-9_\-]{20,}/i,
  /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /"private_key"\s*:\s*"-----BEGIN/i,
  /SENTRY_AUTH_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_\-]+/i
];

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing required file: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const evidence = readJson(evidencePath);
const eas = readJson(easPath);
const app = readJson(appPath);
const failures = [];
const buildProfiles = Array.isArray(evidence.buildProfiles) ? evidence.buildProfiles : [];
const qaEvidence = Array.isArray(evidence.qaEvidence) ? evidence.qaEvidence : [];

for (const profileName of requiredProfiles) {
  const evidenceProfile = buildProfiles.find((profile) => profile.profile === profileName);
  const easProfile = eas.build?.[profileName];
  if (!evidenceProfile) failures.push(`Missing mobile deployment evidence profile ${profileName}.`);
  if (!easProfile) failures.push(`Missing EAS build profile ${profileName}.`);
  if (evidenceProfile && easProfile && evidenceProfile.channel !== easProfile.channel) {
    failures.push(`Evidence profile ${profileName} channel must match apps/mobile/eas.json.`);
  }
  if (evidenceProfile && !allowedStatuses.has(evidenceProfile.status)) {
    failures.push(`Evidence profile ${profileName} has invalid status ${evidenceProfile.status}.`);
  }
}

if (app.expo?.runtimeVersion?.policy !== evidence.runtimePolicy?.expoRuntimeVersionPolicy) {
  failures.push("Mobile app runtimeVersion policy must match mobile deployment evidence runtime policy.");
}

if (!String(app.expo?.extra?.eas?.projectId ?? "").includes("deployment-gated")) {
  failures.push("Committed app.json must keep EAS project id redacted/deployment-gated until provider setup evidence exists.");
}

if (!String(app.expo?.updates?.url ?? "").includes("deployment-gated")) {
  failures.push("Committed app.json must keep EAS update URL redacted/deployment-gated until OTA setup evidence exists.");
}

for (const profile of buildProfiles) {
  if (!Array.isArray(profile.evidenceRequired) && !Array.isArray(profile.platforms)) {
    failures.push(`Profile ${profile.profile} must define profile-level evidence or platform evidence.`);
  }
  for (const platform of profile.platforms ?? []) {
    if (!["ios", "android"].includes(platform.platform)) failures.push(`Profile ${profile.profile} has unsupported platform ${platform.platform}.`);
    if (!allowedStatuses.has(platform.status)) failures.push(`Profile ${profile.profile}/${platform.platform} has invalid status ${platform.status}.`);
    if (!Array.isArray(platform.evidenceRequired) || platform.evidenceRequired.length < 2) failures.push(`Profile ${profile.profile}/${platform.platform} needs at least two evidence requirements.`);
  }
}

for (const qaId of requiredQaIds) {
  const item = qaEvidence.find((entry) => entry.id === qaId);
  if (!item) {
    failures.push(`Missing mobile QA evidence item ${qaId}.`);
    continue;
  }
  if (!allowedStatuses.has(item.status)) failures.push(`Mobile QA evidence ${qaId} has invalid status ${item.status}.`);
  if (!Array.isArray(item.requiredEvidence) || item.requiredEvidence.length < 2) failures.push(`Mobile QA evidence ${qaId} needs at least two required evidence labels.`);
}

const serialized = JSON.stringify({ evidence, eas, app });
for (const pattern of forbiddenSecretPatterns) {
  if (pattern.test(serialized)) failures.push(`Mobile deployment evidence appears to contain forbidden secret-like material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  profileCount: buildProfiles.length,
  qaEvidenceCount: qaEvidence.length,
  runtimePolicy: evidence.runtimePolicy?.expoRuntimeVersionPolicy,
  status: evidence.status
}, null, 2));
