import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  buildPhase9RuntimeArtifactReview,
  buildPhase9RuntimeExecutionPlan,
  phase9AppRuntimeBuildContract,
  phase9AppRuntimeSurfaces,
  phase9RuntimeArtifactPaths,
  phase9RuntimeRequiredArtifacts,
  phase9AppRuntimeBuildReadinessRequiredEvidence,
} from "../lib/phase9AppRuntimeBuild";

const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");

describe("GAP-070 Phase 9 app runtime/build gate", () => {
  it("enumerates the full cross-app runtime/build surface", () => {
    expect(phase9AppRuntimeSurfaces.map((surface) => surface.id)).toEqual([
      "testing-package",
      "web-build",
      "dashboard-build",
      "mobile-typecheck",
      "notification-routes",
      "provider-webhook-routes",
      "booking-route-runtime-smoke",
      "deposit-route-runtime-smoke",
      "dashboard-template-playwright-smoke",
      "dashboard-message-playwright-smoke",
      "dashboard-provider-disabled-state",
      "mobile-notification-screen-smoke",
      "expo-simulator-notification-smoke",
      "expo-device-notification-smoke",
      "booking-to-notification-runtime-smoke",
      "phase9-runtime-artifacts",
    ]);
  });

  it("keeps runtime smoke commands provider-disabled or sandboxed", () => {
    expect(phase9AppRuntimeSurfaces.every((surface) => surface.providerPolicy === "disabled-or-sandboxed")).toBe(true);
    expect(phase9AppRuntimeBuildContract.blockers).not.toContain(
      "Runtime smoke tests must prove provider sends remain disabled or sandboxed.",
    );
  });

  it("builds a local runtime/build execution plan with provider sends disabled", () => {
    const plan = buildPhase9RuntimeExecutionPlan();

    expect(plan.surfaces).toHaveLength(phase9AppRuntimeSurfaces.length);
    expect(plan.requiredArtifacts).toBe(phase9RuntimeRequiredArtifacts);
    expect(plan.requiredArtifacts).toContain("coverage/phase9-web-build.json");
    expect(plan.requiredArtifacts).toContain("coverage/phase9-booking-to-notification-runtime.json");
    expect(plan.browserOrDeviceSurfaces).toEqual(expect.arrayContaining([
      "dashboard-provider-disabled-state",
      "expo-device-notification-smoke",
      "booking-to-notification-runtime-smoke",
    ]));
    expect(plan.surfaces.every((surface) => surface.providerSendsAllowed === false)).toBe(true);
    expect(plan.surfaces.find((surface) => surface.id === "web-build")).toMatchObject({
      requiresBrowserOrDevice: false,
    });
    expect(plan.surfaces.find((surface) => surface.id === "expo-device-notification-smoke")).toMatchObject({
      requiresBrowserOrDevice: true,
    });
  });

  it("reviews retained runtime/build artifacts with recursive provider token and PII redaction", () => {
    const review = buildPhase9RuntimeArtifactReview({
      expectedArtifactPaths: ["coverage/phase9-provider-disabled-dashboard.json"],
      artifacts: [
        {
          path: "coverage/phase9-provider-disabled-dashboard.json",
          providerPayload: {
            authorization: "Bearer provider-token",
            email: "ari@example.test",
            phone: "+1 206 555 0142",
            expoPushToken: "expo_push_token_secret",
          },
          nested: [{ stripeClientSecret: "stripe_secret_value" }],
        },
      ],
    });

    expect(review.status).toBe("passed");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("provider-token");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("ari@example.test");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("206 555 0142");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("expo_push_token_secret");
    expect(JSON.stringify(review.redactedArtifacts)).not.toContain("stripe_secret_value");
    expect(review.blockers).toEqual([]);
  });

  it("retains Phase 9 runtime/build artifact paths without claiming unrun proof", () => {
    expect(phase9RuntimeArtifactPaths).toContain("coverage/phase9-*.json");
    expect(phase9RuntimeArtifactPaths).toContain("coverage/phase9-*-redacted.json");
    expect(phase9RuntimeArtifactPaths).toContain("test-results/phase9-notifications");
    expect(phase9RuntimeArtifactPaths).toContain("test-results/phase9-dashboard");
    expect(phase9AppRuntimeBuildContract.status).toBe("blocked");
    expect(phase9AppRuntimeBuildContract.requiredEvidence).toBe(phase9AppRuntimeBuildReadinessRequiredEvidence);
    expect(phase9AppRuntimeBuildContract.requiredEvidence).toEqual(
      expect.arrayContaining([
        "web build, dashboard build, and mobile typecheck output",
        "dashboard templates/messages Playwright smoke and provider-disabled state evidence",
        "booking-to-notification runtime, provider-disabled, artifact, and CI required-gate evidence",
      ]),
    );
  });

  it("requires the Phase 9 app runtime/build gate in CI", () => {
    expect(ciWorkflow).toContain("Run Phase 9 app runtime and build gate");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/testing test");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/testing typecheck");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/web build");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/dashboard build");
    expect(ciWorkflow).toContain("pnpm --filter @inkroute/mobile typecheck");
    expect(ciWorkflow).toContain("apps/web/tests/phase9-app-runtime-build-static.test.ts");
    expect(ciWorkflow).toContain("Upload Phase 9 app runtime/build artifacts");
    expect(ciWorkflow).toContain("phase9-app-runtime-build-artifacts");
  });
});
