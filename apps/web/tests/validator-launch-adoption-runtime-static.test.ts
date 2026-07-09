import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildRedactedValidatorLaunchAdoptionArtifact,
  buildValidatorLaunchAdoptionEvidenceDecision,
  buildValidatorLaunchAdoptionArtifactReview,
  buildValidatorLaunchAdoptionExecutionPlan,
  buildValidatorLaunchAdoptionRunData,
  buildValidatorRouteAdoptionScan,
  persistValidatorLaunchAdoptionRun,
  validatorLaunchAdoptionExternalArtifacts,
  validatorLaunchAdoptionExternalCommands,
  validatorLaunchAdoptionArtifactPaths,
  validatorLaunchAdoptionEvidenceFlags,
  validatorLaunchAdoptionExecutionPolicy,
  validatorLaunchAdoptionLocalArtifacts,
  validatorLaunchAdoptionLocalCommands,
  validatorLaunchAdoptionRequiredExternalEvidence,
  validatorLaunchAdoptionRuntimeCommands,
  validatorLaunchAdoptionRuntimeControls,
  validatorLaunchAdoptionRuntimeMatrix,
  validatorLaunchAdoptionRuntimeProofFiles,
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
      "booking/travel/portfolio/payment and people/consent/forms/SEO schema happy/error tests",
      "messaging/observability/release, tenancy/auth, and dynamic form edge-case tests",
      "validator route adoption static scan",
      "public/dashboard malformed payload route tests",
      "webhook/provider payload normalization route tests",
      "tenant/auth scope validator route tests",
      "sensitive-field redaction/encryption contract tests",
      "GitHub Actions validator launch evidence job",
      "secret-safe validator artifact review",
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

  it("pins validator launch adoption runtime control helper identity", () => {
    const decision = buildValidatorLaunchAdoptionEvidenceDecision({
      commands: validatorLaunchAdoptionRuntimeCommands,
      artifacts: validatorLaunchAdoptionArtifactPaths,
      controls: validatorLaunchAdoptionRuntimeControls,
      evidence: Object.fromEntries(validatorLaunchAdoptionEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof validatorLaunchAdoptionEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(validatorLaunchAdoptionRuntimeControls);
    expect(gapTracker).toContain("validatorLaunchAdoptionRuntimeControls");
  });

  it("keeps validator package scripts, domains, helper, tests, and representative routes visible", () => {
    expect(validatorsPackageJson).toContain('"typecheck"');
    expect(validatorsPackageJson).toContain('"test"');
    for (const exportedDomain of ["booking", "travel", "portfolio", "payments", "people", "forms", "messaging", "observability", "release", "tenancy", "seo"]) {
      expect(validatorsIndex).toContain(exportedDomain);
    }
    expect(validatorsReadiness).toContain("buildValidatorLaunchAdoptionEvidencePlan");
    expect(validatorsTests).toContain("buildValidatorLaunchAdoptionEvidencePlan");
    expect(validatorsTests).toContain("covers messaging, notification, and provider webhook malformed payload edges");
    expect(validatorsTests).toContain("covers observability report and filter edge cases");
    expect(validatorsTests).toContain("covers tenancy/auth and dynamic form edge cases with sensitive-field denial");
    expect(bookingRoute).toContain("bookingRequestInputSchema");
    expect(stripeWebhookRoute).toContain("webhook");
    expect(dashboardReleaseRoute).toContain("releaseCreateInputSchema");
  });

  it("scans representative route sources for shared schemas before side effects", () => {
    const scan = buildValidatorRouteAdoptionScan([
      {
        route: "apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts",
        family: "public",
        source: bookingRoute,
        requiredSchemaSymbols: ["bookingRequestInputSchema", "safeParse"],
        sideEffectSymbols: ["prisma.bookingRequest.create", "localRuntimeState.recordBookingRequest"],
      },
      {
        route: "apps/web/app/api/webhooks/stripe/route.ts",
        family: "webhook",
        source: stripeWebhookRoute,
        requiredSchemaSymbols: ["JSON.parse", "verifyStripeWebhookSignature"],
        sideEffectSymbols: ["paymentAuditLog", "providerWebhookDelivery"],
      },
      {
        route: "apps/dashboard/app/api/releases/route.ts",
        family: "dashboard",
        source: dashboardReleaseRoute,
        requiredSchemaSymbols: ["releaseCreateInputSchema", "safeParse"],
        sideEffectSymbols: ["releaseRecord", "auditLog"],
      },
    ]);

    expect(scan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: "public", usesSharedSchemas: true, validatesBeforeSideEffects: true }),
        expect.objectContaining({ family: "webhook", usesSharedSchemas: true, validatesBeforeSideEffects: true }),
        expect.objectContaining({ family: "dashboard", usesSharedSchemas: true, validatesBeforeSideEffects: true }),
      ]),
    );
  });

  it("keeps validator launch adoption blocked until schema, route, security, CI, and safe artifact evidence exists", () => {
    expect(validatorLaunchAdoptionRuntimeReadiness.status).toBe("blocked");
    expect(validatorLaunchAdoptionRuntimeReadiness.missingScripts).toEqual([]);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredCommands).toBe(validatorLaunchAdoptionRuntimeCommands);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredControls).toBe(validatorLaunchAdoptionRuntimeControls);
    expect(validatorLaunchAdoptionRuntimeReadiness.requiredEvidence).toBe(validatorLaunchAdoptionEvidenceFlags);
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
    const runData = buildValidatorLaunchAdoptionRunData({
      tenantId: "tenant_static",
      runId: "validator_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["validator route adoption static scan"],
      artifacts: ["coverage/validator-public-route-adoption.json"],
      schemaDomainEvidenceCaptured: true,
      routeAdoptionEvidenceCaptured: false,
      malformedPayloadEvidenceCaptured: false,
      tenantScopeEvidenceCaptured: false,
      sensitiveFieldEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      routeAdoptionReportPath: "coverage/validator-public-route-adoption.json",
      sensitiveFieldReportPath: "coverage/validator-sensitive-field-policy.json",
    });

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
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "validator_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["validator route adoption static scan"],
      artifactManifest: ["coverage/validator-public-route-adoption.json"],
      schemaDomainEvidenceCaptured: true,
      routeAdoptionEvidenceCaptured: false,
      tenantScopeEvidenceCaptured: false,
      sensitiveFieldEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      routeAdoptionReportPath: "coverage/validator-public-route-adoption.json",
      sensitiveFieldReportPath: "coverage/validator-sensitive-field-policy.json",
    });
    expect(String(persistValidatorLaunchAdoptionRun)).toContain("repository.validatorLaunchAdoptionRun.upsert");
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

  it("blocks validator launch adoption when route, tenant-scope, sensitive-field, or safe-artifact evidence is missing", () => {
    const decision = buildValidatorLaunchAdoptionEvidenceDecision({
      commands: ["pnpm --filter @inkroute/validators typecheck"],
      artifacts: ["coverage/validator-package-typecheck.txt"],
      controls: ["reject-malformed-public-dashboard-webhook-provider-mobile-payloads-before-side-effects"],
      evidence: {
        validatorsTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("sensitive-field redaction/encryption contract tests");
    expect(decision.missingArtifacts).toContain("coverage/validator-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("align-sensitive-fields-with-redaction-encryption-before-persistence");
    expect(decision.missingEvidence).toContain("publicRoutesUseSharedSchemas");
    expect(decision.missingEvidence).toContain("redactionEncryptionPolicyTestsPassed");
    expect(decision.blockers).toContain("Public API routes must use shared validator schemas.");
    expect(decision.blockers).toContain(
      "Security contract tests must prove accepted sensitive fields are redacted or encryption-gated before persistence.",
    );
  });

  it("completes validator launch adoption only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(validatorLaunchAdoptionEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildValidatorLaunchAdoptionEvidenceDecision({
      commands: validatorLaunchAdoptionRuntimeCommands,
      artifacts: validatorLaunchAdoptionArtifactPaths,
      controls: validatorLaunchAdoptionRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(validatorLaunchAdoptionEvidenceFlags);
  });

  it("keeps validator launch adoption execution classified, redacted, and route/provider-gated", () => {
    const executionPlan = buildValidatorLaunchAdoptionExecutionPlan();
    expect(executionPlan.localCommands).toBe(validatorLaunchAdoptionLocalCommands);
    expect(executionPlan.externalCommands).toBe(validatorLaunchAdoptionExternalCommands);
    expect(executionPlan.localArtifacts).toBe(validatorLaunchAdoptionLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(validatorLaunchAdoptionExternalArtifacts);
    expect(executionPlan.localCommands).toContain("pnpm --filter @inkroute/validators typecheck");
    expect(executionPlan.localCommands).toContain("validator route adoption static scan");
    expect(executionPlan.externalCommands).toContain("public/dashboard malformed payload route tests");
    expect(executionPlan.externalCommands).toContain("provider-backed persistValidatorLaunchAdoptionRun execution proof");
    expect(executionPlan.localArtifacts).toContain("coverage/validator-public-route-adoption.json");
    expect(executionPlan.externalArtifacts).toContain("coverage/validator-redaction-encryption-contracts.json");
    expect(executionPlan.externalArtifacts).toContain("provider-backed ValidatorLaunchAdoptionRun persistence proof");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.routeWideExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(validatorLaunchAdoptionExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticValidatorLaunchReadiness: true,
      routeWideProofRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      sensitiveFieldSecurityProofRequiredForClosure: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(validatorLaunchAdoptionRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed ValidatorLaunchAdoptionRun persistence row captured through persistValidatorLaunchAdoptionRun.",
    );

    const artifact = {
      webhookPayloadId: "payload_1234567890abcdefghijklmnopqrstuvwxyz",
      clientEmail: "client@example.com",
      clientPhone: "+1 555 222 1212",
      medicalConsent: "raw consent text",
      repositorySelector: "repo:dominator509/InkRoute",
      branchSelector: "branch:production/validator-launch",
      pullRequestSelector: "pr_validator_launch",
      reviewerHandle: "reviewer_validator_owner",
      codeownerSelector: "CODEOWNER:validator-platform-team",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        providerToken: "github_pat_abcdefghijklmnopqrstuvwxyz123456",
        publicSummary: "validator launch adoption evidence captured",
      },
    };
    const redactedOnly = buildRedactedValidatorLaunchAdoptionArtifact(artifact);
    const review = buildValidatorLaunchAdoptionArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("client@example.com");
    expect(serialized).not.toContain("payload_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("+1 555 222 1212");
    expect(serialized).not.toContain("raw consent text");
    expect(serialized).not.toContain("repo:dominator509/InkRoute");
    expect(serialized).not.toContain("branch:production/validator-launch");
    expect(serialized).not.toContain("pr_validator_launch");
    expect(serialized).not.toContain("reviewer_validator_owner");
    expect(serialized).not.toContain("CODEOWNER:validator-platform-team");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("github_pat_abcdefghijklmnopqrstuvwxyz123456");
    expect(review.redactions).toEqual([
      "webhookPayloadId",
      "clientEmail",
      "clientPhone",
      "medicalConsent",
      "repositorySelector",
      "branchSelector",
      "pullRequestSelector",
      "reviewerHandle",
      "codeownerSelector",
      "nested.databaseUrl",
      "nested.providerToken",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(validatorLaunchAdoptionRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming route-wide validator launch adoption", () => {
    expect(ciWorkflow).toContain("Run Phase 2 validator launch adoption runtime contracts");
    expect(ciWorkflow).toContain("validator-launch-adoption-runtime-static.test.ts");
    expect(ciWorkflow).toContain("validator-launch-adoption-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/validator-launch-adoption-runtime.json");
    expect(unitManifest).toContain("unit-web-validator-launch-adoption-runtime-static");
    expect(unitManifest).toContain("ValidatorLaunchAdoptionRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/validatorLaunchAdoptionRuntime.ts");
    expect(gapTracker).toContain("buildValidatorRouteAdoptionScan");
    expect(gapTracker).toContain("persistValidatorLaunchAdoptionRun upsert seam");
    expect(gapTracker).toContain("live installed-workspace validator typecheck/tests, provider-backed persistValidatorLaunchAdoptionRun execution, route-wide shared-schema adoption proof, malformed-payload tests, tenant/auth scope tests, sensitive-field redaction/encryption tests, CI evidence, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("GAP-020 is validator-launch-adoption-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildValidatorLaunchAdoptionExecutionPlan");
    expect(gapTracker).toContain("validatorLaunchAdoptionLocalCommands/validatorLaunchAdoptionExternalCommands");
    expect(gapTracker).toContain("validatorLaunchAdoptionExecutionPolicy");
    expect(gapTracker).toContain("validatorLaunchAdoptionRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedValidatorLaunchAdoptionArtifact");
    expect(gapTracker).toContain("buildValidatorLaunchAdoptionArtifactReview");
    expect(gapTracker).toContain("GAP-020 validator launch adoption artifact hardening now redacts repository/branch/PR/reviewer/CODEOWNER selectors");
  });

  it("pins current validator launch adoption proof files for GAP-020", () => {
    expect(validatorLaunchAdoptionRuntimeProofFiles).toContain("packages/validators/package.json");
    expect(validatorLaunchAdoptionRuntimeProofFiles).toContain("apps/web/lib/validatorLaunchAdoptionRuntime.ts");
    expect(validatorLaunchAdoptionRuntimeProofFiles).toContain("apps/web/tests/validator-launch-adoption-runtime-static.test.ts");
    for (const proofFile of validatorLaunchAdoptionRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


