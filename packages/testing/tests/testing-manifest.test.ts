import { describe, expect, it } from "vitest";
import {
  buildCiQualityGatePlan,
  buildDashboardTestRequirements,
  buildManualQaChecklist,
  buildRouteSmokeManifest,
  phase14Suites,
  summarizeDashboardTestRequirements,
  summarizeSuites,
} from "../src/index";

describe("Phase 14 testing manifest", () => {
  it("summarizes scaffolded and gated tests", () => {
    const summary = summarizeSuites(phase14Suites);

    expect(summary.suiteCount).toBeGreaterThan(0);
    expect(summary.caseCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
  });

  it("declares CI quality gates and manual QA evidence", () => {
    expect(buildCiQualityGatePlan().some((gate) => gate.id === "ci-install" && gate.required)).toBe(true);
    expect(buildManualQaChecklist().some((item) => item.priority === "critical")).toBe(true);
    expect(buildRouteSmokeManifest().some((route) => route.path === "/booking")).toBe(true);
  });

  it("declares dashboard test coverage requirements for GAP-041", () => {
    const requirements = buildDashboardTestRequirements();
    const summary = summarizeDashboardTestRequirements(requirements);

    expect(summary.missingAreas).toEqual([]);
    expect(summary.productionReady).toBe(false);
    expect(summary.criticalRuntimeGatedIds).toEqual([
      "dashboard-route-rendering",
      "dashboard-rbac-tenant-isolation",
      "dashboard-mutation-lifecycle",
      "dashboard-e2e-critical-flow",
    ]);
    expect(requirements.every((requirement) => requirement.gapIds.includes("GAP-041"))).toBe(true);
    expect(requirements.find((requirement) => requirement.area === "accessibility")?.verifies).toContain("axe critical violations");
  });
});
