import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildLegalReviewEvidenceDecision,
  buildLegalReviewExecutionPlan,
  buildLegalReviewArtifactReview,
  buildLegalReviewRunData,
  buildRedactedLegalReviewArtifact,
  legalReviewExternalArtifacts,
  legalReviewExternalCommands,
  legalReviewExecutionPolicy,
  legalReviewLocalArtifacts,
  legalReviewLocalCommands,
  legalReviewRequiredArtifactPaths,
  legalReviewRuntimeRequiredEvidence,
  legalReviewRequiredExternalEvidence,
  legalReviewRequiredItemIds,
  legalReviewRunPersistenceContract,
  legalReviewRuntimeArtifactPaths,
  legalReviewRuntimeCommands,
  legalReviewRuntimeMatrix,
  legalReviewRuntimeProofFiles,
  legalReviewRuntimeReadiness,
  persistLegalReviewRun,
} from "../lib/legalReviewRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("legal review runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const legalPacket = readRepoFile("docs/legal/LEGAL_REVIEW_PACKET.md");
  const legalContract = readRepoFile("docs/legal/manifests/legal-review-contract.json");
  const legalEvidence = readRepoFile("docs/legal/manifests/legal-review-evidence.json");
  const legalVerifier = readRepoFile("scripts/legal/verify-legal-review.mjs");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const legalReviewMigration = readRepoFile(
    "packages/db/prisma/migrations/20260609033700_add_legal_review_runs/migration.sql",
  );
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins legal review items, artifacts, commands, matrix rows, and runtime artifacts", () => {
    expect(legalReviewRequiredItemIds).toEqual([
      "privacy",
      "terms",
      "consent",
      "medical-acknowledgments",
      "payments-refunds",
      "sms-notifications",
      "aftercare",
    ]);
    expect(legalReviewRequiredArtifactPaths).toContain("docs/legal/manifests/legal-review-evidence.json");
    expect(legalReviewRuntimeCommands).toEqual([
      "pnpm legal:verify-review",
      "pnpm quality:gates",
      "pnpm quality:all",
      "GitHub Actions CI quality job",
      "qualified counsel review outside the repository",
    ]);
    expect(legalReviewRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "legal-review-audit",
      "quality-gates-legal-review",
      "quality-all-legal-chain",
      "ci-quality-legal-review",
      "qualified-counsel-review",
      "placeholder-replacement-after-approval",
      "privileged-advice-exclusion",
      "production-launch-block",
    ]);
    expect(legalReviewRuntimeArtifactPaths).toContain("coverage/legal-review-runtime.json");
    expect(legalReviewRuntimeArtifactPaths).toContain("test-results/legal-review-runtime");
  });

  it("pins the LegalReviewRun persistence model and migration", () => {
    const runData = buildLegalReviewRunData({
      tenantId: "tenant_static",
      runId: "legal_static",
      commitSha: "abc123",
      status: "blocked",
      approvedReviewItemIds: ["privacy"],
      runtimeArtifactPaths: ["coverage/legal-review-runtime.json"],
      redactedEvidenceLabels: ["privacy-approval-redacted"],
      launchBlockers: ["qualified-counsel-approval-required"],
      legalReviewAuditPassed: false,
      redactedEvidenceLabelsPresent: true,
      privilegedAdviceExcluded: true,
      placeholderCopyReplacedAfterApproval: false,
      legalVerifyCommandPassed: false,
      ciQualityGateIncludesLegalReview: true,
      ciLegalEvidenceCaptured: false,
      productionLaunchBlockedUntilApproval: true,
      qualifiedCounselApprovalCaptured: false,
      legalReviewAuditArtifactPath: "coverage/legal-review-audit-output.txt",
    });

    expect(legalReviewRunPersistenceContract.model).toBe("LegalReviewRun");
    expect(legalReviewRunPersistenceContract.tenantRelation).toBe("legalReviewRuns");
    expect(legalReviewRunPersistenceContract.migration).toBe("20260609033700_add_legal_review_runs");
    expect(legalReviewRunPersistenceContract.jsonFields).toEqual([
      "requiredReviewItemManifest",
      "approvedReviewItemManifest",
      "artifactManifest",
      "redactedEvidenceLabelManifest",
      "launchBlockerManifest",
    ]);
    expect(legalReviewRunPersistenceContract.evidenceBooleans).toContain("qualifiedCounselApprovalCaptured");
    expect(legalReviewRunPersistenceContract.evidenceBooleans).toContain("privilegedAdviceExcluded");
    expect(legalReviewRunPersistenceContract.evidenceBooleans).toContain("productionLaunchBlockedUntilApproval");
    expect(legalReviewRunPersistenceContract.artifactFields).toContain("counselApprovalRedactedArtifactPath");
    expect(legalReviewRunPersistenceContract.artifactFields).toContain("ciRunUrl");
    expect(prismaSchema).toContain("legalReviewRuns LegalReviewRun[]");
    expect(prismaSchema).toContain("model LegalReviewRun");
    expect(prismaSchema).toContain("redactedEvidenceLabelManifest");
    expect(prismaSchema).toContain("qualifiedCounselApprovalCaptured");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(legalReviewMigration).toContain('CREATE TABLE "LegalReviewRun"');
    expect(legalReviewMigration).toContain('"launchBlockerManifest" JSONB NOT NULL');
    expect(legalReviewMigration).toContain('"qualifiedCounselApprovalCaptured" BOOLEAN NOT NULL DEFAULT false');
    expect(legalReviewMigration).toContain('CREATE UNIQUE INDEX "LegalReviewRun_tenantId_runId_key"');
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "legal_static",
      commitSha: "abc123",
      status: "blocked",
      privilegedAdviceExcluded: true,
      productionLaunchBlockedUntilApproval: true,
      qualifiedCounselApprovalCaptured: false,
      legalReviewAuditArtifactPath: "coverage/legal-review-audit-output.txt",
    });
    expect(runData.requiredReviewItemManifest).toBe(legalReviewRequiredItemIds);
    expect(runData.approvedReviewItemManifest).toEqual(["privacy"]);
    expect(runData.redactedEvidenceLabelManifest).toEqual(["privacy-approval-redacted"]);
    expect(String(persistLegalReviewRun)).toContain("repository.legalReviewRun.upsert");
  });

  it("keeps legal packet, manifests, verifier, package helper tests, and scripts wired", () => {
    expect(rootPackageJson).toContain('"legal:verify-review"');
    expect(rootPackageJson).toContain("verify-legal-review.mjs");
    expect(legalPacket).toContain("Legal Review Packet");
    expect(legalContract).toContain("privacy");
    expect(legalEvidence).toContain("legal-review-evidence");
    expect(legalVerifier).toContain("buildLegalReviewRuntimeReadinessPlan");
    expect(qualityTests).toContain("buildLegalReviewRuntimeReadinessPlan");
  });

  it("keeps approval blockers explicit while artifacts and launch blocking are wired", () => {
    expect(legalReviewRuntimeReadiness.status).toBe("blocked");
    expect(legalReviewRuntimeReadiness.missingApprovedItems).toEqual([...legalReviewRequiredItemIds]);
    expect(legalReviewRuntimeReadiness.missingArtifacts).toEqual([]);
    expect(legalReviewRuntimeReadiness.requiredCommands).toBe(legalReviewRuntimeCommands);
    expect(legalReviewRuntimeReadiness.requiredEvidence).toBe(legalReviewRuntimeRequiredEvidence);
    expect(legalReviewRuntimeReadiness.blockers).toContain(
      "Every required legal review item must be attorney-approved before production launch.",
    );
    expect(legalReviewRuntimeReadiness.blockers).toContain("pnpm legal:verify-review must pass.");
  });

  it("blocks legal review completion until every item, artifact, command, and redacted evidence flag is present", () => {
    const decision = buildLegalReviewEvidenceDecision({
      approvedReviewItemIds: ["privacy"],
      requiredArtifactPaths: ["docs/legal/LEGAL_REVIEW_PACKET.md"],
      runtimeArtifactPaths: ["coverage/legal-review-runtime.json"],
      commands: ["pnpm legal:verify-review"],
      evidence: {
        privilegedAdviceExcluded: true,
        productionLaunchBlockedUntilApproval: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingApprovedItems).toContain("terms");
    expect(decision.missingRequiredArtifacts).toContain("docs/legal/manifests/legal-review-evidence.json");
    expect(decision.missingRuntimeArtifacts).toContain("coverage/legal-review-counsel-approval-redacted.json");
    expect(decision.missingCommands).toContain("qualified counsel review outside the repository");
    expect(decision.missingEvidence).toContain("qualifiedCounselApprovalCaptured");
    expect(decision.blockers).toContain("Legal review item 'terms' must be attorney-approved before production launch.");
    expect(decision.blockers).toContain("Qualified counsel approval must be captured as redacted evidence labels.");
  });

  it("completes legal review only after every required item and evidence flag is satisfied", () => {
    const completeEvidence = Object.fromEntries(
      legalReviewRunPersistenceContract.evidenceBooleans.map((flag) => [flag, true]),
    );
    const decision = buildLegalReviewEvidenceDecision({
      approvedReviewItemIds: legalReviewRequiredItemIds,
      requiredArtifactPaths: legalReviewRequiredArtifactPaths,
      runtimeArtifactPaths: legalReviewRuntimeArtifactPaths,
      commands: legalReviewRuntimeCommands,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingApprovedItems).toEqual([]);
    expect(decision.missingRequiredArtifacts).toEqual([]);
    expect(decision.missingRuntimeArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toEqual(legalReviewRunPersistenceContract.evidenceBooleans);
  });

  it("keeps legal review execution classified, redacted, and counsel-gated", () => {
    const executionPlan = buildLegalReviewExecutionPlan();
    expect(executionPlan.localCommands).toBe(legalReviewLocalCommands);
    expect(executionPlan.localCommands).toEqual(["pnpm legal:verify-review", "pnpm quality:gates", "pnpm quality:all"]);
    expect(executionPlan.externalCommands).toBe(legalReviewExternalCommands);
    expect(executionPlan.externalCommands).toEqual([
      "GitHub Actions CI quality job",
      "qualified counsel review outside the repository",
    ]);
    expect(executionPlan.localArtifacts).toBe(legalReviewLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(legalReviewExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/legal-review-privileged-advice-exclusion.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/legal-review-counsel-approval-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("test-results/legal-review-runtime");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.attorneyReviewExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.legalAdviceGenerationAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(legalReviewExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticLegalReadiness: true,
      qualifiedCounselApprovalRequiredForClosure: true,
      privilegedAdviceMustStayOutOfRepo: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(legalReviewRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed LegalReviewRun persistence row captured through persistLegalReviewRun.",
    );

    const artifact = {
      attorneyEmail: "counsel@example.com",
      clientPhone: "+1 555 222 1212",
      privilegedAdvice: "Attorney legal advice should never be committed.",
      approvalSignature: "Jane Counsel / Bar 1234567890",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        evidenceId: "legal_review_evidence_1234567890",
        publicLabel: "privacy-approval-redacted",
      },
    };
    const redactedOnly = buildRedactedLegalReviewArtifact(artifact);
    const review = buildLegalReviewArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("counsel@example.com");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("Attorney legal advice should never be committed.");
    expect(serialized).not.toContain("Jane Counsel");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("legal_review_evidence_1234567890");
    expect(review.redactions).toEqual([
      "attorneyEmail",
      "clientPhone",
      "privilegedAdvice",
      "approvalSignature",
      "nested.databaseUrl",
      "nested.evidenceId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(legalReviewRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming attorney approval exists", () => {
    expect(ciWorkflow).toContain("Run Phase 1 legal review runtime contracts");
    expect(ciWorkflow).toContain("legal-review-runtime-static.test.ts");
    expect(ciWorkflow).toContain("legal-review-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-legal-review-runtime-static");
    expect(unitManifest).toContain("LegalReviewRun Prisma model and app row contract");
    expect(gapTracker).toContain("LegalReviewRun");
    expect(gapTracker).toContain("apps/web/lib/legalReviewRuntime.ts");
    expect(gapTracker).toContain("persistLegalReviewRun upsert seam");
    expect(gapTracker).toContain("live qualified-counsel approval, redacted approval evidence, placeholder replacement, legal audit pass, provider-backed persistLegalReviewRun execution, and CI legal evidence remain open");
    expect(gapTracker).toContain("GAP-013 is legal-review-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildLegalReviewExecutionPlan");
    expect(gapTracker).toContain("legalReviewLocalCommands/legalReviewExternalCommands");
    expect(gapTracker).toContain("legalReviewExecutionPolicy");
    expect(gapTracker).toContain("legalReviewRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedLegalReviewArtifact");
    expect(gapTracker).toContain("buildLegalReviewArtifactReview");
  });

  it("pins current legal review proof files for GAP-013", () => {
    expect(legalReviewRuntimeProofFiles).toContain("apps/web/lib/legalReviewRuntime.ts");
    expect(legalReviewRuntimeProofFiles).toContain("apps/web/tests/legal-review-runtime-static.test.ts");
    for (const proofFile of legalReviewRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

