import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  providerEnvironmentRuntimeArtifactPaths,
  providerEnvironmentRuntimeCommands,
  providerEnvironmentRuntimeMatrix,
  providerEnvironmentRuntimeReadiness,
  providerEnvironmentRuntimeSurfaces,
  providerEnvironmentRunPersistenceContract
} from "../lib/providerEnvironmentRuntime";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const providerManifest = read("deployment/manifests/provider-environment-evidence.json");
const providerVerifier = read("deployment/scripts/verify-provider-envs.mjs");
const deploymentTests = read("packages/deployment/tests/deployment-readiness.test.ts");
const ciWorkflow = read(".github/workflows/ci.yml");
const unitManifest = read("testing/manifests/unit-test-manifest.json");
const gapTracker = read("GAP_TRACKER.md");
const prismaSchema = read("packages/db/prisma/schema.prisma");
const prismaMigration = read(
  "packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql"
);

describe("GAP-114 provider environment runtime wiring", () => {
  it("pins provider environment commands, surfaces, matrix entries, and artifacts", () => {
    expect(providerEnvironmentRuntimeSurfaces).toEqual([
      "web",
      "dashboard",
      "database",
      "storage",
      "mobile",
      "observability",
      "ci_cd"
    ]);
    expect(providerEnvironmentRuntimeCommands).toEqual([
      "pnpm deploy:verify-provider-envs",
      "pnpm deploy:check-env:strict",
      "provider web/dashboard route smoke",
      "provider database migration dry-run",
      "provider storage private ACL smoke",
      "eas build --profile preview",
      "sentry release/source-map smoke",
      "github environment protection audit"
    ]);
    expect(providerEnvironmentRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "manifest-verifier",
      "strict-env-secret-store",
      "web-dashboard-smoke",
      "database-storage-smoke",
      "mobile-observability-smoke",
      "github-environment-protections",
      "redacted-handoff-ci"
    ]);
    expect(providerEnvironmentRuntimeArtifactPaths).toContain("coverage/provider-secret-store-destinations-redacted.json");
    expect(providerEnvironmentRuntimeArtifactPaths).toContain("test-results/provider-environment-runtime");
  });

  it("keeps redacted provider evidence manifest and verifier coverage wired", () => {
    for (const environment of ["preview", "staging", "production"]) {
      expect(providerManifest).toContain(`"name": "${environment}"`);
    }
    for (const surface of providerEnvironmentRuntimeSurfaces) {
      expect(providerManifest).toContain(`"surface": "${surface}"`);
    }
    expect(providerManifest).toContain("forbiddenInGit");
    expect(providerManifest).toContain("provider project ids");
    expect(providerManifest).toContain("secret-store destination name");
    expect(providerVerifier).toContain("provider-environment-evidence.json");
    expect(providerVerifier).toContain("verified_redacted");
    expect(deploymentTests).toContain("buildProviderEnvironmentRuntimeReadinessPlan");
  });

  it("keeps readiness blocked until provider surfaces are verified redacted and smoke/protection evidence exists", () => {
    expect(providerEnvironmentRuntimeReadiness.status).toBe("blocked");
    expect(providerEnvironmentRuntimeReadiness.missingEnvironmentSurfacePairs).toEqual(
      expect.arrayContaining(["preview/web", "staging/database", "production/ci_cd"])
    );
    expect(providerEnvironmentRuntimeReadiness.requiredCommands).toEqual(providerEnvironmentRuntimeCommands);
    expect(providerEnvironmentRuntimeReadiness.requiredEvidence).toEqual(
      expect.arrayContaining([
        "Redacted preview, staging, and production web/dashboard URL labels with smoke output.",
        "Managed Postgres branch/project label, migration dry-run log, and backup/restore proof.",
        "Private storage bucket ACL proof and signed upload/download smoke evidence.",
        "EAS project/channel labels, preview build artifact, and device QA proof.",
        "Sentry project label, sample issue label, and source-map upload artifact.",
        "GitHub Actions environment protection, required checks, secret-store destination, and artifact-retention proof."
      ])
    );
    expect(providerEnvironmentRuntimeReadiness.blockers).toEqual(
      expect.arrayContaining([
        "Provider evidence manifest must cover preview, staging, and production for every required surface.",
        "pnpm deploy:verify-provider-envs must pass.",
        "Provider smoke checks must pass for web, dashboard, database, storage, mobile, observability, and CI/CD.",
        "GitHub preview, staging, and production environment protections must be configured."
      ])
    );
  });

  it("keeps CI, manifest registration, and tracker status aligned", () => {
    expect(ciWorkflow).toContain("Run Phase 15 provider environment runtime contracts");
    expect(ciWorkflow).toContain("apps/web/tests/provider-environment-runtime-static.test.ts");
    expect(ciWorkflow).toContain("provider-environment-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/provider-environment-runtime.json");
    expect(ciWorkflow).toContain("test-results/provider-environment-runtime");
    expect(unitManifest).toContain("unit-web-provider-environment-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/providerEnvironmentRuntime.ts");
    expect(gapTracker).toContain("live provider provisioning proof remains open");
  });

  it("pins durable ProviderEnvironmentRun persistence before provider provisioning proof is captured", () => {
    expect(providerEnvironmentRunPersistenceContract.prismaModel).toBe("ProviderEnvironmentRun");
    expect(providerEnvironmentRunPersistenceContract.tenantRelation).toBe("providerEnvironmentRuns");
    expect(providerEnvironmentRunPersistenceContract.uniqueKey).toEqual(["tenantId", "runId"]);
    expect(providerEnvironmentRunPersistenceContract.jsonFields).toEqual([
      "environmentMatrix",
      "surfaceMatrix",
      "artifactManifest"
    ]);
    expect(providerEnvironmentRunPersistenceContract.requiredBooleanProofs).toEqual(
      expect.arrayContaining([
        "previewProvisioned",
        "stagingProvisioned",
        "productionProvisioned",
        "secretStoreDestinationsConfigured",
        "redactedEvidenceLabelsRecorded",
        "ciProviderEnvironmentArtifactsCaptured"
      ])
    );
    expect(prismaSchema).toContain("providerEnvironmentRuns ProviderEnvironmentRun[]");
    expect(prismaSchema).toContain("model ProviderEnvironmentRun");
    expect(prismaSchema).toContain("environmentMatrix                       Json");
    expect(prismaSchema).toContain("githubEnvironmentProtectionsConfigured  Boolean  @default(false)");
    expect(prismaSchema).toContain("@@unique([tenantId, runId])");
    expect(prismaMigration).toContain('CREATE TABLE "ProviderEnvironmentRun"');
    expect(prismaMigration).toContain('"redactedHandoffArtifactPath" TEXT');
    expect(unitManifest).toContain("ProviderEnvironmentRun Prisma model and app row contract");
    expect(gapTracker).toContain("packages/db/prisma/migrations/20260609017000_add_provider_environment_runs/migration.sql");
  });
});
