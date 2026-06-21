import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBookingPersistenceApiArtifactReview,
  buildBookingPersistenceApiEvidenceDecision,
  buildBookingPersistenceApiExecutionPlan,
  buildBookingPersistenceApiRunData,
  buildRedactedBookingPersistenceApiArtifact,
  persistBookingPersistenceApiRun,
  bookingPersistenceApiArtifactPaths,
  bookingPersistenceApiEvidenceFlags,
  bookingPersistenceApiExecutionPolicy,
  bookingPersistenceApiImplementedControls,
  bookingPersistenceApiRemainingRuntimeEvidence,
  bookingPersistenceApiRequiredExternalEvidence,
  bookingPersistenceApiExternalCommands,
  bookingPersistenceApiLocalCommands,
  bookingPersistenceApiRuntimeCommands,
  bookingPersistenceApiRuntimeMatrix,
  bookingPersistenceApiRuntimeProofFiles,
  bookingPersistenceApiRunPersistenceContract,
} from "../lib/bookingPersistenceApiRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking persistence API runtime contract", () => {
  const route = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const helper = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts");
  const contractTest = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const validators = readRepoFile("packages/validators/src/booking.ts");
  const security = readRepoFile("packages/security/src/index.ts");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const bookingPersistenceApiRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035400_add_booking_persistence_api_runs/migration.sql");

  it("pins booking persistence API commands, matrix rows, and artifact paths", () => {
    expect(bookingPersistenceApiRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/web test -- booking-requests-contract",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm db:generate",
      "Next public booking API route runtime smoke",
      "dev-DB booking transaction smoke",
      "provider worker execution smoke for reference/deposit/notification/calendar handoffs",
      "GitHub Actions booking persistence API evidence job",
    ]);
    expect(bookingPersistenceApiRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "route-contract-tests",
      "web-typecheck-build",
      "prisma-client-and-db-transaction",
      "next-route-runtime-smoke",
      "provider-worker-execution-boundaries",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingPersistenceApiArtifactPaths).toContain("coverage/booking-persistence-api-runtime.json");
    expect(bookingPersistenceApiArtifactPaths).toContain("coverage/booking-persistence-db-transaction.json");
    expect(bookingPersistenceApiArtifactPaths).toContain("test-results/booking-persistence-api-runtime");
  });

  it("pins booking persistence API control helper identity", () => {
    const decision = buildBookingPersistenceApiEvidenceDecision({
      commands: bookingPersistenceApiRuntimeCommands,
      artifacts: bookingPersistenceApiArtifactPaths,
      controls: bookingPersistenceApiImplementedControls,
      evidence: Object.fromEntries(bookingPersistenceApiEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof bookingPersistenceApiEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(bookingPersistenceApiImplementedControls);
    expect(gapTracker).toContain("bookingPersistenceApiImplementedControls");
  });

  it("keeps implemented route controls visible in source", () => {
    expect(route).toContain("resolveTenantScope");
    expect(route).toContain("persistBookingRequestToDatabase");
    expect(route).toContain("prisma.$transaction");
    expect(route).toContain("evaluateBotProof");
    expect(route).toContain("ENCRYPTION_POLICY_DENIED");
    expect(route).toContain("BOOKING_PERSISTENCE_FAILED");
    expect(route).toContain("PROVIDER_BOOKING_PERSISTENCE_NOT_CONFIGURED");
    expect(route).toContain("Production booking submissions require database-backed persistence; local runtime fallback is disabled.");
    expect(route).toContain("localBookingRuntimeFallbackDisabled");
    expect(route).toContain("buildLocalResponse");
    expect(route).toContain("packagePostSubmitPlan");
    expect(helper).toContain("buildPostPersistWorkflowPlans");
    expect(localRuntime).toContain("persistBookingRequest");
    expect(localRuntime).toContain("executeBookingPostPersistWorkflowConsumers");
    expect(localRuntime).toContain("Local-contract rate limit passed.");
    expect(localRuntime).not.toContain("Local scaffolded rate limit passed.");
  });

  it("keeps schema, validator, security, and contract coverage attached", () => {
    for (const model of ["BookingRequest", "BookingStateEvent", "AuditLog"]) {
      expect(schema).toContain(`model ${model}`);
    }
    expect(validators).toContain("bookingRequestInputSchema");
    expect(security).toContain("evaluateEncryptionPolicy");
    expect(security).toContain("rateLimitRules");
    expect(contractTest).toContain("requires anti-bot proof only for database-scoped persistence");
    expect(contractTest).toContain("produces tenant-consistent reference-upload contracts for DB vs local workflows");
    expect(contractTest).toContain("executes post-persist workflow consumers with tenant-isolated records");
  });

  it("keeps remaining runtime evidence explicit without reopening the implemented route scaffold", () => {
    expect(bookingPersistenceApiImplementedControls).toEqual([
      "Resolve tenant scope before persistence and fall back only when the database is unavailable.",
      "Require DB-scope anti-bot proof before database writes.",
      "Gate medical-note persistence on encryption policy and key readiness.",
      "Write BookingRequest, BookingStateEvent, and AuditLog records through a transaction on the database path.",
      "Keep provider workers for reference upload, deposit, notification, and calendar handoffs separate from the route persistence contract.",
    ]);
    expect(bookingPersistenceApiRemainingRuntimeEvidence).toEqual([
      "fresh booking route contract test output",
      "generated Prisma Client and dev-DB transaction smoke output",
      "web typecheck/build output",
      "Next route runtime smoke transcript",
      "provider worker execution evidence tracked by GAP-033 and GAP-034",
      "CI artifact bundle with redaction/secret-safety proof",
    ]);
  });

  it("pins the BookingPersistenceApiRun persistence model and migration", () => {
    const runData = buildBookingPersistenceApiRunData({
      tenantId: "tenant_static",
      runId: "booking_persistence_api_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["pnpm --filter @inkroute/web test -- booking-requests-contract"],
      artifacts: ["coverage/booking-persistence-contract-test.txt"],
      routeContractEvidenceCaptured: true,
      webTypecheckBuildEvidenceCaptured: false,
      prismaGenerationEvidenceCaptured: false,
      databaseTransactionEvidenceCaptured: false,
      nextRouteSmokeEvidenceCaptured: false,
      providerBoundaryEvidenceCaptured: true,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      transactionSmokeReportPath: "coverage/booking-persistence-db-transaction.json",
      nextRouteSmokeReportPath: "coverage/booking-persistence-next-route-smoke.json",
    });

    expect(bookingPersistenceApiRunPersistenceContract).toEqual({
      prismaModel: "BookingPersistenceApiRun",
      tenantRelation: "bookingPersistenceApiRuns",
      migration: "20260609035400_add_booking_persistence_api_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesRouteContractEvidence: true,
      storesWebTypecheckBuildEvidence: true,
      storesPrismaGenerationEvidence: true,
      storesDatabaseTransactionEvidence: true,
      storesNextRouteSmokeEvidence: true,
      storesProviderBoundaryEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "booking_persistence_api_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["pnpm --filter @inkroute/web test -- booking-requests-contract"],
      artifactManifest: ["coverage/booking-persistence-contract-test.txt"],
      routeContractEvidenceCaptured: true,
      providerBoundaryEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      transactionSmokeReportPath: "coverage/booking-persistence-db-transaction.json",
      nextRouteSmokeReportPath: "coverage/booking-persistence-next-route-smoke.json",
    });
    expect(String(persistBookingPersistenceApiRun)).toContain("repository.bookingPersistenceApiRun.upsert");
    expect(prismaSchema).toContain("model BookingPersistenceApiRun");
    expect(prismaSchema).toContain("bookingPersistenceApiRuns BookingPersistenceApiRun[]");
    expect(prismaSchema).toContain("routeContractEvidenceCaptured");
    expect(prismaSchema).toContain("databaseTransactionEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(bookingPersistenceApiRunMigration).toContain('CREATE TABLE "BookingPersistenceApiRun"');
    expect(bookingPersistenceApiRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(bookingPersistenceApiRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(bookingPersistenceApiRunMigration).toContain('"BookingPersistenceApiRun_tenantId_runId_key"');
  });

  it("blocks booking persistence API completion when runtime, DB, provider, CI, or safe evidence is missing", () => {
    const decision = buildBookingPersistenceApiEvidenceDecision({
      commands: ["pnpm --filter @inkroute/web test -- booking-requests-contract"],
      artifacts: ["coverage/booking-persistence-contract-test.txt"],
      controls: ["Resolve tenant scope before persistence and fall back only when the database is unavailable."],
      evidence: {
        routeContractTestsPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("dev-DB booking transaction smoke");
    expect(decision.missingArtifacts).toContain("coverage/booking-persistence-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("Gate medical-note persistence on encryption policy and key readiness.");
    expect(decision.missingEvidence).toContain("prismaClientGenerated");
    expect(decision.missingEvidence).toContain("devDbTransactionSmokePassed");
    expect(decision.blockers).toContain("Generated Prisma Client evidence is required for DB-backed runtime.");
    expect(decision.blockers).toContain("Dev-DB booking transaction smoke must pass.");
  });

  it("completes booking persistence API readiness only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(bookingPersistenceApiEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildBookingPersistenceApiEvidenceDecision({
      commands: bookingPersistenceApiRuntimeCommands,
      artifacts: bookingPersistenceApiArtifactPaths,
      controls: bookingPersistenceApiImplementedControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(bookingPersistenceApiEvidenceFlags);
  });

  it("separates static booking persistence review from runtime execution and redacts private artifacts", () => {
    const executionPlan = buildBookingPersistenceApiExecutionPlan();
    const artifactReview = buildBookingPersistenceApiArtifactReview({
      tenantDomain: "tenant.example.com",
      prismaConnectionString: "prisma://accelerate.example.com/?api_key=sk_private",
      clientEmail: "client@example.com",
      medicalNotes: "medical: placement sensitivity",
      nested: {
        auditLogPayload: "raw private audit payload",
        publicSummary: "booking persistence API evidence captured",
      },
    });
    const directRedaction = buildRedactedBookingPersistenceApiArtifact({
      publicSummary: "safe booking persistence evidence",
      botProofToken: "bot_private",
    });

    expect(executionPlan.localCommands).toBe(bookingPersistenceApiLocalCommands);
    expect(executionPlan.externalCommands).toBe(bookingPersistenceApiExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.prismaGenerateExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.nextRuntimeExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(bookingPersistenceApiExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticRouteReadiness: true,
      generatedPrismaClientRequiredForClosure: true,
      databaseTransactionSmokeRequiredForClosure: true,
      nextRouteRuntimeSmokeRequiredForClosure: true,
      providerWorkerEvidenceTrackedSeparately: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(bookingPersistenceApiRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("dev-DB booking transaction smoke output");
    expect(executionPlan.requiredExternalEvidence).toContain("Next public booking API route runtime smoke transcript");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe booking persistence API artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(bookingPersistenceApiRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "prismaConnectionString",
      "clientEmail",
      "medicalNotes",
      "nested.auditLogPayload",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("prisma://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("medical:");
    expect(JSON.stringify(artifactReview.artifact)).toContain("booking persistence API evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["botProofToken"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe booking persistence evidence");
  });

  it("wires CI, manifest, tracker, and artifacts for GAP-032", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking persistence API runtime contracts");
    expect(ciWorkflow).toContain("booking-persistence-api-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-persistence-api-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-persistence-api-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-persistence-api-runtime-static");
    expect(unitManifest).toContain("BookingPersistenceApiRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/bookingPersistenceApiRuntime.ts");
    expect(gapTracker).toContain("persistBookingPersistenceApiRun upsert seam");
    expect(gapTracker).toContain("buildBookingPersistenceApiExecutionPlan");
    expect(gapTracker).toContain("buildRedactedBookingPersistenceApiArtifact");
    expect(gapTracker).toContain("buildBookingPersistenceApiArtifactReview");
    expect(gapTracker).toContain("bookingPersistenceApiExecutionPolicy");
    expect(gapTracker).toContain("bookingPersistenceApiRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-032 is booking-persistence-api-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live generated Prisma Client, provider-backed persistBookingPersistenceApiRun execution, dev-DB transaction smoke, web typecheck/build, Next route runtime smoke, fresh CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current booking persistence API proof files for GAP-032", () => {
    expect(bookingPersistenceApiRuntimeProofFiles).toContain("apps/web/lib/bookingPersistenceApiRuntime.ts");
    expect(bookingPersistenceApiRuntimeProofFiles).toContain("apps/web/package.json");
    expect(bookingPersistenceApiRuntimeProofFiles).toContain("apps/web/tests/booking-persistence-api-runtime-static.test.ts");
    for (const proofFile of bookingPersistenceApiRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});

