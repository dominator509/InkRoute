import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPreferenceCenterEvidenceDecision,
  preferenceCenterArtifactPaths,
  preferenceCenterRuntimeCommands,
  preferenceCenterRuntimeMatrix,
  preferenceCenterRuntimeProofFiles,
  preferenceCenterRuntimeReadiness,
} from "../lib/preferenceCenterRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("preference center runtime contract", () => {
  const notificationsPackageJson = readRepoFile("packages/notifications/package.json");
  const notificationsSource = readRepoFile("packages/notifications/src/index.ts");
  const preferenceSource = readRepoFile("apps/web/lib/preferenceCenter.ts");
  const staticTest = readRepoFile("apps/web/tests/preference-center-static.test.ts");
  const preferencePage = readRepoFile("apps/web/app/preferences/page.tsx");
  const settingsPage = readRepoFile("apps/dashboard/app/settings/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-067 commands, matrix rows, and artifacts", () => {
    expect(preferenceCenterRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/notifications typecheck",
      "pnpm --filter @inkroute/notifications test",
      "pnpm vitest run apps/web/tests/preference-center-static.test.ts",
      "preference center and unsubscribe route/API tests",
      "tenant notification settings dashboard tests",
      "signed preference token forgery and expiry tests",
      "pre-send suppression integration tests",
    ]);
    expect(preferenceCenterRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "notifications-typecheck",
      "notifications-tests",
      "static-contract",
      "route-api",
      "dashboard-settings",
      "signed-token-crypto",
      "token-hash-persistence",
      "token-expiry-forgery-reuse",
      "client-preference-persistence",
      "suppression-persistence",
      "tenant-settings-persistence",
      "audit-log-persistence",
      "idempotency-key",
      "list-unsubscribe-provider",
      "legal-copy",
      "pre-send-suppression",
      "ci-preference-center-job",
      "secret-safe-artifacts",
    ]);
    expect(preferenceCenterArtifactPaths).toContain("coverage/preference-center-runtime.json");
    expect(preferenceCenterArtifactPaths).toContain("test-results/preference-center-runtime");
  });

  it("keeps package helpers, preference contract, pages, dashboard settings, and static guard wired", () => {
    expect(notificationsPackageJson).toContain('"typecheck"');
    expect(notificationsPackageJson).toContain('"test"');
    expect(notificationsSource).toContain("buildPreferenceCenterRuntimeReadinessPlan");
    expect(notificationsSource).toContain("buildPreferenceMutationPlan");
    expect(preferenceSource).toContain("executePreferenceMutation");
    expect(preferenceSource).toContain("buildPreferenceTokenHash");
    expect(preferenceSource).toContain("List-Unsubscribe");
    expect(preferenceSource).toContain("persistPreferenceAudit");
    expect(preferencePage).toContain("Notification preferences");
    expect(settingsPage).toContain("Tenant notification settings");
    expect(staticTest).toContain("raw-token avoidance");
  });

  it("keeps token crypto, persistence, provider headers, legal copy, integration, CI, and artifact blockers explicit", () => {
    expect(preferenceCenterRuntimeReadiness.status).toBe("blocked");
    expect(preferenceCenterRuntimeReadiness.missingScripts).toEqual([]);
    expect(preferenceCenterRuntimeReadiness.requiredEvidence).toEqual(expect.arrayContaining([
      "signed preference token issuance, hash persistence, expiry, and forgery rejection evidence",
      "email unsubscribe, SMS STOP/START, and pre-send suppression persistence evidence",
      "audit, idempotency, legal copy, and route/API test evidence",
    ]));
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Preference token hashes must be persisted instead of raw tokens.");
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Forged, expired, tenant-mismatched, and reused preference tokens must be rejected by tests.");
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Preference, unsubscribe, SMS STOP/START, and tenant settings copy must be legal-approved.");
  });

  it("classifies preference center evidence before GAP-067 can close", () => {
    const blockedDecision = buildPreferenceCenterEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      routeApiTestsPassed: false,
      dashboardSettingsTestsPassed: false,
      signedTokenCryptoVerified: false,
      tokenHashPersistenceVerified: false,
      tokenExpiryForgeryReuseVerified: false,
      clientPreferencePersistenceVerified: false,
      suppressionPersistenceVerified: false,
      tenantSettingsPersistenceVerified: false,
      auditLogPersistenceVerified: false,
      idempotencyKeyVerified: false,
      listUnsubscribeProviderVerified: false,
      legalCopyApproved: false,
      preSendSuppressionVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactReviewPassed: false,
      capturedArtifacts: [
        "coverage/preference-center-runtime.json",
        "coverage/preference-center-notifications-typecheck.txt",
        "coverage/preference-center-notifications-test.txt",
        "coverage/preference-center-static-contract.json",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toContain("Signed preference token crypto evidence is missing.");
    expect(blockedDecision.blockers).toContain("PreferenceToken hash persistence evidence is missing.");
    expect(blockedDecision.blockers).toContain("Token expiry/forgery/reuse rejection evidence is missing.");
    expect(blockedDecision.blockers).toContain("Provider List-Unsubscribe integration evidence is missing.");
    expect(blockedDecision.blockers).toContain("Legal-approved preference/STOP/START/settings copy evidence is missing.");
    expect(blockedDecision.blockers).toContain("Secret-safe preference center artifact review evidence is missing.");
    expect(blockedDecision.missingArtifacts).toContain("coverage/preference-center-token-crypto.json");
    expect(blockedDecision.missingArtifacts).toContain("coverage/preference-center-secret-safe-artifacts.json");
    expect(blockedDecision.requiredCommands).toEqual([...preferenceCenterRuntimeCommands]);
    expect(blockedDecision.requiredEvidence).toContain("secret-safe review of retained preference center artifacts");
    expect(blockedDecision.redactedSummary).toEqual({
      capturedArtifactCount: 4,
      requiredArtifactCount: preferenceCenterArtifactPaths.length,
    });

    const completeDecision = buildPreferenceCenterEvidenceDecision({
      notificationsTypecheckPassed: true,
      notificationsTestsPassed: true,
      staticContractTestsPassed: true,
      routeApiTestsPassed: true,
      dashboardSettingsTestsPassed: true,
      signedTokenCryptoVerified: true,
      tokenHashPersistenceVerified: true,
      tokenExpiryForgeryReuseVerified: true,
      clientPreferencePersistenceVerified: true,
      suppressionPersistenceVerified: true,
      tenantSettingsPersistenceVerified: true,
      auditLogPersistenceVerified: true,
      idempotencyKeyVerified: true,
      listUnsubscribeProviderVerified: true,
      legalCopyApproved: true,
      preSendSuppressionVerified: true,
      ciEvidenceCaptured: true,
      secretSafeArtifactReviewPassed: true,
      capturedArtifacts: preferenceCenterArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming durable preference readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 9 preference center runtime contracts");
    expect(ciWorkflow).toContain("preference-center-runtime-static.test.ts");
    expect(ciWorkflow).toContain("preference-center-runtime-artifacts");
    expect(unitManifest).toContain("unit-preference-center-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/preferenceCenterRuntime.ts");
    expect(gapTracker).toContain("preference center evidence classifier");
    expect(gapTracker).toContain("GAP-067 is preference-center-runtime-matrix wired with evidence classifier");
    expect(preferenceCenterArtifactPaths).toContain("coverage/preference-center-secret-safe-artifacts.json");
  });

  it("pins current preference center proof files for GAP-067", () => {
    expect(preferenceCenterRuntimeProofFiles).toEqual(expect.arrayContaining([
      "packages/notifications/package.json",
      "packages/notifications/src/index.ts",
      "packages/notifications/tests/delivery-plan.test.ts",
      "apps/web/lib/preferenceCenter.ts",
      "apps/web/lib/preferenceCenterRuntime.ts",
      "apps/web/app/api/public/[tenantSlug]/preferences/route.ts",
      "apps/web/app/api/public/[tenantSlug]/unsubscribe/route.ts",
      "apps/web/app/preferences/page.tsx",
      "apps/web/tests/preference-center-static.test.ts",
      "apps/web/tests/preference-center-runtime-static.test.ts",
      "apps/dashboard/app/settings/page.tsx",
      "testing/manifests/unit-test-manifest.json",
      "SECURITY.md",
      ".github/workflows/ci.yml",
    ]));
    for (const file of preferenceCenterRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });
});
