import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedTravelPublishArtifact,
  buildTravelPublishArtifactReview,
  buildTravelPublishEvidenceDecision,
  buildTravelPublishExecutionPlan,
  travelPublishArtifactPaths,
  travelPublishDecisionRequiredEvidence,
  travelPublishExternalCommands,
  travelPublishExecutionPolicy,
  travelPublishLocalCommands,
  travelPublishRequiredExternalEvidence,
  travelPublishRuntimeCommands,
  travelPublishRuntimeMatrix,
  travelPublishRuntimeProofFiles,
  travelPublishRuntimeReadiness,
} from "../lib/travelPublishRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("travel publish runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const dashboardTravelPublishSource = readWorkspaceFile("apps/dashboard/lib/travelPublish.ts");
  const routeSource = readWorkspaceFile("apps/dashboard/app/api/travel/publish/route.ts");
  const staticTest = readWorkspaceFile("apps/dashboard/tests/travel-publish-static.test.ts");
  const publicTravelPage = readWorkspaceFile("apps/web/app/travel/page.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-060 commands, matrix rows, and artifacts", () => {
    expect(travelPublishRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/dashboard/tests/travel-publish-static.test.ts",
      "travel publish repository integration tests",
      "Nomad Mode dashboard-to-public E2E smoke",
      "failed-provider rollback tests",
    ]);
    expect(travelPublishRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "dashboard-typecheck",
      "web-typecheck",
      "static-contract",
      "durable-repository",
      "public-data-api",
      "cache-revalidation",
      "city-waitlist-matching",
      "notification-provider-queue",
      "mobile-sync-transport",
      "dashboard-sync-transport",
      "web-sync-event",
      "audit-log",
      "failed-provider-rollback",
      "tenant-isolation",
      "dashboard-public-e2e",
      "ci-travel-publish-job",
      "secret-safe-artifacts",
    ]);
    expect(travelPublishArtifactPaths).toContain("coverage/travel-publish-runtime.json");
    expect(travelPublishArtifactPaths).toContain("test-results/travel-publish-runtime");
  });

  it("pins current travel publish proof files for GAP-060", () => {
    expect(travelPublishRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/dashboard/package.json",
      "apps/web/package.json",
      "packages/calendar/package.json",
      "packages/calendar/src/index.ts",
      "apps/dashboard/lib/travelPublish.ts",
      "apps/dashboard/lib/travelPublishRuntime.ts",
      "apps/dashboard/components/TravelPublishActionPanel.tsx",
      "apps/dashboard/app/api/travel/publish/route.ts",
      "apps/dashboard/app/travel/page.tsx",
      "apps/dashboard/tests/travel-publish-static.test.ts",
      "apps/dashboard/tests/travel-publish-runtime-static.test.ts",
      "apps/web/app/travel/page.tsx",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of travelPublishRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
    expect(readWorkspaceFile("apps/dashboard/components/TravelPublishActionPanel.tsx")).toContain('fetch("/api/travel/publish"');
    expect(readWorkspaceFile("apps/dashboard/components/TravelPublishActionPanel.tsx")).toContain("Submit publish draft");
  });

  it("keeps package helper, dashboard mutation contract, route boundary, static guard, and public surface wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildTravelPublishMutationPlan");
    expect(calendarSource).toContain("buildTravelPublishRuntimeReadinessPlan");
    expect(dashboardTravelPublishSource).toContain("executeTravelPublishMutation");
    expect(dashboardTravelPublishSource).toContain("createInMemoryTravelPublishRepository");
    expect(dashboardTravelPublishSource).toContain("enqueuePostCommitEffects");
    expect(dashboardTravelPublishSource).toContain("rollbackFailedPublish");
    expect(routeSource).toContain("buildTravelPublishMutationPlan");
    expect(routeSource).toContain("travel:write");
    expect(routeSource).toContain("{ status: 202, headers: noStoreHeaders }");
    expect(routeSource).not.toContain("{ status: 501, headers: noStoreHeaders }");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(staticTest).toContain("plans revalidation, waitlist notifications, sync events, audit logs, idempotency, and rollback");
    expect(staticTest).toContain("executes a local travel publish repository contract");
    expect(staticTest).toContain("rolls back local travel publish mutations when post-commit effects fail");
    expect(publicTravelPage).toContain("Travel");
  });

  it("keeps repository, public API, provider queue, rollback, tenant, E2E, CI, and artifact blockers explicit", () => {
    expect(travelPublishRuntimeReadiness.status).toBe("blocked");
    expect(travelPublishRuntimeReadiness.missingScripts).toEqual([]);
    expect(travelPublishRuntimeReadiness.requiredCommands).toEqual(travelPublishRuntimeCommands);
    expect(travelPublishRuntimeReadiness.requiredEvidence).toEqual(travelPublishDecisionRequiredEvidence);
    expect(travelPublishRuntimeReadiness.blockers).toContain("Public travel data API must read committed travel publish state.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Notification provider queue execution must be tested for travel publish jobs.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Failed provider action rollback tests must pass.");
    expect(travelPublishRuntimeReadiness.blockers).toContain("Cross-tenant travel publish mutation tests must be denied.");
  });

  it("pins the non-executing GAP-060 travel publish execution policy", () => {
    const plan = buildTravelPublishExecutionPlan();

    expect(travelPublishExecutionPolicy).toEqual({
      codexMayClassifyStaticTravelPublishReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      durableRepositoryRequiredForClosure: true,
      publicTravelDataApiRequiredForClosure: true,
      cacheRevalidationRequiredForClosure: true,
      notificationProviderRequiredForClosure: true,
      syncTransportRequiredForClosure: true,
      tenantIsolationRequiredForClosure: true,
      rollbackEvidenceRequiredForClosure: true,
      dashboardPublicE2eRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toEqual(travelPublishExecutionPolicy);
    expect(plan.commandExecutionAllowed).toEqual(false);
    expect(plan.durableRepositoryExecutionAllowed).toEqual(false);
    expect(plan.publicApiExecutionAllowed).toEqual(false);
    expect(plan.cacheRevalidationExecutionAllowed).toEqual(false);
    expect(plan.notificationProviderExecutionAllowed).toEqual(false);
    expect(plan.syncTransportExecutionAllowed).toEqual(false);
    expect(plan.tenantIsolationExecutionAllowed).toEqual(false);
    expect(plan.rollbackExecutionAllowed).toEqual(false);
    expect(plan.e2eExecutionAllowed).toEqual(false);
    expect(plan.ciExecutionAllowed).toEqual(false);
    expect(plan.artifactReviewExecutionAllowed).toEqual(false);
    expect(plan.localCommands).toEqual(travelPublishLocalCommands);
    expect(plan.externalCommands).toEqual(travelPublishExternalCommands);
    expect(plan.requiredExternalEvidence).toEqual(travelPublishRequiredExternalEvidence);
    expect(travelPublishRequiredExternalEvidence).toEqual([
      "actual travel publish command output",
      "durable travel repository integration tests",
      "committed public travel data API reads",
      "cache/revalidation after commit evidence",
      "city waitlist matching against persisted clients",
      "consent-filtered notification queue provider execution",
      "mobile/dashboard/web sync transport evidence",
      "tenant isolation tests",
      "failed-provider rollback tests",
      "Nomad Mode dashboard-to-public E2E smoke",
      "CI travel publish artifacts",
      "secret-safe travel publish artifact review",
    ]);
  });

  it("pins recursive travel publish artifact redaction and review", () => {
    const redacted = buildRedactedTravelPublishArtifact({
      notificationProviderQueueUrl: "https://private/provider-queue",
      tenantDomain: "tenant.example.test",
      waitlistClientEmail: "client@example.test",
      publicSummary: "travel publish evidence captured",
      nested: {
        syncTraceUrl: "https://private/sync-trace.zip",
        publicStatus: "published",
      },
    });

    expect(redacted.secretSafe).toEqual(true);
    expect(redacted.redactedPaths).toEqual([
      "notificationProviderQueueUrl",
      "tenantDomain",
      "waitlistClientEmail",
      "nested.syncTraceUrl",
    ]);
    expect(redacted.artifact).toEqual({
      notificationProviderQueueUrl: "[redacted]",
      tenantDomain: "[redacted]",
      waitlistClientEmail: "[redacted]",
      publicSummary: "travel publish evidence captured",
      nested: {
        syncTraceUrl: "[redacted]",
        publicStatus: "published",
      },
    });

    const review = buildTravelPublishArtifactReview({
      publicSummary: "safe travel publish artifact",
      dashboardPublicE2eScreenshotUrl: "https://private/screenshot.png",
    });

    expect(review.passed).toEqual(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toEqual(true);
    expect(review.artifact.redactedPaths).toEqual(["dashboardPublicE2eScreenshotUrl"]);
    expect(review.requiredExternalEvidence).toEqual(travelPublishRequiredExternalEvidence);
  });

  it("classifies travel publish evidence before GAP-060 can close", () => {
    const blockedDecision = buildTravelPublishEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      dashboardTypecheckPassed: true,
      webTypecheckPassed: true,
      staticContractTestsPassed: true,
      repositoryIntegrationPassed: false,
      publicDataApiPassed: false,
      cacheRevalidationVerified: false,
      waitlistMatchingVerified: false,
      notificationProviderQueuePassed: false,
      mobileSyncTransportPassed: false,
      dashboardSyncTransportPassed: false,
      webSyncEventPassed: false,
      auditLogPersistencePassed: false,
      failedProviderRollbackPassed: false,
      tenantIsolationPassed: false,
      dashboardPublicE2ePassed: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/travel-publish-runtime.json",
        "coverage/travel-publish-calendar-typecheck.txt",
        "coverage/travel-publish-calendar-test.txt",
        "coverage/travel-publish-dashboard-typecheck.txt",
        "coverage/travel-publish-web-typecheck.txt",
        "coverage/travel-publish-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Durable travel repository integration evidence is missing.");
    expect(blockedDecision.blockers).toContain("Committed public travel data API evidence is missing.");
    expect(blockedDecision.blockers).toContain("Consent-filtered notification provider queue evidence is missing.");
    expect(blockedDecision.blockers).toContain("Failed-provider rollback evidence is missing.");
    expect(blockedDecision.blockers).toContain("Nomad Mode dashboard-to-public E2E evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe travel publish artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/travel-publish-repository-integration.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/travel-publish-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual(travelPublishRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toEqual(travelPublishDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 6,
      requiredArtifactCount: travelPublishArtifactPaths.length,
    });

    const completeDecision = buildTravelPublishEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      dashboardTypecheckPassed: true,
      webTypecheckPassed: true,
      staticContractTestsPassed: true,
      repositoryIntegrationPassed: true,
      publicDataApiPassed: true,
      cacheRevalidationVerified: true,
      waitlistMatchingVerified: true,
      notificationProviderQueuePassed: true,
      mobileSyncTransportPassed: true,
      dashboardSyncTransportPassed: true,
      webSyncEventPassed: true,
      auditLogPersistencePassed: true,
      failedProviderRollbackPassed: true,
      tenantIsolationPassed: true,
      dashboardPublicE2ePassed: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: travelPublishArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredEvidence).toEqual(travelPublishDecisionRequiredEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/public/E2E evidence", () => {
    expect(ciWorkflow).toContain("Run Phase 8 travel publish runtime contracts");
    expect(ciWorkflow).toContain("travel-publish-runtime-static.test.ts");
    expect(ciWorkflow).toContain("travel-publish-runtime-artifacts");
    expect(unitManifest).toContain("unit-travel-publish-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/travelPublishRuntime.ts");
    expect(gapTracker).toContain("travel publish evidence classifier");
    expect(gapTracker).toContain("travelPublishDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildTravelPublishExecutionPlan");
    expect(gapTracker).toContain("travelPublishExecutionPolicy");
    expect(gapTracker).toContain("travelPublishRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedTravelPublishArtifact");
    expect(gapTracker).toContain("buildTravelPublishArtifactReview");
    expect(gapTracker).toContain("non-executing travel publish execution policy");
    expect(gapTracker).toContain("local in-memory travel publish repository contract");
    expect(gapTracker).toContain("GAP-060 is travel-publish-runtime-matrix wired with travel publish evidence classifier");
    expect(travelPublishArtifactPaths).toContain("coverage/travel-publish-secret-safe-artifacts.json");
  });
});


