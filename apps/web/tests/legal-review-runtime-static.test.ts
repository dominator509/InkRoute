import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  legalReviewRequiredArtifactPaths,
  legalReviewRequiredItemIds,
  legalReviewRunPersistenceContract,
  legalReviewRuntimeArtifactPaths,
  legalReviewRuntimeCommands,
  legalReviewRuntimeMatrix,
  legalReviewRuntimeReadiness,
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
    expect(legalReviewRuntimeReadiness.requiredCommands).toEqual([...legalReviewRuntimeCommands]);
    expect(legalReviewRuntimeReadiness.requiredEvidence).toEqual([
      "Legal review audit output showing every required item approved.",
      "Redacted evidence labels for privacy, terms, consent, medical, payments/refunds, SMS/notifications, and aftercare review items.",
      "Required legal artifacts exist in the repo and match the approved review packet.",
      "No privileged attorney advice, secrets, or client data are committed.",
      "Placeholder legal/compliance copy is replaced only after approval is recorded.",
      "CI quality gate evidence includes legal review verification.",
    ]);
    expect(legalReviewRuntimeReadiness.blockers).toContain(
      "Every required legal review item must be attorney-approved before production launch.",
    );
    expect(legalReviewRuntimeReadiness.blockers).toContain("pnpm legal:verify-review must pass.");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming attorney approval exists", () => {
    expect(ciWorkflow).toContain("Run Phase 1 legal review runtime contracts");
    expect(ciWorkflow).toContain("legal-review-runtime-static.test.ts");
    expect(ciWorkflow).toContain("legal-review-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-legal-review-runtime-static");
    expect(unitManifest).toContain("LegalReviewRun Prisma model and app row contract");
    expect(gapTracker).toContain("LegalReviewRun");
    expect(gapTracker).toContain("apps/web/lib/legalReviewRuntime.ts");
    expect(gapTracker).toContain("live qualified-counsel approval, redacted approval evidence, placeholder replacement, legal audit pass, and CI legal evidence remain open");
  });
});
