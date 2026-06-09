import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const schedulerSource = readFileSync(join(process.cwd(), "apps/dashboard/lib/notificationScheduler.ts"), "utf8");
const routeSource = readFileSync(join(process.cwd(), "apps/dashboard/app/api/notifications/scheduler/route.ts"), "utf8");
const pageSource = readFileSync(join(process.cwd(), "apps/dashboard/app/templates/page.tsx"), "utf8");

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

  it("wires a scheduler API boundary with RBAC, tenant guard, no-store, and action parsing", () => {
    expect(routeSource).toContain("export async function GET");
    expect(routeSource).toContain("export async function POST");
    expect(routeSource).toContain('assertPermission(actor, "message:read")');
    expect(routeSource).toContain('assertPermission(actor, "message:write")');
    expect(routeSource).toContain('code: "TENANT_MISMATCH"');
    expect(routeSource).toContain("buildDashboardSchedulerPlanFromAction");
    expect(routeSource).toContain('"Cache-Control": "no-store"');
  });

  it("surfaces scheduler state on the dashboard templates page", () => {
    expect(pageSource).toContain("dashboardNotificationSchedulerContract");
    expect(pageSource).toContain("Queue scheduler contract");
    expect(pageSource).toContain("Scheduler readiness gates");
    expect(pageSource).toContain("NotificationJob");
  });
});
