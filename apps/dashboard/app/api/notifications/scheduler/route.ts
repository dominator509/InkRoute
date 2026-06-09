import { NextResponse, type NextRequest } from "next/server";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";
import { buildDashboardSchedulerPlanFromAction, dashboardNotificationSchedulerContract } from "../../../../lib/notificationScheduler";
import type { NotificationSchedulerAction } from "@inkroute/notifications";

const schedulerActions: readonly NotificationSchedulerAction[] = ["schedule_sequence", "cancel_scheduled_jobs", "process_due_job", "retry_failed_job", "dead_letter_job"];

function parseAction(value: unknown): NotificationSchedulerAction {
  return typeof value === "string" && schedulerActions.includes(value as NotificationSchedulerAction) ? (value as NotificationSchedulerAction) : "schedule_sequence";
}

export async function GET(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:read");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to read notification scheduler status." } }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenantId") ?? actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot inspect scheduler plans for another tenant." } }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: true,
      tenantId,
      source: actor.source,
      contract: dashboardNotificationSchedulerContract,
      gapIds: ["GAP-065", "GAP-066"],
      boundary: "Scheduler API exposes queue/worker plans only; persisted NotificationJob, DeadLetterJob, NotificationWorkerAuditLog, and IdempotencyKey repositories are still required for live execution.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "message:write");
  } catch {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to plan notification scheduler writes." } }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_SCHEDULER_JSON", message: "Scheduler request body must be valid JSON." } }, { status: 400 });
  }

  const tenantId = typeof body.tenantId === "string" ? body.tenantId : actor.tenantId;
  if (tenantId !== actor.tenantId) {
    return NextResponse.json({ ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot plan scheduler writes for another tenant." } }, { status: 403 });
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

  return NextResponse.json(
    {
      ok: plan.status === "ready",
      tenantId,
      source: actor.source,
      plan,
      requiredRepositoryMethods: dashboardNotificationSchedulerContract.requiredRepositoryMethods,
      gapIds: ["GAP-065", "GAP-066"],
      boundary: "Scheduler POST returns the transaction/write plan; live execution waits for queue persistence repositories and worker processes.",
    },
    { status: plan.status === "ready" ? 202 : 409, headers: { "Cache-Control": "no-store" } },
  );
}
