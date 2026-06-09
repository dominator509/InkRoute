import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildObservabilityAutomatedCoverageContract,
  observabilityAutomatedCoverageArtifactPaths,
  observabilityAutomatedCoverageCommands,
  observabilityAutomatedCoverageMatrix,
} from "../lib/observabilityAutomatedCoverage";

const root = join(__dirname, "..", "..");
const workflowSource = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
const trackerSource = readFileSync(join(root, "GAP_TRACKER.md"), "utf8");
const webE2eSource = readFileSync(join(root, "apps/web/tests/e2e/observability-global-error.spec.ts"), "utf8");
const dashboardE2eSource = readFileSync(join(root, "apps/dashboard/tests/e2e/observability-triage.spec.ts"), "utf8");
const mobileProofSource = readFileSync(join(root, "apps/mobile/tests/mobile-crash-proof-static.test.ts"), "utf8");

describe("observability automated coverage closeout matrix", () => {
  it("adds executable browser targets for rendered global-error and dashboard triage coverage", () => {
    expect(webE2eSource).toContain("observability global-error rendered coverage");
    expect(webE2eSource).toContain("x-request-id");
    expect(webE2eSource).toContain("traceparent");
    expect(dashboardE2eSource).toContain("dashboard observability triage smoke");
    expect(dashboardE2eSource).toContain("Alert routing preview");
    expect(dashboardE2eSource).toContain("cache-control");
  });

  it("adds mobile simulator/device proof targets without claiming live device proof", () => {
    expect(mobileProofSource).toContain("mobile crash proof coverage contract");
    expect(mobileProofSource).toContain("forced crash proof pending");
    expect(mobileProofSource).toContain("fallbackReporterConfigured: true");
    expect(observabilityAutomatedCoverageArtifactPaths).toContain("coverage/observability-mobile-device-crash-proof-redacted.json");
  });

  it("keeps the automated coverage matrix explicit and artifact-backed", () => {
    expect(observabilityAutomatedCoverageCommands).toContain("pnpm exec playwright test apps/web/tests/e2e/observability-global-error.spec.ts apps/dashboard/tests/e2e/observability-triage.spec.ts");
    expect(observabilityAutomatedCoverageMatrix.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "package-observability-helpers",
        "web-observability-routes",
        "rendered-global-error-boundaries",
        "dashboard-triage-browser-smoke",
        "mobile-crash-simulator-ui",
        "mobile-crash-device-proof",
      ]),
    );
  });

  it("marks new coverage targets as wired while preserving execution blockers", () => {
    const contract = buildObservabilityAutomatedCoverageContract();

    expect(contract.status).toBe("blocked");
    expect(contract.blockers).toEqual(
      expect.arrayContaining([
        "@inkroute/observability helper tests must pass.",
        "Web observability route tests must pass.",
        "Dashboard errors page smoke test must pass in a rendered browser/runtime context.",
        "Mobile physical-device crash-report UI proof must be captured.",
      ]),
    );
    expect(contract.requiredEvidence).toEqual(expect.arrayContaining(["mobile simulator and physical-device crash-report UI evidence"]));
  });

  it("is wired into CI and tracker evidence for GAP-086", () => {
    expect(workflowSource).toContain("Run Phase 11 observability automated coverage contracts");
    expect(workflowSource).toContain("apps/web/tests/observability-automated-coverage-static.test.ts");
    expect(workflowSource).toContain("apps/mobile/tests/mobile-crash-proof-static.test.ts");
    expect(workflowSource).toContain("observability-playwright-triage-results");
    expect(trackerSource).toContain("GAP-086");
    expect(trackerSource).toContain("apps/web/lib/observabilityAutomatedCoverage.ts");
    expect(trackerSource).toContain("live browser/device execution remains open");
  });
});
