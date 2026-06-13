import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildNotificationSchedulerEvidenceDecision,
  notificationSchedulerArtifactPaths,
  notificationSchedulerRuntimeProofFiles,
  notificationSchedulerRuntimeCommands,
  notificationSchedulerRuntimeMatrix,
  notificationSchedulerRuntimeReadiness,
} from "../lib/notificationSchedulerRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("dashboard notification scheduler runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const schedulerSource = readRepoFile("apps/dashboard/lib/notificationScheduler.ts");
  const routeSource = readRepoFile("apps/dashboard/app/api/notifications/scheduler/route.ts");
  const pageSource = readRepoFile("apps/dashboard/app/templates/page.tsx");
  const staticTest = readRepoFile("apps/dashboard/tests/notification-scheduler-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-065 commands, matrix rows, and artifacts", () => {
    expect(notificationSchedulerRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/dashboard typecheck",
      "pnpm vitest run apps/dashboard/tests/notification-scheduler-static.test.ts",
      "notification scheduler Postgres queue integration tests",
      "notification retry/backoff and dead-letter integration tests",
      "appointment reschedule/cancel scheduled-job cancellation integration tests",
      "idempotent due-job worker concurrency test",
      "provider dispatch worker integration tests",
    ]);
    expect(notificationSchedulerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "dashboard-typecheck",
      "static-contract",
      "queue-backend",
      "notification-job-persistence",
      "dead-letter-persistence",
      "worker-audit-persistence",
      "idempotency-key",
      "scheduler-process",
      "worker-process",
      "provider-dispatch",
      "due-job-concurrency",
      "retry-backoff",
      "cancellation",
      "postgres-queue",
      "ci-scheduler-job",
      "secret-safe-artifacts",
    ]);
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-runtime.json");
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-due-job-concurrency.json");
    expect(notificationSchedulerArtifactPaths).toContain("test-results/notification-scheduler-runtime");
  });

  it("keeps package helper, dashboard scheduler contract, API boundary, page surface, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildNotificationSchedulerRuntimeReadinessPlan");
    expect(notificationsSource).toContain("buildNotificationSchedulerPlan");
    expect(schedulerSource).toContain("executeNotificationSchedulerPlan");
    expect(schedulerSource).toContain("persistNotificationJobs");
    expect(schedulerSource).toContain("persistDeadLetter");
    expect(schedulerSource).toContain("persistWorkerAuditLog");
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain("buildDashboardSchedulerPlanFromAction");
    expect(pageSource).toContain("Queue scheduler contract");
    expect(staticTest).toContain("covers schedule, process, retry, cancel, and dead-letter actions");
  });

  it("keeps backend, persistence, worker, provider, concurrency, integration, CI, and artifact blockers explicit", () => {
    expect(notificationSchedulerRuntimeReadiness.status).toBe("blocked");
    expect(notificationSchedulerRuntimeReadiness.missingScripts).toEqual([]);
    expect(notificationSchedulerRuntimeReadiness.requiredCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "notification scheduler Postgres queue integration tests",
      "notification retry/backoff and dead-letter integration tests",
      "appointment reschedule/cancel scheduled-job cancellation integration tests",
      "idempotent due-job worker concurrency test",
    ]);
    expect(notificationSchedulerRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "queue backend and NotificationJob persistence evidence",
      "scheduler/worker process and transactional due-job claiming evidence",
      "retry, dead-letter, and worker audit persistence evidence",
      "queue, retry/dead-letter, and appointment cancellation integration test evidence",
    ]));
    expect(notificationSchedulerRuntimeReadiness.blockers).toContain("Notification queue backend must be configured before scheduler promotion.");
    expect(notificationSchedulerRuntimeReadiness.blockers).toContain("NotificationJob persistence must be available.");
    expect(notificationSchedulerRuntimeReadiness.blockers).toContain("Due-job claiming must be transactional to prevent duplicate sends.");
    expect(notificationSchedulerRuntimeReadiness.blockers).toContain("DeadLetterJob persistence must be available.");
  });

  it("classifies notification scheduler evidence before GAP-065 can close", () => {
    const blockedDecision = buildNotificationSchedulerEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      queueBackendVerified: false,
      notificationJobPersistenceVerified: false,
      deadLetterPersistenceVerified: false,
      workerAuditPersistenceVerified: false,
      idempotencyKeyVerified: false,
      schedulerProcessVerified: false,
      workerProcessVerified: false,
      providerDispatchVerified: false,
      dueJobConcurrencyVerified: false,
      retryBackoffVerified: false,
      cancellationVerified: false,
      postgresQueueVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/notification-scheduler-runtime.json",
        "coverage/notification-scheduler-notifications-typecheck.txt",
        "coverage/notification-scheduler-notifications-test.txt",
        "coverage/notification-scheduler-dashboard-typecheck.txt",
        "coverage/notification-scheduler-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Notification queue backend evidence is missing.");
    expect(blockedDecision.blockers).toContain("NotificationJob persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Provider dispatch worker evidence is missing.");
    expect(blockedDecision.blockers).toContain("Transactional due-job concurrency evidence is missing.");
    expect(blockedDecision.blockers).toContain("Postgres queue integration evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Secret-safe notification scheduler artifact review evidence is missing.",
    );
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-scheduler-queue-backend.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/notification-scheduler-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual([...notificationSchedulerRuntimeCommands]);
    expect(blockedDecision.requiredEvidence).toContain("provider dispatch worker integration evidence");
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 5,
      requiredArtifactCount: notificationSchedulerArtifactPaths.length,
    });

    const completeDecision = buildNotificationSchedulerEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      dashboardTypecheckPassed: true,
      staticContractTestsPassed: true,
      queueBackendVerified: true,
      notificationJobPersistenceVerified: true,
      deadLetterPersistenceVerified: true,
      workerAuditPersistenceVerified: true,
      idempotencyKeyVerified: true,
      schedulerProcessVerified: true,
      workerProcessVerified: true,
      providerDispatchVerified: true,
      dueJobConcurrencyVerified: true,
      retryBackoffVerified: true,
      cancellationVerified: true,
      postgresQueueVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: notificationSchedulerArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live queue execution", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification scheduler runtime contracts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-scheduler-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/notificationSchedulerRuntime.ts");
    expect(gapTracker).toContain("notification scheduler evidence classifier");
    expect(gapTracker).toContain("GAP-065 is notification-scheduler-runtime-matrix wired with evidence classifier");
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-secret-safe-artifacts.json");
  });

  it("pins current notification scheduler proof files for GAP-065", () => {
    expect(notificationSchedulerRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/dashboard/lib/notificationScheduler.ts",
      "apps/dashboard/lib/notificationSchedulerRuntime.ts",
      "apps/dashboard/app/api/notifications/scheduler/route.ts",
      "apps/dashboard/app/templates/page.tsx",
      "apps/dashboard/tests/notification-scheduler-static.test.ts",
      "apps/dashboard/tests/notification-scheduler-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of notificationSchedulerRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});
