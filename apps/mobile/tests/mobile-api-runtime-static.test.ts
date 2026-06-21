import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileApiArtifactReview,
  buildMobileApiEvidenceDecision,
  buildMobileApiExecutionPlan,
  buildRedactedMobileApiArtifact,
  mobileApiArtifactPaths,
  mobileApiDomains,
  mobileApiEvidenceFlags,
  mobileApiExternalCommands,
  mobileApiExecutionPolicy,
  mobileApiLocalCommands,
  mobileApiRequiredExternalEvidence,
  mobileApiRuntimeProofFiles,
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
    expect(mobileSupportSource).toContain("buildMobileBookingLifecycleActionContract");
    expect(mobileSupportTests).toContain("buildMobileApiRuntimeReadinessPlan");
    expect(mobileSupportTests).toContain("buildMobileBookingLifecycleActionContract");
    expect(apiClientSource).toContain("buildMobileApiClientRequestPlan");
    expect(apiClientSource).toContain("assertMobileApiEnvelope");
    expect(apiClientSource).toContain("redactMobileApiError");
    expect(apiClientStaticTest).toContain("validates response envelopes before screens consume data");
    expect(homeScreen).toContain("API sync contract");
    expect(bookingScreen).toContain("Typed client ready");
    expect(bookingScreen).toContain("lifecycle contract ready");
  });

  it("keeps runtime blockers explicit until provider auth, seeded smoke, denial, offline replay, and device evidence exists", () => {
    expect(mobileApiRuntimeReadiness.status).toBe("blocked");
    expect(mobileApiRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileApiRuntimeReadiness.missingScreenDomains).toEqual([]);
    expect(mobileApiRuntimeReadiness.requiredCommands).toBe(mobileApiRuntimeCommands);
    expect(mobileApiRuntimeReadiness.requiredEvidence).toBe(mobileApiEvidenceFlags);
    expect(mobileApiRuntimeReadiness.requiredEvidence).toEqual(mobileApiEvidenceFlags);
    expect(mobileApiRuntimeReadiness.blockers).toContain("@inkroute/mobile-support API/sync tests must pass.");
    expect(mobileApiRuntimeReadiness.blockers).toContain("Offline-aware retry queue must handle mobile mutations.");
    expect(mobileApiRuntimeReadiness.blockers).toContain("Mobile API tests must reject cross-tenant reads and writes.");
  });

  it("classifies GAP-043 as blocked until mobile API sync evidence is complete", () => {
    const decision = buildMobileApiEvidenceDecision({
      commands: ["pnpm --filter @inkroute/mobile-support typecheck"],
      artifacts: ["coverage/mobile-api-runtime.json"],
      domains: ["bookings"],
      evidence: { mobileSupportTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("offline reconnect/replay mobile test");
    expect(decision.missingArtifacts).toContain("coverage/mobile-api-secret-safe-artifacts.json");
    expect(decision.missingDomains).toContain("releases");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Every mobile screen domain must use the typed tenant-scoped API client.");
  });

  it("classifies GAP-043 as complete when all mobile API commands, domains, artifacts, and evidence are present", () => {
    const decision = buildMobileApiEvidenceDecision({
      commands: mobileApiRuntimeCommands,
      artifacts: mobileApiArtifactPaths,
      domains: mobileApiDomains,
      evidence: Object.fromEntries(mobileApiEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingDomains).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-043 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobileApiExecutionPlan();

    expect(plan.policy).toBe(mobileApiExecutionPolicy);
    expect(plan.requiredExternalEvidence).toBe(mobileApiRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobileApiReadiness).toBe(true);
    expect(plan.policy.providerTokenExchangeRequiredForClosure).toBe(true);
    expect(plan.policy.seededApiSmokeRequiredForClosure).toBe(true);
    expect(plan.policy.screenDataReplacementRequiredForClosure).toBe(true);
    expect(plan.policy.denialEvidenceRequiredForClosure).toBe(true);
    expect(plan.policy.offlineReplayRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.providerTokenExecutionAllowed).toBe(false);
    expect(plan.seededApiExecutionAllowed).toBe(false);
    expect(plan.screenReplacementExecutionAllowed).toBe(false);
    expect(plan.denialExecutionAllowed).toBe(false);
    expect(plan.offlineReplayExecutionAllowed).toBe(false);
    expect(plan.deviceExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(mobileApiLocalCommands);
    expect(plan.externalCommands).toBe(mobileApiExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(mobileApiRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile API artifact review");
  });

  it("redacts GAP-043 mobile API artifacts before secret-safe review", () => {
    const artifact = {
      tenantId: "tenant_private",
      providerToken: "provider_private",
      requestUrl: "https://tenant.example.test/api/private",
      idempotencyKey: "idem_private",
      nested: {
        offlineReplayPayload: "mutation_private",
        publicSummary: "mobile API sync evidence captured",
      },
    };

    const redacted = buildRedactedMobileApiArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "providerToken",
      "requestUrl",
      "idempotencyKey",
      "nested.offlineReplayPayload",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      tenantId: "[REDACTED]",
      providerToken: "[REDACTED]",
      requestUrl: "[REDACTED]",
      idempotencyKey: "[REDACTED]",
      nested: {
        offlineReplayPayload: "[REDACTED]",
        publicSummary: "mobile API sync evidence captured",
      },
    });

    const review = buildMobileApiArtifactReview({
      publicSummary: "safe mobile API evidence",
      authorizationHeader: "Bearer private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["authorizationHeader"]);
    expect(review.requiredExternalEvidence).toBe(mobileApiRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("offline reconnect/replay evidence");
  });

  it("pins current mobile API proof files for GAP-043", () => {
    expect(mobileApiRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "packages/mobile/package.json",
      "packages/mobile/src/index.ts",
      "packages/mobile/tests/mobile-support.test.ts",
      "apps/mobile/src/lib/mobileApiClient.ts",
      "apps/mobile/src/lib/mobileApiRuntime.ts",
      "apps/mobile/tests/mobile-api-client-static.test.ts",
      "apps/mobile/tests/mobile-api-runtime-static.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of mobileApiRuntimeProofFiles) {
      expect(readWorkspaceFile(file).toLowerCase()).toContain("mobile");
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming live mobile sync readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 6 mobile API sync runtime contracts");
    expect(ciWorkflow).toContain("mobile-api-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-api-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-api-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileApiRuntime.ts");
    expect(gapTracker).toContain("GAP-043 is mobile-api-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobileApiExecutionPlan");
    expect(gapTracker).toContain("mobileApiExecutionPolicy");
    expect(gapTracker).toContain("mobileApiRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedMobileApiArtifact");
    expect(gapTracker).toContain("buildMobileApiArtifactReview");
    expect(mobileApiArtifactPaths).toContain("coverage/mobile-api-secret-safe-artifacts.json");
  });
});

