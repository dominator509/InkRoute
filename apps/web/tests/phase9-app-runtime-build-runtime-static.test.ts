import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  phase9AppRuntimeBuildRuntimeArtifactPaths,
  phase9AppRuntimeBuildRuntimeCommands,
  phase9AppRuntimeBuildRuntimeMatrix,
  phase9AppRuntimeBuildRuntimeReadiness,
  phase9AppRuntimeBuildSurfaceIds,
} from "../lib/phase9AppRuntimeBuildRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Phase 9 app runtime/build runtime contract", () => {
  const testingSource = readRepoFile("packages/testing/src/index.ts");
  const phase9Source = readRepoFile("apps/web/lib/phase9AppRuntimeBuild.ts");
  const staticTest = readRepoFile("apps/web/tests/phase9-app-runtime-build-static.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-070 runtime/build commands, surface ids, matrix rows, and artifacts", () => {
    expect(phase9AppRuntimeBuildRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/testing typecheck",
      "pnpm --filter @inkroute/testing test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm vitest run apps/web/tests/phase9-app-runtime-build-static.test.ts",
      "Playwright dashboard templates/messages smoke tests",
      "Expo simulator notification screen smoke test",
      "Expo device notification screen smoke test",
      "booking-to-notification runtime smoke with provider sends disabled",
    ]);
    expect(phase9AppRuntimeBuildSurfaceIds).toContain("booking-to-notification-runtime-smoke");
    expect(phase9AppRuntimeBuildRuntimeMatrix.map((entry) => entry.id)).toContain("provider-disabled-proof");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("coverage/phase9-app-runtime-build-runtime.json");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("test-results/phase9-app-runtime-build");
  });

  it("keeps package helper, cross-app surface matrix, provider-disabled policy, and static guard wired", () => {
    expect(testingSource).toContain("buildPhase9AppRuntimeBuildReadinessPlan");
    expect(phase9Source).toContain("phase9AppRuntimeSurfaces");
    expect(phase9Source).toContain("providerPolicy: \"disabled-or-sandboxed\"");
    expect(phase9Source).toContain("ciRequiresPhase9AppRuntimeGate: true");
    expect(staticTest).toContain("enumerates the full cross-app runtime/build surface");
  });

  it("keeps build, route, Playwright, mobile, provider-disabled, CI, and artifact blockers explicit", () => {
    expect(phase9AppRuntimeBuildRuntimeReadiness.status).toBe("blocked");
    expect(phase9AppRuntimeBuildRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "web build, dashboard build, and mobile typecheck output",
      "Phase 9 API route and booking/deposit runtime smoke output",
      "dashboard templates/messages Playwright smoke and provider-disabled state evidence",
      "mobile notification screen simulator and device smoke evidence",
      "booking-to-notification runtime, provider-disabled, artifact, and CI required-gate evidence",
    ]));
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("@inkroute/web build must pass with Phase 9 notification and messaging routes.");
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("Dashboard provider-disabled states must be verified before runtime promotion.");
    expect(phase9AppRuntimeBuildRuntimeReadiness.blockers).toContain("Booking-to-notification runtime smoke must pass with provider sends disabled.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live browser/device/runtime proof", () => {
    expect(ciWorkflow).toContain("Run Phase 9 app runtime/build runtime contracts");
    expect(ciWorkflow).toContain("phase9-app-runtime-build-runtime-static.test.ts");
    expect(ciWorkflow).toContain("phase9-app-runtime-build-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-phase9-app-runtime-build-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/phase9AppRuntimeBuildRuntime.ts");
    expect(gapTracker).toContain("GAP-070 is phase9-app-runtime-build-runtime-matrix wired");
    expect(phase9AppRuntimeBuildRuntimeArtifactPaths).toContain("coverage/phase9-app-runtime-build-secret-safe-artifacts.json");
  });
});
