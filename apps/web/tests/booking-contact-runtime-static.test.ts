import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBookingContactArtifactReview,
  buildBookingContactEvidenceDecision,
  buildBookingContactExecutionPlan,
  buildBookingContactRunData,
  buildRedactedBookingContactArtifact,
  persistBookingContactRun,
  bookingContactArtifactPaths,
  bookingContactEvidenceFlags,
  bookingContactExternalCommands,
  bookingContactExecutionPolicy,
  bookingContactLocalCommands,
  bookingContactRequiredExternalEvidence,
  bookingContactRuntimeCommands,
  bookingContactRuntimeControls,
  bookingContactRuntimeMatrix,
  bookingContactRuntimeProofFiles,
  bookingContactRuntimeReadiness,
  bookingContactRunPersistenceContract,
} from "../lib/bookingContactRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking/contact runtime evidence contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const contactRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/contact/route.ts");
  const contactPage = readRepoFile("apps/web/app/contact/page.tsx");
  const localRuntime = readRepoFile("apps/web/lib/localRuntimeState.ts");
  const confirmationPage = readRepoFile("apps/web/app/booking/confirmation/page.tsx");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const bookingContactRunMigration = readRepoFile("packages/db/prisma/migrations/20260609035100_add_booking_contact_runs/migration.sql");

  it("pins booking/contact commands, matrix rows, and artifact paths", () => {
    expect(bookingContactRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/web typecheck",
      "pnpm --filter @inkroute/web build",
      "booking/contact API E2E tests",
      "booking/contact browser E2E tests",
      "provider sandbox handoff boundary tests",
      "GitHub Actions booking/contact runtime evidence job",
    ]);
    expect(bookingContactRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-and-web-package-gates",
      "public-route-post-submit-plan",
      "contact-form-db-first-persistence",
      "provider-gated-handoff-boundaries",
      "api-and-browser-e2e",
      "ci-secret-safe-artifacts",
    ]);
    expect(bookingContactArtifactPaths).toContain("coverage/booking-contact-runtime.json");
    expect(bookingContactArtifactPaths).toContain("coverage/booking-contact-contact-persistence.json");
    expect(bookingContactArtifactPaths).toContain("test-results/booking-contact-runtime");
  });

  it("pins booking/contact runtime control helper identity", () => {
    const decision = buildBookingContactEvidenceDecision({
      commands: bookingContactRuntimeCommands,
      artifacts: bookingContactArtifactPaths,
      controls: bookingContactRuntimeControls,
      evidence: Object.fromEntries(bookingContactEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof bookingContactEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(bookingContactRuntimeControls);
    expect(gapTracker).toContain("bookingContactRuntimeControls");
  });

  it("keeps booking route plan, confirmation boundaries, and contact persistence wiring visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(bookingPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingSource).toContain("buildBookingContactRuntimeEvidencePlan");
    expect(bookingSource).toContain("buildBookingPostSubmitPlan");
    expect(bookingTests).toContain("blocks booking/contact runtime evidence until route, UI, persistence, provider, E2E, CI, and artifact proof exist");
    expect(bookingRoute).toContain("buildBookingPostSubmitPlan");
    expect(bookingRoute).toContain("packagePostSubmitPlan");
    expect(confirmationPage).toContain("loadConfirmationState");
    expect(confirmationPage).toContain("loadDatabaseConfirmationState");
    expect(confirmationPage).toContain("loadLocalConfirmationState");
    expect(confirmationPage).toContain("tenantSlug");
    expect(confirmationPage).toContain("bookingRequestId");
    expect(confirmationPage).toContain("getBookingPostPersistWorkflows");
    expect(confirmationPage).toContain("getBookingPostPersistWorkflowConsumers");
    expect(confirmationPage).toContain("Confirmation state was read from tenant-scoped database records");
    expect(confirmationPage).toContain("production local fallback remains disabled");
    expect(confirmationPage).toContain("Persisted workflow state");
    expect(confirmationPage).toContain("Provider boundaries");
    expect(confirmationPage).toContain("booking request identifier");
    expect(confirmationPage).toContain("provider follow-up evidence remain runtime-gated");
    expect(confirmationPage).not.toContain("This page is static");
    expect(confirmationPage).not.toContain("no request ID exists because there is no database write");
    expect(contactRoute).toContain("resolveContactTenant");
    expect(contactRoute).toContain("publicContactInputSchema.safeParse");
    expect(contactRoute).toContain("tx.client.upsert");
    expect(contactRoute).toContain("tx.messageThread.create");
    expect(contactRoute).toContain("tx.message.create");
    expect(contactRoute).toContain("tx.notification.create");
    expect(contactRoute).toContain("tx.notificationDelivery.create");
    expect(contactRoute).toContain("tx.notificationProviderHandoff.create");
    expect(contactRoute).toContain("tx.idempotencyKey.upsert");
    expect(contactRoute).toContain("tx.auditLog.create");
    expect(contactRoute).toContain("contact.public_intake");
    expect(contactRoute).toContain("persistContactSubmission");
    expect(contactRoute).toContain("PROVIDER_CONTACT_PERSISTENCE_NOT_CONFIGURED");
    expect(contactRoute).toContain("Contact submission could not be persisted to tenant-scoped database rows after validation.");
    expect(contactRoute).toContain('const noStoreHeaders = { "Cache-Control": "no-store" } as const');
    expect(contactRoute).toContain("headers: noStoreHeaders");
    expect(contactRoute).not.toContain('headers: { "Cache-Control": "no-store" }');
    expect(contactRoute).toContain("function rateLimitHeaders");
    expect(contactRoute).toContain("headers: rateLimitHeaders(rateLimit.retryAfterSeconds)");
    expect(contactRoute).toContain("provider_gated");
    expect(contactPage).toContain("/api/public/${inkrouteDemoTenant.slug}/contact");
    expect(localRuntime).toContain("LocalContactSubmissionRecord");
    expect(localRuntime).toContain("redactedSubmission");
  });

  it("keeps runtime evidence blocked until DB integration, tenant isolation, E2E, provider sandbox, CI, and safe artifacts exist", () => {
    expect(bookingContactRuntimeReadiness.status).toBe("blocked");
    expect(bookingContactRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingContactRuntimeReadiness.requiredCommands).toBe(bookingContactRuntimeCommands);
    expect(bookingContactRuntimeReadiness.requiredControls).toBe(bookingContactRuntimeControls);
    expect(bookingContactRuntimeReadiness.requiredEvidence).toBe(bookingContactEvidenceFlags);
    expect(bookingContactRuntimeReadiness.blockers).toContain("Database integration evidence must prove booking/contact persistence and transaction behavior.");
    expect(bookingContactRuntimeReadiness.blockers).toContain("Browser E2E must cover booking submission, confirmation state, contact submission, validation errors, and provider-gated handoffs.");
    expect(bookingContactRuntimeReadiness.blockers).toContain("Booking/contact artifacts must be redacted and free of secrets, raw medical notes, payment data, provider tokens, and private file URLs.");
  });

  it("pins the BookingContactRun persistence model and migration", () => {
    const runData = buildBookingContactRunData({
      tenantId: "tenant_static",
      runId: "booking_contact_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["booking/contact API E2E tests"],
      artifacts: ["coverage/booking-contact-api-e2e.json"],
      databasePersistenceEvidenceCaptured: false,
      tenantIsolationEvidenceCaptured: false,
      providerHandoffEvidenceCaptured: false,
      noLivePaymentEvidenceCaptured: true,
      apiE2eEvidenceCaptured: false,
      browserE2eEvidenceCaptured: false,
      webBuildEvidenceCaptured: false,
      ciEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      e2eReportPath: "coverage/booking-contact-api-e2e.json",
      providerBoundaryReportPath: "coverage/booking-contact-provider-boundaries.json",
    });

    expect(bookingContactRunPersistenceContract).toEqual({
      prismaModel: "BookingContactRun",
      tenantRelation: "bookingContactRuns",
      migration: "20260609035100_add_booking_contact_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesDatabasePersistenceEvidence: true,
      storesTenantIsolationEvidence: true,
      storesProviderHandoffEvidence: true,
      storesNoLivePaymentEvidence: true,
      storesApiE2eEvidence: true,
      storesBrowserE2eEvidence: true,
      storesWebBuildEvidence: true,
      storesCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "booking_contact_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["booking/contact API E2E tests"],
      artifactManifest: ["coverage/booking-contact-api-e2e.json"],
      databasePersistenceEvidenceCaptured: false,
      noLivePaymentEvidenceCaptured: true,
      apiE2eEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      e2eReportPath: "coverage/booking-contact-api-e2e.json",
      providerBoundaryReportPath: "coverage/booking-contact-provider-boundaries.json",
    });
    expect(String(persistBookingContactRun)).toContain("repository.bookingContactRun.upsert");
    expect(prismaSchema).toContain("model BookingContactRun");
    expect(prismaSchema).toContain("bookingContactRuns BookingContactRun[]");
    expect(prismaSchema).toContain("databasePersistenceEvidenceCaptured");
    expect(prismaSchema).toContain("browserE2eEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(bookingContactRunMigration).toContain('CREATE TABLE "BookingContactRun"');
    expect(bookingContactRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(bookingContactRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(bookingContactRunMigration).toContain('"BookingContactRun_tenantId_runId_key"');
  });

  it("blocks booking/contact completion when DB, tenant, provider, E2E, CI, or safe evidence is missing", () => {
    const decision = buildBookingContactEvidenceDecision({
      commands: ["pnpm --filter @inkroute/booking typecheck"],
      artifacts: ["coverage/booking-contact-booking-typecheck.txt"],
      controls: ["persist-booking-contact-before-provider-handoff-work"],
      evidence: {
        bookingTypecheckPassed: true,
        bookingRouteUsesPostSubmitPlan: true,
        noLivePaymentBoundaryPreserved: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("provider sandbox handoff boundary tests");
    expect(decision.missingArtifacts).toContain("coverage/booking-contact-ci-evidence.json");
    expect(decision.missingControls).toContain("preserve-no-live-payment-until-stripe-sandbox-and-copy-review");
    expect(decision.missingEvidence).toContain("databasePersistenceIntegrationPassed");
    expect(decision.missingEvidence).toContain("providerSandboxEvidenceCaptured");
    expect(decision.blockers).toContain(
      "Database integration evidence must prove booking/contact persistence and transaction behavior.",
    );
    expect(decision.blockers).toContain("Provider sandbox handoff boundary evidence must be captured.");
  });

  it("completes booking/contact readiness only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(bookingContactEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildBookingContactEvidenceDecision({
      commands: bookingContactRuntimeCommands,
      artifacts: bookingContactArtifactPaths,
      controls: bookingContactRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(bookingContactEvidenceFlags);
  });

  it("separates static booking/contact review from external execution and redacts private artifacts", () => {
    const executionPlan = buildBookingContactExecutionPlan();
    const artifactReview = buildBookingContactArtifactReview({
      tenantDomain: "tenant.example.com",
      clientEmail: "client@example.com",
      medicalNotes: "medical: sleeve restriction",
      stripePaymentIntent: "stripe_pi_private",
      providerToken: "provider-token-private",
      nested: {
        privateFileUrl: "https://files.example.com/private-file/reference.png",
        publicSummary: "booking contact evidence captured",
      },
    });
    const directRedaction = buildRedactedBookingContactArtifact({
      publicSummary: "safe booking contact evidence",
      contactPhone: "+15551234567",
    });

    expect(executionPlan.localCommands).toBe(bookingContactLocalCommands);
    expect(executionPlan.externalCommands).toBe(bookingContactExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.paymentExecutionAllowed).toBe(false);
    expect(executionPlan.browserExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(bookingContactExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticBookingContactReadiness: true,
      databaseTransactionsRequiredForClosure: true,
      tenantIsolationRequiredForClosure: true,
      providerSandboxEvidenceRequiredForClosure: true,
      noLivePaymentBoundaryRequiredUntilStripeSandboxProof: true,
      browserAndApiE2eRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(bookingContactRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("live DB transaction integration evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("provider sandbox upload, deposit, notification, and calendar handoff evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe booking/contact artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(bookingContactRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "clientEmail",
      "medicalNotes",
      "stripePaymentIntent",
      "providerToken",
      "nested.privateFileUrl",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("medical:");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("stripe_pi_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).toContain("booking contact evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["contactPhone"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe booking contact evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming booking/contact launch readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking contact runtime contracts");
    expect(ciWorkflow).toContain("booking-contact-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-contact-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/booking-contact-runtime.json");
    expect(unitManifest).toContain("unit-web-booking-contact-runtime-static");
    expect(unitManifest).toContain("BookingContactRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/bookingContactRuntime.ts");
    expect(gapTracker).toContain("persistBookingContactRun upsert seam");
    expect(gapTracker).toContain("buildBookingContactExecutionPlan");
    expect(gapTracker).toContain("buildRedactedBookingContactArtifact");
    expect(gapTracker).toContain("buildBookingContactArtifactReview");
    expect(gapTracker).toContain("bookingContactExecutionPolicy");
    expect(gapTracker).toContain("bookingContactRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-029 is booking-contact-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("confirmation page DB-first persisted workflow state resolver");
    expect(gapTracker).toContain("confirmation reads from tenant-scoped database records when tenantSlug and bookingRequestId are supplied");
    expect(gapTracker).toContain("live DB transaction integration, provider-backed persistBookingContactRun execution, tenant-isolation integration, browser/API E2E, provider sandbox handoff evidence, web typecheck/build, CI evidence, and secret-safe artifact review remain open");
    expect(gapTracker).toContain("proof inventory");
  });

  it("pins current booking contact proof files for GAP-029", () => {
    expect(bookingContactRuntimeProofFiles).toContain("packages/booking/package.json");
    expect(bookingContactRuntimeProofFiles).toContain("apps/web/package.json");
    expect(bookingContactRuntimeProofFiles).toContain("apps/web/lib/bookingContactRuntime.ts");
    expect(bookingContactRuntimeProofFiles).toContain("apps/web/tests/booking-contact-runtime-static.test.ts");
    for (const proofFile of bookingContactRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


