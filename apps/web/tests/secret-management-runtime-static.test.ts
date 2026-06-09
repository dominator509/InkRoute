import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  secretManagementRequiredProductionSecretNames,
  secretManagementRuntimeArtifactPaths,
  secretManagementRuntimeCommands,
  secretManagementRuntimeMatrix,
  secretManagementRuntimeReadiness
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
      "incident rotation tabletop"
    ]);
    expect(secretManagementRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "secret-audit-verifier",
      "strict-env-real-secrets",
      "provider-secret-stores",
      "masked-ci-provider-audit",
      "rotation-incident-process",
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
    expect(secretManagementRuntimeReadiness.requiredCommands).toEqual(secretManagementRuntimeCommands);
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
    expect(gapTracker).toContain("live secret-store configuration proof remains open");
  });
});
