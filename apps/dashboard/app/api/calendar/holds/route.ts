import { NextRequest, NextResponse } from "next/server";
import { buildAvailabilityPersistencePlan } from "@inkroute/calendar";

import { dashboardAvailabilityPersistenceContract } from "../../../../lib/availabilityPersistence";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to mutate availability." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot create a slot hold for another tenant." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const plan = buildAvailabilityPersistencePlan({
    tenantId,
    artistId: String(body?.artistId ?? ""),
    action: "create_slot_hold",
    startsAt: String(body?.startsAt ?? ""),
    endsAt: String(body?.endsAt ?? ""),
    timezone: String(body?.timezone ?? ""),
    actorId: actor.userId,
    bookingRequestId: typeof body?.bookingRequestId === "string" ? body.bookingRequestId : undefined,
    availabilityWindowId: typeof body?.availabilityWindowId === "string" ? body.availabilityWindowId : undefined,
    idempotencyKey: typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined,
    conflictIds: Array.isArray(body?.conflictIds) ? body.conflictIds.map(String) : [],
    existingHoldIds: Array.isArray(body?.existingHoldIds) ? body.existingHoldIds.map(String) : [],
  });

  if (plan.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "AVAILABILITY_HOLD_BLOCKED", message: "Slot hold is not safe to persist." },
        plan,
        readiness: dashboardAvailabilityPersistenceContract.readiness,
        gapIds: ["GAP-056"],
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status: "repository-required",
      message: "Slot hold plan is valid, but durable availability repositories must execute the transaction.",
      plan,
      readiness: dashboardAvailabilityPersistenceContract.readiness,
      gapIds: ["GAP-056"],
    },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
