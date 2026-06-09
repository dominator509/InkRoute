import { NextRequest, NextResponse } from "next/server";

import {
  dashboardTimezoneRecurrenceQaContract,
  validateTimezoneBoundaries,
} from "../../../../lib/timezoneRecurrenceQa";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:read");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to inspect timezone QA." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot inspect timezone QA for another tenant." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const boundaries = Array.isArray(body?.boundaries)
    ? body.boundaries.map((item, index) => {
        const record = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
        return {
          id: String(record.id ?? `boundary-${index}`),
          timezone: String(record.timezone ?? ""),
          source: record.source === "persistence" || record.source === "provider" ? record.source : "route",
        };
      })
    : [];

  const results = validateTimezoneBoundaries(boundaries);
  const failed = results.filter((result) => !result.valid);

  return NextResponse.json(
    {
      ok: failed.length === 0,
      tenantId,
      boundaryResults: results,
      qaPlan: dashboardTimezoneRecurrenceQaContract.qaPlan,
      readiness: dashboardTimezoneRecurrenceQaContract.readiness,
      gapIds: ["GAP-058"],
    },
    { status: failed.length === 0 ? 200 : 422, headers: { "Cache-Control": "no-store" } },
  );
}
