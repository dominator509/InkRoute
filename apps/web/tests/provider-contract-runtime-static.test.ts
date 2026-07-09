import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedProviderContractArtifact,
  buildProviderContractRuntimeArtifactReview,
  buildProviderContractRuntimeEvidenceDecision,
  buildProviderContractRuntimeExecutionPlan,
  buildProviderContractRunData,
  buildProviderContractRunPersistenceContract,
  persistProviderContractRun,
  providerContractDisableEnablePolicy,
  providerContractRuntimeArtifactPaths,
  providerContractRuntimeCommands,
  providerContractRuntimeExternalArtifacts,
  providerContractRuntimeExternalCommands,
  providerContractRuntimeExecutionPolicy,
  providerContractRuntimeLocalArtifacts,
  providerContractRuntimeLocalCommands,
  providerContractRuntimeMatrix,
  providerContractRuntimeProofFiles,
  providerContractRuntimeRequiredExternalEvidence,
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
      "pnpm vitest run apps/web/tests/provider-webhook-contracts.test.ts",
      "pnpm test:manifest",
      "static provider disable/enable policy gate review",
      "commit signed raw-body and replay/idempotency fixtures for Stripe, email, SMS, and Sentry",
      "stripe listen --forward-to localhost:3000/api/webhooks/stripe && stripe trigger checkout.session.completed",
      "run Google Calendar OAuth, freebusy, sync-token, conflict, and disconnect sandbox flows",
      "run storage signed URL, upload/download, private-original, public-derivative, and scan-approved read contracts",
      "run Resend, Twilio, Expo Push, and Sentry sandbox send/capture contracts",
      "run auth session fixture and distributed rate-limit store contract tests",
      "GitHub Actions provider-contract job"
    ]);
    expect(providerContractRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "static-webhook-contracts",
      "provider-manifest-verification",
      "provider-disable-enable-policy",
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
        "coverage/provider-disable-enable-policy.json",
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
    expect(providerContractRuntimeReadiness.requiredCommands).toBe(providerContractRuntimeCommands);
    expect(providerContractRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "static provider contract suite, manifest verification, signed raw-body fixtures, and replay/idempotency fixtures",
        "provider disable/enable policy map with fail-closed missing-evidence gates",
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

  it("pins current provider contract runtime proof files for GAP-110", () => {
    expect(providerContractRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "packages/testing/src/index.ts",
      "packages/testing/tests/testing-manifest.test.ts",
        "apps/web/lib/providerContractRuntime.ts",
        "apps/web/tests/provider-contract-runtime-static.test.ts",
        "testing/manifests/provider-test-plan.json",
        "apps/web/tests/provider-webhook-contracts.test.ts",
        "packages/db/prisma/migrations/20260609013000_add_provider_contract_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of providerContractRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
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
    const runData = buildProviderContractRunData(contract.row);
    expect(runData).toMatchObject({
      tenantId: "tenant_demo",
      runId: "provider-contract-demo",
      status: "provider_gated",
      providerManifestVerified: true,
      redactedArtifactsRetained: true,
    });
    expect(persistProviderContractRun).toBeTypeOf("function");
    expect(String(persistProviderContractRun)).toContain("repository.providerContractRun.upsert");
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
    expect(gapTracker).toContain("Provider contract evidence classifier wired and sandbox proof gated");
    expect(gapTracker).toContain("GAP-110 is provider-contract-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("providerContractRuntimeLocalArtifacts");
    expect(gapTracker).toContain("providerContractRuntimeExternalArtifacts");
    expect(gapTracker).toContain("providerContractDisableEnablePolicy");
    expect(gapTracker).toContain("persistProviderContractRun upsert seam");
  });

  it("classifies GAP-110 evidence as blocked until provider sandbox proof is captured", () => {
    const blockedDecision = buildProviderContractRuntimeEvidenceDecision({
      staticWebhookContractsPassed: true,
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
      requiredCommandsRun: providerContractRuntimeCommands.filter(
        (command) =>
          command !== "stripe listen --forward-to localhost:3000/api/webhooks/stripe" &&
          command !== "provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit" &&
          command !== "GitHub Actions provider-contract job",
      ),
      capturedArtifacts: [
        "coverage/provider-contract-runtime.json",
        "coverage/provider-contract-static-suite.json",
        "coverage/provider-contract-manifest-check.json",
        "test-results/provider-contract-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Commit signed raw-body fixtures.",
        "Commit replay/idempotency fixtures.",
        "Run Stripe CLI webhook proof.",
        "Verify Stripe idempotency behavior.",
        "Run Google Calendar OAuth sandbox proof.",
        "Run storage signed URL proof.",
        "Run Twilio sandbox send proof.",
        "Verify Sentry capture proof.",
        "Capture CI provider-contract job proof.",
        "Required command not recorded: stripe listen --forward-to localhost:3000/api/webhooks/stripe",
        "Required command not recorded: provider sandbox contract suite for calendar/storage/email/sms/push/sentry/auth/rate-limit",
        "Required command not recorded: GitHub Actions provider-contract job",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/provider-raw-body-fixtures.json",
        "coverage/provider-replay-idempotency-fixtures.json",
        "coverage/provider-stripe-cli-redacted.log",
        "coverage/provider-google-calendar-sync-redacted.json",
        "coverage/provider-storage-upload-download.json",
        "coverage/provider-contract-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.requiredCommands).toBe(providerContractRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(providerContractRuntimeArtifactPaths);
    expect(blockedDecision.providerPolicy).toEqual({
      rawSecretsForbidden: true,
      signedRawBodyFixturesRequired: true,
      sandboxArtifactsRedacted: true,
    });

    const completeDecision = buildProviderContractRuntimeEvidenceDecision({
      staticWebhookContractsPassed: true,
      providerManifestVerified: true,
      rawBodyFixturesCommitted: true,
      replayIdempotencyFixturesCommitted: true,
      stripeCliWebhookPassed: true,
      stripeIdempotencyVerified: true,
      googleCalendarOauthPassed: true,
      googleCalendarSyncVerified: true,
      storageSignedUrlPassed: true,
      storageUploadDownloadPassed: true,
      resendSandboxPassed: true,
      twilioSandboxPassed: true,
      expoPushSandboxPassed: true,
      sentryCaptureVerified: true,
      authSessionFixturesPassed: true,
      rateLimitStorePassed: true,
      redactedArtifactsRetained: true,
      ciProviderContractPassed: true,
      requiredCommandsRun: providerContractRuntimeCommands,
      capturedArtifacts: providerContractRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(providerContractRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(providerContractRuntimeArtifactPaths);
  });

  it("keeps GAP-110 provider sandbox execution disabled in the local plan", () => {
    const plan = buildProviderContractRuntimeExecutionPlan();

    expect(plan.fixtureCommitExecutionAllowed).toBe(false);
    expect(plan.stripeCliExecutionAllowed).toBe(false);
    expect(plan.calendarSandboxExecutionAllowed).toBe(false);
    expect(plan.storageSandboxExecutionAllowed).toBe(false);
    expect(plan.messagingSandboxExecutionAllowed).toBe(false);
    expect(plan.authRateLimitSandboxExecutionAllowed).toBe(false);
    expect(plan.ciProviderExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.policy).toBe(providerContractRuntimeExecutionPolicy);
    expect(plan.externalEvidenceRequired).toBe(providerContractRuntimeRequiredExternalEvidence);
    expect(providerContractRuntimeExecutionPolicy.externalEvidenceRequired).toBe(providerContractRuntimeRequiredExternalEvidence);
    expect(providerContractRuntimeRequiredExternalEvidence).toEqual(expect.arrayContaining([
      "Signed raw-body and replay/idempotency fixture proof",
      "Stripe CLI webhook/idempotency proof",
      "Google Calendar OAuth/sync proof",
      "Storage signed URL/upload/download proof",
      "Provider-backed ProviderContractRun persistence proof",
    ]));
    expect(plan.localCommands).toBe(providerContractRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(providerContractRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(providerContractRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(providerContractRuntimeExternalArtifacts);
    expect(plan.disableEnablePolicy).toBe(providerContractDisableEnablePolicy);
    expect(providerContractDisableEnablePolicy.map((entry) => entry.provider)).toEqual([
      "stripe",
      "google_calendar",
      "storage",
      "email_sms_push",
      "sentry",
      "auth_rate_limit",
    ]);
    expect(providerContractDisableEnablePolicy.every((entry) => entry.defaultState === "disabled")).toBe(true);
    expect(providerContractDisableEnablePolicy.every((entry) => entry.disableOnMissingEvidence === true)).toBe(true);
    expect(providerContractDisableEnablePolicy.every((entry) => entry.rawSecretArtifactsAllowed === false)).toBe(true);
    expect(plan.externalArtifacts).toEqual(expect.arrayContaining([
      "coverage/provider-raw-body-fixtures.json",
      "coverage/provider-stripe-cli-redacted.log",
      "coverage/provider-google-calendar-sync-redacted.json",
      "coverage/provider-storage-upload-download.json",
      "coverage/provider-contract-ci-run-redacted.json",
    ]));
    expect(plan.disabledReasons.join(" ")).toContain("Stripe CLI webhook/idempotency proof requires Stripe sandbox execution.");
  });

  it("redacts GAP-110 provider sandbox artifacts before review", () => {
    const rawArtifact = {
      runId: "provider-contract-private",
      commitSha: "privatecommitsha",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/private",
      stripeSignature: "stripe-signature-secret",
      googleAccessToken: "google-access-token",
      twilioAuthToken: "twilio-token",
      expoPushToken: "expo-push-token",
      sentryDsn: "https://sentry-secret@example.ingest.sentry.io/1",
      rawBody: "{\"email\":\"client@example.com\",\"phone\":\"+1 555 202 3030\"}",
      sandboxTranscript: "Authorization: Bearer provider-secret-token",
      stack: "Error: provider contract failed",
      providerRequest: { destinationUrl: "https://provider.example.test/private" },
      providerResponse: { providerEventId: "provider_event_private_123" },
      replayLog: "replay used idempotency_private_123",
      rateLimitStoreOutput: "redis://provider:secret@cache.example.test:6379",
      storageSignedUrl: "https://storage.example.test/private-object",
      neutralTranscript: "webhook event_private_123 replayed fixture_private_123 during workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_provider_contract",
      reviewerHandle: "reviewer_provider_contract_owner",
      codeownerSelector: "CODEOWNER:provider-platform-team",
    };

    const redacted = buildRedactedProviderContractArtifact(rawArtifact);
    const review = buildProviderContractRuntimeArtifactReview(rawArtifact);
    const serialized = JSON.stringify({ redacted, review });

    expect(serialized).not.toContain("provider-contract-private");
    expect(serialized).not.toContain("privatecommitsha");
    expect(serialized).not.toContain("/actions/runs/private");
    expect(serialized).not.toContain("stripe-signature-secret");
    expect(serialized).not.toContain("google-access-token");
    expect(serialized).not.toContain("twilio-token");
    expect(serialized).not.toContain("expo-push-token");
    expect(serialized).not.toContain("sentry-secret");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("+1 555 202 3030");
    expect(serialized).not.toContain("provider-secret-token");
    expect(serialized).not.toContain("provider contract failed");
    expect(serialized).not.toContain("provider.example.test/private");
    expect(serialized).not.toContain("provider_event_private_123");
    expect(serialized).not.toContain("idempotency_private_123");
    expect(serialized).not.toContain("redis://provider:secret@cache.example.test:6379");
    expect(serialized).not.toContain("storage.example.test/private-object");
    expect(serialized).not.toContain("event_private_123");
    expect(serialized).not.toContain("fixture_private_123");
    expect(serialized).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_provider_contract");
    expect(serialized).not.toContain("reviewer_provider_contract_owner");
    expect(serialized).not.toContain("CODEOWNER:provider-platform-team");
    expect(serialized).toContain("[REDACTED]");
    expect(review.requiredArtifacts).toBe(providerContractRuntimeArtifactPaths);
    expect(review.retainedExternalGates).toEqual(expect.arrayContaining([
      "Stripe CLI webhook/idempotency proof",
      "Google Calendar OAuth/sync sandbox proof",
      "Provider-backed ProviderContractRun persistence proof",
    ]));
  });
});

