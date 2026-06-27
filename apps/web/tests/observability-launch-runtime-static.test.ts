import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { observabilityLaunchRequiredEvidence } from "@inkroute/observability";
import {
  buildObservabilityLaunchArtifactReview,
  buildObservabilityLaunchEvidenceDecision,
  buildObservabilityLaunchExecutionPlan,
  buildObservabilityLaunchRunData,
  buildRedactedObservabilityLaunchArtifact,
  observabilityLaunchArtifactPaths,
  observabilityLaunchExternalArtifacts,
  observabilityLaunchExternalCommands,
  observabilityLaunchExecutionPolicy,
  observabilityLaunchLocalArtifacts,
  observabilityLaunchLocalCommands,
  observabilityLaunchRequiredExternalEvidence,
  observabilityLaunchRunPersistenceContract,
  observabilityLaunchRuntimeCommands,
  observabilityLaunchRuntimeControls,
  observabilityLaunchRuntimeMatrix,
  observabilityLaunchRuntimeProofFiles,
  observabilityLaunchRuntimeReadiness,
  persistObservabilityLaunchRun,
} from "../lib/observabilityLaunchRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("observability launch runtime contract", () => {
  const observabilityPackageJson = readRepoFile("packages/observability/package.json");
  const observabilitySource = readRepoFile("packages/observability/src/index.ts");
  const observabilityTests = readRepoFile("packages/observability/tests/redaction-report.test.ts");
  const dashboardErrorReportRoute = readRepoFile("apps/dashboard/app/api/error-reports/route.ts");
  const dashboardErrorReportTest = readRepoFile("apps/dashboard/tests/error-report-route-static.test.ts");
  const webGlobalError = readRepoFile("apps/web/app/global-error.tsx");
  const dashboardGlobalError = readRepoFile("apps/dashboard/app/global-error.tsx");
  const mobileStatusScreen = readRepoFile("apps/mobile/src/screens/SystemStatusScreen.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const observabilityLaunchMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033500_add_observability_launch_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins observability launch commands, controls, matrix rows, and artifacts", () => {
    expect(observabilityLaunchRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "Sentry web/dashboard/mobile SDK configuration smoke",
      "OpenTelemetry exporter and structured logging smoke",
      "source-map and debug-symbol resolution check",
      "forced web/dashboard/API/webhook/mobile capture smoke",
      "tenant-isolated ErrorReport dashboard triage test",
      "Sentry/provider webhook replay, alert routing, and release linkage tests",
      "redaction/no-PII observability artifact review",
      "GitHub Actions observability launch evidence job",
      "secret-safe observability artifact review",
    ]);
    expect(observabilityLaunchRuntimeControls).toContain("redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard");
    expect(observabilityLaunchRuntimeControls).toContain("provider-webhook-signature-and-replay-verification-before-sentry-reconciliation");
    expect(observabilityLaunchRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "observability-typecheck",
      "observability-tests",
      "web-dashboard-mobile-build-gates",
      "sentry-sdk-runtime-configuration",
      "otel-structured-logging",
      "source-map-debug-symbol-resolution",
      "forced-capture-smokes",
      "error-report-persistence-triage",
      "provider-webhook-replay-alerts-release-linkage",
      "redaction-ci-secret-safe-artifacts",
    ]);
    expect(observabilityLaunchArtifactPaths).toContain("coverage/observability-launch-runtime.json");
    expect(observabilityLaunchArtifactPaths).toContain("test-results/observability-launch-runtime");
  });

  it("pins observability launch runtime control helper identity", () => {
    const decision = buildObservabilityLaunchEvidenceDecision({
      commands: observabilityLaunchRuntimeCommands,
      artifacts: observabilityLaunchArtifactPaths,
      controls: observabilityLaunchRuntimeControls,
      evidence: Object.fromEntries(
        observabilityLaunchRunPersistenceContract.evidenceBooleans.map((flag) => [flag, true]),
      ) as Record<(typeof observabilityLaunchRunPersistenceContract.evidenceBooleans)[number], true>,
    });

    expect(decision.requiredControls).toBe(observabilityLaunchRuntimeControls);
    expect(gapTracker).toContain("observabilityLaunchRuntimeControls");
  });

  it("pins the ObservabilityLaunchRun persistence model and migration", () => {
    const runData = buildObservabilityLaunchRunData({
      tenantId: "tenant_static",
      runId: "observability_static",
      commitSha: "abc123",
      status: "blocked",
      controls: ["redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard"],
      artifacts: [
        "coverage/observability-launch-runtime.json",
        "coverage/observability-typecheck.txt",
      ],
      observabilityTypecheckPassed: true,
      observabilityTestsPassed: false,
      webBuildPassed: false,
      dashboardBuildPassed: false,
      mobileTypecheckPassed: false,
      sentryWebSdkConfigured: false,
      sentryDashboardSdkConfigured: false,
      sentryMobileSdkConfigured: false,
      openTelemetryExporterConfigured: false,
      structuredLoggingConfigured: false,
      sourceMapsUploaded: false,
      mobileDebugSymbolsUploaded: false,
      forcedWebCaptureVerified: false,
      forcedDashboardCaptureVerified: false,
      forcedApiCaptureVerified: false,
      forcedWebhookCaptureVerified: false,
      forcedMobileCrashVerified: false,
      errorReportPersistenceConfigured: false,
      dashboardTenantTriageReadsVerified: false,
      sentryWebhookSignatureReplayVerified: false,
      alertRoutingVerified: false,
      releaseIncidentLinkageVerified: false,
      redactionNoPiiVerified: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: false,
      observabilityTypecheckArtifactPath: "coverage/observability-typecheck.txt",
    });

    expect(observabilityLaunchRunPersistenceContract.model).toBe("ObservabilityLaunchRun");
    expect(observabilityLaunchRunPersistenceContract.tenantRelation).toBe("observabilityLaunchRuns");
    expect(observabilityLaunchRunPersistenceContract.migration).toBe("20260609033500_add_observability_launch_runs");
    expect(observabilityLaunchRunPersistenceContract.jsonFields).toEqual([
      "commandMatrix",
      "controlManifest",
      "artifactManifest",
      "sdkConfigurationManifest",
      "captureEvidenceManifest",
      "alertReleaseManifest",
    ]);
    expect(observabilityLaunchRunPersistenceContract.evidenceBooleans).toContain("sentryWebSdkConfigured");
    expect(observabilityLaunchRunPersistenceContract.evidenceBooleans).toContain("forcedWebhookCaptureVerified");
    expect(observabilityLaunchRunPersistenceContract.evidenceBooleans).toContain("secretSafeArtifactsCaptured");
    expect(observabilityLaunchRunPersistenceContract.artifactFields).toContain("sourceMapsDebugSymbolsArtifactPath");
    expect(observabilityLaunchRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("observabilityLaunchRuns ObservabilityLaunchRun[]");
    expect(prismaSchema).toContain("model ObservabilityLaunchRun");
    expect(prismaSchema).toContain("sdkConfigurationManifest");
    expect(prismaSchema).toContain("releaseIncidentLinkageVerified");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(observabilityLaunchMigration).toContain('CREATE TABLE "ObservabilityLaunchRun"');
    expect(observabilityLaunchMigration).toContain('"captureEvidenceManifest" JSONB NOT NULL');
    expect(observabilityLaunchMigration).toContain('"secretSafeArtifactsCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(observabilityLaunchMigration).toContain('CREATE UNIQUE INDEX "ObservabilityLaunchRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "observability_static",
      commitSha: "abc123",
      status: "blocked",
      observabilityTypecheckPassed: true,
      sentryWebSdkConfigured: false,
      observabilityTypecheckArtifactPath: "coverage/observability-typecheck.txt",
    });
    expect(runData.commandMatrix).toBe(observabilityLaunchRuntimeMatrix);
    expect(runData.controlManifest).toEqual([
      "redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard",
    ]);
    expect(runData.sdkConfigurationManifest.sentryWebSdkConfigured).toBe(false);
    expect(String(persistObservabilityLaunchRun)).toContain("repository.observabilityLaunchRun.upsert");
  });

  it("keeps helper, package scripts, dashboard triage, and crash surfaces wired", () => {
    expect(observabilityPackageJson).toContain('"typecheck"');
    expect(observabilityPackageJson).toContain('"test"');
    expect(observabilitySource).toContain("buildObservabilityLaunchEvidencePlan");
    expect(observabilityTests).toContain("buildObservabilityLaunchEvidencePlan");
    expect(dashboardErrorReportRoute).toContain("error:read");
    expect(dashboardErrorReportRoute).toContain("AuditLog");
    expect(dashboardErrorReportTest).toContain("metadata redaction");
    expect(webGlobalError).toContain("ErrorBoundary");
    expect(dashboardGlobalError).toContain("ErrorBoundary");
    expect(mobileStatusScreen).toContain("Crash reporting");
  });

  it("keeps observability runtime blockers explicit until provider evidence exists", () => {
    expect(observabilityLaunchRuntimeReadiness.status).toBe("blocked");
    expect(observabilityLaunchRuntimeReadiness.missingScripts).toEqual([]);
    expect(observabilityLaunchRuntimeReadiness.requiredCommands).toBe(observabilityLaunchRuntimeCommands);
    expect(observabilityLaunchRuntimeReadiness.requiredControls).toBe(observabilityLaunchRuntimeControls);
    expect(observabilityLaunchRuntimeReadiness.requiredEvidence).toBe(observabilityLaunchRequiredEvidence);
    expect(observabilityLaunchRuntimeReadiness.blockers).toContain(
      "Sentry web SDK must be configured for public web runtime.",
    );
    expect(observabilityLaunchRuntimeReadiness.blockers).toContain(
      "Forced webhook error capture must be verified without trusting unsigned provider payloads.",
    );
  });

  it("blocks observability launch completion when runtime evidence is missing", () => {
    const decision = buildObservabilityLaunchEvidenceDecision({
      commands: ["pnpm --filter @inkroute/observability typecheck"],
      artifacts: ["coverage/observability-typecheck.txt"],
      controls: ["redaction-before-capture-persistence-alerting-issue-handoff-telemetry-dashboard"],
      evidence: {
        observabilityTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Sentry/provider webhook replay, alert routing, and release linkage tests");
    expect(decision.missingArtifacts).toContain("coverage/observability-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("provider-webhook-signature-and-replay-verification-before-sentry-reconciliation");
    expect(decision.missingEvidence).toContain("sentryWebSdkConfigured");
    expect(decision.blockers).toContain("Sentry web SDK must be configured for public web runtime.");
  });

  it("completes observability launch only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(
      observabilityLaunchRunPersistenceContract.evidenceBooleans.map((flag) => [flag, true]),
    );
    const decision = buildObservabilityLaunchEvidenceDecision({
      commands: observabilityLaunchRuntimeCommands,
      artifacts: observabilityLaunchArtifactPaths,
      controls: observabilityLaunchRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toEqual(observabilityLaunchRunPersistenceContract.evidenceBooleans);
  });

  it("keeps observability launch execution and artifact review local, redacted, and provider-gated", () => {
    const executionPlan = buildObservabilityLaunchExecutionPlan();
    expect(executionPlan.localCommands).toBe(observabilityLaunchLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/observability typecheck",
      "pnpm --filter @inkroute/observability test",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm --filter @inkroute/mobile typecheck",
      "tenant-isolated ErrorReport dashboard triage test",
      "redaction/no-PII observability artifact review",
    ]);
    expect(executionPlan.externalCommands).toBe(observabilityLaunchExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "Sentry web/dashboard/mobile SDK configuration smoke",
      "OpenTelemetry exporter and structured logging smoke",
      "source-map and debug-symbol resolution check",
      "forced web/dashboard/API/webhook/mobile capture smoke",
      "Sentry/provider webhook replay, alert routing, and release linkage tests",
      "GitHub Actions observability launch evidence job",
      "secret-safe observability artifact review",
    ]);
    expect(executionPlan.localArtifacts).toBe(observabilityLaunchLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(observabilityLaunchExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/observability-redaction-review.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/observability-sentry-sdk.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/observability-launch-runtime");
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.telemetryExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(observabilityLaunchExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticObservabilityLaunchReadiness: true,
      providerEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(observabilityLaunchRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed ObservabilityLaunchRun persistence row captured through persistObservabilityLaunchRun.",
    );

    const artifact = {
      sentryDsn: "https://public:secret@sentry.example.com/123",
      userEmail: "client@example.com",
      clientPhone: "+1 555 222 1212",
      stackTrace: "Error: private route failed at /tenants/tenant_static/messages",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        issueId: "issue_observability_launch_1234567890",
        publicSummary: "observability launch evidence captured",
      },
    };
    const redactedOnly = buildRedactedObservabilityLaunchArtifact(artifact);
    const review = buildObservabilityLaunchArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("client@example.com");
    expect(serialized).not.toContain("https://public:secret@sentry.example.com/123");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("Error: private route failed");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("issue_observability_launch_1234567890");
    expect(review.redactions).toEqual([
      "sentryDsn",
      "userEmail",
      "clientPhone",
      "stackTrace",
      "nested.databaseUrl",
      "nested.issueId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(observabilityLaunchRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming observability launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 11 observability launch runtime contracts");
    expect(ciWorkflow).toContain("observability-launch-runtime-static.test.ts");
    expect(ciWorkflow).toContain("observability-launch-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-observability-launch-runtime-static");
    expect(unitManifest).toContain("ObservabilityLaunchRun Prisma model and app row contract");
    expect(gapTracker).toContain("ObservabilityLaunchRun");
    expect(gapTracker).toContain("apps/web/lib/observabilityLaunchRuntime.ts");
    expect(gapTracker).toContain("persistObservabilityLaunchRun upsert seam");
    expect(gapTracker).toContain("live Sentry/OTel/mobile crash SDK wiring, source-map/debug-symbol upload, forced capture evidence, provider webhook replay verification, alert routing, release linkage, CI evidence, provider-backed persistObservabilityLaunchRun execution, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-011 is observability-launch-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildObservabilityLaunchExecutionPlan");
    expect(gapTracker).toContain("observabilityLaunchLocalCommands/observabilityLaunchExternalCommands");
    expect(gapTracker).toContain("observabilityLaunchExecutionPolicy");
    expect(gapTracker).toContain("observabilityLaunchRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedObservabilityLaunchArtifact");
    expect(gapTracker).toContain("buildObservabilityLaunchArtifactReview");
  });

  it("pins current observability launch proof files for GAP-011", () => {
    expect(observabilityLaunchRuntimeProofFiles).toContain("packages/observability/package.json");
    expect(observabilityLaunchRuntimeProofFiles).toContain("apps/dashboard/package.json");
    expect(observabilityLaunchRuntimeProofFiles).toContain("apps/mobile/package.json");
    expect(observabilityLaunchRuntimeProofFiles).toContain("apps/web/package.json");
    expect(observabilityLaunchRuntimeProofFiles).toContain("apps/web/lib/observabilityLaunchRuntime.ts");
    expect(observabilityLaunchRuntimeProofFiles).toContain("apps/web/tests/observability-launch-runtime-static.test.ts");
    for (const proofFile of observabilityLaunchRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

