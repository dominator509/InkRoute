import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  productionLaunchEvidenceBundleIds,
  productionLaunchEvidenceRuntimeArtifactPaths,
  productionLaunchEvidenceRuntimeCommands,
  productionLaunchEvidenceRuntimeMatrix,
  productionLaunchEvidenceRuntimeReadiness,
  productionLaunchEvidenceRunPersistenceContract
} from "../lib/productionLaunchEvidenceRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const launchEvidence = read("deployment/manifests/production-launch-evidence.json");
const launchChecklist = read("deployment/manifests/production-launch-checklist.json");
const launchVerifier = read("deployment/scripts/verify-launch-evidence.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read(
  "packages/db/prisma/migrations/20260609021000_add_production_launch_evidence_runs/migration.sql"
);

describe("GAP-118 production launch evidence runtime wiring", () => {
  it("pins launch evidence bundles, commands, matrix entries, and redacted artifact paths", () => {
    expect(productionLaunchEvidenceBundleIds).toEqual([
      "ci-build-test",
      "database-ops",
      "provider-and-secret-readiness",
      "security-privacy-trust",
      "accessibility-seo-performance",
      "mobile-release",
      "legal-approval",
      "rollback-and-operations"
    ]);
    expect(productionLaunchEvidenceRuntimeCommands).toEqual([
      "pnpm deploy:verify-launch-evidence",
      "pnpm quality:all",
      "pnpm test:unit",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/dashboard build",
      "pnpm deploy:verify-database-ops",
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:verify-secrets",
      "pnpm deploy:verify-mobile",
      "production rollback drill"
    ]);
    expect(productionLaunchEvidenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "launch-evidence-verifier",
      "ci-build-test-bundle",
      "database-provider-secret-bundles",
      "security-quality-mobile-bundles",
      "legal-approval-bundle",
      "rollback-operations-bundle",
      "final-approval-record"
    ]);
    expect(productionLaunchEvidenceRuntimeArtifactPaths).toContain("coverage/production-launch-approval-redacted.json");
    expect(productionLaunchEvidenceRuntimeArtifactPaths).toContain("test-results/production-launch-evidence-runtime");
  });

  it("keeps launch evidence manifest, checklist, verifier, and package tests aligned", () => {
    for (const bundleId of productionLaunchEvidenceBundleIds) {
      expect(launchEvidence).toContain(`"id": "${bundleId}"`);
    }
    expect(launchEvidence).toContain('"approvalStatus": "blocked"');
    expect(launchEvidence).toContain("provider secrets");
    expect(launchEvidence).toContain("legal reviewer private contact details");
    expect(launchChecklist).toContain("productionBlocked");
    expect(launchVerifier).toContain("production-launch-evidence.json");
    expect(launchVerifier).toContain("production-launch-checklist.json");
    expect(deploymentTests).toContain("buildProductionLaunchEvidenceRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until all bundles, verifier, legal, rollback, providers, CI, and explicit approval are verified", () => {
    expect(productionLaunchEvidenceRuntimeReadiness.status).toBe("blocked");
    expect(productionLaunchEvidenceRuntimeReadiness.missingBundles).toEqual([]);
    expect(productionLaunchEvidenceRuntimeReadiness.incompleteBundles).toEqual(
      expect.arrayContaining(["ci-build-test", "database-ops", "legal-approval", "rollback-and-operations"])
    );
    expect(productionLaunchEvidenceRuntimeReadiness.requiredCommands).toEqual(productionLaunchEvidenceRuntimeCommands);
    expect(productionLaunchEvidenceRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "CI install, typecheck, lint, unit, E2E/smoke, web build, and dashboard build artifacts.",
        "Database migration, seed, backup/restore, tenant-isolation, provider, and secret evidence.",
        "Security/privacy, accessibility, SEO, performance, and provider sandbox evidence.",
        "Mobile build, device QA, push, crash, OTA rollback, and store-readiness evidence.",
        "Legal approval labels for privacy, terms, consent, SMS, deposit, refund, and medical copy.",
        "Rollback drill evidence for web, dashboard, mobile OTA, database restore, and incident owner coverage.",
        "Explicit redacted production approval record after every bundle is verified."
      ])
    );
    expect(productionLaunchEvidenceRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Every production launch evidence bundle must be verified_redacted with required evidence, source artifacts, and gap ids.",
        "pnpm deploy:verify-launch-evidence must pass.",
        "Legal approval evidence must be verified before production approval.",
        "Explicit production approval record must be captured as a redacted label."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 production launch evidence runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/production-launch-evidence-runtime-static.test.ts");
    expect(ciWorkflow).toContain("production-launch-evidence-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/production-launch-evidence-runtime.json");
    expect(ciWorkflow).toContain("test-results/production-launch-evidence-runtime");
    expect(unitManifest).toContain("unit-web-production-launch-evidence-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/productionLaunchEvidenceRuntime.ts");
    expect(gapTracker).toContain("live production launch approval proof remains open");
  });

  it("pins durable ProductionLaunchEvidenceRun persistence for launch approval proof", () => {
    expect(productionLaunchEvidenceRunPersistenceContract.prismaModel).toBe("ProductionLaunchEvidenceRun");
    expect(productionLaunchEvidenceRunPersistenceContract.tenantRelation).toBe("productionLaunchEvidenceRuns");
    expect(productionLaunchEvidenceRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(productionLaunchEvidenceRunPersistenceContract.jsonFields).toEqual([
      "launchBundleMatrix",
      "checklistBlockers",
      "unsafeEvidenceFindings",
      "artifactManifest"
    ]);
    expect(productionLaunchEvidenceRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "ciBuildTestEvidenceVerified",
        "databaseOperationsEvidenceVerified",
        "providerSecretEvidenceVerified",
        "legalApprovalVerified",
        "rollbackOperationsEvidenceVerified",
        "checklistBlockersRetained",
        "unsafeEvidenceScanPassed",
        "explicitProductionApprovalCaptured",
        "ciLaunchEvidenceArtifactsCaptured"
      ])
    );
    expect(productionLaunchEvidenceRunPersistenceContract.redactedArtifactFields).toContain(
      "explicitApprovalArtifactPath"
    );
    expect(prismaSchema).toContain("productionLaunchEvidenceRuns ProductionLaunchEvidenceRun[]");
    expect(prismaSchema).toContain("model ProductionLaunchEvidenceRun");
    expect(prismaSchema).toContain("launchBundleMatrix                      Json");
    expect(prismaSchema).toContain("explicitProductionApprovalCaptured      Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "ProductionLaunchEvidenceRun"');
    expect(prismaMigration).toContain('"explicitApprovalArtifactPath" TEXT');
    expect(unitManifest).toContain("ProductionLaunchEvidenceRun Prisma model and app row contract");
    expect(gapTracker).toContain(
      "packages/db/prisma/migrations/20260609021000_add_production_launch_evidence_runs/migration.sql"
    );
  });
});
