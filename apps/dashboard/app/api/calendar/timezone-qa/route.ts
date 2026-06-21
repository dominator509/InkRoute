import { NextRequest, NextResponse } from "next/server";

import {
  dashboardTimezoneRecurrenceQaContract,
  validateTimezoneBoundaries,
} from "../../../../lib/timezoneRecurrenceQa";
import { assertPermission, resolveDashboardActor } from "../../dashboardAuth";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function POST(request: NextRequest) {
  const actor = resolveDashboardActor(request);
  try {
    assertPermission(actor, "calendar:read");
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Actor is not allowed to inspect timezone QA." } },
      { status: 403, headers: noStoreHeaders },
    );
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = String(body?.tenantId ?? actor.tenantId);
  if (tenantId !== actor.tenantId) {
    return NextResponse.json(
      { ok: false, error: { code: "TENANT_MISMATCH", message: "Cannot inspect timezone QA for another tenant." } },
      { status: 403, headers: noStoreHeaders },
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

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TIMEZONE_RECURRENCE_RUNTIME_EVIDENCE_NOT_CONFIGURED",
          message:
            "Production timezone QA requires Temporal/date-library proof, persistence-boundary validation, DST/recurrence artifacts, Google/ICS render smokes, and seeded persistence evidence; diagnostic-only QA responses are disabled.",
          gapIds: ["GAP-009", "GAP-058", "GAP-059"],
        },
        tenantId,
        boundaryResults: results,
        qaPlan: dashboardTimezoneRecurrenceQaContract.qaPlan,
        readiness: dashboardTimezoneRecurrenceQaContract.readiness,
        productionBoundary: {
          diagnosticTimezoneQaDisabled: true,
          requiresTemporalDateLibraryEvidence: true,
          requiresProviderRenderEvidence: true,
          requiresSeededPersistenceBoundaryEvidence: true,
          gapIds: ["GAP-009", "GAP-058", "GAP-059"],
        },
      },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    {
      ok: failed.length === 0,
      tenantId,
      boundaryResults: results,
      qaPlan: dashboardTimezoneRecurrenceQaContract.qaPlan,
      readiness: dashboardTimezoneRecurrenceQaContract.readiness,
      gapIds: ["GAP-058"],
    },
    { status: failed.length === 0 ? 200 : 422, headers: noStoreHeaders },
  );
}
