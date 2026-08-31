import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPrivacyRetentionArtifactReview,
  buildPrivacyRetentionEvidenceDecision,
  buildPrivacyRetentionExecutionPlan,
  buildPrivacyRetentionRunData,
  buildRedactedPrivacyRetentionArtifact,
  persistPrivacyRetentionRun,
  privacyRetentionArtifactPaths,
  privacyRetentionEvidenceFlags,
  privacyRetentionExternalArtifacts,
  privacyRetentionExternalCommands,
  privacyRetentionExecutionPolicy,
  privacyRetentionLocalArtifacts,
  privacyRetentionLocalCommands,
  privacyRetentionRequiredExternalEvidence,
  privacyRetentionRuntimeCommands,
  privacyRetentionRuntimeControls,
  privacyRetentionRuntimeMatrix,
  privacyRetentionRuntimeProofFiles,
  privacyRetentionRuntimeReadiness,
  privacyRetentionRunPersistenceContract,
} from "../lib/privacyRetentionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("privacy retention dry-run runtime contract", () => {
  const securityPackageJson = readRepoFile("packages/security/package.json");
  const securitySource = readRepoFile("packages/security/src/index.ts");
  const securityTests = readRepoFile("packages/security/tests/upload-policy.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const privacyRetentionRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034700_add_privacy_retention_runs/migration.sql");

  it("pins privacy retention commands, matrix rows, and artifact paths", () => {
    expect(privacyRetentionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
      "privacy request worker integration tests",
      "Prisma privacy delete/anonymize dry run",
      "object storage deletion dry run",
      "tenant isolation privacy dry run",
      "backup/restore tombstone replay drill",
      "GitHub Actions privacy retention evidence job",
    ]);
    expect(privacyRetentionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "security-package-gates",
      "attorney-notification-approval",
      "privacy-worker-persistence",
      "prisma-object-storage-dry-runs",
      "tenant-isolation-legal-hold-dry-runs",
      "backup-restore-tombstone-replay",
      "ci-redacted-evidence",
    ]);
    expect(privacyRetentionArtifactPaths).toContain("coverage/privacy-retention-runtime.json");
    expect(privacyRetentionArtifactPaths).toContain("coverage/privacy-retention-secret-safe-artifacts.json");
    expect(privacyRetentionArtifactPaths).toContain("test-results/privacy-retention-runtime");
  });

  it("pins privacy retention runtime control helper identity", () => {
    const decision = buildPrivacyRetentionEvidenceDecision({
      commands: privacyRetentionRuntimeCommands,
      artifacts: privacyRetentionArtifactPaths,
      controls: privacyRetentionRuntimeControls,
      evidence: Object.fromEntries(privacyRetentionEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof privacyRetentionEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(privacyRetentionRuntimeControls);
    expect(gapTracker).toContain("privacyRetentionRuntimeControls");
  });

  it("keeps security scripts, dry-run evidence helper, privacy tests, and audit persistence visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(securityPackageJson).toContain(`"${scriptName}"`);
    }
    expect(securitySource).toContain("buildPrivacyRetentionDryRunEvidencePlan");
    expect(securitySource).toContain("PrivacyRequest/PrivacyCase and AuditLog persistence");
    expect(securityTests).toContain("blocks privacy retention dry-run evidence until workers, legal approval, storage, tombstones, CI, and redaction are proven");
    expect(securityTests).toContain("marks privacy retention dry-run evidence ready when legal, workers, storage, tombstones, CI, and redaction align");
    expect(schema).toContain("model AuditLog");
  });

  it("keeps privacy retention evidence blocked until legal, worker, data, tombstone, CI, and redaction proof exists", () => {
    expect(privacyRetentionRuntimeReadiness.status).toBe("blocked");
    expect(privacyRetentionRuntimeReadiness.missingScripts).toEqual([]);
    expect(privacyRetentionRuntimeReadiness.requiredCommands).toBe(privacyRetentionRuntimeCommands);
    expect(privacyRetentionRuntimeReadiness.requiredControls).toBe(privacyRetentionRuntimeControls);
    expect(privacyRetentionRuntimeReadiness.requiredEvidence).toBe(privacyRetentionEvidenceFlags);
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Attorney approval must be captured for retention, export, delete, anonymization, notification, and legal-hold behavior.",
    );
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Delete/anonymize worker dry-runs must persist tombstones, skipped legal holds, and audit events.",
    );
    expect(privacyRetentionRuntimeReadiness.blockers).toContain(
      "Privacy retention artifacts must be redacted and free of secrets, client PII, medical notes, and provider tokens.",
    );
  });

  it("pins the PrivacyRetentionRun persistence model and migration", () => {
    const runData = buildPrivacyRetentionRunData({
      tenantId: "tenant_static",
      runId: "privacy_retention_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["privacy request worker integration tests"],
      artifacts: ["coverage/privacy-retention-worker-output-redacted.json"],
      attorneyApprovalEvidenceCaptured: false,
      workerPersistenceEvidenceCaptured: true,
      prismaDryRunEvidenceCaptured: false,
      objectStorageDryRunEvidenceCaptured: false,
      tenantIsolationEvidenceCaptured: false,
      legalHoldEvidenceCaptured: false,
      tombstoneReplayEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      retentionReportPath: "coverage/privacy-retention-runtime.json",
      tombstoneReplayReportPath: "coverage/privacy-retention-tombstone-replay.json",
    });

    expect(privacyRetentionRunPersistenceContract).toEqual({
      prismaModel: "PrivacyRetentionRun",
      tenantRelation: "privacyRetentionRuns",
      migration: "20260609034700_add_privacy_retention_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesAttorneyApprovalEvidence: true,
      storesWorkerPersistenceEvidence: true,
      storesPrismaDryRunEvidence: true,
      storesObjectStorageDryRunEvidence: true,
      storesTenantIsolationEvidence: true,
      storesLegalHoldEvidence: true,
      storesTombstoneReplayEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "privacy_retention_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["privacy request worker integration tests"],
      artifactManifest: ["coverage/privacy-retention-worker-output-redacted.json"],
      attorneyApprovalEvidenceCaptured: false,
      workerPersistenceEvidenceCaptured: true,
      tombstoneReplayEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      retentionReportPath: "coverage/privacy-retention-runtime.json",
      tombstoneReplayReportPath: "coverage/privacy-retention-tombstone-replay.json",
    });
    expect(String(persistPrivacyRetentionRun)).toContain("repository.privacyRetentionRun.upsert");
    expect(prismaSchema).toContain("model PrivacyRetentionRun");
    expect(prismaSchema).toContain("privacyRetentionRuns PrivacyRetentionRun[]");
    expect(prismaSchema).toContain("attorneyApprovalEvidenceCaptured");
    expect(prismaSchema).toContain("tombstoneReplayEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(privacyRetentionRunMigration).toContain('CREATE TABLE "PrivacyRetentionRun"');
    expect(privacyRetentionRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(privacyRetentionRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(privacyRetentionRunMigration).toContain('"PrivacyRetentionRun_tenantId_runId_key"');
  });

  it("blocks privacy retention completion when legal approval, workers, tombstones, or safe evidence are missing", () => {
    const decision = buildPrivacyRetentionEvidenceDecision({
      commands: ["pnpm --filter @inkroute/security typecheck"],
      artifacts: ["coverage/privacy-retention-security-typecheck.txt"],
      controls: ["verify-requester-identity-before-privacy-workers-run"],
      evidence: {
        securityTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("backup/restore tombstone replay drill");
    expect(decision.missingArtifacts).toContain("coverage/privacy-retention-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("enforce-legal-holds-before-destructive-actions");
    expect(decision.missingEvidence).toContain("attorneyApprovalCaptured");
    expect(decision.missingEvidence).toContain("deleteAnonymizeWorkerPersisted");
    expect(decision.blockers).toContain(
      "Attorney approval must be captured for retention, export, delete, anonymization, notification, and legal-hold behavior.",
    );
    expect(decision.blockers).toContain(
      "Delete/anonymize worker dry-runs must persist tombstones, skipped legal holds, and audit events.",
    );
  });

  it("completes privacy retention only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(privacyRetentionEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildPrivacyRetentionEvidenceDecision({
      commands: privacyRetentionRuntimeCommands,
      artifacts: privacyRetentionArtifactPaths,
      controls: privacyRetentionRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(privacyRetentionEvidenceFlags);
  });

  it("keeps privacy retention execution classified, redacted, and attorney/worker-gated", () => {
    const executionPlan = buildPrivacyRetentionExecutionPlan();
    expect(executionPlan.localCommands).toBe(privacyRetentionLocalCommands);
    expect(executionPlan.localCommands).toEqual([
      "pnpm --filter @inkroute/security typecheck",
      "pnpm --filter @inkroute/security test",
    ]);
    expect(executionPlan.externalCommands).toBe(privacyRetentionExternalCommands);
    expect(executionPlan.localArtifacts).toBe(privacyRetentionLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(privacyRetentionExternalArtifacts);
    expect(executionPlan.externalCommands).toContain("privacy request worker integration tests");
    expect(executionPlan.externalCommands).toContain("provider-backed persistPrivacyRetentionRun execution proof");
    expect(executionPlan.localArtifacts).toContain("coverage/privacy-retention-security-test.txt");
    expect(executionPlan.externalArtifacts).toContain("coverage/privacy-retention-attorney-approval-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("provider-backed PrivacyRetentionRun persistence proof");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.attorneyApprovalExecutionAllowed).toBe(false);
    expect(executionPlan.privacyWorkerExecutionAllowed).toBe(false);
    expect(executionPlan.storageExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(privacyRetentionExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticPrivacyRetentionReadiness: true,
      attorneyApprovalRequiredForClosure: true,
      nonProductionDryRunRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(privacyRetentionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed PrivacyRetentionRun persistence row captured through persistPrivacyRetentionRun.",
    );

    const artifact = {
      attorneyEmail: "counsel@example.com",
      clientEmail: "client@example.com",
      medicalNote: "private medical note",
      providerToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
      repositorySelector: "repo:dominator509/InkRoute",
      pullRequestSelector: "pr_privacy_retention",
      reviewerHandle: "reviewer_privacy_owner",
      codeownerSelector: "CODEOWNER:privacy-platform-team",
      nested: {
        objectStorageUrl: "s3://inkroute-private/client-file.png",
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        tombstoneId: "tombstone_1234567890abcdefghijklmnopqrstuvwxyz",
        publicSummary: "privacy retention evidence captured",
      },
    };
    const redactedOnly = buildRedactedPrivacyRetentionArtifact(artifact);
    const review = buildPrivacyRetentionArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("counsel@example.com");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("private medical note");
    expect(serialized).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(serialized).not.toContain("s3://inkroute-private/client-file.png");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("tombstone_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("pr_privacy_retention");
    expect(serialized).not.toContain("reviewer_privacy_owner");
    expect(serialized).not.toContain("CODEOWNER:privacy-platform-team");
    expect(review.redactions).toEqual([
      "attorneyEmail",
      "clientEmail",
      "medicalNote",
      "providerToken",
      "repositorySelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.objectStorageUrl",
      "nested.databaseUrl",
      "nested.tombstoneId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(privacyRetentionRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming privacy retention production readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 privacy retention runtime contracts");
    expect(ciWorkflow).toContain("privacy-retention-runtime-static.test.ts");
    expect(ciWorkflow).toContain("privacy-retention-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/privacy-retention-runtime.json");
    expect(unitManifest).toContain("unit-web-privacy-retention-runtime-static");
    expect(unitManifest).toContain("PrivacyRetentionRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/privacyRetentionRuntime.ts");
    expect(gapTracker).toContain("persistPrivacyRetentionRun upsert seam");
    expect(gapTracker).toContain("GAP-025 is privacy-retention-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live attorney approval, provider-backed persistPrivacyRetentionRun execution, persisted DB/storage privacy workers, production dry-run artifacts, backup/restore tombstone replay proof, notification approval, CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildPrivacyRetentionExecutionPlan");
    expect(gapTracker).toContain("privacyRetentionLocalCommands/privacyRetentionExternalCommands");
    expect(gapTracker).toContain("privacyRetentionExecutionPolicy");
    expect(gapTracker).toContain("privacyRetentionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedPrivacyRetentionArtifact");
    expect(gapTracker).toContain("buildPrivacyRetentionArtifactReview");
  });

  it("pins current privacy retention proof files for GAP-025", () => {
    expect(privacyRetentionRuntimeProofFiles).toContain("packages/security/package.json");
    expect(privacyRetentionRuntimeProofFiles).toContain("apps/web/lib/privacyRetentionRuntime.ts");
    expect(privacyRetentionRuntimeProofFiles).toContain("apps/web/tests/privacy-retention-runtime-static.test.ts");
    for (const proofFile of privacyRetentionRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


