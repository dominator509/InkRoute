import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBookingProviderHandoffArtifactReview,
  buildBookingProviderHandoffEvidenceDecision,
  buildBookingProviderHandoffExecutionPlan,
  buildRedactedBookingProviderHandoffArtifact,
  bookingProviderHandoffArtifactPaths,
  bookingProviderHandoffEvidenceFlags,
  bookingProviderHandoffExternalCommands,
  bookingProviderHandoffExecutionPolicy,
  bookingProviderHandoffLocalCommands,
  bookingProviderHandoffReadinessAreas,
  bookingProviderHandoffRequiredExternalEvidence,
  bookingProviderHandoffRuntimeCommands,
  bookingProviderHandoffRuntimeMatrix,
  bookingProviderHandoffRuntimeProofFiles,
  bookingProviderHandoffRuntimeReadiness,
  bookingProviderHandoffRuntimeRequiredControls,
} from "../lib/bookingProviderHandoffRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("booking provider handoff runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const bookingRoute = readRepoFile("apps/web/app/api/public/[tenantSlug]/booking-requests/route.ts");
  const bookingRouteContracts = readRepoFile("apps/web/tests/booking-requests-contract.test.ts");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");

  it("pins GAP-034 commands, readiness areas, matrix rows, and artifacts", () => {
    expect(bookingProviderHandoffRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments test",
      "pnpm --filter @inkroute/notifications test",
      "pnpm --filter @inkroute/calendar test",
      "Stripe CLI deposit session sandbox test",
      "email/SMS/push notification sandbox delivery tests",
      "Google Calendar tentative hold sandbox test",
      "persisted provider worker execution tests",
      "provider rollback/retry integration tests",
      "GitHub Actions provider handoff evidence job",
    ]);
    expect(bookingProviderHandoffReadinessAreas).toContain("accepted-booking-gate");
    expect(bookingProviderHandoffReadinessAreas).toContain("provider-idempotency");
    expect(bookingProviderHandoffReadinessAreas).toContain("secret-safe-artifacts");
    expect(bookingProviderHandoffRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-typecheck",
      "booking-tests",
      "provider-package-tests",
      "booking-route-provider-handoff-plan",
      "persisted-worker-queue",
      "reference-upload-worker",
      "stripe-deposit-sandbox",
      "notification-sandbox",
      "calendar-sandbox",
      "audit-retry-rollback-operator-review",
      "provider-idempotency",
      "ci-secret-safe-evidence",
    ]);
    expect(bookingProviderHandoffArtifactPaths).toContain("coverage/booking-provider-handoff-runtime.json");
    expect(bookingProviderHandoffArtifactPaths).toContain("test-results/booking-provider-handoff-runtime");
  });

  it("keeps booking helper, package tests, route workflow plan, and route contract tests wired", () => {
    expect(bookingPackageJson).toContain('"typecheck"');
    expect(bookingPackageJson).toContain('"test"');
    expect(bookingSource).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingTests).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("buildBookingProviderHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("providerHandoffRuntimeEvidencePlan");
    expect(bookingRoute).toContain("executeBookingPostPersistWorkflowConsumers");
    expect(bookingRouteContracts).toContain("executes post-persist workflow consumers with tenant-isolated records");
  });

  it("keeps provider handoff blockers explicit until sandbox, worker, rollback, CI, and artifact proof exists", () => {
    expect(bookingProviderHandoffRuntimeReadiness.status).toBe("blocked");
    expect(bookingProviderHandoffRuntimeReadiness.missingScripts).toEqual([]);
    expect(bookingProviderHandoffRuntimeReadiness.requiredCommands).toBe(bookingProviderHandoffRuntimeCommands);
    expect(bookingProviderHandoffRuntimeReadiness.requiredControls).toBe(bookingProviderHandoffRuntimeRequiredControls);
    expect(bookingProviderHandoffRuntimeReadiness.requiredEvidence).toBe(bookingProviderHandoffEvidenceFlags);
    expect(bookingProviderHandoffRuntimeReadiness.blockers).toContain(
      "Stripe deposit session sandbox test must pass without live-payment mode.",
    );
    expect(bookingProviderHandoffRuntimeReadiness.blockers).toContain(
      "Provider handoffs must enforce idempotency across retries, worker restarts, and webhook replays.",
    );
    expect(bookingProviderHandoffRuntimeReadiness.blockers).not.toContain("Retry policy must be verified for retryable provider failures.");
    expect(bookingProviderHandoffRuntimeReadiness.blockers).not.toContain("Provider rollback paths must be verified.");
    expect(bookingProviderHandoffRuntimeReadiness.blockers).not.toContain("Operator review queue must be configured for provider failures.");
  });

  it("blocks provider handoff completion when sandbox, worker, rollback, idempotency, CI, or safe evidence is missing", () => {
    const decision = buildBookingProviderHandoffEvidenceDecision({
      commands: ["pnpm --filter @inkroute/booking typecheck"],
      artifacts: ["coverage/booking-provider-handoff-booking-typecheck.txt"],
      readinessAreas: ["accepted-booking-gate"],
      evidence: {
        bookingTypecheckPassed: true,
        acceptedBookingGateEnforced: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("Stripe CLI deposit session sandbox test");
    expect(decision.missingArtifacts).toContain("coverage/booking-provider-handoff-secret-safe-artifacts.json");
    expect(decision.missingReadinessAreas).toContain("stripe-deposit-sandbox-session");
    expect(decision.missingEvidence).toContain("stripeDepositSessionSandboxPassed");
    expect(decision.missingEvidence).toContain("providerIdempotencyConfigured");
    expect(decision.blockers).toContain("Stripe deposit session sandbox test must pass without live-payment mode.");
    expect(decision.blockers).toContain(
      "Provider handoffs must enforce idempotency across retries, worker restarts, and webhook replays.",
    );
  });

  it("completes provider handoff readiness only when every command, artifact, readiness area, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(bookingProviderHandoffEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildBookingProviderHandoffEvidenceDecision({
      commands: bookingProviderHandoffRuntimeCommands,
      artifacts: bookingProviderHandoffArtifactPaths,
      readinessAreas: bookingProviderHandoffReadinessAreas,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingReadinessAreas).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(bookingProviderHandoffEvidenceFlags);
  });

  it("separates static provider handoff review from provider execution and redacts private artifacts", () => {
    const executionPlan = buildBookingProviderHandoffExecutionPlan();
    const artifactReview = buildBookingProviderHandoffArtifactReview({
      tenantDomain: "tenant.example.com",
      stripePaymentIntent: "stripe_pi_private",
      clientEmail: "client@example.com",
      notificationProviderToken: "provider-token-private",
      nested: {
        webhookSecret: "webhook_secret_private",
        publicSummary: "booking provider handoff evidence captured",
      },
    });
    const directRedaction = buildRedactedBookingProviderHandoffArtifact({
      publicSummary: "safe provider handoff evidence",
      rollbackAuditPayload: "private rollback payload",
    });

    expect(executionPlan.localCommands).toBe(bookingProviderHandoffLocalCommands);
    expect(executionPlan.externalCommands).toBe(bookingProviderHandoffExternalCommands);
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.providerExecutionAllowed).toBe(false);
    expect(executionPlan.paymentExecutionAllowed).toBe(false);
    expect(executionPlan.notificationExecutionAllowed).toBe(false);
    expect(executionPlan.calendarExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(bookingProviderHandoffExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticProviderHandoffReadiness: true,
      acceptedBookingGateRequiredForClosure: true,
      persistedWorkerExecutionRequiredForClosure: true,
      providerSandboxEvidenceRequiredForClosure: true,
      rollbackRetryIdempotencyRequiredForClosure: true,
      operatorReviewRequiredForProviderFailures: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(bookingProviderHandoffRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain("Stripe deposit session sandbox transcript");
    expect(executionPlan.requiredExternalEvidence).toContain("provider idempotency replay and worker restart evidence");
    expect(executionPlan.requiredExternalEvidence).toContain("secret-safe booking provider handoff artifact review");
    expect(artifactReview.requiredExternalEvidence).toBe(bookingProviderHandoffRequiredExternalEvidence);
    expect(artifactReview.redactions).toEqual([
      "tenantDomain",
      "stripePaymentIntent",
      "clientEmail",
      "notificationProviderToken",
      "nested.webhookSecret",
    ]);
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("tenant.example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("stripe_pi_private");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("client@example.com");
    expect(JSON.stringify(artifactReview.artifact)).not.toContain("provider-token");
    expect(JSON.stringify(artifactReview.artifact)).toContain("booking provider handoff evidence captured");
    expect(artifactReview.secretSafe).toBe(true);
    expect(directRedaction.redactions).toEqual(["rollbackAuditPayload"]);
    expect(JSON.stringify(directRedaction.artifact)).toContain("safe provider handoff evidence");
  });

  it("wires CI, manifest, tracker, and artifacts without claiming provider readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 4 booking provider handoff runtime contracts");
    expect(ciWorkflow).toContain("booking-provider-handoff-runtime-static.test.ts");
    expect(ciWorkflow).toContain("booking-provider-handoff-runtime-artifacts");
    expect(unitManifest).toContain("unit-web-booking-provider-handoff-runtime-static");
    expect(gapTracker).toContain("apps/web/lib/bookingProviderHandoffRuntime.ts");
    expect(gapTracker).toContain("buildBookingProviderHandoffExecutionPlan");
    expect(gapTracker).toContain("buildRedactedBookingProviderHandoffArtifact");
    expect(gapTracker).toContain("buildBookingProviderHandoffArtifactReview");
    expect(gapTracker).toContain("bookingProviderHandoffExecutionPolicy");
    expect(gapTracker).toContain("bookingProviderHandoffRequiredExternalEvidence");
    expect(gapTracker).toContain("GAP-034 is booking-provider-handoff-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("GAP-034 is route-wired with provider handoff runtime evidence");
    expect(gapTracker).toContain("proof inventory");
    expect(bookingProviderHandoffArtifactPaths).toContain("coverage/booking-provider-handoff-secret-safe-artifacts.json");
  });

  it("pins current booking provider handoff proof files for GAP-034", () => {
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/booking/package.json");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/payments/package.json");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/notifications/package.json");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/calendar/package.json");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/calendar/src/index.ts");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/notifications/src/index.ts");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("packages/payments/src/index.ts");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("apps/web/lib/bookingProviderHandoffRuntime.ts");
    expect(bookingProviderHandoffRuntimeProofFiles).toContain("apps/web/tests/booking-provider-handoff-runtime-static.test.ts");
    for (const proofFile of bookingProviderHandoffRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


