import { describe, expect, it } from "vitest";
import {
  buildDeploymentPlan,
  buildHandoffTasks,
  buildProductionLaunchChecklist,
  evaluateEnvironmentReadiness,
  summarizeLaunchChecklist,
} from "../src/index";

describe("deployment readiness helpers", () => {
  it("blocks production when required secrets are placeholders", () => {
    const report = evaluateEnvironmentReadiness(
      {
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://artist.example.com",
        DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/inkroute",
      },
      "production",
      "2026-06-03T00:00:00.000Z",
    );

    expect(report.productionBlocked).toBe(true);
    expect(report.missingRequiredNames).toContain("DATABASE_URL");
    expect(report.missingRequiredNames).toContain("AUTH_SECRET");
  });

  it("summarizes production launch blockers", () => {
    const checklist = buildProductionLaunchChecklist();
    const summary = summarizeLaunchChecklist(checklist);

    expect(summary.itemCount).toBeGreaterThan(0);
    expect(summary.productionBlockingCount).toBeGreaterThan(0);
    expect(summary.blockerIds).toContain("launch-foundation-install");
  });

  it("creates handoff tasks with verification commands", () => {
    const tasks = buildHandoffTasks();
    const codexTask = tasks.find((task) => task.target === "Codex");

    expect(codexTask?.verification).toContain("pnpm install");
    expect(codexTask?.gapIds).toContain("GAP-001");
  });

  it("builds a production-blocked deployment plan while providers are not configured", () => {
    const plan = buildDeploymentPlan("production");

    expect(plan.productionBlockers.length).toBeGreaterThan(0);
    expect(plan.summary).toContain("production-blocking");
  });
});
