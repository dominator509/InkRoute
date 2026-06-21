import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildGoogleCalendarSyncEvidenceDecision,
  buildGoogleCalendarSyncExecutionPlan,
  buildGoogleCalendarSyncArtifactReview,
  buildRedactedGoogleCalendarSyncArtifact,
  googleCalendarSyncArtifactPaths,
  googleCalendarSyncDecisionRequiredEvidence,
  googleCalendarSyncExternalCommands,
  googleCalendarSyncLocalCommands,
  googleCalendarSyncRequiredExternalEvidence,
  googleCalendarSyncRuntimeCommands,
  googleCalendarSyncRuntimeMatrix,
  googleCalendarSyncRuntimeProofFiles,
  googleCalendarSyncRuntimeReadiness,
} from "../lib/googleCalendarSyncRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("Google Calendar sync runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const syncSource = readWorkspaceFile("apps/dashboard/lib/googleCalendarSync.ts");
  const syncStaticTest = readWorkspaceFile("apps/dashboard/tests/google-calendar-sync-static.test.ts");
  const syncRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/google-sync/route.ts");
  const calendarRoute = readWorkspaceFile("apps/dashboard/app/api/calendar/route.ts");
  const readRouteStaticTest = readWorkspaceFile("apps/dashboard/tests/calendar-read-route-static.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-057 commands, matrix rows, and artifacts", () => {
    expect(googleCalendarSyncRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "Google OAuth callback smoke test",
      "Google FreeBusy test-calendar smoke",
      "Google event insert/update/delete smoke",
      "Google invalid sync-token full-resync smoke",
      "Google push channel renewal/webhook smoke",
    ]);
    expect(googleCalendarSyncRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "google-sdk-client",
      "oauth-app",
      "oauth-callback",
      "required-scopes",
      "encrypted-token-repository",
      "provider-worker",
      "freebusy-smoke",
      "event-crud-smoke",
      "full-incremental-sync",
      "invalid-token-recovery",
      "push-renewal",
      "push-webhook",
      "retry-backoff",
      "idempotency-store",
      "calendar-audit-log",
      "tenant-isolation",
      "test-calendar-artifacts",
      "ci-secret-safe-evidence",
    ]);
    expect(googleCalendarSyncArtifactPaths).toContain("coverage/google-calendar-sync-runtime.json");
    expect(googleCalendarSyncArtifactPaths).toContain("test-results/google-calendar-sync-runtime");
  });

  it("pins current Google Calendar sync proof files for GAP-057", () => {
    expect(googleCalendarSyncRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/calendar/package.json",
      "packages/calendar/src/index.ts",
      "packages/calendar/tests/availability-conflicts.test.ts",
      "apps/dashboard/lib/googleCalendarSync.ts",
      "apps/dashboard/lib/googleCalendarSyncRuntime.ts",
      "apps/dashboard/app/api/calendar/google-sync/route.ts",
      "apps/dashboard/app/api/calendar/route.ts",
      "apps/dashboard/tests/google-calendar-sync-static.test.ts",
      "apps/dashboard/tests/google-calendar-sync-runtime-static.test.ts",
      "apps/dashboard/tests/calendar-read-route-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of googleCalendarSyncRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, dashboard provider-worker contract, sync route, and calendar read route wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildGoogleCalendarProviderSyncPlan");
    expect(calendarSource).toContain("buildGoogleCalendarRuntimeReadinessPlan");
    expect(calendarTests).toContain("buildGoogleCalendarRuntimeReadinessPlan");
    expect(syncSource).toContain("GoogleCalendarSyncRepository");
    expect(syncSource).toContain("createInMemoryGoogleCalendarSyncRepository");
    expect(syncSource).toContain("sanitizeGoogleCalendarProviderResult");
    expect(syncSource).toContain("loadEncryptedConnection");
    expect(syncSource).toContain("runGoogleCalendarTransaction");
    expect(syncStaticTest).toContain("covers OAuth, FreeBusy, event mutation, full/incremental sync, and push renewal actions");
    expect(syncStaticTest).toContain("sanitizes nested Google provider payloads before persistence");
    expect(syncStaticTest).toContain("executes a local Google sync repository contract");
    expect(syncRoute).toContain("GOOGLE_CALENDAR_SYNC_BLOCKED");
    expect(syncRoute).toContain("provider-worker-required");
    expect(syncRoute).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(syncRoute).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(calendarRoute).toContain("provider-worker-required");
    expect(readRouteStaticTest).toContain("Read APIs wired");
  });

  it("keeps SDK, OAuth, token, provider, smoke, push, isolation, and artifact blockers explicit", () => {
    expect(googleCalendarSyncRuntimeReadiness.status).toBe("blocked");
    expect(googleCalendarSyncRuntimeReadiness.missingScripts).toEqual([]);
    expect(googleCalendarSyncRuntimeReadiness.requiredCommands).toEqual(googleCalendarSyncRuntimeCommands);
    expect(googleCalendarSyncRuntimeReadiness.requiredEvidence).toEqual(googleCalendarSyncDecisionRequiredEvidence);
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google Calendar SDK/client dependency must be installed and pinned.");
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google FreeBusy smoke test must pass against a test calendar.");
    expect(googleCalendarSyncRuntimeReadiness.blockers).toContain("Google test calendar evidence must be attached for OAuth, freebusy, event sync, push, and recovery flows.");
  });

  it("classifies Google provider evidence before GAP-057 can close", () => {
    const blockedDecision = buildGoogleCalendarSyncEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      sdkClientVerified: false,
      oauthAppVerified: false,
      oauthCallbackSmokePassed: false,
      requiredScopesVerified: true,
      encryptedTokenRepositoryVerified: true,
      providerWorkerVerified: false,
      freebusySmokePassed: false,
      eventCrudSmokePassed: false,
      fullIncrementalSyncVerified: true,
      invalidTokenRecoveryVerified: false,
      pushRenewalVerified: true,
      pushWebhookVerified: false,
      retryBackoffVerified: true,
      idempotencyStoreVerified: true,
      calendarAuditLogVerified: true,
      tenantIsolationVerified: false,
      googleTestCalendarArtifactsCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/google-calendar-sync-runtime.json",
        "coverage/google-calendar-sync-calendar-typecheck.txt",
        "coverage/google-calendar-sync-calendar-test.txt",
        "coverage/google-calendar-sync-scopes.json",
        "coverage/google-calendar-sync-encrypted-token-repository.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Google Calendar SDK/client evidence is missing.");
    expect(blockedDecision.blockers).toContain("Google OAuth callback smoke evidence is missing.");
    expect(blockedDecision.blockers).toContain("Google provider worker execution evidence is missing.");
    expect(blockedDecision.blockers).toContain("Google push webhook handler evidence is missing.");
    expect(blockedDecision.blockers).toContain("Redacted Google test-calendar artifact bundle is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe Google Calendar sync artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/google-calendar-sync-freebusy-smoke-redacted.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/google-calendar-sync-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual(googleCalendarSyncRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(googleCalendarSyncDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: googleCalendarSyncArtifactPaths.length,
    });

    const completeDecision = buildGoogleCalendarSyncEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      sdkClientVerified: true,
      oauthAppVerified: true,
      oauthCallbackSmokePassed: true,
      requiredScopesVerified: true,
      encryptedTokenRepositoryVerified: true,
      providerWorkerVerified: true,
      freebusySmokePassed: true,
      eventCrudSmokePassed: true,
      fullIncrementalSyncVerified: true,
      invalidTokenRecoveryVerified: true,
      pushRenewalVerified: true,
      pushWebhookVerified: true,
      retryBackoffVerified: true,
      idempotencyStoreVerified: true,
      calendarAuditLogVerified: true,
      tenantIsolationVerified: true,
      googleTestCalendarArtifactsCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: googleCalendarSyncArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toEqual(googleCalendarSyncDecisionRequiredEvidence);
  });

  it("keeps GAP-057 execution policy non-executing and external evidence explicit", () => {
    const plan = buildGoogleCalendarSyncExecutionPlan();

    expect(plan.policy.codexMayClassifyStaticGoogleCalendarSyncReadiness).toEqual(true);
    expect(plan.policy.googleSdkClientRequiredForClosure).toEqual(true);
    expect(plan.policy.oauthProviderRequiredForClosure).toEqual(true);
    expect(plan.policy.encryptedTokenPersistenceRequiredForClosure).toEqual(true);
    expect(plan.policy.providerWorkerRequiredForClosure).toEqual(true);
    expect(plan.policy.pushWebhookRequiredForClosure).toEqual(true);
    expect(plan.policy.googleTestCalendarRequiredForClosure).toEqual(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toEqual(true);
    expect(plan.commandExecutionAllowed).toEqual(false);
    expect(plan.googleProviderExecutionAllowed).toEqual(false);
    expect(plan.oauthExecutionAllowed).toEqual(false);
    expect(plan.encryptedTokenExecutionAllowed).toEqual(false);
    expect(plan.pushWebhookExecutionAllowed).toEqual(false);
    expect(plan.tenantIsolationExecutionAllowed).toEqual(false);
    expect(plan.ciExecutionAllowed).toEqual(false);
    expect(plan.localCommands).toEqual(googleCalendarSyncLocalCommands);
    expect(plan.externalCommands).toEqual(googleCalendarSyncExternalCommands);
    expect(plan.requiredExternalEvidence).toEqual(googleCalendarSyncRequiredExternalEvidence);
  });

  it("redacts GAP-057 Google Calendar artifacts before secret-safe review", () => {
    const artifact = {
      googleOAuthRefreshToken: "refresh_private",
      googleCalendarId: "calendar_private",
      tenantDomain: "tenant.example.test",
      providerEventPayload: "event_private",
      nested: {
        pushChannelUrl: "https://private/channel",
        publicSummary: "Google Calendar sync evidence captured",
      },
    };

    const redacted = buildRedactedGoogleCalendarSyncArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "googleOAuthRefreshToken",
      "googleCalendarId",
      "tenantDomain",
      "providerEventPayload",
      "nested.pushChannelUrl",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      googleOAuthRefreshToken: "[REDACTED]",
      googleCalendarId: "[REDACTED]",
      tenantDomain: "[REDACTED]",
      providerEventPayload: "[REDACTED]",
      nested: {
        pushChannelUrl: "[REDACTED]",
        publicSummary: "Google Calendar sync evidence captured",
      },
    });

    const review = buildGoogleCalendarSyncArtifactReview({
      publicSummary: "safe Google Calendar sync evidence",
      oauthCallbackUrl: "https://private/oauth",
    });
    expect(review.secretSafe).toEqual(true);
    expect(review.redactedPaths).toEqual(["oauthCallbackUrl"]);
    expect(review.requiredExternalEvidence).toEqual(googleCalendarSyncRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming Google provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 Google Calendar sync runtime contracts");
    expect(ciWorkflow).toContain("google-calendar-sync-runtime-static.test.ts");
    expect(ciWorkflow).toContain("google-calendar-sync-runtime-artifacts");
    expect(unitManifest).toContain("unit-google-calendar-sync-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/googleCalendarSyncRuntime.ts");
    expect(gapTracker).toContain("Google provider evidence classifier");
    expect(gapTracker).toContain("local Google sync repository contract");
    expect(gapTracker).toContain("provider-result sanitizer");
    expect(gapTracker).toContain("GAP-057 is google-calendar-sync-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildGoogleCalendarSyncExecutionPlan");
    expect(gapTracker).toContain("googleCalendarSyncExecutionPolicy");
    expect(gapTracker).toContain("googleCalendarSyncRequiredExternalEvidence");
    expect(gapTracker).toContain("googleCalendarSyncDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildRedactedGoogleCalendarSyncArtifact");
    expect(gapTracker).toContain("buildGoogleCalendarSyncArtifactReview");
    expect(googleCalendarSyncArtifactPaths).toContain("coverage/google-calendar-sync-secret-safe-artifacts.json");
  });
});


