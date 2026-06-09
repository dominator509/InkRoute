import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
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

  it("keeps provider render QA blocked until Google/ICS/seeded evidence exists", () => {
    const readiness = buildDashboardTimezoneReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blockers).toContain("@inkroute/calendar timezone tests must pass.");
    expect(readiness.blockers).toContain("Temporal or an explicit timezone/date library must be implemented at route, persistence, and provider boundaries.");
    expect(readiness.blockers).toContain("DST spring-forward behavior must be tested.");
    expect(readiness.blockers).toContain("Google Calendar timezone rendering smoke test must pass.");
    expect(readiness.blockers).toContain("ICS timezone rendering/import smoke test must pass.");
  });

  it("wires the dashboard timezone QA API through no-store tenant-scoped boundary validation", () => {
    const routeSource = readFileSync(resolve(repoRoot, "apps/dashboard/app/api/calendar/timezone-qa/route.ts"), "utf8");

    expect(routeSource).toContain("validateTimezoneBoundaries");
    expect(routeSource).toContain("calendar:read");
    expect(routeSource).toContain("TENANT_MISMATCH");
    expect(routeSource).toContain("Cache-Control");
  });
});
