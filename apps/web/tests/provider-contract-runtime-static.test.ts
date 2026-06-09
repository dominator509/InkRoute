import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProviderContractRunPersistenceContract,
  providerContractRuntimeArtifactPaths,
  providerContractRuntimeCommands,
  providerContractRuntimeMatrix,
  providerContractRuntimeReadiness,
  providerContractRunPersistencePreview
} from "../lib/providerContractRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const providerManifest = read("testing/manifests/provider-test-plan.json");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const manifestVerifier = read("testing/scripts/verify-test-manifest.mjs");
const webhookContracts = read("apps/web/tests/provider-webhook-contracts.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const gapTracker = read("GAP_TRACKER.md");

describe("GAP-110 provider contract runtime wiring", () => {
  it("pins provider contract commands, matrix entries, and artifact paths", () => {
    expect(providerContractRuntimeCommands).toEqual([
      "pnpm test:manifest",
      "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "stripe trigger checkout.session.completed",
      "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
      "GitHub Actions provider-contract job"
    ]);
    expect(providerContractRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "static-webhook-contracts",
      "provider-manifest-verification",
      "raw-body-replay-fixtures",
      "stripe-cli-idempotency",
      "google-calendar-oauth-sync",
      "storage-signed-url-upload-download",
      "messaging-push-sentry",
      "auth-rate-limit-fixtures",
      "ci-redacted-artifacts"
    ]);
    expect(providerContractRuntimeArtifactPaths).toEqual(
      expect.arrayContaining([
        "coverage/provider-contract-runtime.json",
        "coverage/provider-raw-body-fixtures.json",
        "coverage/provider-replay-idempotency-fixtures.json",
        "coverage/provider-stripe-cli-redacted.log",
        "coverage/provider-google-calendar-sync-redacted.json",
        "coverage/provider-storage-upload-download.json",
        "coverage/provider-sentry-capture-redacted.json",
        "coverage/provider-rate-limit-store.json",
        "coverage/provider-contract-ci-run-redacted.json",
        "test-results/provider-contract-runtime"
      ])
    );
  });

  it("keeps provider plan, manifest verifier, and webhook static suite aligned", () => {
    for (const provider of ["Stripe", "Google Calendar", "Email/SMS/Push", "Sentry"]) {
      expect(providerManifest).toContain(provider);
    }
    expect(providerManifest).toContain("apps/web/tests/provider-webhook-contracts.test.ts");
    expect(providerManifest).toContain("stripe trigger checkout.session.completed");
    expect(providerManifest).toContain("Send Twilio test SMS");
    expect(providerManifest).toContain("Trigger mobile crash in preview");
    expect(manifestVerifier).toContain("testing/manifests/provider-test-plan.json");
    expect(manifestVerifier).toContain("apps/web/tests/provider-webhook-contracts.test.ts");
    expect(webhookContracts).toContain("Stripe");
    expect(webhookContracts).toContain("raw-body");
    expect(webhookContracts).toContain("idempotency");
  });

  it("keeps readiness blocked until live provider fixtures, sandboxes, stores, redacted artifacts, and CI evidence exist", () => {
    expect(providerContractRuntimeReadiness.status).toBe("blocked");
    expect(providerContractRuntimeReadiness.missingScripts).toEqual([]);
    expect(providerContractRuntimeReadiness.requiredCommands).toEqual(
      expect.arrayContaining([
        "pnpm test:manifest",
        "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
        "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
        "stripe trigger checkout.session.completed",
        "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit"
      ])
    );
    expect(providerContractRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "static provider contract suite, manifest verification, signed raw-body fixtures, and replay/idempotency fixtures",
        "Stripe CLI webhook/idempotency and Google Calendar OAuth/sync sandbox transcripts",
        "storage signed URL/upload/download, rate-limit store, and auth session fixture contract output",
        "email, SMS, push, and Sentry sandbox send/capture artifacts",
        "redacted provider artifact bundle and CI provider-contract job evidence"
      ])
    );
    expect(providerContractRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Stripe CLI signed webhook replay must pass against the local or preview webhook route.",
        "Google Calendar freebusy, sync-token, conflict, insert/update/delete, and disconnect flows must be verified.",
        "Signed raw-body fixtures must be committed for Stripe, email, SMS, and Sentry webhook verification.",
        "CI provider-contract job must pass or publish credential-gated skip evidence and retained artifacts."
      ])
    );
  });

  it("pins durable ProviderContractRun rows, fixture gates, provider sandbox flags, redacted artifacts, and CI evidence", () => {
    const schema = read("packages/db/prisma/schema.prisma");
    const contract = buildProviderContractRunPersistenceContract({
      tenantId: "tenant_demo",
      runId: "provider-contract-demo",
      commitSha: "abc1234",
      status: "provider_gated",
      runtimeMatrix: providerContractRuntimeMatrix,
      artifactManifest: providerContractRuntimeArtifactPaths,
      staticWebhookContractsPassed: false,
      providerManifestVerified: true,
      rawBodyFixturesCommitted: false,
      replayIdempotencyFixturesCommitted: false,
      stripeCliWebhookPassed: false,
      stripeIdempotencyVerified: false,
      googleCalendarOauthPassed: false,
      googleCalendarSyncVerified: false,
      storageSignedUrlPassed: false,
      storageUploadDownloadPassed: false,
      resendSandboxPassed: false,
      twilioSandboxPassed: false,
      expoPushSandboxPassed: false,
      sentryCaptureVerified: false,
      authSessionFixturesPassed: false,
      rateLimitStorePassed: false,
      redactedArtifactsRetained: true,
      ciProviderContractPassed: false,
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/redacted"
    });

    expect(schema).toContain("model ProviderContractRun");
    expect(schema).toContain("stripeCliWebhookPassed");
    expect(schema).toContain("rateLimitStorePassed");
    expect(schema).toContain("@@unique([tenantId, runId])");
    expect(contract.transactionWrites).toEqual(["ProviderContractRun", "AuditLog"]);
    expect(contract.requiredProviderFlags).toContain("rawBodyFixturesCommitted");
    expect(contract.artifactFields).toContain("artifactManifest");
    expect(contract.tenantIsolationKey).toBe("tenantId");
    expect(providerContractRunPersistencePreview.modelName).toBe("ProviderContractRun");
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 14 provider contract runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/provider-contract-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-contract-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/provider-contract-runtime.json");
    expect(ciWorkflow).toContain("test-results/provider-contract-runtime");
    expect(unitManifest).toContain("unit-web-provider-contract-runtime-static");
    expect(unitManifest).toContain("ProviderContractRun Prisma model and app row contract are wired");
    expect(gapTracker).toContain("apps/web/lib/providerContractRuntime.ts");
    expect(gapTracker).toContain("live provider sandbox execution proof remains open");
  });
});
