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

export interface InMemoryNotificationSchedulerRepositoryState {
  readonly idempotencyKeys: Map<string, { readonly tenantId: string; readonly action: NotificationSchedulerAction }>;
  readonly notificationJobs: { readonly tenantId: string; readonly plan: NotificationSchedulerPlan }[];
  readonly dueJobClaims: Map<string, { readonly tenantId: string; readonly claimedAt: string }>;
  readonly deliveries: { readonly tenantId: string; readonly plan: NotificationSchedulerPlan }[];
  readonly cancellations: { readonly tenantId: string; readonly appointmentId?: string; readonly bookingRequestId?: string; readonly reason: string }[];
  readonly retries: { readonly tenantId: string; readonly plan: NotificationSchedulerPlan }[];
  readonly deadLetters: { readonly tenantId: string; readonly plan: NotificationSchedulerPlan; readonly reason: string }[];
  readonly workerAuditLogs: { readonly tenantId: string; readonly plan: NotificationSchedulerPlan; readonly redactedMetadata: Record<string, unknown> }[];
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

const notificationSchedulerPrivateMetadataKeys = new Set([
  "body",
  "rawBody",
  "destination",
  "email",
  "phone",
  "providerPayload",
  "providerSecret",
  "clientName",
]);

function redactNotificationSchedulerMetadataValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactNotificationSchedulerMetadataValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        notificationSchedulerPrivateMetadataKeys.has(key)
          ? "[redacted]"
          : redactNotificationSchedulerMetadataValue(entry),
      ]),
    );
  }

  return value;
}

export function buildRedactedNotificationSchedulerMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return redactNotificationSchedulerMetadataValue(metadata) as Record<string, unknown>;
}

function buildSchedulerIdempotencyKey(input: { readonly tenantId: string; readonly key: string }): string {
  return `${input.tenantId}:${input.key}`;
}

function buildDueJobClaimKey(input: { readonly tenantId: string; readonly jobId: string }): string {
  return `${input.tenantId}:${input.jobId}`;
}

export function createInMemoryNotificationSchedulerRepository(
  state: InMemoryNotificationSchedulerRepositoryState = {
    idempotencyKeys: new Map(),
    notificationJobs: [],
    dueJobClaims: new Map(),
    deliveries: [],
    cancellations: [],
    retries: [],
    deadLetters: [],
    workerAuditLogs: [],
  },
): DashboardNotificationSchedulerRepository & { readonly state: InMemoryNotificationSchedulerRepositoryState } {
  return {
    state,
    async claimIdempotencyKey(input) {
      const key = buildSchedulerIdempotencyKey(input);
      const existing = state.idempotencyKeys.get(key);

      if (!existing) {
        state.idempotencyKeys.set(key, { tenantId: input.tenantId, action: input.action });
        return "claimed";
      }

      if (existing.action === input.action) {
        return "duplicate";
      }

      throw new Error("NOTIFICATION_SCHEDULER_IDEMPOTENCY_KEY_CONFLICT");
    },
    async persistNotificationJobs(input) {
      state.notificationJobs.push(input);
    },
    async claimDueNotificationJob(input) {
      const key = buildDueJobClaimKey(input);
      if (state.dueJobClaims.has(key)) {
        return "already_claimed";
      }
      state.dueJobClaims.set(key, { tenantId: input.tenantId, claimedAt: input.now });
      return "claimed";
    },
    async persistNotificationDelivery(input) {
      state.deliveries.push(input);
    },
    async cancelScheduledJobs(input) {
      state.cancellations.push(input);
      return state.notificationJobs.filter((job) => {
        const write = job.plan.writes[0];
        return write?.tenantId === input.tenantId &&
          (!input.appointmentId || write.payload.appointmentId === input.appointmentId) &&
          (!input.bookingRequestId || write.payload.bookingRequestId === input.bookingRequestId);
      }).length;
    },
    async persistRetry(input) {
      state.retries.push(input);
    },
    async persistDeadLetter(input) {
      state.deadLetters.push(input);
    },
    async persistWorkerAuditLog(input) {
      state.workerAuditLogs.push({
        ...input,
        redactedMetadata: buildRedactedNotificationSchedulerMetadata(input.redactedMetadata),
      });
    },
  };
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
