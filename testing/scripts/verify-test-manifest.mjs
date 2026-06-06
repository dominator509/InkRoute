import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPaths = [
  "testing/manifests/unit-test-manifest.json",
  "testing/manifests/e2e-test-manifest.json",
  "testing/manifests/accessibility-checklist.json",
  "testing/manifests/security-checklist.json",
  "testing/manifests/mobile-device-qa-checklist.json",
  "testing/manifests/provider-test-plan.json",
  "testing/manifests/manual-qa-checklist.json"
];

const requiredFiles = [
  "vitest.workspace.ts",
  "playwright.config.ts",
  "packages/testing/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "packages/security/tests/upload-policy.test.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "apps/web/tests/e2e/public-booking.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-smoke.spec.ts",
  "apps/mobile/tests/mobile-static.test.ts"
];

const missing = [...manifestPaths, ...requiredFiles].filter((relativePath) => !existsSync(join(root, relativePath)));
if (missing.length > 0) {
  console.error("Missing Phase 14 testing files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

let declaredSuites = 0;
for (const relativePath of manifestPaths) {
  const parsed = JSON.parse(readFileSync(join(root, relativePath), "utf8"));
  if (Array.isArray(parsed.suites)) declaredSuites += parsed.suites.length;
  if (Array.isArray(parsed.checks)) declaredSuites += parsed.checks.length;
  if (Array.isArray(parsed.providers)) declaredSuites += parsed.providers.length;
  if (Array.isArray(parsed.manualRuns)) declaredSuites += parsed.manualRuns.length;
}

console.log(JSON.stringify({ ok: true, manifestCount: manifestPaths.length, requiredFileCount: requiredFiles.length, declaredSuites }, null, 2));
