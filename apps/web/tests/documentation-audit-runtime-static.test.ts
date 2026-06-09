import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  documentationAuditGeneratedReports,
  documentationAuditRootScripts,
  documentationAuditRuntimeArtifactPaths,
  documentationAuditRuntimeCommands,
  documentationAuditRuntimeMatrix,
  documentationAuditRuntimeReadiness,
  documentationAuditRunPersistenceContract,
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
      "provider/legal evidence review",
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
    expect(documentationAuditRuntimeReadiness.requiredCommands).toEqual([...documentationAuditRuntimeCommands]);
    expect(documentationAuditRuntimeReadiness.blockers).toEqual([
      "CI evidence for pnpm quality:docs must be captured.",
      "Provider readiness documentation claims must have provider evidence or remain blocked/gated.",
      "Legal readiness documentation claims must have legal review evidence or remain pending/gated.",
      "Stale provider status proof must be captured before closing documentation quality.",
    ]);
  });

  it("wires CI, manifest, tracker, and artifact capture without claiming provider/legal proof is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 16 documentation audit runtime contracts");
    expect(ciWorkflow).toContain("documentation-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("documentation-audit-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-documentation-audit-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/documentationAuditRuntime.ts");
    expect(gapTracker).toContain("live CI, provider review, legal review, and stale provider proof remain open");
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
});
