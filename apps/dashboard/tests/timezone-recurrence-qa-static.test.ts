import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildTimezoneRecurrenceLocalEvidence,
  buildDashboardTimezoneReadiness,
  dashboardTimezoneRecurrenceQaContract,
  validateTimezoneBoundaries,
} from "../lib/timezoneRecurrenceQa";

const repoRoot = resolve(__dirname, "../../..");

describe("dashboard timezone recurrence QA contract", () => {
  it("covers IANA validation, DST, recurrence, provider render, and all-day travel checks", () => {
    expect(dashboardTimezoneRecurrenceQaContract.requiredChecks).toEqual([
      "iana_validation",
      "dst_transition",
      "recurrence_expansion",
      "provider_render_matrix",
      "all_day_travel_window",
    ]);
    expect(dashboardTimezoneRecurrenceQaContract.requiredTimezones).toContain("America/Los_Angeles");
    expect(dashboardTimezoneRecurrenceQaContract.requiredTimezones).toContain("Asia/Tokyo");
  });

  it("rejects untrimmed, abbreviation-only, or invalid timezone boundaries", () => {
    const results = validateTimezoneBoundaries([
      { id: "valid", timezone: "America/New_York", source: "route" },
      { id: "untrimmed", timezone: " America/New_York", source: "persistence" },
      { id: "abbr", timezone: "PST", source: "provider" },
    ]);

    expect(results.map((result) => result.valid)).toEqual([true, false, false]);
  });

  it("builds local timezone recurrence evidence for UTC storage, IANA boundaries, DST, recurrence, provider, and travel cases", () => {
    const evidence = buildTimezoneRecurrenceLocalEvidence({
      cases: dashboardTimezoneRecurrenceQaContract.qaCases,
      boundaryInputs: [
        { id: "route", timezone: "America/Los_Angeles", source: "route" },
        { id: "persistence", timezone: "Europe/London", source: "persistence" },
        { id: "provider", timezone: "Asia/Tokyo", source: "provider" },
      ],
    });

    expect(evidence.status).toBe("ready");
    expect(evidence.blockers).toEqual([]);
    expect(evidence.checkedCaseIds).toEqual([
      "iana-los-angeles",
      "dst-spring-new-york",
      "dst-fall-chicago",
      "weekly-london-guest-spot",
      "tokyo-provider-render",
      "all-day-la-travel",
    ]);
    expect(evidence.requiredChecksCovered).toEqual([
      "iana_validation",
      "dst_transition",
      "recurrence_expansion",
      "provider_render_matrix",
      "all_day_travel_window",
    ]);
    expect(evidence.requiredTimezonesCovered).toEqual([
      "America/Los_Angeles",
      "America/New_York",
      "America/Chicago",
      "Europe/London",
      "Asia/Tokyo",
    ]);
    expect(dashboardTimezoneRecurrenceQaContract.timezoneDateBoundary.strategy).toBe("intl-datetimeformat");
    expect(dashboardTimezoneRecurrenceQaContract.timezoneDateBoundaryEvidence).toMatchObject({
      status: "ready",
      storesUtcInstants: true,
      requiresIanaTimezoneAtBoundaries: true,
    });
  });

  it("blocks local timezone recurrence evidence when boundaries or UTC instants are malformed", () => {
    const evidence = buildTimezoneRecurrenceLocalEvidence({
      cases: [
        {
          ...dashboardTimezoneRecurrenceQaContract.qaCases[0],
          startsAt: "2026-06-09T09:00:00",
          timezone: "PST",
        },
      ],
      boundaryInputs: [{ id: "provider", timezone: " America/Los_Angeles", source: "provider" }],
    });

    expect(evidence.status).toBe("blocked");
    expect(evidence.blockers).toContain(
      "Route, persistence, and provider timezone boundaries must all use trimmed region-style IANA identifiers.",
    );
    expect(evidence.blockers).toContain("Timezone QA cases must use valid trimmed region-style IANA identifiers.");
    expect(evidence.blockers).toContain(
      "Timezone QA cases must store UTC instants with explicit IANA timezone identifiers.",
    );
  });

  it("keeps provider render QA blocked until Google/ICS/seeded evidence exists", () => {
    const readiness = buildDashboardTimezoneReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("@inkroute/calendar timezone tests must pass.");
    expect(readiness.blockers).not.toContain("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
    expect(readiness.blockers).toContain("DST spring-forward behavior must be tested.");
    expect(readiness.blockers).toContain("Google Calendar timezone rendering smoke test must pass.");
    expect(readiness.blockers).toContain("ICS timezone rendering/import smoke test must pass.");
  });

  it("wires the dashboard timezone QA API through no-store tenant-scoped boundary validation", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/api/calendar/timezone-qa/route.ts"), "utf8");

    expect(routeSource).toContain("validateTimezoneBoundaries");
    expect(routeSource).toContain("calendar:read");
    expect(routeSource).toContain("TENANT_MISMATCH");
    expect(routeSource).toContain("TIMEZONE_RECURRENCE_RUNTIME_EVIDENCE_NOT_CONFIGURED");
    expect(routeSource).toContain("diagnosticTimezoneQaDisabled");
    expect(routeSource).toContain("requiresProviderRenderEvidence");
    expect(routeSource).toContain("buildTimezoneQaResponseProjection");
    expect(routeSource).toContain("tenantIdEchoed: false");
    expect(routeSource).toContain("internalPersistenceIdsEchoed: false");
    expect(routeSource).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(routeSource).toContain("headers: noStoreHeaders");
    expect(routeSource).not.toContain("tenantId,");
    expect(routeSource).not.toContain('headers: { "Cache-Control": "no-store" }');
  });
});
