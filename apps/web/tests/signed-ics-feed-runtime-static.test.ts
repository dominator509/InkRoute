import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildRedactedSignedIcsFeedArtifact,
  buildSignedIcsFeedEvidenceDecision,
  buildSignedIcsFeedExecutionPlan,
  buildSignedIcsFeedArtifactReview,
  signedIcsFeedDecisionRequiredEvidence,
  signedIcsFeedExternalCommands,
  signedIcsFeedExecutionPolicy,
  signedIcsFeedArtifactPaths,
  signedIcsFeedLocalCommands,
  signedIcsFeedRequiredExternalEvidence,
  signedIcsFeedRuntimeCommands,
  signedIcsFeedRuntimeMatrix,
  signedIcsFeedRuntimeProofFiles,
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
  const signedFeedRevocationPanel = readWorkspaceFile("apps/dashboard/components/SignedIcsFeedRevocationPanel.tsx");
  const dashboardCalendarPage = readWorkspaceFile("apps/dashboard/app/calendar/page.tsx");
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

  it("pins current signed ICS feed proof files for GAP-055", () => {
    expect(signedIcsFeedRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/web/package.json",
      "packages/calendar/package.json",
      "packages/calendar/src/index.ts",
      "packages/calendar/tests/availability-conflicts.test.ts",
      "apps/web/lib/signedIcsFeeds.ts",
      "apps/web/lib/signedIcsFeedsRuntime.ts",
      "apps/dashboard/components/SignedIcsFeedRevocationPanel.tsx",
      "apps/dashboard/app/calendar/page.tsx",
      "apps/web/tests/signed-ics-feed-static.test.ts",
      "apps/web/tests/signed-ics-feed-runtime-static.test.ts",
      "apps/web/tests/ics-feed-route.test.ts",
      "apps/web/app/api/public/[tenantSlug]/calendar/[artistSlug]/travel.ics/route.ts",
      "packages/db/prisma/schema.prisma",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of signedIcsFeedRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps package helper, signed-feed contract, route, and static route tests wired", () => {
    expect(calendarPackageJson).toContain('"typecheck"');
    expect(calendarPackageJson).toContain('"test"');
    expect(calendarSource).toContain("buildSignedIcsFeedRuntimeReadinessPlan");
    expect(calendarSource).toContain("buildSignedIcsFeedTokenHash");
    expect(calendarTests).toContain("buildSignedIcsFeedRuntimeReadinessPlan");
    expect(signedFeedSource).toContain("SignedIcsFeedRepository");
    expect(signedFeedSource).toContain("createInMemorySignedIcsFeedRepository");
    expect(signedFeedSource).toContain("createPrismaSignedIcsFeedRepository");
    expect(signedFeedSource).toContain("persistAccessLog");
    expect(signedFeedSource).toContain("evaluateSignedIcsFeedRequest");
    expect(signedFeedSource).toContain("revocationUiImplemented: true");
    expect(signedFeedRevocationPanel).toContain("Plan revocation payload");
    expect(signedFeedRevocationPanel).toContain("already-hashed signed-feed token");
    expect(signedFeedRevocationPanel).toContain("never raw feed tokens");
    expect(dashboardCalendarPage).toContain("SignedIcsFeedRevocationPanel");
    expect(signedFeedStaticTest).toContain("plans hashed token creation and revocation");
    expect(signedFeedStaticTest).toContain("executes a local signed-feed repository contract");
    expect(routeSource).toContain("evaluateSignedIcsFeedRequest");
    expect(routeSource).toContain("X-InkRoute-Feed-Access-Logged");
    expect(icsRouteTest).toContain("private");
  });

  it("keeps durable repository, revocation, route, access-log, client import, and CI blockers explicit", () => {
    expect(signedIcsFeedRuntimeReadiness.status).toBe("blocked");
    expect(signedIcsFeedRuntimeReadiness.missingScripts).toEqual([]);
    expect(signedIcsFeedRuntimeReadiness.requiredCommands).toBe(signedIcsFeedRuntimeCommands);
    expect(signedIcsFeedRuntimeReadiness.requiredEvidence).toBe(signedIcsFeedDecisionRequiredEvidence);
    expect(signedIcsFeedRuntimeReadiness.blockers).not.toContain("Feed-token revocation UI/API proof must be captured before signed ICS feed readiness.");
    expect(signedIcsFeedRuntimeReadiness.blockers).not.toContain("Feed-token revocation UI must be implemented.");
    expect(signedIcsFeedRuntimeReadiness.blockers).toContain("Route tests must reject revoked tokens loaded from durable storage.");
    expect(signedIcsFeedRuntimeReadiness.blockers).toContain("Outlook Calendar import smoke test must pass.");
  });

  it("classifies durable signed ICS evidence before GAP-055 can close", () => {
    const blockedDecision = buildSignedIcsFeedEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      webTypecheckPassed: true,
      routeTestsPassed: true,
      tokenCreateHashVerified: true,
      tokenPersistenceVerified: false,
      expiryRotationVerified: false,
      revocationUiVerified: false,
      revocationApiVerified: true,
      revokedRouteRejectionVerified: false,
      tenantArtistScopeVerified: true,
      accessLogPersistenceVerified: false,
      privateCacheHeadersVerified: true,
      appleImportSmokePassed: false,
      googleImportSmokePassed: false,
      outlookImportSmokePassed: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/signed-ics-feed-runtime.json",
        "coverage/signed-ics-feed-calendar-typecheck.txt",
        "coverage/signed-ics-feed-calendar-test.txt",
        "coverage/signed-ics-feed-web-typecheck.txt",
        "coverage/signed-ics-feed-route-tests.json",
        "coverage/signed-ics-feed-token-create-hash.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Durable signed feed token persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Feed-token revocation UI evidence is missing.");
    expect(blockedDecision.blockers).toContain(
      "Revoked-token route rejection from durable storage evidence is missing.",
    );
    expect(blockedDecision.blockers).toContain("Outlook Calendar ICS import smoke evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe signed ICS artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/signed-ics-feed-token-persistence.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/signed-ics-feed-outlook-import-redacted.json");
    expect(blockedDecision.requiredCommands).toBe(signedIcsFeedRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(signedIcsFeedDecisionRequiredEvidence);
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 6,
      requiredArtifactCount: signedIcsFeedArtifactPaths.length,
    });

    const completeDecision = buildSignedIcsFeedEvidenceDecision({
      calendarTypecheckPassed: true,
      calendarTestsPassed: true,
      webTypecheckPassed: true,
      routeTestsPassed: true,
      tokenCreateHashVerified: true,
      tokenPersistenceVerified: true,
      expiryRotationVerified: true,
      revocationUiVerified: true,
      revocationApiVerified: true,
      revokedRouteRejectionVerified: true,
      tenantArtistScopeVerified: true,
      accessLogPersistenceVerified: true,
      privateCacheHeadersVerified: true,
      appleImportSmokePassed: true,
      googleImportSmokePassed: true,
      outlookImportSmokePassed: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: signedIcsFeedArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("keeps GAP-055 execution policy non-executing and external evidence explicit", () => {
    const plan = buildSignedIcsFeedExecutionPlan();

    expect(plan.policy).toBe(signedIcsFeedExecutionPolicy);
    expect(plan.policy.codexMayClassifyStaticSignedIcsReadiness).toBe(true);
    expect(plan.policy.durableTokenPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.revocationUiApiRequiredForClosure).toBe(true);
    expect(plan.policy.revokedRouteRejectionRequiredForClosure).toBe(true);
    expect(plan.policy.accessLogPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.calendarClientImportRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.databaseExecutionAllowed).toBe(false);
    expect(plan.revocationUiExecutionAllowed).toBe(false);
    expect(plan.routeExecutionAllowed).toBe(false);
    expect(plan.calendarClientExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(signedIcsFeedLocalCommands);
    expect(plan.externalCommands).toBe(signedIcsFeedExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(signedIcsFeedRequiredExternalEvidence);
  });

  it("redacts GAP-055 signed ICS artifacts before secret-safe review", () => {
    const artifact = {
      signedFeedToken: "feed_private",
      tenantDomain: "tenant.example.test",
      artistCalendarUrl: "https://private/calendar.ics",
      accessLogClientEmail: "client@example.test",
      nested: {
        outlookImportUrl: "https://private/outlook",
        publicSummary: "signed ICS feed evidence captured",
      },
    };

    const redacted = buildRedactedSignedIcsFeedArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "signedFeedToken",
      "tenantDomain",
      "artistCalendarUrl",
      "accessLogClientEmail",
      "nested.outlookImportUrl",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      signedFeedToken: "[REDACTED]",
      tenantDomain: "[REDACTED]",
      artistCalendarUrl: "[REDACTED]",
      accessLogClientEmail: "[REDACTED]",
      nested: {
        outlookImportUrl: "[REDACTED]",
        publicSummary: "signed ICS feed evidence captured",
      },
    });

    const review = buildSignedIcsFeedArtifactReview({
      publicSummary: "safe signed ICS evidence",
      revocationTokenHash: "hash_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["revocationTokenHash"]);
    expect(review.requiredExternalEvidence).toBe(signedIcsFeedRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable/client-import readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 8 signed ICS feed runtime contracts");
    expect(ciWorkflow).toContain("signed-ics-feed-runtime-static.test.ts");
    expect(ciWorkflow).toContain("signed-ics-feed-runtime-artifacts");
    expect(unitManifest).toContain("unit-signed-ics-feed-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/signedIcsFeedsRuntime.ts");
    expect(gapTracker).toContain("durable/client-import evidence classifier");
    expect(gapTracker).toContain("signedIcsFeedDecisionRequiredEvidence");
    expect(gapTracker).toContain("local signed-feed repository contract");
    expect(gapTracker).toContain("createPrismaSignedIcsFeedRepository");
    expect(gapTracker).toContain("GAP-055 is signed-ics-feed-runtime-matrix wired with durable/client-import evidence classifier");
    expect(gapTracker).toContain("buildSignedIcsFeedExecutionPlan");
    expect(gapTracker).toContain("signedIcsFeedExecutionPolicy");
    expect(gapTracker).toContain("signedIcsFeedRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedSignedIcsFeedArtifact");
    expect(gapTracker).toContain("buildSignedIcsFeedArtifactReview");
    expect(signedIcsFeedArtifactPaths).toContain("coverage/signed-ics-feed-secret-safe-artifacts.json");
  });
});

