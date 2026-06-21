import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedNotificationSchedulerMetadata,
  createInMemoryNotificationSchedulerRepository,
  dashboardNotificationSchedulerContract,
  executeNotificationSchedulerPlan,
} from "../lib/notificationScheduler";

const schedulerSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/notificationScheduler.ts"), "utf8");
const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/notifications/scheduler/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/templates/page.tsx"), "utf8");
const actionPanelSource = readFileSync(
  join(process.cwd(), "apps/dashboard/components/NotificationSchedulerActionPanel.tsx"),
  "utf8",
);

describe("dashboard notification scheduler contract", () => {
  it("uses package scheduler plans and runtime readiness gates", () => {
    expect(schedulerSource).toContain("buildNotificationSchedulerPlan");
    expect(schedulerSource).toContain("buildNotificationSchedulerRuntimeReadinessPlan");
    expect(schedulerSource).toContain("buildFullAutomationSequence");
    expect(schedulerSource).toContain("dashboardNotificationSchedulerContract");
  });

  it("covers schedule, process, retry, cancel, and dead-letter actions", () => {
    expect(schedulerSource).toContain('action: "schedule_sequence"');
    expect(schedulerSource).toContain('action: "process_due_job"');
    expect(schedulerSource).toContain('action: "retry_failed_job"');
    expect(schedulerSource).toContain('action: "cancel_scheduled_jobs"');
    expect(schedulerSource).toContain('action: "dead_letter_job"');
    expect(schedulerSource).toContain("retryDelaySeconds");
    expect(schedulerSource).toContain("providerReady: false");
  });

  it("defines repository seams for durable queue worker execution", () => {
    expect(schedulerSource).toContain("DashboardNotificationSchedulerRepository");
    expect(schedulerSource).toContain("claimIdempotencyKey");
    expect(schedulerSource).toContain("persistNotificationJobs");
    expect(schedulerSource).toContain("claimDueNotificationJob");
    expect(schedulerSource).toContain("persistNotificationDelivery");
    expect(schedulerSource).toContain("cancelScheduledJobs");
    expect(schedulerSource).toContain("persistDeadLetter");
    expect(schedulerSource).toContain("persistWorkerAuditLog");
  });

  it("redacts nested notification scheduler worker metadata", () => {
    const metadata = buildRedactedNotificationSchedulerMetadata({
      action: "process_due_job",
      destination: "client@example.test",
      nested: {
        providerPayload: { phone: "+12065550142", body: "private reminder" },
      },
    });

    expect(metadata).toEqual({
      action: "process_due_job",
      destination: "[redacted]",
      nested: {
        providerPayload: "[redacted]",
      },
    });
    expect(JSON.stringify(metadata)).not.toContain("client@example.test");
    expect(JSON.stringify(metadata)).not.toContain("+12065550142");
    expect(JSON.stringify(metadata)).not.toContain("private reminder");
  });

  it("executes a local notification scheduler repository contract for schedule, process, retry, cancel, dead-letter, idempotency, and audit capture", async () => {
    const repository = createInMemoryNotificationSchedulerRepository();

    const scheduled = await executeNotificationSchedulerPlan(repository, dashboardNotificationSchedulerContract.schedulePlan);
    const duplicate = await executeNotificationSchedulerPlan(repository, dashboardNotificationSchedulerContract.schedulePlan);
    const claimed = await repository.claimDueNotificationJob({
      tenantId: "tenant_demo",
      jobId: "job_demo",
      now: "2026-06-09T17:01:00.000Z",
    });
    const alreadyClaimed = await repository.claimDueNotificationJob({
      tenantId: "tenant_demo",
      jobId: "job_demo",
      now: "2026-06-09T17:02:00.000Z",
    });

    await executeNotificationSchedulerPlan(repository, dashboardNotificationSchedulerContract.retryPlan);
    await executeNotificationSchedulerPlan(repository, dashboardNotificationSchedulerContract.cancelPlan);
    await executeNotificationSchedulerPlan(repository, dashboardNotificationSchedulerContract.deadLetterPlan);

    expect(scheduled.status).toBe("planned");
    expect(duplicate.status).toBe("duplicate");
    expect(claimed).toBe("claimed");
    expect(alreadyClaimed).toBe("already_claimed");
    expect(repository.state.notificationJobs).toHaveLength(1);
    expect(repository.state.dueJobClaims.size).toBe(1);
    expect(repository.state.retries).toHaveLength(1);
    expect(repository.state.cancellations).toHaveLength(1);
    expect(repository.state.deadLetters).toHaveLength(1);
    expect(repository.state.workerAuditLogs.length).toBeGreaterThanOrEqual(3);
  });

  it("wires a scheduler API boundary with RBAC, tenant guard, no-store, and action parsing", () => {
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function POST");
    expect(routeSource).toContain('assertPermission(actor, "message:read")');
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain("buildDashboardSchedulerPlanFromAction");
    expect(routeSource).toContain("local queue/worker contract");
    expect(routeSource).not.toContain("Scheduler API exposes queue/worker plans only");
    expect(routeSource).toContain("NOTIFICATION_SCHEDULER_PERSISTENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("schedulerLocalContractFallbackDisabled");
    expect(routeSource).toContain("Scheduler POST returns the local transaction/write contract");
    expect(routeSource).not.toContain("schedulerPlanOnlyWritesDisabled");
    expect(routeSource).not.toContain("plan-only responses are disabled");
    expect(routeSource).toContain("requiresQueueWorkerExecution");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).not.toContain('}, { status: 400 });');
    expect(routeSource).not.toContain('}, { status: 403 });');
  });

  it("surfaces scheduler state on the dashboard templates page", () => {
    expect(pageSource).toContain("dashboardNotificationSchedulerContract");
    expect(pageSource).toContain("Queue scheduler contract");
    expect(pageSource).toContain("Scheduler readiness gates");
    expect(pageSource).toContain("NotificationJob");
    expect(pageSource).toContain("NotificationSchedulerActionPanel");
  });

  it("wires a gated dashboard scheduler action panel without live provider sends", () => {
    expect(actionPanelSource).toContain('fetch("/api/notifications/scheduler"');
    expect(actionPanelSource).toContain('action: "schedule_sequence"');
    expect(actionPanelSource).toContain("Queue automation plan");
    expect(actionPanelSource).toContain("provider sends, queue persistence, retries, dead letters, and delivery reconciliation remain gated");
    expect(actionPanelSource).toContain("wired through the local queue contract");
    expect(actionPanelSource).toContain("live provider sends, durable workers, suppression mutations, and delivery reconciliation evidence-gated");
    expect(actionPanelSource).not.toContain("plan-only");
  });
});
