import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMobileCrashArtifactReview,
  buildMobileCrashEvidenceDecision,
  buildMobileCrashExecutionPlan,
  buildRedactedMobileCrashArtifact,
  mobileCrashArtifactPaths,
  mobileCrashEvidenceFlags,
  mobileCrashExecutionPolicy,
  mobileCrashExternalCommands,
  mobileCrashLocalCommands,
  mobileCrashRequiredExternalEvidence,
  mobileCrashRuntimeProofFiles,
  mobileCrashRuntimeCommands,
  mobileCrashRuntimeMatrix,
  mobileCrashRuntimeReadiness,
} from "../src/lib/mobileCrashRuntime";

const root = resolve(__dirname, "../../..");

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("mobile crash runtime contract", () => {
  const observabilityPackageJson = readWorkspaceFile("packages/observability/package.json");
  const observabilitySource = readWorkspaceFile("packages/observability/src/index.ts");
  const observabilityTests = readWorkspaceFile("packages/observability/tests/redaction-report.test.ts");
  const crashSource = readWorkspaceFile("apps/mobile/src/lib/mobileCrash.ts");
  const crashStaticTest = readWorkspaceFile("apps/mobile/tests/mobile-crash-static.test.ts");
  const systemStatusScreen = readWorkspaceFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
  const ciWorkflow = readWorkspaceFile(".github/workflows/ci.yml");
  const unitManifest = readWorkspaceFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readWorkspaceFile("GAP_TRACKER.md");

  it("pins GAP-046 commands, matrix rows, and artifacts", () => {
    expect(mobileCrashRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/mobile typecheck",
      "Expo simulator forced crash smoke test",
      "Expo physical-device forced crash smoke test",
      "Sentry source-map/debug-symbol resolution check",
    ]);
    expect(mobileCrashRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "mobile-typecheck",
      "sentry-expo-credentials",
      "fallback-reporter",
      "release-eas-tags",
      "before-send-redaction",
      "source-map-upload",
      "debug-symbol-upload",
      "simulator-forced-crash",
      "device-forced-crash",
      "error-report-persistence",
      "dashboard-triage-sync",
      "offline-buffering",
      "no-pii-provider-payload",
      "ci-secret-safe-evidence",
    ]);
    expect(mobileCrashArtifactPaths).toContain("coverage/mobile-crash-runtime.json");
    expect(mobileCrashArtifactPaths).toContain("test-results/mobile-crash-runtime");
  });

  it("keeps package helper, sanitized fallback capture, and System screen contract wired", () => {
    expect(observabilityPackageJson).toContain('"typecheck"');
    expect(observabilityPackageJson).toContain('"test"');
    expect(observabilitySource).toContain("buildMobileCrashRuntimeReadinessPlan");
    expect(observabilitySource).toContain("buildSentrySdkConfigurationPlan");
    expect(observabilityTests).toContain("buildMobileCrashRuntimeReadinessPlan");
    expect(crashSource).toContain("buildMobileCrashReportDraft");
    expect(crashSource).toContain("buildMobileCrashCaptureContract");
    expect(crashSource).toContain("MobileCrashReporterAdapter");
    expect(crashSource).toContain("createMobileCrashErrorReportIngestAdapter");
    expect(crashSource).toContain("buildMobileCrashErrorReportPayload");
    expect(crashSource).toContain("buildMobileCrashErrorReportIngestPath");
    expect(crashSource).toContain("/api/public/${encodeURIComponent(tenantSlug)}/error-reports");
    expect(crashSource).toContain('fallbackIngest: "error-report"');
    expect(crashSource).toContain('rawStackOmitted: true');
    expect(crashSource).toContain('gapIds: ["GAP-046", "GAP-081"]');
    expect(crashSource).toContain("bufferOfflineReport(report)");
    expect(crashSource).toContain("persistFallbackReport(report)");
    expect(crashSource).toContain("externalCaptureSucceeded");
    expect(crashSource).toContain("externalCaptureErrorRedacted");
    expect(crashSource).toContain("redactMobileCrashCaptureError");
    expect(crashStaticTest).toContain("persistFallbackReport(report)");
    expect(crashStaticTest).toContain("provider capture fails");
    expect(systemStatusScreen).toContain("Crash capture contract");
    expect(systemStatusScreen).toContain("mobileCrashCapturePreview.contract.localFallbackReady");
    expect(systemStatusScreen).toContain("forced crash proof pending");
  });

  it("keeps provider, symbolication, device, persistence, and privacy blockers explicit", () => {
    expect(mobileCrashRuntimeReadiness.status).toBe("blocked");
    expect(mobileCrashRuntimeReadiness.missingScripts).toEqual([]);
    expect(mobileCrashRuntimeReadiness.requiredCommands).toBe(mobileCrashRuntimeCommands);
    expect(mobileCrashRuntimeReadiness.requiredEvidence).toBe(mobileCrashEvidenceFlags);
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Mobile Sentry DSN must be configured in environment/secret settings.");
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Expo JavaScript source maps must upload for mobile releases.");
    expect(mobileCrashRuntimeReadiness.blockers).toContain("Provider payloads and dashboard summaries must be proven free of raw PII, medical, payment, token, and private URL values.");
  });

  it("classifies GAP-046 as blocked until mobile crash reporting evidence is complete", () => {
    const decision = buildMobileCrashEvidenceDecision({
      commands: ["pnpm --filter @inkroute/observability typecheck"],
      artifacts: ["coverage/mobile-crash-runtime.json"],
      evidence: { observabilityTypecheckPassed: true },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Sentry source-map/debug-symbol resolution check");
    expect(decision.missingArtifacts).toContain("coverage/mobile-crash-secret-safe-artifacts.json");
    expect(decision.missingEvidence).toContain("secretSafeArtifactsCaptured");
    expect(decision.blockers).toContain("Pinned mobile crash commands must be run and captured.");
  });

  it("classifies GAP-046 as complete when all crash reporting commands, artifacts, and evidence are present", () => {
    const decision = buildMobileCrashEvidenceDecision({
      commands: mobileCrashRuntimeCommands,
      artifacts: mobileCrashArtifactPaths,
      evidence: Object.fromEntries(mobileCrashEvidenceFlags.map((flag) => [flag, true])),
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps GAP-046 execution policy non-executing and external evidence explicit", () => {
    const plan = buildMobileCrashExecutionPlan();

    expect(plan.policy).toBe(mobileCrashExecutionPolicy);
    expect(plan.localCommands).toBe(mobileCrashLocalCommands);
    expect(plan.externalCommands).toBe(mobileCrashExternalCommands);
    expect(plan.requiredExternalEvidence).toBe(mobileCrashRequiredExternalEvidence);
    expect(plan.policy.codexMayClassifyStaticMobileCrashReadiness).toBe(true);
    expect(plan.policy.sentryCredentialsRequiredForClosure).toBe(true);
    expect(plan.policy.sourceMapDebugSymbolRequiredForClosure).toBe(true);
    expect(plan.policy.forcedCrashRequiredForClosure).toBe(true);
    expect(plan.policy.errorReportPersistenceRequiredForClosure).toBe(true);
    expect(plan.policy.noPiiProviderPayloadRequiredForClosure).toBe(true);
    expect(plan.policy.secretSafeArtifactsRequiredForClosure).toBe(true);
    expect(plan.commandExecutionAllowed).toBe(false);
    expect(plan.sentryExecutionAllowed).toBe(false);
    expect(plan.sourceMapUploadExecutionAllowed).toBe(false);
    expect(plan.forcedCrashExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.dashboardExecutionAllowed).toBe(false);
    expect(plan.ciExecutionAllowed).toBe(false);
    expect(plan.localCommands).toContain("pnpm --filter @inkroute/observability typecheck");
    expect(plan.externalCommands).toContain("Expo physical-device forced crash smoke test");
    expect(plan.requiredExternalEvidence).toBe(mobileCrashRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("secret-safe mobile crash artifact review");
  });

  it("redacts GAP-046 mobile crash artifacts before secret-safe review", () => {
    const artifact = {
      sentryDsn: "https://private@sentry.example/1",
      authToken: "sentry_private",
      sourceMapUrl: "https://private/source.map",
      deviceCrashPayload: "stack_private",
      nested: {
        clientPhone: "555-0100",
        publicSummary: "mobile crash evidence captured",
      },
      safeNote:
        "evidence_mobile_crash_01HZYXZYXZYXZYXZYXZYXZYXZ wrote artifacts/mobile-crash/private-proof.json",
      safeCrashPath: "test-results/mobile-crash-runtime/private-forced-crash.json",
      safeSentryRun: "sentry_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_mobile_crash",
      reviewerHandle: "reviewer_mobile_crash_owner",
      codeownerSelector: "CODEOWNER:mobile-platform-team",
    };

    const redacted = buildRedactedMobileCrashArtifact(artifact);
    expect(redacted.redactedPaths).toEqual([
      "sentryDsn",
      "authToken",
      "sourceMapUrl",
      "deviceCrashPayload",
      "nested.clientPhone",
      "safeNote",
      "safeCrashPath",
      "safeSentryRun",
      "repositorySelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
    ]);
    expect(redacted.redactedArtifact).toMatchObject({
      sentryDsn: "[REDACTED]",
      authToken: "[REDACTED]",
      sourceMapUrl: "[REDACTED]",
      deviceCrashPayload: "[REDACTED]",
      nested: {
        clientPhone: "[REDACTED]",
        publicSummary: "mobile crash evidence captured",
      },
      safeCrashPath: "[REDACTED]",
      safeSentryRun: "[REDACTED]",
      repositorySelector: "[REDACTED]",
      pullRequestSelector: "[REDACTED]",
      reviewerHandle: "[REDACTED]",
      codeownerSelector: "[REDACTED]",
    });
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "evidence_mobile_crash_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "artifacts/mobile-crash/private-proof.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "test-results/mobile-crash-runtime/private-forced-crash.json",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain(
      "sentry_run_01HZYXZYXZYXZYXZYXZYXZYXZ",
    );
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain("repo:dominator509/InkRoute");
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain("pr_mobile_crash");
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain("reviewer_mobile_crash_owner");
    expect(JSON.stringify(redacted.redactedArtifact)).not.toContain("CODEOWNER:mobile-platform-team");

    const review = buildMobileCrashArtifactReview({
      publicSummary: "safe mobile crash evidence",
      errorReportPayload: "error_private",
    });
    expect(review.secretSafe).toBe(true);
    expect(review.redactedPaths).toEqual(["errorReportPayload"]);
    expect(review.requiredExternalEvidence).toBe(mobileCrashRequiredExternalEvidence);
    expect(review.requiredExternalEvidence).toContain("no-PII provider payload proof");
  });

  it("pins current mobile crash proof files for GAP-046", () => {
    expect(mobileCrashRuntimeProofFiles).toEqual(expect.arrayContaining([
      "apps/mobile/package.json",
      "apps/mobile/src/lib/mobileCrash.ts",
      "apps/mobile/src/lib/mobileCrashRuntime.ts",
      "apps/mobile/src/screens/SystemStatusScreen.tsx",
      "apps/mobile/tests/mobile-crash-static.test.ts",
      "apps/mobile/tests/mobile-crash-runtime-static.test.ts",
      "packages/observability/package.json",
      "packages/observability/src/index.ts",
      "packages/observability/tests/redaction-report.test.ts",
      "testing/manifests/unit-test-manifest.json",
      ".github/workflows/ci.yml",
    ]));
    for (const file of mobileCrashRuntimeProofFiles) {
      expect(readWorkspaceFile(file).length).toBeGreaterThan(0);
    }
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider/device readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 11 mobile crash runtime contracts");
    expect(ciWorkflow).toContain("mobile-crash-runtime-static.test.ts");
    expect(ciWorkflow).toContain("mobile-crash-runtime-artifacts");
    expect(unitManifest).toContain("unit-mobile-crash-runtime-static");
    expect(gapTracker).toContain("apps/mobile/src/lib/mobileCrashRuntime.ts");
    expect(gapTracker).toContain("GAP-046 is mobile-crash-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildMobileCrashExecutionPlan");
    expect(gapTracker).toContain("ErrorReport ingest handoff contract");
    expect(gapTracker).toContain("keep the fallback adapter pointed at persisted ErrorReport ingest");
    expect(gapTracker).toContain("mobileCrashExecutionPolicy");
    expect(gapTracker).toContain("mobileCrashLocalCommands/mobileCrashExternalCommands");
    expect(gapTracker).toContain("mobileCrashRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedMobileCrashArtifact");
    expect(gapTracker).toContain("buildMobileCrashArtifactReview");
    expect(mobileCrashArtifactPaths).toContain("coverage/mobile-crash-secret-safe-artifacts.json");
  });
});

