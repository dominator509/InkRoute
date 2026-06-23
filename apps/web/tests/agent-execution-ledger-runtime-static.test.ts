import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAgentExecutionLedgerRuntimeArtifactReview,
  buildAgentExecutionLedgerRuntimeEvidenceDecision,
  buildAgentExecutionLedgerRuntimeExecutionPlan,
  buildAgentExecutionLedgerRuntimeRedactedEvidenceBundle,
  buildRedactedAgentExecutionLedgerArtifact,
  agentExecutionLedgerRuntimeArtifactPaths,
  agentExecutionLedgerRuntimeCommands,
  agentExecutionLedgerRuntimeExternalArtifacts,
  agentExecutionLedgerRuntimeExternalCommands,
  agentExecutionLedgerRuntimeLocalArtifacts,
  agentExecutionLedgerRuntimeLocalCommands,
  agentExecutionLedgerRuntimeExecutionPolicy,
  agentExecutionLedgerRuntimeMatrix,
  agentExecutionLedgerRuntimeProofFiles,
  agentExecutionLedgerRuntimeReadiness,
  agentExecutionLedgerRuntimeRequiredExternalEvidence,
  agentExecutionLedgerRunPersistenceContract,
  agentExecutionLedgerTargets,
  agentExecutionLedgerTaskIds,
} from "../lib/agentExecutionLedgerRuntime";

const repoRoot = join(__dirname, "../../..");
const readRepoFile = (path: string) => readFileSync(join(repoRoot, path), "utf8");

describe("agent execution ledger runtime contract", () => {
  const packageJson = readRepoFile("package.json");
  const queueManifest = readRepoFile("docs/handoff/manifests/agent-execution-queue.json");
  const ledgerManifest = readRepoFile("docs/handoff/manifests/agent-execution-ledger.json");
  const verifierScript = readRepoFile("scripts/handoff/verify-agent-execution-ledger.mjs");
  const handoffPackageTests = readRepoFile("packages/handoff/tests/handoff-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609023000_add_agent_execution_ledger_runs/migration.sql",
  );

  it("pins the runtime matrix commands, tasks, targets, and redacted artifact paths", () => {
    expect(agentExecutionLedgerRuntimeCommands).toEqual([
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "pnpm handoff:verify-docs",
      "pnpm handoff:next",
      "agent task command plans from docs/handoff/manifests/agent-execution-queue.json",
      "capture redacted agent command transcripts",
      "record agent changed-files matrix",
      "capture provider evidence labels",
      "record remaining gaps and risks",
      "complete agent execution secret-safety review",
      "update GAP_TRACKER rows with execution evidence",
      "external Codex/Jules/Claude/local execution result import",
      "capture CI agent execution ledger artifacts",
    ]);
    expect(agentExecutionLedgerTaskIds).toEqual([
      "codex-workspace-runtime-readiness-001",
      "codex-runtime-verification-001",
      "codex-quality-gate-enforcement-001",
      "jules-database-auth-foundation-001",
      "claude-provider-contract-001",
      "local-launch-readiness-001",
    ]);
    expect(agentExecutionLedgerTargets).toEqual([
      "Codex",
      "Codex",
      "Codex",
      "Jules",
      "Claude Code",
      "Local terminal",
    ]);
    expect(agentExecutionLedgerRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "ledger-verifier",
      "handoff-audit",
      "handoff-docs-verification",
      "handoff-next-computation",
      "queue-ledger-parity",
      "agent-command-execution",
      "command-transcripts",
      "changed-files-matrix",
      "provider-evidence-labels",
      "remaining-gaps-risks",
      "secret-safety-review",
      "secret-safe-result-import",
      "gap-tracker-updates",
      "ci-ledger-artifacts",
      "redacted-evidence-bundle",
    ]);
    expect(agentExecutionLedgerRuntimeMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "handoff-docs-verification", command: "pnpm handoff:verify-docs" }),
        expect.objectContaining({ id: "changed-files-matrix", artifact: "coverage/agent-execution-diff-summary-redacted.json" }),
        expect.objectContaining({ id: "provider-evidence-labels", artifact: "coverage/agent-execution-provider-evidence-redacted.json" }),
        expect.objectContaining({ id: "secret-safety-review", artifact: "coverage/agent-execution-secret-safety-review.json" }),
        expect.objectContaining({ id: "redacted-evidence-bundle", artifact: "coverage/agent-execution-redacted-evidence-bundle.json" }),
        expect.objectContaining({ id: "ci-ledger-artifacts", command: "capture CI agent execution ledger artifacts" })
      ])
    );
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("coverage/agent-execution-external-results-imported.json");
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("test-results/agent-execution-ledger-runtime");
    expect(agentExecutionLedgerRuntimeArtifactPaths).toContain("coverage/agent-execution-redacted-evidence-bundle.json");
  });

  it("keeps the queue, redacted ledger, verifier, package scripts, and package tests aligned", () => {
    for (const taskId of agentExecutionLedgerTaskIds) {
      expect(queueManifest).toContain(taskId);
      expect(ledgerManifest).toContain(taskId);
    }
    expect(queueManifest).toContain('"target": "Codex"');
    expect(queueManifest).toContain('"target": "Jules"');
    expect(queueManifest).toContain('"target": "Claude Code"');
    expect(queueManifest).toContain('"target": "Local terminal"');
    expect(ledgerManifest).toContain('"status": "not_executed"');
    expect(ledgerManifest).toContain('"remainingGaps"');
    expect(ledgerManifest).toContain('"secretSafety": "no_evidence_recorded"');
    expect(verifierScript).toContain("forbiddenPatterns");
    expect(verifierScript).toContain("completed_redacted");
    expect(verifierScript).toContain("secret_safe_redacted");
    expect(packageJson).toContain('"handoff:verify-ledger"');
    expect(handoffPackageTests).toContain("buildAgentExecutionLedgerReadinessPlan");
  });

  it("reports GAP-119 as blocked until completed redacted agent results are imported", () => {
    expect(agentExecutionLedgerRuntimeReadiness.status).toBe("blocked");
    expect(agentExecutionLedgerRuntimeReadiness.missingTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.unknownTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.duplicateTaskIds).toEqual([]);
    expect(agentExecutionLedgerRuntimeReadiness.incompleteTaskIds).toEqual([...agentExecutionLedgerTaskIds]);
    expect(agentExecutionLedgerRuntimeReadiness.requiredCommands).toBe(agentExecutionLedgerRuntimeCommands);
    expect(agentExecutionLedgerRuntimeReadiness.requiredEvidence).toBe(agentExecutionLedgerRuntimeArtifactPaths);
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "Every handoff execution must be completed_redacted with commands, evidence artifacts, matching agent, and secret-safe review.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain("pnpm handoff:verify-ledger must pass.");
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "Handoff audit scripts must pass after importing execution results.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "GAP_TRACKER.md must be updated with exact execution evidence and remaining blockers.",
    );
    expect(agentExecutionLedgerRuntimeReadiness.blockers).toContain(
      "External Codex/Jules/Claude/local execution results must be imported into the redacted ledger.",
    );
  });

  it("keeps CI, manifest, and tracker coverage wired without claiming external execution is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 agent execution ledger runtime contracts");
    expect(ciWorkflow).toContain("agent-execution-ledger-runtime-static.test.ts");
    expect(ciWorkflow).toContain("agent-execution-ledger-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-agent-execution-ledger-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/agentExecutionLedgerRuntime.ts");
    expect(gapTracker).toContain("Agent execution ledger evidence classifier wired and external execution proof gated");
    expect(gapTracker).toContain("GAP-119 is agent-execution-ledger-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildAgentExecutionLedgerRuntimeExecutionPlan");
    expect(gapTracker).toContain("agentExecutionLedgerRuntimeExecutionPolicy");
    expect(gapTracker).toContain("agentExecutionLedgerRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildAgentExecutionLedgerRuntimeArtifactReview");
    expect(gapTracker).toContain("buildAgentExecutionLedgerRuntimeRedactedEvidenceBundle");
  });

  it("pins current agent execution ledger runtime proof files for GAP-119", () => {
    expect(agentExecutionLedgerRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/handoff/AGENT_EXECUTION_QUEUE.md",
      "docs/handoff/README.md",
      "packages/handoff/src/index.ts",
        "apps/web/lib/agentExecutionLedgerRuntime.ts",
        "apps/web/tests/agent-execution-ledger-runtime-static.test.ts",
        "docs/handoff/manifests/agent-execution-ledger.json",
        "scripts/handoff/verify-agent-execution-ledger.mjs",
        "packages/db/prisma/migrations/20260609023000_add_agent_execution_ledger_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of agentExecutionLedgerRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable AgentExecutionLedgerRun persistence for imported handoff execution proof", () => {
    expect(agentExecutionLedgerRunPersistenceContract.prismaModel).toBe("AgentExecutionLedgerRun");
    expect(agentExecutionLedgerRunPersistenceContract.tenantRelation).toBe("agentExecutionLedgerRuns");
    expect(agentExecutionLedgerRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(agentExecutionLedgerRunPersistenceContract.jsonFields).toEqual([
      "queueTaskMatrix",
      "ledgerExecutionMatrix",
      "changedFilesMatrix",
      "evidenceArtifactManifest",
    ]);
    expect(agentExecutionLedgerRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "queueLedgerParityVerified",
        "agentCommandPlansRecorded",
        "redactedCommandTranscriptsCaptured",
        "changedFilesRecorded",
        "providerEvidenceCaptured",
        "secretSafetyReviewed",
        "gapTrackerUpdated",
        "externalAgentResultsImported",
        "ciLedgerArtifactsCaptured",
      ]),
    );
    expect(agentExecutionLedgerRunPersistenceContract.redactedArtifactFields).toContain(
      "externalResultsImportArtifactPath",
    );
    expect(prismaSchema).toContain("agentExecutionLedgerRuns AgentExecutionLedgerRun[]");
    expect(prismaSchema).toContain("model AgentExecutionLedgerRun");
    expect(prismaSchema).toContain("ledgerExecutionMatrix                   Json");
    expect(prismaSchema).toContain("externalAgentResultsImported            Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "AgentExecutionLedgerRun"');
    expect(prismaMigration).toContain('"commandTranscriptArtifactPath" TEXT');
    expect(unitManifest).toContain("AgentExecutionLedgerRun Prisma model and app row contract");
    expect(gapTracker).toContain(
      "packages/db/prisma/migrations/20260609023000_add_agent_execution_ledger_runs/migration.sql",
    );
  });

  it("classifies GAP-119 evidence as blocked until redacted external agent results are imported", () => {
    const blockedDecision = buildAgentExecutionLedgerRuntimeEvidenceDecision({
      verifierPassed: true,
      handoffAuditPassed: false,
      handoffDocsVerified: false,
      handoffNextComputed: false,
      queueLedgerParityVerified: true,
      agentCommandPlansRecorded: true,
      redactedCommandTranscriptsCaptured: false,
      changedFilesRecorded: false,
      providerEvidenceCaptured: false,
      remainingGapsRecorded: true,
      secretSafetyReviewed: false,
      gapTrackerUpdated: false,
      externalAgentResultsImported: false,
      ciLedgerArtifactsCaptured: false,
      requiredCommandsRun: agentExecutionLedgerRuntimeCommands.filter(
        (command) =>
          command !== "pnpm handoff:audit" &&
          command !== "capture redacted agent command transcripts" &&
          command !== "record agent changed-files matrix" &&
          command !== "capture provider evidence labels" &&
          command !== "complete agent execution secret-safety review" &&
          command !== "update GAP_TRACKER rows with execution evidence" &&
          command !== "external Codex/Jules/Claude/local execution result import" &&
          command !== "capture CI agent execution ledger artifacts",
      ),
      capturedArtifacts: [
        "coverage/agent-execution-ledger-runtime.json",
        "coverage/agent-execution-ledger-verifier.json",
        "coverage/agent-execution-queue-parity.json",
        "test-results/agent-execution-ledger-runtime",
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run handoff audit.",
        "Run handoff docs verification.",
        "Run handoff next computation.",
        "Capture redacted command transcripts.",
        "Record changed files matrix.",
        "Capture provider evidence labels.",
        "Complete secret-safety review.",
        "Update GAP_TRACKER rows with exact evidence and blockers.",
        "Import external Codex/Jules/Claude/local execution results.",
        "Capture CI ledger artifacts.",
        "Required command not recorded: pnpm handoff:audit",
        "Required command not recorded: capture redacted agent command transcripts",
        "Required command not recorded: record agent changed-files matrix",
        "Required command not recorded: capture provider evidence labels",
        "Required command not recorded: complete agent execution secret-safety review",
        "Required command not recorded: update GAP_TRACKER rows with execution evidence",
        "Required command not recorded: external Codex/Jules/Claude/local execution result import",
        "Required command not recorded: capture CI agent execution ledger artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/agent-execution-handoff-audit.json",
        "coverage/agent-execution-command-transcripts-redacted.json",
        "coverage/agent-execution-diff-summary-redacted.json",
        "coverage/agent-execution-secret-safety-review.json",
        "coverage/agent-execution-external-results-imported.json",
        "coverage/agent-execution-ci-run-redacted.json",
        "coverage/agent-execution-redacted-evidence-bundle.json",
      ]),
    );
    expect(blockedDecision.handoffPolicy).toEqual({
      externalResultsMustBeImported: true,
      commandTranscriptsMustBeRedacted: true,
      secretSafetyReviewRequired: true,
    });

    const completeDecision = buildAgentExecutionLedgerRuntimeEvidenceDecision({
      verifierPassed: true,
      handoffAuditPassed: true,
      handoffDocsVerified: true,
      handoffNextComputed: true,
      queueLedgerParityVerified: true,
      agentCommandPlansRecorded: true,
      redactedCommandTranscriptsCaptured: true,
      changedFilesRecorded: true,
      providerEvidenceCaptured: true,
      remainingGapsRecorded: true,
      secretSafetyReviewed: true,
      gapTrackerUpdated: true,
      externalAgentResultsImported: true,
      ciLedgerArtifactsCaptured: true,
      requiredCommandsRun: agentExecutionLedgerRuntimeCommands,
      capturedArtifacts: agentExecutionLedgerRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(agentExecutionLedgerRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(agentExecutionLedgerRuntimeArtifactPaths);
  });

  it("keeps external agent execution import gated while splitting local ledger checks from external proof", () => {
    const plan = buildAgentExecutionLedgerRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(agentExecutionLedgerRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(agentExecutionLedgerRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(agentExecutionLedgerRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(agentExecutionLedgerRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/agent-execution-ledger-runtime.json",
        "coverage/agent-execution-ledger-verifier.json",
        "coverage/agent-execution-handoff-audit.json",
        "coverage/agent-execution-queue-parity.json",
        "test-results/agent-execution-ledger-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/agent-execution-command-transcripts-redacted.json",
        "coverage/agent-execution-diff-summary-redacted.json",
        "coverage/agent-execution-provider-evidence-redacted.json",
        "coverage/agent-execution-secret-safety-review.json",
        "coverage/agent-execution-gap-tracker-updates.json",
        "coverage/agent-execution-external-results-imported.json",
        "coverage/agent-execution-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.handoffAuditExecutionAllowed).toBe(false);
    expect(plan.docsVerificationExecutionAllowed).toBe(false);
    expect(plan.nextTaskExecutionAllowed).toBe(false);
    expect(plan.queueParityExecutionAllowed).toBe(false);
    expect(plan.externalAgentExecutionAllowed).toBe(false);
    expect(plan.transcriptImportExecutionAllowed).toBe(false);
    expect(plan.providerEvidenceImportAllowed).toBe(false);
    expect(plan.gapTrackerEvidenceUpdateAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(agentExecutionLedgerRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyLedgerAndQueue: true,
      externalResultsMustBeImportedAfterAgentCompletion: true,
      commandTranscriptsMustBeRedacted: true,
      secretSafetyReviewRequired: true,
      providerEvidenceLabelsOnly: true,
      ciProviderRequiredForLedgerArtifacts: true,
    });
    expect(plan.externalEvidenceRequired).toBe(agentExecutionLedgerRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted agent execution ledger evidence bundle captured without raw transcripts, diffs, provider IDs, URLs, environment values, customer data, or actor identifiers.",
    );
  });

  it("redacts agent execution artifacts before ledger import or retention", () => {
    const rawArtifact = {
      commandTranscript: "rtk proxy powershell -Command \"$env:SECRET='sk_live_secret'; curl https://provider.example.com/run/task_123\"",
      stdout: "deployed provider_project_123 for tenant_demo",
      stderr: "warning sent to owner@example.com +1 555 111 2323",
      diffSummary: "Changed apps/web/lib/foo.ts with token ghp_secret",
      providerEvidenceUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      artifactUrl: "https://provider.example.com/artifacts/artifact_abc",
      nested: {
        authorization: "Bearer agent-execution-token",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedAgentExecutionLedgerArtifact(rawArtifact);
    const review = buildAgentExecutionLedgerRuntimeArtifactReview("coverage/agent-execution-command-transcripts-redacted.json", rawArtifact);
    const bundle = buildAgentExecutionLedgerRuntimeRedactedEvidenceBundle("coverage/agent-execution-command-transcripts-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("sk_live_secret");
    expect(serialized).not.toContain("provider.example.com");
    expect(serialized).not.toContain("provider_project_123");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 111 2323");
    expect(serialized).not.toContain("ghp_secret");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("Bearer agent-execution-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "artifactUrl",
        "authorization",
        "commandTranscript",
        "diffSummary",
        "providerEvidenceUrl",
        "stderr",
        "stdout",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(agentExecutionLedgerRuntimeRequiredExternalEvidence);
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/agent-execution-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(agentExecutionLedgerRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(agentExecutionLedgerRuntimeRequiredExternalEvidence);
    expect(bundle.externalAgentExecutionAllowed).toBe(false);
    expect(bundle.transcriptImportExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "External Codex, Jules, Claude Code, and local-terminal execution results must be imported only after completion with redacted transcripts.",
        "Command transcripts, diffs, changed-file matrices, and provider evidence must redact secrets, environment values, URLs, customer data, and provider IDs.",
        "Secret-safety review must be recorded before any external execution result updates GAP_TRACKER rows.",
        "CI ledger artifacts must be retained with run URLs, provider labels, and raw logs redacted.",
      ]),
    );
  });
});

