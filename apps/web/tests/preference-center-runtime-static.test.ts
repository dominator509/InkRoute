import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPreferenceCenterArtifactReview,
  buildPreferenceCenterEvidenceDecision,
  buildPreferenceCenterExecutionPlan,
  buildRedactedPreferenceCenterArtifact,
  preferenceCenterDecisionRequiredEvidence,
  preferenceCenterExternalCommands,
  preferenceCenterExecutionPolicy,
  preferenceCenterArtifactPaths,
  preferenceCenterLocalCommands,
  preferenceCenterRequiredExternalEvidence,
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
    expect(preferenceSource).toContain("createInMemoryPreferenceRepository");
    expect(preferenceSource).toContain("buildRedactedPreferenceMetadata");
    expect(preferenceSource).toContain("buildPreferenceTokenHash");
    expect(preferenceSource).toContain("List-Unsubscribe");
    expect(preferenceSource).toContain("persistPreferenceAudit");
    expect(preferencePage).toContain("Notification preferences");
    expect(settingsPage).toContain("Tenant notification settings");
    expect(staticTest).toContain("raw-token avoidance");
    expect(staticTest).toContain("redacts nested preference metadata");
    expect(staticTest).toContain("executes a local preference repository contract");
  });

  it("keeps token crypto, persistence, provider headers, legal copy, integration, CI, and artifact blockers explicit", () => {
    expect(preferenceCenterRuntimeReadiness.status).toBe("blocked");
    expect(preferenceCenterRuntimeReadiness.missingScripts).toEqual([]);
    expect(preferenceCenterRuntimeReadiness.requiredEvidence).toBe(preferenceCenterDecisionRequiredEvidence);
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Preference token hashes must be persisted instead of raw tokens.");
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Forged, expired, tenant-mismatched, and reused preference tokens must be rejected by tests.");
    expect(preferenceCenterRuntimeReadiness.blockers).toContain("Preference, unsubscribe, SMS STOP/START, and tenant settings copy must be legal-approved.");
  });

  it("pins the non-executing GAP-067 preference center execution policy", () => {
    const plan = buildPreferenceCenterExecutionPlan();

    expect(preferenceCenterExecutionPolicy).toEqual({
      codexMayClassifyStaticPreferenceCenterReadiness: true,
      localCommandEvidenceRequiredForClosure: true,
      routeApiEvidenceRequiredForClosure: true,
      signedTokenCryptoRequiredForClosure: true,
      tokenHashPersistenceRequiredForClosure: true,
      durablePreferencePersistenceRequiredForClosure: true,
      listUnsubscribeProviderRequiredForClosure: true,
      legalCopyRequiredForClosure: true,
      preSendSuppressionRequiredForClosure: true,
      ciEvidenceRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(plan.policy).toBe(preferenceCenterExecutionPolicy);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.routeApiExecutionAllowed).toBe(false);
    expect(plan.tokenCryptoExecutionAllowed).toBe(false);
    expect(plan.durablePersistenceExecutionAllowed).toBe(false);
    expect(plan.providerIntegrationExecutionAllowed).toBe(false);
    expect(plan.legalApprovalExecutionAllowed).toBe(false);
    expect(plan.preSendSuppressionExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.artifactReviewExecutionAllowed).toBe(false);
    expect(plan.localCommands).toBe(preferenceCenterLocalCommands);
    expect(plan.externalCommands).toBe(preferenceCenterExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(preferenceCenterRequiredExternalEvidence);
    expect(preferenceCenterRequiredExternalEvidence).toEqual([
      "actual preference center command output",
      "preference center and unsubscribe route/API tests",
      "tenant notification settings dashboard tests",
      "signed preference token crypto evidence",
      "token hash persistence evidence",
      "token expiry/forgery/reuse rejection evidence",
      "durable ClientNotificationPreference/SuppressionListEntry/TenantNotificationSetting/NotificationAuditLog/IdempotencyKey evidence",
      "provider List-Unsubscribe and one-click unsubscribe evidence",
      "legal-approved preference/STOP/START/settings copy",
      "pre-send suppression integration tests",
      "CI preference center artifacts",
      "secret-safe preference center artifact review",
    ]);
  });

  it("pins recursive preference center artifact redaction and review", () => {
    const redacted = buildRedactedPreferenceCenterArtifact({
      tenantId: "tenant_private",
      preferenceTokenHash: "hash_private",
      unsubscribeDestinationEmail: "client@example.test",
      legalCopyApprovalUrl: "https://private/legal",
      publicSummary: "preference center evidence captured",
      nested: {
        suppressionPhoneNumber: "+15555550100",
        publicStatus: "suppressed",
      },
    });

    expect(redacted.secretSafe).toBe(true);
    expect(redacted.redactedPaths).toEqual([
      "tenantId",
      "preferenceTokenHash",
      "unsubscribeDestinationEmail",
      "legalCopyApprovalUrl",
      "nested.suppressionPhoneNumber",
    ]);
    expect(redacted.artifact).toEqual({
      tenantId: "[redacted]",
      preferenceTokenHash: "[redacted]",
      unsubscribeDestinationEmail: "[redacted]",
      legalCopyApprovalUrl: "[redacted]",
      publicSummary: "preference center evidence captured",
      nested: {
        suppressionPhoneNumber: "[redacted]",
        publicStatus: "suppressed",
      },
    });

    const review = buildPreferenceCenterArtifactReview({
      publicSummary: "safe preference center artifact",
      rawUnsubscribeToken: "token_private",
    });

    expect(review.passed).toBe(true);
    expect(review.blockers).toEqual([]);
    expect(review.artifact.secretSafe).toBe(true);
    expect(review.artifact.redactedPaths).toEqual(["rawUnsubscribeToken"]);
    expect(review.requiredExternalEvidence).toBe(preferenceCenterRequiredExternalEvidence);
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
    expect(blockedDecision.requiredCommands).toBe(preferenceCenterRuntimeCommands);
    expect(blockedDecision.requiredEvidence).toBe(preferenceCenterDecisionRequiredEvidence);
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
    expect(gapTracker).toContain("buildPreferenceCenterExecutionPlan");
    expect(gapTracker).toContain("preferenceCenterDecisionRequiredEvidence");
    expect(gapTracker).toContain("preferenceCenterExecutionPolicy");
    expect(gapTracker).toContain("preferenceCenterRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPreferenceCenterArtifact");
    expect(gapTracker).toContain("buildPreferenceCenterArtifactReview");
    expect(gapTracker).toContain("non-executing preference center execution policy");
    expect(gapTracker).toContain("local in-memory preference repository contract");
    expect(gapTracker).toContain("preference metadata sanitizer");
    expect(gapTracker).toContain("GAP-067 is preference-center-runtime-matrix wired with preference center evidence classifier");
    expect(notificationsSource).toContain("Client preference center page evidence must be captured before preference readiness.");
    expect(notificationsSource).toContain("One-click email unsubscribe page evidence must be captured before preference readiness.");
    expect(notificationsSource).toContain("Preference mutation API route evidence must be captured before preference readiness.");
    expect(notificationsSource).toContain("Tenant channel settings dashboard UI evidence must be captured before preference readiness.");
    expect(notificationsSource).not.toContain("Client preference center page must be implemented.");
    expect(notificationsSource).not.toContain("One-click email unsubscribe page must be implemented.");
    expect(notificationsSource).not.toContain("Preference mutation API routes must be implemented.");
    expect(notificationsSource).not.toContain("Tenant channel settings dashboard UI must be implemented.");
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

