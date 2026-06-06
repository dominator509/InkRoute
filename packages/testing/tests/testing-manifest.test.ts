import { describe, expect, it } from "vitest";
import { buildCiQualityGatePlan, buildManualQaChecklist, buildRouteSmokeManifest, phase14Suites, summarizeSuites } from "../src/index";

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
});
