import { NextResponse, type NextRequest } from "next/server";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";
import { buildDashboardSchedulerPlanFromAction, dashboardNotificationSchedulerContract } from "../../../../lib/notificationScheduler";
import type { NotificationSchedulerAction } from "@inkroute/notifications";

const schedulerActions: readonly NotificationSchedulerAction[] = ["schedule_sequence", "cancel_scheduled_jobs", "process_due_job", "retry_failed_job", "dead_letter_job"];

function parseAction(value: unknown): NotificationSchedulerAction {
  return typeof value === "string" && schedulerActions.includes(value as NotificationSchedulerAction) ? (value as NotificationSchedulerAction) : "schedule_sequence";
}

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

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
      tenantId,
      source: actor.source,
      contract: dashboardNotificationSchedulerContract,
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
  const plan = buildDashboardSchedulerPlanFromAction({
    tenantId,
    action,
    now,
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : `scheduler:${tenantId}:${action}`,
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

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        tenantId,
        source: actor.source,
        error: {
          code: "NOTIFICATION_SCHEDULER_PERSISTENCE_NOT_CONFIGURED",
          message:
            "Production notification scheduler writes require durable NotificationJob, DeadLetterJob, NotificationWorkerAuditLog, IdempotencyKey, queue backend, and worker execution persistence; local-contract fallback responses are disabled.",
          gapIds: ["GAP-065", "GAP-066"],
        },
        plan,
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

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantId,
      source: actor.source,
      plan,
      requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
      gapIds: ["GAP-065", "GAP-066"],
      boundary: "Scheduler POST returns the local transaction/write contract; live execution waits for queue persistence repositories and worker processes.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: noStoreHeaders },
  );
}
