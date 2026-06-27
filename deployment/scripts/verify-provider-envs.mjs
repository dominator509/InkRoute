import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "deployment/manifests/provider-environment-evidence.json");
const allowedStatuses = new Set(["not_provisioned", "provisioned_redacted", "verified_redacted"]);
const requiredEnvironments = ["preview", "staging", "production"];
const requiredSurfaces = ["web", "dashboard", "database", "storage", "mobile", "observability", "ci_cd"];

if (!existsSync(manifestPath)) {
  console.error("Missing provider environment evidence manifest.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const environments = Array.isArray(manifest.environments) ? manifest.environments : [];
const failures = [];

for (const environmentName of requiredEnvironments) {
  const environment = environments.find((item) => item.name === environmentName);
  if (!environment) {
    failures.push(`Missing environment evidence contract for ${environmentName}.`);
    continue;
  }

  const surfaces = Array.isArray(environment.surfaces) ? environment.surfaces : [];
  for (const surfaceName of requiredSurfaces) {
    const surface = surfaces.find((item) => item.surface === surfaceName);
    if (!surface) {
      failures.push(`Missing ${environmentName}/${surfaceName} provider evidence contract.`);
      continue;
    }

    if (!surface.provider) failures.push(`${environmentName}/${surfaceName} must declare provider.`);
    if (!allowedStatuses.has(surface.status)) failures.push(`${environmentName}/${surfaceName} has invalid status ${surface.status}.`);
    if (!surface.secretStore || /secret value|token value|password|postgresql:\/\//i.test(surface.secretStore)) {
      failures.push(`${environmentName}/${surfaceName} must reference a safe secret-store destination without raw secret material.`);
    }
    if (!Array.isArray(surface.requiredEvidence) || surface.requiredEvidence.length < 2) {
      failures.push(`${environmentName}/${surfaceName} must list at least two redacted evidence requirements.`);
    }
  }
}

const serialized = JSON.stringify(manifest);
const forbiddenPatterns = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/[^"<>\s]+/i,
  /ghp_[A-Za-z0-9_]+/,
  /vercel_[A-Za-z0-9_]+/,
  /SENTRY_AUTH_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_\-]+/i
];

for (const pattern of forbiddenPatterns) {
  if (pattern.test(serialized)) failures.push(`Provider environment manifest appears to contain forbidden secret-like material: ${pattern}`);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  environmentCount: environments.length,
  requiredEnvironments,
  requiredSurfaces,
  status: manifest.status
}, null, 2));
