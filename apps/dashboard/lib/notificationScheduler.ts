import {
  buildBookingNotificationSequence,
  buildFullAutomationSequence,
  buildNotificationSchedulerPlan,
  buildNotificationSchedulerRuntimeReadinessPlan,
  type NotificationSchedulerAction,
  type NotificationSchedulerPlan,
  type NotificationSchedulerRuntimeReadinessPlan,
  type NotificationSequenceStep,
} from "@inkroute/notifications";

export interface DashboardNotificationSchedulerRepository {
  claimIdempotencyKey(input: { tenantId: string; key: string; action: NotificationSchedulerAction }): Promise<"claimed" | "duplicate">;
  persistNotificationJobs(input: { tenantId: string; plan: NotificationSchedulerPlan }): Promise<void>;
  claimDueNotificationJob(input: { tenantId: string; jobId: string; now: string }): Promise<"claimed" | "missing" | "already_claimed">;
  persistNotificationDelivery(input: { tenantId: string; plan: NotificationSchedulerPlan }): Promise<void>;
  cancelScheduledJobs(input: { tenantId: string; appointmentId?: string; bookingRequestId?: string; reason: string }): Promise<number>;
  persistRetry(input: { tenantId: string; plan: NotificationSchedulerPlan }): Promise<void>;
  persistDeadLetter(input: { tenantId: string; plan: NotificationSchedulerPlan; reason: string }): Promise<void>;
  persistWorkerAuditLog(input: { tenantId: string; plan: NotificationSchedulerPlan; redactedMetadata: Record<string, unknown> }): Promise<void>;
}

export interface DashboardNotificationSchedulerContract {
  runtimeReadiness: NotificationSchedulerRuntimeReadinessPlan;
  schedulePlan: NotificationSchedulerPlan;
  processPlan: NotificationSchedulerPlan;
  retryPlan: NotificationSchedulerPlan;
  cancelPlan: NotificationSchedulerPlan;
  deadLetterPlan: NotificationSchedulerPlan;
  requiredRepositoryMethods: readonly (keyof DashboardNotificationSchedulerRepository)[];
}

const demoNow = "2026-06-09T17:00:00.000Z";
const demoAppointmentStartsAt = "2026-07-10T22:00:00.000Z";

function schedulableSequence(): NotificationSequenceStep[] {
  return buildFullAutomationSequence().filter((step) => step.status !== "blocked");
}

export function buildDashboardNotificationSchedulerContract(): DashboardNotificationSchedulerContract {
  const base = {
    tenantId: "tenant_demo",
    now: demoNow,
    queueStrategy: "database" as const,
    workerEnabled: true,
    idempotencyStoreAvailable: false,
    auditLogPersistenceAvailable: false,
  };

  return {
    runtimeReadiness: buildNotificationSchedulerRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      queueStrategySelected: true,
      queueBackendConfigured: false,
      schedulerProcessConfigured: true,
      workerProcessConfigured: true,
      notificationJobPersistenceAvailable: false,
      appointmentRelativeSchedulingImplemented: true,
      aftercareSequenceSchedulingImplemented: true,
      marketingSequenceSchedulingImplemented: true,
      cancellationOnAppointmentChangeImplemented: true,
      dueJobClaimingTransactional: false,
      providerReadyGateEnforced: true,
      idempotencyStoreAvailable: false,
      retryBackoffExecutorConfigured: true,
      deadLetterPersistenceAvailable: false,
      workerAuditLogPersistenceAvailable: false,
      clockSkewPolicyConfigured: true,
      postgresQueueIntegrationTestsPassed: false,
      retryDeadLetterIntegrationTestsPassed: false,
      cancellationIntegrationTestsPassed: false,
    }),
    schedulePlan: buildNotificationSchedulerPlan({
      ...base,
      action: "schedule_sequence",
      idempotencyKey: "schedule:booking:demo",
      bookingRequestId: "booking_req_demo",
      appointmentStartsAt: demoAppointmentStartsAt,
      sequenceSteps: schedulableSequence(),
    }),
    processPlan: buildNotificationSchedulerPlan({
      ...base,
      action: "process_due_job",
      idempotencyKey: "process:job_demo",
      jobId: "job_demo",
      providerReady: false,
    }),
    retryPlan: buildNotificationSchedulerPlan({
      ...base,
      action: "retry_failed_job",
      idempotencyKey: "retry:job_demo:2",
      jobId: "job_demo",
      attempt: 2,
      maxAttempts: 5,
    }),
    cancelPlan: buildNotificationSchedulerPlan({
      ...base,
      action: "cancel_scheduled_jobs",
      idempotencyKey: "cancel:appointment_demo",
      actorId: "user_mara_demo",
      appointmentId: "appointment_demo",
      cancellationReason: "appointment_rescheduled",
    }),
    deadLetterPlan: buildNotificationSchedulerPlan({
      ...base,
      action: "dead_letter_job",
      idempotencyKey: "dead-letter:job_demo",
      actorId: "worker_demo",
      jobId: "job_demo",
      attempt: 5,
      maxAttempts: 5,
      cancellationReason: "provider_exhausted_retries",
    }),
    requiredRepositoryMethods: [
      "claimIdempotencyKey",
      "persistNotificationJobs",
      "claimDueNotificationJob",
      "persistNotificationDelivery",
      "cancelScheduledJobs",
      "persistRetry",
      "persistDeadLetter",
      "persistWorkerAuditLog",
    ],
  };
}

export function buildDashboardSchedulerPlanFromAction(input: {
  tenantId: string;
  action: NotificationSchedulerAction;
  now: string;
  idempotencyKey: string;
  jobId?: string;
  actorId?: string;
  appointmentId?: string;
  bookingRequestId?: string;
  appointmentStartsAt?: string;
  providerReady?: boolean;
  cancellationReason?: string;
  attempt?: number;
  maxAttempts?: number;
}): NotificationSchedulerPlan {
  const sequenceSteps = input.action === "schedule_sequence" ? buildBookingNotificationSequence().filter((step) => step.status !== "blocked") : [];
  return buildNotificationSchedulerPlan({
    tenantId: input.tenantId,
    action: input.action,
    now: input.now,
    queueStrategy: "database",
    workerEnabled: true,
    idempotencyStoreAvailable: false,
    auditLogPersistenceAvailable: false,
    idempotencyKey: input.idempotencyKey,
    ...(input.jobId ? { jobId: input.jobId } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
    ...(input.bookingRequestId ? { bookingRequestId: input.bookingRequestId } : {}),
    ...(input.appointmentStartsAt ? { appointmentStartsAt: input.appointmentStartsAt } : {}),
    ...(typeof input.providerReady === "boolean" ? { providerReady: input.providerReady } : {}),
    ...(input.cancellationReason ? { cancellationReason: input.cancellationReason } : {}),
    ...(typeof input.attempt === "number" ? { attempt: input.attempt } : {}),
    ...(typeof input.maxAttempts === "number" ? { maxAttempts: input.maxAttempts } : {}),
    ...(sequenceSteps.length ? { sequenceSteps } : {}),
  });
}

export async function executeNotificationSchedulerPlan(
  repository: DashboardNotificationSchedulerRepository,
  plan: NotificationSchedulerPlan,
): Promise<{ status: "planned" | "duplicate" | "blocked"; plan: NotificationSchedulerPlan }> {
  if (plan.status === "blocked" || !plan.idempotencyKey) return { status: "blocked", plan };

  const idempotency = await repository.claimIdempotencyKey({ tenantId: plan.writes[0]?.tenantId ?? "missing_tenant", key: plan.idempotencyKey, action: plan.action });
  if (idempotency === "duplicate") return { status: "duplicate", plan };

  if (plan.action === "schedule_sequence") await repository.persistNotificationJobs({ tenantId: plan.writes[0].tenantId, plan });
  if (plan.action === "process_due_job") await repository.persistNotificationDelivery({ tenantId: plan.writes[0].tenantId, plan });
  if (plan.action === "retry_failed_job") await repository.persistRetry({ tenantId: plan.writes[0].tenantId, plan });
  if (plan.action === "dead_letter_job") await repository.persistDeadLetter({ tenantId: plan.writes[0].tenantId, plan, reason: String(plan.writes[0].payload.cancellationReason ?? "unknown") });
  if (plan.action === "cancel_scheduled_jobs") {
    await repository.cancelScheduledJobs({
      tenantId: plan.writes[0].tenantId,
      appointmentId: String(plan.writes[0].payload.appointmentId ?? "") || undefined,
      bookingRequestId: String(plan.writes[0].payload.bookingRequestId ?? "") || undefined,
      reason: String(plan.writes[0].payload.cancellationReason ?? "scheduler_cancellation"),
    });
  }
  await repository.persistWorkerAuditLog({ tenantId: plan.writes[0].tenantId, plan, redactedMetadata: { action: plan.action, scheduledJobCount: plan.scheduledJobs.length } });
  return { status: "planned", plan };
}

export const dashboardNotificationSchedulerContract = buildDashboardNotificationSchedulerContract();
