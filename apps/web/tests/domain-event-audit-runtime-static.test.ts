import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDomainEventAuditArtifactReview,
  buildDomainEventAuditEvidenceDecision,
  buildDomainEventAuditExecutionPlan,
  buildDomainEventAuditRunData,
  buildRedactedDomainEventAuditArtifact,
  executeDomainEventAuditLifecycleTransaction,
  persistDomainEventAuditRun,
  domainEventAuditArtifactPaths,
  domainEventAuditEvidenceFlags,
  domainEventAuditExternalArtifacts,
  domainEventAuditExternalCommands,
  domainEventAuditExecutionPolicy,
  domainEventAuditLocalArtifacts,
  domainEventAuditLocalCommands,
  domainEventAuditRequiredExternalEvidence,
  domainEventAuditRuntimeCommands,
  domainEventAuditRuntimeControls,
  domainEventAuditRuntimeMatrix,
  domainEventAuditRuntimeProofFiles,
  domainEventAuditRuntimeReadiness,
  domainEventAuditRunPersistenceContract,
} from "../lib/domainEventAuditRuntime";

const readRepoFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("domain event and audit transaction runtime contract", () => {
  const bookingPackageJson = readRepoFile("packages/booking/package.json");
  const paymentsPackageJson = readRepoFile("packages/payments/package.json");
  const bookingSource = readRepoFile("packages/booking/src/index.ts");
  const bookingTests = readRepoFile("packages/booking/tests/booking-readiness.test.ts");
  const paymentsSource = readRepoFile("packages/payments/src/index.ts");
  const paymentsTests = readRepoFile("packages/payments/tests/deposit-policy.test.ts");
  const schema = readRepoFile("packages/db/prisma/schema.prisma");
  const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
  const unitManifest = readRepoFile("testing/manifests/unit-test-manifest.json");
  const gapTracker = readRepoFile("GAP_TRACKER.md");
  const prismaSchema = readRepoFile("packages/db/prisma/schema.prisma");
  const domainEventAuditRunMigration = readRepoFile("packages/db/prisma/migrations/20260609034600_add_domain_event_audit_runs/migration.sql");

  it("pins domain event/audit commands, matrix rows, and artifact paths", () => {
    expect(domainEventAuditRuntimeCommands).toEqual([
      "pnpm --filter @inkroute/booking typecheck",
      "pnpm --filter @inkroute/booking test",
      "pnpm --filter @inkroute/payments typecheck",
      "pnpm --filter @inkroute/payments test",
      "booking/payment lifecycle Prisma transaction integration tests",
      "booking/payment idempotency replay integration tests",
      "provider failure rollback integration tests",
      "cross-tenant lifecycle mutation denial tests",
      "GitHub Actions domain event/audit transaction evidence job",
    ]);
    expect(domainEventAuditRuntimeMatrix.map((entry) => entry.id)).toEqual([
      "booking-payment-package-gates",
      "prisma-transaction-services",
      "tenant-scoped-repositories",
      "state-event-audit-persistence",
      "idempotency-and-replay",
      "provider-rollback-invalid-cross-tenant-denial",
      "database-ci-secret-safe-artifacts",
    ]);
    expect(domainEventAuditArtifactPaths).toContain("coverage/domain-event-audit-runtime.json");
    expect(domainEventAuditArtifactPaths).toContain("coverage/domain-event-secret-safe-artifacts.json");
    expect(domainEventAuditArtifactPaths).toContain("test-results/domain-event-audit-runtime");
  });

  it("pins domain event/audit runtime control helper identity", () => {
    const decision = buildDomainEventAuditEvidenceDecision({
      commands: domainEventAuditRuntimeCommands,
      artifacts: domainEventAuditArtifactPaths,
      controls: domainEventAuditRuntimeControls,
      evidence: Object.fromEntries(domainEventAuditEvidenceFlags.map((flag) => [flag, true])) as Record<
        (typeof domainEventAuditEvidenceFlags)[number],
        true
      >,
    });

    expect(decision.requiredControls).toBe(domainEventAuditRuntimeControls);
    expect(gapTracker).toContain("domainEventAuditRuntimeControls");
  });

  it("keeps booking/payment scripts, transaction helpers, payment plans, and DB models visible", () => {
    for (const scriptName of ["typecheck", "test"]) {
      expect(bookingPackageJson).toContain(`"${scriptName}"`);
      expect(paymentsPackageJson).toContain(`"${scriptName}"`);
    }
    expect(bookingSource).toContain("buildDomainEventAuditTransactionEvidencePlan");
    expect(bookingSource).toContain("createBookingTransitionPlan");
    expect(bookingSource).toContain("buildBookingProviderFailurePlan");
    expect(bookingTests).toContain("buildDomainEventAuditTransactionEvidencePlan");
    expect(paymentsSource).toContain("buildPaymentLifecyclePersistencePlan");
    expect(paymentsTests).toContain("buildPaymentLifecyclePersistencePlan");
    for (const model of ["BookingStateEvent", "AuditLog", "PaymentAuditLog", "Payment", "Deposit", "Refund"]) {
      expect(schema).toContain(`model ${model}`);
    }
  });

  it("keeps transaction evidence blocked until atomic writes, idempotency, denials, DB, CI, and safe artifacts exist", () => {
    expect(domainEventAuditRuntimeReadiness.status).toBe("blocked");
    expect(domainEventAuditRuntimeReadiness.missingScripts).toEqual([]);
    expect(domainEventAuditRuntimeReadiness.requiredCommands).toBe(domainEventAuditRuntimeCommands);
    expect(domainEventAuditRuntimeReadiness.requiredControls).toBe(domainEventAuditRuntimeControls);
    expect(domainEventAuditRuntimeReadiness.requiredEvidence).toBe(domainEventAuditEvidenceFlags);
    expect(domainEventAuditRuntimeReadiness.blockers).not.toContain(
      "Booking/payment lifecycle services must execute writes inside Prisma transactions.",
    );
    expect(domainEventAuditRuntimeReadiness.blockers).not.toContain("Tenant-scoped booking/payment repositories must be implemented.");
    expect(domainEventAuditRuntimeReadiness.blockers).toContain(
      "Replayed lifecycle mutations must return the original committed result without duplicate writes.",
    );
    expect(domainEventAuditRuntimeReadiness.blockers).toContain(
      "Domain event/audit artifacts must be redacted and free of secrets, tokens, raw PII, medical, and payment data.",
    );
  });

  it("pins the DomainEventAuditRun persistence model and migration", () => {
    const runData = buildDomainEventAuditRunData({
      tenantId: "tenant_static",
      runId: "domain_event_audit_static",
      commitSha: "abc123",
      status: "blocked",
      commands: ["booking/payment lifecycle Prisma transaction integration tests"],
      artifacts: ["coverage/domain-event-prisma-transactions-redacted.json"],
      transactionServiceEvidenceCaptured: true,
      repositoryEvidenceCaptured: false,
      atomicityEvidenceCaptured: false,
      eventAuditPersistenceEvidenceCaptured: false,
      idempotencyReplayEvidenceCaptured: false,
      rollbackEvidenceCaptured: false,
      denialEvidenceCaptured: false,
      databaseCiEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      transactionReportPath: "coverage/domain-event-prisma-transactions-redacted.json",
      idempotencyReportPath: "coverage/domain-event-idempotency-replay.json",
    });

    expect(domainEventAuditRunPersistenceContract).toEqual({
      prismaModel: "DomainEventAuditRun",
      tenantRelation: "domainEventAuditRuns",
      migration: "20260609034600_add_domain_event_audit_runs",
      storesRunId: true,
      storesCommitSha: true,
      storesReadinessStatus: true,
      storesCommandMatrix: true,
      storesArtifactManifest: true,
      storesTransactionServiceEvidence: true,
      storesRepositoryEvidence: true,
      storesAtomicityEvidence: true,
      storesEventAuditPersistenceEvidence: true,
      storesIdempotencyReplayEvidence: true,
      storesRollbackEvidence: true,
      storesDenialEvidence: true,
      storesDatabaseCiEvidence: true,
      storesSecretSafeArtifacts: true,
    });
    expect(runData).toMatchObject({
      tenantId: "tenant_static",
      runId: "domain_event_audit_static",
      commitSha: "abc123",
      status: "blocked",
      commandMatrix: ["booking/payment lifecycle Prisma transaction integration tests"],
      artifactManifest: ["coverage/domain-event-prisma-transactions-redacted.json"],
      transactionServiceEvidenceCaptured: true,
      repositoryEvidenceCaptured: false,
      idempotencyReplayEvidenceCaptured: false,
      rollbackEvidenceCaptured: false,
      secretSafeArtifactsCaptured: true,
      transactionReportPath: "coverage/domain-event-prisma-transactions-redacted.json",
      idempotencyReportPath: "coverage/domain-event-idempotency-replay.json",
    });
    expect(String(persistDomainEventAuditRun)).toContain("repository.domainEventAuditRun.upsert");
    expect(prismaSchema).toContain("model DomainEventAuditRun");
    expect(prismaSchema).toContain("domainEventAuditRuns DomainEventAuditRun[]");
    expect(prismaSchema).toContain("transactionServiceEvidenceCaptured");
    expect(prismaSchema).toContain("idempotencyReplayEvidenceCaptured");
    expect(prismaSchema).toContain("secretSafeArtifactsCaptured");
    expect(domainEventAuditRunMigration).toContain('CREATE TABLE "DomainEventAuditRun"');
    expect(domainEventAuditRunMigration).toContain('"commandMatrix" JSONB NOT NULL');
    expect(domainEventAuditRunMigration).toContain('"artifactManifest" JSONB NOT NULL');
    expect(domainEventAuditRunMigration).toContain('"DomainEventAuditRun_tenantId_runId_key"');
  });

  it("blocks domain event/audit completion when transaction, idempotency, rollback, denial, or safe evidence is missing", () => {
    const decision = buildDomainEventAuditEvidenceDecision({
      commands: ["pnpm --filter @inkroute/booking typecheck"],
      artifacts: ["coverage/domain-event-booking-typecheck.txt"],
      controls: ["commit-state-event-audit-payment-audit-idempotency-in-one-tenant-transaction"],
      evidence: {
        bookingTypecheckPassed: true,
      },
    });

    expect(decision.status).toBe("blocked");
    expect(decision.missingCommands).toContain("provider failure rollback integration tests");
    expect(decision.missingArtifacts).toContain("coverage/domain-event-secret-safe-artifacts.json");
    expect(decision.missingControls).toContain("return-original-result-for-idempotency-replay-without-duplicate-writes");
    expect(decision.missingEvidence).toContain("prismaTransactionServicesImplemented");
    expect(decision.missingEvidence).toContain("replayedMutationReturnsOriginalResult");
    expect(decision.blockers).toContain(
      "Booking/payment lifecycle services must execute writes inside Prisma transactions.",
    );
    expect(decision.blockers).toContain(
      "Replayed lifecycle mutations must return the original committed result without duplicate writes.",
    );
  });

  it("completes domain event/audit readiness only when every command, artifact, control, and evidence flag is present", () => {
    const completeEvidence = Object.fromEntries(domainEventAuditEvidenceFlags.map((flag) => [flag, true]));
    const decision = buildDomainEventAuditEvidenceDecision({
      commands: domainEventAuditRuntimeCommands,
      artifacts: domainEventAuditArtifactPaths,
      controls: domainEventAuditRuntimeControls,
      evidence: completeEvidence,
    });

    expect(decision.status).toBe("complete");
    expect(decision.missingCommands).toEqual([]);
    expect(decision.missingArtifacts).toEqual([]);
    expect(decision.missingControls).toEqual([]);
    expect(decision.missingEvidence).toEqual([]);
    expect(decision.requiredEvidence).toBe(domainEventAuditEvidenceFlags);
  });

  it("executes a local domain event/audit transaction contract with idempotency replay protection", async () => {
    const calls: string[] = [];
    let completedResult: unknown = null;
    const repository: Parameters<typeof executeDomainEventAuditLifecycleTransaction>[0] = {
      async $transaction<T>(callback) {
        return callback({
          idempotencyKey: {
            async findUnique() {
              calls.push("idempotencyKey.findUnique");
              return completedResult ? { result: completedResult } : null;
            },
            async create() {
              calls.push("idempotencyKey.create");
              return {};
            },
            async update(args: { data: { result: unknown } }) {
              calls.push("idempotencyKey.update");
              completedResult = args.data.result;
              return {};
            },
          },
          bookingRequest: {
            async update() {
              calls.push("bookingRequest.update");
              return {};
            },
          },
          bookingStateEvent: {
            async create() {
              calls.push("bookingStateEvent.create");
              return {};
            },
          },
          payment: {
            async update() {
              calls.push("payment.update");
              return {};
            },
          },
          paymentAuditLog: {
            async create() {
              calls.push("paymentAuditLog.create");
              return {};
            },
          },
          auditLog: {
            async create() {
              calls.push("auditLog.create");
              return {};
            },
          },
        });
      },
    };

    const committed = await executeDomainEventAuditLifecycleTransaction(repository, {
      kind: "booking",
      tenantId: "tenant_static",
      actorUserId: "user_static",
      subjectId: "booking_static",
      previousStatus: "submitted",
      nextStatus: "accepted",
      idempotencyKey: "domain-event:booking:accepted",
    });
    const replayed = await executeDomainEventAuditLifecycleTransaction(repository, {
      kind: "booking",
      tenantId: "tenant_static",
      actorUserId: "user_static",
      subjectId: "booking_static",
      previousStatus: "submitted",
      nextStatus: "accepted",
      idempotencyKey: "domain-event:booking:accepted",
    });

    expect(committed).toMatchObject({ status: "committed", kind: "booking", subjectId: "booking_static" });
    expect(replayed).toMatchObject({ status: "replayed", kind: "booking", subjectId: "booking_static" });
    expect(calls).toEqual([
      "idempotencyKey.findUnique",
      "idempotencyKey.create",
      "bookingRequest.update",
      "bookingStateEvent.create",
      "auditLog.create",
      "idempotencyKey.update",
      "idempotencyKey.findUnique",
    ]);
  });

  it("keeps domain event/audit execution classified, redacted, and transaction-gated", () => {
    const executionPlan = buildDomainEventAuditExecutionPlan();
    expect(executionPlan.localCommands).toBe(domainEventAuditLocalCommands);
    expect(executionPlan.externalCommands).toBe(domainEventAuditExternalCommands);
    expect(executionPlan.localArtifacts).toBe(domainEventAuditLocalArtifacts);
    expect(executionPlan.externalArtifacts).toBe(domainEventAuditExternalArtifacts);
    expect(executionPlan.localArtifacts).toContain("coverage/domain-event-payments-test.txt");
    expect(executionPlan.externalArtifacts).toContain("coverage/domain-event-prisma-transactions-redacted.json");
    expect(executionPlan.externalArtifacts).toContain("provider-backed DomainEventAuditRun persistence proof");
    expect(executionPlan.commandExecutionAllowed).toBe(false);
    expect(executionPlan.databaseExecutionAllowed).toBe(false);
    expect(executionPlan.providerRollbackExecutionAllowed).toBe(false);
    expect(executionPlan.ciExecutionAllowed).toBe(false);
    expect(executionPlan.providerPersistenceExecutionAllowed).toBe(false);
    expect(executionPlan.executionPolicy).toBe(domainEventAuditExecutionPolicy);
    expect(executionPlan.executionPolicy).toEqual({
      codexMayClassifyStaticDomainEventAuditReadiness: true,
      prismaTransactionEvidenceRequiredForClosure: true,
      idempotencyReplayEvidenceRequiredForClosure: true,
      providerDatabaseRequiredForPersistence: true,
      secretSafeArtifactsRequiredForClosure: true,
    });
    expect(executionPlan.requiredExternalEvidence).toBe(domainEventAuditRequiredExternalEvidence);
    expect(executionPlan.requiredExternalEvidence).toContain(
      "Provider-backed DomainEventAuditRun persistence row captured through persistDomainEventAuditRun.",
    );

    const artifact = {
      bookingRequestId: "booking_1234567890abcdefghijklmnopqrstuvwxyz",
      paymentId: "payment_1234567890abcdefghijklmnopqrstuvwxyz",
      providerPayload: "stripe_secret_payload",
      clientEmail: "client@example.com",
      nested: {
        databaseUrl: "postgres://inkroute:secret@db.example.com:5432/inkroute",
        auditLogId: "audit_1234567890abcdefghijklmnopqrstuvwxyz",
        publicSummary: "domain event audit evidence captured",
      },
    };
    const redactedOnly = buildRedactedDomainEventAuditArtifact(artifact);
    const review = buildDomainEventAuditArtifactReview(artifact);
    const serialized = JSON.stringify(review.artifact);

    expect(JSON.stringify(redactedOnly)).not.toContain("booking_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("payment_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain("stripe_secret_payload");
    expect(serialized).not.toContain("client@example.com");
    expect(serialized).not.toContain("postgres://inkroute:secret@db.example.com:5432/inkroute");
    expect(serialized).not.toContain("audit_1234567890abcdefghijklmnopqrstuvwxyz");
    expect(review.redactions).toEqual([
      "bookingRequestId",
      "paymentId",
      "providerPayload",
      "clientEmail",
      "nested.databaseUrl",
      "nested.auditLogId",
    ]);
    expect(review.safeForTracker).toBe(true);
    expect(review.requiredExternalEvidence).toBe(domainEventAuditRequiredExternalEvidence);
  });

  it("wires CI, manifest, tracker, and artifacts without claiming transaction evidence readiness", () => {
    expect(ciWorkflow).toContain("Run Phase 2 domain event audit runtime contracts");
    expect(ciWorkflow).toContain("domain-event-audit-runtime-static.test.ts");
    expect(ciWorkflow).toContain("domain-event-audit-runtime-artifacts");
    expect(ciWorkflow).toContain("coverage/domain-event-audit-runtime.json");
    expect(unitManifest).toContain("unit-web-domain-event-audit-runtime-static");
    expect(unitManifest).toContain("DomainEventAuditRun Prisma model and app row contract");
    expect(gapTracker).toContain("apps/web/lib/domainEventAuditRuntime.ts");
    expect(gapTracker).toContain("persistDomainEventAuditRun upsert seam");
    expect(gapTracker).toContain("GAP-024 is domain-event-audit-runtime-matrix wired with evidence classifier");
    expect(gapTracker).toContain("live Prisma transaction services, provider-backed persistDomainEventAuditRun execution, tenant-scoped repositories, booking/payment atomicity tests, BookingStateEvent/AuditLog/PaymentAuditLog persistence, idempotency persistence, replay original-result behavior, provider rollback integration, invalid-transition denial, cross-tenant denial, database evidence, CI evidence, and secret-safe artifacts remain open");
    expect(gapTracker).toContain("proof inventory");
    expect(gapTracker).toContain("buildDomainEventAuditExecutionPlan");
    expect(gapTracker).toContain("domainEventAuditExecutionPolicy");
    expect(gapTracker).toContain("domainEventAuditRequiredExternalEvidence");
    expect(gapTracker).toContain("buildRedactedDomainEventAuditArtifact");
    expect(gapTracker).toContain("buildDomainEventAuditArtifactReview");
  });

  it("pins current domain event audit proof files for GAP-024", () => {
    expect(domainEventAuditRuntimeProofFiles).toContain("packages/booking/package.json");
    expect(domainEventAuditRuntimeProofFiles).toContain("packages/payments/package.json");
    expect(domainEventAuditRuntimeProofFiles).toContain("apps/web/lib/domainEventAuditRuntime.ts");
    expect(domainEventAuditRuntimeProofFiles).toContain("apps/web/tests/domain-event-audit-runtime-static.test.ts");
    for (const proofFile of domainEventAuditRuntimeProofFiles) {
      expect(readRepoFile(proofFile).length).toBeGreaterThan(0);
    }
  });
});


