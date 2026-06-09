import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  mobileApiArtifactPaths,
  mobileApiDomains,
  mobileApiRuntimeCommands,
  mobileApiRuntimeMatrix,
  mobileApiRuntimeReadiness,
} from "../src/lib/mobileApiRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile API sync runtime contract", () => {
  const mobilePackageJson = readWorkspaceFile("packages/mobile/package.json");
  const mobileSupportSource = readWorkspaceFile("packages/mobile/src/index.ts");
  const mobileSupportTests = readWorkspaceFile("packages/mobile/tests/mobile-support.test.ts");
  const apiClientSource = readWorkspaceFile("apps/mobile/src/lib/mobileApiClient.ts");
  const apiClientStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-api-client-static.test.ts");
  const homeScreen = readWorkspaceFile("apps/mobile/src/screens/HomeScreen.tsx");
  const bookingScreen = readWorkspaceFile("apps/mobile/src/screens/BookingRequestsScreen.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-043 domains, commands, matrix rows, and artifacts", () => {
    expect(mobileApiDomains).toEqual([
      "bookings",
      "appointments",
      "clients",
      "travel",
      "portfolio",
      "notifications",
      "releases",
    ]);
    expect(mobileApiRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/mobile-support typecheck",
      "pnpm --filter @inkroute/mobile-support test",
      "pnpm --filter @inkroute/mobile typecheck",
      "pnpm --filter @inkroute/mobile test",
      "Expo iOS/Android mobile API smoke tests",
      "offline reconnect/replay mobile test",
    ]);
    expect(mobileApiRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "mobile-support-typecheck",
      "mobile-support-tests",
      "mobile-app-typecheck-test",
      "typed-api-client",
      "provider-token-exchange",
      "screen-domain-matrix",
      "static-data-replacement",
      "seeded-api-smoke",
      "expired-cross-tenant-denial",
      "offline-idempotent-replay",
      "ci-secret-safe-evidence",
    ]);
    expect(mobileApiArtifactPaths).toContain("coverage/mobile-api-runtime.json");
    expect(mobileApiArtifactPaths).toContain("test-results/mobile-api-runtime");
  });

  it("keeps package helper, typed API client, envelope validation, and screen surfacing wired", () => {
    expect(mobilePackageJson).toContain('"typecheck"');
    expect(mobilePackageJson).toContain('"test"');
    expect(mobileSupportSource).toContain("buildMobileApiRuntimeReadinessPlan");
    expect(mobileSupportSource).toContain("buildMobileApiRequestPlan");
    expect(mobileSupportTests).toContain("buildMobileApiRuntimeReadinessPlan");
    expect(apiClientSource).toContain("buildMobileApiClientRequestPlan");
    expect(apiClientSource).toContain("assertMobileApiEnvelope");
    expect(apiClientSource).toContain("redactMobileApiError");
    expect(apiClientStaticTest).toContain("validates response envelopes before screens consume data");
    expect(homeScreen).toContain("API sync contract");
    expect(bookingScreen).toContain("Typed client ready");
  });

  it("keeps runtime blockers explicit until provider auth, seeded smoke, denial, offline replay, and device evidence exists", () => {
    expect(mobileApiRuntimeReadiness.status).toBe("blocked");
    expect(mobileApiRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileApiRuntimeReadiness.missingScreenDomains).toEqual([]);
    expect(mobileApiRuntimeReadiness.requiredCommands).toEqual([...mobileApiRuntimeCommands]);
    expect(mobileApiRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "seeded mobile API smoke output",
      "expired-auth and cross-tenant denial test output",
      "offline idempotent replay test output",
    ]));
    expect(mobileApiRuntimeReadiness.blockers).toContain("@inkroute/mobile-support API/sync tests must pass.");
    expect(mobileApiRuntimeReadiness.blockers).toContain("Offline-aware retry queue must handle mobile mutations.");
    expect(mobileApiRuntimeReadiness.blockers).toContain("Mobile API tests must reject cross-tenant reads and writes.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live mobile sync readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile API sync runtime contracts");
    expect(ciWorkflow).toContain("mobile-api-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-api-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-api-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileApiRuntime.ts");
    expect(gapTracker).toContain("GAP-043 is mobile-api-runtime-matrix wired");
    expect(mobileApiArtifactPaths).toContain("coverage/mobile-api-secret-safe-artifacts.json");
  });
});
