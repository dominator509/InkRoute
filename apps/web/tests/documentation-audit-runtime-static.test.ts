import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDocumentationAuditDecisionRequiredEvidence,
  documentationAuditGeneratedReports,
  documentationAuditRootScripts,
  documentationAuditRuntimeReadinessRequiredEvidence,
  documentationAuditRuntimeArtifactPaths,
  documentationAuditRuntimeCommands,
  documentationAuditRuntimeExternalArtifacts,
  documentationAuditRuntimeExternalCommands,
  documentationAuditRuntimeExecutionPolicy,
  documentationAuditRuntimeLocalArtifacts,
  documentationAuditRuntimeLocalCommands,
  documentationAuditRuntimeMatrix,
  documentationAuditRuntimeProofFiles,
  documentationAuditRuntimeReadiness,
  documentationAuditRuntimeRequiredExternalEvidence,
  documentationAuditRuntimeRequiredEvidence,
  documentationAuditRunPersistenceContract,
  buildDocumentationAuditEvidenceDecision,
  buildDocumentationAuditRuntimeArtifactReview,
  buildDocumentationAuditRuntimeExecutionPlan,
  buildRedactedDocumentationAuditArtifact,
} from "../lib/documentationAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("documentation audit runtime contract", () => {
  const rootPackageJson = readRepoFile("package.json");
  const qualityTests = readRepoFile("packages/quality/tests/quality-gates.test.ts");
  const qualityProtocol = readRepoFile("docs/quality/QUALITY_GATE_PROTOCOL.md");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const prismaMigration = readRepoFile("packages/db/prisma/migrations/20260609027000_add_documentation_audit_runs/migration.sql");

  it("pins documentation commands, root scripts, generated reports, matrix rows, and artifacts", () => {
    expect(documentationAuditRuntimeCommands).toEqual([
      "pnpm quality:docs",
      "node scripts/quality/audit-doc-links.mjs",
      "node scripts/quality/verify-documentation-consistency.mjs",
      "node scripts/quality/verify-documentation-inventory.mjs",
      "GitHub Actions CI quality job",
      "provider readiness evidence review",
      "legal readiness evidence review",
      "stale provider status proof review",
    ]);
    expect(documentationAuditRootScripts).toEqual([
      "quality:docs",
      "quality:doc-links",
      "quality:doc-consistency",
      "quality:doc-inventory",
    ]);
    expect(documentationAuditGeneratedReports).toEqual([
      "docs/quality/manifests/markdown-link-audit.json",
      "docs/quality/manifests/documentation-consistency-audit.json",
      "docs/quality/manifests/documentation-inventory-audit.json",
    ]);
    expect(documentationAuditRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "markdown-link-path-audit",
      "documentation-consistency-audit",
      "documentation-inventory-audit",
      "quality-docs-aggregate",
      "ci-quality-docs-evidence",
      "provider-review-evidence",
      "legal-review-evidence",
      "stale-provider-status-proof",
    ]);
    expect(documentationAuditRuntimeArtifactPaths).toContain("coverage/documentation-audit-runtime.json");
    expect(documentationAuditRuntimeArtifactPaths).toContain("test-results/documentation-audit-runtime");
  });

  it("keeps root scripts, quality helper tests, and protocol language aligned", () => {
    for (const scriptName of documentationAuditRootScripts) {
      expect(rootPackageJson).toContain(`"${scriptName}"`);
    }
    expect(rootPackageJson).toContain("audit-doc-links.mjs");
    expect(rootPackageJson).toContain("verify-documentation-consistency.mjs");
    expect(rootPackageJson).toContain("verify-documentation-inventory.mjs");
    expect(qualityTests).toContain("buildDocumentationAuditRuntimeReadinessPlan");
    expect(qualityProtocol).toContain("provider");
    expect(qualityProtocol).toContain("legal");
  });

  it("keeps static audits wired while external evidence remains gated", () => {
    expect(documentationAuditRuntimeReadiness.status).toBe("blocked");
    expect(documentationAuditRuntimeReadiness.missingScripts).toEqual([]);
    expect(documentationAuditRuntimeReadiness.missingReports).toEqual([]);
    expect(documentationAuditRuntimeReadiness.failedAuditAreas).toEqual([]);
    expect(documentationAuditRuntimeReadiness.requiredCommands).toBe(documentationAuditRuntimeCommands);
    expect(documentationAuditRuntimeReadiness.requiredEvidence).toBe(
      documentationAuditRuntimeReadinessRequiredEvidence,
    );
    expect(documentationAuditRuntimeReadiness.blockers).toEqual([
      "CI evidence for pnpm quality:docs must be captured.",
      "Provider readiness documentation claims must have provider evidence or remain blocked/gated.",
      "Legal readiness documentation claims must have legal review evidence or remain pending/gated.",
      "Stale provider status proof must be captured before closing documentation quality.",
    ]);
  });

  it("blocks documentation audit closure until CI, provider, legal, stale-proof, persistence, artifact, and command evidence exist", () => {
    const decision = buildDocumentationAuditEvidenceDecision({
      qualityDocsPassed: true,
      markdownLinkAuditPassed: true,
      documentationConsistencyPassed: true,
      documentationInventoryPassed: true,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: true,
      legalReadinessLanguagePassed: true,
      workspaceInventoryPassed: true,
      generatedReportsCaptured: true,
      ciQualityDocsEvidenceCaptured: false,
      providerReviewEvidenceCaptured: false,
      legalReviewEvidenceCaptured: false,
      staleProviderStatusProofCaptured: false,
      documentationAuditRunPersisted: false,
      capturedArtifacts: [
        "coverage/documentation-audit-runtime.json",
        "coverage/documentation-link-audit-output.txt",
        "coverage/documentation-consistency-output.txt",
        "coverage/documentation-inventory-output.txt",
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
      "coverage/documentation-provider-review-redacted.json",
      "coverage/documentation-legal-review-redacted.json",
      "coverage/documentation-stale-provider-status-redacted.json",
      "coverage/documentation-ci-quality-docs.json",
      "test-results/documentation-audit-runtime",
    ]);
    expect(decision.missingCommands).toEqual([
      "GitHub Actions CI quality job",
      "provider readiness evidence review",
      "legal readiness evidence review",
      "stale provider status proof review",
    ]);
    expect(decision.requiredArtifacts).toBe(documentationAuditRuntimeArtifactPaths);
    expect(decision.requiredCommands).toBe(documentationAuditRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildDocumentationAuditDecisionRequiredEvidence(documentationAuditRuntimeReadinessRequiredEvidence),
    );
    expect(decision.requiredEvidence).toBe(documentationAuditRuntimeRequiredEvidence);
    expect(decision.blockers).toContain("CI evidence for pnpm quality:docs must be captured.");
    expect(decision.blockers).toContain("Provider readiness documentation claims must have provider evidence or remain blocked/gated.");
    expect(decision.blockers).toContain("DocumentationAuditRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required documentation audit artifact must be captured.");
  });

  it("completes documentation audit closure when audit, CI, review, stale-proof, persistence, artifact, and command evidence exist", () => {
    const decision = buildDocumentationAuditEvidenceDecision({
      qualityDocsPassed: true,
      markdownLinkAuditPassed: true,
      documentationConsistencyPassed: true,
      documentationInventoryPassed: true,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: true,
      legalReadinessLanguagePassed: true,
      workspaceInventoryPassed: true,
      generatedReportsCaptured: true,
      ciQualityDocsEvidenceCaptured: true,
      providerReviewEvidenceCaptured: true,
      legalReviewEvidenceCaptured: true,
      staleProviderStatusProofCaptured: true,
      documentationAuditRunPersisted: true,
      capturedArtifacts: documentationAuditRuntimeArtifactPaths,
      completedCommands: documentationAuditRuntimeCommands,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming provider/legal proof is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 documentation audit runtime contracts");
    expect(ciWorkflow).toContain("documentation-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("documentation-audit-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-documentation-audit-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/documentationAuditRuntime.ts");
    expect(gapTracker).toContain("live CI, provider review, legal review, and stale provider proof remain open");
    expect(gapTracker).toContain("GAP-124 is documentation-audit-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("documentationAuditRuntimeReadinessRequiredEvidence");
    expect(gapTracker).toContain("documentationAuditRuntimeRequiredEvidence");
    expect(gapTracker).toContain("buildDocumentationAuditDecisionRequiredEvidence");
    expect(gapTracker).toContain("buildDocumentationAuditRuntimeExecutionPlan");
    expect(gapTracker).toContain("documentationAuditRuntimeExecutionPolicy");
    expect(gapTracker).toContain("documentationAuditRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildDocumentationAuditRuntimeArtifactReview");
  });

  it("pins current documentation audit runtime proof files for GAP-124", () => {
    expect(documentationAuditRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "docs/handoff/manifests/phase-documentation-audit.json",
      "docs/quality/manifests/documentation-consistency-contract.json",
      "docs/quality/manifests/documentation-inventory-contract.json",
      "packages/quality/src/index.ts",
      "scripts/handoff/verify-phase-docs.mjs",
        "scripts/quality/audit-doc-links.mjs",
        "scripts/quality/verify-documentation-consistency.mjs",
        "scripts/quality/verify-documentation-inventory.mjs",
        "apps/web/lib/documentationAuditRuntime.ts",
        "apps/web/tests/documentation-audit-runtime-static.test.ts",
        "packages/db/prisma/migrations/20260609027000_add_documentation_audit_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of documentationAuditRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable DocumentationAuditRun persistence for CI/provider/legal documentation evidence", () => {
    expect(documentationAuditRunPersistenceContract.prismaModel).toBe("DocumentationAuditRun");
    expect(documentationAuditRunPersistenceContract.tenantRelation).toBe("documentationAuditRuns");
    expect(documentationAuditRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(documentationAuditRunPersistenceContract.jsonFields).toEqual([
      "auditReportMatrix",
      "documentationConsistencyFindings",
      "reviewEvidenceManifest",
      "artifactManifest",
    ]);
    expect(documentationAuditRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "qualityDocsPassed",
        "apiRouteReferencesPassed",
        "providerReadinessLanguagePassed",
        "legalReadinessLanguagePassed",
        "ciQualityDocsEvidenceCaptured",
        "staleProviderStatusProofCaptured",
      ]),
    );
    expect(documentationAuditRunPersistenceContract.redactedArtifactFields).toContain("providerReviewArtifactPath");
    expect(prismaSchema).toContain("documentationAuditRuns DocumentationAuditRun[]");
    expect(prismaSchema).toContain("model DocumentationAuditRun");
    expect(prismaSchema).toContain("documentationConsistencyFindings        Json");
    expect(prismaSchema).toContain("staleProviderStatusProofCaptured        Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "DocumentationAuditRun"');
    expect(prismaMigration).toContain('"legalReviewArtifactPath" TEXT');
    expect(unitManifest).toContain("DocumentationAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609027000_add_documentation_audit_runs/migration.sql");
  });

  it("keeps documentation audit execution disabled while splitting local audits from external review proof", () => {
    const plan = buildDocumentationAuditRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(documentationAuditRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(documentationAuditRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(documentationAuditRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(documentationAuditRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/documentation-audit-runtime.json",
        "coverage/documentation-link-audit-output.txt",
        "coverage/documentation-consistency-output.txt",
        "coverage/documentation-inventory-output.txt",
        "test-results/documentation-audit-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/documentation-provider-review-redacted.json",
        "coverage/documentation-legal-review-redacted.json",
        "coverage/documentation-stale-provider-status-redacted.json",
        "coverage/documentation-ci-quality-docs.json",
      ]),
    );
    expect(plan.qualityDocsExecutionAllowed).toBe(false);
    expect(plan.markdownLinkAuditExecutionAllowed).toBe(false);
    expect(plan.documentationConsistencyExecutionAllowed).toBe(false);
    expect(plan.documentationInventoryExecutionAllowed).toBe(false);
    expect(plan.ciQualityDocsExecutionAllowed).toBe(false);
    expect(plan.providerReviewExecutionAllowed).toBe(false);
    expect(plan.legalReviewExecutionAllowed).toBe(false);
    expect(plan.staleProviderStatusExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(documentationAuditRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyLocalDocumentationAudits: true,
      ciEvidenceRequiredForClosure: true,
      providerReviewEvidenceRequired: true,
      legalReviewEvidenceRequired: true,
      staleProviderStatusProofRequired: true,
      providerDatabaseRequiredForPersistence: true,
    });
    expect(plan.externalEvidenceRequired).toBe(documentationAuditRuntimeRequiredExternalEvidence);
  });

  it("redacts documentation audit artifacts before provider or legal evidence retention", () => {
    const rawArtifact = {
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      providerProjectId: "provider_project_123",
      providerReviewPayload: { contactEmail: "provider@example.com", token: "ghp_secret" },
      legalReviewer: { email: "attorney@example.com", phone: "+1 555 909 4444" },
      staleProviderStatusProofUrl: "https://provider.example.com/status/project_123",
      nested: {
        authorization: "Bearer documentation-audit-token",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedDocumentationAuditArtifact(rawArtifact);
    const review = buildDocumentationAuditRuntimeArtifactReview("coverage/documentation-provider-review-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("provider_project_123");
    expect(serialized).not.toContain("provider@example.com");
    expect(serialized).not.toContain("ghp_secret");
    expect(serialized).not.toContain("attorney@example.com");
    expect(serialized).not.toContain("+1 555 909 4444");
    expect(serialized).not.toContain("provider.example.com");
    expect(serialized).not.toContain("Bearer documentation-audit-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "ciRunUrl",
        "legalReviewer",
        "providerProjectId",
        "providerReviewPayload",
        "staleProviderStatusProofUrl",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(documentationAuditRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "CI quality-docs evidence must be captured from GitHub Actions with run URLs and logs redacted.",
        "Provider readiness review evidence must include redacted labels only and keep provider resource IDs out of repository artifacts.",
        "Legal readiness review evidence must redact attorney/reviewer contact details and privileged communications.",
        "Stale provider status proof and DocumentationAuditRun persistence must remain external until approved evidence exists.",
      ]),
    );
  });
});



