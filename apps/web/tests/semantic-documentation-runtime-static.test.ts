import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSemanticDocumentationDecisionRequiredEvidence,
  semanticDocumentationChecks,
  semanticDocumentationRuntimeArtifactPaths,
  semanticDocumentationRuntimeCommands,
  semanticDocumentationRuntimeExternalArtifacts,
  semanticDocumentationRuntimeExternalCommands,
  semanticDocumentationRuntimeExecutionPolicy,
  semanticDocumentationRuntimeLocalArtifacts,
  semanticDocumentationRuntimeLocalCommands,
  semanticDocumentationRuntimeMatrix,
  semanticDocumentationRuntimeProofFiles,
  semanticDocumentationRuntimeReadiness,
  semanticDocumentationRuntimeRequiredExternalEvidence,
  semanticDocumentationRuntimeRequiredEvidence,
  semanticDocumentationRunPersistenceContract,
  buildSemanticDocumentationEvidenceDecision,
  buildSemanticDocumentationRuntimeArtifactReview,
  buildSemanticDocumentationRuntimeExecutionPlan,
  buildRedactedSemanticDocumentationArtifact,
} from "../lib/semanticDocumentationRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("semantic documentation runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const qualityProtocol = readRepoFile("docs/quality/QUALITY_GATE_PROTOCOL.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609031000_add_semantic_documentation_runs/migration.sql");

  it("pins semantic documentation commands, checks, matrix rows, and artifacts", () => {
    expect(semanticDocumentationRuntimeCommands).toEqual([
      "pnpm quality:docs",
      "node scripts/quality/audit-doc-links.mjs",
      "node scripts/quality/verify-documentation-consistency.mjs",
      "node scripts/quality/verify-documentation-inventory.mjs",
      "GitHub Actions CI quality job",
      "document that semantic docs are not runtime build or live route proof",
      "document that provider readiness proof stays separate from wording checks",
      "document that legal review proof stays separate from wording checks",
    ]);
    expect(semanticDocumentationChecks).toEqual([
      "structural-links",
      "concrete-repo-paths",
      "production-readiness-claims",
      "api-route-references",
      "provider-readiness-language",
      "legal-readiness-language",
      "app-package-inventory",
      "documentation-inventory-contract",
    ]);
    expect(semanticDocumentationRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "structural-links-and-paths",
      "semantic-consistency",
      "workspace-inventory",
      "quality-docs-aggregate",
      "ci-quality-docs",
      "runtime-proof-boundary",
      "provider-proof-boundary",
      "legal-review-boundary",
    ]);
    expect(semanticDocumentationRuntimeArtifactPaths).toContain("coverage/semantic-documentation-runtime.json");
    expect(semanticDocumentationRuntimeArtifactPaths).toContain("test-results/semantic-documentation-runtime");
  });

  it("keeps quality docs scripts and helper tests wired", () => {
    expect(rootPackageJson).toContain('"quality:docs"');
    expect(rootPackageJson).toContain("audit-doc-links.mjs");
    expect(rootPackageJson).toContain("verify-documentation-consistency.mjs");
    expect(rootPackageJson).toContain("verify-documentation-inventory.mjs");
    expect(qualityTests).toContain("buildSemanticDocumentationRuntimeReadinessPlan");
    expect(qualityProtocol).toContain("runtime");
    expect(qualityProtocol).toContain("provider");
    expect(qualityProtocol).toContain("legal");
  });

  it("keeps semantic checks wired while CI evidence remains gated", () => {
    expect(semanticDocumentationRuntimeReadiness.status).toBe("blocked");
    expect(semanticDocumentationRuntimeReadiness.failedSemanticChecks).toEqual([]);
    expect(semanticDocumentationRuntimeReadiness.requiredCommands).toBe(semanticDocumentationRuntimeCommands);
    expect(semanticDocumentationRuntimeReadiness.requiredEvidence).toBe(semanticDocumentationRuntimeRequiredEvidence);
    expect(semanticDocumentationRuntimeReadiness.blockers).toEqual([
      "CI evidence for semantic documentation audits must be captured.",
    ]);
  });

  it("blocks semantic documentation closure until CI, proof-boundary, persistence, artifact, and command evidence exist", () => {
    const decision = buildSemanticDocumentationEvidenceDecision({
      qualityDocsPassed: true,
      structuralLinksPassed: true,
      concreteRepoPathsPassed: true,
      productionReadinessClaimsPassed: true,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: true,
      legalReadinessLanguagePassed: true,
      appPackageInventoryPassed: true,
      documentationInventoryContractCurrent: true,
      ciQualityDocsEvidenceCaptured: false,
      runtimeProofSeparated: true,
      providerProofSeparated: false,
      legalReviewSeparated: false,
      semanticDocumentationRunPersisted: false,
      capturedArtifacts: [
        "coverage/semantic-documentation-runtime.json",
        "coverage/semantic-documentation-link-path-output.txt",
        "coverage/semantic-documentation-consistency-output.txt",
        "coverage/semantic-documentation-inventory-output.txt",
      ],
      completedCommands: [
        "pnpm quality:docs",
        "node scripts/quality/audit-doc-links.mjs",
        "node scripts/quality/verify-documentation-consistency.mjs",
        "node scripts/quality/verify-documentation-inventory.mjs",
      ],
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingArtifacts).toEqual([
      "coverage/semantic-documentation-ci-quality-docs.json",
      "coverage/semantic-documentation-runtime-proof-boundary.json",
      "coverage/semantic-documentation-provider-proof-boundary.json",
      "coverage/semantic-documentation-legal-review-boundary.json",
      "test-results/semantic-documentation-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "GitHub Actions CI quality job",
      "document that semantic docs are not runtime build or live route proof",
      "document that provider readiness proof stays separate from wording checks",
      "document that legal review proof stays separate from wording checks",
    ]);
    expect(decision.requiredArtifacts).toBe(semanticDocumentationRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(semanticDocumentationRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildSemanticDocumentationDecisionRequiredEvidence(semanticDocumentationRuntimeReadiness.requiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(semanticDocumentationRuntimeRequiredEvidence);
    expect(decision.blockers).toContain("CI evidence for semantic documentation audits must be captured.");
    expect(decision.blockers).toContain("Semantic documentation audit must keep provider readiness proof separate from static wording checks.");
    expect(decision.blockers).toContain("SemanticDocumentationRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required semantic documentation artifact must be captured.");
  });

  it("completes semantic documentation closure when semantic checks, CI, boundaries, persistence, artifacts, and commands are proven", () => {
    const decision = buildSemanticDocumentationEvidenceDecision({
      qualityDocsPassed: true,
      structuralLinksPassed: true,
      concreteRepoPathsPassed: true,
      productionReadinessClaimsPassed: true,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: true,
      legalReadinessLanguagePassed: true,
      appPackageInventoryPassed: true,
      documentationInventoryContractCurrent: true,
      ciQualityDocsEvidenceCaptured: true,
      runtimeProofSeparated: true,
      providerProofSeparated: true,
      legalReviewSeparated: true,
      semanticDocumentationRunPersisted: true,
      capturedArtifacts: semanticDocumentationRuntimeArtifactPaths,
      completedCommands: semanticDocumentationRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifacts while keeping runtime/provider/legal proof separate", () => {
    expect(ciWorkflow).toContain("Run Phase 17 semantic documentation runtime contracts");
    expect(ciWorkflow).toContain("semantic-documentation-runtime-static.test.ts");
    expect(ciWorkflow).toContain("semantic-documentation-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-semantic-documentation-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/semanticDocumentationRuntime.ts");
    expect(gapTracker).toContain("live CI quality-docs evidence, persisted run rows, and full artifact/command capture remain gated while runtime, provider, and legal proof remain separate gates");
    expect(gapTracker).toContain("GAP-128 is semantic-documentation-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildSemanticDocumentationDecisionRequiredEvidence");
    expect(gapTracker).toContain("semanticDocumentationRuntimeRequiredEvidence");
    expect(gapTracker).toContain("buildSemanticDocumentationRuntimeExecutionPlan");
    expect(gapTracker).toContain("semanticDocumentationRuntimeExecutionPolicy");
    expect(gapTracker).toContain("semanticDocumentationRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("semanticDocumentationRuntimeLocalArtifacts");
    expect(gapTracker).toContain("semanticDocumentationRuntimeExternalArtifacts");
    expect(gapTracker).toContain("buildSemanticDocumentationRuntimeArtifactReview");
  });

  it("pins current semantic documentation runtime proof files for GAP-128", () => {
    expect(semanticDocumentationRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/quality/manifests/documentation-consistency-audit.json",
      "docs/quality/manifests/documentation-consistency-contract.json",
      "docs/quality/manifests/documentation-inventory-audit.json",
      "docs/quality/manifests/documentation-inventory-contract.json",
      "docs/quality/manifests/markdown-link-audit.json",
      "docs/quality/manifests/quality-gates.json",
      "packages/quality/src/index.ts",
      "scripts/quality/print-quality-gates.mjs",
        "scripts/quality/audit-doc-links.mjs",
        "scripts/quality/verify-documentation-consistency.mjs",
        "scripts/quality/verify-documentation-inventory.mjs",
        "apps/web/lib/semanticDocumentationRuntime.ts",
        "apps/web/tests/semantic-documentation-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609031000_add_semantic_documentation_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of semanticDocumentationRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable SemanticDocumentationRun persistence for semantic docs and proof-boundary evidence", () => {
    expect(semanticDocumentationRunPersistenceContract.prismaModel).toBe("SemanticDocumentationRun");
    expect(semanticDocumentationRunPersistenceContract.tenantRelation).toBe("semanticDocumentationRuns");
    expect(semanticDocumentationRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(semanticDocumentationRunPersistenceContract.jsonFields).toEqual([
      "semanticCheckMatrix",
      "proofBoundaryMatrix",
      "artifactManifest",
    ]);
    expect(semanticDocumentationRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "qualityDocsPassed",
        "productionReadinessClaimsPassed",
        "providerReadinessLanguagePassed",
        "legalReadinessLanguagePassed",
        "ciQualityDocsEvidenceCaptured",
        "runtimeProofSeparated",
        "providerProofSeparated",
        "legalReviewSeparated",
      ]),
    );
    expect(semanticDocumentationRunPersistenceContract.artifactFields).toContain("runtimeBoundaryArtifactPath");
    expect(prismaSchema).toContain("semanticDocumentationRuns SemanticDocumentationRun[]");
    expect(prismaSchema).toContain("model SemanticDocumentationRun");
    expect(prismaSchema).toContain("proofBoundaryMatrix                     Json");
    expect(prismaSchema).toContain("legalReviewSeparated                    Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "SemanticDocumentationRun"');
    expect(prismaMigration).toContain('"providerBoundaryArtifactPath" TEXT');
    expect(unitManifest).toContain("SemanticDocumentationRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609031000_add_semantic_documentation_runs/migration.sql");
  });

  it("keeps GAP-128 execution policy non-executing while separating CI, runtime, provider, and legal proof", () => {
    const plan = buildSemanticDocumentationRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(semanticDocumentationRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(semanticDocumentationRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(semanticDocumentationRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(semanticDocumentationRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual([
      "coverage/semantic-documentation-runtime.json",
      "coverage/semantic-documentation-link-path-output.txt",
      "coverage/semantic-documentation-consistency-output.txt",
      "coverage/semantic-documentation-inventory-output.txt",
      "coverage/semantic-documentation-runtime-proof-boundary.json",
      "coverage/semantic-documentation-provider-proof-boundary.json",
      "coverage/semantic-documentation-legal-review-boundary.json",
    ]);
    expect(plan.externalArtifacts).toEqual([
      "coverage/semantic-documentation-ci-quality-docs.json",
      "test-results/semantic-documentation-runtime",
    ]);
    expect(plan).toMatchObject({
      qualityDocsExecutionAllowed: false,
      linkAuditExecutionAllowed: false,
      consistencyAuditExecutionAllowed: false,
      inventoryAuditExecutionAllowed: false,
      ciQualityDocsExecutionAllowed: false,
      runtimeBoundaryExecutionAllowed: false,
      providerBoundaryExecutionAllowed: false,
      legalBoundaryExecutionAllowed: false,
      persistenceExecutionAllowed: false,
    });
    expect(plan.executionPolicy).toBe(semanticDocumentationRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticSemanticDocumentation: true,
      ciQualityDocsEvidenceRequiredForClosure: true,
      providerProofMustRemainSeparate: true,
      legalReviewMustRemainSeparate: true,
      runtimeProofMustRemainSeparate: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.requiredExternalEvidence).toBe(semanticDocumentationRuntimeRequiredExternalEvidence);
    expect(plan.requiredExternalEvidence).toContain("Runtime build and live route proof captured outside semantic documentation wording checks.");
    expect(plan.requiredExternalEvidence).toContain("Legal review proof captured outside semantic documentation wording checks.");
  });

  it("redacts semantic documentation runtime artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "sem_doc_01HZYXZYXZYXZYXZYXZYXZYXZ",
      ciUrl: "https://github.com/dominator509/InkRoute/actions/runs/27171288295",
      claimLog: "provider proof from artist@example.com and +1 (555) 867-5309",
      providerEvidence: {
        providerUrl: "https://provider.example.com/dashboard/tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
      legalReview: {
        clientId: "client_01HZYXZYXZYXZYXZYXZYXZYXZ",
      },
    };

    expect(buildRedactedSemanticDocumentationArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      ciUrl: "[REDACTED]",
      claimLog: "provider proof from [REDACTED] and [REDACTED]",
      providerEvidence: "[REDACTED]",
      legalReview: "[REDACTED]",
    });

    const review = buildSemanticDocumentationRuntimeArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(semanticDocumentationRuntimeRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining(["runId", "ciUrl", "claimLog", "providerEvidence", "legalReview"]),
    );
    expect(review.requiredExternalEvidence).toContain("Provider readiness proof captured outside semantic documentation wording checks.");
  });
});



