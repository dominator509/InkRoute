import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  agentTaskTrackingDefaultLabels,
  agentTaskTrackingRuntimeArtifactPaths,
  agentTaskTrackingRuntimeCommands,
  agentTaskTrackingRuntimeMatrix,
  agentTaskTrackingRuntimeReadiness,
  agentTaskTrackingRunPersistenceContract,
  agentTaskTrackingTargets,
  agentTaskTrackingTaskIds,
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
      "pnpm handoff:verify-ledger",
      "pnpm handoff:audit",
    ]);
    expect(agentTaskTrackingRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "task-sync-verifier",
      "github-issue-create",
      "github-project-sync",
      "handoff-doc-links",
      "gap-tracker-links",
      "status-traceability",
    ]);
    expect(agentTaskTrackingRuntimeArtifactPaths).toContain("coverage/agent-task-tracking-issue-create-redacted.json");
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
    expect(agentTaskTrackingRuntimeReadiness.requiredCommands).toEqual([...agentTaskTrackingRuntimeCommands]);
    expect(agentTaskTrackingRuntimeReadiness.requiredEvidence).toEqual([
      "One redacted issue label or URL for every queued agent task.",
      "Project item labels or documented blocker for every tracked task.",
      "Labels for agent-task, gap-tracked, verification-required, target, and priority.",
      "Gap IDs and acceptance evidence fields on every issue.",
      "Handoff docs and GAP_TRACKER.md links to tracking evidence.",
      "Traceable status updates from issue/project state into the execution ledger.",
    ]);
    expect(agentTaskTrackingRuntimeReadiness.blockers).toEqual([
      "pnpm handoff:verify-task-sync must pass.",
      "GitHub issues must be created for every queued agent task.",
      "GitHub Project items must be linked or explicitly documented as unavailable for every task.",
      "Handoff docs must link to the redacted issue/project tracking labels.",
      "GAP_TRACKER.md must reference the task tracking evidence where relevant.",
      "Task status updates must be traceable between queue, issues/projects, ledger, and gap tracker.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming GitHub sync is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 agent task tracking runtime contracts");
    expect(ciWorkflow).toContain("agent-task-tracking-runtime-static.test.ts");
    expect(ciWorkflow).toContain("agent-task-tracking-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-agent-task-tracking-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/agentTaskTrackingRuntime.ts");
    expect(gapTracker).toContain("live GitHub issue/project creation and traceable status-update proof remain open");
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
});
