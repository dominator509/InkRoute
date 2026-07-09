import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentTaskTrackingDefaultLabels,
  agentTaskTrackingRuntimeExternalArtifacts,
  agentTaskTrackingRuntimeExternalCommands,
  agentTaskTrackingRuntimeLocalArtifacts,
  agentTaskTrackingRuntimeLocalCommands,
  agentTaskTrackingRuntimeArtifactPaths,
  agentTaskTrackingRuntimeCommands,
  agentTaskTrackingRuntimeExecutionPolicy,
  agentTaskTrackingRuntimeMatrix,
  agentTaskTrackingRuntimeProofFiles,
  agentTaskTrackingRuntimeReadiness,
  agentTaskTrackingRuntimeRequiredExternalEvidence,
  agentTaskTrackingRunPersistenceContract,
  agentTaskTrackingRequiredEvidence,
  agentTaskTrackingTargets,
  agentTaskTrackingTaskIds,
  agentTaskTrackingReadinessRequiredEvidence,
  buildAgentTaskTrackingDecisionRequiredEvidence,
  buildAgentTaskTrackingEvidenceDecision,
  buildAgentTaskTrackingRuntimeArtifactReview,
  buildAgentTaskTrackingRuntimeExecutionPlan,
  buildAgentTaskTrackingRuntimeRedactedEvidenceBundle,
  buildRedactedAgentTaskTrackingArtifact,
} from "../lib/agentTaskTrackingRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("agent task tracking runtime contract", () => {
  const queueManifest = readRepoFile("docs/handoff/manifests/agent-execution-queue.json");
  const trackingManifest = readRepoFile("docs/handoff/manifests/agent-task-tracking-sync.json");
  const trackingVerifier = readRepoFile("scripts/handoff/verify-agent-task-sync.mjs");
  const handoffPackageTests = readRepoFile("packages/handoff/tests/handoff-plan.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const runtimeSource = readRepoFile("apps/web/lib/agentTaskTrackingRuntime.ts");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609025000_add_agent_task_tracking_runs/migration.sql");

  it("pins queued task ids, target roles, labels, commands, matrix rows, and artifacts", () => {
    expect(agentTaskTrackingTaskIds).toEqual([
      "codex-workspace-runtime-readiness-001",
      "codex-runtime-verification-001",
      "codex-quality-gate-enforcement-001",
      "jules-database-auth-foundation-001",
      "claude-provider-contract-001",
      "local-launch-readiness-001",
    ]);
    expect(agentTaskTrackingTargets).toEqual([
      "Codex",
      "Codex",
      "Codex",
      "Jules",
      "Claude Code",
      "Local terminal",
    ]);
    expect(agentTaskTrackingDefaultLabels).toEqual([
      "agent-task",
      "gap-tracked",
      "verification-required",
    ]);
    expect(agentTaskTrackingRuntimeCommands).toEqual([
      "pnpm handoff:verify-task-sync",
      "gh issue create or GitHub issue automation",
      "GitHub Project item sync",
      "link redacted issue/project labels from handoff docs",
      "link tracking evidence from GAP_TRACKER rows",
      "trace status updates between queue, issues/projects, ledger, and gap tracker",
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "capture CI agent task tracking artifacts",
    ]);
    expect(agentTaskTrackingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "task-sync-verifier",
      "github-issue-create",
      "github-project-sync",
      "handoff-doc-links",
      "gap-tracker-links",
      "status-traceability",
      "ci-task-tracking-artifacts",
      "redacted-evidence-bundle",
    ]);
    expect(agentTaskTrackingRuntimeArtifactPaths).toContain("coverage/agent-task-tracking-issue-create-redacted.json");
    expect(agentTaskTrackingRuntimeArtifactPaths).toContain("coverage/agent-task-tracking-ci-run-redacted.json");
    expect(agentTaskTrackingRuntimeArtifactPaths).toContain("coverage/agent-task-tracking-redacted-evidence-bundle.json");
    expect(agentTaskTrackingRuntimeArtifactPaths).toContain("test-results/agent-task-tracking-runtime");
  });

  it("keeps queue, tracking manifest, verifier, and package helper tests aligned", () => {
    for (const taskId of agentTaskTrackingTaskIds) {
      expect(queueManifest).toContain(taskId);
      expect(trackingManifest).toContain(taskId);
    }
    expect(trackingManifest).toContain('"status": "not_created"');
    expect(trackingManifest).toContain("agent-task");
    expect(trackingManifest).toContain("gap-tracked");
    expect(trackingManifest).toContain("verification-required");
    expect(trackingVerifier).toContain("buildAgentTaskTrackingReadinessPlan");
    expect(trackingVerifier).toContain("githubIssuesCreated");
    expect(trackingVerifier).toContain("statusUpdatesTraceable");
    expect(handoffPackageTests).toContain("buildAgentTaskTrackingReadinessPlan");
  });

  it("keeps local issue planning complete while live GitHub tracking evidence remains gated", () => {
    expect(agentTaskTrackingRuntimeReadiness.status).toBe("blocked");
    expect(agentTaskTrackingRuntimeReadiness.missingIssueTaskIds).toEqual([]);
    expect(agentTaskTrackingRuntimeReadiness.unknownIssueTaskIds).toEqual([]);
    expect(agentTaskTrackingRuntimeReadiness.incompleteIssueTaskIds).toEqual([]);
    expect(agentTaskTrackingRuntimeReadiness.unsafeTrackingFields).toEqual([]);
    expect(agentTaskTrackingRuntimeReadiness.requiredCommands).toBe(agentTaskTrackingRuntimeCommands);
    expect(agentTaskTrackingRuntimeReadiness.requiredEvidence).toBe(agentTaskTrackingReadinessRequiredEvidence);
    expect(agentTaskTrackingRuntimeReadiness.blockers).toEqual([
      "pnpm handoff:verify-task-sync must pass.",
      "GitHub issues must be created for every queued agent task.",
      "GitHub Project items must be linked or explicitly documented as unavailable for every task.",
      "Handoff docs must link to the redacted issue/project tracking labels.",
      "GAP_TRACKER.md must reference the task tracking evidence where relevant.",
      "Task status updates must be traceable between queue, issues/projects, ledger, and gap tracker.",
    ]);
  });

  it("keeps the runtime decision helper free of duplicate local command declarations", () => {
    expect(runtimeSource.match(/const completedCommands = new Set\(input\.completedCommands\);/g)?.length).toBe(1);
  });

  it("blocks agent task tracking closure until issue, project, artifact, command, persistence, and traceability proof exist", () => {
    const decision = buildAgentTaskTrackingEvidenceDecision({
      verifierPassed: true,
      queueIssueParityVerified: true,
      defaultLabelsApplied: true,
      targetPriorityLabelsApplied: false,
      gapIdsLinked: true,
      acceptanceEvidenceFieldsLinked: false,
      githubIssuesCreated: false,
      githubProjectItemsLinked: false,
      redactedTrackingUrlsRecorded: false,
      handoffDocsLinked: false,
      gapTrackerLinked: false,
      statusUpdatesTraceable: false,
      ciTaskTrackingArtifactsCaptured: false,
      agentTaskTrackingRunPersisted: false,
      capturedArtifacts: [
        "coverage/agent-task-tracking-runtime.json",
        "coverage/agent-task-tracking-sync-verifier.json",
      ],
      completedCommands: ["pnpm handoff:verify-task-sync"],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingArtifacts).toEqual([
      "coverage/agent-task-tracking-issue-create-redacted.json",
      "coverage/agent-task-tracking-project-sync-redacted.json",
      "coverage/agent-task-tracking-doc-links.json",
      "coverage/agent-task-tracking-gap-links.json",
      "coverage/agent-task-tracking-status-traceability.json",
      "coverage/agent-task-tracking-ci-run-redacted.json",
      "coverage/agent-task-tracking-redacted-evidence-bundle.json",
      "test-results/agent-task-tracking-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "gh issue create or GitHub issue automation",
      "GitHub Project item sync",
      "link redacted issue/project labels from handoff docs",
      "link tracking evidence from GAP_TRACKER rows",
      "trace status updates between queue, issues/projects, ledger, and gap tracker",
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
      "capture CI agent task tracking artifacts",
    ]);
    expect(decision.requiredArtifacts).toBe(agentTaskTrackingRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(agentTaskTrackingRuntimeCommands);
    expect(decision.requiredEvidence).toBe(agentTaskTrackingRequiredEvidence);
    expect(agentTaskTrackingRequiredEvidence).toEqual(
      buildAgentTaskTrackingDecisionRequiredEvidence(agentTaskTrackingReadinessRequiredEvidence),
    );
    expect(decision.blockers).toContain("GitHub issues must be created for every queued agent task.");
    expect(decision.blockers).toContain("Target and priority labels must be applied to every tracked issue.");
    expect(decision.blockers).toContain("AgentTaskTrackingRun persistence row must be captured for durable traceability.");
    expect(decision.blockers).toContain("Every required agent task tracking artifact must be captured.");
  });

  it("completes agent task tracking closure when GitHub sync, traceability, persistence, artifacts, and commands are proven", () => {
    const decision = buildAgentTaskTrackingEvidenceDecision({
      verifierPassed: true,
      queueIssueParityVerified: true,
      defaultLabelsApplied: true,
      targetPriorityLabelsApplied: true,
      gapIdsLinked: true,
      acceptanceEvidenceFieldsLinked: true,
      githubIssuesCreated: true,
      githubProjectItemsLinked: true,
      redactedTrackingUrlsRecorded: true,
      handoffDocsLinked: true,
      gapTrackerLinked: true,
      statusUpdatesTraceable: true,
      ciTaskTrackingArtifactsCaptured: true,
      agentTaskTrackingRunPersisted: true,
      capturedArtifacts: agentTaskTrackingRuntimeArtifactPaths,
      completedCommands: agentTaskTrackingRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming GitHub sync is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 agent task tracking runtime contracts");
    expect(ciWorkflow).toContain("agent-task-tracking-runtime-static.test.ts");
    expect(ciWorkflow).toContain("agent-task-tracking-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-agent-task-tracking-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/agentTaskTrackingRuntime.ts");
    expect(gapTracker).toContain("live GitHub issue/project creation and traceable status-update proof remain open");
    expect(gapTracker).toContain("GAP-123 is agent-task-tracking-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildAgentTaskTrackingRuntimeExecutionPlan");
    expect(gapTracker).toContain("agentTaskTrackingRuntimeExecutionPolicy");
    expect(gapTracker).toContain("agentTaskTrackingReadinessRequiredEvidence");
    expect(gapTracker).toContain("agentTaskTrackingRequiredEvidence");
    expect(gapTracker).toContain("agentTaskTrackingRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildAgentTaskTrackingRuntimeArtifactReview");
    expect(gapTracker).toContain("buildAgentTaskTrackingRuntimeRedactedEvidenceBundle");
  });

  it("pins current agent task tracking runtime proof files for GAP-123", () => {
    expect(agentTaskTrackingRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/handoff/AGENT_EXECUTION_QUEUE.md",
      "packages/handoff/src/index.ts",
        "docs/handoff/manifests/agent-execution-queue.json",
        "docs/handoff/manifests/agent-task-tracking-sync.json",
        "scripts/handoff/verify-agent-task-sync.mjs",
        "apps/web/lib/agentTaskTrackingRuntime.ts",
        "apps/web/tests/agent-task-tracking-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609025000_add_agent_task_tracking_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of agentTaskTrackingRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable AgentTaskTrackingRun persistence for GitHub issue/project traceability proof", () => {
    expect(agentTaskTrackingRunPersistenceContract.prismaModel).toBe("AgentTaskTrackingRun");
    expect(agentTaskTrackingRunPersistenceContract.tenantRelation).toBe("agentTaskTrackingRuns");
    expect(agentTaskTrackingRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(agentTaskTrackingRunPersistenceContract.jsonFields).toEqual([
      "queueTaskMatrix",
      "plannedIssueMatrix",
      "trackingLinkMatrix",
      "artifactManifest",
    ]);
    expect(agentTaskTrackingRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "queueIssueParityVerified",
        "defaultLabelsApplied",
        "targetPriorityLabelsApplied",
        "gapIdsLinked",
        "acceptanceEvidenceFieldsLinked",
        "githubIssuesCreated",
        "githubProjectItemsLinked",
        "gapTrackerLinked",
        "statusUpdatesTraceable",
      ]),
    );
    expect(agentTaskTrackingRunPersistenceContract.redactedArtifactFields).toContain("projectSyncArtifactPath");
    expect(prismaSchema).toContain("agentTaskTrackingRuns AgentTaskTrackingRun[]");
    expect(prismaSchema).toContain("model AgentTaskTrackingRun");
    expect(prismaSchema).toContain("plannedIssueMatrix                      Json");
    expect(prismaSchema).toContain("statusUpdatesTraceable                  Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "AgentTaskTrackingRun"');
    expect(prismaMigration).toContain('"statusTraceabilityArtifactPath" TEXT');
    expect(unitManifest).toContain("AgentTaskTrackingRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609025000_add_agent_task_tracking_runs/migration.sql");
  });

  it("keeps GitHub task tracking execution disabled while splitting local verifier proof from external sync proof", () => {
    const plan = buildAgentTaskTrackingRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(agentTaskTrackingRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(agentTaskTrackingRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(agentTaskTrackingRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(agentTaskTrackingRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/agent-task-tracking-runtime.json",
      "coverage/agent-task-tracking-sync-verifier.json",
      "test-results/agent-task-tracking-runtime",
    ]);
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/agent-task-tracking-issue-create-redacted.json",
        "coverage/agent-task-tracking-project-sync-redacted.json",
        "coverage/agent-task-tracking-doc-links.json",
        "coverage/agent-task-tracking-gap-links.json",
        "coverage/agent-task-tracking-status-traceability.json",
        "coverage/agent-task-tracking-ci-run-redacted.json",
        "coverage/agent-task-tracking-redacted-evidence-bundle.json",
      ]),
    );
    expect(plan.taskSyncVerifierExecutionAllowed).toBe(false);
    expect(plan.githubIssueCreationAllowed).toBe(false);
    expect(plan.githubProjectSyncAllowed).toBe(false);
    expect(plan.handoffDocLinkExecutionAllowed).toBe(false);
    expect(plan.gapTrackerLinkExecutionAllowed).toBe(false);
    expect(plan.statusTraceabilityExecutionAllowed).toBe(false);
    expect(plan.ledgerVerificationExecutionAllowed).toBe(false);
    expect(plan.handoffAuditExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(agentTaskTrackingRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyQueueAndTrackingLabels: true,
      githubIssueCreationRequiresApprovedGhContext: true,
      githubProjectSyncRequiresApprovedGhContext: true,
      redactedTrackingUrlsOnly: true,
      statusTraceabilityRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.externalEvidenceRequired).toBe(agentTaskTrackingRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted agent task tracking evidence bundle must omit raw issue URLs, project item URLs, tracking URLs, actors, provider labels, run URLs, and private metadata.",
    );
  });

  it("redacts agent task tracking artifacts before review or persistence", () => {
    const rawArtifact = {
      issueUrl: "https://github.com/dominator509/InkRoute/issues/123",
      projectItemUrl: "https://github.com/orgs/dominator509/projects/1/views/1?pane=issue&itemId=project_issue_123",
      trackingUrl: "https://github.com/dominator509/InkRoute/issues/123#status",
      githubPayload: { actorEmail: "owner@example.com", token: "ghp_secret" },
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      queueEntry: { taskId: "task_sync_123", assignee: "owner@example.com" },
      handoffDocLink: "docs/handoff/AGENT_EXECUTION_QUEUE.md#task_sync_123",
      gapTrackerLink: "GAP_TRACKER.md#GAP-123 task_sync_123",
      statusTrace: "issue_123 moved from queued to done by user_admin_123",
      ledgerVerificationLog: "verify-agent-task-sync output includes project_issue_123",
      neutralTrackingTrace: "queue_task_01HZYXZYXZYXZYXZYXZYXZYXZ linked issue_item_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralStatusTrace: "status_trace_01HZYXZYXZYXZYXZYXZYXZYXZ updated tracking_link_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralCiTrace: "workflow ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ checked commit_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralRepositoryTrace:
        "repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ",
      neutralArtifactTrace: "docs/handoff/private-agent-task-tracking.md and coverage/agent-task-tracking/private.json",
      neutralDatabaseTrace: "AgentTaskTrackingRun persisted to postgresql://tenant_demo:secret@db.example.com/inkroute",
      stackTrace: "Error: agent task tracking sync leaked private metadata",
      nested: {
        authorization: "Bearer task-tracking-token",
        tenantId: "tenant_demo",
        phone: "+1 555 232 1111",
      },
    };
    const redacted = buildRedactedAgentTaskTrackingArtifact(rawArtifact);
    const review = buildAgentTaskTrackingRuntimeArtifactReview("coverage/agent-task-tracking-issue-create-redacted.json", rawArtifact);
    const bundle = buildAgentTaskTrackingRuntimeRedactedEvidenceBundle("coverage/agent-task-tracking-issue-create-redacted.json", rawArtifact);
    const serialized = JSON.stringify(bundle);

    expect(JSON.stringify(redacted)).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("ghp_secret");
    expect(serialized).not.toContain("Bearer task-tracking-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("+1 555 232 1111");
    expect(serialized).not.toContain("project_issue_123");
    expect(serialized).not.toContain("task_sync_123");
    expect(serialized).not.toContain("AGENT_EXECUTION_QUEUE.md");
    expect(serialized).not.toContain("GAP_TRACKER.md");
    expect(serialized).not.toContain("user_admin_123");
    expect(serialized).not.toContain("verify-agent-task-sync output");
    expect(serialized).not.toContain("private metadata");
    expect(serialized).not.toContain("queue_task_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("issue_item_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("status_trace_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("tracking_link_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("ci_run_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("repository_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("branch_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("pr_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("reviewer_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("codeowner_private_01HZYXZYXZYXZYXZYXZYXZYXZ");
    expect(serialized).not.toContain("docs/handoff/private-agent-task-tracking.md");
    expect(serialized).not.toContain("postgresql://tenant_demo:secret@db.example.com/inkroute");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "ciRunUrl",
        "gapTrackerLink",
        "githubPayload",
        "handoffDocLink",
        "issueUrl",
        "ledgerVerificationLog",
        "neutralArtifactTrace",
        "neutralCiTrace",
        "neutralDatabaseTrace",
        "neutralRepositoryTrace",
        "neutralStatusTrace",
        "neutralTrackingTrace",
        "phone",
        "projectItemUrl",
        "queueEntry",
        "stackTrace",
        "statusTrace",
        "trackingUrl",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(agentTaskTrackingRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "GitHub issue creation and Project sync must be performed only in approved GitHub context with tracking URLs redacted.",
        "Handoff doc links, GAP_TRACKER links, and status traceability artifacts must redact issue URLs, project item URLs, actors, and private metadata.",
        "CI agent task tracking artifacts must redact run URLs, tokens, provider labels, and raw logs before retention.",
        "AgentTaskTrackingRun persistence must execute only against an approved provider-backed database.",
        "Redacted agent task tracking evidence bundle must omit raw issue URLs, project item URLs, tracking URLs, actors, provider labels, run URLs, and private metadata.",
      ]),
    );
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.sourceArtifactPath).toBe("coverage/agent-task-tracking-issue-create-redacted.json");
    expect(bundle.artifactPath).toBe("coverage/agent-task-tracking-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(agentTaskTrackingRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(agentTaskTrackingRuntimeRequiredExternalEvidence);
    expect(bundle.githubIssueCreationAllowed).toBe(false);
    expect(bundle.githubProjectSyncAllowed).toBe(false);
    expect(bundle.statusTraceabilityExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
    expect(bundle.persistenceExecutionAllowed).toBe(false);
  });
});



