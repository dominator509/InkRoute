import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@inkroute/db";
import { assertPermission, isDatabaseUnavailable, resolveDashboardActor } from "../../dashboardAuth";
import { buildDashboardSchedulerPlanFromAction, dashboardNotificationSchedulerContract } from "../../../../lib/notificationScheduler";
import type { NotificationSchedulerAction, NotificationSchedulerPlan } from "@inkroute/notifications";

export const runtime = "nodejs";

const schedulerActions: readonly NotificationSchedulerAction[] = ["schedule_sequence", "cancel_scheduled_jobs", "process_due_job", "retry_failed_job", "dead_letter_job"];

function parseAction(value: unknown): NotificationSchedulerAction {
  return typeof value === "string" && schedulerActions.includes(value as NotificationSchedulerAction) ? (value as NotificationSchedulerAction) : "schedule_sequence";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

function buildNotificationSchedulerResponseProjection() {
  return {
    tenantIdEchoed: false,
    internalPersistenceIdsEchoed: false,
  };
}

function hashSchedulerSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function idempotencyStorageFingerprint(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function resultNumber(value: unknown, key: string): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  return typeof result[key] === "number" ? result[key] : null;
}

function resultBoolean(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (value as Record<string, unknown>)[key] === true;
}

function providerForChannel(channel: string): string {
  if (channel === "email") return "resend";
  if (channel === "sms") return "twilio";
  if (channel === "push") return "expo";
  return "in_app";
}

function buildSafeNotificationSchedulerPlanResponse(plan: NotificationSchedulerPlan) {
  return {
    status: plan.status,
    action: plan.action,
    queueStrategy: plan.queueStrategy,
    requiresTransaction: plan.requiresTransaction,
    scheduledJobCount: plan.scheduledJobs.length,
    retryDelaySeconds: plan.retryDelaySeconds,
    writeModels: plan.writes.map((write) => write.model),
    requiredControls: plan.requiredControls,
    blockers: plan.blockers,
    idempotencyKeyPresent: Boolean(plan.idempotencyKey),
    rawIdempotencyKeyEchoed: false,
    rawScheduledJobsEchoed: false,
    rawWritePayloadsEchoed: false,
    rawJobIdEchoed: false,
    rawAppointmentIdEchoed: false,
    rawBookingRequestIdEchoed: false,
    rawActorIdEchoed: false,
    rawCancellationReasonEchoed: false,
    ...buildNotificationSchedulerResponseProjection(),
  };
}

function buildSafeNotificationSchedulerContractResponse() {
  return {
    runtimeReadiness: dashboardNotificationSchedulerContract.runtimeReadiness,
    requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
    plans: {
      schedulePlan: buildSafeNotificationSchedulerPlanResponse(dashboardNotificationSchedulerContract.schedulePlan),
      processPlan: buildSafeNotificationSchedulerPlanResponse(dashboardNotificationSchedulerContract.processPlan),
      retryPlan: buildSafeNotificationSchedulerPlanResponse(dashboardNotificationSchedulerContract.retryPlan),
      cancelPlan: buildSafeNotificationSchedulerPlanResponse(dashboardNotificationSchedulerContract.cancelPlan),
      deadLetterPlan: buildSafeNotificationSchedulerPlanResponse(dashboardNotificationSchedulerContract.deadLetterPlan),
    },
    rawContractPlansEchoed: false,
    rawScheduledJobsEchoed: false,
    rawWritePayloadsEchoed: false,
    rawJobIdEchoed: false,
    rawAppointmentIdEchoed: false,
    rawBookingRequestIdEchoed: false,
    rawActorIdEchoed: false,
    rawCancellationReasonEchoed: false,
    rawIdempotencyKeyEchoed: false,
    ...buildNotificationSchedulerResponseProjection(),
  };
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read notification scheduler status." } }, { status: 403, headers: noStoreHeaders });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot inspect scheduler plans for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  return NextResponse.json(
    {
      ok: true,
      source: actor.source,
      ...buildNotificationSchedulerResponseProjection(),
      contract: buildSafeNotificationSchedulerContractResponse(),
      gapIds: ["GAP-065", "GAP-066"],
      boundary: "Scheduler API exposes the local queue/worker contract and action plans; persisted NotificationJob, DeadLetterJob, NotificationWorkerAuditLog, and IdempotencyKey repositories are still required for live execution.",
    },
    { headers: noStoreHeaders },
  );
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to plan notification scheduler writes." } }, { status: 403, headers: noStoreHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_SCHEDULER_JSON", message: "Scheduler request body must be valid JSON." } }, { status: 400, headers: noStoreHeaders });
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot plan scheduler writes for another tenant." } }, { status: 403, headers: noStoreHeaders });
  }

  const action = parseAction(body.action);
  const now = typeof body.now === "string" ? body.now : new Date().toISOString();
  const dbBackedActor = actor.source !== "local-fallback";
  const requestedIdempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : `scheduler:${tenantId}:${action}`;
  const plan = buildDashboardSchedulerPlanFromAction({
    tenantId,
    action,
    now,
    idempotencyKey: requestedIdempotencyKey,
    idempotencyStoreAvailable: dbBackedActor,
    auditLogPersistenceAvailable: dbBackedActor,
    ...(typeof body.jobId === "string" ? { jobId: body.jobId } : {}),
    actorId: actor.actorUserId,
    ...(typeof body.appointmentId === "string" ? { appointmentId: body.appointmentId } : {}),
    ...(typeof body.bookingRequestId === "string" ? { bookingRequestId: body.bookingRequestId } : {}),
    ...(typeof body.appointmentStartsAt === "string" ? { appointmentStartsAt: body.appointmentStartsAt } : {}),
    ...(typeof body.providerReady === "boolean" ? { providerReady: body.providerReady } : {}),
    ...(typeof body.cancellationReason === "string" ? { cancellationReason: body.cancellationReason } : {}),
    ...(typeof body.attempt === "number" ? { attempt: body.attempt } : {}),
    ...(typeof body.maxAttempts === "number" ? { maxAttempts: body.maxAttempts } : {}),
  });

  if (actor.source === "local-fallback" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        source: actor.source,
        ...buildNotificationSchedulerResponseProjection(),
        error: {
          code: "NOTIFICATION_SCHEDULER_PERSISTENCE_NOT_CONFIGURED",
          message:
            "Production notification scheduler writes require durable NotificationJob, DeadLetterJob, NotificationWorkerAuditLog, IdempotencyKey, queue backend, and worker execution persistence; local-contract fallback responses are disabled.",
          gapIds: ["GAP-065", "GAP-066"],
        },
        plan: buildSafeNotificationSchedulerPlanResponse(plan),
        requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
        productionBoundary: {
          schedulerLocalContractFallbackDisabled: true,
          requiresNotificationJobPersistence: true,
          requiresQueueWorkerExecution: true,
          requiresIdempotencyPersistence: true,
          gapIds: ["GAP-065", "GAP-066"],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (dbBackedActor && action === "schedule_sequence") {
    if (plan.status === "blocked" || !plan.idempotencyKey) {
      return NextResponse.json(
        {
          ok: false,
          source: actor.source,
          ...buildNotificationSchedulerResponseProjection(),
          error: { code: "NOTIFICATION_SCHEDULER_PLAN_BLOCKED", message: "Scheduler sequence is not safe to persist." },
          plan: buildSafeNotificationSchedulerPlanResponse(plan),
          requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
          gapIds: ["GAP-065", "GAP-066"],
        },
        { status: 409, headers: noStoreHeaders },
      );
    }

    const requestHash = hashSchedulerSubject(
      JSON.stringify({
        tenantId,
        action,
        now,
        appointmentId: typeof body.appointmentId === "string" ? body.appointmentId : null,
        bookingRequestId: typeof body.bookingRequestId === "string" ? body.bookingRequestId : null,
        appointmentStartsAt: typeof body.appointmentStartsAt === "string" ? body.appointmentStartsAt : null,
        scheduledJobs: plan.scheduledJobs,
      }),
    );

    try {
      const result = await prisma.$transaction(async (tx) => {
        const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : null;
        const bookingRequestId = typeof body.bookingRequestId === "string" ? body.bookingRequestId : null;

        if (appointmentId) {
          const appointment = await tx.appointment.findFirst({
            where: { id: appointmentId, tenantId },
            select: { id: true },
          });
          if (!appointment) return { status: "related_not_found" as const, relation: "appointment" as const };
        }

        if (bookingRequestId) {
          const bookingRequest = await tx.bookingRequest.findFirst({
            where: { id: bookingRequestId, tenantId },
            select: { id: true },
          });
          if (!bookingRequest) return { status: "related_not_found" as const, relation: "bookingRequest" as const };
        }

        const idempotency = await tx.idempotencyKey.upsert({
          where: { tenantId_scope_key: { tenantId, scope: "notification.scheduler", key: plan.idempotencyKey ?? requestedIdempotencyKey } },
          create: {
            tenantId,
            scope: "notification.scheduler",
            key: plan.idempotencyKey ?? requestedIdempotencyKey,
            status: "pending",
            requestHash,
            metadata: {
              source: "dashboard-notification-scheduler-route",
              action,
              scheduledJobCount: plan.scheduledJobs.length,
              providerDispatchEnabled: false,
              workerExecutionEnabled: false,
            },
          },
          update: {},
          select: { id: true, status: true, requestHash: true, result: true },
        });

        if (idempotency.requestHash !== requestHash) {
          return { status: "idempotency_conflict" as const, idempotency };
        }

        if (idempotency.status === "completed") {
          return {
            status: "replayed" as const,
            idempotency,
            notificationCount: resultNumber(idempotency.result, "notificationCount") ?? 0,
            deliveryCount: resultNumber(idempotency.result, "deliveryCount") ?? 0,
            handoffCount: resultNumber(idempotency.result, "handoffCount") ?? 0,
            auditLogged: resultBoolean(idempotency.result, "auditLogged"),
            providerDispatchEnabled: resultBoolean(idempotency.result, "providerDispatchEnabled"),
            workerExecutionEnabled: resultBoolean(idempotency.result, "workerExecutionEnabled"),
          };
        }

        let notificationCount = 0;
        let deliveryCount = 0;
        let handoffCount = 0;

        for (const [index, job] of plan.scheduledJobs.entries()) {
          const notification = await tx.notification.create({
            data: {
              tenantId,
              bookingRequestId,
              appointmentId,
              type: job.templateKey,
              title: `Scheduled ${job.templateKey}`,
              body: "Notification content is rendered by the provider worker; scheduler stores redacted job metadata only.",
              status: "queued",
              scheduledFor: new Date(job.scheduledAt),
            },
            select: { id: true },
          });
          notificationCount += 1;

          for (const channel of job.recommendedChannels) {
            const provider = providerForChannel(channel);
            const destinationHash = hashSchedulerSubject(`${tenantId}:${channel}:${job.templateKey}:${index}`);
            const delivery = await tx.notificationDelivery.create({
              data: {
                tenantId,
                notificationId: notification.id,
                channel,
                status: "queued",
                destinationHash,
                provider,
              },
              select: { id: true },
            });
            deliveryCount += 1;

            await tx.notificationProviderHandoff.create({
              data: {
                tenantId,
                notificationId: notification.id,
                deliveryId: delivery.id,
                channel,
                provider,
                state: "queued",
                idempotencyKey: `${idempotencyStorageFingerprint(plan.idempotencyKey ?? requestedIdempotencyKey)}:${index}:${channel}`,
                destinationHash,
                sanitizedPayload: {
                  action,
                  templateKey: job.templateKey,
                  scheduledAt: job.scheduledAt,
                  scheduledOffsetMinutes: job.scheduledOffsetMinutes,
                  providerDispatchEnabled: false,
                  rawDestinationStored: false,
                  rawIdempotencyKeyStored: false,
                },
                availableAt: new Date(job.scheduledAt),
              },
            });
            handoffCount += 1;
          }
        }

        const audit = await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: actor.actorUserId,
            action: "notification.scheduler.schedule_sequence",
            entityType: "NotificationProviderHandoff",
            entityId: idempotencyStorageFingerprint(plan.idempotencyKey ?? requestedIdempotencyKey),
            metadata: {
              source: "dashboard-notification-scheduler-route",
              idempotencyPersisted: true,
              rawIdempotencyKeyStored: false,
              requestHashPersisted: true,
              rawRequestHashStored: false,
              internalPersistenceIdsStored: false,
              notificationCount,
              deliveryCount,
              handoffCount,
              providerDispatchEnabled: false,
              workerExecutionEnabled: false,
            },
          },
          select: { id: true },
        });

        await tx.idempotencyKey.update({
          where: { tenantId_scope_key: { tenantId, scope: "notification.scheduler", key: plan.idempotencyKey ?? requestedIdempotencyKey } },
          data: {
            status: "completed",
            result: {
              auditLogged: true,
              auditIdEchoed: false,
              idempotencyKeyIdEchoed: false,
              notificationIdsEchoed: false,
              deliveryIdsEchoed: false,
              handoffIdsEchoed: false,
              internalPersistenceIdsEchoed: false,
              internalPersistenceIdsStored: false,
              notificationCount,
              deliveryCount,
              handoffCount,
              requestHashPersisted: true,
              rawRequestHashStored: false,
              providerDispatchEnabled: false,
              workerExecutionEnabled: false,
            },
          },
        });

        return { status: "persisted" as const, idempotency, auditLogged: true, notificationCount, deliveryCount, handoffCount, providerDispatchEnabled: false, workerExecutionEnabled: false };
      });

      if (result.status === "related_not_found") {
        return NextResponse.json(
          {
            ok: false,
            source: actor.source,
            ...buildNotificationSchedulerResponseProjection(),
            error: { code: "RELATED_RECORD_NOT_FOUND", message: `Scheduler ${result.relation} must exist for this tenant.` },
            gapIds: ["GAP-065", "GAP-066"],
          },
          { status: 404, headers: noStoreHeaders },
        );
      }

      if (result.status === "idempotency_conflict") {
        return NextResponse.json(
          {
            ok: false,
            source: actor.source,
            ...buildNotificationSchedulerResponseProjection(),
            error: { code: "IDEMPOTENCY_CONFLICT", message: "Idempotency key was already used for a different scheduler payload." },
            idempotencyRecorded: true,
            idempotencyKeyIdEchoed: false,
            gapIds: ["GAP-065", "GAP-066"],
            boundary: "Notification scheduler idempotency is request-hash guarded and defaults to denial on mismatched replay payloads.",
          },
          { status: 409, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          source: actor.source,
          ...buildNotificationSchedulerResponseProjection(),
          persistence: "database",
          status: result.status === "replayed" ? "database-replayed" : "database-persisted",
          idempotencyRecorded: true,
          idempotencyKeyIdEchoed: false,
          idempotencyReplay: result.status === "replayed",
          notificationCount: result.notificationCount,
          deliveryCount: result.deliveryCount,
          handoffCount: result.handoffCount,
          auditLogged: result.auditLogged,
          auditIdEchoed: false,
          notificationIdsEchoed: false,
          deliveryIdsEchoed: false,
          handoffIdsEchoed: false,
          internalPersistenceIdsEchoed: false,
          plan: buildSafeNotificationSchedulerPlanResponse(plan),
          requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
          gapIds: ["GAP-065", "GAP-066"],
          boundary: "Scheduler schedule_sequence persists tenant-scoped Notification, NotificationDelivery, NotificationProviderHandoff, IdempotencyKey, and AuditLog rows without provider dispatch; worker execution remains evidence-gated.",
        },
        { status: result.status === "replayed" ? 200 : 201, headers: noStoreHeaders },
      );
    } catch (error) {
      if (isDatabaseUnavailable(error)) {
        return NextResponse.json(
          {
            ok: false,
            source: actor.source,
            ...buildNotificationSchedulerResponseProjection(),
            error: { code: "DATABASE_UNAVAILABLE", message: "Notification scheduler persistence requires the dashboard database connection." },
            gapIds: ["GAP-065", "GAP-066"],
          },
          { status: 503, headers: noStoreHeaders },
        );
      }

      return NextResponse.json(
        { ok: false, error: { code: "NOTIFICATION_SCHEDULER_PERSISTENCE_FAILED", message: "Notification scheduler jobs could not be persisted." }, gapIds: ["GAP-065", "GAP-066"] },
        { status: 500, headers: noStoreHeaders },
      );
    }
  }

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      source: actor.source,
      ...buildNotificationSchedulerResponseProjection(),
      plan: buildSafeNotificationSchedulerPlanResponse(plan),
      requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
      gapIds: ["GAP-065", "GAP-066"],
      boundary: "Scheduler POST returns the local transaction/write contract; live execution waits for queue persistence repositories and worker processes.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
