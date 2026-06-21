import { NextRequest, NextResponse } from "next/server";
import { buildTravelPublishMutationPlan, type TravelPublishMutationAction } from "@inkroute/calendar";
import { demoTravelStops } from "@inkroute/config";
import type { TravelStop } from "@inkroute/types";

import { dashboardTravelPublishContract } from "../../../../lib/travelPublish";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

const supportedActions = new Set<TravelPublishMutationAction>(dashboardTravelPublishContract.supportedActions);

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "travel:write");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to publish travel updates." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot publish travel for another tenant." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const action = String(body?.action ?? "");
  if (!supportedActions.has(action as TravelPublishMutationAction)) {
    return NextResponse.json(
      { ok: false, error: { code: "UNSUPPORTED_TRAVEL_PUBLISH_ACTION", message: "Travel publish action is not supported." } },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TRAVEL_PUBLISH_REPOSITORY_NOT_CONFIGURED",
          message: "Production travel publish requires durable repository execution, cache revalidation, provider rollback handling, and transport evidence; demo-backed mutation planning is disabled.",
          gapIds: ["GAP-060"],
        },
        productionBoundary: {
          demoTravelPublishPlanDisabled: true,
          requiresDurableTravelRepository: true,
          requiresProviderRollbackEvidence: true,
          requiresDashboardToPublicE2eEvidence: true,
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const stop = {
    ...demoTravelStops[0],
    ...(typeof body?.stop === "object" && body.stop !== null ? body.stop as Record<string, unknown> : {}),
    tenantId,
  } as TravelStop;
  const previousStop = typeof body?.previousStop === "object" && body.previousStop !== null
    ? { ...stop, ...(body.previousStop as Record<string, unknown>), tenantId } as TravelStop
    : undefined;

  const plan = buildTravelPublishMutationPlan({
    tenantId,
    artistId: String(body?.artistId ?? stop.artistId),
    actorId: actor.userId,
    action: action as TravelPublishMutationAction,
    stop,
    previousStop,
    idempotencyKey: typeof body?.idempotencyKey === "string" ? body.idempotencyKey : undefined,
    consentedWaitlistClientIds: Array.isArray(body?.consentedWaitlistClientIds)
      ? body.consentedWaitlistClientIds.map(String)
      : [],
    changedFieldNames: Array.isArray(body?.changedFieldNames) ? body.changedFieldNames.map(String) : undefined,
    providerActionsSucceeded: body?.providerActionsSucceeded !== false,
    rollbackReason: typeof body?.rollbackReason === "string" ? body.rollbackReason : undefined,
  });

  if (plan.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "TRAVEL_PUBLISH_BLOCKED", message: "Travel publish mutation is not safe to execute." },
        plan,
        readiness: dashboardTravelPublishContract.readiness,
        gapIds: ["GAP-060"],
      },
      { status: 409, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status: "repository-required",
      message: "Travel publish plan is valid, but durable repository, revalidation, sync, and notification transports must execute after commit.",
      plan,
      readiness: dashboardTravelPublishContract.readiness,
      gapIds: ["GAP-060"],
    },
    { status: 202, headers: noStoreHeaders },
  );
}
