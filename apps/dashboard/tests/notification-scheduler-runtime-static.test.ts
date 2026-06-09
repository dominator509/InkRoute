import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  notificationSchedulerArtifactPaths,
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

  it("wires CI, manifest, tracker, and artifacts without claiming live queue execution", () => {
    expect(ciWorkflow).toContain("Run Phase 9 notification scheduler runtime contracts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-static.test.ts");
    expect(ciWorkflow).toContain("notification-scheduler-runtime-artifacts");
    expect(unitManifest).toContain("unit-notification-scheduler-runtime-static");
    expect(gapTracker).toContain("apps/dashboard/lib/notificationSchedulerRuntime.ts");
    expect(gapTracker).toContain("GAP-065 is notification-scheduler-runtime-matrix wired");
    expect(notificationSchedulerArtifactPaths).toContain("coverage/notification-scheduler-secret-safe-artifacts.json");
  });
});
