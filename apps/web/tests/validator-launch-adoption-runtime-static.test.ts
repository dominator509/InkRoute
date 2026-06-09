import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validatorLaunchAdoptionArtifactPaths,
  validatorLaunchAdoptionRuntimeCommands,
  validatorLaunchAdoptionRuntimeMatrix,
  validatorLaunchAdoptionRuntimeReadiness,
  validatorLaunchAdoptionRunPersistenceContract,
} from "../lib/validatorLaunchAdoptionRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("validator launch adoption runtime contract", () => {
  const validatorsPackageJson = readRepoFile("packages/validators/package.json");
  const validatorsIndex = readRepoFile("packages/validators/src/index.ts");
  const validatorsReadiness = readRepoFile("packages/validators/src/readiness.ts");
  const validatorsTests = readRepoFile("packages/validators/tests/schemas.test.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const stripeWebhookRoute = readRepoFile("apps/web/app/api/webhooks/stripe/route.ts");
  const dashboardReleaseRoute = readRepoFile("apps/dashboard/app/api/releases/route.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const validatorLaunchAdoptionRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034300_add_validator_launch_adoption_runs/migration.sql");

  it("pins validator launch commands, matrix rows, and artifact paths", () => {
    expect(validatorLaunchAdoptionRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/validators typecheck",
      "pnpm --filter @inkroute/validators test",
      "validator route adoption static scan",
      "public/dashboard malformed payload route tests",
      "webhook/provider payload normalization route tests",
      "tenant/auth scope validator route tests",
      "sensitive-field redaction/encryption contract tests",
      "GitHub Actions validator launch evidence job",
    ]);
    expect(validatorLaunchAdoptionRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "validator-package-gates",
      "core-domain-schema-coverage",
      "messaging-observability-release-tenancy-form-coverage",
      "route-shared-schema-adoption",
      "malformed-payload-and-tenant-scope-routes",
      "webhook-provider-payload-normalization",
      "sensitive-field-redaction-encryption",
      "ci-secret-safe-artifacts",
    ]);
    expect(validatorLaunchAdoptionArtifactPaths).toContain("coverage/validator-launch-adoption-runtime.json");
    expect(validatorLaunchAdoptionArtifactPaths).toContain("coverage/validator-secret-safe-artifacts.json");
    expect(validatorLaunchAdoptionArtifactPaths).toContain("test-results/validator-launch-adoption-runtime");
  });

  it("keeps validator package scripts, domains, helper, tests, and representative routes visible", () => {
    expect(validatorsPackageJson).toContain('"typecheck"');
    expect(validatorsPackageJson).toContain('"test"');
    for (const exportedDomain of ["booking", "travel", "portfolio", "payments", "people", "forms", "messaging", "observability", "release", "tenancy", "seo"]) {
      expect(validatorsIndex).toContain(exportedDomain);
    }
    expect(validatorsReadiness).toContain("buildValidatorLaunchAdoptionEvidencePlan");
    expect(validatorsTests).toContain("buildValidatorLaunchAdoptionEvidencePlan");
    expect(bookingRoute).toContain("bookingRequestInputSchema");
    expect(stripeWebhookRoute).toContain("webhook");
    expect(dashboardReleaseRoute).toContain("releaseCreateInputSchema");
  });

  it("keeps validator launch adoption blocked until schema, route, security, CI, and safe artifact evidence exists", () => {
    expect(validatorLaunchAdoptionRuntimeReadiness.status).toBe("blocked");
    expect(validatorLaunchAdoptionRuntimeReadiness.missingScripts).toEqual([]);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredCommands).toEqual([...validatorLaunchAdoptionRuntimeCommands]);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredControls).toEqual([
      "Reject malformed public, dashboard, webhook, provider, and mobile payloads before side effects.",
      "Keep tenant, role, permission, and cross-tenant validation centralized in shared schemas.",
      "Align accepted medical, consent, contact, payment, provider, and metadata fields with redaction/encryption policy before persistence.",
      "Publish only redacted validator reports and route test artifacts.",
    ]);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredEvidence).toEqual([
      "validator package typecheck and test command evidence",
      "schema-domain happy/error and tenant/auth/form edge-case coverage evidence",
      "public, dashboard, webhook, and provider route shared-schema adoption evidence",
      "malformed-payload and tenant-scope route contract evidence",
      "sensitive-field redaction and encryption-gate security evidence",
      "CI validator launch evidence and secret-safe artifact proof",
    ]);
    expect(validatorLaunchAdoptionRuntimeReadiness.blockers).toContain(
      "Public API routes must use shared validator schemas.",
    );
    expect(validatorLaunchAdoptionRuntimeReadiness.blockers).toContain(
      "Webhook routes must use shared validator schemas before side effects.",
    );
    expect(validatorLaunchAdoptionRuntimeReadiness.blockers).toContain(
      "Security contract tests must prove accepted sensitive fields are redacted or encryption-gated before persistence.",
    );
  });

  it("pins the ValidatorLaunchAdoptionRun persistence model and migration", () => {
    expect(validatorLaunchAdoptionRunPersistenceContract).toEqual({
      prismaModel: "ValidatorLaunchAdoptionRun",
      tenantRelation: "validatorLaunchAdoptionRuns",
      migration: "20260609034300_add_validator_launch_adoption_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesSchemaDomainEvidence: true,
      storesRouteAdoptionEvidence: true,
      storesMalformedPayloadEvidence: true,
      storesTenantScopeEvidence: true,
      storesSensitiveFieldEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(prismaSchema).toContain("model ValidatorLaunchAdoptionRun");
    expect(prismaSchema).toContain("validatorLaunchAdoptionRuns ValidatorLaunchAdoptionRun[]");
    expect(prismaSchema).toContain("routeAdoptionEvidenceCaptured");
    expect(prismaSchema).toContain("sensitiveFieldEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(validatorLaunchAdoptionRunMigration).toContain('CREATE TABLE "ValidatorLaunchAdoptionRun"');
    expect(validatorLaunchAdoptionRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(validatorLaunchAdoptionRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(validatorLaunchAdoptionRunMigration).toContain('"ValidatorLaunchAdoptionRun_tenantId_runId_key"');
  });

  it("wires CI, manifest, tracker, and artifacts without claiming route-wide validator launch adoption", () => {
    expect(ciWorkflow).toContain("Run Phase 2 validator launch adoption runtime contracts");
    expect(ciWorkflow).toContain("validator-launch-adoption-runtime-static.test.ts");
    expect(ciWorkflow).toContain("validator-launch-adoption-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/validator-launch-adoption-runtime.json");
    expect(unitManifest).toContain("unit-web-validator-launch-adoption-runtime-static");
    expect(unitManifest).toContain("ValidatorLaunchAdoptionRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/validatorLaunchAdoptionRuntime.ts");
    expect(gapTracker).toContain("ValidatorLaunchAdoptionRun Prisma model and app row contract");
    expect(gapTracker).toContain("live installed-workspace validator typecheck/tests, route-wide shared-schema adoption proof, malformed-payload tests, tenant/auth scope tests, sensitive-field redaction/encryption tests, CI evidence, and secret-safe artifacts remain open");
  });
});
