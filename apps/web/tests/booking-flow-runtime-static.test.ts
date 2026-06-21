import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBookingFlowRuntimeArtifactReview,
  buildBookingFlowRuntimeEvidenceDecision,
  buildBookingFlowRuntimeExecutionPlan,
  buildBookingFlowRuntimeRunData,
  buildRedactedBookingFlowRuntimeArtifact,
  persistBookingFlowRuntimeRun,
  bookingFlowRuntimeArtifactPaths,
  bookingFlowRuntimeCommands,
  bookingFlowRuntimeControls,
  bookingFlowRuntimeEvidenceFlags,
  bookingFlowRuntimeExternalCommands,
  bookingFlowRuntimeExecutionPolicy,
  bookingFlowRuntimeLocalCommands,
  bookingFlowRuntimeMatrix,
  bookingFlowRuntimeProofFiles,
  bookingFlowRuntimeReadiness,
  bookingFlowRuntimeRequiredExternalEvidence,
  bookingFlowRuntimeRunPersistenceContract,
} from "../lib/bookingFlowRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking flow runtime evidence contract", () => {
  const webPackageJson = readRepoFile("apps/web/package.json");
  const bookingPage = readRepoFile("apps/web/app/booking/page.tsx");
  const bookingClient = readRepoFile("apps/web/app/booking/BookingFlowClient.tsx");
  const confirmationPage = readRepoFile("apps/web/app/booking/confirmation/page.tsx");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const helper = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/test-helpers.ts");
  const contractTest = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const bookingFlowRuntimeRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035300_add_booking_flow_runtime_runs/migration.sql");

  it("pins booking flow runtime commands, matrix rows, and artifact paths", () => {
    expect(bookingFlowRuntimeCommands).toEqual([
      "pnpm install",
      "pnpm db:generate",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "pnpm --filter @inkroute/web test -- booking-requests-contract",
      "Playwright booking page smoke for /booking",
      "Playwright booking confirmation smoke for /booking/confirmation",
      "Next public booking API route runtime smoke",
      "dev-DB booking transaction smoke",
    ]);
    expect(bookingFlowRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "install-and-prisma-client",
      "web-typecheck-build-boundaries",
      "booking-route-contract-and-next-smoke",
      "booking-and-confirmation-browser-smoke",
      "local-fallback-db-provider-boundaries",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingFlowRuntimeArtifactPaths).toContain("coverage/booking-flow-runtime.json");
    expect(bookingFlowRuntimeArtifactPaths).toContain("coverage/booking-flow-db-transaction-smoke.json");
    expect(bookingFlowRuntimeArtifactPaths).toContain("test-results/booking-flow-runtime");
  });

  it("pins booking flow runtime control helper identity", () => {
    const decision = buildBookingFlowRuntimeEvidenceDecision({
      commands: bookingFlowRuntimeCommands,
      artifacts: bookingFlowRuntimeArtifactPaths,
      controls: bookingFlowRuntimeControls,
      evidence: Object.fromEntries(bookingFlowRuntimeEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof bookingFlowRuntimeEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(bookingFlowRuntimeControls);
    expect(gapTracker).toContain("bookingFlowRuntimeControls");
  });

  it("keeps scripts, booking UI, route contracts, local fallback, and helper gates visible", () => {
    for (const scriptName of ["typecheck", "build", "test"]) {
      expect(webPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingPage).toContain("BookingFlowClient");
    expect(bookingClient).toContain("Generate confirmation preview");
    expect(bookingClient).toContain("Submit booking request");
    expect(bookingClient).toContain("/api/public/");
    expect(bookingClient).toContain("/booking-requests");
    expect(bookingClient).toContain("Reference images, local metadata");
    expect(bookingClient).not.toContain("Reference images, local preview only");
    expect(bookingClient).toContain("secure-upload intent route and local validation controls are wired");
    expect(bookingClient).not.toContain("Phase 5/API work must replace this");
    expect(bookingClient).toContain("Provider handoffs remain evidence-gated");
    expect(bookingClient).toContain("Sensitive notes are encrypted for persisted DB writes and redacted in local fallback");
    expect(bookingClient).not.toContain("after persistence is implemented");
    expect(confirmationPage).toContain("Provider boundaries");
    expect(confirmationPage).toContain("booking request identifier");
    expect(confirmationPage).toContain("local fallback and provider follow-up evidence remain runtime-gated");
    expect(confirmationPage).toContain("Policy engine and deposit-session boundaries are wired");
    expect(confirmationPage).toContain("Provider calendar execution remains evidence-gated");
    expect(confirmationPage).not.toContain("conflict checks are implemented");
    expect(confirmationPage).not.toContain("no request ID exists because there is no database write");
    expect(confirmationPage).not.toContain("Policy engine scaffold exists");
    expect(bookingRoute).toContain("buildBookingPostSubmitPlan");
    expect(bookingRoute).toContain("evaluateEncryptionPolicy");
    expect(bookingRoute).toContain("Local runtime should persist intent contract");
    expect(bookingRoute).toContain('contract: "notification-queue-local-contract"');
    expect(bookingRoute).toContain('contract: "deposit-policy-evaluation-local-contract"');
    expect(bookingRoute).toContain('contract: "calendar-hold-local-contract"');
    expect(bookingRoute).toContain("workflow local contracts recorded");
    expect(bookingRoute).not.toContain("persist intent stub");
    expect(bookingRoute).not.toContain("workflow stubs recorded");
    expect(helper).toContain("buildBookingFlowRuntimeEvidencePlan");
    expect(helper).toContain("bookingFlowRuntimeRequiredCommands");
    expect(helper).toContain("bookingFlowRuntimeRequiredControls");
    expect(helper).toContain("bookingFlowRuntimeRequiredEvidence");
    expect(helper).toContain("Local runtime should persist intent contract");
    expect(helper).toContain('contract: "notification-queue-local-contract"');
    expect(helper).toContain('contract: "deposit-policy-evaluation-local-contract"');
    expect(helper).toContain('contract: "calendar-hold-local-contract"');
    expect(helper).not.toContain("persist intent stub");
    expect(helper).toContain("Next public booking API route runtime smoke");
    expect(contractTest).toContain("requires anti-bot proof only for database-scoped persistence");
    expect(contractTest).toContain("executes post-persist workflow consumers with tenant-isolated records");
    expect(localRuntime).toContain("executeBookingPostPersistWorkflowConsumers");
  });

  it("keeps booking flow runtime blocked until install, Prisma, Next, browser, DB, CI, and artifact proof execute", () => {
    expect(bookingFlowRuntimeReadiness.status).toBe("blocked");
    expect(bookingFlowRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingFlowRuntimeReadiness.requiredCommands).toBe(bookingFlowRuntimeCommands);
    expect(bookingFlowRuntimeReadiness.requiredControls).toBe(bookingFlowRuntimeControls);
    expect(bookingFlowRuntimeReadiness.requiredEvidence).toBe(bookingFlowRuntimeEvidenceFlags);
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Workspace dependencies must be installed with a committed lockfile before booking runtime evidence can close.");
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.");
    expect(bookingFlowRuntimeReadiness.blockers).toContain("Booking runtime artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("pins the BookingFlowRuntimeRun persistence model and migration", () => {
    const runData = buildBookingFlowRuntimeRunData({
      tenantId: "tenant_static",
      runId: "booking_flow_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["Next public booking API route runtime smoke"],
      artifacts: ["coverage/booking-flow-next-route-smoke.json"],
      dependencyInstallEvidenceCaptured: false,
      prismaGenerationEvidenceCaptured: false,
      webTypecheckBuildEvidenceCaptured: false,
      routeRuntimeSmokeEvidenceCaptured: false,
      browserSmokeEvidenceCaptured: false,
      databaseSmokeEvidenceCaptured: false,
      providerBoundaryEvidenceCaptured: true,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      routeSmokeReportPath: "coverage/booking-flow-next-route-smoke.json",
      browserSmokeReportPath: "test-results/booking-flow-runtime",
    });

    expect(bookingFlowRuntimeRunPersistenceContract).toEqual({
      prismaModel: "BookingFlowRuntimeRun",
      tenantRelation: "bookingFlowRuntimeRuns",
      migration: "20260609035300_add_booking_flow_runtime_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDependencyInstallEvidence: true,
      storesPrismaGenerationEvidence: true,
      storesWebTypecheckBuildEvidence: true,
      storesRouteRuntimeSmokeEvidence: true,
      storesBrowserSmokeEvidence: true,
      storesDatabaseSmokeEvidence: true,
      storesProviderBoundaryEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "booking_flow_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["Next public booking API route runtime smoke"],
      artifactManifest: ["coverage/booking-flow-next-route-smoke.json"],
      dependencyInstallEvidenceCaptured: false,
      providerBoundaryEvidenceCaptured: true,
      secretSafeArtifactsCaptured: true,
      routeSmokeReportPath: "coverage/booking-flow-next-route-smoke.json",
      browserSmokeReportPath: "test-results/booking-flow-runtime",
    });
    expect(String(persistBookingFlowRuntimeRun)).toContain("repository.bookingFlowRuntimeRun.upsert");
    expect(prismaSchema).toContain("model BookingFlowRuntimeRun");
    expect(prismaSchema).toContain("bookingFlowRuntimeRuns BookingFlowRuntimeRun[]");
    expect(prismaSchema).toContain("dependencyInstallEvidenceCaptured");
    expect(prismaSchema).toContain("databaseSmokeEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(bookingFlowRuntimeRunMigration).toContain('CREATE TABLE "BookingFlowRuntimeRun"');
    expect(bookingFlowRuntimeRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(bookingFlowRuntimeRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(bookingFlowRuntimeRunMigration).toContain('"BookingFlowRuntimeRun_tenantId_runId_key"');
  });

  it("blocks booking flow runtime completion when install, Prisma, Next, browser, DB, CI, or safe evidence is missing", () => {
    const decision = buildBookingFlowRuntimeEvidenceDecision({
      commands: ["pnpm install"],
      artifacts: ["coverage/booking-flow-install.txt"],
      controls: ["verify-booking-confirmation-pages-in-real-next-runtime"],
      evidence: {
        dependenciesInstalled: true,
        bookingRouteContractTestsPassed: true,
        localRuntimeFallbackVerified: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("pnpm --filter @inkroute/web build");
    expect(decision.missingArtifacts).toContain("coverage/booking-flow-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("exercise-public-booking-api-route-with-db-and-local-runtime-scopes");
    expect(decision.missingEvidence).toContain("prismaClientGenerated");
    expect(decision.missingEvidence).toContain("bookingPageBrowserSmokePassed");
    expect(decision.blockers).toContain("Generated Prisma Client must exist before DB-backed booking runtime proof.");
    expect(decision.blockers).toContain(
      "Browser smoke must prove /booking loads, validates input, and submits without client/server component errors.",
    );
  });

  it("completes booking flow runtime only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(bookingFlowRuntimeEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildBookingFlowRuntimeEvidenceDecision({
      commands: bookingFlowRuntimeCommands,
      artifacts: bookingFlowRuntimeArtifactPaths,
      controls: bookingFlowRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(bookingFlowRuntimeEvidenceFlags);
  });

  it("separates static booking flow review from runtime execution and redacts private artifacts", () => {
    const executionPlan = buildBookingFlowRuntimeExecutionPlan();
    const artifactReview = buildBookingFlowRuntimeArtifactReview({
      tenantDomain: "tenant.example.com",
      prismaConnectionString: "prisma://accelerate.example.com/?api_key=sk_private",
      clientEmail: "client@example.com",
      medicalNotes: "medical: placement sensitivity",
      nested: {
        privateFileUrl: "https://files.example.com/private-file/reference.png",
        publicSummary: "booking flow runtime evidence captured",
      },
    });
    const directRedaction = buildRedactedBookingFlowRuntimeArtifact({
      publicSummary: "safe booking flow evidence",
      bookingSessionCookie: "session_private",
    });

    expect(executionPlan.localCommands).toBe(bookingFlowRuntimeLocalCommands);
    expect(executionPlan.externalCommands).toBe(bookingFlowRuntimeExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.dependencyInstallExecutionAllowed).toBe(false);
    expect(executionPlan.prismaGenerateExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.nextRuntimeExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(bookingFlowRuntimeExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticBookingFlowReadiness: true,
      dependencyInstallRequiredForClosure: true,
      generatedPrismaClientRequiredForClosure: true,
      nextRuntimeSmokeRequiredForClosure: true,
      browserSmokeRequiredForClosure: true,
      databaseTransactionSmokeRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(bookingFlowRuntimeRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("pnpm install output with committed lockfile");
    expect(executionPlan.requiredExternalEvidence).toContain("Playwright /booking/confirmation browser smoke");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe booking flow artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(bookingFlowRuntimeRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "prismaConnectionString",
      "clientEmail",
      "medicalNotes",
      "nested.privateFileUrl",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("prisma://");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("medical:");
    expect(JSON.stringify(artifactReview.artifact)).toContain("booking flow runtime evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["bookingSessionCookie"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe booking flow evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming runtime evidence is complete", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking flow runtime contracts");
    expect(ciWorkflow).toContain("booking-flow-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-flow-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-flow-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-flow-runtime-static");
    expect(unitManifest).toContain("BookingFlowRuntimeRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/bookingFlowRuntime.ts");
    expect(gapTracker).toContain("persistBookingFlowRuntimeRun upsert seam");
    expect(gapTracker).toContain("buildBookingFlowRuntimeExecutionPlan");
    expect(gapTracker).toContain("buildRedactedBookingFlowRuntimeArtifact");
    expect(gapTracker).toContain("buildBookingFlowRuntimeArtifactReview");
    expect(gapTracker).toContain("bookingFlowRuntimeExecutionPolicy");
    expect(gapTracker).toContain("bookingFlowRuntimeRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-031 is booking-flow-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live dependency install, Prisma Client generation, provider-backed persistBookingFlowRuntimeRun execution, web typecheck/build, Next route runtime smoke, browser smoke, dev-DB transaction smoke, CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current booking flow proof files for GAP-031", () => {
    expect(bookingFlowRuntimeProofFiles).toContain("apps/web/package.json");
    expect(bookingFlowRuntimeProofFiles).toContain("apps/web/lib/bookingFlowRuntime.ts");
    expect(bookingFlowRuntimeProofFiles).toContain("apps/web/tests/booking-flow-runtime-static.test.ts");
    for (const proofFile of bookingFlowRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


