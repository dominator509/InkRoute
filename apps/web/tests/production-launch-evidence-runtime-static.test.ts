import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildProductionLaunchEvidenceRuntimeArtifactReview,
  buildProductionLaunchEvidenceRuntimeEvidenceDecision,
  buildProductionLaunchEvidenceRuntimeExecutionPlan,
  buildProductionLaunchEvidenceRuntimeRedactedEvidenceBundle,
  buildRedactedProductionLaunchEvidenceArtifact,
  productionLaunchEvidenceBundleRequiredEvidence,
  productionLaunchEvidenceBundleIds,
  productionLaunchEvidenceRuntimeArtifactPaths,
  productionLaunchEvidenceRuntimeCommands,
  productionLaunchEvidenceRuntimeExternalArtifacts,
  productionLaunchEvidenceRuntimeExternalCommands,
  productionLaunchEvidenceRuntimeExecutionPolicy,
  productionLaunchEvidenceRuntimeLocalArtifacts,
  productionLaunchEvidenceRuntimeLocalCommands,
  productionLaunchEvidenceRuntimeMatrix,
  productionLaunchEvidenceRuntimeProofFiles,
  productionLaunchEvidenceRuntimeReadiness,
  productionLaunchEvidenceRuntimeRequiredExternalEvidence,
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
      "verify production launch database operations bundle",
      "verify production launch provider readiness bundle",
      "verify production launch secret readiness bundle",
      "verify production launch security/privacy/trust bundle",
      "verify production launch accessibility/SEO/performance bundle",
      "pnpm deploy:verify-mobile",
      "verify production launch legal approval bundle",
      "production rollback drill"
    ]);
    expect(productionLaunchEvidenceRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "launch-evidence-verifier",
      "ci-build-test-bundle",
      "database-ops-bundle",
      "provider-secret-bundle",
      "security-privacy-trust-bundle",
      "accessibility-seo-performance-bundle",
      "mobile-release-bundle",
      "legal-approval-bundle",
      "rollback-operations-bundle",
      "final-approval-record",
      "redacted-evidence-bundle"
    ]);
    expect(productionLaunchEvidenceRuntimeMatrix).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "database-ops-bundle", artifact: "coverage/production-launch-database-ops-redacted.json" }),
        expect.objectContaining({ id: "security-privacy-trust-bundle", artifact: "coverage/production-launch-security-privacy-redacted.json" }),
        expect.objectContaining({ id: "accessibility-seo-performance-bundle", artifact: "coverage/production-launch-a11y-seo-performance-redacted.json" }),
        expect.objectContaining({ id: "mobile-release-bundle", artifact: "coverage/production-launch-mobile-release-redacted.json" }),
        expect.objectContaining({ id: "legal-approval-bundle", command: "verify production launch legal approval bundle" }),
        expect.objectContaining({ id: "redacted-evidence-bundle", artifact: "coverage/production-launch-redacted-evidence-bundle.json" })
      ])
    );
    expect(productionLaunchEvidenceRuntimeArtifactPaths).toContain("coverage/production-launch-approval-redacted.json");
    expect(productionLaunchEvidenceRuntimeArtifactPaths).toContain("coverage/production-launch-redacted-evidence-bundle.json");
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
    expect(productionLaunchEvidenceRuntimeReadiness.requiredCommands).toBe(productionLaunchEvidenceRuntimeCommands);
    expect(productionLaunchEvidenceRuntimeReadiness.requiredBundles[0]?.requiredEvidence).toBe(
      productionLaunchEvidenceBundleRequiredEvidence,
    );
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
    expect(gapTracker).toContain("Production launch evidence classifier wired and approval proof gated");
    expect(gapTracker).toContain("GAP-118 is production-launch-evidence-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("productionLaunchEvidenceBundleRequiredEvidence");
    expect(gapTracker).toContain("buildProductionLaunchEvidenceRuntimeExecutionPlan");
    expect(gapTracker).toContain("productionLaunchEvidenceRuntimeExecutionPolicy");
    expect(gapTracker).toContain("productionLaunchEvidenceRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("productionLaunchEvidenceRuntimeLocalArtifacts");
    expect(gapTracker).toContain("productionLaunchEvidenceRuntimeExternalArtifacts");
    expect(gapTracker).toContain("buildProductionLaunchEvidenceRuntimeArtifactReview");
    expect(gapTracker).toContain("buildProductionLaunchEvidenceRuntimeRedactedEvidenceBundle");
  });

  it("pins current production launch evidence runtime proof files for GAP-118", () => {
    expect(productionLaunchEvidenceRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "deployment/PRODUCTION_LAUNCH_CHECKLIST.md",
      "packages/deployment/src/index.ts",
      "apps/dashboard/package.json",
      "apps/web/package.json",
        "apps/web/lib/productionLaunchEvidenceRuntime.ts",
        "apps/web/tests/production-launch-evidence-runtime-static.test.ts",
        "deployment/manifests/production-launch-evidence.json",
        "deployment/scripts/verify-launch-evidence.mjs",
        "packages/db/prisma/migrations/20260609021000_add_production_launch_evidence_runs/migration.sql",
        ".github/workflows/ci.yml"
      ])
    );
    for (const file of productionLaunchEvidenceRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
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

  it("classifies GAP-118 evidence as blocked until every launch bundle and explicit approval is captured", () => {
    const blockedDecision = buildProductionLaunchEvidenceRuntimeEvidenceDecision({
      verifierPassed: true,
      ciBuildTestEvidenceVerified: false,
      databaseOperationsEvidenceVerified: false,
      providerSecretEvidenceVerified: false,
      securityPrivacyTrustEvidenceVerified: false,
      accessibilitySeoPerformanceVerified: false,
      mobileReleaseEvidenceVerified: false,
      legalApprovalVerified: false,
      rollbackOperationsEvidenceVerified: false,
      checklistBlockersRetained: true,
      unsafeEvidenceScanPassed: true,
      explicitProductionApprovalCaptured: false,
      ciLaunchEvidenceArtifactsCaptured: false,
      requiredCommandsRun: productionLaunchEvidenceRuntimeCommands.filter(
        (command) =>
          command !== "pnpm quality:all" &&
          command !== "verify production launch database operations bundle" &&
          command !== "verify production launch provider readiness bundle" &&
          command !== "verify production launch secret readiness bundle" &&
          command !== "verify production launch legal approval bundle" &&
          command !== "production rollback drill",
      ),
      capturedArtifacts: [
        "coverage/production-launch-evidence-runtime.json",
        "coverage/production-launch-verifier.json",
        "coverage/production-launch-checklist-blockers.json",
        "test-results/production-launch-evidence-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Verify CI/build/test evidence bundle.",
        "Verify database operations evidence bundle.",
        "Verify provider and secret readiness evidence bundle.",
        "Verify security/privacy/trust evidence bundle.",
        "Verify legal approval evidence bundle.",
        "Verify rollback and operations evidence bundle.",
        "Capture explicit redacted production approval.",
        "Capture CI launch-evidence artifacts.",
        "Required command not recorded: pnpm quality:all",
        "Required command not recorded: verify production launch database operations bundle",
        "Required command not recorded: verify production launch provider readiness bundle",
        "Required command not recorded: verify production launch secret readiness bundle",
        "Required command not recorded: verify production launch legal approval bundle",
        "Required command not recorded: production rollback drill",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/production-launch-ci-build-test-redacted.json",
        "coverage/production-launch-database-ops-redacted.json",
        "coverage/production-launch-provider-secret-redacted.json",
        "coverage/production-launch-legal-approval-redacted.json",
        "coverage/production-launch-approval-redacted.json",
        "coverage/production-launch-ci-run-redacted.json",
        "coverage/production-launch-redacted-evidence-bundle.json",
      ]),
    );
    expect(blockedDecision.launchPolicy).toEqual({
      approvalBlockedUntilEveryBundleVerified: true,
      unsafeEvidenceForbidden: true,
      redactedApprovalRecordRequired: true,
    });

    const completeDecision = buildProductionLaunchEvidenceRuntimeEvidenceDecision({
      verifierPassed: true,
      ciBuildTestEvidenceVerified: true,
      databaseOperationsEvidenceVerified: true,
      providerSecretEvidenceVerified: true,
      securityPrivacyTrustEvidenceVerified: true,
      accessibilitySeoPerformanceVerified: true,
      mobileReleaseEvidenceVerified: true,
      legalApprovalVerified: true,
      rollbackOperationsEvidenceVerified: true,
      checklistBlockersRetained: true,
      unsafeEvidenceScanPassed: true,
      explicitProductionApprovalCaptured: true,
      ciLaunchEvidenceArtifactsCaptured: true,
      requiredCommandsRun: productionLaunchEvidenceRuntimeCommands,
      capturedArtifacts: productionLaunchEvidenceRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(productionLaunchEvidenceRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(productionLaunchEvidenceRuntimeArtifactPaths);
  });

  it("keeps production launch execution disabled while splitting local verifier artifacts from external approval proof", () => {
    const plan = buildProductionLaunchEvidenceRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(productionLaunchEvidenceRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(productionLaunchEvidenceRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(productionLaunchEvidenceRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(productionLaunchEvidenceRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/production-launch-evidence-runtime.json",
        "coverage/production-launch-verifier.json",
        "coverage/production-launch-checklist-blockers.json",
        "test-results/production-launch-evidence-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/production-launch-ci-build-test-redacted.json",
        "coverage/production-launch-database-ops-redacted.json",
        "coverage/production-launch-provider-secret-redacted.json",
        "coverage/production-launch-security-privacy-redacted.json",
        "coverage/production-launch-a11y-seo-performance-redacted.json",
        "coverage/production-launch-mobile-release-redacted.json",
        "coverage/production-launch-legal-approval-redacted.json",
        "coverage/production-launch-rollback-operations-redacted.json",
        "coverage/production-launch-approval-redacted.json",
        "coverage/production-launch-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.qualityGateExecutionAllowed).toBe(false);
    expect(plan.buildExecutionAllowed).toBe(false);
    expect(plan.databaseBundleExecutionAllowed).toBe(false);
    expect(plan.providerSecretBundleExecutionAllowed).toBe(false);
    expect(plan.securityPrivacyTrustExecutionAllowed).toBe(false);
    expect(plan.accessibilitySeoPerformanceExecutionAllowed).toBe(false);
    expect(plan.mobileReleaseExecutionAllowed).toBe(false);
    expect(plan.legalApprovalExecutionAllowed).toBe(false);
    expect(plan.rollbackDrillExecutionAllowed).toBe(false);
    expect(plan.productionApprovalExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(productionLaunchEvidenceRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifyLaunchBundles: true,
      approvalBlockedUntilEveryBundleVerified: true,
      legalApprovalRequiresHumanReviewer: true,
      rollbackDrillRequiresApprovedRuntime: true,
      productionApprovalMustRemainHumanGated: true,
      unsafeEvidenceForbidden: true,
    });
    expect(plan.externalEvidenceRequired).toBe(productionLaunchEvidenceRuntimeRequiredExternalEvidence);
    expect(plan.externalEvidenceRequired).toContain(
      "Redacted production launch evidence bundle captured without raw provider IDs, database URLs, run URLs, reviewer contacts, customer data, approval payloads, rollback owner contacts, or production URLs.",
    );
  });

  it("redacts production launch artifacts before approval review or retention", () => {
    const rawArtifact = {
      approvalPayload: { approvedBy: "legal@example.com", phone: "+1 555 121 9999" },
      databaseUrl: "postgres://tenant_demo:secret@db.example.com/inkroute",
      providerProjectId: "project_prod_123",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      rollbackIncidentOwner: "owner@example.com",
      launchBundleUrl: "https://inkroute.example.com/launch/bundle_abc",
      nested: {
        authorization: "Bearer launch-approval-token",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedProductionLaunchEvidenceArtifact(rawArtifact);
    const review = buildProductionLaunchEvidenceRuntimeArtifactReview("coverage/production-launch-approval-redacted.json", rawArtifact);
    const bundle = buildProductionLaunchEvidenceRuntimeRedactedEvidenceBundle("coverage/production-launch-approval-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("legal@example.com");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("inkroute.example.com");
    expect(serialized).not.toContain("project_prod_123");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 121 9999");
    expect(serialized).not.toContain("Bearer launch-approval-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "approvalPayload",
        "authorization",
        "ciRunUrl",
        "databaseUrl",
        "launchBundleUrl",
        "providerProjectId",
        "rollbackIncidentOwner",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(productionLaunchEvidenceRuntimeRequiredExternalEvidence);
    expect(bundle.status).toBe("redacted-evidence-bundle-ready");
    expect(bundle.artifactPath).toBe("coverage/production-launch-redacted-evidence-bundle.json");
    expect(bundle.review.containsUnredactedSensitiveValues).toBe(false);
    expect(bundle.requiredArtifacts).toBe(productionLaunchEvidenceRuntimeArtifactPaths);
    expect(bundle.externalEvidenceRequired).toBe(productionLaunchEvidenceRuntimeRequiredExternalEvidence);
    expect(bundle.approvalExecutionAllowed).toBe(false);
    expect(bundle.ciArtifactExecutionAllowed).toBe(false);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "CI/build/test, database, provider, secret, security, accessibility, SEO, performance, and mobile bundles must be captured outside Codex when execution is approved.",
        "Legal approval and explicit production approval must be human-reviewed, redacted, and captured only after every bundle is verified.",
        "Rollback and operations artifacts must prove approved runtime execution and redact incident owner contact details.",
        "Launch evidence artifacts must redact provider IDs, database URLs, run URLs, reviewer contacts, customer data, and approval payloads.",
      ]),
    );
  });
});

