import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  signedIcsFeedArtifactPaths,
  signedIcsFeedRuntimeCommands,
  signedIcsFeedRuntimeMatrix,
  signedIcsFeedRuntimeReadiness,
} from "../lib/signedIcsFeedsRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("signed ICS feed runtime contract", () => {
  const calendarPackageJson = readWorkspaceFile("packages/calendar/package.json");
  const calendarSource = readWorkspaceFile("packages/calendar/src/index.ts");
  const calendarTests = readWorkspaceFile("packages/calendar/tests/availability-conflicts.test.ts");
  const signedFeedSource = readWorkspaceFile("apps/web/lib/signedIcsFeeds.ts");
  const signedFeedStaticTest = readWorkspaceFile("apps/web/tests/signed-ics-feed-static.test.ts");
  const routeSource = readWorkspaceFile("apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts");
  const icsRouteTest = readWorkspaceFile("apps/web/tests/ics-feed-route.test.ts");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-055 commands, matrix rows, and artifacts", () => {
    expect(signedIcsFeedRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/calendar typecheck",
      "pnpm --filter @inkroute/calendar test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm vitest run apps/web/tests/ics-feed-route.test.ts",
      "signed ICS token DB integration tests",
      "Apple/Google/Outlook ICS import smoke tests",
    ]);
    expect(signedIcsFeedRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "calendar-typecheck",
      "calendar-tests",
      "web-typecheck",
      "route-tests",
      "token-create-hash",
      "token-persistence",
      "expiry-rotation",
      "revocation-ui",
      "revocation-api",
      "revoked-route-rejection",
      "tenant-artist-scope",
      "access-log-persistence",
      "private-cache-headers",
      "apple-import-smoke",
      "google-import-smoke",
      "outlook-import-smoke",
      "ci-secret-safe-evidence",
    ]);
    expect(signedIcsFeedArtifactPaths).toContain("coverage/signed-ics-feed-runtime.json");
    expect(signedIcsFeedArtifactPaths).toContain("test-results/signed-ics-feed-runtime");
  });

  it("keeps package helper, signed-feed contract, route, and static route tests wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildSignedIcsFeedRuntimeReadinessPlan");
    expect(calendarSource).toContain("buildSignedIcsFeedTokenHash");
    expect(calendarTests).toContain("buildSignedIcsFeedRuntimeReadinessPlan");
    expect(signedFeedSource).toContain("SignedIcsFeedRepository");
    expect(signedFeedSource).toContain("persistAccessLog");
    expect(signedFeedSource).toContain("evaluateSignedIcsFeedRequest");
    expect(signedFeedStaticTest).toContain("plans hashed token creation and revocation");
    expect(routeSource).toContain("evaluateSignedIcsFeedRequest");
    expect(routeSource).toContain("X-InkRoute-Feed-Access-Logged");
    expect(icsRouteTest).toContain("private");
  });

  it("keeps durable repository, revocation, route, access-log, client import, and CI blockers explicit", () => {
    expect(signedIcsFeedRuntimeReadiness.status).toBe("blocked");
    expect(signedIcsFeedRuntimeReadiness.missingScripts).toEqual([]);
    expect(signedIcsFeedRuntimeReadiness.requiredCommands).toEqual([...signedIcsFeedRuntimeCommands]);
    expect(signedIcsFeedRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "revocation UI/API evidence and revoked-token route rejection test output",
      "Apple, Google, and Outlook calendar import smoke-test artifacts",
    ]));
    expect(signedIcsFeedRuntimeReadiness.blockers).toContain("Feed-token revocation UI must be implemented.");
    expect(signedIcsFeedRuntimeReadiness.blockers).toContain("Route tests must reject revoked tokens loaded from durable storage.");
    expect(signedIcsFeedRuntimeReadiness.blockers).toContain("Outlook Calendar import smoke test must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable/client-import readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 signed ICS feed runtime contracts");
    expect(ciWorkflow).toContain("signed-ics-feed-runtime-static.test.ts");
    expect(ciWorkflow).toContain("signed-ics-feed-runtime-artifacts");
    expect(unitManifest).toContain("unit-signed-ics-feed-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/signedIcsFeedsRuntime.ts");
    expect(gapTracker).toContain("GAP-055 is signed-ics-feed-runtime-matrix wired");
    expect(signedIcsFeedArtifactPaths).toContain("coverage/signed-ics-feed-secret-safe-artifacts.json");
  });
});
