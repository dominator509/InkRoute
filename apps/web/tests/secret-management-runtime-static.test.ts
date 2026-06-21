import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSecretManagementRunData,
  buildSecretManagementRuntimeArtifactReview,
  buildSecretManagementRuntimeEvidenceDecision,
  buildSecretManagementRuntimeExecutionPlan,
  buildRedactedSecretManagementArtifact,
  persistSecretManagementRun,
  secretManagementRequiredProductionSecretNames,
  secretManagementRuntimeArtifactPaths,
  secretManagementRuntimeCommands,
  secretManagementRuntimeExternalArtifacts,
  secretManagementRuntimeExternalCommands,
  secretManagementRuntimeExecutionPolicy,
  secretManagementRuntimeLocalArtifacts,
  secretManagementRuntimeLocalCommands,
  secretManagementRuntimeMatrix,
  secretManagementRuntimeProofFiles,
  secretManagementRuntimeReadiness,
  secretManagementRuntimeRequiredExternalEvidence,
  secretManagementRunPersistenceContract
} from "../lib/secretManagementRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const secretAudit = read("deployment/manifests/secret-management-audit.json");
const environmentContract = read("deployment/manifests/environment-contract.json");
const secretVerifier = read("deployment/scripts/verify-secret-management.mjs");
const envChecker = read("deployment/scripts/check-env.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read("packages/db/prisma/migrations/20260609018000_add_secret_management_runs/migration.sql");

describe("GAP-115 secret management runtime wiring", () => {
  it("pins production secret names, commands, matrix entries, and redacted artifact paths", () => {
    expect(secretManagementRequiredProductionSecretNames).toEqual([
      "DATABASE_URL",
      "DIRECT_URL",
      "AUTH_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "SENTRY_AUTH_TOKEN",
      "VERCEL_TOKEN",
      "VERCEL_ORG_ID",
      "VERCEL_WEB_PROJECT_ID",
      "VERCEL_DASHBOARD_PROJECT_ID",
      "CSRF_SECRET",
      "SECURITY_ENCRYPTION_PRIMARY_KEY",
      "EAS_PROJECT_ID"
    ]);
    expect(secretManagementRuntimeCommands).toEqual([
      "pnpm deploy:verify-secrets",
      "pnpm deploy:check-env:strict",
      "committed secret scan",
      "provider secret-store audit",
      "masked CI log review",
      "provider audit-log reference capture",
      "document secret rotation cadence and dual-control policy",
      "incident rotation tabletop",
      "capture CI secret-management artifacts"
    ]);
    expect(secretManagementRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "secret-audit-verifier",
      "strict-env-real-secrets",
      "provider-secret-stores",
      "masked-ci-log-review",
      "provider-audit-log-references",
      "rotation-policy-dual-control",
      "incident-rotation-tabletop",
      "committed-secret-scan",
      "ci-secret-management-artifacts"
    ]);
    expect(secretManagementRuntimeArtifactPaths).toContain("coverage/secret-committed-scan.json");
    expect(secretManagementRuntimeArtifactPaths).toContain("test-results/secret-management-runtime");
  });

  it("keeps secret audit manifest, environment contract, verifier, and strict env checker aligned", () => {
    for (const secretName of secretManagementRequiredProductionSecretNames) {
      expect(secretAudit).toContain(`"name": "${secretName}"`);
      expect(environmentContract).toContain(secretName);
    }
    expect(secretAudit).toContain("secretValuesAllowedInGit");
    expect(secretAudit).toContain("requiresDualControlForProduction");
    expect(secretAudit).toContain("requiresMaskedCiLogProof");
    expect(secretVerifier).toContain("secret-management-audit.json");
    expect(secretVerifier).toContain("forbiddenEvidenceExamples");
    expect(envChecker).toContain("strict-values");
    expect(deploymentTests).toContain("buildSecretManagementRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until real secret stores, strict env, scans, masked logs, audit logs, and incident rotation proof exist", () => {
    expect(secretManagementRuntimeReadiness.status).toBe("blocked");
    expect(secretManagementRuntimeReadiness.missingProductionSecrets).toEqual(
      expect.arrayContaining(["DATABASE_URL", "STRIPE_SECRET_KEY", "EAS_PROJECT_ID"])
    );
    expect(secretManagementRuntimeReadiness.requiredCommands).toBe(secretManagementRuntimeCommands);
    expect(secretManagementRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Secret-management audit manifest with configured_redacted or rotated_redacted status for every production secret.",
        "Strict environment check output from a real secret-backed preview/staging/production environment.",
        "Provider secret-store destination labels and audit-log references without secret values.",
        "Masked CI log artifacts proving secrets are not printed.",
        "Rotation cadence, dual-control review, and incident rotation owner evidence.",
        "Committed-secret scan output for .env.example, deployment manifests, and CI workflows."
      ])
    );
    expect(secretManagementRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Every production secret from the environment contract must be represented in the secret-management audit.",
        "pnpm deploy:verify-secrets must pass.",
        "pnpm deploy:check-env:strict must pass against a real secret-backed environment.",
        "Provider secret stores must be configured without committing secret material.",
        "Committed-secret scanning must pass for env examples and deployment manifests."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 secret management runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/secret-management-runtime-static.test.ts");
    expect(ciWorkflow).toContain("secret-management-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/secret-management-runtime.json");
    expect(ciWorkflow).toContain("test-results/secret-management-runtime");
    expect(unitManifest).toContain("unit-web-secret-management-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/secretManagementRuntime.ts");
    expect(gapTracker).toContain("Secret management evidence classifier wired and secret-store proof gated");
    expect(gapTracker).toContain("GAP-115 is secret-management-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("secretManagementRuntimeLocalArtifacts");
    expect(gapTracker).toContain("secretManagementRuntimeExternalArtifacts");
  });

  it("pins current secret management runtime proof files for GAP-115", () => {
    expect(secretManagementRuntimeProofFiles).toEqual(
      expect.arrayContaining([
      "apps/dashboard/app/api/deployment/readiness/route.ts",
      "apps/dashboard/tests/deployment-readiness-route-static.test.ts",
      "packages/deployment/src/index.ts",
        "apps/web/lib/secretManagementRuntime.ts",
        "apps/web/tests/secret-management-runtime-static.test.ts",
        "deployment/manifests/secret-management-audit.json",
        "deployment/scripts/verify-secret-management.mjs",
        "packages/db/prisma/migrations/20260609018000_add_secret_management_runs/migration.sql",
        ".github/workflows/ci.yml",
      ]),
    );
    for (const file of secretManagementRuntimeProofFiles) {
      expect(read(file).length).toBeGreaterThan(0);
    }
  });

  it("pins durable SecretManagementRun persistence without storing secret values", () => {
    const runData = buildSecretManagementRunData({
      tenantId: "tenant_static",
      runId: "secret_management_static",
      commitSha: "abc123",
      status: "blocked",
      productionSecretInventory: [{ name: "DATABASE_URL", status: "configured_redacted" }],
      auditManifest: [{ name: "DATABASE_URL", secretValuesAllowedInGit: false }],
      artifactManifest: ["coverage/secret-management-runtime.json"],
      verifierPassed: true,
      strictEnvCheckPassed: false,
      providerSecretStoresConfigured: false,
      maskedCiLogsCaptured: false,
      providerAuditLogsCaptured: false,
      rotationCadenceDocumented: true,
      dualControlPolicyDocumented: true,
      incidentRotationTabletopDocumented: false,
      committedSecretScanPassed: true,
      ciSecretManagementArtifactsCaptured: false,
      requiredCommandsRun: ["pnpm deploy:verify-secrets", "committed secret scan"],
      capturedArtifacts: ["coverage/secret-management-runtime.json"],
      redactedProviderStoreArtifactPath: "coverage/secret-provider-store-destinations-redacted.json",
      maskedCiLogArtifactPath: "coverage/secret-masked-ci-logs-redacted.json",
      providerAuditLogArtifactPath: "coverage/secret-provider-audit-logs-redacted.json",
      incidentRotationTabletopArtifactPath: "coverage/secret-incident-rotation-tabletop.md",
      committedSecretScanArtifactPath: "coverage/secret-committed-scan.json",
      ciRunUrl: "https://github.example/redacted/secret-management",
    });

    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "secret_management_static",
      status: "blocked",
      rotationCadenceDocumented: true,
      committedSecretScanPassed: true,
      redactedProviderStoreArtifactPath: "coverage/secret-provider-store-destinations-redacted.json",
    });
    expect(persistSecretManagementRun).toBeTypeOf("function");
    expect(String(persistSecretManagementRun)).toContain("repository.secretManagementRun.upsert");
    expect(secretManagementRunPersistenceContract.prismaModel).toBe("SecretManagementRun");
    expect(secretManagementRunPersistenceContract.tenantRelation).toBe("secretManagementRuns");
    expect(secretManagementRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(secretManagementRunPersistenceContract.jsonFields).toEqual([
      "productionSecretInventory",
      "auditManifest",
      "artifactManifest"
    ]);
    expect(secretManagementRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "providerSecretStoresConfigured",
        "maskedCiLogsCaptured",
        "providerAuditLogsCaptured",
        "dualControlPolicyDocumented",
        "committedSecretScanPassed",
        "ciSecretManagementArtifactsCaptured"
      ])
    );
    expect(secretManagementRunPersistenceContract.redactedArtifactFields).toEqual(
      expect.arrayContaining([
        "redactedProviderStoreArtifactPath",
        "maskedCiLogArtifactPath",
        "providerAuditLogArtifactPath",
        "committedSecretScanArtifactPath"
      ])
    );
    expect(prismaSchema).toContain("secretManagementRuns SecretManagementRun[]");
    expect(prismaSchema).toContain("model SecretManagementRun");
    expect(prismaSchema).toContain("productionSecretInventory               Json");
    expect(prismaSchema).toContain("providerSecretStoresConfigured          Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "SecretManagementRun"');
    expect(prismaMigration).toContain('"redactedProviderStoreArtifactPath" TEXT');
    expect(prismaMigration).not.toContain("secretValue");
    expect(unitManifest).toContain("SecretManagementRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609018000_add_secret_management_runs/migration.sql");
    expect(gapTracker).toContain("persistSecretManagementRun upsert seam");
  });

  it("classifies GAP-115 evidence as blocked until redacted secret-store proof is captured", () => {
    const blockedDecision = buildSecretManagementRuntimeEvidenceDecision({
      verifierPassed: true,
      strictEnvCheckPassed: false,
      providerSecretStoresConfigured: false,
      maskedCiLogsCaptured: false,
      providerAuditLogsCaptured: false,
      rotationCadenceDocumented: true,
      dualControlPolicyDocumented: true,
      incidentRotationTabletopDocumented: false,
      committedSecretScanPassed: true,
      ciSecretManagementArtifactsCaptured: false,
      requiredCommandsRun: secretManagementRuntimeCommands.filter(
        (command) =>
          command !== "pnpm deploy:check-env:strict" &&
          command !== "provider secret-store audit" &&
          command !== "masked CI log review" &&
          command !== "provider audit-log reference capture" &&
          command !== "incident rotation tabletop" &&
          command !== "capture CI secret-management artifacts",
      ),
      capturedArtifacts: [
        "coverage/secret-management-runtime.json",
        "coverage/secret-management-verifier.json",
        "coverage/secret-rotation-policy.json",
        "coverage/secret-committed-scan.json",
        "test-results/secret-management-runtime"
      ],
    });

    expect(blockedDecision.status).toBe("blocked");
    expect(blockedDecision.blockers).toEqual(
      expect.arrayContaining([
        "Run strict env check against a real secret-backed environment.",
        "Capture provider secret-store configuration proof.",
        "Capture masked CI log proof.",
        "Capture provider audit-log references.",
        "Document incident rotation tabletop.",
        "Capture CI secret-management artifacts.",
        "Required command not recorded: pnpm deploy:check-env:strict",
        "Required command not recorded: provider secret-store audit",
        "Required command not recorded: masked CI log review",
        "Required command not recorded: provider audit-log reference capture",
        "Required command not recorded: incident rotation tabletop",
        "Required command not recorded: capture CI secret-management artifacts",
      ]),
    );
    expect(blockedDecision.missingArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/secret-strict-env-check-redacted.json",
        "coverage/secret-provider-store-destinations-redacted.json",
        "coverage/secret-masked-ci-logs-redacted.json",
        "coverage/secret-provider-audit-logs-redacted.json",
        "coverage/secret-management-ci-run-redacted.json",
      ]),
    );
    expect(blockedDecision.secretPolicy).toEqual({
      secretValuesForbidden: true,
      providerStoreLabelsOnly: true,
      maskedCiLogsRequired: true,
    });

    const completeDecision = buildSecretManagementRuntimeEvidenceDecision({
      verifierPassed: true,
      strictEnvCheckPassed: true,
      providerSecretStoresConfigured: true,
      maskedCiLogsCaptured: true,
      providerAuditLogsCaptured: true,
      rotationCadenceDocumented: true,
      dualControlPolicyDocumented: true,
      incidentRotationTabletopDocumented: true,
      committedSecretScanPassed: true,
      ciSecretManagementArtifactsCaptured: true,
      requiredCommandsRun: secretManagementRuntimeCommands,
      capturedArtifacts: secretManagementRuntimeArtifactPaths,
    });

    expect(completeDecision.status).toBe("complete");
    expect(completeDecision.blockers).toEqual([]);
    expect(completeDecision.missingArtifacts).toEqual([]);
    expect(completeDecision.requiredCommands).toBe(secretManagementRuntimeCommands);
    expect(completeDecision.requiredEvidence).toBe(secretManagementRuntimeArtifactPaths);
  });

  it("keeps secret-management execution disabled while separating local labels from external secret proof", () => {
    const plan = buildSecretManagementRuntimeExecutionPlan();

    expect(plan.localCommands).toBe(secretManagementRuntimeLocalCommands);
    expect(plan.externalCommands).toBe(secretManagementRuntimeExternalCommands);
    expect(plan.localArtifacts).toBe(secretManagementRuntimeLocalArtifacts);
    expect(plan.externalArtifacts).toBe(secretManagementRuntimeExternalArtifacts);
    expect(plan.localArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/secret-management-runtime.json",
        "coverage/secret-management-verifier.json",
        "coverage/secret-rotation-policy.json",
        "coverage/secret-incident-rotation-tabletop.md",
        "coverage/secret-committed-scan.json",
        "test-results/secret-management-runtime",
      ]),
    );
    expect(plan.externalArtifacts).toEqual(
      expect.arrayContaining([
        "coverage/secret-strict-env-check-redacted.json",
        "coverage/secret-provider-store-destinations-redacted.json",
        "coverage/secret-masked-ci-logs-redacted.json",
        "coverage/secret-provider-audit-logs-redacted.json",
        "coverage/secret-management-ci-run-redacted.json",
      ]),
    );
    expect(plan.verifierExecutionAllowed).toBe(false);
    expect(plan.strictEnvExecutionAllowed).toBe(false);
    expect(plan.providerSecretStoreExecutionAllowed).toBe(false);
    expect(plan.maskedCiLogExecutionAllowed).toBe(false);
    expect(plan.providerAuditLogExecutionAllowed).toBe(false);
    expect(plan.rotationPolicyExecutionAllowed).toBe(false);
    expect(plan.incidentTabletopExecutionAllowed).toBe(false);
    expect(plan.committedSecretScanExecutionAllowed).toBe(false);
    expect(plan.ciArtifactExecutionAllowed).toBe(false);
    expect(plan.persistenceExecutionAllowed).toBe(false);
    expect(plan.executionPolicy).toBe(secretManagementRuntimeExecutionPolicy);
    expect(plan.executionPolicy).toEqual({
      codexMayClassifySecretLabels: true,
      secretValuesForbidden: true,
      providerStoreAccessRequiresApprovedOperator: true,
      strictEnvironmentRequiresRealSecretBackedRuntime: true,
      ciProviderRequiredForMaskedLogs: true,
      providerDatabaseRequiredForPersistence: true,
    });
  });

  it("redacts secret-management artifacts before review or persistence", () => {
    const rawArtifact = {
      secretValue: "sk_live_secret_value",
      databaseUrl: "postgres://tenant_demo:secret@db.example.com/inkroute",
      directUrl: "postgres://tenant_demo:secret@direct.example.com/inkroute",
      providerSecretStore: "provider_secret_store_prod",
      auditLogReference: "audit_secret_123",
      ciRunUrl: "https://github.com/dominator509/InkRoute/actions/runs/123456",
      maskedLog: "AUTH_SECRET=super-secret-value\nSTRIPE_SECRET_KEY=sk_live_hidden",
      contactEmail: "owner@example.com",
      phone: "+1 555 888 1212",
      nested: {
        authorization: "Bearer secret-management-token",
        tenantId: "tenant_demo",
      },
    };
    const redacted = buildRedactedSecretManagementArtifact(rawArtifact);
    const review = buildSecretManagementRuntimeArtifactReview("coverage/secret-management-ci-run-redacted.json", rawArtifact);
    const serialized = JSON.stringify(review);

    expect(JSON.stringify(redacted)).not.toContain("sk_live_secret_value");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("github.com/dominator509");
    expect(serialized).not.toContain("super-secret-value");
    expect(serialized).not.toContain("sk_live_hidden");
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("+1 555 888 1212");
    expect(serialized).not.toContain("Bearer secret-management-token");
    expect(serialized).not.toContain("tenant_demo");
    expect(review.containsUnredactedSensitiveValues).toBe(false);
    expect(review.redactions).toEqual(
      expect.arrayContaining([
        "authorization",
        "auditLogReference",
        "ciRunUrl",
        "databaseUrl",
        "directUrl",
        "maskedLog",
        "phone",
        "providerSecretStore",
        "secretValue",
      ]),
    );
    expect(review.externalEvidenceRequired).toBe(secretManagementRuntimeRequiredExternalEvidence);
    expect(review.externalEvidenceRequired).toEqual(
      expect.arrayContaining([
        "Strict environment checks must run only in approved secret-backed environments and retain redacted labels only.",
        "Provider secret-store and audit-log proof must include labels/references only, never secret values or provider IDs.",
        "Masked CI logs must prove secrets are not printed while redacting run URLs, tokens, and environment details.",
        "SecretManagementRun persistence must execute only against an approved provider-backed database without storing secret values.",
      ]),
    );
  });
});

