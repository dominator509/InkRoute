import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const manifestPaths = [
  "testing/manifests/unit-test-manifest.json",
  "testing/manifests/e2e-test-manifest.json",
  "testing/manifests/accessibility-checklist.json",
  "testing/manifests/security-checklist.json",
  "testing/manifests/db-integration-test-manifest.json",
  "testing/manifests/mobile-device-qa-checklist.json",
  "testing/manifests/performance-budget.json",
  "testing/manifests/provider-test-plan.json",
  "testing/manifests/manual-qa-checklist.json"
];

const requiredFiles = [
  "vitest.workspace.ts",
  "playwright.config.ts",
  "deployment/manifests/provider-environment-evidence.json",
  "deployment/manifests/secret-management-audit.json",
  "deployment/manifests/mobile-deployment-evidence.json",
  "deployment/manifests/database-operations-evidence.json",
  "deployment/manifests/production-launch-evidence.json",
  "deployment/manifests/launch-operations-evidence.json",
  "deployment/scripts/verify-provider-envs.mjs",
  "deployment/scripts/verify-secret-management.mjs",
  "deployment/scripts/verify-mobile-deployment.mjs",
  "deployment/scripts/verify-database-operations.mjs",
  "deployment/scripts/verify-launch-evidence.mjs",
  "deployment/scripts/verify-launch-operations.mjs",
  "docs/handoff/manifests/agent-execution-ledger.json",
  "docs/handoff/manifests/handoff-tooling-readiness.json",
  "docs/handoff/manifests/agent-task-tracking-sync.json",
  "scripts/handoff/verify-agent-execution-ledger.mjs",
  "scripts/handoff/verify-handoff-tooling.mjs",
  "scripts/handoff/verify-agent-task-sync.mjs",
  "scripts/quality/verify-pr-gap-diff-fixtures.mjs",
  "scripts/quality/fixtures/pr-gap-diff/invalid-missing-evidence.diff",
  "scripts/quality/fixtures/pr-gap-diff/valid-with-evidence.diff",
  "packages/testing/src/index.ts",
  "packages/booking/tests/booking-readiness.test.ts",
  "packages/payments/tests/deposit-policy.test.ts",
  "packages/calendar/tests/availability-conflicts.test.ts",
  "packages/notifications/tests/delivery-plan.test.ts",
  "packages/seo/tests/seo-engine.test.ts",
  "packages/observability/tests/redaction-report.test.ts",
  "packages/releases/tests/feature-flags.test.ts",
  "packages/security/tests/upload-policy.test.ts",
  "packages/db/tests/db-integration-plan.test.ts",
  "packages/mobile/tests/mobile-support.test.ts",
  "packages/testing/tests/testing-manifest.test.ts",
  "apps/web/tests/secure-upload-intents-route.test.ts",
  "apps/web/tests/privacy-requests-public-route.test.ts",
  "apps/web/tests/privacy-requests-dashboard-route.test.ts",
  "apps/web/tests/dashboard-trust-status-route.test.ts",
  "apps/web/tests/dashboard-deployment-readiness-route.test.ts",
  "apps/web/tests/security-runtime-middleware.test.ts",
  "apps/web/tests/security-runtime-middleware-static.test.ts",
  "apps/web/tests/dashboard-security-runtime-middleware-static.test.ts",
  "apps/web/tests/security-next-config-static.test.ts",
  "apps/web/tests/provider-webhook-contracts.test.ts",
  "testing/scripts/verify-performance-budgets.mjs",
  "apps/web/tests/e2e/public-booking.spec.ts",
  "apps/web/tests/e2e/security-runtime.spec.ts",
  "apps/web/tests/e2e/public-seo.spec.ts",
  "apps/web/tests/e2e/public-a11y.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-smoke.spec.ts",
  "apps/dashboard/tests/e2e/security-runtime.spec.ts",
  "apps/dashboard/tests/e2e/operator-surfaces.spec.ts",
  "apps/dashboard/tests/e2e/dashboard-a11y.spec.ts",
  "apps/mobile/tests/mobile-static.test.ts",
  "apps/mobile/tests/mobile-security-static.test.ts"
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
