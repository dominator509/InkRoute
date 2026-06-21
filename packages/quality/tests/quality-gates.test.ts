import { describe, expect, it } from "vitest";
import {
  auditDocumentationConsistency,
  auditGapEvidenceRecords,
  auditMarkdownLinks,
  auditRepositoryGovernance,
  auditSemanticDocumentationClaims,
  buildDocumentationAuditRuntimeReadinessPlan,
  buildLegalReviewRuntimeReadinessPlan,
  buildPrGapEvidenceEnforcementArtifactReview,
  buildPrGapEvidenceEnforcementEvidenceDecision,
  buildPrGapEvidenceEnforcementExecutionPlan,
  buildPrGapEvidenceEnforcementExecutionRequiredEvidence,
  buildPrDiffEvidenceRuntimeArtifactReview,
  buildPrDiffEvidenceRuntimeExecutionPlan,
  buildPrDiffEvidenceRuntimeExecutionRequiredEvidence,
  buildPrDiffEvidenceRuntimeReadinessPlan,
  buildPrDiffEvidenceEvidenceDecision,
  buildPrGapEvidenceEnforcementReadinessPlan,
  buildQualityGateRuntimeReadinessPlan,
  buildRedactedPrDiffEvidenceArtifact,
  buildRedactedPrGapEvidenceEnforcementArtifact,
  buildRepositoryGovernanceRuntimeReadinessPlan,
  buildRequiredChecksRuntimeReadinessPlan,
  buildSemanticDocumentationRuntimeReadinessPlan,
  documentationAuditRuntimeRequiredCommands,
  documentationAuditRuntimeRequiredEvidence,
  extractMarkdownLinks,
  legalReviewRuntimeRequiredCommands,
  legalReviewRuntimeRequiredEvidence,
  parseGapEvidenceRecords,
  phase17QualityGates,
  prGapEvidenceEnforcementExecutionPolicy,
  prGapEvidenceEnforcementExternalArtifacts,
  prGapEvidenceEnforcementExternalCommands,
  prGapEvidenceEnforcementLocalArtifacts,
  prGapEvidenceEnforcementLocalCommands,
  prGapEvidenceEnforcementProofFiles,
  prGapEvidenceEnforcementReadinessRequiredEvidence,
  prGapEvidenceEnforcementRequiredExternalEvidence,
  prDiffEvidenceRuntimeExecutionPolicy,
  prDiffEvidenceRuntimeExternalArtifacts,
  prDiffEvidenceRuntimeExternalCommands,
  prDiffEvidenceRuntimeLocalArtifacts,
  prDiffEvidenceRuntimeLocalCommands,
  prDiffEvidenceRuntimeProofFiles,
  prDiffEvidenceRuntimeReadinessRequiredEvidence,
  prDiffEvidenceRuntimeRequiredExternalEvidence,
  prDiffEvidenceRunPersistenceContract,
  prGapEvidenceEnforcementRunPersistenceContract,
  qualityGateRuntimeRequiredCommands,
  qualityGateRuntimeRequiredEvidence,
  requiredPrDiffEvidenceRuntimeArtifacts,
  requiredPrDiffEvidenceRuntimeCommands,
  requiredPrGapEvidenceEnforcementArtifacts,
  requiredPrGapEvidenceEnforcementCommands,
  repositoryGovernanceRuntimeRequiredEvidence,
  repositoryGovernanceRuntimeRequiredCommands,
  requiredChecksRuntimeRequiredCommands,
  requiredChecksRuntimeRequiredEvidence,
  semanticDocumentationRuntimeRequiredCommands,
  semanticDocumentationRuntimeRequiredEvidence,
  summarizeQualityGates,
} from "../src/index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("quality gates", () => {
  it("summarizes the Phase 17 quality gate catalog", () => {
    const summary = summarizeQualityGates(phase17QualityGates);
    expect(summary.totalGates).toBeGreaterThan(0);
    expect(summary.criticalGates).toBe(6);
    expect(summary.highGates).toBe(2);
    expect(summary.mediumGates).toBe(1);
    expect(summary.referencedGapIds).toContain("GAP-122");
    expect(summary.referencedGapIds).toContain("GAP-128");
    expect(summary.referencedGapIds).toContain("GAP-125");
    expect(summary.referencedGapIds).toContain("GAP-129");
    expect(summary.referencedGapIds).toContain("GAP-133");
    expect(summary.referencedGapIds).toContain("GAP-130");
    expect(summary.referencedGapIds).toContain("GAP-132");
    expect(summary.referencedGapIds).toContain("GAP-013");
    expect(summary.commands).toContain("node scripts/quality/audit-gap-evidence.mjs");
    expect(summary.commands).toContain("node scripts/quality/verify-repository-governance.mjs");
    expect(summary.commands).toContain("node scripts/quality/verify-required-checks.mjs");
    expect(summary.commands).toContain("node scripts/workspace/verify-workspace-required-checks.mjs");
    expect(summary.commands).toContain("node scripts/workspace/verify-workspace-toolchain.mjs");
    expect(summary.commands).toContain("node scripts/workspace/verify-runtime-evidence.mjs");
    expect(summary.commands).toContain("node scripts/legal/verify-legal-review.mjs");
  });

  it("parses and audits a gap row", () => {
    const markdown = "| GAP-126 | Phase 17 | Quality | Example. | Medium | Yes | Open | `file.ts` | Run a verification command. | Codex | Implement and verify the gap evidence rule. | `pnpm quality:all` passes with evidence. |";
    const records = parseGapEvidenceRecords(markdown);
    const audit = auditGapEvidenceRecords(records);
    expect(records).toHaveLength(1);
    expect(audit.totalGaps).toBe(1);
  });

  it("flags malformed, duplicate, and weak evidence gap rows", () => {
    const markdown = [
      "| GAP-001 | Phase 1 | Quality | Example. | Severe | Maybe | Closed | file.ts | TBD | Codex | Do it | soon |",
      "| GAP-001 | Phase 1 | Quality | Example. | High | Yes | Open | file.ts | TODO | Codex | TODO | none |",
      "| GAP-003 | Phase 1 | Quality | Example. | Medium | No for demo | Open | file.ts | Add focused tests and command evidence. | Codex | Implement and verify gap checks. | `pnpm quality:all` passes with evidence. |",
    ].join("\n");
    const audit = auditGapEvidenceRecords(parseGapEvidenceRecords(markdown));

    expect(audit.status).toBe("fail");
    expect(audit.findings.some((finding) => finding.message.includes("Unsupported severity"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Duplicate gap ID"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Expected sequential GAP-002"))).toBe(true);
    expect(audit.findings.some((finding) => finding.message.includes("Verification/test needed field lacks concrete evidence"))).toBe(true);
  });

  it("checks relative markdown links", () => {
    const audit = auditMarkdownLinks([{ path: "docs/example.md", contents: "See [readme](../README.md)." }], new Set(["README.md", "docs/example.md"]));
    expect(audit.status).toBe("pass");
  });

  it("classifies and resolves markdown links", () => {
    const links = extractMarkdownLinks({
      path: "docs/quality/example.md",
      contents: "See [local](../README.md), [root](/GAP_TRACKER.md), [site](https://example.test), and [mail](mailto:test@example.test).",
    });

    expect(links.map((link) => link.kind)).toEqual(["relative", "root-relative", "external", "email"]);
    expect(links[0]?.targetPath).toBe("docs/README.md");
    expect(links[1]?.targetPath).toBe("GAP_TRACKER.md");
  });

  it("fails missing relative markdown targets", () => {
    const audit = auditMarkdownLinks(
      [{ path: "docs/example.md", contents: "See [missing](./missing.md)." }],
      new Set(["docs/example.md"]),
    );

    expect(audit.status).toBe("fail");
    expect(audit.findings[0]?.message).toContain("Missing relative link target docs/missing.md");
  });

  it("checks semantic documentation claims and referenced repo paths", () => {
    const audit = auditSemanticDocumentationClaims(
      [
        {
          path: "docs/example.md",
          contents: [
            "See `packages/quality/src/index.ts` for the helper.",
            "This launch is production-ready.",
            "This route is not production-ready until provider evidence exists.",
            "Future glob `packages/*/src/index.ts` is roadmap-only.",
          ].join("\n"),
        },
        {
          path: "docs/missing.md",
          contents: "Missing code path: `packages/missing/src/index.ts`.",
        },
      ],
      new Set(["docs/example.md", "packages/quality/src/index.ts"]),
    );

    expect(audit.status).toBe("fail");
    expect(audit.referencedPathsChecked).toBe(2);
    expect(audit.findings.some((finding) => finding.message.includes("Unsupported production-readiness claim"))).toBe(true);
    expect(audit.findings.some((finding) => finding.reference === "packages/missing/src/index.ts")).toBe(true);
  });

  it("checks documentation consistency for routes and readiness language", () => {
    const contract = {
      routeReference: {
        apps: ["apps/web/app", "apps/dashboard/app"],
        ignoredRouteFragments: ["/api/webhooks/"],
      },
      providerReadinessLanguage: {
        providers: ["Stripe", "Sentry"],
        claimTerms: ["configured", "live", "verified"],
        allowedQualifiers: ["blocked", "evidence", "sandbox"],
      },
      legalReadinessLanguage: {
        claimTerms: ["legal-approved"],
        allowedQualifiers: ["pending", "evidence"],
      },
    };
    const audit = auditDocumentationConsistency(
      [
        {
          path: "docs/api.md",
          contents: [
            "Route `POST /api/public/:tenantSlug/booking-requests` is documented.",
            "Missing route `GET /api/missing` is stale.",
            "Stripe is live for production payments.",
            "Sentry is configured in sandbox evidence only.",
            "Privacy terms are legal-approved.",
          ].join("\n"),
        },
      ],
      new Set(["apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts"]),
      contract,
    );

    expect(audit.status).toBe("fail");
    expect(audit.routeReferencesChecked).toBe(2);
    expect(audit.findings.some((finding) => finding.rule === "route-reference" && finding.reference === "GET /api/missing")).toBe(true);
    expect(audit.findings.some((finding) => finding.rule === "provider-readiness-language")).toBe(true);
    expect(audit.findings.some((finding) => finding.rule === "legal-readiness-language")).toBe(true);
  });

  it("checks repository governance prerequisites", () => {
    const contract = {
      requiredFiles: [".github/CODEOWNERS", ".github/PULL_REQUEST_TEMPLATE.md"],
      requiredCodeownersPatterns: ["*", "/GAP_TRACKER.md"],
      pullRequestTemplateTerms: ["pnpm quality:docs", "No secrets"],
      issueTemplateTerms: ["Evidence required"],
      ciRequiredTerms: ["pnpm quality:all", "pnpm quality:pr-gaps"],
      externalSettingsStillRequired: ["branch protection"],
    };
    const audit = auditRepositoryGovernance(contract, {
      existingPaths: new Set([".github/CODEOWNERS", ".github/PULL_REQUEST_TEMPLATE.md"]),
      codeowners: "* @owner\n/GAP_TRACKER.md @owner\n",
      pullRequestTemplate: "Run pnpm quality:docs. No secrets.",
      gapClosureIssueTemplate: "Evidence required before closure.",
      ciWorkflow: "run: pnpm quality:all && pnpm quality:pr-gaps",
    });

    expect(audit.status).toBe("pass");
    expect(audit.requiredFilesChecked).toBe(2);
    expect(audit.externalSettingsStillRequired).toContain("branch protection");
  });

  it("fails missing repository governance prerequisites", () => {
    const audit = auditRepositoryGovernance(
      {
        requiredFiles: [".github/CODEOWNERS"],
        requiredCodeownersPatterns: ["/packages/security/"],
        pullRequestTemplateTerms: ["No secrets"],
        issueTemplateTerms: ["Evidence required"],
        ciRequiredTerms: ["pnpm quality:pr-gaps"],
        externalSettingsStillRequired: [],
      },
      {
        existingPaths: new Set([]),
        codeowners: "* @owner\n",
        pullRequestTemplate: "No checklist.",
        gapClosureIssueTemplate: "No template.",
        ciWorkflow: "run: pnpm quality:all",
      },
    );

    expect(audit.status).toBe("fail");
    expect(audit.findings.some((finding) => finding.rule === "required-file")).toBe(true);
    expect(audit.findings.some((finding) => finding.rule === "codeowners-pattern")).toBe(true);
    expect(audit.findings.some((finding) => finding.rule === "ci-required-term")).toBe(true);
  });

  it("blocks PR gap evidence enforcement readiness until fixtures, CI, branch protection, and live PR proof exist", () => {
    const plan = buildPrGapEvidenceEnforcementReadinessPlan({
      rootScripts: {
        "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
        "quality:all": "pnpm quality:docs",
      },
      ciWorkflowText: "run: pnpm quality:all",
      fixtureNames: ["valid-with-evidence.diff"],
      prGapAuditPassedWithoutContext: true,
      prGapAuditPassedWithMergeFallback: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: false,
      productionBlockerDowngradeFixtureCovered: false,
      closedRowFixtureCovered: false,
      noSecretLogsVerified: false,
      branchProtectionRequiresQualityJob: false,
      liveFailingPrEvidenceCaptured: false,
      livePassingPrEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual(["quality:pr-gap-fixtures"]);
    expect(plan.missingCiTerms).toEqual(["pnpm quality:pr-gaps"]);
    expect(plan.missingFixtures).toEqual(["invalid-missing-evidence.diff"]);
    expect(plan.requiredCommands).toBe(requiredPrGapEvidenceEnforcementCommands);
    expect(plan.requiredEvidence).toBe(prGapEvidenceEnforcementReadinessRequiredEvidence);
    expect(plan.blockers).toContain("quality:all must include quality:pr-gap-fixtures.");
    expect(plan.blockers).toContain("Negative gap-diff fixture without evidence must fail.");
    expect(plan.blockers).toContain("Branch protection must require the CI quality job before merge.");
    expect(plan.blockers).toContain("Live PR evidence must show a gap row changed without evidence is blocked.");
  });

  it("marks PR gap evidence enforcement ready when scripts, fixtures, CI, branch protection, and live PR proof are present", () => {
    const plan = buildPrGapEvidenceEnforcementReadinessPlan({
      rootScripts: {
        "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
        "quality:pr-gap-fixtures": "node scripts/quality/verify-pr-gap-diff-fixtures.mjs",
        "quality:all": "pnpm quality:docs && pnpm quality:pr-gap-fixtures",
      },
      ciWorkflowText: "run: pnpm quality:all && pnpm quality:pr-gaps",
      fixtureNames: ["valid-with-evidence.diff", "invalid-missing-evidence.diff"],
      prGapAuditPassedWithoutContext: true,
      prGapAuditPassedWithMergeFallback: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: true,
      productionBlockerDowngradeFixtureCovered: true,
      closedRowFixtureCovered: true,
      noSecretLogsVerified: true,
      branchProtectionRequiresQualityJob: true,
      liveFailingPrEvidenceCaptured: true,
      livePassingPrEvidenceCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.missingCiTerms).toEqual([]);
    expect(plan.missingFixtures).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks PR gap evidence enforcement closure until artifacts, commands, persistence, and merge-block proof exist", () => {
    const decision = buildPrGapEvidenceEnforcementEvidenceDecision({
      rootScripts: {
        "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
        "quality:all": "pnpm quality:docs",
      },
      ciWorkflowText: "run: pnpm quality:all",
      fixtureNames: ["valid-with-evidence.diff"],
      prGapAuditPassedWithoutContext: true,
      prGapAuditPassedWithMergeFallback: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: false,
      productionBlockerDowngradeFixtureCovered: false,
      closedRowFixtureCovered: false,
      noSecretLogsVerified: false,
      branchProtectionRequiresQualityJob: false,
      liveFailingPrEvidenceCaptured: false,
      livePassingPrEvidenceCaptured: false,
      capturedArtifacts: [
        "docs/quality/manifests/gap-evidence-audit.json",
        "docs/quality/manifests/pr-gap-diff-fixtures.json",
      ],
      completedCommands: ["pnpm quality:pr-gap-fixtures", "pnpm quality:pr-gaps"],
      prGapEvidenceRunPersisted: false,
      mergeBlockProofCaptured: false,
    });

    expect(decision.status).toBe("blocked");
    expect(decision.readinessPlan.status).toBe("blocked");
    expect(decision.missingArtifacts).toEqual([
      "PrGapEvidenceEnforcementRun persistence row",
      "redacted branch protection settings evidence",
      "live failing PR merge-block evidence",
      "live passing PR evidence",
      "secret-safe PR gap enforcement log review",
    ]);
    expect(decision.missingCommands).toEqual([
      "pnpm quality:all",
      "GitHub Actions CI quality job",
      "branch protection required-check audit",
    ]);
    expect(decision.requiredArtifacts).toBe(requiredPrGapEvidenceEnforcementArtifacts);
    expect(decision.requiredCommands).toBe(requiredPrGapEvidenceEnforcementCommands);
    expect(decision.requiredEvidence).toEqual(
      buildPrGapEvidenceEnforcementExecutionRequiredEvidence(prGapEvidenceEnforcementReadinessRequiredEvidence),
    );
    expect(decision.blockers).toContain("PrGapEvidenceEnforcementRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Live merge-block proof must show evidence-free gap changes cannot merge.");
    expect(decision.blockers).toContain("Every required PR gap evidence enforcement artifact must be captured.");
    expect(decision.blockers).toContain("Every required PR gap evidence enforcement command must be completed.");
  });

  it("completes PR gap evidence enforcement closure when all proof artifacts and commands are captured", () => {
    const decision = buildPrGapEvidenceEnforcementEvidenceDecision({
      rootScripts: {
        "quality:pr-gaps": "node scripts/quality/audit-gap-tracker-diff.mjs",
        "quality:pr-gap-fixtures": "node scripts/quality/verify-pr-gap-diff-fixtures.mjs",
        "quality:all": "pnpm quality:docs && pnpm quality:pr-gap-fixtures",
      },
      ciWorkflowText: "run: pnpm quality:all && pnpm quality:pr-gaps",
      fixtureNames: ["valid-with-evidence.diff", "invalid-missing-evidence.diff"],
      prGapAuditPassedWithoutContext: true,
      prGapAuditPassedWithMergeFallback: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: true,
      productionBlockerDowngradeFixtureCovered: true,
      closedRowFixtureCovered: true,
      noSecretLogsVerified: true,
      branchProtectionRequiresQualityJob: true,
      liveFailingPrEvidenceCaptured: true,
      livePassingPrEvidenceCaptured: true,
      capturedArtifacts: requiredPrGapEvidenceEnforcementArtifacts,
      completedCommands: requiredPrGapEvidenceEnforcementCommands,
      prGapEvidenceRunPersisted: true,
      mergeBlockProofCaptured: true,
    });

    expect(decision.status).toBe("complete");
    expect(decision.readinessPlan.status).toBe("ready");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("pins durable PrGapEvidenceEnforcementRun persistence for live merge-block proof", () => {
    const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
    const prismaMigration = readRepoFile(
      "packages/db/prisma/migrations/20260609026000_add_pr_gap_evidence_enforcement_runs/migration.sql",
    );
    const gapTracker = readRepoFile("GAP_TRACKER.md");
    expect(gapTracker).toContain("GAP-122 is pr-gap-evidence-enforcement-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildPrGapEvidenceEnforcementExecutionPlan");
    expect(gapTracker).toContain("prGapEvidenceEnforcementExecutionPolicy");
    expect(gapTracker).toContain("prGapEvidenceEnforcementLocalCommands/prGapEvidenceEnforcementExternalCommands");
    expect(gapTracker).toContain("prGapEvidenceEnforcementLocalArtifacts/prGapEvidenceEnforcementExternalArtifacts");
    expect(gapTracker).toContain("prGapEvidenceEnforcementRequiredExternalEvidence");
    expect(gapTracker).toContain("buildPrGapEvidenceEnforcementArtifactReview");

    expect(prGapEvidenceEnforcementRunPersistenceContract.prismaModel).toBe("PrGapEvidenceEnforcementRun");
    expect(prGapEvidenceEnforcementRunPersistenceContract.tenantRelation).toBe("prGapEvidenceEnforcementRuns");
    expect(prGapEvidenceEnforcementRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(prGapEvidenceEnforcementRunPersistenceContract.jsonFields).toEqual([
      "fixtureMatrix",
      "prAuditMatrix",
      "branchProtectionEvidence",
      "artifactManifest",
    ]);
    expect(prGapEvidenceEnforcementRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "positiveFixturePassed",
        "negativeFixtureFailed",
        "productionBlockerDowngradeCovered",
        "branchProtectionRequiresQualityJob",
        "liveFailingPrEvidenceCaptured",
        "livePassingPrEvidenceCaptured",
        "mergeBlockProofCaptured",
      ]),
    );
    expect(prGapEvidenceEnforcementRunPersistenceContract.redactedArtifactFields).toContain(
      "branchProtectionArtifactPath",
    );
    expect(prismaSchema).toContain("prGapEvidenceEnforcementRuns PrGapEvidenceEnforcementRun[]");
    expect(prismaSchema).toContain("model PrGapEvidenceEnforcementRun");
    expect(prismaSchema).toContain("branchProtectionEvidence                Json");
    expect(prismaSchema).toContain("mergeBlockProofCaptured                 Boolean  @default(false)");
    expect(prismaMigration).toContain('CREATE TABLE "PrGapEvidenceEnforcementRun"');
    expect(prismaMigration).toContain('"liveFailingPrArtifactPath" TEXT');
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609026000_add_pr_gap_evidence_enforcement_runs/migration.sql");
  });

  it("pins current PR gap evidence enforcement proof files for GAP-122", () => {
    expect(prGapEvidenceEnforcementProofFiles).toEqual(
      expect.arrayContaining([
        "docs/handoff/GAP_CLOSURE_PROTOCOL.md",
        "scripts/quality/audit-gap-tracker-diff.mjs",
        "scripts/quality/verify-pr-gap-diff-fixtures.mjs",
        "packages/quality/src/index.ts",
        "packages/quality/tests/quality-gates.test.ts",
        "packages/db/prisma/migrations/20260609026000_add_pr_gap_evidence_enforcement_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of prGapEvidenceEnforcementProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps PR gap evidence live enforcement disabled while splitting local fixture proof from external merge-block proof", () => {
    const plan = buildPrGapEvidenceEnforcementExecutionPlan();

    expect(plan.localCommands).toBe(prGapEvidenceEnforcementLocalCommands);
    expect(plan.externalCommands).toBe(prGapEvidenceEnforcementExternalCommands);
    expect(plan.localArtifacts).toBe(prGapEvidenceEnforcementLocalArtifacts);
    expect(plan.externalArtifacts).toBe(prGapEvidenceEnforcementExternalArtifacts);
    expect(plan.localCommands).toEqual([
      "pnpm quality:pr-gap-fixtures",
      "pnpm quality:pr-gaps",
    ]);
    expect(plan.externalCommands).toEqual(
      expect.arrayContaining([
        "pnpm quality:all",
        "GitHub Actions CI quality job",
        "branch protection required-check audit",
      ]),
    );
    expect(plan.localArtifacts).toEqual([
      "docs/quality/manifests/gap-evidence-audit.json",
      "docs/quality/manifests/pr-gap-diff-fixtures.json",
    ]);
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "PrGapEvidenceEnforcementRun persistence row",
        "redacted branch protection settings evidence",
        "live failing PR merge-block evidence",
        "live passing PR evidence",
        "secret-safe PR gap enforcement log review",
      ]),
    );
    expect(plan.fixtureVerificationExecutionAllowed).toBe(false);
    expect(plan.prGapAuditExecutionAllowed).toBe(false);
    expect(plan.qualityAllExecutionAllowed).toBe(false);
    expect(plan.ciQualityExecutionAllowed).toBe(false);
    expect(plan.branchProtectionAuditExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.liveFailingPrExecutionAllowed).toBe(false);
    expect(plan.livePassingPrExecutionAllowed).toBe(false);
    expect(plan.secretSafeLogReviewExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(prGapEvidenceEnforcementExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyLocalFixtures: true,
      livePrMergeBlockRequiredForClosure: true,
      branchProtectionEvidenceRequired: true,
      durablePersistenceRowRequired: true,
      secretSafeLogsRequired: true,
      localFixturesDoNotProveLiveEnforcement: true,
    });
    expect(plan.externalEvidenceRequired).toBe(prGapEvidenceEnforcementRequiredExternalEvidence);
  });

  it("redacts PR gap evidence enforcement artifacts before review or retention", () => {
    const rawArtifact = {
      pullRequestUrl: "https://github.com/dominator509/InkRoute/pull/123",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      branchProtectionPayload: { requiredBypassActorEmail: "owner@example.com", token: "ghp_secret" },
      checkRunLog: "Blocked tenant_demo with Authorization: Bearer pr-gap-token",
      artifactUrl: "https://provider.example.com/artifacts/artifact_123",
      nested: {
        phone: "+1 555 111 3434",
        projectId: "project_pr_gap_123",
      },
    };
    const redacted = buildRedactedPrGapEvidenceEnforcementArtifact(rawArtifact);
    const review = buildPrGapEvidenceEnforcementArtifactReview("live failing PR merge-block evidence", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("ghp_secret");
    expect(serialized).not.toContain("tenant_demo");
    expect(serialized).not.toContain("Bearer pr-gap-token");
    expect(serialized).not.toContain("provider.example.com");
    expect(serialized).not.toContain("+1 555 111 3434");
    expect(serialized).not.toContain("project_pr_gap_123");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "artifactUrl",
        "branchProtectionPayload",
        "checkRunLog",
        "ciRunUrl",
        "phone",
        "projectId",
        "pullRequestUrl",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(prGapEvidenceEnforcementRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Live failing PR merge-block and live passing PR evidence must be captured from GitHub with PR URLs, run URLs, tokens, and actors redacted.",
        "Branch-protection evidence must prove required quality checks without exposing repository settings tokens or provider identifiers.",
        "Durable PrGapEvidenceEnforcementRun persistence must execute only in an approved provider-backed database.",
        "Secret-safe log review must redact check-run logs, command output, environment values, customer data, and provider IDs before retention.",
      ]),
    );
  });

  it("blocks documentation audit readiness until scripts, reports, CI, inventory, provider, and legal evidence are complete", () => {
    const plan = buildDocumentationAuditRuntimeReadinessPlan({
      rootScripts: {
        "quality:docs": "node scripts/quality/audit-doc-links.mjs",
      },
      auditsPassed: {
        markdownLinks: true,
        semanticPaths: false,
        routeReferences: false,
        providerReadinessLanguage: true,
        legalReadinessLanguage: false,
        workspaceInventory: false,
      },
      reportsGenerated: ["docs/quality/manifests/markdown-link-audit.json"],
      ciEvidenceCaptured: false,
      providerReviewEvidenceCaptured: false,
      legalReviewEvidenceCaptured: false,
      staleProviderStatusProofCaptured: false,
      packageInventoryCheckPassed: false,
      appInventoryCheckPassed: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.missingReports).toEqual([
      "docs/quality/manifests/documentation-consistency-audit.json",
      "docs/quality/manifests/documentation-inventory-audit.json",
    ]);
    expect(plan.failedAuditAreas).toEqual(["semanticPaths", "routeReferences", "legalReadinessLanguage", "workspaceInventory"]);
    expect(plan.requiredCommands).toBe(documentationAuditRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(documentationAuditRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("quality:docs must run markdown links, documentation consistency, and documentation inventory audits.");
    expect(plan.blockers).toContain("CI evidence for pnpm quality:docs must be captured.");
    expect(plan.blockers).toContain("Legal readiness documentation claims must have legal review evidence or remain pending/gated.");
  });

  it("marks documentation audit readiness ready when docs audits, inventory, CI, provider, and legal evidence are complete", () => {
    const plan = buildDocumentationAuditRuntimeReadinessPlan({
      rootScripts: {
        "quality:docs": "pnpm quality:doc-links && pnpm quality:doc-consistency && pnpm quality:doc-inventory",
      },
      auditsPassed: {
        markdownLinks: true,
        semanticPaths: true,
        routeReferences: true,
        providerReadinessLanguage: true,
        legalReadinessLanguage: true,
        workspaceInventory: true,
      },
      reportsGenerated: [
        "docs/quality/manifests/markdown-link-audit.json",
        "docs/quality/manifests/documentation-consistency-audit.json",
        "docs/quality/manifests/documentation-inventory-audit.json",
      ],
      ciEvidenceCaptured: true,
      providerReviewEvidenceCaptured: true,
      legalReviewEvidenceCaptured: true,
      staleProviderStatusProofCaptured: true,
      packageInventoryCheckPassed: true,
      appInventoryCheckPassed: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingScripts).toEqual([]);
    expect(plan.missingReports).toEqual([]);
    expect(plan.failedAuditAreas).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks repository governance readiness until source prerequisites and external GitHub settings are proven", () => {
    const plan = buildRepositoryGovernanceRuntimeReadinessPlan({
      governanceAuditPassed: true,
      requiredFilesPresent: true,
      codeownersCoveragePassed: false,
      prTemplateEvidenceTermsPresent: true,
      issueTemplateEvidenceTermsPresent: false,
      ciGovernanceTermsPresent: true,
      branchProtectionActive: false,
      requiredStatusChecksEnforced: false,
      codeownersReviewRequired: false,
      secretScanningEnabled: false,
      dependabotOrSecurityAlertsEnabled: false,
      mergeRulesConfigured: false,
      enforcementTestPrCaptured: false,
      redactedSettingsEvidenceCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingSourcePrerequisites).toEqual(["codeowners-coverage", "gap-closure-issue-template"]);
    expect(plan.missingExternalSettings).toEqual([
      "branch-protection",
      "required-status-checks",
      "codeowners-review",
      "secret-scanning",
      "dependabot-or-security-alerts",
      "merge-rules",
      "enforcement-test-pr",
      "redacted-settings-evidence",
    ]);
    expect(plan.requiredCommands).toBe(repositoryGovernanceRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(repositoryGovernanceRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("GitHub branch protection must be active for the protected branch.");
    expect(plan.blockers).toContain("A test PR must prove branch protection, required checks, and CODEOWNERS review enforcement.");
  });

  it("marks repository governance ready when source prerequisites and external enforcement evidence are present", () => {
    const plan = buildRepositoryGovernanceRuntimeReadinessPlan({
      governanceAuditPassed: true,
      requiredFilesPresent: true,
      codeownersCoveragePassed: true,
      prTemplateEvidenceTermsPresent: true,
      issueTemplateEvidenceTermsPresent: true,
      ciGovernanceTermsPresent: true,
      branchProtectionActive: true,
      requiredStatusChecksEnforced: true,
      codeownersReviewRequired: true,
      secretScanningEnabled: true,
      dependabotOrSecurityAlertsEnabled: true,
      mergeRulesConfigured: true,
      enforcementTestPrCaptured: true,
      redactedSettingsEvidenceCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingSourcePrerequisites).toEqual([]);
    expect(plan.missingExternalSettings).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks quality gate runtime readiness until package, manifests, quality:all, CI, and artifacts are proven", () => {
    const plan = buildQualityGateRuntimeReadinessPlan({
      rootScripts: {
        "quality:docs": "node scripts/quality/audit-doc-links.mjs",
        "quality:gaps": "node scripts/quality/audit-gap-evidence.mjs",
        "quality:all": "pnpm quality:docs && pnpm quality:gaps",
      },
      qualityPackageScripts: { test: "vitest run" },
      generatedManifests: ["docs/quality/manifests/markdown-link-audit.json"],
      packageTypecheckPassed: false,
      packageTestsPassed: true,
      qualityAllPassed: false,
      markdownLinkManifestGenerated: true,
      documentationConsistencyManifestGenerated: false,
      documentationInventoryManifestGenerated: false,
      gapEvidenceManifestGenerated: false,
      prGapFixtureManifestGenerated: false,
      repositoryGovernanceManifestGenerated: false,
      requiredChecksManifestGenerated: false,
      qualityGatesManifestGenerated: false,
      ciQualityJobPassed: false,
      ciArtifactsCaptured: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingRootScripts).toEqual(["quality:pr-gap-fixtures", "quality:governance", "quality:required-checks", "quality:gates"]);
    expect(plan.missingPackageScripts).toEqual(["typecheck"]);
    expect(plan.missingGeneratedManifests).toEqual(
      expect.arrayContaining([
        "docs/quality/manifests/documentation-consistency-audit.json",
        "docs/quality/manifests/gap-evidence-audit.json",
        "docs/quality/manifests/quality-gates.json",
      ]),
    );
    expect(plan.requiredCommands).toBe(qualityGateRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(qualityGateRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("quality:all must include quality:pr-gap-fixtures.");
    expect(plan.blockers).toContain("@inkroute/quality typecheck must pass.");
    expect(plan.blockers).toContain("GitHub Actions quality job must pass.");
  });

  it("marks quality gate runtime readiness ready when package, quality:all, manifests, CI, and artifacts are verified", () => {
    const generatedManifests = [
      "docs/quality/manifests/markdown-link-audit.json",
      "docs/quality/manifests/documentation-consistency-audit.json",
      "docs/quality/manifests/documentation-inventory-audit.json",
      "docs/quality/manifests/gap-evidence-audit.json",
      "docs/quality/manifests/repository-governance-audit.json",
      "docs/quality/manifests/required-checks-audit.json",
      "docs/quality/manifests/quality-gates.json",
    ];
    const plan = buildQualityGateRuntimeReadinessPlan({
      rootScripts: {
        "quality:docs": "node scripts/quality/audit-doc-links.mjs",
        "quality:gaps": "node scripts/quality/audit-gap-evidence.mjs",
        "quality:pr-gap-fixtures": "node scripts/quality/verify-pr-gap-diff-fixtures.mjs",
        "quality:governance": "node scripts/quality/verify-repository-governance.mjs",
        "quality:required-checks": "node scripts/quality/verify-required-checks.mjs",
        "quality:gates": "node scripts/quality/print-quality-gates.mjs",
        "quality:all": "pnpm quality:docs && pnpm quality:gaps && pnpm quality:pr-gap-fixtures && pnpm quality:governance && pnpm quality:required-checks && pnpm quality:gates",
      },
      qualityPackageScripts: { typecheck: "tsc --noEmit", test: "vitest run" },
      generatedManifests,
      packageTypecheckPassed: true,
      packageTestsPassed: true,
      qualityAllPassed: true,
      markdownLinkManifestGenerated: true,
      documentationConsistencyManifestGenerated: true,
      documentationInventoryManifestGenerated: true,
      gapEvidenceManifestGenerated: true,
      prGapFixtureManifestGenerated: true,
      repositoryGovernanceManifestGenerated: true,
      requiredChecksManifestGenerated: true,
      qualityGatesManifestGenerated: true,
      ciQualityJobPassed: true,
      ciArtifactsCaptured: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingRootScripts).toEqual([]);
    expect(plan.missingPackageScripts).toEqual([]);
    expect(plan.missingGeneratedManifests).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks legal review readiness until approvals, artifacts, redacted labels, CI, and launch gates are complete", () => {
    const plan = buildLegalReviewRuntimeReadinessPlan({
      legalReviewAuditPassed: false,
      requiredReviewItemIds: ["privacy-policy", "terms-of-service", "sms-notifications"],
      approvedReviewItemIds: ["privacy-policy"],
      requiredArtifactPaths: ["apps/web/app/privacy/page.tsx", "apps/web/app/terms/page.tsx"],
      existingArtifactPaths: ["apps/web/app/privacy/page.tsx"],
      redactedEvidenceLabelsPresent: false,
      privilegedAdviceExcluded: true,
      placeholderCopyReplacedAfterApproval: false,
      legalVerifyCommandPassed: false,
      ciQualityGateIncludesLegalReview: false,
      productionLaunchBlockedUntilApproval: true,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingApprovedItems).toEqual(["terms-of-service", "sms-notifications"]);
    expect(plan.missingArtifacts).toEqual(["apps/web/app/terms/page.tsx"]);
    expect(plan.requiredCommands).toBe(legalReviewRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(legalReviewRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("Every required legal review item must be attorney-approved before production launch.");
    expect(plan.blockers).toContain("Legal review audit must pass.");
    expect(plan.blockers).toContain("CI quality gates must include legal review verification.");
  });

  it("marks legal review readiness ready when approval evidence, artifacts, CI, and launch gates align", () => {
    const requiredReviewItemIds = ["privacy-policy", "terms-of-service", "sms-notifications"];
    const requiredArtifactPaths = ["apps/web/app/privacy/page.tsx", "apps/web/app/terms/page.tsx"];
    const plan = buildLegalReviewRuntimeReadinessPlan({
      legalReviewAuditPassed: true,
      requiredReviewItemIds,
      approvedReviewItemIds: requiredReviewItemIds,
      requiredArtifactPaths,
      existingArtifactPaths: requiredArtifactPaths,
      redactedEvidenceLabelsPresent: true,
      privilegedAdviceExcluded: true,
      placeholderCopyReplacedAfterApproval: true,
      legalVerifyCommandPassed: true,
      ciQualityGateIncludesLegalReview: true,
      productionLaunchBlockedUntilApproval: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingApprovedItems).toEqual([]);
    expect(plan.missingArtifacts).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks focused PR diff evidence readiness until closure, downgrade, fallback, CI, and fixture proof exist", () => {
    const plan = buildPrDiffEvidenceRuntimeReadinessPlan({
      diffAuditScriptPresent: true,
      prContextDetectionImplemented: true,
      missingPrContextSkipsSafely: false,
      gapRowParserCoversTrackerColumns: true,
      closureRequiresStatusEvidence: true,
      closureRequiresVerificationEvidence: false,
      blockerDowngradeRequiresEvidence: false,
      unrelatedGapChangesIgnored: false,
      shallowCheckoutFallbackImplemented: false,
      positiveFixturePassed: true,
      negativeFixtureFailed: false,
      ciPullRequestStepWired: true,
      secretSafeLogsVerified: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.requiredCommands).toBe(requiredPrDiffEvidenceRuntimeCommands);
    expect(plan.requiredEvidence).toBe(prDiffEvidenceRuntimeReadinessRequiredEvidence);
    expect(plan.blockers).toContain("Closed/non-open gap rows must require evidence in both current-status and verification columns.");
    expect(plan.blockers).toContain("Production-blocker downgrades must require evidence-rich status and verification columns.");
    expect(plan.blockers).toContain("Negative PR diff fixture without evidence must fail.");
  });

  it("marks focused PR diff evidence readiness ready when algorithm, fixtures, CI, fallback, and logs are proven", () => {
    const plan = buildPrDiffEvidenceRuntimeReadinessPlan({
      diffAuditScriptPresent: true,
      prContextDetectionImplemented: true,
      missingPrContextSkipsSafely: true,
      gapRowParserCoversTrackerColumns: true,
      closureRequiresStatusEvidence: true,
      closureRequiresVerificationEvidence: true,
      blockerDowngradeRequiresEvidence: true,
      unrelatedGapChangesIgnored: true,
      shallowCheckoutFallbackImplemented: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: true,
      ciPullRequestStepWired: true,
      secretSafeLogsVerified: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.blockers).toEqual([]);
  });

  it("blocks focused PR diff evidence closure until persistence, artifacts, and commands are captured", () => {
    const decision = buildPrDiffEvidenceEvidenceDecision({
      diffAuditScriptPresent: true,
      prContextDetectionImplemented: true,
      missingPrContextSkipsSafely: true,
      gapRowParserCoversTrackerColumns: true,
      closureRequiresStatusEvidence: true,
      closureRequiresVerificationEvidence: false,
      blockerDowngradeRequiresEvidence: false,
      unrelatedGapChangesIgnored: true,
      shallowCheckoutFallbackImplemented: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: false,
      ciPullRequestStepWired: true,
      secretSafeLogsVerified: false,
      capturedArtifacts: [
        "docs/quality/manifests/gap-evidence-audit.json",
        "docs/quality/manifests/pr-gap-diff-fixtures.json",
      ],
      completedCommands: ["pnpm quality:pr-gaps", "pnpm quality:pr-gap-fixtures"],
      prDiffEvidenceRunPersisted: false,
    });

    expect(decision.status).toBe("blocked");
    expect(decision.readinessPlan.status).toBe("blocked");
    expect(decision.missingArtifacts).toEqual([
      "PrDiffEvidenceRun persistence row",
      "no-PR context skip artifact",
      "merge-base fallback artifact",
      "positive PR diff fixture artifact",
      "negative PR diff fixture artifact",
      "secret-safe PR diff log review",
    ]);
    expect(decision.missingCommands).toEqual([
      "GitHub Actions pull_request quality job",
      "simulated PR diff audit with missing merge-base fallback",
    ]);
    expect(decision.requiredArtifacts).toBe(requiredPrDiffEvidenceRuntimeArtifacts);
    expect(decision.requiredCommands).toBe(requiredPrDiffEvidenceRuntimeCommands);
    expect(decision.requiredEvidence).toEqual(
      buildPrDiffEvidenceRuntimeExecutionRequiredEvidence(prDiffEvidenceRuntimeReadinessRequiredEvidence),
    );
    expect(decision.blockers).toContain("Closed/non-open gap rows must require evidence in both current-status and verification columns.");
    expect(decision.blockers).toContain("PrDiffEvidenceRun persistence row must be captured for durable auditability.");
    expect(decision.blockers).toContain("Every required PR diff evidence artifact must be captured.");
  });

  it("completes focused PR diff evidence closure when algorithm, persistence, artifacts, and commands are proven", () => {
    const decision = buildPrDiffEvidenceEvidenceDecision({
      diffAuditScriptPresent: true,
      prContextDetectionImplemented: true,
      missingPrContextSkipsSafely: true,
      gapRowParserCoversTrackerColumns: true,
      closureRequiresStatusEvidence: true,
      closureRequiresVerificationEvidence: true,
      blockerDowngradeRequiresEvidence: true,
      unrelatedGapChangesIgnored: true,
      shallowCheckoutFallbackImplemented: true,
      positiveFixturePassed: true,
      negativeFixtureFailed: true,
      ciPullRequestStepWired: true,
      secretSafeLogsVerified: true,
      capturedArtifacts: requiredPrDiffEvidenceRuntimeArtifacts,
      completedCommands: requiredPrDiffEvidenceRuntimeCommands,
      prDiffEvidenceRunPersisted: true,
    });

    expect(decision.status).toBe("complete");
    expect(decision.readinessPlan.status).toBe("ready");
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingCommands).toEqual([]);
    expect(decision.blockers).toEqual([]);
  });

  it("pins durable PrDiffEvidenceRun persistence for PR row-diff enforcement proof", () => {
    const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
    const prismaMigration = readRepoFile(
      "packages/db/prisma/migrations/20260609030000_add_pr_diff_evidence_runs/migration.sql",
    );
    const gapTracker = readRepoFile("GAP_TRACKER.md");
    expect(gapTracker).toContain("GAP-127 is pr-diff-evidence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("buildPrDiffEvidenceRuntimeExecutionPlan");
    expect(gapTracker).toContain("prDiffEvidenceRuntimeExecutionPolicy");
    expect(gapTracker).toContain("prDiffEvidenceRuntimeLocalCommands/prDiffEvidenceRuntimeExternalCommands");
    expect(gapTracker).toContain("prDiffEvidenceRuntimeLocalArtifacts/prDiffEvidenceRuntimeExternalArtifacts");
    expect(gapTracker).toContain("prDiffEvidenceRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("buildPrDiffEvidenceRuntimeArtifactReview");

    expect(prDiffEvidenceRunPersistenceContract.prismaModel).toBe("PrDiffEvidenceRun");
    expect(prDiffEvidenceRunPersistenceContract.tenantRelation).toBe("prDiffEvidenceRuns");
    expect(prDiffEvidenceRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(prDiffEvidenceRunPersistenceContract.jsonFields).toEqual([
      "diffAuditMatrix",
      "fixtureMatrix",
      "evidenceRuleMatrix",
      "artifactManifest",
    ]);
    expect(prDiffEvidenceRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "missingPrContextSkipsSafely",
        "closureRequiresStatusEvidence",
        "closureRequiresVerificationEvidence",
        "blockerDowngradeRequiresEvidence",
        "shallowCheckoutFallbackImplemented",
        "positiveFixturePassed",
        "negativeFixtureFailed",
        "secretSafeLogsVerified",
      ]),
    );
    expect(prDiffEvidenceRunPersistenceContract.redactedArtifactFields).toContain("mergeFallbackArtifactPath");
    expect(prismaSchema).toContain("prDiffEvidenceRuns PrDiffEvidenceRun[]");
    expect(prismaSchema).toContain("model PrDiffEvidenceRun");
    expect(prismaSchema).toContain("evidenceRuleMatrix                      Json");
    expect(prismaSchema).toContain("blockerDowngradeRequiresEvidence        Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "PrDiffEvidenceRun"');
    expect(prismaMigration).toContain('"negativeFixtureArtifactPath" TEXT');
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609030000_add_pr_diff_evidence_runs/migration.sql");
  });

  it("pins current PR diff evidence runtime proof files for GAP-127", () => {
    expect(prDiffEvidenceRuntimeProofFiles).toEqual(
      expect.arrayContaining([
        "scripts/quality/audit-gap-tracker-diff.mjs",
        "scripts/quality/verify-pr-gap-diff-fixtures.mjs",
        "scripts/quality/fixtures/pr-gap-diff/valid-with-evidence.diff",
        "scripts/quality/fixtures/pr-gap-diff/invalid-missing-evidence.diff",
        "packages/quality/package.json",
        "packages/quality/src/index.ts",
        "packages/quality/tests/quality-gates.test.ts",
        "packages/db/prisma/migrations/20260609030000_add_pr_diff_evidence_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of prDiffEvidenceRuntimeProofFiles) {
      expect(readRepoFile(file).length).toBeGreaterThan(0);
    }
  });

  it("keeps GAP-127 execution policy non-executing while separating local and external PR diff proof", () => {
    const plan = buildPrDiffEvidenceRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(prDiffEvidenceRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(prDiffEvidenceRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(prDiffEvidenceRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(prDiffEvidenceRuntimeExternalArtifacts);
    expect(plan).toMatchObject({
      prGapAuditExecutionAllowed: false,
      fixtureVerificationExecutionAllowed: false,
      noPrSkipSimulationExecutionAllowed: false,
      pullRequestCiExecutionAllowed: false,
      mergeBaseFallbackSimulationExecutionAllowed: false,
      positiveFixtureArtifactCaptureAllowed: false,
      negativeFixtureArtifactCaptureAllowed: false,
      secretSafeLogReviewAllowed: false,
      persistenceExecutionAllowed: false,
      branchProtectionEnforcementAllowed: false,
    });
    expect(plan.executionPolicy).toBe(prDiffEvidenceRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyStaticPrDiffEvidence: true,
      runtimeCommandEvidenceRequiredForClosure: true,
      ciPullRequestEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      branchProtectionEvidenceRequiredForClosure: true,
      secretSafeLogReviewRequiredForClosure: true,
    });
    expect(plan.requiredExternalEvidence).toBe(prDiffEvidenceRuntimeRequiredExternalEvidence);
  });

  it("redacts PR diff evidence runtime artifacts before tracker or handoff use", () => {
    const artifact = {
      runId: "prdiff_01HZYXZYXZYXZYXZYXZYXZYXZ",
      repositoryUrl: "https://github.com/dominator509/InkRoute/pull/127",
      branchName: "feature/customer-jane-doe@example.com",
      logOutput: "token github_pat_1234567890ABCDEFGHIJKLMNOP for +1 (555) 867-5309",
      persistence: {
        tenantId: "tenant_01HZYXZYXZYXZYXZYXZYXZYXZ",
        databaseUrl: "postgres://inkroute:secret@example.neon.tech/inkroute",
      },
    };

    expect(buildRedactedPrDiffEvidenceArtifact(artifact)).toEqual({
      runId: "[REDACTED]",
      repositoryUrl: "[REDACTED]",
      branchName: "[REDACTED]",
      logOutput: "token [REDACTED] for [REDACTED]",
      persistence: {
        tenantId: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
    });

    const review = buildPrDiffEvidenceRuntimeArtifactReview(artifact);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(prDiffEvidenceRuntimeRequiredExternalEvidence);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "runId",
        "repositoryUrl",
        "branchName",
        "logOutput",
        "persistence.tenantId",
        "persistence.databaseUrl",
      ]),
    );
    expect(review.requiredExternalEvidence).toBe(prDiffEvidenceRuntimeRequiredExternalEvidence);
  });

  it("blocks semantic documentation readiness when static checks fail or runtime/provider/legal proof is conflated", () => {
    const plan = buildSemanticDocumentationRuntimeReadinessPlan({
      qualityDocsScriptIncludesLinkAudit: true,
      qualityDocsScriptIncludesConsistencyAudit: false,
      qualityDocsScriptIncludesInventoryAudit: true,
      structuralLinksPassed: true,
      concreteRepoPathsPassed: false,
      productionReadinessClaimsPassed: false,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: false,
      legalReadinessLanguagePassed: false,
      appPackageInventoryPassed: false,
      documentationInventoryContractCurrent: true,
      ciEvidenceCaptured: false,
      runtimeProofSeparated: false,
      providerProofSeparated: false,
      legalReviewSeparated: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.failedSemanticChecks).toEqual([
      "concrete-repo-paths",
      "production-readiness-claims",
      "provider-readiness-language",
      "legal-readiness-language",
      "app-package-inventory",
    ]);
    expect(plan.requiredCommands).toBe(semanticDocumentationRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(semanticDocumentationRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("quality:docs must chain link/path, documentation consistency, and documentation inventory audits.");
    expect(plan.blockers).toContain("Semantic documentation audit must not be treated as runtime build or live route proof.");
  });

  it("marks semantic documentation readiness ready when static audits pass and evidence boundaries remain separate", () => {
    const plan = buildSemanticDocumentationRuntimeReadinessPlan({
      qualityDocsScriptIncludesLinkAudit: true,
      qualityDocsScriptIncludesConsistencyAudit: true,
      qualityDocsScriptIncludesInventoryAudit: true,
      structuralLinksPassed: true,
      concreteRepoPathsPassed: true,
      productionReadinessClaimsPassed: true,
      apiRouteReferencesPassed: true,
      providerReadinessLanguagePassed: true,
      legalReadinessLanguagePassed: true,
      appPackageInventoryPassed: true,
      documentationInventoryContractCurrent: true,
      ciEvidenceCaptured: true,
      runtimeProofSeparated: true,
      providerProofSeparated: true,
      legalReviewSeparated: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.failedSemanticChecks).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });

  it("blocks required checks readiness until package scripts, CI terms, branch protection, settings, and failing PR proof exist", () => {
    const plan = buildRequiredChecksRuntimeReadinessPlan({
      requiredPackageScripts: ["quality:all", "quality:required-checks", "test:unit:coverage"],
      packageScripts: {
        "quality:all": "pnpm quality:docs",
      },
      requiredWorkflowTerms: ["pnpm quality:all", "pnpm test:unit:coverage", "pnpm test:e2e"],
      ciWorkflowText: "run: pnpm quality:all",
      requiredBranchProtectionChecks: ["CI / quality", "typecheck", "lint"],
      configuredBranchProtectionChecks: ["CI / quality"],
      requiredRepositorySettings: ["Require pull request before merging", "Require CODEOWNERS review", "Enable secret scanning"],
      configuredRepositorySettings: ["Require pull request before merging"],
      requiredChecksAuditPassed: false,
      qualityAllChainsRequiredChecks: false,
      branchProtectionEvidenceCaptured: false,
      failingQualityPrBlocked: false,
      codeownersReviewActive: false,
    });

    expect(plan.status).toBe("blocked");
    expect(plan.missingPackageScripts).toEqual(["quality:required-checks", "test:unit:coverage"]);
    expect(plan.missingWorkflowTerms).toEqual(["pnpm test:unit:coverage", "pnpm test:e2e"]);
    expect(plan.missingBranchProtectionChecks).toEqual(["typecheck", "lint"]);
    expect(plan.missingRepositorySettings).toEqual(["Require CODEOWNERS review", "Enable secret scanning"]);
    expect(plan.requiredCommands).toBe(requiredChecksRuntimeRequiredCommands);
    expect(plan.requiredEvidence).toBe(requiredChecksRuntimeRequiredEvidence);
    expect(plan.blockers).toContain("GitHub branch protection must require every documented quality status check.");
    expect(plan.blockers).toContain("A failing quality-gate PR must be proven unable to merge.");
  });

  it("marks required checks readiness ready when package scripts, CI workflow, branch protection, settings, and failing PR proof align", () => {
    const requiredPackageScripts = ["quality:all", "quality:required-checks", "test:unit:coverage"];
    const requiredWorkflowTerms = ["pnpm quality:all", "pnpm test:unit:coverage", "pnpm test:e2e"];
    const requiredBranchProtectionChecks = ["CI / quality", "typecheck", "lint"];
    const requiredRepositorySettings = ["Require pull request before merging", "Require CODEOWNERS review", "Enable secret scanning"];
    const plan = buildRequiredChecksRuntimeReadinessPlan({
      requiredPackageScripts,
      packageScripts: {
        "quality:all": "pnpm quality:docs && pnpm quality:required-checks",
        "quality:required-checks": "node scripts/quality/verify-required-checks.mjs",
        "test:unit:coverage": "vitest run --coverage",
      },
      requiredWorkflowTerms,
      ciWorkflowText: requiredWorkflowTerms.join("\n"),
      requiredBranchProtectionChecks,
      configuredBranchProtectionChecks: requiredBranchProtectionChecks,
      requiredRepositorySettings,
      configuredRepositorySettings: requiredRepositorySettings,
      requiredChecksAuditPassed: true,
      qualityAllChainsRequiredChecks: true,
      branchProtectionEvidenceCaptured: true,
      failingQualityPrBlocked: true,
      codeownersReviewActive: true,
    });

    expect(plan.status).toBe("ready");
    expect(plan.missingPackageScripts).toEqual([]);
    expect(plan.missingWorkflowTerms).toEqual([]);
    expect(plan.missingBranchProtectionChecks).toEqual([]);
    expect(plan.missingRepositorySettings).toEqual([]);
    expect(plan.blockers).toEqual([]);
  });
});
