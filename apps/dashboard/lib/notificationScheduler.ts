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

export interface PrismaNotificationSchedulerWorkerRepositoryClient {
  idempotencyKey: {
    findUnique(input: {
      where: { tenantId_scope_key: { tenantId: string; scope: string; key: string } };
    }): Promise<{ id: string; status: string; metadata: unknown; result?: unknown } | null>;
    create(input: { data: Record<string, unknown> }): Promise<{ id: string; status: string }>;
    update(input: {
      where: { tenantId_scope_key: { tenantId: string; scope: string; key: string } };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
  notificationJob: {
    createMany(input: { data: readonly Record<string, unknown>[]; skipDuplicates?: boolean }): Promise<unknown>;
    findFirst(input: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<Record<string, unknown> | null>;
    updateMany(input: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  };
  notificationDelivery: {
    updateMany(input: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  };
  notificationDeliveryStatusTransition: {
    create(input: { data: Record<string, unknown> }): Promise<unknown>;
  };
  notificationProviderHandoff: {
    updateMany(input: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  };
  deadLetterJob: {
    create(input: { data: Record<string, unknown> }): Promise<unknown>;
  };
  notificationWorkerAuditLog: {
    create(input: { data: Record<string, unknown> }): Promise<unknown>;
  };
  auditLog: {
    create(input: { data: Record<string, unknown> }): Promise<unknown>;
  };
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

const notificationSchedulerWorkerIdempotencyScope = "notification.scheduler.worker";

function getPlanTenantId(plan: NotificationSchedulerPlan): string {
  const tenantId = plan.writes[0]?.tenantId;
  if (!tenantId) throw new Error("NOTIFICATION_SCHEDULER_TENANT_REQUIRED");
  return tenantId;
}

function getPlanPayload(plan: NotificationSchedulerPlan): Record<string, unknown> {
  return (plan.writes.find((write) => write.model === "NotificationJob")?.payload ?? plan.writes[0]?.payload ?? {}) as Record<
    string,
    unknown
  >;
}

function getPlanStringPayload(plan: NotificationSchedulerPlan, key: string): string | undefined {
  const value = getPlanPayload(plan)[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getPlanNumberPayload(plan: NotificationSchedulerPlan, key: string): number | undefined {
  const value = getPlanPayload(plan)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getPlanDate(value: string | undefined, fallback: string): Date {
  return new Date(value ?? fallback);
}

export function createPrismaNotificationSchedulerWorkerRepository(
  client: PrismaNotificationSchedulerWorkerRepositoryClient,
): DashboardNotificationSchedulerRepository {
  return {
    async claimIdempotencyKey(input) {
      const existing = await client.idempotencyKey.findUnique({
        where: {
          tenantId_scope_key: {
            tenantId: input.tenantId,
            scope: notificationSchedulerWorkerIdempotencyScope,
            key: input.key,
          },
        },
      });

      if (existing) {
        const metadata = existing.metadata as { action?: unknown } | null;
        if (metadata?.action === input.action) return "duplicate";
        throw new Error("NOTIFICATION_SCHEDULER_IDEMPOTENCY_KEY_CONFLICT");
      }

      await client.idempotencyKey.create({
        data: {
          tenantId: input.tenantId,
          scope: notificationSchedulerWorkerIdempotencyScope,
          key: input.key,
          status: "claimed",
          metadata: { action: input.action },
        },
      });
      return "claimed";
    },
    async persistNotificationJobs(input) {
      const tenantId = getPlanTenantId(input.plan);
      const payload = getPlanPayload(input.plan);
      const now = new Date();
      const idempotencyKey = input.plan.idempotencyKey ?? `${input.plan.action}:${tenantId}`;
      const jobs = input.plan.scheduledJobs.length > 0
        ? input.plan.scheduledJobs
        : [
            {
              templateKey: "manual_scheduler_job",
              scheduledAt: now.toISOString(),
              scheduledOffsetMinutes: 0,
              recommendedChannels: ["in_app"] as const,
            },
          ];

      await client.notificationJob.createMany({
        skipDuplicates: true,
        data: jobs.map((job, index) => ({
          tenantId,
          notificationId: getPlanStringPayload(input.plan, "notificationId"),
          deliveryId: getPlanStringPayload(input.plan, "deliveryId"),
          providerHandoffId: getPlanStringPayload(input.plan, "providerHandoffId"),
          sourceAction: input.plan.action,
          templateKey: job.templateKey,
          channel: job.recommendedChannels[0] ?? "in_app",
          state: "queued",
          idempotencyKey: `${idempotencyKey}:${index}`,
          appointmentId: getPlanStringPayload(input.plan, "appointmentId"),
          bookingRequestId: getPlanStringPayload(input.plan, "bookingRequestId"),
          actorUserId: getPlanStringPayload(input.plan, "actorId"),
          attempts: 0,
          maxAttempts: getPlanNumberPayload(input.plan, "maxAttempts") ?? 5,
          scheduledAt: getPlanDate(job.scheduledAt, now.toISOString()),
          availableAt: getPlanDate(job.scheduledAt, now.toISOString()),
          payload: buildRedactedNotificationSchedulerMetadata({
            action: input.plan.action,
            appointmentId: payload.appointmentId ?? null,
            bookingRequestId: payload.bookingRequestId ?? null,
            templateKey: job.templateKey,
            scheduledOffsetMinutes: job.scheduledOffsetMinutes,
            recommendedChannels: job.recommendedChannels,
          }),
        })),
      });
    },
    async claimDueNotificationJob(input) {
      const now = new Date(input.now);
      const existing = await client.notificationJob.findFirst({
        where: { id: input.jobId, tenantId: input.tenantId },
        select: { id: true, lockedAt: true, state: true },
      });
      if (!existing) return "missing";
      if (existing.lockedAt) return "already_claimed";

      const result = await client.notificationJob.updateMany({
        where: {
          id: input.jobId,
          tenantId: input.tenantId,
          state: { in: ["queued", "retry_scheduled"] },
          availableAt: { lte: now },
          lockedAt: null,
        },
        data: { state: "processing", lockedAt: now },
      });
      return result.count === 1 ? "claimed" : "already_claimed";
    },
    async persistNotificationDelivery(input) {
      const tenantId = getPlanTenantId(input.plan);
      const deliveryId = getPlanStringPayload(input.plan, "deliveryId");
      const jobId = getPlanStringPayload(input.plan, "jobId");
      const providerHandoffId = getPlanStringPayload(input.plan, "providerHandoffId");
      const now = new Date();

      if (jobId) {
        await client.notificationJob.updateMany({
          where: { id: jobId, tenantId },
          data: { state: "processed", processedAt: now },
        });
      }
      if (deliveryId) {
        await client.notificationDelivery.updateMany({
          where: { id: deliveryId, tenantId },
          data: { status: "sent", attemptedAt: now },
        });
        await client.notificationDeliveryStatusTransition.create({
          data: {
            tenantId,
            deliveryId,
            toStatus: "sent",
            actorUserId: getPlanStringPayload(input.plan, "actorId"),
            reason: "notification_scheduler_worker_processed",
            metadata: buildRedactedNotificationSchedulerMetadata({ action: input.plan.action, jobId, providerHandoffId }),
          },
        });
      }
      if (providerHandoffId) {
        await client.notificationProviderHandoff.updateMany({
          where: { id: providerHandoffId, tenantId },
          data: { state: "processed", processedAt: now },
        });
      }
    },
    async cancelScheduledJobs(input) {
      const result = await client.notificationJob.updateMany({
        where: {
          tenantId: input.tenantId,
          state: { in: ["queued", "retry_scheduled"] },
          ...(input.appointmentId ? { appointmentId: input.appointmentId } : {}),
          ...(input.bookingRequestId ? { bookingRequestId: input.bookingRequestId } : {}),
        },
        data: {
          state: "cancelled",
          cancelledAt: new Date(),
          payload: buildRedactedNotificationSchedulerMetadata({ cancellationReason: input.reason }),
        },
      });
      return result.count;
    },
    async persistRetry(input) {
      const tenantId = getPlanTenantId(input.plan);
      const jobId = getPlanStringPayload(input.plan, "jobId");
      const retryDelaySeconds = input.plan.retryDelaySeconds ?? 60;
      const nextAttemptAt = new Date(Date.now() + retryDelaySeconds * 1000);
      if (jobId) {
        await client.notificationJob.updateMany({
          where: { id: jobId, tenantId },
          data: {
            state: "retry_scheduled",
            attempts: getPlanNumberPayload(input.plan, "attempt") ?? 1,
            lockedAt: null,
            availableAt: nextAttemptAt,
          },
        });
      }
    },
    async persistDeadLetter(input) {
      const tenantId = getPlanTenantId(input.plan);
      const jobId = getPlanStringPayload(input.plan, "jobId");
      const deliveryId = getPlanStringPayload(input.plan, "deliveryId");
      const providerHandoffId = getPlanStringPayload(input.plan, "providerHandoffId");
      const payload = buildRedactedNotificationSchedulerMetadata({
        action: input.plan.action,
        reason: input.reason,
        jobId,
        deliveryId,
        providerHandoffId,
      });

      await client.deadLetterJob.create({
        data: {
          tenantId,
          notificationJobId: jobId,
          deliveryId,
          providerHandoffId,
          reason: input.reason,
          attempts: getPlanNumberPayload(input.plan, "attempt") ?? 0,
          payload,
        },
      });
      if (jobId) {
        await client.notificationJob.updateMany({
          where: { id: jobId, tenantId },
          data: { state: "dead_lettered", processedAt: new Date() },
        });
      }
      if (providerHandoffId) {
        await client.notificationProviderHandoff.updateMany({
          where: { id: providerHandoffId, tenantId },
          data: { state: "dead_lettered", processedAt: new Date() },
        });
      }
    },
    async persistWorkerAuditLog(input) {
      const tenantId = getPlanTenantId(input.plan);
      const metadata = buildRedactedNotificationSchedulerMetadata(input.redactedMetadata);
      const jobId = getPlanStringPayload(input.plan, "jobId");
      const deliveryId = getPlanStringPayload(input.plan, "deliveryId");
      const providerHandoffId = getPlanStringPayload(input.plan, "providerHandoffId");

      await client.notificationWorkerAuditLog.create({
        data: {
          tenantId,
          notificationJobId: jobId,
          deliveryId,
          providerHandoffId,
          action: input.plan.action,
          actorUserId: getPlanStringPayload(input.plan, "actorId"),
          metadata,
        },
      });
      await client.auditLog.create({
        data: {
          tenantId,
          actorUserId: getPlanStringPayload(input.plan, "actorId"),
          action: `notification.scheduler.worker.${input.plan.action}`,
          entityType: "NotificationJob",
          entityId: jobId ?? input.plan.idempotencyKey ?? null,
          metadata,
        },
      });
      if (input.plan.idempotencyKey) {
        await client.idempotencyKey.update({
          where: {
            tenantId_scope_key: {
              tenantId,
              scope: notificationSchedulerWorkerIdempotencyScope,
              key: input.plan.idempotencyKey,
            },
          },
          data: {
            status: "completed",
            result: { action: input.plan.action, notificationJobId: jobId ?? null },
            metadata,
          },
        });
      }
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
    idempotencyStoreAvailable: true,
    auditLogPersistenceAvailable: true,
  };

  return {
    runtimeReadiness: buildNotificationSchedulerRuntimeReadinessPlan({
      packageScripts: ["test", "typecheck"],
      notificationTestsPassed: false,
      notificationTypecheckPassed: false,
      queueStrategySelected: true,
      queueBackendConfigured: true,
      schedulerProcessConfigured: true,
      workerProcessConfigured: true,
      notificationJobPersistenceAvailable: true,
      appointmentRelativeSchedulingImplemented: true,
      aftercareSequenceSchedulingImplemented: true,
      marketingSequenceSchedulingImplemented: true,
      cancellationOnAppointmentChangeImplemented: true,
      dueJobClaimingTransactional: true,
      providerReadyGateEnforced: true,
      idempotencyStoreAvailable: true,
      retryBackoffExecutorConfigured: true,
      deadLetterPersistenceAvailable: true,
      workerAuditLogPersistenceAvailable: true,
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
  idempotencyStoreAvailable?: boolean;
  auditLogPersistenceAvailable?: boolean;
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
    idempotencyStoreAvailable: input.idempotencyStoreAvailable ?? false,
    auditLogPersistenceAvailable: input.auditLogPersistenceAvailable ?? false,
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
