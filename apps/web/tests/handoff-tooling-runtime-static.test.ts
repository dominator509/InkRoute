import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildHandoffToolingRuntimeArtifactReview,
  buildHandoffToolingRuntimeRedactedEvidenceBundle,
  buildHandoffToolingRuntimeEvidenceDecision,
  buildHandoffToolingRuntimeExecutionPlan,
  buildRedactedHandoffToolingArtifact,
  handoffToolingRequiredCiEvidence,
  handoffToolingRequiredDocs,
  handoffToolingRequiredReports,
  handoffToolingRequiredRootScripts,
  handoffToolingRequiredScriptFiles,
  handoffToolingRuntimeArtifactPaths,
  handoffToolingRuntimeCommands,
  handoffToolingRuntimeExternalCommands,
  handoffToolingRuntimeExternalArtifacts,
  handoffToolingRuntimeExecutionPolicy,
  handoffToolingRuntimeLocalArtifacts,
  handoffToolingRuntimeLocalCommands,
  handoffToolingRuntimeMatrix,
  handoffToolingRuntimeProofFiles,
  handoffToolingRuntimeReadiness,
  handoffToolingRuntimeRequiredExternalEvidence,
  handoffToolingRunPersistenceContract,
} from "../lib/handoffToolingRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("handoff tooling runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const handoffPackageJson = readRepoFile("packages/handoff/package.json");
  const toolingManifest = readRepoFile("docs/handoff/manifests/handoff-tooling-readiness.json");
  const toolingVerifier = readRepoFile("scripts/handoff/verify-handoff-tooling.mjs");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609024000_add_handoff_tooling_runs/migration.sql");

  it("pins every GAP-121 command, report, script, doc, CI label, and artifact path", () => {
    expect(handoffToolingRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm --filter @inkroute/handoff typecheck",
      "pnpm --filter @inkroute/handoff test",
      "pnpm handoff:verify-docs",
      "pnpm handoff:audit",
      "pnpm handoff:next",
      "pnpm handoff:verify-ledger",
      "pnpm handoff:verify-tooling",
      "pnpm handoff:verify-task-sync",
      "pnpm handoff:all",
    ]);
    expect(handoffToolingRequiredRootScripts).toContain("handoff:all");
    expect(handoffToolingRequiredReports).toContain("docs/handoff/manifests/handoff-tooling-readiness.json");
    expect(handoffToolingRequiredScriptFiles).toContain("scripts/handoff/verify-handoff-tooling.mjs");
    expect(handoffToolingRequiredDocs).toContain("docs/handoff/AGENT_EXECUTION_QUEUE.md");
    expect(handoffToolingRequiredCiEvidence).toContain("handoff-tooling-runtime-artifacts");
    expect(handoffToolingRuntimeArtifactPaths).toContain("coverage/handoff-tooling-runtime.json");
    expect(handoffToolingRuntimeArtifactPaths).toContain("coverage/handoff-tooling-redacted-evidence-bundle.json");
    expect(handoffToolingRuntimeArtifactPaths).toContain("test-results/handoff-tooling-runtime");
  });

  it("keeps root scripts, package scripts, tooling manifest, and verifier aligned", () => {
    for (const scriptName of handoffToolingRequiredRootScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("handoff:verify-tooling");
    expect(handoffPackageJson).toContain('"typecheck"');
    expect(handoffPackageJson).toContain('"test"');
    expect(toolingManifest).toContain("handoff-tooling-readiness");
    expect(toolingManifest).toContain("handoff:verify-tooling");
    expect(toolingVerifier).toContain("buildHandoffToolingRuntimeReadinessPlan");
    expect(toolingVerifier).toContain("reportArtifactsCaptured");
  });

  it("keeps readiness blocked only on runtime execution, CI capture, and artifact evidence", () => {
    expect(handoffToolingRuntimeReadiness.status).toBe("blocked");
    expect(handoffToolingRuntimeReadiness.missingRootScripts).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingReports).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingScriptFiles).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingDocs).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingCiEvidence).toEqual([]);
    expect(handoffToolingRuntimeReadiness.missingPackageScripts).toEqual([]);
    expect(handoffToolingRuntimeReadiness.requiredCommands).toBe(handoffToolingRuntimeCommands);
    expect(handoffToolingRuntimeReadiness.blockers).toEqual([
      "Workspace dependencies must install before handoff tooling verification is meaningful.",
      "@inkroute/handoff typecheck must pass.",
      "@inkroute/handoff tests must pass.",
      "Handoff verify-docs, audit, next, verify-ledger, verify-tooling, and all scripts must execute.",
      "pnpm handoff:verify-tooling must pass.",
      "GitHub Actions CI run must capture Phase 16 handoff tooling evidence.",
      "Handoff report artifacts must be captured or explicitly documented as unavailable.",
    ]);
  });

  it("wires CI, manifest, tracker, and matrix rows without claiming runtime evidence is complete", () => {
    expect(handoffToolingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "dependency-install",
      "package-typecheck",
      "package-tests",
      "handoff-verify-docs",
      "handoff-audit",
      "handoff-next",
      "handoff-verify-ledger",
      "handoff-verify-tooling",
      "handoff-verify-task-sync",
      "handoff-all",
      "ci-evidence",
      "redacted-evidence-bundle",
      "report-artifacts",
    ]);
    expect(handoffToolingRuntimeMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "handoff-verify-docs", artifact: "coverage/handoff-verify-docs.json" }),
        expect.objectContaining({ id: "handoff-audit", artifact: "coverage/handoff-audit.json" }),
        expect.objectContaining({ id: "handoff-verify-task-sync", artifact: "coverage/handoff-task-sync.json" }),
        expect.objectContaining({ id: "handoff-all", artifact: "coverage/handoff-all-output.txt" }),
        expect.objectContaining({ id: "redacted-evidence-bundle", artifact: "coverage/handoff-tooling-redacted-evidence-bundle.json" })
      ])
    );
    expect(ciWorkflow).toContain("Run Phase 16 handoff tooling runtime contracts");
    expect(ciWorkflow).toContain("handoff-tooling-runtime-static.test.ts");
    expect(ciWorkflow).toContain("handoff-tooling-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-handoff-tooling-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/handoffToolingRuntime.ts");
    expect(gapTracker).toContain("Handoff tooling evidence classifier wired and runtime artifact proof gated");
    expect(gapTracker).toContain("GAP-121 is handoff-tooling-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildHandoffToolingRuntimeExecutionPlan");
    expect(gapTracker).toContain("handoffToolingRuntimeExecutionPolicy");
    expect(gapTracker).toContain("handoffToolingRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("handoffToolingRuntimeLocalArtifacts");
    expect(gapTracker).toContain("handoffToolingRuntimeExternalArtifacts");
    expect(gapTracker).toContain("buildHandoffToolingRuntimeArtifactReview");
    expect(gapTracker).toContain("buildHandoffToolingRuntimeRedactedEvidenceBundle");
  });

  it("pins current handoff tooling runtime proof files for GAP-121", () => {
    expect(handoffToolingRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/handoff/manifests/agent-execution-ledger.json",
      "docs/handoff/manifests/agent-execution-queue.json",
      "packages/handoff/src/index.ts",
      "packages/handoff/tests/handoff-plan.test.ts",
      "scripts/handoff/audit-gap-tracker.mjs",
      "scripts/handoff/print-next-agent-tasks.mjs",
      "scripts/handoff/verify-agent-execution-ledger.mjs",
      "scripts/handoff/verify-agent-task-sync.mjs",
      "scripts/handoff/verify-phase-docs.mjs",
        "packages/handoff/package.json",
        "apps/web/lib/handoffToolingRuntime.ts",
        "apps/web/tests/handoff-tooling-runtime-static.test.ts",
        "docs/handoff/manifests/handoff-tooling-readiness.json",
        "scripts/handoff/verify-handoff-tooling.mjs",
        "packages/db/prisma/migrations/20260609024000_add_handoff_tooling_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of handoffToolingRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable HandoffToolingRun persistence for runtime tooling proof", () => {
    expect(handoffToolingRunPersistenceContract.prismaModel).toBe("HandoffToolingRun");
    expect(handoffToolingRunPersistenceContract.tenantRelation).toBe("handoffToolingRuns");
    expect(handoffToolingRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(handoffToolingRunPersistenceContract.jsonFields).toEqual([
      "rootScriptMatrix",
      "packageScriptMatrix",
      "reportArtifactManifest",
      "ciEvidenceManifest",
    ]);
    expect(handoffToolingRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "dependenciesInstalled",
        "packageTypecheckPassed",
        "packageTestsPassed",
        "verifyDocsPassed",
        "verifyLedgerPassed",
        "verifyToolingPassed",
        "handoffAllPassed",
        "ciRunCaptured",
        "reportArtifactsCaptured",
      ]),
    );
    expect(handoffToolingRunPersistenceContract.artifactFields).toContain("toolingVerifierArtifactPath");
    expect(prismaSchema).toContain("handoffToolingRuns HandoffToolingRun[]");
    expect(prismaSchema).toContain("model HandoffToolingRun");
    expect(prismaSchema).toContain("rootScriptMatrix                        Json");
    expect(prismaSchema).toContain("verifyToolingPassed                     Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "HandoffToolingRun"');
    expect(prismaMigration).toContain('"handoffAllArtifactPath" TEXT');
    expect(unitManifest).toContain("HandoffToolingRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609024000_add_handoff_tooling_runs/migration.sql");
  });

  it("classifies GAP-121 evidence as blocked until handoff tooling runtime proof is captured", () => {
    const blockedDecision = buildHandoffToolingRuntimeEvidenceDecision({
      dependenciesInstalled: false,
      packageTypecheckPassed: false,
      packageTestsPassed: true,
      verifyDocsPassed: true,
      handoffAuditPassed: false,
      handoffNextPassed: false,
      verifyLedgerPassed: true,
      verifyToolingPassed: false,
      verifyTaskSyncPassed: false,
      handoffAllPassed: false,
      queueLedgerParityVerified: true,
      ciRunCaptured: false,
      reportArtifactsCaptured: false,
      requiredCommandsRun: handoffToolingRuntimeCommands.filter(
        (command) =>
          command !== "pnpm install" &&
          command !== "pnpm --filter @inkroute/handoff typecheck" &&
          command !== "pnpm handoff:verify-task-sync" &&
          command !== "pnpm handoff:all",
      ),
      capturedArtifacts: [
        "coverage/handoff-tooling-runtime.json",
        "coverage/handoff-tooling-package-test.txt",
        "coverage/handoff-verify-docs.json",
        "coverage/handoff-ledger-verification.json",
        "test-results/handoff-tooling-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Install workspace dependencies.",
        "Run @inkroute/handoff typecheck.",
        "Run handoff audit.",
        "Run handoff next.",
        "Run handoff tooling verifier.",
        "Run handoff task sync verifier.",
        "Run handoff:all.",
        "Capture CI handoff tooling evidence.",
        "Capture handoff report artifacts.",
        "Required command not recorded: pnpm install",
        "Required command not recorded: pnpm --filter @inkroute/handoff typecheck",
        "Required command not recorded: pnpm handoff:verify-task-sync",
        "Required command not recorded: pnpm handoff:all",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/handoff-tooling-install-output.txt",
        "coverage/handoff-tooling-package-typecheck.txt",
        "coverage/handoff-audit.json",
        "coverage/handoff-next.json",
        "coverage/handoff-tooling-verification.json",
        "coverage/handoff-task-sync.json",
        "coverage/handoff-tooling-ci-run.json",
      ]),
    );
    expect(blockedDecision.toolingPolicy).toEqual({
      installedDependenciesRequired: true,
      handoffAllRequired: true,
      ciAndReportArtifactsRequired: true,
    });

    const completeDecision = buildHandoffToolingRuntimeEvidenceDecision({
      dependenciesInstalled: true,
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      verifyDocsPassed: true,
      handoffAuditPassed: true,
      handoffNextPassed: true,
      verifyLedgerPassed: true,
      verifyToolingPassed: true,
      verifyTaskSyncPassed: true,
      handoffAllPassed: true,
      queueLedgerParityVerified: true,
      ciRunCaptured: true,
      reportArtifactsCaptured: true,
      requiredCommandsRun: handoffToolingRuntimeCommands,
      capturedArtifacts: handoffToolingRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(handoffToolingRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(handoffToolingRuntimeArtifactPaths);
  });

  it("keeps handoff tooling runtime execution disabled while splitting local reports from external runtime proof", () => {
    const plan = buildHandoffToolingRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(handoffToolingRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(handoffToolingRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(handoffToolingRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(handoffToolingRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/handoff-tooling-runtime.json",
        "coverage/handoff-verify-docs.json",
        "coverage/handoff-audit.json",
        "coverage/handoff-next.json",
        "coverage/handoff-ledger-verification.json",
        "coverage/handoff-tooling-verification.json",
        "coverage/handoff-task-sync.json",
        "test-results/handoff-tooling-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/handoff-tooling-install-output.txt",
        "coverage/handoff-tooling-package-typecheck.txt",
        "coverage/handoff-tooling-package-test.txt",
        "coverage/handoff-all-output.txt",
        "coverage/handoff-tooling-ci-run.json",
        "coverage/handoff-tooling-redacted-evidence-bundle.json",
      ]),
    );
    expect(plan.dependencyInstallExecutionAllowed).toBe(false);
    expect(plan.packageTypecheckExecutionAllowed).toBe(false);
    expect(plan.packageTestExecutionAllowed).toBe(false);
    expect(plan.verifyDocsExecutionAllowed).toBe(false);
    expect(plan.auditExecutionAllowed).toBe(false);
    expect(plan.nextExecutionAllowed).toBe(false);
    expect(plan.ledgerExecutionAllowed).toBe(false);
    expect(plan.toolingVerifierExecutionAllowed).toBe(false);
    expect(plan.taskSyncExecutionAllowed).toBe(false);
    expect(plan.handoffAllExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(handoffToolingRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyHandoffReports: true,
      installedDependenciesRequiredForRuntimeProof: true,
      handoffAllRequiredForClosure: true,
      reportArtifactsRequiredOrUnavailableDocumented: true,
      ciProviderRequiredForRuntimeArtifacts: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.externalEvidenceRequired).toBe(handoffToolingRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted handoff tooling evidence bundle captured without raw command output, environment values, provider URLs, run URLs, raw logs, report IDs, or actor identifiers.",
    );
  });

  it("redacts handoff tooling artifacts before report retention", () => {
    const rawArtifact = {
      installOutput: "resolved token ghp_secret and fetched https://registry.example.com/private",
      command: "pnpm handoff:all --filter tenant_demo",
      stdout: "report_artifact_123 emitted for owner@example.com",
      stderr: "Bearer handoff-tooling-token",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      docsVerificationReport: "docs verification exposed report_task_123 for owner@example.com",
      ledgerAuditOutput: "ledger task task_123 mismatched run_123",
      taskSyncReportPath: "coverage/handoff/raw-task-sync-report.json",
      missingRootScripts: ["handoff:missing-secret-script"],
      handoffAllLog: "handoff:all output includes tenant_demo and provider_report_123",
      neutralRepositoryTrace:
        "repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      stackTrace: "Error: handoff tooling leaked raw report metadata",
      nested: {
        providerReportUrl: "https://provider.example.com/reports/report_abc",
        phone: "+1 555 909 1212",
      },
    };
    const redacted = buildRedactedHandoffToolingArtifact(rawArtifact);
    const review = buildHandoffToolingRuntimeArtifactReview("coverage/handoff-tooling-ci-run.json", rawArtifact);
    const bundle = buildHandoffToolingRuntimeRedactedEvidenceBundle("coverage/handoff-tooling-ci-run.json", rawArtifact);
    const serialized = JSON.stringify(bundle);

    expect(JSON.stringify(redacted)).not.toContain("ghp_secret");
    expect(serialized).not.toContain("registry.example.com");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("Bearer handoff-tooling-token");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("provider.example.com");
    expect(serialized).not.toContain("+1 555 909 1212");
    expect(serialized).not.toContain("report_task_123");
    expect(serialized).not.toContain("task_123");
    expect(serialized).not.toContain("raw-task-sync-report.json");
    expect(serialized).not.toContain("handoff:missing-secret-script");
    expect(serialized).not.toContain("provider_report_123");
    expect(serialized).not.toContain("repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("raw report metadata");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "ciRunUrl",
        "command",
        "docsVerificationReport",
        "handoffAllLog",
        "installOutput",
        "ledgerAuditOutput",
        "missingRootScripts",
        "neutralRepositoryTrace",
        "phone",
        "providerReportUrl",
        "stderr",
        "stdout",
        "stackTrace",
        "taskSyncReportPath",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(handoffToolingRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Dependency install, package typecheck/test, handoff:all, CI run, and persisted run proof must be captured only after approved execution.",
        "Handoff report artifacts must redact command output, environment values, provider URLs, run URLs, and raw logs.",
        "Report artifacts must either be captured or explicitly documented as unavailable before runtime closure.",
        "HandoffToolingRun persistence must execute only against an approved provider-backed database.",
        "Redacted handoff tooling evidence bundle captured without raw command output, environment values, provider URLs, run URLs, raw logs, report IDs, or actor identifiers.",
      ]),
    );
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.sourceArtifactPath).toBe("coverage/handoff-tooling-ci-run.json");
    expect(bundle.artifactPath).toBe("coverage/handoff-tooling-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(handoffToolingRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(handoffToolingRuntimeRequiredExternalEvidence);
    expect(bundle.handoffAllExecutionAllowed).toBe(false);
    expect(bundle.persistenceExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
  });
});


